'use client';

import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
  className?: string;
  children?: React.ReactNode; // texto de ayuda
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  size?: 'sm' | 'md';
};

export default function InfoHint({
  className,
  children = 'Más información',
  side = 'top',
  align = 'start',
  size = 'sm',
}: Props) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch(window.matchMedia('(hover: none)').matches);
    }
  }, []);

  const Btn = (
    <button
      type='button'
      aria-label='Más información'
      className={cn(
        'inline-flex items-center justify-center rounded-md text-muted-foreground/80 hover:text-foreground transition-colors',
        size === 'sm' ? 'h-6 w-6' : 'h-8 w-8',
        className,
      )}
    >
      <Info className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
    </button>
  );

  if (isTouch) {
    return (
      <Popover>
        <PopoverTrigger asChild>{Btn}</PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          className={cn(
            'max-w-[260px] text-xs leading-relaxed z-[130] shadow-2xl',
            'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))]',
          )}
        >
          {children}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{Btn}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className='max-w-[320px] text-xs leading-relaxed z-[130]'
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
