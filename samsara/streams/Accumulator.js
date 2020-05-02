/* Copyright © 2015-2016 David Valdman */

define(function(require, exports, module){
    var OptionsManager = require('../core/_OptionsManager');
    var Stream = require('../streams/Stream');
    var preTickQueue = require('../core/queues/preTickQueue');

    /**
     * Accumulator is a Stream that accumulates a value given by a
     *  number or array of numbers.
     *
     *  It emits `start`, `update` and `end` events.
     *
     *  @example
     *
     *      var accumulator = new Accumulator(0);
     *
     *      // this gives the total displacement of mouse input
     *      accumulator.subscribe(mouseInput.pluck('delta'));
     *
     *
     * @class Accumulator
     * @extends Streams.Stream
     * @uses Core._OptionsManager
     * @namespace Streams
     * @constructor
     * @param [sum] {Number|Array}    Initial value
     * @param [options] {Object}      Options
     * @param [options.min] {Number}  Set a minimum value
     * @param [options.max] {Number}  Set a maximum value
     */
    function Accumulator(sum, options){
        this.options = OptionsManager.setOptions(this, options);

        if (sum !== undefined) this.set(sum);
        else this.sum = 0;

        Stream.call(this, {
            set: set.bind(this),
            start: start.bind(this),
            update: update.bind(this),
            end: end.bind(this)
        });

        function set(value){
            if (value instanceof Array) {
                if (!this.sum) for (var i = 0; i < value.length; i++) this.sum[i] = 0;

                for (var i = 0; i < value.length; i++)
                    this.sum[i] = clamp(this.sum[i] + value[i], this.options.min, this.options.max);
            }
            else this.sum = clamp(this.sum + value, this.options.min, this.options.max);

            return this.sum;
        }

        function start(value){
            return this.sum;
        }

        function update(delta){
            if (delta instanceof Array){
                for (var i = 0; i < delta.length; i++)
                    this.sum[i] = clamp(this.sum[i] + delta[i], this.options.min, this.options.max);
            }
            else this.sum = clamp(this.sum + delta, this.options.min, this.options.max);

            return this.sum;
        }

        function end(delta){
            // should always be 0
            return update.call(this, delta);
        }
    }

    Accumulator.prototype = Object.create(Stream.prototype);
    Accumulator.prototype.constructor = Accumulator;

    Accumulator.DEFAULT_OPTIONS = {
        min : -Infinity,
        max :  Infinity
    };

    function clamp(value, min, max){
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Set accumulated value.
     *
     * @method set
     * @param sum {Number}              Current value
     */
    Accumulator.prototype.set = function(sum){
        if (sum instanceof Array){
            this.sum = [];
            value = [];
            for (var i = 0; i < sum.length; i++){
                this.sum[i] = clamp(sum[i], this.options.min, this.options.max);
                value[i] = 0;
            }
        }
        else {
            this.sum = clamp(sum, this.options.min, this.options.max);
            value = 0;
        }

        preTickQueue.push(function(){
            this.trigger('set', value);
        }.bind(this));
    };

    /**
     * Returns current accumulated value.
     *
     * @method get
     * @return {Number}
     */
    Accumulator.prototype.get = function(){
        return this.sum;
    };

    module.exports = Accumulator;
});
