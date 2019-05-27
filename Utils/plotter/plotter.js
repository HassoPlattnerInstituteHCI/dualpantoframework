/* eslint-disable require-jsdoc */

let panto;
let chart;
let context;
let dataContainer;
let scale;
let mousePos = {x: 0, y: 0};

const width = 800;
const height = 600;

const axisStyle = 'grey';
const pointStyle = 'blue';
const pointHoverStyle = 'red';
const gridStyle = 'black';
const motorStyle = 'grey';
const textPadding = 2;
const textBackground = 'white';
const textBackgroundStroke = 'black';
const textStyle = 'black';

const pointSize = 3;
const motorSize = 15;

// eslint-disable-next-line no-unused-vars
function load(file) {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = setup;
}

function setup(event) {
  const config = event.target.result;
  panto = new Panto(JSON.parse(config));

  const base = d3.select('#container');
  chart = base.append('canvas')
      .attr('width', width)
      .attr('height', height);
  const elem = chart.node();
  elem.onmousemove = (e) => {
    const rect = elem.getBoundingClientRect();
    mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  context = elem.getContext('2d');
  const detachedContainer = document.createElement('custom');
  dataContainer = d3.select(detachedContainer);
  d3.timer(drawCanvas);
  const grid = panto.generateGrid(0.1);
  drawCustom(grid);
}

function drawCustom(data) {
  scale = panto.calcScale(width, height, 5);

  const dataBinding = dataContainer.selectAll('custom.rect')
      .data(data, function(d) {
        return d;
      });

  dataBinding.enter()
      .append('custom')
      .classed('point', true)
      .attr('x', (d) => scale.x(d.x))
      .attr('y', (d) => scale.y(d.y))
      .attr('x1', (d) => d.n1 ? scale.x(d.n1.x) : undefined)
      .attr('y1', (d) => d.n1 ? scale.y(d.n1.y) : undefined)
      .attr('x2', (d) => d.n2 ? scale.x(d.n2.x) : undefined)
      .attr('y2', (d) => d.n2 ? scale.y(d.n2.y) : undefined)
      .attr('a1', (d) => d.a1)
      .attr('a2', (d) => d.a2);

  dataBinding.exit().remove();

  drawCanvas();
}

function drawCanvas() {
  // clear canvas
  context.fillStyle = '#fff';
  context.rect(0, 0, chart.attr('width'), chart.attr('height'));
  context.fill();

  // axis
  const yAxis = scale.x(0);
  const xAxis = scale.y(0);
  context.strokeStyle = axisStyle;
  context.beginPath();
  context.moveTo(yAxis, 0);
  context.lineTo(yAxis, height);
  context.moveTo(0, xAxis);
  context.lineTo(width, xAxis);
  context.stroke();

  // motors
  context.strokeStyle = motorStyle;
  context.arc(
      scale.x(panto.left.baseX),
      scale.y(panto.left.baseY),
      motorSize,
      0,
      Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(
      scale.x(panto.right.baseX),
      scale.y(panto.right.baseY),
      motorSize,
      0,
      Math.PI * 2);
  context.stroke();

  let activeElem;

  context.strokeStyle = gridStyle;
  const elements = dataContainer.selectAll('custom.point');
  elements.each(function(d) {
    const node = d3.select(this);

    const x = node.attr('x');
    const y = node.attr('y');
    const x1 = node.attr('x1');
    const y1 = node.attr('y1');
    const x2 = node.attr('x2');
    const y2 = node.attr('y2');

    context.beginPath();
    if (!x1 || !y1) {
      if (!x2 || !y2) {
        // no neighbours
      } else {
        context.moveTo(x, y);
        context.lineTo(x2, y2);
      }
    } else {
      if (!x2 || !y2) {
        context.moveTo(x1, y1);
        context.lineTo(x, y);
      } else {
        context.moveTo(x1, y1);
        context.lineTo(x, y);
        context.lineTo(x2, y2);
      }
    }
    context.stroke();

    context.beginPath();
    context.arc(x, y, pointSize, 0, Math.PI * 2);

    const hover = context.isPointInPath(mousePos.x, mousePos.y);
    if (hover) {
      const a1 = node.attr('a1');
      const a2 = node.attr('a2');
      activeElem = {a1, a2};
    }

    context.fillStyle = hover ? pointHoverStyle : pointStyle;
    context.fill();
  });

  if (activeElem) {
    const text = activeElem.a1 + '\n' + activeElem.a2;
    const measure = context.measureText(text);
    context.fillStyle = textBackground;
    context.strokeStyle = textBackgroundStroke;
    context.fillRect(
        mousePos.x,
        mousePos.y,
        measure.width + textPadding * 2,
        10 + textPadding * 2);
    context.fillStyle = textStyle;
    context.fillText(
        text,
        mousePos.x + textPadding,
        mousePos.y + 10 + textPadding);
  }
}
