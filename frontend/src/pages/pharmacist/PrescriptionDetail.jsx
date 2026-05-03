import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Search,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'No expiry';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return 'Expired';

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiry <= thirtyDaysFromNow) return 'Near expiry';

  return 'Valid';
};

const PrescriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMedicineSelector, setShowMedicineSelector] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(50);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchPrescription();
    fetchMedicines();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      const response = await axios.get(`/api/prescriptions/${id}`);
      setPrescription(response.data.prescription);
      if (response.data.prescription.items) {
        setSelectedMedicines(response.data.prescription.items.map(item => ({
          medicineId: item.medicine._id,
          name: item.medicine.name,
          quantity: item.quantity,
          requestedQuantity: item.requestedQuantity || item.quantity,
          price: item.price,
          notes: item.notes || '',
          stockQuantity: item.medicine.stockQuantity,
          expiryDate: item.allocatedExpiryDate || item.medicine.expiryDate,
          batchNo: item.allocatedBatchNo || item.medicine.batchNo,
          fulfillmentStatus: item.fulfillmentStatus || 'approved'
        })));
      }
      if (response.data.prescription.notes) {
        setNotes(response.data.prescription.notes);
      }
      if (response.data.prescription.rejectionReason) {
        setRejectionReason(response.data.prescription.rejectionReason);
      }
    } catch (err) {
      setError('Failed to load prescription');
      console.error('Error fetching prescription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get('/api/medicines');
      setMedicines(response.data.medicines);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const addMedicine = (medicine) => {
    if (selectedMedicines.find(m => m.medicineId === medicine._id)) {
      return; // Already added
    }
    
    setSelectedMedicines([...selectedMedicines, {
      medicineId: medicine._id,
      name: medicine.name,
      quantity: 1,
      requestedQuantity: 1,
      price: medicine.price,
      notes: '',
      stockQuantity: medicine.stockQuantity,
      expiryDate: medicine.expiryDate,
      batchNo: medicine.batchNo,
      fulfillmentStatus: 'approved'
    }]);
    setShowMedicineSelector(false);
    setSearchTerm('');
  };

  const removeMedicine = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity < 1) return;
    setSelectedMedicines(selectedMedicines.map(m => 
      m.medicineId === medicineId
        ? {
            ...m,
            quantity,
            fulfillmentStatus: quantity > Number(m.stockQuantity || 0) ? 'partial' : 'approved'
          }
        : m
    ));
  };

  const updatePrice = (medicineId, price) => {
    setSelectedMedicines(selectedMedicines.map(m => 
      m.medicineId === medicineId ? { ...m, price: parseFloat(price) } : m
    ));
  };

  const updateNotes = (medicineId, notes) => {
    setSelectedMedicines(selectedMedicines.map(m => 
      m.medicineId === medicineId ? { ...m, notes } : m
    ));
  };

  const calculateTotal = () => {
    return selectedMedicines.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateFinalTotal = () => {
    return calculateTotal() + deliveryCharge - discount;
  };

  const handleSubmit = async () => {
    if (selectedMedicines.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axios.put(`/api/prescriptions/${id}/review`, {
        items: selectedMedicines,
        notes,
        deliveryCharge,
        discount
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/pharmacist/prescriptions');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this prescription?')) return;

    setSubmitting(true);
    try {
      await axios.put(`/api/prescriptions/${id}/reject`, {
        reason: rejectionReason
      });
      navigate('/pharmacist/prescriptions');
    } catch (err) {
      setError('Failed to reject prescription');
      setSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter(m => 
    getExpiryStatus(m.expiryDate) !== 'Expired' &&
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedMedicines.find(sm => sm.medicineId === m._id)
  ).sort((a, b) => new Date(a.expiryDate || '9999-12-31') - new Date(b.expiryDate || '9999-12-31'));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Prescription not found</p>
        <button onClick={() => navigate('/pharmacist/prescriptions')} className="btn-primary mt-4">
          Back to Prescriptions
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Prescription Reviewed Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            The customer has been notified and can now proceed to checkout.
          </p>
          <button
            onClick={() => navigate('/pharmacist/prescriptions')}
            className="btn-primary"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  const isReviewed = prescription.status !== 'pending';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/pharmacist/prescriptions')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Prescriptions
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Prescription #{prescription._id.slice(-6).toUpperCase()}
        </h1>
        <p className="text-gray-600 mt-1">
          Review prescription from {prescription.user?.name}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-sm">Dismiss</button>
        </div>
      )}

      {/* Customer Info */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{prescription.user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{prescription.user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{prescription.user?.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="font-medium">{new Date(prescription.createdAt).toLocaleString()}</p>
          </div>
        </div>
        
        {prescription.user?.address && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">
              {prescription.user.address.street}, {prescription.user.address.city}, 
              {prescription.user.address.state} {prescription.user.address.zipCode}
            </p>
          </div>
        )}
      </div>

      {/* Prescription Image */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Prescription Image</h3>
        <button
          type="button"
          onClick={() => setShowImageZoom(true)}
          className="block"
        >
          <img
            src={prescription.image}
            alt="Prescription"
            className="max-h-96 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          />
        </button>
        <p className="mt-2 text-sm text-gray-500">Click the image to open zoom view.</p>
      </div>

      {/* Medicines Section */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Prescribed Medicines</h3>
          {!isReviewed && (
            <button
              onClick={() => setShowMedicineSelector(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Medicine</span>
            </button>
          )}
        </div>

        {selectedMedicines.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            {isReviewed 
              ? 'No medicines were added to this prescription.'
              : 'Click "Add Medicine" to add medicines to this prescription.'}
          </p>
        ) : (
          <div className="space-y-4">
            {selectedMedicines.map((item) => (
              <div key={item.medicineId} className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {isReviewed && <p className="text-sm text-gray-500">ID: {item.medicineId.slice(-6)}</p>}
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.medicineId, parseInt(e.target.value))}
                      className="input w-20"
                      min="1"
                      disabled={isReviewed}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Price (LKR)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updatePrice(item.medicineId, e.target.value)}
                      className="input w-24"
                      min="0"
                      step="0.01"
                      disabled={isReviewed}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-medical-600">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className={`text-xs ${
                        item.quantity > Number(item.stockQuantity || 0) ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        Stock: {item.stockQuantity ?? 0} | Batch: {item.batchNo || '-'} | Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    {!isReviewed && (
                      <button
                        onClick={() => removeMedicine(item.medicineId)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Notes (dosage instructions, etc.)"
                    value={item.notes}
                    onChange={(e) => updateNotes(item.medicineId, e.target.value)}
                    className="input text-sm"
                    disabled={isReviewed}
                  />
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                </div>
                
                {!isReviewed ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivery:</span>
                      <input
                        type="number"
                        value={deliveryCharge}
                        onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                        className="input w-24 text-right"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount:</span>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="input w-24 text-right"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium">{formatCurrency(prescription.deliveryCharge)}</span>
                    </div>
                    {prescription.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">- {formatCurrency(prescription.discount)}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-medical-600">
                    {formatCurrency(isReviewed ? prescription.finalAmount : calculateFinalTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes & Actions */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Pharmacist Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes or instructions for the customer..."
          className="input h-32"
          disabled={isReviewed}
        />
        {!isReviewed && (
          <div className="mt-4">
            <label className="label">Reject Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason is required if you reject the prescription"
              className="input h-24"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {!isReviewed && (
        <div className="flex space-x-4">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex-1 btn-danger"
          >
            {submitting ? 'Processing...' : 'Reject Prescription'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedMedicines.length === 0}
            className="flex-1 btn-primary"
          >
            {submitting ? 'Submitting...' : 'Approve / Partial Approve'}
          </button>
        </div>
      )}

      {/* Medicine Selector Modal */}
      {showMedicineSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Select Medicine</h3>
              <button
                onClick={() => setShowMedicineSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto max-h-96">
                {filteredMedicines.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No medicines found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredMedicines.map((medicine) => (
                      <button
                        key={medicine._id}
                        onClick={() => addMedicine(medicine)}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{medicine.name}</p>
                            <p className="text-sm text-gray-500">{medicine.category}</p>
                            <p className="text-xs text-gray-500">
                              Batch: {medicine.batchNo || '-'} | Exp: {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : '-'} | {getExpiryStatus(medicine.expiryDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-medical-600">{formatCurrency(medicine.price)}</p>
                            <p className={`text-xs ${medicine.stockQuantity < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                              Stock: {medicine.stockQuantity}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showImageZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Prescription Image</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((level) => Math.max(1, level - 0.25))}
                  className="rounded-lg border border-slate-200 p-2"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((level) => Math.min(3, level + 0.25))}
                  className="rounded-lg border border-slate-200 p-2"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageZoom(false);
                    setZoomLevel(1);
                  }}
                  className="rounded-lg border border-slate-200 p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto">
              <img
                src={prescription.image}
                alt="Prescription zoomed"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="mx-auto rounded-lg transition-transform"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetail;
