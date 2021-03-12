#include "serial.hpp"

uint32_t DPSerial::getAvailableByteCount(FILEHANDLE s_handle)
{
    DWORD commerr;
    COMSTAT comstat;
    if (!ClearCommError(s_handle, &commerr, &comstat))
    {
        return 0;
    }
    return comstat.cbInQue;
}

void DPSerial::tearDown()
{
    stopWorker();
    CloseHandle(s_handle);
}

bool DPSerial::readBytesFromSerial(void *target, uint32_t length)
{
    DWORD bytesRead;
    ReadFile(s_handle, target, length, &bytesRead, NULL);
    return bytesRead == length;
}

void DPSerial::write(const uint8_t *const data, const uint32_t length)
{
    DWORD bytesWritten = 0;
    WriteFile(s_handle, data, length, &bytesWritten, NULL);
}

bool DPSerial::setup(std::string path)
{
    s_path = path;
    s_handle = CreateFileA(path.c_str(), GENERIC_READ | GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
    if (s_handle == INVALID_HANDLE_VALUE)
    {
        return false;
    }

    DCB dcbSerialParams = {0};
    dcbSerialParams.DCBlength = sizeof(dcbSerialParams);
    if (!GetCommState(s_handle, &dcbSerialParams))
    {
        return false;
    }
    dcbSerialParams.BaudRate = c_baudRate;
    dcbSerialParams.ByteSize = 8;
    dcbSerialParams.StopBits = ONESTOPBIT;
    dcbSerialParams.Parity = NOPARITY;
    if (!SetCommState(s_handle, &dcbSerialParams))
    {
        return false;
    }

    COMMTIMEOUTS timeouts = {0};
    timeouts.ReadIntervalTimeout = 50;
    timeouts.ReadTotalTimeoutConstant = 50;
    timeouts.ReadTotalTimeoutMultiplier = 10;
    timeouts.WriteTotalTimeoutConstant = 50;
    timeouts.WriteTotalTimeoutMultiplier = 10;
    if (!SetCommTimeouts(s_handle, &timeouts) ||
        !SetCommMask(s_handle, EV_RXCHAR))
    {
        return false;
    }

    startWorker();
    return true;
}