'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const Unzer = require('../src');
const { UnzerApiError, Card, Webhook, Customer, HttpClient } = require('../src');
const { mockFetch } = require('./helpers');

const PRIV = 's-priv-test1234567890';

function client(responses) {
  const { fetchImpl, calls } = mockFetch(responses);
  const unzer = new Unzer(PRIV, { fetchImpl, baseUrl: 'https://api.unzer.com/v1' });
  return { unzer, calls };
}

test('constructor requires a private key', () => {
  assert.throws(() => new Unzer(undefined, { fetchImpl: () => {} }), /private key/i);
});

test('sets Basic auth header with base64("privateKey:")', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-1' } });
  await unzer.fetchPayment('s-pay-1');

  const expected = 'Basic ' + Buffer.from(`${PRIV}:`).toString('base64');
  assert.equal(calls[0].headers.Authorization, expected);
  assert.equal(calls[0].headers.Accept, 'application/json');
});

test('authorize posts to /payments/authorize and nests resources', async () => {
  const { unzer, calls } = client({
    body: {
      id: 's-aut-1',
      isSuccess: true,
      isPending: false,
      redirectUrl: 'https://pay.unzer.com/redirect',
      resources: { paymentId: 's-pay-1', typeId: 's-crd-1' },
    },
  });

  const auth = await unzer.authorize({
    amount: 119,
    currency: 'EUR',
    returnUrl: 'https://example.com/return',
    typeId: 's-crd-1',
    customerId: 's-cst-1',
    orderId: 'order-42',
  });

  assert.equal(calls[0].method, 'POST');
  assert.match(calls[0].url, /\/payments\/authorize$/);
  assert.deepEqual(calls[0].body, {
    amount: '119',
    currency: 'EUR',
    returnUrl: 'https://example.com/return',
    orderId: 'order-42',
    resources: { typeId: 's-crd-1', customerId: 's-cst-1' },
  });

  assert.equal(auth.getPaymentId(), 's-pay-1');
  assert.equal(auth.getRedirectUrl(), 'https://pay.unzer.com/redirect');
  assert.equal(auth.succeeded(), true);
});

test('chargeAuthorization without amount posts empty body (full capture)', async () => {
  const { unzer, calls } = client({ body: { id: 's-chg-1', isSuccess: true } });
  const charge = await unzer.chargeAuthorization('s-pay-1');

  assert.equal(calls[0].method, 'POST');
  assert.match(calls[0].url, /\/payments\/s-pay-1\/charges$/);
  assert.deepEqual(calls[0].body, {});
  assert.equal(charge.getId(), 's-chg-1');
});

test('chargeAuthorization with amount sends partial capture amount as string', async () => {
  const { unzer, calls } = client({ body: { id: 's-chg-1' } });
  await unzer.chargeAuthorization('s-pay-1', 59.5);
  assert.deepEqual(calls[0].body, { amount: '59.5' });
});

test('cancelAuthorization posts to authorize/cancels (reversal)', async () => {
  const { unzer, calls } = client({ body: { id: 's-cnl-1' } });
  await unzer.cancelAuthorization('s-pay-1', 10);
  assert.match(calls[0].url, /\/payments\/s-pay-1\/authorize\/cancels$/);
  assert.deepEqual(calls[0].body, { amount: '10' });
});

test('cancelCharge posts to charges/{id}/cancels (refund)', async () => {
  const { unzer, calls } = client({ body: { id: 's-cnl-2' } });
  await unzer.cancelCharge('s-pay-1', 's-chg-1', 5);
  assert.match(calls[0].url, /\/payments\/s-pay-1\/charges\/s-chg-1\/cancels$/);
  assert.deepEqual(calls[0].body, { amount: '5' });
});

test('charge convenience method cancels via the owning client', async () => {
  const { unzer, calls } = client([
    { body: { id: 's-chg-1', resources: { paymentId: 's-pay-1' } } },
    { body: { id: 's-cnl-1' } },
  ]);

  const charge = await unzer.charge({ amount: 10, currency: 'EUR', typeId: 's-crd-1' });
  await charge.cancel(4);

  assert.match(calls[0].url, /\/payments\/charges$/);
  assert.match(calls[1].url, /\/payments\/s-pay-1\/charges\/s-chg-1\/cancels$/);
  assert.deepEqual(calls[1].body, { amount: '4' });
});

test('createOrUpdateCustomer POSTs when no id, PUTs when id present', async () => {
  const { unzer, calls } = client([
    { body: { id: 's-cst-1' } },
    { body: { id: 's-cst-1' } },
  ]);

  await unzer.createOrUpdateCustomer({ firstname: 'Max', lastname: 'Muster' });
  assert.equal(calls[0].method, 'POST');
  assert.match(calls[0].url, /\/customers$/);

  await unzer.createOrUpdateCustomer({ id: 's-cst-1', lastname: 'Neu' });
  assert.equal(calls[1].method, 'PUT');
  assert.match(calls[1].url, /\/customers\/s-cst-1$/);
  assert.equal(calls[1].body.id, undefined, 'id must not be in the PUT body');
  assert.equal(calls[1].body.lastname, 'Neu');
});

test('createBasket / createMetadata post to their collections', async () => {
  const { unzer, calls } = client([
    { body: { id: 's-bsk-1' } },
    { body: { id: 's-mtd-1' } },
  ]);

  await unzer.createBasket({ totalValueGross: '100', currencyCode: 'EUR' });
  await unzer.createMetadata({ orderUID: 'abc-123' });

  assert.match(calls[0].url, /\/baskets$/);
  assert.match(calls[1].url, /\/metadata$/);
  assert.deepEqual(calls[1].body, { orderUID: 'abc-123' });
});

test('createPaymentType posts to /types/{apiName} without id', async () => {
  const { unzer, calls } = client({ body: { id: 's-crd-1' } });
  const card = new Card({ id: 'should-be-stripped', brand: 'VISA' });
  const res = await unzer.createPaymentType(card);

  assert.match(calls[0].url, /\/types\/card$/);
  assert.equal(calls[0].body.id, undefined);
  assert.equal(calls[0].body.brand, 'VISA');
  assert.equal(res.id, 's-crd-1');
});

test('webhook helpers: create, fetch all, delete', async () => {
  const { unzer, calls } = client([
    { body: { id: 's-whk-1', url: 'https://e.com/hook', event: 'charge' } },
    { body: { events: [{ id: 's-whk-1' }, { id: 's-whk-2' }] } },
    { body: {} },
  ]);

  const hook = await unzer.createWebhook('https://e.com/hook', 'charge');
  assert.equal(hook.id, 's-whk-1');
  assert.deepEqual(calls[0].body, { url: 'https://e.com/hook', event: 'charge' });

  const all = await unzer.fetchAllWebhooks();
  assert.equal(all.length, 2);

  await unzer.deleteWebhook('s-whk-1');
  assert.equal(calls[2].method, 'DELETE');
  assert.match(calls[2].url, /\/webhooks\/s-whk-1$/);
});

test('fetchResourceFromEvent re-fetches via retrieveUrl', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-1', state: { id: 1 } } });
  const resource = await unzer.fetchResourceFromEvent({
    event: 'charge.succeeded',
    paymentId: 's-pay-1',
    retrieveUrl: 'https://api.unzer.com/v1/payments/s-pay-1',
  });

  assert.equal(calls[0].url, 'https://api.unzer.com/v1/payments/s-pay-1');
  assert.equal(resource.id, 's-pay-1');
});

test('fetchResourceFromEvent falls back to paymentId', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-9' } });
  await unzer.fetchResourceFromEvent({ event: 'charge', paymentId: 's-pay-9' });
  assert.match(calls[0].url, /\/payments\/s-pay-9$/);
});

test('fetchResourceFromEvent ignores a retrieveUrl on a foreign origin (credential-leak guard)', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-9' } });
  const resource = await unzer.fetchResourceFromEvent({
    event: 'charge.succeeded',
    paymentId: 's-pay-9',
    retrieveUrl: 'https://evil.example.com/steal?payments/s-pay-9',
  });

  // must never have contacted the attacker host with the Basic-auth header attached
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/api\.unzer\.com\/v1\/payments\/s-pay-9$/);
  assert.equal(
    calls[0].headers.Authorization,
    'Basic ' + Buffer.from(`${PRIV}:`).toString('base64')
  );
  assert.equal(resource.id, 's-pay-9');
});

test('fetchResourceFromEvent rejects an unparseable retrieveUrl instead of throwing', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-9' } });
  await unzer.fetchResourceFromEvent({
    event: 'charge.succeeded',
    paymentId: 's-pay-9',
    retrieveUrl: 'not-a-valid-url',
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/payments\/s-pay-9$/);
});

test('maps non-2xx responses to UnzerApiError', async () => {
  const { unzer } = client({
    ok: false,
    status: 400,
    body: {
      id: 's-err-1',
      errors: [
        {
          code: 'API.320.100.001',
          merchantMessage: 'Card declined.',
          customerMessage: 'Please use another card.',
        },
      ],
    },
  });

  await assert.rejects(
    () => unzer.authorize({ amount: 1, currency: 'EUR', typeId: 's-crd-1' }),
    (err) => {
      assert.ok(err instanceof UnzerApiError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'API.320.100.001');
      assert.equal(err.message, 'Card declined.');
      assert.equal(err.customerMessage, 'Please use another card.');
      return true;
    }
  );
});

test('maps 2xx body containing errors[] to UnzerApiError', async () => {
  const { unzer } = client({
    ok: true,
    status: 200,
    body: { errors: [{ code: 'X', merchantMessage: 'bad' }] },
  });
  await assert.rejects(() => unzer.fetchPayment('s-pay-1'), UnzerApiError);
});

test('maps a non-2xx non-JSON body to UnzerApiError carrying the raw text', async () => {
  const { fetchImpl } = mockFetch({ ok: false, status: 502, raw: '<html>Bad Gateway</html>' });
  const unzer = new Unzer(PRIV, { fetchImpl, baseUrl: 'https://api.unzer.com/v1' });
  await assert.rejects(
    () => unzer.fetchPayment('s-pay-1'),
    (err) => {
      assert.ok(err instanceof UnzerApiError);
      assert.equal(err.statusCode, 502);
      assert.match(err.message, /Bad Gateway/);
      return true;
    }
  );
});

test('maps a non-2xx JSON body without errors[] to a generic UnzerApiError', async () => {
  const { unzer } = client({ ok: false, status: 404, body: { id: 's-x' } });
  await assert.rejects(
    () => unzer.fetchPayment('s-pay-1'),
    (err) => {
      assert.ok(err instanceof UnzerApiError);
      assert.equal(err.statusCode, 404);
      assert.match(err.message, /HTTP 404/);
      return true;
    }
  );
});

test('createPaymentType with a plain object strips apiName and id from the body', async () => {
  const { unzer, calls } = client({ body: { id: 's-crd-2' } });
  const res = await unzer.createPaymentType({ apiName: 'card', id: 'strip-me', brand: 'VISA' });

  assert.match(calls[0].url, /\/types\/card$/);
  assert.equal(calls[0].body.apiName, undefined, 'apiName must not be sent in the body');
  assert.equal(calls[0].body.id, undefined);
  assert.equal(calls[0].body.brand, 'VISA');
  assert.equal(res.id, 's-crd-2');
});

test('authorize merges a caller-supplied resources object without dropping typeId', async () => {
  const { unzer, calls } = client({ body: { id: 's-aut-2' } });
  await unzer.authorize({
    amount: 10,
    currency: 'EUR',
    typeId: 's-crd-1',
    resources: { customerId: 's-cst-9' },
  });
  assert.deepEqual(calls[0].body.resources, {
    customerId: 's-cst-9',
    typeId: 's-crd-1',
  });
});

test('createWebhooks posts eventList and returns Webhook instances', async () => {
  const { unzer, calls } = client({
    body: { events: [{ id: 's-whk-1' }, { id: 's-whk-2' }] },
  });
  const hooks = await unzer.createWebhooks('https://e.com/hook', ['charge', 'authorize']);

  assert.deepEqual(calls[0].body, {
    url: 'https://e.com/hook',
    eventList: ['charge', 'authorize'],
  });
  assert.equal(hooks.length, 2);
  assert.ok(hooks[0] instanceof Webhook);
  assert.equal(hooks[1].id, 's-whk-2');
});

test('createOrUpdateCustomer serializes a Customer instance and drops the client back-reference', async () => {
  const { unzer, calls } = client({ body: { id: 's-cst-2' } });
  await unzer.createOrUpdateCustomer(new Customer({ firstname: 'Max', lastname: 'Muster' }));

  assert.equal(calls[0].method, 'POST');
  assert.match(calls[0].url, /\/customers$/);
  assert.equal(calls[0].body.firstname, 'Max');
  assert.equal(calls[0].body._unzer, undefined, 'internal back-reference must not be serialized');
});

test('Authorization convenience methods call charge and cancel via the owning client', async () => {
  const { unzer, calls } = client([
    { body: { id: 's-aut-1', resources: { paymentId: 's-pay-1' } } },
    { body: { id: 's-chg-1' } },
    { body: { id: 's-cnl-1' } },
  ]);

  const auth = await unzer.authorize({ amount: 10, currency: 'EUR', typeId: 's-crd-1' });
  await auth.charge('5');
  await auth.cancel();

  assert.match(calls[1].url, /\/payments\/s-pay-1\/charges$/);
  assert.deepEqual(calls[1].body, { amount: '5' });
  assert.match(calls[2].url, /\/payments\/s-pay-1\/authorize\/cancels$/);
  assert.deepEqual(calls[2].body, {});
});

test('Payment convenience methods capture and reverse via the owning client', async () => {
  const { unzer, calls } = client([
    { body: { id: 's-pay-1' } },
    { body: { id: 's-chg-1' } },
    { body: { id: 's-cnl-1' } },
  ]);

  const payment = await unzer.fetchPayment('s-pay-1');
  await payment.charge('7.50');
  await payment.cancelAuthorization();

  assert.match(calls[1].url, /\/payments\/s-pay-1\/charges$/);
  assert.deepEqual(calls[1].body, { amount: '7.50' });
  assert.match(calls[2].url, /\/payments\/s-pay-1\/authorize\/cancels$/);
});

test('fetchResourceFromEvent accepts a JSON string body', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-9' } });
  await unzer.fetchResourceFromEvent(
    JSON.stringify({ event: 'charge', paymentId: 's-pay-9' })
  );
  assert.match(calls[0].url, /\/payments\/s-pay-9$/);
});

test('fetchResourceFromEvent throws when neither retrieveUrl nor paymentId is present', async () => {
  const { unzer } = client({ body: {} });
  await assert.rejects(
    () => unzer.fetchResourceFromEvent({ event: 'charge' }),
    /neither a trusted retrieveUrl nor a paymentId/
  );
});

test('endpoints encode path parameters so a forged paymentId cannot traverse', async () => {
  const { unzer, calls } = client({ body: { id: 's-pay-1' } });
  await unzer.fetchPayment('../keypair');
  // the slash is percent-encoded, so the request stays on the payments path
  assert.match(calls[0].url, /\/payments\/\.\.%2Fkeypair$/);
});

test('HttpClient omits the auth header for a foreign-origin absolute URL', async () => {
  const { fetchImpl, calls } = mockFetch({ body: { ok: true } });
  const http = new HttpClient(PRIV, { fetchImpl, baseUrl: 'https://api.unzer.com/v1' });
  await http.get('https://evil.example.com/steal');

  assert.equal(calls[0].url, 'https://evil.example.com/steal');
  assert.equal(calls[0].headers.Authorization, undefined);
});

test('HttpClient attaches the auth header for same-origin requests', async () => {
  const { fetchImpl, calls } = mockFetch({ body: { ok: true } });
  const http = new HttpClient(PRIV, { fetchImpl, baseUrl: 'https://api.unzer.com/v1' });
  await http.get('https://api.unzer.com/v1/payments/s-pay-1');

  assert.equal(
    calls[0].headers.Authorization,
    'Basic ' + Buffer.from(`${PRIV}:`).toString('base64')
  );
});

test('HttpClient.put defaults to an empty JSON body', async () => {
  const { fetchImpl, calls } = mockFetch({ body: { id: 's-cst-1' } });
  const http = new HttpClient(PRIV, { fetchImpl, baseUrl: 'https://api.unzer.com/v1' });
  await http.put('customers/s-cst-1');
  assert.deepEqual(calls[0].body, {});
});

test('does not leak the private key or auth header via JSON.stringify', () => {
  const unzer = new Unzer(PRIV, {
    fetchImpl: () => {},
    baseUrl: 'https://api.unzer.com/v1',
  });
  const serialized = JSON.stringify(unzer);
  assert.doesNotMatch(serialized, /s-priv-/);
  assert.doesNotMatch(serialized, /Basic /);
  // ...but the header is still readable internally
  assert.equal(
    unzer.http.authHeader,
    'Basic ' + Buffer.from(`${PRIV}:`).toString('base64')
  );
});
