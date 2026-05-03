import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Eye, Clock, CheckCircle, XCircle, Filter, AlertCircle } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const ReviewPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPrescriptions(prescriptions);
    } else if (statusFilter === 'pending') {
      setFilteredPrescriptions(prescriptions.filter((p) => p.status === 'pending'));
    } else {
      setFilteredPrescriptions(prescriptions.filter((p) => p.status === statusFilter));
    }
  }, [prescriptions, statusFilter]);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions');
      setPrescriptions(response.data.prescriptions);
      setFilteredPrescriptions(response.data.prescriptions);
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
        return <Clock className="h-5 w-5" />;
      case 'reviewed':
        return <CheckCircle className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
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

  const pendingCount = prescriptions.filter((prescription) => prescription.status === 'pending').length;

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
        title="Review Prescriptions"
        subtitle="Review customer prescriptions, monitor statuses, and move approved prescriptions into the medicine fulfilment flow."
        eyebrow="PharmaCare Pharmacist"
        icon={FileText}
        stats={[
          { label: 'Pending', value: pendingCount },
          { label: 'Reviewed', value: prescriptions.filter((p) => p.status === 'reviewed').length },
        ]}
        action={(
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-44"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {filteredPrescriptions.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No prescriptions found</h3>
          <p className="text-gray-600">
            {statusFilter === 'all'
              ? 'No prescriptions have been submitted yet.'
              : `No ${statusFilter} prescriptions found.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription._id} className="card">
              <div className="flex flex-col justify-between lg:flex-row lg:items-center">
                <div className="flex items-start space-x-4">
                  <div className={`rounded-lg p-3 ${getStatusColor(prescription.status)}`}>
                    {getStatusIcon(prescription.status)}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        Prescription #{prescription._id.slice(-6).toUpperCase()}
                      </h3>
                      <span className={`rounded-full px-2 py-1 text-xs capitalize ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Customer:</span> {prescription.user?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Email:</span> {prescription.user?.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted on {new Date(prescription.createdAt).toLocaleDateString()}
                    </p>
                    {prescription.reviewedAt && (
                      <p className="text-sm text-gray-500">
                        Reviewed on {new Date(prescription.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2 lg:mt-0">
                  <a
                    href={prescription.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Image</span>
                  </a>

                  <Link
                    to={`/pharmacist/prescriptions/${prescription._id}`}
                    className={prescription.status === 'pending' ? 'btn-primary' : 'btn-secondary'}
                  >
                    {prescription.status === 'pending' ? 'Review Now' : 'View Details'}
                  </Link>
                </div>
              </div>

              {prescription.reviewOutcome === 'partial' && (
                <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Partial approval was used for this prescription.
                </div>
              )}

              {prescription.items && prescription.items.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Added Medicines:</h4>
                  <div className="flex flex-wrap gap-2">
                    {prescription.items.map((item, index) => (
                      <span key={index} className="rounded-full bg-medical-50 px-3 py-1 text-sm text-medical-700">
                        {item.medicine?.name} x {item.quantity}
                      </span>
                    ))}
                  </div>
                  {prescription.finalAmount > 0 && (
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      Total: {formatCurrency(prescription.finalAmount)}
                    </p>
                  )}
                </div>
              )}

              {prescription.notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {prescription.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewPrescriptions;
