# Serial Communication Protocol - Revision 5

All messages contain a [header](#header) and an optional [payload](#payload).

## Serial Transmission Configuration

### Baud Rate

The transmission uses a baud rate of 115200.

### Packet Size

The maximum packet size is 261 bytes, with 5 bytes being used for the header and 256 bytes for the payload. This limit for the payload size was chosen to avoid blocking the transmission for too long.

## Header

The header consists of a [magic number](#magic-number), the [message type](#message-type) and the [payload size](#payload-size).

### Magic Number

All messages start with the magic bytes 0x44 0x50 (DP).

### Message Type

The next byte specifies the type of the following messages. Values from 0x00 to 0x7F are used for messages from the hardware to the framework, while values from 0x80 to 0xFF are used for messages from the framework to the hardware.

The available values for messages from the hardware to the framework are:

- 0x00 to 0x0F - Administration messages
  - [0x00 Sync](#0x00-Sync) - The hardware tells the framework that it is a dualpanto devices and wants to connect.
  - [0x01 Heartbeat](#0x01-Heartbeat) - Need to be send regularly to avoid being disconnected for inactivity.
- 0x10 to 0x1F - Data messages
  - [0x10 Position](#0x10-Position) - This message contains the current positions of the handles, as well as the god objects' positions.
- 0x20 to 0x2F - Auxiliary messages
  - [0x20 Debug log](#0x20-Debug-log) - This message contains a user-defined string that is meant as a debug log.

The available values for messages from the framework to the hardware are:

- 0x80 to 0x8F - Administration messages
  - [0x80 Sync Ack](#0x80-Sync-Ack) - The framework acknowledges the connection.
  - [0x81 Heartbeat Ack](#0x81-Heartbeat-Ack) - The framework acknowledges the heartbeat.
- 0x90 to 0xAF - Data messages
  - [0x90 Motor](#0x90-Motor) - This message contains a motor movement.
  - [0x91 PID values](#0x91-PID-values) - This message contains PID values for one 
  - [0xA0 Create obstacle](#0xA0-Create-obstacle) - This message specifies an obstacle to be added to one or both handles. Note: The obstacle isn't enabled automatically after creation. An enable message is required to enable it.
  - [0xA1 Add to obstacle](#0xA1-Add-to-obstacle) - This message specifies positions to be appended to an obstacle.
  - [0xA2 Remove obstacle](#0xA2-Remove-obstacle) - This message specifies an obstacle to remove.
  - [0xA3 Enable obstacle](#0xA3-Enable-obstacle) - This message specifies an obstacle to enable.
  - [0xA4 Disable obstacle](#0xA4-Disable-obstacle) - This message specifies an obstacle to disable.
- 0xC0 to 0xCF - Debug tools
    [0xC0 Dump hashtable](#0xC0-Dump-hashtable) - Request a dump of the physics' hashtable.

### Payload Size

The payload size is encoded as a 16 bit unsigned integer. It may be zero if the message doesn't contain a payload.

Note: The maximum allowed payload size is 256. This is limited by the ESP32's queue length.

## Payload

The content of the payload is based on the message type.

### 0x00 Sync

The message only contains the protocol revision, encoded as a 32 bit unsigned integer.

Example message for protocol revision 0:
```
4450     // magic number
00       // message type: sync
0004     // payload lenght: 32 bit integer is 4 bytes long
00000000 // protocol revision 0
```

### 0x01 Heartbeat

This message type does not require a payload.

Example message:
```
4450     // magic number
01       // message type: heartbeat
0000     // payload lenght: no payload
```

### 0x10 Position

The message contains - in this order - the x position, the y position and the rotation of a handle, each encoded as a 32 bit float, followed by the x and y position of the god object. This is repeated for each handle.

Example message for two handles:
```
4450     // magic number
10       // message type: position
0028     // payload lenght: 2 handles, 5 values each, 4 bytes each - 2*5*4 = 40 = 0x28
FFFFFFFF // x position of first handle
FFFFFFFF // y position of first handle
FFFFFFFF // rotation of first handle
FFFFFFFF // x position of first handle's god object
FFFFFFFF // y position of first handle's god object
FFFFFFFF // x position of second handle
FFFFFFFF // y position of second handle
FFFFFFFF // rotation of second handle
FFFFFFFF // x position of second handle's god object
FFFFFFFF // y position of second handle's god object
```

### 0x20 Debug log

This message contains a custom ASCII-encoded debug string.

Example message with text "HELP ME!":
```
4450     // magic number
20       // message type: debug log
0008     // payload lenght: string contains 8 bytes
48       // H
45       // E
4C       // L
50       // P
20       // [space]
4D       // M
45       // E
21       // !
```

### 0x80 Sync Ack

This message type does not require a payload.

Example message:
```
4450     // magic number
80       // message type: sync acknowledgement
0000     // payload lenght: no payload
```

### 0x81 Heartbeat Ack

This message type does not require a payload.

Example message:
```
4450     // magic number
81       // message type: heartbeat acknowledgement
0000     // payload lenght: no payload
```

### 0x90 Motor

This message contains the control method and pantograph index, both encoded as a 8 bit unsigned integer, followed by the target position data (x, y, rotation), each encoded as a 32 bit float.

Available control method values:

- 0x00 Position
- 0x01 Force rendering

Example message for setting the it handle position:
```
4450     // magic number
90       // message type: motor
000E     // payload lenght: 1 byte for control method, 1 for index, 3*4 for target position
00       // control method: 0x00 for position mode
01       // panto index: 0x01 for it handle
FFFFFFFF // target x position
FFFFFFFF // target y position
FFFFFFFF // target rotation
```

### 0x91 PID values

This message contains the motor index encoded as an 8 bit unsigned integer, followed by the P, I and D values, each encoded as 32 bit float.

The motor indices are counted as follows:

- 0x00 first pantograph, left motor
- 0x01 first pantograph, right motor
- 0x02 first pantograph, rotation motor
- 0x03 second pantograph, left motor
- ...

Example message for tuning the second pantograph's rotation motor:
```
4450     // magic number
91       // message type: PID values
000D     // payload lenght: 1 byte for index, 3*4 for values
05       // motor index: 0x05 for second pantograph, rotation motor
FFFFFFFF // P value
FFFFFFFF // I value
FFFFFFFF // D value
```

### 0xA0 Create obstacle

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the obstacle ID, encoded as a 16 bit unsigned integer, and multiple 2D vectors, each encoded as a pair of 32 bit floats.

Setting the pantograph index to 0xFF creates the obstacle for both handles.

Example message for adding an obstacle to both handles:
```
4450     // magic number
A0       // message type: Create obstacle
0013     // payload lenght: 1 byte for index, 2 for ID, 4*4 for values
FF       // pantograph index - both handles
0023     // obstacle ID
FFFFFFFF // first vector, x
FFFFFFFF // first vector, y
FFFFFFFF // second vector, x
FFFFFFFF // second vector, y
```

### 0xA1 Add to obstacle

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the obstacle ID, encoded as a 16 bit unsigned integer, and multiple 2D vectors, each encoded as a pair of 32 bit floats.

Setting the pantograph index to 0xFF adds the positions to the obstacle for both handles.

Example message for adding positions to an obstacle for both handles:
```
4450     // magic number
A1       // message type: Add to obstacle
0013     // payload lenght: 1 byte for index, 2 for ID, 4*4 for values
FF       // pantograph index - both handles
0023     // obstacle ID
FFFFFFFF // first additional vector, x
FFFFFFFF // first additional vector, y
FFFFFFFF // second additional vector, x
FFFFFFFF // second additional vector, y
```

### 0xA2 Remove obstacle

This message contains the pantograph index, encoded as an 8 bit unsigned integer, and the obstacle ID, encoded as a 16 bit unsigned integer.

Setting the pantograph index to 0xFF removes the obstacle for both handles.

Example message for removing an obstacle from both handles:
```
4450     // magic number
A2       // message type: Remove obstacle
0003     // payload lenght: 1 byte for index, 2 for ID
FF       // pantograph index - both handles
0023     // obstacle ID
```

### 0xA3 Enable obstacle

This message contains the pantograph index, encoded as an 8 bit unsigned integer, and the obstacle ID, encoded as a 16 bit unsigned integer.

Setting the pantograph index to 0xFF enables the obstacle for both handles.

Example message for enabling an obstacle for both handles:
```
4450     // magic number
A3       // message type: Enable obstacle
0003     // payload lenght: 1 byte for index, 2 for ID
FF       // pantograph index - both handles
0023     // obstacle ID
```

### 0xA4 Disable obstacle

This message contains the pantograph index, encoded as an 8 bit unsigned integer, and the obstacle ID, encoded as a 16 bit unsigned integer.

Setting the pantograph index to 0xFF disables the obstacle for both handles.

Example message for disables an obstacle for both handles:
```
4450     // magic number
A4       // message type: Disable obstacle
0003     // payload lenght: 1 byte for index, 2 for ID
FF       // pantograph index - both handles
0023     // obstacle ID
```

### 0xA5 Calibrate panto

Example message for sending calibration request:
```
4450     // magic number
A5       // message type: Calibrate panto
0000     // payload lenght: 0
```

### 0xC0 Dump hashtable

This message contains the pantograph index, encoded as an 8 bit unsigned integer.

Setting the pantograph index to 0xFF dumps the hashtable for both handles.

Example message for dumping the hashtable for both handles:
```
4450     // magic number
C0       // message type: Dump hashtable
0001     // payload lenght: 1 byte for index
FF       // pantograph index - both handles
```
