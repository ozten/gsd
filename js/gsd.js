var gsd = gsd ? gsd : {};

gsd.idify = function (context) {
    if (!! context && context.replace && typeof context.replace == "function") {
        return context.replace(' ', '_');
    } else {
        return 'unknown-context';
    }
};// end idify