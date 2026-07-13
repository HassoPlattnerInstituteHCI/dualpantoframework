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
            // Do not tear down here. This runs on the worker thread, and
            // tearDown() -> stopWorker() -> s_worker.join() would join the worker
            // from within itself. Self-join throws std::system_error, which is
            // unhandled on the worker thread and calls std::terminate, taking the
            // whole host process down. Clear the end-of-file state and return; the
            // host reopens the port (Close + Open) on its own thread once it
            // notices the device stopped responding.
            std::cout << "Read end of file from serial." << std::endl;
            clearerr(s_handle);
        }
        else if (ferror(s_handle))
        {
            perror("Error while reading from serial");
            clearerr(s_handle);
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
