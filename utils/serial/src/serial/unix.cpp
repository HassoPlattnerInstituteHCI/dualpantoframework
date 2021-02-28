#include "serial.hpp"

#include <iostream>
#include <sys/ioctl.h>

uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
    if (!s_handle) {
        return 0;
    }

    uint32_t available = 0;
    if (ioctl(s_handle, FIONREAD, &available) < 0)
    {
        std::cout << "nothing to read" << std::endl;
        return 0;
    }
    return available;
}

void DPSerial::tearDown()
{
    close(s_handle);
}

bool DPSerial::readBytesFromSerial(void *target, uint32_t length)
{
    if (!s_handle) {
        return false;
    }

    ssize_t num_read = 0;
    do
    {
        ssize_t l = read(s_handle, ((uint8_t *)target) + num_read, length - num_read);
        if (l <= 0)
        {
            num_read = l;
            break;
        }
        num_read += l;
    } while (num_read < length);

    const bool valid = num_read == length;
    if (!valid)
    {
        if (num_read == 0)
        {
            std::cout
                << "Read end of file from serial, trying to reconnect."
                << std::endl;
            tearDown();
            setup(s_path);
        }
        else if (num_read == -1)
        {
            printf("Error while reading\n");
            exit(1);
        }
        std::cout << "no valid read: " << num_read << " vs " << length << std::endl;
    }
    return valid;
}

void DPSerial::write(const uint8_t *const data, const uint32_t length)
{
    if (s_handle) {
        ::write(s_handle, data, length);
    } else {
        fprintf(stderr, "trying to write to invalid socket\n");
    }
}


bool DPSerial::setup(std::string path)
{
    s_path = path;
    int fd = open(path.c_str(), O_RDWR | O_NOCTTY | O_NDELAY);
    if (fd < 0) {
        return false;
    }

    struct termios tty;
    std::memset(&tty, 0, sizeof(tty));
    if (tcgetattr(fd, &tty) == 0) {
        // ioctl(hComm, TIOCEXCL);
        int flags = fcntl(fd, F_GETFL, 0);
        flags &= ~O_NDELAY;
        fcntl(fd, F_SETFL, flags);
    } else {
        fprintf(stderr, "Error %i from tcgetattr: %s\n", errno, strerror(errno));
        close(fd);
        return false;
    }
#if 1
    // adapted from https://blog.mbedded.ninja/programming/operating-systems/linux/linux-serial-ports-using-c-cpp/#full-example-standard-baud-rates and https://github.com/java-native/jssc/blob/master/src/main/cpp/_nix_based/jssc.cpp

    // Set in/out baud rate
    const speed_t speed = c_baudRate;
    if (cfsetispeed(&tty, speed) < 0 || cfsetospeed(&tty, speed) < 0) {
        fprintf(stderr, "Could not set baud rate.");
        close(fd);
        return false;
    }

    tty.c_cflag &= ~CSTOPB; // Clear stop field, only one stop bit used in communication (most common)
    tty.c_cflag &= ~CSIZE; // Clear all bits that set the data size 
    tty.c_cflag |= CS8; // 8 bits per byte (most common)

    tty.c_cflag |= (CREAD | CLOCAL);
    tty.c_cflag &= ~CRTSCTS;
    tty.c_lflag &= ~(ICANON | ECHO | ECHOE | ECHOK | ECHONL | ECHOCTL | ECHOPRT | ECHOKE | ISIG | IEXTEN);
    tty.c_iflag &= ~(IXON | IXOFF | IXANY | INPCK | IGNPAR | PARMRK | ISTRIP | IGNBRK | BRKINT | INLCR | IGNCR| ICRNL);
    tty.c_oflag &= ~OPOST;

    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 0;

    tty.c_cflag &= ~(PARENB | PARODD);//Clear parity settings

    ///////////// OLD VERSION
#if 0
    tty.c_cflag &= ~PARENB; // Clear parity bit, disabling parity (most common)
    tty.c_cflag &= ~CRTSCTS; // Disable RTS/CTS hardware flow control (most common)
    tty.c_cflag |= CREAD | CLOCAL; // Turn on READ & ignore ctrl lines (CLOCAL = 1)

    tty.c_lflag &= ~ICANON;
    tty.c_lflag &= ~ECHO; // Disable echo
    tty.c_lflag &= ~ECHOE; // Disable erasure
    tty.c_lflag &= ~ECHONL; // Disable new-line echo
    tty.c_lflag &= ~ISIG; // Disable interpretation of INTR, QUIT and SUSP
    tty.c_iflag &= ~(IXON | IXOFF | IXANY); // Turn off s/w flow ctrl
    tty.c_iflag &= ~(IGNBRK|BRKINT|PARMRK|ISTRIP|INLCR|IGNCR|ICRNL); // Disable any special handling of received bytes

    tty.c_oflag &= ~OPOST; // Prevent special interpretation of output bytes (e.g. newline chars)
    tty.c_oflag &= ~ONLCR; // Prevent conversion of newline to carriage return/line feed
    // tty.c_oflag &= ~OXTABS; // Prevent conversion of tabs to spaces (NOT PRESENT ON LINUX)
    // tty.c_oflag &= ~ONOEOT; // Prevent removal of C-d chars (0x004) in output (NOT PRESENT ON LINUX)

    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 1;    // Wait for up to 1s (10 deciseconds), returning as soon as any data is received.
#endif

#else
    const speed_t speed = c_baudRate;
    cfsetospeed(&tty, speed);
    cfsetispeed(&tty, speed);
    cfmakeraw(&tty);
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 1;
#endif
    if (tcsetattr(fd, TCSANOW, &tty) < 0) {
        fprintf(stderr, "Could not apply serial settings\n");
        return false;
    }

    int lineStatus;
    if (ioctl(fd, TIOCMGET, &lineStatus) >= 0) {
        if (true){
            lineStatus |= TIOCM_RTS;
        } else {
            lineStatus &= ~TIOCM_RTS;
        }

        if (true){
            lineStatus |= TIOCM_DTR;
        } else {
            lineStatus &= ~TIOCM_DTR;
        }

        if (ioctl(fd, TIOCMSET, &lineStatus) < 0){
            fprintf(stderr, "Could not set serial line status\n");
        }
    }

    s_handle = fd;
    return true;
}
