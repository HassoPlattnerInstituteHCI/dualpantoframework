#include <stdio.h>
#include <stdbool.h>

const char* packetStart = "SYNC";
unsigned char packetBuffer[255+6];
char lineBuffer[255*3];

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#define WINDOWS
#define STDIN STD_INPUT_HANDLE
#include <Windows.h>

HANDLE serialStream;

bool setup(const char* path) {
	serialStream = CreateFile(path, GENERIC_READ | GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
	if(serialStream == INVALID_HANDLE_VALUE)
		return false;

	DCB dcbSerialParams = { 0 };
	dcbSerialParams.DCBlength = sizeof(dcbSerialParams);
	if(!GetCommState(serialStream, &dcbSerialParams))
		return false;
	dcbSerialParams.BaudRate = CBR_115200;
	dcbSerialParams.ByteSize = 8;
	dcbSerialParams.StopBits = ONESTOPBIT;
	dcbSerialParams.Parity = NOPARITY;
	if(!SetCommState(serialStream, &dcbSerialParams))
		return false;

	COMMTIMEOUTS timeouts = { 0 };
	timeouts.ReadIntervalTimeout         = 50;
	timeouts.ReadTotalTimeoutConstant    = 50;
	timeouts.ReadTotalTimeoutMultiplier  = 10;
	timeouts.WriteTotalTimeoutConstant   = 50;
	timeouts.WriteTotalTimeoutMultiplier = 10;
    return SetCommTimeouts(serialStream, &timeouts) && SetCommMask(serialStream, EV_RXCHAR);
}

#else // POSIX : Linux, macOS
#define STDIN 0
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <errno.h>
#include <stdlib.h>

int serialFd;
FILE* serialStream;

bool setup(const char* path) {
    serialFd = open(path, O_RDWR | O_NOCTTY);
    if(serialFd < 0)
        return false;
    struct termios tty;
    memset(&tty, 0, sizeof(tty));
    if(tcgetattr(serialFd, &tty) < 0)
        return false;
    const speed_t speed = B115200;
    cfsetospeed(&tty, speed);
    cfsetispeed(&tty, speed);
    cfmakeraw(&tty);
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 1;
    if(tcsetattr(serialFd, TCSANOW, &tty) < 0)
        return false;
    serialStream = fdopen(serialFd, "rw");
    return true;
}
#endif

unsigned int getAvailableByteCount(int fd) {
    #ifdef WINDOWS
    /*
    INPUT_RECORD inputRecords[50];
    DWORD available = 0;
    if(!PeekConsoleInput(GetStdHandle(fd), inputRecords, sizeof(inputRecords)/sizeof(INPUT_RECORD), &available))
        return 0;
    return available;
    */
    DWORD commerr;
    COMSTAT comstat;
    if(!ClearCommError(GetStdHandle(fd), &commerr, &comstat))
        return 0;
    return comstat.cbInQue;
    #else
    size_t available = 0;
    if(ioctl(fd, FIONREAD, &available) < 0)
        return 0;
    return available;
    #endif
}

#ifdef WINDOWS
#define readBytesFromSerial(target, len) \
    ReadFile(serialStream, target, len, &bytesRead, NULL); \
    if(bytesRead != len) \
        return 0;
#else
#define readBytesFromSerial(target, len) \
    if(fread(target, 1, len, serialStream) != len) \
        return 0;
#endif

unsigned char receivePacket() {
    unsigned char received, packetLength, packetChecksum;
    unsigned int index = 0;
    #ifdef WINDOWS
    DWORD bytesRead;
    #endif

    while(index < strlen(packetStart)) {
        readBytesFromSerial(&received, 1);
        if(received == packetStart[index])
            ++index;
        else
            index = 0;
    }
    readBytesFromSerial(&packetLength, 1);
    readBytesFromSerial(packetBuffer, packetLength);
    readBytesFromSerial(&packetChecksum, 1);

    unsigned char calculatedChecksum = 0;
    for(unsigned int i = 0; i < packetLength; ++i)
        calculatedChecksum ^= packetBuffer[i];
    return (calculatedChecksum == packetChecksum) ? packetLength : 0;
}

void sendPacket(unsigned char packetLength) {
    memcpy(packetBuffer, packetStart, 4);
    packetBuffer[4] = packetLength;
    unsigned char packetChecksum = 0;
    for(unsigned int i = 0; i < packetLength; ++i)
        packetChecksum ^= packetBuffer[5+i];
    packetBuffer[5+packetLength] = packetChecksum;

    #ifdef WINDOWS
	DWORD bytesWritten = 0;
	WriteFile(serialStream, packetBuffer, 6+packetLength, &bytesWritten, NULL);
    #else
    write(serialFd, packetBuffer, 6+packetLength);
    #endif
}

#ifdef NODE_GYP
#ifdef WINDOWS
#include <node_api.h>
#else
#include <node/node_api.h>
#endif

napi_value nodeOpen(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    if(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");
    size_t length;
    char buffer[64];
    napi_get_value_string_utf8(env, argv[0], buffer, sizeof(buffer), &length);
    if(!setup(buffer))
        napi_throw_error(env, NULL, "open failed");
    return NULL;
}

napi_value nodePoll(napi_env env, napi_callback_info info) {
    napi_value result, value;
    napi_create_array(env, &result);
    size_t packet = 0;
    while(true) {
        unsigned char length = receivePacket(), *underlyingBuffer;
        if(length == 0)
            break;
        napi_create_buffer_copy(env, length, packetBuffer, (void**)&underlyingBuffer, &value);
        napi_set_element(env, result, packet++, value);
    }
    return result;
}

napi_value nodeSend(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    if(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");
    unsigned char *payload;
    size_t length;
    napi_get_buffer_info(env, argv[0], (void**)&payload, &length);
    memcpy(&packetBuffer[5], payload, length);
    sendPacket(length);
    return NULL;
}

napi_value nodeTest(napi_env env, napi_callback_info info) {
    printf("node test executing...\n");
    // TODO do something meaningful here...
    printf("test succeeded! :P \n");
    return 0;
}

#define defFunc(name, ptr) \
if(napi_create_function(env, NULL, 0, ptr, NULL, &fn) != napi_ok) \
    napi_throw_error(env, NULL, "Unable to wrap native function"); \
if(napi_set_named_property(env, exports, name, fn) != napi_ok) \
    napi_throw_error(env, NULL, "Unable to populate exports");

napi_value Init(napi_env env, napi_value exports) {
    napi_value fn;
    defFunc("open", nodeOpen);
    defFunc("poll", nodePoll);
    defFunc("send", nodeSend);
    defFunc("test", nodeTest);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)

#else
#include <signal.h>

void terminate(int signal) {
    #ifdef WINDOWS
    CloseHandle(serialStream);
    #else
    fclose(serialStream);
    #endif
    exit(0);
}

int main(int argc, char** argv) {
    if(argc != 2) {
        fprintf(stderr, "Expected /dev/serialport\n");
        return -1;
    }
    if(!setup(argv[1])) {
        fprintf(stderr, "Could not open %s\n", argv[1]);
        return -2;
    }
    signal(SIGINT, &terminate);
	/*#ifndef WINDOWS
    fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK);
	#endif*/

    unsigned char packetLength;
    while(true) {
		bool shouldRead = (getAvailableByteCount(STDIN) > 0);

        if(shouldRead && fgets(lineBuffer, sizeof(lineBuffer), stdin)) {
            packetLength = strlen(lineBuffer)/3;
            for(unsigned int byte, i = 0; i < packetLength; ++i) {
                sscanf(&lineBuffer[i*3], "%02X", &byte);
                packetBuffer[5+i] = byte;
            }
            sendPacket(packetLength);
        }

        packetLength = receivePacket();
        if(packetLength > 0) {
            for(unsigned int i = 0; i < packetLength; ++i)
                printf("%02X ", packetBuffer[i]);
            printf("\n");
            fflush(stdout);
        }
    }

    return 0;
}

#endif
