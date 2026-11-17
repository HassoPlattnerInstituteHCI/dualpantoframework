#!/usr/bin/env python3
"""
Tests the haptic graph mode of the firmware (protocol messages 0xB0 to 0xB5, 0x11) without Unity, and records it.

    python3 utils/scripts/graphTest.py [--port /dev/cu.SLAB_USBtoUART] [--panto 0|1|255] [--shape plus]
                                       [--center 0,-100] [--size 40] [--move-to-entry] [--plot]

Connects like the framework does, builds a graph from tracked packets (create, nodes, edges, enable), then logs graph
state changes and the debug log until Ctrl+C or --duration. While a handle is on the graph, it checks that
- the god object stays on an edge of the graph (distance to the closest edge, should be ~0)
- the handle follows the god object (distance handle to god object, the groove error)
and prints a summary of both every few seconds. Move the handle onto an entry node to get onto the graph, then try to
leave the grooves sideways, turn at the junctions, hit the dead ends and pull hard to break away.
With --sink-radius, the nodes feel like dips that pull the handle in (0xB6).

Shapes (size is the edge length in mm, all nodes are entry nodes unless --single-entry):
- line: two nodes, one edge
- plus: a crossing with four arms, tests turning at a junction
- square: a closed loop, tests corners
- grid: 3x3 nodes, all 12 edges, tests crossings and T junctions
- maze: the grid with two edges removed, tests dead ends

Writes to <out>/:
- log.txt: the log with timestamps
- positions.csv: time, panto, handle x/y, rotation, god object x/y, on graph, god object distance to graph
- graph.json: the graph that was sent
- summary.json: graph state events and the error statistics per handle
- plot.png: handle and god object traces over the graph (with --plot, needs matplotlib)

Ctrl+C disables and removes the graph and frees the handles. Needs pyserial (pip install pyserial).
"""

import argparse
import json
import math
import os
import struct
import sys
import time

import serial

MAGIC = b"\x44\x50"
REVISION = 7

SYNC = 0x00
HEARTBEAT = 0x01
BUFFER_CRITICAL = 0x02
BUFFER_READY = 0x03
PACKET_ACK = 0x04
INVALID_PACKET_ID = 0x05
INVALID_DATA = 0x06
POSITION = 0x10
GRAPH_STATE = 0x11
DEBUG_LOG = 0x20
SYNC_ACK = 0x80
HEARTBEAT_ACK = 0x81
MOTOR = 0x90
TRANSITION_ENDED = 0x93
FREE = 0xA9
CREATE_GRAPH = 0xB0
ADD_GRAPH_NODES = 0xB1
ADD_GRAPH_EDGES = 0xB2
REMOVE_GRAPH = 0xB3
ENABLE_GRAPH = 0xB4
DISABLE_GRAPH = 0xB5
SET_GRAPH_SINKS = 0xB6

NODE_ENTRY = 0x01

# a tracked packet including its ack should fit well within the firmware's 10 ms, about 115 bytes at 115200 baud
NODES_PER_PACKET = 8   # 6 header + 3 + 11 per node = 97 bytes
EDGES_PER_PACKET = 20  # 6 header + 3 + 4 per edge = 89 bytes


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


def build_shape(shape, center, size, single_entry):
    """Returns nodes as {id: (x, y)} and edges as [(id, id)]."""
    cx, cy = center
    if shape == "line":
        points = {1: (-0.5, 0), 2: (0.5, 0)}
        edges = [(1, 2)]
    elif shape == "plus":
        points = {1: (0, 0), 2: (0, 1), 3: (1, 0), 4: (0, -1), 5: (-1, 0)}
        edges = [(1, 2), (1, 3), (1, 4), (1, 5)]
    elif shape == "square":
        points = {1: (-0.5, -0.5), 2: (0.5, -0.5), 3: (0.5, 0.5), 4: (-0.5, 0.5)}
        edges = [(1, 2), (2, 3), (3, 4), (4, 1)]
    elif shape in ("grid", "maze"):
        points = {}
        for row in range(3):
            for column in range(3):
                points[row * 3 + column + 1] = (column - 1, row - 1)
        edges = []
        for row in range(3):
            for column in range(3):
                node = row * 3 + column + 1
                if column < 2:
                    edges.append((node, node + 1))
                if row < 2:
                    edges.append((node, node + 3))
        if shape == "maze":
            # node 6 becomes an arm off the center, 3, 7 and 9 become dead ends
            edges.remove((3, 6))
            edges.remove((6, 9))
            edges.remove((7, 8))
    else:
        raise ValueError(shape)
    nodes = {node: (cx + x * size, cy + y * size) for node, (x, y) in points.items()}
    entries = {min(nodes)} if single_entry else set(nodes)
    return nodes, edges, entries


def segment_distance(p, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    length2 = dx * dx + dy * dy
    t = 0 if length2 == 0 else max(0, min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / length2))
    return math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy)


class Stats:
    def __init__(self):
        self.count = 0
        self.max = 0.0
        self.square_sum = 0.0

    def add(self, value):
        self.count += 1
        self.max = max(self.max, value)
        self.square_sum += value * value

    def rms(self):
        return math.sqrt(self.square_sum / self.count) if self.count else 0.0

    def as_dict(self):
        return {"samples": self.count, "max": round(self.max, 3), "rms": round(self.rms(), 3)}


class Session:
    def __init__(self, device, log):
        self.device = device
        self.log = log
        self.packet_id = 1
        self.acked = None
        self.expected_id = None
        self.connected_at = None
        self.handlers = {}

    def poll(self):
        for message_type, payload in self.device.packets():
            if message_type == SYNC:
                if len(payload) == 4 and struct.unpack(">I", payload)[0] != REVISION:
                    self.log("protocol revision %i, expected %i" % (struct.unpack(">I", payload)[0], REVISION))
                if self.connected_at is None:
                    self.device.send(SYNC_ACK)
                    self.connected_at = time.time()
                    self.log("connected")
            elif message_type == HEARTBEAT:
                self.device.send(HEARTBEAT_ACK)
            elif message_type == DEBUG_LOG:
                self.log("[device] " + payload.decode("utf-8", "replace").rstrip("\x00\r\n"))
            elif message_type == PACKET_ACK:
                self.acked = payload[0]
            elif message_type == INVALID_PACKET_ID:
                self.expected_id = payload[0]
            elif message_type == INVALID_DATA:
                self.log("device reports invalid data")
            elif message_type in (BUFFER_CRITICAL, BUFFER_READY):
                self.log("device buffer %s" % ("critical" if message_type == BUFFER_CRITICAL else "ready"))
            elif message_type in self.handlers:
                self.handlers[message_type](payload)

    def send_tracked(self, message_type, payload, timeout=1.0, resend=0.1):
        """Sends a state-changing packet and waits for its ack, resending it. Returns whether it was acked."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            packet_id = self.packet_id
            self.acked = None
            self.expected_id = None
            self.device.serial.write(MAGIC + struct.pack(">BBH", message_type, packet_id, len(payload)) + payload)
            sent_at = time.time()
            while time.time() - sent_at < resend:
                self.poll()
                if self.acked == packet_id:
                    self.packet_id = packet_id % 255 + 1
                    return True
                if self.expected_id is not None:
                    break
            if self.expected_id is not None:
                if self.expected_id == packet_id % 255 + 1:
                    # a resend of a packet that already got through, only the ack was lost
                    self.packet_id = self.expected_id
                    return True
                # e.g. after --no-reset, the device still expects the id sequence of an earlier session
                self.log("device expects packet id %i, not %i" % (self.expected_id, packet_id))
                self.packet_id = self.expected_id
        self.log("no ack for message 0x%02X" % message_type)
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", default="/dev/cu.SLAB_USBtoUART")
    parser.add_argument("--panto", type=int, default=0xFF, help="0, 1 or 255 for both")
    parser.add_argument("--shape", default="plus", choices=["line", "plus", "square", "grid", "maze"])
    parser.add_argument("--center", default="0,-100", help="x,y in mm")
    parser.add_argument("--size", type=float, default=40, help="edge length in mm")
    parser.add_argument("--single-entry", action="store_true", help="only the first node is an entry node")
    parser.add_argument("--graph-id", type=int, default=0x23)
    parser.add_argument("--capture", type=float, default=5, help="capture radius in mm")
    parser.add_argument("--junction", type=float, default=4, help="junction radius in mm")
    parser.add_argument("--breakaway", type=float, default=15, help="breakaway distance in mm, 0 disables it")
    parser.add_argument("--sink-radius", type=float, default=0, help="sink radius around the nodes in mm, 0 disables them")
    parser.add_argument("--sink-depth", type=float, default=1.5, help="sink depth in mm, negative for bumps")
    parser.add_argument("--pid", default="-1,-1,-1", help="P,I,D, negative uses the hardware's forcePidFactor")
    parser.add_argument("--move-to-entry", action="store_true",
                        help="move the handle(s) to the first entry node, so they enter the graph on their own")
    parser.add_argument("--duration", type=float, default=0, help="seconds after enabling, 0 runs until Ctrl+C")
    parser.add_argument("--report", type=float, default=3, help="seconds between summaries")
    parser.add_argument("--plot", action="store_true", help="write plot.png (needs matplotlib)")
    parser.add_argument("--out", default="graphTest_" + time.strftime("%Y%m%d_%H%M%S"))
    parser.add_argument("--no-reset", action="store_true", help="don't reset the device before connecting")
    args = parser.parse_args()

    center = tuple(float(v) for v in args.center.split(","))
    pid = [float(v) for v in args.pid.split(",")]
    nodes, edges, entries = build_shape(args.shape, center, args.size, args.single_entry)
    segments = [(nodes[a], nodes[b]) for a, b in edges]
    pantos = [0, 1] if args.panto == 0xFF else [args.panto]

    os.makedirs(args.out, exist_ok=True)
    log_file = open(os.path.join(args.out, "log.txt"), "w")
    positions_file = open(os.path.join(args.out, "positions.csv"), "w")
    positions_file.write("time,panto,x,y,rotation,godX,godY,onGraph,godToGraph\n")
    with open(os.path.join(args.out, "graph.json"), "w") as graph_file:
        json.dump({"id": args.graph_id, "panto": args.panto, "shape": args.shape,
                   "sinkRadius": args.sink_radius, "sinkDepth": args.sink_depth,
                   "capture": args.capture, "junction": args.junction, "breakaway": args.breakaway, "pid": pid,
                   "nodes": {n: {"x": x, "y": y, "entry": n in entries} for n, (x, y) in nodes.items()},
                   "edges": edges}, graph_file, indent=2)

    begin = time.time()

    def log(text):
        line = "%7.2f %s" % (time.time() - begin, text)
        print(line, flush=True)
        log_file.write(line + "\n")
        log_file.flush()

    device = Device(args.port)
    if not args.no_reset:
        device.reset()
    session = Session(device, log)

    on_graph = {panto: False for panto in range(2)}
    events = []
    god_error = {panto: Stats() for panto in range(2)}   # god object distance to the closest edge
    groove_error = {panto: Stats() for panto in range(2)}  # handle distance to the god object
    window = {panto: (Stats(), Stats()) for panto in range(2)}
    traces = {panto: [] for panto in range(2)}
    problems = []
    last_flush = [0.0]

    def on_position(payload):
        now = time.time() - begin
        for panto in range(len(payload) // 20):
            x, y, rotation, god_x, god_y = struct.unpack(">5f", payload[panto * 20:panto * 20 + 20])
            to_graph = min(segment_distance((god_x, god_y), a, b) for a, b in segments)
            # the graph state message arrives after the positions of the frame the handle left in, from then on the
            # god object sits exactly on the handle again
            left_already = x == god_x and y == god_y and to_graph > 0.01
            if on_graph[panto] and not left_already:
                error = math.hypot(x - god_x, y - god_y)
                for stats, value in ((god_error[panto], to_graph), (window[panto][0], to_graph),
                                     (groove_error[panto], error), (window[panto][1], error)):
                    stats.add(value)
            traces[panto].append((x, y, god_x, god_y, on_graph[panto]))
            positions_file.write("%.4f,%i,%.3f,%.3f,%.3f,%.3f,%.3f,%i,%.3f\n"
                                 % (now, panto, x, y, rotation, god_x, god_y, on_graph[panto], to_graph))
        if now - last_flush[0] > 0.5:
            # flushed every half second, so a killed run still leaves its data
            positions_file.flush()
            last_flush[0] = now

    def on_graph_state(payload):
        panto, state, graph_id = payload[0], payload[1], struct.unpack(">H", payload[2:4])[0]
        on_graph[panto] = state == 1
        events.append({"time": round(time.time() - begin, 3), "panto": panto,
                       "state": "entered" if state == 1 else "left", "graph": graph_id})
        log("handle %i %s graph %i" % (panto, "entered" if state == 1 else "left", graph_id))
        if graph_id != args.graph_id:
            problems.append("graph state for unknown graph %i" % graph_id)

    def on_transition_ended(payload):
        log("transition ended: %s" % payload.hex())

    session.handlers = {POSITION: on_position, GRAPH_STATE: on_graph_state, TRANSITION_ENDED: on_transition_ended}

    def graph_header(panto=args.panto):
        return struct.pack(">BH", panto, args.graph_id)

    built = False
    try:
        while session.connected_at is None or time.time() - session.connected_at < 1.5:
            # let the god objects settle after the reset in the sync ack
            session.poll()
            if time.time() - begin > 15:
                log("could not connect")
                return 1

        log("building %s graph %i at (%.0f, %.0f), %i nodes, %i edges, entry nodes %s"
            % (args.shape, args.graph_id, center[0], center[1], len(nodes), len(edges), sorted(entries)))
        steps = [("create", CREATE_GRAPH, graph_header() + struct.pack(
            ">6f", args.capture, args.junction, args.breakaway, *pid))]
        if args.sink_radius > 0:
            # after creating, creating resets them
            steps.append(("sinks", SET_GRAPH_SINKS, graph_header() + struct.pack(">2f", args.sink_radius, args.sink_depth)))
        node_list = sorted(nodes)
        for start in range(0, len(node_list), NODES_PER_PACKET):
            payload = graph_header()
            for node in node_list[start:start + NODES_PER_PACKET]:
                payload += struct.pack(">HffB", node, nodes[node][0], nodes[node][1],
                                       NODE_ENTRY if node in entries else 0)
            steps.append(("nodes", ADD_GRAPH_NODES, payload))
        for start in range(0, len(edges), EDGES_PER_PACKET):
            payload = graph_header() + b"".join(struct.pack(">HH", a, b) for a, b in edges[start:start + EDGES_PER_PACKET])
            steps.append(("edges", ADD_GRAPH_EDGES, payload))
        steps.append(("enable", ENABLE_GRAPH, graph_header()))
        for name, message_type, payload in steps:
            if not session.send_tracked(message_type, payload):
                problems.append("%s not acknowledged" % name)
                return 1
        built = True
        log("graph enabled")
        for node in sorted(entries):
            log("  entry node %i at (%.1f, %.1f)" % (node, nodes[node][0], nodes[node][1]))

        if args.move_to_entry:
            entry = nodes[min(entries)]
            for panto in pantos:
                session.send_tracked(MOTOR, struct.pack(">BB3f", 0, panto, entry[0], entry[1], float("nan")))
            log("moving to entry node %i" % min(entries))
        else:
            log("move a handle onto an entry node to enter the graph")

        enabled_at = time.time()
        last_report = enabled_at
        while args.duration <= 0 or time.time() - enabled_at < args.duration:
            session.poll()
            if time.time() - last_report >= args.report:
                last_report = time.time()
                for panto in pantos:
                    god_window, groove_window = window[panto]
                    if god_window.count:
                        log("handle %i on graph: god object to graph max %.2f mm, handle to god object rms %.2f max %.2f mm"
                            % (panto, god_window.max, groove_window.rms(), groove_window.max))
                    window[panto] = (Stats(), Stats())
        log("duration over")
    except KeyboardInterrupt:
        log("interrupted")
    finally:
        if built:
            try:
                session.send_tracked(DISABLE_GRAPH, graph_header(), timeout=0.5)
                session.send_tracked(REMOVE_GRAPH, graph_header(), timeout=0.5)
                session.send_tracked(FREE, bytes([0xFF]), timeout=0.5)
                time.sleep(0.2)
                session.poll()
            except KeyboardInterrupt:
                pass
        for panto in pantos:
            if god_error[panto].max > 0.5:
                problems.append("handle %i: god object left the graph by %.2f mm" % (panto, god_error[panto].max))
        if built and not any(event["state"] == "entered" for event in events):
            problems.append("no handle entered the graph")
        if built and any(on_graph[panto] for panto in pantos):
            problems.append("no graph left event after disabling the graph")
        summary = {"events": events, "problems": problems,
                   "handles": {panto: {"godToGraph": god_error[panto].as_dict(),
                                       "handleToGod": groove_error[panto].as_dict()} for panto in pantos}}
        with open(os.path.join(args.out, "summary.json"), "w") as summary_file:
            json.dump(summary, summary_file, indent=2)
        for panto in pantos:
            log("handle %i total: god object to graph %s, handle to god object %s"
                % (panto, god_error[panto].as_dict(), groove_error[panto].as_dict()))
        for problem in problems:
            log("PROBLEM: " + problem)
        log_file.close()
        positions_file.close()
        if args.plot:
            plot(os.path.join(args.out, "plot.png"), segments, nodes, entries, traces, pantos, args.capture)
        print("written to", args.out)

    return 1 if problems else 0


def plot(path, segments, nodes, entries, traces, pantos, capture):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not installed, no plot")
        return
    figure, axes = plt.subplots(1, len(pantos), figsize=(7 * len(pantos), 7), squeeze=False)
    for axis, panto in zip(axes[0], pantos):
        for a, b in segments:
            axis.plot([a[0], b[0]], [a[1], b[1]], color="lightgray", linewidth=6, zorder=0)
        for node, (x, y) in nodes.items():
            if node in entries:
                axis.add_patch(plt.Circle((x, y), capture, fill=False, color="green", linestyle="--"))
            axis.annotate(str(node), (x, y), textcoords="offset points", xytext=(4, 4), fontsize=8)
        trace = traces[panto]
        if trace:
            axis.plot([t[0] for t in trace], [t[1] for t in trace], color="tab:blue", linewidth=0.6, label="handle")
            on = [t for t in trace if t[4]]
            axis.scatter([t[2] for t in on], [t[3] for t in on], s=1, color="tab:red", label="god object on graph")
        axis.set_title("handle %i" % panto)
        axis.set_aspect("equal")
        axis.legend(loc="upper right")
    figure.tight_layout()
    figure.savefig(path, dpi=150)
    print("plot written to", path)


if __name__ == "__main__":
    sys.exit(main())
