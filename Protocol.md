# Serial Communication Protocol - Revision 0

All messages contain a header and an optional payload.

## Header

The header consists of a magic number, the message type and the payload size.

### Magic Number

All messages start with the magic bytes 0x44 0x50 (DP).

### Message Type

The next byte specifies the type of the following messages. Values from 0x00 to 0x7F are used for messages from the hardware to the framework, while values from 0x80 to 0xFF are used for messages from the framework to the hardware.

The available values for messages from the hardware to the framework are:

- 0x00 to 0x0F - Administration messages
  - 0x00 Sync - The hardware tells the framework that it is a dualpanto devices and wants to connect.
  - 0x01 Heartbeat - Need to be send regularly to avoid being disconnected for inactivity.
- 0x10 to 0x1F - Data messages
  - 0x10 Position - This message contains the current positions of the handles.
- 0x20 to 0x2F - Auxiliary messages
  - 0x20 Debug log - This message contains a user-defined string that is meant as a debug log.

The available values for messages from the framework to the hardware are:

- 0x80 to 0x8F - Administration messages
  - 0x80 Ack - The framework acknowledges the device.
- 0x90 to 0x9F - Data messages
  - 0x90 Motor - This message contains a motor movement.
  - 0x91 PID values - This message contains PID values for one motor.

### Payload Size

The payload size is encoded as a 32 bit integer. It may be zero if the message doesn't contain a payload.

## Payload

The content of the payload is based on the message type.

### 0x00 Sync

The message only contains the protocol revision, encoded as a 32 bit integer.

Example message for protocol revision 0:
```
4450     // magic number
00       // message type: sync
00000004 // payload lenght: 32 bit integer is 4 bytes long
00000000 // protocol revision 0
```

### 0x01 Heartbeat

This message type does not require a payload.

Example message:
```
4450     // magic number
01       // message type: heartbeat
00000000 // payload lenght: no payload
```

### 0x10 Position

The message contains - in this order - the x position, the y position and the rotation of a handle, each encoded as a 32 bit float. This is repeated for each handle.

Example message for two handles:
```
4450     // magic number
10       // message type: position
00000018 // payload lenght: 2 handles, 3 values each, 4 bytes each - 2*3*4 = 24 = 0x18
FFFFFFFF // x position of first handle
FFFFFFFF // y position of first handle
FFFFFFFF // rotation of first handle
FFFFFFFF // x position of second handle
FFFFFFFF // y position of second handle
FFFFFFFF // rotation of second handle
```

### 0x20 Debug log

This message contains a custom ASCII-encoded debug string.

Example message with text "HELP ME!":
```
4450     // magic number
20       // message type: debug log
00000008 // payload lenght: string contains 8 bytes
48       // H
45       // E
4C       // L
50       // P
20       // [space]
4D       // M
45       // E
21       // !
```

### 0x80 Ack

This message type does not require a payload.

Example message:
```
4450     // magic number
80       // message type: acknowledgement
00000000 // payload lenght: no payload
```

### 0x90 Motor

This message contains the control method and pantograph index, both encoded as a 8 bit integer, followed by the target position data (x, y, rotation), each encoded as a 32 bit float.

Available control method values:

- 0x00 Position
- 0x01 Force rendering

Example message for setting the it handle position:
```
4450     // magic number
90       // message type: motor
0000000E // payload lenght: 1 byte for control method, 1 for index, 3*4 for target position
00       // control method: 0x00 for position mode
01       // panto index: 0x01 for it handle
FFFFFFFF // target x position
FFFFFFFF // target y position
FFFFFFFF // target rotation
```

### 0x91 PID values

This message contains the motor index encoded as an 8 bit integer, followed by the P, I and D values, each encoded as 32 bit float.

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
0000000D // payload lenght: 1 byte for index, 3*4 for values
05       // motor index: 0x05 for second pantograph, rotation motor
FFFFFFFF // P value
FFFFFFFF // I value
FFFFFFFF // D value
```
