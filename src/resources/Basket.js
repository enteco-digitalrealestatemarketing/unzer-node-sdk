'use strict';

const AbstractResource = require('./AbstractResource');

/**
 * A Basket represents the shopping cart (line items, totals). Required by some
 * payment methods and useful for reconciliation.
 */
class Basket extends AbstractResource {}

module.exports = Basket;
