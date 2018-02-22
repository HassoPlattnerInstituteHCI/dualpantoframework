## Position Based Protocol
- Index 0: Upper panto
- Index 1: Lower panto

### Receiving
6x 32 bit little endian floats, 2x (for each panto):
- X-Axis (linear mm)
- Y-Axis (linear mm)
- Knob (angular radian)

### Sending
1 byte panto index followed by 3x 32 bit little endian floats:
- X-Axis (linear mm)
- Y-Axis (linear mm)
- Knob (angular radian)



## Node
use node version 9.5.0

### gzdoom.ini
- Mac OS: ~/Library/Preferences/gzdoom.ini

Add to the section [Doom.Bindings]

    axis1minus=+moveleft
    axis1plus=+moveright
    axis2minus=+back
    axis2plus=+forward
    axis3plus=+left
    axis3minus=+right

### config.json
Example:

    {"serialDevicePath":"/dev/cu.usbmodem1411", "doomExecutablePath": "../gzdoom.app/Contents/MacOS/gzdoom"}
