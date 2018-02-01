const child_process = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      say = require('say'),
      serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      persistent = JSON.parse(fs.readFileSync('persistent.json'));
const origin = new Vector(1500, -1000),
      scale = 20;
let upperPanto, lowerPanto;

if(process.argv.length === 3)
    serial.open(process.argv[2]);
function serialRecv() {
    setImmediate(serialRecv);
    const packets = serial.poll();
    if(packets.length == 0)
        return;

    const values = [];
    for(let i = 0; i < 6; ++i)
        values[i] = packets[packets.length-1].readFloatLE(i*4);
    upperPanto = new Vector(values[0], values[1], values[2]);
    lowerPanto = new Vector(values[3], values[4], values[5]);
}
serialRecv();

function movePantoTo(index, target) {
    const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],
          data = new Buffer(1+3*4);
    data[0] = index;
    data.writeFloatLE(values[0], 1);
    data.writeFloatLE(values[1], 5);
    data.writeFloatLE(values[2], 9);
    serial.send(data);
}

function doomToPantoCoord(pos) {
    return new Vector((pos[0]-origin.x)/scale, (pos[1]-origin.y)/scale, pos[3]/180*Math.PI);
}

function pantoToDoomCoord(pos) {
    return [
        Math.round(pos.x*scale+origin.x),
        Math.round(pos.y*scale+origin.y),
        Math.round(pos.r/Math.PI*180)
    ];
}

const proc = child_process.spawn('../gzdoom.app/Contents/MacOS/gzdoom'),
      enemyCache = {},
      collisionCache = {};
proc.stdout.on('data', (data) => {
    // Receive and analyse DOOMs output
    data = data.toString();
    let player;
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
                if(upperPanto)
                    proc.stdin.write(pantoToDoomCoord(upperPanto).join(' ')+'\n');
                break;
            case 'wall':
                packet.begin = doomToPantoCoord(packet.begin);
                packet.end = doomToPantoCoord(packet.end);
                collisionCache[packet.id] = packet;
                break;
            case 'collision':
                packet.pos = doomToPantoCoord(packet.pos);
                collisionCache[packet.id] = packet;
                break;
            case 'enemy':
                packet.pos = doomToPantoCoord(packet.pos);
                enemyCache[packet.id] = packet;
                break;
            case 'dead':
                delete enemyCache[packet.id];
                break;
            case 'spawn':
            case 'weaponchange':
                console.log(packet);
                // TODO
                break;
            case 'bookmark':
                packet.pos = doomToPantoCoord(packet.pos);
                persistent.bookmarks.push(packet);
                break;
        }
    }

    // Wait for next frame / tic (marked by player packet)
    if(!player)
        return;

    // Check if the player reached a bookmarked spot
    for(const bookmark of persistent.bookmarks) {
        const dist = player.pos.difference(bookmark.pos).length(),
              radius = bookmark.radius * ((bookmark.active) ? 1.1 : 1.0);
        if(dist > radius) {
            bookmark.active = false;
            continue;
        }
        // Rising edge detection
        if(!bookmark.active) {
            console.log('Bookmark:', bookmark.name, bookmark.tic, player.tic);
            say.speak(bookmark.name, 'Alex', 1.0, (err) => {
                if(err) {
                    console.error(err);
                    return;
                }
            });
        }
        bookmark.tic = player.tic;
        bookmark.active = true;
    }

    // Render haptics of collisions
    const force = new Vector(0, 0);
    for(const id in collisionCache) {
        const collision = collisionCache[id];
        let normal, penetration;
        if(collision.type == 'wall') {
            const tangent = collision.begin.difference(collision.end);
            normal = new Vector(-tangent.y, tangent.x).normalized();
            const distance = collision.begin.difference(player.pos).dot(normal);
            penetration = collision.begin.difference(upperPanto).dot(normal);
            if(distance > 0)
                penetration *= -1;
        } else {
            normal = player.pos.difference(collision.pos).normalized();
            penetration = collision.pos.difference(upperPanto).dot(normal);
        }
        if(penetration > 2)
            force.add(normal.scaled(0.2*penetration));
        delete collisionCache[id];
    }
    // Calculate movement speed limit
    const dist = player.pos.difference(upperPanto).length(),
          threshold = 15;
    if(force.length() === 0 && dist > threshold)
        force.add(player.pos.difference(upperPanto).scale((dist-threshold)/1000));
    // Render force to upper panto (ME-Handle)
    movePantoTo(0, (force.length() > 0) ? upperPanto.sum(force) : undefined);

    // Find closest point of interest (POI)
    const poi = [];
    for(const id in enemyCache) {
        const enemy = enemyCache[id];
        if(!enemy.visible)
            continue;
        enemy.distance = player.pos.difference(enemy.pos).length(),
        poi.push(enemy);
    }
    poi.sort(function(a, b) {
        return a.distance > b.distance;
    });
    // Render POI to lower panto (IT-Handle)
    movePantoTo(1, (poi.length > 0) ? poi[0].pos : undefined);
});
proc.stderr.on('error', (err) => {
    console.log(`error: ${err}`);
});
proc.on('exit', (code) => {
    console.log(`DOOM exited with code ${code}`);
    // Release motors
    movePantoTo(0);
    movePantoTo(1);
    // Save persistent
    fs.writeFileSync('persistent.json', JSON.stringify(persistent));
    process.exit(code);
});
