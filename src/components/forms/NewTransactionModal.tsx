'use client';

import { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
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
import { useCurrencies } from '@/hooks/useCurrencies';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { Category, currencyType } from '@/types';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';
import { readTxPreferences, rememberTx } from '@/lib/txPreferences';
import { categoryDisplayName, postableCategories } from '@/lib/categoryTree';
import { CategoryPicker } from './CategoryPicker';
import { useCategories } from '@/hooks/useCategories';
import {
  ACCEPT_COMPROBANTE,
  MAX_COMPROBANTE_MB,
  motivoRechazoComprobante,
  subirComprobante,
} from '@/lib/attachments';
import { Paperclip, X } from 'lucide-react';

type UiAccount = { id: string; name: string; currency?: currencyType };

export type NewTransactionInitial = {
  type: 'income' | 'expense';
  accountId: string;
  categoryId: string;
  amount: number;
  description: string;
};

interface Props {
  onCreated: () => void;
  disabled?: boolean;
  /** Datos para precargar el formulario (ej. "repetir última transacción"). */
  initial?: NewTransactionInitial;
  /** Incrementar este valor fuerza la apertura del modal (usado junto a `initial`). */
  openSignal?: number;
  /** Oculta el botón "+ Nueva Transacción" interno; el modal solo se abre vía `openSignal`. */
  hideTrigger?: boolean;
}

export default function NewTransactionModal({
  onCreated,
  disabled,
  initial,
  openSignal,
  hideTrigger,
}: Props) {
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

  // El comprobante se guarda en memoria y se sube DESPUÉS de crear: el adjunto
  // cuelga de un `transaction_id` que todavía no existe mientras se llena el
  // formulario.
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const comprobanteInput = useRef<HTMLInputElement | null>(null);

  const [accounts, setAccounts] = useState<UiAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  type SavingAccountApiResponse = {
    id: number;
    name: string;
    balance: number;
    currency: currencyType;
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
    if (openSignal === undefined || openSignal === 0) return;
    if (initial) {
      setType(initial.type);
      setAccountId(initial.accountId);
      setCategoryId(initial.categoryId);
      setDescription(initial.description);
      setAmount(String(initial.amount));
      setAmountNum(initial.amount);
      setDate(new Date());
    }
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  useEffect(() => {
    if (open) {
      // Retomar el último tipo usado dispara en cascada la precarga de cuenta
      // y categoría (ver los efectos de abajo), así que al abrir el modal ya
      // queda todo listo salvo monto y descripción.
      if (!type) {
        const remembered = readTxPreferences().type;
        if (remembered) setType(remembered);
      }
      const t = setTimeout(() => descRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setAccountId((prev) => {
          if (combined.some((a) => a.id === prev)) return prev;
          // Recuperar la última cuenta usada para este tipo, pero solo si
          // sigue existiendo y activa (pudo cerrarse o eliminarse).
          const remembered = type
            ? readTxPreferences().accountByType?.[type]
            : undefined;
          return remembered && combined.some((a) => a.id === remembered)
            ? remembered
            : '';
        });
      } catch {
        toast.error('Error al cargar cuentas y tarjetas');
        setAccounts([]);
        setAccountId('');
      } finally {
        setLoadingAccounts(false);
      }
    };

    // Depende también de `open`: como el tipo ya no se limpia tras guardar
    // (para poder encadenar registros), sin esto la lista quedaría cacheada
    // con los saldos previos -- y el nombre de cada cuenta incluye su saldo.
    if (type && open) fetchAccountsAndCards();
    else if (!type) {
      setAccounts([]);
      setAccountId('');
    }
  }, [type, open]);

  const { categories: todasLasCategorias, loading: cargandoCategorias } =
    useCategories({
      type: type || undefined,
      status: 'active',
      enabled: !!type,
    });
  // Las de sistema no se ofrecen: mandar un gasto a «Transferencia» lo
  // escondería de su propio desglose.
  const categories = useMemo(
    () => (type ? todasLasCategorias.filter((c) => !c.is_system) : []),
    [todasLasCategorias, type],
  );
  const loadingCategories = !!type && cargandoCategorias;

  // La carga y la reconciliación de la selección son cosas distintas: lo
  // primero lo hace el hook, y acá solo se decide si la categoría elegida sigue
  // siendo válida o hay que recuperar la recordada.
  useEffect(() => {
    if (!type) {
      setCategoryId('');
      return;
    }
    if (cargandoCategorias) return;
    if (categories.length === 0) {
      setCategoryId('');
      return;
    }
    setCategoryId((prev) => {
      if (categories.some((c) => String(c.id) === prev)) return prev;
      const remembered = readTxPreferences().categoryByType?.[type];
      return remembered && categories.some((c) => String(c.id) === remembered)
        ? remembered
        : '';
    });
  }, [type, categories, cargandoCategorias]);

  const selectedCurrency = useMemo(
    () => accounts.find((a) => a.id === accountId)?.currency ?? 'COP',
    [accounts, accountId],
  );
  const { currencies } = useCurrencies();
  const decimalScale =
    currencies.find((c) => c.code === selectedCurrency)?.decimal_digits ?? 2;
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

  const limpiarComprobante = () => {
    setComprobante(null);
    // Sin esto, volver a elegir el mismo archivo no dispara `change` y el
    // usuario ve que no pasa nada.
    if (comprobanteInput.current) comprobanteInput.current.value = '';
  };

  const elegirComprobante = (file: File) => {
    // Se valida ANTES de crear el movimiento, a propósito: descubrir que el
    // archivo no sirve cuando la transacción ya está registrada deja al usuario
    // con un problema que ya no puede resolver desde este formulario.
    const motivo = motivoRechazoComprobante(file);
    if (motivo) {
      toast.error(motivo);
      limpiarComprobante();
      return;
    }
    setComprobante(file);
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return toast.error('Completa todos los campos');

    setSubmitting(true);
    try {
      let creada: { id: number };
      if (accountId.startsWith('debt-')) {
        const debtId = parseInt(accountId.replace('debt-', ''), 10);
        const { data } = await api.post<{ id: number }>(
          `/debts/${debtId}/purchase`,
          {
            amount: amountNum,
            description,
            category_id: parseInt(categoryId, 10),
            date: dateToIsoAtLocalNoon(date!),
          },
        );
        creada = data;
      } else {
        const { data } = await api.post<{ id: number }>('/transactions', {
          description,
          amount: amountNum,
          type,
          category_id: parseInt(categoryId, 10),
          saving_account_id: parseInt(accountId, 10),
          date: dateToIsoAtLocalNoon(date!),
        });
        creada = data;
      }

      // A partir de acá el movimiento YA existe. Nada de lo que siga puede
      // reportarse como "no se pudo crear": quien lea eso lo registraría de
      // nuevo y terminaría con el gasto duplicado.
      if (comprobante) {
        setSubiendoComprobante(true);
        try {
          await subirComprobante(creada.id, comprobante);
          toast.success('Transacción creada con su comprobante');
        } catch (error) {
          // El comprobante es evidencia que se añade al hecho contable, no
          // parte de él: perderlo no justifica deshacer el movimiento. Pero el
          // aviso tiene que decir dónde recuperarlo.
          toast.warning(
            axios.isAxiosError(error) && error?.response?.data?.detail
              ? `Movimiento registrado, pero el comprobante no se adjuntó: ${error.response.data.detail} Puedes adjuntarlo desde la lista de movimientos.`
              : 'Movimiento registrado, pero el comprobante no se pudo adjuntar. Puedes adjuntarlo desde la lista de movimientos.',
            { duration: 8000 },
          );
        } finally {
          setSubiendoComprobante(false);
        }
      } else {
        toast.success('Transacción creada correctamente');
      }

      // Recordar estas selecciones para la próxima vez. Se guardan solo tras
      // un guardado exitoso: si la request falló, no queremos "aprender" una
      // combinación que ni siquiera se pudo registrar.
      rememberTx({
        type: type as 'income' | 'expense',
        accountId,
        categoryId,
      });

      // El monto, la descripción y el comprobante sí se limpian (son distintos
      // cada vez); tipo/cuenta/categoría se conservan para encadenar varios
      // registros seguidos sin rearmar el formulario. Dejar el comprobante
      // pegado lo adjuntaría al movimiento siguiente, sin que nada lo delate.
      setDescription('');
      setAmount('');
      setAmountNum(undefined);
      setDate(new Date());
      limpiarComprobante();
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

  // tono: deriva del tipo de movimiento (mismo criterio en todo FormModal)
  const tone: 'neutral' | 'emerald' | 'rose' =
    type === 'expense' ? 'rose' : type === 'income' ? 'emerald' : 'neutral';

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
    <FormModal
      open={open}
      onOpenChange={(o) => (!submitting || disabled) && setOpen(o)}
      initialFocus={descRef as any}
      trigger={
        !hideTrigger ? (
          <Button
            className='bg-emerald-600 text-white hover:bg-emerald-700'
            disabled={disabled}
          >
            + Nueva Transacción
          </Button>
        ) : undefined
      }
      title={
        isCreditCardPurchase ? 'Nueva compra con tarjeta' : 'Nueva Transacción'
      }
      tone={tone}
      footer={
        <>
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
            {subiendoComprobante
              ? 'Adjuntando…'
              : submitting
              ? 'Creando…'
              : isCreditCardPurchase
              ? 'Registrar compra'
              : 'Crear transacción'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className='space-y-5'
        aria-busy={submitting || disabled}
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
                disabled={submitting || disabled}
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
                      {decimalScale === 0
                        ? `En ${selectedCurrency} normalmente no se usan decimales.`
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
                  disabled={submitting || disabled}
                  onValueChange={(v) => {
                    setAmount(v.value ?? '');
                    setAmountNum(v.floatValue);
                  }}
                  placeholder={decimalScale === 0 ? '0' : '0.00'}
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
                    disabled={submitting || disabled}
                    className='h-8'
                  >
                    Hoy
                  </Button>
                </div>

                {/* ✅ altura igual al input: h-9 */}
                <DatePicker
                  value={date}
                  onChange={setDate}
                  disabled={submitting || disabled}
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
                    disabled={submitting || disabled}
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
                    disabled={submitting || disabled}
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
                <CategoryPicker
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  disabled={submitting ||
                    !type ||
                    loadingCategories ||
                    categories.length === 0}
                  id={idCat}
                  placeholder={!type
                          ? 'Selecciona primero el tipo'
                          : loadingCategories
                          ? 'Cargando…'
                          : categories.length
                          ? 'Seleccionar categoría'
                          : 'No hay categorías disponibles'}
                />
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

              {/* Comprobante (opcional) */}
              <div className='md:col-span-2 space-y-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    Comprobante{' '}
                    <span className='font-normal text-muted-foreground'>
                      (opcional)
                    </span>
                  </span>
                  <InfoHint side='top'>
                    La foto del recibo o el PDF del banco. Hasta{' '}
                    {MAX_COMPROBANTE_MB} MB. Se adjunta al guardar el
                    movimiento.
                  </InfoHint>
                </div>

                {/* Sin `capture`: forzar la cámara dejaría fuera el PDF del
                    banco y las fotos ya tomadas. Sin el atributo, el móvil
                    ofrece cámara, galería y archivos. */}
                <input
                  ref={comprobanteInput}
                  type='file'
                  accept={ACCEPT_COMPROBANTE}
                  className='hidden'
                  data-testid='tx-comprobante'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) elegirComprobante(file);
                  }}
                />

                {comprobante ? (
                  <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2'>
                    <Paperclip className='h-4 w-4 shrink-0 text-sky-600' />
                    <span className='min-w-0 flex-1 truncate text-sm'>
                      {comprobante.name}
                    </span>
                    <Button
                      type='button'
                      size='sm'
                      variant='soft-slate'
                      className='h-11 w-11 shrink-0 sm:h-8 sm:w-8'
                      onClick={limpiarComprobante}
                      disabled={submitting || disabled}
                      aria-label='Quitar comprobante'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type='button'
                    variant='outline'
                    className='h-11 w-full justify-start bg-white sm:h-9'
                    onClick={() => comprobanteInput.current?.click()}
                    disabled={submitting || disabled}
                  >
                    <Paperclip className='mr-2 h-4 w-4' />
                    Adjuntar comprobante
                  </Button>
                )}
              </div>
            </div>
      </form>
    </FormModal>
  );
}
