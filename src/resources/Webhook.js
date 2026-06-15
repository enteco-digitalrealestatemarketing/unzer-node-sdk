'use strict';

const AbstractResource = require('./AbstractResource');

/**
 * A Webhook registration tells Unzer which URL to notify for a given event.
 *
 * Note: Unzer webhook notifications are NOT cryptographically signed (unlike
 * Stripe). The notification body contains a `retrieveUrl` / `paymentId`; the
 * recommended pattern is to re-fetch the referenced resource from the API to
 * confirm its state. See `Unzer#fetchResourceFromEvent`.
 */
class Webhook extends AbstractResource {}

module.exports = Webhook;
