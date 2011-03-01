/*jslint browser: true, plusplus: false */
/*global window: false, document: false, $: false, console: false */

var gsd = gsd ? gsd : {};
gsd.rspd = gsd.view ? gsd.view : {};

gsd.rspd.init = function () {
    if ($.mobile.media("(max-width: 480px)")) {
        // Small layout - as sent to the client
        // Default JS, CSS, and HTML
    } else if ($.mobile.media("(min-width: 768px)")) {
        // Medium layout
        //- remove some data-role=page, reconfigure UI
        var ct_page = $("#ct--1-page").remove(),
            newNa;
        
        ct_page.removeAttr('data-role') // not a page
               .removeAttr('data-url'); // no need to go there

        ct_page.find('[data-role=content]').removeAttr('data-role');
        
        ct_page.find('[data-role=header], [data-role=footer]').remove();
        $('#contexts-page [data-role=content]').append(ct_page);
        $('#contexts-page [data-role=content]').addClass('ui-grid-a');
        $('#contexts-nav').addClass('ui-block-a');
        ct_page.addClass('ui-block-b');

        if (1 !== $('.na-new').size()) {
            //console.error("ASSERTION: We wanted to grab the one New Next Action button");
        } 

        newNa = $('.na-new').remove();
        newNa.attr('data-inset', 'true');
        newNa.attr('data-theme', 'b');
        newNa.addClass('ui-btn-right');

        $('#contexts-page [data-role=header]').append(newNa);
        gsd.rspd.mozCalcFixup = function () {
            // TODO test for -moz-calc and skip those browsers
            //  width: -moz-calc( 100% - 335px); 
            $('.ui-grid-a .ui-block-b').css('width', ($('.ui-grid-a').width() - 335) + 'px');
            //$('#about-page #hackers').css('width', ((window.innerWidth * 0.58) - 115) + 'px');
            $('#about-page #hackers').css('width', 
                Math.round(($('#about-page [data-role=content]').width() * 0.58) - 300) + 'px');
            //-moz-calc(100% - 58% - 115px);
        };
        gsd.rspd.mozCalcFixup();
        $(window).bind('resize', gsd.rspd.mozCalcFixup);

        gsd.rspd.contextsNav();
    } else {
        //console.info("HELP I DON'T KNOW my layout");
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
};

gsd.rspd.contextsNav = function () {
    $('#contexts-list li a').attr('href', '#')
        .live('click', function (e) {
            e.preventDefault();
            $('[data-page-type=context]').hide();
            $('#ct-' + $(this).attr('data-role-id') + '-page').show();

            var page = $('[data-db-id=' + $(this).attr('data-role-id') + ']');
            gsd.cont.currentContext = {
                id: parseInt(page.attr('data-db-id'), 10),
                name: page.attr('data-name')
            };
            // Highlight active context
            $('#contexts-list > li.active-context').removeClass('active-context');
            $(this).parents('li').addClass('active-context');
            return false;
        });
};
gsd.rspd.init();