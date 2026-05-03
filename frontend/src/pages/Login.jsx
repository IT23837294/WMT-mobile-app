import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ShieldCheck, Stethoscope, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [accountType, setAccountType] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password, {
      preferredRole: accountType === 'all' ? '' : accountType
    });

    if (result.success) {
      const userResponse = await axios.get('/api/auth/me');
      const user = userResponse.data.user;

      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'pharmacist':
          navigate('/pharmacist/dashboard');
          break;
        case 'supplier':
          navigate('/supplier/dashboard');
          break;
        case 'customer':
          navigate('/customer/dashboard');
          break;
        case 'support_officer':
          navigate('/support-officer/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#effcf9_0%,#eef8ff_45%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6">
              <BrandLogo />
            </div>
            <div className="inline-flex items-center rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              PharmaCare Access Portal
            </div>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950">
              Welcome back to your digital pharmacy workspace.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Sign in to manage prescriptions, orders, customer care, and pharmacy operations with one secure PharmaCare account.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <ShieldCheck className="h-8 w-8 text-teal-600" />
                <p className="mt-4 text-sm font-semibold text-slate-900">Secure access</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">Role-based login for admin, pharmacist, supplier, customer, and support officer accounts.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <Stethoscope className="h-8 w-8 text-cyan-600" />
                <p className="mt-4 text-sm font-semibold text-slate-900">Prescription care</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">Review, approve, and track medicine requests in one flow.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <Truck className="h-8 w-8 text-blue-600" />
                <p className="mt-4 text-sm font-semibold text-slate-900">Order fulfilment</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">Track payments, deliveries, and customer orders seamlessly.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 text-center lg:text-left">
              <div className="flex justify-center lg:hidden">
                <BrandLogo compact />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                PharmaCare Login
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Access your account dashboard and continue your pharmacy workflow.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="label text-slate-800">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="label text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input rounded-2xl border-slate-200 bg-slate-50/80 py-3 pr-12"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="label text-slate-800">Account Type</p>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('all')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      accountType === 'all'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    All accounts
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('customer')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      accountType === 'customer'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('supplier')}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      accountType === 'supplier'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Supplier
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('all')}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 hover:border-slate-300"
                  >
                    Support
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-slate-600">
                {accountType === 'supplier'
                  ? 'Supplier users can sign in here to open the supplier dashboard and manage their profile, catalog, orders, and invoices.'
                  : accountType === 'customer'
                    ? 'Customer users can sign in here to open the customer dashboard and manage orders and prescriptions.'
                    : 'Admin, pharmacist, supplier, customer, and support officer accounts can all sign in here.'}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label htmlFor="remember-me" className="flex items-center text-slate-700">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-medical-600 focus:ring-medical-500"
                  />
                  <span className="ml-2">Remember me</span>
                </label>

                <Link to="#" className="font-semibold text-teal-700 hover:text-teal-600">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(13,148,136,0.28)] transition hover:from-teal-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-600">
                  Register here
                </Link>
              </div>
            </form>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-center text-sm text-slate-600">
              Want to supply medicines?{' '}
              <Link to="/supplier-application" className="font-semibold text-teal-700 hover:text-teal-600">
                Apply as a supplier
              </Link>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Demo Accounts
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Admin</p>
                  <p className="mt-1">admin@example.com</p>
                  <p>admin123</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Pharmacist</p>
                  <p className="mt-1">pharma@example.com</p>
                  <p>pharma123</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Supplier</p>
                  <p className="mt-1">supplier@example.com</p>
                  <p>supplier123</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:col-span-2">
                  <p className="font-semibold text-slate-900">Customer</p>
                  <p className="mt-1">customer@example.com</p>
                  <p>customer123</p>
                </div>
                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-slate-600 sm:col-span-2">
                  <p className="font-semibold text-slate-900">Support Officer</p>
                  <p className="mt-1">officer@pharmacy.com</p>
                  <p>Officer@123</p>
                  <p className="mt-2 text-xs text-slate-500">The demo login also accepts `officer@123` to match older screenshots.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
