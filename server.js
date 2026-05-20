const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Data storage: use file on local, or /tmp on Vercel
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp/english-data' : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty db if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// API: Load all data from server
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: true, data: {} });
  }
});

// API: Save data to server
app.post('/api/data', (req, res) => {
  try {
    const { key, value } = req.body;
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    data[key] = value;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// API: Save multiple keys at once
app.post('/api/data/batch', (req, res) => {
  try {
    const { entries } = req.body;
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    Object.keys(entries).forEach(key => {
      data[key] = entries[key];
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// API: Get WiFi IP for display
app.get('/api/ip', (req, res) => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let ip = 'localhost';
  Object.keys(interfaces).forEach(iface => {
    interfaces[iface].forEach(info => {
      if (info.family === 'IPv4' && !info.internal && iface !== 'lo0') {
        ip = info.address;
      }
    });
  });
  res.json({ ip, port: PORT });
});

// Start server (only when not on Vercel)
if (!isVercel) {
  app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let ips = [];
    Object.keys(interfaces).forEach(iface => {
      interfaces[iface].forEach(info => {
        if (info.family === 'IPv4' && !info.internal) {
          ips.push(info.address);
        }
      });
    });
    
    console.log('');
    console.log('========================================');
    console.log('  🦐 小虾英语学修 - 服务器已启动');
    console.log('========================================');
    console.log('');
    console.log('  本机访问:');
    console.log(`    http://localhost:${PORT}`);
    console.log('');
    console.log('  其他设备访问（局域网）:');
    ips.forEach(ip => {
      console.log(`    http://${ip}:${PORT}`);
    });
    console.log('');
    console.log('');
    console.log('  按 Ctrl+C 停止服务器');
    console.log('========================================');
    console.log('');
  });
}

// Export for Vercel
module.exports = app;
