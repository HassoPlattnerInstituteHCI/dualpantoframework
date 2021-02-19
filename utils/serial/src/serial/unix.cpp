#include "serial.hpp"

#include <iostream>
#include <sys/ioctl.h>

uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
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
    ::write(s_handle, data, length);
}

bool DPSerial::setup(std::string path)
{
    s_path = path;
    int fd = open(path.c_str(), O_RDWR | O_NOCTTY);
    if (fd < 0)
    {
        return false;
    }
    struct termios tty;
    std::memset(&tty, 0, sizeof(tty));
    if (tcgetattr(fd, &tty) < 0)
    {
        return false;
    }
    const speed_t speed = c_baudRate;
    cfsetospeed(&tty, speed);
    cfsetispeed(&tty, speed);
    cfmakeraw(&tty);
    tty.c_cc[VMIN] = 0;
    tty.c_cc[VTIME] = 1;
    if (tcsetattr(fd, TCSANOW, &tty) < 0)
    {
        return false;
    }

    s_handle = fd;
    return true;
}
