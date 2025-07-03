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

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
};
type Account = { id: number; name: string };

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

  // Cargar cuentas al inicio
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data } = await api.get('/saving-accounts');
        setAccounts(data);
      } catch {
        toast.error('Error al cargar cuentas');
      }
    };
    fetchAccounts();
  }, []);

  // Cargar categorías dinámicamente según tipo
  useEffect(() => {
    const fetchCategories = async () => {
      if (!type) {
        setCategories([]); // limpiar si el usuario deselecciona
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
      await api.post('/transactions', {
        description,
        amount: parseFloat(amount),
        type,
        category_id: parseInt(categoryId),
        saving_account_id: parseInt(accountId),
        date: date.toISOString(),
      });
      toast.success('Transacción creada');
      setOpen(false);
      setDescription('');
      setAmount('');
      setType('');
      setCategoryId('');
      setAccountId('');
      setDate(new Date());
      onCreated();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al crear transacción',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva Transacción</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
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

          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar cuenta' />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id.toString()}>
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
                  'justify-start text-left font-normal',
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
            <PopoverContent align='start' className='p-0'>
              <DayPicker
                mode='single'
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleSubmit}>Crear transacción</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
