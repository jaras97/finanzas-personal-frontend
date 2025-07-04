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

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
};

type Account = { id: string; name: string }; // id puede ser "debt-3" para tarjetas

interface Props {
  onCreated: () => void;
}

export default function NewTransactionModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | ''>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  type SavingAccountApiResponse = {
    id: number;
    name: string;
    // opcionalmente currency, balance, etc., según tu modelo
  };

  type DebtApiResponse = {
    id: number;
    name: string;
    kind: 'credit_card' | 'loan' | string; // ajusta según tu modelo
    status: 'active' | 'closed' | string;
  };

  // Cargar cuentas y tarjetas de crédito según el tipo
  useEffect(() => {
    const fetchAccountsAndCards = async () => {
      try {
        const accountsRes = await api.get<SavingAccountApiResponse[]>(
          '/saving-accounts',
        );
        let combined: Account[] = accountsRes.data.map((acc) => ({
          id: acc.id.toString(),
          name: acc.name,
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
      } catch {
        toast.error('Error al cargar cuentas y tarjetas');
      }
    };

    if (type) {
      fetchAccountsAndCards();
    } else {
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
      try {
        const { data } = await api.get('/categories', { params: { type } });
        setCategories(data);
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    fetchCategories();
  }, [type]);

  const handleSubmit = async () => {
    if (
      !description ||
      !amount ||
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
        // ✅ Registrar compra con tarjeta de crédito correctamente
        const debtId = parseInt(accountId.replace('debt-', ''));
        await api.post(`/debts/${debtId}/purchase`, {
          amount: parseFloat(amount),
          description,
          date: date.toISOString(),
        });
      } else {
        // ✅ Registrar transacción normal
        await api.post('/transactions', {
          description,
          amount: parseFloat(amount),
          type,
          category_id: parseInt(categoryId),
          saving_account_id: parseInt(accountId),
          date: date.toISOString(),
        });
      }

      toast.success('Transacción creada correctamente');
      setOpen(false);
      setDescription('');
      setAmount('');
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

        <div className='space-y-3 mt-4'>
          <Input
            placeholder='Descripción'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            placeholder='Monto'
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Select
            value={type}
            onValueChange={(v) => setType(v as 'income' | 'expense')}
          >
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar tipo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='income'>Ingreso</SelectItem>
              <SelectItem value='expense'>Egreso</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryId}
            onValueChange={setCategoryId}
            disabled={!type || categories.length === 0}
          >
            <SelectTrigger>
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

          <Select
            value={accountId}
            onValueChange={setAccountId}
            disabled={!type || accounts.length === 0}
          >
            <SelectTrigger>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
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

          <Button onClick={handleSubmit} className='w-full mt-2'>
            Crear transacción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
