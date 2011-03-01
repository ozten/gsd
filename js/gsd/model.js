/*jslint browser: true, plusplus: false */
/*global window: false, document: false, $: false, console: false */

var gsd = gsd ? gsd : {};
gsd.model = gsd.model ? gsd.model : {};

gsd.model.init = function () {};

gsd.model.initialNextActions = [
    { 
        title: 'Play with GSD',
        content: 'Play with GSD\nThis is a Next Action.\nThat is like a TODO list item.\nIt is the in @? Context.\nYou can click the done Arrow... or add more actions!'
    }
];
gsd.model.initialContexts = ["Work", "Home", "Phone", "Errands", "Grocery Store"];
gsd.model.init();