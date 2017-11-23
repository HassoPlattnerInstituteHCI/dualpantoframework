#include <node/node_api.h>

#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <errno.h>

int fd;
FILE* stream;
const char* packetStart = "SYNC";
unsigned char buffer[255];

napi_value nodeOpen(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    if(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");

    size_t length;
    char buffer[64];
    napi_get_value_string_utf8(env, argv[0], buffer, sizeof(buffer), &length);

    fd = open(buffer, O_RDWR | O_NOCTTY);
    if(fd < 0)
        napi_throw_error(env, NULL, "open failed");
    struct termios tty;
    memset(&tty, 0, sizeof(tty));
    if(tcgetattr(fd, &tty) < 0)
        napi_throw_error(env, NULL, "tcgetattr failed");
    // const int speed = B9600; // B115200
    // cfsetospeed(&tty, speed);
    // cfsetispeed(&tty, speed);
    tty.c_cflag = CS8 | CLOCAL | CREAD;
    tty.c_iflag = 0;
    tty.c_lflag = 0;
    tty.c_oflag = 0;
    tty.c_cc[VMIN]  = 0;
    tty.c_cc[VTIME] = 5;
    if(tcsetattr(fd, TCSANOW, &tty) < 0)
        napi_throw_error(env, NULL, "tcsetattr failed");
    stream = fdopen(fd, "rw");

    return NULL;
}

napi_value nodePoll(napi_env env, napi_callback_info info) {
    napi_value result, value;
    napi_create_array(env, &result);
    size_t packet = 0;

    while(true) {
        unsigned int available = 0;
        if(ioctl(fd, FIONREAD, &available) < 0)
            napi_throw_error(env, NULL, "ioctl failed");
        if(available < sizeof(buffer))
            break;

        unsigned int index = 0;
        while(index < strlen(packetStart)) {
            if(fgetc(stream) == packetStart[index])
                ++index;
            else
                index = 0;
        }

        unsigned char length = fgetc(stream), *underlyingBuffer;
        napi_create_buffer(env, length, (void**)&underlyingBuffer, &value);
        fread(underlyingBuffer, 1, length, stream);
        unsigned char checksum = fgetc(stream), calculatedChecksum = 0;
        for(unsigned int i = 0; i < length; ++i)
            calculatedChecksum ^= underlyingBuffer[i];
        if(calculatedChecksum == checksum)
            napi_set_element(env, result, packet++, value);
    }

    return result;
}

napi_value nodeSend(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    if(napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok)
        napi_throw_error(env, NULL, "Failed to parse arguments");

    unsigned char checksum = 0, *payload;
    size_t length;
    napi_get_buffer_info(env, argv[0], (void**)&payload, &length);
    memcpy(buffer, packetStart, 4);
    buffer[4] = length;
    memcpy(&buffer[5], payload, length);
    for(unsigned int i = 0; i < length; ++i)
        checksum ^= buffer[5+i];
    buffer[5+length] = checksum;
    write(fd, buffer, 6+length);

    return NULL;
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
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
