'use strict';

/**
 * Unzer payment states.
 * See: https://docs.unzer.com/server-side-integration/api-basics/payment-states/
 */
const STATE_NAME = {
  0: 'pending',
  1: 'completed',
  2: 'canceled',
  3: 'partly',
  4: 'payment review',
  5: 'chargeback',
  6: 'create',
};

const STATE = {
  PENDING: 0,
  COMPLETED: 1,
  CANCELED: 2,
  PARTLY: 3,
  PAYMENT_REVIEW: 4,
  CHARGEBACK: 5,
  CREATE: 6,
};

module.exports = { STATE, STATE_NAME };
