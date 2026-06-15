'use strict';

const UnzerApiError = require('../errors/UnzerApiError');

const DEFAULT_BASE_URL = 'https://api.unzer.com/v1';

/**
 * Thin HTTP client around the Unzer Direct API.
 *
 * Handles:
 *  - Base URL resolution (and pass-through of absolute URLs, e.g. webhook
 *    `retrieveUrl`s).
 *  - HTTP Basic authentication: the private key is the username and the
 *    password is empty, i.e. `Authorization: Basic base64("<privateKey>:")`.
 *  - JSON (de)serialization.
 *  - Mapping error responses to {@link UnzerApiError}.
 */
class HttpClient {
  constructor(privateKey, options = {}) {
    if (!privateKey) {
      throw new Error('Unzer: a private key (s-priv-...) is required.');
    }

    const { baseUrl = DEFAULT_BASE_URL, locale = 'en_US', fetchImpl } = options;

    this.privateKey = privateKey;
    this.baseUrl = String(baseUrl).replace(/\/+$/, '');
    this.locale = locale;
    this.fetch = fetchImpl || globalThis.fetch;

    if (typeof this.fetch !== 'function') {
      throw new Error(
        'Unzer: global fetch is not available. Use Node >= 18 or pass options.fetchImpl.'
      );
    }

    this.authHeader =
      'Basic ' + Buffer.from(`${privateKey}:`).toString('base64');
  }

  buildUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.baseUrl}/${String(path).replace(/^\/+/, '')}`;
  }

  async request(method, path, body) {
    const url = this.buildUrl(path);
    const headers = {
      Authorization: this.authHeader,
      Accept: 'application/json',
      'Accept-Language': this.locale,
    };

    const init = { method, headers };
    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const res = await this.fetch(url, init);
    const text = await res.text();

    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        if (!res.ok) {
          throw new UnzerApiError({ statusCode: res.status, raw: text });
        }
        data = {};
      }
    }

    const hasErrors =
      data && Array.isArray(data.errors) && data.errors.length > 0;

    if (!res.ok || hasErrors) {
      throw new UnzerApiError({ statusCode: res.status, body: data });
    }

    return data;
  }

  get(path) {
    return this.request('GET', path);
  }

  /** POST defaults to an empty JSON body, which several Unzer endpoints expect. */
  post(path, body) {
    return this.request('POST', path, body == null ? {} : body);
  }

  put(path, body) {
    return this.request('PUT', path, body == null ? {} : body);
  }

  delete(path) {
    return this.request('DELETE', path);
  }
}

HttpClient.DEFAULT_BASE_URL = DEFAULT_BASE_URL;

module.exports = HttpClient;
