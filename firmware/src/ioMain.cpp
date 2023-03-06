#include "ioMain.hpp"

#include "hardware/panto.hpp"
#include "utils/framerateLimiter.hpp"
#include "utils/performanceMonitor.hpp"
#include "utils/serial.hpp"

FramerateLimiter sendLimiter = FramerateLimiter::fromFPS(60);
//todo copy limiter to physics physicsMain.cpp for SPI error logging

void ioSetup()
{
    ulTaskNotifyTake(true, portMAX_DELAY);
    delay(100); // TODO: patch: wait until pantoPhysics instantiates godobject (physicsMain);
}

void ioLoop()
{
    PERFMON_START("[a] Receive serial");
    DPSerial::receive(); // receive serial HERE
    // if MessageType is CREATE_OBSTACLE            then receiveCreateObstacle()            CREATE then ENABLE (also ADD_TO, REMOVE, ENABLE, DISABLE)
    //                                               ... pantoPhysics[i].godObject()->createObstacle(id, path, false);
    // if MessageType is CREATE_RAIL                then receiveCreateRail()
    //                                               ... pantoPhysics[i].godObject()->createRail(id, path, displacement);
    // if MessageType is CREATE_PASSABLE_OBSTACLE   then receiveCreatePassableObstacle()
    //                                               ... pantoPhysics[i].godObject()->createObstacle(id, path, true);
    // DO IT HERE TO TEST FIRMWARE WITHOUT UNITY (i = 0, 1)
    //
    // Questions: 
    //   what is CREATE, ADD_TO, REMOVE, ENABLE, DISABLE OBSTACLE?
    //   what is id? does it matter here
    //   how is force field implemented? PASSABLE_OBSTACLE?
    //
    // range of X: ([-180, 180])
    // range of Y: ([5, -205])
    
    /******************************************/
    // std::vector<vector2D> path{vector2D(-20, -100), vector2D(20, -100)};
    // uint16_t id = 8888;
    // pantoPhysics[0].godObject()->createObstacle(id, path, false);
    // pantoPhysics[0].godObject()->enableObstacle(id, true);
    /******************************************/
    auto connected = DPSerial::ensureConnection();
    PERFMON_STOP("[a] Receive serial");

    PERFMON_START("[b] Send positions");
    //DPSerial::sendDebugData();
    //DPSerial::sendInstantDebugLog("\n");
    if (connected && sendLimiter.step())
    {
        DPSerial::sendPosition();
    }
    PERFMON_STOP("[b] Send positions");
    
    PERFMON_START("[c] Send debug logs");
    if (connected)
    {
        DPSerial::processDebugLogQueue();
    }
    PERFMON_STOP("[c] Send debug logs");
}
