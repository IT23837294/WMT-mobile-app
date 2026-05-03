import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertTriangle, 
  AlertCircle,
  Calendar,
  Trash2,
  RefreshCw,
  Package,
  Clock,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const Alerts = () => {
  const [alerts, setAlerts] = useState({
    lowStock: [],
    nearExpiry: [],
    expired: []
  });
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, typeFilter]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/medicines/alerts');
      const apiAlerts = response.data.alerts || {};
      setAlerts({
        lowStock: apiAlerts.lowStock || [],
        nearExpiry: apiAlerts.nearExpiry || apiAlerts.expiringSoon || [],
        expired: apiAlerts.expired || []
      });
    } catch (err) {
      // If API doesn't exist, try fetching medicines and calculating alerts
      try {
        const medicinesRes = await axios.get('/api/medicines');
        const medicines = medicinesRes.data.medicines || [];
        
        const today = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

        const lowStock = medicines.filter(m => m.stockQuantity <= (m.threshold || 10));
        const nearExpiry = medicines.filter(m => {
          if (!m.expiryDate) return false;
          const expiry = new Date(m.expiryDate);
          return expiry > today && expiry <= oneMonthFromNow;
        });
        const expired = medicines.filter(m => {
          if (!m.expiryDate) return false;
          return new Date(m.expiryDate) < today;
        });

        setAlerts({ lowStock, nearExpiry, expired });
      } catch (err2) {
        setError('Failed to load alerts');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let allAlerts = [];

    if (typeFilter === 'all' || typeFilter === 'lowStock') {
      allAlerts = [...allAlerts, ...alerts.lowStock.map(a => ({ ...a, alertType: 'lowStock' }))];
    }
    if (typeFilter === 'all' || typeFilter === 'nearExpiry') {
      allAlerts = [...allAlerts, ...alerts.nearExpiry.map(a => ({ ...a, alertType: 'nearExpiry' }))];
    }
    if (typeFilter === 'all' || typeFilter === 'expired') {
      allAlerts = [...allAlerts, ...alerts.expired.map(a => ({ ...a, alertType: 'expired' }))];
    }

    if (searchTerm) {
      allAlerts = allAlerts.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAlerts(allAlerts);
  };

  const removeExpiredMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to remove this expired medicine?')) return;
    
    try {
      await axios.delete(`/api/medicines/${id}`);
      fetchAlerts();
    } catch (err) {
      setError('Failed to remove medicine');
    }
  };

  const restockMedicine = async (medicine) => {
    // Navigate to medicine edit or create supplier order
    window.location.href = `/admin/supplier-orders?medicine=${medicine._id}`;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'lowStock':
        return <Package className="h-5 w-5 text-orange-600" />;
      case 'expiringSoon':
      case 'nearExpiry':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'lowStock':
        return 'bg-orange-50 border-orange-200';
      case 'expiringSoon':
      case 'nearExpiry':
        return 'bg-yellow-50 border-yellow-200';
      case 'expired':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertLabel = (type) => {
    switch (type) {
      case 'lowStock':
        return 'Low Stock';
      case 'expiringSoon':
      case 'nearExpiry':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return 'Alert';
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  const totalAlerts = alerts.lowStock.length + alerts.nearExpiry.length + alerts.expired.length;

  return (
    <div>
      <AdminPageHeader
        title="Inventory Alerts"
        subtitle="Stay ahead of low stock, near-expiry medicines, and expired inventory with a more focused operational alert center."
        icon={AlertTriangle}
        stats={[
          { label: 'Total Alerts', value: totalAlerts },
          { label: 'Low Stock', value: alerts.lowStock.length },
          { label: 'Near Expiry', value: alerts.nearExpiry.length },
          { label: 'Expired', value: alerts.expired.length }
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card border-l-4 border-gray-400">
          <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-orange-400">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{alerts.lowStock.length}</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-yellow-400">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{alerts.nearExpiry.length}</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-red-400">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">{alerts.expired.length}</p>
            </div>
          </div>
        </div>
      </div>

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
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">All Alerts</option>
            <option value="lowStock">Low Stock</option>
            <option value="nearExpiry">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No alerts at this time
            </h3>
            <p className="text-gray-600">
              All medicines are within acceptable stock levels and expiry dates
            </p>
          </div>
        ) : (
          filteredAlerts.map((medicine) => (
            <div key={`${medicine._id}-${medicine.alertType}`} className={`card border-l-4 ${getAlertColor(medicine.alertType)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    {getAlertIcon(medicine.alertType)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAlertColor(medicine.alertType)}`}>
                        {getAlertLabel(medicine.alertType)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{medicine.category}</p>
                    
                    {medicine.alertType === 'lowStock' && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-600 font-medium">Stock: {medicine.stockQuantity}</span>
                        <span className="text-gray-500 ml-2">(Threshold: {medicine.threshold || 10})</span>
                      </div>
                    )}
                    
                    {(medicine.alertType === 'nearExpiry' || medicine.alertType === 'expired') && medicine.expiryDate && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Expiry Date: {new Date(medicine.expiryDate).toLocaleDateString()}</span>
                        {medicine.alertType === 'nearExpiry' && (
                          <span className="text-yellow-600 font-medium ml-2">
                            ({getDaysUntilExpiry(medicine.expiryDate)} days left)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {medicine.alertType === 'lowStock' && (
                    <button
                      onClick={() => restockMedicine(medicine)}
                      className="btn-primary text-sm flex items-center space-x-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Restock</span>
                    </button>
                  )}
                  
                  {medicine.alertType === 'expired' && (
                    <button
                      onClick={() => removeExpiredMedicine(medicine._id)}
                      className="btn-danger text-sm flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  )}
                  
                  <Link
                    to={`/admin/medicines/edit/${medicine._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit Medicine
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
