#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <sys/ioctl.h>
#include <errno.h>

int main(int argc, char** argv) {
    if(argc != 2) {
        printf("error expected /dev/serialport\n");
        return -1;
    }
    int fd = open(argv[1], O_RDWR | O_NOCTTY);
    if(fd < 0) {
        printf("error %s opening %s\n", strerror(errno), argv[1]);
        return -1;
    }
    struct termios tty;
    memset(&tty, 0, sizeof(tty));
    if(tcgetattr(fd, &tty) < 0) {
        printf("error %s from tcgetattr\n", strerror(errno));
        return -1;
    }
    // const int speed = B9600; // B115200
    // cfsetospeed(&tty, speed);
    // cfsetispeed(&tty, speed);
    tty.c_cflag = CS8 | CLOCAL | CREAD;
    tty.c_iflag = 0;
    tty.c_lflag = 0;
    tty.c_oflag = 0;
    tty.c_cc[VMIN]  = 0;
    tty.c_cc[VTIME] = 5;
    if(tcsetattr(fd, TCSANOW, &tty) < 0) {
        printf("error %d from tcsetattr\n", errno);
        return -1;
    }
    FILE* stream = fdopen(fd, "rw");
    fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK);

    const char* packetStart = "SYNC";
    unsigned char packetBuffer[255+6];
    char lineBuffer[255*3];
    while(1) {
        int lineLength = fread(lineBuffer, 1, sizeof(lineBuffer), stdin);
        if(lineLength > 0) {
            unsigned char packetLength = lineLength/3;
            for(unsigned int byte, i = 0; i < packetLength; ++i) {
                sscanf(&lineBuffer[i*3], "%02X", &byte);
                packetBuffer[5+i] = byte;
            }
            memcpy(packetBuffer, packetStart, 4);
            packetBuffer[4] = packetLength;
            unsigned char packetChecksum = 0;
            for(unsigned int i = 0; i < packetLength; ++i)
                packetChecksum ^= packetBuffer[5+i];
            packetBuffer[5+packetLength] = packetChecksum;
            write(fd, packetBuffer, 6+packetLength);
        }

        unsigned int available = 0;
        if(ioctl(fd, FIONREAD, &available) < 0) {
            printf("error %s from ioctl\n", strerror(errno));
            return -1;
        }
        if(available < sizeof(packetBuffer))
            continue;
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
        if(calculatedChecksum != packetChecksum)
            continue;
        for(unsigned int i = 0; i < packetLength; ++i)
            printf("%02X ", packetBuffer[i]);
        printf("\n");
        fflush(stdout);
    }

    fclose(stream);
    return 0;
}
