import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function WorkOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New WO Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    location_id: '',
    item_id: '',
    required_qty: '',
    assigned_user_id: '',
    notes: '',
  });
  const [stockCheck, setStockCheck] = useState({ available: 0, shortage: 0 });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/work-orders');
      setWorkOrders(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [itRes, locRes, invRes] = await Promise.all([
        api.get('/inventory/items'),
        api.get('/inventory/locations'),
        api.get('/inventory'),
      ]);
      setItems(itRes.data.data);
      setLocations(locRes.data.data);
      // Dummy users for assignment
      setUsers([
        { id: 1, name: 'Admin User', role: 'admin' },
        { id: 2, name: 'Operations User', role: 'operations' },
        { id: 3, name: 'Sales User', role: 'sales' },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchMetadata();
  }, []);

  // Recalculate stock check preview when item/location/required_qty changes in modal
  const handleStockPreview = async (locId, itId, reqQty) => {
    if (!locId || !itId) {
      setStockCheck({ available: 0, shortage: 0 });
      return;
    }
    try {
      const res = await api.get('/inventory', { params: { location_id: locId, item_id: itId } });
      const records = res.data.data;
      const totalAvail = records.reduce((s, r) => s + parseFloat(r.available_qty), 0);
      const req = parseFloat(reqQty) || 0;
      const shortage = Math.max(0, req - totalAvail);
      setStockCheck({ available: totalAvail, shortage });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFieldChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);
    if (['location_id', 'item_id', 'required_qty'].includes(field)) {
      handleStockPreview(
        field === 'location_id' ? val : updated.location_id,
        field === 'item_id' ? val : updated.item_id,
        field === 'required_qty' ? val : updated.required_qty
      );
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    setModalError('');
    if (parseFloat(formData.required_qty) <= 0) {
      setModalError('Required quantity must be positive');
      return;
    }
    setModalLoading(true);
    try {
      await api.post('/work-orders', {
        location_id: Number(formData.location_id),
        item_id: Number(formData.item_id),
        required_qty: parseFloat(formData.required_qty),
        assigned_user_id: Number(formData.assigned_user_id),
        notes: formData.notes,
      });
      setShowModal(false);
      setFormData({ location_id: '', item_id: '', required_qty: '', assigned_user_id: '', notes: '' });
      setStockCheck({ available: 0, shortage: 0 });
      fetchWorkOrders();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create work order');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusChange = async (woId, newStatus) => {
    try {
      await api.patch(`/work-orders/${woId}/status`, { status: newStatus });
      fetchWorkOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const isAdmin = user?.role === 'admin';
  const canUpdateStatus = user?.role === 'admin' || user?.role === 'operations';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Work Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing & production orders with automatic material stock check and shortage calculation
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            + New Work Order
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Orders</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {workOrders.filter((w) => w.status === 'Assigned').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">In Progress</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {workOrders.filter((w) => w.status === 'InProgress').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Completed</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {workOrders.filter((w) => w.status === 'Completed').length}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading work orders...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No work orders found. {isAdmin ? 'Click "+ New Work Order" to create one.' : ''}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">WO ID</th>
                <th className="px-6 py-3.5 text-left">Location</th>
                <th className="px-6 py-3.5 text-left">Item</th>
                <th className="px-6 py-3.5 text-right font-bold">Required</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-700">Available</th>
                <th className="px-6 py-3.5 text-right font-bold text-red-600">Shortage</th>
                <th className="px-6 py-3.5 text-left">Assigned User</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {workOrders.map((wo) => {
                const hasShortage = parseFloat(wo.shortage_qty) > 0;
                return (
                  <tr key={wo.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono font-bold text-indigo-700">
                      WO-{wo.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {wo.location_name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                      {wo.item_name}
                      <span className="text-xs text-slate-400 font-normal ml-1">({wo.item_unit})</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-slate-800">
                      {wo.required_qty}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right font-medium text-slate-600">
                      {wo.available_at_location}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      {hasShortage ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          Shortage: {wo.shortage_qty}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                      <span className="font-medium text-slate-800">{wo.assigned_user_name}</span>
                      <span className="text-xs text-slate-400 ml-1">({wo.assigned_user_role})</span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          wo.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : wo.status === 'InProgress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canUpdateStatus && wo.status === 'Assigned' && (
                          <button
                            onClick={() => handleStatusChange(wo.id, 'InProgress')}
                            className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded border border-amber-200"
                          >
                            Start
                          </button>
                        )}
                        {canUpdateStatus && wo.status === 'InProgress' && (
                          <button
                            onClick={() => handleStatusChange(wo.id, 'Completed')}
                            className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded border border-emerald-200"
                          >
                            Complete
                          </button>
                        )}
                        {hasShortage && (
                          <button
                            onClick={() => navigate('/transfers', { state: { woId: wo.id, itemId: wo.item_id, qty: wo.shortage_qty, destLocId: wo.location_id } })}
                            className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded border border-indigo-200"
                            title="Initiate internal stock transfer for shortage"
                          >
                            Transfer Stock →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Work Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Work Order</h2>
            <p className="text-xs text-slate-500 mb-4">Stock check and shortage calculation will update automatically</p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs">{modalError}</div>
            )}

            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Location</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Required Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.required_qty}
                    onChange={(e) => handleFieldChange('required_qty', e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assign User</label>
                  <select
                    required
                    value={formData.assigned_user_id}
                    onChange={(e) => handleFieldChange('assigned_user_id', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Assign To...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Stock Check Box */}
              {formData.location_id && formData.item_id && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                    Automatic Material Stock Check
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Available at Selected Location:</span>
                    <span className="font-bold text-slate-900">{stockCheck.available}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Required Material Quantity:</span>
                    <span className="font-bold text-slate-900">{formData.required_qty || 0}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span>Calculated Shortage:</span>
                    <span className={stockCheck.shortage > 0 ? 'text-red-600 font-black' : 'text-emerald-600'}>
                      {stockCheck.shortage > 0 ? `${stockCheck.shortage} (Internal Transfer Needed)` : '0 (Sufficient Stock)'}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="e.g. Rush priority for client assembly"
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
                  {modalLoading ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
