/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */

$(document).ready(function(){
    var dbName = "IdeaCatcherDBv13";
    var dbDescription = "All your ideas are belong to us.";
    var objectStoreName = "ideas";
    var contextOSName = "contexts";

    var currentNextAction = null; /* TODO this is actually bad, umhkay. Fresh dbName to repro crash */

    var currentContext = "@?";
    var usedContexts = [];

    var handleError = function(event) {
        // Do something with request.errorCode!
        console.info("ERROR handler");
        console.info("ERROR: #", event.target.errorCode);
    };
    var setupDb = function (event) {
        var req = window.indexedDB.open(dbName, dbDescription),
            migrations = [
                0, 
                function (req) {
                    /* A fn that make a onsuccess handler, which captures the db from the request */
                    return function(event) {
                        var trans = req.result;
                        var db = trans.db;
                        objectStore = db.createObjectStore(objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
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
                console.info("Database version:", dbVersion);
                if ((dbVersion + 1) < migrations.length) {
                    setVerReq = req.result.setVersion(dbVersion + 1);
                    req.result.onerror = handleError;
                    setVerReq.onsuccess = (migrations[dbVersion + 1])(setVerReq);
                    setVerReq.onerror = handleError;
                    
                }
            },
        setVerReq, dbVersion;
        req.onerror = handleError;
        req.onsuccess = migrate;

    };//end setupDb
    var writeData = function (db) {
        var transaction = db.transaction([objectStoreName], IDBTransaction.READ_WRITE);
        var addReq;
        transaction.onerror = handleError;
        // Do something when all the data is added to the database.
        transaction.oncomplete = function(event) {
            console.info("All done writing data!");
        };

        var objectStore = transaction.objectStore(objectStoreName);
        for (var i in initialNextActions) {
            currentNextAction = initialNextActions[i];
            addReq = objectStore.add(initialNextActions[i]);
            addReq.onsuccess = function(event) {
                // event.target.result == initialNextActions[i].ssn
                console.info("Done writing ", event.target.result);
                currentNextAction = event.target.result;
            };
        }
    }; //end function writeData 
    var createNextAction = function (successFn) {
        var next_action = {title: '', content: ''}
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.info("create next_action complete");
            };

            var objectStore = transaction.objectStore(objectStoreName);

            addReq = objectStore.add(next_action);
            addReq.onsuccess = function(event) {
                next_action.id = event.target.result;
                successFn(next_action);
                console.info("Update successeded ", event.target.result);
                console.info("Next_Action now looks like", next_action);
            };

        };
        return next_action;
    } // end createNextAction
    var nextActionIDFromDOM = function (domID) {
        if ('string' == typeof domID && domID.length > 2) {
            return domID.substring(2);
        } else if ('number' == typeof domID) {
            return domID;
        } else {
            console.info("ASSERTION FAILED... nextActionIDFromDOM given ", domID);
        }            
    };// end nextActionIDFromDOM
    var updateNextAction = function (domID, next_action) {
        var id = nextActionIDFromDOM(domID);
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.info("Update ", id, " complete");
            };

            var objectStore = transaction.objectStore(objectStoreName);

            addReq = objectStore.put(next_action);
            addReq.onsuccess = function(event) {
                // event.target.result == initialNextActions[i].ssn
                console.info("Update successeded ", event.target.result);
            };

        };
    }; //end updateNextAction
    var getNextAction = function (domID, fn) {
        var id = nextActionIDFromDOM(domID);
        console.info("getNextAction (", id, ")");
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([objectStoreName]);
            var objectStore = transaction.objectStore(objectStoreName);
            var getReq = objectStore.get(id);
            getReq.onerror = handleError;
            getReq.onsuccess = function(event) {
                fn(event.target.result);
            };
        };
    }; //end function getNextAction
    var deleteNextAction = function (domID, successFn) {
        var id = nextActionIDFromDOM(domID);
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.info("Delete ", id, " complete");
            };

            var objectStore = transaction.objectStore(objectStoreName);
            for (var el in objectStore) {
                console.info(el + " in " + objectStore[el]);
            }            
            addReq = objectStore.delete(id); /* remove in spec */
            addReq.onsuccess = successFn;
        };
    }; //end deleteNextAction
    /**
     * loadFn is a function that takes to parameters key and value. It 
     * returns a boolean - true to continue reading from the DB.
     * finFn is called when no more data is available.
     */
    var getAllNextActions = function (loadFn, finFn) {
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = event.target.result;
            var trans = db.transaction([objectStoreName]);
            var objectStore = trans.objectStore(objectStoreName);
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
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
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
            console.info("calling idify 1 [", next_action.context, "]");
            var nac = gsd.idify(next_action.context);
            console.info("nac is ", nac, " ", $('li#' + nac).size());
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
            currentNextAction = next_action;
            console.info("New next action is id=na", next_action.id);
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
        console.info("I clicked ", id);
            $(na_li).addClass('current');
            getNextAction($(na_li).attr('id'), function (next_action) {
                    if (next_action) {
                        console.info("Saving next_action as current", next_action);
                        currentNextAction = next_action;
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
            console.info("Delete SUCCESS removing");
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
                currentNextAction.content = $('#display textarea').val();
                currentNextAction.context = $('context-selector').val();
                currentNextAction.title = currentNextAction.content.split('\n')[0];
                $('nav ul li.next-action.current').text(currentNextAction.title);
                timeoutId = null;
                // Use custom events to decouple
                updateNextAction(currentNextAction.id, currentNextAction);
            }, 300);
    };
    var initUI = function () {
        $('#context-selector').bind('change', function () {
            currentNextAction.context = $('#context-selector').val();
            console.info("changed new value=", currentNextAction.context);
            if ("0" == currentNextAction.context) {
                currentNextAction.context = 'unknown-context';
            }
            console.info("normaled to new value=", currentNextAction.context);
            updateNextAction(currentNextAction['id'], currentNextAction);
            moveNALIContext();
        });
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
    };// end initUI
    var moveNALIContext = function () {
        // nav ul li.context for context must already exist!
        // nav ul li.context ul must also already exist!
        var cna = currentNextAction;
        if (cna.context) {        
            console.info("calling idify 2 ", 'li#' + gsd.idify(cna.context) + '.context ul li#na' + cna.id);
            if ($('li#' + gsd.idify(cna.context) + '.context ul li#na' + cna.id).size() > 0) {
                // No Op
                console.info("It's in there");
            } else {
                // Move it 
                console.info("calling idify 3");
                console.info(cna.id);
                console.info("Moving ", 'li#na' + cna.id, " (" + $('li#na' + cna.id).size() + ") into ",
                             'li#' + gsd.idify(cna.context) + '.context ul', " (" + $(gsd.idify(cna.context) + '.context ul').size() +")");
                console.info("calling idify 4");
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
                    var contextPage = gsd.view.ensureContextPage(
                            gsd.idify(value));
                    gsd.view.ensureNextAction(
                            gsd.idify(value), key, value);
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
                    console.info("Loading Context ", key, " ", value.name);
                    usedContexts.push(value);
                    $('#context-selector').append("<option value='" + value.name + "'>" + value.name + "</option>");
                    //JQM
                    var c = $('#unknown-context-item').clone();
                    var cid = gsd.idify(value.name);
                    $('a', c).text("@" + value.name);
                    $('a', c).attr("href", "#" + cid + "-page");
                    $('.ui-li-count', c).text(0);
                    c.attr('id', cid);                    
                    $('#contexts-list').append(c);
                    var cpage = gsd.view.ensureContextPage(cid);
                    $('h2', cpage).text("@" + value.name);
                    return true;
                }, 
                function () {
                    //TODO refresh pages, listitem
                    console.info("Done loading contexts");
                });
        }, 100);
    
});//end document ready