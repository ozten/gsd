/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */
$(document).ready(function(){
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

// This is what our customer data looks like.
var firstIdeas = [
    { 
        /*id: 10,  */
      title: 'Welcome to Idea Catcher',
      content: 'Idea Catcher is a quick notebook for ideas and TODOs'
      }
];

    var handleError = function(event) {
        // Do something with request.errorCode!
        console.info("ERROR handler");
        console.info("ERROR: #", event.target.errorCode);
        console.info("ERROR: target=", event.code);
    };
    var db;
    var dbName = "IdeaCatcherDBv20";
    var objectStoreName = "ideas";
    if (window.indexedDB) {
        window.request = window.indexedDB.open(dbName, "All your ideas are belong to us.");
        window.request.onerror = handleError;

    var initDb = function(db) {
        console.warn("No version, creating one");
            var request2 = db.setVersion('1');
            request2.onerror = handleError;
            request2.onsuccess = function(event) {
                objectStore = db.createObjectStore(objectStoreName, {keyPath: 'id', autoIncrement: true}, false);
            /* 
               {keyPath: 'id'}, true - value objects must have an id property 
               {keyPath: 'id', autoIncrement: true}, true - value object shouldn't have an id property, if it does, then the value object's id overrides the generator
*/

                //autoIncrement: true - IndexedDB handles key generation
                objectStore.createIndex("title", "id", { unique: false });
                console.info("Object store created", objectStore);
            }
    };
    var writeData = function (db) {
        var transaction = db.transaction([objectStoreName], IDBTransaction.READ_WRITE);
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
              console.info("All done writing data!");
            };

            transaction.onerror = handleError;

        var objectStore = transaction.objectStore(objectStoreName);
        for (var i in firstIdeas) {
          var request = objectStore.add(firstIdeas[i]);
          request.onsuccess = function(event) {
            // event.target.result == firstIdeas[i].ssn
              console.info("Done writing ", event.target.result);
          };
        }
    }; //end function writeData 
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

    var getAllData = function (db) {
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
    var handleDbOpen = function (event) {
        db = window.request.result;


        console.info('initial db.version =', db.version);
        if (db.version === undefined ||
            db.version === '') {
            initDb(db);
        } else {
            console.info('db.version=', db.version);
            var r4 = db.setVersion("5");
            r4.onsuccess = function () {
                  console.info("Taking it to two");
                  console.info('db.version=', db.version);
                  r5 = db.deleteObjectStore(objectStoreName);
                  console.info("Boo ya");
                  r5.onsuccess = function () {
                      console.info("inner Taking it to two");
                      console.info('inner db.version=', db.version);
                      r5 = db.deleteObjectStore(objectStoreName);
                      console.info("inner Boo ya");
                  };
            };

        //Hmm request doesn't see good yet...

                db.onerror = handleError; //TODO remove other error handlers

                writeData(db);
                getAllData(db);
        
                //getOneRecord(db, 10);
        
                //deleteData(db);
            }
        }; //end handleDbOpen
        window.request.onsuccess = function(event) {
            handleDbOpen(event);
        } //end open db
    } // if window.indexedDB
});//end document ready