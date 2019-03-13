const fs = require('fs');

fs.copyFile(
    './Protocol/protocol.hpp', './Firmware/include/protocol.hpp',
    (err) => {
      if (err) throw err;
      console.log('copied protocol.hpp');
    });
fs.copyFile(
    './Protocol/protocol.cpp', './Firmware/lib/protocol.cpp',
    (err) => {
      if (err) throw err;
      console.log('copied protocol.cpp');
    });
