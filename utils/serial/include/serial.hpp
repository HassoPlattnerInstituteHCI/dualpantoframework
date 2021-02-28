#pragma once

#include <string>
#include <queue>

#include <protocol/header.hpp>
#include <protocol/messageType.hpp>
#include <protocol/protocol.hpp>

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32)
#include <Windows.h>
#define FILEHANDLE HANDLE
#else
#include <cstring>
#include <sys/ioctl.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#define FILEHANDLE int
#endif

#define TRACE 1
#define TRACE_FILENAME "trace.bin"

class QueuedPacket
{
public:
    Header header;
    uint8_t payload[255];
};

class DPSerial : public DPProtocol
{
protected:
#if TRACE
    static void recordPacket();
#endif
    static std::string s_path;
    static uint8_t s_headerBuffer[c_headerSize];
    static Header s_header;
    static const uint32_t c_packetSize = 0xFF;
    static uint8_t s_packetBuffer[c_packetSize];
    static FILEHANDLE s_handle;
    static void tearDown();
    static std::queue<QueuedPacket> queued_packets;

    static void receivePacket();

    static void write(const uint8_t *const data, const uint32_t length);

    static uint32_t getAvailableByteCount(FILEHANDLE s_handle);
    static bool readBytesFromSerial(void *target, uint32_t length);
    static void sendPacket();
    static void sendInstantPacket();
    static uint32_t checkSendQueue(uint32_t maxPackets);
    static void sendQueuedPacket(QueuedPacket &packet);
    static void reset();

    static uint8_t receiveUInt8(uint16_t &offset);
    static int16_t receiveInt16(uint16_t &offset);
    static uint16_t receiveUInt16(uint16_t &offset);
    static int32_t receiveInt32(uint16_t &offset);
    static uint32_t receiveUInt32(uint16_t &offset);
    static float receiveFloat(uint16_t &offset);

    static void sendUInt8(uint8_t value, uint16_t &offset);
    static void sendInt16(int16_t value, uint16_t &offset);
    static void sendUInt16(uint16_t value, uint16_t &offset);
    static void sendInt32(int32_t value, uint16_t &offset);
    static void sendUInt32(uint32_t value, uint16_t &offset);
    static void sendFloat(float value, uint16_t &offset);

public:
    static bool setup(std::string path);

    static void dumpBuffers();
    static void dumpBuffersToFile();
};
