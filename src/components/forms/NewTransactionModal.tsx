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

type UiAccount = { id: string; name: string }; // lo que usa el selector

interface Props {
  onCreated: () => void;
}

export default function NewTransactionModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');

  // Monto formateado + número limpio para cálculos/envío
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

  // helper: llevar Date a ISO en mediodía local (evita saltos de día por timezone)
  const dateToIsoAtLocalNoon = (d: Date) =>
    new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      12,
      0,
      0,
    ).toISOString();

  // Cargar cuentas (solo activas) y tarjetas de crédito activas (para egresos)
  useEffect(() => {
    const fetchAccountsAndCards = async () => {
      try {
        // Cuentas de ahorro
        const accountsRes = await api.get<SavingAccountApiResponse[]>(
          '/saving-accounts',
        );

        // ✅ Filtrar cuentas cerradas y mostrar saldo + moneda al frente
        let combined: UiAccount[] = accountsRes.data
          .filter((acc) => acc.status === 'active')
          .map((acc) => ({
            id: acc.id.toString(),
            // "(saldo moneda) nombre"
            name: `(${formatCurrency(acc.balance)} ${acc.currency}) ${
              acc.name
            }`,
          }));

        // Tarjetas de crédito (solo para egresos)
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
        // si la cuenta seleccionada ya no existe, limpiamos
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
        const userCategories = data.filter((c: Category) => !c.is_system);
        setCategories(userCategories);
        if (userCategories.length === 0) setCategoryId('');
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    fetchCategories();
  }, [type]);

  const handleSubmit = async () => {
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

    try {
      if (accountId.startsWith('debt-')) {
        // ✅ Registrar compra con tarjeta de crédito
        const debtId = parseInt(accountId.replace('debt-', ''));
        await api.post(`/debts/${debtId}/purchase`, {
          amount: amountNum,
          description,
          date: dateToIsoAtLocalNoon(date),
        });
      } else {
        // ✅ Registrar transacción normal sobre cuenta ACTIVA
        await api.post('/transactions', {
          description,
          amount: amountNum,
          type,
          category_id: parseInt(categoryId),
          saving_account_id: parseInt(accountId),
          date: dateToIsoAtLocalNoon(date),
        });
      }

      toast.success('Transacción creada correctamente');
      setOpen(false);
      setDescription('');
      setAmount('');
      setAmountNum(undefined);
      setType('');
      setCategoryId('');
      setAccountId('');
      setDate(new Date());
      onCreated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al crear transacción',
        );
      }
    }
  };

  const idDesc = 'tx-desc';
  const idAmt = 'tx-amount';
  const idType = 'tx-type';
  const idCat = 'tx-category';
  const idAcc = 'tx-account';
  const idDate = 'tx-date';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva Transacción</Button>
      </DialogTrigger>
      <DialogContent className='bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full border border-border'>
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
              decimalScale={2} // default 2 decimales para general
              allowNegative={false}
              inputMode='decimal'
              customInput={Input}
              onValueChange={(values) => {
                setAmount(values.value ?? '');
                setAmountNum(values.floatValue);
              }}
            />
            <p className='text-xs text-muted-foreground'>
              Usa punto como separador decimal. Para COP podrías no usar
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
              disabled={!type || categories.length === 0}
            >
              <SelectTrigger id={idCat}>
                <SelectValue placeholder='Seleccionar categoría' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cuenta o tarjeta */}
          <div className='space-y-1'>
            <label htmlFor={idAcc} className='text-sm font-medium'>
              Cuenta o tarjeta
            </label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              disabled={!type || accounts.length === 0}
            >
              <SelectTrigger id={idAcc}>
                <SelectValue placeholder='Seleccionar cuenta o tarjeta' />
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
              Solo se listan <b>cuentas activas</b>. Para egresos, verás también{' '}
              <b>tarjetas de crédito</b> activas.
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
              Guardamos la fecha a <b>mediodía local</b> para evitar cambios por
              husos horarios.
            </p>
          </div>

          <Button onClick={handleSubmit} className='w-full mt-2'>
            Crear transacción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
