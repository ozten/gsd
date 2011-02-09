var gsd = gsd ? gsd : {};

gsd.idify = function (context) {
    if (!! context ) {
        return context.replace(' ', '_');
    } else {
        return 'unknown-context';
    }
};// end idify