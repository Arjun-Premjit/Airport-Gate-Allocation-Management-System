import React, { useState, useEffect } from 'react';
import { Plus, X, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { MaintenanceRecord, Gate } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Select, Input, FormField } from '../components/ui/FormField';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, EmptyState } from '../components/ui/Table';
import { Tag } from '../components/ui/Tag';

export const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'Airport Head';
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('2026-10-21T08:00');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('15000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/maintenance');
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to load maintenance records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const loadGates = async () => {
      try {
        const res = await api.get('/gates');
        setGates(res.data);
        if (res.data.length > 0) setSelectedGateId(res.data[0].gate_id);
      } catch (err) {
        console.error("Failed to load gates", err);
      }
    };
    loadGates();
  }, []);

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await api.post('/maintenance', {
        gate_id: selectedGateId,
        maintenance_date: `${maintenanceDate}:00`,
        description,
        cost: parseFloat(cost)
      });
      setSuccessMessage(`Maintenance scheduled for Gate ${selectedGateId}. Gate status set to Maintenance.`);
      setModalOpen(false);
      setDescription('');
      fetchRecords();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to schedule maintenance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndMaintenance = async (gateId: string) => {
    if (!confirm(`End maintenance on Gate ${gateId} and restore status to Available?`)) return;
    setErrorMessage(null);
    try {
      await api.post(`/maintenance/${gateId}/end`);
      setSuccessMessage(`Maintenance ended on Gate ${gateId}. Stand restored to Available.`);
      fetchRecords();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to end maintenance.");
    }
  };


  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Gate Maintenance"
        serifAccent="Records"
        subtitle="Explains gate unavailability and enforces mechanical exclusion of servicing stands from flight allocation."
        kicker="Infrastructure Servicing"
      >
        {(userRole === 'Airport Head' || userRole === 'Gate Manager') && (
          <Button
            variant="apron"
            size="md"
            onClick={() => {
              setModalOpen(true);
              setSuccessMessage(null);
            }}
            icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
          >
            Schedule Maintenance
          </Button>
        )}
      </PageHeader>

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


      {/* Maintenance Table */}
      <Table>
        <TableHead>
          <TableHeaderCell>Stand</TableHeaderCell>
          <TableHeaderCell>Record #</TableHeaderCell>
          <TableHeaderCell>Concourse</TableHeaderCell>
          <TableHeaderCell>Servicing Description</TableHeaderCell>
          <TableHeaderCell>Maintenance Date</TableHeaderCell>
          <TableHeaderCell>Cost</TableHeaderCell>
          <TableHeaderCell>Stand Condition</TableHeaderCell>
          <TableHeaderCell align="right">Operations</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <tr>
              <td colSpan={8}>
                <EmptyState message="Loading maintenance telemetry..." />
              </td>
            </tr>
          ) : records.length > 0 ? (
            records.map((m) => (
              <TableRow key={`${m.gate_id}_${m.record_number}`}>
                <TableCell className="font-semibold text-ink font-tabular">
                  {m.gate_id}
                </TableCell>
                <TableCell className="text-stone font-tabular">
                  #{m.record_number}
                </TableCell>
                <TableCell className="text-stone">
                  {m.terminal_name}
                </TableCell>
                <TableCell className="text-ink max-w-xs truncate">
                  {m.description}
                </TableCell>
                <TableCell className="font-tabular text-stone">
                  {new Date(m.maintenance_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-tabular font-medium text-ink">
                  ${m.cost.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Tag status={m.gate_status} />
                </TableCell>
                <TableCell align="right">
                  {m.gate_status === 'Maintenance' && (userRole === 'Airport Head' || userRole === 'Gate Manager') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEndMaintenance(m.gate_id)}
                      icon={<CheckCircle className="w-3.5 h-3.5 text-status-available" />}
                    >
                      Restore Stand
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan={8}>
                <EmptyState message="No maintenance records found on file." />
              </td>
            </tr>
          )}
        </TableBody>
      </Table>

      {/* Schedule Maintenance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-aviation-border p-6 space-y-5 rounded-[6px] shadow-2xl text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-2">
              <h2 className="text-xl font-semibold text-aviation-navy font-display">
                Schedule Stand Maintenance
              </h2>
              <button
                onClick={() => setModalOpen(false)}
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

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <FormField label="Target Stand">
                <Select
                  value={selectedGateId}
                  onChange={(e) => setSelectedGateId(e.target.value)}
                >
                  {gates.map(g => (
                    <option key={g.gate_id} value={g.gate_id}>
                      {g.gate_id} — {g.terminal_name} (Current: {g.status})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Maintenance Date">
                <Input
                  type="datetime-local"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Servicing Reason / Scope">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Jet bridge motor replacement and electrical inspection"
                  className="w-full px-3 py-2 text-[13px] bg-white border border-aviation-border rounded-[4px] text-aviation-text outline-none focus:border-aviation-blue focus:ring-1 focus:ring-aviation-blue font-sans transition-colors h-20 resize-none shadow-xs"
                  required
                />
              </FormField>

              <FormField label="Authorized Budget ($)">
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t border-aviation-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="apron"
                  disabled={isSubmitting || !description.trim()}
                >
                  {isSubmitting ? "Scheduling Servicing..." : "Schedule Servicing"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
