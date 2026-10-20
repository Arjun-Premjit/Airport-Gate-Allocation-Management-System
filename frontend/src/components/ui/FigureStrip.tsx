import React from 'react';

export interface FigureItem {
  label: string;
  value: number | string;
  sublabel?: string;
}

export interface FigureStripProps {
  items: FigureItem[];
  className?: string;
}

export const FigureStrip: React.FC<FigureStripProps> = ({ items, className = '' }) => {
  return (
    <div className={`w-full border border-aviation-border bg-white divide-y md:divide-y-0 md:divide-x divide-aviation-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-[4px] shadow-xs ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-aviation-muted mb-2">
            {item.label}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-aviation-text font-display font-tabular">
              {item.value}
            </span>
            {item.sublabel && (
              <span className="text-[11px] text-stone font-tabular">
                {item.sublabel}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
