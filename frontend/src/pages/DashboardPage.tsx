import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { FigureStrip } from '../components/ui/FigureStrip';
import { StatusDistributionBar } from '../components/ui/StatusDistributionBar';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, EmptyState } from '../components/ui/Table';
import { Tag } from '../components/ui/Tag';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-stone text-[13px] font-sans">
        Retrieving stand occupancy and flight schedules...
      </div>
    );
  }

  const counts = data?.gate_counts || { Total: 0, Available: 0, Occupied: 0, Reserved: 0, Maintenance: 0, Closed: 0 };

  const figureItems = [
    { label: 'Total Stands', value: counts.Total },
    { label: 'Available', value: counts.Available },
    { label: 'Occupied', value: counts.Occupied },
    { label: 'Reserved', value: counts.Reserved },
    { label: 'Maintenance', value: counts.Maintenance },
    { label: 'Closed', value: counts.Closed },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Editorial Page Header */}
      <PageHeader
        title="Apron Operations"
        serifAccent="Overview"
        subtitle="Real-time gate availability, conflict prevention, and flight turnaround monitoring."
        kicker="Terminal Control Dispatch"
      >
        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate('/timeline')}
        >
          View Timeline
        </Button>
        <Button
          variant="apron"
          size="md"
          onClick={() => navigate('/allocations?new=true')}
          icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
        >
          New Allocation
        </Button>
      </PageHeader>

      {/* Horizontal Figures Strip */}
      <FigureStrip items={figureItems} />

      {/* Capacity & Distribution Stacked Bar */}
      <StatusDistributionBar counts={counts} />

      {/* Active & Upcoming Allocations Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-light text-ink font-display">
              Active & Scheduled Allocations
            </h2>
            <span className="text-[12px] text-stone font-tabular">
              ({data?.upcoming_allocations_count || 0} scheduled movements)
            </span>
          </div>

          <button
            onClick={() => navigate('/allocations')}
            className="text-[12px] text-stone hover:text-ink font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Complete manifest</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>

        <Table>
          <TableHead>
            <TableHeaderCell>Flight</TableHeaderCell>
            <TableHeaderCell>Carrier</TableHeaderCell>
            <TableHeaderCell>Gate Stand</TableHeaderCell>
            <TableHeaderCell>Concourse</TableHeaderCell>
            <TableHeaderCell>Time Window</TableHeaderCell>
            <TableHeaderCell align="right">Operational Status</TableHeaderCell>
          </TableHead>
          <TableBody>
            {data?.upcoming_allocations && data.upcoming_allocations.length > 0 ? (
              data.upcoming_allocations.map((a) => (
                <TableRow key={a.composite_key}>
                  <TableCell className="font-medium text-ink font-tabular">
                    {a.flight_id}
                  </TableCell>
                  <TableCell className="text-stone">
                    {a.airline}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-ink font-tabular">
                      {a.gate_id}
                    </span>
                  </TableCell>
                  <TableCell className="text-stone">
                    {a.terminal_name}
                  </TableCell>
                  <TableCell className="font-tabular text-stone">
                    {a.time_window}
                  </TableCell>
                  <TableCell align="right">
                    <Tag status={a.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="No active or upcoming gate allocations recorded in the current window." />
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DashboardPage;
