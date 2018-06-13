'use strict';

const TWEEN = require('@tweenjs/tween.js');
const {Tween, Easing} = TWEEN;
const {Vector} = require('./geometry');

const NOOP = () => {
	// no operation
};

let interval = 3;

let tweenTimeout = null;
const updateTween = () => {
	TWEEN.update();
	tweenTimeout = setTimeout(updateTween, interval);
};

let tweenCounter = 0;
const addTween = () => {
	if(tweenCounter === 0)
		tweenTimeout = setTimeout(updateTween, interval);

	tweenCounter++;
};

const removeTween = () => {
	tweenCounter--;
	if(tweenCounter === 0 && tweenTimeout !== null) {
		clearTimeout(tweenTimeout);
		tweenTimeout = null;
	}
};

class TweenGenerator {
	constructor(position, target, duration, interpolationMethod) {
		position = {...position};
		this.position = position;

		this._resolve = NOOP;

		this.running = true;

		addTween();

		// create a new tween that modifies 'position'
		this.tween = new Tween(position)
			.to(target, duration)
			.easing(interpolationMethod)
			.onUpdate(() => {
				// called after tween.js updates 'position'
				this.resolve();
			})
			.onComplete(() => {
				this.done();
				removeTween();
			})
			.start();
	}

	resolve() {
		this._resolve(new Vector(this.position));
	}

	done() {
		this.running = false;
		this.resolve();
	}

	*[Symbol.iterator]() {
		while(this.running) {
			yield new Promise(resolve => {
				this._resolve = resolve;
			});
		}
	}

	// TweenGenerator.interval
	static get interval() {
		return interval;
	}

	static set interval(value) {
		interval = value;
	}
}

// export easing
TweenGenerator.Easing = Easing;

// export mudule
module.exports = TweenGenerator;
