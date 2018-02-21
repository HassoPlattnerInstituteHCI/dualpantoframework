### Node

use node 9.5.0

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
