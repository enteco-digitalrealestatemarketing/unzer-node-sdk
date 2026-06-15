'use strict';

/**
 * Builds a fake `fetch` implementation that records calls and returns canned
 * responses. `responses` may be a single response descriptor or an array
 * consumed in order.
 *
 * Response descriptor: { ok?, status?, body? }
 */
function mockFetch(responses) {
  const calls = [];
  let index = 0;

  const fetchImpl = async (url, init) => {
    const body =
      init && init.body !== undefined ? JSON.parse(init.body) : undefined;
    calls.push({ url, method: init && init.method, headers: init && init.headers, body });

    const r = Array.isArray(responses) ? responses[index++] : responses;
    const descriptor = r || {};
    return {
      ok: descriptor.ok !== false,
      status: descriptor.status || 200,
      text: async () =>
        descriptor.body === undefined ? '' : JSON.stringify(descriptor.body),
    };
  };

  return { fetchImpl, calls };
}

module.exports = { mockFetch };
