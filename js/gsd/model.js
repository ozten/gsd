var gsd = gsd ? gsd : {};
gsd.model = gsd.model ? gsd.model : {};

gsd.model.init = function () {};
gsd.model.dbName = "IdeaCatcherDBv13";
gsd.model.dbDescription = "All your ideas are belong to us.";
gsd.model.objectStoreName = "ideas";
gsd.model.contextOSName = "contexts";
gsd.model.handleError = function(event) {
        // Do something with request.errorCode!
        console.info("ERROR handler");
        console.info("ERROR: #", event.target.errorCode);
};

gsd.model.initialNextActions = [
    { 
      title: 'Welcome to Idea Catcher',
      content: 'Idea Catcher is a quick notebook for ideas and TODOs'
      }
    ];

gsd.model.createNextAction = function (successFn) {
        var next_action = {title: '', content: '', 
                           context: gsd.cont.currentContext.name};
        
        var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
        openReq.onerror = gsd.model.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.model.objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = gsd.model.handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                //console.info("create next_action complete");
            };

            var objectStore = transaction.objectStore(gsd.model.objectStoreName);

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
gsd.model.getNextAction = function (domID, fn) {
        var id = gsd.view.nextActionIDFromDOM(domID);
        console.info("getNextAction (", id, ")");
        var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
        openReq.onerror = gsd.model.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.model.objectStoreName]);
            var objectStore = transaction.objectStore(gsd.model.objectStoreName);
            var getReq = objectStore.get(id);
            getReq.onerror = gsd.model.handleError;
            getReq.onsuccess = function(event) {
                fn(event.target.result);
            };
        };
}; //end function getNextAction

updateNextAction = function (domID, next_action) {
        console.info("updateNA for ", domID, " ", next_action.context);
        var id = gsd.view.nextActionIDFromDOM(domID);
        var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
        openReq.onerror = gsd.model.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.model.objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = gsd.model.handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.info("Update ", id, " complete");
            };

            var objectStore = transaction.objectStore(gsd.model.objectStoreName);

            addReq = objectStore.put(next_action);
            addReq.onsuccess = function(event) {
                // event.target.result == initialNextActions[i].ssn
                console.info("Update successeded ", event.target.result);
                gsd.model.getNextAction(domID, function (na) {
                    console.info("clean read gives us: ", na.context);
                });
                
            };

        };
}; //end updateNextAction
gsd.model.deleteNextAction = function (domID, successFn) {
        var id = gsd.view.nextActionIDFromDOM(domID);
        var openReq = window.indexedDB.open(gsd.model.dbName, gsd.model.dbDescription);
        openReq.onerror = gsd.model.handleError;
        openReq.onsuccess = function (event) {
            var db = openReq.result;
            var transaction = db.transaction([gsd.model.objectStoreName], IDBTransaction.READ_WRITE);
            var addReq;
            transaction.onerror = gsd.model.handleError;
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                //console.info("Delete ", id, " complete");
            };

            var objectStore = transaction.objectStore(gsd.model.objectStoreName);
            addReq = objectStore.delete(id); /* remove in spec */
            addReq.onsuccess = successFn;
        };
}; //end deleteNextAction

gsd.model.init();