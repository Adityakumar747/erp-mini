import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Order Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    location_id: '',
    quantity: '',
    customer_name: '',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [liveAvailable, setLiveAvailable] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customer orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [itRes, locRes] = await Promise.all([
        api.get('/inventory/items'),
        api.get('/inventory/locations'),
      ]);
      setItems(itRes.data.data);
      setLocations(locRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMetadata();
  }, []);

  const checkLiveStock = async (itemId, locId) => {
    if (!itemId || !locId) {
      setLiveAvailable(null);
      return;
    }
    try {
      const res = await api.get('/inventory', { params: { item_id: itemId, location_id: locId } });
      const records = res.data.data;
      const totalAvail = records.reduce((sum, r) => sum + parseFloat(r.available_qty), 0);
      setLiveAvailable(totalAvail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFieldChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);
    if (field === 'item_id' || field === 'location_id') {
      checkLiveStock(
        field === 'item_id' ? val : updated.item_id,
        field === 'location_id' ? val : updated.location_id
      );
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setModalError('');
    if (parseFloat(formData.quantity) <= 0) {
      setModalError('Quantity must be greater than 0');
      return;
    }
    setModalLoading(true);
    try {
      await api.post('/orders', {
        item_id: Number(formData.item_id),
        location_id: Number(formData.location_id),
        quantity: parseFloat(formData.quantity),
        customer_name: formData.customer_name,
        notes: formData.notes,
      });
      setShowModal(false);
      setFormData({ item_id: '', location_id: '', quantity: '', customer_name: '', notes: '' });
      setLiveAvailable(null);
      fetchOrders();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to place order and reserve stock');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order and release reserved stock back into inventory?')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const canCreateOrder = user?.role === 'admin' || user?.role === 'sales';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Orders & Stock Reservation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sales orders with atomic, concurrency-safe inventory reservation preventing overselling
          </p>
        </div>
        {canCreateOrder && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            + New Customer Order
          </button>
        )}
      </div>

      {/* Concurrency Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mb-6 text-xs text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold uppercase tracking-wider text-emerald-800 text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
            Atomic Reservation
          </span>
          <span>
            When a sales order is placed, <strong>Reserved Quantity</strong> increases immediately while Physical Quantity remains constant until fulfillment.
          </span>
        </div>
        <div className="text-slate-600">
          Database transactions guarantee that two concurrent users cannot reserve more than available inventory.
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading customer orders...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No customer orders found. {canCreateOrder ? 'Click "+ New Customer Order" to create one.' : ''}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">Order ID</th>
                <th className="px-6 py-3.5 text-left">Customer</th>
                <th className="px-6 py-3.5 text-left">Item</th>
                <th className="px-6 py-3.5 text-left">Location</th>
                <th className="px-6 py-3.5 text-right font-bold">Qty Reserved</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-left">Sales Rep</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3.5 whitespace-nowrap font-mono font-bold text-indigo-700">
                    ORD-{ord.id.toString().padStart(4, '0')}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-medium text-slate-800">
                    {ord.customer_name || 'Standard Customer'}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                    {ord.item_name}
                    <span className="text-xs text-slate-400 font-normal ml-1">({ord.item_unit})</span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-700">
                    {ord.location_name}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-amber-600">
                    {ord.quantity}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        ord.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                    {ord.created_by_name}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    {canCreateOrder && ord.status === 'Confirmed' ? (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className="text-xs px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded border border-red-200 transition"
                        title="Release reserved stock"
                      >
                        Cancel & Release
                      </button>
                    ) : ord.status === 'Cancelled' ? (
                      <span className="text-xs text-slate-400">Stock Released</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Customer Order</h2>
            <p className="text-xs text-slate-500 mb-4">Stock will be atomically reserved upon creation</p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs">{modalError}</div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                  placeholder="e.g. Apex Industrial Corp"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fulfillment Location</label>
                <select
                  required
                  value={formData.location_id}
                  onChange={(e) => handleFieldChange('location_id', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item</label>
                <select
                  required
                  value={formData.item_id}
                  onChange={(e) => handleFieldChange('item_id', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Quantity to Reserve</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange('quantity', e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {liveAvailable !== null && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                  <span className="text-slate-600">Currently Available at Location:</span>
                  <span className={`font-bold ${liveAvailable < (parseFloat(formData.quantity) || 0) ? 'text-red-600' : 'text-emerald-700 font-black'}`}>
                    {liveAvailable} units
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="e.g. PO# 94821"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Reserving...' : 'Confirm Order & Reserve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
