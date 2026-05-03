const User = require('../models/User');
const Ticket = require('../models/Ticket');

const DEMO_SUPPORT_EMAIL = 'officer@pharmacy.com';
const DEMO_SUPPORT_PASSWORD = 'Officer@123';
const DEMO_SUPPORT_PASSWORD_ALIASES = [DEMO_SUPPORT_PASSWORD, 'officer@123'];

const ensureDemoSupportOfficer = async () => {
  let supportOfficer = await User.findOne({ email: DEMO_SUPPORT_EMAIL }).select('+password');

  if (!supportOfficer) {
    supportOfficer = await User.create({
      name: 'Support Officer',
      email: DEMO_SUPPORT_EMAIL,
      password: DEMO_SUPPORT_PASSWORD,
      phone: '0771234568',
      role: 'support_officer',
      isActive: true,
      address: {
        street: '321 Support Street',
        city: 'Support City',
        state: 'SC',
        zipCode: '33333',
        country: 'Sri Lanka'
      }
    });

    supportOfficer = await User.findById(supportOfficer._id).select('+password');
  } else {
    let hasChanges = false;

    if (supportOfficer.role !== 'support_officer') {
      supportOfficer.role = 'support_officer';
      hasChanges = true;
    }

    if (!supportOfficer.isActive) {
      supportOfficer.isActive = true;
      hasChanges = true;
    }

    if (hasChanges) {
      await supportOfficer.save();
    }
  }

  return supportOfficer;
};

const ensureDemoSupportCustomer = async () => {
  let customer = await User.findOne({ email: 'customer@example.com' });

  if (!customer) {
    customer = await User.create({
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
        zipCode: '11111',
        country: 'Sri Lanka'
      }
    });
  }

  return customer;
};

const ensureDemoSupportTickets = async (supportOfficer, customer) => {
  const existingDemoTickets = await Ticket.countDocuments({
    subject: { $in: ['Demo: Missing order delivery', 'Demo: Need invoice correction', 'Demo: Account login help'] }
  });

  if (existingDemoTickets > 0) {
    return;
  }

  await Ticket.insertMany([
    {
      customerId: customer._id,
      subject: 'Demo: Missing order delivery',
      category: 'Order Issue',
      description: 'Customer reports that order #PH-2048 did not arrive on the scheduled delivery date and needs an urgent status update.',
      priority: 'High',
      status: 'open'
    },
    {
      customerId: customer._id,
      subject: 'Demo: Need invoice correction',
      category: 'Payment Issue',
      description: 'Customer was charged for two packs instead of one and asked support to review the invoice before the next purchase.',
      priority: 'Medium',
      status: 'in-progress',
      assignedTo: supportOfficer._id
    },
    {
      customerId: customer._id,
      subject: 'Demo: Account login help',
      category: 'Account Issue',
      description: 'Customer could not update the saved address until a password reset was completed by the support team.',
      priority: 'Low',
      status: 'resolved',
      assignedTo: supportOfficer._id,
      resolution: 'Password reset guidance was shared and the customer confirmed account access was restored.',
      resolvedAt: new Date()
    }
  ]);
};

const ensureDemoSupportData = async () => {
  const supportOfficer = await ensureDemoSupportOfficer();
  const customer = await ensureDemoSupportCustomer();

  await ensureDemoSupportTickets(supportOfficer, customer);

  return supportOfficer;
};

module.exports = {
  DEMO_SUPPORT_EMAIL,
  DEMO_SUPPORT_PASSWORD,
  DEMO_SUPPORT_PASSWORD_ALIASES,
  ensureDemoSupportData
};
