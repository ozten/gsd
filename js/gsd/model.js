console.info("eval model");
var gsd = gsd ? gsd : {};
gsd.model = gsd.model ? gsd.model : {};

gsd.model.init = function () {};

gsd.model.initialNextActions = [
    { 
      title: 'Welcome to Idea Catcher',
      content: 'Idea Catcher is a quick notebook for ideas and TODOs'
      }
    ];

/* context on next action is now an DB ID and not the name of that item!!! */

gsd.model.init();