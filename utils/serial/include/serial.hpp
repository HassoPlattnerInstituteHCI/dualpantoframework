#pragma once

#include <chrono>
#include <string>
#include <queue>
#include <thread>

#include <protocol/header.hpp>
#include <protocol/messageType.hpp>
#include <protocol/protocol.hpp>

#include "packet.hpp"

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32)
#include <Windows.h>
#define FILEHANDLE HANDLE
#else
#include <cstring>
#include <sys/ioctl.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#define FILEHANDLE FILE *
#endif

enum ReceiveState
{
    NONE = 0,
    FOUND_MAGIC = 1,
    FOUND_HEADER = 2
};

class DPSerial : public DPProtocol
{
protected:
    static std::string s_path;
    static const uint32_t c_packetSize = 0xFF;
    static FILEHANDLE s_handle;
    static std::thread s_worker;
    static bool s_workerRunning;

    static std::queue<Packet> s_highPrioSendQueue;
    static std::queue<Packet> s_lowPrioSendQueue;
    static std::queue<Packet> s_receiveQueue;

    static uint8_t s_nextTrackedPacketId;
    static bool s_haveUnacknowledgedTrackedPacket;
    static Packet s_lastTrackedPacket;
    static std::chrono::time_point<std::chrono::steady_clock>
        s_lastTrackedPacketSendTime;
    static const std::chrono::milliseconds c_trackedPacketTimeout;
    static bool s_pantoReportedInvalidData;

    static bool s_pantoReady;
    static uint32_t s_magicReceiveIndex;
    static ReceiveState s_receiveState;
    static Header s_receiveHeader;

    static void startWorker();
    static void stopWorker();
    static void tearDown();
    static void reset();
    static void update();
    static void processOutput();
    static bool processInput();

    static bool isTracked(uint8_t t);
    static bool checkQueue(std::queue<Packet> &q);
    static void sendPacket(Packet p);
    static void sendInstantPacket(Packet p);
    static void write(const uint8_t *const data, const uint32_t length);

    static uint32_t getAvailableByteCount(FILEHANDLE s_handle);
    static bool readBytesFromSerial(void *target, uint32_t length);
    static bool readBytesIfAvailable(void *target, uint32_t length);
    static bool readMagicNumber();
    static bool readHeader();
    static bool readPayload();

public:
    static bool setup(std::string path);
};
