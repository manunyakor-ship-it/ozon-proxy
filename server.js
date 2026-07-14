const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: '*' }));
app.options('*', cors());
app.use(express.json());
app.use((req, res, next) => { console.log(`${req.method} ${req.path}`); next(); });

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Ozon Proxy работает!' }));

async function doFetch(url, options) {
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');
  return new Promise((resolve, reject) => {
    function request(urlStr) {
      const parsed = new URL(urlStr);
      const lib = parsed.protocol === 'https:' ? https : http;
      const opts = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      const req = lib.request(opts, (res) => {
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
          return request(res.headers.location);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, text: () => Promise.resolve(data) }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    }
    request(url);
  });
}

app.post('/perf/token', async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;
    console.log('Token request:', client_id);
    const response = await doFetch('https://performance.ozon.ru/api/client/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, grant_type: 'client_credentials' })
    });
    const text = await response.text();
    console.log('Token response:', text.substring(0, 200));
    res.status(response.status).send(text);
  } catch (e) { console.error(e.message); res.status(500).json({ error: e.message }); }
});

app.get('/perf/campaigns', async (req, res) => {
  try {
    const token = req.headers['x-perf-token'];
    const response = await doFetch('https://performance.ozon.ru/api/client/campaign?state=CAMPAIGN_STATE_RUNNING', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/perf/statistics', async (req, res) => {
  try {
    const token = req.headers['x-perf-token'];
    const response = await doFetch('https://performance.ozon.ru/api/client/statistics', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/seller/products', async (req, res) => {
  try {
    const response = await doFetch('https://api-seller.ozon.ru/v2/product/list', {
      method: 'POST',
      headers: { 'Client-Id': req.headers['x-client-id'], 'Api-Key': req.headers['x-api-key'], 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/seller/prices', async (req, res) => {
  try {
    const response = await doFetch('https://api-seller.ozon.ru/v4/product/info/prices', {
      method: 'POST',
      headers: { 'Client-Id': req.headers['x-client-id'], 'Api-Key': req.headers['x-api-key'], 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/seller/stocks', async (req, res) => {
  try {
    const response = await doFetch('https://api-seller.ozon.ru/v2/analytics/stock_on_warehouses', {
      method: 'POST',
      headers: { 'Client-Id': req.headers['x-client-id'], 'Api-Key': req.headers['x-api-key'], 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/claude', async (req, res) => {
  try {
    const response = await doFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': req.headers['x-claude-key'], 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
