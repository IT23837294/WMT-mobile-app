import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, PackagePlus, Plus, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const isValidSupplierPhoneNumber = (phone = '') => /^\d{10}$/.test(String(phone || '').trim());

const SupplierApplication = () => {
  const navigate = useNavigate();
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
      country: 'Sri Lanka'
    },
    returnPolicy: {
      acceptsDamagedReturns: false,
      acceptsExpiredExchanges: false
    },
    deliveryCommitment: {
      deliversOnTime: false
    },
    suppliedItems: [
      {
        productName: '',
        unitPrice: ''
      }
    ],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      const nextValue = field === 'phone'
        ? value.replace(/\D/g, '').slice(0, 10)
        : value;

      setFormData((prev) => ({
        ...prev,
        contact: { ...prev.contact, [field]: nextValue }
      }));
      return;
    }

    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
      return;
    }

    if (name.startsWith('returnPolicy.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        returnPolicy: {
          ...prev.returnPolicy,
          [field]: value === 'true'
        }
      }));
      return;
    }

    if (name.startsWith('deliveryCommitment.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        deliveryCommitment: {
          ...prev.deliveryCommitment,
          [field]: value === 'true'
        }
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSuppliedItem = () => {
    setFormData((prev) => ({
      ...prev,
      suppliedItems: [
        ...prev.suppliedItems,
        {
          productName: '',
          unitPrice: ''
        }
      ]
    }));
  };

  const updateSuppliedItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      suppliedItems: prev.suppliedItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const removeSuppliedItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      suppliedItems: prev.suppliedItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedPhone = formData.contact.phone.trim();
    if (normalizedPhone && !isValidSupplierPhoneNumber(normalizedPhone)) {
      setError('Phone number must contain exactly 10 digits');
      setLoading(false);
      return;
    }

    try {
      const suppliedItems = formData.suppliedItems
        .map((item) => ({
          productName: item.productName?.trim(),
          unitPrice: item.unitPrice === '' ? '' : Number(item.unitPrice)
        }))
        .filter((item) => item.productName && item.unitPrice !== '' && Number.isFinite(item.unitPrice));

      await axios.post('/api/suppliers/apply', {
        ...formData,
        suppliedItems
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit supplier application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#effcf9_0%,#eef8ff_45%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="mb-5 flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Supplier application submitted
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your company details have been sent to PharmaCare. Our admin team will review the application and contact you soon.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={() => navigate('/login')} className="btn-primary">
                Back to Login
              </button>
              <Link to="/" className="btn-secondary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#effcf9_0%,#eef8ff_45%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden lg:block rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <BrandLogo />
            <div className="mt-6 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Supplier Partnership
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
              Apply to supply medicines to PharmaCare.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Share your company details, contact channels, and product categories. The PharmaCare team will review your application and onboard approved suppliers.
            </p>
            <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">What to include</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <li>Your company or supplier name</li>
                <li>Primary email address or phone number</li>
                <li>Business address and operating region</li>
                <li>Main medicine categories or brands you can supply</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-teal-600 p-3 text-white">
                  <PackagePlus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">PharmaCare Supplier Form</p>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">Apply as a supplier</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Complete the details below and we will register your supplier application for review.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="label text-slate-800">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                    placeholder="Enter company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label text-slate-800">Supplier Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                    required
                  />
                </div>

                <div>
                  <label className="label text-slate-800">Business Email</label>
                  <input
                    type="email"
                    name="contact.email"
                    value={formData.contact.email}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  />
                </div>

                <div>
                  <label className="label text-slate-800">Phone Number</label>
                  <input
                    type="text"
                    name="contact.phone"
                    value={formData.contact.phone}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                    placeholder="Enter 10-digit phone number"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label text-slate-800">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  />
                </div>

                <div>
                  <label className="label text-slate-800">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  />
                </div>

                <div>
                  <label className="label text-slate-800">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  />
                </div>

                <div>
                  <label className="label text-slate-800">Postal Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  />
                </div>

                <div>
                  <label className="label text-slate-800">Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  />
                </div>

              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="label text-slate-800">Medicines You Supply</label>
                    <p className="mt-1 text-xs text-slate-500">
                      Add the medicine or category name together with your price per item.
                    </p>
                  </div>
                  <button type="button" onClick={addSuppliedItem} className="btn-secondary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.suppliedItems.map((item, index) => (
                    <div key={`supplied-item-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1.2fr_0.8fr_auto]">
                      <div>
                        <label className="label text-slate-700">Product or Medicine Name</label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => updateSuppliedItem(index, 'productName', e.target.value)}
                          className="input rounded-2xl border-slate-200 bg-white py-3"
                          placeholder="Example: Paracetamol, Vitamins, Antibiotics"
                        />
                      </div>
                      <div>
                        <label className="label text-slate-700">Price Per Item (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateSuppliedItem(index, 'unitPrice', e.target.value)}
                          className="input rounded-2xl border-slate-200 bg-white py-3"
                          placeholder="Example: 25.00"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeSuppliedItem(index)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          disabled={formData.suppliedItems.length === 1}
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-slate-900">Delivery Commitment</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Let us know whether you can deliver orders within the agreed time period.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="label text-slate-800">Do you deliver on time period?</label>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="deliveryCommitment.deliversOnTime"
                        value="true"
                        checked={formData.deliveryCommitment.deliversOnTime === true}
                        onChange={handleChange}
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="deliveryCommitment.deliversOnTime"
                        value="false"
                        checked={formData.deliveryCommitment.deliversOnTime === false}
                        onChange={handleChange}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">Return Policy</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Tell us whether returned or expired medicines can be accepted from PharmaCare.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="label text-slate-800">Can damaged medicines be returned?</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="returnPolicy.acceptsDamagedReturns"
                          value="true"
                          checked={formData.returnPolicy.acceptsDamagedReturns === true}
                          onChange={handleChange}
                        />
                        Yes
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="returnPolicy.acceptsDamagedReturns"
                          value="false"
                          checked={formData.returnPolicy.acceptsDamagedReturns === false}
                          onChange={handleChange}
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="label text-slate-800">Can expired medicines be exchanged?</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="returnPolicy.acceptsExpiredExchanges"
                          value="true"
                          checked={formData.returnPolicy.acceptsExpiredExchanges === true}
                          onChange={handleChange}
                        />
                        Yes
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="returnPolicy.acceptsExpiredExchanges"
                          value="false"
                          checked={formData.returnPolicy.acceptsExpiredExchanges === false}
                          onChange={handleChange}
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="label text-slate-800">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input min-h-[120px] rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  placeholder="Share extra details about your business, delivery coverage, or product strengths."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(13,148,136,0.28)] transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting application...' : 'Submit Supplier Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierApplication;
