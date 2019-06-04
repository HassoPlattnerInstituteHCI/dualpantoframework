/* eslint-disable require-jsdoc */
const fs = require('fs');
const MeshCreator = require('./MeshCreator.js');
const Vector = require('../../lib/vector.js');

class FileCreator {
  constructor() {
    this.imports = 'const DualPantoFramework = require(\'./dualpantoframework' +
    '\');\n' +
    'const {Vector, Broker, Components, open} = DualPantoFramework;\n' +
    'const {\n  Mesh,\n' +
    '  MeshCollider,\n  BoxCollider,\n  BoxForcefield,\n' +
    '  MeshForcefield,\n' +
    '  MeshTrigger,\n' +
    '  BoxTrigger,\n' +
    '  MeshHardStep,\n' +
    '  BoxHardStep,\n' +
    '  ForcefieldSampleFunctions} = Components;\nconst fs = require(\'fs\');' +
    '\nconst VoiceInteraction = Broker.voiceInteraction;' +
    '\nconst obstacles = [];\n' +
    'const {PerformanceObserver, performance} = require(\'perf_hooks\');\n';
    this.loadObstacles = '\nconst rawdata = fs.readFileSync(\'./obstacles.' +
    'json\');\nlet walls = JSON.parse(rawdata);\nfor (let i = 0; i < ' +
    'walls.length; i++) {\n  let obs = [];\n  for (let j = 0; j < ' +
    'walls[i].length; j++) {\n    obs.push(new Vector(walls[i][j].x,' +
    ' walls[i][j].y, walls[i][j].r));\n  }\n  obstacles[i] = obs\n}\n\n';
    this.waitForPanto = 'let device;\n\nBroker.on(\'devices' +
    'Changed\', function(devices) {\n  for(const newdevice of devices) {\n' +
    '    if (!device) {\n      device = newdevice\n      start();\n    }' +
    '\n  }\n});\n';
    this.startFunction = '\nconst start = function () {' +
    '\n  open(\'http://localhost:8080/map.html\');' +
    '\n setTimeout(generateLevel, 3000);' +
    '\n}\n\n';
  }

  generateFile(hapticBoxObjects,
      hapticMeshObjects,
      studentDir, offset) {
    const meshCreator = new MeshCreator(offset.x,
        offset.y);
    let outputString = '';
    outputString = outputString.concat(this.imports);
    outputString = outputString.concat(this.waitForPanto);
    outputString = outputString.concat(this.startFunction);
    outputString = outputString.concat('const generateLevel = ' +
      'function () {\n  ');
    // add box objects
    for (let i = 0; i < hapticBoxObjects.length; i ++) {
      let mesh = this.generateMeshFromBox(hapticBoxObjects[i]);
      if (hapticBoxObjects[i].hasOwnProperty('matrix')) {
        mesh = this.applyMatrixToMesh(hapticBoxObjects[i].matrix, mesh);
      } else if (hapticBoxObjects[i].hasOwnProperty('translate')) {
        mesh = this.applyTranslateToMesh(hapticBoxObjects[i].translate, mesh);
      }
      mesh = this.transformMeshToPanto(mesh);
      outputString = this.addMeshToFile(hapticBoxObjects, i, mesh,
          outputString);
    }
    // add mesh Objects
    for (let i = 0; i < hapticMeshObjects.length; i++) {
      let mesh = meshCreator.parseSvgPath(hapticMeshObjects[i].data.d);
      if (hapticMeshObjects[i].hasOwnProperty('matrix')) {
        mesh = this.applyMatrixToMesh(hapticMeshObjects[i].matrix, mesh);
      } else if (hapticMeshObjects[i].hasOwnProperty('translate')) {
        mesh = this.applyTranslateToMesh(hapticMeshObjects[i].translate, mesh);
      }
      mesh = transformMeshToPanto(mesh);
      outputString = this.addMeshToFile(hapticMeshObjects[i], i, mesh,
          outputString);
    }
    outputString = outputString.concat('}\n');
    fs.writeFileSync(studentDir + '/prototype.js', outputString);
  }

  addMeshToFile(hapticMeshObjects, i, mesh, outputString) {
    outputString = outputString.concat('const hapticMeshObject' +
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
        'Component(new MeshTrigger(mesh' + i + '))\n  ');
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
      outputString = outputString.concat('const meshTriggerFor' + i +
        ' = hapticMeshObject' + i + '.add' +
      'Component(new MeshTrigger(mesh' + i + '))\n  ');
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
      outputString = outputString.concat('const meshTriggerFor' + i +
        ' = hapticMeshObject' + i + '.add' +
        'Component(new MeshTrigger(mesh' + i + '))\n  ');
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
      } else {
        outputString = outputString.concat('meshTriggerFor' + i +
          '.on(\'touch\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
    }
    if (hapticMeshObjects[i].triggerEndTouch) {
      outputString = outputString.concat('const meshTriggerFor' + i +
        ' = hapticMeshObject' + i + '.add' +
      'Component(new MeshTrigger(mesh' + i + '))\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('meshTriggerFor' + i +
          '.on(\'endTouch\', () => {VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\');});\n  ');
      } else {
        outputString = outputString.concat('meshTriggerFor' + i +
          '.on(\'endTouch\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
      outputString = outputString.concat('\n');
    }
    return outputString;
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

  parseTranslate(translateString) {
    const splits = translateString.split(',');
    return new Vector(parseFloat(splits[0]), parseFloat(splits[1]));
  }

  parseMatrix(matrixString, position) {
    let values = matrixString.split('(')[1].split(')')[0];
    values = values.split(',');
    for (let i = 0; i < values.length; i ++) {
      values[i] = parseFloat(values[i]);
    }
    const xVal = (values[0] * position.x) + (values[2] * position.y)
    + values[4];
    const yVal = (values[1] * position.x) + (values[3] * position.y)
    + values[5];
    return new Vector(xVal, yVal);
  }

  applyMatrixToMesh(matrixString, mesh) {
    for (let i = 0; i < mesh.length; i++) {
      mesh[i] = this.parseMatrix(matrixString, mesh[i]);
    }
    return mesh;
  }

  applyTranslateToMesh(translateString, mesh) {
    for (let i = 0; i < mesh.length; i++) {
      mesh[i] = mesh[i].sum(this.parseTranslate(translateString));
    }
    return mesh;
  }

  generateMeshFromBox(hapticBoxObject) {
    const mesh = [];
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x),
        parseFloat(hapticBoxObject.data.y)));
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x) +
      parseFloat(hapticBoxObject.data.width),
    parseFloat(hapticBoxObject.data.y)));
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x) +
      parseFloat(hapticBoxObject.data.width),
    parseFloat(hapticBoxObject.data.y) +
    parseFloat(hapticBoxObject.data.height)));
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x),
        parseFloat(hapticBoxObject.data.y) +
        parseFloat(hapticBoxObject.data.height)));
    return mesh;
  }

  transformMeshToPanto(mesh) {
    for (let i = 0; i < mesh.length; i++) {
      mesh[i] = new Vector(mesh[i].x - this.pantoxOffset, -(mesh[i].y) +
        this.pantoyOffset);
    }
    return mesh;
  }
}

module.exports = FileCreator;
