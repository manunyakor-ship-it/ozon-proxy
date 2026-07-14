const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-perf-token', 'x-client-id', 'x-api-key', 'x-claude-key']
}));
app.options('*', cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Ozon Proxy работает!' }));

app.post('/perf/token', async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;
    const response = await fetch('https://performance.ozon.ru/api/client/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, grant_type: 'client_credentials' })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/perf/campaigns', async (req, res) => {
  try {
    const token = req.headers['x-perf-token'];
    const response = await fetch('https://performance.ozon.ru/api/client/campaign?state=CAMPAIGN_STATE_RUNNING', {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/perf/statistics', async (req, res) => {
  try {
    const token = req.headers['x-perf-token'];
    const response = await fetch('https://performance.ozon.ru/api/client/statistics', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/seller/products', async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'];
    const apiKey = req.headers['x-api-key'];
    const response = await fetch('https://api-seller.ozon.ru/v2/product/list', {
      method: 'POST',
      headers: { 'Client-Id': clientId, 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/seller/prices', async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'];
    const apiKey = req.headers['x-api-key'];
    const response = await fetch('https://api-seller.ozon.ru/v4/product/info/prices', {
      method: 'POST',
      headers: { 'Client-Id': clientId, 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/seller/stocks', async (req, res) => {
  try {
    const clientId = req.headers['x-client-id'];
    const apiKey = req.headers['x-api-key'];
    const response = await fetch('https://api-seller.ozon.ru/v2/analytics/stock_on_warehouses', {
      method: 'POST',
      headers: { 'Client-Id': clientId, 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/claude', async (req, res) => {
  try {
    const claudeKey = req.headers['x-claude-key'];
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
