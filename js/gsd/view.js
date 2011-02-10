var gsd = gsd ? gsd : {};

gsd.view = {
    init: function () {
        $('.na-edit').live('start-edit-next-action', function (event, id) {
            gsd.view.setupNextActionEditor(id);
        });
        // Handle Editor Context Changes
        $('#context-selector').bind('change', function () {
            gsd.currentNextAction.context = $('#context-selector').val().trim();
            if ("0" == gsd.currentNextAction.context) {
                gsd.currentNextAction.context = 'unknown-context';
            }
            gsd.model.updateNextAction(gsd.currentNextAction['id'], gsd.currentNextAction);
            //TODO with custom event moveNALIContext();
        });
    }, // end init
    ensureContextListItem: function (cid, name) {
        var cli = $('#' + cid);
        if (1 == cli.size()) return;

        var c = $('#unknown-context-item').clone();
        $('a', c).text("@" + name);
        $('a', c).attr("href", "#" + cid + "-page");
        $('.ui-li-count', c).text(0);
        c.attr('id', cid);//TODO, this needs a better 
        $('#contexts-list').append(c);
    }, //end ensureContextListItem
    ensureContextPage: function (contextId, name) {
        var page = $('#' + contextId + "-page");
        if (page.size() == 0) {
            page = $('#unknown-context-page').clone();
            page.attr('id', contextId + "-page");
            page.attr('data-url', contextId + "-page"); // JQM Hack... without this it can't navigate
            page.attr('data-db-id', contextId);//TODO make these numeric
            page.find('h2').text("@" + name);
            page.attr('data-name', name);
            $('body').append(page);
        } 

        return page;
    }, // end ensureContextPage
    naDOMSelector: '[data-role=collapsible]',

    nextActionIDFromDOM: function (domID) {
        if ('string' == typeof domID && domID.length > 2) {
            return domID.substring(2);
        } else if ('number' == typeof domID) {
            return domID;
        } else {
            console.info("ASSERTION FAILED... nextActionIDFromDOM given ", domID);
        }            
    }, // end nextActionIDFromDOM

    ensureNextAction: function (contextId, id, nextAction) {
        //console.info("ensureNextAction contextId=", contextId, " nextAction=", nextAction);

        var page = $('#' + contextId + "-page");

        //increment data counter on #contexts-page
        var count = parseInt($('#' + contextId + ' .ui-li-count').text()) + 1;
        $('#' + contextId + ' .ui-li-count').text(count);

        var nextActionDiv = $('#na' + id + "-div"); // TODO nextActionIDFromDOM and write nextActionDOMId(numId)
        if (nextActionDiv.size() == 0) {
            var proto = $(gsd.view.naDOMSelector + ':first').clone();
            //if (proto.attr('id') == 'na-1-div') {
            if (proto.hasClass('fake-entry')) {
                // Used to bootstrap UI
                proto.removeClass('fake-entry');
                $(gsd.view.naDOMSelector + ':first').remove();
            }
            proto.attr('id', 'na' + id + '-div');
            proto.attr('data-na-id', id);
            $('h3', proto).text(nextAction.title);
            $('p', proto).html(nextAction.content.replace('\n', "<br />"));
            $('.action-items', page).append(proto);
            nextActionDiv = proto;
        }
        return nextActionDiv;
        /* this will live in a dialog... 
        var textArea = $('#na' + id + "-textarea");
        console.info("Showing ", contextId, nextAction.title);
        if (textArea.size() == 0) {
            $('form', page).append('<textarea id="na' + id + '-textarea">' + nextAction.content + '</textarea>');
        } 
        */
    },
    setupNextActionEditor: function (id) {
        gsd.model.getNextAction(id, function (na) {
            gsd.currentNextAction = na;
            var editor = $('#next-action-editor-page');
            $('.next-action-title', editor).text(na.title);
            $('textarea', editor).val(na.content);
            var select = $('select option[value=' + na.context + ']', editor);
            if (select.size() == 0) {
                $('select option[value=0]', editor);
            }
            select.attr('selected', true);
            

        });
    },
};

gsd.view.init();