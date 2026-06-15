'use strict';

const BasePaymentType = require('./BasePaymentType');

/** Sofort (Klarna) payment type. */
class Sofort extends BasePaymentType {
  apiName() {
    return 'sofort';
  }
}

module.exports = Sofort;
