var gsd = gsd ? gsd : {};
gsd.db = gsd.db ? gsd.db : {};
gsd.db.driver = null;

gsd.db.dbName = "GettingShitDone";
gsd.db.dbDescription = "A simple web app for Getting Things Done.";

gsd.db.init = function () {

    if ("webkitIndexedDB" in window && 
        window.navigator.userAgent.indexOf("Chrome") < 0 ) {
        // Chrome 10 has IndexedDB, but it's different than
        // Fx 4... Until we add support, let's fallback to sqlite

        window.indexedDB = window.webkitIndexedDB;
        window.IDBTransaction = window.webkitIDBTransaction;
        window.IDBKeyRange = window.webkitIDBKeyRange;
    } else if ("mozIndexedDB" in window) {
        window.indexedDB = window.mozIndexedDB;
    } 
    
    if (window.indexedDB) {
        // Switch on Web SQL Database vs IndexedDb
        document.write('<sc' + 'ript src="js/gsd/db/indexeddb.js"></sc' + 'ript>');
        gsd.db.driver = true; // will be replaced with module once it loads
        //TODO work on this... we can't setup and initilaze app until all code has loaded        
        //$.getScript('js/gsd/db/indexeddb.js?q=2');
    } else if (window.openDatabase) {
        document.write('<sc' + 'ript src="js/gsd/db/sqlite.js"></sc' + 'ript>');
        gsd.db.driver = true; // will be replaced with module once it loads
    }

    if (! gsd.db.driver) {
        $('#no-dice').show();
        $('#contexts-nav').hide();
        $('[data-page-type=context]').hide();
    }

};

gsd.db.setupDb = function (completeFn) {
    if (gsd.db.driver) {
        gsd.db.driver.setupDb(completeFn);
    }
};

/**
 * successFn should take 1 argument - the new next_action
 */
gsd.db.createNextAction = function (successFn) {
    gsd.db.driver.createNextAction(successFn);
};

/**
 * Read a next_action by it's id.
 * loadFn should accept 1 argument - the next_action
 */
gsd.db.getNextAction = function (id, loadFn) {
    gsd.db.driver.getNextAction(id, loadFn);
};
/**
 * Update a next_action by it's id and value and a
 * successFn which should accept 1 argument - the updated
 * next_action.
 */
gsd.db.updateNextAction = function (id, next_action, successFn) {
    gsd.db.driver.updateNextAction(id, next_action, successFn);
};
/**
 * Delete a next action by it's id. successFn
 * will be called upon completion of the delete.
 */
gsd.db.deleteNextAction = function (id, successFn) {
    gsd.db.driver.deleteNextAction(id, successFn);
};

gsd.db.getAllNextActions = function (loadFn, finFn) {
    gsd.db.driver.getAllNextActions(loadFn, finFn);
}

/**
 * loadFn is a function that takes to parameters key and value. It 
 * returns a boolean - true to continue reading from the DB.
 * finFn is called when no more data is available.
 */
gsd.db.getAllContexts = function (loadFn, finFn) {
    gsd.db.driver.getAllContexts(loadFn, finFn);
}

/**
 * Read a context by it's id. loadFn will be called
 * with the context
 */
gsd.db.getContextById = function (id, loadFn) {
    gsd.db.driver.getContextById(id, loadFn);
};

gsd.db.init();