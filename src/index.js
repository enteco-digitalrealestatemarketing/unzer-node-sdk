'use strict';

const Unzer = require('./Unzer');
const HttpClient = require('./http/HttpClient');
const UnzerApiError = require('./errors/UnzerApiError');

const AbstractResource = require('./resources/AbstractResource');
const Payment = require('./resources/Payment');
const AbstractTransaction = require('./resources/transaction/AbstractTransaction');
const Authorization = require('./resources/transaction/Authorization');
const Charge = require('./resources/transaction/Charge');
const Cancellation = require('./resources/transaction/Cancellation');
const Customer = require('./resources/Customer');
const Basket = require('./resources/Basket');
const Metadata = require('./resources/Metadata');
const Webhook = require('./resources/Webhook');

const BasePaymentType = require('./resources/paymentTypes/BasePaymentType');
const Card = require('./resources/paymentTypes/Card');
const Paypal = require('./resources/paymentTypes/Paypal');
const Sofort = require('./resources/paymentTypes/Sofort');
const Eps = require('./resources/paymentTypes/Eps');

const endpoints = require('./constants/endpoints');
const paymentState = require('./constants/paymentState');
const webhookEvents = require('./constants/webhookEvents');

// Primary export is the Unzer client, with all classes attached for convenience.
// Supports both `const Unzer = require('unzer-node-sdk')`
// and `const { Unzer, Card } = require('unzer-node-sdk')`.
module.exports = Unzer;

Object.assign(module.exports, {
  Unzer,
  HttpClient,
  UnzerApiError,

  AbstractResource,
  Payment,
  AbstractTransaction,
  Authorization,
  Charge,
  Cancellation,
  Customer,
  Basket,
  Metadata,
  Webhook,

  paymentTypes: { BasePaymentType, Card, Paypal, Sofort, Eps },
  BasePaymentType,
  Card,
  Paypal,
  Sofort,
  Eps,

  constants: { endpoints, paymentState, webhookEvents },
  endpoints,
  paymentState,
  webhookEvents,
});
