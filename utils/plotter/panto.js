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

    const handleX =
        Math.cos(leftElbowTotalAngle) * left.outerLength + leftInnerX;
    const handleY =
        Math.sin(leftElbowTotalAngle) * left.outerLength + leftInnerY;

    // handle position
    return ({
      x: handleX,
      y: handleY,
      leftAngle: leftBaseAngle * 180 / Math.PI,
      rightAngle: rightBaseAngle * 180 / Math.PI,
      leftOuterAngle: leftElbowTotalAngle * 180 / Math.PI,
      rightOuterAngle:
          Math.atan2(handleY - rightInnerY, handleX - rightInnerX) *
          180 / Math.PI,
      leftElbow: {x: leftInnerX, y: leftInnerY},
      rightElbow: {x: rightInnerX, y: rightInnerY}
    });
  }

  static radians(degrees) {
    return degrees * Math.PI / 180;
  }

  modulo(dividend, divisor = 360) {
    return (dividend % divisor + divisor) % divisor;
  }

  checkBend(p) {
    return this.modulo(p.leftOuterAngle - p.leftAngle) < 180 &&
        this.modulo(p.rightAngle - p.rightOuterAngle) < 180;
  }

  checkArea(p) {
    return this.range.minX < p.x && p.x < this.range.maxX &&
        this.range.minY < p.y && p.y < this.range.maxY;
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

    const filteredData =
        data.map((a) => a.map((p) =>
            this.checkBend(p) && this.checkArea(p) ? p : undefined));
    const flattenedData = filteredData.flat();
    const cleanedData = flattenedData.filter((p) => p !== undefined);

    const grid = filteredData.map((a, i1) => a.map((p, i2) => {
      const result = [];
      if (p === undefined) {
        return result;
      }
      const n1 = i1 > 0 ? filteredData[i1 - 1][i2] : undefined;
      if (n1) {
        result.push({p1: p, p2: n1});
      }
      const n2 = i2 > 0 ? filteredData[i1][i2 - 1] : undefined;
      if (n2) {
        result.push({p1: p, p2: n2});
      }
      return result;
    }));
    const flattenedGrid = grid.flat(2);
    const cleanedGrid = flattenedGrid.filter((p) => p !== undefined);

    return {
      points: cleanedData,
      grid: cleanedGrid
    };
  }

  getBoundingBox() {
    return {
      x: this.range.minX,
      y: this.range.minY,
      width: this.range.maxX - this.range.minX,
      height: this.range.maxY - this.range.minY
    };
  };
}
