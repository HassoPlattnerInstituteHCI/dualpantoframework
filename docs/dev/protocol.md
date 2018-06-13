# Protocol
> Version: 1

The protocol used to communicate between a computer and the DualPanto consists of [COBS Encoding](https://en.wikipedia.org/wiki/Consistent_Overhead_Byte_Stuffing), a CRC-8 checksum and the commands described in this document.

The result of using COBS Encoding is that packages contain no NULL bytes and are terminated by a single NULL byte.

## Packet
```
    +--+--+--+--+--+--+--+--+
 00 |     COBS Overhead     |
    +--+--+--+--+--+--+--+--+
 01 |    CRC-8 Checksum     |
    +--+--+--+--+--+--+--+--+
 02 |        Command        |
    +--+--+--+--+--+--+--+--+
 03 |        Payload        |
    /                       /
    /                       /
    +--+--+--+--+--+--+--+--+
END |       COBS NULL       |
    +--+--+--+--+--+--+--+--+
```
Name | Description
-|-
COBS Overhead | The Overhead byte of the COBS encoding
CRC-8 Checksum | A CRC-8 checksum over all bytes after the checksum field (without the COBS NULL byte)
Command | A command identifier (see [commands](#commands))
Payload | The actual data (in a command specific format)
COBS NULL | The terminating null character (from COBS encoding)

## Commands
Each command consists of a short description and its payload definition (in a C like syntax).
### Computer &rarr; DualPanto
#### 0: GetConfig
Request to get the current configuration.
```c++
// protocol version (currently 1)
uint8_t version;
```

#### 1: Start
Start sending encoder values.
```c++
// interval of the updates
uint32_t interval;
```

#### 2: SetMotors
Set the motor power values.
```c++
// motor power values
int16_t motorPowers[numMotors];
```

### DualPanto &rarr; Computer
#### 0: Config
The current configuration.
```c++
// number of bits used for pwm operations
uint8_t pwmBits;

// number of motors
uint8_t numMotors;

// identifier of the device configuration
uint32_t configurationID;

// unique id of the device
uint8_t deviceIDLength;
uint8_t deviceID[deviceIDLength];

// max power setting of the motors
uint16_t maxPower[numMotors];
```

#### 1: EncoderValues
The current encoder values.
```c++
// time in ms since last EncoderValues message
uint32_t deltaTime;

// enocder positions (in steps) of all motors
int32_t encoderSteps[numMotors];
```
