'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
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
import InfoHint from '@/components/ui/info-hint';
import { useCurrencies } from '@/hooks/useCurrencies';
import { DatePicker } from '@/components/ui/date-picker';

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

  const [amount, setAmount] = useState('');
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined);

  const [fee, setFee] = useState('');
  const [feeNum, setFeeNum] = useState<number | undefined>(undefined);

  const [description, setDescription] = useState('');

  const [date, setDate] = useState<Date | undefined>(new Date());

  const [exchangeRate, setExchangeRate] = useState('');
  const [rateNum, setRateNum] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  // Solo cuentas ACTIVAS
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === 'active'),
    [accounts],
  );

  // Evitar elegir la misma cuenta en ambos selects
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

  const dateToIsoAtLocalNoon = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString();

  const { currencies } = useCurrencies();
  // Escalas decimales según la moneda real (COP/JPY/CLP/... sin decimales,
  // USD/EUR con 2, etc.) en vez de asumir que solo COP no tiene centavos.
  const amountDecimalScale =
    currencies.find((c) => c.code === fromAccount?.currency)?.decimal_digits ?? 2;
  const feeDecimalScale = amountDecimalScale;
  const rateDecimalScale = 6;

  const convertedAmount =
    requiresConversion && (amountNum ?? 0) > 0 && (rateNum ?? 0) > 0
      ? (amountNum as number) * (rateNum as number)
      : null;

  /**
   * Sugerencia de tasa desde el backend, UNA VEZ por par de monedas.
   *
   * Antes la condición era `!exchangeRate` con `exchangeRate` en las
   * dependencias: al borrar el campo el efecto se volvía a disparar y lo
   * rellenaba solo, así que era imposible borrar el último dígito para
   * escribir otra tasa. Ahora se recuerda el par ya sugerido, de modo que
   * vaciar el campo es una decisión del usuario que se respeta.
   */
  const parSugerido = useRef<string | null>(null);

  useEffect(() => {
    if (!requiresConversion || !fromAccount || !toAccount) return;
    const par = `${fromAccount.currency}->${toAccount.currency}`;
    if (parSugerido.current === par) return;
    parSugerido.current = par;

    const prefill = async () => {
      try {
        setPrefilling(true);
        const { data } = await api.get('/fx/rate', {
          params: { from: fromAccount.currency, to: toAccount.currency },
        });
        if (data?.rate) {
          setExchangeRate(String(data.rate));
          setRateNum(Number(data.rate));
        }
      } catch {
        // silencioso
      } finally {
        setPrefilling(false);
      }
    };
    prefill();
    // `exchangeRate` NO va acá a propósito: incluirlo es lo que causaba el
    // rellenado automático al borrar el campo.
  }, [requiresConversion, fromAccount?.currency, toAccount?.currency, fromAccount, toAccount]);

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
    if (loading) return;

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
    if (!date) {
      toast.error('Selecciona una fecha');
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
        date: dateToIsoAtLocalNoon(date),
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
      setDate(new Date());
      // Se olvida el par ya sugerido para que la próxima transferencia
      // vuelva a proponer una tasa fresca.
      parSugerido.current = null;
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

  // 🎨 Tintes y CTA
  const idFrom = 'transfer-from';
  const idTo = 'transfer-to';
  const idAmount = 'transfer-amount';
  const idFee = 'transfer-fee';
  const idDesc = 'transfer-desc';
  const idRate = 'transfer-rate';

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !loading && onOpenChange(o)}
      size='lg'
      className='w-[min(100vw-1rem,560px)]'
      title={
        <>
          Transferir entre cuentas
          <InfoHint side='top'>
            Si las monedas difieren, usa la tasa (unidades de <b>destino</b>{' '}
            por 1 de <b>origen</b>).
          </InfoHint>
        </>
      }
      footer={
        <>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
              disabled={loading}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleTransfer}
            disabled={loading}
            aria-disabled={loading}
            className='sm:min-w-[160px]'
          >
            {loading ? 'Transfiriendo…' : 'Transferir'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={loading}>
            {/* Origen */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idFrom} className='text-sm font-medium'>
                  Cuenta origen
                </label>
                <InfoHint side='top'>
                  Solo aparecen <b>cuentas activas</b>. No puedes elegir la
                  misma como destino.
                </InfoHint>
              </div>
              <Select
                value={fromAccountId}
                onValueChange={setFromAccountId}
                disabled={loading}
              >
                <SelectTrigger id={idFrom} className='bg-white'>
                  <SelectValue placeholder='Selecciona la cuenta origen' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
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
              <div className='flex items-center gap-2'>
                <label htmlFor={idTo} className='text-sm font-medium'>
                  Cuenta destino
                </label>
                <InfoHint side='top'>
                  Debe ser diferente a la cuenta origen. Si la moneda es
                  distinta, te pediremos una tasa.
                </InfoHint>
              </div>
              <Select
                value={toAccountId}
                onValueChange={setToAccountId}
                disabled={loading}
              >
                <SelectTrigger id={idTo} className='bg-white'>
                  <SelectValue placeholder='Selecciona la cuenta destino' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
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
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto a transferir ({fromAccount?.currency ?? 'moneda origen'}
                  )
                </label>
                <InfoHint side='top'>
                  Usa <b>punto</b> para decimales. (COP sin decimales; USD/EUR
                  con 2).
                </InfoHint>
              </div>
              <NumericFormat
                id={idAmount}
                value={amount}
                thousandSeparator
                decimalSeparator='.'
                decimalScale={amountDecimalScale}
                allowNegative={false}
                inputMode='decimal'
                customInput={Input}
                disabled={loading}
                onValueChange={(values) => {
                  setAmount(values.value ?? '');
                  setAmountNum(values.floatValue);
                }}
                className='bg-white'
              />
            </div>

            {/* Comisión */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idFee} className='text-sm font-medium'>
                  Comisión{' '}
                  <span className='font-normal text-muted-foreground'>
                    (opcional)
                  </span>
                </label>
                <InfoHint side='top'>
                  Se descuenta de la cuenta origen junto con el monto. No puede
                  ser negativa.
                </InfoHint>
              </div>
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
                className='bg-white'
              />
            </div>

            {/* Descripción */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDesc} className='text-sm font-medium'>
                  Descripción{' '}
                  <span className='font-normal text-muted-foreground'>
                    (opcional)
                  </span>
                </label>
                <InfoHint side='top'>
                  Añade un detalle como “Traspaso ahorro → gastos”.
                </InfoHint>
              </div>
              <Input
                id={idDesc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
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
                  disabled={loading}
                  className='h-8'
                >
                  Hoy
                </Button>
              </div>
              <DatePicker value={date} onChange={setDate} disabled={loading} />
            </div>

            {/* Tasa (solo si hay conversión) */}
            {requiresConversion && (
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <label htmlFor={idRate} className='text-sm font-medium'>
                    Tasa de conversión → {toAccount?.currency}
                  </label>
                  <InfoHint side='top'>
                    ¿Cuántas unidades de <b>{toAccount?.currency}</b> por{' '}
                    <b>1</b> de {fromAccount?.currency}?
                  </InfoHint>
                </div>
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
                    className='bg-white'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleRefreshRate}
                    disabled={
                      loading || prefilling || !fromAccount || !toAccount
                    }
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
      </div>
    </FormModal>
  );
}
