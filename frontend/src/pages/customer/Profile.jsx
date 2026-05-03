import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Plus,
  Home,
  Building2,
  Tag
} from 'lucide-react';
import axios from 'axios';
import AdminPageHeader from '../../components/AdminPageHeader';

const ADDRESS_LABELS = ['Home', 'Work', 'Other'];
const isValidPhoneNumber = (phone = '') => /^\d{10}$/.test(String(phone || '').trim());

const createEmptyAddress = (label = 'Home') => ({
  id: `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label,
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Sri Lanka',
  deliveryInstructions: '',
  isDefault: false
});

const normalizeAddressBook = (addressBook = [], fallbackAddress = {}) => {
  const addresses = Array.isArray(addressBook)
    ? addressBook.map((entry, index) => ({
        id: entry._id || entry.id || `address-${index}`,
        label: ADDRESS_LABELS.includes(entry.label) ? entry.label : 'Home',
        street: entry.street || '',
        city: entry.city || '',
        state: entry.state || '',
        zipCode: entry.zipCode || '',
        country: entry.country || 'Sri Lanka',
        deliveryInstructions: entry.deliveryInstructions || '',
        isDefault: Boolean(entry.isDefault)
      }))
    : [];

  if (addresses.length === 0 && (fallbackAddress?.street || fallbackAddress?.city || fallbackAddress?.state || fallbackAddress?.zipCode)) {
    return [{
      id: 'address-0',
      label: 'Home',
      street: fallbackAddress.street || '',
      city: fallbackAddress.city || '',
      state: fallbackAddress.state || '',
      zipCode: fallbackAddress.zipCode || '',
      country: fallbackAddress.country || 'Sri Lanka',
      deliveryInstructions: '',
      isDefault: true
    }];
  }

  if (addresses.length === 0) {
    return [createEmptyAddress('Home')];
  }

  const hasDefault = addresses.some((entry) => entry.isDefault);
  return addresses.map((entry, index) => ({
    ...entry,
    isDefault: hasDefault ? entry.isDefault : index === 0
  }));
};

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    addressBook: normalizeAddressBook(user?.addressBook, user?.address)
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const defaultAddress = formData.addressBook.find((entry) => entry.isDefault) || formData.addressBook[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleAddressChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      addressBook: prev.addressBook.map((entry, entryIndex) =>
        entryIndex === index
          ? { ...entry, [field]: value }
          : entry
      )
    }));
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addressBook: [
        ...prev.addressBook,
        createEmptyAddress(prev.addressBook.length === 0 ? 'Home' : 'Other')
      ]
    }));
  };

  const removeAddress = (index) => {
    setFormData((prev) => {
      const nextAddressBook = prev.addressBook.filter((_, entryIndex) => entryIndex !== index);
      const hasDefault = nextAddressBook.some((entry) => entry.isDefault);
      return {
        ...prev,
        addressBook: nextAddressBook.map((entry, entryIndex) => ({
          ...entry,
          isDefault: hasDefault ? entry.isDefault : entryIndex === 0
        }))
      };
    });
  };

  const setDefaultAddress = (index) => {
    setFormData((prev) => ({
      ...prev,
      addressBook: prev.addressBook.map((entry, entryIndex) => ({
        ...entry,
        isDefault: entryIndex === index
      }))
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const normalizedPhone = formData.phone.trim();
    if (normalizedPhone && !isValidPhoneNumber(normalizedPhone)) {
      setError('Phone number must contain exactly 10 digits');
      setLoading(false);
      return;
    }

    const cleanedAddressBook = formData.addressBook
      .map((entry) => ({
        label: entry.label,
        street: entry.street.trim(),
        city: entry.city.trim(),
        state: entry.state.trim(),
        zipCode: entry.zipCode.trim(),
        country: entry.country.trim() || 'Sri Lanka',
        deliveryInstructions: entry.deliveryInstructions.trim(),
        isDefault: entry.isDefault
      }))
      .filter((entry) => entry.street || entry.city || entry.state || entry.zipCode);

    const nextAddressBook = cleanedAddressBook.length > 0
      ? cleanedAddressBook.map((entry, index) => ({
          ...entry,
          isDefault: cleanedAddressBook.some((address) => address.isDefault) ? entry.isDefault : index === 0
        }))
      : [];

    const result = await updateProfile({
      name: formData.name,
      phone: normalizedPhone,
      addressBook: nextAddressBook,
      address: nextAddressBook[0]
        ? {
            street: nextAddressBook.find((entry) => entry.isDefault)?.street || nextAddressBook[0].street,
            city: nextAddressBook.find((entry) => entry.isDefault)?.city || nextAddressBook[0].city,
            state: nextAddressBook.find((entry) => entry.isDefault)?.state || nextAddressBook[0].state,
            zipCode: nextAddressBook.find((entry) => entry.isDefault)?.zipCode || nextAddressBook[0].zipCode,
            country: nextAddressBook.find((entry) => entry.isDefault)?.country || nextAddressBook[0].country
          }
        : {}
    });

    if (result.success) {
      setMessage('Profile and delivery address book updated successfully');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }

    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!deactivatePassword) {
      setError('Please enter your password to confirm');
      return;
    }

    try {
      await axios.put('/api/auth/deactivate', { password: deactivatePassword });
      setMessage('Account deactivated successfully');
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate account');
      setShowDeactivateModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <AdminPageHeader
        title="My Profile"
        subtitle="Manage your personal details and maintain a delivery address book with labels, default selection, and special instructions."
        eyebrow="PharmaCare Customer"
        icon={User}
      />

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {message}
          <button onClick={() => setMessage('')} className="ml-auto text-sm">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-auto text-sm">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-1">
          <div className="text-center">
            <div className="bg-medical-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-medical-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <div className="text-gray-600">
                  {defaultAddress ? (
                    <>
                      <div className="font-medium text-gray-800">{defaultAddress.label} address</div>
                      <div>{defaultAddress.city || 'Location not set'}</div>
                      {defaultAddress.deliveryInstructions && (
                        <div className="text-xs text-gray-500 mt-1">{defaultAddress.deliveryInstructions}</div>
                      )}
                    </>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Danger Zone</h4>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Deactivate Account</span>
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will permanently disable your account. You can contact admin to reactivate.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="label">Full Name</label>
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
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10-digit phone number"
                />
                <p className="mt-2 text-xs text-gray-500">Use exactly 10 numbers.</p>
              </div>

              <div className="border-t pt-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Address Book (Delivery)</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Save multiple delivery addresses, set a default location, and add delivery instructions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addAddress}
                    className="inline-flex items-center gap-2 rounded-lg bg-medical-50 px-4 py-2 text-sm font-medium text-medical-700 hover:bg-medical-100"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.addressBook.map((address, index) => (
                    <div key={address.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {address.label === 'Home' ? <Home className="h-3.5 w-3.5" /> : address.label === 'Work' ? <Building2 className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Default Address
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(index)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Set Default
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            disabled={formData.addressBook.length === 1}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="label">Address Label</label>
                          <select
                            value={address.label}
                            onChange={(e) => handleAddressChange(index, 'label', e.target.value)}
                            className="input"
                          >
                            {ADDRESS_LABELS.map((label) => (
                              <option key={label} value={label}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Country</label>
                          <input
                            type="text"
                            value={address.country}
                            onChange={(e) => handleAddressChange(index, 'country', e.target.value)}
                            className="input"
                            placeholder="Country"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Street Address</label>
                          <input
                            type="text"
                            value={address.street}
                            onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                            className="input"
                            placeholder="Street Address"
                          />
                        </div>
                        <div>
                          <label className="label">City</label>
                          <input
                            type="text"
                            value={address.city}
                            onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                            className="input"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="label">State</label>
                          <input
                            type="text"
                            value={address.state}
                            onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                            className="input"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="label">ZIP Code</label>
                          <input
                            type="text"
                            value={address.zipCode}
                            onChange={(e) => handleAddressChange(index, 'zipCode', e.target.value)}
                            className="input"
                            placeholder="ZIP Code"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Delivery Instructions</label>
                          <textarea
                            value={address.deliveryInstructions}
                            onChange={(e) => handleAddressChange(index, 'deliveryInstructions', e.target.value)}
                            className="input min-h-[96px]"
                            placeholder="Example: Leave at front desk, call before delivery, ring side gate bell"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="input"
                placeholder="Current Password"
                required
              />
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="input"
                placeholder="New Password"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="input"
                placeholder="Confirm New Password"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-bold">Deactivate Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deactivate your account? This action will:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
              <li>Disable your login access</li>
              <li>Cancel any pending orders</li>
              <li>Preserve your order history</li>
            </ul>
            <p className="text-sm text-gray-600 mb-4">
              Enter your password to confirm:
            </p>
            <input
              type="password"
              value={deactivatePassword}
              onChange={(e) => setDeactivatePassword(e.target.value)}
              className="input mb-4"
              placeholder="Your password"
            />
            <div className="flex space-x-4">
              <button
                onClick={handleDeactivate}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivatePassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
