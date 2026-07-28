'use strict';

/**
 * Base class for all Unzer resources/models.
 *
 * Holds the API response fields directly on the instance (so consumers can read
 * `payment.amount`, `charge.redirectUrl`, etc.) and keeps a non-enumerable
 * reference to the owning {@link Unzer} client so resources can offer
 * convenience methods (e.g. `charge.cancel()`), matching the Unzer PHP/Java SDKs.
 */
class AbstractResource {
  constructor(data = {}, unzer = null) {
    Object.defineProperty(this, '_unzer', {
      value: unzer,
      enumerable: false,
      writable: true,
    });
    Object.assign(this, data);
  }

  getId() {
    return this.id || null;
  }

  /** Serializes the resource into a plain request payload (drops internals and nullish values). */
  toApiPayload() {
    const out = {};
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined || value === null) continue;
      out[key] = value;
    }
    return out;
  }
}

module.exports = AbstractResource;
