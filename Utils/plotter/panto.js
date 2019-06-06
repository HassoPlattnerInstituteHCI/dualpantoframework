/* eslint-disable require-jsdoc */

// eslint-disable-next-line no-unused-vars
class Panto {
  constructor(config, panto = 'upper') {
    this.range = config.range;
    this.panto = config.pantos[panto];
    this.left = this.panto.left.linkage;
    this.right = this.panto.right.linkage;
  }

  forwardKinematics(leftBaseAngle, rightBaseAngle) {
    // base angle sin / cos
    const leftBaseAngleSin = Math.sin(leftBaseAngle);
    const leftBaseAngleCos = Math.cos(leftBaseAngle);
    const rightBaseAngleSin = Math.sin(rightBaseAngle);
    const rightBaseAngleCos = Math.cos(rightBaseAngle);

    // prepare some values
    const left = this.left;
    const right = this.right;

    // calculate inner positions
    const leftInnerX =
        leftBaseAngleCos * left.innerLength + left.baseX;
    const leftInnerY =
        leftBaseAngleSin * left.innerLength + left.baseY;
    const rightInnerX =
        rightBaseAngleCos * right.innerLength + right.baseX;
    const rightInnerY =
        rightBaseAngleSin * right.innerLength + right.baseY;

    // diagonal between inner positions
    const diagonalX = rightInnerX - leftInnerX;
    const diagonalY = rightInnerY - leftInnerY;
    const diagonalSquared = diagonalX * diagonalX + diagonalY * diagonalY;
    const diagonalLength = Math.sqrt(diagonalSquared);

    // left elbow angles
    // - inside is between diagonal and linkage
    // - offset is between zero and diagonal
    // - total is between zero and linkage
    const leftElbowInsideAngleCos =
        (diagonalSquared +
        Math.pow(left.outerLength, 2) -
        Math.pow(right.outerLength, 2)) /
        (2 * diagonalLength * left.outerLength);
    const leftElbowInsideAngle = -Math.acos(leftElbowInsideAngleCos);
    const leftElbowOffsetAngle = Math.atan2(diagonalY, diagonalX);
    const leftElbowTotalAngle =
        leftElbowInsideAngle + leftElbowOffsetAngle;

    // handle position
    return ({
      x: Math.cos(leftElbowTotalAngle) * left.outerLength + leftInnerX,
      y: Math.sin(leftElbowTotalAngle) * left.outerLength + leftInnerY,
      leftAngle: leftBaseAngle * 180 / Math.PI,
      rightAngle: rightBaseAngle * 180 / Math.PI,
      leftElbow: {x: leftInnerX, y: leftInnerY},
      rightElbow: {x: rightInnerX, y: rightInnerY}
    });
  }

  static radians(degrees) {
    return degrees * Math.PI / 180;
  }

  generateGrid(stepSize) {
    const leftStart = Panto.radians(-20);
    const leftEnd = Panto.radians(-225);
    const rightStart = Panto.radians(45);
    const rightEnd = Panto.radians(-160);

    const leftDist = Math.abs(leftEnd - leftStart);
    const rightDist = Math.abs(rightEnd - rightStart);

    const leftSteps = Math.floor(leftDist / stepSize);
    const rightSteps = Math.floor(rightDist / stepSize);

    const leftActualDist = leftSteps * stepSize;
    const rightActualDist = rightSteps * stepSize;

    const leftCenter = (leftStart + leftEnd) / 2;
    const rightCenter = (rightStart + rightEnd) / 2;

    const leftActualStart = leftCenter - leftActualDist / 2;
    const leftActualEnd = leftCenter + leftActualDist / 2;
    const rightActualStart = rightCenter - rightActualDist / 2;
    const rightActualEnd = rightCenter + rightActualDist / 2;

    const leftDir = Math.sign(leftActualEnd - leftActualStart);
    const rightDir = Math.sign(rightActualEnd - rightActualStart);
    const leftStep = stepSize * leftDir;
    const rightStep = stepSize * rightDir;

    const data = [];

    for (let leftIndex = 0; leftIndex <= leftSteps; leftIndex++) {
      const red = leftIndex / leftSteps;
      const results = [];
      const leftAngle = leftActualStart + leftStep * leftIndex;
      for (let rightIndex = 0; rightIndex <= rightSteps; rightIndex++) {
        const blue = rightIndex / rightSteps;
        const rightAngle = rightActualStart + rightStep * rightIndex;
        try {
          const result = this.forwardKinematics(leftAngle, rightAngle);
          result.id = leftIndex * rightSteps + rightSteps;
          result.color = `rgb(${red*255},0,${blue*255})`;
          results.push(result);
        } catch (error) {
          results.push(undefined);
        }
      }
      data.push(results);
    }

    // TODO: better filter
    const filteredData =
      data.map((a) => a.map((p) => p.leftAngle < p.rightAngle ? p : undefined));
    const flattenedData = filteredData.flat();
    const cleanedData = flattenedData.filter((p) => p !== undefined);

    const grid = filteredData.map((a, i1) => a.map((p, i2) => {
      if (p === undefined) {
        return [];
      }
      const n1 = i1 > 0 ? data[i1 - 1][i2] : undefined;
      const l1 = n1 !== undefined ? {p1: p, p2: n1} : undefined;
      const n2 = i2 > 0 ? data[i1][i2 - 1] : undefined;
      const l2 = n2 !== undefined ? {p1: p, p2: n2} : undefined;
      return [l1, l2];
    }));
    const flattenedGrid = grid.flat(2);
    const cleanedGrid = flattenedGrid.filter((p) => p !== undefined);

    return {
      points: cleanedData,
      grid: cleanedGrid
    };
  }

  static map(x, inMin, inMax, outMin, outMax) {
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  calcScale(width, height, padding) {
    const xInputRange = this.range.maxX - this.range.minX;
    const yInputRange = this.range.maxY - this.range.minY;
    const xOutputRange = width - 2 * padding;
    const yOutputRange = height - 2 * padding;

    const xScale = xOutputRange / xInputRange;
    const yScale = yOutputRange / yInputRange;

    const scale = Math.min(xScale, yScale);

    const xOffset = Panto.map(
        0,
        this.range.minX,
        this.range.maxX,
        padding,
        width - padding);
    const yOffset = Panto.map(
        0,
        this.range.minY,
        this.range.maxY,
        height - padding,
        padding);

    return {
      x: (x) => xOffset + x * scale,
      y: (y) => yOffset - y * scale
    };
  };
}
