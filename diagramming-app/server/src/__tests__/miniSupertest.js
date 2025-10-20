// Minimal replacement for supertest for our server tests.
// Listens on an ephemeral port and uses fetch to make requests.
module.exports = function(app) {
  function makeRequest(method, path, opts = {}) {
    return {
      send: (body) => {
        opts.body = body;
        return makeRequest(method, path, opts);
      },
      set: (key, value) => {
        if (!opts.headers) opts.headers = {};
        // If value is an array (e.g., Cookie), join it
        opts.headers[key] = Array.isArray(value) ? value.join('; ') : value;
        return makeRequest(method, path, opts);
      },
      expect: async (status) => {
        const server = app.listen(0);
        const port = server.address().port;
        try {
          const url = `http://127.0.0.1:${port}${path}`;
          const fetchOpts = { method: method.toUpperCase(), headers: opts.headers || {} };
          if (opts.body !== undefined) {
            fetchOpts.headers['Content-Type'] = fetchOpts.headers['Content-Type'] || 'application/json';
            fetchOpts.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
          }
          // global fetch is available in Node 18+. If not, tests will fail early.
          const res = await fetch(url, fetchOpts);
          let body = null;
          const text = await res.text();
          try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
          if (res.status !== status) {
            const err = new Error(`Expected status ${status} but got ${res.status}. Body: ${JSON.stringify(body)}`);
            // attach status/body for test assertions
            err.status = res.status;
            err.body = body;
            throw err;
          }
          return { status: res.status, body };
        } finally {
          server.close();
        }
      }
    };
  }

  return {
    get: (path) => makeRequest('get', path),
    post: (path) => makeRequest('post', path),
  };
};
