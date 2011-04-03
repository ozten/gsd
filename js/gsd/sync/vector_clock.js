/* Parker et al Detection of Mutual Inconsistency in Distributed Systems */

var dominates = function (vc1, vc2) {
    for (var s in vc1) {
        var v = vc2[s] ? vc2[s] : 0;
        if (vc1[s] < v) {
            return false;
        }
    }
    for (var s in vc2) {
        if (vc1[s] === undefined) {
            return false;
        }
    }
    return true;
};

var conflicts = function (vc1, vc2) {
    if (! dominates(vc1, vc2) &&
        ! dominates(vc2, vc1) &&
        ! vcEqual(vc1, vc2)) {
        return true;
    }
    return false;
};

var vcEqual = function (vcA, vcB) {
    for (k in vcA) {
        if (vcA[k] !== vcB[k]) {
            return false;
        }
    }
    for (k in vcB) {
        if (vcB[k] !== vcA[k]) {
            return false;
        }
    }
    return true;
};