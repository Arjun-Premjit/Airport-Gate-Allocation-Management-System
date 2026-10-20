import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Plus, X, Search } from 'lucide-react';
import api from '../services/api';
import { Flight, FlightDetail } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Select, Input, FormField } from '../components/ui/FormField';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, EmptyState } from '../components/ui/Table';
import { Tag } from '../components/ui/Tag';

export const FlightsPage: React.FC = () => {
  const { user } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [airlineFilter, setAirlineFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<FlightDetail | null>(null);

  // New Flight Modal State
  const [isNewFlightOpen, setIsNewFlightOpen] = useState(false);
  const [newFlightId, setNewFlightId] = useState('');
  const [newAirlineId, setNewAirlineId] = useState('DAL');
  const [newAircraftId, setNewAircraftId] = useState('AC-DAL-101');
  const [newDeparture, setNewDeparture] = useState('2026-10-12T14:00');
  const [newArrival, setNewArrival] = useState('2026-10-12T16:00');
  const [aircraftList, setAircraftList] = useState<any[]>([]);

  // Staff Assignment Modal
  const [assignModal, setAssignModal] = useState(false);
  const [employeeId, setEmployeeId] = useState('EMP004');
  const [employees, setEmployees] = useState<any[]>([]);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchFlights = async () => {
    try {
      const params: any = {};
      if (airlineFilter) params.airline_id = airlineFilter;
      const res = await api.get('/flights', { params });
      setFlights(res.data);
    } catch (err) {
      console.error("Failed to load flights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [airlineFilter]);

  useEffect(() => {
    const loadFleet = async () => {
      try {
        const res = await api.get('/aircraft');
        setAircraftList(res.data);
      } catch (err) {
        console.error("Failed to load aircraft fleet", err);
      }
    };
    loadFleet();
  }, []);

  const handleOpenFlight = async (flightId: string) => {
    try {
      const res = await api.get(`/flights/${flightId}`);
      setSelectedFlight(res.data);
    } catch (err) {
      console.error("Failed to load flight detail", err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
      if (res.data.length > 0) {
        setEmployeeId(res.data[0].employee_id);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.post('/flights', {
        flight_id: newFlightId.trim().toUpperCase(),
        airline_id: newAirlineId,
        aircraft_id: newAircraftId,
        scheduled_departure: `${newDeparture}:00`,
        scheduled_arrival: `${newArrival}:00`,
        status: 'Scheduled'
      });
      setSuccessMessage(`Flight '${newFlightId.trim().toUpperCase()}' created successfully.`);
      setIsNewFlightOpen(false);
      setNewFlightId('');
      fetchFlights();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to create flight.");
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlight) return;
    try {
      await api.post(`/flights/${selectedFlight.flight_id}/assign-staff`, {
        employee_id: employeeId
      });
      setAssignModal(false);
      handleOpenFlight(selectedFlight.flight_id);
    } catch (err: any) {
      console.error("Failed to assign staff", err);
    }
  };

  const filteredFlights = useMemo(() => {
    if (!searchQuery.trim()) return flights;
    const q = searchQuery.toLowerCase().trim();
    return flights.filter(f =>
      f.flight_id.toLowerCase().includes(q) ||
      f.airline_name.toLowerCase().includes(q) ||
      f.airline_code.toLowerCase().includes(q) ||
      f.aircraft_model.toLowerCase().includes(q) ||
      (f.gate_id && f.gate_id.toLowerCase().includes(q)) ||
      f.status.toLowerCase().includes(q)
    );
  }, [flights, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Flight Operations"
        serifAccent="Manifest"
        subtitle="Scheduled flight itineraries, aircraft specializations (Passenger & Cargo), and apron staffing."
        kicker="Flight Schedules"
      >
        <div className="flex items-center gap-3">
          {/* Free-text search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-aviation-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search flight, airline, stand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-56 text-[13px]"
            />
          </div>

          <Select
            value={airlineFilter}
            onChange={(e) => setAirlineFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All Airlines</option>
            <option value="DAL">Delta Air Lines (DAL)</option>
            <option value="AIC">Air India (AIC)</option>
            <option value="UAE">Emirates (UAE)</option>
          </Select>

          {(user?.role === 'Airport Head' || user?.role === 'Flight Manager') && (
            <Button
              variant="apron"
              size="md"
              onClick={() => {
                setIsNewFlightOpen(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
            >
              Add Flight
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

      {/* Flights Table */}
      <Table>
        <TableHead>
          <TableHeaderCell>Flight</TableHeaderCell>
          <TableHeaderCell>Carrier</TableHeaderCell>
          <TableHeaderCell>Aircraft Model</TableHeaderCell>
          <TableHeaderCell>Subtype</TableHeaderCell>
          <TableHeaderCell>Departure</TableHeaderCell>
          <TableHeaderCell>Arrival</TableHeaderCell>
          <TableHeaderCell>Duration</TableHeaderCell>
          <TableHeaderCell>Assigned Stand</TableHeaderCell>
          <TableHeaderCell align="right">Operations</TableHeaderCell>
        </TableHead>
        <TableBody>
          {loading ? (
            <tr>
              <td colSpan={9}>
                <EmptyState message="Loading flight manifest..." />
              </td>
            </tr>
          ) : filteredFlights.length > 0 ? (
            filteredFlights.map((f) => (
              <TableRow key={f.flight_id}>
                <TableCell className="font-semibold text-ink font-tabular">
                  {f.flight_id}
                </TableCell>
                <TableCell className="text-stone">
                  {f.airline_name}
                </TableCell>
                <TableCell className="text-ink font-medium">
                  {f.aircraft_model}
                </TableCell>
                <TableCell>
                  <Tag variant="neutral">{f.aircraft_subtype}</Tag>
                </TableCell>
                <TableCell className="font-tabular text-stone">
                  {new Date(f.scheduled_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="font-tabular text-stone">
                  {new Date(f.scheduled_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="font-tabular text-stone">
                  {f.duration_minutes} min
                </TableCell>
                <TableCell>
                  {f.gate_id ? (
                    <span className="font-semibold text-ink font-tabular">
                      {f.gate_id} <span className="text-stone font-normal">({f.terminal_name})</span>
                    </span>
                  ) : (
                    <span className="text-stone text-[12px] font-tabular">Unallocated</span>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenFlight(f.flight_id)}
                    icon={<Eye className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan={9}>
                <EmptyState message="No scheduled flights match the search query or airline filter." />
              </td>
            </tr>
          )}
        </TableBody>
      </Table>

      {/* Flight Detail Modal */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white border border-aviation-border p-6 sm:p-7 space-y-6 rounded-[6px] shadow-2xl max-h-[90vh] overflow-y-auto text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-3">
              <div>
                <h2 className="text-xl font-semibold text-aviation-navy font-display">
                  Flight {selectedFlight.flight_id} Details
                </h2>
                <p className="text-[12px] text-aviation-muted mt-0.5">
                  {selectedFlight.airline_name} ({selectedFlight.airline_code}) • {selectedFlight.aircraft_model}
                </p>
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                className="text-aviation-muted hover:text-aviation-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Timing & Schedule */}
            <div className="grid grid-cols-3 gap-3 text-[12px] font-tabular p-3 border border-aviation-border bg-aviation-bg rounded-[4px]">
              <div>
                <span className="text-aviation-muted block text-[11px] uppercase">Departure</span>
                <span className="font-semibold text-aviation-navy text-sm">
                  {new Date(selectedFlight.scheduled_departure).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-aviation-muted block text-[11px] uppercase">Arrival</span>
                <span className="font-semibold text-aviation-navy text-sm">
                  {new Date(selectedFlight.scheduled_arrival).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-aviation-muted block text-[11px] uppercase">Duration (Derived)</span>
                <span className="font-semibold text-aviation-navy text-sm">
                  {selectedFlight.duration_minutes} minutes
                </span>
              </div>
            </div>

            {/* Aircraft Specialization Details (Disjoint: Passenger or Cargo) */}
            <div className="p-4 border border-aviation-border bg-aviation-bg/60 rounded-[4px] space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-stone">
                  Aircraft Specialization (Disjoint Total)
                </span>
                <Tag variant="neutral">
                  {selectedFlight.aircraft_subtype} Subtype
                </Tag>
              </div>

              {selectedFlight.passenger_seats && (
                <div className="grid grid-cols-2 gap-3 pt-2 text-[12px] font-tabular border-t border-aviation-border">
                  <div className="p-3 border border-aviation-border bg-white rounded-[3px]">
                    <span className="text-[10px] text-stone uppercase block mb-1">Economy Seats</span>
                    <span className="font-semibold text-ink text-base">{selectedFlight.passenger_seats.economic_seats}</span>
                  </div>
                  <div className="p-3 border border-aviation-border bg-white rounded-[3px]">
                    <span className="text-[10px] text-stone uppercase block mb-1">Business Seats</span>
                    <span className="font-semibold text-ink text-base">{selectedFlight.passenger_seats.business_seats}</span>
                  </div>
                </div>
              )}

              {selectedFlight.cargo_details && (
                <div className="p-3 border border-aviation-border bg-white rounded-[3px] text-[12px] font-tabular space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone">Payload Capacity:</span>
                    <span className="font-semibold text-ink">{selectedFlight.cargo_details.capacity} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone">Hazardous Goods Certified:</span>
                    <span className="font-semibold text-ink">
                      {selectedFlight.cargo_details.hazardous_goods_certified ? "Certified" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Staff (Employee_Flight_Assigned_To) */}
            <div className="space-y-3 pt-2 border-t border-aviation-border">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[12px] uppercase tracking-[0.06em] font-medium text-stone">
                  Staff Assigned to Flight (M:N Staffing Bridge)
                </h3>
                {(user?.role === 'Airport Head' || user?.role === 'Flight Manager') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      loadEmployees();
                      setAssignModal(true);
                    }}
                    icon={<Plus className="w-3 h-3" strokeWidth={1.5} />}
                  >
                    Assign Staff
                  </Button>
                )}
              </div>

              {selectedFlight.assigned_staff.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableHeaderCell>Staff Member</TableHeaderCell>
                    <TableHeaderCell>Staff ID</TableHeaderCell>
                    <TableHeaderCell>Experience</TableHeaderCell>
                    <TableHeaderCell align="right">Contact</TableHeaderCell>
                  </TableHead>
                  <TableBody>
                    {selectedFlight.assigned_staff.map(s => (
                      <TableRow key={s.employee_id}>
                        <TableCell className="font-medium text-ink">
                          {s.name}
                        </TableCell>
                        <TableCell className="font-tabular text-stone">
                          {s.employee_id}
                        </TableCell>
                        <TableCell className="font-tabular text-stone">
                          {s.experience_years} years
                        </TableCell>
                        <TableCell align="right" className="font-tabular text-stone">
                          {s.phone_number || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="No staff currently assigned to this flight." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {assignModal && selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-aviation-border p-6 space-y-5 rounded-[6px] shadow-2xl text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-2">
              <h3 className="text-lg font-semibold text-aviation-navy font-display">
                Assign Staff to {selectedFlight.flight_id}
              </h3>
              <button
                onClick={() => setAssignModal(false)}
                className="text-aviation-muted hover:text-aviation-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleAssignStaff} className="space-y-4">
              <FormField label="Select Airport Staff">
                <Select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                >
                  {employees.map(e => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.full_name} ({e.employee_id})
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t border-aviation-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAssignModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="apron"
                >
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Flight Creation Modal */}
      {isNewFlightOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aviation-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-aviation-border p-6 space-y-4 rounded-[6px] shadow-2xl text-aviation-text">
            <div className="flex items-baseline justify-between border-b border-aviation-border pb-3">
              <h2 className="text-xl font-semibold text-aviation-navy font-display">
                Create Scheduled Flight
              </h2>
              <button
                onClick={() => setIsNewFlightOpen(false)}
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

            <form onSubmit={handleCreateFlight} className="space-y-4">
              <FormField label="Flight Number (e.g. DL505)">
                <Input
                  type="text"
                  placeholder="DL505"
                  value={newFlightId}
                  onChange={(e) => setNewFlightId(e.target.value)}
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Operating Airline">
                  <Select
                    value={newAirlineId}
                    onChange={(e) => setNewAirlineId(e.target.value)}
                    required
                  >
                    <option value="DAL">Delta Air Lines (DAL)</option>
                    <option value="AIC">Air India (AIC)</option>
                    <option value="UAE">Emirates (UAE)</option>
                  </Select>
                </FormField>

                <FormField label="Assigned Aircraft">
                  <Select
                    value={newAircraftId}
                    onChange={(e) => setNewAircraftId(e.target.value)}
                    required
                  >
                    {aircraftList.map(ac => (
                      <option key={ac.aircraft_id} value={ac.aircraft_id}>
                        {ac.aircraft_id} — {ac.model} ({ac.subtype})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Scheduled Departure">
                  <Input
                    type="datetime-local"
                    value={newDeparture}
                    onChange={(e) => setNewDeparture(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Scheduled Arrival">
                  <Input
                    type="datetime-local"
                    value={newArrival}
                    onChange={(e) => setNewArrival(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-aviation-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsNewFlightOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="apron"
                >
                  Create Flight
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightsPage;
