'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const Unzer = require('../../src');

const KEY = process.env.UNZER_PRIVATE_KEY;

// These tests hit the real Unzer sandbox and only run when UNZER_PRIVATE_KEY is
// set. Run with: UNZER_PRIVATE_KEY=s-priv-... npm run test:integration
test(
  'authorize -> fetch -> partial capture -> refund against sandbox',
  { skip: !KEY && 'set UNZER_PRIVATE_KEY to run sandbox integration tests' },
  async () => {
    const unzer = new Unzer(KEY);

    // A test card type id can be created with Unzer UI Components in a browser,
    // or via createPaymentType with sandbox test card data.
    const card = await unzer.createPaymentType(
      new (require('../../src').Card)({
        number: '4711100000000000',
        expiryDate: '03/30',
        cvc: '123',
      })
    );
    assert.ok(card.id, 'expected a typeId');

    const auth = await unzer.authorize({
      amount: '100.00',
      currency: 'EUR',
      returnUrl: 'https://example.com/return',
      typeId: card.id,
    });
    assert.ok(auth.getPaymentId());

    const payment = await unzer.fetchPayment(auth.getPaymentId());
    assert.equal(payment.getPaymentId(), auth.getPaymentId());

    const charge = await unzer.chargeAuthorization(auth.getPaymentId(), '60.00');
    assert.ok(charge.getId());

    const refund = await unzer.cancelCharge(
      auth.getPaymentId(),
      charge.getId(),
      '10.00'
    );
    assert.ok(refund);
  }
);
