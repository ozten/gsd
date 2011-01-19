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
var customerData = [
  { ssn: "444-44-4448", name: "Bill", age: 35, weight: 160, height: 64 },
  { ssn: "555-55-5559", name: "Donna", age: 32, weight: 135, height: 62 }
];

    var handleError = function(event) {
        // Do something with request.errorCode!
        console.info("ERROR handler");
        console.info("ERROR: #", event.target.errorCode);
        console.info("ERROR: target=", event.code);
    };
    var db;
    var dbName = "MyTestDatabase3";
    if (window.indexedDB) {
        window.request = window.indexedDB.open(dbName, "All your ideas are belong to us.");
        window.request.onerror = handleError;

    var initDb = function(db) {
        console.warn("No version, creating one");
            var request2 = db.setVersion('1');
            request2.onerror = handleError;
            request2.onsuccess = function(event) {
                objectStore = db.createObjectStore("customers", {"keyPath": "ssn"}, true);
                objectStore.createIndex("name", "name", { unique: false });
                console.info("Object store created", objectStore);
            }
    };
    var writeData = function (db) {
        var transaction = db.transaction(["customers"], IDBTransaction.READ_WRITE);
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
              console.info("All done writing data!");
            };

            transaction.onerror = handleError;

        var objectStore = transaction.objectStore("customers");
        for (var i in customerData) {
          var request = objectStore.add(customerData[i]);
          request.onsuccess = function(event) {
            // event.target.result == customerData[i].ssn
              console.info("Done writing ", event.target.result);
          };
        }
    }; //end function writeData 
    var getOneRecord = function (db) {
        var transaction = db.transaction(["customers"]);
        var objectStore = transaction.objectStore("customers");
        window.request = objectStore.get("444-44-4448");
        window.request.onerror = handleError;
        window.request.onsuccess = function(event) {
          // Do something with the request.result!
          console.info("Name for SSN 444-44-4444 is " + request.result.name);
        };
    }; //end function getOneRecord
    var deleteData = function (db) {
//delete
        var request = db.transaction(["customers"], IDBTransaction.READ_WRITE)
                    .objectStore("customers")
                    .delete("444-44-4448");
        request.onsuccess = function(event) {
          console.info("Delete 444-44-4448, It's gone!");
        };


        var request = db.transaction(["customers"], IDBTransaction.READ_WRITE)
                        .objectStore("customers")
                        .delete("555-55-5559");
        request.onsuccess = function(event) {
            console.info("Delete 555-55-5559, It's gone!");
        };
    }; //end function deleteData
    var handleDbOpen = function (event) {
        db = window.request.result;
        console.info('db.version =', db.version);
        if (db.version === undefined ||
            db.version === '') {
            initDb(db);
        } else {
        //Hmm request doesn't see good yet...

                db.onerror = handleError; //TODO remove other error handlers

                writeData(db);
        
                getOneRecord(db);
        
                deleteData(db);
            }
        }; //end handleDbOpen
        window.request.onsuccess = function(event) {
            handleDbOpen(event);
        } //end open db
    } // if window.indexedDB
});//end document ready