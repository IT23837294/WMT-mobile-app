import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Plus, Search, Edit2, Trash2, Truck, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const ManageSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    let filtered = suppliers;
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.supplyStatus === statusFilter);
    }
    
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm, statusFilter]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data.suppliers);
      setFilteredSuppliers(response.data.suppliers);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await axios.delete(`/api/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const isAcceptingRequest = currentStatus !== 'active';

    if (isAcceptingRequest && !window.confirm('Accept this supplier request?')) {
      return;
    }

    try {
      await axios.put(`/api/suppliers/${id}/toggle-status`, { status: newStatus });
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update supplier status');
    }
  };

  const updateSupplierRequestStatus = async (id, status) => {
    const actionLabel = status === 'active' ? 'accept' : 'reject';

    if (!window.confirm(`${actionLabel === 'accept' ? 'Accept' : 'Reject'} this supplier request?`)) {
      return;
    }

    try {
      await axios.put(`/api/suppliers/${id}/toggle-status`, { status });
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update supplier request');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      case 'suspended':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        title="Manage Suppliers"
        subtitle="Track supplier partnerships, contact channels, payment standing, and product relationships with a cleaner admin view."
        icon={Truck}
        action={(
          <Link to="/admin/suppliers/new" className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Supplier</span>
          </Link>
        )}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No suppliers found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first supplier'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link to="/admin/suppliers/new" className="btn-primary">
              Add Supplier
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier._id} className="card">
              {supplier.supplyStatus === 'inactive' && supplier.notes?.toLowerCase().includes('pending admin review') && (
                <div className="mb-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Pending Supplier Request
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getStatusColor(supplier.supplyStatus)}`}>
                    {getStatusIcon(supplier.supplyStatus)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(supplier.supplyStatus)}`}>
                        {supplier.supplyStatus}
                      </span>
                      {supplier.preferredSupplier && (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                          Preferred Supplier
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {supplier.contact?.email && (
                        <p>Email: {supplier.contact.email}</p>
                      )}
                      {supplier.contact?.phone && (
                        <p>Phone: {supplier.contact.phone}</p>
                      )}
                      {supplier.address?.city && (
                        <p>Location: {supplier.address.city}, {supplier.address.state}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        supplier.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        supplier.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Payment: {supplier.paymentStatus}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-medium">Rating:</span> {Number(supplier.performance?.rating || 0).toFixed(1)} / 5
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-medium">On-time Delivery:</span> {Number(supplier.performance?.onTimeDeliveryRate || 0).toFixed(0)}%
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-medium">Order Accuracy:</span> {Number(supplier.performance?.orderAccuracyRate || 0).toFixed(0)}%
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-medium">Quality / Returns:</span> {supplier.performance?.qualityIssueCount || 0} / {supplier.performance?.returnCount || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  {supplier.supplyStatus === 'inactive' && supplier.notes?.toLowerCase().includes('pending admin review') ? (
                    <>
                      <button
                        onClick={() => updateSupplierRequestStatus(supplier._id, 'active')}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateSupplierRequestStatus(supplier._id, 'suspended')}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleStatus(supplier._id, supplier.supplyStatus)}
                      className="btn-secondary"
                    >
                      {supplier.supplyStatus === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  <Link
                    to={`/admin/suppliers/edit/${supplier._id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => deleteSupplier(supplier._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {supplier.suppliedItems && supplier.suppliedItems.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Supplier Catalog & Price List</p>
                  <div className="space-y-3">
                    {supplier.suppliedItems.map((item) => (
                      <div key={item._id || item.productName} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600">
                              <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
                                Unit Price: LKR {Number(item.unitPrice || 0).toFixed(2)}
                              </span>
                              <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
                                MOQ: {item.moq || 1}
                              </span>
                              <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
                                Lead Time: {item.leadTime || 'Not set'}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            Price changes: {item.priceHistory?.length || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : supplier.products && supplier.products.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Products Supplied:</p>
                  <div className="flex flex-wrap gap-2">
                    {supplier.products.map((product, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {supplier.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {supplier.notes}
                  </p>
                </div>
              )}

              {supplier.invoices && supplier.invoices.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Payments, Invoices & Statements</p>
                  <div className="space-y-3">
                    {supplier.invoices.map((invoice) => (
                      <div key={invoice._id || invoice.invoiceNo} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{invoice.invoiceNo}</p>
                            <p className="text-xs text-gray-500">
                              {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
                              Amount: LKR {Number(invoice.amount || 0).toFixed(2)}
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
                              Paid: LKR {Number(invoice.amountPaid || 0).toFixed(2)}
                            </span>
                            <span className={`rounded-full px-2 py-1 ${
                              invoice.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.paymentStatus === 'partially_paid'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {invoice.paymentStatus === 'partially_paid' ? 'Partially Paid' : invoice.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {supplier.monthlyStatements && supplier.monthlyStatements.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Monthly Statement Report</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {supplier.monthlyStatements.map((statement) => (
                          <div key={statement.month} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">{statement.month}</p>
                            <p className="mt-1">Invoiced: LKR {Number(statement.totalInvoiced || 0).toFixed(2)}</p>
                            <p>Paid: LKR {Number(statement.totalPaid || 0).toFixed(2)}</p>
                            <p>Balance: LKR {Number(statement.balance || 0).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageSuppliers;
