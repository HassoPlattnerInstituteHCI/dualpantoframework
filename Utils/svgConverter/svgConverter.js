'use strict';

const FileGenerator = require('./fileCreator.js');
const {
  ObjectTypeEnum, parseObjects,
  parseTransform, applyMatrix} = require('./utils.js');
const fileGenerator = new FileGenerator();
const Vector = require('../../lib/vector.js');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

/**
 * @description Class for code generation.
 */
class svgConverter {
  /**
   * @description Creates a new instance of FileCreator.
   * @param {string} svgPath - Path of the svg.
   * @param {string} studentDir - Path of the studen directory.
   */
  constructor(svgPath, studentDir) {
    this.svgPath = svgPath;
    this.studentDir = studentDir;
    this.offset = new Vector(0, 0);
  }

  /**
   * @private This is an internal function.
   * @description Parses Groups
   * @param {object} svg - The svg as object.
   * @return {object} - Object containing two Arrays with found objects.
   */
  loadGroups(svg) {
    const objects = [];
    for (let j = 0; j < svg.g[0].g.length; j++) {
      let found = false;
      let newTrigger;
      // group Recs
      if (svg.g[0].g[j].rect) {
        const hapticObjects = parseObjects(
            ObjectTypeEnum.rect, svg.g[0].g[j].rect, svg);
        if (hapticObjects.length > 0) {
          found = true;
        }
        newTrigger = hapticObjects[0];
        // TODO: this should handle multiple rects
      }
      // group paths
      if (svg.g[0].g[j].path) {
        const hapticObjects = parseObjects(
            ObjectTypeEnum.path, svg.g[0].g[j].path, svg);
        if (hapticObjects.length > 0) {
          found = true;
        }
        newTrigger = hapticObjects[0];
        // TODO: this should handle multiple paths
      }
      if (!found) {
        continue;
      }
      // group Text
      if (svg.g[0].g[j].text) {
        let userString;
        for (let i = 0; i < svg.g[0].g[j].text.length; i++) {
          const textStyle = svg.g[0].g[j].text[i].$.style
              .split(';');
          let color;
          for (let k = 0; k < textStyle.length; k++) {
            if (textStyle[k].includes('fill')) {
              color = textStyle[k].split(':')[1];
              break;
            }
          }
          if (color == '#000000') {
            userString = svg.g[0].g[j].text[i].tspan[0]._;
            break;
          }
        }
        if (userString && userString.includes('|')) {
          const directionValue = userString.split('|')[0];
          switch (directionValue) {
            case '->':
              newTrigger.triggerStartTouch = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerStartTouch',
                    svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerStartTouch',
                    svg.g[0].g[j].path[0].$.id);
              }

              break;
            case '<-':
              newTrigger.triggerEndTouch = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerEndTouch',
                    svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerEndTouch',
                    svg.g[0].g[j].path[0].$.id);
              }
              break;
            case '':
              newTrigger.triggerTouch = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerTouch',
                    svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerTouch',
                    svg.g[0].g[j].path[0].$.id);
              }
              break;
          }
          const sound = userString.split('|')[1];
          if (sound[0] === '"') {
            newTrigger.speech = sound.slice(1, -1);
          } else {
            newTrigger.soundfile = sound;
          }
        } else if (userString) {
          const directionValue = userString.split(']')[0];
          switch (directionValue) {
            case '->[':
              newTrigger.triggerEnter = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerEnter',
                    svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerEnter',
                    svg.g[0].g[j].path[0].$.id);
              }
              break;
            case '<-[':
              newTrigger.triggerLeave = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerLeave',
                    svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerLeave',
                    svg.g[0].g[j].path[0].$.id);
              }
              break;
            case '[-':
              newTrigger.triggerInside = true;
              found = true;
              if (newTrigger.box === true) {
                console.log('triggerInside',
                    svg.g[0].g[j].rect[0].$.id);
              } else if (newTrigger.box === false) {
                console.log('triggerInside',
                    svg.g[0].g[j].path[0].$.id);
              }
              break;
          }
          const sound = userString.split(']')[1];
          if (sound[0] === '"') {
            newTrigger.speech = sound.slice(1, -1);
          } else {
            newTrigger.soundfile = sound;
          }
        }
      }
      if (found) {
        const matrix = parseTransform(svg.g[0].g[j].$.transform);
        applyMatrix(newTrigger.points, matrix);
        if (newTrigger.polarPoint) {
          applyMatrix([newTrigger.polarPoint], matrix);
        }
        objects.push(newTrigger);
      }
    }
    return objects;
  }

  /**
   * @private This is an internal function.
   * @description Parses the svg.
   */
  loadWorld() {
    console.log('loading ', this.svgPath);
    fs.readFile(this.svgPath, function(err, data) {
      parser.parseString(data, function(err, result) {
        const svg = result.svg;
        let hapticBoxObjects = [];
        if (svg.g[0].$.transform) {
          this.offset = new Vector(
              parseFloat(svg.g[0].$.transform.split('(')[1]
                  .split(')')[0].split(',')[0]),
              parseFloat(svg.g[0].$.transform
                  .split('(')[1].split(')')[0].split(',')[1]));
        }
        // first level Recs
        if (svg.g[0].rect) {
          hapticBoxObjects = parseObjects(
              ObjectTypeEnum.rect, svg.g[0].rect, svg);
        }
        // first level Paths
        let hapticMeshObjects = [];
        if (svg.g[0].path) {
          hapticMeshObjects = parseObjects(
              ObjectTypeEnum.path, svg.g[0].path, svg);
        }
        // first level groups
        if (svg.g[0].g) {
          const groupedObjects = this.loadGroups(svg);
          hapticMeshObjects = hapticMeshObjects
              .concat(groupedObjects);
        }
        console.log('found ', hapticBoxObjects.length +
          hapticMeshObjects.length, ' haptic objects');
        fileGenerator.generateFile(hapticBoxObjects,
            hapticMeshObjects,
            this.studentDir, this.offset);
        console.log('Generation complete.',
            'File can be found at: ' + this.studentDir + '\n',
            'Run \'node ' + this.studentDir +
            '/prototype.js\' to test your level.');
      }.bind(this));
    }.bind(this));
  }
}

module.exports = svgConverter;
