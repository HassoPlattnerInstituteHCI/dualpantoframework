# Serial Communication Protocol - Revision 7

All messages contain a [header](#header) and an optional [payload](#payload).

## Serial Transmission Configuration

### Baud Rate

The transmission uses a baud rate of 115200.

### Packet Size

The maximum packet size is 262 bytes, with 6 bytes being used for the header and 256 bytes for the payload. This limit for the payload size was chosen to avoid blocking the transmission for too long.

## Header

The header consists of a [magic number](#magic-number), the [message type](#message-type), the [packet ID](#packet-id) and the [payload size](#payload-size).

### Magic Number

All messages start with the magic bytes 0x44 0x50 (DP).

### Message Type

The next byte specifies the type of the following messages. Values from 0x00 to 0x7F are used for messages from the hardware to the framework, while values from 0x80 to 0xFF are used for messages from the framework to the hardware.

The available values for messages from the hardware to the framework are:

- 0x00 to 0x0F - Administration messages
  - [0x00 Sync](#0x00-Sync) - The hardware tells the framework that it is a dualpanto devices and wants to connect.
  - [0x01 Heartbeat](#0x01-Heartbeat) - Need to be send regularly to avoid being disconnected for inactivity.
  - [0x02 Buffer critical](#0x02-Buffer-critical) - Tells the framework to stop sending packets to avoid overflowing the device's receive buffer.
  - [0x03 Buffer ready](#0x03-Buffer-ready) - Tells the framework to proceed sending packets.
  - [0x04 Packet Ack](#0x04-Packet-Ack) - Acknowledges the successful transmission of a state-changing packet.
  - [0x05 Invalid Packet ID](#0x05-Invalid-packet-id) - Informs the framework of an unexpected packet ID.
  - [0x06 Invalid Data](#0x06-Invalid-data) - Informs the packet of unexpected bytes in the receive buffer.
- 0x10 to 0x1F - Data messages
  - [0x10 Position](#0x10-Position) - This message contains the current positions of the handles, as well as the god objects' positions.
  - [0x11 Graph state](#0x11-Graph-state) - A handle entered or left a haptic graph.
- 0x20 to 0x2F - Auxiliary messages
  - [0x20 Debug log](#0x20-Debug-log) - This message contains a user-defined string that is meant as a debug log.

The available values for messages from the framework to the hardware are:

- 0x80 to 0x8F - Administration messages
  - [0x80 Sync Ack](#0x80-Sync-Ack) - The framework acknowledges the connection.
  - [0x81 Heartbeat Ack](#0x81-Heartbeat-Ack) - The framework acknowledges the heartbeat.
- 0x90 to 0xAF - Data messages
  - [0x90 Motor](#0x90-Motor) - This message contains a motor movement.
  - [0x91 PID values](#0x91-PID-values) - This message contains PID values for one 
  - [0x92 Speed](#0x92-Speed) - This message specifies the speed to use for tweening positions 
  - [0x93 Transition ended](#0x93-transition-ended) - This message reports that a move has ended, and whether the handle landed, the move timed out or the handle left its path.
  - [0x94 PID calibration ended](#0x94-PID-calibration-ended) - This message reports the result of a PID calibration and the gains now in use.
  - [0xA0 Create obstacle](#0xA0-Create-obstacle) - This message specifies an obstacle to be added to one or both handles. Note: The obstacle isn't enabled automatically after creation. An enable message is required to enable it.
  - [0xA1 Add to obstacle](#0xA1-Add-to-obstacle) - This message specifies positions to be appended to an obstacle.
  - [0xA2 Remove obstacle](#0xA2-Remove-obstacle) - This message specifies an obstacle to remove.
  - [0xA3 Enable obstacle](#0xA3-Enable-obstacle) - This message specifies an obstacle to enable.
  - [0xA4 Disable obstacle](#0xA4-Disable-obstacle) - This message specifies an obstacle to disable.
  - [0xA5 Calibrate panto](#0xA5-Calibrate-panto) - This message specifies a calibration request.
  - [0xA6 Create passable obstacle](#0xA6-Create-passable-obstacle) - This message specifies a passable obstacle to be added.
  - [0xA7 Create rail](#0xA7-Create-rail) - This message specifies a haptic guide to be added. A haptic guide is also an obstacle and hence also needs to be enabled and can be disabled. A haptic guide also has a displacement area around it that the user needs to pass to overcome it. That way the strength of the guide can be specified.
  - [0xA8 Freeze](#0xA8-Freeze) - Freeze the handle
  - [0xA9 Free](#0xA9-Free) - Free the handle
  - [0xAA Set Speed Control](#0xAA-SpeedControl) - Enable or disable speed control with different configuration options
  - [0xAB Calibrate PID](#0xAB-Calibrate-PID) - This message starts the automatic tuning of the linkage motors' PID gains.
- 0xB0 to 0xBF - Haptic graph messages (see [Haptic graphs](#Haptic-graphs))
  - [0xB0 Create graph](#0xB0-Create-graph) - This message creates an empty graph. Note: The graph isn't enabled automatically after creation.
  - [0xB1 Add graph nodes](#0xB1-Add-graph-nodes) - This message adds nodes to a graph.
  - [0xB2 Add graph edges](#0xB2-Add-graph-edges) - This message connects nodes of a graph.
  - [0xB3 Remove graph](#0xB3-Remove-graph) - This message specifies a graph to remove.
  - [0xB4 Enable graph](#0xB4-Enable-graph) - This message specifies a graph to enable.
  - [0xB5 Disable graph](#0xB5-Disable-graph) - This message specifies a graph to disable.
  - [0xB6 Set graph sinks](#0xB6-Set-graph-sinks) - This message makes the nodes of a graph feel like dips.
- 0xC0 to 0xCF - Debug tools
    [0xC0 Dump hashtable](#0xC0-Dump-hashtable) - Request a dump of the physics' hashtable.

### Packet ID

In order to ensure the firmware state stays in sync with what the framework expects it to be, all state-changing messages must be successfully transmitted. All state-changing packets must include an ID that is different from 0, as well as different from the previous ID. The receiver must acknowledge all packets with a non-zero ID. If the last tracked packet has not been acknowledged by the receiver in a implementation-specified interval, the sender should resend it.

The packet ID is encoded as a 8 bit unsigned integer. It may be zero only if the message is not state-changing. Otherwise, the ID shall only increase, with the only exception being ID 255 being followed by 1.

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
00       // packet ID: not utilized
0004     // payload length: 32 bit integer is 4 bytes long
00000000 // protocol revision 0
```

### 0x01 Heartbeat

This message type does not require a payload.

Example message:
```
4450     // magic number
01       // message type: heartbeat
00       // packet ID: not utilized
0000     // payload length: no payload
```

### 0x02 Buffer critical

This message type does not require a payload.

Example message:
```
4450     // magic number
02       // message type: buffer critical
00       // packet ID: not utilized
0000     // payload length: no payload
```

### 0x03 Buffer ready

This message type does not require a payload.

Example message:
```
4450     // magic number
03       // message type: buffer ready
00       // packet ID: not utilized
0000     // payload length: no payload
```

### 0x04 Packet Ack

The message contains the packet ID of the acknowledged packet. Note: This message itself is not state-changing and thus has has packet ID of 0.

Example message:
```
4450     // magic number
04       // message type: buffer ready
00       // packet ID: not utilized
0001     // payload length: 1 byte for ack'd packet ID
01       // ack'd packet ID
```

### 0x05 Invalid packet ID

The message contains the expected and the received packet ID.

Example message:
```
4450     // magic number
05       // message type: invalid packet ID
00       // packet ID: not utilized
0002     // payload length: 1 per included ID
14       // expected packet ID 14
15       // received packet ID 15 -> a packet got dropped
```

### 0x06 Invalid data

This message type does not require a payload.

Example message:
```
4450     // magic number
06       // message type: invalid data
00       // packet ID: not utilized
0000     // payload length: no payload
```


### 0x10 Position

The message contains - in this order - the x position, the y position and the rotation of a handle, each encoded as a 32 bit float, followed by the x and y position of the god object. This is repeated for each handle.

Example message for two handles:
```
4450     // magic number
10       // message type: position
00       // packet ID: not utilized
0028     // payload length: 2 handles, 5 values each, 4 bytes each - 2*5*4 = 40 = 0x28
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

### 0x11 Graph state

Sent when a handle entered or left a [haptic graph](#Haptic-graphs). The message contains the pantograph index and the state (0x00 left, 0x01 entered), both encoded as an 8 bit unsigned integer, and the graph ID, encoded as a 16 bit unsigned integer. While a handle is on a graph, the god object position in the [position message](#0x10-Position) is its position on the graph.

Example message for the it handle entering a graph:
```
4450     // magic number
11       // message type: graph state
00       // packet ID: not utilized
0004     // payload length: 1 byte for index, 1 for state, 2 for ID
01       // panto index: 0x01 for it handle
01       // state: entered
0023     // graph ID
```

### 0x20 Debug log

This message contains a custom ASCII-encoded debug string.

Example message with text "HELP ME!":
```
4450     // magic number
20       // message type: debug log
00       // packet ID: not utilized
0008     // payload length: string contains 8 bytes
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
00       // packet ID: not utilized
0000     // payload length: no payload
```

### 0x81 Heartbeat Ack

This message type does not require a payload.

Example message:
```
4450     // magic number
81       // message type: heartbeat acknowledgement
00       // packet ID: not utilized
0000     // payload length: no payload
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
00       // packet ID: not utilized
000E     // payload length: 1 byte for control method, 1 for index, 3*4 for target position
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
00       // packet ID: not utilized
000D     // payload length: 1 byte for index, 3*4 for values
05       // motor index: 0x05 for second pantograph, rotation motor
FFFFFFFF // P value
FFFFFFFF // I value
FFFFFFFF // D value
```


### 0x92 Speed

This message contains the pantograph index encoded as an 8 bit unsigned integer, followed by the speed value encoded as 32 bit float.

Example message for setting the speed on both handles:
```
4450     // magic number
92       // message type: PID values
00       // packet ID: not utilized
0005     // payload length: 1 byte for index, 4 for speed value
FF       // pantograph index - both handles
FFFFFFFF // speed
```

### 0x93 Transition ended

This message is sent once a move started with [0x90 Motor](#0x90-Motor) in position mode has ended. The motors are released at this point. It contains the pantograph index and the result, both encoded as an 8 bit unsigned integer.

Available result values:

- 0x00 The handle landed: it stayed within 0.5 mm of the target for 100 ms, and was still within 0.5 mm 250 ms after the motors were released. If it springs back further than that, the motors take over again to correct for it.
- 0x01 Timed out: the handle didn't land within the duration of the movement (1 / speed, at most 30 seconds) plus 3 seconds, for example because it is blocked or the target is out of reach.
- 0x02 Off the path: the handle got more than 10 mm away from the straight line between its start and the target, including past the target. The motors are released immediately, but the handle can still coast further.

No message is sent if the move is replaced or canceled by another motor, freeze or free message.

Example message:
```
4450     // magic number
93       // message type: transition ended
00       // packet ID: not utilized
0002     // payload length: 1 byte for index, 1 for result
01       // panto index: 0x01 for it handle
00       // result: 0x00 for landed
```

### 0x94 PID calibration ended

This message is sent once a PID calibration started with [0xAB Calibrate PID](#0xAB-Calibrate-PID) has ended. The motors are released at this point. It contains the pantograph index and the result, both encoded as an 8 bit unsigned integer, followed by the P, I and D gains now in use for the linkage motors of that handle, each encoded as a 32 bit float.

Available result values:

- 0x00 Calibrated: the gains were tuned, are in use and are saved on the device. They are also used after a restart, instead of the ones from the hardware config.
- 0x01 Failed: the handle couldn't reach the center of the test pattern, or already the gains from before were unstable. These gains are kept.
- 0x02 Canceled: another motor, freeze or free message, or another calibration request, arrived during the calibration. The gains from before are kept.

Example message:
```
4450     // magic number
94       // message type: PID calibration ended
00       // packet ID: not utilized
000E     // payload length: 1 byte for index, 1 for result, 3x4 for P, I and D
00       // panto index: 0x00 for me handle
00       // result: 0x00 for calibrated
FFFFFFFF // P
FFFFFFFF // I
FFFFFFFF // D
```

### 0xA0 Create obstacle

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the obstacle ID, encoded as a 16 bit unsigned integer, and multiple 2D vectors, each encoded as a pair of 32 bit floats.

Setting the pantograph index to 0xFF creates the obstacle for both handles.

Example message for adding an obstacle to both handles:
```
4450     // magic number
A0       // message type: Create obstacle
01       // packet ID
0013     // payload length: 1 byte for index, 2 for ID, 4*4 for values
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
01       // packet ID
0013     // payload length: 1 byte for index, 2 for ID, 4*4 for values
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
01       // packet ID
0003     // payload length: 1 byte for index, 2 for ID
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
01       // packet ID
0003     // payload length: 1 byte for index, 2 for ID
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
01       // packet ID
0003     // payload length: 1 byte for index, 2 for ID
FF       // pantograph index - both handles
0023     // obstacle ID
```

### 0xA5 Calibrate panto

Example message for sending calibration request:
```
4450     // magic number
A5       // message type: Calibrate panto
00       // packet ID: not utilized
0000     // payload length: 0
```

### 0xA6 Create passable obstacle

Works the same way as 'create obstacle' just that the obstacle will be overcomeable

### 0xA7 Create rail

Add a haptic rail (guide)

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the obstacle ID, encoded as a 16 bit unsigned integer, and 2 2D vectors, both encoded as a pair of 32 bit floats.

Setting the pantograph index to 0xFF creates the obstacle for both handles.

Example message for adding an obstacle to both handles:
```
4450     // magic number
A7       // message type: Create rail
01       // packet ID
0013     // payload length: 1 byte for index, 2 for ID, 4*4 for values
FF       // pantograph index - both handles
0023     // obstacle ID
FFFFFFFF // first vector, x
FFFFFFFF // first vector, y
FFFFFFFF // second vector, x
FFFFFFFF // second vector, y
```

### 0xA8 Freeze

DOCUMENTATION MISSING

### 0xA9 Free

DOCUMENTATION MISSING

### 0xAA Set speed control

Enable / disable the speed control (tethering).

Details about the speed control configuration can be found here: https://www.dropbox.com/scl/fi/uljoe140fet2b53bjhr4y/DualPanto-Speed-Control.pptx?dl=0&rlkey=6k77wrfnb3oaxg186489tpinj

Example message for setting the global speed control:
```
4450     // magic number
AA       // message type: set speed contol
00       // packet ID: not utilized
0015     // payload length: 1 byte for enable/disable, 4 for tether factor, 2x4 for the tether radius, 1 for the tether strategy when the handle moves out of the outer tether radius, 1 for pock enabled/disabled
01       // tether enabled
0000000000000000 // tether factor (value between 0 and 1; examples: 0.005, 0.01, 0.05)
0000000000000000 // inner radius (value between 0 and 3)
0000000000000000 // outer radius (value between 0 and 10)
01       // tether strategy (one out of 0,1,2)
01       // "pock" enabled
```

### 0xAB Calibrate PID

This message starts the automatic tuning of the P and D gains of the linkage motors of one or both handles. It contains the pantograph index, encoded as an 8 bit unsigned integer. 0xFF calibrates both handles at the same time.

The handle first moves to the middle of its workspace (half of the mean arm reach in front of the motors). Then it repeatedly runs a pattern of test moves out and back in four directions (about 12 % of the arm reach, around 24 mm), each time with other gains, and scores how far it lags behind, how long it takes to settle on the target, how far it overshoots and how much it oscillates. Starting from the current gains, P and D are scaled up and down, keeping changes that are clearly better, with smaller and smaller steps. This takes up to 20 rounds of about 10 seconds each, so up to about 4 minutes. I isn't tuned.

- Don't hold the handle during the calibration, and keep the workspace clear. Obstacles and graphs should be disabled.
- Any motor, freeze or free message cancels the calibration.
- The result is reported with [0x94 PID calibration ended](#0x94-PID-calibration-ended). No [0x93 Transition ended](#0x93-transition-ended) messages are sent for the test moves.
- Both linkage motors of a handle get the same gains. [0x91 PID values](#0x91-PID-values) still overrides them until the next restart.

Example message:
```
4450     // magic number
AB       // message type: calibrate PID
00       // packet ID: not utilized
0001     // payload length: 1 byte for index
FF       // panto index: 0xFF for both handles
```

### Haptic graphs

A haptic graph is a network of hallways without any width: nodes connected by edges, e.g. the paths of a Pac-Man maze. It feels like a groove dug into the surface instead of two walls: there is no free play across a hallway, while moving along it is free.

- A handle enters the graph when it gets within the capture radius of a node with the entry flag. The force fades in over 200 ms.
- On the graph, the god object walks along the connected edges to the point closest to the handle, and a PID force pulls the handle to that point. It doesn't jump to another hallway that is merely close by. A way ends like a wall at a dead end.
- Within the junction radius of a node, the god object can also switch to any other edge of that node that is closer to the handle. This is what makes turning possible: the handle practically never hits a node exactly, so with a radius of 0 it could only go straight through a crossing. A value of a few millimeters is a good start, and it should be smaller than half of the shortest edge.
- Optionally, [sinks](#0xB6-Set-graph-sinks) make the nodes feel like dips that pull the handle in along the way.
- Walls and speed control are ignored while on a graph. They apply again after leaving it.
- A handle leaves the graph when the graph gets disabled or removed, or when it is further than the breakaway distance away from the god object. To get back on, it has to enter through an entry node again.
- Transitions (0x90 Motor) are possible while on a graph. The force is paused during the transition, so move the handle to a point on the graph.

Graphs are built like obstacles: create it, add the nodes, add the edges between them, then enable it. All of these messages are state-changing and need a packet ID. Keep packets small: a tracked packet including its acknowledgement should be sent well within the 10 ms resend timeout, which is about 115 bytes at 115200 baud.

### 0xB0 Create graph

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the graph ID, encoded as a 16 bit unsigned integer, followed by the capture radius, the junction radius, the breakaway distance and the P, I and D values, each encoded as a 32 bit float.

Setting the pantograph index to 0xFF creates the graph for both handles. An existing graph with the same ID is replaced.

A breakaway distance of 0 disables breaking away. Otherwise, it is raised to at least twice the capture radius. Passing a negative or NaN value for P, I or D uses the hardware's `forcePidFactor` of the walls instead. The I term is limited, and the D term is averaged because the encoder angles don't update every frame, so a D value may need different tuning than on the walls.

Example message for creating a graph for both handles:
```
4450     // magic number
B0       // message type: Create graph
01       // packet ID
001B     // payload length: 1 byte for index, 2 for ID, 6*4 for values
FF       // pantograph index - both handles
0023     // graph ID
FFFFFFFF // capture radius in mm
FFFFFFFF // junction radius in mm
FFFFFFFF // breakaway distance in mm
FFFFFFFF // P value
FFFFFFFF // I value
FFFFFFFF // D value
```

### 0xB1 Add graph nodes

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the graph ID, encoded as a 16 bit unsigned integer, and multiple nodes. Each node consists of the node ID, encoded as a 16 bit unsigned integer, the position, encoded as a pair of 32 bit floats, and the flags, encoded as an 8 bit unsigned integer.

Available flags:

- 0x01 Entry - the handle can enter the graph at this node

Adding a node ID that already exists updates its position and flags.

Example message for adding a node:
```
4450     // magic number
B1       // message type: Add graph nodes
01       // packet ID
000E     // payload length: 1 byte for index, 2 for ID, 11 per node
FF       // pantograph index - both handles
0023     // graph ID
0001     // node ID
FFFFFFFF // x position
FFFFFFFF // y position
01       // flags: entry node
```

### 0xB2 Add graph edges

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the graph ID, encoded as a 16 bit unsigned integer, and multiple edges. Each edge consists of two node IDs, encoded as 16 bit unsigned integers. The nodes have to be added first. Edges are not directional.

Example message for adding an edge:
```
4450     // magic number
B2       // message type: Add graph edges
01       // packet ID
0007     // payload length: 1 byte for index, 2 for ID, 4 per edge
FF       // pantograph index - both handles
0023     // graph ID
0001     // first node ID
0002     // second node ID
```

### 0xB3 Remove graph

This message contains the pantograph index, encoded as an 8 bit unsigned integer, and the graph ID, encoded as a 16 bit unsigned integer. Setting the pantograph index to 0xFF removes the graph for both handles.

Example message:
```
4450     // magic number
B3       // message type: Remove graph
01       // packet ID
0003     // payload length: 1 byte for index, 2 for ID
FF       // pantograph index - both handles
0023     // graph ID
```

### 0xB4 Enable graph

Same payload as [0xB3 Remove graph](#0xB3-Remove-graph).

### 0xB5 Disable graph

Same payload as [0xB3 Remove graph](#0xB3-Remove-graph).


### 0xB6 Set graph sinks

This message contains the pantograph index, encoded as an 8 bit unsigned integer, the graph ID, encoded as a 16 bit unsigned integer, followed by the sink radius and the sink depth, both encoded as a 32 bit float. Setting the pantograph index to 0xFF sets the sinks for both handles.

Sinks make every node of the graph feel like a dip in the groove. Within the radius of a node, measured along the way, the handle is pulled along the way into the node, as if the god object was moved towards the node by up to the depth in mm: the offset is `depth * sin(pi * distance / radius)`. It is 0 at the rim, strongest halfway down the slope, and 0 again at the node, so the handle comes to rest in the node. The force uses the graph's PID values, so with a P value of 0.375 a depth of 3 mm pulls as hard as the groove does with the handle 3 mm off the way.

- The radius is limited to half of each way's length, so the sinks of neighbouring nodes never overlap.
- A negative depth makes bumps that push the handle away from the nodes instead.
- A radius or depth of 0 disables the sinks, which is the default for a new graph. Creating a graph again with the same ID resets them, so send this message after [0xB0 Create graph](#0xB0-Create-graph). It can be sent at any time, also while the graph is enabled.

Example message:
```
4450     // magic number
B6       // message type: Set graph sinks
01       // packet ID
000B     // payload length: 1 byte for index, 2 for ID, 2*4 for values
FF       // pantograph index - both handles
0023     // graph ID
FFFFFFFF // sink radius in mm
FFFFFFFF // sink depth in mm
```

### 0xC0 Dump hashtable

This message contains the pantograph index, encoded as an 8 bit unsigned integer.

Setting the pantograph index to 0xFF dumps the hashtable for both handles.

Example message for dumping the hashtable for both handles:
```
4450     // magic number
C0       // message type: Dump hashtable
00       // packet ID: not utilized
0001     // payload length: 1 byte for index
FF       // pantograph index - both handles
```

