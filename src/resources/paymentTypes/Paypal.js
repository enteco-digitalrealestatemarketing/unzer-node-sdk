'use strict';

const BasePaymentType = require('./BasePaymentType');

/** PayPal payment type. */
class Paypal extends BasePaymentType {
  apiName() {
    return 'paypal';
  }
}

module.exports = Paypal;
