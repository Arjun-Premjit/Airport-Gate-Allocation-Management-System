import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'apron' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] select-none rounded-full disabled:opacity-40 disabled:cursor-not-allowed font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D98D1] focus-visible:ring-offset-2 active:scale-[0.99]';

  const sizeStyles = {
    sm: 'text-[13px] px-4 py-1.5 gap-1.5 h-8',
    md: 'text-[15px] px-6 py-2.5 gap-2 h-10',
    lg: 'text-[16px] px-8 py-3.5 gap-2.5 h-12'
  }[size];

  const variantStyles = {
    primary: 'bg-[#0D98D1] text-white hover:bg-[#0B84B7] border border-[#0D98D1]',
    apron: 'bg-[#0D98D1] text-white hover:bg-[#0B84B7] border border-[#0D98D1]',
    secondary: 'bg-[#FFFFFF] text-[#000000] hover:bg-black/5 border border-black/15',
    ghost: 'bg-transparent text-[#000000] hover:bg-black/5 border border-transparent',
    destructive: 'bg-transparent text-red-600 hover:bg-red-50 border border-red-200'
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
