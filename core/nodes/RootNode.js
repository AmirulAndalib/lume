/* Copyright © 2015 David Valdman */

define(function(require, exports, module) {
    var SceneGraphNode = require('samsara/core/nodes/SceneGraphNode');

    function RootNode() {
        SceneGraphNode.call(this);

        this.root = this;
        this.specs = {};
        this.objects = {};

        this.dirtyObjects = [];
    }

    RootNode.prototype = Object.create(SceneGraphNode.prototype);
    RootNode.prototype.constructor = RootNode;

    RootNode.prototype.commit = function commit(allocator){
        var objects = this.objects;
        var specs = this.specs;

        for (var key in objects)
            objects[key].commit(specs[key], allocator);

        while (this.dirtyObjects.length)
            this.dirtyObjects.pop().commit(null, allocator);
    };

    module.exports = RootNode;
});
