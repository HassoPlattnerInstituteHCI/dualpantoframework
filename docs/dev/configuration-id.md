# Device Configuration ID
This file contains a list of all used device configuration IDs.

The **ID** specifies a device configuration file in [lib/device-config](../../lib/device-config) and **File** is the name of the hardware configuration header in [firmware/hardware](../../firmware/hardware).

ID | File | Device | Description
-|-|-|-
0 | `test.h` | Test Config | See [Test Configuration](#test-configuration)
1 | `lp_pcb.h` | Little Panto - PCB Version | -

## Test Configuration
The ID 0 is reserved for test configurations. Write the following files to create a test configuration:
```
firmware/hardware/test.h
lib/device-config/0.js
```

Change `firmware/config.h` to include the test config:
```c++
#include "hardware/lp_pcb.h"
```

And set the `configurationID = 0` in your `test.h`.
