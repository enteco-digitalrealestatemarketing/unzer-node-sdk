'use strict';

const AbstractResource = require('./AbstractResource');

/**
 * A Customer resource stores the buyer's data (name, contact, billing/shipping
 * address). Some payment methods (e.g. invoice, instalment) require it.
 */
class Customer extends AbstractResource {}

module.exports = Customer;
