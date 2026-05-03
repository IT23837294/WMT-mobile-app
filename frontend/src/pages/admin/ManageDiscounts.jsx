import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Percent, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Tag,
  Pill
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const DISCOUNTS_STORAGE_KEY = 'admin_discounts';
const DEFAULT_DISCOUNTS = [
  {
    _id: '1',
    code: 'WELCOME20',
    name: 'New Customer Discount',
    type: 'percentage',
    value: 20,
    minOrderAmount: 50,
    maxDiscount: 100,
    applicableMedicines: [],
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true,
    usageCount: 45
  },
  {
    _id: '2',
    code: 'FLAT50',
    name: 'Flat $50 Off',
    type: 'fixed',
    value: 50,
    minOrderAmount: 200,
    maxDiscount: 50,
    applicableMedicines: [],
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    isActive: true,
    usageCount: 12
  }
];

const ManageDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    applicableMedicines: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(DISCOUNTS_STORAGE_KEY, JSON.stringify(discounts));
    }
  }, [discounts, loading]);

  useEffect(() => {
    filterDiscounts();
  }, [discounts, searchTerm]);

  const fetchData = async () => {
    try {
      const medicinesRes = await axios.get('/api/medicines');
      setMedicines(medicinesRes.data.medicines || []);

      const storedDiscounts = localStorage.getItem(DISCOUNTS_STORAGE_KEY);
      if (storedDiscounts) {
        setDiscounts(JSON.parse(storedDiscounts));
      } else {
        setDiscounts(DEFAULT_DISCOUNTS);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterDiscounts = () => {
    let filtered = discounts;

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDiscounts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing
        setDiscounts(discounts.map(d => d._id === editingId ? { ...formData, _id: editingId } : d));
      } else {
        // Create new
        const newDiscount = { ...formData, _id: Date.now().toString(), usageCount: 0 };
        setDiscounts([...discounts, newDiscount]);
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        type: 'percentage',
        value: 0,
        minOrderAmount: 0,
        maxDiscount: 0,
        applicableMedicines: [],
        startDate: '',
        endDate: '',
        isActive: true
      });
    } catch (err) {
      setError('Failed to save discount');
    }
  };

  const editDiscount = (discount) => {
    setFormData(discount);
    setEditingId(discount._id);
    setShowForm(true);
  };

  const deleteDiscount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return;
    
    try {
      setDiscounts(discounts.filter(d => d._id !== id));
    } catch (err) {
      setError('Failed to delete discount');
    }
  };

  const toggleStatus = (id) => {
    setDiscounts(discounts.map(d => 
      d._id === id ? { ...d, isActive: !d.isActive } : d
    ));
  };

  const getDiscountLabel = (discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value}% off`;
    } else {
      return `$${discount.value} off`;
    }
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Manage Discounts"
        subtitle="Launch promotional campaigns, configure medicine eligibility, and keep discount timing and value rules easy to manage."
        icon={Percent}
        action={(
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                code: '',
                name: '',
                type: 'percentage',
                value: 0,
                minOrderAmount: 0,
                maxDiscount: 0,
                applicableMedicines: [],
                startDate: '',
                endDate: '',
                isActive: true
              });
              setShowForm(!showForm);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Discount</span>
          </button>
        )}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Discount Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Discount' : 'Create New Discount'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Discount Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="input"
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>
              <div>
                <label className="label">Discount Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="e.g., Winter Sale"
                  required
                />
              </div>
              <div>
                <label className="label">Discount Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="input"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  {formData.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Minimum Order Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Maximum Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: parseFloat(e.target.value) }))}
                  className="input"
                  placeholder="0 for no limit"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Applicable Medicines (Optional)</label>
              <select
                multiple
                value={formData.applicableMedicines}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  applicableMedicines: Array.from(e.target.selectedOptions, o => o.value)
                }))}
                className="input h-32"
              >
                {medicines.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all medicines. Hold Ctrl/Cmd to select multiple.</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-medical-600 focus:ring-medical-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Discount' : 'Create Discount'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiscounts.map((discount) => (
          <div key={discount._id} className={`card ${!discount.isActive ? 'opacity-60' : ''} ${isExpired(discount.endDate) ? 'border-red-300' : ''}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-medical-100 p-3 rounded-lg">
                <Tag className="h-6 w-6 text-medical-600" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => editDiscount(discount)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteDiscount(discount._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900">{discount.code}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${discount.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {discount.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{discount.name}</p>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-semibold text-medical-600">{getDiscountLabel(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min. Order:</span>
                <span>${discount.minOrderAmount}</span>
              </div>
              {discount.maxDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Discount:</span>
                  <span>${discount.maxDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Used:</span>
                <span>{discount.usageCount || 0} times</span>
              </div>
            </div>

            <div className="border-t pt-4 text-sm">
              <div className="flex items-center text-gray-600 mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}</span>
              </div>
              {isExpired(discount.endDate) && (
                <p className="text-red-600 font-medium">Expired</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => toggleStatus(discount._id)}
                className={`w-full py-2 rounded-lg text-sm font-medium ${discount.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
              >
                {discount.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDiscounts.length === 0 && (
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Percent className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No discounts found
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first discount code to attract customers
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Create Discount
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageDiscounts;
