/* eslint-disable require-jsdoc */

let panto;
let chart;
let scale;
let linkageLayer;
let circleLayer;
let labelLayer;

let width = '100%';
let height = '100%';

// const axisStyle = 'grey';
// const pointStyle = 'blue';
// const pointHoverStyle = 'red';
// const gridStyle = 'black';
// const motorStyle = 'grey';
// const textPadding = 2;
// const textBackground = 'white';
// const textBackgroundStroke = 'black';
// const textStyle = 'black';

// const pointSize = 3;
// const motorSize = 15;

const circleRadius = 5;

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

  linkageLayer = chart.append('g');
  circleLayer = chart.append('g');
  labelLayer = chart.append('g');

  scale = panto.calcScale(width, height, 5);

  update(panto.generateGrid(0.1));
}

function format(number) {
  const sign = number >= 0 ? '+' : '-';
  const abs = Math.abs(number);
  const whole = (abs / 1000).toFixed(3).substring(2, 5);
  const remainder = (abs % 1).toFixed(3).substring(1, 5);
  return sign + whole + remainder;
}

function line(x1, y1, x2, y2) {
  linkageLayer
      .append('line')
      .attr('x1', scale.x(x1))
      .attr('y1', scale.y(y1))
      .attr('x2', scale.x(x2))
      .attr('y2', scale.y(y2))
      .attr('stroke', 'gray');
}

function mouseOver(d, i, n) {
  // make circle bigger
  d3
      .select(n[i])
      .attr('r', circleRadius * 2);
  // draw linkages
  line(panto.left.baseX, panto.left.baseY, d.leftElbow.x, d.leftElbow.y);
  line(d.x, d.y, d.leftElbow.x, d.leftElbow.y);
  line(panto.right.baseX, panto.right.baseY, d.rightElbow.x, d.rightElbow.y);
  line(d.x, d.y, d.rightElbow.x, d.rightElbow.y);
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
  const mapped = data.map((d) => d.y);
  console.log(mapped);
  console.log(Math.max(...mapped));
  console.log(Math.min(...mapped));
  const circles =
      circleLayer
          .selectAll('circles')
          .data(data);

  circles
      .enter()
      .append('circle')
      .attr('cx', (d) => scale.x(d.x))
      .attr('cy', (d) => scale.y(d.y))
      .attr('r', circleRadius)
      .attr('fill', (d) => d.color)
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut);

  circles
      .exit()
      .remove();
}
