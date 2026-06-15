'use strict';

/**
 * Error thrown when the Unzer API returns an error response (non-2xx status,
 * or a 2xx body that contains an `errors` array).
 *
 * Mirrors the error structure used by the Unzer PHP/Java SDKs, exposing the
 * merchant- and customer-facing messages and the Unzer error code.
 */
class UnzerApiError extends Error {
  constructor({ statusCode, body, raw } = {}) {
    const errors = (body && Array.isArray(body.errors) && body.errors) || [];
    const first = errors[0] || {};
    const message =
      first.merchantMessage ||
      first.customerMessage ||
      (raw
        ? `Unzer API error (HTTP ${statusCode}): ${raw}`
        : `Unzer API error (HTTP ${statusCode})`);

    super(message);

    this.name = 'UnzerApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = first.code || null;
    this.merchantMessage = first.merchantMessage || null;
    this.customerMessage = first.customerMessage || null;
    this.id = (body && body.id) || null;
    this.body = body || null;
  }
}

module.exports = UnzerApiError;
