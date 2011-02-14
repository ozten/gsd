/*jslint browser: true, plusplus: false, newcap: false, onevar: false  */
/*global window: false, require: false, $: false, Processing: false, console: false */
console.info("eval indexedb.js");
var gsd = gsd ? gsd : {};

gsd.db = gsd.db ? gsd.db : {};
gsd.db.indx = gsd.db.indx ? gsd.db.indx : {};


gsd.db.indx.dbName = "IdeaCatcherDBv13";
gsd.db.indx.dbDescription = "All your ideas are belong to us.";
gsd.db.indx.objectStoreName = "ideas";
gsd.db.indx.contextOSName = "contexts";
gsd.db.indx.handleError = function(event) {
        // Do something with request.errorCode!
        console.info("ERROR handler");
        console.info("ERROR: #", event.target.errorCode);
};


gsd.db.indx.setupDb = function (event) {
        var req = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription),
            migrations = [
                0, 
                function (req) {
                    /* A fn that make a onsuccess handler, which captures the db from the request */
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;
                        var objectStore = db.createObjectStore(gsd.db.indx.objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
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

                        var objectStore = db.createObjectStore(gsd.db.indx.contextOSName, {keyPath: 'id', autoIncrement: true}, false);
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
                    req.result.onerror = gsd.db.indx.handleError;
                    setVerReq.onsuccess = (migrations[dbVersion + 1])(setVerReq);
                    setVerReq.onerror = gsd.db.indx.handleError;
                    
                }
            },
        setVerReq, dbVersion;
        req.onerror = gsd.db.indx.handleError;
        req.onsuccess = migrate;

}; //end setupDb

gsd.db.indx.writeData = function (db) {
    var transaction = db.transaction([gsd.db.indx.objectStoreName], IDBTransaction.READ_WRITE);
    var addReq;
    transaction.onerror = gsd.db.indx.handleError;
    // Do something when all the data is added to the database.
    transaction.oncomplete = function (event) {
        //console.info("All done writing data!");
    };

    var objectStore = transaction.objectStore(gsd.db.indx.objectStoreName);
    for (var i in gsd.model.initialNextActions) {
        gsd.currentNextAction = gsd.model.initialNextActions[i];
        addReq = objectStore.add(gsd.model.initialNextActions[i]);
        addReq.onsuccess = function (event) {
            // event.target.result == gsd.db.indx.initialNextActions[i].ssn
            //console.info("Done writing ", event.target.result);
            gsd.currentNextAction = event.target.result;
        };
    }
}; //end function writeData 


gsd.db.indx.createNextAction = function (successFn) {
        var next_action = {title: '', content: '', 
                           context: gsd.cont.currentContext.id};
        console.info("Creating new na with context.id=", gsd.cont.currentContext.id);
        var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
        openReq.onerror = gsd.db.indx.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.db.indx.objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = gsd.db.indx.handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                //console.info("create next_action complete");
            };

            var objectStore = transaction.objectStore(gsd.db.indx.objectStoreName);

            addReq = objectStore.add(next_action);
            addReq.onsuccess = function(event) {
                next_action.id = event.target.result;
                successFn(next_action);
                //console.info("Update successeded ", event.target.result);
                //console.info("Next_Action now looks like", next_action);
            };

        };
        return next_action;
}; // end createNextAction
gsd.db.indx.getNextAction = function (id, fn) {
    console.info('getNextAction domid=', id);
    //var id = gsd.view.nextActionIDFromDOM(id);
        var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
        openReq.onerror = gsd.db.indx.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.db.indx.objectStoreName]);
            var objectStore = transaction.objectStore(gsd.db.indx.objectStoreName);
            var getReq = objectStore.get(id);
            getReq.onerror = gsd.db.indx.handleError;
            getReq.onsuccess = function(event) {
                fn(event.target.result);
            };
        };
}; //end function getNextAction

gsd.db.indx.updateNextAction = function (id, next_action, successFn) {
    console.info('updateNextAction domid=', id, 'na id=', next_action.id, ' context=', next_action.context);
    //var id = gsd.view.nextActionIDFromDOM(domID);
        var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
        console.info('updateNextAction derived id=', id);

        openReq.onerror = gsd.db.indx.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.db.indx.objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = gsd.db.indx.handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.info("Update ", id, " complete");
            };

            var objectStore = transaction.objectStore(gsd.db.indx.objectStoreName);

            addReq = objectStore.put(next_action);
            addReq.onsuccess = function(event) {
                // event.target.result == initialNextActions[i].ssn
                successFn(event.target.result);
            };

        };
}; //end updateNextAction
gsd.db.indx.deleteNextAction = function (id, successFn) {
        console.info('deleteNextAction domid=', id);
        //var id = gsd.view.nextActionIDFromDOM(domID);
        var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
        console.info('deleteNextAction derived id=', id);
        openReq.onerror = gsd.db.indx.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.db.indx.objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = gsd.db.indx.handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                //console.info("Delete ", id, " complete");
            };

            var objectStore = transaction.objectStore(gsd.db.indx.objectStoreName);
            addReq = objectStore.delete(id); /* remove in spec */
            addReq.onsuccess = successFn;
        };
}; //end deleteNextAction


/**
 * loadFn is a function that takes to parameters key and value. It 
 * returns a boolean - true to continue reading from the DB.
 * finFn is called when no more data is available.
 */
gsd.db.indx.getAllNextActions = function (loadFn, finFn) {
    var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
    openReq.onerror = gsd.db.indx.handleError;
    openReq.onsuccess = function (event) {
        var db = event.target.result;
        var trans = db.transaction([gsd.db.indx.objectStoreName]);
        var objectStore = trans.objectStore(gsd.db.indx.objectStoreName);
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
     var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
     openReq.onerror = gsd.db.indx.handleError;
     openReq.onsuccess = function (event) {
         var db = event.target.result;
         var trans = db.transaction([gsd.db.indx.contextOSName]);
         var objectStore = trans.objectStore(gsd.db.indx.contextOSName);
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
    var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription);
     openReq.onerror = gsd.db.indx.handleError;
     openReq.onsuccess = function (event) {
         var db = event.target.result;
         var trans = db.transaction([gsd.db.indx.contextOSName]);
         var objectStore = trans.objectStore(gsd.db.indx.contextOSName);
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

gsd.db.driver = gsd.db.indx; // Register as driver