'use strict';

/**
 * Relative paths for the Unzer Direct API resources (appended to the base URL,
 * e.g. https://api.unzer.com/v1).
 *
 * See: https://docs.unzer.com/server-side-integration/direct-api-integration/manage-api-resources/
 */
// Resource IDs are interpolated into request paths; encode them so an unusual
// or (for the webhook-supplied paymentId) attacker-influenced value cannot break
// out of its path segment. Legitimate Unzer IDs (alphanumeric + hyphen) are
// unchanged by encodeURIComponent.
const enc = encodeURIComponent;

module.exports = {
  // Collections
  AUTHORIZE: 'payments/authorize',
  CHARGES: 'payments/charges',
  CUSTOMERS: 'customers',
  BASKETS: 'baskets',
  METADATA: 'metadata',
  WEBHOOKS: 'webhooks',

  // Payment / transaction resources
  payment: (paymentId) => `payments/${enc(paymentId)}`,
  authorization: (paymentId) => `payments/${enc(paymentId)}/authorize`,
  charge: (paymentId, chargeId) =>
    `payments/${enc(paymentId)}/charges/${enc(chargeId)}`,
  paymentCharges: (paymentId) => `payments/${enc(paymentId)}/charges`,
  authorizeCancels: (paymentId) => `payments/${enc(paymentId)}/authorize/cancels`,
  chargeCancels: (paymentId, chargeId) =>
    `payments/${enc(paymentId)}/charges/${enc(chargeId)}/cancels`,

  // Other resources
  customer: (id) => `customers/${enc(id)}`,
  basket: (id) => `baskets/${enc(id)}`,
  metadataItem: (id) => `metadata/${enc(id)}`,
  types: (name) => `types/${enc(name)}`,
  type: (id) => `types/${enc(id)}`,
  webhook: (id) => `webhooks/${enc(id)}`,
};
