
/*jslint browser: true, plusplus: false, newcap: false, onevar: false */
/*global window: false, require: false, $: false, openDatabase: false, console: false, alert: false */
var gsd = gsd ? gsd : {};
gsd.db = gsd.db ? gsd.db : {};
gsd.db.sqlite = gsd.db.sqlite ? gsd.db.sqlite : {};

gsd.db.sqlite.init = function () {

};
gsd.db.sqlite.handleError = function (error) {
    if (window.console && window.console.log) {
        console.log("DB Error: ");
        console.log(error);
    }
};
gsd.db.sqlite.setupDb = function (completeFn) {
    gsd.db.conn = openDatabase(gsd.db.dbName + 'h', '1.0', gsd.db.dbDescription, 1 * 1024 * 1024); // 1 MB
    gsd.db.conn.transaction(function (tx) {
            gsd.db.sqlite.setupDb.version = 0;
            try {
                tx.executeSql("SELECT version FROM gsd_schema", [], function (tx, rs) {
                        for (var i = 0; i < rs.rows.length; i++) {
                            var row = rs.rows.item(i);
                            gsd.db.sqlite.setupDb.version = row.version;
                        }
                        completeFn();
                    });
            } catch (e) { 
                alert('Unhandled Exception in setupDb read schema' + e.toString()); 
            }// end try/catch
        }, function (error) {
            /* Migration #1 */
            var i;
            gsd.db.conn.transaction(function (tx) {
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
                    for (i = 0; i < gsd.model.initialContexts.length; i++) {
                        var name = gsd.model.initialContexts[i];
                        tx.executeSql("INSERT INTO contexts (id, name) VALUES (NULL, ?)", [name]);
                    }
                    completeFn();
                    //window.location.reload();
                }, gsd.db.sqlite.handleError); //end inner
        }, gsd.db.sqlite.handleError);//end outer transaction
};

/**
 * successFn should take 1 argument - the new next_action
 */
gsd.db.sqlite.createNextAction = function (successFn) {
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
    next_action.context = next_action.context ? next_action.context : -1;
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("UPDATE next_actions SET title = ?, content = ?, context = ? WHERE id = ?", 
                          [next_action.title, next_action.content, next_action.context, id],
                          function (tx, rs) {
                                gsd.db.sqlite.getNextAction(id, successFn);
                            });
        }, gsd.db.sqlite.handleError);
};

/**
 * Delete a next action by it's id. successFn
 * will be called upon completion of the delete.
 */
gsd.db.sqlite.deleteNextAction = function (id, successFn) {
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
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("SELECT id, title, content, context FROM next_actions", [], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
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
    gsd.db.conn.transaction(function (tx) {
            tx.executeSql("SELECT id, name FROM contexts", [], function (tx, rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        var row = rs.rows.item(i);
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