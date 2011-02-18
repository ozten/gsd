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
        gsd.rspd.contextsNav();
    } else {
        console.info("HELP I DON'T KNOW my layout");
    }
    // else if max-width < 1025
    // Large layout (future, TBD)

};
gsd.rspd.isNotSmallLayout = function () {
    return ! $.mobile.media("(max-width: 480px)");
}
gsd.rspd.contextsNav = function () {
    console.info("XXXXXXXXXXXXXXXXXXXXXXXXXXXX", $('#contexts-list li a'));
    $('#contexts-list li a').attr('href', '#')
        .live('click', function (e) {
            e.preventDefault();
            console.info("XXXXXXXXXXXXXXXXXXXXXXXXXXXX", $(this).attr('data-role-id'));
            $('[data-page-type=context]').hide();
            $('#ct-' + $(this).attr('data-role-id') + '-page').show();
            return false;
        });
};
gsd.rspd.init();