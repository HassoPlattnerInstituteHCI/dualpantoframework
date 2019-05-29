/* eslint-disable require-jsdoc */
const fs = require('fs');

class FileCreator {
  constructor() {
    this.imports = 'const DualPantoFramework = require(\'./dualpantoframework' +
    '\');\nconst VoiceInteraction = DualPantoFramework.voiceInteraction;\n' +
    'const {Vector, Components} = DualPantoFramework;\nconst {\n  Mesh,\n' +
    '  MeshCollider,\n  BoxCollider,\n  BoxForcefield,\n' +
    '  MeshForcefield,\n' +
    '  MeshTrigger,\n' +
    '  BoxTrigger,\n' +
    '  MeshHardStep,\n' +
    '  BoxHardStep,\n' +
    '  ForcefieldSampleFunctions} = Components;\nconst fs = require(\'fs\');' +
    '\nconst open = require(\'open\');' +
    '\nconst obstacles = [];\n' +
    'const {PerformanceObserver, performance} = require(\'perf_hooks\');\n';
    this.loadObstacles = '\nconst rawdata = fs.readFileSync(\'./obstacles.' +
    'json\');\nlet walls = JSON.parse(rawdata);\nfor (let i = 0; i < ' +
    'walls.length; i++) {\n  let obs = [];\n  for (let j = 0; j < ' +
    'walls[i].length; j++) {\n    obs.push(new Vector(walls[i][j].x,' +
    ' walls[i][j].y, walls[i][j].r));\n  }\n  obstacles[i] = obs\n}\n\n';
    this.waitForPanto = 'let device;\n\nDualPantoFramework.on(\'devices' +
    'Changed\', function(devices) {\n  for(const newdevice of devices) {\n' +
    '    if (!device) {\n      device = newdevice\n      start();\n    }' +
    '\n  }\n});\n';
    this.startFunction = '\nconst start = function () {' +
    '\n  open(\'http://localhost:8080/map.html\');' +
    '\n setTimeout(generateLevel, 3000);' +
    '\n}\n\n';
    this.generateLevelFunction = 'const generateLevel = function () {' +
    '\n  const hapticObject = device.addHapticObject(new Vector(0, -100));' +
    '\n  const meshes = [];' +
    '\n  for (let i = 0; i < obstacles.length; i++) {' +
    '\n    meshes.push(hapticObject.addComponent(new Mesh(obstacles[i])));' +
    '\n    hapticObject.addComponent(new MeshCollider(meshes[i]));' +
    '\n  }' +
    '\n}\n';
  }

  generateFile() {
    fs.writeFileSync('./main.js', this.imports + this.loadObstacles +
      this.waitForPanto + this.startFunction + this.generateLevelFunction);
  }

  generateFileImproved(hapticObjects, studentDir, offset) {
    let outputString = '';
    outputString = outputString.concat(this.imports);
    outputString = outputString.concat(this.waitForPanto);
    outputString = outputString.concat(this.startFunction);
    outputString = outputString.concat('const generateLevel = ' +
      'function () {\n');
    for (let i = 0; i < hapticObjects.length; i ++) {
      outputString = outputString.concat('const hapticObject' +
        i + ' = device.addHapticObject(');
      outputString = outputString.concat(this.generateHOBoxVectors(
          hapticObjects[i], offset));
      outputString = outputString.concat(');\n');
      if (hapticObjects[i].collider) {
        outputString = outputString.concat('hapticObject' + i +
          '.add' +'Component(new BoxCollider(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0));\n');
      }
      if (hapticObjects[i].forcefield) {
        outputString = outputString.concat('hapticObject' + i +
          '.addComponent(\n' + '  new BoxForcefield(\n' +
        '    ' + this.generateBoxVector(hapticObjects[i]) + ',\n' +
        '    ForcefieldSampleFunctions.directedForce.bind(\n' +
        '      undefined,\n' +
        '      new Vector(' + hapticObjects[i].forceDirection.x + ', ' +
        -hapticObjects[i].forceDirection.y + '))));\n');
      }
      if (hapticObjects[i].polarForce) {
        outputString = outputString.concat('const centerPoint' + i + ' = ' +
        'new Vector(' + (hapticObjects[i].polarPoint.x - 170) + ', ' +
        (-(parseFloat(hapticObjects[i].polarPoint.y) + parseFloat(offset.y))
          + 5)+ ');\n');
        outputString = outputString.concat('let lastTic' + i + ' = 0;\n' +
        'let lastError' + i + ' = new Vector(0, 0, 0);\n' +
        'let p' + i + ' = 0.15;\n' +
        'let d' + i + ' = 3.5;\n' +
        'const polar' + i + ' = function(position, lastPosition) {\n' +
        '  const currentTic = performance.now();\n' +
        '  const deltaT = currentTic - lastTic' + i + ';\n' +
        '  let error = centerPoint' + i + '.difference(position);\n' +
        '  let forceDirection = error.scaled(p).add(error.' +
        'difference(lastError).scaled(d/deltaT));\n' +
        '  lastError' + i + ' = error;\n' +
        '  if(forceDirection.length() > 1){\n' +
        '    forceDirection = forceDirection.normalized();\n' +
        '  }\n' +
        '  lastTic' + i + ' = currentTic;\n' +
        '  return forceDirection;\n' +
        '}\n\n');
        outputString = outputString.concat('hapticObject' + i +
          '.addComponent(\n' + '  new BoxForcefield(\n' +
        '    ' + this.generateBoxVector(hapticObjects[i]) + ',\n' +
        '    polar' + i + ')\n);\n');
      }
      if (hapticObjects[i].hardStepIn) {
        outputString = outputString.concat('hapticObject' + i +
          '.addComponent(new BoxHardStep(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0, 3));\n');
      }
      if (hapticObjects[i].hardStepOut) {
        outputString = outputString.concat('hapticObject' + i +
          '.addComponent(new BoxHardStep(' +
        this.generateBoxVector(hapticObjects[i]) + ', 3, 0));\n');
      }
      if (hapticObjects[i].triggerEnter) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0))\n');
        if (hapticObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'enter\', () => {VoiceInteraction.playSound(\'' +
            hapticObjects[i].soundfile + '\');});\n');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'enter\', () => {VoiceInteraction.speakText(\'' +
            hapticObjects[i].speech + '\');});\n');
        }
      }
      if (hapticObjects[i].triggerInside) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0))\n');
        if (hapticObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('let playing' + i +
            ' = false;\n');
          outputString = outputString.concat('let player' + i + ';\n');
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'inside\', () => {\n' +
          '  if(!playing' + i + ') {\n' +
          '    player' + i + ' = VoiceInteraction.playSound(\'' +
          hapticObjects[i].soundfile + '\', true);\n' +
          '    playing' + i + ' = true;\n' +
          '  }\n' +
          '});\n'
          );
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'leave\', () => {\n' +
          '  if(playing' + i + ' && player' + i + ') {\n' +
          '    player' + i + '.stop();\n' +
          '    playing' + i + ' = false;\n' +
          '  }\n' +
          '});\n'
          );
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'inside\', () => {VoiceInteraction.speakText(\'' +
            hapticObjects[i].speech + '\');});\n');
        }
      }
      if (hapticObjects[i].triggerLeave) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticObject' + i + '.add' + 'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0))\n');
        if (hapticObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'leave\', () => {VoiceInteraction.playSound(\'' +
            hapticObjects[i].soundfile + '\');});\n');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'leave\', () => {VoiceInteraction.speakText(\'' +
            hapticObjects[i].speech + '\');});\n');
        }
      }
      if (hapticObjects[i].triggerStartTouch) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0))\n');
        if (hapticObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'startTouch\', () => {VoiceInteraction.playSound(\'' +
            hapticObjects[i].soundfile + '\');});\n');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'startTouch\', () => {VoiceInteraction.speakText(\'' +
            hapticObjects[i].speech + '\');});\n');
        }
      }
      if (hapticObjects[i].triggerTouch) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticObject' + i + '.add' + 'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0))\n');
        if (hapticObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('let playing' + i +' = false;\n');
          outputString = outputString.concat('let player' + i + ';\n');
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'touch\', () => {\n' +
          '  if(!playing' + i + ') {\n' +
          '    player' + i + ' = VoiceInteraction.playSound(\'' +
          hapticObjects[i].soundfile + '\', true);\n' +
          '    playing' + i + ' = true;\n' +
          '  }\n' +
          '});\n'
          );
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'endTouch\', () => {\n' +
          '  if(playing' + i + ' && player' + i + ') {\n' +
          '    player' + i + '.stop();\n' +
          '    playing' + i + ' = false;\n' +
          '  }\n' +
          '});\n'
          );
        }
      }
      if (hapticObjects[i].triggerEndTouch) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticObjects[i]) + ', 0))\n');
        if (hapticObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'endTouch\', () => {VoiceInteraction.playSound(\'' +
            hapticObjects[i].soundfile + '\');});\n');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'endTouch\', () => {VoiceInteraction.speakText(\'' +
            hapticObjects[i].speech + '\');});\n');
        }
      }
      outputString = outputString.concat('\n');
    }
    outputString = outputString.concat('\n}\n');
    fs.writeFileSync(studentDir + '/prototype.js', outputString);
  }

  generateHOBoxVectors(hapticObject, offset) {
    const midX = (parseFloat(hapticObject.data.x) +
      (hapticObject.data.width / 2) + parseFloat(offset.x) - 170);
    const midY = (-1 * (parseFloat(hapticObject.data.y) +
      (hapticObject.data.height / 2) + parseFloat(offset.y))) + 5;
    return 'new Vector(' + midX + ', ' + midY + ')';
  }

  generateBoxVector(hapticObject) {
    const sizeX = hapticObject.data.width;
    const sizeY = hapticObject.data.height;
    return 'new Vector(' + sizeX + ', ' + sizeY + ')';
  }
}

module.exports = FileCreator;
