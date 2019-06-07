/* eslint-disable require-jsdoc */

let panto;
let chart;
let backgroundLayer;
let gridLayer;
let linkageLayer;
let circleLayer;
let labelLayer;

const degreeResolution = 10;

const backgoundCircleRadius = 18;
const backgoundCircleColor = 'none';
const backgroundStrokeColor = 'black';
const backgroundStrokeWidth = 0.4;

const gridStrokeColor = 'black';
const gridStrokeWidth = 0.4;

const linkageStrokeColor = 'gray';
const linkageStrokeWidth = 1.0;

const circleRadius = 1;
const circleUseConstColor = true;
const circleConstColor = 'gray';

const labelFontSize = 6;
const labelOffsetX = 5;
const labelOffsetY = 5;
const labelPadding = 1;
const labelBackgroundColor = 'white';
const labelBackgroundStrokeColor = 'lightgray';
const labelBackgroundStrokeWidth = 0.4;

// eslint-disable-next-line no-unused-vars
function load(file) {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = setup;
}

function setup(event) {
  const config = event.target.result;
  panto = new Panto(JSON.parse(config));

  const bb = panto.getBoundingBox();

  chart = d3
      .select('#container')
      .append('svg')
      .attr('width', `${bb.width}mm`)
      .attr('height', `${bb.height}mm`)
      .attr('viewBox', `${bb.x} ${bb.y} ${bb.width} ${bb.height}`)
      .attr('transform', 'scale(1,-1)');

  backgroundLayer = chart.append('g');
  gridLayer = chart.append('g');
  linkageLayer = chart.append('g');
  circleLayer = chart.append('g');
  labelLayer = chart.append('g');

  backgroundLayer
      .append('circle')
      .attr('cx', panto.left.baseX)
      .attr('cy', panto.left.baseY)
      .attr('r', backgoundCircleRadius)
      .attr('fill', backgoundCircleColor)
      .attr('stroke', backgroundStrokeColor)
      .attr('stroke-width', backgroundStrokeWidth);
  backgroundLayer
      .append('circle')
      .attr('cx', panto.right.baseX)
      .attr('cy', panto.right.baseY)
      .attr('r', backgoundCircleRadius)
      .attr('fill', backgoundCircleColor)
      .attr('stroke', backgroundStrokeColor)
      .attr('stroke-width', backgroundStrokeWidth);
  backgroundLayer
      .append('line')
      .attr('x1', bb.x)
      .attr('y1', 0)
      .attr('x2', bb.x + bb.width)
      .attr('y2', 0)
      .attr('stroke', backgroundStrokeColor)
      .attr('stroke-width', backgroundStrokeWidth);
  backgroundLayer
      .append('line')
      .attr('x1', 0)
      .attr('y1', bb.y)
      .attr('x2', 0)
      .attr('y2', bb.y + bb.height)
      .attr('stroke', backgroundStrokeColor)
      .attr('stroke-width', backgroundStrokeWidth);

  update(panto.generateGrid(degreeResolution * Math.PI / 180));
}

function format(number) {
  const sign = number >= 0 ? '+' : '-';
  const abs = Math.abs(number);
  const whole = (abs / 1000).toFixed(3).substring(2, 5);
  const remainder = (abs % 1).toFixed(3).substring(1, 5);
  return sign + whole + remainder;
}

function linkage(x1, y1, x2, y2) {
  linkageLayer
      .append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', linkageStrokeColor)
      .attr('stroke-width', linkageStrokeWidth);
}

function mouseOver(d, i, n) {
  // make circle bigger
  d3
      .select(n[i])
      .attr('r', circleRadius * 2);
  // draw linkages
  linkage(panto.left.baseX, panto.left.baseY, d.leftElbow.x, d.leftElbow.y);
  linkage(d.x, d.y, d.leftElbow.x, d.leftElbow.y);
  linkage(panto.right.baseX, panto.right.baseY, d.rightElbow.x, d.rightElbow.y);
  linkage(d.x, d.y, d.rightElbow.x, d.rightElbow.y);
  // add label
  const text = labelLayer
      .append('text')
      .attr('x', d.x + labelOffsetX)
      .attr('y', d.y - labelOffsetY)
      .attr('font-size', labelFontSize);
  text
      .append('tspan')
      .attr('x', d.x + labelOffsetX)
      .attr('dy', '0.6em')
      .text(`(${format(d.x)}|${format(d.y)})`);
  text
      .append('tspan')
      .attr('x', d.x + labelOffsetX)
      .attr('dy', '1.2em')
      .text(`${format(d.leftAngle)}° / ${format(d.rightAngle)}°`);
  const bb = text
      .node()
      .getBBox();
  text
      .attr('transform', `translate(0,${2 * bb.y + bb.height}) scale(1,-1)`);
  labelLayer
      .append('rect')
      .attr('x', bb.x - labelPadding)
      .attr('y', bb.y - labelPadding)
      .attr('width', bb.width + labelPadding * 2)
      .attr('height', bb.height + labelPadding * 2)
      .attr('fill', labelBackgroundColor)
      .attr('stroke', labelBackgroundStrokeColor)
      .attr('stroke-width', labelBackgroundStrokeWidth)
      .lower();
}

function mouseOut(d, i, n) {
  d3
      .select(n[i])
      .attr('r', circleRadius);
  linkageLayer
      .selectAll('*')
      .remove();
  labelLayer
      .selectAll('*')
      .remove();
}

function prepareDownload() {
  const svg = chart.node();
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source
        .replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source
        .replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  document.getElementById('download').href = url;
}

function update(data) {
  const circles =
      circleLayer
          .selectAll('circles')
          .data(data.points);

  circles
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', circleRadius)
      .attr('fill', (d) => circleUseConstColor ? circleConstColor : d.color)
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut);

  circles
      .exit()
      .remove();

  const lines =
      gridLayer
          .selectAll('lines')
          .data(data.grid);

  lines
      .enter()
      .append('line')
      .attr('x1', (d) => d.p1.x)
      .attr('y1', (d) => d.p1.y)
      .attr('x2', (d) => d.p2.x)
      .attr('y2', (d) => d.p2.y)
      .attr('stroke', gridStrokeColor)
      .attr('stroke-width', gridStrokeWidth);

  lines
      .exit()
      .remove();

  prepareDownload();
}
