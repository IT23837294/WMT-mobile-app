import React from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  ShieldCheck,
  Clock3,
  Truck,
  Stethoscope,
  HeartPulse,
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  ScanLine,
  PackageCheck,
  Sparkles,
  Activity,
  FlaskConical,
  PhoneCall
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const Home = () => {
  const careHighlights = [
    {
      icon: ShieldCheck,
      title: 'Verified Dispensing',
      description: 'Licensed pharmacists review every request before medicines are packed and released.'
    },
    {
      icon: Clock3,
      title: 'Fast Digital Ordering',
      description: 'Upload prescriptions, review medicine availability, and place orders without waiting in line.'
    },
    {
      icon: Truck,
      title: 'Doorstep Delivery',
      description: 'Scheduled delivery support keeps urgent and recurring medicine orders moving on time.'
    },
    {
      icon: HeartPulse,
      title: 'Patient-Centered Care',
      description: 'Designed for families, chronic care patients, and customers who need reliable refill support.'
    }
  ];

  const serviceBlocks = [
    {
      icon: ClipboardCheck,
      title: 'Prescription Validation',
      description: 'Pharmacists verify uploaded prescriptions, dosage instructions, and medicine substitutions.',
      accent: 'bg-emerald-100 text-emerald-700'
    },
    {
      icon: FlaskConical,
      title: 'Medicine Discovery',
      description: 'Browse curated medicine categories, compare options, and check professional stock availability.',
      accent: 'bg-cyan-100 text-cyan-700'
    },
    {
      icon: PackageCheck,
      title: 'Secure Fulfillment',
      description: 'Orders move through controlled inventory, payment confirmation, packing, and dispatch tracking.',
      accent: 'bg-sky-100 text-sky-700'
    },
    {
      icon: PhoneCall,
      title: 'Ongoing Support',
      description: 'Patients can stay connected for help with refills, delivery coordination, and order follow-up.',
      accent: 'bg-teal-100 text-teal-700'
    }
  ];

  const categories = [
    'Prescription Medicines',
    'Wellness & Vitamins',
    'Cardiac & Diabetes Care',
    'Pain Relief & First Aid',
    'Respiratory Care',
    'Family Health Essentials'
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Upload or Search',
      description: 'Customers can upload prescriptions or browse approved medicines directly from the platform.'
    },
    {
      step: '02',
      title: 'Clinical Review',
      description: 'Pharmacists confirm medicine details, stock, and any prescription-specific requirements.'
    },
    {
      step: '03',
      title: 'Secure Checkout',
      description: 'Orders are placed with digital payment support, delivery details, and e-receipt registration.'
    },
    {
      step: '04',
      title: 'Track and Receive',
      description: 'Customers follow delivery progress and receive medicines through the final doorstep handoff.'
    }
  ];

  const trustStats = [
    { value: '24/7', label: 'Digital Ordering Access' },
    { value: '100%', label: 'Pharmacist Order Review' },
    { value: 'Fast', label: 'Local Delivery Coordination' },
    { value: 'Secure', label: 'Payment and Receipt Flow' }
  ];

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.24),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#10364f_48%,#0f766e_100%)] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-6rem] top-16 h-64 w-64 rounded-full bg-teal-300 blur-3xl" />
          <div className="absolute right-[-4rem] top-10 h-56 w-56 rounded-full bg-cyan-300 blur-3xl" />
          <div className="absolute bottom-[-5rem] left-1/3 h-72 w-72 rounded-full bg-emerald-400 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <BrandLogo theme="dark" />
            </div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-sm text-teal-50">
              <Sparkles className="h-4 w-4" />
              Advanced digital pharmacy care platform
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Smarter pharmacy care with verified medicine ordering, delivery, and patient support.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              PharmaCare brings prescription handling, medicine discovery, pharmacist review, secure checkout,
              and delivery coordination into one advanced pharmacy experience.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/medicines"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Explore Medicines
                <Pill className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-extrabold">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="rounded-[1.5rem] bg-white p-6 text-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      <BadgeCheck className="h-4 w-4" />
                      Verified Pharmacy Flow
                    </div>
                    <h2 className="mt-4 text-2xl font-bold">Modern care operations for every medicine order</h2>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-3 text-white">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {[
                    {
                      icon: ScanLine,
                      title: 'Prescription Upload',
                      detail: 'Collects customer prescription images for pharmacist review.'
                    },
                    {
                      icon: Stethoscope,
                      title: 'Pharmacist Validation',
                      detail: 'Confirms safe dispensing before medicine release.'
                    },
                    {
                      icon: Truck,
                      title: 'Delivery Monitoring',
                      detail: 'Connects orders, payments, tracking, and receipt delivery.'
                    }
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="rounded-xl bg-teal-600 p-2 text-white">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-[linear-gradient(135deg,#ecfeff,#ecfdf5)] p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Core Categories</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-teal-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {careHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)]"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 p-3 text-teal-700">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                <Sparkles className="h-4 w-4" />
                Advanced Pharmacy Services
              </div>
              <h2 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">
                Built for modern pharmacy operations and a better patient experience.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                From prescription intake to e-receipts and delivery tracking, the interface supports the complete
                pharmacy workflow with better clarity for customers, pharmacists, and administrators.
              </p>

              <div className="mt-8 rounded-[1.75rem] bg-slate-900 p-6 text-white">
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-200">Platform Vision</div>
                <p className="mt-4 text-base leading-8 text-slate-200">
                  A connected pharmacy model where medicine access, compliance, payment, fulfillment, and
                  communication feel consistent, reliable, and professional from the first click to delivery.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {serviceBlocks.map((block) => (
                <div
                  key={block.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 transition hover:bg-white hover:shadow-lg"
                >
                  <div className={`inline-flex rounded-2xl p-3 ${block.accent}`}>
                    <block.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{block.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{block.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <PackageCheck className="h-4 w-4 text-teal-600" />
              Order Journey
            </div>
            <h2 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">How the advanced pharmacy flow works</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Every step is structured to reduce confusion and keep medicine fulfillment safe, trackable, and easy to understand.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-4">
            {processSteps.map((item) => (
              <div key={item.step} className="relative rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 text-sm font-black tracking-[0.28em] text-teal-600">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <BrandLogo theme="dark" className="mb-6" />
              <h2 className="text-3xl font-black sm:text-4xl">
                Ready to move to a more advanced digital pharmacy experience?
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Register now, upload prescriptions, browse available medicines, and manage pharmacy orders with a cleaner modern workflow.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <div className="space-y-4 text-sm text-slate-200">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <span>Secure medicine ordering</span>
                  <BadgeCheck className="h-5 w-5 text-teal-300" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <span>Professional pharmacist review</span>
                  <BadgeCheck className="h-5 w-5 text-teal-300" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <span>Delivery and payment tracking</span>
                  <BadgeCheck className="h-5 w-5 text-teal-300" />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/medicines"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Browse Medicines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#07111f] py-14 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <BrandLogo theme="dark" className="mb-4" />
              <p className="text-sm leading-7 text-slate-400">
                A connected pharmacy platform built for trusted medicine access, verified prescription care, and dependable fulfillment.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Explore</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link to="/medicines" className="hover:text-white">Medicines</Link></li>
                <li><Link to="/register" className="hover:text-white">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Services</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>Prescription Upload</li>
                <li>Pharmacist Review</li>
                <li>Home Delivery</li>
                <li>E-Receipt Support</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Contact</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>support@pharmacare.com</li>
                <li>1-800-PHARMA-CARE</li>
                <li>Available 24/7</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-500">
            <p>&copy; 2026 PharmaCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
