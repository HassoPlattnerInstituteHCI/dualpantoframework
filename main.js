//**********************
// REQUIRE
//**********************

const child_process = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      serial = require('./build/Release/serial'),
      Buffer = require('buffer').Buffer,
      Vector = require('./Vector.js'),
      DoomTutorial = require('./DoomTutorial.js')
      config = JSON.parse(fs.readFileSync('config.json')),
      persistent = JSON.parse(fs.readFileSync('persistent.json')), // TODO: Initalize
      TWEEN = require('@tweenjs/tween.js');

//**********************
// DOOM CONSTANTS
//**********************
const origin = new Vector(1500, -1000),
      scale = 20;

//**********************
// PANTO
//**********************
let upperPanto, lowerPanto;

//**********************
// ANIMATION AND TWEENING
//**********************
// Setup the tween animation loop.
const TWEEN_INTERVAL = 30; //ms
var tween_stack_counter = 0; //keeps track of how many tweens are going on so we only update when needed

function animateTween() {
    TWEEN.update();
    if(tween_stack_counter > 0) {
        setTimeout(animateTween, TWEEN_INTERVAL);
    }
}

//**********************
// DEBUG
//**********************

// Debugging without serial
const DEBUG_WITHOUT_SERIAL = true;
var SERIAL_EXISTS = true;

//**********************
// tutorial
//**********************
const doomTutorial = new DoomTutorial();


//**********************
// SERIAL COMMUNICATION
//**********************
try{
	serial.open(config.serialDevicePath);
} catch (e) {
    console.log("ERROR: No serial port attached.");
    if (DEBUG_WITHOUT_SERIAL)
    {
        console.log("DEBUG: DEBUG_WITHOUT_SERIAL is true, so running with SERIAL_EXISTS=false.");
        SERIAL_EXISTS = false;
    }
}
function serialRecv() {
    setImmediate(serialRecv);
    const packets = serial.poll();
    if(packets.length == 0)
        return;
    const packet = packets[packets.length-1];
    if(packet.length != 4*6)
        return;

    const values = [];
    for(let i = 0; i < 6; ++i)
        values[i] = packet.readFloatLE(i*4);
    upperPanto = new Vector(values[0], values[1], values[2]);
    lowerPanto = new Vector(values[3], values[4], values[5]);
}
if (SERIAL_EXISTS)
{
serialRecv();
}

function tweenPantoTo(index, target, duration, interpolation_method=TWEEN.Easing.Quadratic.Out)
{
    
    if (duration == undefined) {
        duration = 500;
    }
    var tweenPosition = undefined;
    if (index == 0 && upperPanto) {
        tweenPosition = upperPanto;
    } else if (index == 1 && lowerPanto) {
        tweenPosition = lowerPanto;
    }
    if(tweenPosition)
    {
        tween_stack_counter++;

        if(tween_stack_counter == 1)
        {
            setTimeout(animateTween, TWEEN_INTERVAL);
        }

        var tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.
            .to(target, duration)
            .easing(interpolation_method) // Use an easing function to make the animation smooth.
            .onUpdate(function() { // Called after tween.js updates 'tweenPosition'.
                movePantoTo(index, tweenPosition);
            })
            .onComplete(function() {
                tween_stack_counter--;
            })
            .start(); // Start the tween immediately.
        }
}

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

const proc = child_process.spawn(config.doomExecutablePath),
      enemyCache = {},
      collisionCache = {};

//TODO: Wrap this controller in an object/interface, pass it to doomTutorial instead of all these functions
doomTutorial.setDoomProcess(proc);
doomTutorial.setMovePantoFunction(tweenPantoTo);
doomTutorial.setDoomToPantoCoordFunction(doomToPantoCoord);

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
                // console.log(packet);
                doomTutorial.handlePlayer(packet);
                packet.pos = doomToPantoCoord(packet.pos);
                player = packet;
                // Send controls to DOOM
                if(SERIAL_EXISTS)
                {
                    if(upperPanto)
                        proc.stdin.write(pantoToDoomCoord(upperPanto).join(' ')+'\n');
                } else {
                    proc.stdin.write(pantoToDoomCoord(packet.pos).join(' ')+'\n');
                }
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
                // console.log(packet);
                packet.pos = doomToPantoCoord(packet.pos);
                enemyCache[packet.id] = packet;
                break;
            case 'impball':
                // console.log(packet);
                break;
            case 'dead':
                delete enemyCache[packet.id];
                break;
            case 'spawn':
                // console.log(packet);
                if(packet.class === "DoomPlayer")
                {
                    doomTutorial.handlePlayerSpawn(packet);
                } else {
                    doomTutorial.handleSpawn(packet);
                }
                break;
            case 'weaponchange':
                // console.log(packet);
                doomTutorial.handleWeaponChange(packet);
                break;
            case 'weaponshot':
                // console.log(packet);
                doomTutorial.handleWeaponShot(packet);
                break;
            case 'pickup':
                // console.log(packet);
                doomTutorial.handlePickup(packet);
                break;
            case 'key':
                // console.log(packet);
                doomTutorial.handleKeyPress(packet);
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
            doomTutorial.handleBookmark(bookmark.name);
        }
        bookmark.tic = player.tic;
        bookmark.active = true;
    }

    // Render haptics of collisions
    if (SERIAL_EXISTS)
{
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
}
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
    fs.writeFileSync('persistent.json', JSON.stringify(persistent, null, 2));
    process.exit(code);
});
