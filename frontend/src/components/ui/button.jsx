import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground shadow hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'hover:bg-destructive/90': variant === 'link',
        },
        {
          'h-8 px-4 text-sm': size === 'default',
          'h-9 px-4': size === 'sm',
          'h-10 px-8': size === 'lg',
        },
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };