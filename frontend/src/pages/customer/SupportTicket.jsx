/**
 * ===========================================
 * SupportTicket.jsx - CUSTOMER SUPPORT TICKET PAGE
 * ===========================================
 * 
 * PURPOSE: Allows customers to create and view support tickets
 * 
 * KEY CONCEPTS:
 * - Form submission for ticket creation
 * - Display user's ticket history
 * - Toast notifications for user feedback
 * - Responsive design with Tailwind CSS
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';

const SupportTicket = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Order Issue',
    description: ''
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [jotformLoaded, setJotformLoaded] = useState(false);
  const [loadingAttempt, setLoadingAttempt] = useState(0);

  // Fetch user's tickets on component mount and load Jotform
  useEffect(() => {
    fetchMyTickets();
    loadJotformBot();
  }, []);

  const loadJotformBot = () => {
    setLoadingAttempt(prev => prev + 1);
    
    // Method 1: Try direct script loading
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/agent/embedjs/019dcf74f0a27e1091c9eff5da76c4466df8/embed.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Jotform script loaded successfully');
      setTimeout(() => {
        if (window.JotformAgent || window.JotformChatbot) {
          setJotformLoaded(true);
          console.log('Jotform agent available');
        } else {
          console.log('Jotform agent not found, trying fallback');
          loadJotformFallback();
        }
      }, 2000);
    };
    
    script.onerror = () => {
      console.error('Jotform script failed to load, trying fallback');
      loadJotformFallback();
    };
    
    document.head.appendChild(script);
  };

  const loadJotformFallback = () => {
    // Method 2: Try iframe fallback
    console.log('Loading Jotform via iframe fallback');
    setJotformLoaded(true);
  };

  const fetchMyTickets = async () => {
    try {
      const response = await axios.get('/api/tickets/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTickets(response.data.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/tickets', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Your ticket has been submitted. We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        subject: '',
        category: 'Order Issue',
        description: ''
      });
      
      // Refresh tickets list
      fetchMyTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

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

  const handleChatToggle = () => {
    if (!jotformLoaded) {
      toast.error('Chatbot is still loading. Please wait a moment...');
      return;
    }
    
    setChatOpen(!chatOpen);
    
    // Try to activate Jotform agent if available
    if (window.JotformAgent && window.JotformAgent.open) {
      window.JotformAgent.open();
    } else if (window.JotformChatbot && window.JotformChatbot.open) {
      window.JotformChatbot.open();
    }
  };

  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Support</h1>
        <p className="text-gray-600">Submit a support ticket or track your existing tickets</p>
      </div>

      {/* Ticket Submission Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit New Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              >
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Account Issue">Account Issue</option>
                <option value="Product Issue">Product Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              placeholder="Please provide detailed information about your issue"
            />
          </div>

          
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-medical-600 text-white font-medium rounded-md hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>

      {/* Tickets History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Tickets</h2>
        
        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">You haven't submitted any tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ticket._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {ticket.category}
                    </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleChatToggle}
          className="bg-medical-600 hover:bg-medical-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden group-hover:inline-block pr-2">
            {!jotformLoaded ? 'Loading...' : 'Chat with us'}
          </span>
        </button>
      </div>

      {/* Jotform Chatbot Fallback Iframe */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className="relative">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -top-10 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
            >
              ×
            </button>
            <iframe
              src="https://form.jotform.com/019dcf74f0a27e1091c9eff5da76c4466"
              className="w-96 h-[600px] border-0 rounded-lg shadow-2xl"
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              title="Customer Support Chatbot"
              onLoad={() => console.log('Jotform iframe loaded')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;
