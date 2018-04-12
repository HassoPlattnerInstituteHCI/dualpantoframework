// test script for circleci
var SerialPort = require('serialport');
const serial = require('../build/Release/serial');
var Vector = require('./Vector.js');
serial.test();


try{
	serial.open("/dev/cu.usbmodem1411");
} catch (e) {
    console.log("ERROR: No serial port attached.");
    if (DEBUG_WITHOUT_SERIAL)
    {
        console.log("DEBUG: DEBUG_WITHOUT_SERIAL is true, so running with SERIAL_EXISTS=false.");
        SERIAL_EXISTS = false;
    }
}
serialRecv();
function connectArduino(port){
    // try{
    //     console.log('opening...');
    //     serial.open("/dev/cu.usbmodem1411");
    // } catch (e) {
    //     console.error(e);
    //     console.log("ERROR: No serial port attached.");
    // }
       
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
    console.log(values[0]);
}
function getConnectedArduino(callback) {
    // var arduinoport = "";
    // SerialPort.list(function(err, ports) {
    //   var allports = ports.length;
    //   var count = 0;
    //   var done = false
    //   ports.forEach(function(port) {
    //     // console.log(port);
    //     count += 1;
    //     pm = port['manufacturer'];
    //     if (typeof pm !== 'undefined' && pm.includes('Arduino') ) {
    //       arduinoport = port.comName.toString();
    //       done = true;
    //       callback(arduinoport);
    //     //   console.log('your panto is found!');
    //       return arduinoport;
    //     }
    //     if (count === allports && done === false) {
    //        console.log('cant find arduino')
    //     }
    //   });
    // });
}

getConnectedArduino(connectArduino);


