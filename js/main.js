/* Firebug is crashy on stale IndexedDB Objects(???), only log primitives  or use Minefield and WebConsole */

$(document).ready(function(){
    gsd.currentNextAction = null; /* TODO this is actually bad, umhkay. Fresh gsd.model.dbName to repro crash */

    
    gsd.db.setupDb();
    

});//end document ready