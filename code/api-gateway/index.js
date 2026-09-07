const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;

const SERVICE_A_URL = process.env.SERVICE_A_URL || 'http://localhost:5001';
const SERVICE_B_URL = process.env.SERVICE_B_URL || 'http://localhost:5002';
const SERVICE_C_URL = process.env.SERVICE_C_URL || 'http://localhost:5003';

// Helper to fetch data safely from a microservice
async function fetchServiceData(url) {
  try {
    const response = await axios.get(`${url}/data`, { timeout: 3000 });
    return { status: 'Online', items: response.data.items || [] };
  } catch (error) {
    return { status: 'Offline / Error', items: [], error: error.message };
  }
}

// 1. JSON Dashboard Endpoint (Kept for programmatic testing)
app.get('/dashboard-json', async (req, res) => {
  const [a, b, c] = await Promise.all([
    fetchServiceData(SERVICE_A_URL),
    fetchServiceData(SERVICE_B_URL),
    fetchServiceData(SERVICE_C_URL)
  ]);
  res.json({ timestamp: new Date().toISOString(), services: { service_a: a, service_b: b, service_c: c } });
});

// 2. HTML UI Dashboard Endpoint
app.get('/', async (req, res) => {
  const [dataA, dataB, dataC] = await Promise.all([
    fetchServiceData(SERVICE_A_URL),
    fetchServiceData(SERVICE_B_URL),
    fetchServiceData(SERVICE_C_URL)
  ]);

  const renderTableRows = (items) => {
    if (!items || items.length === 0) return '<tr><td colspan="2">No data recorded</td></tr>';
    return items.map(item => `<tr><td>${item.id}</td><td>${item.name}</td></tr>`).join('');
  };

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloud Computing Practical Dashboard</title>
    <style>
      * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      body { background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
      header { text-align: center; margin-bottom: 25px; }
      h1 { margin: 0; color: #1a73e8; font-size: 24px; }
      p.subtitle { margin-top: 5px; color: #666; font-size: 14px; }
      
      .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .card {
        background: #ffffff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border-top: 4px solid #1a73e8;
      }
      
      .card-a { border-top-color: #4285f4; }
      .card-b { border-top-color: #34a853; }
      .card-c { border-top-color: #fbbc05; }
      
      .card h2 { font-size: 18px; margin-top: 0; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; }
      .badge { font-size: 11px; padding: 3px 8px; border-radius: 12px; background: #e8f0fe; color: #1a73e8; font-weight: normal; }
      .badge.offline { background: #fce8e6; color: #c5221f; }
      .tech-tag { font-size: 12px; color: #777; margin-bottom: 15px; }
      
      form { margin-bottom: 15px; display: flex; gap: 8px; }
      input[type="text"] { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
      button { padding: 8px 14px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
      button:hover { opacity: 0.9; }
      
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
      th { background-color: #fafafa; color: #555; }
    </style>
  </head>
  <body>

    <header>
      <h1>Microservices & Database Sync Dashboard</h1>
      <p class="subtitle">API Gateway Routing • Internal Network Sync • Independent DB Containers</p>
    </header>

    <div class="grid-container">
      
      <!-- SERVICE A -->
      <div class="card card-a">
        <h2>Service A <span class="badge ${dataA.status === 'Online' ? '' : 'offline'}">${dataA.status}</span></h2>
        <div class="tech-tag">Python (Flask) + MySQL A</div>
        
        <form action="/add/service-a" method="POST">
          <input type="text" name="name" placeholder="Item name..." required>
          <button type="submit">Add</button>
        </form>

        <table>
          <thead>
            <tr><th>ID</th><th>Name</th></tr>
          </thead>
          <tbody>
            ${renderTableRows(dataA.items)}
          </tbody>
        </table>
      </div>

      <!-- SERVICE B -->
      <div class="card card-b">
        <h2>Service B <span class="badge ${dataB.status === 'Online' ? '' : 'offline'}">${dataB.status}</span></h2>
        <div class="tech-tag">Node.js (Express) + MySQL B</div>
        
        <form action="/add/service-b" method="POST">
          <input type="text" name="name" placeholder="Item name..." required>
          <button type="submit">Add</button>
        </form>

        <table>
          <thead>
            <tr><th>ID</th><th>Name</th></tr>
          </thead>
          <tbody>
            ${renderTableRows(dataB.items)}
          </tbody>
        </table>
      </div>

      <!-- SERVICE C -->
      <div class="card card-c">
        <h2>Service C <span class="badge ${dataC.status === 'Online' ? '' : 'offline'}">${dataC.status}</span></h2>
        <div class="tech-tag">Python (Flask) + MySQL C</div>
        
        <form action="/add/service-c" method="POST">
          <input type="text" name="name" placeholder="Item name..." required>
          <button type="submit">Add</button>
        </form>

        <table>
          <thead>
            <tr><th>ID</th><th>Name</th></tr>
          </thead>
          <tbody>
            ${renderTableRows(dataC.items)}
          </tbody>
        </table>
      </div>

    </div>

  </body>
  </html>
  `;
  res.send(html);
});

// Form Action Routes
app.post('/add/service-a', async (req, res) => {
  try {
    await axios.post(`${SERVICE_A_URL}/data`, { name: req.body.name }, { timeout: 3000 });
  } catch (err) { console.error('Error posting to A:', err.message); }
  res.redirect('/');
});

app.post('/add/service-b', async (req, res) => {
  try {
    await axios.post(`${SERVICE_B_URL}/data`, { name: req.body.name }, { timeout: 3000 });
  } catch (err) { console.error('Error posting to B:', err.message); }
  res.redirect('/');
});

app.post('/add/service-c', async (req, res) => {
  try {
    await axios.post(`${SERVICE_C_URL}/data`, { name: req.body.name }, { timeout: 3000 });
  } catch (err) { console.error('Error posting to C:', err.message); }
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway UI listening on port ${PORT}`);
});