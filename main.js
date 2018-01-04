const child_process = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./node_modules/dpf/Vector.js'),
      Pantograph = require('./node_modules/dpf/Pantograph.js');
const base = new Vector(100, -100), scale = 10,
      upperPanto = new Pantograph(base),
      lowerPanto = new Pantograph(base);

serial.open(process.argv[2]);
function serialRecv() {
    setImmediate(serialRecv);
    const packets = serial.poll();
    if(packets.length == 0)
        return;

    const angles = [];
    for(const data of packets) // TODO: Optimize
        for(let i = 0; i < 9; ++i)
            angles[i] = data.readFloatLE(i*4);

    upperPanto.baseAngleL = angles[1]+Math.PI;
    upperPanto.baseAngleR = angles[0];
    upperPanto.forwardKinematics();
    upperPanto.pointerAngle = upperPanto.innerAngleR+angles[4];

    lowerPanto.baseAngleL = angles[3]+Math.PI;
    lowerPanto.baseAngleR = angles[2];
    lowerPanto.forwardKinematics();
    lowerPanto.pointerAngle = lowerPanto.innerAngleR+angles[5];

    // console.log('playerInput', playerInput);
}
serialRecv();

function doomToPantoCoord(pos) {
    return new Vector(pos[0]/scale, pos[1]/scale);
}

function pantoToDoomCoord(panto) {
    return [
        Math.round(panto.outer.x*scale),
        Math.round(panto.outer.y*scale),
        Math.round(panto.pointerAngle/Math.PI*180)
    ];
}

const proc = child_process.spawn('../gzdoom.app/Contents/MacOS/gzdoom'),
      enemyCache = {};
proc.stdout.on('data', (data) => {
    // Receive and analyse DOOMs output
    data = data.toString();
    let player;
    const walls = [];
    for(const line of data.split('\n')) {
        if(line.length == 0 || line[0] != '{')
            continue;
        if(line[line.length-1] != '}')
            continue;
        const packet = JSON.parse(line);
        switch(packet.type) {
            case 'player':
                packet.pos = doomToPantoCoord(packet.pos);
                player = packet;
                // Send controls to DOOM
                proc.stdin.write(pantoToDoomCoord(upperPanto).join(' ')+'\n');
                break;
            case 'wall':
                packet.begin = doomToPantoCoord(packet.begin);
                packet.end = doomToPantoCoord(packet.end);
                walls.push(packet);
                break;
            case 'enemy':
                packet.pos = doomToPantoCoord(packet.pos);
                enemyCache[packet.id] = packet;
                break;
            case 'dead':
                delete enemyCache[packet.id];
                break;
            case 'spawn':
                console.log(packet);
                break;
        }
    }

    // Wait for next frame / tic (marked by player packet)
    if(!player)
        return;

    const angles = [NaN, NaN];
    function movePantoTo(panto, target) {
        panto.target = target.difference(panto.base);
        panto.inverseKinematics();
        const index = (panto == upperPanto) ? 0 : 2;
        angles[index+1] = panto.targetAngleL-Math.PI;
        angles[index  ] = panto.targetAngleR;
        if(index == 2)
            angles[5] = -panto.pointerAngle/180*Math.PI;
    }

    // Calculate wall collisions and movement speed limit
    const dist = player.pos.difference(upperPanto.outer).length(),
          threshold = 150,
          force = new Vector(0, 0);
    if(dist > threshold)
        force.add(player.pos.difference(upperPanto.outer).scale((dist-threshold)/1000));
    else for(const wall of walls) {
        const begin = wall.begin,
              tangent = begin.difference(wall.end),
              normal = new Vector(-tangent.y, tangent.x).normalized(),
              distance = begin.difference(player.pos).dot(normal);
        let penetration = begin.difference(upperPanto.outer).dot(normal);
        if(distance > 0)
            penetration *= -1;
        if(penetration > 2)
            force.add(normal.scaled(0.2*penetration));
    }
    // Render force to upper panto (ME-Handle)
    if(force.length() > 0)
        movePantoTo(upperPanto, force.add(upperPanto.outer));

    // Find closest point of interest (POI)
    const poi = [];
    for(const id in enemyCache) {
        const enemy = enemyCache[id];
        enemy.distance = player.pos.difference(enemy.pos).length(),
        poi.push(enemy);
    }
    poi.sort(function(a, b) {
        return a.distance < b.distance;
    });
    // Render POI to lower panto (IT-Handle)
    if(poi.length > 0)
        movePantoTo(lowerPanto, poi[0].pos);

    // Send angles to pantograph
    data = new Buffer(5);
    for(let i = 0; i < 9; ++i) {
        if(angles[i] == undefined)
            continue;
        data[0] = i;
        data.writeFloatLE(angles[i], 1);
        serial.send(data);
    }
});
proc.stderr.on('error', (err) => {
    console.log(`error: ${err}`);
});
proc.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
    process.exit(code);
});
