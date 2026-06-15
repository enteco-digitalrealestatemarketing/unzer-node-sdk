'use strict';

const AbstractTransaction = require('./AbstractTransaction');

/**
 * A Charge transfers money from the customer to the merchant. It results either
 * from a direct charge or from capturing an existing authorization.
 */
class Charge extends AbstractTransaction {
  /** Cancels (refunds) this charge. Pass an amount for a partial refund. */
  cancel(amount) {
    return this._unzer.cancelCharge(this.getPaymentId(), this.getId(), amount);
  }
}

module.exports = Charge;
