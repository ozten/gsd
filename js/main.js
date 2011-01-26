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
                    return function(event) {
                        var trans = req.result;
                        var db = trans.db;
                        objectStore = db.createObjectStore(objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
                        objectStore.createIndex("title", "id", { unique: false });
                        migrate(event);//bootstrap next iteration
                    }
                },
                function (req) {
                    return function (event) {
                        var trans = req.result;
                        var db = trans.db;
                        writeData(db);
                    }
                },
            ],
            migrate = function (event) {
                // .source IDBFactory, .result IDBDatabase, req.LOADING, req.DONE, req.readyState
                dbVersion = parseInt(req.result.version);
                dbVersion = isNaN(dbVersion) ? 0 : dbVersion;
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
    var createMeme = function () {
        var meme = {title: '', content: ''}
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.info("create meme complete");
            };

            var objectStore = transaction.objectStore(objectStoreName);
            for (var i in firstIdeas) {
                addReq = objectStore.add(meme);
                addReq.onsuccess = function(event) {
                    // event.target.result == firstIdeas[i].ssn
                    meme.id = event.target.result;
                    console.info("Update successeded ", event.target.result);
                    console.info("Meme now looks like", meme);
                };
            }
        };
        return meme;
    } // end createMeme
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
                    console.info("Update successeded ", event.target.result);
                };
            }
        };
    }; //end updateMeme
    var getMeme = function (id, fn) {
        var openReq = window.indexedDB.open(dbName, dbDescription);
        openReq.onerror = handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([objectStoreName]);
            var objectStore = transaction.objectStore(objectStoreName);
            var getReq = objectStore.get(id);
            getReq.onerror = handleError;
            getReq.onsuccess = function(event) {
                // Do something with the request.result!
                fn(getReq.result);
            };
        };
    }; //end function getMeme
    var deleteMeme = function (id, successFn) {
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
    }; //end deleteMeme
    /**
     * loadFn is a function that takes to parameters key and value. It 
     * returns a boolean - true to continue reading from the DB.
     * finFn is called when no more data is available.
     */
    var getAllMemes = function (loadFn, finFn) {
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
    }; // end getAllMemes

    var showNewMeme = function () {
        var meme = createMeme();
        currentMeme = meme;
        $('nav ul li.current').removeClass('current');
        $('nav ul').append("<li id='" + meme.id + "' class='current'>" + 
                           meme.title + "</li>");
        $('#display textarea').val(meme.content);
        $('#display textarea').focus();
    }; //end showNewMeme

    var showMeme = function (meme_li) {
        $('#display textarea').attr('disabled', 'disabled');
        console.info("I clicked ", $(meme_li).attr('id'));
            $(meme_li).addClass('current');
            getMeme($(meme_li).attr('id'), function (meme) {
                currentMeme = meme;
                $('#display textarea').val(meme.content);
                $('#display textarea').attr('disabled', null)
                    .focus();
            });
    };//end showMeme

    var deleteCurrent = function () {
        var oldLi = $('li.current');
        oldLi.removeClass('current');
        var id = oldLi.attr('id');
        deleteMeme(id, function (event) {
            console.info("Delete SUCCESS removing");
            oldLi.remove();
        });
    };//end deleteCurrent
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
                currentMeme.content = $('#display textarea').val();
                currentMeme.title = currentMeme.content.split('\n')[0];
                $('nav ul li.current').text(currentMeme.title);
                timeoutId = null;
                updateMeme(currentMeme['id'], currentMeme);
            }, 300);
    }
    var initUI = function () {
        $('#display textarea').bind('change, keyup', function (event) {
                //console.info("Make that change");
            saveCurrent();
        });
        $('#delete-meme').bind('click', function (event) {
            var next = $('li.current').next();
            var prev = $('li.current').prev();
            console.info("NEXT = ", next.attr('id'), " ", next.text(),
                         " PREV = ", prev.attr('id'), " ", prev.text());
            deleteCurrent();
            if (next.attr('id')) {
                showMeme(next.get(0));
            } else if (prev.attr('id')) {
                showMeme(prev.get(0));
            } else {
                showNewMeme();
            }
            return false;
        });
        $('button').bind('click', function (event) {
            showNewMeme();
        });
        $('li').live('click', function (event) {
            $('nav ul li.current').removeClass('current');
            showMeme(event.target);
        });
    };// end initUI
    setTimeout(function () {    
            $('nav ul li').remove();
            initUI();
            getAllMemes(
                function (key, value) {
                    console.info("getAllMemes callback");
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
                    return true;
                }, 
                function () {
                    //console.info("Done");
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


/* 
setTimeout(function () {
            window.readOpenRequest = window.indexedDB.open(dbName, dbDescription);
            window.readOpenRequest.onerror = handleError;
        
    var getAllData = function (db) {
        var transaction = db.transaction([objectStoreName]);
        var objectStore = transaction.objectStore(objectStoreName);
        var request3 = objectStore.getAll();
        request3.onerror = handleError;
        request3.onsuccess = function(event) {
            //This is being affected by earlier calls...
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
        //console.info("size of object stores: ", db.objectStoreNames.length);
        for (var i=0; i < db.objectStoreNames.length; i++) {
            //console.info("OBJECT STORE: ", db.objectStoreNames[i]);
        }
        for (var l in db) {
            //            console.info("hmm ", l, "=", db[l]);
        }
        db.onerror = handleError; //TODO remove other error handlers

                   getAllData(db);
        
               }; //end handleDbOpen
               window.readOpenRequest.onsuccess = handleDbOpen;
            }, 3000);//end setTimeout
*/