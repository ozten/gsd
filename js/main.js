/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */

$(document).ready(function(){
    gsd.currentNextAction = null; /* TODO this is actually bad, umhkay. Fresh gsd.model.dbName to repro crash */

    if ("webkitIndexedDB" in window) {
        window.indexedDB = window.webkitIndexedDB;
        window.IDBTransaction = window.webkitIDBTransaction;
        window.IDBKeyRange = window.webkitIDBKeyRange;
    } else if ("mozIndexedDB" in window) {
        window.indexedDB = window.mozIndexedDB;
    } else {
        alert("You're browser aint gonna work.");
    }
    
    var db;

    if (window.indexedDB) {
        gsd.db.setupDb();
    } // if window.indexedDB

});//end document ready