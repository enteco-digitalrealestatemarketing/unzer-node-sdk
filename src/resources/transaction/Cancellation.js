'use strict';

const AbstractTransaction = require('./AbstractTransaction');

/**
 * A Cancellation is the result of reversing an authorization or refunding a
 * charge.
 */
class Cancellation extends AbstractTransaction {}

module.exports = Cancellation;
