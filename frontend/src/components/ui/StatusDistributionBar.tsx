import React from 'react';

export interface GateCounts {
  Total: number;
  Available: number;
  Occupied: number;
  Reserved: number;
  Maintenance: number;
  Closed: number;
}

export const StatusDistributionBar: React.FC<{ counts: GateCounts; className?: string }> = ({
  counts,
  className = ''
}) => {
  const total = counts.Total || 1;
  const segments = [
    { label: 'Available', count: counts.Available, color: '#107E58', percent: (counts.Available / total) * 100 },
    { label: 'Reserved', count: counts.Reserved, color: '#D97706', percent: (counts.Reserved / total) * 100 },
    { label: 'Occupied', count: counts.Occupied, color: '#1E40AF', percent: (counts.Occupied / total) * 100 },
    { label: 'Maintenance', count: counts.Maintenance, color: '#DC2626', percent: (counts.Maintenance / total) * 100 },
    { label: 'Closed', count: counts.Closed, color: '#647586', percent: (counts.Closed / total) * 100 },
  ];

  return (
    <div className={`p-5 border border-aviation-border bg-white rounded-[4px] shadow-xs space-y-4 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-aviation-muted">
          Capacity Allocation Distribution
        </h3>
        <span className="text-[12px] text-aviation-muted font-tabular">
          {counts.Total} total gates
        </span>
      </div>

      {/* Flat stacked bar */}
      <div className="h-2.5 w-full bg-aviation-bg border border-aviation-border flex overflow-hidden rounded-[2px]">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>

      {/* Plain legend with counts */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-stone">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-[1px]"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-ink font-medium">{seg.label}</span>
            <span className="font-tabular text-stone">({seg.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
