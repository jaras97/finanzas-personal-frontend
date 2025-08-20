'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Root / Group / Value */
function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot='select' {...props} />;
}
function SelectGroup(
  props: React.ComponentProps<typeof SelectPrimitive.Group>,
) {
  return <SelectPrimitive.Group data-slot='select-group' {...props} />;
}
function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>,
) {
  return <SelectPrimitive.Value data-slot='select-value' {...props} />;
}

/* Trigger (sólido por defecto) */
type TriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
  variant?: 'solid' | 'ghost';
};
function SelectTrigger({
  className,
  size = 'default',
  variant = 'solid',
  children,
  ...props
}: TriggerProps) {
  const sizeCls =
    size === 'sm' ? 'h-8 px-3 py-1.5 text-sm' : 'h-9 px-3 py-2 text-sm';

  const variantCls =
    variant === 'ghost'
      ? 'bg-transparent border border-border/70 text-foreground hover:bg-muted/50'
      : // sólido
        'bg-card text-card-foreground border border-border shadow-xs hover:shadow-sm';

  return (
    <SelectPrimitive.Trigger
      data-slot='select-trigger'
      data-size={size}
      className={cn(
        'focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'outline-none transition-[box-shadow,border-color,color] disabled:cursor-not-allowed disabled:opacity-50',
        'flex w-full items-center justify-between gap-2 rounded-md whitespace-nowrap',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        sizeCls,
        variantCls,
        className,
      )}
      {...props}
    >
      {children ?? <SelectValue />}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className='size-4 opacity-60' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/* Content (todo opaco): content + viewport + scroll buttons */
type ContentProps = React.ComponentProps<typeof SelectPrimitive.Content> & {
  position?: 'item-aligned' | 'popper';
};
function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot='select-content'
        className={cn(
          'bg-card text-card-foreground border border-border shadow-xl rounded-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-32 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          // si pasas "select-solid" desde fuera, lo respetamos y además reforzamos en CSS
          className,
        )}
        position={position}
        style={{
          backgroundColor: 'hsl(var(--card))',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
        sideOffset={6}
        {...props}
      >
        <SelectScrollUpButton className='bg-card' />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1 bg-card', // 👈 AQUÍ el fondo sólido (antes era transparent)
            position === 'popper' &&
              'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1',
          )}
          // inline style por si alguna clase externa pisa el bg
          style={{ backgroundColor: 'hsl(var(--card))' }}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton className='bg-card' />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/* Label / Item / Separator / Scroll buttons */
function SelectLabel(
  props: React.ComponentProps<typeof SelectPrimitive.Label>,
) {
  return (
    <SelectPrimitive.Label
      data-slot='select-label'
      className={cn('text-muted-foreground px-2 py-1.5 text-xs')}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(
        'relative flex w-full select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-hidden',
        'cursor-default data-disabled:pointer-events-none data-disabled:opacity-50',
        'focus:bg-accent focus:text-accent-foreground',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='absolute right-2 flex size-3.5 items-center justify-center'>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className='size-4' />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator(
  props: React.ComponentProps<typeof SelectPrimitive.Separator>,
) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px')}
      {...props}
    />
  );
}

function SelectScrollUpButton(
  props: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>,
) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot='select-scroll-up-button'
      className={cn('flex cursor-default items-center justify-center py-1')}
      {...props}
    >
      <ChevronUpIcon className='size-4' />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton(
  props: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>,
) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot='select-scroll-down-button'
      className={cn('flex cursor-default items-center justify-center py-1')}
      {...props}
    >
      <ChevronDownIcon className='size-4' />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
