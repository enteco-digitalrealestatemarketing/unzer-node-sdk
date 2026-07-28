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

    const {
      baseUrl = DEFAULT_BASE_URL,
      locale = 'en_US',
      fetchImpl,
      timeoutMs,
    } = options;

    this.baseUrl = String(baseUrl).replace(/\/+$/, '');
    this.locale = locale;
    this.fetch = fetchImpl || globalThis.fetch;
    // Optional per-request timeout (ms). Unset → no timeout (previous behavior).
    this.timeoutMs = timeoutMs;

    if (typeof this.fetch !== 'function') {
      throw new Error(
        'Unzer: global fetch is not available. Use Node >= 18 or pass options.fetchImpl.'
      );
    }

    if (!/^https:\/\//i.test(this.baseUrl)) {
      // The private key travels as the HTTP Basic-auth username, so a non-TLS
      // baseUrl would send it in cleartext. The default is https; this only
      // fires on explicit misconfiguration.
      // eslint-disable-next-line no-console
      console.warn(
        'Unzer: baseUrl is not https — the private key would be sent over an unencrypted connection.'
      );
    }

    // Keep the credential and the derived header non-enumerable so they are not
    // exposed by JSON.stringify / console.log / structured error capture that
    // serializes surrounding object context. Property reads still work.
    Object.defineProperty(this, 'privateKey', {
      value: privateKey,
      enumerable: false,
      writable: true,
    });
    Object.defineProperty(this, 'authHeader', {
      value: 'Basic ' + Buffer.from(`${privateKey}:`).toString('base64'),
      enumerable: false,
      writable: true,
    });
  }

  buildUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.baseUrl}/${String(path).replace(/^\/+/, '')}`;
  }

  /** Whether `url` resolves to the same origin as the configured baseUrl. */
  isSameOrigin(url) {
    try {
      return new URL(url).origin === new URL(this.baseUrl).origin;
    } catch (err) {
      return false;
    }
  }

  async request(method, path, body) {
    const url = this.buildUrl(path);
    const headers = {
      Accept: 'application/json',
      'Accept-Language': this.locale,
    };

    // Only attach the private-key credential to same-origin requests. Relative
    // paths resolve onto baseUrl (same origin); an absolute URL pointing at a
    // foreign host — e.g. a forged webhook retrieveUrl — never receives it.
    if (this.isSameOrigin(url)) {
      headers.Authorization = this.authHeader;
    }

    // This JSON API does not use HTTP redirects (3DS/redirect URLs come in the
    // body), so fail closed rather than follow a redirect with credentials.
    const init = { method, headers, redirect: 'error' };
    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    let timer;
    if (this.timeoutMs) {
      const controller = new AbortController();
      init.signal = controller.signal;
      timer = setTimeout(() => controller.abort(), this.timeoutMs);
      if (typeof timer.unref === 'function') timer.unref();
    }

    let res;
    try {
      res = await this.fetch(url, init);
    } finally {
      if (timer) clearTimeout(timer);
    }

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
