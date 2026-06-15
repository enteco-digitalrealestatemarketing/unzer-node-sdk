'use strict';

const AbstractTransaction = require('./AbstractTransaction');

/**
 * An Authorization reserves (holds) an amount on the customer's payment method
 * without transferring funds yet. It is later captured via `charge()` or
 * released via `cancel()` (reversal).
 */
class Authorization extends AbstractTransaction {
  /** Captures the authorized amount. Pass an amount for a partial capture. */
  charge(amount) {
    return this._unzer.chargeAuthorization(this.getPaymentId(), amount);
  }

  /** Reverses the authorization. Pass an amount for a partial reversal. */
  cancel(amount) {
    return this._unzer.cancelAuthorization(this.getPaymentId(), amount);
  }
}

module.exports = Authorization;
