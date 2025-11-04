import * as React from 'react';

import { cn } from '@/lib/utils';

const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      aria-orientation={orientation}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';

export { Separator };
