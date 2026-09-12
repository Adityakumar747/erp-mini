import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterLocation, setFilterLocation] = useState('');
  const [filterItem, setFilterItem] = useState('');

  // Add Stock Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    location_id: '',
    batch: 'BATCH-001',
    quantity: '',
    note: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Transaction History Modal
  const [selectedInv, setSelectedInv] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterLocation) params.location_id = filterLocation;
      if (filterItem) params.item_id = filterItem;

      const res = await api.get('/inventory', { params });
      setInventory(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
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
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [filterLocation, filterItem]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    setModalError('');
    if (parseFloat(formData.quantity) <= 0) {
      setModalError('Quantity must be greater than 0');
      return;
    }
    setModalLoading(true);
    try {
      await api.post('/inventory', {
        item_id: Number(formData.item_id),
        location_id: Number(formData.location_id),
        batch: formData.batch,
        quantity: parseFloat(formData.quantity),
        note: formData.note,
      });
      setShowAddModal(false);
      setFormData({ item_id: '', location_id: '', batch: 'BATCH-001', quantity: '', note: '' });
      fetchInventory();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setModalLoading(false);
    }
  };

  const viewHistory = async (id) => {
    try {
      const res = await api.get(`/inventory/${id}`);
      setSelectedInv(res.data.data);
    } catch (err) {
      alert('Failed to load transaction history');
    }
  };

  const canAddStock = user?.role === 'admin' || user?.role === 'operations';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-location physical, reserved, and available stock levels
          </p>
        </div>
        {canAddStock && (
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            + Add Stock
          </button>
        )}
      </div>

      {/* Filters & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{inventory.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Physical Units</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {inventory.reduce((sum, i) => sum + parseFloat(i.physical_qty), 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reserved Units</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {inventory.reduce((sum, i) => sum + parseFloat(i.reserved_qty), 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available For Sale/WO</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {inventory.reduce((sum, i) => sum + parseFloat(i.available_qty), 0)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap gap-4 items-center">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filters:</span>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        <select
          value={filterItem}
          onChange={(e) => setFilterItem(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
        >
          <option value="">All Items</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>{it.name}</option>
          ))}
        </select>

        {(filterLocation || filterItem) && (
          <button
            onClick={() => { setFilterLocation(''); setFilterItem(''); }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading inventory data...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      ) : inventory.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No inventory records match the criteria.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">Item</th>
                <th className="px-6 py-3.5 text-left">Category</th>
                <th className="px-6 py-3.5 text-left">Location</th>
                <th className="px-6 py-3.5 text-left">Batch</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-700">Physical</th>
                <th className="px-6 py-3.5 text-right font-bold text-amber-700">Reserved</th>
                <th className="px-6 py-3.5 text-right font-bold text-emerald-700">Available</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {inventory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                    {row.item_name}
                    <span className="text-xs text-slate-400 font-normal ml-1">({row.item_unit})</span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {row.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                    {row.location_name}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-slate-500">
                    {row.batch}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-slate-800">
                    {row.physical_qty}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-amber-600">
                    {row.reserved_qty}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-emerald-600">
                    {row.available_qty}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center">
                    <button
                      onClick={() => viewHistory(row.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                    >
                      Audit Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add / Adjust Inventory Stock</h2>
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs">{modalError}</div>
            )}
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Location</label>
                <select
                  required
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Batch Code</label>
                  <input
                    type="text"
                    required
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="e.g. Received from supplier"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {selectedInv && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedInv.item_name}</h2>
                <p className="text-xs text-slate-500">
                  Location: <span className="font-semibold">{selectedInv.location_name}</span> | Batch: <span className="font-mono">{selectedInv.batch}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedInv(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Transaction History</h3>
              {(!selectedInv.transactions || selectedInv.transactions.length === 0) ? (
                <p className="text-sm text-slate-500">No transaction logs recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedInv.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                              tx.type === 'IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.type === 'OUT'
                                ? 'bg-red-100 text-red-800'
                                : tx.type === 'RESERVE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-semibold text-slate-700">{tx.quantity} {selectedInv.item_unit}</span>
                          <span className="text-slate-400">({tx.reference_type || 'manual'})</span>
                        </div>
                        {tx.note && <p className="text-slate-500 mt-1">{tx.note}</p>}
                      </div>
                      <div className="text-right text-slate-400 text-[11px]">
                        <div>{tx.created_by_name || 'System'}</div>
                        <div>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedInv(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
