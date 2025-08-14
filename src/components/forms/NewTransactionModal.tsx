'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { Category } from '@/types';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';

type UiAccount = { id: string; name: string };

interface Props {
  onCreated: () => void;
}

export default function NewTransactionModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState('');

  // Monto formateado + número limpio
  const [amount, setAmount] = useState('');
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined);

  const [type, setType] = useState<'income' | 'expense' | ''>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<UiAccount[]>([]);

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

  // Date → ISO al mediodía local
  const dateToIsoAtLocalNoon = (d: Date) =>
    new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      12,
      0,
      0,
    ).toISOString();

  // Cargar cuentas (solo activas) + TDC activas si es egreso
  useEffect(() => {
    const fetchAccountsAndCards = async () => {
      try {
        const accountsRes = await api.get<SavingAccountApiResponse[]>(
          '/saving-accounts',
        );
        let combined: UiAccount[] = accountsRes.data
          .filter((acc) => acc.status === 'active')
          .map((acc) => ({
            id: acc.id.toString(),
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
      }
    };

    if (type) {
      fetchAccountsAndCards();
    } else {
      setAccounts([]);
      setAccountId('');
    }
  }, [type]);

  // Cargar categorías por tipo
  useEffect(() => {
    const fetchCategories = async () => {
      if (!type) {
        setCategories([]);
        setCategoryId('');
        return;
      }
      try {
        const { data } = await api.get('/categories', {
          params: { type, status: 'active' },
        });
        const userCategories = (data as Category[]).filter((c) => !c.is_system);
        setCategories(userCategories);
        if (userCategories.length === 0) setCategoryId('');
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    fetchCategories();
  }, [type]);

  const handleSubmit = async () => {
    if (submitting) return; // guard
    if (
      !description ||
      !amountNum ||
      !type ||
      !categoryId ||
      !accountId ||
      !date
    ) {
      toast.error('Completa todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      if (accountId.startsWith('debt-')) {
        const debtId = parseInt(accountId.replace('debt-', ''));
        await api.post(`/debts/${debtId}/purchase`, {
          amount: amountNum,
          description,
          date: dateToIsoAtLocalNoon(date),
        });
      } else {
        await api.post('/transactions', {
          description,
          amount: amountNum,
          type,
          category_id: parseInt(categoryId, 10),
          saving_account_id: parseInt(accountId, 10),
          date: dateToIsoAtLocalNoon(date),
        });
      }

      toast.success('Transacción creada correctamente');
      // Reset
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
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al crear transacción',
        );
      } else {
        toast.error('Error al crear transacción');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const idDesc = 'tx-desc';
  const idAmt = 'tx-amount';
  const idType = 'tx-type';
  const idCat = 'tx-category';
  const idAcc = 'tx-account';
  const idDate = 'tx-date';

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && setOpen(o)}>
      <DialogTrigger asChild>
        <Button>+ Nueva Transacción</Button>
      </DialogTrigger>

      <DialogContent
        className={cn(
          // ancho
          'w-[min(100vw-1rem,520px)]',
          // altura adaptable a móvil/teclado + scroll interno
          'p-0', // quitamos padding aquí; lo ponemos en el contenedor interno
        )}
        // Evita auto-focus (que fuerza scroll raro en mobile al abrir teclado)
        onOpenAutoFocus={(e) => e.preventDefault()}
        // No permitir cerrar haciendo click fuera mientras enviamos
        onPointerDownOutside={(e) => submitting && e.preventDefault()}
        onEscapeKeyDown={(e) => submitting && e.preventDefault()}
      >
        {/* Contenedor scrollable interno */}
        <div
          className={cn(
            'max-h-[85dvh] sm:max-h-[80vh]',
            'overflow-y-auto overscroll-contain',
            'px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
          aria-busy={submitting}
        >
          <DialogHeader>
            <DialogTitle className='text-primary text-lg font-semibold'>
              Nueva Transacción
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4 mt-2'>
            {/* Descripción */}
            <div className='space-y-1'>
              <label htmlFor={idDesc} className='text-sm font-medium'>
                Descripción
              </label>
              <Input
                id={idDesc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Monto */}
            <div className='space-y-1'>
              <label htmlFor={idAmt} className='text-sm font-medium'>
                Monto
              </label>
              <NumericFormat
                id={idAmt}
                value={amount}
                thousandSeparator
                decimalSeparator='.'
                decimalScale={2}
                allowNegative={false}
                inputMode='decimal'
                customInput={Input}
                disabled={submitting}
                onValueChange={(values) => {
                  setAmount(values.value ?? '');
                  setAmountNum(values.floatValue);
                }}
              />
              <p className='text-xs text-muted-foreground'>
                Usa punto como separador decimal. En COP puedes omitir
                decimales.
              </p>
            </div>

            {/* Tipo */}
            <div className='space-y-1'>
              <label htmlFor={idType} className='text-sm font-medium'>
                Tipo de transacción
              </label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as 'income' | 'expense')}
                disabled={submitting}
              >
                <SelectTrigger id={idType}>
                  <SelectValue placeholder='Seleccionar tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='income'>Ingreso</SelectItem>
                  <SelectItem value='expense'>Egreso</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Si eliges <b>Egreso</b>, también podrás usar una{' '}
                <b>tarjeta de crédito</b> activa.
              </p>
            </div>

            {/* Categoría */}
            <div className='space-y-1'>
              <label htmlFor={idCat} className='text-sm font-medium'>
                Categoría
              </label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={submitting || !type || categories.length === 0}
              >
                <SelectTrigger id={idCat}>
                  <SelectValue
                    placeholder={
                      categories.length
                        ? 'Seleccionar categoría'
                        : 'No hay categorías disponibles'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!type && (
                <p className='text-xs text-muted-foreground'>
                  Selecciona primero el <b>tipo</b> para ver las categorías
                  disponibles.
                </p>
              )}
            </div>

            {/* Cuenta o tarjeta */}
            <div className='space-y-1'>
              <label htmlFor={idAcc} className='text-sm font-medium'>
                Cuenta o tarjeta
              </label>
              <Select
                value={accountId}
                onValueChange={setAccountId}
                disabled={submitting || !type || accounts.length === 0}
              >
                <SelectTrigger id={idAcc}>
                  <SelectValue
                    placeholder={
                      accounts.length
                        ? 'Seleccionar cuenta o tarjeta'
                        : 'No hay cuentas disponibles'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Solo se listan <b>cuentas activas</b>. Para egresos, verás
                también <b>tarjetas de crédito</b> activas.
              </p>
            </div>

            {/* Fecha */}
            <div className='space-y-1'>
              <label htmlFor={idDate} className='text-sm font-medium'>
                Fecha
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id={idDate}
                    variant='outline'
                    className={cn(
                      'justify-start text-left font-normal w-full',
                      !date && 'text-muted-foreground',
                    )}
                    disabled={submitting}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {date ? (
                      format(date, 'dd MMM yyyy')
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align='start'
                  className='p-0 bg-popover text-popover-foreground border border-border rounded-md'
                >
                  <DayPicker
                    mode='single'
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className='text-xs text-muted-foreground'>
                Guardamos la fecha a <b>mediodía local</b> para evitar cambios
                por husos horarios.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              className='w-full mt-2'
              disabled={submitting}
              aria-disabled={submitting}
            >
              {submitting ? 'Creando…' : 'Crear transacción'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
