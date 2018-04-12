// test script for circleci
var SerialPort = require('serialport');
const serial = require('../build/Release/serial');
var Vector = require('./Vector.js');
serial.test();
function connectArduino(port){
    console.log(port);
    try{
        //MACUSERS
        serial.open(port.replace("tty.", "cu."));
        //OTHER USERS
        // serial.open("YOUR_PORT_NAME");
    } catch (e) {
        console.log("ERROR: No serial port attached.");
        console.log("ERROR: Your serial port name could be different. Please ask TA for help. Or, you can go /dev/ directory to find your arduino port. Change source code on ./Utils/test.js");
        process.exit();
    }
    finally{
        serialRecv();
        console.log("TIPS: If you don't see numbers displayed on terminal, check the usb cable is connected on Native USB port on Arduino DUE.\nCTRL+c to abort.");
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
    console.log(values[0] + " " + values[1] + " " + values[2] + " " + values[3] + " " + values[4] + " " + values[5]);
}
function getConnectedArduino(callback) {
    var arduinoport = "";
    SerialPort.list(function(err, ports) {
      var allports = ports.length;
      var count = 0;
      var done = false
      ports.forEach(function(port) {
        // console.log(port);
        count += 1;
        pm = port['manufacturer'];
        if (typeof pm !== 'undefined' && pm.includes('Arduino') ) {
          arduinoport = port.comName.toString();
          done = true;
          callback(arduinoport);
          console.log("your panto is found!");
          return arduinoport;
        }
        if (count === allports && done === false) {
           console.log('ERROR: cant find arduino...');
           console.log("ERROR: Connect your Arduino Due's Native USB port. Make sure it's connected also to your PC.");
        }
      });
    });
}

getConnectedArduino(connectArduino);


