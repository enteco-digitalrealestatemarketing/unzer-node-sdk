'use strict';

const BasePaymentType = require('./BasePaymentType');

/** EPS payment type (Austrian online bank transfer). */
class Eps extends BasePaymentType {
  apiName() {
    return 'eps';
  }
}

module.exports = Eps;
