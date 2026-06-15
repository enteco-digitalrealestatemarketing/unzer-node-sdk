'use strict';

/**
 * Webhook events that can be registered with the Unzer API.
 * See: https://docs.unzer.com/server-side-integration/api-basics/webhooks/
 */
module.exports = {
  ALL: 'all',

  AUTHORIZE: 'authorize',
  AUTHORIZE_SUCCEEDED: 'authorize.succeeded',
  AUTHORIZE_FAILED: 'authorize.failed',
  AUTHORIZE_CANCELED: 'authorize.canceled',

  CHARGE: 'charge',
  CHARGE_SUCCEEDED: 'charge.succeeded',
  CHARGE_FAILED: 'charge.failed',
  CHARGE_CANCELED: 'charge.canceled',

  PAYMENT: 'payment',
  PAYMENT_PENDING: 'payment.pending',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_CANCELED: 'payment.canceled',
  PAYMENT_PARTLY: 'payment.partly',
  PAYMENT_REVIEW: 'payment.payment_review',
  PAYMENT_CHARGEBACK: 'payment.chargeback',

  TYPES: 'types',
  CUSTOMER: 'customer',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
};
