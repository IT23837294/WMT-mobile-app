import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Package, Pill, AlertTriangle, CheckCircle, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    try {
      const response = await axios.get(`/api/medicines/${id}`);
      setMedicine(response.data.medicine);
    } catch (err) {
      setError('Failed to load medicine details');
      console.error('Error fetching medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuantity(1);
    setSuccessMessage('');
    setError('');
  }, [id]);

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(current + 1, medicine?.stockQuantity || 1));
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(current - 1, 1));
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      setError('Only customer accounts can add medicines to the cart');
      return;
    }

    setAddingToCart(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post('/api/cart/add', {
        medicineId: medicine._id,
        quantity
      });

      setSuccessMessage(response.data.message || 'Medicine added to cart');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add medicine to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const isOutOfStock = medicine?.stockQuantity <= 0;
  const canCustomerAddToCart = isAuthenticated && user?.role === 'customer' && !isOutOfStock;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Medicine not found
          </h3>
          <p className="text-gray-600 mb-4">
            The medicine you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/medicines" className="btn-primary">
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/medicines')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Medicines
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => navigate('/customer/cart')} className="text-sm font-medium underline">
            View Cart
          </button>
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-gray-100 rounded-lg flex items-center justify-center h-80">
            {medicine.image ? (
              <img
                src={medicine.image}
                alt={medicine.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-32 w-32 text-gray-400" />
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{medicine.name}</h1>
                <p className="text-lg text-gray-600">{medicine.category}</p>
              </div>
              <span className="text-3xl font-bold text-medical-600">
                LKR {medicine.price.toFixed(2)}
              </span>
            </div>

            {medicine.requiresPrescription && (
              <div className="flex items-center bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg mb-6">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>This medicine requires a valid prescription</span>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer</span>
                <span className="font-medium">{medicine.manufacturer || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Status</span>
                <span className={`font-medium ${medicine.stockQuantity <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {medicine.stockQuantity} units available
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry Date</span>
                <span className="font-medium">
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier</span>
                <span className="font-medium">{medicine.supplier?.name || 'N/A'}</span>
              </div>
            </div>

            {medicine.dosage && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Dosage</h3>
                <p className="text-gray-600">{medicine.dosage}</p>
              </div>
            )}

            {medicine.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{medicine.description}</p>
              </div>
            )}

            {medicine.sideEffects && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Side Effects</h3>
                <p className="text-gray-600">{medicine.sideEffects}</p>
              </div>
            )}

            <div className="flex space-x-4 pt-6 border-t">
              {!isAuthenticated && (
                <Link to="/login" className="flex-1 btn-primary text-center">
                  Login to Add to Cart
                </Link>
              )}

              {isAuthenticated && user?.role !== 'customer' && (
                <button
                  type="button"
                  disabled
                  className="flex-1 btn-secondary opacity-70 cursor-not-allowed"
                >
                  Customer Account Required
                </button>
              )}

              {isAuthenticated && user?.role === 'customer' && (
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Quantity</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={decreaseQuantity}
                        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100"
                        disabled={quantity <= 1 || addingToCart}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={increaseQuantity}
                        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100"
                        disabled={quantity >= medicine.stockQuantity || addingToCart || isOutOfStock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={addToCart}
                      disabled={!canCustomerAddToCart || addingToCart}
                      className="btn-primary flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        {isOutOfStock ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/customer/cart')}
                      className="btn-secondary"
                    >
                      Go to Cart
                    </button>
                  </div>

                  <div className="text-sm text-gray-500">
                    Total: <span className="font-semibold text-gray-900">LKR {(medicine.price * quantity).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetail;
