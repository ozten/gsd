/*jslint browser: true, plusplus: false, newcap: false, onevar: false  */
/*global document: false, $: false, console: false, gsd: false */
$(document).ready(function () {
    gsd.currentNextAction = null; 
    gsd.db.setupDb(gsd.cont.populateUI);    
});