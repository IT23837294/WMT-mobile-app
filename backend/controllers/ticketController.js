const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Supplier = require('../models/Supplier');

// ============================================================================
// DIRECT SUPPLIER MESSAGING - In-memory storage for direct messages
// NOTE: In production, this should be replaced with a database collection
// Stores messages keyed by supplierId for quick lookup
// ============================================================================
const directMessages = new Map();

// @desc    Create a new ticket (customer only)
// @route   POST /api/tickets
// @access  Private (customer)
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, description, priority } = req.body;

    const ticket = await Ticket.create({
      customerId: req.user.id,
      subject,
      category,
      description,
      priority: 'Medium' // Default priority
    });

    // Populate customer info for response
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'firstName lastName email name');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: populatedTicket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all tickets (support officer only)
// @route   GET /api/tickets
// @access  Private (support officer)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({})
      .populate('customerId', 'name firstName lastName email phone')
      .populate('assignedTo', 'name firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user's tickets (customer only)
// @route   GET /api/tickets/my
// @access  Private (customer)
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customerId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update ticket status (support officer only)
// @route   PATCH /api/tickets/:id
// @access  Private (support officer)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, assignedTo, resolution } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Update fields
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (resolution) ticket.resolution = resolution;

    await ticket.save();

    // Return populated ticket
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name firstName lastName email phone')
      .populate('assignedTo', 'name firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId', 'name firstName lastName email phone address')
      .populate('assignedTo', 'name firstName lastName')
      .populate('supplierId', 'name companyName contact.email contact.phone');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && ticket.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ticket'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Link supplier to ticket (support officer only)
// @route   PATCH /api/tickets/:id/link-supplier
// @access  Private (support officer)
exports.linkSupplierToTicket = async (req, res) => {
  try {
    const { supplierId } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    ticket.supplierId = supplierId;
    if (ticket.category !== 'Supplier Issue') {
      ticket.category = 'Supplier Issue';
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name firstName lastName email phone')
      .populate('assignedTo', 'name firstName lastName')
      .populate('supplierId', 'name companyName contact.email contact.phone');

    res.status(200).json({
      success: true,
      message: 'Supplier linked to ticket successfully',
      data: updatedTicket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send message to supplier (support officer only)
// @route   POST /api/tickets/:id/message
// @access  Private (support officer)
exports.sendMessageToSupplier = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (!ticket.supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Please link a supplier to this ticket first'
      });
    }

    ticket.messages.push({
      sender: 'support',
      senderId: req.user.id,
      message: message.trim(),
      timestamp: new Date()
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name firstName lastName email phone')
      .populate('assignedTo', 'name firstName lastName')
      .populate('supplierId', 'name companyName contact.email contact.phone');

    res.status(200).json({
      success: true,
      message: 'Message sent to supplier successfully',
      data: updatedTicket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get supplier tickets (supplier only)
// @route   GET /api/tickets/supplier/my
// @access  Private (supplier)
exports.getSupplierTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ supplierId: req.user.supplierId })
      .populate('customerId', 'name firstName lastName email')
      .populate('assignedTo', 'name firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send message from supplier (supplier only)
// @route   POST /api/tickets/:id/supplier-message
// @access  Private (supplier)
exports.sendSupplierMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (!ticket.supplierId || ticket.supplierId.toString() !== req.user.supplierId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to message this ticket'
      });
    }

    ticket.messages.push({
      sender: 'supplier',
      senderId: req.user.id,
      message: message.trim(),
      timestamp: new Date()
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name firstName lastName email')
      .populate('assignedTo', 'name firstName lastName')
      .populate('supplierId', 'name companyName contact.email contact.phone');

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: updatedTicket
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// DIRECT SUPPLIER MESSAGING - Support Officer Functions
// These functions allow support officers to send direct messages to suppliers
// without creating a ticket. Messages are stored in memory.
// ============================================================================

// @desc    Send direct message to supplier (support officer only)
// @route   POST /api/tickets/direct-message
// @access  Private (support officer)
exports.sendDirectMessageToSupplier = async (req, res) => {
  try {
    const { supplierId, message } = req.body;

    if (!supplierId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID and message are required'
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Store message in memory (key: supplierId, value: array of messages)
    const supplierMessages = directMessages.get(supplierId) || [];
    supplierMessages.push({
      sender: 'support',
      senderId: req.user.id,
      senderName: req.user.name,
      message: message.trim(),
      timestamp: new Date()
    });
    directMessages.set(supplierId, supplierMessages);

    res.status(200).json({
      success: true,
      message: 'Direct message sent to supplier successfully',
      data: {
        supplierId,
        message: message.trim(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// DIRECT SUPPLIER MESSAGING - Supplier Functions
// These functions allow suppliers to view direct messages from support officers
// ============================================================================

// @desc    Get direct messages for a supplier (supplier only)
// @route   GET /api/tickets/direct-messages
// @access  Private (supplier)
exports.getDirectMessagesForSupplier = async (req, res) => {
  try {
    const supplierId = req.user.supplierId;
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID not found in user profile'
      });
    }

    const messages = directMessages.get(supplierId.toString()) || [];

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all direct messages (support officer only)
// @route   GET /api/tickets/direct-messages/all
// @access  Private (support officer)
exports.getAllDirectMessages = async (req, res) => {
  try {
    const { supplierId } = req.query;
    
    if (supplierId) {
      const messages = directMessages.get(supplierId) || [];
      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
      });
    } else {
      // Return all messages grouped by supplier
      const allMessages = {};
      for (const [suppId, msgs] of directMessages.entries()) {
        const supplier = await Supplier.findById(suppId);
        allMessages[suppId] = {
          supplier: supplier ? {
            name: supplier.companyName || supplier.name,
            email: supplier.contact?.email
          } : null,
          messages: msgs
        };
      }
      
      res.status(200).json({
        success: true,
        data: allMessages
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
