import * as React from 'react';
import { cn } from '@/src/utils/cn';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-none border-2 border-black bg-white text-black shadow-none dark:border-white dark:bg-black dark:text-white",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1 p-2 border-b-2 border-black bg-[#F0F0F0] dark:border-white dark:bg-gray-900", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xs font-bold leading-none uppercase", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-2", className)} {...props} />
  )
);
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
