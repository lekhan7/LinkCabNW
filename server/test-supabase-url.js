const https = require('https');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
console.log('Testing URL:', url);

const options = {
  hostname: new URL(url).hostname,
  port: 443,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = https.request(options, (res) => {
  console.log('✅ Connection successful!');
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});

req.on('error', (err) => {
  console.error('❌ Connection failed:', err.message);
  if (err.code === 'ENOTFOUND') {
    console.error('DNS resolution failed - check the URL');
  } else if (err.code === 'ETIMEDOUT') {
    console.error('Connection timed out - network/firewall issue');
  }
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.destroy();
});

req.end();
