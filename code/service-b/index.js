const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');

const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: 'root',
  password: 'rootpassword',
  database: 'service_b_db'
};

// GET /data (Read local items)
app.get('/data', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
    const [rows] = await connection.execute('SELECT * FROM items');
    await connection.end();
    res.status(200).json({ service: 'Service B (Express)', items: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /data (Add item to DB B & Sync to A & C)
app.post('/data', async (req, res) => {
  const { name } = req.body;
  const itemName = name || 'Default Item';
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
    await connection.execute('INSERT INTO items (name) VALUES (?)', [itemName]);
    await connection.end();

    // Trigger Sync to Service A and Service C
    const syncUrls = [process.env.SERVICE_A_SYNC_URL, process.env.SERVICE_C_SYNC_URL];
    for (const url of syncUrls) {
      if (url) {
        axios.post(url, { name: itemName }, { timeout: 2000 }).catch(e => console.error(`Sync failed to ${url}:`, e.message));
      }
    }

    res.status(201).json({ status: 'success', inserted: itemName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sync (Receive sync from A or C)
app.post('/sync', async (req, res) => {
  const { name } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
    await connection.execute('INSERT INTO items (name) VALUES (?)', [name || 'Default Item']);
    await connection.end();
    res.status(200).json({ status: 'synced_to_b' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, '0.0.0.0', () => console.log('Service B listening on port 5000'));