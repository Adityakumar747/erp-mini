import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 py-12">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">
              E
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-xl">erp mini</span>
            </div>
          </div>
        </div>

        {/* Tag */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
            <span className="mr-1.5 text-orange-500">✦</span>
            Operations & Inventory Portal
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
          The heart of your operations
        </h1>
        <p className="text-sm text-slate-500 mb-8 max-w-md">
          Sign in to manage inventory, sales challans, and customer relationships.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs text-slate-600 font-medium">Remember me</span>
            </label>
            <button type="button" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition duration-150 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Log in'}
            {!loading && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-between max-w-md">
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Need test credentials? Click here
          </button>
          <span className="text-xs text-slate-400 font-medium">4 Roles configured</span>
        </div>

        {/* Demo Credentials Panel */}
        {showCredentials && (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@erp.com', 'admin123')}
                className="px-3 py-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 text-xs font-bold text-slate-700 text-center transition"
              >
                Admin
                <span className="block font-normal text-[10px] text-slate-500">Work Orders</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('ops@erp.com', 'ops123')}
                className="px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-xs font-bold text-slate-700 text-center transition"
              >
                Operations
                <span className="block font-normal text-[10px] text-slate-500">Stock & Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('sales@erp.com', 'sales123')}
                className="px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-xs font-bold text-slate-700 text-center transition"
              >
                Sales
                <span className="block font-normal text-[10px] text-slate-500">Orders & Reserve</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Footer */}
        <div className="mt-12 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" /></svg>
            English (US)
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Get Support
          </span>
          <span className="ml-auto">Terms of Service & Privacy Policy applied</span>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-[45%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80"
          alt="Warehouse operations"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/20" />

        {/* Top Badges */}
        <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            v2.4 Live
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
            Wholesale Depot Dispatch
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 xl:p-12">
          {/* Feature Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 xl:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold uppercase tracking-wider border border-orange-500/30">
                Operational Excellence
              </span>
              <span className="text-white/60 text-xs">Hub: Depot B-04</span>
            </div>
            <h2 className="text-xl xl:text-2xl font-bold text-white mb-2 leading-tight">
              Next-generation inventory ledger & dispatch automation
            </h2>
            <p className="text-sm text-white/70 mb-6 max-w-lg">
              Atomic transactional stock guarantees prevent overselling. Sequential chain generation, point-in-time pricing snapshots, and multi-role access controls.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">100%</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">Atomic Safety</div>
              </div>
              <div className="text-center border-x border-white/10">
                <div className="text-lg font-bold text-orange-400">&lt; 150ms</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">4 Roles</div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">RBAC Security</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
