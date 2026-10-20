import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, EmptyState } from '../components/ui/Table';

export const AnalyticsPage: React.FC = () => {
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/utilization');
        setUtilizationData(res.data);
      } catch (err) {
        console.error("Failed to load utilization analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Gate Utilization"
        serifAccent="Analytics"
        subtitle="Analytical telemetry measuring stand usage frequency, total occupied minutes, and turnover efficiency."
        kicker="Performance Telemetry"
      />

      {/* Utilization Table */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-light text-ink font-display">
            Stand Occupancy Ranking (24-Hour Operating Window)
          </h2>
          <span className="text-[12px] text-stone font-tabular">
            {utilizationData.length} stands analyzed
          </span>
        </div>

        <Table>
          <TableHead>
            <TableHeaderCell>Gate Stand</TableHeaderCell>
            <TableHeaderCell>Concourse</TableHeaderCell>
            <TableHeaderCell>Stand Type</TableHeaderCell>
            <TableHeaderCell>Max Capacity</TableHeaderCell>
            <TableHeaderCell>Total Allocations</TableHeaderCell>
            <TableHeaderCell>Occupied Time</TableHeaderCell>
            <TableHeaderCell align="right" className="min-w-[180px]">Utilization Rate</TableHeaderCell>
          </TableHead>
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="Computing 24-hour utilization metrics..." />
                </td>
              </tr>
            ) : utilizationData.length > 0 ? (
              utilizationData.map((u) => (
                <TableRow key={u.gate_id}>
                  <TableCell className="font-medium text-ink font-tabular">
                    Gate {u.gate_number}
                  </TableCell>
                  <TableCell className="text-stone">
                    {u.terminal_name}
                  </TableCell>
                  <TableCell className="text-stone">
                    {u.gate_type}
                  </TableCell>
                  <TableCell className="font-tabular text-stone">
                    {u.capacity} pax
                  </TableCell>
                  <TableCell className="font-tabular font-medium text-ink">
                    {u.total_allocations}
                  </TableCell>
                  <TableCell className="font-tabular text-stone">
                    {u.occupied_minutes} mins
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-2 bg-aviation-bg border border-aviation-border overflow-hidden rounded-[2px]">
                        <div
                          style={{ width: `${u.utilization_percentage}%` }}
                          className="h-full bg-aviation-blue rounded-[1px]"
                        />
                      </div>
                      <span className="font-tabular font-medium text-ink text-[12px] w-12 text-right">
                        {u.utilization_percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="No utilization data recorded for current cycle." />
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
