/* eslint-disable require-jsdoc */
const fs = require('fs');
const MeshCreator = require('./MeshCreator.js');

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
    this.pantoxOffset = 170;
    this.pantoyOffset = 5;
  }

  generateFile() {
    fs.writeFileSync('./main.js', this.imports + this.loadObstacles +
      this.waitForPanto + this.startFunction + this.generateLevelFunction);
  }

  generateFileImproved(hapticBoxObjects,
      hapticMeshObjects,
      studentDir, offset) {
    const meshCreator = new MeshCreator(offset.x,
        offset.y,
        this.pantoxOffset,
        this.pantoyOffset);
    let outputString = '';
    outputString = outputString.concat(this.imports);
    outputString = outputString.concat(this.waitForPanto);
    outputString = outputString.concat(this.startFunction);
    outputString = outputString.concat('const generateLevel = ' +
      'function () {\n  ');
    // add box objects
    for (let i = 0; i < hapticBoxObjects.length; i ++) {
      outputString = outputString.concat('const hapticBoxObject' +
        i + ' = device.addHapticObject(');
      outputString = outputString.concat(this.generateHOBoxVectors(
          hapticBoxObjects[i], offset));
      outputString = outputString.concat(');\n  ');
      if (hapticBoxObjects[i].collider) {
        outputString = outputString.concat('hapticBoxObject' + i +
          '.add' +'Component(new BoxCollider(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0));\n  ');
      }
      if (hapticBoxObjects[i].forcefield) {
        outputString = outputString.concat('hapticBoxObject' + i +
          '.addComponent(\n  ' + '  new BoxForcefield(\n  ' +
        '    ' + this.generateBoxVector(hapticBoxObjects[i]) + ',\n  ' +
        '    ForcefieldSampleFunctions.directedForce.bind(\n  ' +
        '      undefined,\n  ' +
        '      new Vector(' + hapticBoxObjects[i].forceDirection.x + ', ' +
        -hapticBoxObjects[i].forceDirection.y + '))));\n  ');
      }
      if (hapticBoxObjects[i].polarForce) {
        outputString = outputString.concat('const centerPoint' + i + ' = ' +
        'new Vector('
        + (hapticBoxObjects[i].polarPoint.x - this.pantoxOffset) + ', ' +
        (-(parseFloat(hapticBoxObjects[i].polarPoint.y) + parseFloat(offset.y))
          + this.pantoyOffset)+ ');\n  ');
        outputString = outputString.concat('let lastTic' + i + ' = 0;\n  ' +
        'let lastError' + i + ' = new Vector(0, 0, 0);\n  ' +
        'let p' + i + ' = 0.15;\n  ' +
        'let d' + i + ' = 3.5;\n  ' +
        'const polar' + i + ' = function(position, lastPosition) {\n  ' +
        '  const currentTic = performance.now();\n  ' +
        '  const deltaT = currentTic - lastTic' + i + ';\n  ' +
        '  let error = centerPoint' + i + '.difference(position);\n  ' +
        '  let forceDirection = error.scaled(p).add(error.' +
        'difference(lastError).scaled(d/deltaT));\n  ' +
        '  lastError' + i + ' = error;\n  ' +
        '  if(forceDirection.length() > 1){\n  ' +
        '    forceDirection = forceDirection.normalized();\n  ' +
        '  }\n  ' +
        '  lastTic' + i + ' = currentTic;\n  ' +
        '  return forceDirection;\n  ' +
        '}\n  \n  ');
        outputString = outputString.concat('hapticBoxObject' + i +
          '.addComponent(\n  ' + '  new BoxForcefield(\n  ' +
        '    ' + this.generateBoxVector(hapticBoxObjects[i]) + ',\n  ' +
        '    polar' + i + ')\n  );\n  ');
      }
      if (hapticBoxObjects[i].hardStepIn) {
        outputString = outputString.concat('hapticBoxObject' + i +
          '.addComponent(new BoxHardStep(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0, 3));\n  ');
      }
      if (hapticBoxObjects[i].hardStepOut) {
        outputString = outputString.concat('hapticBoxObject' + i +
          '.addComponent(new BoxHardStep(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 3, 0));\n  ');
      }
      if (hapticBoxObjects[i].triggerEnter) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticBoxObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0))\n  ');
        if (hapticBoxObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'enter\', () => {VoiceInteraction.playSound(\'' +
            hapticBoxObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'enter\', () => {VoiceInteraction.speakText(\'' +
            hapticBoxObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticBoxObjects[i].triggerInside) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticBoxObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0))\n  ');
        if (hapticBoxObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('let playing' + i +
            ' = false;\n  ');
          outputString = outputString.concat('let player' + i + ';\n  ');
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'inside\', () => {\n  ' +
          '  if(!playing' + i + ') {\n  ' +
          '    player' + i + ' = VoiceInteraction.playSound(\'' +
          hapticBoxObjects[i].soundfile + '\', true);\n  ' +
          '    playing' + i + ' = true;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'leave\', () => {\n  ' +
          '  if(playing' + i + ' && player' + i + ') {\n  ' +
          '    player' + i + '.stop();\n  ' +
          '    playing' + i + ' = false;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'inside\', () => {VoiceInteraction.speakText(\'' +
            hapticBoxObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticBoxObjects[i].triggerLeave) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticBoxObject' + i + '.add' + 'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0))\n  ');
        if (hapticBoxObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'leave\', () => {VoiceInteraction.playSound(\'' +
            hapticBoxObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'leave\', () => {VoiceInteraction.speakText(\'' +
            hapticBoxObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticBoxObjects[i].triggerStartTouch) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticBoxObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0))\n  ');
        if (hapticBoxObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'startTouch\', () => {VoiceInteraction.playSound(\'' +
            hapticBoxObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'startTouch\', () => {VoiceInteraction.speakText(\'' +
            hapticBoxObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticBoxObjects[i].triggerTouch) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticBoxObject' + i + '.add' + 'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0))\n  ');
        if (hapticBoxObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('let playing' + i +
            ' = false;\n  ');
          outputString = outputString.concat('let player' + i + ';\n  ');
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'touch\', () => {\n  ' +
          '  if(!playing' + i + ') {\n  ' +
          '    player' + i + ' = VoiceInteraction.playSound(\'' +
          hapticBoxObjects[i].soundfile + '\', true);\n  ' +
          '    playing' + i + ' = true;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'endTouch\', () => {\n  ' +
          '  if(playing' + i + ' && player' + i + ') {\n  ' +
          '    player' + i + '.stop();\n  ' +
          '    playing' + i + ' = false;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
        }
      }
      if (hapticBoxObjects[i].triggerEndTouch) {
        outputString = outputString.concat('const triggerFor' + i +
          ' = hapticBoxObject' + i + '.add' +
        'Component(new BoxTrigger(' +
        this.generateBoxVector(hapticBoxObjects[i]) + ', 0))\n  ');
        if (hapticBoxObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'endTouch\', () => {VoiceInteraction.playSound(\'' +
            hapticBoxObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('triggerFor' + i +
            '.on(\'endTouch\', () => {VoiceInteraction.speakText(\'' +
            hapticBoxObjects[i].speech + '\');});\n  ');
        }
      }
      outputString = outputString.concat('\n  ');
    }
    // add mesh Objects
    for (let i = 0; i < hapticMeshObjects.length; i++) {
      const mesh = meshCreator.parseSvgPath(hapticMeshObjects[i].data.d);
      outputString = outputString.concat('  const hapticMeshObject' +
        i + ' = device.addHapticObject(');
      outputString = outputString.concat(this.generateVecString(mesh[0]));
      outputString = outputString.concat(');\n  ');
      outputString = outputString.concat('const mesh' + i +
        ' = hapticMeshObject' + i + '.addComponent(' +
      this.generateMeshString(mesh) + ');\n  ');
      if (hapticMeshObjects[i].collider) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(new MeshCollider(mesh' + i + '));\n  ');
      }
      if (hapticMeshObjects[i].forcefield) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(\n  ' + '  new MeshForcefield(\n  ' +
        '    mesh' + i + ',\n  ' +
        '    ForcefieldSampleFunctions.directedForce.bind(\n  ' +
        '      undefined,\n  ' +
        '      new Vector(' + hapticMeshObjects[i].forceDirection.x + ', ' +
        -hapticMeshObjects[i].forceDirection.y + '))));\n  ');
      }
      if (hapticMeshObjects[i].polarForce) {
        outputString = outputString.concat('const centerPoint' + i + ' = ' +
        'new Vector(' +
        (hapticMeshObjects[i].polarPoint.x - this.pantoxOffset) + ', ' +
        (-(parseFloat(hapticMeshObjects[i].polarPoint.y) + parseFloat(offset.y))
          + this.pantoyOffset)+ ');\n  ');
        outputString = outputString.concat('let lastTic' + i + ' = 0;\n  ' +
        'let lastError' + i + ' = new Vector(0, 0, 0);\n  ' +
        'let p' + i + ' = 0.15;\n  ' +
        'let d' + i + ' = 3.5;\n  ' +
        'const polar' + i + ' = function(position, lastPosition) {\n  ' +
        '  const currentTic = performance.now();\n  ' +
        '  const deltaT = currentTic - lastTic' + i + ';\n  ' +
        '  let error = centerPoint' + i + '.difference(position);\n  ' +
        '  let forceDirection = error.scaled(p).add(error.' +
        'difference(lastError).scaled(d/deltaT));\n  ' +
        '  lastError' + i + ' = error;\n  ' +
        '  if(forceDirection.length() > 1){\n  ' +
        '    forceDirection = forceDirection.normalized();\n  ' +
        '  }\n  ' +
        '  lastTic' + i + ' = currentTic;\n  ' +
        '  return forceDirection;\n  ' +
        '}\n  \n  ');
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(\n  ' + '  new MeshForcefield(\n  ' +
        '    mesh' + i + ',\n  ' +
        '    polar' + i + ')\n  );\n  ');
      }
      if (hapticMeshObjects[i].hardStepIn) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(new MeshHardStep(mesh' + i + ', 0, 3));\n  ');
      }
      if (hapticMeshObjects[i].hardStepOut) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(new MeshHardStep(mesh' + i + ', 3, 0));\n  ');
      }
      if (hapticMeshObjects[i].triggerEnter) {
        outputString = outputString.concat('const meshTriggerFor' + i +
          ' = hapticMeshObject' + i + '.add' +
        'Component(new MeshTrigger(mesh' + i + '))\n  ');
        if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'enter\', () => {VoiceInteraction.playSound(\'' +
            hapticMeshObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'enter\', () => {VoiceInteraction.speakText(\'' +
            hapticMeshObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticMeshObjects[i].triggerInside) {
        outputString = outputString.concat('const meshTriggerFor' + i +
          ' = hapticMeshObject' + i + '.add' +
        'Component(new MeshTrigger(mesh' + i + ')\n  ');
        if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('let playing' + i +
            ' = false;\n  ');
          outputString = outputString.concat('let player' + i + ';\n  ');
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'inside\', () => {\n  ' +
          '  if(!playing' + i + ') {\n  ' +
          '    player' + i + ' = VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\', true);\n  ' +
          '    playing' + i + ' = true;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'leave\', () => {\n  ' +
          '  if(playing' + i + ' && player' + i + ') {\n  ' +
          '    player' + i + '.stop();\n  ' +
          '    playing' + i + ' = false;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
        } else {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'inside\', () => {VoiceInteraction.speakText(\'' +
            hapticMeshObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticMeshObjects[i].triggerLeave) {
        outputString = outputString.concat('const meshTriggerFor' + i +
          ' = hapticMeshObject' + i + '.add' +
          'Component(new MeshTrigger(mesh' + i + ')\n  ');
        if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'leave\', () => {VoiceInteraction.playSound(\'' +
            hapticMeshObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'leave\', () => {VoiceInteraction.speakText(\'' +
            hapticMeshObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticMeshObjects[i].triggerStartTouch) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(new MeshCollider(mesh' + i + '));\n  ');
        outputString = outputString.concat('const meshTriggerFor' + i +
          ' = hapticMeshObject' + i + '.add' +
        'Component(new MeshTrigger(mesh' + i + ')\n  ');
        if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'startTouch\', () => {VoiceInteraction.playSound(\'' +
            hapticMeshObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'startTouch\', () => {VoiceInteraction.speakText(\'' +
            hapticMeshObjects[i].speech + '\');});\n  ');
        }
      }
      if (hapticMeshObjects[i].triggerTouch) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(new MeshCollider(mesh' + i + '));\n  ');
        outputString = outputString.concat('const meshTriggerFor' + i +
          ' = hapticMeshObject' + i + '.add' +
          'Component(new MeshTrigger(mesh' + i + ')\n  ');
        if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('let playing' + i +
            ' = false;\n  ');
          outputString = outputString.concat('let player' + i + ';\n  ');
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'touch\', () => {\n  ' +
          '  if(!playing' + i + ') {\n  ' +
          '    player' + i + ' = VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\', true);\n  ' +
          '    playing' + i + ' = true;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'endTouch\', () => {\n  ' +
          '  if(playing' + i + ' && player' + i + ') {\n  ' +
          '    player' + i + '.stop();\n  ' +
          '    playing' + i + ' = false;\n  ' +
          '  }\n  ' +
          '});\n  '
          );
        }
      }
      if (hapticMeshObjects[i].triggerEndTouch) {
        outputString = outputString.concat('hapticMeshObject' + i +
          '.addComponent(new MeshCollider(mesh' + i + '));\n  ');
        outputString = outputString.concat('const meshTriggerFor' + i +
          ' = hapticMeshObject' + i + '.add' +
        'Component(new MeshTrigger(mesh' + i + ')\n  ');
        if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'endTouch\', () => {VoiceInteraction.playSound(\'' +
            hapticMeshObjects[i].soundfile + '\');});\n  ');
        } else {
          outputString = outputString.concat('meshTriggerFor' + i +
            '.on(\'endTouch\', () => {VoiceInteraction.speakText(\'' +
            hapticMeshObjects[i].speech + '\');});\n  ');
        }
      }
      outputString = outputString.concat('\n');
    }
    outputString = outputString.concat('}\n');
    fs.writeFileSync(studentDir + '/prototype.js', outputString);
  }

  generateHOBoxVectors(hapticObject, offset) {
    const midX = (parseFloat(hapticObject.data.x) +
      (hapticObject.data.width / 2) + parseFloat(offset.x) -
      this.pantoxOffset);
    const midY = (-1 * (parseFloat(hapticObject.data.y) +
      (hapticObject.data.height / 2) + parseFloat(offset.y))) +
    this.pantoyOffset;
    return 'new Vector(' + midX + ', ' + midY + ')';
  }

  generateBoxVector(hapticObject) {
    const sizeX = hapticObject.data.width;
    const sizeY = hapticObject.data.height;
    return 'new Vector(' + sizeX + ', ' + sizeY + ')';
  }

  generateVecString(vector) {
    return 'new Vector(' + vector.x + ', ' + vector.y + ')';
  }

  generateMeshString(mesh) {
    let meshstring = 'new Mesh([\n';
    for (let i = 0; i < mesh.length; i++) {
      meshstring = meshstring.concat('    ' +
          this.generateVecString(mesh[i].difference(mesh[0])));
      meshstring = meshstring.concat(',\n');
    }
    meshstring = meshstring.concat('  ])');
    return meshstring;
  }
}

module.exports = FileCreator;
