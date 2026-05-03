const mongoose = require('mongoose');
const User = require('./models/User');
const { ensureDemoSupplierData } = require('./utils/demoSupplierData');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_system');
    console.log('Connected to MongoDB');

    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '1234567890',
        role: 'admin',
        isActive: true,
        address: {
          street: '123 Admin Street',
          city: 'Admin City',
          state: 'AC',
          zipCode: '12345'
        }
      },
      {
        name: 'Pharmacist User',
        email: 'pharma@example.com',
        password: 'pharma123',
        phone: '0987654321',
        role: 'pharmacist',
        isActive: true,
        address: {
          street: '456 Pharmacy Ave',
          city: 'Pharma City',
          state: 'PC',
          zipCode: '54321'
        }
      },
      {
        name: 'Supplier User',
        email: 'supplier@example.com',
        password: 'supplier123',
        phone: '0771234567',
        role: 'supplier',
        isActive: true,
        address: {
          street: '12 Supplier Lane',
          city: 'Colombo',
          state: 'Western',
          zipCode: '10100'
        }
      },
      {
        name: 'Customer User',
        email: 'customer@example.com',
        password: 'customer123',
        phone: '5555555555',
        role: 'customer',
        isActive: true,
        address: {
          street: '789 Customer Rd',
          city: 'Customer City',
          state: 'CC',
          zipCode: '11111'
        }
      },
      {
        name: 'Support Officer',
        email: 'officer@pharmacy.com',
        password: 'Officer@123',
        phone: '0771234568',
        role: 'support_officer',
        isActive: true,
        address: {
          street: '321 Support Street',
          city: 'Support City',
          state: 'SC',
          zipCode: '33333'
        }
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await User.create(userData);
      console.log(`Created ${userData.role}: ${user.email}`);
    }

    const supplierUser = await User.findOne({ email: 'supplier@example.com' });
    if (supplierUser) {
      await ensureDemoSupplierData(supplierUser);
      console.log('Seeded supplier profile, catalog, invoices, and orders');
    }

    console.log('\n✅ Demo users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Pharmacist: pharma@example.com / pharma123');
    console.log('Supplier: supplier@example.com / supplier123');
    console.log('Customer: customer@example.com / customer123');
    console.log('Support Officer: officer@pharmacy.com / Officer@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
