
/*jslint browser: true, plusplus: false, newcap: false, onevar: false  */
/*global window: false, require: false, $: false, openDatabase: false, console: false, alert: false */
console.log("eval sqlite");
var gsd = gsd ? gsd : {};
gsd.db = gsd.db ? gsd.db : {};
gsd.db.sqlite = gsd.db.sqlite ? gsd.db.sqlite : {};

gsd.db.sqlite.init = function () {

};
gsd.db.sqlite.handleError = function (error) {
    console.log("DB Error: ");
    console.log(error);
};
gsd.db.sqlite.setupDb = function (completeFn) {
    console.log("SQLITE: Calling setupDb");
    gsd.db.conn = openDatabase(gsd.db.dbName + 'h', '1.0', gsd.db.dbDescription, 1 * 1024 * 1024); // 1 MB
    gsd.db.conn.transaction(function (tx) {
            console.log("In a transaction");
            gsd.db.sqlite.setupDb.version = 0;
            try {
                console.log("In a try");
                console.log(tx.executeSql);
                tx.executeSql("SELECT version FROM gsd_schema", [], function (tx, rs) {
                        console.log("callback");
                        for (var i = 0; i < rs.rows.length; i++) {
                            var row = rs.rows.item(i);
                            console.log(row);
                            gsd.db.sqlite.setupDb.version = row.version;
                        }
                        console.info("Done with migrations, right?");
                        completeFn();
                    });
            } catch (e) { 
                alert('Unhandled Exception in setupDb read schema' + e.toString()); 
            }// end try/catch
        }, function (error) {
            /* Migration #1 */
            var i;
            console.log("Caught ERROR, We must be on schema 0");
            console.log(error);
            gsd.db.conn.transaction(function (tx) {
                    console.log("DB at version=0 migrating to 1");
                    tx.executeSql("CREATE TABLE gsd_schema (version integer)");
                    tx.executeSql("INSERT INTO gsd_schema (version) VALUES (1)");
                    gsd.db.sqlite.setupDb.version = 1;
                    tx.executeSql("CREATE TABLE next_actions (id INTEGER PRIMARY KEY, title text, content text, context integer)");
                    for (i = 0; i < gsd.model.initialNextActions.length; i++) {                        
                        gsd.currentNextAction = gsd.model.initialNextActions[i];
                        tx.executeSql("INSERT INTO next_actions (id, title, content, context) VALUES (NULL, '" +
                                      gsd.currentNextAction.title + "', '" + 
                                      gsd.currentNextAction.content + "', -1)");
                    }


                    tx.executeSql("CREATE TABLE contexts (id INTEGER PRIMARY KEY, name text)");
                    console.log(gsd.model.initialContexts);
                    for (i = 0; i < gsd.model.initialContexts.length; i++) {
                        var name = gsd.model.initialContexts[i];
                        tx.executeSql("INSERT INTO contexts (id, name) VALUES (NULL, ?)", [name]);
                    }
                    console.log("Finished schema migration 1");

                    console.log("Finished ALL migrations");
                    completeFn();
                    //window.location.reload();
                }, gsd.db.sqlite.handleError); //end inner
        }, gsd.db.sqlite.handleError);//end outer transaction
};

/**
 * successFn should take 1 argument - the new next_action
 */
gsd.db.sqlite.createNextAction = function (successFn) {
    console.log("SQLITE: Calling createNextAction");
    var next_action = {id: 0, title: '', content: '', context: -1};
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("INSERT INTO next_actions (id, title, content, context) VALUES (NULL, '', '', -1)");
            tx.executeSql("SELECT MAX(id) AS id FROM next_actions", [], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
                        next_action.id = row.id;
                        successFn(next_action);
                        break;
                    }
                
                });
        }, gsd.db.sqlite.handleError);
};

/**
 * Read a next_action by it's id.
 * loadFn should accept 1 argument - the next_action
 */
gsd.db.sqlite.getNextAction = function (id, loadFn) {
    console.log("SQLITE: Calling getNextAction " + id);
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("SELECT id, title, content, context FROM next_actions WHERE id = ?", [id], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
                        loadFn({id: row.id,
                             title: row.title,
                           content: row.content,
                           context: row.context});
                        break;
                    }
                });
        }, gsd.db.sqlite.handleError);
    
};
/**
 * Update a next_action by it's id and value and a
 * successFn which should accept 1 argument - the updated
 * next_action.
 */
gsd.db.sqlite.updateNextAction = function (id, next_action, successFn) {
    console.log("SQLITE: Calling updateNextAction " + id + ' ' + next_action);
    next_action.context = next_action.context ? next_action.context : -1;
    gsd.db.conn.transaction(function (tx) {
            console.log("UPDATE next_actions SET title = ?, content = ?, context = ? WHERE id = ?");
            console.log([next_action.title, next_action.content, next_action.context, id]);
            tx.executeSql("UPDATE next_actions SET title = ?, content = ?, context = ? WHERE id = ?", 
                          [next_action.title, next_action.content, next_action.context, id],
                          function (tx, rs) {
                              console.log("Success ... now loading via a fresh read");
                                gsd.db.sqlite.getNextAction(id, successFn);
                            });
        }, gsd.db.sqlite.handleError);
};

/**
 * Delete a next action by it's id. successFn
 * will be called upon completion of the delete.
 */
gsd.db.sqlite.deleteNextAction = function (id, successFn) {
    console.log("SQLITE: Calling deleteNextAction " +  id);
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("DELETE FROM next_actions WHERE id = ?", [id], function (tx, rs) {
                    successFn();
                });

        }, gsd.db.sqlite.handleError);
};

/**
 *
 */
gsd.db.sqlite.getAllNextActions = function (loadFn, finFn) {
    console.log("SQLITE: Calling getAllNextActions");
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("SELECT id, title, content, context FROM next_actions", [], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
                        console.log(row);
                        console.log("SQLITE: loading");
                        loadFn(row.id, 
                               {id: row.id,
                             title: row.title,
                           content: row.content,
                           context: row.context});
                    }
                    finFn();
                });
        }, gsd.db.sqlite.handleError);
};

gsd.db.sqlite.getAllContexts = function (loadFn, finFn) {
    console.log("SQLITE: Calling getAllContexts");
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("SELECT id, name FROM contexts", [], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
                        console.log(row);
                        loadFn(row.id,
                               {id: row.id,
                              name: row.name});
                    }
                    finFn();
                });
        }, gsd.db.sqlite.handleError);
};

/**
 * Read a context by it's id. loadFn will be called
 * with the context
 */
gsd.db.sqlite.getContextById = function (id, loadFn) {
    console.log("SQLITE: Calling getContextById " + id);
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("SELECT id, name FROM contexts WHERE id = ?", [id], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
                        loadFn({id: row.id,
                              name: row.name});
                        break;
                    }
                });
        }, gsd.db.sqlite.handleError);
};

gsd.db.sqlite.init();
gsd.db.driver = gsd.db.sqlite; // Register as driver