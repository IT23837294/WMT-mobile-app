import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    contact: {
      email: '',
      phone: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    paymentStatus: 'pending',
    supplyStatus: 'active',
    deliveryPricePerItem: '',
    returnPolicy: {
      acceptsDamagedReturns: false,
      acceptsExpiredExchanges: false
    },
    deliveryCommitment: {
      deliversOnTime: false
    },
    preferredSupplier: false,
    performance: {
      onTimeDeliveryRate: 0,
      orderAccuracyRate: 0,
      qualityIssueCount: 0,
      returnCount: 0
    },
    products: [],
    suppliedItems: [],
    invoices: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const response = await axios.get(`/api/suppliers/${id}`);
      const supplier = response.data.supplier;
      setFormData({
        companyName: supplier.companyName || '',
        name: supplier.name,
        contact: supplier.contact || { email: '', phone: '' },
        address: supplier.address || { street: '', city: '', state: '', zipCode: '', country: 'India' },
        paymentStatus: supplier.paymentStatus || 'pending',
        supplyStatus: supplier.supplyStatus || 'active',
        deliveryPricePerItem: supplier.deliveryPricePerItem ?? '',
        returnPolicy: supplier.returnPolicy || {
          acceptsDamagedReturns: false,
          acceptsExpiredExchanges: false
        },
        deliveryCommitment: supplier.deliveryCommitment || {
          deliversOnTime: false
        },
        preferredSupplier: supplier.preferredSupplier || false,
        performance: supplier.performance || {
          onTimeDeliveryRate: 0,
          orderAccuracyRate: 0,
          qualityIssueCount: 0,
          returnCount: 0
        },
        products: supplier.products || [],
        suppliedItems: supplier.suppliedItems || [],
        invoices: supplier.invoices || [],
        notes: supplier.notes || ''
      });
    } catch (err) {
      setError('Failed to load supplier data');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [field]: value }
      }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (name.startsWith('performance.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        performance: { ...prev.performance, [field]: value }
      }));
    } else if (name.startsWith('returnPolicy.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        returnPolicy: { ...prev.returnPolicy, [field]: value === 'true' }
      }));
    } else if (name.startsWith('deliveryCommitment.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deliveryCommitment: { ...prev.deliveryCommitment, [field]: value === 'true' }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const addCatalogItem = () => {
    setFormData(prev => ({
      ...prev,
      suppliedItems: [
        ...prev.suppliedItems,
        {
          productName: '',
          unitPrice: '',
          moq: '1',
          leadTime: '',
          priceHistory: []
        }
      ]
    }));
  };

  const updateCatalogItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      suppliedItems: prev.suppliedItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const removeCatalogItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      suppliedItems: prev.suppliedItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const addInvoice = () => {
    setFormData((prev) => ({
      ...prev,
      invoices: [
        ...prev.invoices,
        {
          invoiceNo: '',
          invoiceDate: '',
          amount: '',
          amountPaid: '',
          attachmentUrl: '',
          notes: ''
        }
      ]
    }));
  };

  const updateInvoice = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((invoice, invoiceIndex) =>
        invoiceIndex === index
          ? { ...invoice, [field]: value }
          : invoice
      )
    }));
  };

  const removeInvoice = (index) => {
    setFormData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((_, invoiceIndex) => invoiceIndex !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const suppliedItems = formData.suppliedItems
        .map((item) => ({
          ...item,
          productName: item.productName?.trim(),
          unitPrice: item.unitPrice === '' ? '' : Number(item.unitPrice),
          moq: item.moq === '' ? 1 : Number(item.moq),
          leadTime: item.leadTime?.trim() || ''
        }))
        .filter((item) => item.productName);

      const invoices = formData.invoices
        .map((invoice) => ({
          ...invoice,
          invoiceNo: invoice.invoiceNo?.trim(),
          invoiceDate: invoice.invoiceDate,
          amount: invoice.amount === '' ? '' : Number(invoice.amount),
          amountPaid: invoice.amountPaid === '' ? 0 : Number(invoice.amountPaid),
          attachmentUrl: invoice.attachmentUrl?.trim() || '',
          notes: invoice.notes?.trim() || ''
        }))
        .filter((invoice) => invoice.invoiceNo && invoice.invoiceDate);

      const payload = {
        ...formData,
        performance: {
          onTimeDeliveryRate: Number(formData.performance.onTimeDeliveryRate || 0),
          orderAccuracyRate: Number(formData.performance.orderAccuracyRate || 0),
          qualityIssueCount: Number(formData.performance.qualityIssueCount || 0),
          returnCount: Number(formData.performance.returnCount || 0)
        },
        suppliedItems,
        invoices,
        products: suppliedItems.map((item) => item.productName)
      };

      if (isEdit) {
        await axios.put(`/api/suppliers/${id}`, payload);
      } else {
        await axios.post('/api/suppliers', payload);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/suppliers');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Supplier {isEdit ? 'Updated' : 'Created'} Successfully!
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/admin/suppliers')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Suppliers
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update supplier details' : 'Register a new medicine supplier'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Supplier Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="contact.email"
              value={formData.contact.email}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              name="contact.phone"
              value={formData.contact.phone}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Payment Status</label>
            <select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              className="input"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="label">Supply Status</label>
            <select
              name="supplyStatus"
              value={formData.supplyStatus}
              onChange={handleChange}
              className="input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              </select>
          </div>

          <div>
            <label className="label">Delivery Price Per Item (LKR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="deliveryPricePerItem"
              value={formData.deliveryPricePerItem}
              onChange={handleChange}
              className="input"
              placeholder="Enter delivery price per item"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
            <input
              type="checkbox"
              id="preferredSupplier"
              name="preferredSupplier"
              checked={formData.preferredSupplier}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="preferredSupplier" className="text-sm font-medium text-amber-900">
              Mark as Preferred Supplier for automatic PO suggestions
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Supplier Performance Tracking</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="label">On-time Delivery %</label>
              <input
                type="number"
                min="0"
                max="100"
                name="performance.onTimeDeliveryRate"
                value={formData.performance.onTimeDeliveryRate}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Order Accuracy %</label>
              <input
                type="number"
                min="0"
                max="100"
                name="performance.orderAccuracyRate"
                value={formData.performance.orderAccuracyRate}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Quality Issues</label>
              <input
                type="number"
                min="0"
                name="performance.qualityIssueCount"
                value={formData.performance.qualityIssueCount}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Returns</label>
              <input
                type="number"
                min="0"
                name="performance.returnCount"
                value={formData.performance.returnCount}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
          {isEdit && typeof formData.performance.rating === 'number' && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Calculated supplier rating: <span className="font-semibold">{Number(formData.performance.rating).toFixed(1)} / 5</span>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Delivery Commitment</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="label">Do you deliver on time period?</label>
              <select
                name="deliveryCommitment.deliversOnTime"
                value={formData.deliveryCommitment.deliversOnTime ? 'true' : 'false'}
                onChange={handleChange}
                className="input"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Return Policy</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="label">Can damaged medicines be returned?</label>
              <select
                name="returnPolicy.acceptsDamagedReturns"
                value={formData.returnPolicy.acceptsDamagedReturns ? 'true' : 'false'}
                onChange={handleChange}
                className="input"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            <div>
              <label className="label">Can expired medicines be exchanged?</label>
              <select
                name="returnPolicy.acceptsExpiredExchanges"
                value={formData.returnPolicy.acceptsExpiredExchanges ? 'true' : 'false'}
                onChange={handleChange}
                className="input"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="input"
                placeholder="Street Address"
              />
            </div>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              className="input"
              placeholder="City"
            />
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              className="input"
              placeholder="State"
            />
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              className="input"
              placeholder="ZIP Code"
            />
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
              className="input"
              placeholder="Country"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Payments, Invoices & Statements</h3>
              <p className="mt-1 text-sm text-gray-600">
                Record supplier invoices and track unpaid, partially paid, and paid amounts.
              </p>
            </div>
            <button
              type="button"
              onClick={addInvoice}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Invoice</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.invoices.map((invoice, index) => {
              const amount = Number(invoice.amount || 0);
              const amountPaid = Number(invoice.amountPaid || 0);
              const paymentState = amountPaid >= amount && amount > 0
                ? 'Paid'
                : amountPaid > 0
                  ? 'Partially Paid'
                  : 'Unpaid';

              return (
                <div key={invoice._id || index} className="rounded-xl border border-gray-200 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label className="label">Invoice No</label>
                      <input
                        type="text"
                        value={invoice.invoiceNo || ''}
                        onChange={(e) => updateInvoice(index, 'invoiceNo', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Invoice Date</label>
                      <input
                        type="date"
                        value={invoice.invoiceDate ? String(invoice.invoiceDate).split('T')[0] : ''}
                        onChange={(e) => updateInvoice(index, 'invoiceDate', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Invoice Amount (LKR)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoice.amount ?? ''}
                        onChange={(e) => updateInvoice(index, 'amount', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Amount Paid (LKR)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoice.amountPaid ?? ''}
                        onChange={(e) => updateInvoice(index, 'amountPaid', e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Invoice File URL</label>
                      <input
                        type="text"
                        value={invoice.attachmentUrl || ''}
                        onChange={(e) => updateInvoice(index, 'attachmentUrl', e.target.value)}
                        className="input"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <input
                        type="text"
                        value={invoice.notes || ''}
                        onChange={(e) => updateInvoice(index, 'notes', e.target.value)}
                        className="input"
                        placeholder="Invoice remarks"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      Payment Status: {paymentState}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInvoice(index)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Invoice
                    </button>
                  </div>
                </div>
              );
            })}

            {formData.invoices.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No invoices recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Supplier Catalog & Price List</h3>
              <p className="mt-1 text-sm text-gray-600">
                Maintain supplied products, unit price, MOQ, lead time, and price history.
              </p>
            </div>
            <button
              type="button"
              onClick={addCatalogItem}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.suppliedItems.map((item, index) => (
              <div key={item._id || index} className="rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="label">Product / Medicine</label>
                    <input
                      type="text"
                      value={item.productName || ''}
                      onChange={(e) => updateCatalogItem(index, 'productName', e.target.value)}
                      className="input"
                      placeholder="Panadol"
                    />
                  </div>
                  <div>
                    <label className="label">Unit Price (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice ?? ''}
                      onChange={(e) => updateCatalogItem(index, 'unitPrice', e.target.value)}
                      className="input"
                      placeholder="39.00"
                    />
                  </div>
                  <div>
                    <label className="label">MOQ</label>
                    <input
                      type="number"
                      min="1"
                      value={item.moq ?? '1'}
                      onChange={(e) => updateCatalogItem(index, 'moq', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Lead Time</label>
                    <input
                      type="text"
                      value={item.leadTime || ''}
                      onChange={(e) => updateCatalogItem(index, 'leadTime', e.target.value)}
                      className="input"
                      placeholder="2-5 days"
                    />
                  </div>
                </div>

                {item.priceHistory?.length > 0 && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-700">Price History</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.priceHistory
                        .slice()
                        .reverse()
                        .map((historyItem, historyIndex) => (
                          <span key={historyIndex} className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
                            LKR {Number(historyItem.unitPrice || 0).toFixed(2)} on {new Date(historyItem.changedAt).toLocaleDateString()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCatalogItem(index)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Item
                  </button>
                </div>
              </div>
            ))}

            {formData.suppliedItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                No catalog items added yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input h-24"
            placeholder="Additional notes about this supplier..."
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/suppliers')}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Supplier' : 'Create Supplier')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
