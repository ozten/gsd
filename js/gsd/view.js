var gsd = gsd ? gsd : {};

gsd.view = {
    ensureContextPage: function (contextId) {
        var page = $('#' + contextId + "-page");
        if (page.size() == 0) {
            page = $('#unknown-context-page').clone();
            page.attr('id', contextId + "-page");
            // JQM Hack... without this it can't navigate
            page.attr('data-url', contextId + "-page");
            $('body').append(page);
        }
        return page;
    }, // end ensureContextPage
    ensureNextAction: function (contextId, id, nextAction) {
        var page = $('#' + contextId + "-page");
        var nextActionDiv = $('#na' + id + "-div");
        if (nextActionDiv.size() == 0) {
            var proto = $('[data-role=collapsible]:first').clone();
            if (proto.attr('id') == 'na-1-div') {
                $('[data-role=collapsible]:first').remove();
            }
            proto.attr('id', 'na' + id + '-div');
            $('h3', proto).text(nextAction.title);
            $('p', proto).text(nextAction.content.replace('\n', "<br />"));
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
    }
};