var gsd = gsd ? gsd : {};
gsd.rspd = gsd.view ? gsd.view : {};

gsd.rspd.init = function () {
    if ($.mobile.media("(max-width: 480px)")) {
        // Small layout - as sent to the client
        console.info("I'm a SMALL layout");
    } else if ($.mobile.media("(min-width: 768px)")) {
        // Medium layout
        //- remove some data-role=page, reconfigure UI
        console.info("I'm a MEDIUM layout");
        var ct_page = $("#ct--1-page").remove();
        
        ct_page.removeAttr('data-role') // not a page
               .removeAttr('data-url'); // no need to go there

        ct_page.find('[data-role=content]').removeAttr('data-role');
        
        ct_page.find('[data-role=header], [data-role=footer]').remove();
        $('#contexts-page [data-role=content]').append(ct_page);
        $('#contexts-page [data-role=content]').addClass('ui-grid-a');
        $('#contexts-nav').addClass('ui-block-a');
        ct_page.addClass('ui-block-b');

        if (1 != $('.na-new').size()) {
            console.error("ASSERTION: We wanted to grab the one New Next Action button");
        } 

        var newNa = $('.na-new').remove();
        newNa.attr('data-inset', 'true');
        newNa.attr('data-theme', 'b');
        newNa.addClass('ui-btn-right');

        $('#contexts-page [data-role=header]').append(newNa);

        gsd.rspd.contextsNav();
    } else {
        console.info("HELP I DON'T KNOW my layout");
    }
    // else if max-width < 1025
    // Large layout (future, TBD)

    // Touch?
    if (window.ontouchstart) { 
        $('html').addClass('touch-enabled');
    }

};
gsd.rspd.isNotSmallLayout = function () {
    return ! $.mobile.media("(max-width: 480px)");
}
gsd.rspd.contextsNav = function () {
    $('#contexts-list li a').attr('href', '#')
        .live('click', function (e) {
            e.preventDefault();
            $('[data-page-type=context]').hide();
            console.info("Showing ", '#ct-' + $(this).attr('data-role-id') + '-page');
            $('#ct-' + $(this).attr('data-role-id') + '-page').show();
            var page = $('[data-db-id=' + $(this).attr('data-role-id') + ']');
            gsd.cont.currentContext = {
                id: parseInt(page.attr('data-db-id'), 10),
                name: page.attr('data-name')
            };

            
            // Highlight active context
            $('#contexts-list > li.active-context').removeClass('active-context');
            $(this).parents('li').addClass('active-context');
            //$('#contexts-list li[data-theme=e]').attr('data-theme', 'c');
            //$(this).parents('li').attr('data-theme', 'e');

            return false;
        });
};
gsd.rspd.init();