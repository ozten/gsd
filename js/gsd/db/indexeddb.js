/* jslint browser: true, plusplus: false, newcap: false, onevar: false  */
/*global window: false, require: false, $: false, Processing: false, console: false, IDBTransaction: false */
/* IndexedDb uses continue and Fx4 uses delete as function names... yay for reserved words and jslint */
var gsd = gsd ? gsd : {};
(function () {
// private functions
var _db,
    _getAll,
    nextActionOS,
    contextOS;

nextActionOS = "next_actions";
contextOS = "contexts";

gsd.db = gsd.db ? gsd.db : {};
gsd.db.indx = gsd.db.indx ? gsd.db.indx : {};

gsd.db.indx.dbName = "GettingShitDone";
gsd.db.indx.dbDescription = "A simple GTD Todo list.";

gsd.db.indx.handleError = function (event) {
    if (window.console && window.console.info) {
        console.info("ERROR handler");
        console.info("ERROR: #", event.target.errorCode);
    }
};

gsd.db.indx.setupDb = function (completeFn) {
        var req = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription),
            setVerReq, dbVersion,            
            migrate,
            /* I took a stab at a DB Migrations coding pattern.
               You just keep adding functions to this list.
            */
            migrations = [
                0, 
                function (req) {
                    /* A fn that make a onsuccess handler, which captures the db from the request */
                    return function (event) {
                        var trans = req.result,
                            db = trans.db,
                            objectStore = db.createObjectStore(nextActionOS, {keyPath: 'id', autoIncrement: true}, false);

                        objectStore.createIndex("title", "id", { unique: false });
                        migrate(event);//bootstrap next iteration
                    };
                },/* end migration 1 */
                function (req) {
                    return function (event) {
                        var trans = req.result,
                            db = trans.db;
                        gsd.db.indx.writeData(db);
                        migrate(event);//bootstrap next iteration
                    };
                },/* end migration 2 */
                function (req) {
                    return function (event) {
                        var trans = req.result,
                            db = trans.db,
                            objectStore = db.createObjectStore(contextOS, {keyPath: 'id', autoIncrement: true}, false);

                        objectStore.createIndex("name", "id", { unique: true });
                        objectStore.add({name: "Work"});
                        objectStore.add({name: "Home"});
                        objectStore.add({name: "Phone"});
                        objectStore.add({name: "Errands"});
                        objectStore.add({name: "Grocery Store"});
                        migrate(event);//bootstrap next iteration
                    };
                }, /* end migration 3 */
            ];
        /* The migration runner */
        migrate = function (event) {
                dbVersion = parseInt(req.result.version, 10);
                dbVersion = isNaN(dbVersion) ? 0 : dbVersion;
                if ((dbVersion + 1) < migrations.length) {
                    setVerReq = req.result.setVersion(dbVersion + 1);
                    req.result.onerror = gsd.db.indx.handleError;
                    setVerReq.onsuccess = (migrations[dbVersion + 1])(setVerReq);
                    setVerReq.onerror = gsd.db.indx.handleError;                    
                } else {
                    completeFn();
                }
            };
        req.onerror = gsd.db.indx.handleError;
        req.onsuccess = migrate;
    }; //end setupDb

gsd.db.indx.writeData = function (db) {
    var transaction = db.transaction([nextActionOS], IDBTransaction.READ_WRITE),
        addReq,
        addReqSuccess = function (event) {
            gsd.currentNextAction = event.target.result;
        },
        i,
        objectStore;

    transaction.onerror = gsd.db.indx.handleError;
    // Do something when all the data is added to the database.
    transaction.oncomplete = function (event) {
        //console.info("All done writing data!");
    };

    objectStore = transaction.objectStore(nextActionOS);
    
    for (i = 0; i < gsd.model.initialNextActions.length; i++) {
        gsd.currentNextAction = gsd.model.initialNextActions[i];
        addReq = objectStore.add(gsd.model.initialNextActions[i]);
        addReq.onsuccess = addReqSuccess;
    }
}; //end function writeData 

gsd.db.indx.createNextAction = function (successFn) {
        var next_action = {title: '', content: '', 
                           context: gsd.cont.currentContext.id};
        _db(nextActionOS, 'add', [next_action], function (event) {
                next_action.id = event.target.result;
                successFn(next_action);
            }, true);        
        return next_action;
    }; // end createNextAction

gsd.db.indx.getNextAction = function (id, fn) {
    _db(nextActionOS, 'get', [id], function (event) {
            fn(event.target.result);
        });    
}; //end function getNextAction

gsd.db.indx.updateNextAction = function (id, next_action, successFn) {
    _db(nextActionOS, 'put', [next_action], function (event) {
            successFn(event.target.result);
        }, true);
    }; //end updateNextAction

gsd.db.indx.deleteNextAction = function (id, successFn) {
    // delete is removed from the spec, Fx 4 only?
    _db(nextActionOS, 'delete', [id], successFn, true);
}; //end deleteNextAction

/**
 * loadFn is a function that takes to parameters key and value. It 
 * returns a boolean - true to continue reading from the DB.
 * finFn is called when no more data is available.
 */
gsd.db.indx.getAllNextActions = function (loadFn, finFn) {
    _getAll(nextActionOS, loadFn, finFn);
}; // end getAllNextActions

/**
 * loadFn is a function that takes to parameters key and value. It 
 * returns a boolean - true to continue reading from the DB.
 * finFn is called when no more data is available.
 */
gsd.db.indx.getAllContexts = function (loadFn, finFn) {
    _getAll(contextOS, loadFn, finFn);
}; // end getAllContexts

_db = function (objectStoreName, objectStoreFn, objectStoreArgs, objectStoreFnSuccess, writeMode) {
    var openReq = window.indexedDB.open(gsd.db.indx.dbName, gsd.db.indx.dbDescription),
        mode = IDBTransaction.READ_ONLY;
    if (writeMode === true) {
        mode = IDBTransaction.READ_WRITE;
    }
    openReq.onerror = gsd.db.indx.handleError;
    openReq.onsuccess = function (event) {
        var db = event.target.result,
        trans = db.transaction([objectStoreName], mode),
            objectStore = trans.objectStore(objectStoreName),
            fn,
            openCursorResp;

        with (objectStore) {
            if ('delete' === objectStoreFn) {
                // Fx 4 parser will die on 'delete' with a syntax error
                openCursorResp = objectStore.delete(objectStoreArgs[0]);
            } else {
                fn = eval(objectStoreFn);
                openCursorResp = fn.apply(objectStore, objectStoreArgs);
            }
            
            openCursorResp.onsuccess = objectStoreFnSuccess;
        }        
    };
}; // _db

_getAll = function (objectStoreName, loadFn, finFn) {
    _db(objectStoreName, 'openCursor', [], function (cursorEvent) {
            var cursor = cursorEvent.target.result;
            if (cursor) {
                if (loadFn(cursor.key, cursor.value)) {
                    cursor.continue();
                }
            } else {
                finFn();
            }
        });
}; // _getAll

gsd.db.indx.getContextById = function (id, loadFn) {
    _db(contextOS, 'get', [id], function (cursorEvent) {
            var context = cursorEvent.target.result;
            loadFn(context);
        });    
};

gsd.db.driver = gsd.db.indx; // Register as driver
})();