'use strict';

/**
 * Base class for payment types (Card, PayPal, Sofort, EPS, ...).
 *
 * A payment type is created via `POST /types/{apiName}` and yields a `typeId`
 * (e.g. `s-crd-...`) that is then referenced in authorize/charge requests.
 */
class BasePaymentType {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  /** The URL segment used when creating this type, e.g. "card", "paypal". */
  apiName() {
    throw new Error('BasePaymentType: apiName() must be implemented by subclass.');
  }

  getId() {
    return this.id || null;
  }

  toApiPayload() {
    const out = {};
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'function') continue;
      out[key] = value;
    }
    return out;
  }
}

module.exports = BasePaymentType;
