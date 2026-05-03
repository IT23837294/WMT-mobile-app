/**
 * ===========================================
 * SupportDashboard.jsx - SUPPORT OFFICER DASHBOARD
 * ===========================================
 * 
 * PURPOSE: Dashboard for support officers to manage customer tickets and communicate with suppliers
 * 
 * KEY CONCEPTS:
 * - Ticket queue management
 * - Customer profile viewing and editing
 * - Status updates
 * - Role-based access control
 * - Supplier messaging (both ticket-based and direct)
 * 
 * SECTIONS:
 * 1. State Management - Tickets, customers, suppliers, messages
 * 2. Data Fetching - Tickets, suppliers, customer details
 * 3. Ticket Operations - Status updates, customer viewing
 * 4. Supplier Messaging - Link suppliers, send messages (ticket-based)
 * 5. Direct Supplier Messaging - Send messages without tickets
 * 6. Refund Processing - Order lookup and refund handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, DollarSign, Package, AlertCircle, MessageSquare, User, Send } from 'lucide-react';

const SupportDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('tickets'); // 'tickets', 'customer', 'refund', 'supplier-message', or 'direct-supplier-message'

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Refund specific states
  const [orderId, setOrderId] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  // Supplier messaging states (ticket-based)
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierTicket, setSelectedSupplierTicket] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [supplierMessageLoading, setSupplierMessageLoading] = useState(false);

  // Direct supplier messaging states (without tickets)
  const [directSupplierMessages, setDirectSupplierMessages] = useState({});

  // Load direct messages when supplier is selected
  useEffect(() => {
    if (selectedSupplier && view === 'direct-supplier-message') {
      loadDirectMessages(selectedSupplier);
    }
  }, [selectedSupplier, view]);

  const loadDirectMessages = async (supplierId) => {
    try {
      const response = await axios.get(`/api/tickets/direct-messages/all?supplierId=${supplierId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDirectSupplierMessages(prev => ({
        ...prev,
        [supplierId]: response.data.data
      }));
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  };

  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================

  // Fetch all tickets on component mount
  useEffect(() => {
    fetchAllTickets();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuppliers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/tickets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTickets(response.data.data);
      if (response.data.data.length === 0) {
        toast('No tickets found. Customers can create tickets from the Support page.', { icon: 'ℹ️' });
      } else {
        toast.success(`Loaded ${response.data.data.length} tickets`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await axios.get(`/api/auth/users/${customerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedCustomer(response.data.user);
      setView('customer');
    } catch (error) {
      toast.error('Failed to fetch customer details');
      console.error('Error fetching customer:', error);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.patch(`/api/tickets/${ticketId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Ticket status updated successfully');
      fetchAllTickets(); // Refresh tickets
    } catch (error) {
      toast.error('Failed to update ticket status');
      console.error('Error updating ticket:', error);
    }
  };

  // Refund functions
  const lookupOrder = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an Order ID');
      return;
    }

    setRefundLoading(true);
    try {
      const response = await axios.get(`/api/refunds/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setOrderDetails(response.data.data);
      toast.success('Order details loaded successfully');
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 404) {
        toast.error('Order not found');
      } else {
        toast.error('Failed to fetch order details');
      }
      setOrderDetails(null);
    } finally {
      setRefundLoading(false);
    }
  };

  const processRefund = async () => {
    if (!orderDetails) {
      toast.error('Please look up an order first');
      return;
    }

    if (orderDetails.order.orderStatus === 'refunded') {
      toast.error('Order has already been refunded');
      return;
    }

    setRefundLoading(true);
    try {
      const response = await axios.post('/api/refunds', {
        order_id: orderDetails.order.id,
        reason: refundReason || 'Customer requested refund',
        processed_by: user._id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Refund processed successfully!');
      
      // Reset form
      setOrderId('');
      setOrderDetails(null);
      setRefundReason('');
      
      // Show success details
      const refundData = response.data.data;
      toast.success(`Refunded ₹${refundData.refundedAmount} for order ${refundData.orderNumber}`, {
        duration: 5000
      });
      
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const updateCustomerProfile = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      const updateData = {
        firstName: selectedCustomer.name?.split(' ')[0] || '',
        lastName: selectedCustomer.name?.split(' ').slice(1).join(' ') || '',
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address
      };

      await axios.patch(`/api/auth/users/${selectedCustomer._id}`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Customer profile updated successfully');
      fetchCustomerDetails(selectedCustomer._id); // Refresh customer data
    } catch (error) {
      toast.error('Failed to update customer profile');
      console.error('Error updating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (field, value) => {
    setSelectedCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ============================================================================
  // SUPPLIER MESSAGING FUNCTIONS (Ticket-based)
  // These functions handle messaging through tickets with supplier issues
  // ============================================================================

  const openSupplierMessageView = (ticket) => {
    setSelectedSupplierTicket(ticket);
    setSelectedSupplier(ticket.supplierId?._id || '');
    setNewMessage('');
    setView('supplier-message');
  };

  const linkSupplierToTicket = async () => {
    if (!selectedSupplierTicket || !selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }

    try {
      await axios.patch(`/api/tickets/${selectedSupplierTicket._id}/link-supplier`, {
        supplierId: selectedSupplier
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Supplier linked successfully');
      fetchAllTickets();
      setSelectedSupplierTicket(prev => ({
        ...prev,
        supplierId: suppliers.find(s => s._id === selectedSupplier)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link supplier');
    }
  };

  const sendMessageToSupplier = async () => {
    if (!selectedSupplierTicket || !newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedSupplierTicket.supplierId) {
      toast.error('Please link a supplier to this ticket first');
      return;
    }

    setSupplierMessageLoading(true);
    try {
      await axios.post(`/api/tickets/${selectedSupplierTicket._id}/message`, {
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Message sent to supplier');
      setNewMessage('');

      // Refresh ticket to get updated messages
      const response = await axios.get(`/api/tickets/${selectedSupplierTicket._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedSupplierTicket(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSupplierMessageLoading(false);
    }
  };

  // ============================================================================
  // DIRECT SUPPLIER MESSAGING FUNCTIONS (Without tickets)
  // These functions allow support officers to send messages without creating tickets
  // ============================================================================

  const openDirectSupplierMessage = () => {
    setSelectedSupplier('');
    setNewMessage('');
    setView('direct-supplier-message');
  };

  const sendDirectMessageToSupplier = async () => {
    if (!selectedSupplier || !newMessage.trim()) {
      toast.error('Please select a supplier and enter a message');
      return;
    }

    setSupplierMessageLoading(true);
    try {
      await axios.post('/api/tickets/direct-message', {
        supplierId: selectedSupplier,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Message sent to supplier successfully');
      setNewMessage('');

      // Store message in local state for history
      setDirectSupplierMessages(prev => ({
        ...prev,
        [selectedSupplier]: [
          ...(prev[selectedSupplier] || []),
          {
            sender: 'support',
            message: newMessage,
            timestamp: new Date()
          }
        ]
      }));

      // Refresh messages from server
      const response = await axios.get(`/api/tickets/direct-messages/all?supplierId=${selectedSupplier}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDirectSupplierMessages(prev => ({
        ...prev,
        [selectedSupplier]: response.data.data
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSupplierMessageLoading(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS - Status colors and helpers
  // ============================================================================

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ============================================================================
  // UI RENDERING - Main dashboard layout and views
  // ============================================================================

  // ============================================================================
  // CUSTOMER VIEW - Display and edit customer profile
  // ============================================================================
  if (view === 'customer' && selectedCustomer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setView('tickets')}
            className="flex items-center text-medical-600 hover:text-medical-700 mb-4"
          >
            ← Back to Tickets
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Customer Profile</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editable Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={selectedCustomer.name?.split(' ')[0] || ''}
                  onChange={(e) => {
                    const firstName = e.target.value;
                    const lastName = selectedCustomer.name?.split(' ').slice(1).join(' ') || '';
                    handleCustomerChange('name', `${firstName} ${lastName}`.trim());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={selectedCustomer.name?.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => {
                    const firstName = selectedCustomer.name?.split(' ')[0] || '';
                    const lastName = e.target.value;
                    handleCustomerChange('name', `${firstName} ${lastName}`.trim());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedCustomer.email || ''}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={selectedCustomer.phone || ''}
                  onChange={(e) => handleCustomerChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                <input
                  type="text"
                  value={selectedCustomer.address?.street || ''}
                  onChange={(e) => handleCustomerChange('address', {
                    ...selectedCustomer.address,
                    street: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={selectedCustomer.address?.city || ''}
                  onChange={(e) => handleCustomerChange('address', {
                    ...selectedCustomer.address,
                    city: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={selectedCustomer.address?.zipCode || ''}
                  onChange={(e) => handleCustomerChange('address', {
                    ...selectedCustomer.address,
                    zipCode: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
            </div>
          </div>

          {/* Non-editable Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCustomer.totalOrders || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {selectedCustomer.role}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={updateCustomerProfile}
              disabled={loading}
              className="px-6 py-2 bg-medical-600 text-white font-medium rounded-md hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setView('tickets')}
              className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Officer Dashboard</h1>
          <p className="text-gray-600">Manage customer support tickets and assist users</p>
        </div>

        {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2zm0 2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-red-600">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3l3 3m-3-3l-3 3m0 6l-3-3m6 3l-3-3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0 2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => fetchAllTickets()}
            className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M4 8h16M4 12h16" />
            </svg>
            Refresh All Tickets
          </button>
          
          <button
            onClick={() => {
              const openTickets = tickets.filter(t => t.status === 'open');
              if (openTickets.length > 0) {
                toast.info(`${openTickets.length} open tickets need attention`);
              } else {
                toast('No open tickets at the moment');
              }
            }}
            className="flex items-center justify-center px-4 py-3 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check Open Tickets
          </button>
          
          <button
            onClick={() => setView('refund')}
            className="flex items-center justify-center px-4 py-3 bg-medical-50 text-medical-700 rounded-md hover:bg-medical-100 transition-colors"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Process Refund
          </button>

          <button
            onClick={() => {
              const supplierTickets = tickets.filter(t => t.category === 'Supplier Issue');
              if (supplierTickets.length > 0) {
                openSupplierMessageView(supplierTickets[0]);
                toast.info(`Opened supplier communication for ${supplierTickets.length} ticket(s)`);
              } else {
                toast('No supplier issue tickets found');
              }
            }}
            className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Message Supplier (Ticket)
          </button>

          <button
            onClick={openDirectSupplierMessage}
            className="flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
          >
            <Send className="w-5 h-5 mr-2" />
            Direct Message Supplier
          </button>

          <button
            onClick={() => {
              const resolvedToday = tickets.filter(t => 
                t.status === 'resolved' && 
                new Date(t.updatedAt).toDateString() === new Date().toDateString()
              );
              if (resolvedToday.length > 0) {
                toast.success(`Resolved ${resolvedToday.length} tickets today!`);
              } else {
                toast('No tickets resolved today');
              }
            }}
            className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0 2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
            Today's Resolutions
          </button>
        </div>
      </div>

      {/* Ticket Queue */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Ticket Queue</h2>
          <button
            onClick={fetchAllTickets}
            disabled={loading}
            className="px-4 py-2 bg-medical-600 text-white text-sm font-medium rounded-md hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh Tickets'}
          </button>
        </div>
        
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No tickets available.</p>
            <p className="text-sm text-gray-400">Ask customers to create support tickets, or click refresh to check for new tickets.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ticket._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.customerId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(ticket.status)}`}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchCustomerDetails(ticket.customerId._id)}
                        className="text-medical-600 hover:text-medical-900 font-medium mr-3"
                      >
                        View Customer
                      </button>
                      {ticket.category === 'Supplier Issue' && (
                        <button
                          onClick={() => openSupplierMessageView(ticket)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          Message Supplier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DIRECT SUPPLIER MESSAGING VIEW - Send messages without tickets */}
      {view === 'direct-supplier-message' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <button
              onClick={() => setView('tickets')}
              className="flex items-center text-medical-600 hover:text-medical-700 mb-4"
            >
              ← Back to Tickets
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Send className="w-6 h-6 mr-2" />
              Direct Message Supplier
            </h2>
            <p className="text-gray-600">Send a direct message to any supplier without creating a ticket</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Select Supplier
            </h3>
            <div className="flex gap-4">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.companyName || supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSupplier && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Selected Supplier</h3>
                {(() => {
                  const supplier = suppliers.find(s => s._id === selectedSupplier);
                  return (
                    <>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Name:</span> {supplier?.companyName || supplier?.name}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Email:</span> {supplier?.contact?.email || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Phone:</span> {supplier?.contact?.phone || 'N/A'}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Message History for this supplier */}
              {directSupplierMessages[selectedSupplier] && directSupplierMessages[selectedSupplier].length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Messages</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-3">
                      {directSupplierMessages[selectedSupplier].map((msg, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            msg.sender === 'support'
                              ? 'bg-blue-100 ml-8'
                              : 'bg-green-100 mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {msg.sender === 'support' ? 'You' : 'Supplier'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </h3>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  placeholder="Type your message to the supplier..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 mb-3"
                />
                <button
                  onClick={sendDirectMessageToSupplier}
                  disabled={supplierMessageLoading || !newMessage.trim()}
                  className="px-4 py-2 bg-medical-600 text-white font-medium rounded-md hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {supplierMessageLoading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Refund Section */}
      {view === 'refund' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <button
              onClick={() => setView('tickets')}
              className="flex items-center text-medical-600 hover:text-medical-700 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Process Refund & Restock</h2>
            <p className="text-gray-600">Look up an order and process a full refund with automatic medicine restocking</p>
          </div>

          {/* Order Lookup */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Order Lookup
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <button
                onClick={lookupOrder}
                disabled={refundLoading}
                className="px-6 py-2 bg-medical-600 text-white font-medium rounded-md hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 disabled:opacity-50"
              >
                {refundLoading ? 'Looking up...' : 'Look Up Order'}
              </button>
            </div>
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="font-medium text-gray-900">{orderDetails.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium text-gray-900">{orderDetails.order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(orderDetails.order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      orderDetails.order.orderStatus === 'refunded' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {orderDetails.order.orderStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-gray-900">₹{orderDetails.order.finalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium text-gray-900">{orderDetails.order.items.length} items</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Medicines Ordered</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderDetails.order.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.medicineName}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">₹{item.unitPrice}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">₹{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Eligibility Check */}
                {orderDetails.order.orderStatus === 'refunded' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <p className="text-red-800 font-medium">Order has already been refunded</p>
                    </div>
                  </div>
                )}

                {orderDetails.order.orderStatus === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <p className="text-red-800 font-medium">Order has been cancelled and cannot be refunded</p>
                    </div>
                  </div>
                )}

                {orderDetails.order.orderStatus !== 'refunded' && orderDetails.order.orderStatus !== 'cancelled' && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Refund Reason (Optional)
                      </label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        rows={3}
                        placeholder="Enter reason for refund..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-yellow-800 font-medium">Refund Summary</p>
                          <p className="text-yellow-700 text-sm">
                            Processing this refund will:
                          </p>
                          <ul className="text-yellow-700 text-sm mt-1 ml-4 list-disc">
                            <li>Update order status to "refunded"</li>
                            <li>Refund ₹{orderDetails.order.finalAmount} to customer</li>
                            <li>Restock all medicines to inventory</li>
                            <li>Create refund and restock records</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={processRefund}
                      disabled={refundLoading}
                      className="w-full md:w-auto px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {refundLoading ? 'Processing Refund...' : 'Process Refund & Restock'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default SupportDashboard;
