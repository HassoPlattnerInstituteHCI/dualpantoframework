/* eslint-disable require-jsdoc */
const fs = require('fs');

class FileCreator {
  constructor() {
    this.imports = 'const DualPantoFramework = require(\'./dualpantoframework' +
    '\');\nconst VoiceInteraction = DualPantoFramework.voiceInteraction;\n' +
    'const {Vector} = DualPantoFramework;\nconst fs = require(\'fs\');\nconst' +
    ' obstacles = [];\n';
    this.loadObstacles = '\nconst rawdata = fs.readFileSync(\'./obstacles.' +
    'json\');\nlet doomWalls = JSON.parse(rawdata);\nfor (let i = 0; i < ' +
    'doomWalls.length; i++) {\n  let obs = [];\n  for (let j = 0; j < ' +
    'doomWalls[i].length; j++) {\n    obs.push(new Vector(doomWalls[i][j].x,' +
    ' doomWalls[i][j].y, doomWalls[i][j].r));\n  }\n  obstacles[i] = obs\n}\n';
    this.waitForPanto = 'let device;\n\nDualPantoFramework.on(\'devices' +
    'Changed\', function(devices) {\n  for(const newdevice of devices) {\n' +
    '    if (!device) {\n      device = newdevice\n      start();\n    }' +
    '\n  }\n});\n';
    this.startFunction = '\nconst start = () => {\n  for (let i = 0; i < ' +
    'obstacles.length; i++) {\n    device.createObstacle(obstacles[i], 0);' +
    '\n  }\n}';
  }

  generateFile() {
    fs.writeFileSync('./main.js', this.imports + this.loadObstacles +
      this.waitForPanto + this.startFunction);
  }
}

module.exports = FileCreator;
