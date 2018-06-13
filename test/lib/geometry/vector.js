'use strict';

/* eslint-disable global-require */

const test = require('ava');

const Vector = require('../../../Vector');
const vector = new Vector();
const a = new Vector(1, 2, 3);
const b = new Vector(6, 5, 4);

test('constructor', t => {
	t.is(vector.constructor, Vector);
	t.is(vector.x, 0);
	t.is(vector.y, 0);
});
test('dot', t => {
	t.true(typeof vector.dot === 'function');
	t.deepEqual(a.dot(b), 16);
});

test('scale', t => {
	t.true(typeof vector.scale === 'function');
});
test('scaled', t => {
	t.true(typeof vector.scaled === 'function');
	t.deepEqual(a.scaled(7), new Vector(7, 14, 3));
});

test('add', t => {
	t.true(typeof vector.add === 'function');
});
test('sum', t => {
	t.true(typeof vector.sum === 'function');
	t.deepEqual(a.sum(b), new Vector(7, 7, 7));
});

test('subtract', t => {
	t.true(typeof vector.subtract === 'function');
});
test('difference', t => {
	t.true(typeof vector.difference === 'function');
	t.deepEqual(a.difference(b), new Vector(-5, -3, -1));
});

test('length', t => {
	t.deepEqual(a.length, 2.23606797749979);
});

test('polarAngle', t => {
	t.true(typeof vector.polarAngle === 'function');
	t.deepEqual(a.polarAngle(), 1.1071487177940904);
});

test('normalized', t => {
	t.true(typeof vector.normalized === 'function');
	t.deepEqual(a.normalized(), new Vector(0.4472135954999579, 0.8944271909999159, 3));
	t.deepEqual(a.normalized().length, 0.9999999999999999);
});

test('product', t => {
	t.true(typeof vector.product === 'function');
	t.deepEqual(a.product([11, 5, 7, 13]), new Vector(21, 33, 3));
});
