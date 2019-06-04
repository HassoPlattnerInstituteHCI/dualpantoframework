/* eslint-disable require-jsdoc */
const margin = {top: 5, bottom: 20, left: 40, right: 7};
const height = 600 - margin.top - margin.bottom;
const width = 1200 - margin.left - margin.right;

const dualPantos = [];
let svg;
const obstacles = [];

const ws = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port + window.location.pathname + window.location.search);
ws.onopen = function(event) {
  console.log('Connection open');
  setup();
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  let panto = dualPantos.find(function(x) {
    return x.port === data.port;
  });
  if (!panto) {
    panto = new DualPanto(data.port);
    dualPantos.push(panto);
  }
  switch (data.type) {
    case 'mapLine':
      drawLine(data.line, data.color);
      break;
    case 'drawCircle':
      drawCircle(data.pos, data.size, data.color);
      break;
    case 'handleMoved':
      if (data.position) {
        if (data.index == 0) {
          panto.mePositionX = data.position.x;
          panto.mePositionY = data.position.y;
          panto.meAngle = data.position.r;
          panto.updateMeHandle();
        } else {
          panto.itPositionX = data.position.x;
          panto.itPositionY = data.position.y;
          panto.itAngle = data.position.r;
          panto.updateItHandle();
        }
      }
      break;
    case 'moveHandleTo':
      if (data.position) {
        if (data.index == 0) {
          panto.mePositionX = data.position.x;
          panto.mePositionY = data.position.y;
          panto.meAngle = data.position.r;
          panto.updateMeHandle();
        } else {
          panto.itPositionX = data.position.x;
          panto.itPositionY = data.position.y;
          panto.itAngle = data.position.r;
          panto.updateItHandle();
        }
      }
      break;
    case 'createObstacle':
      if (data.pointArray.length == 2) {
        drawLine(data.pointArray, 'black');
      } else {
        let lastPoint = data.pointArray[0];
        for (let i = 1; i < data.pointArray.length; i++) {
          drawLine([lastPoint, data.pointArray[i]], 'black');
          lastPoint = data.pointArray[i];
        }
        drawLine([lastPoint, data.pointArray[0]], 'black');
      }
      break;
    case 'removeObstacle':
      removeObstacle(data.id);
      break;
    default:
      break;
  }
};
ws.onerror = function(event) {
};

const drawLine = function(line, color) {
  svg.append('line')
      .attr('class', 'wall')
      .attr('x1', line[0].x + 150)
      .attr('y1', -line[0].y)
      .attr('x2', line[1].x + 150)
      .attr('y2', -line[1].y)
      .style('stroke', color);
};

const drawCircle = function(pos, size, color) {
  svg.append('circle')
      .attr('cx', pos.x + 150)
      .attr('cy', -pos.y)
      .attr('r', size)
      .attr('fill', color);
};

const setup = function() {
  svg = window.d3.select('body')
      .append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('height', height + margin.top + margin.bottom)
      .attr('width', width + margin.left + margin.right)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
};

/*  const drawObstacle = function(points, id) {
  obstacles[id] = svg.append('polygon')
      .attr('points', points);
};  */

const removeObstacle = function(id) {
  obstacles[id].remove();
};

class DualPanto {
  constructor(port) {
    this.mePositionX = 0;
    this.mePositionY = 0;
    this.meAngle = 0;
    this.itPositionX = 0;
    this.itPositionY = 0;
    this.itAngle = 0;
    this.port = port;
    this.token = [];
  }

  updateMeHandle() {
    this.drawHandle(this.mePositionX, this.mePositionY, this.meAngle, 0);
  }

  updateItHandle() {
    this.drawHandle(this.itPositionX, this.itPositionY, this.itAngle, 1);
  }

  drawHandle(positionX, positionY, angle, index) {
    const xDirection = Math.cos(angle);
    const yDirection = Math.sin(angle);
    const directionVec = new Vector(xDirection, -yDirection, NaN)
        .normalized()
        .scaled(50);
    let color = 'blue';
    if (index == 1) {
      color = 'green';
    }
    const offset = 2 * index;
    if (!this.token[0 + offset]) {
      this.token.push(svg.append('circle')
          .attr('cx', positionX + 150)
          .attr('cy', -positionY)
          .attr('r', 1)
          .attr('fill', color));
      this.token.push(svg.append('line')
          .attr('class', 'aimline')
          .attr('x1', positionX)
          .attr('y1', -positionY)
          .attr('x2', positionX + 150 + directionVec.x)
          .attr('y2', -positionY + directionVec.y)
          .style('stroke', 'black'));
    } else {
      this.token[0 + offset].attr('cx', positionX + 150)
          .attr('cy', -positionY);

      this.token[1 + offset].attr('x1', positionX +150)
          .attr('y1', -positionY)
          .attr('x2', positionX + 150 + directionVec.x)
          .attr('y2', -positionY + directionVec.y);
    }
  }
}
