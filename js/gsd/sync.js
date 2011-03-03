/* Much respekt to Optimistic Replication YASUSHI SAITO and MARC SHAPIRO 2005 */

/* We are using Optimistic asynchronous replication which 
   copies an IndexedDb dataset in the background to other
   replicants via a centralized Unhosted node 

   All sites are master sites and can change replicas. There
   are no read only sites.

   Sync is Multi-master (instead of single-master)
           State Transfer at the record level (not fine grained OT)
           Scheduling is Syntactic, but taking IndexedDb API into account
           Conflict resolution is Syntactic
           Propogation is polling over a Star network
           Commitment is implicit by common knowlege due to star topology and thomas' write rule (wiki style)
*/

var replica = "A copy of the object stored at a site (this IndexedDb)";
var object = "A IndexedDb record";
var site = "An active web browsing Indexed session";
var masterSite = "A site that can add, update, and delete replicas";
var operation = "Description to an update to an object. Access to a replica, which is later propogated to other sites. An operation is a pre-condition which may detect a conflict plus a prescription to update the obejct.";

// tenative scheduling - sorting operations

// Commitment - performing operations on IndexedDb

var ABORT = 0; // Reject Operation
var clock = "Counter used to help sort operations";
var COMMIT = 1; // Apply Operation
var CONFLICT = 2; // A pre-condition is violated
var log = "A record of recent operations kept at each site";
var precondition = "Predicate defining the input domain of an operation";
var propogate = "Transfer an operation to all sites";
var resolver = "app provided procedure for resolving conflicts";
var schedule = "An ordered set of operations to execute";
var submit = "enter an operatio into the system, subject to tentative execution";
var TENTATIVE = true; // Operation applied on isolated replica: may be reordered or aborted

var happensBefore = function (opA, opB) {
    if (opA.site === opB.site) {
        return true;
    } else if (opA.site !== opB.site &&
               after(opB.clock, opA.executed)) {
        return true;
    } else if (findOperation(opA, opB)) {
        return true;
    }
};

/**
 * Finds an operation opY where opA.clock is before opY.clock and
 * y.clock is before opB.clock
 * 
 * @return boolean - True if this exists, false otherwise
 */
var findOperation = function (opA, opB) {
    // Go backwards through log looking for an operation that
    // satisfies this contraint. Give up if opY.clock is before opA
    // + operation padding, or if opY.clock is before opB (??)
}

var vectorClock = {
    site: 'foo',
    clock: 0,
    date: 12345678 // Used for conflict resolution ? optional ?
};

var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); 

var uuid4 = function (len, radix) {
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
  };
uuid4();

var siteId;

var loadSiteId = function () {
    if ('localStorage' in window && window['localStorage'] != null) {
        if(!!localStorage['/sync/site-id']) {
            siteId = localStorage['site-id'];
        } else {
            localStorage['/sync/site-id'] = siteId = uuid4(8);
        }
    } else {
        throw Exception("Uhm no localStorage, this ain't gonna work");
    }
};

/* Assoc Array of site id to clocks */
var vc = {};
var loadVC = function () {
    if (!!localStorage['/sync/vc']) {
        vc = JSON.parse(localStorage['/sync/vc']);
    } else {
        localStorage['/sync/vc'] = JSON.stringify(vc);
    }
};

/**
 * Allows this site to submit a new operation.
 *
 * Eventually sends op to other sites.
 */
var submitOperation = function (op) {
    if (!! vc[siteId]) {
        vc[siteId] = parseInt(vc[siteId], 10) + 1;
    } else {
        vc[siteId] = 0;
    }
    op.issuer = siteId;
    op.vc = vc;
    propagate(op);
}
/**
 * Process an operation from a remote site
 */
var receiveUpdate = function (op) {
    // ops come in FIFO from Unhosted queue
    // within a site, ops are ordered FIFO
    // between sites, no order is gaurenteed
    vc[op.issuer] = op.vc[issuer];
    apply(op);
}

/**
 * eventually sends op to other sites
 */
var propagate = function (op) {
    // ...
}

var apply = function (op) {

};

// Scheduling:
    // semantic scheduling - commutativity instead or with happensbefore
    // op on different IndexedDb objectstore/keyPath values commute and
    // can be executed in any order

    // Conflicts:
    // happendsBefore (or other) to detect conflicts

    // preconditions - put, delete - object must exist
    // preconditions - add - object must not exist
var schedule = function () {
    if (precondition(op)) {
        if (happendsbefore(lastOp, op)) {
    
        } else {
            resolve(op);
            // ouch
        }
    } else {
        // ouch
        resolve(op);
    }
};

    var resolve = function (op, futureOps) {
        //Thomas' write rule - FIFO - lost update 
    };

    // Option attach vector clocks to each object, instead of at the site level...

var ADD = 0;
var PUT = 1;
var DEL = 2;

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

var log = []; // List of operation

