'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { SavingAccount } from '@/types';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SavingAccount[];
  onTransferred: () => void;
}

export default function TransferBetweenAccountsModal({
  open,
  onOpenChange,
  accounts,
  onTransferred,
}: Props) {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  // estados “formateados” (texto) y numéricos (para cálculos)
  const [amount, setAmount] = useState(''); // UI
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined); // número limpio

  const [fee, setFee] = useState('');
  const [feeNum, setFeeNum] = useState<number | undefined>(undefined);

  const [description, setDescription] = useState('');

  const [exchangeRate, setExchangeRate] = useState(''); // UI
  const [rateNum, setRateNum] = useState<number | undefined>(undefined); // número limpio

  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  // Solo cuentas ACTIVAS
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === 'active'),
    [accounts],
  );
  // Evitar misma cuenta en ambos selects
  const fromList = useMemo(
    () => activeAccounts.filter((a) => a.id.toString() !== toAccountId),
    [activeAccounts, toAccountId],
  );
  const toList = useMemo(
    () => activeAccounts.filter((a) => a.id.toString() !== fromAccountId),
    [activeAccounts, fromAccountId],
  );

  const fromAccount = useMemo(
    () => activeAccounts.find((a) => a.id.toString() === fromAccountId),
    [activeAccounts, fromAccountId],
  );
  const toAccount = useMemo(
    () => activeAccounts.find((a) => a.id.toString() === toAccountId),
    [activeAccounts, toAccountId],
  );

  const requiresConversion =
    !!fromAccount && !!toAccount && fromAccount.currency !== toAccount.currency;

  // Escalas decimales (COP usualmente 0; USD/EUR 2; tasa con más precisión)
  const amountDecimalScale = fromAccount?.currency === 'COP' ? 0 : 2;
  const feeDecimalScale = amountDecimalScale;
  const rateDecimalScale = 6;

  const convertedAmount =
    requiresConversion && (amountNum ?? 0) > 0 && (rateNum ?? 0) > 0
      ? (amountNum as number) * (rateNum as number)
      : null;

  // Prefill de tasa desde backend (solo si hay conversión y no hay valor escrito)
  useEffect(() => {
    const shouldPrefill =
      requiresConversion && fromAccount && toAccount && !exchangeRate;
    if (!shouldPrefill) return;

    const prefill = async () => {
      try {
        setPrefilling(true);
        const { data } = await api.get('/fx/rate', {
          params: { from: fromAccount.currency, to: toAccount.currency },
        });
        if (data?.rate) {
          setExchangeRate(String(data.rate)); // UI
          setRateNum(Number(data.rate)); // num
        }
      } catch {
        /* silencioso */
      } finally {
        setPrefilling(false);
      }
    };
    prefill();
  }, [
    requiresConversion,
    fromAccount?.currency,
    fromAccount,
    toAccount,
    toAccount?.currency,
    exchangeRate,
  ]);

  const handleRefreshRate = async () => {
    if (!fromAccount || !toAccount) return;
    try {
      setPrefilling(true);
      const { data } = await api.get('/fx/rate', {
        params: { from: fromAccount.currency, to: toAccount.currency },
      });
      if (data?.rate) {
        setExchangeRate(String(data.rate));
        setRateNum(Number(data.rate));
        toast.success('Tasa actualizada (sugerida)');
      } else {
        toast.error('No fue posible obtener una tasa sugerida');
      }
    } catch {
      toast.error('No fue posible obtener la tasa sugerida');
    } finally {
      setPrefilling(false);
    }
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId) {
      toast.error('Selecciona cuenta origen y destino');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('El origen y el destino deben ser diferentes');
      return;
    }
    if (!fromAccount || !toAccount) {
      toast.error('Cuentas inválidas');
      return;
    }

    const amt = amountNum ?? NaN;
    const feeVal = feeNum ?? 0;
    const rateVal = rateNum ?? NaN;

    if (isNaN(amt) || amt <= 0) {
      toast.error('Ingresa un monto válido (> 0)');
      return;
    }
    if (isNaN(feeVal) || feeVal < 0) {
      toast.error('Ingresa una comisión válida (≥ 0)');
      return;
    }
    if (amt + feeVal > fromAccount.balance) {
      toast.error(
        'Fondos insuficientes en la cuenta origen (considera la comisión).',
      );
      return;
    }
    if (requiresConversion && (isNaN(rateVal) || rateVal <= 0)) {
      toast.error('Ingresa una tasa de conversión válida (> 0)');
      return;
    }

    setLoading(true);
    try {
      await api.post('/transactions/transfer', {
        from_account_id: parseInt(fromAccountId, 10),
        to_account_id: parseInt(toAccountId, 10),
        amount: amt,
        transaction_fee: feeVal || 0,
        description: description || undefined,
        exchange_rate: requiresConversion ? rateVal : undefined,
      });
      toast.success('Transferencia realizada correctamente');
      onTransferred();
      onOpenChange(false);

      // reset
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setAmountNum(undefined);
      setFee('');
      setFeeNum(undefined);
      setDescription('');
      setExchangeRate('');
      setRateNum(undefined);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al realizar transferencia',
        );
      } else {
        toast.error('Error inesperado al realizar transferencia');
      }
    } finally {
      setLoading(false);
    }
  };

  const idFrom = 'transfer-from';
  const idTo = 'transfer-to';
  const idAmount = 'transfer-amount';
  const idFee = 'transfer-fee';
  const idDesc = 'transfer-desc';
  const idRate = 'transfer-rate';

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Transferir entre cuentas</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Origen */}
          <div className='space-y-1'>
            <label htmlFor={idFrom} className='text-sm font-medium'>
              Cuenta origen
            </label>
            <Select
              value={fromAccountId}
              onValueChange={setFromAccountId}
              disabled={loading}
            >
              <SelectTrigger id={idFrom}>
                <SelectValue placeholder='Selecciona la cuenta origen' />
              </SelectTrigger>
              <SelectContent>
                {fromList.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    ({formatCurrency(a.balance)} {a.currency}) {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destino */}
          <div className='space-y-1'>
            <label htmlFor={idTo} className='text-sm font-medium'>
              Cuenta destino
            </label>
            <Select
              value={toAccountId}
              onValueChange={setToAccountId}
              disabled={loading}
            >
              <SelectTrigger id={idTo}>
                <SelectValue placeholder='Selecciona la cuenta destino' />
              </SelectTrigger>
              <SelectContent>
                {toList.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    ({formatCurrency(a.balance)} {a.currency}) {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div className='space-y-1'>
            <label htmlFor={idAmount} className='text-sm font-medium'>
              Monto a transferir ({fromAccount?.currency ?? 'moneda origen'})
            </label>
            <NumericFormat
              id={idAmount}
              value={amount}
              thousandSeparator // usa "," por defecto
              decimalSeparator='.' // punto como separador decimal (más común al teclear)
              decimalScale={amountDecimalScale}
              allowNegative={false}
              inputMode='decimal'
              customInput={Input}
              disabled={loading}
              onValueChange={(values) => {
                setAmount(values.value ?? ''); // cadena numérica sin formateo
                setAmountNum(values.floatValue); // número limpio
              }}
            />
          </div>

          {/* Comisión */}
          <div className='space-y-1'>
            <label htmlFor={idFee} className='text-sm font-medium'>
              Comisión{' '}
              <span className='font-normal text-muted-foreground'>
                (opcional)
              </span>
            </label>
            <NumericFormat
              id={idFee}
              value={fee}
              thousandSeparator
              decimalSeparator='.'
              decimalScale={feeDecimalScale}
              allowNegative={false}
              inputMode='decimal'
              customInput={Input}
              disabled={loading}
              onValueChange={(values) => {
                setFee(values.value ?? '');
                setFeeNum(values.floatValue);
              }}
            />
          </div>

          {/* Descripción */}
          <div className='space-y-1'>
            <label htmlFor={idDesc} className='text-sm font-medium'>
              Descripción{' '}
              <span className='font-normal text-muted-foreground'>
                (opcional)
              </span>
            </label>
            <Input
              id={idDesc}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Tasa (solo si hay conversión) */}
          {requiresConversion && (
            <div className='space-y-1'>
              <label htmlFor={idRate} className='text-sm font-medium'>
                Tasa de conversión → {toAccount?.currency}
              </label>
              <div className='flex gap-2'>
                <NumericFormat
                  id={idRate}
                  value={exchangeRate}
                  thousandSeparator
                  decimalSeparator='.'
                  decimalScale={rateDecimalScale}
                  allowNegative={false}
                  inputMode='decimal'
                  customInput={Input}
                  disabled={loading}
                  onValueChange={(values) => {
                    setExchangeRate(values.value ?? '');
                    setRateNum(values.floatValue);
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleRefreshRate}
                  disabled={loading || prefilling || !fromAccount || !toAccount}
                >
                  {prefilling ? 'Cargando…' : 'Actualizar tasa'}
                </Button>
              </div>
              {convertedAmount !== null && (
                <p className='text-xs text-muted-foreground'>
                  Se depositarán:{' '}
                  <b>
                    {formatCurrency(convertedAmount)} {toAccount?.currency}
                  </b>
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleTransfer}
            className='w-full'
            disabled={loading}
          >
            {loading ? 'Transfiriendo…' : 'Transferir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
