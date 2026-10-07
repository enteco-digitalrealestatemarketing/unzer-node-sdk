'use strict';

const HttpClient = require('./http/HttpClient');
const endpoints = require('./constants/endpoints');

const Payment = require('./resources/Payment');
const Authorization = require('./resources/transaction/Authorization');
const Charge = require('./resources/transaction/Charge');
const Cancellation = require('./resources/transaction/Cancellation');
const Customer = require('./resources/Customer');
const Basket = require('./resources/Basket');
const Metadata = require('./resources/Metadata');
const Webhook = require('./resources/Webhook');

/**
 * Main entry point / facade for the Unzer Direct API, modeled on the official
 * Unzer PHP and Java SDKs.
 *
 * @example
 *   const Unzer = require('unzer-node-sdk');
 *   const unzer = new Unzer('s-priv-xxxx');
 *   const auth = await unzer.authorize({
 *     amount: '119.00', currency: 'EUR',
 *     returnUrl: 'https://example.com/return', typeId: 's-crd-xxxx',
 *   });
 *   // ... after the customer returns and authorization succeeded:
 *   const charge = await unzer.chargeAuthorization(auth.getPaymentId(), '59.50');
 */
class Unzer {
  /**
   * @param {string} privateKey Your Unzer private key (s-priv-...).
   * @param {object} [options]
   * @param {string} [options.baseUrl] API base URL (default https://api.unzer.com/v1).
   * @param {string} [options.locale] Accept-Language locale (default en_US).
   * @param {Function} [options.fetchImpl] Custom fetch implementation (for tests).
   */
  constructor(privateKey, options = {}) {
    // Non-enumerable so JSON.stringify / logging of the client does not leak
    // the credential; the HttpClient holds its own (also non-enumerable) copy.
    Object.defineProperty(this, 'privateKey', {
      value: privateKey,
      enumerable: false,
      writable: true,
    });
    this.http = new HttpClient(privateKey, options);
  }

  /** Builds an authorize/charge request payload from flat parameters. */
  _transactionPayload(params = {}) {
    const {
      amount,
      currency,
      returnUrl,
      typeId,
      customerId,
      metadataId,
      basketId,
      orderId,
      paymentReference,
      card3ds,
      additionalTransactionData,
      resources: resourcesParam,
      ...rest
    } = params;

    const payload = {};
    if (amount !== undefined && amount !== null) payload.amount = String(amount);
    if (currency) payload.currency = currency;
    if (returnUrl) payload.returnUrl = returnUrl;
    if (orderId) payload.orderId = orderId;
    if (paymentReference) payload.paymentReference = paymentReference;
    if (card3ds !== undefined) payload.card3ds = card3ds;
    if (additionalTransactionData) {
      payload.additionalTransactionData = additionalTransactionData;
    }

    // Start from a caller-supplied `resources` object (if any) so the nested
    // typeId/customerId/... below extend it instead of being clobbered by the
    // `rest` spread further down.
    const resources = { ...resourcesParam };
    if (typeId) resources.typeId = typeId;
    if (customerId) resources.customerId = customerId;
    if (metadataId) resources.metadataId = metadataId;
    if (basketId) resources.basketId = basketId;

    Object.assign(payload, rest);
    if (Object.keys(resources).length > 0) payload.resources = resources;
    return payload;
  }

  // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------

  /** Authorize (reserve) an amount. POST /payments/authorize */
  async authorize(params = {}) {
    const data = await this.http.post(
      endpoints.AUTHORIZE,
      this._transactionPayload(params)
    );
    return new Authorization(data, this);
  }

  /** Directly charge an amount. POST /payments/charges */
  async charge(params = {}) {
    const data = await this.http.post(
      endpoints.CHARGES,
      this._transactionPayload(params)
    );
    return new Charge(data, this);
  }

  /**
   * Capture (charge) an existing authorization.
   * POST /payments/{paymentId}/charges
   * @param {string} paymentId
   * @param {string|number} [amount] Omit for a full capture; provide for partial.
   */
  async chargeAuthorization(paymentId, amount) {
    const body = amount != null ? { amount: String(amount) } : {};
    const data = await this.http.post(
      endpoints.paymentCharges(paymentId),
      body
    );
    return new Charge(data, this);
  }

  /**
   * Cancel (reverse) an authorization that has not been captured.
   * POST /payments/{paymentId}/authorize/cancels
   * @param {string} paymentId
   * @param {string|number} [amount] Omit for a full reversal; provide for partial.
   */
  async cancelAuthorization(paymentId, amount) {
    const body = amount != null ? { amount: String(amount) } : {};
    const data = await this.http.post(
      endpoints.authorizeCancels(paymentId),
      body
    );
    return new Cancellation(data, this);
  }

  /**
   * Cancel (refund) a charge.
   * POST /payments/{paymentId}/charges/{chargeId}/cancels
   * @param {string} paymentId
   * @param {string} chargeId
   * @param {string|number} [amount] Omit for a full refund; provide for partial.
   */
  async cancelCharge(paymentId, chargeId, amount) {
    const body = amount != null ? { amount: String(amount) } : {};
    const data = await this.http.post(
      endpoints.chargeCancels(paymentId, chargeId),
      body
    );
    return new Cancellation(data, this);
  }

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  /** Fetch the full payment (container of all transactions). GET /payments/{id} */
  async fetchPayment(paymentId) {
    const data = await this.http.get(endpoints.payment(paymentId));
    return new Payment(data, this);
  }

  /** GET /payments/{id}/authorize */
  async fetchAuthorization(paymentId) {
    const data = await this.http.get(endpoints.authorization(paymentId));
    return new Authorization(data, this);
  }

  /** GET /payments/{id}/charges/{chargeId} */
  async fetchCharge(paymentId, chargeId) {
    const data = await this.http.get(endpoints.charge(paymentId, chargeId));
    return new Charge(data, this);
  }

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------

  /** Creates a customer, or updates it when the given object has an `id`. */
  async createOrUpdateCustomer(customer) {
    const payload =
      customer instanceof Customer ? customer.toApiPayload() : { ...customer };
    if (payload.id) {
      const id = payload.id;
      delete payload.id;
      const data = await this.http.put(endpoints.customer(id), payload);
      return new Customer(data, this);
    }
    const data = await this.http.post(endpoints.CUSTOMERS, payload);
    return new Customer(data, this);
  }

  /** GET /customers/{id} */
  async fetchCustomer(customerId) {
    const data = await this.http.get(endpoints.customer(customerId));
    return new Customer(data, this);
  }

  /** DELETE /customers/{id} */
  async deleteCustomer(customerId) {
    return this.http.delete(endpoints.customer(customerId));
  }

  // ---------------------------------------------------------------------------
  // Baskets
  // ---------------------------------------------------------------------------

  /** POST /baskets */
  async createBasket(basket) {
    const payload =
      basket instanceof Basket ? basket.toApiPayload() : { ...basket };
    const data = await this.http.post(endpoints.BASKETS, payload);
    return new Basket(data, this);
  }

  /** GET /baskets/{id} */
  async fetchBasket(id) {
    const data = await this.http.get(endpoints.basket(id));
    return new Basket(data, this);
  }

  // ---------------------------------------------------------------------------
  // Metadata
  // ---------------------------------------------------------------------------

  /** POST /metadata */
  async createMetadata(metadata) {
    const payload =
      metadata instanceof Metadata ? metadata.toApiPayload() : { ...metadata };
    const data = await this.http.post(endpoints.METADATA, payload);
    return new Metadata(data, this);
  }

  /** GET /metadata/{id} */
  async fetchMetadata(id) {
    const data = await this.http.get(endpoints.metadataItem(id));
    return new Metadata(data, this);
  }

  // ---------------------------------------------------------------------------
  // Payment types
  // ---------------------------------------------------------------------------

  /**
   * Creates a payment type resource (e.g. a Card/Paypal instance) and returns
   * the API response containing its `id` (the typeId).
   * POST /types/{apiName}
   */
  async createPaymentType(type) {
    const apiName =
      typeof type.apiName === 'function' ? type.apiName() : type.apiName;
    if (!apiName) {
      throw new Error('Unzer: payment type must define an apiName.');
    }
    const payload =
      typeof type.toApiPayload === 'function' ? type.toApiPayload() : { ...type };
    delete payload.id;
    // `apiName` addresses the endpoint, it is not a request field. Payment-type
    // instances expose it as a prototype method (already excluded), but a plain
    // object would otherwise leak it into the body.
    delete payload.apiName;
    return this.http.post(endpoints.types(apiName), payload);
  }

  /** GET /types/{typeId} */
  async fetchPaymentType(typeId) {
    return this.http.get(endpoints.type(typeId));
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------

  /** Register a single webhook. POST /webhooks */
  async createWebhook(url, event) {
    const data = await this.http.post(endpoints.WEBHOOKS, { url, event });
    return new Webhook(data, this);
  }

  /**
   * Register multiple events for one URL. POST /webhooks
   * Returns `Webhook[]`, consistent with `createWebhook`/`fetchAllWebhooks`.
   */
  async createWebhooks(url, events) {
    const data = await this.http.post(endpoints.WEBHOOKS, {
      url,
      eventList: events,
    });
    const list = (data && data.events) || [];
    return list.map((w) => new Webhook(w, this));
  }

  /** GET /webhooks */
  async fetchAllWebhooks() {
    const data = await this.http.get(endpoints.WEBHOOKS);
    const list = (data && data.events) || [];
    return list.map((w) => new Webhook(w, this));
  }

  /** GET /webhooks/{id} */
  async fetchWebhook(id) {
    const data = await this.http.get(endpoints.webhook(id));
    return new Webhook(data, this);
  }

  /** DELETE /webhooks/{id} */
  async deleteWebhook(id) {
    return this.http.delete(endpoints.webhook(id));
  }

  /** DELETE /webhooks */
  async deleteAllWebhooks() {
    return this.http.delete(endpoints.WEBHOOKS);
  }

  /**
   * Resolves the resource referenced by an (unsigned) webhook notification.
   *
   * Unzer notifications are not signed; the safe pattern is to re-fetch the
   * referenced resource from the API. Accepts the parsed body or a JSON string.
   *
   * Security: `retrieveUrl` comes from the untrusted webhook payload. Only
   * followed when its origin matches the configured `baseUrl` — otherwise a
   * forged payload could point it at an attacker-controlled host and receive
   * the private-key Basic-auth header. This facade-level guard is backed by a
   * second, independent guard in `HttpClient` (the auth header is only attached
   * to same-origin requests). Falls back to re-fetching by `paymentId` against
   * the configured API in every other case.
   *
   * Return value: the trusted-`retrieveUrl` path returns the raw resource data
   * as returned by the API; the `paymentId` fallback returns a {@link Payment}
   * instance (with its convenience methods). Inspect `.state` etc. either way.
   */
  async fetchResourceFromEvent(event) {
    const body = typeof event === 'string' ? JSON.parse(event) : event || {};
    if (body.retrieveUrl && this._isTrustedRetrieveUrl(body.retrieveUrl)) {
      return this.http.get(body.retrieveUrl);
    }
    if (body.paymentId) {
      return this.fetchPayment(body.paymentId);
    }
    throw new Error(
      'Unzer: webhook event has neither a trusted retrieveUrl nor a paymentId.'
    );
  }

  /** Whether `retrieveUrl` shares its origin with the configured `baseUrl`. */
  _isTrustedRetrieveUrl(retrieveUrl) {
    return this.http.isSameOrigin(retrieveUrl);
  }
}

module.exports = Unzer;
