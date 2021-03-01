#include "serial.hpp"

#include <iostream>
#include <sys/ioctl.h>

uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
    if (!s_handle)
        return 0;

    uint32_t available = 0;
    if (ioctl(fileno(s_handle), FIONREAD, &available) < 0)
    {
        std::cout << "nothing to read" << std::endl;
        return 0;
    }
    return available;
}

void DPSerial::tearDown()
{
    if (s_handle)
        fclose(s_handle);
}

bool DPSerial::readBytesFromSerial(void *target, uint32_t length)
{
    if (!s_handle)
        return false;

    const size_t num_read = fread(target, 1, length, s_handle);
    const bool valid = num_read == length;

    if (!valid)
    {
        if (feof(s_handle))
        {
            std::cout
                << "Read end of file from serial, trying to reconnect."
                << std::endl;
            tearDown();
            setup(s_path);
        }
        else
        {
            printf("Error while reading\n");
        }
        std::cout << "no valid read: " << num_read << " vs " << length << std::endl;
    }
    return valid;
}

void DPSerial::write(const uint8_t *const data, const uint32_t length)
{
    if (s_handle)
    {
        if (::write(fileno(s_handle), data, length) != length)
        {
            fprintf(stderr, "Not all data could be written\n");
        }
    }
}

bool DPSerial::setup(std::string path)
{
    s_path = path;
    int fd = open(path.c_str(), O_RDWR | O_NOCTTY | O_NDELAY);
    if (fd < 0)
    {
        return false;
    }

    struct termios tty;
    std::memset(&tty, 0, sizeof(tty));
    if (tcgetattr(fd, &tty) == 0)
    {
        // ioctl(hComm, TIOCEXCL);
        int flags = fcntl(fd, F_GETFL, 0);
        flags &= ~O_NDELAY;
        fcntl(fd, F_SETFL, flags);
    }
    else
    {
        fprintf(stderr, "Error %i from tcgetattr: %s\n", errno, strerror(errno));
        close(fd);
        return false;
    }

    // adapted from https://blog.mbedded.ninja/programming/operating-systems/linux/linux-serial-ports-using-c-cpp/#full-example-standard-baud-rates and https://github.com/java-native/jssc/blob/master/src/main/cpp/_nix_based/jssc.cpp

    // Set in/out baud rate
    const speed_t speed = B115200; // FIXME: doesn't work? c_baudRate;
    if (cfsetispeed(&tty, speed) < 0 || cfsetospeed(&tty, speed) < 0)
    {
        perror("Could not set baud rate");
        close(fd);
        return false;
    }

    tty.c_cflag &= ~CSTOPB; // Clear stop field, only one stop bit used in communication (most common)
    tty.c_cflag &= ~CSIZE;  // Clear all bits that set the data size
    tty.c_cflag |= CS8;     // 8 bits per byte (most common)

    tty.c_cflag |= (CREAD | CLOCAL);
    tty.c_cflag &= ~CRTSCTS;
    tty.c_lflag &= ~(ICANON | ECHO | ECHOE | ECHOK | ECHONL | ECHOCTL | ECHOPRT | ECHOKE | ISIG | IEXTEN);
    tty.c_iflag &= ~(IXON | IXOFF | IXANY | INPCK | IGNPAR | PARMRK | ISTRIP | IGNBRK | BRKINT | INLCR | IGNCR | ICRNL);
    tty.c_oflag &= ~OPOST;

    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 10;

    tty.c_cflag &= ~(PARENB | PARODD); //Clear parity settings

    if (tcsetattr(fd, TCSANOW, &tty) < 0)
    {
        fprintf(stderr, "Could not apply serial settings\n");
        return false;
    }

    int lineStatus;
    if (ioctl(fd, TIOCMGET, &lineStatus) >= 0)
    {
        if (true)
        {
            lineStatus |= TIOCM_RTS;
        }
        else
        {
            lineStatus &= ~TIOCM_RTS;
        }

        if (true)
        {
            lineStatus |= TIOCM_DTR;
        }
        else
        {
            lineStatus &= ~TIOCM_DTR;
        }

        if (ioctl(fd, TIOCMSET, &lineStatus) < 0)
        {
            fprintf(stderr, "Could not set serial line status\n");
            close(fd);
            return false;
        }
    }

    s_handle = fdopen(fd, "rw");
    return true;
}
