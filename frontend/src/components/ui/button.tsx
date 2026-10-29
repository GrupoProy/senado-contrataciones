import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base común
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // ─── Variantes base ─────────────────────────────────────────
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow',
        info: 'bg-info text-info-foreground shadow-sm hover:bg-info/90 hover:shadow',

        // ─── Variantes con borde ────────────────────────────────────
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/40',
        'outline-primary':
          'border border-primary/40 bg-transparent text-primary hover:bg-primary/10',
        'outline-destructive':
          'border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10',
        'outline-success':
          'border border-success/40 bg-transparent text-success hover:bg-success/10',

        // ─── Variantes sutiles ──────────────────────────────────────
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        'ghost-primary': 'text-primary hover:bg-primary/10',
        'ghost-destructive': 'text-destructive hover:bg-destructive/10',

        // ─── Otros ──────────────────────────────────────────────────
        link: 'text-primary underline-offset-4 hover:underline',
        gradient:
          'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-md hover:from-primary/90 hover:to-primary/60 hover:shadow-lg',
        elevated:
          'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 rounded-md px-2 text-xs [&_svg]:size-3',
        sm: 'h-9 rounded-md px-3 text-xs [&_svg]:size-3.5',
        lg: 'h-11 rounded-lg px-6 text-base',
        xl: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
        'icon-xs': 'h-6 w-6 [&_svg]:size-3',
        'icon-sm': 'h-8 w-8 [&_svg]:size-3.5',
        'icon-lg': 'h-11 w-11 [&_svg]:size-5',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
