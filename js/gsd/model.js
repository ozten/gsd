var gsd = gsd ? gsd : {};
gsd.model = gsd.model ? gsd.model : {};

gsd.model.init = function () {};

gsd.model.initialNextActions = [
    { 
      title: 'Plant Kale',
      content: 'Plant Kale\nIn pots near window.'
      }
    ];
gsd.model.initialContexts = ["Work", "Home", "Phone", "Errands", "Grocery Store"];
gsd.model.init();