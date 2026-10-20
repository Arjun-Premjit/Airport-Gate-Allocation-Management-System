import React from 'react';

export type StatusType = 'Available' | 'Reserved' | 'Occupied' | 'Maintenance' | 'Closed' | 'Active' | 'Scheduled' | 'Completed' | string;

export interface TagProps {
  status?: StatusType;
  children?: React.ReactNode;
  variant?: 'status' | 'neutral' | 'accent';
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  status,
  children,
  variant = 'status',
  className = ''
}) => {
  const label = children || status;

  if (variant === 'neutral') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-medium tracking-wide uppercase font-tabular border border-aviation-border bg-white text-aviation-muted ${className}`}>
        {label}
      </span>
    );
  }

  if (variant === 'accent') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-medium tracking-wide uppercase font-tabular border border-aviation-blue/30 bg-aviation-blue/10 text-aviation-blue ${className}`}>
        {label}
      </span>
    );
  }

  // Functional, muted status tag paired with text label, flat tinted fill and thin border
  const getStatusStyles = (s?: string) => {
    switch (s?.toLowerCase()) {
      case 'available':
        return 'text-[#0E704D] bg-[#107E58]/10 border-[#107E58]/25';
      case 'reserved':
      case 'scheduled':
        return 'text-[#B45309] bg-[#D97706]/10 border-[#D97706]/25';
      case 'occupied':
      case 'active':
        return 'text-[#1D4ED8] bg-[#1E40AF]/10 border-[#1E40AF]/25';
      case 'maintenance':
        return 'text-[#B91C1C] bg-[#DC2626]/10 border-[#DC2626]/25';
      case 'closed':
        return 'text-[#475569] bg-[#647586]/10 border-[#647586]/25';
      default:
        return 'text-aviation-muted bg-white border-aviation-border';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium tracking-wide uppercase font-tabular border ${getStatusStyles(
        typeof status === 'string' ? status : String(label)
      )} ${className}`}
    >
      {label}
    </span>
  );
};
