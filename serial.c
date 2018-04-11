#include <string.h>
#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <errno.h>

int fd;
FILE* stream;
const char* packetStart = "SYNC";
unsigned char packetBuffer[255+6];

bool setup(const char* path) {
    fd = open(path, O_RDWR | O_NOCTTY);
    if(fd < 0)
        return false;
    struct termios tty;
    memset(&tty, 0, sizeof(tty));
    if(tcgetattr(fd, &tty) < 0)
        return false;
    const speed_t speed = B115200;
    cfsetospeed(&tty, speed);
    cfsetispeed(&tty, speed);
    cfmakeraw(&tty);
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 0;
    if(tcsetattr(fd, TCSANOW, &tty) < 0)
        return false;
    stream = fdopen(fd, "rw");
    return true;
}

unsigned char receive() {
    unsigned int available = 0;
    if(ioctl(fd, FIONREAD, &available) < 0)
        return 0;
    if(available < sizeof(packetBuffer))
        return 0;
    unsigned int index = 0;
    while(index < strlen(packetStart)) {
        if(fgetc(stream) == packetStart[index])
            ++index;
        else
            index = 0;
    }
    unsigned char packetLength = fgetc(stream);
    fread(packetBuffer, 1, packetLength, stream);
    unsigned char packetChecksum = fgetc(stream), calculatedChecksum = 0;
    for(unsigned int i = 0; i < packetLength; ++i)
        calculatedChecksum ^= packetBuffer[i];
    return (calculatedChecksum == packetChecksum) ? packetLength : 0;
}

void send(unsigned char packetLength) {
    memcpy(packetBuffer, packetStart, 4);
    packetBuffer[4] = packetLength;
    unsigned char packetChecksum = 0;
    for(unsigned int i = 0; i < packetLength; ++i)
        packetChecksum ^= packetBuffer[5+i];
    packetBuffer[5+packetLength] = packetChecksum;
    write(fd, packetBuffer, 6+packetLength);
}


#ifdef NODE_GYP
#include <node/node_api.h>

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
        unsigned char length = receive(), *underlyingBuffer;
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
    send(length);
    return NULL;
}

napi_value nodeTest(napi_env env, napi_callback_info info){
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
#include <stdlib.h>

void terminate(int signal) {
    fclose(stream);
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
    fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK);

    char lineBuffer[255*3];
    unsigned char packetLength;
    while(true) {
        if(fgets(lineBuffer, sizeof(lineBuffer), stdin)) {
            packetLength = strlen(lineBuffer)/3;
            for(unsigned int byte, i = 0; i < packetLength; ++i) {
                sscanf(&lineBuffer[i*3], "%02X", &byte);
                packetBuffer[5+i] = byte;
            }
            send(packetLength);
        }

        packetLength = receive();
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
