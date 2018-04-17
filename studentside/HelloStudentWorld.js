const usbport = '/dev/cu.usbmodem1421', //port where the panto is plugged in
      PantoConnector = require('./dualpantoframework/Framework.js'),//loads the panto handling component
      Vector = require('./dualpantoframework/Vector.js');
      
connector = new PantoConnector(usbport);
connector.run_script([
  () => connector.movePantoTo(0, new Vector(-60, -80, 0), 500),
  () => connector.waitMS(500),
  () => connector.unblockHandle(0),
  ]);
