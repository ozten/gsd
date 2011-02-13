console.info("eval controller");
var gsd = gsd ? gsd : {};
gsd.cont = gsd.cont ? gsd.cont : {};

gsd.cont.init = function () {
    gsd.cont.init.na_count = 0;
        gsd.db.indx.getAllNextActions(
            function (key, value) {
                gsd.cont.init.na_count++;
                //JQM
                ctxId = parseInt(value.context);
                console.info("Loading na id=", value.id, " title=", value.title, " context=", value.context, " ctxId=", ctxId, " nextaction=", value);
                var contextLoaded = function (context) {
                    var cli_id = gsd.view.context_dom_id(context.id),
                        cpage_id = gsd.view.context_dom_page_id(context.id);

                    gsd.view.ensureContextListItem(value.id, cli_id, context.name);
                    console.info("Must ", value.id, "na ct li=", $('#' + cli_id), " ctx name=", context.name);
                    gsd.view.ensureContextPage(context.id, cpage_id, context.name);
                    console.info("Must ", value.id, "na ct page=", $('#' + cpage_id));
                    gsd.view.ensureNextAction(context.id, key, value);
                    console.info("Must ", value.id, "na div=", $('#na' + key + "-div"));
                };
                if (ctxId > 0) {
                    gsd.db.getContextById(ctxId, contextLoaded);
                } else {
                    console.info("Skipping ", value.context, ctxId);
                    ctxId = -1;
                    contextLoaded({id: -1, name: '?'});
                }                               
                return true;
            }, 
            function () {
                //console.info("Done");
                $('#loading-next-actions').remove();
        });
        gsd.db.indx.getAllContexts(
            function (key, value) {
                console.info("Loading Contextz ", key, " ", value.name);
                //TODO use context.id instead of name for value
                $('#context-selector').append("<option value='" + value.id + "'>@" + value.name + "</option>");
                //JQM
                var cli_id = gsd.view.context_dom_id(key);
                //aok do same here we did above using ensureContextListItem
                console.info("Loading Context cli_id=", cli_id, " id=", key, " name=", value);
                gsd.view.ensureContextListItem(key, cli_id, value.name);
                var cpage_id = gsd.view.context_dom_page_id(key);
                console.info("cpage_id ", cpage_id);
                //TODO switch to value.id
                gsd.view.ensureContextPage(value.id, cpage_id, value.name);
                return true;
            }, 
            function () {
                //console.info("Done loading contexts");
        });
        $(document).bind('pagebeforeshow', function (e) {
                //console.info("pagebeforeshow", this);
        });
        $(document).bind('pageshow', function (e, ui) {
                //console.info("pageshow", ui.prevPage);
                //console.info(ui.prevPage.attr('id'));
            if ('contexts-page' == ui.prevPage.attr('id')) {
                //console.info("New page is ", this);
            }
        });
        $(document).bind('pagebeforehide', function (e) {
                //console.info("pagebeforehide");
        });
        $(document).bind('pagehide', function (e, ui) {
            if ('context' == ui.nextPage.attr('data-page-type')) {
                gsd.cont.currentContext = {
                    id: ui.nextPage.attr('data-db-id'), //TODO make numeric
                    name: ui.nextPage.attr('data-name')
                }
            }            
        });
        $('#export_db').bind('click', function (event) {
            gsd.cont.exportDatabase();
            return false;
        });
        $('.na-edit').live('click', function (e) {
            e.preventDefault();
            var id = parseInt($(this).parents('.next-action').attr('data-na-id'));
            $(this).trigger('start-edit-next-action', [id]);
            return false;
        });
        $('#display textarea').bind('change, keyup', function (event) {
                //console.info("Make that change");
            gsd.cont.saveCurrent();
        });

};//end init
gsd.cont.currentContext = { //Default context
        id: -1,
        name: '?'
};
gsd.cont.timeoutId = null;
gsd.cont.saveCurrent = function () {
        if (gsd.cont.timeoutId != null) {
            clearTimeout(gsd.cont.timeoutId);
        }
        gsd.cont.timeoutId = setTimeout(function () {
                gsd.currentNextAction.content = $('#display textarea').val();
                gsd.currentNextAction.context = $('#context-selector').val();
                gsd.currentNextAction.title = gsd.currentNextAction.content.split('\n')[0];
                $('nav ul li.next-action.current').text(gsd.currentNextAction.title);
                gsd.cont.timeoutId = null;

                console.info("gsd.currentNextAction.context=", gsd.currentNextAction.context);

                // Use custom events to decouple
                gsd.model.updateNextAction(gsd.currentNextAction.id, gsd.currentNextAction);
            }, 300);
};
gsd.cont.exportDatabase = function () {
    var actions = [];
    gsd.db.indx.getAllNextActions(            
        function (key, value) {
            actions[actions.length] = value;
            return true;
        }, 
        function () {
            var w = window.open("data:text/json;charset=utf-8," + JSON.stringify(actions));
        });
};
setTimeout(gsd.cont.init, 100);
