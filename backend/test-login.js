const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_system');
    console.log('Connected to MongoDB\n');

    const email = 'admin@example.com';
    const password = 'admin123';

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('✓ User found:', user.email);
    console.log('✓ User role:', user.role);
    console.log('✓ User active:', user.isActive);
    console.log('✓ Password hash exists:', !!user.password);

    // Test password comparison
    const isMatch = await user.comparePassword(password);
    console.log('\nPassword test:', isMatch ? '✅ MATCH' : '❌ INCORRECT');

    if (isMatch) {
      console.log('\n✅ Login credentials are VALID!');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('\n❌ Password does not match!');
      console.log('Recreating user with correct password...');
      
      await User.deleteOne({ email });
      const newUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '1234567890',
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ User recreated with fresh password hash');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testLogin();
