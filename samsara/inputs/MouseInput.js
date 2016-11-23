/* Copyright © 2015-2016 David Valdman */

define(function(require, exports, module) {
    var EventHandler = require('../events/EventHandler');
    var OptionsManager = require('../core/_OptionsManager');
    var StreamContract = require('../streams/_StreamContract');

    var MINIMUM_TICK_TIME = 8;
    var _now = Date.now;

    /**
     * Wrapper for DOM mouse events. Converts
     *
     *      `mousedown` -> `start`
     *      `mousemove` -> `update`
     *      `mouseup`   -> `end`
     *
     * MouseInput emits these events with the following payload data:
     *
     *      `x`         - x-position relative to screen (independent of scroll)
     *      `y`         - y-position relative to screen (independent of scroll)
     *      `value`     - Displacement in pixels from `mousedown`
     *      `delta`     - Differential in pixels between successive mouse positions
     *      `velocity`  - Velocity of mouse movement in pixels per second
     *      `cumulate`  - Accumulated value over successive displacements
     *      `event`     - Original DOM event
     *      `dt`        - Time since last update
     *
     * @example
     *
     *      var surface = new Surface({
     *          size : [100,100],
     *          properties : {background : 'red'}
     *      });
     *
     *      var mouseInput = new MouseInput({
     *          direction : MouseInput.DIRECTION.X
     *      });
     *
     *      mouseInput.subscribe(surface);
     *
     *      mouseInput.on('start', function(payload){
     *          // fired on mouse down
     *          console.log('start', payload);
     *      });
     *
     *      mouseInput.on('update', function(payload){
     *          // fired on mouse move
     *          console.log('update', payload);
     *      });
     *
     *      mouseInput.on('end', function(payload){
     *          // fired on mouse up
     *          console.log('end', payload);
     *      });
     *
     * @class MouseInput
     * @constructor
     * @extends SimpleStream
     * @uses Core._OptionsManager
     * @param [options] {Object}                Options
     * @param [options.scale=1] {Number}        Scale the response to the mouse
     * @param [options.direction] {Number}      Direction to project movement onto.
     *                                          Options found in MouseInput.DIRECTION.
     * @param [options.rails=false] {Boolean}   If a direction is specified, movement in the
     *                                          orthogonal direction is suppressed
     */
    function MouseInput(options) {
        this.options = OptionsManager.setOptions(this, options);

        StreamContract.call(this);

        this._eventInput = new EventHandler();
        EventHandler.setInputHandler(this, this._eventInput);

        // references for event listeners put on document when
        // mouse is quickly moved off of target DOM element
        this.boundMove = handleMove.bind(this);;
        this.boundUp = null;

        this._eventInput.on('mousedown',    handleStart.bind(this));
        this._eventInput.on('mouseup',      handleEnd.bind(this));
        this._eventInput.on('mouseenter',   handleEnter.bind(this));
        this._eventInput.on('mouseleave',   handleLeave.bind(this));

        this._payload = {
            x : 0,
            y : 0,
            delta : null,
            value : null,
            cumulate : null,
            velocity : null
        };

        this._value = null;
        this._cumulate = null;
        this._prevCoord = undefined;
        this._prevTime = undefined;
        this._down = false;
    }

    MouseInput.prototype = Object.create(StreamContract.prototype);
    MouseInput.prototype.constructor = MouseInput;

    MouseInput.DEFAULT_OPTIONS = {
        direction : undefined,
        scale : 1,
        rails : false
    };

    /**
     * Constrain the input along a specific axis.
     *
     * @property DIRECTION {Object}
     * @property DIRECTION.X {Number}   x-axis
     * @property DIRECTION.Y {Number}   y-axis
     * @static
     */
    MouseInput.DIRECTION = {
        X : 0,
        Y : 1
    };

    function handleStart(event) {
        this._eventInput.on('mousemove', this.boundMove);

        var delta;
        var velocity;

        event.preventDefault(); // prevent drag

        var x = event.clientX;
        var y = event.clientY;

        this._prevCoord = [x, y];
        this._prevTime = _now();
        this._down = true;

        var payload = this._payload;

        if (this.options.direction !== undefined) {
            if (this._cumulate === null) this._cumulate = 0;
            this._value = 0;
            delta = 0;
            velocity = 0;
            if (this.options.direction === MouseInput.DIRECTION.X) payload.x = x;
            if (this.options.direction === MouseInput.DIRECTION.Y) payload.y = y;
        }
        else {
            if (this._cumulate === null) this._cumulate = [0, 0];
            this._value = [0, 0];
            delta = [0, 0];
            velocity = [0, 0];
            payload.x = x;
            payload.y = y;
        }

        payload.delta = delta;
        payload.value = this._value;
        payload.cumulate = this._cumulate;
        payload.velocity = velocity;
        payload.event = event;

        this.emit('start', payload);
    }

    function handleMove(event){
        var direction = this.options.direction;
        var scale = this.options.scale;

        var prevCoord = this._prevCoord;
        var prevTime = this._prevTime;

        var x = event.clientX;
        var y = event.clientY;

        var currTime = _now();

        var diffX = scale * (x - prevCoord[0]);
        var diffY = scale * (y - prevCoord[1]);

        if (this.options.rails && direction !== undefined){
            var activateRails =
                (direction === MouseInput.DIRECTION.X && Math.abs(diffX) < Math.abs(0.5 * diffY)) ||
                (direction === MouseInput.DIRECTION.Y && Math.abs(diffY) < Math.abs(0.5 * diffX));

            if (activateRails) return false;
        }

        var dt = Math.max(currTime - prevTime, MINIMUM_TICK_TIME); // minimum tick time
        var invDt = 1 / dt;

        var velX = diffX * invDt;
        var velY = diffY * invDt;

        var nextVel;
        var nextDelta;

        var payload = this._payload;

        if (direction === MouseInput.DIRECTION.X) {
            payload.x = x;
            nextDelta = diffX;
            nextVel = velX;
            this._value += nextDelta;
            this._cumulate += nextDelta;
        }
        else if (direction === MouseInput.DIRECTION.Y) {
            payload.y = y;
            nextDelta = diffY;
            nextVel = velY;
            this._value += nextDelta;
            this._cumulate += nextDelta;
        }
        else {
            payload.x = x;
            payload.y = y;
            nextDelta = [diffX, diffY];
            nextVel = [velX, velY];
            this._value[0] += nextDelta[0];
            this._value[1] += nextDelta[1];
            this._cumulate[0] += nextDelta[0];
            this._cumulate[1] += nextDelta[1];
        }


        payload.delta = nextDelta;
        payload.value = this._value;
        payload.cumulate = this._cumulate;
        payload.velocity = nextVel;
        payload.event = event;
        payload.dt = dt;

        this.emit('update', payload);

        this._prevCoord = [x, y];
        this._prevTime = currTime;
    }

    function handleEnd(event) {
        this._eventInput.off('mousemove');

        this._payload.event = event;

        this.emit('end', this._payload);

        this._prevCoord = undefined;
        this._prevTime = undefined;
        this._down = false;
    }

    function handleEnter(event){
        if (!this._down) return false;

        this._eventInput.off('mousemove');
        this._eventInput.off('mouseup');

        document.removeEventListener('mousemove', this.boundMove);
        document.removeEventListener('mouseup', this.boundUp);
    }

    function handleLeave(event) {
        if (!this._down) return false;

        this.boundUp = function(event) {
            handleEnd.call(this, event);
            document.removeEventListener('mousemove', this.boundMove);
            document.removeEventListener('mouseup', this.boundUp);
        }.bind(this, event);

        this._eventInput.off('mousemove');
        this._eventInput.off('mouseup');

        document.addEventListener('mousemove', this.boundMove);
        document.addEventListener('mouseup', this.boundUp);
    }

    module.exports = MouseInput;
});
