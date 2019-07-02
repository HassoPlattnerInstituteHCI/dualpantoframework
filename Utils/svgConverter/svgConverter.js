'use strict';

const FileGenerator = require('./fileCreator.js');
const {
  ObjectTypeEnum, parseObjects,
  parseTransform, applyMatrixToObject} = require('./utils.js');
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
   * @param {object} group - The group as object.
   * @param {object} svg - The svg as object.
   * @return {object} - Object containing the found objects.
   */
  loadGroup(group, svg) {
    const objects = [];
    for (let j = 0; j < group.length; j++) {
      let newTrigger;
      // group Recs
      if (group[j].rect) {
        const hapticObjects = parseObjects(
            ObjectTypeEnum.rect, group[j].rect, svg, true);
        if (hapticObjects.length > 0) {
          newTrigger = hapticObjects[0];
        }
        // TODO: this should handle multiple rects
      }
      // group paths
      if (group[j].path) {
        const hapticObjects = parseObjects(
            ObjectTypeEnum.path, group[j].path, svg, true);
        if (hapticObjects.length > 0) {
          newTrigger = hapticObjects[0];
        }
        // TODO: this should handle multiple paths
      }
      if (!newTrigger) {
        return;
      }
      const matrix = parseTransform(group[j].$.transform);
      applyMatrixToObject(newTrigger, matrix);
      // group Text
      if (group[j].text) {
        let userString;
        for (let i = 0; i < group[j].text.length; i++) {
          const textStyle = group[j].text[i].$.style
              .split(';');
          let color;
          for (let k = 0; k < textStyle.length; k++) {
            if (textStyle[k].includes('fill')) {
              color = textStyle[k].split(':')[1];
              break;
            }
          }
          if (color == '#000000') {
            userString = group[j].text[i].tspan[0]._;
            break;
          }
        }
        if (userString && userString.includes('|')) {
          const directionValue = userString.split('|')[0];
          switch (directionValue) {
            case '->':
              newTrigger.triggerStartTouch = true;
              newTrigger.commentOnly = false;
              break;
            case '<-':
              newTrigger.triggerEndTouch = true;
              newTrigger.commentOnly = false;
              break;
            case '':
              newTrigger.triggerTouch = true;
              newTrigger.commentOnly = false;
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
              newTrigger.commentOnly = false;
              break;
            case '<-[':
              newTrigger.triggerLeave = true;
              newTrigger.commentOnly = false;
              break;
            case '[-':
              newTrigger.triggerInside = true;
              newTrigger.commentOnly = false;
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
      if (!newTrigger.commentOnly) {
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
        if (svg.g[0].$.transform) {
          this.offset = new Vector(
              parseFloat(svg.g[0].$.transform.split('(')[1]
                  .split(')')[0].split(',')[0]),
              parseFloat(svg.g[0].$.transform
                  .split('(')[1].split(')')[0].split(',')[1]));
        }
        // first level Recs
        let hapticObjects = [];
        if (svg.g[0].rect) {
          hapticObjects = parseObjects(
              ObjectTypeEnum.rect, svg.g[0].rect, svg);
        }
        // first level Paths
        if (svg.g[0].path) {
          hapticObjects = hapticObjects.concat(parseObjects(
              ObjectTypeEnum.path, svg.g[0].path, svg));
        }
        // first level groups
        if (svg.g[0].g) {
          const groupedObjects = this.loadGroup(svg.g[0].g, svg);
          hapticObjects = hapticObjects
              .concat(groupedObjects);
        }

        for (let i = 0; i < hapticObjects.length; i++) {
          const mesh = hapticObjects[i].points;
          for (let i = 0; i < mesh.length; i++) {
            mesh[i].x += this.offset.x;
            mesh[i].y += this.offset.y;
          }
          if (hapticObjects[i].polarPoint) {
            hapticObjects[i].polarPoint.x += this.offset.x;
            hapticObjects[i].polarPoint.y += this.offset.y;
          }
        }
        let viewBox = svg.$.viewBox.split(' ');
        viewBox = {
          minX: viewBox[0],
          minY: viewBox[1],
          maxX: viewBox[0] + viewBox[2],
          maxY: viewBox[1] + viewBox[3]
        };
        hapticObjects = hapticObjects.filter((hapticObject) => {
          let inside = false;
          for (let i = 0; i < hapticObject.points.length; i++) {
            const point = hapticObject.points[i];
            inside = (viewBox.minX <= point.x && point.x <= viewBox.maxX
                && viewBox.minY <= point.y && point.y <= viewBox.maxY)
                || inside;
          }
          return inside;
        });
        console.log('found ', hapticObjects.length, ' haptic objects');
        fileGenerator.generateFile(
            hapticObjects, this.studentDir, this.offset);
        console.log('Generation complete.',
            'File can be found at: ' + this.studentDir + '\n',
            'Run \'node ' + this.studentDir +
            '/prototype.js\' to test your level.');
      }.bind(this));
    }.bind(this));
  }
}

module.exports = svgConverter;
