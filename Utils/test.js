// test script for circleci
var SerialPort = require('serialport');
const serial = require('../build/Release/serial');
serial.test();

function connectArduino(port){
    console.log(port);
    //TODO write test script.
    // try{
    //     serial.open(port);
    // } catch (e) {
    //     console.log("ERROR: No serial port attached.");
    //     if (DEBUG_WITHOUT_SERIAL)
    //     {
    //         console.log("DEBUG: DEBUG_WITHOUT_SERIAL is true, so running with SERIAL_EXISTS=false.");
    //         SERIAL_EXISTS = false;
    //     }
    // }
    // console.log("your serial is connected!");
    // serial.close(port);
}


function getConnectedArduino(callback) {
    var arduinoport = "";
    SerialPort.list(function(err, ports) {
      var allports = ports.length;
      var count = 0;
      var done = false
      ports.forEach(function(port) {
        count += 1;
        pm = port['manufacturer'];
        if (typeof pm !== 'undefined' && pm.includes('arduino')) {
          arduinoport = port.comName.toString();
          done = true;
          callback(arduinoport);
          console.log('your arduino is found');
          return arduinoport;
        }
        if (count === allports && done === false) {
           console.log('cant find arduino')
        }
      });
    });
}

getConnectedArduino(connectArduino);


