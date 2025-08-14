'use client';

import { useState } from 'react';
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';

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
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [saving, setSaving] = useState(false);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  const reset = () => {
    setName('');
    setBalance('');
    setType('cash');
    setCurrency('COP');
  };

  const handleSubmit = async () => {
    const cleanedName = name.trim();
    if (!cleanedName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const amount = parseNumber(balance);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un saldo inicial válido (≥ 0)');
      return;
    }

    if (!type || !currency) {
      toast.error('Selecciona el tipo de cuenta y la moneda');
      return;
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

  // IDs para accesibilidad
  const idName = 'new-sa-name';
  const idBalance = 'new-sa-balance';
  const idType = 'new-sa-type';
  const idCurrency = 'new-sa-currency';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Nombre */}
          <div className='space-y-1'>
            <label htmlFor={idName} className='text-sm font-medium'>
              Nombre de la cuenta
            </label>
            <Input
              id={idName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className='space-y-1'>
            <label htmlFor={idBalance} className='text-sm font-medium'>
              Saldo inicial
            </label>

            <NumericFormat
              id={idBalance}
              value={balance}
              onValueChange={({ value }) => setBalance(value)} // guarda el valor crudo (sin separadores, con punto decimal)
              thousandSeparator='.'
              decimalSeparator=','
              allowNegative={false}
              decimalScale={2}
              inputMode='decimal'
              customInput={Input} // usa tu mismo componente Input para conservar estilos
              disabled={saving}
            />

            <p className='text-xs text-muted-foreground'>
              Puedes comenzar en <b>0</b>. Más adelante el saldo se ajusta con{' '}
              <b>depósitos</b> y <b>retiros</b>.
            </p>
          </div>

          {/* Tipo de cuenta */}
          <div className='space-y-1'>
            <label htmlFor={idType} className='text-sm font-medium'>
              Tipo de cuenta
            </label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as 'cash' | 'bank' | 'investment')
              }
              disabled={saving}
            >
              <SelectTrigger id={idType}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='cash'>Efectivo</SelectItem>
                <SelectItem value='bank'>Banco</SelectItem>
                <SelectItem value='investment'>Inversión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Moneda */}
          <div className='space-y-1'>
            <label htmlFor={idCurrency} className='text-sm font-medium'>
              Moneda
            </label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as 'COP' | 'USD' | 'EUR')}
              disabled={saving}
            >
              <SelectTrigger id={idCurrency}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='COP'>COP — Peso colombiano</SelectItem>
                <SelectItem value='USD'>USD — Dólar</SelectItem>
                <SelectItem value='EUR'>EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              La moneda define cómo se mostrará el saldo de esta cuenta.
            </p>
          </div>

          <Button onClick={handleSubmit} className='w-full' disabled={saving}>
            {saving ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
