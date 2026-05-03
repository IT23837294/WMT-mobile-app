import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  AlertCircle, 
  Package,
  FileText,
  ArrowRight,
  CreditCard,
  Landmark,
  CheckCircle,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const Cart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartIssues, setCartIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [depositReceiptFile, setDepositReceiptFile] = useState(null);
  const [checkoutData, setCheckoutData] = useState({
    contactNumber: '',
    receiptEmail: '',
    paymentMethod: 'card',
    paymentReference: '',
    cardHolderName: '',
    cardNumber: '',
    cardExpiryMonth: '',
    cardExpiryYear: '',
    cardCvv: '',
    notes: '',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (!user) return;

    const defaultAddress = user.addressBook?.find((entry) => entry.isDefault) || user.address;

    setCheckoutData((current) => ({
      ...current,
      contactNumber: current.contactNumber || user.phone || '',
      receiptEmail: current.receiptEmail || user.email || '',
      deliveryAddress: {
        street: current.deliveryAddress.street || defaultAddress?.street || '',
        city: current.deliveryAddress.city || defaultAddress?.city || '',
        state: current.deliveryAddress.state || defaultAddress?.state || '',
        zipCode: current.deliveryAddress.zipCode || defaultAddress?.zipCode || '',
        country: current.deliveryAddress.country || defaultAddress?.country || 'Sri Lanka'
      }
    }));
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await axios.get('/api/cart');
      setCart(response.data.cart);
      setCartIssues([]);
    } catch (err) {
      setError('Failed to load cart');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(true);
    try {
      const response = await axios.put(`/api/cart/item/${itemId}`, { quantity: newQuantity });
      setCart(response.data.cart);
      setError('');
      setMessage('Cart updated');
      setCartIssues([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    
    setUpdating(true);
    try {
      const response = await axios.delete(`/api/cart/item/${itemId}`);
      setCart(response.data.cart);
      setMessage('Item removed from cart');
      setError('');
      setCartIssues([]);
    } catch (err) {
      setError('Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      await axios.delete('/api/cart/clear');
      setCart({ ...cart, items: [], totalAmount: 0 });
      setMessage('Cart cleared successfully');
      setCartIssues([]);
    } catch (err) {
      setError('Failed to clear cart');
    }
  };

  const validateCartBeforeCheckout = async () => {
    try {
      const response = await axios.get('/api/cart/validate');
      setCartIssues([]);
      return response.data;
    } catch (err) {
      const issues = err.response?.data?.issues || [];
      setCartIssues(issues);
      setError(err.response?.data?.message || 'Cart validation failed');
      return null;
    }
  };

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;

    setError('');
    setMessage('');

    if (name.startsWith('deliveryAddress.')) {
      const field = name.split('.')[1];
      setCheckoutData((current) => ({
        ...current,
        deliveryAddress: {
          ...current.deliveryAddress,
          [field]: value
        }
      }));
      return;
    }

    setCheckoutData((current) => {
      const nextState = {
        ...current,
        [name]: value
      };

      if (name === 'paymentMethod' && value !== 'bank_deposit') {
        nextState.paymentReference = '';
      }

      return nextState;
    });

    if (name === 'paymentMethod' && value !== 'bank_deposit') {
      setDepositReceiptFile(null);
    }
  };

  const hasStockConflict = cart?.items?.some(
    (item) => item.quantity > (item.availableStock ?? item.medicine?.stockQuantity ?? 0)
  );

  useEffect(() => {
    if (cart?.items?.length) {
      validateCartBeforeCheckout();
    } else {
      setCartIssues([]);
    }
  }, [cart?.items?.length]);

  const placeOrder = async () => {
    if (!cart?.items?.length) {
      setError('Your cart is empty');
      return;
    }

    const {
      contactNumber,
      receiptEmail,
      paymentMethod,
      paymentReference,
      deliveryAddress,
      notes,
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv
    } = checkoutData;

    if (!contactNumber || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
      setError('Please complete your contact number and delivery address');
      return;
    }

    if (paymentMethod === 'bank_deposit' && !paymentReference.trim()) {
      setError('Please enter your bank deposit reference');
      return;
    }

    if (paymentMethod === 'bank_deposit' && !depositReceiptFile) {
      setError('Please upload your bank deposit receipt');
      return;
    }

    if (paymentMethod === 'card') {
      const sanitizedCardNumber = cardNumber.replace(/\D/g, '');
      const sanitizedCvv = cardCvv.replace(/\D/g, '');

      if (!cardHolderName.trim() || sanitizedCardNumber.length < 12 || !cardExpiryMonth || !cardExpiryYear || sanitizedCvv.length < 3) {
        setError('Please complete your card details');
        return;
      }
    }

    const validationResult = await validateCartBeforeCheckout();
    if (!validationResult) {
      return;
    }

    setPlacingOrder(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentReference', paymentReference.trim());
      formData.append('receiptEmail', receiptEmail.trim());
      formData.append('contactNumber', contactNumber.trim());
      formData.append('notes', notes.trim());
      formData.append('deliveryAddress[street]', deliveryAddress.street);
      formData.append('deliveryAddress[city]', deliveryAddress.city);
      formData.append('deliveryAddress[state]', deliveryAddress.state);
      formData.append('deliveryAddress[zipCode]', deliveryAddress.zipCode);
      formData.append('deliveryAddress[country]', deliveryAddress.country);

      if (paymentMethod === 'card') {
        formData.append('cardHolderName', cardHolderName.trim());
        formData.append('cardNumber', cardNumber);
        formData.append('cardExpiryMonth', cardExpiryMonth);
        formData.append('cardExpiryYear', cardExpiryYear);
        formData.append('cardCvv', cardCvv);
      }

      if (paymentMethod === 'bank_deposit' && depositReceiptFile) {
        formData.append('depositReceipt', depositReceiptFile);
      }

      const response = await axios.post('/api/orders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Order placed successfully');
      navigate(`/customer/orders/${response.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <AdminPageHeader
          title="Shopping Cart"
          subtitle="Add medicines, confirm delivery details, and complete your pharmacy payment with a smoother checkout experience."
          eyebrow="PharmaCare Customer"
          icon={ShoppingCart}
        />
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Add medicines to your cart and they will appear here for checkout
          </p>
          <button
            onClick={() => navigate('/medicines')}
            className="btn-primary"
          >
            Browse Medicines
          </button>
        </div>
      </div>
    );
  }

  const deliveryCharge = 50;
  const discount = 0;
  const finalTotal = cart.totalAmount + deliveryCharge - discount;

  return (
    <div>
      <AdminPageHeader
        title="Shopping Cart"
        subtitle="Review items, adjust quantities, confirm delivery details, and place your medicine order with trusted payment options."
        eyebrow="PharmaCare Customer"
        icon={ShoppingCart}
        action={(
          <button
            onClick={clearCart}
            className="btn-danger flex items-center space-x-2"
            disabled={updating}
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Cart</span>
          </button>
        )}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button 
            onClick={() => setError('')} 
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {message}
          <button
            onClick={() => setMessage('')}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {cart.prescription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Based on Prescription #{cart.prescription._id?.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-blue-700">
              Items added by pharmacist after prescription review
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-100 w-20 h-20 rounded-lg flex items-center justify-center">
                    {item.medicine?.image ? (
                      <img
                        src={item.medicine.image}
                        alt={item.medicine.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.medicine?.name}</h3>
                    <p className="text-sm text-gray-600">{item.medicine?.category}</p>
                    {item.medicine?.requiresPrescription && (
                      <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Prescription Required
                      </span>
                    )}
                    <p className="text-medical-600 font-medium mt-2">
                      {formatCurrency(item.price)} per unit
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    disabled={updating}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={updating || item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={updating || item.quantity >= (item.availableStock ?? item.medicine?.stockQuantity ?? 0)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Stock available: {item.availableStock ?? item.medicine?.stockQuantity ?? 0}
                </span>
                <span className="font-bold text-gray-900">
                  Total: {formatCurrency(item.itemTotal ?? (item.price * item.quantity))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cart.items.length} items)</span>
                <span className="font-medium">{formatCurrency(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge</span>
                <span className="font-medium">{formatCurrency(deliveryCharge)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-medical-600">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-semibold text-gray-900">Checkout Details</h4>

              {cartIssues.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">Please fix these cart issues before checkout:</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {cartIssues.map((issue, index) => (
                      <li key={`${issue}-${index}`}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <input
                type="text"
                name="contactNumber"
                value={checkoutData.contactNumber}
                onChange={handleCheckoutChange}
                className="input"
                placeholder="Contact Number"
              />

              <input
                type="email"
                name="receiptEmail"
                value={checkoutData.receiptEmail}
                onChange={handleCheckoutChange}
                className="input"
                placeholder="Receipt Email"
              />

              <input
                type="text"
                name="deliveryAddress.street"
                value={checkoutData.deliveryAddress.street}
                onChange={handleCheckoutChange}
                className="input"
                placeholder="Street Address"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="deliveryAddress.city"
                  value={checkoutData.deliveryAddress.city}
                  onChange={handleCheckoutChange}
                  className="input"
                  placeholder="City"
                />
                <input
                  type="text"
                  name="deliveryAddress.state"
                  value={checkoutData.deliveryAddress.state}
                  onChange={handleCheckoutChange}
                  className="input"
                  placeholder="State"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="deliveryAddress.zipCode"
                  value={checkoutData.deliveryAddress.zipCode}
                  onChange={handleCheckoutChange}
                  className="input"
                  placeholder="Postal Code"
                />
                <input
                  type="text"
                  name="deliveryAddress.country"
                  value={checkoutData.deliveryAddress.country}
                  onChange={handleCheckoutChange}
                  className="input"
                  placeholder="Country"
                />
              </div>

              <textarea
                name="notes"
                value={checkoutData.notes}
                onChange={handleCheckoutChange}
                className="input min-h-[90px]"
                placeholder="Order notes or delivery instructions"
              />

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Choose Payment Method</p>

                <label className={`block rounded-lg border p-4 cursor-pointer ${checkoutData.paymentMethod === 'card' ? 'border-medical-600 bg-medical-50' : 'border-gray-200'}`}>
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={checkoutData.paymentMethod === 'card'}
                      onChange={handleCheckoutChange}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center text-gray-900 font-medium">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Card Payment
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Enter your card details to complete the payment immediately.
                      </p>
                    </div>
                  </div>
                </label>

                <label className={`block rounded-lg border p-4 cursor-pointer ${checkoutData.paymentMethod === 'bank_deposit' ? 'border-medical-600 bg-medical-50' : 'border-gray-200'}`}>
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_deposit"
                      checked={checkoutData.paymentMethod === 'bank_deposit'}
                      onChange={handleCheckoutChange}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center text-gray-900 font-medium">
                        <Landmark className="h-4 w-4 mr-2" />
                        Bank Deposit
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Deposit to the pharmacy bank account and submit the deposit reference.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {checkoutData.paymentMethod === 'card' && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 space-y-3">
                  <input
                    type="text"
                    name="cardHolderName"
                    value={checkoutData.cardHolderName}
                    onChange={handleCheckoutChange}
                    className="input"
                    placeholder="Card Holder Name"
                  />
                  <input
                    type="text"
                    name="cardNumber"
                    value={checkoutData.cardNumber}
                    onChange={handleCheckoutChange}
                    className="input"
                    placeholder="Card Number"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      name="cardExpiryMonth"
                      value={checkoutData.cardExpiryMonth}
                      onChange={handleCheckoutChange}
                      className="input"
                      placeholder="MM"
                    />
                    <input
                      type="text"
                      name="cardExpiryYear"
                      value={checkoutData.cardExpiryYear}
                      onChange={handleCheckoutChange}
                      className="input"
                      placeholder="YYYY"
                    />
                    <input
                      type="password"
                      name="cardCvv"
                      value={checkoutData.cardCvv}
                      onChange={handleCheckoutChange}
                      className="input"
                      placeholder="CVV"
                    />
                  </div>
                  <p className="text-sm text-blue-900">
                    Card payments are marked successful immediately. Only the last 4 digits are saved with the order.
                  </p>
                </div>
              )}

              {checkoutData.paymentMethod === 'bank_deposit' && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-4 text-sm text-yellow-900 space-y-2">
                  <p className="font-medium">Bank Deposit Details</p>
                  <p>Bank: Bank of Ceylon</p>
                  <p>Account Name: PharmaCare Pharmacy</p>
                  <p>Account Number: 2345678901</p>
                  <p>Branch: Colombo Main Branch</p>
                  <input
                    type="text"
                    name="paymentReference"
                    value={checkoutData.paymentReference}
                    onChange={handleCheckoutChange}
                    className="input mt-3"
                    placeholder="Deposit Reference Number"
                  />
                  <label className="block">
                    <span className="mb-2 block font-medium">Upload Deposit Receipt</span>
                    <div className="flex items-center gap-3">
                      <label className="btn-secondary inline-flex items-center space-x-2 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span>Choose File</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => setDepositReceiptFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <span className="text-xs text-gray-600">
                        {depositReceiptFile ? depositReceiptFile.name : 'No receipt uploaded'}
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <button
                onClick={placeOrder}
                className="w-full btn-primary flex items-center justify-center space-x-2"
                disabled={updating || placingOrder || cart.items.some((item) => item.quantity > (item.availableStock ?? item.medicine?.stockQuantity ?? 0))}
              >
                <span>{placingOrder ? 'Placing Order...' : 'Place Order'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              By placing the order, you confirm your payment selection and delivery details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
