/*jslint browser: true, plusplus: false, newcap: false, onevar: false  */
/*global window: false, require: false, $: false, Processing: false, console: false */
console.info("eval indexedb.js");
var gsd = gsd ? gsd : {};

gsd.db = gsd.db ? gsd.db : {};
gsd.db.indx = gsd.db.indx ? gsd.db.indx : {};
gsd.db.indx.setupDb = function (event) {
        var req = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription),
            migrations = [
                0, 
                function (req) {
                    /* A fn that make a onsuccess handler, which captures the db from the request */
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;
                        var objectStore = db.createObjectStore(gsd.model.objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
                        objectStore.createIndex("title", "id", { unique: false });
                        migrate(event);//bootstrap next iteration
                    };
                },/* end migration 1 */
                function (req) {
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;
                        gsd.db.indx.writeData(db);
                        migrate(event);//bootstrap next iteration
                    };
                },/* end migration 2 */
                function (req) {
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;

                        var objectStore = db.createObjectStore(gsd.model.contextOSName, {keyPath: 'id', autoIncrement: true}, false);
                        objectStore.createIndex("name", "id", { unique: true });
                        objectStore.add({name: "Work"});
                        objectStore.add({name: "Home"});
                        objectStore.add({name: "Phone"});
                        objectStore.add({name: "Errands"});
                        objectStore.add({name: "Grocery Store"});
                        migrate(event);//bootstrap next iteration
                    };
                },/* end migration 3 */
            ],
            migrate = function (event) {
                // .source IDBFactory, .result IDBDatabase, req.LOADING, req.DONE, req.readyState
                dbVersion = parseInt(req.result.version);
                dbVersion = isNaN(dbVersion) ? 0 : dbVersion;
                //console.info("Database version:", dbVersion);
                if ((dbVersion + 1) < migrations.length) {
                    setVerReq = req.result.setVersion(dbVersion + 1);
                    req.result.onerror = gsd.model.handleError;
                    setVerReq.onsuccess = (migrations[dbVersion + 1])(setVerReq);
                    setVerReq.onerror = gsd.model.handleError;
                    
                }
            },
        setVerReq, dbVersion;
        req.onerror = gsd.model.handleError;
        req.onsuccess = migrate;

}; //end setupDb

gsd.db.indx.writeData = function (db) {
    var transaction = db.transaction([gsd.model.objectStoreName], IDBTransaction.READ_WRITE);
    var addReq;
    transaction.onerror = gsd.model.handleError;
    // Do something when all the data is added to the database.
    transaction.oncomplete = function (event) {
        //console.info("All done writing data!");
    };

    var objectStore = transaction.objectStore(gsd.model.objectStoreName);
    for (var i in gsd.model.initialNextActions) {
        gsd.currentNextAction = gsd.model.initialNextActions[i];
        addReq = objectStore.add(gsd.model.initialNextActions[i]);
        addReq.onsuccess = function (event) {
            // event.target.result == gsd.model.initialNextActions[i].ssn
            //console.info("Done writing ", event.target.result);
            gsd.currentNextAction = event.target.result;
        };
    }
}; //end function writeData 

/**
 * loadFn is a function that takes to parameters key and value. It 
 * returns a boolean - true to continue reading from the DB.
 * finFn is called when no more data is available.
 */
gsd.db.indx.getAllNextActions = function (loadFn, finFn) {
    var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
    openReq.onerror = gsd.model.handleError;
    openReq.onsuccess = function (event) {
        var db = event.target.result;
        var trans = db.transaction([gsd.model.objectStoreName]);
        var objectStore = trans.objectStore(gsd.model.objectStoreName);
        objectStore.openCursor().onsuccess = function (cursorEvent) {
            var cursor = cursorEvent.target.result;
            if (cursor) {
                if (loadFn(cursor.key, cursor.value)) {
                    cursor.continue();
                }
            } else {
                finFn();
            }
        };
    };
}; // end getAllNextActions
/**
 * loadFn is a function that takes to parameters key and value. It 
 * returns a boolean - true to continue reading from the DB.
 * finFn is called when no more data is available.
 */
 gsd.db.indx.getAllContexts = function (loadFn, finFn) {
     /* TODO aok if this really works this way, abstract */
     var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
     openReq.onerror = gsd.model.handleError;
     openReq.onsuccess = function (event) {
         var db = event.target.result;
         var trans = db.transaction([gsd.model.contextOSName]);
         var objectStore = trans.objectStore(gsd.model.contextOSName);
         objectStore.openCursor().onsuccess = function (cursorEvent) {
             var cursor = cursorEvent.target.result;
             if (cursor) {
                 // TODO gsd.db.indx.getAllContexts["" + cursor.key] = cursor.value;
                 if (loadFn(cursor.key, cursor.value)) {
                     cursor.continue();
                 }
             } else {
                 finFn();
             }
         };
     };
 }; // end getAllContexts


gsd.db.indx.getContextById = function (id, loadFn) {
    console.info("getContextById ", id);
    var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
     openReq.onerror = gsd.model.handleError;
     openReq.onsuccess = function (event) {
         var db = event.target.result;
         var trans = db.transaction([gsd.model.contextOSName]);
         var objectStore = trans.objectStore(gsd.model.contextOSName);
         var getReq = objectStore.get(id);
         getReq.onerror = function () {
                 console.error("Couldn't GET ", id);
         };
         trans.oncomplete = function () {
             console.info("Complete GET ", id);
         };
         getReq.onsuccess = function (cursorEvent) {
             console.info("Get success ", id, " ", cursorEvent.target);
             var context = cursorEvent.target.result;
             console.info("context", context);
             loadFn(context);
         };
     };
};