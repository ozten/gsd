/*jslint browser: true, plusplus: false */
/*global window: false, document: false, $: false, console: false */

var gsd = gsd ? gsd : {};
gsd.view = gsd.view ? gsd.view : {};

gsd.view.init = function () {
        $('.na-new').live('click', function (event) {
            // Prep data for editor
            // We know current context or default to ?            
            // disable then enable and setupNextActionEditor would be good...
            gsd.db.createNextAction(function (next_action) {
                gsd.currentNextAction = next_action;                
                
                gsd.view.setupNextActionEditor(next_action.id);
                //TODO add na-created event
                //console.info("New next action is id=na", next_action.id);
            });// end createNextAction callback

            return true;
        });
        $('#na-another-new').live('click', function (event) {
            event.preventDefault();
            // Prep data for editor
            gsd.db.createNextAction(function (next_action) {
                gsd.currentNextAction = next_action;                
                gsd.view.setupNextActionEditor(next_action.id);
            });// end createNextAction callback

            return false;
        });
        $('.na-edit').live('start-edit-next-action', function (event, id) {
            gsd.view.setupNextActionEditor(id);
        });
        $('.na-delete').live('click', function (event) {
            var na = $(this).parents('.next-action'),
                id = parseInt(na.attr('data-na-id'), 10);
            event.preventDefault();
            gsd.db.deleteNextAction(id, function () {
                na.remove();
                // TODO $(document).trigger('na-delete');
                gsd.view.updateContextNACount();
                return false;
            });
        });
        // Handle Editor Context Changes
        // TODO edit na change context breaks dialog...
        $('#context-selector').bind('change', function () {
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
    return 'ct-' + db_id + '-page';
}; // end context_dom_id

/**
 *
 */
gsd.view.ensureContextListItem = function (db_id, cli_id, name) {
    var cli = $('#' + cli_id),
        c,
        cpage_id;
    if (1 === cli.size()) {
        return;
    }
    
    c = $('#ct--1-li').clone();
    cpage_id = gsd.view.context_dom_page_id(db_id);
    $('a', c).text("@" + name);
    if (gsd.rspd.isNotSmallLayout()) {
        $('a', c).attr("href", "#");
        $('a', c).attr("data-role-id", db_id);
    } else {
        $('a', c).attr("href", "#" + cpage_id);
    }
    $('.ui-li-count', c).text(0);
    c.attr('id', cli_id);//TODO, this needs a better 
    $('#contexts-list').append(c);
}; //end ensureContextListItem
gsd.view.ensureContextPage = function (db_id, contextId, name) {
    var page = $('#' + contextId),
        parent;
    if (page.size() === 0) {
        page = $('#ct--1-page').clone();
        page.attr('id', contextId);
        page.attr('data-url', contextId); // JQM Hack... without this it can't navigate
        page.attr('data-db-id', db_id);//TODO make these numeric
        page.find('h2').text("@" + name);
        page.attr('data-name', name);
        parent = $('#ct--1-page').parent();        
        $('.next-action', page).remove();
        parent.append(page);
    } 
    if (gsd.rspd.isNotSmallLayout() &&
        db_id !== gsd.cont.currentContext.id) {
        page.hide();
    }
    return page;
}; // end ensureContextPage
gsd.view.naDOMSelector = '.next-action';

gsd.view.nextActionIDFromDOM = function (domID) {
        if ('string' === typeof domID && domID.length > 2) {
            return domID.substring(2);
        } else if ('number' === typeof domID) {
            return domID;
        } else {
            //console.error("ASSERTION FAILED... nextActionIDFromDOM given ", domID);
        }
    }; // end nextActionIDFromDOM

gsd.view.ensureNextAction = function (contextDbId, id, nextAction) {
    var cli_id = gsd.view.context_dom_id(contextDbId),
        cpage_id = gsd.view.context_dom_page_id(contextDbId),
        // page can be a jQuery page or a block in the layout...
        page = $('#' + cpage_id),
        count,
        nextActionLi,
        naLi,
        proto;

    //increment data counter on #contexts-page
    count = parseInt($('#' + cli_id + ' .ui-li-count').text(), 10) + 1;
    $('#' + cli_id + ' .ui-li-count').text(count);

    nextActionLi = $('#na' + id + "-li"); // TODO nextActionIDFromDOM and write nextActionDOMId(numId)
    if (nextActionLi.size() > 1) {
        //console.error("ASSERTION: We have more than 1 nextActionLi #=", nextActionLi.size(), " divs=", nextActionLi);
    }
    if (nextActionLi.size() === 0) {
        naLi = $(gsd.view.naDOMSelector + ':first');
        proto = naLi.clone();
        if (naLi.size() !== 1) {
            //console.error("ASSERTION: We didn't find a nextActionLi", naLi);
        }

        if (naLi.hasClass('fake-entry')) {
            proto.removeClass('fake-entry');
            $(gsd.view.naDOMSelector + '.fake-entry').remove();
        }
        proto.attr('id', 'na' + id + '-li');
        proto.attr('data-na-id', id);

        gsd.view.populate(proto, nextAction);
        if (page.size() !== 1) {
            //console.error("ASSERTION: We didn't have 1 page #pages", page.size(), " page=", page);
        }
        if ($('.action-items', page).size() !== 1) {
            /*console.error("ASSERTION: We didn't have 1 set of action items under page #item blocks=", 
              $('.action-items', page).size(), " items=", $('.action-items', page));*/
        }
        $('.action-items', page).append(proto);
            
        nextActionLi = proto;
    } else {
        //console.warn("NA already exists in the DOM");
    }
    return nextActionLi;
}; // ensureNextAction

gsd.view.updateContextNACount = function () {
    $('#contexts-list li.ui-btn').each(function (i, el) {
            var ctx_id = parseInt($(el).find('a').attr('data-role-id'), 10);
        });
};

/**
 * domEl is a jQuery wrapped li
 */
gsd.view.populate = function (domEl, nextAction) {
    $('h3 a', domEl).text(nextAction.title);
    var ptext = nextAction.content.split('\n').splice(1).join("<br />");
    $('p', domEl).html(ptext);
};

gsd.view.updateNextAction = function (next_action) {
    var naLi = $('#na' + next_action.id + '-li');
    if (naLi.size() === 0) {
        gsd.view.ensureNextAction(next_action.context, next_action.id, next_action);
        naLi = $('#na' + next_action.id + '-li');
        if (naLi.size === 0) {
            //console.error("ASSERTION: We should have created a div");
        }
    }
    gsd.view.populate(naLi, next_action);

    if (parseInt(naLi.parents('[data-page-type=context]').attr('data-db-id'), 10) !== next_action.context) {
        $('#ct-' + next_action.context + '-page .action-items').append(naLi.remove());
        gsd.view.updateContextNACount();
    }
};//end updateNextAction

gsd.view.setupNextActionEditor = function (id) {
        gsd.db.getNextAction(id, function (na) {
            gsd.currentNextAction = na;
            var editor = $('#next-action-editor-page');
            $('.next-action-title', editor).text(na.title);
            $('textarea', editor).val(na.content)
                .focus();
            //var select = $('select option[value=' + na.context + ']', editor);
            //Do we ever populate this correctly?
            $('#context-selector').val(na.context);
            $('#context-selector').selectmenu('refresh', true);
        });
    };

gsd.view.init();