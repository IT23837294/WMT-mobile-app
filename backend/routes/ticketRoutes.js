const express = require('express');
const router = express.Router();
const { protect, isSupportOfficer, authorize } = require('../middleware/auth');
const {
  createTicket,
  getAllTickets,
  getMyTickets,
  updateTicketStatus,
  getTicketById,
  linkSupplierToTicket,
  sendMessageToSupplier,
  getSupplierTickets,
  sendSupplierMessage,
  sendDirectMessageToSupplier,
  getDirectMessagesForSupplier,
  getAllDirectMessages
} = require('../controllers/ticketController');

// ============================================================================
// CUSTOMER ROUTES - Ticket creation and viewing
// ============================================================================
router.post('/', protect, authorize('customer'), createTicket);
router.get('/my', protect, authorize('customer'), getMyTickets);

// ============================================================================
// SUPPORT OFFICER ROUTES - Ticket management and supplier communication
// ============================================================================
router.get('/', protect, isSupportOfficer, getAllTickets);
router.patch('/:id', protect, isSupportOfficer, updateTicketStatus);
router.patch('/:id/link-supplier', protect, isSupportOfficer, linkSupplierToTicket);
router.post('/:id/message', protect, isSupportOfficer, sendMessageToSupplier);

// ============================================================================
// DIRECT SUPPLIER MESSAGING ROUTES - Support Officer Functions
// These routes allow support officers to send direct messages without tickets
// ============================================================================
router.post('/direct-message', protect, isSupportOfficer, sendDirectMessageToSupplier);
router.get('/direct-messages/all', protect, isSupportOfficer, getAllDirectMessages);

// ============================================================================
// SUPPLIER ROUTES - Ticket viewing and messaging
// ============================================================================
router.get('/supplier/my', protect, authorize('supplier'), getSupplierTickets);
router.post('/:id/supplier-message', protect, authorize('supplier'), sendSupplierMessage);
router.get('/direct-messages', protect, authorize('supplier'), getDirectMessagesForSupplier);

// ============================================================================
// COMMON ROUTES - Accessible by multiple roles with controller-level auth checks
// ============================================================================
router.get('/:id', protect, getTicketById);

module.exports = router;
