'use client';

import * as React from 'react';
import {
  Fragment,
  cloneElement,
  isValidElement,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Dialog as HDialog,
  DialogPanel,
  DialogTitle as HDialogTitle,
  DialogDescription as HDialogDescription,
  Transition,
} from '@headlessui/react';
import { X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
const sizeMap: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
};

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  initialFocus?: React.RefObject<HTMLElement>;
};
const DialogCtx = React.createContext<Ctx | null>(null);
const useDlg = () => {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>.');
  return ctx;
};

export function Dialog({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  initialFocus,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialFocus?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = useState<boolean>(!!defaultOpen);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setUncontrolled(v);
    onOpenChange?.(v);
  };
  const value = useMemo(
    () => ({ open, setOpen, initialFocus }),
    [open, initialFocus],
  );
  return <DialogCtx.Provider value={value}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({
  asChild = false,
  children,
  ...rest
}: {
  asChild?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDlg();
  const onClick = (e: React.MouseEvent<any>) => {
    (rest as any).onClick?.(e);
    setOpen(true);
  };
  if (asChild && isValidElement(children))
    return cloneElement(children as any, { ...rest, onClick });
  return (
    <button type='button' {...rest} onClick={onClick}>
      {children}
    </button>
  );
}

export function DialogClose({
  asChild = false,
  children,
  ...rest
}: {
  asChild?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDlg();
  const onClick = (e: React.MouseEvent<any>) => {
    (rest as any).onClick?.(e);
    setOpen(false);
  };
  if (asChild && isValidElement(children))
    return cloneElement(children as any, { ...rest, onClick });
  return (
    <button type='button' {...rest} onClick={onClick}>
      {children}
    </button>
  );
}

export function DialogContent({
  className,
  children,
  size = 'xl',
  showCloseButton = true,
}: {
  className?: string;
  children: React.ReactNode;
  size?: DialogSize;
  showCloseButton?: boolean;
}) {
  const { open, setOpen, initialFocus } = useDlg();

  return (
    <Transition show={open} as={Fragment} appear>
      {/* Stacking context alto para que el panel NUNCA se oscurezca */}
      <HDialog
        as='div'
        className='fixed inset-0 z-[100]'
        onClose={setOpen}
        initialFocus={initialFocus?.current as any}
      >
        {/* Overlay debajo del panel */}
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-150'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-120'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 z-[100] bg-black/45' />
        </Transition.Child>

        {/* Contenedor + Panel por encima del overlay */}
        <div className='fixed inset-0 z-[110] overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-200'
              enterFrom='opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-150'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95'
            >
              <DialogPanel
                data-slot='dialog-content'
                className={cn(
                  'relative w-full rounded-2xl border shadow-2xl outline-none',
                  'max-h-[92dvh] max-w-[calc(100vw-2rem)]',
                  sizeMap[size],
                  'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]',
                  className,
                )}
              >
                {children}

                {showCloseButton && (
                  <button
                    type='button'
                    onClick={() => setOpen(false)}
                    aria-label='Cerrar'
                    className={cn(
                      'absolute right-4 top-4 rounded-xs opacity-80 transition-opacity hover:opacity-100',
                      'text-muted-foreground hover:text-foreground',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2',
                    )}
                  >
                    <XIcon className='h-4 w-4' />
                  </button>
                )}
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </HDialog>
    </Transition>
  );
}

export function DialogTitle(props: React.ComponentProps<typeof HDialogTitle>) {
  return (
    <HDialogTitle
      {...props}
      className={cn('text-lg font-semibold leading-none', props.className)}
    />
  );
}
export function DialogDescription(
  props: React.ComponentProps<typeof HDialogDescription>,
) {
  return (
    <HDialogDescription
      {...props}
      className={cn('text-sm text-muted-foreground', props.className)}
    />
  );
}
export function DialogHeader(props: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      {...props}
      className={cn(
        'flex flex-col gap-2 text-center sm:text-left',
        props.className,
      )}
    />
  );
}
export function DialogFooter(props: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      {...props}
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        props.className,
      )}
    />
  );
}
export function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
