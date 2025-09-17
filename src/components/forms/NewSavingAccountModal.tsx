'use client';

import { RefObject, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';
import { currencyType } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewSavingAccountModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'investment'>('cash');
  const [currency, setCurrency] = useState<currencyType>('COP');
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  const parseNumber = (v: string) => {
    // NumericFormat nos entrega "value" normalizado con punto decimal.
    const n = parseFloat(v || '');
    return Number.isFinite(n) ? n : NaN;
    // Si prefieres admitir coma manual:  parseFloat((v || '').replace(',', '.'))
  };

  const reset = () => {
    setName('');
    setBalance('');
    setType('cash');
    setCurrency('COP');
  };

  const handleSubmit = async () => {
    if (saving) return;
    const cleanedName = name.trim();
    if (!cleanedName) return toast.error('El nombre es obligatorio');

    const amount = parseNumber(balance);
    if (isNaN(amount) || amount < 0) {
      return toast.error('Ingresa un saldo inicial válido (≥ 0)');
    }

    if (!type || !currency) {
      return toast.error('Selecciona el tipo de cuenta y la moneda');
    }

    setSaving(true);
    try {
      await api.post('/saving-accounts', {
        name: cleanedName,
        balance: amount,
        type,
        currency,
      });
      toast.success('Cuenta creada correctamente');
      onCreated();
      onOpenChange(false);
      reset();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al crear cuenta');
      } else {
        toast.error('Error inesperado al crear cuenta');
      }
    } finally {
      setSaving(false);
    }
  };

  // IDs accesibles
  const idName = 'new-sa-name';
  const idBalance = 'new-sa-balance';
  const idType = 'new-sa-type';
  const idCurrency = 'new-sa-currency';

  // Tinte “neutral/accent” para modales no tipados
  const panelTint = 'bg-[hsl(var(--accent))]';
  const headerFooterTint = 'bg-[hsl(var(--muted))]';
  const ctaClass =
    'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-[hsl(var(--ring))]';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      initialFocus={nameRef as RefObject<HTMLElement>}
    >
      <DialogContent
        className={cn(
          // layout: header | body | footer
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,560px)]',
          // esquinas perfectas sin “solapamiento”
          'rounded-2xl overflow-hidden',
          // tinte base
          panelTint,
        )}
        // mientras guarda, evita cierres accidentales por teclado/click fuera (ya controlamos con onOpenChange)
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='flex items-center gap-2 text-base sm:text-lg font-semibold'>
            Nueva cuenta
            <InfoHint side='top'>
              Crea una cuenta para registrar <b>depósitos</b>, <b>retiros</b> y
              movimientos. Podrás editarla luego.
            </InfoHint>
          </DialogTitle>
        </header>

        {/* BODY (solo aquí hay scroll) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4 space-y-4'
          aria-busy={saving}
        >
          {/* Nombre */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label htmlFor={idName} className='text-sm font-medium'>
                Nombre de la cuenta
              </label>
              <InfoHint side='top'>
                Cómo verás esta cuenta en listas y transferencias (ej.
                “Billetera”, “Ahorros Bancolombia”).
              </InfoHint>
            </div>
            <Input
              id={idName}
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className='bg-white'
            />
          </div>

          {/* Saldo inicial */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label htmlFor={idBalance} className='text-sm font-medium'>
                Saldo inicial
              </label>
              <InfoHint side='top'>
                Puedes empezar en <b>0</b>. Más adelante el saldo se ajusta con
                <b> depósitos</b> o <b>retiros</b>.
              </InfoHint>
            </div>
            <NumericFormat
              id={idBalance}
              value={balance}
              onValueChange={({ value }) => setBalance(value)} // valor crudo normalizado
              thousandSeparator='.'
              decimalSeparator=','
              allowNegative={false}
              decimalScale={2}
              inputMode='decimal'
              customInput={Input as any}
              disabled={saving}
              className='bg-white h-9'
            />
          </div>

          {/* Tipo de cuenta */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label htmlFor={idType} className='text-sm font-medium'>
                Tipo de cuenta
              </label>
              <InfoHint side='top'>
                Solo afecta la <b>clasificación visual</b> e iconografía
                (efectivo, banco o inversión).
              </InfoHint>
            </div>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as 'cash' | 'bank' | 'investment')
              }
              disabled={saving}
            >
              <SelectTrigger id={idType} className='bg-white'>
                <SelectValue placeholder='Selecciona el tipo' />
              </SelectTrigger>
              <SelectContent className='select-solid z-[140]'>
                <SelectItem value='cash'>Efectivo</SelectItem>
                <SelectItem value='bank'>Banco</SelectItem>
                <SelectItem value='investment'>Inversión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Moneda */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label htmlFor={idCurrency} className='text-sm font-medium'>
                Moneda
              </label>
              <InfoHint side='top'>
                Define la <b>moneda nativa</b> en la que verás el saldo y
                registrarás movimientos.
              </InfoHint>
            </div>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as currencyType)}
              disabled={saving}
            >
              <SelectTrigger id={idCurrency} className='bg-white'>
                <SelectValue placeholder='Selecciona la moneda' />
              </SelectTrigger>
              <SelectContent className='select-solid z-[140]'>
                <SelectItem value='COP'>COP — Peso colombiano</SelectItem>
                <SelectItem value='USD'>USD — Dólar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* FOOTER */}
        <DialogFooter className={cn('border-t px-4 py-3', headerFooterTint)}>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
              disabled={saving}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            aria-disabled={saving}
            className={cn('sm:min-w-[160px]', ctaClass)}
          >
            {saving ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
