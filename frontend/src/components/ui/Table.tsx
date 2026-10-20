import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto border border-aviation-border bg-white rounded-[4px] shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-[13px]">
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <thead className="bg-[#F5F5F7]">
      <tr className={`border-b border-aviation-border ${className}`}>
        {children}
      </tr>
    </thead>
  );
};

export const TableHeaderCell: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}> = ({ children, align = 'left', className = '' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`py-3 px-4 text-[11px] font-semibold tracking-[0.06em] uppercase text-aviation-muted font-sans ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <tbody className={`divide-y divide-aviation-border ${className}`}>{children}</tbody>;
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`h-[52px] hover:bg-[#F5F5F7] transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}> = ({ children, align = 'left', className = '' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`py-3 px-4 text-[13px] text-ink font-tabular ${alignClass} ${className}`}>
      {children}
    </td>
  );
};

export const EmptyState: React.FC<{ message: string; className?: string }> = ({
  message,
  className = ''
}) => {
  return (
    <div className={`py-12 text-center text-[13px] text-stone font-sans ${className}`}>
      {message}
    </div>
  );
};
