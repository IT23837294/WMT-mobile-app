import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions/my-prescriptions');
      setPrescriptions(response.data.prescriptions);
    } catch (err) {
      setError('Failed to load prescriptions');
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'reviewed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
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
        title="My Prescriptions"
        subtitle="Review submitted prescriptions, pharmacist notes, medicine recommendations, and prescription-based totals in one customer workspace."
        eyebrow="PharmaCare Customer"
        icon={FileText}
        action={(
          <Link to="/customer/upload-prescription" className="btn-primary">
            Upload New Prescription
          </Link>
        )}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {prescriptions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</h3>
          <p className="text-gray-600 mb-6">Upload your first prescription to get started</p>
          <Link to="/customer/upload-prescription" className="btn-primary">
            Upload Prescription
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getStatusColor(prescription.status)}`}>
                    {getStatusIcon(prescription.status)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        Prescription #{prescription._id.slice(-6).toUpperCase()}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Uploaded on {new Date(prescription.createdAt).toLocaleDateString()}
                    </p>
                    {prescription.reviewedAt && (
                      <p className="text-sm text-gray-500">
                        Reviewed on {new Date(prescription.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                    {prescription.finalAmount > 0 && (
                      <p className="text-sm font-medium text-medical-600 mt-1">
                        Total: {formatCurrency(prescription.finalAmount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <a
                    href={prescription.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </a>

                  {prescription.status === 'reviewed' && (
                    <Link to="/customer/cart" className="btn-primary">
                      View Cart
                    </Link>
                  )}
                </div>
              </div>

              {prescription.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pharmacist Notes:</span> {prescription.notes}
                  </p>
                </div>
              )}

              {prescription.items && prescription.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Prescribed Medicines:</h4>
                  <div className="space-y-2">
                    {prescription.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">
                          {item.medicine?.name || 'Unknown Medicine'}
                        </span>
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity} x {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(prescription.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium">{formatCurrency(prescription.deliveryCharge)}</span>
                    </div>
                    {prescription.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">- {formatCurrency(prescription.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-medical-600">{formatCurrency(prescription.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPrescriptions;
