const fs = require('fs');

const targets = ["ESP32"];

for (const target of targets) {
  fs.copyFile('./Protocol/protocol.hpp', './Firmware/' + target + '/protocol.hpp', (err) => {
    if (err) throw err;
    console.log('copied protocol.hpp to ' + target);
  });
  fs.copyFile('./Protocol/protocol.cpp', './Firmware/' + target + '/protocol.cpp', (err) => {
    if (err) throw err;
    console.log('copied protocol.cpp to ' + target);
  });
}
