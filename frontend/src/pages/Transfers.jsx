import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Transfers() {
  const { user } = useAuth();
  const routeLocation = useLocation();
  const [transfers, setTransfers] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    source_location_id: '',
    dest_location_id: '',
    item_id: '',
    quantity: '',
    work_order_id: '',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transfers');
      setTransfers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transfers');
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
    fetchTransfers();
    fetchMetadata();

    // Check if navigated from WorkOrder shortage
    if (routeLocation.state) {
      const { woId, itemId, qty, destLocId } = routeLocation.state;
      setFormData((prev) => ({
        ...prev,
        item_id: itemId ? itemId.toString() : '',
        dest_location_id: destLocId ? destLocId.toString() : '',
        quantity: qty ? qty.toString() : '',
        work_order_id: woId ? woId.toString() : '',
        notes: `Transfer for Work Order WO-${woId?.toString().padStart(4, '0')}`,
      }));
      setShowModal(true);
    }
  }, [routeLocation]);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    setModalError('');
    if (formData.source_location_id === formData.dest_location_id) {
      setModalError('Source and Destination locations must be different');
      return;
    }
    if (parseFloat(formData.quantity) <= 0) {
      setModalError('Quantity must be positive');
      return;
    }
    setModalLoading(true);
    try {
      await api.post('/transfers', {
        source_location_id: Number(formData.source_location_id),
        dest_location_id: Number(formData.dest_location_id),
        item_id: Number(formData.item_id),
        quantity: parseFloat(formData.quantity),
        work_order_id: formData.work_order_id ? Number(formData.work_order_id) : null,
        notes: formData.notes,
      });
      setShowModal(false);
      setFormData({ source_location_id: '', dest_location_id: '', item_id: '', quantity: '', work_order_id: '', notes: '' });
      fetchTransfers();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to request transfer');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDispatch = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'dispatch' }));
    try {
      await api.patch(`/transfers/${id}/dispatch`);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Dispatch failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReceive = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'receive' }));
    try {
      await api.patch(`/transfers/${id}/receive`);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Receipt failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const canManageTransfers = user?.role === 'admin' || user?.role === 'operations';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Internal Stock Transfers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Inter-warehouse material transfers with two-stage transactional dispatch and receipt verification
          </p>
        </div>
        {canManageTransfers && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            + Request Transfer
          </button>
        )}
      </div>

      {/* Workflow Explainer Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 mb-6 text-xs text-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold uppercase tracking-wider text-indigo-700 text-[11px] bg-indigo-100 px-2 py-0.5 rounded">
            Transactional Guard
          </span>
          <span>
            <strong>Stage 1 (Dispatch):</strong> Source stock reduces immediately. Destination stays unchanged.
          </span>
        </div>
        <div className="text-slate-600">
          <strong>Stage 2 (Receipt):</strong> Destination stock increases. Prevents duplicate receipt idempotently.
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading transfers...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      ) : transfers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No stock transfers found. {canManageTransfers ? 'Click "+ Request Transfer" to create one.' : ''}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">Transfer ID</th>
                <th className="px-6 py-3.5 text-left">Source</th>
                <th className="px-6 py-3.5 text-left">Destination</th>
                <th className="px-6 py-3.5 text-left">Item</th>
                <th className="px-6 py-3.5 text-right font-bold">Qty</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Timeline</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {transfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3.5 whitespace-nowrap font-mono font-bold text-indigo-700">
                    TR-{tr.id.toString().padStart(4, '0')}
                    {tr.work_order_id && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        For WO-{tr.work_order_id.toString().padStart(4, '0')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                    {tr.source_location_name}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                    {tr.dest_location_name}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                    {tr.item_name}
                    <span className="text-xs text-slate-400 font-normal ml-1">({tr.item_unit})</span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-slate-800">
                    {tr.quantity}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        tr.status === 'Received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tr.status === 'Dispatched'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tr.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center text-xs text-slate-500">
                    {tr.status === 'Requested' && <span className="text-slate-400">Awaiting Dispatch</span>}
                    {tr.status === 'Dispatched' && <span className="text-amber-700 font-medium">In Transit</span>}
                    {tr.status === 'Received' && (
                      <span className="text-emerald-700 font-medium">
                        ✓ Received {tr.received_at ? new Date(tr.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {canManageTransfers && tr.status === 'Requested' && (
                        <button
                          onClick={() => handleDispatch(tr.id)}
                          disabled={actionLoading[tr.id] === 'dispatch'}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-md shadow-xs transition disabled:opacity-50"
                        >
                          {actionLoading[tr.id] === 'dispatch' ? 'Dispatching...' : 'Dispatch'}
                        </button>
                      )}
                      {canManageTransfers && tr.status === 'Dispatched' && (
                        <button
                          onClick={() => handleReceive(tr.id)}
                          disabled={actionLoading[tr.id] === 'receive'}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-xs transition disabled:opacity-50"
                        >
                          {actionLoading[tr.id] === 'receive' ? 'Receiving...' : 'Confirm Receipt'}
                        </button>
                      )}
                      {tr.status === 'Received' && (
                        <span className="text-xs text-slate-400 font-medium">Locked (Received)</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Request Internal Stock Transfer</h2>
            <p className="text-xs text-slate-500 mb-4">
              Move inventory between warehouse locations to resolve stock shortages
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs">{modalError}</div>
            )}

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Source Location</label>
                  <select
                    required
                    value={formData.source_location_id}
                    onChange={(e) => setFormData({ ...formData, source_location_id: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Source</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Destination Location</label>
                  <select
                    required
                    value={formData.dest_location_id}
                    onChange={(e) => setFormData({ ...formData, dest_location_id: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Destination</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item to Transfer</label>
                <select
                  required
                  value={formData.item_id}
                  onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Transfer Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 40"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Work Order ID (Optional)</label>
                  <input
                    type="number"
                    value={formData.work_order_id}
                    onChange={(e) => setFormData({ ...formData, work_order_id: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Expedited inter-branch transit"
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
                  {modalLoading ? 'Creating...' : 'Request Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
