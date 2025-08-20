'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewDebtModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState(''); // opcional
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined); // ← ahora Date
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [kind, setKind] = useState<'loan' | 'credit_card'>('loan');
  const [saving, setSaving] = useState(false);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  // Date → "YYYY-MM-DD" (local) para compatibilidad backend
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const resetForm = () => {
    setName('');
    setTotalAmount('');
    setInterestRate('');
    setDueDate(undefined);
    setCurrency('COP');
    setKind('loan');
  };

  // Evita pasar objetos al toast cuando el backend responde 422
  function extractApiError(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const data: any = err.response?.data;
      const detail =
        data?.detail ?? data?.message ?? data?.error ?? data?.errors;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const msgs = detail.map((e: any) => e?.msg).filter(Boolean);
        if (msgs.length) return msgs.join(' • ');
      }
      try {
        return JSON.stringify(detail ?? data ?? err);
      } catch {
        return (err as any)?.message || 'Error inesperado';
      }
    }
    return 'Error inesperado';
  }

  const handleSubmit = async () => {
    if (saving) return;

    const cleanedName = name.trim();
    if (!cleanedName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const amount = parseNumber(totalAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto válido (≥ 0)');
      return;
    }

    const rate = interestRate.trim() === '' ? 0 : parseNumber(interestRate);
    if (isNaN(rate) || rate < 0) {
      toast.error('La tasa de interés debe ser un número ≥ 0');
      return;
    }

    const payload = {
      name: cleanedName,
      total_amount: amount,
      interest_rate: rate, // informativo
      due_date: dueDate ? toLocalYMD(dueDate) : null, // ← string o null
      currency,
      kind,
    };

    setSaving(true);
    try {
      await api.post('/debts', payload);
      toast.success('Deuda creada correctamente');
      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  // IDs accesibles
  const idName = 'new-debt-name';
  const idAmount = 'new-debt-amount';
  const idRate = 'new-debt-rate';
  const idCurr = 'new-debt-currency';
  const idKind = 'new-debt-kind';

  // 🎨 Tintes del panel
  const panelTint = 'bg-[hsl(var(--accent))]';
  const headerFooterTint = 'bg-[hsl(var(--muted))]';
  const ctaClass = 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        size='xl'
        className={cn(
          // layout: header | body scroll | footer
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          // tamaño / borde / evitar solapamientos
          'w-[min(100vw-1rem,560px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Nueva Deuda
          </DialogTitle>
        </header>

        {/* BODY (solo aquí hay scroll) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={saving}
        >
          <div className='space-y-4'>
            {/* Nombre */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idName} className='text-sm font-medium'>
                  Nombre
                </label>
                <InfoHint side='top'>
                  Ej: “Préstamo carro” o “Visa Banco X”.
                </InfoHint>
              </div>
              <Input
                id={idName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className='bg-white'
              />
            </div>

            {/* Monto total */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto total
                </label>
                <InfoHint side='top'>
                  Saldo actual de la deuda. Puedes iniciar en <b>0</b>.
                </InfoHint>
              </div>
              <NumericFormat
                id={idAmount}
                value={totalAmount}
                onValueChange={({ value }) => setTotalAmount(value)}
                thousandSeparator='.'
                decimalSeparator=','
                allowNegative={false}
                decimalScale={2}
                inputMode='decimal'
                customInput={Input}
                disabled={saving}
                className='bg-white'
              />
            </div>

            {/* Tasa de interés (opcional) */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idRate} className='text-sm font-medium'>
                  Tasa de interés (%)
                </label>
                <InfoHint side='top'>
                  Campo <b>opcional</b> e <b>informativo</b>. No calcula
                  intereses automáticos. Para cargos/recargos usa{' '}
                  <b>Agregar Cargo</b>.
                </InfoHint>
              </div>
              <NumericFormat
                id={idRate}
                value={interestRate}
                onValueChange={({ value }) => setInterestRate(value)}
                decimalSeparator=','
                allowNegative={false}
                decimalScale={2}
                inputMode='decimal'
                customInput={Input}
                disabled={saving}
                className='bg-white'
              />
            </div>

            {/* Fecha de vencimiento (con DatePicker) */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    Fecha de vencimiento
                  </span>
                  <InfoHint side='top'>
                    Opcional. Úsala como referencia/recordatorio.
                  </InfoHint>
                </div>
                {/* Limpiar/Hoy ya vienen en el Popover del DatePicker */}
              </div>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                disabled={saving}
                className='z-[140]'
                buttonClassName='bg-white h-9'
              />
            </div>

            {/* Moneda */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idCurr} className='text-sm font-medium'>
                  Moneda
                </label>
                <InfoHint side='top'>
                  Determina qué cuentas podrás usar al pagar esta deuda.
                </InfoHint>
              </div>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as 'COP' | 'USD' | 'EUR')}
                disabled={saving}
              >
                <SelectTrigger id={idCurr} className='bg-white'>
                  <SelectValue placeholder='Selecciona la moneda' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  <SelectItem value='COP'>COP — Peso Colombiano</SelectItem>
                  <SelectItem value='USD'>USD — Dólar</SelectItem>
                  <SelectItem value='EUR'>EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de deuda */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idKind} className='text-sm font-medium'>
                  Tipo de deuda
                </label>
                <InfoHint side='top'>
                  Las tarjetas no se cierran automáticamente al llegar a 0;
                  puedes seguir usándolas.
                </InfoHint>
              </div>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as 'loan' | 'credit_card')}
                disabled={saving}
              >
                <SelectTrigger id={idKind} className='bg-white'>
                  <SelectValue placeholder='Selecciona el tipo' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  <SelectItem value='loan'>Préstamo</SelectItem>
                  <SelectItem value='credit_card'>
                    Tarjeta de Crédito
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className={cn('border-t px-4 py-3', headerFooterTint)}>
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
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
              {saving ? 'Creando…' : 'Crear Deuda'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
