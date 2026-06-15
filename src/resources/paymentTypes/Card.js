'use strict';

const BasePaymentType = require('./BasePaymentType');

/**
 * Card payment type.
 *
 * IMPORTANT: Submitting raw card data (number/cvc) server-side puts you in PCI
 * DSS SAQ-D scope. In production you normally create the card type client-side
 * with Unzer UI Components and only pass the resulting `typeId` to your server.
 */
class Card extends BasePaymentType {
  apiName() {
    return 'card';
  }
}

module.exports = Card;
