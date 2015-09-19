(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.boxer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Component handles storing the state of a Component that is attached to a Node.
var Component = function(node){
    this.node = node ? node : null;
}

module.exports = Component;

},{}],2:[function(require,module,exports){
var Component = require('./Component');

var DOMComponent = function(node, elem, container){
    this.node = node.id ? node.id : node;
    this.elem = elem ? elem : document.createElement('div');

    var container = container ? container : document.body;

    this.elem.dataset.node = this.node;
    container.appendChild(this.elem);
};

DOMComponent.prototype = Object.create(Component.prototype);
DOMComponent.prototype.constructor = Component;



DOMComponent.prototype.transform = function(){

    //     this.view.style.transform = JSON.stringify(matrix3d(1, 0, 0, 0,
    //                                                         0, 1, 0, 0,
    //                                                         0, 0, 1, 0,
    //                                                         0, 0, 0, 1));
    //

};

module.exports = DOMComponent;

},{"./Component":1}],3:[function(require,module,exports){
module.exports = {
    Component: require('./Component'),
    DOMComponent: require('./DOMComponent')
};

},{"./Component":1,"./DOMComponent":2}],4:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Equivalent of an Engine in the Worker Thread. Used to synchronize and manage
 * time across different Threads.
 *
 * @class  Clock
 * @constructor
 * @private
 */
function Clock () {
    this._time = 0;
    this._frame = 0;
    this._timerQueue = [];
    this._updatingIndex = 0;

    this._scale = 1;
    this._scaledTime = this._time;
}

/**
 * Sets the scale at which the clock time is passing.
 * Useful for slow-motion or fast-forward effects.
 *
 * `1` means no time scaling ("realtime"),
 * `2` means the clock time is passing twice as fast,
 * `0.5` means the clock time is passing two times slower than the "actual"
 * time at which the Clock is being updated via `.step`.
 *
 * Initally the clock time is not being scaled (factor `1`).
 *
 * @method  setScale
 * @chainable
 *
 * @param {Number} scale    The scale at which the clock time is passing.
 *
 * @return {Clock} this
 */
Clock.prototype.setScale = function setScale (scale) {
    this._scale = scale;
    return this;
};

/**
 * @method  getScale
 *
 * @return {Number} scale    The scale at which the clock time is passing.
 */
Clock.prototype.getScale = function getScale () {
    return this._scale;
};

/**
 * Updates the internal clock time.
 *
 * @method  step
 * @chainable
 *
 * @param  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 * @return {Clock}       this
 */
Clock.prototype.step = function step (time) {
    this._frame++;

    this._scaledTime = this._scaledTime + (time - this._time)*this._scale;
    this._time = time;

    for (var i = 0; i < this._timerQueue.length; i++) {
        if (this._timerQueue[i](this._scaledTime)) {
            this._timerQueue.splice(i, 1);
        }
    }
    return this;
};

/**
 * Returns the internal clock time.
 *
 * @method  now
 *
 * @return  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.now = function now () {
    return this._scaledTime;
};

/**
 * Returns the internal clock time.
 *
 * @method  getTime
 * @deprecated Use #now instead
 *
 * @return  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.getTime = Clock.prototype.now;

/**
 * Returns the number of frames elapsed so far.
 *
 * @method getFrame
 *
 * @return {Number} frames
 */
Clock.prototype.getFrame = function getFrame () {
    return this._frame;
};

/**
 * Wraps a function to be invoked after a certain amount of time.
 * After a set duration has passed, it executes the function and
 * removes it as a listener to 'prerender'.
 *
 * @method setTimeout
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay milliseconds from now to execute the function
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setTimeout = function (callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            return true;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};


/**
 * Wraps a function to be invoked after a certain amount of time.
 *  After a set duration has passed, it executes the function and
 *  resets the execution time.
 *
 * @method setInterval
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay interval to execute function in milliseconds
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setInterval = function setInterval(callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            startedAt = time;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};

/**
 * Removes previously via `Clock#setTimeout` or `Clock#setInterval`
 * registered callback function
 *
 * @method clearTimer
 * @chainable
 *
 * @param  {Function} timer  previously by `Clock#setTimeout` or
 *                              `Clock#setInterval` returned callback function
 * @return {Clock}              this
 */
Clock.prototype.clearTimer = function (timer) {
    var index = this._timerQueue.indexOf(timer);
    if (index !== -1) {
        this._timerQueue.splice(index, 1);
    }
    return this;
};

module.exports = Clock;

},{}],5:[function(require,module,exports){
var Clock = require('./Clock');

var Engine = function(){

    this._clock = new Clock();
    this._worker = null;

}

Engine.prototype.init = function(worker){
    window.requestAnimationFrame(this.tick.bind(this));
    if(worker){
        this._worker = worker;
        this._worker.postMessage({init:'done'});
    }
}

Engine.prototype.tick = function(time){

    this._clock.step(time);
    this.time = this._clock.now();

    if(this._worker){
        this._worker.postMessage({frame:this.time});
    }

    window.requestAnimationFrame(this.tick.bind(this));

}


/**
 * Returns the instance of clock used by the FamousEngine.
 *
 * @method
 *
 * @return {Clock} Engine's clock
 */
Engine.prototype.getClock = function() {
    return this._clock;
};

module.exports = new Engine();

},{"./Clock":4}],6:[function(require,module,exports){
// Node handles storing the state of a node on the Scene Graph.
var Node = function(conf){
    if(conf){
        this.serialize(conf);
    } else {
        this.setDefaults();
    }

    this.observables = {};
}

Node.prototype.setDefaults = function(conf){
    this.position = [0,0,0];
    this.origin = [0.0,0.0,0.0];
    this.align = [0.0,0.0,0.0];
    this.size = [0,0,0];
    this.rotate = [0,0,0];
    this.opacity = 1.0;
    this.transform = [];
};

Node.prototype.serialize = function(conf){
    this.id = conf.id ? conf.id : null;
    this.position = conf.position ? conf.position : [0,0,0];
    this.origin = conf.origin ? conf.origin : [0.0,0.0,0.0];
    this.align = conf.align ? conf.align : [0.0,0.0,0.0];
    this.size = conf.size ? conf.size : [0,0,0];
    this.rotate = conf.rotate ? conf.rotate : [0,0,0];
    this.opacity = conf.opacity ? conf.opacity : 1.0;
};

Node.prototype.getProperties = function(){
    return {
        position: this.position,
        origin: this.origin,
        align: this.align,
        size: this.size,
        rotate: this.rotate,
        opacity: this.opacity
    }
};

Node.prototype.setPosition = function(pos){
    this.position = pos;
}

Node.prototype.getPosition = function(){
    return this.position;
}

Node.prototype.setSize = function(size){
    this.size = size;
}

Node.prototype.getSize = function(){
    return this.size;
}

Node.prototype.setOrigin = function(origin){
    this.origin = origin;
}

Node.prototype.getOrigin = function(){
    return this.origin;
}

Node.prototype.setAlign = function(align){
    this.align = align;
}

Node.prototype.getAlign = function(){
    return this.align;
}

Node.prototype.setRotation = function(rotation){
    this.rotation = rotation;
}

Node.prototype.getRotation = function(){
    return this.rotation;
}

Node.prototype.setOpacity = function(opacity){
    this.opacity = opacity;
}

Node.prototype.getOpacity = function(){
    return this.opacity;
}

Node.prototype.observe = function(param) {
    var n = this;
    this.observables[param] = function(changes){
        changes.forEach(function(change) {
            //publish the change via pub/sub
            n.eventManager.pub(param,change);
        });
    };

    Object.observe(this[param], this.observables[param]);
}

Node.prototype.unobserve = function(param) {
    Object.unobserve(this[param], this.observables[param]);
}


Node.prototype.eventManager = function(){

  var events = {};
  var hasEvent = events.hasOwnProperty;

  return {
    sub: function(ev, listener) {

      this.observe(ev);
      // Create the event's object if not yet created
      if(!hasEvent.call(events, ev)) events[ev] = [];

      // Add the listener to queue
      var index = events[ev].push(listener) - 1;

      // Provide handle back for removal of topic
      return {
        remove: function() {
          this.unobserve(ev);
          delete events[ev][index];
        }
      };
    },
    pub: function(ev, info) {
      // If the event doesn't exist, or there's no listeners in queue, just leave
      if(!hasEvent.call(events, ev)) return;

      // Cycle through events queue, fire!
      events[ev].forEach(function(item) {
      		item(info != undefined ? info : {});
      });
    }
  };
}

module.exports = Node;

},{}],7:[function(require,module,exports){
var Scene = function(graph){

    this.graph = graph || {};
    this.length = 0;

}

Scene.prototype.addChild = function(node){
    node.id = 'node-'+this.length;
    this.length++;
    this.graph[node.id] = node;
}


Scene.prototype.fetchNode = function(id) {
    return this.graph[id];
}

Scene.prototype.find = function(query) {
    var queryArray = [];
    for(q in query){
        for(prop in this.graph) {
            for(p in this.graph[prop]){
                if (p === q && this.graph[prop][p] === query[q]) {
                    queryArray.push(this.graph[prop]);
                }
            }
        }
    }
    return queryArray;
}

Scene.prototype.findOne = function(query) {

    for(q in query){
        for(prop in this.graph) {
            for(p in this.graph[prop]){
                if (p === q && this.graph[prop][p] === query[q]) {
                    return this.graph[prop];
                }
            }
        }
    }

}


Scene.prototype.update = function(tick){
    //console.log(tick, this.graph['node-1'].t.get());
}

module.exports = new Scene();

},{}],8:[function(require,module,exports){
module.exports = {
    Clock: require('./Clock'),
    Engine: require('./Engine'),
    Scene: require('./Scene'),
    Node: require('./Node')
};

},{"./Clock":4,"./Engine":5,"./Node":6,"./Scene":7}],9:[function(require,module,exports){
module.exports = {
    core: require('./core'),
    components: require('./components'),
    math: require('./math'),
    transitions: require('./transitions')
};

},{"./components":3,"./core":8,"./math":15,"./transitions":18}],10:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A 3x3 numerical matrix, represented as an array.
 *
 * @class Mat33
 *
 * @param {Array} values a 3x3 matrix flattened
 */
function Mat33(values) {
    this.values = values || [1,0,0,0,1,0,0,0,1];
}

/**
 * Return the values in the Mat33 as an array.
 *
 * @method
 *
 * @return {Array} matrix values as array of rows.
 */
Mat33.prototype.get = function get() {
    return this.values;
};

/**
 * Set the values of the current Mat33.
 *
 * @method
 *
 * @param {Array} values Array of nine numbers to set in the Mat33.
 *
 * @return {Mat33} this
 */
Mat33.prototype.set = function set(values) {
    this.values = values;
    return this;
};

/**
 * Copy the values of the input Mat33.
 *
 * @method
 *
 * @param {Mat33} matrix The Mat33 to copy.
 * 
 * @return {Mat33} this
 */
Mat33.prototype.copy = function copy(matrix) {
    var A = this.values;
    var B = matrix.values;

    A[0] = B[0];
    A[1] = B[1];
    A[2] = B[2];
    A[3] = B[3];
    A[4] = B[4];
    A[5] = B[5];
    A[6] = B[6];
    A[7] = B[7];
    A[8] = B[8];

    return this;
};

/**
 * Take this Mat33 as A, input vector V as a column vector, and return Mat33 product (A)(V).
 *
 * @method
 *
 * @param {Vec3} v Vector to rotate.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The input vector after multiplication.
 */
Mat33.prototype.vectorMultiply = function vectorMultiply(v, output) {
    var M = this.values;
    var v0 = v.x;
    var v1 = v.y;
    var v2 = v.z;

    output.x = M[0]*v0 + M[1]*v1 + M[2]*v2;
    output.y = M[3]*v0 + M[4]*v1 + M[5]*v2;
    output.z = M[6]*v0 + M[7]*v1 + M[8]*v2;

    return output;
};

/**
 * Multiply the provided Mat33 with the current Mat33.  Result is (this) * (matrix).
 *
 * @method
 *
 * @param {Mat33} matrix Input Mat33 to multiply on the right.
 *
 * @return {Mat33} this
 */
Mat33.prototype.multiply = function multiply(matrix) {
    var A = this.values;
    var B = matrix.values;

    var A0 = A[0];
    var A1 = A[1];
    var A2 = A[2];
    var A3 = A[3];
    var A4 = A[4];
    var A5 = A[5];
    var A6 = A[6];
    var A7 = A[7];
    var A8 = A[8];

    var B0 = B[0];
    var B1 = B[1];
    var B2 = B[2];
    var B3 = B[3];
    var B4 = B[4];
    var B5 = B[5];
    var B6 = B[6];
    var B7 = B[7];
    var B8 = B[8];

    A[0] = A0*B0 + A1*B3 + A2*B6;
    A[1] = A0*B1 + A1*B4 + A2*B7;
    A[2] = A0*B2 + A1*B5 + A2*B8;
    A[3] = A3*B0 + A4*B3 + A5*B6;
    A[4] = A3*B1 + A4*B4 + A5*B7;
    A[5] = A3*B2 + A4*B5 + A5*B8;
    A[6] = A6*B0 + A7*B3 + A8*B6;
    A[7] = A6*B1 + A7*B4 + A8*B7;
    A[8] = A6*B2 + A7*B5 + A8*B8;

    return this;
};

/**
 * Transposes the Mat33.
 *
 * @method
 *
 * @return {Mat33} this
 */
Mat33.prototype.transpose = function transpose() {
    var M = this.values;

    var M1 = M[1];
    var M2 = M[2];
    var M3 = M[3];
    var M5 = M[5];
    var M6 = M[6];
    var M7 = M[7];

    M[1] = M3;
    M[2] = M6;
    M[3] = M1;
    M[5] = M7;
    M[6] = M2;
    M[7] = M5;

    return this;
};

/**
 * The determinant of the Mat33.
 *
 * @method
 *
 * @return {Number} The determinant.
 */
Mat33.prototype.getDeterminant = function getDeterminant() {
    var M = this.values;

    var M3 = M[3];
    var M4 = M[4];
    var M5 = M[5];
    var M6 = M[6];
    var M7 = M[7];
    var M8 = M[8];

    var det = M[0]*(M4*M8 - M5*M7) -
              M[1]*(M3*M8 - M5*M6) +
              M[2]*(M3*M7 - M4*M6);

    return det;
};

/**
 * The inverse of the Mat33.
 *
 * @method
 *
 * @return {Mat33} this
 */
Mat33.prototype.inverse = function inverse() {
    var M = this.values;

    var M0 = M[0];
    var M1 = M[1];
    var M2 = M[2];
    var M3 = M[3];
    var M4 = M[4];
    var M5 = M[5];
    var M6 = M[6];
    var M7 = M[7];
    var M8 = M[8];

    var det = M0*(M4*M8 - M5*M7) -
              M1*(M3*M8 - M5*M6) +
              M2*(M3*M7 - M4*M6);

    if (Math.abs(det) < 1e-40) return null;

    det = 1 / det;

    M[0] = (M4*M8 - M5*M7) * det;
    M[3] = (-M3*M8 + M5*M6) * det;
    M[6] = (M3*M7 - M4*M6) * det;
    M[1] = (-M1*M8 + M2*M7) * det;
    M[4] = (M0*M8 - M2*M6) * det;
    M[7] = (-M0*M7 + M1*M6) * det;
    M[2] = (M1*M5 - M2*M4) * det;
    M[5] = (-M0*M5 + M2*M3) * det;
    M[8] = (M0*M4 - M1*M3) * det;

    return this;
};

/**
 * Clones the input Mat33.
 *
 * @method
 *
 * @param {Mat33} m Mat33 to clone.
 *
 * @return {Mat33} New copy of the original Mat33.
 */
Mat33.clone = function clone(m) {
    return new Mat33(m.values.slice());
};

/**
 * The inverse of the Mat33.
 *
 * @method
 *
 * @param {Mat33} matrix Mat33 to invert.
 * @param {Mat33} output Mat33 in which to place the result.
 *
 * @return {Mat33} The Mat33 after the invert.
 */
Mat33.inverse = function inverse(matrix, output) {
    var M = matrix.values;
    var result = output.values;

    var M0 = M[0];
    var M1 = M[1];
    var M2 = M[2];
    var M3 = M[3];
    var M4 = M[4];
    var M5 = M[5];
    var M6 = M[6];
    var M7 = M[7];
    var M8 = M[8];

    var det = M0*(M4*M8 - M5*M7) -
              M1*(M3*M8 - M5*M6) +
              M2*(M3*M7 - M4*M6);

    if (Math.abs(det) < 1e-40) return null;

    det = 1 / det;

    result[0] = (M4*M8 - M5*M7) * det;
    result[3] = (-M3*M8 + M5*M6) * det;
    result[6] = (M3*M7 - M4*M6) * det;
    result[1] = (-M1*M8 + M2*M7) * det;
    result[4] = (M0*M8 - M2*M6) * det;
    result[7] = (-M0*M7 + M1*M6) * det;
    result[2] = (M1*M5 - M2*M4) * det;
    result[5] = (-M0*M5 + M2*M3) * det;
    result[8] = (M0*M4 - M1*M3) * det;

    return output;
};

/**
 * Transposes the Mat33.
 *
 * @method
 *
 * @param {Mat33} matrix Mat33 to transpose.
 * @param {Mat33} output Mat33 in which to place the result.
 *
 * @return {Mat33} The Mat33 after the transpose.
 */
Mat33.transpose = function transpose(matrix, output) {
    var M = matrix.values;
    var result = output.values;

    var M0 = M[0];
    var M1 = M[1];
    var M2 = M[2];
    var M3 = M[3];
    var M4 = M[4];
    var M5 = M[5];
    var M6 = M[6];
    var M7 = M[7];
    var M8 = M[8];

    result[0] = M0;
    result[1] = M3;
    result[2] = M6;
    result[3] = M1;
    result[4] = M4;
    result[5] = M7;
    result[6] = M2;
    result[7] = M5;
    result[8] = M8;

    return output;
};

/**
 * Add the provided Mat33's.
 *
 * @method
 *
 * @param {Mat33} matrix1 The left Mat33.
 * @param {Mat33} matrix2 The right Mat33.
 * @param {Mat33} output Mat33 in which to place the result.
 *
 * @return {Mat33} The result of the addition.
 */
Mat33.add = function add(matrix1, matrix2, output) {
    var A = matrix1.values;
    var B = matrix2.values;
    var result = output.values;

    var A0 = A[0];
    var A1 = A[1];
    var A2 = A[2];
    var A3 = A[3];
    var A4 = A[4];
    var A5 = A[5];
    var A6 = A[6];
    var A7 = A[7];
    var A8 = A[8];

    var B0 = B[0];
    var B1 = B[1];
    var B2 = B[2];
    var B3 = B[3];
    var B4 = B[4];
    var B5 = B[5];
    var B6 = B[6];
    var B7 = B[7];
    var B8 = B[8];

    result[0] = A0 + B0;
    result[1] = A1 + B1;
    result[2] = A2 + B2;
    result[3] = A3 + B3;
    result[4] = A4 + B4;
    result[5] = A5 + B5;
    result[6] = A6 + B6;
    result[7] = A7 + B7;
    result[8] = A8 + B8;

    return output;
};

/**
 * Subtract the provided Mat33's.
 *
 * @method
 *
 * @param {Mat33} matrix1 The left Mat33.
 * @param {Mat33} matrix2 The right Mat33.
 * @param {Mat33} output Mat33 in which to place the result.
 *
 * @return {Mat33} The result of the subtraction.
 */
Mat33.subtract = function subtract(matrix1, matrix2, output) {
    var A = matrix1.values;
    var B = matrix2.values;
    var result = output.values;

    var A0 = A[0];
    var A1 = A[1];
    var A2 = A[2];
    var A3 = A[3];
    var A4 = A[4];
    var A5 = A[5];
    var A6 = A[6];
    var A7 = A[7];
    var A8 = A[8];

    var B0 = B[0];
    var B1 = B[1];
    var B2 = B[2];
    var B3 = B[3];
    var B4 = B[4];
    var B5 = B[5];
    var B6 = B[6];
    var B7 = B[7];
    var B8 = B[8];

    result[0] = A0 - B0;
    result[1] = A1 - B1;
    result[2] = A2 - B2;
    result[3] = A3 - B3;
    result[4] = A4 - B4;
    result[5] = A5 - B5;
    result[6] = A6 - B6;
    result[7] = A7 - B7;
    result[8] = A8 - B8;

    return output;
};
/**
 * Multiply the provided Mat33 M2 with this Mat33.  Result is (this) * (M2).
 *
 * @method
 * @param {Mat33} matrix1 The left Mat33.
 * @param {Mat33} matrix2 The right Mat33.
 * @param {Mat33} output Mat33 in which to place the result.
 *
 * @return {Mat33} the result of the multiplication.
 */
Mat33.multiply = function multiply(matrix1, matrix2, output) {
    var A = matrix1.values;
    var B = matrix2.values;
    var result = output.values;

    var A0 = A[0];
    var A1 = A[1];
    var A2 = A[2];
    var A3 = A[3];
    var A4 = A[4];
    var A5 = A[5];
    var A6 = A[6];
    var A7 = A[7];
    var A8 = A[8];

    var B0 = B[0];
    var B1 = B[1];
    var B2 = B[2];
    var B3 = B[3];
    var B4 = B[4];
    var B5 = B[5];
    var B6 = B[6];
    var B7 = B[7];
    var B8 = B[8];

    result[0] = A0*B0 + A1*B3 + A2*B6;
    result[1] = A0*B1 + A1*B4 + A2*B7;
    result[2] = A0*B2 + A1*B5 + A2*B8;
    result[3] = A3*B0 + A4*B3 + A5*B6;
    result[4] = A3*B1 + A4*B4 + A5*B7;
    result[5] = A3*B2 + A4*B5 + A5*B8;
    result[6] = A6*B0 + A7*B3 + A8*B6;
    result[7] = A6*B1 + A7*B4 + A8*B7;
    result[8] = A6*B2 + A7*B5 + A8*B8;

    return output;
};

module.exports = Mat33;

},{}],11:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var sin = Math.sin;
var cos = Math.cos;
var asin = Math.asin;
var acos = Math.acos;
var atan2 = Math.atan2;
var sqrt = Math.sqrt;

/**
 * A vector-like object used to represent rotations. If theta is the angle of
 * rotation, and (x', y', z') is a normalized vector representing the axis of
 * rotation, then w = cos(theta/2), x = sin(theta/2)*x', y = sin(theta/2)*y',
 * and z = sin(theta/2)*z'.
 *
 * @class Quaternion
 *
 * @param {Number} w The w component.
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 */
function Quaternion(w, x, y, z) {
    this.w = w || 1;
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
}

/**
 * Multiply the current Quaternion by input Quaternion q.
 * Left-handed multiplication.
 *
 * @method
 *
 * @param {Quaternion} q The Quaternion to multiply by on the right.
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.multiply = function multiply(q) {
    var x1 = this.x;
    var y1 = this.y;
    var z1 = this.z;
    var w1 = this.w;
    var x2 = q.x;
    var y2 = q.y;
    var z2 = q.z;
    var w2 = q.w || 0;

    this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
    this.x = x1 * w2 + x2 * w1 + y2 * z1 - y1 * z2;
    this.y = y1 * w2 + y2 * w1 + x1 * z2 - x2 * z1;
    this.z = z1 * w2 + z2 * w1 + x2 * y1 - x1 * y2;
    return this;
};

/**
 * Multiply the current Quaternion by input Quaternion q on the left, i.e. q * this.
 * Left-handed multiplication.
 *
 * @method
 *
 * @param {Quaternion} q The Quaternion to multiply by on the left.
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.leftMultiply = function leftMultiply(q) {
    var x1 = q.x;
    var y1 = q.y;
    var z1 = q.z;
    var w1 = q.w || 0;
    var x2 = this.x;
    var y2 = this.y;
    var z2 = this.z;
    var w2 = this.w;

    this.w = w1*w2 - x1*x2 - y1*y2 - z1*z2;
    this.x = x1*w2 + x2*w1 + y2*z1 - y1*z2;
    this.y = y1*w2 + y2*w1 + x1*z2 - x2*z1;
    this.z = z1*w2 + z2*w1 + x2*y1 - x1*y2;
    return this;
};

/**
 * Apply the current Quaternion to input Vec3 v, according to
 * v' = ~q * v * q.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The rotated version of the Vec3.
 */
Quaternion.prototype.rotateVector = function rotateVector(v, output) {
    var cw = this.w;
    var cx = -this.x;
    var cy = -this.y;
    var cz = -this.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    output.x = tx * w + x * tw + y * tz - ty * z;
    output.y = ty * w + y * tw + tx * z - x * tz;
    output.z = tz * w + z * tw + x * ty - tx * y;
    return output;
};

/**
 * Invert the current Quaternion.
 *
 * @method
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.invert = function invert() {
    this.w = -this.w;
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
};

/**
 * Conjugate the current Quaternion.
 *
 * @method
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.conjugate = function conjugate() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
};

/**
 * Compute the length (norm) of the current Quaternion.
 *
 * @method
 *
 * @return {Number} length of the Quaternion
 */
Quaternion.prototype.length = function length() {
    var w = this.w;
    var x = this.x;
    var y = this.y;
    var z = this.z;
    return sqrt(w * w + x * x + y * y + z * z);
};

/**
 * Alter the current Quaternion to be of unit length;
 *
 * @method
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.normalize = function normalize() {
    var w = this.w;
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var length = sqrt(w * w + x * x + y * y + z * z);
    if (length === 0) return this;
    length = 1 / length;
    this.w *= length;
    this.x *= length;
    this.y *= length;
    this.z *= length;
    return this;
};

/**
 * Set the w, x, y, z components of the current Quaternion.
 *
 * @method
 *
 * @param {Number} w The w component.
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.set = function set(w, x ,y, z) {
    if (w != null) this.w = w;
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    if (z != null) this.z = z;
    return this;
};

/**
 * Copy input Quaternion q onto the current Quaternion.
 *
 * @method
 *
 * @param {Quaternion} q The reference Quaternion.
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.copy = function copy(q) {
    this.w = q.w;
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    return this;
};

/**
 * Reset the current Quaternion.
 *
 * @method
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.clear = function clear() {
    this.w = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
};

/**
 * The dot product. Can be used to determine the cosine of the angle between
 * the two rotations, assuming both Quaternions are of unit length.
 *
 * @method
 *
 * @param {Quaternion} q The other Quaternion.
 *
 * @return {Number} the resulting dot product
 */
Quaternion.prototype.dot = function dot(q) {
    return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
};

/**
 * Spherical linear interpolation.
 *
 * @method
 *
 * @param {Quaternion} q The final orientation.
 * @param {Number} t The tween parameter.
 * @param {Vec3} output Vec3 in which to put the result.
 *
 * @return {Quaternion} The quaternion the slerp results were saved to
 */
Quaternion.prototype.slerp = function slerp(q, t, output) {
    var w = this.w;
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qw = q.w;
    var qx = q.x;
    var qy = q.y;
    var qz = q.z;

    var omega;
    var cosomega;
    var sinomega;
    var scaleFrom;
    var scaleTo;

    cosomega = w * qw + x * qx + y * qy + z * qz;
    if ((1.0 - cosomega) > 1e-5) {
        omega = acos(cosomega);
        sinomega = sin(omega);
        scaleFrom = sin((1.0 - t) * omega) / sinomega;
        scaleTo = sin(t * omega) / sinomega;
    }
    else {
        scaleFrom = 1.0 - t;
        scaleTo = t;
    }

    output.w = w * scaleFrom + qw * scaleTo;
    output.x = x * scaleFrom + qx * scaleTo;
    output.y = y * scaleFrom + qy * scaleTo;
    output.z = z * scaleFrom + qz * scaleTo;

    return output;
};

/**
 * Get the Mat33 matrix corresponding to the current Quaternion.
 *
 * @method
 *
 * @param {Object} output Object to process the Transform matrix
 *
 * @return {Array} the Quaternion as a Transform matrix
 */
Quaternion.prototype.toMatrix = function toMatrix(output) {
    var w = this.w;
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var xx = x*x;
    var yy = y*y;
    var zz = z*z;
    var xy = x*y;
    var xz = x*z;
    var yz = y*z;

    return output.set([
        1 - 2 * (yy + zz), 2 * (xy - w*z), 2 * (xz + w*y),
        2 * (xy + w*z), 1 - 2 * (xx + zz), 2 * (yz - w*x),
        2 * (xz - w*y), 2 * (yz + w*x), 1 - 2 * (xx + yy)
    ]);
};

/**
 * The rotation angles about the x, y, and z axes corresponding to the
 * current Quaternion, when applied in the ZYX order.
 *
 * @method
 *
 * @param {Vec3} output Vec3 in which to put the result.
 *
 * @return {Vec3} the Vec3 the result was stored in
 */
Quaternion.prototype.toEuler = function toEuler(output) {
    var w = this.w;
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var xx = x * x;
    var yy = y * y;
    var zz = z * z;

    var ty = 2 * (x * z + y * w);
    ty = ty < -1 ? -1 : ty > 1 ? 1 : ty;

    output.x = atan2(2 * (x * w - y * z), 1 - 2 * (xx + yy));
    output.y = asin(ty);
    output.z = atan2(2 * (z * w - x * y), 1 - 2 * (yy + zz));

    return output;
};

/**
 * The Quaternion corresponding to the Euler angles x, y, and z,
 * applied in the ZYX order.
 *
 * @method
 *
 * @param {Number} x The angle of rotation about the x axis.
 * @param {Number} y The angle of rotation about the y axis.
 * @param {Number} z The angle of rotation about the z axis.
 * @param {Quaternion} output Quaternion in which to put the result.
 *
 * @return {Quaternion} The equivalent Quaternion.
 */
Quaternion.prototype.fromEuler = function fromEuler(x, y, z) {
    var hx = x * 0.5;
    var hy = y * 0.5;
    var hz = z * 0.5;

    var sx = sin(hx);
    var sy = sin(hy);
    var sz = sin(hz);
    var cx = cos(hx);
    var cy = cos(hy);
    var cz = cos(hz);

    this.w = cx * cy * cz - sx * sy * sz;
    this.x = sx * cy * cz + cx * sy * sz;
    this.y = cx * sy * cz - sx * cy * sz;
    this.z = cx * cy * sz + sx * sy * cz;

    return this;
};

/**
 * Alter the current Quaternion to reflect a rotation of input angle about
 * input axis x, y, and z.
 *
 * @method
 *
 * @param {Number} angle The angle of rotation.
 * @param {Vec3} x The axis of rotation.
 * @param {Vec3} y The axis of rotation.
 * @param {Vec3} z The axis of rotation.
 *
 * @return {Quaternion} this
 */
Quaternion.prototype.fromAngleAxis = function fromAngleAxis(angle, x, y, z) {
    var len = sqrt(x * x + y * y + z * z);
    if (len === 0) {
        this.w = 1;
        this.x = this.y = this.z = 0;
    }
    else {
        len = 1 / len;
        var halfTheta = angle * 0.5;
        var s = sin(halfTheta);
        this.w = cos(halfTheta);
        this.x = s * x * len;
        this.y = s * y * len;
        this.z = s * z * len;
    }
    return this;
};

/**
 * Multiply the input Quaternions.
 * Left-handed coordinate system multiplication.
 *
 * @method
 *
 * @param {Quaternion} q1 The left Quaternion.
 * @param {Quaternion} q2 The right Quaternion.
 * @param {Quaternion} output Quaternion in which to place the result.
 *
 * @return {Quaternion} The product of multiplication.
 */
Quaternion.multiply = function multiply(q1, q2, output) {
    var w1 = q1.w || 0;
    var x1 = q1.x;
    var y1 = q1.y;
    var z1 = q1.z;

    var w2 = q2.w || 0;
    var x2 = q2.x;
    var y2 = q2.y;
    var z2 = q2.z;

    output.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
    output.x = x1 * w2 + x2 * w1 + y2 * z1 - y1 * z2;
    output.y = y1 * w2 + y2 * w1 + x1 * z2 - x2 * z1;
    output.z = z1 * w2 + z2 * w1 + x2 * y1 - x1 * y2;
    return output;
};

/**
 * Normalize the input quaternion.
 *
 * @method
 *
 * @param {Quaternion} q The reference Quaternion.
 * @param {Quaternion} output Quaternion in which to place the result.
 *
 * @return {Quaternion} The normalized quaternion.
 */
Quaternion.normalize = function normalize(q, output) {
    var w = q.w;
    var x = q.x;
    var y = q.y;
    var z = q.z;
    var length = sqrt(w * w + x * x + y * y + z * z);
    if (length === 0) return this;
    length = 1 / length;
    output.w *= length;
    output.x *= length;
    output.y *= length;
    output.z *= length;
    return output;
};

/**
 * The conjugate of the input Quaternion.
 *
 * @method
 *
 * @param {Quaternion} q The reference Quaternion.
 * @param {Quaternion} output Quaternion in which to place the result.
 *
 * @return {Quaternion} The conjugate Quaternion.
 */
Quaternion.conjugate = function conjugate(q, output) {
    output.w = q.w;
    output.x = -q.x;
    output.y = -q.y;
    output.z = -q.z;
    return output;
};

/**
 * Clone the input Quaternion.
 *
 * @method
 *
 * @param {Quaternion} q the reference Quaternion.
 *
 * @return {Quaternion} The cloned Quaternion.
 */
Quaternion.clone = function clone(q) {
    return new Quaternion(q.w, q.x, q.y, q.z);
};

/**
 * The dot product of the two input Quaternions.
 *
 * @method
 *
 * @param {Quaternion} q1 The left Quaternion.
 * @param {Quaternion} q2 The right Quaternion.
 *
 * @return {Number} The dot product of the two Quaternions.
 */
Quaternion.dot = function dot(q1, q2) {
    return q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
};

module.exports = Quaternion;

},{}],12:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var Vec3 = require('./Vec3');


var Ray = function ( origin, direction ) {

	this.origin = ( origin !== undefined ) ?  new Vec3(origin[0],origin[1],origin[2]) : new Vec3();
	this.direction = ( direction !== undefined ) ? new Vec3(direction[0],direction[1],direction[2]) : new Vec3();

};

Ray.prototype.set = function ( origin, direction ) {

		this.origin.copy( origin );
		this.direction.copy( direction );

		return this;

};

Ray.prototype.copy = function ( ray ) {

		this.origin.copy( ray.origin );
		this.direction.copy( ray.direction );

		return this;

};

Ray.prototype.at =  function ( t ) {

    var result = new Vec3();

    return result.copy( this.direction ).scale( t ).add( this.origin );

};


Ray.prototype.intersectSphere = function (center, radius) {

	// from http://www.scratchapixel.com/lessons/3d-basic-lessons/lesson-7-intersecting-simple-shapes/ray-sphere-intersection/

	var vec = new Vec3();
    var c = new Vec3(center[0],center[1],center[2]);

	vec.subVectors( c, this.origin );

	var tca = vec.dot( this.direction );

	var d2 = vec.dot( vec ) - tca * tca;

	var radius2 = radius * radius;

	if ( d2 > radius2 ) return null;

	var thc = Math.sqrt( radius2 - d2 );

	// t0 = first intersect point - entrance on front of sphere
	var t0 = tca - thc;

	// t1 = second intersect point - exit point on back of sphere
	var t1 = tca + thc;

	// test to see if both t0 and t1 are behind the ray - if so, return null
	if ( t0 < 0 && t1 < 0 ) return null;

	// test to see if t0 is behind the ray:
	// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
	// in order to always return an intersect point that is in front of the ray.
	if ( t0 < 0 ) return this.at( t1 );

	// else t0 is in front of the ray, so return the first collision point scaled by t0
	return this.at( t0 );

};

Ray.prototype.intersectBox = function(center, size) {

    var tmin,
        tmax,
        tymin,
        tymax,
        tzmin,
        tzmax,
        box,
        out,
        invdirx = 1 / this.direction.x,
        invdiry = 1 / this.direction.y,
        invdirz = 1 / this.direction.z;

    box = {
        min: {
            x: center[0]-(size[0]/2),
            y: center[1]-(size[1]/2),
            z: center[2]-(size[2]/2)
        },
        max: {
            x: center[0]+(size[0]/2),
            y: center[1]+(size[1]/2),
            z: center[2]+(size[2]/2)
        }
    };

    if ( invdirx >= 0 ) {

        tmin = ( box.min.x - this.origin.x ) * invdirx;
        tmax = ( box.max.x - this.origin.x ) * invdirx;

    } else {

        tmin = ( box.max.x - this.origin.x ) * invdirx;
        tmax = ( box.min.x - this.origin.x ) * invdirx;
    }

    if ( invdiry >= 0 ) {

        tymin = ( box.min.y - this.origin.y ) * invdiry;
        tymax = ( box.max.y - this.origin.y ) * invdiry;

    } else {

        tymin = ( box.max.y - this.origin.y ) * invdiry;
        tymax = ( box.min.y - this.origin.y ) * invdiry;
    }

    if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

    if ( tymin > tmin || tmin !== tmin ) tmin = tymin;

    if ( tymax < tmax || tmax !== tmax ) tmax = tymax;

    if ( invdirz >= 0 ) {

        tzmin = ( box.min.z - this.origin.z ) * invdirz;
        tzmax = ( box.max.z - this.origin.z ) * invdirz;

    } else {

        tzmin = ( box.max.z - this.origin.z ) * invdirz;
        tzmax = ( box.min.z - this.origin.z ) * invdirz;
    }

    if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

    if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

    if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;


    if ( tmax < 0 ) return null;

    out = this.direction.scale(tmin >= 0 ? tmin : tmax);
    return out.add(out, this.origin, out);

};


Ray.prototype.equals = function ( ray ) {

		return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

};

Ray.prototype.clone = function () {

		return new Ray().copy( this );

};


module.exports = Ray;

},{"./Vec3":14}],13:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A two-dimensional vector.
 *
 * @class Vec2
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 */
var Vec2 = function(x, y) {
    if (x instanceof Array || x instanceof Float32Array) {
        this.x = x[0] || 0;
        this.y = x[1] || 0;
    }
    else {
        this.x = x || 0;
        this.y = y || 0;
    }
};

/**
 * Set the components of the current Vec2.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 *
 * @return {Vec2} this
 */
Vec2.prototype.set = function set(x, y) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    return this;
};

/**
 * Add the input v to the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to add.
 *
 * @return {Vec2} this
 */
Vec2.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
};

/**
 * Subtract the input v from the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to subtract.
 *
 * @return {Vec2} this
 */
Vec2.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
};

/**
 * Scale the current Vec2 by a scalar or Vec2.
 *
 * @method
 *
 * @param {Number|Vec2} s The Number or vec2 by which to scale.
 *
 * @return {Vec2} this
 */
Vec2.prototype.scale = function scale(s) {
    if (s instanceof Vec2) {
        this.x *= s.x;
        this.y *= s.y;
    }
    else {
        this.x *= s;
        this.y *= s;
    }
    return this;
};

/**
 * Rotate the Vec2 counter-clockwise by theta about the z-axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec2} this
 */
Vec2.prototype.rotate = function(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
};

/**
 * The cross product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.cross = function(v) {
    return this.x * v.y - this.y * v.x;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.invert = function invert() {
    this.x *= -1;
    this.y *= -1;
    return this;
};

/**
 * Apply a function component-wise to the current Vec2.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec2} this
 */
Vec2.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    return this;
};

/**
 * Get the magnitude of the current Vec2.
 *
 * @method
 *
 * @return {Number} the length of the vector
 */
Vec2.prototype.length = function length() {
    var x = this.x;
    var y = this.y;

    return Math.sqrt(x * x + y * y);
};

/**
 * Copy the input onto the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v Vec2 to copy
 *
 * @return {Vec2} this
 */
Vec2.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
};

/**
 * Reset the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec2 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the length is 0
 */
Vec2.prototype.isZero = function isZero() {
    if (this.x !== 0 || this.y !== 0) return false;
    else return true;
};

/**
 * The array form of the current Vec2.
 *
 * @method
 *
 * @return {Array} the Vec to as an array
 */
Vec2.prototype.toArray = function toArray() {
    return [this.x, this.y];
};

/**
 * Normalize the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The normalized Vec2.
 */
Vec2.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;

    var length = Math.sqrt(x * x + y * y) || 1;
    length = 1 / length;
    output.x = v.x * length;
    output.y = v.y * length;

    return output;
};

/**
 * Clone the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to clone.
 *
 * @return {Vec2} The cloned Vec2.
 */
Vec2.clone = function clone(v) {
    return new Vec2(v.x, v.y);
};

/**
 * Add the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the addition.
 */
Vec2.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;

    return output;
};

/**
 * Subtract the second Vec2 from the first.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the subtraction.
 */
Vec2.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    return output;
};

/**
 * Scale the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Number} s Number to scale by.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the scaling.
 */
Vec2.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    return output;
};

/**
 * The dot product of the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 *
 * @return {Number} The dot product.
 */
Vec2.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
};

/**
 * The cross product of the input Vec2's.
 *
 * @method
 *
 * @param {Number} v1 The left Vec2.
 * @param {Number} v2 The right Vec2.
 *
 * @return {Number} The z-component of the cross product.
 */
Vec2.cross = function(v1,v2) {
    return v1.x * v2.y - v1.y * v2.x;
};

module.exports = Vec2;

},{}],14:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A three-dimensional vector.
 *
 * @class Vec3
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 */
var Vec3 = function(x, y, z){
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

/**
 * Set the components of the current Vec3.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 *
 * @return {Vec3} this
 */
Vec3.prototype.set = function set(x, y, z) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    if (z != null) this.z = z;

    return this;
};

/**
 * Add the input v to the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to add.
 *
 * @return {Vec3} this
 */
Vec3.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
};

/**
 * Subtract the input v from the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to subtract.
 *
 * @return {Vec3} this
 */
Vec3.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
};

/**
 * Subtract the input a from b and create new vector.
 *
 * @method
 *
 * @param {Vec3} a The Vec3 to subtract.
 * @param {Vec3} b The Vec3 to subtract.
 *
 * @return {Vec3} this
 */
Vec3.prototype.subVectors = function ( a, b ) {

	this.x = a.x - b.x;
	this.y = a.y - b.y;
	this.z = a.z - b.z;

	return this;

};

/**
 * Rotate the current Vec3 by theta clockwise about the x axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateX = function rotateX(theta) {
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.y = y * cosTheta - z * sinTheta;
    this.z = y * sinTheta + z * cosTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the y axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = z * sinTheta + x * cosTheta;
    this.z = z * cosTheta - x * sinTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the z axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 *
 * @method
 *
 * @param {Vec3} v The other Vec3.
 *
 * @return {Vec3} this
 */
Vec3.prototype.dot = function dot(v) {
    return this.x*v.x + this.y*v.y + this.z*v.z;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 * Stores the result in the current Vec3.
 *
 * @method cross
 *
 * @param {Vec3} v The other Vec3
 *
 * @return {Vec3} this
 */
Vec3.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    this.x = y * vz - z * vy;
    this.y = z * vx - x * vz;
    this.z = x * vy - y * vx;
    return this;
};

/**
 * Scale the current Vec3 by a scalar.
 *
 * @method
 *
 * @param {Number} s The Number by which to scale
 *
 * @return {Vec3} this
 */
Vec3.prototype.scale = function scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;

    return this;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.invert = function invert() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
};

/**
 * Apply a function component-wise to the current Vec3.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec3} this
 */
Vec3.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    this.z = fn(this.z);

    return this;
};

/**
 * The magnitude of the current Vec3.
 *
 * @method
 *
 * @return {Number} the magnitude of the Vec3
 */
Vec3.prototype.length = function length() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return Math.sqrt(x * x + y * y + z * z);
};

/**
 * The magnitude squared of the current Vec3.
 *
 * @method
 *
 * @return {Number} magnitude of the Vec3 squared
 */
Vec3.prototype.lengthSq = function lengthSq() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return x * x + y * y + z * z;
};

/**
 * Copy the input onto the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v Vec3 to copy
 *
 * @return {Vec3} this
 */
Vec3.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
};

/**
 * Reset the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec3 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the magnitude is zero
 */
Vec3.prototype.isZero = function isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
};

/**
 * The array form of the current Vec3.
 *
 * @method
 *
 * @return {Array} a three element array representing the components of the Vec3
 */
Vec3.prototype.toArray = function toArray() {
    return [this.x, this.y, this.z];
};

/**
 * Preserve the orientation but change the length of the current Vec3 to 1.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.normalize = function normalize() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    len = 1 / len;

    this.x *= len;
    this.y *= len;
    this.z *= len;
    return this;
};

/**
 * Apply the rotation corresponding to the input (unit) Quaternion
 * to the current Vec3.
 *
 * @method
 *
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyRotation = function applyRotation(q) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = this.x;
    var vy = this.y;
    var vz = this.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    this.x = tx * w + x * tw + y * tz - ty * z;
    this.y = ty * w + y * tw + tx * z - x * tz;
    this.z = tz * w + z * tw + x * ty - tx * y;
    return this;
};

/**
 * Apply the input Mat33 the the current Vec3.
 *
 * @method
 *
 * @param {Mat33} matrix Mat33 to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyMatrix = function applyMatrix(matrix) {
    var M = matrix.get();

    var x = this.x;
    var y = this.y;
    var z = this.z;

    this.x = M[0]*x + M[1]*y + M[2]*z;
    this.y = M[3]*x + M[4]*y + M[5]*z;
    this.z = M[6]*x + M[7]*y + M[8]*z;
    return this;
};

/**
 * Normalize the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The normalize Vec3.
 */
Vec3.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;
    var z = v.z;

    var length = Math.sqrt(x * x + y * y + z * z) || 1;
    length = 1 / length;

    output.x = x * length;
    output.y = y * length;
    output.z = z * length;
    return output;
};

/**
 * Apply a rotation to the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The rotated version of the input Vec3.
 */
Vec3.applyRotation = function applyRotation(v, q, output) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    output.x = tx * w + x * tw + y * tz - ty * z;
    output.y = ty * w + y * tw + tx * z - x * tz;
    output.z = tz * w + z * tw + x * ty - tx * y;
    return output;
};

/**
 * Clone the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to clone.
 *
 * @return {Vec3} The cloned Vec3.
 */
Vec3.clone = function clone(v) {
    return new Vec3(v.x, v.y, v.z);
};

/**
 * Add the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the addition.
 */
Vec3.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;
    output.z = v1.z + v2.z;
    return output;
};

/**
 * Subtract the second Vec3 from the first.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the subtraction.
 */
Vec3.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    output.z = v1.z - v2.z;
    return output;
};

/**
 * Scale the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Number} s Number to scale by.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the scaling.
 */
Vec3.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    output.z = v.z * s;
    return output;
};

/**
 * Scale and add the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Number} s Number to scale by.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the scaling.
 */
Vec3.prototype.scaleAndAdd = function scaleAndAdd(a, b, s) {
    this.x = a.x + (b.x * s);
    this.y = a.y + (b.y * s);
    this.z = a.z + (b.z * s);
};


/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
Vec3.prototype.squaredDistance = function squaredDistance(b) {
    var x = b.x - this.x,
        y = b.y - this.y,
        z = b.z - this.z;
    return x*x + y*y + z*z
};

Vec3.prototype.distanceTo = function ( v ) {

    return Math.sqrt( this.squaredDistance( v ) );

};

/**
 * The dot product of the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 *
 * @return {Number} The dot product.
 */
Vec3.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

/**
 * The (right-handed) cross product of the input Vec3's.
 * v1 x v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into
 */
Vec3.cross = function cross(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    output.x = y1 * z2 - z1 * y2;
    output.y = z1 * x2 - x1 * z2;
    output.z = x1 * y2 - y1 * x2;
    return output;
};

/**
 * The projection of v1 onto v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into
 */
Vec3.project = function project(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    var scale = x1 * x2 + y1 * y2 + z1 * z2;
    scale /= x2 * x2 + y2 * y2 + z2 * z2;

    output.x = x2 * scale;
    output.y = y2 * scale;
    output.z = z2 * scale;

    return output;
};

Vec3.prototype.createFromArray = function(a){
    this.x = a[0] || 0;
    this.y = a[1] || 0;
    this.z = a[2] || 0;
};

module.exports = Vec3;

},{}],15:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module.exports = {
    Mat33: require('./Mat33'),
    Quaternion: require('./Quaternion'),
    Vec2: require('./Vec2'),
    Vec3: require('./Vec3'),
    Ray: require('./Ray')
};

},{"./Mat33":10,"./Quaternion":11,"./Ray":12,"./Vec2":13,"./Vec3":14}],16:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W008 */

'use strict';

/**
 * A library of curves which map an animation explicitly as a function of time.
 *
 * @namespace
 * @property {Function} linear
 * @property {Function} easeIn
 * @property {Function} easeOut
 * @property {Function} easeInOut
 * @property {Function} easeOutBounce
 * @property {Function} spring
 * @property {Function} inQuad
 * @property {Function} outQuad
 * @property {Function} inOutQuad
 * @property {Function} inCubic
 * @property {Function} outCubic
 * @property {Function} inOutCubic
 * @property {Function} inQuart
 * @property {Function} outQuart
 * @property {Function} inOutQuart
 * @property {Function} inQuint
 * @property {Function} outQuint
 * @property {Function} inOutQuint
 * @property {Function} inSine
 * @property {Function} outSine
 * @property {Function} inOutSine
 * @property {Function} inExpo
 * @property {Function} outExpo
 * @property {Function} inOutExp
 * @property {Function} inCirc
 * @property {Function} outCirc
 * @property {Function} inOutCirc
 * @property {Function} inElastic
 * @property {Function} outElastic
 * @property {Function} inOutElastic
 * @property {Function} inBounce
 * @property {Function} outBounce
 * @property {Function} inOutBounce
 * @property {Function} flat            - Useful for delaying the execution of
 *                                        a subsequent transition.
 */
var Curves = {
    linear: function(t) {
        return t;
    },

    easeIn: function(t) {
        return t*t;
    },

    easeOut: function(t) {
        return t*(2-t);
    },

    easeInOut: function(t) {
        if (t <= 0.5) return 2*t*t;
        else return -2*t*t + 4*t - 1;
    },

    easeOutBounce: function(t) {
        return t*(3 - 2*t);
    },

    spring: function(t) {
        return (1 - t) * Math.sin(6 * Math.PI * t) + t;
    },

    inQuad: function(t) {
        return t*t;
    },

    outQuad: function(t) {
        return -(t-=1)*t+1;
    },

    inOutQuad: function(t) {
        if ((t/=.5) < 1) return .5*t*t;
        return -.5*((--t)*(t-2) - 1);
    },

    inCubic: function(t) {
        return t*t*t;
    },

    outCubic: function(t) {
        return ((--t)*t*t + 1);
    },

    inOutCubic: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t;
        return .5*((t-=2)*t*t + 2);
    },

    inQuart: function(t) {
        return t*t*t*t;
    },

    outQuart: function(t) {
        return -((--t)*t*t*t - 1);
    },

    inOutQuart: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t*t;
        return -.5 * ((t-=2)*t*t*t - 2);
    },

    inQuint: function(t) {
        return t*t*t*t*t;
    },

    outQuint: function(t) {
        return ((--t)*t*t*t*t + 1);
    },

    inOutQuint: function(t) {
        if ((t/=.5) < 1) return .5*t*t*t*t*t;
        return .5*((t-=2)*t*t*t*t + 2);
    },

    inSine: function(t) {
        return -1.0*Math.cos(t * (Math.PI/2)) + 1.0;
    },

    outSine: function(t) {
        return Math.sin(t * (Math.PI/2));
    },

    inOutSine: function(t) {
        return -.5*(Math.cos(Math.PI*t) - 1);
    },

    inExpo: function(t) {
        return (t===0) ? 0.0 : Math.pow(2, 10 * (t - 1));
    },

    outExpo: function(t) {
        return (t===1.0) ? 1.0 : (-Math.pow(2, -10 * t) + 1);
    },

    inOutExpo: function(t) {
        if (t===0) return 0.0;
        if (t===1.0) return 1.0;
        if ((t/=.5) < 1) return .5 * Math.pow(2, 10 * (t - 1));
        return .5 * (-Math.pow(2, -10 * --t) + 2);
    },

    inCirc: function(t) {
        return -(Math.sqrt(1 - t*t) - 1);
    },

    outCirc: function(t) {
        return Math.sqrt(1 - (--t)*t);
    },

    inOutCirc: function(t) {
        if ((t/=.5) < 1) return -.5 * (Math.sqrt(1 - t*t) - 1);
        return .5 * (Math.sqrt(1 - (t-=2)*t) + 1);
    },

    inElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if (t===1) return 1.0;  if (!p) p=.3;
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/ p));
    },

    outElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if (t===1) return 1.0;  if (!p) p=.3;
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        return a*Math.pow(2,-10*t) * Math.sin((t-s)*(2*Math.PI)/p) + 1.0;
    },

    inOutElastic: function(t) {
        var s=1.70158;var p=0;var a=1.0;
        if (t===0) return 0.0;  if ((t/=.5)===2) return 1.0;  if (!p) p=(.3*1.5);
        s = p/(2*Math.PI) * Math.asin(1.0/a);
        if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/p));
        return a*Math.pow(2,-10*(t-=1)) * Math.sin((t-s)*(2*Math.PI)/p)*.5 + 1.0;
    },

    inBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        return t*t*((s+1)*t - s);
    },

    outBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        return ((--t)*t*((s+1)*t + s) + 1);
    },

    inOutBack: function(t, s) {
        if (s === undefined) s = 1.70158;
        if ((t/=.5) < 1) return .5*(t*t*(((s*=(1.525))+1)*t - s));
        return .5*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2);
    },

    inBounce: function(t) {
        return 1.0 - Curves.outBounce(1.0-t);
    },

    outBounce: function(t) {
        if (t < (1/2.75)) {
            return (7.5625*t*t);
        }
        else if (t < (2/2.75)) {
            return (7.5625*(t-=(1.5/2.75))*t + .75);
        }
        else if (t < (2.5/2.75)) {
            return (7.5625*(t-=(2.25/2.75))*t + .9375);
        }
        else {
            return (7.5625*(t-=(2.625/2.75))*t + .984375);
        }
    },

    inOutBounce: function(t) {
        if (t < .5) return Curves.inBounce(t*2) * .5;
        return Curves.outBounce(t*2-1.0) * .5 + .5;
    },

    flat: function() {
        return 0;
    }
};

module.exports = Curves;

},{}],17:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Curves = require('./Curves');
var Engine = require('../core/Engine');

/**
 * A state maintainer for a smooth transition between
 *    numerically-specified states. Example numeric states include floats and
 *    arrays of floats objects.
 *
 * An initial state is set with the constructor or using
 *     {@link Transitionable#from}. Subsequent transitions consist of an
 *     intermediate state, easing curve, duration and callback. The final state
 *     of each transition is the initial state of the subsequent one. Calls to
 *     {@link Transitionable#get} provide the interpolated state along the way.
 *
 * Note that there is no event loop here - calls to {@link Transitionable#get}
 *    are the only way to find state projected to the current (or provided)
 *    time and are the only way to trigger callbacks and mutate the internal
 *    transition queue.
 *
 * @example
 * var t = new Transitionable([0, 0]);
 * t
 *     .to([100, 0], 'linear', 1000)
 *     .delay(1000)
 *     .to([200, 0], 'outBounce', 1000);
 *
 * var div = document.createElement('div');
 * div.style.background = 'blue';
 * div.style.width = '100px';
 * div.style.height = '100px';
 * document.body.appendChild(div);
 *
 * div.addEventListener('click', function() {
 *     t.isPaused() ? t.resume() : t.pause();
 * });
 *
 * requestAnimationFrame(function loop() {
 *     div.style.transform = 'translateX(' + t.get()[0] + 'px)' + ' translateY(' + t.get()[1] + 'px)';
 *     requestAnimationFrame(loop);
 * });
 *
 * @class Transitionable
 * @constructor
 * @param {Number|Array.Number} initialState    initial state to transition
 *                                              from - equivalent to a pursuant
 *                                              invocation of
 *                                              {@link Transitionable#from}
 */
function Transitionable(initialState) {
    this._queue = [];
    this._from = null;
    this._state = null;
    this._startedAt = null;
    this._pausedAt = null;
    if (initialState != null) this.from(initialState);
}

/**
 * Internal Clock used for determining the current time for the ongoing
 * transitions.
 *
 * @type {Performance|Date|Clock}
 */

Transitionable.Clock = Engine.getClock();

/**
 * Registers a transition to be pushed onto the internal queue.
 *
 * @method to
 * @chainable
 *
 * @param  {Number|Array.Number}    finalState              final state to
 *                                                          transiton to
 * @param  {String|Function}        [curve=Curves.linear]   easing function
 *                                                          used for
 *                                                          interpolating
 *                                                          [0, 1]
 * @param  {Number}                 [duration=100]          duration of
 *                                                          transition
 * @param  {Function}               [callback]              callback function
 *                                                          to be called after
 *                                                          the transition is
 *                                                          complete
 * @param  {String}                 [method]                method used for
 *                                                          interpolation
 *                                                          (e.g. slerp)
 * @return {Transitionable}         this
 */
Transitionable.prototype.to = function to(finalState, curve, duration, callback, method) {
    curve = curve != null && curve.constructor === String ? Curves[curve] : curve;
    if (this._queue.length === 0) {
        this._startedAt = this.constructor.Clock.now();
        this._pausedAt = null;
    }
    this._queue.push(
        finalState,
        curve != null ? curve : Curves.linear,
        duration != null ? duration : 100,
        callback,
        method
    );
    return this;
};

/**
 * Resets the transition queue to a stable initial state.
 *
 * @method from
 * @chainable
 *
 * @param  {Number|Array.Number}    initialState    initial state to
 *                                                  transition from
 * @return {Transitionable}         this
 */
Transitionable.prototype.from = function from(initialState) {
    this._state = initialState;
    this._from = this._sync(null, this._state);
    this._queue.length = 0;
    this._startedAt = this.constructor.Clock.now();
    this._pausedAt = null;
    return this;
};

/**
 * Delays the execution of the subsequent transition for a certain period of
 * time.
 *
 * @method delay
 * @chainable
 *
 * @param {Number}      duration    delay time in ms
 * @param {Function}    [callback]  Zero-argument function to call on observed
 *                                  completion (t=1)
 * @return {Transitionable}         this
 */
Transitionable.prototype.delay = function delay(duration, callback) {
    var endState = this._queue.length > 0 ? this._queue[this._queue.length - 5] : this._state;
    return this.to(endState, Curves.flat, duration, callback);
};

/**
 * Overrides current transition.
 *
 * @method override
 * @chainable
 *
 * @param  {Number|Array.Number}    [finalState]    final state to transiton to
 * @param  {String|Function}        [curve]         easing function used for
 *                                                  interpolating [0, 1]
 * @param  {Number}                 [duration]      duration of transition
 * @param  {Function}               [callback]      callback function to be
 *                                                  called after the transition
 *                                                  is complete
 * @param {String}                  [method]        optional method used for
 *                                                  interpolating between the
 *                                                  values. Set to `slerp` for
 *                                                  spherical linear
 *                                                  interpolation.
 * @return {Transitionable}         this
 */
Transitionable.prototype.override = function override(finalState, curve, duration, callback, method) {
    if (this._queue.length > 0) {
        if (finalState != null) this._queue[0] = finalState;
        if (curve != null)      this._queue[1] = curve.constructor === String ? Curves[curve] : curve;
        if (duration != null)   this._queue[2] = duration;
        if (callback != null)   this._queue[3] = callback;
        if (method != null)     this._queue[4] = method;
    }
    return this;
};


/**
 * Used for interpolating between the start and end state of the currently
 * running transition
 *
 * @method  _interpolate
 * @private
 *
 * @param  {Object|Array|Number} output     Where to write to (in order to avoid
 *                                          object allocation and therefore GC).
 * @param  {Object|Array|Number} from       Start state of current transition.
 * @param  {Object|Array|Number} to         End state of current transition.
 * @param  {Number} progress                Progress of the current transition,
 *                                          in [0, 1]
 * @param  {String} method                  Method used for interpolation (e.g.
 *                                          slerp)
 * @return {Object|Array|Number}            output
 */
Transitionable.prototype._interpolate = function _interpolate(output, from, to, progress, method) {
    if (to instanceof Object) {
        if (method === 'slerp') {
            var x, y, z, w;
            var qx, qy, qz, qw;
            var omega, cosomega, sinomega, scaleFrom, scaleTo;

            x = from[0];
            y = from[1];
            z = from[2];
            w = from[3];

            qx = to[0];
            qy = to[1];
            qz = to[2];
            qw = to[3];

            if (progress === 1) {
                output[0] = qx;
                output[1] = qy;
                output[2] = qz;
                output[3] = qw;
                return output;
            }

            cosomega = w * qw + x * qx + y * qy + z * qz;
            if ((1.0 - cosomega) > 1e-5) {
                omega = Math.acos(cosomega);
                sinomega = Math.sin(omega);
                scaleFrom = Math.sin((1.0 - progress) * omega) / sinomega;
                scaleTo = Math.sin(progress * omega) / sinomega;
            }
            else {
                scaleFrom = 1.0 - progress;
                scaleTo = progress;
            }

            output[0] = x * scaleFrom + qx * scaleTo;
            output[1] = y * scaleFrom + qy * scaleTo;
            output[2] = z * scaleFrom + qz * scaleTo;
            output[3] = w * scaleFrom + qw * scaleTo;
        }
        else if (to instanceof Array) {
            for (var i = 0, len = to.length; i < len; i++) {
                output[i] = this._interpolate(output[i], from[i], to[i], progress, method);
            }
        }
        else {
            for (var key in to) {
                output[key] = this._interpolate(output[key], from[key], to[key], progress, method);
            }
        }
    }
    else {
        output = from + progress * (to - from);
    }
    return output;
};


/**
 * Internal helper method used for synchronizing the current, absolute state of
 * a transition to a given output array, object literal or number. Supports
 * nested state objects by through recursion.
 *
 * @method  _sync
 * @private
 *
 * @param  {Number|Array|Object} output     Where to write to (in order to avoid
 *                                          object allocation and therefore GC).
 * @param  {Number|Array|Object} input      Input state to proxy onto the
 *                                          output.
 * @return {Number|Array|Object} output     Passed in output object.
 */
Transitionable.prototype._sync = function _sync(output, input) {
    if (typeof input === 'number') output = input;
    else if (input instanceof Array) {
        if (output == null) output = [];
        for (var i = 0, len = input.length; i < len; i++) {
            output[i] = _sync(output[i], input[i]);
        }
    }
    else if (input instanceof Object) {
        if (output == null) output = {};
        for (var key in input) {
            output[key] = _sync(output[key], input[key]);
        }
    }
    return output;
};

/**
 * Get interpolated state of current action at provided time. If the last
 *    action has completed, invoke its callback.
 *
 * @method get
 *
 * @param {Number=} t               Evaluate the curve at a normalized version
 *                                  of this time. If omitted, use current time
 *                                  (Unix epoch time retrieved from Clock).
 * @return {Number|Array.Number}    Beginning state interpolated to this point
 *                                  in time.
 */
Transitionable.prototype.get = function get(t) {
    if (this._queue.length === 0) return this._state;

    t = this._pausedAt ? this._pausedAt : t;
    t = t ? t : this.constructor.Clock.now();

    var progress = (t - this._startedAt) / this._queue[2];
    this._state = this._interpolate(
        this._state,
        this._from,
        this._queue[0],
        this._queue[1](progress > 1 ? 1 : progress),
        this._queue[4]
    );
    var state = this._state;
    if (progress >= 1) {
        this._startedAt = this._startedAt + this._queue[2];
        this._from = this._sync(this._from, this._state);
        this._queue.shift();
        this._queue.shift();
        this._queue.shift();
        var callback = this._queue.shift();
        this._queue.shift();
        if (callback) callback();
    }
    return progress > 1 ? this.get() : state;
};

/**
 * Is there at least one transition pending completion?
 *
 * @method isActive
 *
 * @return {Boolean}    Boolean indicating whether there is at least one pending
 *                      transition. Paused transitions are still being
 *                      considered active.
 */
Transitionable.prototype.isActive = function isActive() {
    return this._queue.length > 0;
};

/**
 * Halt transition at current state and erase all pending actions.
 *
 * @method halt
 * @chainable
 *
 * @return {Transitionable} this
 */
Transitionable.prototype.halt = function halt() {
    return this.from(this.get());
};

/**
 * Pause transition. This will not erase any actions.
 *
 * @method pause
 * @chainable
 *
 * @return {Transitionable} this
 */
Transitionable.prototype.pause = function pause() {
    this._pausedAt = this.constructor.Clock.now();
    return this;
};

/**
 * Has the current action been paused?
 *
 * @method isPaused
 * @chainable
 *
 * @return {Boolean} if the current action has been paused
 */
Transitionable.prototype.isPaused = function isPaused() {
    return !!this._pausedAt;
};

/**
 * Resume a previously paused transition.
 *
 * @method resume
 * @chainable
 *
 * @return {Transitionable} this
 */
Transitionable.prototype.resume = function resume() {
    var diff = this._pausedAt - this._startedAt;
    this._startedAt = this.constructor.Clock.now() - diff;
    this._pausedAt = null;
    return this;
};

/**
 * Cancel all transitions and reset to a stable state
 *
 * @method reset
 * @chainable
 * @deprecated Use `.from` instead!
 *
 * @param {Number|Array.Number|Object.<number, number>} start
 *    stable state to set to
 * @return {Transitionable}                             this
 */
Transitionable.prototype.reset = function(start) {
    return this.from(start);
};

/**
 * Add transition to end state to the queue of pending transitions. Special
 *    Use: calling without a transition resets the object to that state with
 *    no pending actions
 *
 * @method set
 * @chainable
 * @deprecated Use `.to` instead!
 *
 * @param {Number|FamousEngineMatrix|Array.Number|Object.<number, number>} state
 *    end state to which we interpolate
 * @param {transition=} transition object of type {duration: number, curve:
 *    f[0,1] -> [0,1] or name}. If transition is omitted, change will be
 *    instantaneous.
 * @param {function()=} callback Zero-argument function to call on observed
 *    completion (t=1)
 * @return {Transitionable} this
 */
Transitionable.prototype.set = function(state, transition, callback) {
    if (transition == null) {
        this.from(state);
        if (callback) callback();
    }
    else {
        this.to(state, transition.curve, transition.duration, callback, transition.method);
    }
    return this;
};

module.exports = Transitionable;

},{"../core/Engine":5,"./Curves":16}],18:[function(require,module,exports){
module.exports = {
    Curves: require('./Curves'),
    Transitionable: require('./Transitionable')
};

},{"./Curves":16,"./Transitionable":17}]},{},[9])(9)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9jb21wb25lbnRzL0NvbXBvbmVudC5qcyIsInNyYy9jb21wb25lbnRzL0RPTUNvbXBvbmVudC5qcyIsInNyYy9jb21wb25lbnRzL2luZGV4LmpzIiwic3JjL2NvcmUvQ2xvY2suanMiLCJzcmMvY29yZS9FbmdpbmUuanMiLCJzcmMvY29yZS9Ob2RlLmpzIiwic3JjL2NvcmUvU2NlbmUuanMiLCJzcmMvY29yZS9pbmRleC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9tYXRoL01hdDMzLmpzIiwic3JjL21hdGgvUXVhdGVybmlvbi5qcyIsInNyYy9tYXRoL1JheS5qcyIsInNyYy9tYXRoL1ZlYzIuanMiLCJzcmMvbWF0aC9WZWMzLmpzIiwic3JjL21hdGgvaW5kZXguanMiLCJzcmMvdHJhbnNpdGlvbnMvQ3VydmVzLmpzIiwic3JjL3RyYW5zaXRpb25zL1RyYW5zaXRpb25hYmxlLmpzIiwic3JjL3RyYW5zaXRpb25zL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvbXBvbmVudCBoYW5kbGVzIHN0b3JpbmcgdGhlIHN0YXRlIG9mIGEgQ29tcG9uZW50IHRoYXQgaXMgYXR0YWNoZWQgdG8gYSBOb2RlLlxudmFyIENvbXBvbmVudCA9IGZ1bmN0aW9uKG5vZGUpe1xuICAgIHRoaXMubm9kZSA9IG5vZGUgPyBub2RlIDogbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7XG4iLCJ2YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9Db21wb25lbnQnKTtcblxudmFyIERPTUNvbXBvbmVudCA9IGZ1bmN0aW9uKG5vZGUsIGVsZW0sIGNvbnRhaW5lcil7XG4gICAgdGhpcy5ub2RlID0gbm9kZS5pZCA/IG5vZGUuaWQgOiBub2RlO1xuICAgIHRoaXMuZWxlbSA9IGVsZW0gPyBlbGVtIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICB2YXIgY29udGFpbmVyID0gY29udGFpbmVyID8gY29udGFpbmVyIDogZG9jdW1lbnQuYm9keTtcblxuICAgIHRoaXMuZWxlbS5kYXRhc2V0Lm5vZGUgPSB0aGlzLm5vZGU7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZWxlbSk7XG59O1xuXG5ET01Db21wb25lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDb21wb25lbnQucHJvdG90eXBlKTtcbkRPTUNvbXBvbmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb21wb25lbnQ7XG5cblxuXG5ET01Db21wb25lbnQucHJvdG90eXBlLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKCl7XG5cbiAgICAvLyAgICAgdGhpcy52aWV3LnN0eWxlLnRyYW5zZm9ybSA9IEpTT04uc3RyaW5naWZ5KG1hdHJpeDNkKDEsIDAsIDAsIDAsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLCAxLCAwLCAwLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgMCwgMSwgMCxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsIDAsIDAsIDEpKTtcbiAgICAvL1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERPTUNvbXBvbmVudDtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIENvbXBvbmVudDogcmVxdWlyZSgnLi9Db21wb25lbnQnKSxcbiAgICBET01Db21wb25lbnQ6IHJlcXVpcmUoJy4vRE9NQ29tcG9uZW50Jylcbn07XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXF1aXZhbGVudCBvZiBhbiBFbmdpbmUgaW4gdGhlIFdvcmtlciBUaHJlYWQuIFVzZWQgdG8gc3luY2hyb25pemUgYW5kIG1hbmFnZVxuICogdGltZSBhY3Jvc3MgZGlmZmVyZW50IFRocmVhZHMuXG4gKlxuICogQGNsYXNzICBDbG9ja1xuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBDbG9jayAoKSB7XG4gICAgdGhpcy5fdGltZSA9IDA7XG4gICAgdGhpcy5fZnJhbWUgPSAwO1xuICAgIHRoaXMuX3RpbWVyUXVldWUgPSBbXTtcbiAgICB0aGlzLl91cGRhdGluZ0luZGV4ID0gMDtcblxuICAgIHRoaXMuX3NjYWxlID0gMTtcbiAgICB0aGlzLl9zY2FsZWRUaW1lID0gdGhpcy5fdGltZTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBzY2FsZSBhdCB3aGljaCB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nLlxuICogVXNlZnVsIGZvciBzbG93LW1vdGlvbiBvciBmYXN0LWZvcndhcmQgZWZmZWN0cy5cbiAqXG4gKiBgMWAgbWVhbnMgbm8gdGltZSBzY2FsaW5nIChcInJlYWx0aW1lXCIpLFxuICogYDJgIG1lYW5zIHRoZSBjbG9jayB0aW1lIGlzIHBhc3NpbmcgdHdpY2UgYXMgZmFzdCxcbiAqIGAwLjVgIG1lYW5zIHRoZSBjbG9jayB0aW1lIGlzIHBhc3NpbmcgdHdvIHRpbWVzIHNsb3dlciB0aGFuIHRoZSBcImFjdHVhbFwiXG4gKiB0aW1lIGF0IHdoaWNoIHRoZSBDbG9jayBpcyBiZWluZyB1cGRhdGVkIHZpYSBgLnN0ZXBgLlxuICpcbiAqIEluaXRhbGx5IHRoZSBjbG9jayB0aW1lIGlzIG5vdCBiZWluZyBzY2FsZWQgKGZhY3RvciBgMWApLlxuICpcbiAqIEBtZXRob2QgIHNldFNjYWxlXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlICAgIFRoZSBzY2FsZSBhdCB3aGljaCB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nLlxuICpcbiAqIEByZXR1cm4ge0Nsb2NrfSB0aGlzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIHNldFNjYWxlIChzY2FsZSkge1xuICAgIHRoaXMuX3NjYWxlID0gc2NhbGU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgIGdldFNjYWxlXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBzY2FsZSAgICBUaGUgc2NhbGUgYXQgd2hpY2ggdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZy5cbiAqL1xuQ2xvY2sucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gZ2V0U2NhbGUgKCkge1xuICAgIHJldHVybiB0aGlzLl9zY2FsZTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgaW50ZXJuYWwgY2xvY2sgdGltZS5cbiAqXG4gKiBAbWV0aG9kICBzdGVwXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1lc3RhbXAgdXNlZCBmb3IgaW52b2tpbmcgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgYHVwZGF0ZWAgbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqIEByZXR1cm4ge0Nsb2NrfSAgICAgICB0aGlzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gc3RlcCAodGltZSkge1xuICAgIHRoaXMuX2ZyYW1lKys7XG5cbiAgICB0aGlzLl9zY2FsZWRUaW1lID0gdGhpcy5fc2NhbGVkVGltZSArICh0aW1lIC0gdGhpcy5fdGltZSkqdGhpcy5fc2NhbGU7XG4gICAgdGhpcy5fdGltZSA9IHRpbWU7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3RpbWVyUXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuX3RpbWVyUXVldWVbaV0odGhpcy5fc2NhbGVkVGltZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyUXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnRlcm5hbCBjbG9jayB0aW1lLlxuICpcbiAqIEBtZXRob2QgIG5vd1xuICpcbiAqIEByZXR1cm4gIHtOdW1iZXJ9IHRpbWUgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICBgdXBkYXRlYCBtZXRob2Qgb24gYWxsIHJlZ2lzdGVyZWQgb2JqZWN0c1xuICovXG5DbG9jay5wcm90b3R5cGUubm93ID0gZnVuY3Rpb24gbm93ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2NhbGVkVGltZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW50ZXJuYWwgY2xvY2sgdGltZS5cbiAqXG4gKiBAbWV0aG9kICBnZXRUaW1lXG4gKiBAZGVwcmVjYXRlZCBVc2UgI25vdyBpbnN0ZWFkXG4gKlxuICogQHJldHVybiAge051bWJlcn0gdGltZSBoaWdoIHJlc29sdXRpb24gdGltZXN0YW1wIHVzZWQgZm9yIGludm9raW5nIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgIGB1cGRhdGVgIG1ldGhvZCBvbiBhbGwgcmVnaXN0ZXJlZCBvYmplY3RzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5nZXRUaW1lID0gQ2xvY2sucHJvdG90eXBlLm5vdztcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgZnJhbWVzIGVsYXBzZWQgc28gZmFyLlxuICpcbiAqIEBtZXRob2QgZ2V0RnJhbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGZyYW1lc1xuICovXG5DbG9jay5wcm90b3R5cGUuZ2V0RnJhbWUgPSBmdW5jdGlvbiBnZXRGcmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZyYW1lO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxuICogQWZ0ZXIgYSBzZXQgZHVyYXRpb24gaGFzIHBhc3NlZCwgaXQgZXhlY3V0ZXMgdGhlIGZ1bmN0aW9uIGFuZFxuICogcmVtb3ZlcyBpdCBhcyBhIGxpc3RlbmVyIHRvICdwcmVyZW5kZXInLlxuICpcbiAqIEBtZXRob2Qgc2V0VGltZW91dFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIHJ1biBhZnRlciBhIHNwZWNpZmllZCBkdXJhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IG1pbGxpc2Vjb25kcyBmcm9tIG5vdyB0byBleGVjdXRlIHRoZSBmdW5jdGlvblxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aW1lciBmdW5jdGlvbiB1c2VkIGZvciBDbG9jayNjbGVhclRpbWVyXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBzdGFydGVkQXQgPSB0aGlzLl90aW1lO1xuICAgIHZhciB0aW1lciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgLSBzdGFydGVkQXQgPj0gZGVsYXkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHBhcmFtcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICB0aGlzLl90aW1lclF1ZXVlLnB1c2godGltZXIpO1xuICAgIHJldHVybiB0aW1lcjtcbn07XG5cblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxuICogIEFmdGVyIGEgc2V0IGR1cmF0aW9uIGhhcyBwYXNzZWQsIGl0IGV4ZWN1dGVzIHRoZSBmdW5jdGlvbiBhbmRcbiAqICByZXNldHMgdGhlIGV4ZWN1dGlvbiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0SW50ZXJ2YWxcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBydW4gYWZ0ZXIgYSBzcGVjaWZpZWQgZHVyYXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSBpbnRlcnZhbCB0byBleGVjdXRlIGZ1bmN0aW9uIGluIG1pbGxpc2Vjb25kc1xuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aW1lciBmdW5jdGlvbiB1c2VkIGZvciBDbG9jayNjbGVhclRpbWVyXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uIHNldEludGVydmFsKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBzdGFydGVkQXQgPSB0aGlzLl90aW1lO1xuICAgIHZhciB0aW1lciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgLSBzdGFydGVkQXQgPj0gZGVsYXkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHBhcmFtcyk7XG4gICAgICAgICAgICBzdGFydGVkQXQgPSB0aW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHRoaXMuX3RpbWVyUXVldWUucHVzaCh0aW1lcik7XG4gICAgcmV0dXJuIHRpbWVyO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIHByZXZpb3VzbHkgdmlhIGBDbG9jayNzZXRUaW1lb3V0YCBvciBgQ2xvY2sjc2V0SW50ZXJ2YWxgXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKlxuICogQG1ldGhvZCBjbGVhclRpbWVyXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IHRpbWVyICBwcmV2aW91c2x5IGJ5IGBDbG9jayNzZXRUaW1lb3V0YCBvclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgQ2xvY2sjc2V0SW50ZXJ2YWxgIHJldHVybmVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtDbG9ja30gICAgICAgICAgICAgIHRoaXNcbiAqL1xuQ2xvY2sucHJvdG90eXBlLmNsZWFyVGltZXIgPSBmdW5jdGlvbiAodGltZXIpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl90aW1lclF1ZXVlLmluZGV4T2YodGltZXIpO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5fdGltZXJRdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2xvY2s7XG4iLCJ2YXIgQ2xvY2sgPSByZXF1aXJlKCcuL0Nsb2NrJyk7XG5cbnZhciBFbmdpbmUgPSBmdW5jdGlvbigpe1xuXG4gICAgdGhpcy5fY2xvY2sgPSBuZXcgQ2xvY2soKTtcbiAgICB0aGlzLl93b3JrZXIgPSBudWxsO1xuXG59XG5cbkVuZ2luZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHdvcmtlcil7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnRpY2suYmluZCh0aGlzKSk7XG4gICAgaWYod29ya2VyKXtcbiAgICAgICAgdGhpcy5fd29ya2VyID0gd29ya2VyO1xuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe2luaXQ6J2RvbmUnfSk7XG4gICAgfVxufVxuXG5FbmdpbmUucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbih0aW1lKXtcblxuICAgIHRoaXMuX2Nsb2NrLnN0ZXAodGltZSk7XG4gICAgdGhpcy50aW1lID0gdGhpcy5fY2xvY2subm93KCk7XG5cbiAgICBpZih0aGlzLl93b3JrZXIpe1xuICAgICAgICB0aGlzLl93b3JrZXIucG9zdE1lc3NhZ2Uoe2ZyYW1lOnRoaXMudGltZX0pO1xuICAgIH1cblxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy50aWNrLmJpbmQodGhpcykpO1xuXG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnN0YW5jZSBvZiBjbG9jayB1c2VkIGJ5IHRoZSBGYW1vdXNFbmdpbmUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Nsb2NrfSBFbmdpbmUncyBjbG9ja1xuICovXG5FbmdpbmUucHJvdG90eXBlLmdldENsb2NrID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nsb2NrO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgRW5naW5lKCk7XG4iLCIvLyBOb2RlIGhhbmRsZXMgc3RvcmluZyB0aGUgc3RhdGUgb2YgYSBub2RlIG9uIHRoZSBTY2VuZSBHcmFwaC5cbnZhciBOb2RlID0gZnVuY3Rpb24oY29uZil7XG4gICAgaWYoY29uZil7XG4gICAgICAgIHRoaXMuc2VyaWFsaXplKGNvbmYpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0RGVmYXVsdHMoKTtcbiAgICB9XG5cbiAgICB0aGlzLm9ic2VydmFibGVzID0ge307XG59XG5cbk5vZGUucHJvdG90eXBlLnNldERlZmF1bHRzID0gZnVuY3Rpb24oY29uZil7XG4gICAgdGhpcy5wb3NpdGlvbiA9IFswLDAsMF07XG4gICAgdGhpcy5vcmlnaW4gPSBbMC4wLDAuMCwwLjBdO1xuICAgIHRoaXMuYWxpZ24gPSBbMC4wLDAuMCwwLjBdO1xuICAgIHRoaXMuc2l6ZSA9IFswLDAsMF07XG4gICAgdGhpcy5yb3RhdGUgPSBbMCwwLDBdO1xuICAgIHRoaXMub3BhY2l0eSA9IDEuMDtcbiAgICB0aGlzLnRyYW5zZm9ybSA9IFtdO1xufTtcblxuTm9kZS5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oY29uZil7XG4gICAgdGhpcy5pZCA9IGNvbmYuaWQgPyBjb25mLmlkIDogbnVsbDtcbiAgICB0aGlzLnBvc2l0aW9uID0gY29uZi5wb3NpdGlvbiA/IGNvbmYucG9zaXRpb24gOiBbMCwwLDBdO1xuICAgIHRoaXMub3JpZ2luID0gY29uZi5vcmlnaW4gPyBjb25mLm9yaWdpbiA6IFswLjAsMC4wLDAuMF07XG4gICAgdGhpcy5hbGlnbiA9IGNvbmYuYWxpZ24gPyBjb25mLmFsaWduIDogWzAuMCwwLjAsMC4wXTtcbiAgICB0aGlzLnNpemUgPSBjb25mLnNpemUgPyBjb25mLnNpemUgOiBbMCwwLDBdO1xuICAgIHRoaXMucm90YXRlID0gY29uZi5yb3RhdGUgPyBjb25mLnJvdGF0ZSA6IFswLDAsMF07XG4gICAgdGhpcy5vcGFjaXR5ID0gY29uZi5vcGFjaXR5ID8gY29uZi5vcGFjaXR5IDogMS4wO1xufTtcblxuTm9kZS5wcm90b3R5cGUuZ2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9zaXRpb246IHRoaXMucG9zaXRpb24sXG4gICAgICAgIG9yaWdpbjogdGhpcy5vcmlnaW4sXG4gICAgICAgIGFsaWduOiB0aGlzLmFsaWduLFxuICAgICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICAgIHJvdGF0ZTogdGhpcy5yb3RhdGUsXG4gICAgICAgIG9wYWNpdHk6IHRoaXMub3BhY2l0eVxuICAgIH1cbn07XG5cbk5vZGUucHJvdG90eXBlLnNldFBvc2l0aW9uID0gZnVuY3Rpb24ocG9zKXtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMucG9zaXRpb247XG59XG5cbk5vZGUucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbihzaXplKXtcbiAgICB0aGlzLnNpemUgPSBzaXplO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdGhpcy5zaXplO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5zZXRPcmlnaW4gPSBmdW5jdGlvbihvcmlnaW4pe1xuICAgIHRoaXMub3JpZ2luID0gb3JpZ2luO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5nZXRPcmlnaW4gPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLm9yaWdpbjtcbn1cblxuTm9kZS5wcm90b3R5cGUuc2V0QWxpZ24gPSBmdW5jdGlvbihhbGlnbil7XG4gICAgdGhpcy5hbGlnbiA9IGFsaWduO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5nZXRBbGlnbiA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMuYWxpZ247XG59XG5cbk5vZGUucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24ocm90YXRpb24pe1xuICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcbn1cblxuTm9kZS5wcm90b3R5cGUuZ2V0Um90YXRpb24gPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzLnJvdGF0aW9uO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5zZXRPcGFjaXR5ID0gZnVuY3Rpb24ob3BhY2l0eSl7XG4gICAgdGhpcy5vcGFjaXR5ID0gb3BhY2l0eTtcbn1cblxuTm9kZS5wcm90b3R5cGUuZ2V0T3BhY2l0eSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXMub3BhY2l0eTtcbn1cblxuTm9kZS5wcm90b3R5cGUub2JzZXJ2ZSA9IGZ1bmN0aW9uKHBhcmFtKSB7XG4gICAgdmFyIG4gPSB0aGlzO1xuICAgIHRoaXMub2JzZXJ2YWJsZXNbcGFyYW1dID0gZnVuY3Rpb24oY2hhbmdlcyl7XG4gICAgICAgIGNoYW5nZXMuZm9yRWFjaChmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgICAgIC8vcHVibGlzaCB0aGUgY2hhbmdlIHZpYSBwdWIvc3ViXG4gICAgICAgICAgICBuLmV2ZW50TWFuYWdlci5wdWIocGFyYW0sY2hhbmdlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIE9iamVjdC5vYnNlcnZlKHRoaXNbcGFyYW1dLCB0aGlzLm9ic2VydmFibGVzW3BhcmFtXSk7XG59XG5cbk5vZGUucHJvdG90eXBlLnVub2JzZXJ2ZSA9IGZ1bmN0aW9uKHBhcmFtKSB7XG4gICAgT2JqZWN0LnVub2JzZXJ2ZSh0aGlzW3BhcmFtXSwgdGhpcy5vYnNlcnZhYmxlc1twYXJhbV0pO1xufVxuXG5cbk5vZGUucHJvdG90eXBlLmV2ZW50TWFuYWdlciA9IGZ1bmN0aW9uKCl7XG5cbiAgdmFyIGV2ZW50cyA9IHt9O1xuICB2YXIgaGFzRXZlbnQgPSBldmVudHMuaGFzT3duUHJvcGVydHk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdWI6IGZ1bmN0aW9uKGV2LCBsaXN0ZW5lcikge1xuXG4gICAgICB0aGlzLm9ic2VydmUoZXYpO1xuICAgICAgLy8gQ3JlYXRlIHRoZSBldmVudCdzIG9iamVjdCBpZiBub3QgeWV0IGNyZWF0ZWRcbiAgICAgIGlmKCFoYXNFdmVudC5jYWxsKGV2ZW50cywgZXYpKSBldmVudHNbZXZdID0gW107XG5cbiAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gcXVldWVcbiAgICAgIHZhciBpbmRleCA9IGV2ZW50c1tldl0ucHVzaChsaXN0ZW5lcikgLSAxO1xuXG4gICAgICAvLyBQcm92aWRlIGhhbmRsZSBiYWNrIGZvciByZW1vdmFsIG9mIHRvcGljXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRoaXMudW5vYnNlcnZlKGV2KTtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW2V2XVtpbmRleF07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBwdWI6IGZ1bmN0aW9uKGV2LCBpbmZvKSB7XG4gICAgICAvLyBJZiB0aGUgZXZlbnQgZG9lc24ndCBleGlzdCwgb3IgdGhlcmUncyBubyBsaXN0ZW5lcnMgaW4gcXVldWUsIGp1c3QgbGVhdmVcbiAgICAgIGlmKCFoYXNFdmVudC5jYWxsKGV2ZW50cywgZXYpKSByZXR1cm47XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggZXZlbnRzIHF1ZXVlLCBmaXJlIVxuICAgICAgZXZlbnRzW2V2XS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIFx0XHRpdGVtKGluZm8gIT0gdW5kZWZpbmVkID8gaW5mbyA6IHt9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlO1xuIiwidmFyIFNjZW5lID0gZnVuY3Rpb24oZ3JhcGgpe1xuXG4gICAgdGhpcy5ncmFwaCA9IGdyYXBoIHx8IHt9O1xuICAgIHRoaXMubGVuZ3RoID0gMDtcblxufVxuXG5TY2VuZS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbihub2RlKXtcbiAgICBub2RlLmlkID0gJ25vZGUtJyt0aGlzLmxlbmd0aDtcbiAgICB0aGlzLmxlbmd0aCsrO1xuICAgIHRoaXMuZ3JhcGhbbm9kZS5pZF0gPSBub2RlO1xufVxuXG5cblNjZW5lLnByb3RvdHlwZS5mZXRjaE5vZGUgPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiB0aGlzLmdyYXBoW2lkXTtcbn1cblxuU2NlbmUucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbihxdWVyeSkge1xuICAgIHZhciBxdWVyeUFycmF5ID0gW107XG4gICAgZm9yKHEgaW4gcXVlcnkpe1xuICAgICAgICBmb3IocHJvcCBpbiB0aGlzLmdyYXBoKSB7XG4gICAgICAgICAgICBmb3IocCBpbiB0aGlzLmdyYXBoW3Byb3BdKXtcbiAgICAgICAgICAgICAgICBpZiAocCA9PT0gcSAmJiB0aGlzLmdyYXBoW3Byb3BdW3BdID09PSBxdWVyeVtxXSkge1xuICAgICAgICAgICAgICAgICAgICBxdWVyeUFycmF5LnB1c2godGhpcy5ncmFwaFtwcm9wXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBxdWVyeUFycmF5O1xufVxuXG5TY2VuZS5wcm90b3R5cGUuZmluZE9uZSA9IGZ1bmN0aW9uKHF1ZXJ5KSB7XG5cbiAgICBmb3IocSBpbiBxdWVyeSl7XG4gICAgICAgIGZvcihwcm9wIGluIHRoaXMuZ3JhcGgpIHtcbiAgICAgICAgICAgIGZvcihwIGluIHRoaXMuZ3JhcGhbcHJvcF0pe1xuICAgICAgICAgICAgICAgIGlmIChwID09PSBxICYmIHRoaXMuZ3JhcGhbcHJvcF1bcF0gPT09IHF1ZXJ5W3FdKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdyYXBoW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5cblNjZW5lLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbih0aWNrKXtcbiAgICAvL2NvbnNvbGUubG9nKHRpY2ssIHRoaXMuZ3JhcGhbJ25vZGUtMSddLnQuZ2V0KCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTY2VuZSgpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgQ2xvY2s6IHJlcXVpcmUoJy4vQ2xvY2snKSxcbiAgICBFbmdpbmU6IHJlcXVpcmUoJy4vRW5naW5lJyksXG4gICAgU2NlbmU6IHJlcXVpcmUoJy4vU2NlbmUnKSxcbiAgICBOb2RlOiByZXF1aXJlKCcuL05vZGUnKVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvcmU6IHJlcXVpcmUoJy4vY29yZScpLFxuICAgIGNvbXBvbmVudHM6IHJlcXVpcmUoJy4vY29tcG9uZW50cycpLFxuICAgIG1hdGg6IHJlcXVpcmUoJy4vbWF0aCcpLFxuICAgIHRyYW5zaXRpb25zOiByZXF1aXJlKCcuL3RyYW5zaXRpb25zJylcbn07XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgM3gzIG51bWVyaWNhbCBtYXRyaXgsIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5LlxuICpcbiAqIEBjbGFzcyBNYXQzM1xuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBhIDN4MyBtYXRyaXggZmxhdHRlbmVkXG4gKi9cbmZ1bmN0aW9uIE1hdDMzKHZhbHVlcykge1xuICAgIHRoaXMudmFsdWVzID0gdmFsdWVzIHx8IFsxLDAsMCwwLDEsMCwwLDAsMV07XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSB2YWx1ZXMgaW4gdGhlIE1hdDMzIGFzIGFuIGFycmF5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gbWF0cml4IHZhbHVlcyBhcyBhcnJheSBvZiByb3dzLlxuICovXG5NYXQzMy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSB2YWx1ZXMgb2YgdGhlIGN1cnJlbnQgTWF0MzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyBBcnJheSBvZiBuaW5lIG51bWJlcnMgdG8gc2V0IGluIHRoZSBNYXQzMy5cbiAqXG4gKiBAcmV0dXJuIHtNYXQzM30gdGhpc1xuICovXG5NYXQzMy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHZhbHVlcykge1xuICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgb2YgdGhlIGlucHV0IE1hdDMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge01hdDMzfSBtYXRyaXggVGhlIE1hdDMzIHRvIGNvcHkuXG4gKiBcbiAqIEByZXR1cm4ge01hdDMzfSB0aGlzXG4gKi9cbk1hdDMzLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weShtYXRyaXgpIHtcbiAgICB2YXIgQSA9IHRoaXMudmFsdWVzO1xuICAgIHZhciBCID0gbWF0cml4LnZhbHVlcztcblxuICAgIEFbMF0gPSBCWzBdO1xuICAgIEFbMV0gPSBCWzFdO1xuICAgIEFbMl0gPSBCWzJdO1xuICAgIEFbM10gPSBCWzNdO1xuICAgIEFbNF0gPSBCWzRdO1xuICAgIEFbNV0gPSBCWzVdO1xuICAgIEFbNl0gPSBCWzZdO1xuICAgIEFbN10gPSBCWzddO1xuICAgIEFbOF0gPSBCWzhdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRha2UgdGhpcyBNYXQzMyBhcyBBLCBpbnB1dCB2ZWN0b3IgViBhcyBhIGNvbHVtbiB2ZWN0b3IsIGFuZCByZXR1cm4gTWF0MzMgcHJvZHVjdCAoQSkoVikuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBWZWN0b3IgdG8gcm90YXRlLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSBpbnB1dCB2ZWN0b3IgYWZ0ZXIgbXVsdGlwbGljYXRpb24uXG4gKi9cbk1hdDMzLnByb3RvdHlwZS52ZWN0b3JNdWx0aXBseSA9IGZ1bmN0aW9uIHZlY3Rvck11bHRpcGx5KHYsIG91dHB1dCkge1xuICAgIHZhciBNID0gdGhpcy52YWx1ZXM7XG4gICAgdmFyIHYwID0gdi54O1xuICAgIHZhciB2MSA9IHYueTtcbiAgICB2YXIgdjIgPSB2Lno7XG5cbiAgICBvdXRwdXQueCA9IE1bMF0qdjAgKyBNWzFdKnYxICsgTVsyXSp2MjtcbiAgICBvdXRwdXQueSA9IE1bM10qdjAgKyBNWzRdKnYxICsgTVs1XSp2MjtcbiAgICBvdXRwdXQueiA9IE1bNl0qdjAgKyBNWzddKnYxICsgTVs4XSp2MjtcblxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIE11bHRpcGx5IHRoZSBwcm92aWRlZCBNYXQzMyB3aXRoIHRoZSBjdXJyZW50IE1hdDMzLiAgUmVzdWx0IGlzICh0aGlzKSAqIChtYXRyaXgpLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge01hdDMzfSBtYXRyaXggSW5wdXQgTWF0MzMgdG8gbXVsdGlwbHkgb24gdGhlIHJpZ2h0LlxuICpcbiAqIEByZXR1cm4ge01hdDMzfSB0aGlzXG4gKi9cbk1hdDMzLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIG11bHRpcGx5KG1hdHJpeCkge1xuICAgIHZhciBBID0gdGhpcy52YWx1ZXM7XG4gICAgdmFyIEIgPSBtYXRyaXgudmFsdWVzO1xuXG4gICAgdmFyIEEwID0gQVswXTtcbiAgICB2YXIgQTEgPSBBWzFdO1xuICAgIHZhciBBMiA9IEFbMl07XG4gICAgdmFyIEEzID0gQVszXTtcbiAgICB2YXIgQTQgPSBBWzRdO1xuICAgIHZhciBBNSA9IEFbNV07XG4gICAgdmFyIEE2ID0gQVs2XTtcbiAgICB2YXIgQTcgPSBBWzddO1xuICAgIHZhciBBOCA9IEFbOF07XG5cbiAgICB2YXIgQjAgPSBCWzBdO1xuICAgIHZhciBCMSA9IEJbMV07XG4gICAgdmFyIEIyID0gQlsyXTtcbiAgICB2YXIgQjMgPSBCWzNdO1xuICAgIHZhciBCNCA9IEJbNF07XG4gICAgdmFyIEI1ID0gQls1XTtcbiAgICB2YXIgQjYgPSBCWzZdO1xuICAgIHZhciBCNyA9IEJbN107XG4gICAgdmFyIEI4ID0gQls4XTtcblxuICAgIEFbMF0gPSBBMCpCMCArIEExKkIzICsgQTIqQjY7XG4gICAgQVsxXSA9IEEwKkIxICsgQTEqQjQgKyBBMipCNztcbiAgICBBWzJdID0gQTAqQjIgKyBBMSpCNSArIEEyKkI4O1xuICAgIEFbM10gPSBBMypCMCArIEE0KkIzICsgQTUqQjY7XG4gICAgQVs0XSA9IEEzKkIxICsgQTQqQjQgKyBBNSpCNztcbiAgICBBWzVdID0gQTMqQjIgKyBBNCpCNSArIEE1KkI4O1xuICAgIEFbNl0gPSBBNipCMCArIEE3KkIzICsgQTgqQjY7XG4gICAgQVs3XSA9IEE2KkIxICsgQTcqQjQgKyBBOCpCNztcbiAgICBBWzhdID0gQTYqQjIgKyBBNypCNSArIEE4KkI4O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyYW5zcG9zZXMgdGhlIE1hdDMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtNYXQzM30gdGhpc1xuICovXG5NYXQzMy5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24gdHJhbnNwb3NlKCkge1xuICAgIHZhciBNID0gdGhpcy52YWx1ZXM7XG5cbiAgICB2YXIgTTEgPSBNWzFdO1xuICAgIHZhciBNMiA9IE1bMl07XG4gICAgdmFyIE0zID0gTVszXTtcbiAgICB2YXIgTTUgPSBNWzVdO1xuICAgIHZhciBNNiA9IE1bNl07XG4gICAgdmFyIE03ID0gTVs3XTtcblxuICAgIE1bMV0gPSBNMztcbiAgICBNWzJdID0gTTY7XG4gICAgTVszXSA9IE0xO1xuICAgIE1bNV0gPSBNNztcbiAgICBNWzZdID0gTTI7XG4gICAgTVs3XSA9IE01O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRoZSBkZXRlcm1pbmFudCBvZiB0aGUgTWF0MzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRldGVybWluYW50LlxuICovXG5NYXQzMy5wcm90b3R5cGUuZ2V0RGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiBnZXREZXRlcm1pbmFudCgpIHtcbiAgICB2YXIgTSA9IHRoaXMudmFsdWVzO1xuXG4gICAgdmFyIE0zID0gTVszXTtcbiAgICB2YXIgTTQgPSBNWzRdO1xuICAgIHZhciBNNSA9IE1bNV07XG4gICAgdmFyIE02ID0gTVs2XTtcbiAgICB2YXIgTTcgPSBNWzddO1xuICAgIHZhciBNOCA9IE1bOF07XG5cbiAgICB2YXIgZGV0ID0gTVswXSooTTQqTTggLSBNNSpNNykgLVxuICAgICAgICAgICAgICBNWzFdKihNMypNOCAtIE01Kk02KSArXG4gICAgICAgICAgICAgIE1bMl0qKE0zKk03IC0gTTQqTTYpO1xuXG4gICAgcmV0dXJuIGRldDtcbn07XG5cbi8qKlxuICogVGhlIGludmVyc2Ugb2YgdGhlIE1hdDMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtNYXQzM30gdGhpc1xuICovXG5NYXQzMy5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uIGludmVyc2UoKSB7XG4gICAgdmFyIE0gPSB0aGlzLnZhbHVlcztcblxuICAgIHZhciBNMCA9IE1bMF07XG4gICAgdmFyIE0xID0gTVsxXTtcbiAgICB2YXIgTTIgPSBNWzJdO1xuICAgIHZhciBNMyA9IE1bM107XG4gICAgdmFyIE00ID0gTVs0XTtcbiAgICB2YXIgTTUgPSBNWzVdO1xuICAgIHZhciBNNiA9IE1bNl07XG4gICAgdmFyIE03ID0gTVs3XTtcbiAgICB2YXIgTTggPSBNWzhdO1xuXG4gICAgdmFyIGRldCA9IE0wKihNNCpNOCAtIE01Kk03KSAtXG4gICAgICAgICAgICAgIE0xKihNMypNOCAtIE01Kk02KSArXG4gICAgICAgICAgICAgIE0yKihNMypNNyAtIE00Kk02KTtcblxuICAgIGlmIChNYXRoLmFicyhkZXQpIDwgMWUtNDApIHJldHVybiBudWxsO1xuXG4gICAgZGV0ID0gMSAvIGRldDtcblxuICAgIE1bMF0gPSAoTTQqTTggLSBNNSpNNykgKiBkZXQ7XG4gICAgTVszXSA9ICgtTTMqTTggKyBNNSpNNikgKiBkZXQ7XG4gICAgTVs2XSA9IChNMypNNyAtIE00Kk02KSAqIGRldDtcbiAgICBNWzFdID0gKC1NMSpNOCArIE0yKk03KSAqIGRldDtcbiAgICBNWzRdID0gKE0wKk04IC0gTTIqTTYpICogZGV0O1xuICAgIE1bN10gPSAoLU0wKk03ICsgTTEqTTYpICogZGV0O1xuICAgIE1bMl0gPSAoTTEqTTUgLSBNMipNNCkgKiBkZXQ7XG4gICAgTVs1XSA9ICgtTTAqTTUgKyBNMipNMykgKiBkZXQ7XG4gICAgTVs4XSA9IChNMCpNNCAtIE0xKk0zKSAqIGRldDtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDbG9uZXMgdGhlIGlucHV0IE1hdDMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge01hdDMzfSBtIE1hdDMzIHRvIGNsb25lLlxuICpcbiAqIEByZXR1cm4ge01hdDMzfSBOZXcgY29weSBvZiB0aGUgb3JpZ2luYWwgTWF0MzMuXG4gKi9cbk1hdDMzLmNsb25lID0gZnVuY3Rpb24gY2xvbmUobSkge1xuICAgIHJldHVybiBuZXcgTWF0MzMobS52YWx1ZXMuc2xpY2UoKSk7XG59O1xuXG4vKipcbiAqIFRoZSBpbnZlcnNlIG9mIHRoZSBNYXQzMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtNYXQzM30gbWF0cml4IE1hdDMzIHRvIGludmVydC5cbiAqIEBwYXJhbSB7TWF0MzN9IG91dHB1dCBNYXQzMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge01hdDMzfSBUaGUgTWF0MzMgYWZ0ZXIgdGhlIGludmVydC5cbiAqL1xuTWF0MzMuaW52ZXJzZSA9IGZ1bmN0aW9uIGludmVyc2UobWF0cml4LCBvdXRwdXQpIHtcbiAgICB2YXIgTSA9IG1hdHJpeC52YWx1ZXM7XG4gICAgdmFyIHJlc3VsdCA9IG91dHB1dC52YWx1ZXM7XG5cbiAgICB2YXIgTTAgPSBNWzBdO1xuICAgIHZhciBNMSA9IE1bMV07XG4gICAgdmFyIE0yID0gTVsyXTtcbiAgICB2YXIgTTMgPSBNWzNdO1xuICAgIHZhciBNNCA9IE1bNF07XG4gICAgdmFyIE01ID0gTVs1XTtcbiAgICB2YXIgTTYgPSBNWzZdO1xuICAgIHZhciBNNyA9IE1bN107XG4gICAgdmFyIE04ID0gTVs4XTtcblxuICAgIHZhciBkZXQgPSBNMCooTTQqTTggLSBNNSpNNykgLVxuICAgICAgICAgICAgICBNMSooTTMqTTggLSBNNSpNNikgK1xuICAgICAgICAgICAgICBNMiooTTMqTTcgLSBNNCpNNik7XG5cbiAgICBpZiAoTWF0aC5hYnMoZGV0KSA8IDFlLTQwKSByZXR1cm4gbnVsbDtcblxuICAgIGRldCA9IDEgLyBkZXQ7XG5cbiAgICByZXN1bHRbMF0gPSAoTTQqTTggLSBNNSpNNykgKiBkZXQ7XG4gICAgcmVzdWx0WzNdID0gKC1NMypNOCArIE01Kk02KSAqIGRldDtcbiAgICByZXN1bHRbNl0gPSAoTTMqTTcgLSBNNCpNNikgKiBkZXQ7XG4gICAgcmVzdWx0WzFdID0gKC1NMSpNOCArIE0yKk03KSAqIGRldDtcbiAgICByZXN1bHRbNF0gPSAoTTAqTTggLSBNMipNNikgKiBkZXQ7XG4gICAgcmVzdWx0WzddID0gKC1NMCpNNyArIE0xKk02KSAqIGRldDtcbiAgICByZXN1bHRbMl0gPSAoTTEqTTUgLSBNMipNNCkgKiBkZXQ7XG4gICAgcmVzdWx0WzVdID0gKC1NMCpNNSArIE0yKk0zKSAqIGRldDtcbiAgICByZXN1bHRbOF0gPSAoTTAqTTQgLSBNMSpNMykgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBUcmFuc3Bvc2VzIHRoZSBNYXQzMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtNYXQzM30gbWF0cml4IE1hdDMzIHRvIHRyYW5zcG9zZS5cbiAqIEBwYXJhbSB7TWF0MzN9IG91dHB1dCBNYXQzMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge01hdDMzfSBUaGUgTWF0MzMgYWZ0ZXIgdGhlIHRyYW5zcG9zZS5cbiAqL1xuTWF0MzMudHJhbnNwb3NlID0gZnVuY3Rpb24gdHJhbnNwb3NlKG1hdHJpeCwgb3V0cHV0KSB7XG4gICAgdmFyIE0gPSBtYXRyaXgudmFsdWVzO1xuICAgIHZhciByZXN1bHQgPSBvdXRwdXQudmFsdWVzO1xuXG4gICAgdmFyIE0wID0gTVswXTtcbiAgICB2YXIgTTEgPSBNWzFdO1xuICAgIHZhciBNMiA9IE1bMl07XG4gICAgdmFyIE0zID0gTVszXTtcbiAgICB2YXIgTTQgPSBNWzRdO1xuICAgIHZhciBNNSA9IE1bNV07XG4gICAgdmFyIE02ID0gTVs2XTtcbiAgICB2YXIgTTcgPSBNWzddO1xuICAgIHZhciBNOCA9IE1bOF07XG5cbiAgICByZXN1bHRbMF0gPSBNMDtcbiAgICByZXN1bHRbMV0gPSBNMztcbiAgICByZXN1bHRbMl0gPSBNNjtcbiAgICByZXN1bHRbM10gPSBNMTtcbiAgICByZXN1bHRbNF0gPSBNNDtcbiAgICByZXN1bHRbNV0gPSBNNztcbiAgICByZXN1bHRbNl0gPSBNMjtcbiAgICByZXN1bHRbN10gPSBNNTtcbiAgICByZXN1bHRbOF0gPSBNODtcblxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgcHJvdmlkZWQgTWF0MzMncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtNYXQzM30gbWF0cml4MSBUaGUgbGVmdCBNYXQzMy5cbiAqIEBwYXJhbSB7TWF0MzN9IG1hdHJpeDIgVGhlIHJpZ2h0IE1hdDMzLlxuICogQHBhcmFtIHtNYXQzM30gb3V0cHV0IE1hdDMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7TWF0MzN9IFRoZSByZXN1bHQgb2YgdGhlIGFkZGl0aW9uLlxuICovXG5NYXQzMy5hZGQgPSBmdW5jdGlvbiBhZGQobWF0cml4MSwgbWF0cml4Miwgb3V0cHV0KSB7XG4gICAgdmFyIEEgPSBtYXRyaXgxLnZhbHVlcztcbiAgICB2YXIgQiA9IG1hdHJpeDIudmFsdWVzO1xuICAgIHZhciByZXN1bHQgPSBvdXRwdXQudmFsdWVzO1xuXG4gICAgdmFyIEEwID0gQVswXTtcbiAgICB2YXIgQTEgPSBBWzFdO1xuICAgIHZhciBBMiA9IEFbMl07XG4gICAgdmFyIEEzID0gQVszXTtcbiAgICB2YXIgQTQgPSBBWzRdO1xuICAgIHZhciBBNSA9IEFbNV07XG4gICAgdmFyIEE2ID0gQVs2XTtcbiAgICB2YXIgQTcgPSBBWzddO1xuICAgIHZhciBBOCA9IEFbOF07XG5cbiAgICB2YXIgQjAgPSBCWzBdO1xuICAgIHZhciBCMSA9IEJbMV07XG4gICAgdmFyIEIyID0gQlsyXTtcbiAgICB2YXIgQjMgPSBCWzNdO1xuICAgIHZhciBCNCA9IEJbNF07XG4gICAgdmFyIEI1ID0gQls1XTtcbiAgICB2YXIgQjYgPSBCWzZdO1xuICAgIHZhciBCNyA9IEJbN107XG4gICAgdmFyIEI4ID0gQls4XTtcblxuICAgIHJlc3VsdFswXSA9IEEwICsgQjA7XG4gICAgcmVzdWx0WzFdID0gQTEgKyBCMTtcbiAgICByZXN1bHRbMl0gPSBBMiArIEIyO1xuICAgIHJlc3VsdFszXSA9IEEzICsgQjM7XG4gICAgcmVzdWx0WzRdID0gQTQgKyBCNDtcbiAgICByZXN1bHRbNV0gPSBBNSArIEI1O1xuICAgIHJlc3VsdFs2XSA9IEE2ICsgQjY7XG4gICAgcmVzdWx0WzddID0gQTcgKyBCNztcbiAgICByZXN1bHRbOF0gPSBBOCArIEI4O1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgdGhlIHByb3ZpZGVkIE1hdDMzJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TWF0MzN9IG1hdHJpeDEgVGhlIGxlZnQgTWF0MzMuXG4gKiBAcGFyYW0ge01hdDMzfSBtYXRyaXgyIFRoZSByaWdodCBNYXQzMy5cbiAqIEBwYXJhbSB7TWF0MzN9IG91dHB1dCBNYXQzMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge01hdDMzfSBUaGUgcmVzdWx0IG9mIHRoZSBzdWJ0cmFjdGlvbi5cbiAqL1xuTWF0MzMuc3VidHJhY3QgPSBmdW5jdGlvbiBzdWJ0cmFjdChtYXRyaXgxLCBtYXRyaXgyLCBvdXRwdXQpIHtcbiAgICB2YXIgQSA9IG1hdHJpeDEudmFsdWVzO1xuICAgIHZhciBCID0gbWF0cml4Mi52YWx1ZXM7XG4gICAgdmFyIHJlc3VsdCA9IG91dHB1dC52YWx1ZXM7XG5cbiAgICB2YXIgQTAgPSBBWzBdO1xuICAgIHZhciBBMSA9IEFbMV07XG4gICAgdmFyIEEyID0gQVsyXTtcbiAgICB2YXIgQTMgPSBBWzNdO1xuICAgIHZhciBBNCA9IEFbNF07XG4gICAgdmFyIEE1ID0gQVs1XTtcbiAgICB2YXIgQTYgPSBBWzZdO1xuICAgIHZhciBBNyA9IEFbN107XG4gICAgdmFyIEE4ID0gQVs4XTtcblxuICAgIHZhciBCMCA9IEJbMF07XG4gICAgdmFyIEIxID0gQlsxXTtcbiAgICB2YXIgQjIgPSBCWzJdO1xuICAgIHZhciBCMyA9IEJbM107XG4gICAgdmFyIEI0ID0gQls0XTtcbiAgICB2YXIgQjUgPSBCWzVdO1xuICAgIHZhciBCNiA9IEJbNl07XG4gICAgdmFyIEI3ID0gQls3XTtcbiAgICB2YXIgQjggPSBCWzhdO1xuXG4gICAgcmVzdWx0WzBdID0gQTAgLSBCMDtcbiAgICByZXN1bHRbMV0gPSBBMSAtIEIxO1xuICAgIHJlc3VsdFsyXSA9IEEyIC0gQjI7XG4gICAgcmVzdWx0WzNdID0gQTMgLSBCMztcbiAgICByZXN1bHRbNF0gPSBBNCAtIEI0O1xuICAgIHJlc3VsdFs1XSA9IEE1IC0gQjU7XG4gICAgcmVzdWx0WzZdID0gQTYgLSBCNjtcbiAgICByZXN1bHRbN10gPSBBNyAtIEI3O1xuICAgIHJlc3VsdFs4XSA9IEE4IC0gQjg7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcbi8qKlxuICogTXVsdGlwbHkgdGhlIHByb3ZpZGVkIE1hdDMzIE0yIHdpdGggdGhpcyBNYXQzMy4gIFJlc3VsdCBpcyAodGhpcykgKiAoTTIpLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0MzN9IG1hdHJpeDEgVGhlIGxlZnQgTWF0MzMuXG4gKiBAcGFyYW0ge01hdDMzfSBtYXRyaXgyIFRoZSByaWdodCBNYXQzMy5cbiAqIEBwYXJhbSB7TWF0MzN9IG91dHB1dCBNYXQzMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge01hdDMzfSB0aGUgcmVzdWx0IG9mIHRoZSBtdWx0aXBsaWNhdGlvbi5cbiAqL1xuTWF0MzMubXVsdGlwbHkgPSBmdW5jdGlvbiBtdWx0aXBseShtYXRyaXgxLCBtYXRyaXgyLCBvdXRwdXQpIHtcbiAgICB2YXIgQSA9IG1hdHJpeDEudmFsdWVzO1xuICAgIHZhciBCID0gbWF0cml4Mi52YWx1ZXM7XG4gICAgdmFyIHJlc3VsdCA9IG91dHB1dC52YWx1ZXM7XG5cbiAgICB2YXIgQTAgPSBBWzBdO1xuICAgIHZhciBBMSA9IEFbMV07XG4gICAgdmFyIEEyID0gQVsyXTtcbiAgICB2YXIgQTMgPSBBWzNdO1xuICAgIHZhciBBNCA9IEFbNF07XG4gICAgdmFyIEE1ID0gQVs1XTtcbiAgICB2YXIgQTYgPSBBWzZdO1xuICAgIHZhciBBNyA9IEFbN107XG4gICAgdmFyIEE4ID0gQVs4XTtcblxuICAgIHZhciBCMCA9IEJbMF07XG4gICAgdmFyIEIxID0gQlsxXTtcbiAgICB2YXIgQjIgPSBCWzJdO1xuICAgIHZhciBCMyA9IEJbM107XG4gICAgdmFyIEI0ID0gQls0XTtcbiAgICB2YXIgQjUgPSBCWzVdO1xuICAgIHZhciBCNiA9IEJbNl07XG4gICAgdmFyIEI3ID0gQls3XTtcbiAgICB2YXIgQjggPSBCWzhdO1xuXG4gICAgcmVzdWx0WzBdID0gQTAqQjAgKyBBMSpCMyArIEEyKkI2O1xuICAgIHJlc3VsdFsxXSA9IEEwKkIxICsgQTEqQjQgKyBBMipCNztcbiAgICByZXN1bHRbMl0gPSBBMCpCMiArIEExKkI1ICsgQTIqQjg7XG4gICAgcmVzdWx0WzNdID0gQTMqQjAgKyBBNCpCMyArIEE1KkI2O1xuICAgIHJlc3VsdFs0XSA9IEEzKkIxICsgQTQqQjQgKyBBNSpCNztcbiAgICByZXN1bHRbNV0gPSBBMypCMiArIEE0KkI1ICsgQTUqQjg7XG4gICAgcmVzdWx0WzZdID0gQTYqQjAgKyBBNypCMyArIEE4KkI2O1xuICAgIHJlc3VsdFs3XSA9IEE2KkIxICsgQTcqQjQgKyBBOCpCNztcbiAgICByZXN1bHRbOF0gPSBBNipCMiArIEE3KkI1ICsgQTgqQjg7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXQzMztcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbiA9IE1hdGguc2luO1xudmFyIGNvcyA9IE1hdGguY29zO1xudmFyIGFzaW4gPSBNYXRoLmFzaW47XG52YXIgYWNvcyA9IE1hdGguYWNvcztcbnZhciBhdGFuMiA9IE1hdGguYXRhbjI7XG52YXIgc3FydCA9IE1hdGguc3FydDtcblxuLyoqXG4gKiBBIHZlY3Rvci1saWtlIG9iamVjdCB1c2VkIHRvIHJlcHJlc2VudCByb3RhdGlvbnMuIElmIHRoZXRhIGlzIHRoZSBhbmdsZSBvZlxuICogcm90YXRpb24sIGFuZCAoeCcsIHknLCB6JykgaXMgYSBub3JtYWxpemVkIHZlY3RvciByZXByZXNlbnRpbmcgdGhlIGF4aXMgb2ZcbiAqIHJvdGF0aW9uLCB0aGVuIHcgPSBjb3ModGhldGEvMiksIHggPSBzaW4odGhldGEvMikqeCcsIHkgPSBzaW4odGhldGEvMikqeScsXG4gKiBhbmQgeiA9IHNpbih0aGV0YS8yKSp6Jy5cbiAqXG4gKiBAY2xhc3MgUXVhdGVybmlvblxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFRoZSB3IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFRoZSB6IGNvbXBvbmVudC5cbiAqL1xuZnVuY3Rpb24gUXVhdGVybmlvbih3LCB4LCB5LCB6KSB7XG4gICAgdGhpcy53ID0gdyB8fCAxO1xuICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICB0aGlzLnkgPSB5IHx8IDA7XG4gICAgdGhpcy56ID0geiB8fCAwO1xufVxuXG4vKipcbiAqIE11bHRpcGx5IHRoZSBjdXJyZW50IFF1YXRlcm5pb24gYnkgaW5wdXQgUXVhdGVybmlvbiBxLlxuICogTGVmdC1oYW5kZWQgbXVsdGlwbGljYXRpb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcSBUaGUgUXVhdGVybmlvbiB0byBtdWx0aXBseSBieSBvbiB0aGUgcmlnaHQuXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gdGhpc1xuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIG11bHRpcGx5KHEpIHtcbiAgICB2YXIgeDEgPSB0aGlzLng7XG4gICAgdmFyIHkxID0gdGhpcy55O1xuICAgIHZhciB6MSA9IHRoaXMuejtcbiAgICB2YXIgdzEgPSB0aGlzLnc7XG4gICAgdmFyIHgyID0gcS54O1xuICAgIHZhciB5MiA9IHEueTtcbiAgICB2YXIgejIgPSBxLno7XG4gICAgdmFyIHcyID0gcS53IHx8IDA7XG5cbiAgICB0aGlzLncgPSB3MSAqIHcyIC0geDEgKiB4MiAtIHkxICogeTIgLSB6MSAqIHoyO1xuICAgIHRoaXMueCA9IHgxICogdzIgKyB4MiAqIHcxICsgeTIgKiB6MSAtIHkxICogejI7XG4gICAgdGhpcy55ID0geTEgKiB3MiArIHkyICogdzEgKyB4MSAqIHoyIC0geDIgKiB6MTtcbiAgICB0aGlzLnogPSB6MSAqIHcyICsgejIgKiB3MSArIHgyICogeTEgLSB4MSAqIHkyO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNdWx0aXBseSB0aGUgY3VycmVudCBRdWF0ZXJuaW9uIGJ5IGlucHV0IFF1YXRlcm5pb24gcSBvbiB0aGUgbGVmdCwgaS5lLiBxICogdGhpcy5cbiAqIExlZnQtaGFuZGVkIG11bHRpcGxpY2F0aW9uLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHEgVGhlIFF1YXRlcm5pb24gdG8gbXVsdGlwbHkgYnkgb24gdGhlIGxlZnQuXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gdGhpc1xuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5sZWZ0TXVsdGlwbHkgPSBmdW5jdGlvbiBsZWZ0TXVsdGlwbHkocSkge1xuICAgIHZhciB4MSA9IHEueDtcbiAgICB2YXIgeTEgPSBxLnk7XG4gICAgdmFyIHoxID0gcS56O1xuICAgIHZhciB3MSA9IHEudyB8fCAwO1xuICAgIHZhciB4MiA9IHRoaXMueDtcbiAgICB2YXIgeTIgPSB0aGlzLnk7XG4gICAgdmFyIHoyID0gdGhpcy56O1xuICAgIHZhciB3MiA9IHRoaXMudztcblxuICAgIHRoaXMudyA9IHcxKncyIC0geDEqeDIgLSB5MSp5MiAtIHoxKnoyO1xuICAgIHRoaXMueCA9IHgxKncyICsgeDIqdzEgKyB5Mip6MSAtIHkxKnoyO1xuICAgIHRoaXMueSA9IHkxKncyICsgeTIqdzEgKyB4MSp6MiAtIHgyKnoxO1xuICAgIHRoaXMueiA9IHoxKncyICsgejIqdzEgKyB4Mip5MSAtIHgxKnkyO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBseSB0aGUgY3VycmVudCBRdWF0ZXJuaW9uIHRvIGlucHV0IFZlYzMgdiwgYWNjb3JkaW5nIHRvXG4gKiB2JyA9IH5xICogdiAqIHEuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgcmVmZXJlbmNlIFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJvdGF0ZWQgdmVyc2lvbiBvZiB0aGUgVmVjMy5cbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUucm90YXRlVmVjdG9yID0gZnVuY3Rpb24gcm90YXRlVmVjdG9yKHYsIG91dHB1dCkge1xuICAgIHZhciBjdyA9IHRoaXMudztcbiAgICB2YXIgY3ggPSAtdGhpcy54O1xuICAgIHZhciBjeSA9IC10aGlzLnk7XG4gICAgdmFyIGN6ID0gLXRoaXMuejtcblxuICAgIHZhciB2eCA9IHYueDtcbiAgICB2YXIgdnkgPSB2Lnk7XG4gICAgdmFyIHZ6ID0gdi56O1xuXG4gICAgdmFyIHR3ID0gLWN4ICogdnggLSBjeSAqIHZ5IC0gY3ogKiB2ejtcbiAgICB2YXIgdHggPSB2eCAqIGN3ICsgdnkgKiBjeiAtIGN5ICogdno7XG4gICAgdmFyIHR5ID0gdnkgKiBjdyArIGN4ICogdnogLSB2eCAqIGN6O1xuICAgIHZhciB0eiA9IHZ6ICogY3cgKyB2eCAqIGN5IC0gY3ggKiB2eTtcblxuICAgIHZhciB3ID0gY3c7XG4gICAgdmFyIHggPSAtY3g7XG4gICAgdmFyIHkgPSAtY3k7XG4gICAgdmFyIHogPSAtY3o7XG5cbiAgICBvdXRwdXQueCA9IHR4ICogdyArIHggKiB0dyArIHkgKiB0eiAtIHR5ICogejtcbiAgICBvdXRwdXQueSA9IHR5ICogdyArIHkgKiB0dyArIHR4ICogeiAtIHggKiB0ejtcbiAgICBvdXRwdXQueiA9IHR6ICogdyArIHogKiB0dyArIHggKiB0eSAtIHR4ICogeTtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBJbnZlcnQgdGhlIGN1cnJlbnQgUXVhdGVybmlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gdGhpc1xuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5pbnZlcnQgPSBmdW5jdGlvbiBpbnZlcnQoKSB7XG4gICAgdGhpcy53ID0gLXRoaXMudztcbiAgICB0aGlzLnggPSAtdGhpcy54O1xuICAgIHRoaXMueSA9IC10aGlzLnk7XG4gICAgdGhpcy56ID0gLXRoaXMuejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ29uanVnYXRlIHRoZSBjdXJyZW50IFF1YXRlcm5pb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1F1YXRlcm5pb259IHRoaXNcbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUuY29uanVnYXRlID0gZnVuY3Rpb24gY29uanVnYXRlKCkge1xuICAgIHRoaXMueCA9IC10aGlzLng7XG4gICAgdGhpcy55ID0gLXRoaXMueTtcbiAgICB0aGlzLnogPSAtdGhpcy56O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBsZW5ndGggKG5vcm0pIG9mIHRoZSBjdXJyZW50IFF1YXRlcm5pb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gbGVuZ3RoIG9mIHRoZSBRdWF0ZXJuaW9uXG4gKi9cblF1YXRlcm5pb24ucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uIGxlbmd0aCgpIHtcbiAgICB2YXIgdyA9IHRoaXMudztcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcbiAgICByZXR1cm4gc3FydCh3ICogdyArIHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG59O1xuXG4vKipcbiAqIEFsdGVyIHRoZSBjdXJyZW50IFF1YXRlcm5pb24gdG8gYmUgb2YgdW5pdCBsZW5ndGg7XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1F1YXRlcm5pb259IHRoaXNcbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24gbm9ybWFsaXplKCkge1xuICAgIHZhciB3ID0gdGhpcy53O1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuICAgIHZhciBsZW5ndGggPSBzcXJ0KHcgKiB3ICsgeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gdGhpcztcbiAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgIHRoaXMudyAqPSBsZW5ndGg7XG4gICAgdGhpcy54ICo9IGxlbmd0aDtcbiAgICB0aGlzLnkgKj0gbGVuZ3RoO1xuICAgIHRoaXMueiAqPSBsZW5ndGg7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgdywgeCwgeSwgeiBjb21wb25lbnRzIG9mIHRoZSBjdXJyZW50IFF1YXRlcm5pb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB3IFRoZSB3IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFRoZSB6IGNvbXBvbmVudC5cbiAqXG4gKiBAcmV0dXJuIHtRdWF0ZXJuaW9ufSB0aGlzXG4gKi9cblF1YXRlcm5pb24ucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh3LCB4ICx5LCB6KSB7XG4gICAgaWYgKHcgIT0gbnVsbCkgdGhpcy53ID0gdztcbiAgICBpZiAoeCAhPSBudWxsKSB0aGlzLnggPSB4O1xuICAgIGlmICh5ICE9IG51bGwpIHRoaXMueSA9IHk7XG4gICAgaWYgKHogIT0gbnVsbCkgdGhpcy56ID0gejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ29weSBpbnB1dCBRdWF0ZXJuaW9uIHEgb250byB0aGUgY3VycmVudCBRdWF0ZXJuaW9uLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHEgVGhlIHJlZmVyZW5jZSBRdWF0ZXJuaW9uLlxuICpcbiAqIEByZXR1cm4ge1F1YXRlcm5pb259IHRoaXNcbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkocSkge1xuICAgIHRoaXMudyA9IHEudztcbiAgICB0aGlzLnggPSBxLng7XG4gICAgdGhpcy55ID0gcS55O1xuICAgIHRoaXMueiA9IHEuejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGN1cnJlbnQgUXVhdGVybmlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gdGhpc1xuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMudyA9IDE7XG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHRoaXMueiA9IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdC4gQ2FuIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBjb3NpbmUgb2YgdGhlIGFuZ2xlIGJldHdlZW5cbiAqIHRoZSB0d28gcm90YXRpb25zLCBhc3N1bWluZyBib3RoIFF1YXRlcm5pb25zIGFyZSBvZiB1bml0IGxlbmd0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtRdWF0ZXJuaW9ufSBxIFRoZSBvdGhlciBRdWF0ZXJuaW9uLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHJlc3VsdGluZyBkb3QgcHJvZHVjdFxuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3QocSkge1xuICAgIHJldHVybiB0aGlzLncgKiBxLncgKyB0aGlzLnggKiBxLnggKyB0aGlzLnkgKiBxLnkgKyB0aGlzLnogKiBxLno7XG59O1xuXG4vKipcbiAqIFNwaGVyaWNhbCBsaW5lYXIgaW50ZXJwb2xhdGlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtRdWF0ZXJuaW9ufSBxIFRoZSBmaW5hbCBvcmllbnRhdGlvbi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0IFRoZSB0d2VlbiBwYXJhbWV0ZXIuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHB1dCB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1F1YXRlcm5pb259IFRoZSBxdWF0ZXJuaW9uIHRoZSBzbGVycCByZXN1bHRzIHdlcmUgc2F2ZWQgdG9cbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUuc2xlcnAgPSBmdW5jdGlvbiBzbGVycChxLCB0LCBvdXRwdXQpIHtcbiAgICB2YXIgdyA9IHRoaXMudztcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBxdyA9IHEudztcbiAgICB2YXIgcXggPSBxLng7XG4gICAgdmFyIHF5ID0gcS55O1xuICAgIHZhciBxeiA9IHEuejtcblxuICAgIHZhciBvbWVnYTtcbiAgICB2YXIgY29zb21lZ2E7XG4gICAgdmFyIHNpbm9tZWdhO1xuICAgIHZhciBzY2FsZUZyb207XG4gICAgdmFyIHNjYWxlVG87XG5cbiAgICBjb3NvbWVnYSA9IHcgKiBxdyArIHggKiBxeCArIHkgKiBxeSArIHogKiBxejtcbiAgICBpZiAoKDEuMCAtIGNvc29tZWdhKSA+IDFlLTUpIHtcbiAgICAgICAgb21lZ2EgPSBhY29zKGNvc29tZWdhKTtcbiAgICAgICAgc2lub21lZ2EgPSBzaW4ob21lZ2EpO1xuICAgICAgICBzY2FsZUZyb20gPSBzaW4oKDEuMCAtIHQpICogb21lZ2EpIC8gc2lub21lZ2E7XG4gICAgICAgIHNjYWxlVG8gPSBzaW4odCAqIG9tZWdhKSAvIHNpbm9tZWdhO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc2NhbGVGcm9tID0gMS4wIC0gdDtcbiAgICAgICAgc2NhbGVUbyA9IHQ7XG4gICAgfVxuXG4gICAgb3V0cHV0LncgPSB3ICogc2NhbGVGcm9tICsgcXcgKiBzY2FsZVRvO1xuICAgIG91dHB1dC54ID0geCAqIHNjYWxlRnJvbSArIHF4ICogc2NhbGVUbztcbiAgICBvdXRwdXQueSA9IHkgKiBzY2FsZUZyb20gKyBxeSAqIHNjYWxlVG87XG4gICAgb3V0cHV0LnogPSB6ICogc2NhbGVGcm9tICsgcXogKiBzY2FsZVRvO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBNYXQzMyBtYXRyaXggY29ycmVzcG9uZGluZyB0byB0aGUgY3VycmVudCBRdWF0ZXJuaW9uLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3V0cHV0IE9iamVjdCB0byBwcm9jZXNzIHRoZSBUcmFuc2Zvcm0gbWF0cml4XG4gKlxuICogQHJldHVybiB7QXJyYXl9IHRoZSBRdWF0ZXJuaW9uIGFzIGEgVHJhbnNmb3JtIG1hdHJpeFxuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS50b01hdHJpeCA9IGZ1bmN0aW9uIHRvTWF0cml4KG91dHB1dCkge1xuICAgIHZhciB3ID0gdGhpcy53O1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIHh4ID0geCp4O1xuICAgIHZhciB5eSA9IHkqeTtcbiAgICB2YXIgenogPSB6Kno7XG4gICAgdmFyIHh5ID0geCp5O1xuICAgIHZhciB4eiA9IHgqejtcbiAgICB2YXIgeXogPSB5Kno7XG5cbiAgICByZXR1cm4gb3V0cHV0LnNldChbXG4gICAgICAgIDEgLSAyICogKHl5ICsgenopLCAyICogKHh5IC0gdyp6KSwgMiAqICh4eiArIHcqeSksXG4gICAgICAgIDIgKiAoeHkgKyB3KnopLCAxIC0gMiAqICh4eCArIHp6KSwgMiAqICh5eiAtIHcqeCksXG4gICAgICAgIDIgKiAoeHogLSB3KnkpLCAyICogKHl6ICsgdyp4KSwgMSAtIDIgKiAoeHggKyB5eSlcbiAgICBdKTtcbn07XG5cbi8qKlxuICogVGhlIHJvdGF0aW9uIGFuZ2xlcyBhYm91dCB0aGUgeCwgeSwgYW5kIHogYXhlcyBjb3JyZXNwb25kaW5nIHRvIHRoZVxuICogY3VycmVudCBRdWF0ZXJuaW9uLCB3aGVuIGFwcGxpZWQgaW4gdGhlIFpZWCBvcmRlci5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwdXQgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGUgVmVjMyB0aGUgcmVzdWx0IHdhcyBzdG9yZWQgaW5cbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUudG9FdWxlciA9IGZ1bmN0aW9uIHRvRXVsZXIob3V0cHV0KSB7XG4gICAgdmFyIHcgPSB0aGlzLnc7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgeHggPSB4ICogeDtcbiAgICB2YXIgeXkgPSB5ICogeTtcbiAgICB2YXIgenogPSB6ICogejtcblxuICAgIHZhciB0eSA9IDIgKiAoeCAqIHogKyB5ICogdyk7XG4gICAgdHkgPSB0eSA8IC0xID8gLTEgOiB0eSA+IDEgPyAxIDogdHk7XG5cbiAgICBvdXRwdXQueCA9IGF0YW4yKDIgKiAoeCAqIHcgLSB5ICogeiksIDEgLSAyICogKHh4ICsgeXkpKTtcbiAgICBvdXRwdXQueSA9IGFzaW4odHkpO1xuICAgIG91dHB1dC56ID0gYXRhbjIoMiAqICh6ICogdyAtIHggKiB5KSwgMSAtIDIgKiAoeXkgKyB6eikpO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogVGhlIFF1YXRlcm5pb24gY29ycmVzcG9uZGluZyB0byB0aGUgRXVsZXIgYW5nbGVzIHgsIHksIGFuZCB6LFxuICogYXBwbGllZCBpbiB0aGUgWllYIG9yZGVyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgYW5nbGUgb2Ygcm90YXRpb24gYWJvdXQgdGhlIHggYXhpcy5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSBhbmdsZSBvZiByb3RhdGlvbiBhYm91dCB0aGUgeSBheGlzLlxuICogQHBhcmFtIHtOdW1iZXJ9IHogVGhlIGFuZ2xlIG9mIHJvdGF0aW9uIGFib3V0IHRoZSB6IGF4aXMuXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IG91dHB1dCBRdWF0ZXJuaW9uIGluIHdoaWNoIHRvIHB1dCB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1F1YXRlcm5pb259IFRoZSBlcXVpdmFsZW50IFF1YXRlcm5pb24uXG4gKi9cblF1YXRlcm5pb24ucHJvdG90eXBlLmZyb21FdWxlciA9IGZ1bmN0aW9uIGZyb21FdWxlcih4LCB5LCB6KSB7XG4gICAgdmFyIGh4ID0geCAqIDAuNTtcbiAgICB2YXIgaHkgPSB5ICogMC41O1xuICAgIHZhciBoeiA9IHogKiAwLjU7XG5cbiAgICB2YXIgc3ggPSBzaW4oaHgpO1xuICAgIHZhciBzeSA9IHNpbihoeSk7XG4gICAgdmFyIHN6ID0gc2luKGh6KTtcbiAgICB2YXIgY3ggPSBjb3MoaHgpO1xuICAgIHZhciBjeSA9IGNvcyhoeSk7XG4gICAgdmFyIGN6ID0gY29zKGh6KTtcblxuICAgIHRoaXMudyA9IGN4ICogY3kgKiBjeiAtIHN4ICogc3kgKiBzejtcbiAgICB0aGlzLnggPSBzeCAqIGN5ICogY3ogKyBjeCAqIHN5ICogc3o7XG4gICAgdGhpcy55ID0gY3ggKiBzeSAqIGN6IC0gc3ggKiBjeSAqIHN6O1xuICAgIHRoaXMueiA9IGN4ICogY3kgKiBzeiArIHN4ICogc3kgKiBjejtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbHRlciB0aGUgY3VycmVudCBRdWF0ZXJuaW9uIHRvIHJlZmxlY3QgYSByb3RhdGlvbiBvZiBpbnB1dCBhbmdsZSBhYm91dFxuICogaW5wdXQgYXhpcyB4LCB5LCBhbmQgei5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGFuZ2xlIFRoZSBhbmdsZSBvZiByb3RhdGlvbi5cbiAqIEBwYXJhbSB7VmVjM30geCBUaGUgYXhpcyBvZiByb3RhdGlvbi5cbiAqIEBwYXJhbSB7VmVjM30geSBUaGUgYXhpcyBvZiByb3RhdGlvbi5cbiAqIEBwYXJhbSB7VmVjM30geiBUaGUgYXhpcyBvZiByb3RhdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtRdWF0ZXJuaW9ufSB0aGlzXG4gKi9cblF1YXRlcm5pb24ucHJvdG90eXBlLmZyb21BbmdsZUF4aXMgPSBmdW5jdGlvbiBmcm9tQW5nbGVBeGlzKGFuZ2xlLCB4LCB5LCB6KSB7XG4gICAgdmFyIGxlbiA9IHNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgIHRoaXMudyA9IDE7XG4gICAgICAgIHRoaXMueCA9IHRoaXMueSA9IHRoaXMueiA9IDA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBsZW4gPSAxIC8gbGVuO1xuICAgICAgICB2YXIgaGFsZlRoZXRhID0gYW5nbGUgKiAwLjU7XG4gICAgICAgIHZhciBzID0gc2luKGhhbGZUaGV0YSk7XG4gICAgICAgIHRoaXMudyA9IGNvcyhoYWxmVGhldGEpO1xuICAgICAgICB0aGlzLnggPSBzICogeCAqIGxlbjtcbiAgICAgICAgdGhpcy55ID0gcyAqIHkgKiBsZW47XG4gICAgICAgIHRoaXMueiA9IHMgKiB6ICogbGVuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTXVsdGlwbHkgdGhlIGlucHV0IFF1YXRlcm5pb25zLlxuICogTGVmdC1oYW5kZWQgY29vcmRpbmF0ZSBzeXN0ZW0gbXVsdGlwbGljYXRpb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcTEgVGhlIGxlZnQgUXVhdGVybmlvbi5cbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcTIgVGhlIHJpZ2h0IFF1YXRlcm5pb24uXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IG91dHB1dCBRdWF0ZXJuaW9uIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gVGhlIHByb2R1Y3Qgb2YgbXVsdGlwbGljYXRpb24uXG4gKi9cblF1YXRlcm5pb24ubXVsdGlwbHkgPSBmdW5jdGlvbiBtdWx0aXBseShxMSwgcTIsIG91dHB1dCkge1xuICAgIHZhciB3MSA9IHExLncgfHwgMDtcbiAgICB2YXIgeDEgPSBxMS54O1xuICAgIHZhciB5MSA9IHExLnk7XG4gICAgdmFyIHoxID0gcTEuejtcblxuICAgIHZhciB3MiA9IHEyLncgfHwgMDtcbiAgICB2YXIgeDIgPSBxMi54O1xuICAgIHZhciB5MiA9IHEyLnk7XG4gICAgdmFyIHoyID0gcTIuejtcblxuICAgIG91dHB1dC53ID0gdzEgKiB3MiAtIHgxICogeDIgLSB5MSAqIHkyIC0gejEgKiB6MjtcbiAgICBvdXRwdXQueCA9IHgxICogdzIgKyB4MiAqIHcxICsgeTIgKiB6MSAtIHkxICogejI7XG4gICAgb3V0cHV0LnkgPSB5MSAqIHcyICsgeTIgKiB3MSArIHgxICogejIgLSB4MiAqIHoxO1xuICAgIG91dHB1dC56ID0gejEgKiB3MiArIHoyICogdzEgKyB4MiAqIHkxIC0geDEgKiB5MjtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGlucHV0IHF1YXRlcm5pb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcSBUaGUgcmVmZXJlbmNlIFF1YXRlcm5pb24uXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IG91dHB1dCBRdWF0ZXJuaW9uIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gVGhlIG5vcm1hbGl6ZWQgcXVhdGVybmlvbi5cbiAqL1xuUXVhdGVybmlvbi5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUocSwgb3V0cHV0KSB7XG4gICAgdmFyIHcgPSBxLnc7XG4gICAgdmFyIHggPSBxLng7XG4gICAgdmFyIHkgPSBxLnk7XG4gICAgdmFyIHogPSBxLno7XG4gICAgdmFyIGxlbmd0aCA9IHNxcnQodyAqIHcgKyB4ICogeCArIHkgKiB5ICsgeiAqIHopO1xuICAgIGlmIChsZW5ndGggPT09IDApIHJldHVybiB0aGlzO1xuICAgIGxlbmd0aCA9IDEgLyBsZW5ndGg7XG4gICAgb3V0cHV0LncgKj0gbGVuZ3RoO1xuICAgIG91dHB1dC54ICo9IGxlbmd0aDtcbiAgICBvdXRwdXQueSAqPSBsZW5ndGg7XG4gICAgb3V0cHV0LnogKj0gbGVuZ3RoO1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFRoZSBjb25qdWdhdGUgb2YgdGhlIGlucHV0IFF1YXRlcm5pb24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcSBUaGUgcmVmZXJlbmNlIFF1YXRlcm5pb24uXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IG91dHB1dCBRdWF0ZXJuaW9uIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7UXVhdGVybmlvbn0gVGhlIGNvbmp1Z2F0ZSBRdWF0ZXJuaW9uLlxuICovXG5RdWF0ZXJuaW9uLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uIGNvbmp1Z2F0ZShxLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQudyA9IHEudztcbiAgICBvdXRwdXQueCA9IC1xLng7XG4gICAgb3V0cHV0LnkgPSAtcS55O1xuICAgIG91dHB1dC56ID0gLXEuejtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBDbG9uZSB0aGUgaW5wdXQgUXVhdGVybmlvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtRdWF0ZXJuaW9ufSBxIHRoZSByZWZlcmVuY2UgUXVhdGVybmlvbi5cbiAqXG4gKiBAcmV0dXJuIHtRdWF0ZXJuaW9ufSBUaGUgY2xvbmVkIFF1YXRlcm5pb24uXG4gKi9cblF1YXRlcm5pb24uY2xvbmUgPSBmdW5jdGlvbiBjbG9uZShxKSB7XG4gICAgcmV0dXJuIG5ldyBRdWF0ZXJuaW9uKHEudywgcS54LCBxLnksIHEueik7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGUgdHdvIGlucHV0IFF1YXRlcm5pb25zLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHExIFRoZSBsZWZ0IFF1YXRlcm5pb24uXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHEyIFRoZSByaWdodCBRdWF0ZXJuaW9uLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSB0d28gUXVhdGVybmlvbnMuXG4gKi9cblF1YXRlcm5pb24uZG90ID0gZnVuY3Rpb24gZG90KHExLCBxMikge1xuICAgIHJldHVybiBxMS53ICogcTIudyArIHExLnggKiBxMi54ICsgcTEueSAqIHEyLnkgKyBxMS56ICogcTIuejtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVhdGVybmlvbjtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbnZhciBWZWMzID0gcmVxdWlyZSgnLi9WZWMzJyk7XG5cblxudmFyIFJheSA9IGZ1bmN0aW9uICggb3JpZ2luLCBkaXJlY3Rpb24gKSB7XG5cblx0dGhpcy5vcmlnaW4gPSAoIG9yaWdpbiAhPT0gdW5kZWZpbmVkICkgPyAgbmV3IFZlYzMob3JpZ2luWzBdLG9yaWdpblsxXSxvcmlnaW5bMl0pIDogbmV3IFZlYzMoKTtcblx0dGhpcy5kaXJlY3Rpb24gPSAoIGRpcmVjdGlvbiAhPT0gdW5kZWZpbmVkICkgPyBuZXcgVmVjMyhkaXJlY3Rpb25bMF0sZGlyZWN0aW9uWzFdLGRpcmVjdGlvblsyXSkgOiBuZXcgVmVjMygpO1xuXG59O1xuXG5SYXkucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICggb3JpZ2luLCBkaXJlY3Rpb24gKSB7XG5cblx0XHR0aGlzLm9yaWdpbi5jb3B5KCBvcmlnaW4gKTtcblx0XHR0aGlzLmRpcmVjdGlvbi5jb3B5KCBkaXJlY3Rpb24gKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG59O1xuXG5SYXkucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoIHJheSApIHtcblxuXHRcdHRoaXMub3JpZ2luLmNvcHkoIHJheS5vcmlnaW4gKTtcblx0XHR0aGlzLmRpcmVjdGlvbi5jb3B5KCByYXkuZGlyZWN0aW9uICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxufTtcblxuUmF5LnByb3RvdHlwZS5hdCA9ICBmdW5jdGlvbiAoIHQgKSB7XG5cbiAgICB2YXIgcmVzdWx0ID0gbmV3IFZlYzMoKTtcblxuICAgIHJldHVybiByZXN1bHQuY29weSggdGhpcy5kaXJlY3Rpb24gKS5zY2FsZSggdCApLmFkZCggdGhpcy5vcmlnaW4gKTtcblxufTtcblxuXG5SYXkucHJvdG90eXBlLmludGVyc2VjdFNwaGVyZSA9IGZ1bmN0aW9uIChjZW50ZXIsIHJhZGl1cykge1xuXG5cdC8vIGZyb20gaHR0cDovL3d3dy5zY3JhdGNoYXBpeGVsLmNvbS9sZXNzb25zLzNkLWJhc2ljLWxlc3NvbnMvbGVzc29uLTctaW50ZXJzZWN0aW5nLXNpbXBsZS1zaGFwZXMvcmF5LXNwaGVyZS1pbnRlcnNlY3Rpb24vXG5cblx0dmFyIHZlYyA9IG5ldyBWZWMzKCk7XG4gICAgdmFyIGMgPSBuZXcgVmVjMyhjZW50ZXJbMF0sY2VudGVyWzFdLGNlbnRlclsyXSk7XG5cblx0dmVjLnN1YlZlY3RvcnMoIGMsIHRoaXMub3JpZ2luICk7XG5cblx0dmFyIHRjYSA9IHZlYy5kb3QoIHRoaXMuZGlyZWN0aW9uICk7XG5cblx0dmFyIGQyID0gdmVjLmRvdCggdmVjICkgLSB0Y2EgKiB0Y2E7XG5cblx0dmFyIHJhZGl1czIgPSByYWRpdXMgKiByYWRpdXM7XG5cblx0aWYgKCBkMiA+IHJhZGl1czIgKSByZXR1cm4gbnVsbDtcblxuXHR2YXIgdGhjID0gTWF0aC5zcXJ0KCByYWRpdXMyIC0gZDIgKTtcblxuXHQvLyB0MCA9IGZpcnN0IGludGVyc2VjdCBwb2ludCAtIGVudHJhbmNlIG9uIGZyb250IG9mIHNwaGVyZVxuXHR2YXIgdDAgPSB0Y2EgLSB0aGM7XG5cblx0Ly8gdDEgPSBzZWNvbmQgaW50ZXJzZWN0IHBvaW50IC0gZXhpdCBwb2ludCBvbiBiYWNrIG9mIHNwaGVyZVxuXHR2YXIgdDEgPSB0Y2EgKyB0aGM7XG5cblx0Ly8gdGVzdCB0byBzZWUgaWYgYm90aCB0MCBhbmQgdDEgYXJlIGJlaGluZCB0aGUgcmF5IC0gaWYgc28sIHJldHVybiBudWxsXG5cdGlmICggdDAgPCAwICYmIHQxIDwgMCApIHJldHVybiBudWxsO1xuXG5cdC8vIHRlc3QgdG8gc2VlIGlmIHQwIGlzIGJlaGluZCB0aGUgcmF5OlxuXHQvLyBpZiBpdCBpcywgdGhlIHJheSBpcyBpbnNpZGUgdGhlIHNwaGVyZSwgc28gcmV0dXJuIHRoZSBzZWNvbmQgZXhpdCBwb2ludCBzY2FsZWQgYnkgdDEsXG5cdC8vIGluIG9yZGVyIHRvIGFsd2F5cyByZXR1cm4gYW4gaW50ZXJzZWN0IHBvaW50IHRoYXQgaXMgaW4gZnJvbnQgb2YgdGhlIHJheS5cblx0aWYgKCB0MCA8IDAgKSByZXR1cm4gdGhpcy5hdCggdDEgKTtcblxuXHQvLyBlbHNlIHQwIGlzIGluIGZyb250IG9mIHRoZSByYXksIHNvIHJldHVybiB0aGUgZmlyc3QgY29sbGlzaW9uIHBvaW50IHNjYWxlZCBieSB0MFxuXHRyZXR1cm4gdGhpcy5hdCggdDAgKTtcblxufTtcblxuUmF5LnByb3RvdHlwZS5pbnRlcnNlY3RCb3ggPSBmdW5jdGlvbihjZW50ZXIsIHNpemUpIHtcblxuICAgIHZhciB0bWluLFxuICAgICAgICB0bWF4LFxuICAgICAgICB0eW1pbixcbiAgICAgICAgdHltYXgsXG4gICAgICAgIHR6bWluLFxuICAgICAgICB0em1heCxcbiAgICAgICAgYm94LFxuICAgICAgICBvdXQsXG4gICAgICAgIGludmRpcnggPSAxIC8gdGhpcy5kaXJlY3Rpb24ueCxcbiAgICAgICAgaW52ZGlyeSA9IDEgLyB0aGlzLmRpcmVjdGlvbi55LFxuICAgICAgICBpbnZkaXJ6ID0gMSAvIHRoaXMuZGlyZWN0aW9uLno7XG5cbiAgICBib3ggPSB7XG4gICAgICAgIG1pbjoge1xuICAgICAgICAgICAgeDogY2VudGVyWzBdLShzaXplWzBdLzIpLFxuICAgICAgICAgICAgeTogY2VudGVyWzFdLShzaXplWzFdLzIpLFxuICAgICAgICAgICAgejogY2VudGVyWzJdLShzaXplWzJdLzIpXG4gICAgICAgIH0sXG4gICAgICAgIG1heDoge1xuICAgICAgICAgICAgeDogY2VudGVyWzBdKyhzaXplWzBdLzIpLFxuICAgICAgICAgICAgeTogY2VudGVyWzFdKyhzaXplWzFdLzIpLFxuICAgICAgICAgICAgejogY2VudGVyWzJdKyhzaXplWzJdLzIpXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKCBpbnZkaXJ4ID49IDAgKSB7XG5cbiAgICAgICAgdG1pbiA9ICggYm94Lm1pbi54IC0gdGhpcy5vcmlnaW4ueCApICogaW52ZGlyeDtcbiAgICAgICAgdG1heCA9ICggYm94Lm1heC54IC0gdGhpcy5vcmlnaW4ueCApICogaW52ZGlyeDtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdG1pbiA9ICggYm94Lm1heC54IC0gdGhpcy5vcmlnaW4ueCApICogaW52ZGlyeDtcbiAgICAgICAgdG1heCA9ICggYm94Lm1pbi54IC0gdGhpcy5vcmlnaW4ueCApICogaW52ZGlyeDtcbiAgICB9XG5cbiAgICBpZiAoIGludmRpcnkgPj0gMCApIHtcblxuICAgICAgICB0eW1pbiA9ICggYm94Lm1pbi55IC0gdGhpcy5vcmlnaW4ueSApICogaW52ZGlyeTtcbiAgICAgICAgdHltYXggPSAoIGJveC5tYXgueSAtIHRoaXMub3JpZ2luLnkgKSAqIGludmRpcnk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHR5bWluID0gKCBib3gubWF4LnkgLSB0aGlzLm9yaWdpbi55ICkgKiBpbnZkaXJ5O1xuICAgICAgICB0eW1heCA9ICggYm94Lm1pbi55IC0gdGhpcy5vcmlnaW4ueSApICogaW52ZGlyeTtcbiAgICB9XG5cbiAgICBpZiAoICggdG1pbiA+IHR5bWF4ICkgfHwgKCB0eW1pbiA+IHRtYXggKSApIHJldHVybiBudWxsO1xuXG4gICAgaWYgKCB0eW1pbiA+IHRtaW4gfHwgdG1pbiAhPT0gdG1pbiApIHRtaW4gPSB0eW1pbjtcblxuICAgIGlmICggdHltYXggPCB0bWF4IHx8IHRtYXggIT09IHRtYXggKSB0bWF4ID0gdHltYXg7XG5cbiAgICBpZiAoIGludmRpcnogPj0gMCApIHtcblxuICAgICAgICB0em1pbiA9ICggYm94Lm1pbi56IC0gdGhpcy5vcmlnaW4ueiApICogaW52ZGlyejtcbiAgICAgICAgdHptYXggPSAoIGJveC5tYXgueiAtIHRoaXMub3JpZ2luLnogKSAqIGludmRpcno7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHR6bWluID0gKCBib3gubWF4LnogLSB0aGlzLm9yaWdpbi56ICkgKiBpbnZkaXJ6O1xuICAgICAgICB0em1heCA9ICggYm94Lm1pbi56IC0gdGhpcy5vcmlnaW4ueiApICogaW52ZGlyejtcbiAgICB9XG5cbiAgICBpZiAoICggdG1pbiA+IHR6bWF4ICkgfHwgKCB0em1pbiA+IHRtYXggKSApIHJldHVybiBudWxsO1xuXG4gICAgaWYgKCB0em1pbiA+IHRtaW4gfHwgdG1pbiAhPT0gdG1pbiApIHRtaW4gPSB0em1pbjtcblxuICAgIGlmICggdHptYXggPCB0bWF4IHx8IHRtYXggIT09IHRtYXggKSB0bWF4ID0gdHptYXg7XG5cblxuICAgIGlmICggdG1heCA8IDAgKSByZXR1cm4gbnVsbDtcblxuICAgIG91dCA9IHRoaXMuZGlyZWN0aW9uLnNjYWxlKHRtaW4gPj0gMCA/IHRtaW4gOiB0bWF4KTtcbiAgICByZXR1cm4gb3V0LmFkZChvdXQsIHRoaXMub3JpZ2luLCBvdXQpO1xuXG59O1xuXG5cblJheS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKCByYXkgKSB7XG5cblx0XHRyZXR1cm4gcmF5Lm9yaWdpbi5lcXVhbHMoIHRoaXMub3JpZ2luICkgJiYgcmF5LmRpcmVjdGlvbi5lcXVhbHMoIHRoaXMuZGlyZWN0aW9uICk7XG5cbn07XG5cblJheS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gbmV3IFJheSgpLmNvcHkoIHRoaXMgKTtcblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJheTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIHR3by1kaW1lbnNpb25hbCB2ZWN0b3IuXG4gKlxuICogQGNsYXNzIFZlYzJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKi9cbnZhciBWZWMyID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQXJyYXkgfHwgeCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICB0aGlzLnggPSB4WzBdIHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHhbMV0gfHwgMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICAgICAgdGhpcy55ID0geSB8fCAwO1xuICAgIH1cbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh4LCB5KSB7XG4gICAgaWYgKHggIT0gbnVsbCkgdGhpcy54ID0geDtcbiAgICBpZiAoeSAhPSBudWxsKSB0aGlzLnkgPSB5O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgdGhlIGlucHV0IHYgdG8gdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSBWZWMyIHRvIGFkZC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCh2KSB7XG4gICAgdGhpcy54ICs9IHYueDtcbiAgICB0aGlzLnkgKz0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgaW5wdXQgdiBmcm9tIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgVmVjMiB0byBzdWJ0cmFjdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3Qodikge1xuICAgIHRoaXMueCAtPSB2Lng7XG4gICAgdGhpcy55IC09IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2NhbGUgdGhlIGN1cnJlbnQgVmVjMiBieSBhIHNjYWxhciBvciBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcnxWZWMyfSBzIFRoZSBOdW1iZXIgb3IgdmVjMiBieSB3aGljaCB0byBzY2FsZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUocykge1xuICAgIGlmIChzIGluc3RhbmNlb2YgVmVjMikge1xuICAgICAgICB0aGlzLnggKj0gcy54O1xuICAgICAgICB0aGlzLnkgKj0gcy55O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy54ICo9IHM7XG4gICAgICAgIHRoaXMueSAqPSBzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUm90YXRlIHRoZSBWZWMyIGNvdW50ZXItY2xvY2t3aXNlIGJ5IHRoZXRhIGFib3V0IHRoZSB6LWF4aXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGV0YSBBbmdsZSBieSB3aGljaCB0byByb3RhdGUuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbih0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHRoaXMueCA9IHggKiBjb3NUaGV0YSAtIHkgKiBzaW5UaGV0YTtcbiAgICB0aGlzLnkgPSB4ICogc2luVGhldGEgKyB5ICogY29zVGhldGE7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIG9mIHRoZSBjdXJyZW50IFZlYzIgd2l0aCB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHYgVGhlIG90aGVyIFZlYzIuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcbn07XG5cbi8qKlxuICogVGhlIGNyb3NzIHByb2R1Y3Qgb2Ygb2YgdGhlIGN1cnJlbnQgVmVjMiB3aXRoIHRoZSBpbnB1dCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdiBUaGUgb3RoZXIgVmVjMi5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2Lng7XG59O1xuXG4vKipcbiAqIFByZXNlcnZlIHRoZSBtYWduaXR1ZGUgYnV0IGludmVydCB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5pbnZlcnQgPSBmdW5jdGlvbiBpbnZlcnQoKSB7XG4gICAgdGhpcy54ICo9IC0xO1xuICAgIHRoaXMueSAqPSAtMTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQXBwbHkgYSBmdW5jdGlvbiBjb21wb25lbnQtd2lzZSB0byB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBhcHBseS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIG1hcChmbikge1xuICAgIHRoaXMueCA9IGZuKHRoaXMueCk7XG4gICAgdGhpcy55ID0gZm4odGhpcy55KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0IHRoZSBtYWduaXR1ZGUgb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgbGVuZ3RoIG9mIHRoZSB2ZWN0b3JcbiAqL1xuVmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgaW5wdXQgb250byB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVmVjMiB0byBjb3B5XG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSh2KSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgbWFnbml0dWRlIG9mIHRoZSBjdXJyZW50IFZlYzIgaXMgZXhhY3RseSAwLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCB0aGUgbGVuZ3RoIGlzIDBcbiAqL1xuVmVjMi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gaXNaZXJvKCkge1xuICAgIGlmICh0aGlzLnggIT09IDAgfHwgdGhpcy55ICE9PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgZWxzZSByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogVGhlIGFycmF5IGZvcm0gb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IHRoZSBWZWMgdG8gYXMgYW4gYXJyYXlcbiAqL1xuVmVjMi5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uIHRvQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLngsIHRoaXMueV07XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSByZWZlcmVuY2UgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gb3V0cHV0IFZlYzIgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgbm9ybWFsaXplZCBWZWMyLlxuICovXG5WZWMyLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZSh2LCBvdXRwdXQpIHtcbiAgICB2YXIgeCA9IHYueDtcbiAgICB2YXIgeSA9IHYueTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSkgfHwgMTtcbiAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgIG91dHB1dC54ID0gdi54ICogbGVuZ3RoO1xuICAgIG91dHB1dC55ID0gdi55ICogbGVuZ3RoO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogQ2xvbmUgdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgVmVjMiB0byBjbG9uZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgY2xvbmVkIFZlYzIuXG4gKi9cblZlYzIuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSh2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHYueCwgdi55KTtcbn07XG5cbi8qKlxuICogQWRkIHRoZSBpbnB1dCBWZWMyJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gdjIgVGhlIHJpZ2h0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IG91dHB1dCBWZWMyIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIHJlc3VsdCBvZiB0aGUgYWRkaXRpb24uXG4gKi9cblZlYzIuYWRkID0gZnVuY3Rpb24gYWRkKHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2MS54ICsgdjIueDtcbiAgICBvdXRwdXQueSA9IHYxLnkgKyB2Mi55O1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgdGhlIHNlY29uZCBWZWMyIGZyb20gdGhlIGZpcnN0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYxIFRoZSBsZWZ0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IHYyIFRoZSByaWdodCBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSBvdXRwdXQgVmVjMiBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IFRoZSByZXN1bHQgb2YgdGhlIHN1YnRyYWN0aW9uLlxuICovXG5WZWMyLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3QodjEsIHYyLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYxLnggLSB2Mi54O1xuICAgIG91dHB1dC55ID0gdjEueSAtIHYyLnk7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU2NhbGUgdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgcmVmZXJlbmNlIFZlYzIuXG4gKiBAcGFyYW0ge051bWJlcn0gcyBOdW1iZXIgdG8gc2NhbGUgYnkuXG4gKiBAcGFyYW0ge1ZlYzJ9IG91dHB1dCBWZWMyIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIHJlc3VsdCBvZiB0aGUgc2NhbGluZy5cbiAqL1xuVmVjMi5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHYsIHMsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdi54ICogcztcbiAgICBvdXRwdXQueSA9IHYueSAqIHM7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSBpbnB1dCBWZWMyJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gdjIgVGhlIHJpZ2h0IFZlYzIuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgZG90IHByb2R1Y3QuXG4gKi9cblZlYzIuZG90ID0gZnVuY3Rpb24gZG90KHYxLCB2Mikge1xuICAgIHJldHVybiB2MS54ICogdjIueCArIHYxLnkgKiB2Mi55O1xufTtcblxuLyoqXG4gKiBUaGUgY3Jvc3MgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMidzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB2MiBUaGUgcmlnaHQgVmVjMi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSB6LWNvbXBvbmVudCBvZiB0aGUgY3Jvc3MgcHJvZHVjdC5cbiAqL1xuVmVjMi5jcm9zcyA9IGZ1bmN0aW9uKHYxLHYyKSB7XG4gICAgcmV0dXJuIHYxLnggKiB2Mi55IC0gdjEueSAqIHYyLng7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlYzI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSB0aHJlZS1kaW1lbnNpb25hbCB2ZWN0b3IuXG4gKlxuICogQGNsYXNzIFZlYzNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geiBUaGUgeiBjb21wb25lbnQuXG4gKi9cbnZhciBWZWMzID0gZnVuY3Rpb24oeCwgeSwgeil7XG4gICAgdGhpcy54ID0geCB8fCAwO1xuICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICB0aGlzLnogPSB6IHx8IDA7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geiBUaGUgeiBjb21wb25lbnQuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoeCwgeSwgeikge1xuICAgIGlmICh4ICE9IG51bGwpIHRoaXMueCA9IHg7XG4gICAgaWYgKHkgIT0gbnVsbCkgdGhpcy55ID0geTtcbiAgICBpZiAoeiAhPSBudWxsKSB0aGlzLnogPSB6O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgaW5wdXQgdiB0byB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIFZlYzMgdG8gYWRkLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHYpIHtcbiAgICB0aGlzLnggKz0gdi54O1xuICAgIHRoaXMueSArPSB2Lnk7XG4gICAgdGhpcy56ICs9IHYuejtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgaW5wdXQgdiBmcm9tIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgVmVjMyB0byBzdWJ0cmFjdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3Qodikge1xuICAgIHRoaXMueCAtPSB2Lng7XG4gICAgdGhpcy55IC09IHYueTtcbiAgICB0aGlzLnogLT0gdi56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0IHRoZSBpbnB1dCBhIGZyb20gYiBhbmQgY3JlYXRlIG5ldyB2ZWN0b3IuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gYSBUaGUgVmVjMyB0byBzdWJ0cmFjdC5cbiAqIEBwYXJhbSB7VmVjM30gYiBUaGUgVmVjMyB0byBzdWJ0cmFjdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnN1YlZlY3RvcnMgPSBmdW5jdGlvbiAoIGEsIGIgKSB7XG5cblx0dGhpcy54ID0gYS54IC0gYi54O1xuXHR0aGlzLnkgPSBhLnkgLSBiLnk7XG5cdHRoaXMueiA9IGEueiAtIGIuejtcblxuXHRyZXR1cm4gdGhpcztcblxufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIGN1cnJlbnQgVmVjMyBieSB0aGV0YSBjbG9ja3dpc2UgYWJvdXQgdGhlIHggYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbiByb3RhdGVYKHRoZXRhKSB7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy55ID0geSAqIGNvc1RoZXRhIC0geiAqIHNpblRoZXRhO1xuICAgIHRoaXMueiA9IHkgKiBzaW5UaGV0YSArIHogKiBjb3NUaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIGN1cnJlbnQgVmVjMyBieSB0aGV0YSBjbG9ja3dpc2UgYWJvdXQgdGhlIHkgYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnJvdGF0ZVkgPSBmdW5jdGlvbiByb3RhdGVZKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy54ID0geiAqIHNpblRoZXRhICsgeCAqIGNvc1RoZXRhO1xuICAgIHRoaXMueiA9IHogKiBjb3NUaGV0YSAtIHggKiBzaW5UaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgdGhlIGN1cnJlbnQgVmVjMyBieSB0aGV0YSBjbG9ja3dpc2UgYWJvdXQgdGhlIHogYXhpcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZXRhIEFuZ2xlIGJ5IHdoaWNoIHRvIHJvdGF0ZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbiByb3RhdGVaKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgdGhpcy54ID0geCAqIGNvc1RoZXRhIC0geSAqIHNpblRoZXRhO1xuICAgIHRoaXMueSA9IHggKiBzaW5UaGV0YSArIHkgKiBjb3NUaGV0YTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIGN1cnJlbnQgVmVjMyB3aXRoIGlucHV0IFZlYzMgdi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSBvdGhlciBWZWMzLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90KHYpIHtcbiAgICByZXR1cm4gdGhpcy54KnYueCArIHRoaXMueSp2LnkgKyB0aGlzLnoqdi56O1xufTtcblxuLyoqXG4gKiBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIGN1cnJlbnQgVmVjMyB3aXRoIGlucHV0IFZlYzMgdi5cbiAqIFN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZCBjcm9zc1xuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgb3RoZXIgVmVjM1xuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbiBjcm9zcyh2KSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgdnggPSB2Lng7XG4gICAgdmFyIHZ5ID0gdi55O1xuICAgIHZhciB2eiA9IHYuejtcblxuICAgIHRoaXMueCA9IHkgKiB2eiAtIHogKiB2eTtcbiAgICB0aGlzLnkgPSB6ICogdnggLSB4ICogdno7XG4gICAgdGhpcy56ID0geCAqIHZ5IC0geSAqIHZ4O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTY2FsZSB0aGUgY3VycmVudCBWZWMzIGJ5IGEgc2NhbGFyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcyBUaGUgTnVtYmVyIGJ5IHdoaWNoIHRvIHNjYWxlXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHMpIHtcbiAgICB0aGlzLnggKj0gcztcbiAgICB0aGlzLnkgKj0gcztcbiAgICB0aGlzLnogKj0gcztcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBQcmVzZXJ2ZSB0aGUgbWFnbml0dWRlIGJ1dCBpbnZlcnQgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuaW52ZXJ0ID0gZnVuY3Rpb24gaW52ZXJ0KCkge1xuICAgIHRoaXMueCA9IC10aGlzLng7XG4gICAgdGhpcy55ID0gLXRoaXMueTtcbiAgICB0aGlzLnogPSAtdGhpcy56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGx5IGEgZnVuY3Rpb24gY29tcG9uZW50LXdpc2UgdG8gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gYXBwbHkuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgICB0aGlzLnggPSBmbih0aGlzLngpO1xuICAgIHRoaXMueSA9IGZuKHRoaXMueSk7XG4gICAgdGhpcy56ID0gZm4odGhpcy56KTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUaGUgbWFnbml0dWRlIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIG1hZ25pdHVkZSBvZiB0aGUgVmVjM1xuICovXG5WZWMzLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiBsZW5ndGgoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG59O1xuXG4vKipcbiAqIFRoZSBtYWduaXR1ZGUgc3F1YXJlZCBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IG1hZ25pdHVkZSBvZiB0aGUgVmVjMyBzcXVhcmVkXG4gKi9cblZlYzMucHJvdG90eXBlLmxlbmd0aFNxID0gZnVuY3Rpb24gbGVuZ3RoU3EoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICByZXR1cm4geCAqIHggKyB5ICogeSArIHogKiB6O1xufTtcblxuLyoqXG4gKiBDb3B5IHRoZSBpbnB1dCBvbnRvIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBWZWMzIHRvIGNvcHlcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5KHYpIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHRoaXMueiA9IHYuejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgICB0aGlzLnogPSAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBtYWduaXR1ZGUgb2YgdGhlIGN1cnJlbnQgVmVjMyBpcyBleGFjdGx5IDAuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IHRoZSBtYWduaXR1ZGUgaXMgemVyb1xuICovXG5WZWMzLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiBpc1plcm8oKSB7XG4gICAgcmV0dXJuIHRoaXMueCA9PT0gMCAmJiB0aGlzLnkgPT09IDAgJiYgdGhpcy56ID09PSAwO1xufTtcblxuLyoqXG4gKiBUaGUgYXJyYXkgZm9ybSBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSB0aHJlZSBlbGVtZW50IGFycmF5IHJlcHJlc2VudGluZyB0aGUgY29tcG9uZW50cyBvZiB0aGUgVmVjM1xuICovXG5WZWMzLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gdG9BcnJheSgpIHtcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55LCB0aGlzLnpdO1xufTtcblxuLyoqXG4gKiBQcmVzZXJ2ZSB0aGUgb3JpZW50YXRpb24gYnV0IGNoYW5nZSB0aGUgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IFZlYzMgdG8gMS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgbGVuID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeikgfHwgMTtcbiAgICBsZW4gPSAxIC8gbGVuO1xuXG4gICAgdGhpcy54ICo9IGxlbjtcbiAgICB0aGlzLnkgKj0gbGVuO1xuICAgIHRoaXMueiAqPSBsZW47XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGx5IHRoZSByb3RhdGlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBpbnB1dCAodW5pdCkgUXVhdGVybmlvblxuICogdG8gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtRdWF0ZXJuaW9ufSBxIFVuaXQgUXVhdGVybmlvbiByZXByZXNlbnRpbmcgdGhlIHJvdGF0aW9uIHRvIGFwcGx5XG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5hcHBseVJvdGF0aW9uID0gZnVuY3Rpb24gYXBwbHlSb3RhdGlvbihxKSB7XG4gICAgdmFyIGN3ID0gcS53O1xuICAgIHZhciBjeCA9IC1xLng7XG4gICAgdmFyIGN5ID0gLXEueTtcbiAgICB2YXIgY3ogPSAtcS56O1xuXG4gICAgdmFyIHZ4ID0gdGhpcy54O1xuICAgIHZhciB2eSA9IHRoaXMueTtcbiAgICB2YXIgdnogPSB0aGlzLno7XG5cbiAgICB2YXIgdHcgPSAtY3ggKiB2eCAtIGN5ICogdnkgLSBjeiAqIHZ6O1xuICAgIHZhciB0eCA9IHZ4ICogY3cgKyB2eSAqIGN6IC0gY3kgKiB2ejtcbiAgICB2YXIgdHkgPSB2eSAqIGN3ICsgY3ggKiB2eiAtIHZ4ICogY3o7XG4gICAgdmFyIHR6ID0gdnogKiBjdyArIHZ4ICogY3kgLSBjeCAqIHZ5O1xuXG4gICAgdmFyIHcgPSBjdztcbiAgICB2YXIgeCA9IC1jeDtcbiAgICB2YXIgeSA9IC1jeTtcbiAgICB2YXIgeiA9IC1jejtcblxuICAgIHRoaXMueCA9IHR4ICogdyArIHggKiB0dyArIHkgKiB0eiAtIHR5ICogejtcbiAgICB0aGlzLnkgPSB0eSAqIHcgKyB5ICogdHcgKyB0eCAqIHogLSB4ICogdHo7XG4gICAgdGhpcy56ID0gdHogKiB3ICsgeiAqIHR3ICsgeCAqIHR5IC0gdHggKiB5O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBcHBseSB0aGUgaW5wdXQgTWF0MzMgdGhlIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TWF0MzN9IG1hdHJpeCBNYXQzMyB0byBhcHBseVxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuYXBwbHlNYXRyaXggPSBmdW5jdGlvbiBhcHBseU1hdHJpeChtYXRyaXgpIHtcbiAgICB2YXIgTSA9IG1hdHJpeC5nZXQoKTtcblxuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdGhpcy54ID0gTVswXSp4ICsgTVsxXSp5ICsgTVsyXSp6O1xuICAgIHRoaXMueSA9IE1bM10qeCArIE1bNF0qeSArIE1bNV0qejtcbiAgICB0aGlzLnogPSBNWzZdKnggKyBNWzddKnkgKyBNWzhdKno7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgaW5wdXQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSByZWZlcmVuY2UgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgbm9ybWFsaXplIFZlYzMuXG4gKi9cblZlYzMubm9ybWFsaXplID0gZnVuY3Rpb24gbm9ybWFsaXplKHYsIG91dHB1dCkge1xuICAgIHZhciB4ID0gdi54O1xuICAgIHZhciB5ID0gdi55O1xuICAgIHZhciB6ID0gdi56O1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopIHx8IDE7XG4gICAgbGVuZ3RoID0gMSAvIGxlbmd0aDtcblxuICAgIG91dHB1dC54ID0geCAqIGxlbmd0aDtcbiAgICBvdXRwdXQueSA9IHkgKiBsZW5ndGg7XG4gICAgb3V0cHV0LnogPSB6ICogbGVuZ3RoO1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIEFwcGx5IGEgcm90YXRpb24gdG8gdGhlIGlucHV0IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgcmVmZXJlbmNlIFZlYzMuXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHEgVW5pdCBRdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb24gdG8gYXBwbHkuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJvdGF0ZWQgdmVyc2lvbiBvZiB0aGUgaW5wdXQgVmVjMy5cbiAqL1xuVmVjMy5hcHBseVJvdGF0aW9uID0gZnVuY3Rpb24gYXBwbHlSb3RhdGlvbih2LCBxLCBvdXRwdXQpIHtcbiAgICB2YXIgY3cgPSBxLnc7XG4gICAgdmFyIGN4ID0gLXEueDtcbiAgICB2YXIgY3kgPSAtcS55O1xuICAgIHZhciBjeiA9IC1xLno7XG5cbiAgICB2YXIgdnggPSB2Lng7XG4gICAgdmFyIHZ5ID0gdi55O1xuICAgIHZhciB2eiA9IHYuejtcblxuICAgIHZhciB0dyA9IC1jeCAqIHZ4IC0gY3kgKiB2eSAtIGN6ICogdno7XG4gICAgdmFyIHR4ID0gdnggKiBjdyArIHZ5ICogY3ogLSBjeSAqIHZ6O1xuICAgIHZhciB0eSA9IHZ5ICogY3cgKyBjeCAqIHZ6IC0gdnggKiBjejtcbiAgICB2YXIgdHogPSB2eiAqIGN3ICsgdnggKiBjeSAtIGN4ICogdnk7XG5cbiAgICB2YXIgdyA9IGN3O1xuICAgIHZhciB4ID0gLWN4O1xuICAgIHZhciB5ID0gLWN5O1xuICAgIHZhciB6ID0gLWN6O1xuXG4gICAgb3V0cHV0LnggPSB0eCAqIHcgKyB4ICogdHcgKyB5ICogdHogLSB0eSAqIHo7XG4gICAgb3V0cHV0LnkgPSB0eSAqIHcgKyB5ICogdHcgKyB0eCAqIHogLSB4ICogdHo7XG4gICAgb3V0cHV0LnogPSB0eiAqIHcgKyB6ICogdHcgKyB4ICogdHkgLSB0eCAqIHk7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogQ2xvbmUgdGhlIGlucHV0IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgVmVjMyB0byBjbG9uZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgY2xvbmVkIFZlYzMuXG4gKi9cblZlYzMuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSh2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMzKHYueCwgdi55LCB2LnopO1xufTtcblxuLyoqXG4gKiBBZGQgdGhlIGlucHV0IFZlYzMncy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgcmVzdWx0IG9mIHRoZSBhZGRpdGlvbi5cbiAqL1xuVmVjMy5hZGQgPSBmdW5jdGlvbiBhZGQodjEsIHYyLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYxLnggKyB2Mi54O1xuICAgIG91dHB1dC55ID0gdjEueSArIHYyLnk7XG4gICAgb3V0cHV0LnogPSB2MS56ICsgdjIuejtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgc2Vjb25kIFZlYzMgZnJvbSB0aGUgZmlyc3QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdjEgVGhlIGxlZnQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gdjIgVGhlIHJpZ2h0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJlc3VsdCBvZiB0aGUgc3VidHJhY3Rpb24uXG4gKi9cblZlYzMuc3VidHJhY3QgPSBmdW5jdGlvbiBzdWJ0cmFjdCh2MSwgdjIsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdjEueCAtIHYyLng7XG4gICAgb3V0cHV0LnkgPSB2MS55IC0gdjIueTtcbiAgICBvdXRwdXQueiA9IHYxLnogLSB2Mi56O1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlIHRoZSBpbnB1dCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIHJlZmVyZW5jZSBWZWMzLlxuICogQHBhcmFtIHtOdW1iZXJ9IHMgTnVtYmVyIHRvIHNjYWxlIGJ5LlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSByZXN1bHQgb2YgdGhlIHNjYWxpbmcuXG4gKi9cblZlYzMuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZSh2LCBzLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYueCAqIHM7XG4gICAgb3V0cHV0LnkgPSB2LnkgKiBzO1xuICAgIG91dHB1dC56ID0gdi56ICogcztcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBTY2FsZSBhbmQgYWRkIHRoZSBpbnB1dCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIHJlZmVyZW5jZSBWZWMzLlxuICogQHBhcmFtIHtOdW1iZXJ9IHMgTnVtYmVyIHRvIHNjYWxlIGJ5LlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSByZXN1bHQgb2YgdGhlIHNjYWxpbmcuXG4gKi9cblZlYzMucHJvdG90eXBlLnNjYWxlQW5kQWRkID0gZnVuY3Rpb24gc2NhbGVBbmRBZGQoYSwgYiwgcykge1xuICAgIHRoaXMueCA9IGEueCArIChiLnggKiBzKTtcbiAgICB0aGlzLnkgPSBhLnkgKyAoYi55ICogcyk7XG4gICAgdGhpcy56ID0gYS56ICsgKGIueiAqIHMpO1xufTtcblxuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xuVmVjMy5wcm90b3R5cGUuc3F1YXJlZERpc3RhbmNlID0gZnVuY3Rpb24gc3F1YXJlZERpc3RhbmNlKGIpIHtcbiAgICB2YXIgeCA9IGIueCAtIHRoaXMueCxcbiAgICAgICAgeSA9IGIueSAtIHRoaXMueSxcbiAgICAgICAgeiA9IGIueiAtIHRoaXMuejtcbiAgICByZXR1cm4geCp4ICsgeSp5ICsgeip6XG59O1xuXG5WZWMzLnByb3RvdHlwZS5kaXN0YW5jZVRvID0gZnVuY3Rpb24gKCB2ICkge1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCggdGhpcy5zcXVhcmVkRGlzdGFuY2UoIHYgKSApO1xuXG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMydzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRvdCBwcm9kdWN0LlxuICovXG5WZWMzLmRvdCA9IGZ1bmN0aW9uIGRvdCh2MSwgdjIpIHtcbiAgICByZXR1cm4gdjEueCAqIHYyLnggKyB2MS55ICogdjIueSArIHYxLnogKiB2Mi56O1xufTtcblxuLyoqXG4gKiBUaGUgKHJpZ2h0LWhhbmRlZCkgY3Jvc3MgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMydzLlxuICogdjEgeCB2Mi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHRoZSBvYmplY3QgdGhlIHJlc3VsdCBvZiB0aGUgY3Jvc3MgcHJvZHVjdCB3YXMgcGxhY2VkIGludG9cbiAqL1xuVmVjMy5jcm9zcyA9IGZ1bmN0aW9uIGNyb3NzKHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgdmFyIHgxID0gdjEueDtcbiAgICB2YXIgeTEgPSB2MS55O1xuICAgIHZhciB6MSA9IHYxLno7XG4gICAgdmFyIHgyID0gdjIueDtcbiAgICB2YXIgeTIgPSB2Mi55O1xuICAgIHZhciB6MiA9IHYyLno7XG5cbiAgICBvdXRwdXQueCA9IHkxICogejIgLSB6MSAqIHkyO1xuICAgIG91dHB1dC55ID0gejEgKiB4MiAtIHgxICogejI7XG4gICAgb3V0cHV0LnogPSB4MSAqIHkyIC0geTEgKiB4MjtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBUaGUgcHJvamVjdGlvbiBvZiB2MSBvbnRvIHYyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIG9iamVjdCB0aGUgcmVzdWx0IG9mIHRoZSBjcm9zcyBwcm9kdWN0IHdhcyBwbGFjZWQgaW50b1xuICovXG5WZWMzLnByb2plY3QgPSBmdW5jdGlvbiBwcm9qZWN0KHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgdmFyIHgxID0gdjEueDtcbiAgICB2YXIgeTEgPSB2MS55O1xuICAgIHZhciB6MSA9IHYxLno7XG4gICAgdmFyIHgyID0gdjIueDtcbiAgICB2YXIgeTIgPSB2Mi55O1xuICAgIHZhciB6MiA9IHYyLno7XG5cbiAgICB2YXIgc2NhbGUgPSB4MSAqIHgyICsgeTEgKiB5MiArIHoxICogejI7XG4gICAgc2NhbGUgLz0geDIgKiB4MiArIHkyICogeTIgKyB6MiAqIHoyO1xuXG4gICAgb3V0cHV0LnggPSB4MiAqIHNjYWxlO1xuICAgIG91dHB1dC55ID0geTIgKiBzY2FsZTtcbiAgICBvdXRwdXQueiA9IHoyICogc2NhbGU7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuVmVjMy5wcm90b3R5cGUuY3JlYXRlRnJvbUFycmF5ID0gZnVuY3Rpb24oYSl7XG4gICAgdGhpcy54ID0gYVswXSB8fCAwO1xuICAgIHRoaXMueSA9IGFbMV0gfHwgMDtcbiAgICB0aGlzLnogPSBhWzJdIHx8IDA7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlYzM7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBNYXQzMzogcmVxdWlyZSgnLi9NYXQzMycpLFxuICAgIFF1YXRlcm5pb246IHJlcXVpcmUoJy4vUXVhdGVybmlvbicpLFxuICAgIFZlYzI6IHJlcXVpcmUoJy4vVmVjMicpLFxuICAgIFZlYzM6IHJlcXVpcmUoJy4vVmVjMycpLFxuICAgIFJheTogcmVxdWlyZSgnLi9SYXknKVxufTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qanNoaW50IC1XMDA4ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIGxpYnJhcnkgb2YgY3VydmVzIHdoaWNoIG1hcCBhbiBhbmltYXRpb24gZXhwbGljaXRseSBhcyBhIGZ1bmN0aW9uIG9mIHRpbWUuXG4gKlxuICogQG5hbWVzcGFjZVxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gbGluZWFyXG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBlYXNlSW5cbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGVhc2VPdXRcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGVhc2VJbk91dFxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gZWFzZU91dEJvdW5jZVxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gc3ByaW5nXG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBpblF1YWRcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IG91dFF1YWRcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGluT3V0UXVhZFxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5DdWJpY1xuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gb3V0Q3ViaWNcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGluT3V0Q3ViaWNcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGluUXVhcnRcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IG91dFF1YXJ0XG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBpbk91dFF1YXJ0XG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBpblF1aW50XG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBvdXRRdWludFxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5PdXRRdWludFxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5TaW5lXG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBvdXRTaW5lXG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBpbk91dFNpbmVcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGluRXhwb1xuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gb3V0RXhwb1xuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5PdXRFeHBcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGluQ2lyY1xuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gb3V0Q2lyY1xuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5PdXRDaXJjXG4gKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBpbkVsYXN0aWNcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IG91dEVsYXN0aWNcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGluT3V0RWxhc3RpY1xuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5Cb3VuY2VcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IG91dEJvdW5jZVxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaW5PdXRCb3VuY2VcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGZsYXQgICAgICAgICAgICAtIFVzZWZ1bCBmb3IgZGVsYXlpbmcgdGhlIGV4ZWN1dGlvbiBvZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBzdWJzZXF1ZW50IHRyYW5zaXRpb24uXG4gKi9cbnZhciBDdXJ2ZXMgPSB7XG4gICAgbGluZWFyOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0O1xuICAgIH0sXG5cbiAgICBlYXNlSW46IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdDtcbiAgICB9LFxuXG4gICAgZWFzZU91dDogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdCooMi10KTtcbiAgICB9LFxuXG4gICAgZWFzZUluT3V0OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICh0IDw9IDAuNSkgcmV0dXJuIDIqdCp0O1xuICAgICAgICBlbHNlIHJldHVybiAtMip0KnQgKyA0KnQgLSAxO1xuICAgIH0sXG5cbiAgICBlYXNlT3V0Qm91bmNlOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0KigzIC0gMip0KTtcbiAgICB9LFxuXG4gICAgc3ByaW5nOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAoMSAtIHQpICogTWF0aC5zaW4oNiAqIE1hdGguUEkgKiB0KSArIHQ7XG4gICAgfSxcblxuICAgIGluUXVhZDogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdCp0O1xuICAgIH0sXG5cbiAgICBvdXRRdWFkOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAtKHQtPTEpKnQrMTtcbiAgICB9LFxuXG4gICAgaW5PdXRRdWFkOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41KnQqdDtcbiAgICAgICAgcmV0dXJuIC0uNSooKC0tdCkqKHQtMikgLSAxKTtcbiAgICB9LFxuXG4gICAgaW5DdWJpYzogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gdCp0KnQ7XG4gICAgfSxcblxuICAgIG91dEN1YmljOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAoKC0tdCkqdCp0ICsgMSk7XG4gICAgfSxcblxuICAgIGluT3V0Q3ViaWM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKCh0Lz0uNSkgPCAxKSByZXR1cm4gLjUqdCp0KnQ7XG4gICAgICAgIHJldHVybiAuNSooKHQtPTIpKnQqdCArIDIpO1xuICAgIH0sXG5cbiAgICBpblF1YXJ0OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiB0KnQqdCp0O1xuICAgIH0sXG5cbiAgICBvdXRRdWFydDogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLSgoLS10KSp0KnQqdCAtIDEpO1xuICAgIH0sXG5cbiAgICBpbk91dFF1YXJ0OiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41KnQqdCp0KnQ7XG4gICAgICAgIHJldHVybiAtLjUgKiAoKHQtPTIpKnQqdCp0IC0gMik7XG4gICAgfSxcblxuICAgIGluUXVpbnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIHQqdCp0KnQqdDtcbiAgICB9LFxuXG4gICAgb3V0UXVpbnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuICgoLS10KSp0KnQqdCp0ICsgMSk7XG4gICAgfSxcblxuICAgIGluT3V0UXVpbnQ6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKCh0Lz0uNSkgPCAxKSByZXR1cm4gLjUqdCp0KnQqdCp0O1xuICAgICAgICByZXR1cm4gLjUqKCh0LT0yKSp0KnQqdCp0ICsgMik7XG4gICAgfSxcblxuICAgIGluU2luZTogZnVuY3Rpb24odCkge1xuICAgICAgICByZXR1cm4gLTEuMCpNYXRoLmNvcyh0ICogKE1hdGguUEkvMikpICsgMS4wO1xuICAgIH0sXG5cbiAgICBvdXRTaW5lOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNpbih0ICogKE1hdGguUEkvMikpO1xuICAgIH0sXG5cbiAgICBpbk91dFNpbmU6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIC0uNSooTWF0aC5jb3MoTWF0aC5QSSp0KSAtIDEpO1xuICAgIH0sXG5cbiAgICBpbkV4cG86IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuICh0PT09MCkgPyAwLjAgOiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpO1xuICAgIH0sXG5cbiAgICBvdXRFeHBvOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHJldHVybiAodD09PTEuMCkgPyAxLjAgOiAoLU1hdGgucG93KDIsIC0xMCAqIHQpICsgMSk7XG4gICAgfSxcblxuICAgIGluT3V0RXhwbzogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7XG4gICAgICAgIGlmICh0PT09MS4wKSByZXR1cm4gMS4wO1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAuNSAqIE1hdGgucG93KDIsIDEwICogKHQgLSAxKSk7XG4gICAgICAgIHJldHVybiAuNSAqICgtTWF0aC5wb3coMiwgLTEwICogLS10KSArIDIpO1xuICAgIH0sXG5cbiAgICBpbkNpcmM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIC0oTWF0aC5zcXJ0KDEgLSB0KnQpIC0gMSk7XG4gICAgfSxcblxuICAgIG91dENpcmM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgxIC0gKC0tdCkqdCk7XG4gICAgfSxcblxuICAgIGluT3V0Q2lyYzogZnVuY3Rpb24odCkge1xuICAgICAgICBpZiAoKHQvPS41KSA8IDEpIHJldHVybiAtLjUgKiAoTWF0aC5zcXJ0KDEgLSB0KnQpIC0gMSk7XG4gICAgICAgIHJldHVybiAuNSAqIChNYXRoLnNxcnQoMSAtICh0LT0yKSp0KSArIDEpO1xuICAgIH0sXG5cbiAgICBpbkVsYXN0aWM6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdmFyIHM9MS43MDE1ODt2YXIgcD0wO3ZhciBhPTEuMDtcbiAgICAgICAgaWYgKHQ9PT0wKSByZXR1cm4gMC4wOyAgaWYgKHQ9PT0xKSByZXR1cm4gMS4wOyAgaWYgKCFwKSBwPS4zO1xuICAgICAgICBzID0gcC8oMipNYXRoLlBJKSAqIE1hdGguYXNpbigxLjAvYSk7XG4gICAgICAgIHJldHVybiAtKGEqTWF0aC5wb3coMiwxMCoodC09MSkpICogTWF0aC5zaW4oKHQtcykqKDIqTWF0aC5QSSkvIHApKTtcbiAgICB9LFxuXG4gICAgb3V0RWxhc3RpYzogZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgcz0xLjcwMTU4O3ZhciBwPTA7dmFyIGE9MS4wO1xuICAgICAgICBpZiAodD09PTApIHJldHVybiAwLjA7ICBpZiAodD09PTEpIHJldHVybiAxLjA7ICBpZiAoIXApIHA9LjM7XG4gICAgICAgIHMgPSBwLygyKk1hdGguUEkpICogTWF0aC5hc2luKDEuMC9hKTtcbiAgICAgICAgcmV0dXJuIGEqTWF0aC5wb3coMiwtMTAqdCkgKiBNYXRoLnNpbigodC1zKSooMipNYXRoLlBJKS9wKSArIDEuMDtcbiAgICB9LFxuXG4gICAgaW5PdXRFbGFzdGljOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIHZhciBzPTEuNzAxNTg7dmFyIHA9MDt2YXIgYT0xLjA7XG4gICAgICAgIGlmICh0PT09MCkgcmV0dXJuIDAuMDsgIGlmICgodC89LjUpPT09MikgcmV0dXJuIDEuMDsgIGlmICghcCkgcD0oLjMqMS41KTtcbiAgICAgICAgcyA9IHAvKDIqTWF0aC5QSSkgKiBNYXRoLmFzaW4oMS4wL2EpO1xuICAgICAgICBpZiAodCA8IDEpIHJldHVybiAtLjUqKGEqTWF0aC5wb3coMiwxMCoodC09MSkpICogTWF0aC5zaW4oKHQtcykqKDIqTWF0aC5QSSkvcCkpO1xuICAgICAgICByZXR1cm4gYSpNYXRoLnBvdygyLC0xMCoodC09MSkpICogTWF0aC5zaW4oKHQtcykqKDIqTWF0aC5QSSkvcCkqLjUgKyAxLjA7XG4gICAgfSxcblxuICAgIGluQmFjazogZnVuY3Rpb24odCwgcykge1xuICAgICAgICBpZiAocyA9PT0gdW5kZWZpbmVkKSBzID0gMS43MDE1ODtcbiAgICAgICAgcmV0dXJuIHQqdCooKHMrMSkqdCAtIHMpO1xuICAgIH0sXG5cbiAgICBvdXRCYWNrOiBmdW5jdGlvbih0LCBzKSB7XG4gICAgICAgIGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAxLjcwMTU4O1xuICAgICAgICByZXR1cm4gKCgtLXQpKnQqKChzKzEpKnQgKyBzKSArIDEpO1xuICAgIH0sXG5cbiAgICBpbk91dEJhY2s6IGZ1bmN0aW9uKHQsIHMpIHtcbiAgICAgICAgaWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDEuNzAxNTg7XG4gICAgICAgIGlmICgodC89LjUpIDwgMSkgcmV0dXJuIC41Kih0KnQqKCgocyo9KDEuNTI1KSkrMSkqdCAtIHMpKTtcbiAgICAgICAgcmV0dXJuIC41KigodC09MikqdCooKChzKj0oMS41MjUpKSsxKSp0ICsgcykgKyAyKTtcbiAgICB9LFxuXG4gICAgaW5Cb3VuY2U6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgcmV0dXJuIDEuMCAtIEN1cnZlcy5vdXRCb3VuY2UoMS4wLXQpO1xuICAgIH0sXG5cbiAgICBvdXRCb3VuY2U6IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgaWYgKHQgPCAoMS8yLjc1KSkge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqdCp0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0IDwgKDIvMi43NSkpIHtcbiAgICAgICAgICAgIHJldHVybiAoNy41NjI1Kih0LT0oMS41LzIuNzUpKSp0ICsgLjc1KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0IDwgKDIuNS8yLjc1KSkge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqKHQtPSgyLjI1LzIuNzUpKSp0ICsgLjkzNzUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICg3LjU2MjUqKHQtPSgyLjYyNS8yLjc1KSkqdCArIC45ODQzNzUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluT3V0Qm91bmNlOiBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICh0IDwgLjUpIHJldHVybiBDdXJ2ZXMuaW5Cb3VuY2UodCoyKSAqIC41O1xuICAgICAgICByZXR1cm4gQ3VydmVzLm91dEJvdW5jZSh0KjItMS4wKSAqIC41ICsgLjU7XG4gICAgfSxcblxuICAgIGZsYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnZlcztcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEN1cnZlcyA9IHJlcXVpcmUoJy4vQ3VydmVzJyk7XG52YXIgRW5naW5lID0gcmVxdWlyZSgnLi4vY29yZS9FbmdpbmUnKTtcblxuLyoqXG4gKiBBIHN0YXRlIG1haW50YWluZXIgZm9yIGEgc21vb3RoIHRyYW5zaXRpb24gYmV0d2VlblxuICogICAgbnVtZXJpY2FsbHktc3BlY2lmaWVkIHN0YXRlcy4gRXhhbXBsZSBudW1lcmljIHN0YXRlcyBpbmNsdWRlIGZsb2F0cyBhbmRcbiAqICAgIGFycmF5cyBvZiBmbG9hdHMgb2JqZWN0cy5cbiAqXG4gKiBBbiBpbml0aWFsIHN0YXRlIGlzIHNldCB3aXRoIHRoZSBjb25zdHJ1Y3RvciBvciB1c2luZ1xuICogICAgIHtAbGluayBUcmFuc2l0aW9uYWJsZSNmcm9tfS4gU3Vic2VxdWVudCB0cmFuc2l0aW9ucyBjb25zaXN0IG9mIGFuXG4gKiAgICAgaW50ZXJtZWRpYXRlIHN0YXRlLCBlYXNpbmcgY3VydmUsIGR1cmF0aW9uIGFuZCBjYWxsYmFjay4gVGhlIGZpbmFsIHN0YXRlXG4gKiAgICAgb2YgZWFjaCB0cmFuc2l0aW9uIGlzIHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBzdWJzZXF1ZW50IG9uZS4gQ2FsbHMgdG9cbiAqICAgICB7QGxpbmsgVHJhbnNpdGlvbmFibGUjZ2V0fSBwcm92aWRlIHRoZSBpbnRlcnBvbGF0ZWQgc3RhdGUgYWxvbmcgdGhlIHdheS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlcmUgaXMgbm8gZXZlbnQgbG9vcCBoZXJlIC0gY2FsbHMgdG8ge0BsaW5rIFRyYW5zaXRpb25hYmxlI2dldH1cbiAqICAgIGFyZSB0aGUgb25seSB3YXkgdG8gZmluZCBzdGF0ZSBwcm9qZWN0ZWQgdG8gdGhlIGN1cnJlbnQgKG9yIHByb3ZpZGVkKVxuICogICAgdGltZSBhbmQgYXJlIHRoZSBvbmx5IHdheSB0byB0cmlnZ2VyIGNhbGxiYWNrcyBhbmQgbXV0YXRlIHRoZSBpbnRlcm5hbFxuICogICAgdHJhbnNpdGlvbiBxdWV1ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIHQgPSBuZXcgVHJhbnNpdGlvbmFibGUoWzAsIDBdKTtcbiAqIHRcbiAqICAgICAudG8oWzEwMCwgMF0sICdsaW5lYXInLCAxMDAwKVxuICogICAgIC5kZWxheSgxMDAwKVxuICogICAgIC50byhbMjAwLCAwXSwgJ291dEJvdW5jZScsIDEwMDApO1xuICpcbiAqIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAqIGRpdi5zdHlsZS5iYWNrZ3JvdW5kID0gJ2JsdWUnO1xuICogZGl2LnN0eWxlLndpZHRoID0gJzEwMHB4JztcbiAqIGRpdi5zdHlsZS5oZWlnaHQgPSAnMTAwcHgnO1xuICogZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICpcbiAqIGRpdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICogICAgIHQuaXNQYXVzZWQoKSA/IHQucmVzdW1lKCkgOiB0LnBhdXNlKCk7XG4gKiB9KTtcbiAqXG4gKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gbG9vcCgpIHtcbiAqICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZVgoJyArIHQuZ2V0KClbMF0gKyAncHgpJyArICcgdHJhbnNsYXRlWSgnICsgdC5nZXQoKVsxXSArICdweCknO1xuICogICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbiAqIH0pO1xuICpcbiAqIEBjbGFzcyBUcmFuc2l0aW9uYWJsZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge051bWJlcnxBcnJheS5OdW1iZXJ9IGluaXRpYWxTdGF0ZSAgICBpbml0aWFsIHN0YXRlIHRvIHRyYW5zaXRpb25cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gLSBlcXVpdmFsZW50IHRvIGEgcHVyc3VhbnRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gb2ZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtAbGluayBUcmFuc2l0aW9uYWJsZSNmcm9tfVxuICovXG5mdW5jdGlvbiBUcmFuc2l0aW9uYWJsZShpbml0aWFsU3RhdGUpIHtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgIHRoaXMuX2Zyb20gPSBudWxsO1xuICAgIHRoaXMuX3N0YXRlID0gbnVsbDtcbiAgICB0aGlzLl9zdGFydGVkQXQgPSBudWxsO1xuICAgIHRoaXMuX3BhdXNlZEF0ID0gbnVsbDtcbiAgICBpZiAoaW5pdGlhbFN0YXRlICE9IG51bGwpIHRoaXMuZnJvbShpbml0aWFsU3RhdGUpO1xufVxuXG4vKipcbiAqIEludGVybmFsIENsb2NrIHVzZWQgZm9yIGRldGVybWluaW5nIHRoZSBjdXJyZW50IHRpbWUgZm9yIHRoZSBvbmdvaW5nXG4gKiB0cmFuc2l0aW9ucy5cbiAqXG4gKiBAdHlwZSB7UGVyZm9ybWFuY2V8RGF0ZXxDbG9ja31cbiAqL1xuXG5UcmFuc2l0aW9uYWJsZS5DbG9jayA9IEVuZ2luZS5nZXRDbG9jaygpO1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHRyYW5zaXRpb24gdG8gYmUgcHVzaGVkIG9udG8gdGhlIGludGVybmFsIHF1ZXVlLlxuICpcbiAqIEBtZXRob2QgdG9cbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ8QXJyYXkuTnVtYmVyfSAgICBmaW5hbFN0YXRlICAgICAgICAgICAgICBmaW5hbCBzdGF0ZSB0b1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNpdG9uIHRvXG4gKiBAcGFyYW0gIHtTdHJpbmd8RnVuY3Rpb259ICAgICAgICBbY3VydmU9Q3VydmVzLmxpbmVhcl0gICBlYXNpbmcgZnVuY3Rpb25cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZWQgZm9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBvbGF0aW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbMCwgMV1cbiAqIEBwYXJhbSAge051bWJlcn0gICAgICAgICAgICAgICAgIFtkdXJhdGlvbj0xMDBdICAgICAgICAgIGR1cmF0aW9uIG9mXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgICAgICAgICAgICBbY2FsbGJhY2tdICAgICAgICAgICAgICBjYWxsYmFjayBmdW5jdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYmUgY2FsbGVkIGFmdGVyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgdHJhbnNpdGlvbiBpc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGVcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgICAgICAgICAgIFttZXRob2RdICAgICAgICAgICAgICAgIG1ldGhvZCB1c2VkIGZvclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwb2xhdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGUuZy4gc2xlcnApXG4gKiBAcmV0dXJuIHtUcmFuc2l0aW9uYWJsZX0gICAgICAgICB0aGlzXG4gKi9cblRyYW5zaXRpb25hYmxlLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uIHRvKGZpbmFsU3RhdGUsIGN1cnZlLCBkdXJhdGlvbiwgY2FsbGJhY2ssIG1ldGhvZCkge1xuICAgIGN1cnZlID0gY3VydmUgIT0gbnVsbCAmJiBjdXJ2ZS5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nID8gQ3VydmVzW2N1cnZlXSA6IGN1cnZlO1xuICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5fc3RhcnRlZEF0ID0gdGhpcy5jb25zdHJ1Y3Rvci5DbG9jay5ub3coKTtcbiAgICAgICAgdGhpcy5fcGF1c2VkQXQgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLl9xdWV1ZS5wdXNoKFxuICAgICAgICBmaW5hbFN0YXRlLFxuICAgICAgICBjdXJ2ZSAhPSBudWxsID8gY3VydmUgOiBDdXJ2ZXMubGluZWFyLFxuICAgICAgICBkdXJhdGlvbiAhPSBudWxsID8gZHVyYXRpb24gOiAxMDAsXG4gICAgICAgIGNhbGxiYWNrLFxuICAgICAgICBtZXRob2RcbiAgICApO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXNldHMgdGhlIHRyYW5zaXRpb24gcXVldWUgdG8gYSBzdGFibGUgaW5pdGlhbCBzdGF0ZS5cbiAqXG4gKiBAbWV0aG9kIGZyb21cbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ8QXJyYXkuTnVtYmVyfSAgICBpbml0aWFsU3RhdGUgICAgaW5pdGlhbCBzdGF0ZSB0b1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb24gZnJvbVxuICogQHJldHVybiB7VHJhbnNpdGlvbmFibGV9ICAgICAgICAgdGhpc1xuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuZnJvbSA9IGZ1bmN0aW9uIGZyb20oaW5pdGlhbFN0YXRlKSB7XG4gICAgdGhpcy5fc3RhdGUgPSBpbml0aWFsU3RhdGU7XG4gICAgdGhpcy5fZnJvbSA9IHRoaXMuX3N5bmMobnVsbCwgdGhpcy5fc3RhdGUpO1xuICAgIHRoaXMuX3F1ZXVlLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fc3RhcnRlZEF0ID0gdGhpcy5jb25zdHJ1Y3Rvci5DbG9jay5ub3coKTtcbiAgICB0aGlzLl9wYXVzZWRBdCA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERlbGF5cyB0aGUgZXhlY3V0aW9uIG9mIHRoZSBzdWJzZXF1ZW50IHRyYW5zaXRpb24gZm9yIGEgY2VydGFpbiBwZXJpb2Qgb2ZcbiAqIHRpbWUuXG4gKlxuICogQG1ldGhvZCBkZWxheVxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSAgICAgIGR1cmF0aW9uICAgIGRlbGF5IHRpbWUgaW4gbXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259ICAgIFtjYWxsYmFja10gIFplcm8tYXJndW1lbnQgZnVuY3Rpb24gdG8gY2FsbCBvbiBvYnNlcnZlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGlvbiAodD0xKVxuICogQHJldHVybiB7VHJhbnNpdGlvbmFibGV9ICAgICAgICAgdGhpc1xuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiBkZWxheShkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICB2YXIgZW5kU3RhdGUgPSB0aGlzLl9xdWV1ZS5sZW5ndGggPiAwID8gdGhpcy5fcXVldWVbdGhpcy5fcXVldWUubGVuZ3RoIC0gNV0gOiB0aGlzLl9zdGF0ZTtcbiAgICByZXR1cm4gdGhpcy50byhlbmRTdGF0ZSwgQ3VydmVzLmZsYXQsIGR1cmF0aW9uLCBjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIE92ZXJyaWRlcyBjdXJyZW50IHRyYW5zaXRpb24uXG4gKlxuICogQG1ldGhvZCBvdmVycmlkZVxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSAge051bWJlcnxBcnJheS5OdW1iZXJ9ICAgIFtmaW5hbFN0YXRlXSAgICBmaW5hbCBzdGF0ZSB0byB0cmFuc2l0b24gdG9cbiAqIEBwYXJhbSAge1N0cmluZ3xGdW5jdGlvbn0gICAgICAgIFtjdXJ2ZV0gICAgICAgICBlYXNpbmcgZnVuY3Rpb24gdXNlZCBmb3JcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnBvbGF0aW5nIFswLCAxXVxuICogQHBhcmFtICB7TnVtYmVyfSAgICAgICAgICAgICAgICAgW2R1cmF0aW9uXSAgICAgIGR1cmF0aW9uIG9mIHRyYW5zaXRpb25cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgICAgICAgICAgIFtjYWxsYmFja10gICAgICBjYWxsYmFjayBmdW5jdGlvbiB0byBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZCBhZnRlciB0aGUgdHJhbnNpdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIGNvbXBsZXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gICAgICAgICAgICAgICAgICBbbWV0aG9kXSAgICAgICAgb3B0aW9uYWwgbWV0aG9kIHVzZWQgZm9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwb2xhdGluZyBiZXR3ZWVuIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy4gU2V0IHRvIGBzbGVycGAgZm9yXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BoZXJpY2FsIGxpbmVhclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVycG9sYXRpb24uXG4gKiBAcmV0dXJuIHtUcmFuc2l0aW9uYWJsZX0gICAgICAgICB0aGlzXG4gKi9cblRyYW5zaXRpb25hYmxlLnByb3RvdHlwZS5vdmVycmlkZSA9IGZ1bmN0aW9uIG92ZXJyaWRlKGZpbmFsU3RhdGUsIGN1cnZlLCBkdXJhdGlvbiwgY2FsbGJhY2ssIG1ldGhvZCkge1xuICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChmaW5hbFN0YXRlICE9IG51bGwpIHRoaXMuX3F1ZXVlWzBdID0gZmluYWxTdGF0ZTtcbiAgICAgICAgaWYgKGN1cnZlICE9IG51bGwpICAgICAgdGhpcy5fcXVldWVbMV0gPSBjdXJ2ZS5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nID8gQ3VydmVzW2N1cnZlXSA6IGN1cnZlO1xuICAgICAgICBpZiAoZHVyYXRpb24gIT0gbnVsbCkgICB0aGlzLl9xdWV1ZVsyXSA9IGR1cmF0aW9uO1xuICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkgICB0aGlzLl9xdWV1ZVszXSA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAobWV0aG9kICE9IG51bGwpICAgICB0aGlzLl9xdWV1ZVs0XSA9IG1ldGhvZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogVXNlZCBmb3IgaW50ZXJwb2xhdGluZyBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHN0YXRlIG9mIHRoZSBjdXJyZW50bHlcbiAqIHJ1bm5pbmcgdHJhbnNpdGlvblxuICpcbiAqIEBtZXRob2QgIF9pbnRlcnBvbGF0ZVxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R8QXJyYXl8TnVtYmVyfSBvdXRwdXQgICAgIFdoZXJlIHRvIHdyaXRlIHRvIChpbiBvcmRlciB0byBhdm9pZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QgYWxsb2NhdGlvbiBhbmQgdGhlcmVmb3JlIEdDKS5cbiAqIEBwYXJhbSAge09iamVjdHxBcnJheXxOdW1iZXJ9IGZyb20gICAgICAgU3RhcnQgc3RhdGUgb2YgY3VycmVudCB0cmFuc2l0aW9uLlxuICogQHBhcmFtICB7T2JqZWN0fEFycmF5fE51bWJlcn0gdG8gICAgICAgICBFbmQgc3RhdGUgb2YgY3VycmVudCB0cmFuc2l0aW9uLlxuICogQHBhcmFtICB7TnVtYmVyfSBwcm9ncmVzcyAgICAgICAgICAgICAgICBQcm9ncmVzcyBvZiB0aGUgY3VycmVudCB0cmFuc2l0aW9uLFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiBbMCwgMV1cbiAqIEBwYXJhbSAge1N0cmluZ30gbWV0aG9kICAgICAgICAgICAgICAgICAgTWV0aG9kIHVzZWQgZm9yIGludGVycG9sYXRpb24gKGUuZy5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2xlcnApXG4gKiBAcmV0dXJuIHtPYmplY3R8QXJyYXl8TnVtYmVyfSAgICAgICAgICAgIG91dHB1dFxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuX2ludGVycG9sYXRlID0gZnVuY3Rpb24gX2ludGVycG9sYXRlKG91dHB1dCwgZnJvbSwgdG8sIHByb2dyZXNzLCBtZXRob2QpIHtcbiAgICBpZiAodG8gaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ3NsZXJwJykge1xuICAgICAgICAgICAgdmFyIHgsIHksIHosIHc7XG4gICAgICAgICAgICB2YXIgcXgsIHF5LCBxeiwgcXc7XG4gICAgICAgICAgICB2YXIgb21lZ2EsIGNvc29tZWdhLCBzaW5vbWVnYSwgc2NhbGVGcm9tLCBzY2FsZVRvO1xuXG4gICAgICAgICAgICB4ID0gZnJvbVswXTtcbiAgICAgICAgICAgIHkgPSBmcm9tWzFdO1xuICAgICAgICAgICAgeiA9IGZyb21bMl07XG4gICAgICAgICAgICB3ID0gZnJvbVszXTtcblxuICAgICAgICAgICAgcXggPSB0b1swXTtcbiAgICAgICAgICAgIHF5ID0gdG9bMV07XG4gICAgICAgICAgICBxeiA9IHRvWzJdO1xuICAgICAgICAgICAgcXcgPSB0b1szXTtcblxuICAgICAgICAgICAgaWYgKHByb2dyZXNzID09PSAxKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0WzBdID0gcXg7XG4gICAgICAgICAgICAgICAgb3V0cHV0WzFdID0gcXk7XG4gICAgICAgICAgICAgICAgb3V0cHV0WzJdID0gcXo7XG4gICAgICAgICAgICAgICAgb3V0cHV0WzNdID0gcXc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29zb21lZ2EgPSB3ICogcXcgKyB4ICogcXggKyB5ICogcXkgKyB6ICogcXo7XG4gICAgICAgICAgICBpZiAoKDEuMCAtIGNvc29tZWdhKSA+IDFlLTUpIHtcbiAgICAgICAgICAgICAgICBvbWVnYSA9IE1hdGguYWNvcyhjb3NvbWVnYSk7XG4gICAgICAgICAgICAgICAgc2lub21lZ2EgPSBNYXRoLnNpbihvbWVnYSk7XG4gICAgICAgICAgICAgICAgc2NhbGVGcm9tID0gTWF0aC5zaW4oKDEuMCAtIHByb2dyZXNzKSAqIG9tZWdhKSAvIHNpbm9tZWdhO1xuICAgICAgICAgICAgICAgIHNjYWxlVG8gPSBNYXRoLnNpbihwcm9ncmVzcyAqIG9tZWdhKSAvIHNpbm9tZWdhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NhbGVGcm9tID0gMS4wIC0gcHJvZ3Jlc3M7XG4gICAgICAgICAgICAgICAgc2NhbGVUbyA9IHByb2dyZXNzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRwdXRbMF0gPSB4ICogc2NhbGVGcm9tICsgcXggKiBzY2FsZVRvO1xuICAgICAgICAgICAgb3V0cHV0WzFdID0geSAqIHNjYWxlRnJvbSArIHF5ICogc2NhbGVUbztcbiAgICAgICAgICAgIG91dHB1dFsyXSA9IHogKiBzY2FsZUZyb20gKyBxeiAqIHNjYWxlVG87XG4gICAgICAgICAgICBvdXRwdXRbM10gPSB3ICogc2NhbGVGcm9tICsgcXcgKiBzY2FsZVRvO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRvIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0by5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIG91dHB1dFtpXSA9IHRoaXMuX2ludGVycG9sYXRlKG91dHB1dFtpXSwgZnJvbVtpXSwgdG9baV0sIHByb2dyZXNzLCBtZXRob2QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRvKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0W2tleV0gPSB0aGlzLl9pbnRlcnBvbGF0ZShvdXRwdXRba2V5XSwgZnJvbVtrZXldLCB0b1trZXldLCBwcm9ncmVzcywgbWV0aG9kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb3V0cHV0ID0gZnJvbSArIHByb2dyZXNzICogKHRvIC0gZnJvbSk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCB1c2VkIGZvciBzeW5jaHJvbml6aW5nIHRoZSBjdXJyZW50LCBhYnNvbHV0ZSBzdGF0ZSBvZlxuICogYSB0cmFuc2l0aW9uIHRvIGEgZ2l2ZW4gb3V0cHV0IGFycmF5LCBvYmplY3QgbGl0ZXJhbCBvciBudW1iZXIuIFN1cHBvcnRzXG4gKiBuZXN0ZWQgc3RhdGUgb2JqZWN0cyBieSB0aHJvdWdoIHJlY3Vyc2lvbi5cbiAqXG4gKiBAbWV0aG9kICBfc3luY1xuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ8QXJyYXl8T2JqZWN0fSBvdXRwdXQgICAgIFdoZXJlIHRvIHdyaXRlIHRvIChpbiBvcmRlciB0byBhdm9pZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QgYWxsb2NhdGlvbiBhbmQgdGhlcmVmb3JlIEdDKS5cbiAqIEBwYXJhbSAge051bWJlcnxBcnJheXxPYmplY3R9IGlucHV0ICAgICAgSW5wdXQgc3RhdGUgdG8gcHJveHkgb250byB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LlxuICogQHJldHVybiB7TnVtYmVyfEFycmF5fE9iamVjdH0gb3V0cHV0ICAgICBQYXNzZWQgaW4gb3V0cHV0IG9iamVjdC5cbiAqL1xuVHJhbnNpdGlvbmFibGUucHJvdG90eXBlLl9zeW5jID0gZnVuY3Rpb24gX3N5bmMob3V0cHV0LCBpbnB1dCkge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdudW1iZXInKSBvdXRwdXQgPSBpbnB1dDtcbiAgICBlbHNlIGlmIChpbnB1dCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGlmIChvdXRwdXQgPT0gbnVsbCkgb3V0cHV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBpbnB1dC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgb3V0cHV0W2ldID0gX3N5bmMob3V0cHV0W2ldLCBpbnB1dFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgaWYgKG91dHB1dCA9PSBudWxsKSBvdXRwdXQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGlucHV0KSB7XG4gICAgICAgICAgICBvdXRwdXRba2V5XSA9IF9zeW5jKG91dHB1dFtrZXldLCBpbnB1dFtrZXldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBHZXQgaW50ZXJwb2xhdGVkIHN0YXRlIG9mIGN1cnJlbnQgYWN0aW9uIGF0IHByb3ZpZGVkIHRpbWUuIElmIHRoZSBsYXN0XG4gKiAgICBhY3Rpb24gaGFzIGNvbXBsZXRlZCwgaW52b2tlIGl0cyBjYWxsYmFjay5cbiAqXG4gKiBAbWV0aG9kIGdldFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyPX0gdCAgICAgICAgICAgICAgIEV2YWx1YXRlIHRoZSBjdXJ2ZSBhdCBhIG5vcm1hbGl6ZWQgdmVyc2lvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgdGhpcyB0aW1lLiBJZiBvbWl0dGVkLCB1c2UgY3VycmVudCB0aW1lXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoVW5peCBlcG9jaCB0aW1lIHJldHJpZXZlZCBmcm9tIENsb2NrKS5cbiAqIEByZXR1cm4ge051bWJlcnxBcnJheS5OdW1iZXJ9ICAgIEJlZ2lubmluZyBzdGF0ZSBpbnRlcnBvbGF0ZWQgdG8gdGhpcyBwb2ludFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gdGltZS5cbiAqL1xuVHJhbnNpdGlvbmFibGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCh0KSB7XG4gICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRoaXMuX3N0YXRlO1xuXG4gICAgdCA9IHRoaXMuX3BhdXNlZEF0ID8gdGhpcy5fcGF1c2VkQXQgOiB0O1xuICAgIHQgPSB0ID8gdCA6IHRoaXMuY29uc3RydWN0b3IuQ2xvY2subm93KCk7XG5cbiAgICB2YXIgcHJvZ3Jlc3MgPSAodCAtIHRoaXMuX3N0YXJ0ZWRBdCkgLyB0aGlzLl9xdWV1ZVsyXTtcbiAgICB0aGlzLl9zdGF0ZSA9IHRoaXMuX2ludGVycG9sYXRlKFxuICAgICAgICB0aGlzLl9zdGF0ZSxcbiAgICAgICAgdGhpcy5fZnJvbSxcbiAgICAgICAgdGhpcy5fcXVldWVbMF0sXG4gICAgICAgIHRoaXMuX3F1ZXVlWzFdKHByb2dyZXNzID4gMSA/IDEgOiBwcm9ncmVzcyksXG4gICAgICAgIHRoaXMuX3F1ZXVlWzRdXG4gICAgKTtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLl9zdGF0ZTtcbiAgICBpZiAocHJvZ3Jlc3MgPj0gMSkge1xuICAgICAgICB0aGlzLl9zdGFydGVkQXQgPSB0aGlzLl9zdGFydGVkQXQgKyB0aGlzLl9xdWV1ZVsyXTtcbiAgICAgICAgdGhpcy5fZnJvbSA9IHRoaXMuX3N5bmModGhpcy5fZnJvbSwgdGhpcy5fc3RhdGUpO1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmVzcyA+IDEgPyB0aGlzLmdldCgpIDogc3RhdGU7XG59O1xuXG4vKipcbiAqIElzIHRoZXJlIGF0IGxlYXN0IG9uZSB0cmFuc2l0aW9uIHBlbmRpbmcgY29tcGxldGlvbj9cbiAqXG4gKiBAbWV0aG9kIGlzQWN0aXZlXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHBlbmRpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb24uIFBhdXNlZCB0cmFuc2l0aW9ucyBhcmUgc3RpbGwgYmVpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgIGNvbnNpZGVyZWQgYWN0aXZlLlxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuaXNBY3RpdmUgPSBmdW5jdGlvbiBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcXVldWUubGVuZ3RoID4gMDtcbn07XG5cbi8qKlxuICogSGFsdCB0cmFuc2l0aW9uIGF0IGN1cnJlbnQgc3RhdGUgYW5kIGVyYXNlIGFsbCBwZW5kaW5nIGFjdGlvbnMuXG4gKlxuICogQG1ldGhvZCBoYWx0XG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHJldHVybiB7VHJhbnNpdGlvbmFibGV9IHRoaXNcbiAqL1xuVHJhbnNpdGlvbmFibGUucHJvdG90eXBlLmhhbHQgPSBmdW5jdGlvbiBoYWx0KCkge1xuICAgIHJldHVybiB0aGlzLmZyb20odGhpcy5nZXQoKSk7XG59O1xuXG4vKipcbiAqIFBhdXNlIHRyYW5zaXRpb24uIFRoaXMgd2lsbCBub3QgZXJhc2UgYW55IGFjdGlvbnMuXG4gKlxuICogQG1ldGhvZCBwYXVzZVxuICogQGNoYWluYWJsZVxuICpcbiAqIEByZXR1cm4ge1RyYW5zaXRpb25hYmxlfSB0aGlzXG4gKi9cblRyYW5zaXRpb25hYmxlLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uIHBhdXNlKCkge1xuICAgIHRoaXMuX3BhdXNlZEF0ID0gdGhpcy5jb25zdHJ1Y3Rvci5DbG9jay5ub3coKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSGFzIHRoZSBjdXJyZW50IGFjdGlvbiBiZWVuIHBhdXNlZD9cbiAqXG4gKiBAbWV0aG9kIGlzUGF1c2VkXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gaWYgdGhlIGN1cnJlbnQgYWN0aW9uIGhhcyBiZWVuIHBhdXNlZFxuICovXG5UcmFuc2l0aW9uYWJsZS5wcm90b3R5cGUuaXNQYXVzZWQgPSBmdW5jdGlvbiBpc1BhdXNlZCgpIHtcbiAgICByZXR1cm4gISF0aGlzLl9wYXVzZWRBdDtcbn07XG5cbi8qKlxuICogUmVzdW1lIGEgcHJldmlvdXNseSBwYXVzZWQgdHJhbnNpdGlvbi5cbiAqXG4gKiBAbWV0aG9kIHJlc3VtZVxuICogQGNoYWluYWJsZVxuICpcbiAqIEByZXR1cm4ge1RyYW5zaXRpb25hYmxlfSB0aGlzXG4gKi9cblRyYW5zaXRpb25hYmxlLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiByZXN1bWUoKSB7XG4gICAgdmFyIGRpZmYgPSB0aGlzLl9wYXVzZWRBdCAtIHRoaXMuX3N0YXJ0ZWRBdDtcbiAgICB0aGlzLl9zdGFydGVkQXQgPSB0aGlzLmNvbnN0cnVjdG9yLkNsb2NrLm5vdygpIC0gZGlmZjtcbiAgICB0aGlzLl9wYXVzZWRBdCA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENhbmNlbCBhbGwgdHJhbnNpdGlvbnMgYW5kIHJlc2V0IHRvIGEgc3RhYmxlIHN0YXRlXG4gKlxuICogQG1ldGhvZCByZXNldFxuICogQGNoYWluYWJsZVxuICogQGRlcHJlY2F0ZWQgVXNlIGAuZnJvbWAgaW5zdGVhZCFcbiAqXG4gKiBAcGFyYW0ge051bWJlcnxBcnJheS5OdW1iZXJ8T2JqZWN0LjxudW1iZXIsIG51bWJlcj59IHN0YXJ0XG4gKiAgICBzdGFibGUgc3RhdGUgdG8gc2V0IHRvXG4gKiBAcmV0dXJuIHtUcmFuc2l0aW9uYWJsZX0gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNcbiAqL1xuVHJhbnNpdGlvbmFibGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tKHN0YXJ0KTtcbn07XG5cbi8qKlxuICogQWRkIHRyYW5zaXRpb24gdG8gZW5kIHN0YXRlIHRvIHRoZSBxdWV1ZSBvZiBwZW5kaW5nIHRyYW5zaXRpb25zLiBTcGVjaWFsXG4gKiAgICBVc2U6IGNhbGxpbmcgd2l0aG91dCBhIHRyYW5zaXRpb24gcmVzZXRzIHRoZSBvYmplY3QgdG8gdGhhdCBzdGF0ZSB3aXRoXG4gKiAgICBubyBwZW5kaW5nIGFjdGlvbnNcbiAqXG4gKiBAbWV0aG9kIHNldFxuICogQGNoYWluYWJsZVxuICogQGRlcHJlY2F0ZWQgVXNlIGAudG9gIGluc3RlYWQhXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8RmFtb3VzRW5naW5lTWF0cml4fEFycmF5Lk51bWJlcnxPYmplY3QuPG51bWJlciwgbnVtYmVyPn0gc3RhdGVcbiAqICAgIGVuZCBzdGF0ZSB0byB3aGljaCB3ZSBpbnRlcnBvbGF0ZVxuICogQHBhcmFtIHt0cmFuc2l0aW9uPX0gdHJhbnNpdGlvbiBvYmplY3Qgb2YgdHlwZSB7ZHVyYXRpb246IG51bWJlciwgY3VydmU6XG4gKiAgICBmWzAsMV0gLT4gWzAsMV0gb3IgbmFtZX0uIElmIHRyYW5zaXRpb24gaXMgb21pdHRlZCwgY2hhbmdlIHdpbGwgYmVcbiAqICAgIGluc3RhbnRhbmVvdXMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCk9fSBjYWxsYmFjayBaZXJvLWFyZ3VtZW50IGZ1bmN0aW9uIHRvIGNhbGwgb24gb2JzZXJ2ZWRcbiAqICAgIGNvbXBsZXRpb24gKHQ9MSlcbiAqIEByZXR1cm4ge1RyYW5zaXRpb25hYmxlfSB0aGlzXG4gKi9cblRyYW5zaXRpb25hYmxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihzdGF0ZSwgdHJhbnNpdGlvbiwgY2FsbGJhY2spIHtcbiAgICBpZiAodHJhbnNpdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuZnJvbShzdGF0ZSk7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMudG8oc3RhdGUsIHRyYW5zaXRpb24uY3VydmUsIHRyYW5zaXRpb24uZHVyYXRpb24sIGNhbGxiYWNrLCB0cmFuc2l0aW9uLm1ldGhvZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2l0aW9uYWJsZTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIEN1cnZlczogcmVxdWlyZSgnLi9DdXJ2ZXMnKSxcbiAgICBUcmFuc2l0aW9uYWJsZTogcmVxdWlyZSgnLi9UcmFuc2l0aW9uYWJsZScpXG59O1xuIl19