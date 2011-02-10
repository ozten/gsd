var gsd = gsd ? gsd : {};

gsd.cont = {
    init: function () {
        $(document).bind('pagebeforeshow', function (e) {
            console.info("pagebeforeshow", this);
        });
        $(document).bind('pageshow', function (e, ui) {
            console.info("pageshow", ui.prevPage);
            console.info(ui.prevPage.attr('id'));
            if ('contexts-page' == ui.prevPage.attr('id')) {
                console.info("New page is ", this);
            }
        });
        $(document).bind('pagebeforehide', function (e) {
            console.info("pagebeforehide");
        });
        $(document).bind('pagehide', function (e, ui) {
            console.info("pagehide", ui.nextPage);
                        console.info(ui.nextPage.attr('id'));
            if ('context' == ui.nextPage.attr('data-page-type')) {
                gsd.cont.currentContext = {
                    id: ui.nextPage.attr('data-db-id'), //TODO make numeric
                    name: ui.nextPage.attr('data-name')
                }
            }
            
        });
    },
    currentContext: { //Default context
        id: -1,
        name: '?'
    },
};

gsd.cont.init();