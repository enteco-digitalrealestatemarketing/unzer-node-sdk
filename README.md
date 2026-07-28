# unzer-node-sdk

An unofficial **Node.js (CommonJS) SDK for the [Unzer](https://www.unzer.com)
Direct API**, modeled on the structure of the official
[Unzer PHP SDK](https://docs.unzer.com/server-side-integration/php-sdk-integration/)
and
[Unzer Java SDK](https://docs.unzer.com/server-side-integration/java-sdk-integration/).

A central `Unzer` client exposes high-level methods (`authorize`, `charge`,
`chargeAuthorization`, `cancelAuthorization`, `cancelCharge`, `fetchPayment`,
customer/basket/metadata/webhook management) backed by resource classes
(`Payment`, `Authorization`, `Charge`, `Cancellation`, `Customer`, `Basket`,
`Metadata`, `Webhook`) and payment types (`Card`, `Paypal`, `Sofort`, `Eps`).

> This package is the standalone, independently-versioned module extracted so it
> can be maintained and upgraded separately from the applications that consume
> it.

## Requirements

- **Node.js >= 18** (uses the global `fetch`). No runtime dependencies.

## Installation

```bash
npm install unzer-node-sdk
```

## Quick start

```js
const Unzer = require('unzer-node-sdk');
// or: const { Unzer, Card, UnzerApiError } = require('unzer-node-sdk');

const unzer = new Unzer(process.env.UNZER_PRIVATE_KEY); // s-priv-...

// 1) Reserve funds (manual capture model)
const auth = await unzer.authorize({
  amount: '119.00',          // decimal MAJOR units (EUR), not cents
  currency: 'EUR',
  returnUrl: 'https://shop.example.com/return',
  typeId: 's-crd-xxxxxxxx',  // payment type id (usually created client-side)
  customerId: 's-cst-xxxx',  // optional
  orderId: 'order-42',       // optional
});

if (auth.getRedirectUrl()) {
  // redirect the customer (3DS / redirect payment methods)
}
const paymentId = auth.getPaymentId();

// 2) Later: capture all or part of the authorized amount
const charge = await unzer.chargeAuthorization(paymentId, '59.50'); // partial

// 3) Refund all or part of a charge
await unzer.cancelCharge(paymentId, charge.getId(), '10.00');

// Or release a not-yet-captured authorization (reversal)
await unzer.cancelAuthorization(paymentId);
```

Resource objects also offer convenience methods (like the Java SDK):

```js
const payment = await unzer.fetchPayment(paymentId);
await payment.charge('59.50');          // capture authorization
await payment.cancelAuthorization();    // reverse authorization

const chg = await unzer.fetchCharge(paymentId, chargeId);
await chg.cancel('10.00');              // refund
```

## Authentication

The SDK uses HTTP Basic auth as required by Unzer: your **private key**
(`s-priv-...`) is the username and the password is empty
(`Authorization: Basic base64("<privateKey>:")`). Just pass the key:

```js
const unzer = new Unzer('s-priv-xxxx', {
  baseUrl: 'https://api.unzer.com/v1', // default
  locale: 'de_DE',                     // default en_US -> Accept-Language
  timeoutMs: 80000,                    // optional; unset -> no timeout
});
```

## Amounts & currency

Unlike Stripe (which uses the smallest currency unit / cents), the Unzer API
uses **decimal major units** (e.g. `12.99`). Prefer passing amounts as
**strings** (`'12.99'`): a `string` is forwarded verbatim, whereas a `number`
is converted with `String()`, which drops trailing zeros (`59.50` → `'59.5'`)
and can surface floating-point artifacts (`0.1 + 0.2` → `'0.30000000000000004'`).
Convert from cents before calling if your system stores cents.

## API surface → Direct API mapping

| Method | HTTP call |
|---|---|
| `authorize(params)` | `POST /payments/authorize` |
| `charge(params)` | `POST /payments/charges` |
| `chargeAuthorization(paymentId, amount?)` | `POST /payments/{paymentId}/charges` |
| `cancelAuthorization(paymentId, amount?)` | `POST /payments/{paymentId}/authorize/cancels` |
| `cancelCharge(paymentId, chargeId, amount?)` | `POST /payments/{paymentId}/charges/{chargeId}/cancels` |
| `fetchPayment(paymentId)` | `GET /payments/{paymentId}` |
| `fetchAuthorization(paymentId)` | `GET /payments/{paymentId}/authorize` |
| `fetchCharge(paymentId, chargeId)` | `GET /payments/{paymentId}/charges/{chargeId}` |
| `createOrUpdateCustomer` / `fetchCustomer` / `deleteCustomer` | `/customers` |
| `createBasket` / `fetchBasket` | `/baskets` |
| `createMetadata` / `fetchMetadata` | `/metadata` |
| `createPaymentType(type)` / `fetchPaymentType(typeId)` | `/types/...` |
| `createWebhook` / `createWebhooks` / `fetchAllWebhooks` / `fetchWebhook` / `deleteWebhook` / `deleteAllWebhooks` | `/webhooks` |
| `fetchResourceFromEvent(event)` | re-fetches the resource a webhook refers to |

`params` accepts a flat object — `typeId`, `customerId`, `metadataId`,
`basketId` are automatically nested under `resources`.

## Webhooks

Unzer webhook notifications are **not signed** (unlike Stripe). The safe pattern
is to re-fetch the referenced resource and trust the API's state:

```js
// In your HTTP handler:
const resource = await unzer.fetchResourceFromEvent(req.body);
// resource is the fresh Payment/transaction; inspect resource.state etc.
```

Register webhooks once:

```js
const { webhookEvents } = require('unzer-node-sdk');
await unzer.createWebhook('https://api.example.com/unzer/webhook', webhookEvents.PAYMENT);
```

## Error handling

Any non-2xx response (or a 2xx body containing an `errors` array) throws an
`UnzerApiError`:

```js
const { UnzerApiError } = require('unzer-node-sdk');
try {
  await unzer.authorize({ /* ... */ });
} catch (err) {
  if (err instanceof UnzerApiError) {
    console.error(err.code, err.merchantMessage, err.customerMessage);
  } else {
    throw err;
  }
}
```

## PCI note

Creating a `Card` type with raw card data server-side puts you in PCI DSS SAQ-D
scope. In production, create the card type **client-side** with Unzer UI
Components and pass only the resulting `typeId` to your backend.

## Testing

```bash
npm test                                   # offline unit tests (mocked fetch)
UNZER_PRIVATE_KEY=s-priv-... npm run test:integration   # hits the sandbox
```

## License

MIT
