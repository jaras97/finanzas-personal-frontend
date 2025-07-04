'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { TransactionType, TransactionWithCategoryRead } from '@/types';
import axios from 'axios';

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
};

type Account = { id: number; name: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithCategoryRead;
  onUpdated: () => void;
}

export default function EditTransactionModal({
  open,
  onOpenChange,
  transaction,
  onUpdated,
}: Props) {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type] = useState<TransactionType>(transaction.type);
  const [categoryId, setCategoryId] = useState<string>(
    transaction.category ? transaction.category.id.toString() : '',
  );
  const [accountId, setAccountId] = useState<string>(
    transaction.saving_account_id
      ? transaction.saving_account_id.toString()
      : '',
  );
  const [date, setDate] = useState<Date>(new Date(transaction.date));

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories', { params: { type } });
        setCategories(data);
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    fetchCategories();
  }, [type]);

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

  const handleSubmit = async () => {
    if (!description || !amount || !categoryId || !accountId || !date) {
      toast.error('Completa todos los campos');
      return;
    }
    try {
      await api.put(`/transactions/${transaction.id}`, {
        description,
        amount: parseFloat(amount),
        type,
        category_id: parseInt(categoryId),
        saving_account_id: parseInt(accountId),
        date: date.toISOString(),
      });
      toast.success('Transacción actualizada');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al actualizar transacción',
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground max-w-md'>
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
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

          <Select value={categoryId} onValueChange={setCategoryId}>
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
              className='p-0 bg-card text-foreground'
            >
              <DayPicker
                mode='single'
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleSubmit} className='w-full'>
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
