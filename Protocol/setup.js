const fs = require('fs');

fs.copyFile('./Protocol/protocol.hpp', './Firmware/shared/include/serial/protocol.hpp', (err) => {
  if (err) throw err;
  console.log('copied protocol.hpp to ' + target);
});
fs.copyFile('./Protocol/protocol.cpp', './Firmware/shared/lib/serial/protocol.hpp', (err) => {
  if (err) throw err;
  console.log('copied protocol.cpp to ' + target);
});