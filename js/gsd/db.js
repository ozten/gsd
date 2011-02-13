console.info("eval db");
var gsd = gsd ? gsd : {};
gsd.db = gsd.db ? gsd.db : {};

gsd.db.init = function () {
        // Switch on Web SQL Database vs IndexedDb
        //document.write('<sc' + 'ript src="js/gsd/db/indexeddb.js"></sc' + 'ript>');
        //TODO work on this... we can't setup and initilaze app until all code has loaded
        //$.getScript('js/gsd/db/indexeddb.js?q=2');
};

gsd.db.setupDb = function () {
    console.info("Calling setup");
    gsd.db.indx.setupDb();
};

gsd.db.getContextById = function (id, loadFn) {
    gsd.db.indx.getContextById(id, loadFn);
};

gsd.db.init();