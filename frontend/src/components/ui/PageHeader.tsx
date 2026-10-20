import React from 'react';

export interface PageHeaderProps {
  title: string;
  serifAccent?: string;
  subtitle?: string;
  children?: React.ReactNode;
  kicker?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  serifAccent,
  subtitle,
  children,
  kicker
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-aviation-border">
      <div>
        {kicker && (
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-aviation-blue mb-1.5 font-tabular">
            {kicker}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold text-aviation-text tracking-tight font-display">
          {title}
          {serifAccent && (
            <span className="text-aviation-blue ml-2 font-normal">
              {serifAccent}
            </span>
          )}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-aviation-muted mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
