var printOp = function (msg, l) {
    if (! l) return;
    if (l.cmd === Sync.ADD) {
        console.info(msg, l.issuer, ' ADD ', l.key, '=', l.value.name);
    } else if (l.cmd === Sync.PUT) {
        console.info(msg, l.issuer, ' PUT ', l.key, '=', l.value.name);
    } else if (l.cmd === Sync.DEL) {
        console.info(msg, l.issuer, ' DEL ', l.key);
    }
};

/* Simulate our Unhosted server */
log = []; // List of operation
/* Simulate a local computer aka site */
var site = {
    // Sync Public
    precondition: function (op) {
        switch (op.cmd) {
        case Sync.ADD:
            return ! this.indexedDb[op.os][op.key];
        case Sync.PUT:
            return !! this.indexedDb[op.os][op.key];
        case Sync.DEL:
            return !! this.indexedDb[op.os][op.key];
        default:
            throw Exception("Unknown opcode");
        }
    },
    // Successfully applied operations log
    operationLog: [],
    lastOp: function () { 
        var ops = this.operationLog;
        return ops.length > 0 ? ops[ops.length -1] : Sync.noSuchOp; 
    },
    resolveConflict: function (operation) {
        printOp('CONFLICT', operation);
        // update our view of the world?
        // log, vc...
        this.operationLog.pop();
        this.conflicts.push(operation);
    },
    // DB Public (get ride of commit??
    commit: function (op) {
        // Not the global log, just our local view into consistency
        this.operationLog.push(op);
        switch (op.cmd) {
        case Sync.ADD:
            this.localAdd(op.os, op.key, op.value);
            break;
        case Sync.PUT:
            this.localPut(op.os, op.key, op.value);
            break;
        case Sync.DEL:
            this.localDelete(op.os, op.key);
            break;
        default:
            throw Exception("Unknown opcode");
        }
    },
    localAdd: function (os, key, value) {
        ok(!this.indexedDb[os][key], os + ':' + key + " should not exist yet");
        var o = $.extend(true, {}, value);
        this.indexedDb[os][key] = o;
    },
    localPut: function (os, key, value) {
        ok(!!this.indexedDb[os][key], os + ':' + key + " should exist");
        var o = $.extend(true, {}, value);
        this.indexedDb[os][key] = o;
    },
    localDelete: function (os, key) {
        ok(!!this.indexedDb[os][key], os + ':' + key + " should exist");
        delete this.indexedDb[os][key];
    },
    getLog: function () { return this.operationLog; },

    logCount: 0,

    /* Simulate the global update log */
    pollForUpdates: function () {
        for (; this.logCount < log.length; this.logCount++) {
            this.sync.receiveUpdate(log[this.logCount]);
        }
    }
};

var newSite = function (siteId) {
    var a = {
        siteId: siteId,
        // Simulate the IndexedDb
        indexedDb: {},
        sync: null,
        // Simulate application
        conflicts: [],
    };
    a.__proto__ = site;
    a.sync = newSync(siteId, a /*site.precondition, site.commit, site.resolveConflict*/);
    a.sync.connected = true;
    return a;
};


// Replicants
var a = newSite('siteA');
var b = newSite('siteB');

var propagate = function (op) {
    log.push(op);
};
a.sync.propagate = propagate;
b.sync.propagate = propagate;

var poller = function () {}; // Disabled for tests

a.sync.poller = poller;
b.sync.poller = poller;

// IndexedDb Object Store
var os = 'contexts'; 

a.indexedDb[os] = {};
b.indexedDb[os] = {};

var resetSimulation = function () {
    log = [];

/*    a = newSite('siteA');
    b = newSite('siteB');
*/
    a.logCount = 0;
    b.logCount = 0;
    a.indexedDb[os] = {};
    b.indexedDb[os] = {};

};
var arrayKeyLengthEqual = function (a, len, msg) {
    var i = 0, k;
    for (k in a) {
        i++;
    }
    equal(i, len, msg);
};