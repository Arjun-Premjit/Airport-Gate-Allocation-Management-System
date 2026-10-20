import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Trash2, Edit2, Search } from 'lucide-react';
import api from '../services/api';
import { GateAllocation, Flight, Gate } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, EmptyState } from '../components/ui/Table';
import { Tag } from '../components/ui/Tag';
import { FormField, Input, Select } from '../components/ui/FormField';

export const AllocationsPage: React.FC = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<GateAllocation[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [assignedTime, setAssignedTime] = useState('2026-10-12T14:00');
  const [releasedTime, setReleasedTime] = useState('2026-10-12T16:00');
  const [selectedGateId, setSelectedGateId] = useState('');
  const [availableGates, setAvailableGates] = useState<Gate[]>([]);
  const [loadingGates, setLoadingGates] = useState(false);

  // Edit Modal State
  const [editingAlloc, setEditingAlloc] = useState<GateAllocation | null>(null);
  const [editGateId, setEditGateId] = useState('');
  const [editAssignedTime, setEditAssignedTime] = useState('');
  const [editReleasedTime, setEditReleasedTime] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAllocations = async () => {
    try {
      const url = statusFilter ? `/allocations?status=${statusFilter}` : '/allocations';
      const res = await api.get(url);
      setAllocations(res.data);
    } catch (err) {
      console.error("Failed to load allocations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [statusFilter]);

  useEffect(() => {
    const loadFlights = async () => {
      try {
        const res = await api.get('/flights');
        setFlights(res.data);
      } catch (err) {
        console.error("Failed to load flights", err);
      }
    };
    loadFlights();
  }, []);

  const fetchAvailableGates = async (start: string, end: string) => {
    setLoadingGates(true);
    setErrorMessage(null);
    try {
      const res = await api.get('/gates/available', {
        params: {
          start_time: `${start}:00`,
          end_time: `${end}:00`
        }
      });
      setAvailableGates(res.data);
      if (res.data.length > 0) {
        setSelectedGateId(res.data[0].gate_id);
      } else {
        setSelectedGateId('');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to query available gates.");
    } finally {
      setLoadingGates(false);
    }
  };

  const handleFlightSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value;
    setSelectedFlightId(fId);
    const f = flights.find(fl => fl.flight_id === fId);
    if (f) {
      const start = f.scheduled_departure.substring(0, 16);
      const end = f.scheduled_arrival.substring(0, 16);
      setAssignedTime(start);
      setReleasedTime(end);
      fetchAvailableGates(start, end);
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedFlightId || !selectedGateId) {
      setErrorMessage("Please select both a Flight and a Gate.");
      return;
    }

    try {
      const payload = {
        flight_id: selectedFlightId,
        gate_id: selectedGateId,
        assigned_time: `${assignedTime}:00`,
        released_time: `${releasedTime}:00`
      };
      const res = await api.post('/allocations', payload);
      setSuccessMessage(`Successfully allocated Gate ${res.data.gate_id} to Flight ${res.data.flight_id}`);
      setIsModalOpen(false);
      fetchAllocations();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Allocation failed. Check for conflict.";
      setErrorMessage(detail);
    }
  };

  const openEditModal = (a: GateAllocation) => {
    setEditingAlloc(a);
    setEditGateId(a.gate_id);
    setEditAssignedTime(a.assigned_time.substring(0, 16));
    setEditReleasedTime(a.released_time.substring(0, 16));
    setEditStatus(a.status);
    setErrorMessage(null);
  };

  const handleUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlloc) return;
    setErrorMessage(null);

    try {
      const payload = {
        new_gate_id: editGateId,
        assigned_time: `${editAssignedTime}:00`,
        released_time: `${editReleasedTime}:00`,
        status: editStatus
      };
      await api.put(`/allocations/${editingAlloc.composite_key}`, payload);
      setSuccessMessage(`Successfully updated allocation for Gate ${editGateId} (${editingAlloc.flight_id})`);
      setEditingAlloc(null);
      fetchAllocations();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to edit allocation. Check for conflict.";
      setErrorMessage(detail);
    }
  };

  const handleCancelAllocation = async (compositeKey: string) => {
    if (!confirm(`Cancel allocation ${compositeKey}? The gate will be released.`)) return;
    try {
      await api.delete(`/allocations/${compositeKey}`);
      setSuccessMessage(`Allocation ${compositeKey} cancelled successfully.`);
      fetchAllocations();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to cancel allocation.");
    }
  };

  // Free-text search filtering alongside status dropdown
  const filteredAllocations = useMemo(() => {
    if (!searchQuery.trim()) return allocations;
    const q = searchQuery.toLowerCase().trim();
    return allocations.filter(a =>
      a.flight_id.toLowerCase().includes(q) ||
      a.gate_id.toLowerCase().includes(q) ||
      a.airline_name.toLowerCase().includes(q) ||
      a.terminal_name.toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
    );
  }, [allocations, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Gate Allocations"
        serifAccent="Manifest"
        subtitle="Conflict-free assignment of airport stands to commercial and freight flights for specified windows."
        kicker="Operations Module"
      >
        <div className="flex items-center gap-3">
          {/* Free-text search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-aviation-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search flight, gate, airline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-56 text-[13px]"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>

          {(user?.role === 'Airport Head' || user?.role === 'Gate Manager') && (
            <Button
              variant="apron"
              size="md"
              onClick={() => {
                setIsModalOpen(true);
                setErrorMessage(null);
                setSuccessMessage(null);
                if (flights.length > 0) {
                  setSelectedFlightId(flights[0].flight_id);
                  const start = flights[0].scheduled_departure.substring(0, 16);
                  const end = flights[0].scheduled_arrival.substring(0, 16);
                  setAssignedTime(start);
                  setReleasedTime(end);
                  fetchAvailableGates(start, end);
                }
              }}
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              New Allocation
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Feedback Messages */}
      {successMessage && (
        <div className="p-3 border border-status-available/40 bg-status-available/5 text-status-available text-[12px] flex items-center justify-between rounded-[2px]">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-status-available hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 border border-status-maintenance/40 bg-status-maintenance/5 text-status-maintenance text-[12px] flex items-center justify-between rounded-[2px]">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-status-maintenance hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Table */}
      <Table>
          <TableHead>
            <TableHeaderCell>Composite Key</TableHeaderCell>
            <TableHeaderCell>Flight</TableHeaderCell>
            <TableHeaderCell>Carrier</TableHeaderCell>
            <TableHeaderCell>Gate Stand</TableHeaderCell>
            <TableHeaderCell>Concourse</TableHeaderCell>
            <TableHeaderCell>Assigned Time</TableHeaderCell>
            <TableHeaderCell>Released Time</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell align="right">Actions</TableHeaderCell>
          </TableHead>
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState message="Loading allocation registry..." />
                </td>
              </tr>
            ) : filteredAllocations.length > 0 ? (
              filteredAllocations.map((a) => (
                <TableRow key={a.composite_key}>
                  <TableCell className="text-stone font-tabular text-[12px]">
                    {a.composite_key}
                  </TableCell>
                  <TableCell className="font-medium text-ink font-tabular">
                    {a.flight_id}
                  </TableCell>
                  <TableCell className="text-stone">
                    {a.airline_name}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-ink font-tabular">
                      {a.gate_id}
                    </span>
                  </TableCell>
                  <TableCell className="text-stone">
                    {a.terminal_name}
                  </TableCell>
                  <TableCell className="font-tabular text-stone">
                    {new Date(a.assigned_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="font-tabular text-stone">
                    {new Date(a.released_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell>
                    <Tag status={a.status} />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status !== 'Cancelled' && a.status !== 'Completed' && (user?.role === 'Airport Head' || user?.role === 'Gate Manager') && (
                        <>
                          <button
                            onClick={() => openEditModal(a)}
                            title="Edit Allocation Window or Stand"
                            className="p-1 text-stone hover:text-aviation-blue transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleCancelAllocation(a.composite_key)}
                            title="Cancel Allocation"
                            className="p-1 text-stone hover:text-status-maintenance transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <EmptyState message="No allocations match the search query or filter." />
                </td>
              </tr>
            )}
          </TableBody>
        </Table>

      {/* Allocation Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-aviation-border p-6 sm:p-7 space-y-5 rounded-[6px] shadow-2xl text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-3">
              <div>
                <h2 className="text-xl font-semibold text-aviation-navy font-display">
                  Assign Gate Allocation
                </h2>
                <p className="text-[12px] text-aviation-muted mt-0.5">
                  Conflict-free assignment window validation
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-aviation-muted hover:text-aviation-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 border border-status-maintenance/40 bg-status-maintenance/5 text-status-maintenance text-[12px] rounded-[2px]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateAllocation} className="space-y-4">
              <FormField label="Flight Schedule">
                <Select
                  value={selectedFlightId}
                  onChange={handleFlightSelect}
                  required
                >
                  {flights.map(f => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_id} — {f.airline_name} ({f.aircraft_model})
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Assigned Time (Arrival)">
                  <Input
                    type="datetime-local"
                    value={assignedTime}
                    onChange={(e) => {
                      setAssignedTime(e.target.value);
                      fetchAvailableGates(e.target.value, releasedTime);
                    }}
                    required
                  />
                </FormField>
                <FormField label="Released Time (Departure)">
                  <Input
                    type="datetime-local"
                    value={releasedTime}
                    onChange={(e) => {
                      setReleasedTime(e.target.value);
                      fetchAvailableGates(assignedTime, e.target.value);
                    }}
                    required
                  />
                </FormField>
              </div>

              <FormField
                label="Available Verified Gate Stand"
                hint={loadingGates ? "Querying available collision-free gates..." : undefined}
              >
                {availableGates.length > 0 ? (
                  <Select
                    value={selectedGateId}
                    onChange={(e) => setSelectedGateId(e.target.value)}
                    required
                  >
                    {availableGates.map(g => (
                      <option key={g.gate_id} value={g.gate_id}>
                        {g.gate_id} — {g.terminal_name} (Capacity: {g.capacity}, Type: {g.gate_type})
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="p-3 border border-status-reserved/40 bg-status-reserved/5 text-status-reserved text-[12px] rounded-[2px]">
                    No available gates for this time window (all gates are occupied, in maintenance, or closed).
                  </div>
                )}
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-aviation-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="apron"
                  disabled={!selectedGateId}
                >
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Edit Modal */}
      {editingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-aviation-border p-6 sm:p-7 space-y-5 rounded-[6px] shadow-2xl text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-3">
              <div>
                <h2 className="text-xl font-semibold text-aviation-navy font-display">
                  Edit Gate Allocation
                </h2>
                <p className="text-[12px] text-aviation-muted mt-0.5">
                  Update stand or operating window for {editingAlloc.flight_id} ({editingAlloc.composite_key})
                </p>
              </div>
              <button
                onClick={() => setEditingAlloc(null)}
                className="text-aviation-muted hover:text-aviation-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 border border-status-maintenance/40 bg-status-maintenance/5 text-status-maintenance text-[12px] rounded-[2px]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateAllocation} className="space-y-4">
              <FormField label="Assigned Gate Stand">
                <Input
                  type="text"
                  value={editGateId}
                  onChange={(e) => setEditGateId(e.target.value.toUpperCase())}
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Assigned Time">
                  <Input
                    type="datetime-local"
                    value={editAssignedTime}
                    onChange={(e) => setEditAssignedTime(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Released Time">
                  <Input
                    type="datetime-local"
                    value={editReleasedTime}
                    onChange={(e) => setEditReleasedTime(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <FormField label="Status">
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </Select>
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-aviation-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingAlloc(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="apron"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationsPage;
