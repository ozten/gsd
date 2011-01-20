/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */

$(document).ready(function(){
    var dbName = "IdeaCatcherDBv13";
    var dbDescription = "All your ideas are belong to us.";
    var objectStoreName = "ideas";

    var currentMeme = null;

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
                    console.info("Manufacturing fn which closes over ", req);
                    return function(event) {
                        var trans = req.result;
                        console.info("Creating object store", objectStoreName, "having opened", dbName, " db=", trans.db);
                        var db = trans.db;
                        objectStore = db.createObjectStore(objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
                        objectStore.createIndex("title", "id", { unique: false });
                        console.info("Finished Creating object store");
                        migrate(event);//bootstrap next iteration
                    }
                },
                function (req) {
                    console.info("Manufacturing 2nd fn which closes over ", req);
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;
                        console.info("writing data to db=", db);
                        writeData(db);
                    }
                },
            ],
            migrate = function (event) {
                // .source IDBFactory, .result IDBDatabase, req.LOADING, req.DONE, req.readyState
                dbVersion = parseInt(req.result.version);
                dbVersion = isNaN(dbVersion) ? 0 : dbVersion;
                console.info("DB Version is ", dbVersion, " we know about ", migrations.length - 1 );
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
        for (var i in firstIdeas) {
            addReq = objectStore.add(firstIdeas[i]);
            addReq.onsuccess = function(event) {
                // event.target.result == firstIdeas[i].ssn
                console.info("Done writing ", event.target.result);
            };
        }
    }; //end function writeData 
    var updateMeme = function (id, meme) {
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
            for (var i in firstIdeas) {
                addReq = objectStore.put(meme);
                addReq.onsuccess = function(event) {
                    // event.target.result == firstIdeas[i].ssn
                    console.info("success ", event.target.result);
                };
            }
        };
    }; //end updateMeme

    /**
     * loadFn is a function that takes to parameters key and value. It 
     * returns a boolean - true to continue reading from the DB.
     * finFn is called when no more data is available.
     */
    var getAllMemes = function (loadFn, finFn) {
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            console.info(event.target.result);
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
    }

    $('nav ul li').text('Ok');

    if ("webkitIndexedDB" in window) {
        window.indexedDB = window.webkitIndexedDB;
        window.IDBTransaction = window.webkitIDBTransaction;
        window.IDBKeyRange = window.webkitIDBKeyRange;
    } else if ("mozIndexedDB" in window) {
        window.indexedDB = window.mozIndexedDB;
    } else {
        alert("You're browser aint gonna work.");
    }

    var firstIdeas = [
    { 
        /*id: 10,  */
      title: 'Welcome to Idea Catcher',
      content: 'Idea Catcher is a quick notebook for ideas and TODOs'
      }
    ];

    
    var db;

    if (window.indexedDB) {
        setupDb();

        setTimeout(function () {
            window.readOpenRequest = window.indexedDB.open(dbName, dbDescription);
            window.readOpenRequest.onerror = handleError;
        
    var getAllData = function (db) {
        console.info("Reading ", objectStoreName);
        var transaction = db.transaction([objectStoreName]);
        var objectStore = transaction.objectStore(objectStoreName);
        var request3 = objectStore.getAll();
        request3.onerror = handleError;
        request3.onsuccess = function(event) {
            //This is being affected by earlier calls...
            console.info("hmm", request3.result);
          // Do something with the request.result!
            for (var i=0; i < request3.result.length; i++) {
                for (var e in request3.result[i]) {
                    console.info("Got back ", e, '=', request3.result[i][e]);
                }
            }
        };
    }; //end function getAllData


    var handleDbOpen = function (event) {
        var db = window.readOpenRequest.result;
        console.info("size of object stores: ", db.objectStoreNames.length);
        for (var i=0; i < db.objectStoreNames.length; i++) {
            console.info("OBJECT STORE: ", db.objectStoreNames[i]);
        }
        for (var l in db) {
            //            console.info("hmm ", l, "=", db[l]);
        }
        db.onerror = handleError; //TODO remove other error handlers

                   getAllData(db);
        
               }; //end handleDbOpen
               window.readOpenRequest.onsuccess = handleDbOpen;
            }, 3000);//end setTimeout
    } // if window.indexedDB
    var timeoutId = null;
    var saveCurrent = function () {
        if (timeoutId != null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(function () {
                currentMeme.content = $('#display textarea').val();
                currentMeme.title = currentMeme.content.split('\n')[0];
                $('nav ul li.current').text(currentMeme.title);
                timeoutId = null;
                updateMeme(currentMeme['id'], currentMeme);
            }, 300);
    }
    var initUI = function () {
        $('#display textarea').bind('change, keyup', function (event) {
            console.info("Make that change");
            saveCurrent();
        });
    };
    setTimeout(function () {    
            $('nav ul li').remove();
            initUI();
            getAllMemes(
                function (key, value) {
                    var s = "";
                    for (var e in value) {
                        s += e + " " + value[e] + " ";
                    }
                    $('nav ul').append("<li id='" + key + "'>" + value.title + "</li>");
                    if ($('#display').hasClass('loading')) {
                        var d = $('#display');
                        d.removeClass('loading');
                        $('span', d).hide();
                        $('textarea').val(value.content);
                        $('nav ul li:last-child').addClass('current');
                        currentMeme = value;
                    }
                }, 
                function () {
                    console.info("Done");
                }); 
        }, 100);
    
});//end document ready

            /* 
    var initDb = function(db) {
        console.warn("No version, creating one");
            var request2 = db.setVersion('1');
            request2.onerror = handleError;
            request2.onsuccess = function(event) {
                objectStore = db.createObjectStore(objectStoreName, {keyPath: 'id', autoIncrement: true}, false);

               //{keyPath: 'id'}, true - value objects must have an id property 
               //{keyPath: 'id', autoIncrement: true}, true - value object shouldn't have an id property, if it does, then the value object's id overrides the generator


                //autoIncrement: true - IndexedDB handles key generation
                objectStore.createIndex("title", "id", { unique: false });
                console.info("Object store created", objectStore);
            }
    };
*/

/*
    var getOneRecord = function (db, id) {
        var transaction = db.transaction([objectStoreName]);
        var objectStore = transaction.objectStore(objectStoreName);
        window.request = objectStore.get(id);
        window.request.onerror = handleError;
        window.request.onsuccess = function(event) {
          // Do something with the request.result!
          console.info("Name for ", id, " is " + window.request.result.title);
console.info("Name for ", id, " is " + window.request.result.content);
        };
    }; //end function getOneRecord
        */

    var deleteData = function (db) {
//delete
        var request = db.transaction([objectStoreName], IDBTransaction.READ_WRITE)
                    .objectStore(objectStoreName)
                    .delete("444-44-4448");
        request.onsuccess = function(event) {
          console.info("Delete 444-44-4448, It's gone!");
        };


        var request = db.transaction([objectStoreName], IDBTransaction.READ_WRITE)
                        .objectStore(objectStoreName)
                        .delete("555-55-5559");
        request.onsuccess = function(event) {
            console.info("Delete 555-55-5559, It's gone!");
        };
    }; //end function deleteData