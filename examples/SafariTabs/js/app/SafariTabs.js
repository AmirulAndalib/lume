define(function (require, exports, module) {
    var View = require('samsara/core/View');
    var Surface = require('samsara/dom/Surface');
    var Scrollview = require('samsara/layouts/Scrollview');
    var TabContainer = require('./TabContainer');

    // A `Scrollview` consisting of tabs. Tabs can be selected
    // by clicking on them, bringing them to fullscreen, or removed
    // from the scrollview by clicking their close button.
    // The resizing of the scrollview as tabs are made fullscreen or removed
    // is handled automatically by animating the tabs' size streams.
    var SafariTabs = View.extend({
        defaults: {
            tabData : [],
            tab : {
                titleHeight: 26,
                angle: -Math.PI / 5,
                spacing: 150,
                height: 700
            },
            selectTransition: {duration: 200},
            deselectTransition: {duration: 200}
        },
        initialize: function (options) {
            // Create the scrollview
            var scrollview = new Scrollview({
                direction: Scrollview.DIRECTION.Y,
                clip : false,  // do not set {overflow:hidden} in CSS
                marginBottom: 200 // leaves 200px of space at the bottom of the scrollview
            });

            // Create the tabs
            var tabs = [];
            for (var i = 0; i < options.tabData.length; i++) {
                var tab = new TabContainer({
                    src: options.tabData[i].src,
                    title: options.tabData[i].title,
                    index: i,
                    titleHeight: options.tab.titleHeight,
                    angle: options.tab.angle,
                    spacing : options.tab.spacing,
                    height : options.tab.height,
                    selectTransition : options.selectTransition,
                    deselectTransition: options.deselectTransition
                });

                // Tabs must listen to the scrollview to create a
                // `receding` effect as the scrollview is scrolled.
                tab.subscribe(scrollview);

                // The scrollview listens to the `goto` event from the tabs
                // to animate the scrollview to the currently selected tab
                scrollview.subscribe(tab);

                tabs.push(tab);
            }

            // Add the tabs to the scrollview
            scrollview.addItems(tabs);

            // Animate the scrollview to the currently selected tab when a
            // tab is clicked
            scrollview.input.on('goto', function (index) {
                scrollview.goTo(index, options.selectTransition);
            });

            // Build the render subtree consisting of only the scrollview
            this.add(scrollview);
        }
    });

    module.exports = SafariTabs;
});
