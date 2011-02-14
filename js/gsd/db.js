console.info("eval db");
var gsd = gsd ? gsd : {};
gsd.db = gsd.db ? gsd.db : {};
gsd.db.driver = null;
gsd.db.init = function () {

    if ("webkitIndexedDB" in window) {
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
    } // if window.indexedDB

    if (! gsd.db.driver) {
        alert("You're browser aint gonna work.");
    }

};

gsd.db.setupDb = function () {
    console.info("Calling setup");
    gsd.db.driver.setupDb();
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

/**
 * Read a context by it's id. loadFn will be called
 * with the context
 */
gsd.db.getContextById = function (id, loadFn) {
    gsd.db.driver.getContextById(id, loadFn);
};

gsd.db.init();