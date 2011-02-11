console.info(gsd);
console.info(gsd.db);
var gsd = gsd ? gsd : {};

gsd.db = gsd.db ? gsd.db : {};
console.info("eval indexeddb");
gsd.db.indx = {
    setupDb: function (event) {
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

    },//end setupDb
};