import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Tag } from '../components/ui/Tag';

export const TerminalsPage: React.FC = () => {
  const [terminals, setTerminals] = useState<any[]>([]);

  useEffect(() => {
    api.get('/terminals').then(res => setTerminals(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Terminal Infrastructure"
        serifAccent="Concourses"
        subtitle="Concourse floors and organizational terminal concourse groupings for airport gates."
        kicker="Terminal Architecture"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {terminals.map(t => (
          <div key={t.terminal_id} className="p-6 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-4">
            <div className="flex justify-between items-baseline">
              <div>
                <Tag variant="neutral">{t.terminal_id}</Tag>
                <h2 className="text-xl font-light text-ink font-display mt-2">{t.name}</h2>
              </div>
              <span className="text-[12px] font-tabular text-stone">{t.floors} Floors</span>
            </div>
            <div className="pt-3 border-t border-aviation-border flex justify-between text-[13px] font-tabular">
              <span className="text-stone">Integrated Stands</span>
              <span className="font-semibold text-ink">{t.total_gates} Gates</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AirlinesPage: React.FC = () => {
  const [airlines, setAirlines] = useState<any[]>([]);

  useEffect(() => {
    api.get('/airlines').then(res => setAirlines(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Airlines Directory"
        serifAccent="Carriers"
        subtitle="Commercial and cargo carriers operating scheduled gate turns through Dubai International Airport (DXB)."
        kicker="Operating Carriers"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {airlines.map(a => (
          <div key={a.airline_id} className="p-6 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-3">
            <div className="flex justify-between items-baseline">
              <Tag variant="neutral">{a.iata_code}</Tag>
              <span className="text-[12px] text-stone font-tabular">{a.airline_id}</span>
            </div>
            <h2 className="text-lg font-light text-ink font-display">{a.name}</h2>
            <div className="text-[12px] text-stone">Headquarters: {a.headquarters}</div>
            <div className="pt-3 border-t border-aviation-border text-[12px] space-y-1 font-tabular">
              <div className="text-stone">Contacts: {a.contacts.join(', ')}</div>
              <div className="text-stone">Fleet Size: {a.fleet_size} Aircraft</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AircraftPage: React.FC = () => {
  const [aircraft, setAircraft] = useState<any[]>([]);

  useEffect(() => {
    api.get('/aircraft').then(res => setAircraft(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Aircraft Fleet"
        serifAccent="Specializations"
        subtitle="Specialization attributes differentiating Passenger seat classes and Cargo payload capacities."
        kicker="Fleet Registry"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aircraft.map(ac => (
          <div key={ac.aircraft_id} className="p-6 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-4">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-[11px] font-tabular text-stone block mb-1">{ac.aircraft_id}</span>
                <h2 className="text-xl font-light text-ink font-display">{ac.model}</h2>
                <span className="text-[12px] text-stone">{ac.manufacturer} • {ac.airline_name}</span>
                <span className="text-[12px] text-stone ml-2 font-tabular">({ac.age_years} yrs old)</span>
              </div>
              <Tag variant="neutral">
                {ac.subtype}
              </Tag>
            </div>

            <div className="p-4 bg-aviation-bg border border-aviation-border rounded-[2px] text-[12px] font-tabular">
              {ac.subtype === 'Passenger' ? (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 bg-white border border-aviation-border rounded-[3px]">
                    <span className="text-stone block text-[10px] uppercase">Economy</span>
                    <span className="font-semibold text-ink text-base">{ac.specialization.economic_seats}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-aviation-border rounded-[3px]">
                    <span className="text-stone block text-[10px] uppercase">Business</span>
                    <span className="font-semibold text-ink text-base">{ac.specialization.business_seats}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone">Payload Capacity:</span>
                    <span className="font-semibold text-ink">{ac.specialization.capacity} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone">Hazardous Goods Certified:</span>
                    <span className="font-semibold text-ink">
                      {ac.specialization.hazardous_goods_certified ? 'Certified' : 'Standard Cargo'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    api.get('/employees').then(res => setEmployees(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Airport Staff Directory"
        serifAccent="Hierarchy"
        subtitle="Operational personnel registry, derived experience, and recursive supervisory reporting."
        kicker="Personnel"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employees.map(e => (
          <div key={e.employee_id} className="p-6 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-[11px] font-tabular text-stone">{e.employee_id}</span>
                <h2 className="text-base font-light text-ink font-display">{e.full_name}</h2>
                <div className="text-[12px] text-stone font-tabular mt-0.5">
                  Joined: {e.join_date} ({e.experience_years} years experience)
                </div>
              </div>
              <div className="text-right text-[12px] text-stone">
                Supervisor: <span className="font-medium text-ink">{e.supervisor_name}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-aviation-border flex justify-between items-center text-[12px] text-stone font-tabular">
              <span>Contact Lines:</span>
              <span>{e.phone_numbers.join(', ') || 'No phone recorded'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AirportPage: React.FC = () => {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    api.get('/airport').then(res => setInfo(res.data)).catch(console.error);
  }, []);

  if (!info) {
    return (
      <div className="py-24 text-center text-stone text-[13px]">
        Loading station telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title={info.name}
        serifAccent="Station"
        subtitle={`${info.street}, ${info.city}, ${info.state}, ${info.country} • Station Code: ${info.airport_id}`}
        kicker="Airport Facility"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-4">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-stone">
            Airport Contact Numbers (Composite Table)
          </h2>
          <div className="space-y-2 border-t border-aviation-border pt-3 font-tabular text-[13px]">
            {info.contacts.map((c: string, idx: number) => (
              <div key={idx} className="flex justify-between py-1 text-stone">
                <span>Direct Contact Line {idx + 1}</span>
                <span className="font-semibold text-ink">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {info.control_tower && (
          <div className="p-6 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-4">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.06em] text-stone">
              Air Traffic Control Tower (1:1 Relation on Airport.Tower_ID)
            </h2>
            <div className="space-y-2 border-t border-aviation-border pt-3 font-tabular text-[13px]">
              <div className="flex justify-between py-1">
                <span className="text-stone">Tower Name</span>
                <span className="font-semibold text-ink">{info.control_tower.tower_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone">Tower Identifier</span>
                <span className="font-semibold text-ink font-tabular">{info.control_tower.tower_id}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone">VHF Radio Frequency</span>
                <span className="font-semibold text-ink font-tabular">{info.control_tower.frequency_mhz} MHz</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone">Physical Height</span>
                <span className="font-semibold text-ink font-tabular">{info.control_tower.height_m} meters</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
