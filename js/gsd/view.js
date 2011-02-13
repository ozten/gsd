console.info("eval view");

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
            gsd.model.deleteNextAction(id, function () {
                na.remove();
                // TODO $(document).trigger('na-delete');
                return false;
            });
        });
        // Handle Editor Context Changes
        $('#context-selector').bind('change', function () {
            // Everything after @ so @foo -> foo
            gsd.currentNextAction.context = $('#context-selector').val();
            gsd.model.updateNextAction(gsd.currentNextAction['id'], gsd.currentNextAction);
            //TODO with custom event moveNALIContext();
        });
}; // end init
/**
 * For dom ids we use ct-{db_id} such as ct-1, ct-2
 * For option value we use {db_id}
 * Dom elements may add a suffix, ct-1-page, ct-1-listitem, etc
 *
 * TODO make async and go to db to find out the id#
 * TODO rename to dom_li_id
 */
gsd.view.context_dom_id = function (db_id) {
    return 'ct-' + db_id + '-li';
}; // end context_dom_id

/**
 * For dom ids we use ct-{db_id} such as ct-1, ct-2
 * For option value we use {db_id}
 * Dom elements may add a suffix, ct-1-page, ct-1-listitem, etc
 *
 * TODO make async and go to db to find out the id#
 */
gsd.view.context_dom_page_id = function (db_id) {
    console.info("dom_page_id=", db_id);
    return 'ct-' + db_id + '-page';
}; // end context_dom_id

/**
 *
 */
gsd.view.ensureContextListItem = function (db_id, cli_id, name) {
    console.info("ensureContextLI ", cli_id, " ", name);
    var cli = $('#' + cli_id);
    if (1 == cli.size()) return;
    
    var c = $('#ct--1-li').clone();
    var cpage_id = gsd.view.context_dom_page_id(db_id);
    $('a', c).text("@" + name);
    $('a', c).attr("href", "#" + cpage_id);
    $('.ui-li-count', c).text(0);
    c.attr('id', cli_id);//TODO, this needs a better 
    $('#contexts-list').append(c);
}; //end ensureContextListItem
gsd.view.ensureContextPage = function (db_id, contextId, name) {
    console.info("ensureContextPage contextId=", contextId, " name=", name);
    var page = $('#' + contextId);
    if (page.size() == 0) {
        page = $('#ct--1-page').clone();
        page.attr('id', contextId);
        page.attr('data-url', contextId); // JQM Hack... without this it can't navigate
        page.attr('data-db-id', db_id);//TODO make these numeric
        page.find('h2').text("@" + name);
        page.attr('data-name', name);
        $('div.next-action', page).remove();
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
            console.error("ASSERTION FAILED... nextActionIDFromDOM given ", domID);
        }            
}; // end nextActionIDFromDOM

gsd.view.ensureNextAction = function (contextDbId, id, nextAction) {
    console.info("ensureNextAction contextId=", contextDbId, " na id=", id, " nextAction=", nextAction);

    var cli_id = gsd.view.context_dom_id(contextDbId),
        cpage_id = gsd.view.context_dom_page_id(contextDbId),
        page = $('#' + cpage_id);

    console.info('page exists? right? #pages=', page.size(), 'na id=', id, ' cli_id=', cli_id, ' cpage_id=', cpage_id);

        //increment data counter on #contexts-page
    var count = parseInt($('#' + cli_id + ' .ui-li-count').text()) + 1;
    $('#' + cli_id + ' .ui-li-count').text(count);

    var nextActionDiv = $('#na' + id + "-div"); // TODO nextActionIDFromDOM and write nextActionDOMId(numId)
    if (nextActionDiv.size() > 1) {
        console.error("ASSERTION: We have more than 1 nextActionDiv #=", nextActionDiv.size(), " divs=", nextActionDiv);
    }
    if (nextActionDiv.size() == 0) {
            var naDiv = $(gsd.view.naDOMSelector + ':first')
            var proto = naDiv.clone();
            if (naDiv.size() != 1) {
                console.error("ASSERTION: We didn't find a nextActionDiv", naDiv);
            }
            console.info("Cloned the proto", proto);
            //if (proto.attr('id') == 'na-1-div') { na14-div
            if (naDiv.hasClass('fake-entry')) {
                proto.removeClass('fake-entry');
                // Used to bootstrap UI
                //kill all the fake entries
                if ($(gsd.view.naDOMSelector + '.fake-entry').size() != 1) {
                    console.error("We expected only 1 fake entry but found #=", 
                                  $(gsd.view.naDOMSelector + '.fake-entry').size(),
                                  " entries=", $(gsd.view.naDOMSelector + '.fake-entry'));
                }
                $(gsd.view.naDOMSelector + '.fake-entry').remove()
            }
            proto.attr('id', 'na' + id + '-div');
            proto.attr('data-na-id', id);
            $('h3', proto).text(nextAction.title);
            $('p', proto).html(nextAction.content.replace('\n', "<br />"));
            if (page.size() != 1) {
                console.error("ASSERTION: We didn't have 1 page #pages", page.size(), " page=", page);
            }
            if ($('.action-items', page).size() != 1) {
                console.error("ASSERTION: We didn't have 1 set of action items under page #item blocks=", 
                              $('.action-items', page).size(), " items=", $('.action-items', page));
            }
            $('.action-items', page).append(proto);
            nextActionDiv = proto;
    } else {
        console.warn("NA already exists in the DOM");
    }
    return nextActionDiv;
};
gsd.view.setupNextActionEditor = function (id) {
    console.info('setupNextActionEditor id=', id);
        gsd.model.getNextAction(id, function (na) {
            gsd.currentNextAction = na;
            var editor = $('#next-action-editor-page');
            $('.next-action-title', editor).text(na.title);
            $('textarea', editor).val(na.content);
            //var select = $('select option[value=' + na.context + ']', editor);
            //Do we ever populate this correctly?
            $('#context-selector').val(na.context);
            $('#context-selector').selectmenu('refresh', true);

        });
};


gsd.view.init();