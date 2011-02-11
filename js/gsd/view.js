var gsd = gsd ? gsd : {};
gsd.view = gsd.view ? gsd.view : {};

gsd.view.init = function () {
        $('.na-new').live('click', function (event) {
            // Prep data for editor
            // We know current context or default to ?            
            // disable then enable and setupNextActionEditor would be good...
            gsd.model.createNextAction(function (next_action) {
                gsd.currentNextAction = next_action;
                gsd.view.setupNextActionEditor(next_action.id);
                //TODO add na-created event
                //console.info("New next action is id=na", next_action.id);
                /*
                  $('li.next-action.current').removeClass('current');
                  var contextUl = contextUlSelector(next_action);
                  $(contextUl).append("<li id=na'" + next_action.id + "' class='next-action current'>" + 
                  next_action.title + "</li>");
                  if (next_action.context) {
                  $('#context-selector').val(next_action.context);
                  } else {
                  $('#context-selector').val(0);
                  }
                  $('#display textarea').val(next_action.content);
                  $('#display textarea').focus();
                */
            });// end createNextAction callback

            return true;
        });
        $('.na-edit').live('start-edit-next-action', function (event, id) {
            gsd.view.setupNextActionEditor(id);
        });
        $('.na-delete').live('click', function (event) {
            var na = $(this).parents('.next-action'),
                id = parseInt(na.attr('data-na-id'));
            event.preventDefault();
            console.info("Deleting ", id, " aka ", na.attr('data-na-id'));
            gsd.model.deleteNextAction(id, function () {
                na.remove();
                // TODO $(document).trigger('na-delete');
                return false;
            });
        });
        // Handle Editor Context Changes
        $('#context-selector').bind('change', function () {
            gsd.currentNextAction.context = $('#context-selector').val().trim();
            if ("0" == gsd.currentNextAction.context) {
                gsd.currentNextAction.context = 'ct--1';
            }
            gsd.model.updateNextAction(gsd.currentNextAction['id'], gsd.currentNextAction);
            //TODO with custom event moveNALIContext();
        });
}; // end init
gsd.view.context_dom_id = function (contextName) {
        if (!! contextName ) {
            return contextName.replace(' ', '_');//uhm, no
        } else {
            return 'ct--1';
        }
}; // end context_dom_id
gsd.view.ensureContextListItem = function (cid, name) {
        var cli = $('#' + cid);
        console.info("Looking for ", cli, " found ", cli.size());
        if (1 == cli.size()) return;

        var c = $('#ct--1-item').clone();
        $('a', c).text("@" + name);
        $('a', c).attr("href", "#" + cid + "-page");
        $('.ui-li-count', c).text(0);
        c.attr('id', cid);//TODO, this needs a better 
        $('#contexts-list').append(c);
}; //end ensureContextListItem
gsd.view.ensureContextPage = function (contextId, name) {
        var page = $('#' + contextId + "-page");
        if (page.size() == 0) {
            page = $('#ct--1-page').clone();
            page.attr('id', contextId + "-page");
            page.attr('data-url', contextId + "-page"); // JQM Hack... without this it can't navigate
            page.attr('data-db-id', contextId);//TODO make these numeric
            page.find('h2').text("@" + name);
            page.attr('data-name', name);
            $('body').append(page);
        } 

        return page;
}; // end ensureContextPage
gsd.view.naDOMSelector = '[data-role=collapsible]';

gsd.view.nextActionIDFromDOM = function (domID) {
        if ('string' == typeof domID && domID.length > 2) {
            return domID.substring(2);
        } else if ('number' == typeof domID) {
            return domID;
        } else {
            console.info("ASSERTION FAILED... nextActionIDFromDOM given ", domID);
        }            
}; // end nextActionIDFromDOM

gsd.view.ensureNextAction = function (contextId, id, nextAction) {
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
};
gsd.view.setupNextActionEditor = function (id) {
        gsd.model.getNextAction(id, function (na) {
            gsd.currentNextAction = na;
            var editor = $('#next-action-editor-page');
            $('.next-action-title', editor).text(na.title);
            $('textarea', editor).val(na.content);
            //var select = $('select option[value=' + na.context + ']', editor);
            //Do we ever populate this correctly?
            $('#context-selector option').each(function (i, option) {
                console.info("Comparing ", $(option).text(), " with ", na.context);
                if ($(option).text() == na.context) {
                    console.info("Selecting.. ");
                    $(option).attr('selected', true);
                }
                
            });
            console.info($('option:selected'));
            $('#context-selector').selectmenu('refresh', true);

        });
};


gsd.view.init();