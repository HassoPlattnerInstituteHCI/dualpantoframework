import subprocess
import codecs
import struct
import sys
import time

testPositions = ['90 88 D8 C0 50 04 96 C2 EA 32 28 C0',
                 'E2 83 41 42 8F 69 8B C2 D6 15 F5 BF',
                 '90 88 D8 C0 50 04 96 C2 EA 32 28 C0',
                 '8E 3E 38 C2 44 39 80 C2 FB 9D 41 C0',
                 '00 28 E7 C0 4C 35 A3 C1 F6 F3 3F C0']


def readPositions(filename):
    with open(filename) as f:
        content = f.readlines()
    content = [x.strip() for x in content] 
    return content

if(len(sys.argv) < 2):
    print("Script to transform coordinates from dualPanto into readable format")
    print("Usage: python serialToCoordinates.py <serialPort>")
    sys.exit()

result = subprocess.Popen("./serial " + sys.argv[1],shell=True,  stdin=subprocess.PIPE, stdout=subprocess.PIPE)
time.sleep(1)

a = 0

def printMap(x1,y1,r1, x2,y2,r2):
    print(chr(27) + "[2J")
    print(("%.2f" % x1) + "  |  " + ("%.2f" % y1) + "  |  " + ("%.2f" % r1) + "    :    " + ("%.2f" % x2) + "  |  " + ("%.2f" % y2) + "  |  " + ("%.2f" % r2))

l = 0


if(len(sys.argv) == 4 and sys.argv[2] == "-r1"):
    thefile = open(sys.argv[3], 'w')
    for line in result.stdout:
        thefile.write("%s\n" % line[0:35])

if(len(sys.argv) == 4 and sys.argv[2] == "-r2"):
    thefile = open(sys.argv[3], 'w')
    for line in result.stdout:
        thefile.write("%s\n" % line[35:])


if(len(sys.argv) == 3 and sys.argv[2] == "-d"):
    for line in result.stdout:
        l += 1
        if(l == 1000):
            result.stdin.write(b'00 ' + testPositions[0] + b'\n')
        if(l == 1500):
            result.stdin.write(b'01 ' + testPositions[0] + b'\n')
        if(l == 2000):
            result.stdin.write(b'00 ' + testPositions[1] + b'\n')
        if(l == 2500):
            result.stdin.write(b'01 ' + testPositions[1] + b'\n')
        if(l == 3000):
            result.stdin.write(b'00 ' + testPositions[2] + b'\n')
        if(l == 3500):
            result.stdin.write(b'01 ' + testPositions[2] + b'\n')
        if(l == 4000):
            result.stdin.write(b'00 ' + testPositions[3] + b'\n')
        if(l == 4500):
            result.stdin.write(b'01 ' + testPositions[3] + b'\n')
        if(l == 5000):
            result.stdin.write(b'00 ' + testPositions[4] + b'\n')
        if(l == 5500):
            result.stdin.write(b'01 ' + testPositions[4] + b'\n')


if(len(sys.argv) == 4 and sys.argv[2] == "-d1"):
    positions = readPositions(sys.argv[3])
    print(str(len(positions)) + " positions")
    p = 0
    for line in result.stdout:
        l += 1
        if(l % 50 == 0 and  p < len(positions)):
            print(b'00 ' + positions[p] + b'\n')
            result.stdin.write(b'00 ' + positions[p] + b'\n')
            p += 10
        if(p == len(positions)):
            sys.exit()

if(len(sys.argv) == 4 and sys.argv[2] == "-d2"):
    positions = readPositions(sys.argv[3])
    print(str(len(positions)) + " positions")
    p = 0
    for line in result.stdout:
        l += 1
        if(l % 50 == 0 and  p < len(positions)):
            print(b'00 ' + positions[p] + b'\n')
            result.stdin.write(b'01 ' + positions[p] + b'\n')
            p += 10
        if(p == len(positions)):
            sys.exit()


for line in result.stdout:
    a += 1
    if(a%10 != 0):
        continue
    if(len(line) != 73):
        continue
    line1 = line.replace(" ","");
    x1String = line1[0:8]
    y1String = line1[8:16]
    r1String = line1[16:24]

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

    x2String = line1[24:32]
    y2String = line1[32:40]
    r2String = line1[40:48]


    x2String = codecs.encode(codecs.decode(x2String, 'hex')[::-1], 'hex').decode()
    y2String = codecs.encode(codecs.decode(y2String, 'hex')[::-1], 'hex').decode()
    r2String = codecs.encode(codecs.decode(r2String, 'hex')[::-1], 'hex').decode()

    x2 = struct.unpack('!f', x2String.decode('hex'))[0]
    y2 = struct.unpack('!f', y2String.decode('hex'))[0]
    r2 = struct.unpack('!f', r2String.decode('hex'))[0]
    
    print("")
    print(line)
    print(b'01 ' + line[0:35] + '\n')
    print("")

    if(len(sys.argv) > 2 and sys.argv[2] == "-f1" and a%150 == 0):
        result.stdin.write(b'01 ' + line[0:35] + '\n')
    if(len(sys.argv) > 2 and sys.argv[2] == "-f2" and a%150 == 0):
        result.stdin.write(b'00 ' + line[35:] + '\n')

    #print(("%.2f" % x) + "    |    " + ("%.2f" % y))
    printMap(x1,y1,r1, x2,y2,r2)

