import React from 'react';

export interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  hint,
  className = ''
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-aviation-muted">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-aviation-muted">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-aviation-red font-medium">{error}</p>
      )}
    </div>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2 text-[13px] bg-white border border-aviation-border rounded-[4px] text-aviation-text placeholder:text-aviation-muted/60 outline-none focus:border-aviation-blue focus:ring-1 focus:ring-aviation-blue font-tabular transition-colors disabled:bg-aviation-bg disabled:opacity-60 shadow-xs ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-3 py-2 text-[13px] bg-white border border-aviation-border rounded-[4px] text-aviation-text outline-none focus:border-aviation-blue focus:ring-1 focus:ring-aviation-blue font-tabular transition-colors disabled:bg-aviation-bg disabled:opacity-60 cursor-pointer shadow-xs ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
