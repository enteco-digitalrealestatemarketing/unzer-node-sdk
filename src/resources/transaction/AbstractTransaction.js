'use strict';

const AbstractResource = require('../AbstractResource');

/**
 * Base class for transaction resources (Authorization, Charge, Cancellation).
 *
 * Transaction responses carry status flags (`isSuccess`, `isPending`,
 * `isError`), an optional `redirectUrl` (e.g. for 3DS / redirect payment
 * methods) and a nested `resources` object that contains the `paymentId`.
 */
class AbstractTransaction extends AbstractResource {
  getPaymentId() {
    return (this.resources && this.resources.paymentId) || this.paymentId || null;
  }

  getRedirectUrl() {
    return this.redirectUrl || null;
  }

  succeeded() {
    return this.isSuccess === true;
  }

  pending() {
    return this.isPending === true;
  }

  errored() {
    return this.isError === true;
  }
}

module.exports = AbstractTransaction;
