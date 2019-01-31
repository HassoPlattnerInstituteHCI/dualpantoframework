#include "../../Protocol/protocol.hpp"

#include <string>

#ifndef NODE_GYP
#include <iostream>
#include <iomanip>
#endif

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#define WINDOWS
#include <Windows.h>
#define FILEHANDLE HANDLE
#else // POSIX : Linux, macOS
#include <cstring>
#include <sys/ioctl.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#define FILEHANDLE FILE *
#endif

class DPSerial : DPProtocol
{
  private:
    static uint8_t s_headerBuffer[c_headerSize];
    static Header s_header;
    static uint8_t s_packetBuffer[255];
    static FILEHANDLE s_handle;

    static uint32_t getAvailableByteCount(FILEHANDLE s_handle);
    static void tearDown();
    static bool readBytesFromSerial(void *target, uint32_t length);
    static void receivePacket();
    static void sendPacket();

  public:
    static bool setup(std::string path);
    static void terminate(int signal);

#ifndef NODE_GYP
    static void printPacket();
#endif
};

uint8_t DPSerial::s_headerBuffer[DPSerial::c_headerSize];
DPSerial::Header DPSerial::s_header = DPSerial::Header();
uint8_t DPSerial::s_packetBuffer[255];
FILEHANDLE DPSerial::s_handle;

// private

#ifdef WINDOWS
uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
    DWORD commerr;
    COMSTAT comstat;
    if (!ClearCommError(s_handle, &commerr, &comstat))
        return 0;
    return comstat.cbInQue;
}
#else
uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
    uint32_t available = 0;
    if (ioctl(fileno(s_handle), FIONREAD, &available) < 0)
        return 0;
    return available;
}
#endif

#ifdef WINDOWS
void DPSerial::tearDown()
{
    CloseHandle(s_handle);
}
#else
void DPSerial::tearDown()
{
    fclose(s_handle);
}
#endif

#ifdef WINDOWS
bool DPSerial::readBytesFromSerial(void *target, uint32_t length)
{
    DWORD bytesRead;
    ReadFile(s_handle, target, length, &bytesRead, NULL);
    return bytesRead == length;
}
#else
bool DPSerial::readBytesFromSerial(void *target, uint32_t length)
{
    return fread(target, 1, length, s_handle) == length;
}
#endif

void DPSerial::receivePacket()
{
    uint8_t received;
    uint32_t index = 0;

    while (index < c_magicNumberSize)
    {
        readBytesFromSerial(&received, 1);
        if (received == c_magicNumber[index])
            ++index;
        else
            index = 0;
    }

    readBytesFromSerial(s_headerBuffer, c_headerSize);

    s_header.MessageType = s_headerBuffer[0];
    s_header.PayloadSize = s_headerBuffer[1] << 24 | s_headerBuffer[2] << 16 | s_headerBuffer[3] << 8 | s_headerBuffer[4];

    readBytesFromSerial(s_packetBuffer, s_header.PayloadSize);
}

void DPSerial::sendPacket()
{
    s_headerBuffer[0] = s_header.MessageType;
    s_headerBuffer[1] = s_header.PayloadSize >> 24;
    s_headerBuffer[2] = (s_header.PayloadSize >> 16) & 255;
    s_headerBuffer[3] = (s_header.PayloadSize >> 8) & 255;
    s_headerBuffer[4] = s_header.PayloadSize & 255;

#ifdef WINDOWS
    DWORD bytesWritten = 0;
    WriteFile(s_handle, s_headerBuffer, c_headerSize, &bytesWritten, NULL);
    WriteFile(s_handle, s_packetBuffer, s_header.PayloadSize, &bytesWritten, NULL);
#else
    write(fileno(s_handle), s_headerBuffer, c_headerSize);
    write(fileno(s_handle), s_packetBuffer, s_header.PayloadSize);
#endif
}

// public

#ifdef WINDOWS
bool DPSerial::setup(std::string path)
{
    s_handle = CreateFile(path.c_str(), GENERIC_READ | GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
    if (s_handle == INVALID_HANDLE_VALUE)
        return false;

    DCB dcbSerialParams = {0};
    dcbSerialParams.DCBlength = sizeof(dcbSerialParams);
    if (!GetCommState(s_handle, &dcbSerialParams))
        return false;
    dcbSerialParams.BaudRate = CBR_115200;
    dcbSerialParams.ByteSize = 8;
    dcbSerialParams.StopBits = ONESTOPBIT;
    dcbSerialParams.Parity = NOPARITY;
    if (!SetCommState(s_handle, &dcbSerialParams))
        return false;

    COMMTIMEOUTS timeouts = {0};
    timeouts.ReadIntervalTimeout = 50;
    timeouts.ReadTotalTimeoutConstant = 50;
    timeouts.ReadTotalTimeoutMultiplier = 10;
    timeouts.WriteTotalTimeoutConstant = 50;
    timeouts.WriteTotalTimeoutMultiplier = 10;
    return SetCommTimeouts(s_handle, &timeouts) && SetCommMask(s_handle, EV_RXCHAR);
}
#else
bool DPSerial::setup(std::string path)
{
    int fd = open(path.c_str(), O_RDWR | O_NOCTTY);
    if (fd < 0)
        return false;
    struct termios tty;
    std::memset(&tty, 0, sizeof(tty));
    if (tcgetattr(fd, &tty) < 0)
        return false;
    const speed_t speed = B115200;
    cfsetospeed(&tty, speed);
    cfsetispeed(&tty, speed);
    cfmakeraw(&tty);
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 1;
    if (tcsetattr(fd, TCSANOW, &tty) < 0)
        return false;
    s_handle = fdopen(fd, "rw");
    return true;
}
#endif

// node

#ifdef NODE_GYP
#ifdef WINDOWS
#include <node_api.h>
#else
#include <node/node_api.h>
#endif

napi_value nodeOpen(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value argv[1];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");
    size_t length;
    char buffer[64];
    napi_get_value_string_utf8(env, argv[0], buffer, sizeof(buffer), &length);
    if (!setup(buffer))
        napi_throw_error(env, NULL, "open failed");
    napi_value result;
    napi_create_int64(env, s_handle, &result);
    return result;
}

napi_value nodeClose(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value argv[1];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");
    napi_get_value_int64(env, argv[0], &s_handle);
    tearDown();
    return NULL;
}

napi_value nodePoll(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value argv[1];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");
    napi_get_value_int64(env, argv[0], &s_handle);
    napi_value result, value;
    napi_create_array(env, &result);
    size_t packet = 0;
    while (getAvailableByteCount(s_handle))
    {
        unsigned char length = receivePacket(), *underlyingBuffer;
        if (length)
        {
            napi_create_buffer_copy(env, length, s_packetBuffer, (void **)&underlyingBuffer, &value);
            napi_set_element(env, result, packet++, value);
        }
    }
    return result;
}

napi_value nodeSend(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    napi_value argv[2];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");
    napi_get_value_int64(env, argv[0], &s_handle);
    unsigned char *payload;
    size_t length;
    napi_get_buffer_info(env, argv[1], (void **)&payload, &length);
    memcpy(&s_packetBuffer[5], payload, length);
    sendPacket(length);
    return NULL;
}

#define defFunc(name, ptr)                                             \
    if (napi_create_function(env, NULL, 0, ptr, NULL, &fn) != napi_ok) \
        napi_throw_error(env, NULL, "Unable to wrap native function"); \
    if (napi_set_named_property(env, exports, name, fn) != napi_ok)    \
        napi_throw_error(env, NULL, "Unable to populate exports");

napi_value Init(napi_env env, napi_value exports)
{
    napi_value fn;
    defFunc("open", nodeOpen);
    defFunc("close", nodeClose);
    defFunc("poll", nodePoll);
    defFunc("send", nodeSend);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)

#else
#include <signal.h>

void DPSerial::terminate(int signal)
{
    tearDown();
    exit(0);
}

void DPSerial::printPacket()
{
    DPSerial::receivePacket();
    for (auto i = 0; i < c_headerSize; ++i)
    {
        std::cout << std::setw(2) << (int)s_headerBuffer[i] << " ";
    }
    std::cout << "| ";
    for (auto i = 0; i < s_header.PayloadSize; ++i)
    {
        std::cout << std::setw(2) << (int)s_packetBuffer[i] << " ";
    }
    std::cout << std::endl;
}

int main(int argc, char **argv)
{
    if (argc != 2)
    {
        fprintf(stderr, "Expected /dev/serialport\n");
        return -1;
    }
    if (!DPSerial::setup(argv[1]))
    {
        fprintf(stderr, "Could not open %s\n", argv[1]);
        return -2;
    }
    signal(SIGINT, &(DPSerial::terminate));

    // cin/cout to hex mode
    std::cout << std::hex << std::uppercase << std::setfill('0');

    while (true)
    {
        DPSerial::printPacket();
    }

    return 0;
}

#endif
