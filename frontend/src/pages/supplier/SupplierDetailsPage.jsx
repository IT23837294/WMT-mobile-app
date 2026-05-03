import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Factory, Save, UserCircle2 } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import SupplierProfileDetails from './SupplierProfileDetails';
import useSupplierDashboardData from './useSupplierDashboardData';

const emptyForm = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Sri Lanka',
  deliveryPricePerItem: '',
  acceptsDamagedReturns: false,
  acceptsExpiredExchanges: false,
  deliversOnTime: false,
  notes: ''
};

const SupplierDetailsPage = () => {
  const { user } = useAuth();
  const { supplier, loading, error, supplierData, performance, refresh } = useSupplierDashboardData();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!supplier) {
      return;
    }

    setForm({
      companyName: supplier.companyName || '',
      contactEmail: supplier.contact?.email || '',
      contactPhone: supplier.contact?.phone || '',
      street: supplier.address?.street || '',
      city: supplier.address?.city || '',
      state: supplier.address?.state || '',
      zipCode: supplier.address?.zipCode || '',
      country: supplier.address?.country || 'Sri Lanka',
      deliveryPricePerItem: supplier.deliveryPricePerItem ?? '',
      acceptsDamagedReturns: Boolean(supplier.returnPolicy?.acceptsDamagedReturns),
      acceptsExpiredExchanges: Boolean(supplier.returnPolicy?.acceptsExpiredExchanges),
      deliversOnTime: Boolean(supplier.deliveryCommitment?.deliversOnTime),
      notes: supplier.notes || ''
    });
  }, [supplier]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setMessage('');

    if (!form.companyName.trim()) {
      setFormError('Company name is required.');
      return;
    }

    if (form.contactPhone.trim() && !/^\d{10}$/.test(form.contactPhone.trim())) {
      setFormError('Phone number must contain exactly 10 digits.');
      return;
    }

    if (form.deliveryPricePerItem !== '' && Number.isNaN(Number(form.deliveryPricePerItem))) {
      setFormError('Delivery price must be a valid number.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        companyName: form.companyName.trim(),
        contact: {
          email: form.contactEmail.trim(),
          phone: form.contactPhone.trim()
        },
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zipCode: form.zipCode.trim(),
          country: form.country.trim() || 'Sri Lanka'
        },
        deliveryPricePerItem: form.deliveryPricePerItem === '' ? '' : Number(form.deliveryPricePerItem),
        returnPolicy: {
          acceptsDamagedReturns: form.acceptsDamagedReturns,
          acceptsExpiredExchanges: form.acceptsExpiredExchanges
        },
        deliveryCommitment: {
          deliversOnTime: form.deliversOnTime
        },
        notes: form.notes.trim()
      };

      const response = await axios.put('/api/suppliers/me', payload);
      setMessage(response.data?.message || 'Supplier details updated successfully.');
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update supplier details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-medical-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Supplier Details"
          subtitle="Company, contact, commercial terms, and account status."
          eyebrow="Supplier Portal"
          icon={Factory}
          stats={[
            { label: 'Signed in as', value: user?.name || 'Supplier' },
            { label: 'Account', value: user?.role || 'supplier' }
          ]}
        />

        <div className="card border border-amber-200 bg-amber-50/70">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Supplier profile not linked yet</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Supplier Details"
        subtitle="Identity, contact, commercial terms, and account status."
        eyebrow="Supplier Portal"
        icon={Factory}
        stats={[
          { label: 'Company', value: supplier?.companyName || 'Not set' },
          { label: 'Payment', value: supplier?.paymentStatus || 'pending' },
          { label: 'Invoices due', value: supplierData?.stats?.overdueInvoices ?? 0 },
          { label: 'Performance', value: `${Number(performance.rating || 0).toFixed(1)} / 5` }
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SupplierProfileDetails supplier={supplier} user={user} stats={supplierData?.stats} performance={performance} />

          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-teal-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Account identity</h3>
                <p className="mt-1 text-sm text-slate-500">
                  These values stay linked to the login account so the supplier profile remains connected.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Login name</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.name || supplier?.name || '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Login email</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.email || supplier?.contact?.email || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <form className="card space-y-5" onSubmit={handleSubmit}>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit supplier details</h3>
            <p className="mt-1 text-sm text-slate-500">
              Update your company, contact, address, and commercial terms here.
            </p>
          </div>

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {formError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Company name</span>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Contact email</span>
              <input
                name="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Phone number</span>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
                placeholder="10 digit number"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Delivery price per item</span>
              <input
                name="deliveryPricePerItem"
                type="number"
                step="0.01"
                min="0"
                value={form.deliveryPricePerItem}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Street</span>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">City</span>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">State</span>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Zip code</span>
              <input
                name="zipCode"
                value={form.zipCode}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Country</span>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Commercial terms</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <input
                  type="checkbox"
                  name="acceptsDamagedReturns"
                  checked={form.acceptsDamagedReturns}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">Accepts damaged returns</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                <input
                  type="checkbox"
                  name="acceptsExpiredExchanges"
                  checked={form.acceptsExpiredExchanges}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">Accepts expired exchanges</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                <input
                  type="checkbox"
                  name="deliversOnTime"
                  checked={form.deliversOnTime}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">Delivery commitment: delivers on time</span>
              </label>
            </div>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-semibold text-slate-700">Notes</span>
            <textarea
              name="notes"
              rows={4}
              value={form.notes}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
              placeholder="Optional supplier notes"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierDetailsPage;
