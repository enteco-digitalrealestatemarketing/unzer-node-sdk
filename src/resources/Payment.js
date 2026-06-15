'use strict';

const AbstractResource = require('./AbstractResource');

/**
 * The Payment resource is the container that groups all transactions
 * (authorizations, charges, cancellations, shipments) belonging to one order.
 */
class Payment extends AbstractResource {
  getPaymentId() {
    return this.id || (this.resources && this.resources.paymentId) || null;
  }

  getState() {
    return this.state || null;
  }

  getAmount() {
    return this.amount || null;
  }

  /** Captures (charges) the open authorization of this payment. Amount optional → full capture. */
  charge(amount) {
    return this._unzer.chargeAuthorization(this.getPaymentId(), amount);
  }

  /** Cancels (reverses) the open authorization of this payment. Amount optional → full reversal. */
  cancelAuthorization(amount) {
    return this._unzer.cancelAuthorization(this.getPaymentId(), amount);
  }
}

module.exports = Payment;
