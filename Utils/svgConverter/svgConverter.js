/* eslint-disable require-jsdoc */
const ObstacleCreator = require('./obstacleCreator.js');
const FileGenerator = require('./fileCreator.js');
const obsCreator = new ObstacleCreator();
const fileGenerator = new FileGenerator();
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

class svgConverter {
  constructor(svgPath) {
    this.svgPath = svgPath;
  }

  loadWorld() {
    console.log('loading ', this.svgPath);
    fs.readFile(this.svgPath, function(err, data) {
      parser.parseString(data, function(err, result) {
        const svgObs = [];
        if (result.svg.path) {
          for (let i = 0; i < result.svg.path.length; i++) {
            svgObs.push(obsCreator.parseSvgPath(result.svg.path[i].$.d));
          }
        } else if (result.svg.g) {
          for (let i = 0; i < result.svg.g[0].path.length; i++) {
            svgObs.push(obsCreator.parseSvgPath(result.svg.g[0].path[i].$.d));
          }
        }
        if (result.svg.rect) {
          for (let i = 0; i < result.svg.rect.length; i++) {
            svgObs.push(obsCreator.parseSvgRect(result.svg.rect[i].$));
          }
        } else if (result.svg.g) {
          for (let i = 0; i < result.svg.g[0].rect.length; i++) {
            svgObs.push(obsCreator.parseSvgRect(result.svg.g[0].rect[i].$));
          }
        }
        console.log('found ', svgObs.length, ' obstacles.');
        console.log('obstacles can be found in obstacles.js');
        console.log('Done generating main.js');
        fs.writeFileSync('./obstacles.json', JSON.stringify(svgObs));
        fileGenerator.generateFile();
      });
    });
  }
}

module.exports = svgConverter;
