'use strict';

/**
 * Relative paths for the Unzer Direct API resources (appended to the base URL,
 * e.g. https://api.unzer.com/v1).
 *
 * See: https://docs.unzer.com/server-side-integration/direct-api-integration/manage-api-resources/
 */
module.exports = {
  // Collections
  AUTHORIZE: 'payments/authorize',
  CHARGES: 'payments/charges',
  PAYOUTS: 'payments/payouts',
  CUSTOMERS: 'customers',
  BASKETS: 'baskets',
  METADATA: 'metadata',
  WEBHOOKS: 'webhooks',
  KEYPAIR: 'keypair',

  // Payment / transaction resources
  payment: (paymentId) => `payments/${paymentId}`,
  authorization: (paymentId) => `payments/${paymentId}/authorize`,
  charge: (paymentId, chargeId) => `payments/${paymentId}/charges/${chargeId}`,
  paymentCharges: (paymentId) => `payments/${paymentId}/charges`,
  authorizeCancels: (paymentId) => `payments/${paymentId}/authorize/cancels`,
  chargeCancels: (paymentId, chargeId) =>
    `payments/${paymentId}/charges/${chargeId}/cancels`,

  // Other resources
  customer: (id) => `customers/${id}`,
  basket: (id) => `baskets/${id}`,
  metadataItem: (id) => `metadata/${id}`,
  types: (name) => `types/${name}`,
  type: (id) => `types/${id}`,
  webhook: (id) => `webhooks/${id}`,
};
