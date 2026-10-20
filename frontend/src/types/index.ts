export type UserRole = 'Airport Head' | 'Gate Manager' | 'Flight Manager' | 'Ground Crew';

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  supervisor_id?: string;
}

export type GateStatus = 'Available' | 'Reserved' | 'Occupied' | 'Maintenance' | 'Closed';

export interface Gate {
  gate_id: string;
  terminal_id: string;
  terminal_name?: string;
  gate_type: 'Passenger' | 'Cargo' | 'Hybrid';
  capacity: number;
  status: GateStatus;
  current_flight?: string;
  current_airline?: string;
  latest_maintenance?: string;
}

export interface GateDetail extends Gate {
  upcoming_allocations: Array<{
    gate_id: string;
    flight_id: string;
    allocation_number: number;
    composite_key: string;
    airline?: string;
    assigned_time: string;
    released_time: string;
    status: string;
  }>;
  maintenance_history: Array<{
    gate_id: string;
    record_number: number;
    maintenance_date: string;
    description: string;
    cost: number;
  }>;
}

export interface Flight {
  flight_id: string;
  airline_name: string;
  airline_code: string;
  aircraft_model: string;
  aircraft_subtype: 'Passenger' | 'Cargo';
  scheduled_departure: string;
  scheduled_arrival: string;
  duration_minutes: number;
  status: string;
  gate_id?: string;
  terminal_name?: string;
}

export interface FlightDetail extends Flight {
  passenger_seats?: {
    economic_seats: number;
    business_seats: number;
    total_capacity: number;
  };
  cargo_details?: {
    capacity: number;
    hazardous_goods_certified: boolean;
  };
  assigned_staff: Array<{
    employee_id: string;
    name: string;
    phone_number?: string;
    experience_years: number;
  }>;
  allocation_details?: {
    gate_id: string;
    allocation_number: number;
    composite_key: string;
    terminal_name?: string;
    assigned_time: string;
    released_time: string;
    status: string;
  };
}

export interface GateAllocation {
  gate_id: string;
  flight_id: string;
  allocation_number: number;
  composite_key: string;
  terminal_name: string;
  airline_name: string;
  assigned_time: string;
  released_time: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
}

export interface MaintenanceRecord {
  gate_id: string;
  record_number: number;
  terminal_name: string;
  maintenance_date: string;
  description: string;
  cost: number;
  gate_status: string;
}

export interface DashboardSummary {
  gate_counts: {
    Total: number;
    Available: number;
    Occupied: number;
    Reserved: number;
    Maintenance: number;
    Closed: number;
  };
  total_flights: number;
  upcoming_allocations_count: number;
  upcoming_allocations: Array<{
    gate_id: string;
    flight_id: string;
    allocation_number: number;
    composite_key: string;
    airline: string;
    terminal_name: string;
    time_window: string;
    status: string;
  }>;
}

export interface TimelineGate {
  gate_id: string;
  terminal_id: string;
  terminal_name: string;
  status: GateStatus;
  allocations: Array<{
    gate_id: string;
    flight_id: string;
    allocation_number: number;
    composite_key: string;
    airline: string;
    assigned_time: string;
    released_time: string;
    status: string;
  }>;
}
