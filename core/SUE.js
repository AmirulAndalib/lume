/* copyright © 2015 David Valdman */

define(function(require, exports, module) {
    var STATE = {
        NONE : -1,
        START : 0,
        UPDATE : 1,
        END : 2
    };

    currentState = STATE.START;

    function set(state){
        currentState = state;
    }

    function get(){
        return currentState;
    }

    module.exports = {
        STATES : STATE,
        set : set,
        get : get
    };
});