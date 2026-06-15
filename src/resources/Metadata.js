'use strict';

const AbstractResource = require('./AbstractResource');

/**
 * Metadata is an arbitrary key/value bag that can be attached to a payment to
 * carry merchant-specific data (e.g. an internal order UID).
 */
class Metadata extends AbstractResource {}

module.exports = Metadata;
