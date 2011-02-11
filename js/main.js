/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */

$(document).ready(function(){
    gsd.currentNextAction = null; /* TODO this is actually bad, umhkay. Fresh gsd.model.dbName to repro crash */
    
    var writeData = function (db) {
        var transaction = db.transaction([gsd.model.objectStoreName], IDBTransaction.READ_WRITE);
        var addReq;
        transaction.onerror = gsd.model.handleError;
        // Do something when all the data is added to the database.
        transaction.oncomplete = function(event) {
            //console.info("All done writing data!");
        };

        var objectStore = transaction.objectStore(gsd.model.objectStoreName);
        for (var i in gsd.model.initialNextActions) {
            gsd.currentNextAction = gsd.model.initialNextActions[i];
            addReq = objectStore.add(gsd.model.initialNextActions[i]);
            addReq.onsuccess = function(event) {
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
    var getAllNextActions = function (loadFn, finFn) {
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
    var getAllContexts = function (loadFn, finFn) {
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
                    if (loadFn(cursor.key, cursor.value)) {
                        cursor.continue();
                    }
                } else {
                    finFn();
                }
            };
        };
    }; // end getAllContexts

    gsd.exportDatabase = function () {
        var actions = [];
        getAllNextActions(            
            function (key, value) {
                actions[actions.length] = value;
                return true;
            }, 
            function () {
                var w = window.open("data:text/json;charset=utf-8," + JSON.stringify(actions));

            });
    }

    var deleteCurrent = function () {
        var oldLi = $('li.next-action.current');
        oldLi.removeClass('current');
        var id = oldLi.attr('id');
        console.info("deleting", id);
        gsd.model.deleteNextAction(id, function (event) {
                //console.info("Delete SUCCESS removing");
            oldLi.remove();
        });
    };//end deleteCurrent

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
    var timeoutId = null;
    var saveCurrent = function () {
        if (timeoutId != null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
                gsd.currentNextAction.content = $('#display textarea').val();
                gsd.currentNextAction.context = $('context-selector').val();
                gsd.currentNextAction.title = gsd.currentNextAction.content.split('\n')[0];
                $('nav ul li.next-action.current').text(gsd.currentNextAction.title);
                timeoutId = null;
                // Use custom events to decouple
                gsd.model.updateNextAction(gsd.currentNextAction.id, gsd.currentNextAction);
            }, 300);
    };
    var initUI = function () {
        
        $('#display textarea').bind('change, keyup', function (event) {
                //console.info("Make that change");
            saveCurrent();
        });

    };// end initUI
    setTimeout(function () {    
            $('li.next-action').remove();
            initUI();
            $('li#ct--1').append("<ul></ul>");
            getAllNextActions(
                function (key, value) {
                    //JQM
                    var cid = gsd.view.context_dom_id(value.context);
                    gsd.view.ensureContextListItem(cid, value.context);
                    var contextPage = gsd.view.ensureContextPage(cid, value.context);
                    gsd.view.ensureNextAction(cid, key, value);
                    return true;
                }, 
                function () {
                    //console.info("Done");
                    $('#loading-next-actions').remove();
                });
            getAllContexts(
                function (key, value) {
                    //console.info("Loading Context ", key, " ", value.name);
                    //TODO use context.id instead of name for value
                    $('#context-selector').append("<option value='" + value.name + "'>" + value.name + "</option>");
                    //JQM
                    var cid = gsd.view.context_dom_id(value.name);
                    gsd.view.ensureContextListItem(cid, value.name);
                    //TODO switch to value.id
                    gsd.view.ensureContextPage(cid, value.name);                    
                    return true;
                }, 
                function () {
                    //console.info("Done loading contexts");
                });
        }, 100);
    
});//end document ready