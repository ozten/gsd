/* Much respekt to Optimistic Replication YASUSHI SAITO and MARC SHAPIRO 2005 */

/*
    Sync API
    var siteId = '2l3kj432kl';
    var precondition = function (operation) {};
    var resolveConflict = function (opcode, key, value) {};
    //sync = newSync(siteId, precondition, resolveConflict);
    var application = {
        precondition: function () {}, 
        commit
        resolveConflict};
    sync = newSync(siteId, application);
    sync.send(Sync.ADD, 'mystuff', 'record-3l4kj32l', {msg; 'Hello World!'});
    sync.send(Sync.PUT, 'mystuff', 'record-3l4kj32l', {msg; 'GULP!'});
    sync.send(Sync.DEL, 'mystuff', 'record-3l4kj32l');

 */

/* We are using Optimistic asynchronous replication which 
   copies an IndexedDb dataset in the background to other
   replicants via a centralized Unhosted node 

   All sites are master sites and can change replicas. There
   are no read only sites.

   Sync is Multi-master (instead of single-master)
           State Transfer at the record level (not fine grained OT)
           Scheduling is Syntactic, but taking IndexedDb API into account
           Conflict resolution is Syntactic
           Propagation is polling over a Star network
           Commitment is implicit by common knowlege due to star topology and thomas' write rule (wiki style)
*/

var replica = "A copy of the object stored at a site (this IndexedDb)";
var object = "A IndexedDb record";
var site = "An active web browsing Indexed session";
var masterSite = "A site that can add, update, and delete replicas";
var operation = "Description to an update to an object. Access to a replica, which is later propagated to other sites. An operation is a pre-condition which may detect a conflict plus a prescription to update the obejct.";

// tenative scheduling - sorting operations

// Commitment - performing operations on IndexedDb

var ABORT = 0; // Reject Operation
var clock = "Counter used to help sort operations";
var COMMIT = 1; // Apply Operation
var CONFLICT = 2; // A pre-condition is violated
var log = "A record of recent operations kept at each site";

//var propagate = ;
var resolver = "app provided procedure for resolving conflicts";
var schedule = "An ordered set of operations to execute";
var submit = "enter an operatio into the system, subject to tentative execution";
var TENTATIVE = true; // Operation applied on isolated replica: may be reordered or aborted

//TODO get rid of __proto__ and pick an inheritance patern
// probably Sync = function ...
// Sync.prototype = {
// sync: function (... return new Sync(...

/** 
 * Sync is IndexedDb/sqlite specific
 * Class level functions and properties
 */
window.Sync = {
    ADD: 0,
    PUT: 1,
    DEL: 2,
    noSuchOp: 3, // TODO make noop
}; // Sync

/**
 * precondition - Predicate defining the input domain of an operation
 *         function (operation) { return true; }
 */
var newSync = function (siteId, application/*precondition, commit, resolveConflict*/) {
    var o = {
        siteId: siteId,
        /* Assoc Array of site id to clocks */
        vc: {},
        app: {},
        happensBefore: function (opA, opB) {
            if (opA === Sync.noSuchOp) {
                // First op ever
                return true;
            } else if (opA.issuer === opB.issuer) {
                // Same node, queue gaurentees FIFO
                return true;
            } else if (opA.issuer !== opB.issuer &&
                       this.vcAfter(opB.vc, opA.vc)) {
                return true;
            } else if (this.findOperation(opA, opB) !== Sync.noSuchOp) {
                return true;
            }
        },
        opAfter: function (opA, opB) {
            console.info("OP AFTER???? \n", opA.issuer, this.printVC(opA.vc), 
                         'with\n', opB.issuer, this.printVC(opB.vc), opA.vc);
            if (this.opEqual(opA, opB)) {
                return false;
            }
            return this.vcAfter(opA.vc, opB.vc);
        },
        vcAfter: function (vcA, vcB) {
            console.info("VC AFTER???? \n", vcA.issuer, this.printVC(vcA), 
                         'with\n', this.printVC(vcB), vcA);
            // Are any of vcB's sites newer than ours?
            return dominates(vcA, vcB);
        },
        opEqual: function (opA, opB) {
            // we don't check key or value... we could
            return opA.issuer == opB.issuer &&
                   opA.cmd == opB.cmd &&
            vcEqual(opA.vc, opB.vc);
        },        
        printVC: function (vc) {
            var s = "";
            for (k in vc) {
                s += k + "=" + vc[k] + ', ';
            }
            return s;
        },
        /**
         * Finds an operation opY where opA.clock is before opY.clock and
         * y.clock is before opB.clock
         * 
         * @return boolean - True if this exists, false otherwise
         */
        findOperation: function (opA, opB) {
            // Go backwards through log looking for an operation that
            // satisfies this contraint. Give up if opY.clock is before opA
            // + operation padding, or if opY.clock is before opB (??)
            var opLog =  this.app.getLog();
            // TODO: API DESIGN: does sync need to keep a copy of this log or
            // is that an app thing?
            for (var i = opLog.length - 1; i >= 0; i--) {
                var opY = opLog[i];
                if (this.opEqual(opY, opA) || this.opEqual(opY, opB)) {
                    continue;
                }
                if (this.opAfter(opY, opA) &&
                    this.opAfter(opB, opY)) {
                    // opY proves opA came before opB
                    return opY;
                }
            }
            return Sync.noSuchOp;
        },

        CHARS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),

        /** http://www.broofa.com/2008/09/javascript-uuid-function/ */
        uuid4: function (len, radix) {
            var chars = CHARS, uuid = [];
            radix = radix || chars.length;

            if (len) {
                // Compact form
                for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
            } else {
                // rfc4122, version 4 form
                var r;

                // rfc4122 requires these characters
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                // Fill in random data.  At i==19 set the high bits of clock sequence as
                // per rfc4122, sec. 4.1.5
                for (var i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random()*16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }

            return uuid.join('');
        },

        /** TODO move to another module? */
        loadVC: function () {
            if (!!localStorage['/sync/vc']) {
                this.vc = JSON.parse(localStorage['/sync/vc']);
            } else {
                localStorage['/sync/vc'] = JSON.stringify(vc);
            }
        },

        /** TODO move to another module? */
        loadSiteId: function () {
            if ('localStorage' in window && window['localStorage'] != null) {
                if(!!localStorage['/sync/site-id']) {
                    this.siteId = localStorage['site-id'];
                } else {
                    localStorage['/sync/site-id'] = this.siteId = uuid4(8);
                }
            } else {
                throw Exception("Uhm no localStorage, this ain't gonna work");
            }
        },

        /**
         * Process an operation from a remote site
         */
        receiveUpdate: function (op) {
            // ops come in FIFO from Unhosted queue
            // within a site, ops are ordered FIFO
            // between sites, no order is gaurenteed
            console.info("receivingg updates... updating clocks", this.siteId);
            // Couldn't this wipe out our clock?
            // maybe try to apply before updating this.vc...
            if (op.issuer !== this.siteId &&
                this.apply(op)) {
                this.vc[op.issuer] = op.vc[op.issuer];
            }
        },

        send: function (opCode, objectStore, keyPath, value) {
            var op = newOperation(this.siteId, opCode, objectStore, keyPath, value);
            this.submitOperation(op);
            // Simulates global op log
            this.globalOperationLog.push(op);
        },

        /**
         * Allows this site to submit a new operation.
         *
         * Eventually sends op to other sites.
         */
        submitOperation: function (op) {
            console.info("SubmitOperation ", this.vc);
            this.vc[this.siteId] = this.vc[siteId] + 1;

            op.issuer = this.siteId;
            console.info("VC should have both clocks", this.siteId, this.vc);
            op.vc = this.vc;
            this.propagate(op);
        },

        /**
         * Transfer an operation to all sites
         * Asynchronous... eventual consistency
         *
         * Override me to testing
         */
        propagate: function (op) {
            // TODO queue then post ...
            // This will be provided via Unhosted
        },

        /**
         *
         */
        poll: function () {
            // TODO Check Sync server for updates
        },

        poller: function () {
            /* TODO
               poll();
               setTimeout(poll, 1000 * 30);
            */
        },
        globalOperationLog: [],
        
        apply: function (op) {
            // Scheduling:
            // semantic scheduling - commutativity instead or with happensbefore
            // op on different IndexedDb objectstore/keyPath values commute and
            // can be executed in any order

            // Conflicts:
            // happendsBefore (or other) to detect conflicts

            // preconditions - put, delete - object must exist
            // preconditions - add - object must not exist
            //var schedule = function () {
            if (this.app.precondition(op)) {
                printOp('precond lastop=', this.app.lastOp()); 
                printOp('precond this op=', op);
                if (this.happensBefore(this.app.lastOp(), op)) {
                    this.app.commit(op);
                    return true;
                } else {
                    /*
                      var resolve = function (op, futureOps) {
                      //Thomas' write rule - FIFO - lost update 
                      };
                    */
                    console.info("Calling resolveConflict");
                    this.app.resolveConflict(op);
                    // ouch
                }
            } else {
                // ouch
                console.info("Precondition failed");
                this.app.resolveConflict(op);
            }
            return false;
        },

    };
    o.vc[o.siteId] = 0;
    //o.__proto__ = Sync;
    o.app = application;
    // Start your engines...
    o.poller();
    return o;
}; // newSync

    // Option attach vector clocks to each object, instead of at the site level...


// Propagation
var newOperation = function (siteId, opCode, objectStore, keyPath, value) {
    // Our operation ADT
    var op = {
        issuer: siteId, // siteId
        vc: {}, // vector clock
        cmd: opCode,
        os: objectStore,
        //keyPath or SHA1 hash? maybe keys are meaningless across sites?
        key: keyPath, 
        value: value,
    };
    return op;
};



