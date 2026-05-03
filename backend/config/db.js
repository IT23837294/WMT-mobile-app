const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy_system').trim();

    if (mongoUri && mongoUri.startsWith('mongodb+srv://')) {
      const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

      if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
        console.log(`Using custom DNS servers for MongoDB Atlas: ${dnsServers.join(', ')}`);
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (error.message && error.message.toLowerCase().includes('bad auth')) {
      console.error('MongoDB Atlas rejected the username or password in MONGODB_URI. Confirm the database user in Atlas and URL-encode the password if it contains special characters.');
    }
    console.error('Check backend/.env MONGODB_URI or start a reachable MongoDB instance before logging in.');
  }
};

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const waitForDatabaseReady = async (timeoutMs = 5000) => {
  if (isDatabaseConnected()) {
    return true;
  }

  if (mongoose.connection.readyState !== 2) {
    return false;
  }

  const startedAt = Date.now();

  return await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (isDatabaseConnected()) {
        clearInterval(interval);
        resolve(true);
        return;
      }

      if (mongoose.connection.readyState !== 2 || Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(isDatabaseConnected());
      }
    }, 100);
  });
};

module.exports = connectDB;
module.exports.isDatabaseConnected = isDatabaseConnected;
module.exports.waitForDatabaseReady = waitForDatabaseReady;
