import subprocess
import codecs
import struct
import sys
import time

if(len(sys.argv) < 2):
    print("Script to transform coordinates from dualPanto into readable format")
    print("Usage: python serialToCoordinates.py <serialPort>")
    sys.exit()

result = subprocess.Popen("./serial " + sys.argv[1],shell=True,  stdin=subprocess.PIPE, stdout=subprocess.PIPE)
time.sleep(1)

if(len(sys.argv) > 2):
    print("send 1")
    result.stdin.write(b'00 A8 49 63 41 EE 85 48 C2 00 00 00 00\n')
    result.stdin.write("\n")
    result.stdout.read(5)
    time.sleep(3)
    result.stdout.read(5)
    print("send 2")
    result.stdin.write(b'00 B6 C8 4B 42 9C C2 23 C1 00 00 00 00\n')
    result.stdin.write("\n")
    result.stdout.read(6)
    time.sleep(3)
    result.stdout.read(5)
    print("send 3")
    result.stdin.write(b'00 3E 11 FB 41 08 B7 DA C1 00 00 00 00\n')
    result.stdin.write("\n")
    result.stdout.read(7)
    time.sleep(3)
    result.stdout.read(5)
    print("send 4")
    result.stdin.write(b'00 B0 43 84 40 F0 8C E4 C1 00 00 00 00\n')
    result.stdin.write("\n")
    result.stdout.read(8)

a = 0

def printMap(x1,y1,r1, x2,y2,r2):
    print(chr(27) + "[2J")
    print(("%.2f" % x1) + "  |  " + ("%.2f" % y1) + "  |  " + ("%.2f" % r1) + "    :    " + ("%.2f" % x2) + "  |  " + ("%.2f" % y2) + "  |  " + ("%.2f" % r2))

for line in result.stdout:
    a += 1
    if(a%10 != 0):
        continue
    if(len(line) != 73):
        continue
    line = line.replace(" ","");
    x1String = line[0:8]
    y1String = line[8:16]
    r1String = line[16:24]

    '''
        Format:

        <   X1    > <   Y1    > <   R1    > <   X2    > <   Y2    > <   R2    >
        08 79 0E 41 EA A7 13 C2 56 7A 19 C0 00 B6 DE 3F BC 01 BA C2 D3 2D 29 C0

    '''

    x1String = codecs.encode(codecs.decode(x1String, 'hex')[::-1], 'hex').decode()
    y1String = codecs.encode(codecs.decode(y1String, 'hex')[::-1], 'hex').decode()
    r1String = codecs.encode(codecs.decode(r1String, 'hex')[::-1], 'hex').decode()

    x1 = struct.unpack('!f', x1String.decode('hex'))[0]
    y1 = struct.unpack('!f', y1String.decode('hex'))[0]
    r1 = struct.unpack('!f', r1String.decode('hex'))[0]

    x2String = line[24:32]
    y2String = line[32:40]
    r2String = line[40:48]


    x2String = codecs.encode(codecs.decode(x2String, 'hex')[::-1], 'hex').decode()
    y2String = codecs.encode(codecs.decode(y2String, 'hex')[::-1], 'hex').decode()
    r2String = codecs.encode(codecs.decode(r2String, 'hex')[::-1], 'hex').decode()

    x2 = struct.unpack('!f', x2String.decode('hex'))[0]
    y2 = struct.unpack('!f', y2String.decode('hex'))[0]
    r2 = struct.unpack('!f', r2String.decode('hex'))[0]


    #print(("%.2f" % x) + "    |    " + ("%.2f" % y))
    printMap(x1,y1,r1, x2,y2,r2)

