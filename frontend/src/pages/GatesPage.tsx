import React, { useState, useEffect, useMemo } from 'react';
import { X, Eye, Plus, Search } from 'lucide-react';
import api from '../services/api';
import { Gate, GateDetail } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, EmptyState } from '../components/ui/Table';
import { Tag } from '../components/ui/Tag';

export const GatesPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'Airport Head';
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminalFilter, setTerminalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGate, setSelectedGate] = useState<GateDetail | null>(null);

  // New Gate Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGateId, setNewGateId] = useState('');
  const [newTerminalId, setNewTerminalId] = useState('T1');
  const [newGateType, setNewGateType] = useState<'Passenger' | 'Cargo' | 'Hybrid'>('Passenger');
  const [newCapacity, setNewCapacity] = useState(250);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchGates = async () => {
    try {
      const params: any = {};
      if (terminalFilter) params.terminal_id = terminalFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/gates', { params });
      setGates(res.data);
    } catch (err) {
      console.error("Failed to load gates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGates();
  }, [terminalFilter, statusFilter]);

  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const res = await api.get('/terminals');
        setTerminals(res.data);
        if (res.data.length > 0) {
          setNewTerminalId(res.data[0].terminal_id);
        }
      } catch (err) {
        console.warn("Failed to load terminals", err);
      }
    };
    loadTerminals();
  }, []);

  const handleOpenGateDetail = async (gateId: string) => {
    try {
      const res = await api.get(`/gates/${gateId}`);
      setSelectedGate(res.data);
    } catch (err) {
      console.error("Failed to load gate details", err);
    }
  };

  const handleCreateGate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await api.post('/gates', {
        gate_id: newGateId.trim().toUpperCase(),
        terminal_id: newTerminalId,
        gate_type: newGateType,
        capacity: Number(newCapacity),
        status: 'Available'
      });
      setSuccessMessage(`Gate '${newGateId.trim().toUpperCase()}' created successfully.`);
      setIsAddModalOpen(false);
      setNewGateId('');
      fetchGates();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to create gate stand.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const filteredGates = useMemo(() => {
    if (!searchQuery.trim()) return gates;
    const q = searchQuery.toLowerCase().trim();
    return gates.filter(g =>
      g.gate_id.toLowerCase().includes(q) ||
      (g.terminal_name && g.terminal_name.toLowerCase().includes(q)) ||
      g.gate_type.toLowerCase().includes(q) ||
      g.status.toLowerCase().includes(q)
    );
  }, [gates, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Gate Infrastructure"
        serifAccent="Inventory"
        subtitle="Core allocatable resources categorized by concourse terminal, wingspan capacity, and live status."
        kicker="Physical Assets"
      >
        <div className="flex items-center gap-3">
          {/* Free-text search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-aviation-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search stand, concourse, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-56 text-[13px]"
            />
          </div>

          <Select
            value={terminalFilter}
            onChange={(e) => setTerminalFilter(e.target.value)}
            className="w-36"
          >
            <option value="">All Terminals</option>
            {terminals.map(t => (
              <option key={t.terminal_id} value={t.terminal_id}>
                {t.name || `Terminal ${t.terminal_id}`}
              </option>
            ))}
            {terminals.length === 0 && (
              <>
                <option value="T1">Terminal 1</option>
                <option value="T2">Terminal 2</option>
              </>
            )}
          </Select>


          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Occupied">Occupied</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Closed">Closed</option>
          </Select>

          {(userRole === 'Airport Head' || userRole === 'Gate Manager') && (
            <Button
              variant="apron"
              size="md"
              onClick={() => {
                setIsAddModalOpen(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Add Stand
            </Button>
          )}
        </div>
      </PageHeader>

      {successMessage && (
        <div className="p-3 border border-status-available/40 bg-status-available/5 text-status-available text-[12px] flex items-center justify-between rounded-[2px]">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-status-available hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Gates Table */}
      <Table>
        <TableHead>
          <TableHeaderCell>Gate Stand</TableHeaderCell>
          <TableHeaderCell>Concourse</TableHeaderCell>
          <TableHeaderCell>Stand Type</TableHeaderCell>
          <TableHeaderCell>Max Capacity</TableHeaderCell>
          <TableHeaderCell>Operational Status</TableHeaderCell>
          <TableHeaderCell>Current Turnaround</TableHeaderCell>
          <TableHeaderCell align="right">Inspection</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <tr>
              <td colSpan={7}>
                <EmptyState message="Loading gate registry..." />
              </td>
            </tr>
          ) : filteredGates.length > 0 ? (
            filteredGates.map((g) => (
              <TableRow key={g.gate_id}>
                <TableCell className="font-semibold text-ink font-tabular">
                  {g.gate_id}
                </TableCell>
                <TableCell className="text-stone">
                  {g.terminal_name}
                </TableCell>
                <TableCell className="text-stone">
                  {g.gate_type}
                </TableCell>
                <TableCell className="font-tabular text-stone">
                  {g.capacity} pax
                </TableCell>
                <TableCell>
                  <Tag status={g.status} />
                </TableCell>
                <TableCell>
                  {g.current_flight ? (
                    <span className="font-medium text-ink font-tabular">
                      {g.current_flight} <span className="text-stone">({g.current_airline})</span>
                    </span>
                  ) : g.status === 'Maintenance' ? (
                    <span className="text-status-maintenance text-[12px] font-tabular">
                      Under Maintenance
                    </span>
                  ) : (
                    <span className="text-stone font-tabular">—</span>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenGateDetail(g.gate_id)}
                    icon={<Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan={7}>
                <EmptyState message="No gates found matching the selected filter or search query." />
              </td>
            </tr>
          )}
        </TableBody>
      </Table>

      {/* Gate Detail Modal */}
      {selectedGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white border border-aviation-border p-6 sm:p-7 space-y-6 rounded-[6px] shadow-2xl max-h-[90vh] overflow-y-auto text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-3">
              <div>
                <h2 className="text-xl font-semibold text-aviation-navy font-display">
                  Stand {selectedGate.gate_id} Specification
                </h2>
                <p className="text-[12px] text-aviation-muted mt-0.5">
                  {selectedGate.terminal_name} • Capacity: {selectedGate.capacity} pax • Type: {selectedGate.gate_type}
                </p>
              </div>
              <button
                onClick={() => setSelectedGate(null)}
                className="text-aviation-muted hover:text-aviation-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Upcoming Allocations */}
            <div className="space-y-3">
              <h3 className="text-[12px] uppercase tracking-[0.06em] font-medium text-stone">
                Upcoming Allocations
              </h3>
              {selectedGate.upcoming_allocations.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableHeaderCell>Flight</TableHeaderCell>
                    <TableHeaderCell>Carrier</TableHeaderCell>
                    <TableHeaderCell>Time Window</TableHeaderCell>
                    <TableHeaderCell align="right">Status</TableHeaderCell>
                  </TableHead>
                  <TableBody>
                    {selectedGate.upcoming_allocations.map((a) => (
                      <TableRow key={a.composite_key}>
                        <TableCell className="font-medium text-ink font-tabular">
                          {a.flight_id}
                        </TableCell>
                        <TableCell className="text-stone">
                          {a.airline}
                        </TableCell>
                        <TableCell className="font-tabular text-stone">
                          {new Date(a.assigned_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(a.released_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell align="right">
                          <Tag status={a.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="No upcoming allocations scheduled for this stand." />
              )}
            </div>

            {/* Maintenance History */}
            <div className="space-y-3 pt-2 border-t border-aviation-border">
              <h3 className="text-[12px] uppercase tracking-[0.06em] font-medium text-stone">
                Maintenance Records
              </h3>
              {selectedGate.maintenance_history.length > 0 ? (
                <div className="divide-y divide-aviation-border border-t border-aviation-border">
                  {selectedGate.maintenance_history.map((m) => (
                    <div key={`${m.gate_id}_${m.record_number}`} className="py-3 flex justify-between items-baseline text-[12px]">
                      <div>
                        <div className="font-medium text-ink">{m.description}</div>
                        <div className="text-[11px] text-stone font-tabular mt-0.5">
                          Date: {new Date(m.maintenance_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-tabular text-ink font-medium">${m.cost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No maintenance records on file for this stand." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Gate Stand Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-aviation-border p-6 space-y-4 rounded-[6px] shadow-2xl text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-3">
              <h2 className="text-xl font-semibold text-aviation-navy font-display">
                Create Gate Stand
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleCreateGate} className="space-y-4">
              <FormField label="Gate Stand ID (e.g. G19)">
                <Input
                  type="text"
                  placeholder="G19"
                  value={newGateId}
                  onChange={(e) => setNewGateId(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Terminal">
                <Select
                  value={newTerminalId}
                  onChange={(e) => setNewTerminalId(e.target.value)}
                  required
                >
                  {terminals.map(t => (
                    <option key={t.terminal_id} value={t.terminal_id}>
                      {t.name} ({t.terminal_id})
                    </option>
                  ))}
                  {terminals.length === 0 && (
                    <>
                      <option value="T1">Terminal 1</option>
                      <option value="T2">Terminal 2</option>
                    </>
                  )}
                </Select>
              </FormField>

              <FormField label="Stand Type">
                <Select
                  value={newGateType}
                  onChange={(e: any) => setNewGateType(e.target.value)}
                  required
                >
                  <option value="Passenger">Passenger</option>
                  <option value="Cargo">Cargo</option>
                  <option value="Hybrid">Hybrid</option>
                </Select>
              </FormField>

              <FormField label="Max Passenger Capacity">
                <Input
                  type="number"
                  min="50"
                  max="1000"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  required
                />
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-aviation-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="apron"
                  disabled={isSubmitting || !newGateId.trim()}
                >
                  {isSubmitting ? "Creating Stand..." : "Create Stand"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatesPage;
