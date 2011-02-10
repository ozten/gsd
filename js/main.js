/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */

$(document).ready(function(){
    
    var contextOSName = "contexts";

    gsd.currentNextAction = null; /* TODO this is actually bad, umhkay. Fresh gsd.model.dbName to repro crash */

    var setupDb = function (event) {
        var req = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription),
            migrations = [
                0, 
                function (req) {
                    /* A fn that make a onsuccess handler, which captures the db from the request */
                    return function(event) {
                        var trans = req.result;
                        var db = trans.db;
                        objectStore = db.createObjectStore(gsd.model.objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
                        objectStore.createIndex("title", "id", { unique: false });
                        migrate(event);//bootstrap next iteration
                    }
                },/* end migration 1 */
                function (req) {
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;
                        writeData(db);
                        migrate(event);//bootstrap next iteration
                    }
                },/* end migration 2 */
                function (req) {
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;

                        var objectStore = db.createObjectStore(contextOSName, {keyPath: 'id', autoIncrement: true}, false);
                        objectStore.createIndex("name", "id", { unique: true });
                        objectStore.add({name:"Work"});
                        objectStore.add({name:"Home"});
                        objectStore.add({name:"Phone"});
                        objectStore.add({name:"Errands"});
                        objectStore.add({name:"Grocery Store"});
                        migrate(event);//bootstrap next iteration
                    }
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

    };//end setupDb
    var writeData = function (db) {
        var transaction = db.transaction([gsd.model.objectStoreName], IDBTransaction.READ_WRITE);
        var addReq;
        transaction.onerror = gsd.model.handleError;
        // Do something when all the data is added to the database.
        transaction.oncomplete = function(event) {
            //console.info("All done writing data!");
        };

        var objectStore = transaction.objectStore(gsd.model.objectStoreName);
        for (var i in initialNextActions) {
            gsd.currentNextAction = initialNextActions[i];
            addReq = objectStore.add(initialNextActions[i]);
            addReq.onsuccess = function(event) {
                // event.target.result == initialNextActions[i].ssn
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
            var trans = db.transaction([contextOSName]);
            var objectStore = trans.objectStore(contextOSName);
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

    var exportDatabase = function () {
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
    
    var contextUlSelector = function (next_action) {
        if (next_action.context) {            
            //ensure
            //console.info("calling idify 1 [", next_action.context, "]");
            var nac = gsd.idify(next_action.context);
            //console.info("nac is ", nac, " ", $('li#' + nac).size());
            if ($('li#' + nac).size() == 0) {
                // aok nac isn't "safe" id="Grocery Store"...
                // Should we use context.id? or make them safe? boo.
                $('#contexts > ul').append("<li id='" + nac + "' class='context'><div>@" + nac + "</div><ul></ul></li>");
            }
            contextUl = 'li#' + nac + ' ul';
        } else {
            contextUl = 'li#unknown-context ul'
        }
        return contextUl;
    };//end contextUlSelector
    var showNewNextAction = function () {
        var next_action = createNextAction(function (next_action) {
            gsd.currentNextAction = next_action;
            //console.info("New next action is id=na", next_action.id);
            $('li.next-action.current').removeClass('current');
            var contextUl = contextUlSelector(next_action);
            
            $(contextUl).append("<li id=na'" + next_action.id + "' class='next-action current'>" + 
                               next_action.title + "</li>");
            if (next_action.context) {
                $('#context-selector').val(next_action.context);
            } else {
                $('#context-selector').val(0);
            }
            $('#display textarea').val(next_action.content);
            $('#display textarea').focus();
        });
        
    }; //end showNewNextAction

    var showNextAction = function (na_li) {
        $('#display textarea').attr('disabled', 'disabled');
        var id = $(na_li).attr('id');

            $(na_li).addClass('current');
            gsd.model.getNextAction($(na_li).attr('id'), function (next_action) {
                    if (next_action) {
                        //console.info("Saving next_action as current", next_action);
                        gsd.currentNextAction = next_action;
                        if (next_action.context) {
                            $('#context-selector').val(next_action.context);
                        } else {
                            $('#context-selector').val(0);
                        }
                             $('#display textarea').val(next_action.content);
                        $('#display textarea').attr('disabled', null)
                            .focus();
                    } else {
                        console.info("WARNING getNextAction failed... called back with ", next_action, " expected id=", id);
                    }
            });
    };//end showNextAction

    var deleteCurrent = function () {
        var oldLi = $('li.next-action.current');
        oldLi.removeClass('current');
        var id = oldLi.attr('id');
        deleteNextAction(id, function (event) {
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

    var initialNextActions = [
    { 
      title: 'Welcome to Idea Catcher',
      content: 'Idea Catcher is a quick notebook for ideas and TODOs'
      }
    ];

    
    var db;

    if (window.indexedDB) {
        setupDb();

        
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
        $('#delete-next-action').bind('click', function (event) {
            var next = $('li.next-action.current').next();
            var prev = $('li.next-action.current').prev();
            console.info("NEXT = ", next.attr('id'), " ", next.text(),
                         " PREV = ", prev.attr('id'), " ", prev.text());
            deleteCurrent();
            if (next.attr('id')) {
                showNextAction(next.get(0));
            } else if (prev.attr('id')) {
                showNextAction(prev.get(0));
            } else {
                showNewNextAction();
            }
            return false;
        });
        $('button#new_next_action').bind('click', function (event) {
            showNewNextAction();
        });
        $('button#export_db').bind('click', function (event) {
            exportDatabase();
        });
        $('li.next-action').live('click', function (event) {
            $('nav ul li.next-action.current').removeClass('current');
            showNextAction(event.target);
        });
        $('.na-edit').live('click', function (e) {
            e.preventDefault();
            var id = parseInt($(this).parents('.next-action').attr('data-na-id'));
            $(this).trigger('start-edit-next-action', [id]);
            return false;
        });
    };// end initUI
    var moveNALIContext = function () {
        // nav ul li.context for context must already exist!
        // nav ul li.context ul must also already exist!
        var cna = gsd.currentNextAction;
        if (cna.context) {        
            if ($('li#' + gsd.idify(cna.context) + '.context ul li#na' + cna.id).size() > 0) {
                // No Op
            } else {
                // Move it 
                $('li#' + gsd.idify(cna.context) + '.context ul').append(
                                                                     $('li#na' + cna.id).remove());

            }
        } else {
            console.info("ASSERTION FAILED cna.context undefined, but moveNALIContext called [", cna.context, "]");
        }
    }//end moveNALIContext
    setTimeout(function () {    
            $('li.next-action').remove();
            initUI();
            $('li#unknown-context').append("<ul></ul>");
            getAllNextActions(
                function (key, value) {
                    //JQM
                    var cid = gsd.idify(value.context);
                    gsd.view.ensureContextListItem(cid, value.context);
                    var contextPage = gsd.view.ensureContextPage(cid, value.context);
                    gsd.view.ensureNextAction(cid, key, value);
                    /*
                    var contextUl = contextUlSelector(value);
                    console.info("contextUl = ", contextUl);
                    $(contextUl).append("<li class='next-action' id='na" + key + "'>" + value.title + "</li>");
                    if ($('#display').hasClass('loading')) {
                        var d = $('#display');
                        d.removeClass('loading');
                        $('span', d).hide();
                        $('textarea').val(value.content);
                        if (value.context) {
                            $('#context-selector').val(value.context);

                        } else {
                            $('#context-selector').val(0);
                        }
                        $('nav ul li.next-action:last-child').addClass('current');
                        currentNextAction = value;
                    }
                    */
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
                    var cid = gsd.idify(value.name);
                    gsd.view.ensureContextListItem(cid, value.name);
                    //TODO switch to value.id
                    gsd.view.ensureContextPage(cid, value.name);                    
                    return true;
                }, 
                function () {
                    //console.info("Done loading contexts");
                });
        }, 100);
    //TODO get ride of globals
    
});//end document ready