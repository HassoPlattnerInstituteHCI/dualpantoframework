/* eslint-disable require-jsdoc */

let panto;
let chart;
let scale;
let gridLayer;
let linkageLayer;
let circleLayer;
let labelLayer;

const degreeResolution = 5;

let width = '100%';
let height = '100%';

const gridStrokeColor = 'gray';
const gridStrokeWidth = 4;

const linkageStrokeColor = 'darkgray';
const linkageStrokeWidth = 2;

const circleRadius = 1;
const circleUseConstColor = false;
const circleConstColor = 'blue';

const labelOffsetX = 10;
const labelPadding = 2;

// eslint-disable-next-line no-unused-vars
function load(file) {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = setup;
}

function setup(event) {
  const config = event.target.result;
  panto = new Panto(JSON.parse(config));

  chart = d3
      .select('#container')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

  const bb = chart.node().getBoundingClientRect();
  width = bb.width;
  height = bb.height;

  gridLayer = chart.append('g');
  linkageLayer = chart.append('g');
  circleLayer = chart.append('g');
  labelLayer = chart.append('g');

  scale = panto.calcScale(width, height, 5);

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
      .attr('x1', scale.x(x1))
      .attr('y1', scale.y(y1))
      .attr('x2', scale.x(x2))
      .attr('y2', scale.y(y2))
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
      .attr('x', scale.x(d.x) + labelOffsetX)
      .attr('y', scale.y(d.y))
      .attr('alignment-baseline', 'middle')
      .text(`${format(d.leftAngle)}° / ${format(d.rightAngle)}°`);
  const bb = text
      .node()
      .getBBox();
  labelLayer
      .append('rect')
      .attr('x', bb.x - labelPadding)
      .attr('y', bb.y - labelPadding)
      .attr('width', bb.width + labelPadding * 2)
      .attr('height', bb.height + labelPadding * 2)
      .attr('fill', 'white')
      .attr('stroke', 'lightgray')
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

function update(data) {
  const circles =
      circleLayer
          .selectAll('circles')
          .data(data.points);

  circles
      .enter()
      .append('circle')
      .attr('cx', (d) => scale.x(d.x))
      .attr('cy', (d) => scale.y(d.y))
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
      .attr('x1', (d) => scale.x(d.p1.x))
      .attr('y1', (d) => scale.y(d.p1.y))
      .attr('x2', (d) => scale.x(d.p2.x))
      .attr('y2', (d) => scale.y(d.p2.y))
      .attr('stroke', gridStrokeColor)
      .attr('stroke-width', gridStrokeWidth);

  lines
      .exit()
      .remove();
}
