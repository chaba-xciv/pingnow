import * as React from 'react';
import { cn } from '@/src/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-none text-xs font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white dark:ring-offset-black",
          {
            'border-2 border-black bg-black text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200': variant === 'default',
            'border-2 border-black bg-white text-black hover:bg-gray-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-gray-800': variant === 'outline',
            'hover:bg-gray-100 dark:hover:bg-gray-800': variant === 'ghost',
            'h-10 px-4 py-2': size === 'default',
            'h-8 px-3 text-[10px]': size === 'sm',
            'h-11 px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
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

