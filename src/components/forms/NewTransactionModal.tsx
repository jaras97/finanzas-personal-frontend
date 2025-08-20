'use client';

import { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { Category } from '@/types';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';

type UiAccount = { id: string; name: string; currency?: 'COP' | 'USD' | 'EUR' };

interface Props {
  onCreated: () => void;
}

export default function NewTransactionModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState('');
  const descRef = useRef<HTMLInputElement | null>(null);

  const [amount, setAmount] = useState('');
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined);

  const [type, setType] = useState<'income' | 'expense' | ''>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<UiAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  type SavingAccountApiResponse = {
    id: number;
    name: string;
    balance: number;
    currency: 'COP' | 'USD' | 'EUR';
    status: 'active' | 'closed';
  };
  type DebtApiResponse = {
    id: number;
    name: string;
    kind: 'credit_card' | 'loan' | string;
    status: 'active' | 'closed' | string;
  };

  const dateToIsoAtLocalNoon = (d: Date) =>
    new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      12,
      0,
      0,
    ).toISOString();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => descRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const fetchAccountsAndCards = async () => {
      setLoadingAccounts(true);
      try {
        const accountsRes = await api.get<SavingAccountApiResponse[]>(
          '/saving-accounts',
        );
        let combined: UiAccount[] = accountsRes.data
          .filter((acc) => acc.status === 'active')
          .map((acc) => ({
            id: String(acc.id),
            currency: acc.currency,
            name: `(${formatCurrency(acc.balance)} ${acc.currency}) ${
              acc.name
            }`,
          }));

        if (type === 'expense') {
          const cardsRes = await api.get<DebtApiResponse[]>('/debts');
          const cards = cardsRes.data
            .filter((d) => d.kind === 'credit_card' && d.status === 'active')
            .map((card) => ({
              id: `debt-${card.id}`,
              name: `💳 ${card.name}`,
            }));
          combined = [...combined, ...cards];
        }

        setAccounts(combined);
        setAccountId((prev) =>
          combined.some((a) => a.id === prev) ? prev : '',
        );
      } catch {
        toast.error('Error al cargar cuentas y tarjetas');
        setAccounts([]);
        setAccountId('');
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (type) fetchAccountsAndCards();
    else {
      setAccounts([]);
      setAccountId('');
    }
  }, [type]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!type) {
        setCategories([]);
        setCategoryId('');
        return;
      }
      setLoadingCategories(true);
      try {
        const { data } = await api.get('/categories', {
          params: { type, status: 'active' },
        });
        const userCategories = (data as Category[]).filter((c) => !c.is_system);
        setCategories(userCategories);
        if (userCategories.length === 0) setCategoryId('');
      } catch {
        toast.error('Error al cargar categorías');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [type]);

  const selectedCurrency = useMemo(
    () => accounts.find((a) => a.id === accountId)?.currency ?? 'COP',
    [accounts, accountId],
  );
  const decimalScale = selectedCurrency === 'COP' ? 0 : 2;
  const isCreditCardPurchase =
    accountId.startsWith('debt-') && type === 'expense';

  const canSubmit =
    !!description &&
    !!amountNum &&
    !!type &&
    !!categoryId &&
    !!accountId &&
    !!date &&
    !submitting;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return toast.error('Completa todos los campos');

    setSubmitting(true);
    try {
      if (accountId.startsWith('debt-')) {
        const debtId = parseInt(accountId.replace('debt-', ''), 10);
        await api.post(`/debts/${debtId}/purchase`, {
          amount: amountNum,
          description,
          date: dateToIsoAtLocalNoon(date!),
        });
      } else {
        await api.post('/transactions', {
          description,
          amount: amountNum,
          type,
          category_id: parseInt(categoryId, 10),
          saving_account_id: parseInt(accountId, 10),
          date: dateToIsoAtLocalNoon(date!),
        });
      }

      toast.success('Transacción creada correctamente');
      setDescription('');
      setAmount('');
      setAmountNum(undefined);
      setType('');
      setCategoryId('');
      setAccountId('');
      setDate(new Date());
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'Error al crear transacción'
          : 'Error al crear transacción',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // tono
  const tone: 'accent' | 'emerald' | 'rose' =
    type === 'expense' ? 'rose' : type === 'income' ? 'emerald' : 'accent';

  const panelTint =
    tone === 'emerald'
      ? 'bg-emerald-50'
      : tone === 'rose'
      ? 'bg-rose-50'
      : 'bg-[hsl(var(--accent))]';

  // header/footer (un paso más oscuro que el content)
  const headerFooterTint =
    tone === 'emerald'
      ? 'bg-emerald-100'
      : tone === 'rose'
      ? 'bg-rose-100'
      : 'bg-[hsl(var(--muted))]';

  const ctaClass =
    type === 'income'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300'
      : type === 'expense'
      ? 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';

  const idDesc = 'tx-desc',
    idAmt = 'tx-amount',
    idCat = 'tx-category',
    idAcc = 'tx-account';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !submitting && setOpen(o)}
      initialFocus={descRef as any}
    >
      <DialogTrigger asChild>
        <Button className='bg-emerald-600 text-white hover:bg-emerald-700'>
          + Nueva Transacción
        </Button>
      </DialogTrigger>

      <DialogContent
        size='xl'
        className={cn(
          // tinte base
          panelTint,
          // grid y altura
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          // ✅ solucion solapamiento de bordes
          'rounded-2xl overflow-hidden',
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            {isCreditCardPurchase
              ? 'Nueva compra con tarjeta'
              : 'Nueva Transacción'}
          </DialogTitle>
        </header>

        {/* BODY (scroll) */}
        <section className='overflow-y-auto overscroll-contain px-4 py-4'>
          <form
            onSubmit={handleSubmit}
            className='space-y-5'
            aria-busy={submitting}
          >
            {/* Descripción */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDesc} className='text-sm font-medium'>
                  Descripción
                </label>
                {/* ↑ z-fix para Overlay del Dialog */}
                <InfoHint side='top' />
              </div>
              <Input
                id={idDesc}
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                autoComplete='off'
                placeholder='Ej. Pago suscripción / Venta producto'
                className='bg-white'
              />
            </div>

            {/* Grilla de campos */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Monto */}
              <div className='flex flex-col justify-end h-full gap-2'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <label htmlFor={idAmt} className='text-sm font-medium'>
                      Monto
                    </label>
                    <InfoHint side='top'>
                      {selectedCurrency === 'COP'
                        ? 'En COP normalmente no se usan decimales.'
                        : 'Puedes ingresar decimales.'}
                    </InfoHint>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {selectedCurrency}
                  </span>
                </div>
                <NumericFormat
                  id={idAmt}
                  value={amount}
                  thousandSeparator
                  decimalSeparator='.'
                  decimalScale={decimalScale}
                  allowNegative={false}
                  inputMode='decimal'
                  customInput={Input}
                  disabled={submitting}
                  onValueChange={(v) => {
                    setAmount(v.value ?? '');
                    setAmountNum(v.floatValue);
                  }}
                  placeholder={selectedCurrency === 'COP' ? '0' : '0.00'}
                  className='bg-white'
                />
              </div>

              {/* Fecha */}
              <div className='space-y-1'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Fecha</span>
                    <InfoHint side='top'>
                      Guardamos la fecha a mediodía local.
                    </InfoHint>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setDate(new Date())}
                    disabled={submitting}
                    className='h-8'
                  >
                    Hoy
                  </Button>
                </div>

                {/* ✅ altura igual al input: h-9 */}
                <DatePicker
                  value={date}
                  onChange={setDate}
                  disabled={submitting}
                  buttonClassName='bg-white h-9'
                />
              </div>

              {/* Tipo */}
              <div className='md:col-span-2 space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>Tipo</span>
                  <InfoHint side='top'>
                    Ingreso (verde) o Egreso (rojo). En egresos puedes usar TDC.
                  </InfoHint>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    type='button'
                    onClick={() => setType('income')}
                    disabled={submitting}
                    className={cn(
                      'border',
                      type === 'income'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700',
                    )}
                  >
                    Ingreso
                  </Button>
                  <Button
                    type='button'
                    onClick={() => setType('expense')}
                    disabled={submitting}
                    className={cn(
                      'border',
                      type === 'expense'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-white hover:bg-rose-50 border-rose-200 text-rose-700',
                    )}
                  >
                    Egreso
                  </Button>
                </div>
              </div>

              {/* Categoría */}
              <div className='md:col-span-2 space-y-1'>
                <div className='flex items-center gap-2'>
                  <label htmlFor={idCat} className='text-sm font-medium'>
                    Categoría
                  </label>
                  <InfoHint side='top'>
                    Solo categorías activas del tipo seleccionado.
                  </InfoHint>
                </div>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  disabled={
                    submitting ||
                    !type ||
                    loadingCategories ||
                    categories.length === 0
                  }
                >
                  <SelectTrigger id={idCat} className='truncate bg-white'>
                    <SelectValue
                      placeholder={
                        !type
                          ? 'Selecciona primero el tipo'
                          : loadingCategories
                          ? 'Cargando…'
                          : categories.length
                          ? 'Seleccionar categoría'
                          : 'No hay categorías disponibles'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className='z-[130] select-solid max-h-[50vh] min-w-[--radix-select-trigger-width]'>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cuenta o tarjeta */}
              <div className='md:col-span-2 space-y-1'>
                <div className='flex items-center gap-2'>
                  <label htmlFor={idAcc} className='text-sm font-medium'>
                    Cuenta o tarjeta
                  </label>
                  <InfoHint side='top'>
                    Cuentas activas; en egresos también TDC.
                  </InfoHint>
                </div>
                <Select
                  value={accountId}
                  onValueChange={setAccountId}
                  disabled={
                    submitting ||
                    !type ||
                    loadingAccounts ||
                    accounts.length === 0
                  }
                >
                  <SelectTrigger id={idAcc} className='truncate bg-white'>
                    <SelectValue
                      placeholder={
                        !type
                          ? 'Selecciona primero el tipo'
                          : loadingAccounts
                          ? 'Cargando…'
                          : accounts.length
                          ? 'Seleccionar cuenta o tarjeta'
                          : 'No hay cuentas disponibles'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className='z-[130] select-solid max-h-[50vh] min-w-[--radix-select-trigger-width]'>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </section>

        {/* FOOTER */}
        <footer className={cn('border-t', headerFooterTint)}>
          <div className='px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            {/* ⬅️ Cancelar con fondo para contraste */}
            <DialogClose asChild>
              <Button
                className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
                disabled={submitting}
              >
                Cancelar
              </Button>
            </DialogClose>
            {/* CTA principal por tipo */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className={cn('sm:min-w-[160px]', ctaClass)}
            >
              {submitting
                ? 'Creando…'
                : isCreditCardPurchase
                ? 'Registrar compra'
                : 'Crear transacción'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
