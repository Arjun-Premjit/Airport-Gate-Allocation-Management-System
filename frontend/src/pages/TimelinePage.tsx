import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../services/api';
import { TimelineGate } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Select, Input } from '../components/ui/FormField';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/ui/Table';

export const TimelinePage: React.FC = () => {
  const [gates, setGates] = useState<TimelineGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerminal, setSelectedTerminal] = useState('');
  const [dateFilter, setDateFilter] = useState('2026-10-21');

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params: any = { date: dateFilter };
      if (selectedTerminal) params.terminal_id = selectedTerminal;
      const res = await api.get('/allocations/timeline', { params });
      setGates(res.data);
    } catch (err) {
      console.error("Failed to load timeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedTerminal, dateFilter]);

  // Timeline hours from 06:00 to 22:00 (16 hours window)
  const startHour = 6;
  const endHour = 22;
  const totalHours = endHour - startHour;
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  // Calculate percentage offset for allocation block
  const getBlockStyle = (assignedTimeStr: string, releasedTimeStr: string) => {
    const assigned = new Date(assignedTimeStr);
    const released = new Date(releasedTimeStr);

    const startMinutes = assigned.getHours() * 60 + assigned.getMinutes();
    const endMinutes = released.getHours() * 60 + released.getMinutes();

    const timelineStartMinutes = startHour * 60;
    const timelineTotalMinutes = totalHours * 60;

    const leftPercent = Math.max(0, ((startMinutes - timelineStartMinutes) / timelineTotalMinutes) * 100);
    const widthPercent = Math.min(
      100 - leftPercent,
      Math.max(3, ((endMinutes - startMinutes) / timelineTotalMinutes) * 100)
    );

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Gate Timeline"
        serifAccent="Sequence"
        subtitle="Visual temporal distribution of gate occupancy, turnovers, and conflict-free flight scheduling."
        kicker="Operations Timeline"
      >
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-36"
          />

          <Select
            value={selectedTerminal}
            onChange={(e) => setSelectedTerminal(e.target.value)}
            className="w-36"
          >
            <option value="">All Concourse</option>
            <option value="T1">Terminal 1</option>
            <option value="T2">Terminal 2</option>
          </Select>

          <Button
            variant="secondary"
            size="md"
            onClick={fetchTimeline}
            icon={<RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />}
          >
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Visual Timeline Canvas */}
      <div className="border border-aviation-border bg-white rounded-[4px] shadow-xs overflow-hidden">
        {/* Timeline Time Header */}
        <div className="flex border-b border-aviation-border bg-[#F5F5F7] py-2.5 text-[11px] font-tabular text-aviation-muted sticky top-0 z-10">
          <div className="w-40 shrink-0 px-4 uppercase tracking-[0.06em] font-semibold text-aviation-muted font-sans">
            Stand / Gate
          </div>
          <div className="flex-1 relative h-5">
            {hours.map((h, idx) => {
              const leftPos = (idx / totalHours) * 100;
              return (
                <div
                  key={h}
                  style={{ left: `${leftPos}%` }}
                  className="absolute transform -translate-x-1/2 flex flex-col items-center"
                >
                  <span>{String(h).padStart(2, '0')}:00</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gates Grid Rows */}
        <div className="divide-y divide-aviation-border">
          {loading ? (
            <EmptyState message="Calculating temporal gate intervals..." />
          ) : gates.length > 0 ? (
            gates.map((g) => (
              <div key={g.gate_id} className="flex items-center hover:bg-[#F5F5F7] transition-colors">
                {/* Gate Label Column */}
                <div className="w-40 shrink-0 px-4 py-3 border-r border-aviation-border flex items-center justify-between">
                  <div>
                    <div className="font-tabular font-bold text-[13px] text-aviation-navy">
                      Gate {g.gate_id}
                    </div>
                    <div className="text-[11px] text-aviation-muted">
                      {g.terminal_name}
                    </div>
                  </div>
                  <Tag status={g.status} />
                </div>

                {/* Timeline Bar Track */}
                <div className="flex-1 relative h-11 px-2 flex items-center">
                  {/* Subtle vertical hour guide lines */}
                  {hours.map((_, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${(idx / totalHours) * 100}%` }}
                      className="absolute top-0 bottom-0 w-px bg-aviation-border pointer-events-none"
                    />
                  ))}

                  {/* Allocation Blocks */}
                  {g.allocations.map((a) => {
                    const style = getBlockStyle(a.assigned_time, a.released_time);
                    return (
                      <div
                        key={a.composite_key}
                        style={style}
                        className="absolute h-7 rounded-[3px] px-2 flex items-center justify-between border border-aviation-blue/40 bg-aviation-blue/15 text-aviation-blue font-tabular text-[11px] font-semibold truncate hover:bg-aviation-blue/25 transition-all cursor-pointer z-10"
                        title={`${a.flight_id} (${a.airline}): ${new Date(a.assigned_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(a.released_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        <span className="truncate">{a.flight_id}</span>
                        <span className="text-[10px] text-aviation-muted hidden md:inline ml-1">
                          {new Date(a.assigned_time).getHours()}:{String(new Date(a.assigned_time).getMinutes()).padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}

                  {/* Maintenance Bar */}
                  {g.status === 'Maintenance' && g.allocations.length === 0 && (
                    <div className="w-full h-6 rounded-[2px] bg-aviation-red/10 border border-aviation-red/30 flex items-center justify-center text-[10px] uppercase tracking-wider font-tabular text-aviation-red font-semibold">
                      Stand Under Maintenance
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="No gate records matching the selected terminal." />
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelinePage;
