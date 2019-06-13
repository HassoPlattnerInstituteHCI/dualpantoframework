'use strict';
const fs = require('fs');
const MeshCreator = require('./MeshCreator.js');
const Vector = require('../../lib/vector.js');

/**
 * @description Class for code generation.
 */
class FileCreator {
  /**
   * @description Creates a new instance of FileCreator.
   */
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
    'const {PerformanceObserver, performance} = require(\'perf_hooks\');\n';
    this.waitForPanto = 'let device;\n\nBroker.on(\'devices' +
    'Changed\', function(devices) {\n  for(const newdevice of devices) {\n' +
    '    if (!device) {\n      device = newdevice\n      start();\n    }' +
    '\n  }\n});\n';
    this.startFunction = '\nconst start = function () {' +
    '\n  open(\'http://localhost:8080/map.html\');' +
    '\n setTimeout(generateLevel, 3000);' +
    '\n}\n\n';
    this.pantoxOffset = 175;
    this.pantoyOffset = 5;
    this.objectsGenerated = 0;
  }

  /**
   * @private This is an internal function.
   * @description Generates file out of found objects in .svg files.
   * @param {Array} hapticBoxObjects - Array containing found boxed objects.
   * @param {Array} hapticMeshObjects - Array containing found polygon objects.
   * @param {string} studentDir - String containing the path of student
   * directory.
   * @param {Vector} offset - Vector containing the overall ofset of the svg.
   */
  generateFile(hapticBoxObjects,
      hapticMeshObjects,
      studentDir, offset) {
    const meshCreator = new MeshCreator(offset.x,
        offset.y);
    let outputString = '\'use strict\';\n';
    outputString = outputString.concat(this.imports);
    outputString = outputString.concat(this.waitForPanto);
    outputString = outputString.concat(this.startFunction);
    outputString = outputString.concat('const generateLevel = ' +
      'function () {\n  ');
    // add box objects
    for (let i = 0; i < hapticBoxObjects.length; i ++) {
      let mesh = this.generateMeshFromBox(hapticBoxObjects[i], offset);
      if (hapticBoxObjects[i].hasOwnProperty('matrix')) {
        mesh = this.applyMatrixToMesh(hapticBoxObjects[i].matrix, mesh);
      } else if (hapticBoxObjects[i].hasOwnProperty('translate')) {
        mesh = this.applyTranslateToMesh(hapticBoxObjects[i].translate, mesh);
      }
      console.log(mesh);
      console.log();
      mesh = this.transformMeshToPanto(mesh);
      console.log(mesh);
      console.log();
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
      mesh = this.transformMeshToPanto(mesh);
      outputString = this.addMeshToFile(hapticMeshObjects, i, mesh,
          outputString);
    }
    outputString = outputString.concat('}\n');
    fs.writeFileSync(studentDir + '/prototype.js', outputString);
  }

  /**
   * @private This is an internal function.
   * @description Creates code for a concrete object.
   * @param {Array} hapticMeshObjects - Array containing found polygon objects.
   * @param {number} i - Index of current object inside the Array.
   * @param {Array} mesh - Array of Vectors defining postions of verticies.
   * @param {string} outputString - String that contains the created code.
   * @return {string} String that contains the created code.
   */
  addMeshToFile(hapticMeshObjects, i, mesh, outputString) {
    outputString = outputString.concat('const hapticMeshObject' +
      this.objectsGenerated + ' = device.addHapticObject(');
    outputString = outputString.concat(this.generateVecString(mesh[0]));
    outputString = outputString.concat(');\n  ');
    outputString = outputString.concat('const mesh' +
      this.objectsGenerated +
      ' = hapticMeshObject' + this.objectsGenerated + '.addComponent(' +
    this.generateMeshString(mesh) + ');\n  ');
    if (hapticMeshObjects[i].collider) {
      outputString = outputString.concat('hapticMeshObject' +
        this.objectsGenerated +
        '.addComponent(new MeshCollider(mesh' +
        this.objectsGenerated + '));\n  ');
    }
    if (hapticMeshObjects[i].forcefield) {
      outputString = outputString.concat('hapticMeshObject' +
        this.objectsGenerated +
        '.addComponent(\n  ' + '  new MeshForcefield(\n  ' +
      '    mesh' + this.objectsGenerated + ',\n  ' +
      '    ForcefieldSampleFunctions.directedForce.bind(\n  ' +
      '      undefined,\n  ' +
      '      new Vector(' + hapticMeshObjects[i].forceDirection.x + ', ' +
      -hapticMeshObjects[i].forceDirection.y + '))));\n  ');
    }
    if (hapticMeshObjects[i].polarForce) {
      outputString = outputString.concat('const centerPoint' +
        this.objectsGenerated + ' = ' +
      'new Vector(' +
      (hapticMeshObjects[i].polarPoint.x - this.pantoxOffset) + ', ' +
      (-(parseFloat(hapticMeshObjects[i].polarPoint.y) + parseFloat(offset.y))
        + this.pantoyOffset)+ ');\n  ');
      outputString = outputString.concat('let lastTic'
        + this.objectsGenerated + ' = 0;\n  ' +
      'let lastError' + this.objectsGenerated + ' = new Vector(0, 0, 0);\n  ' +
      'let p' + this.objectsGenerated + ' = 0.15;\n  ' +
      'let d' + this.objectsGenerated + ' = 3.5;\n  ' +
      'const polar' + this.objectsGenerated +
      ' = function(position, lastPosition) {\n  ' +
      '  const currentTic = performance.now();\n  ' +
      '  const deltaT = currentTic - lastTic' + this.objectsGenerated +
      ';\n  ' +
      '  let error = centerPoint' + this.objectsGenerated +
      '.difference(position);\n  ' +
      '  let forceDirection = error.scaled(p).add(error.' +
      'difference(lastError).scaled(d/deltaT));\n  ' +
      '  lastError' + this.objectsGenerated + ' = error;\n  ' +
      '  if(forceDirection.length() > 1){\n  ' +
      '    forceDirection = forceDirection.normalized();\n  ' +
      '  }\n  ' +
      '  lastTic' + this.objectsGenerated + ' = currentTic;\n  ' +
      '  return forceDirection;\n  ' +
      '}\n  \n  ');
      outputString = outputString.concat('hapticMeshObject' +
        this.objectsGenerated +
        '.addComponent(\n  ' + '  new MeshForcefield(\n  ' +
      '    mesh' + this.objectsGenerated + ',\n  ' +
      '    polar' + this.objectsGenerated + ')\n  );\n  ');
    }
    if (hapticMeshObjects[i].hardStepIn) {
      outputString = outputString.concat('hapticMeshObject' +
        this.objectsGenerated +
        '.addComponent(new MeshHardStep(mesh' + this.objectsGenerated +
        ', 0, 3));\n  ');
    }
    if (hapticMeshObjects[i].hardStepOut) {
      outputString = outputString.concat('hapticMeshObject' +
        this.objectsGenerated +
        '.addComponent(new MeshHardStep(mesh' + this.objectsGenerated +
        ', 3, 0));\n  ');
    }
    if (hapticMeshObjects[i].triggerEnter) {
      outputString = outputString.concat('const meshTriggerFor' +
        this.objectsGenerated +
        ' = hapticMeshObject' + this.objectsGenerated + '.add' +
      'Component(new MeshTrigger(mesh' + this.objectsGenerated + '));\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'enter\', () => {VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\');});\n  ');
      } else {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'enter\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
    }
    if (hapticMeshObjects[i].triggerInside) {
      outputString = outputString.concat('const meshTriggerFor' +
        this.objectsGenerated +
        ' = hapticMeshObject' + this.objectsGenerated + '.add' +
      'Component(new MeshTrigger(mesh' + this.objectsGenerated + '));\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('let playing' +
          this.objectsGenerated +
          ' = false;\n  ');
        outputString = outputString.concat('let player' +
          this.objectsGenerated + ';\n  ');
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'inside\', () => {\n  ' +
        '  if(!playing' + this.objectsGenerated + ') {\n  ' +
        '    player' + this.objectsGenerated +
        ' = VoiceInteraction.playSound(\'' +
        hapticMeshObjects[i].soundfile + '\', true);\n  ' +
        '    playing' + this.objectsGenerated + ' = true;\n  ' +
        '  }\n  ' +
        '});\n  '
        );
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'leave\', () => {\n  ' +
        '  if(playing' + this.objectsGenerated + ' && player' +
        this.objectsGenerated + ') {\n  ' +
        '    player' + this.objectsGenerated + '.stop();\n  ' +
        '    playing' + this.objectsGenerated + ' = false;\n  ' +
        '  }\n  ' +
        '});\n  '
        );
      } else {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'inside\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
    }
    if (hapticMeshObjects[i].triggerLeave) {
      outputString = outputString.concat('const meshTriggerFor' +
        this.objectsGenerated +
        ' = hapticMeshObject' + this.objectsGenerated + '.add' +
        'Component(new MeshTrigger(mesh' + this.objectsGenerated + '));\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'leave\', () => {VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\');});\n  ');
      } else {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'leave\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
    }
    if (hapticMeshObjects[i].triggerStartTouch) {
      outputString = outputString.concat('const meshTriggerFor' +
        this.objectsGenerated +
        ' = hapticMeshObject' + this.objectsGenerated + '.add' +
      'Component(new MeshTrigger(mesh' + this.objectsGenerated + '));\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'startTouch\', () => {VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\');});\n  ');
      } else {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'startTouch\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
    }
    if (hapticMeshObjects[i].triggerTouch) {
      outputString = outputString.concat('const meshTriggerFor' +
        this.objectsGenerated +
        ' = hapticMeshObject' + this.objectsGenerated + '.add' +
        'Component(new MeshTrigger(mesh' + this.objectsGenerated + '));\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('let playing' +
          this.objectsGenerated +
          ' = false;\n  ');
        outputString = outputString.concat('let player' +
          this.objectsGenerated + ';\n  ');
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'touch\', () => {\n  ' +
        '  if(!playing' + this.objectsGenerated + ') {\n  ' +
        '    player' + this.objectsGenerated +
        ' = VoiceInteraction.playSound(\'' +
        hapticMeshObjects[i].soundfile + '\', true);\n  ' +
        '    playing' + this.objectsGenerated + ' = true;\n  ' +
        '  }\n  ' +
        '});\n  '
        );
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'endTouch\', () => {\n  ' +
        '  if(playing' + this.objectsGenerated + ' && player' +
        this.objectsGenerated + ') {\n  ' +
        '    player' + this.objectsGenerated + '.stop();\n  ' +
        '    playing' + this.objectsGenerated + ' = false;\n  ' +
        '  }\n  ' +
        '});\n  '
        );
      } else {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'touch\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
    }
    if (hapticMeshObjects[i].triggerEndTouch) {
      outputString = outputString.concat('const meshTriggerFor' +
        this.objectsGenerated +
        ' = hapticMeshObject' + this.objectsGenerated + '.add' +
      'Component(new MeshTrigger(mesh' + this.objectsGenerated + '));\n  ');
      if (hapticMeshObjects[i].hasOwnProperty('soundfile')) {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'endTouch\', () => {VoiceInteraction.playSound(\'' +
          hapticMeshObjects[i].soundfile + '\');});\n  ');
      } else {
        outputString = outputString.concat('meshTriggerFor' +
          this.objectsGenerated +
          '.on(\'endTouch\', () => {VoiceInteraction.speakText(\'' +
          hapticMeshObjects[i].speech + '\');});\n  ');
      }
      outputString = outputString.concat('\n');
    }
    this.objectsGenerated++;
    return outputString;
  }

  /**
   * @private This is an internal function.
   * @description Returns code as String, that creates a given Vector.
   * @param {Vector} vector - Vector to be created.
   * @return {string} String that contains the created code.
   */
  generateVecString(vector) {
    return 'new Vector(' + vector.x + ', ' + vector.y + ')';
  }

  /**
   * @private This is an internal function.
   * @description Creates code for mesh creation.
   * @param {Array} mesh - Array of Vectors defining postions of verticies.
   * @return {string} String that contains the created code.
   */
  generateMeshString(mesh) {
    let meshstring = 'new Mesh([\n';
    for (let i= 0; i < mesh.length; i++) {
      meshstring = meshstring.concat('    ' +
          this.generateVecString(mesh[i].difference(mesh[0])));
      meshstring =
          i == mesh.length - 1 ?
          meshstring.concat('\n') :
          meshstring.concat(',\n');
    }
    meshstring = meshstring.concat('  ])');
    return meshstring;
  }

  /**
   * @private This is an internal function.
   * @description Creates a tanslate Vector from a translate String.
   * @param {string} translateString - String that contains the translate.
   * @return {Vector} Translate vector.
   */
  parseTranslate(translateString) {
    const splits = translateString.split(',');
    return new Vector(parseFloat(splits[0]), parseFloat(splits[1]));
  }

  /**
   * @private This is an internal function.
   * @description Transforms a point based on a given matrix string.
   * @param {string} matrixString - String that contains the matrix.
   * @param {Vector} position - Position vector to be transformed.
   * @return {Vector} Position vector after transformation.
   */
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
  /**
   * @private This is an internal function.
   * @description Applies a matrix to a polygone object.
   * @param {string} matrixString - String that contains the matrix.
   * @param {Array} mesh - Array of Vectors defining postions of verticies.
   * @return {Array} Transformed mesh.
   */
  applyMatrixToMesh(matrixString, mesh) {
    for (let i = 0; i < mesh.length; i++) {
      mesh[i] = this.parseMatrix(matrixString, mesh[i]);
    }
    return mesh;
  }

  /**
   * @private This is an internal function.
   * @description Applies a tranlate to a polygone object.
   * @param {string} translateString - String that contains the translate.
   * @param {Array} mesh - Array of Vectors defining postions of verticies.
   * @return {Array} Translated mesh.
   */
  applyTranslateToMesh(translateString, mesh) {
    console.log(mesh);
    console.log(translateString);
    for (let i = 0; i < mesh.length; i++) {
      mesh[i] = mesh[i].sum(this.parseTranslate(translateString));
    }
    console.log(mesh);
    console.log();
    return mesh;
  }

  /**
   * @private This is an internal function.
   * @description Creates a polygone from a box.
   * @param {object} hapticBoxObject - Object to generate a mesh for.
   * @param {object} offset - Current offset of the layer.
   * @return {Array} Generated mesh.
   */
  generateMeshFromBox(hapticBoxObject, offset) {
    const floatOffset = new Vector(parseFloat(offset.x), parseFloat(offset.y));
    const mesh = [];
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x) + floatOffset.x,
        parseFloat(hapticBoxObject.data.y) + floatOffset.y));
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x) +
        parseFloat(hapticBoxObject.data.width) + floatOffset.x,
    parseFloat(hapticBoxObject.data.y) + floatOffset.y));
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x) +
        parseFloat(hapticBoxObject.data.width) + floatOffset.x,
    parseFloat(hapticBoxObject.data.y) +
        parseFloat(hapticBoxObject.data.height) + floatOffset.y));
    mesh.push(new Vector(parseFloat(hapticBoxObject.data.x) + floatOffset.x,
        parseFloat(hapticBoxObject.data.y) +
        parseFloat(hapticBoxObject.data.height) + floatOffset.y));
    return mesh;
  }

  /**
   * @private This is an internal function.
   * @description transfrom a mesh to the panto world.
   * @param {Array} mesh - Array of Vectors defining postions of verticies.
   * @return {Array} Generated mesh.
   */
  transformMeshToPanto(mesh) {
    for (let i = 0; i < mesh.length; i++) {
      mesh[i] = new Vector(mesh[i].x - this.pantoxOffset, -(mesh[i].y) +
        this.pantoyOffset);
    }
    return mesh;
  }
}

module.exports = FileCreator;