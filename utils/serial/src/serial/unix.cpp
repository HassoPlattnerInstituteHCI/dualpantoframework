#include "serial.hpp"

#include <iostream>
#include <sys/ioctl.h>

uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
    uint32_t available = 0;
    if (ioctl(fileno(s_handle), FIONREAD, &available) < 0)
    {
        return 0;
    }
    return available;
}

void DPSerial::tearDown()
{
    stopWorker();
    fclose(s_handle);
}

bool DPSerial::readBytesFromSerial(void *target, uint32_t length)
{
    const uint32_t result = fread(target, 1, length, s_handle);
    const bool valid = result == length;
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
        else if (ferror(s_handle))
        {
            perror("Error while reading from serial");
        }
    }
    return valid;
}

void DPSerial::write(const uint8_t *const data, const uint32_t length)
{
    ::write(fileno(s_handle), data, length);
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
    s_handle = fdopen(fd, "rw");

    startWorker();
    return true;
}
