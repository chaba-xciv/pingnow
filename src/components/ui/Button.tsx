import * as React from 'react';
import { cn } from '@/src/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'emerald' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.98]",
          {
            'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100': variant === 'default',
            'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80': variant === 'outline',
            'hover:bg-zinc-100 text-zinc-700 dark:hover:bg-zinc-800/60 dark:text-zinc-300': variant === 'ghost',
            'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20': variant === 'emerald',
            'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20': variant === 'danger',
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-11 px-6 text-base': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
