#!/usr/bin/env python3
"""
Runs the PID calibration of the firmware (protocol message 0xAB) without Unity, and records it for review.

    python3 utils/scripts/pidCalibration.py [--port /dev/cu.SLAB_USBtoUART] [--panto 0|1|255] [--out results/]

Connects like the framework does (sync, sync ack, heartbeat acks), starts the calibration, prints the firmware's debug
log and the result, and writes:
- <out>/log.txt: the debug log with timestamps
- <out>/positions.csv: time, panto, handle x/y, rotation, god object x/y at 60 Hz
- <out>/result.json: the result per handle

Ctrl+C sends a free message, which cancels the calibration and releases the motors.
Needs pyserial (pip install pyserial).
"""

import argparse
import json
import os
import struct
import sys
import time

import serial

MAGIC = b"\x44\x50"
REVISION = 7

SYNC = 0x00
HEARTBEAT = 0x01
POSITION = 0x10
DEBUG_LOG = 0x20
SYNC_ACK = 0x80
HEARTBEAT_ACK = 0x81
TRANSITION_ENDED = 0x93
PID_CALIBRATION_ENDED = 0x94
FREE = 0xA9
CALIBRATE_PID = 0xAB

RESULTS = {0: "calibrated", 1: "failed", 2: "canceled"}


class Device:
    def __init__(self, port):
        self.serial = serial.Serial()
        self.serial.port = port
        self.serial.baudrate = 115200
        self.serial.timeout = 0.05
        # DTR or RTS high while opening puts the ESP32 into its bootloader
        self.serial.dtr = False
        self.serial.rts = False
        self.serial.open()
        self.buffer = b""

    def reset(self):
        self.serial.rts = True
        time.sleep(0.1)
        self.serial.rts = False

    def send(self, message_type, payload=b""):
        # packet id 0: not tracked, no ack expected
        self.serial.write(MAGIC + struct.pack(">BBH", message_type, 0, len(payload)) + payload)

    def packets(self):
        self.buffer += self.serial.read(4096)
        while True:
            start = self.buffer.find(MAGIC)
            if start < 0:
                # keep a trailing half magic number
                self.buffer = self.buffer[-1:]
                return
            if len(self.buffer) < start + 6:
                self.buffer = self.buffer[start:]
                return
            message_type, _, length = struct.unpack(">BBH", self.buffer[start + 2:start + 6])
            if length > 256:
                # not a real header, the magic number appeared in boot output or a payload
                self.buffer = self.buffer[start + 1:]
                continue
            end = start + 6 + length
            if len(self.buffer) < end:
                self.buffer = self.buffer[start:]
                return
            payload = self.buffer[start + 6:end]
            self.buffer = self.buffer[end:]
            yield message_type, payload


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", default="/dev/cu.SLAB_USBtoUART")
    parser.add_argument("--panto", type=int, default=0xFF, help="0, 1 or 255 for both")
    parser.add_argument("--out", default="pidCalibration_" + time.strftime("%Y%m%d_%H%M%S"))
    parser.add_argument("--timeout", type=float, default=600, help="seconds")
    parser.add_argument("--no-reset", action="store_true", help="don't reset the device before connecting")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    log_file = open(os.path.join(args.out, "log.txt"), "w")
    positions_file = open(os.path.join(args.out, "positions.csv"), "w")
    positions_file.write("time,panto,x,y,rotation,godX,godY\n")

    expected = {0, 1} if args.panto == 0xFF else {args.panto}
    results = {}
    device = Device(args.port)
    if not args.no_reset:
        device.reset()

    begin = time.time()
    connected_at = None
    started = False

    def log(text):
        line = "%7.2f %s" % (time.time() - begin, text)
        print(line, flush=True)
        log_file.write(line + "\n")
        log_file.flush()

    try:
        while time.time() - begin < args.timeout:
            for message_type, payload in device.packets():
                now = time.time() - begin
                if message_type == POSITION and int(now * 2) != int(getattr(main, "flushed", 0) * 2):
                    # flushed every half second, so a killed run still leaves its data
                    positions_file.flush()
                    main.flushed = now
                if message_type == SYNC:
                    if len(payload) == 4 and struct.unpack(">I", payload)[0] != REVISION:
                        log("protocol revision %i, expected %i" % (struct.unpack(">I", payload)[0], REVISION))
                    if connected_at is None:
                        device.send(SYNC_ACK)
                        connected_at = time.time()
                        log("connected")
                elif message_type == HEARTBEAT:
                    device.send(HEARTBEAT_ACK)
                elif message_type == DEBUG_LOG:
                    log("[device] " + payload.decode("utf-8", "replace").rstrip("\x00\r\n"))
                elif message_type == POSITION:
                    count = len(payload) // 20
                    for panto in range(count):
                        values = struct.unpack(">5f", payload[panto * 20:panto * 20 + 20])
                        positions_file.write("%.4f,%i,%s\n" % (now, panto, ",".join("%.3f" % v for v in values)))
                elif message_type == TRANSITION_ENDED:
                    log("transition ended: %s" % payload.hex())
                elif message_type == PID_CALIBRATION_ENDED:
                    panto, result = payload[0], payload[1]
                    p, i, d = struct.unpack(">3f", payload[2:14])
                    results[panto] = {"result": RESULTS.get(result, result), "p": p, "i": i, "d": d,
                                      "seconds": round(time.time() - started_at, 1)}
                    log("handle %i: %s, gains in use P %.3f, I %.3f, D %.1f" % (panto, results[panto]["result"], p, i, d))

            # let the god objects settle after the reset in the sync ack before moving
            if connected_at is not None and not started and time.time() - connected_at > 1.5:
                device.send(CALIBRATE_PID, bytes([args.panto]))
                started = True
                started_at = time.time()
                log("calibration requested for %s" % ("both handles" if args.panto == 0xFF else "handle %i" % args.panto))

            if started and expected <= set(results):
                break
        else:
            log("timed out")
    except KeyboardInterrupt:
        log("interrupted, freeing the handles")
    finally:
        if started and not expected <= set(results):
            device.send(FREE, bytes([0xFF]))
            time.sleep(0.2)
        with open(os.path.join(args.out, "result.json"), "w") as result_file:
            json.dump(results, result_file, indent=2)
        log_file.close()
        positions_file.close()
        print("written to", args.out)

    return 0 if results and all(r["result"] == "calibrated" for r in results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
