'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-6 sm:gap-4',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold',
        nav: 'space-x-1 flex items-center',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'w-9 font-medium text-muted-foreground',
        row: 'flex w-full mt-1',
        cell: 'relative h-9 w-9 text-center text-sm focus-within:relative focus-within:z-20',
        day: 'h-9 w-9 rounded-full p-0 font-normal transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        day_today: 'bg-primary/10 text-primary',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_outside: 'text-muted-foreground/50',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'rounded-full bg-primary/20 text-primary-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
