const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Demo accounts data
const demoAccounts = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    phone: '9876543210',
    address: {
      street: '123 Admin Street',
      city: 'Admin City',
      state: 'Admin State',
      zipCode: '123456',
      country: 'India'
    }
  },
  {
    name: 'Pharmacist User',
    email: 'pharma@example.com',
    password: 'pharma123',
    role: 'pharmacist',
    phone: '9876543211',
    address: {
      street: '456 Pharmacy Street',
      city: 'Pharma City',
      state: 'Pharma State',
      zipCode: '654321',
      country: 'India'
    }
  },
  {
    name: 'Supplier User',
    email: 'supplier@example.com',
    password: 'supplier123',
    role: 'supplier',
    phone: '9876543212',
    address: {
      street: '789 Supplier Street',
      city: 'Supplier City',
      state: 'Supplier State',
      zipCode: '789012',
      country: 'India'
    }
  },
  {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'customer123',
    role: 'customer',
    phone: '9876543213',
    address: {
      street: '321 Customer Street',
      city: 'Customer City',
      state: 'Customer State',
      zipCode: '321098',
      country: 'India'
    }
  },
  {
    name: 'Support Officer',
    email: 'officer@pharmacy.com',
    password: 'Officer@123',
    role: 'pharmacist', // Using pharmacist role as support officer
    phone: '9876543214',
    address: {
      street: '654 Support Street',
      city: 'Support City',
      state: 'Support State',
      zipCode: '654321',
      country: 'India'
    }
  }
];

async function createDemoAccounts() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy_system');
    console.log('Connected to database');

    // Clear existing demo accounts
    await User.deleteMany({ 
      email: { $in: demoAccounts.map(acc => acc.email) }
    });
    console.log('Cleared existing demo accounts');

    // Create demo accounts
    for (const account of demoAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const user = new User({
        ...account,
        password: hashedPassword,
        isActive: true,
        emailVerified: true
      });

      await user.save();
      console.log(`✅ Created ${account.role} account: ${account.email}`);
    }

    console.log('\n🎉 Demo accounts created successfully!');
    console.log('\nLogin Credentials:');
    console.log('==================');
    demoAccounts.forEach(account => {
      console.log(`${account.role.toUpperCase()}:`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error creating demo accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
createDemoAccounts();
