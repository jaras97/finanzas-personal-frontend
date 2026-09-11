'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/format';
import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import type {
  Category,
  ImportColumnMapping,
  ImportPreviewResult,
  ImportRowPreview,
} from '@/types';

const DATE_FORMAT_PRESETS = [
  { value: '%d/%m/%Y', label: 'DD/MM/AAAA (31/12/2026)' },
  { value: '%m/%d/%Y', label: 'MM/DD/AAAA (12/31/2026)' },
  { value: '%Y-%m-%d', label: 'AAAA-MM-DD (2026-12-31)' },
  { value: '%d-%m-%Y', label: 'DD-MM-AAAA (31-12-2026)' },
];

type Step = 'select' | 'mapping' | 'review' | 'done';

type EditableRow = ImportRowPreview & { include: boolean; category_id: number };

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err?.response?.data?.detail || fallback;
  }
  return fallback;
}

export default function ImportPage() {
  const { accounts } = useSavingAccounts();
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === 'active'),
    [accounts],
  );

  const [step, setStep] = useState<Step>('select');
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [columnCount, setColumnCount] = useState(0);
  const [mapping, setMapping] = useState<ImportColumnMapping>({
    date: 0,
    description: 1,
    amount: 2,
  });
  const [dateFormat, setDateFormat] = useState('%d/%m/%Y');
  const [hasHeader, setHasHeader] = useState(true);
  const [saveProfile, setSaveProfile] = useState(true);

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const { categories: todasLasCategorias, refresh: recargarCategorias } = useCategories({
    status: 'active',
  });
  // Se conserva «Sin categorizar»: es donde el parseo deja lo que ninguna regla
  // resuelve, así que el usuario tiene que poder verla y elegirla por fila.
  const categories = useMemo(
    () =>
      todasLasCategorias.filter((c) => !c.is_system || c.system_key === 'uncategorized'),
    [todasLasCategorias],
  );

  const selectedAccount = activeAccounts.find((a) => String(a.id) === accountId);

  const buildFormData = (withMapping: boolean) => {
    const fd = new FormData();
    fd.append('file', file as File);
    fd.append('saving_account_id', accountId);
    fd.append('has_header', String(hasHeader));
    if (withMapping) {
      fd.append('column_mapping', JSON.stringify(mapping));
      fd.append('date_format', dateFormat);
    }
    return fd;
  };

  const handleInspect = async () => {
    if (!accountId || !file) return toast.error('Elige una cuenta y un archivo CSV');
    setLoading(true);
    try {
      const { data } = await api.post<ImportPreviewResult>(
        '/transactions/import/preview',
        buildFormData(false),
      );
      if (data.mode !== 'inspect') return;
      setSampleRows(data.sample_rows);
      setColumnCount(data.column_count);
      if (data.saved_profile) {
        setMapping(data.saved_profile.column_mapping);
        setDateFormat(data.saved_profile.date_format);
        setHasHeader(data.saved_profile.has_header);
      }
      setStep('mapping');
    } catch (error) {
      toast.error(extractError(error, 'No se pudo leer el archivo'));
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<ImportPreviewResult>(
        '/transactions/import/preview',
        buildFormData(true),
      );
      if (data.mode !== 'review') return;

      recargarCategorias();

      const uncategorized = data.rows[0]?.category_id;
      setRows(
        data.rows.map((r) => ({ ...r, category_id: r.category_id ?? uncategorized ?? 0 })),
      );
      setDuplicateCount(data.duplicate_count);
      setErrorCount(data.error_count);

      if (saveProfile) {
        try {
          await api.post('/import-profiles', {
            saving_account_id: Number(accountId),
            column_mapping: mapping,
            date_format: dateFormat,
            has_header: hasHeader,
          });
        } catch {
          // no bloquea el flujo si falla guardar el perfil
        }
      }

      setStep('review');
    } catch (error) {
      toast.error(extractError(error, 'No se pudo interpretar el archivo con ese mapeo'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const toImport = rows.filter((r) => r.include);
    if (toImport.length === 0) return toast.error('No hay filas marcadas para importar');
    setLoading(true);
    try {
      const { data } = await api.post('/transactions/import/confirm', {
        saving_account_id: Number(accountId),
        rows: toImport.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          type: r.type,
          category_id: r.category_id,
        })),
      });
      setResult(data);
      setStep('done');
    } catch (error) {
      toast.error(extractError(error, 'No se pudo confirmar la importación'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('select');
    setFile(null);
    setRows([]);
    setResult(null);
  };

  // Las filas con error nunca se marcan, ni siquiera con "marcar todas": su
  // casilla está deshabilitada en la UI, pero antes el estado sí se volteaba
  // y viajaban al confirm con date/amount en null. El backend exige esos
  // campos, así que Pydantic rechazaba la petición COMPLETA con 422 -- una
  // sola fila ilegible impedía importar todas las demás.
  const toggleAll = (include: boolean) =>
    setRows((rs) => rs.map((r) => ({ ...r, include: include && !r.error })));
  const ignoreDuplicates = () =>
    setRows((rs) => rs.map((r) => (r.is_duplicate ? { ...r, include: false } : r)));

  const includedCount = rows.filter((r) => r.include).length;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Importar movimientos'
        subtitle='Sube el extracto CSV de tu banco y revisa cada fila antes de crear nada.'
      />

      {/* Paso 1: cuenta + archivo */}
      {step === 'select' && (
        <Card variant='surface'>
          <CardContent className='p-5 space-y-4 max-w-lg'>
            <div className='space-y-1'>
              <label className='text-sm font-medium'>Cuenta destino</label>
              <Select value={accountId} onValueChange={setAccountId} disabled={loading}>
                <SelectTrigger className='bg-white'>
                  <SelectValue placeholder='Selecciona la cuenta' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      ({a.currency}) {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <label className='text-sm font-medium'>Archivo CSV</label>
              <input
                type='file'
                accept='.csv,text/csv'
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={loading}
                className='block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sky-700 hover:file:bg-sky-100'
              />
              <p className='text-xs text-muted-foreground'>
                Máximo 1.000 filas por archivo. Exportado desde tu banco, un extracto por cuenta.
              </p>
            </div>

            <Button
              variant='soft-sky'
              onClick={handleInspect}
              disabled={!accountId || !file || loading}
            >
              {loading ? 'Leyendo…' : 'Continuar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: mapear columnas */}
      {step === 'mapping' && (
        <div className='space-y-4'>
          <Card variant='surface'>
            <CardContent className='p-5 space-y-3'>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Primeras filas del archivo
              </h3>
              <div className='overflow-x-auto'>
                <table className='text-sm w-full'>
                  <thead>
                    <tr>
                      {Array.from({ length: columnCount }).map((_, i) => (
                        <th
                          key={i}
                          className='text-left font-medium text-muted-foreground px-2 py-1 border-b'
                        >
                          Columna {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} className='px-2 py-1 border-b truncate max-w-[160px]'>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card variant='surface'>
            <CardContent className='p-5 space-y-4 max-w-lg'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='has-header'
                  checked={hasHeader}
                  onCheckedChange={(v) => setHasHeader(v === true)}
                />
                <label htmlFor='has-header' className='text-sm'>
                  La primera fila es un encabezado (no un movimiento)
                </label>
              </div>

              {(['date', 'description', 'amount'] as const).map((field) => (
                <div key={field} className='space-y-1'>
                  <label className='text-sm font-medium'>
                    {field === 'date' ? 'Columna de fecha' : field === 'description' ? 'Columna de descripción' : 'Columna de monto'}
                  </label>
                  <Select
                    value={String(mapping[field])}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [field]: Number(v) }))}
                  >
                    <SelectTrigger className='bg-white'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='select-solid z-[140]'>
                      {Array.from({ length: columnCount }).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          Columna {i}
                          {sampleRows[hasHeader ? 0 : -1]?.[i]
                            ? ` — "${sampleRows[0][i]}"`
                            : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className='space-y-1'>
                <label className='text-sm font-medium'>Formato de fecha</label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className='bg-white'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='select-solid z-[140]'>
                    {DATE_FORMAT_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className='text-xs text-muted-foreground'>
                No hay columna de tipo (ingreso/egreso): el signo del monto lo determina — negativo
                es egreso, positivo es ingreso.
              </p>

              <div className='flex items-center gap-2'>
                <Checkbox
                  id='save-profile'
                  checked={saveProfile}
                  onCheckedChange={(v) => setSaveProfile(v === true)}
                />
                <label htmlFor='save-profile' className='text-sm'>
                  Recordar este mapeo para esta cuenta
                </label>
              </div>

              <div className='flex gap-2'>
                <Button variant='soft-slate' onClick={() => setStep('select')} disabled={loading}>
                  Atrás
                </Button>
                <Button variant='soft-sky' onClick={handleParse} disabled={loading}>
                  {loading ? 'Procesando…' : 'Continuar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paso 3: revisión */}
      {step === 'review' && (
        <div className='space-y-4'>
          <Card variant='surface'>
            <CardContent className='p-4 flex flex-wrap items-center justify-between gap-3'>
              <div className='text-sm text-muted-foreground'>
                {rows.length} filas · {duplicateCount} posibles duplicados · {errorCount} con error ·{' '}
                <span className='font-medium text-foreground'>{includedCount} seleccionadas</span>
              </div>
              <div className='flex gap-2 flex-wrap'>
                <Button size='sm' variant='soft-slate' onClick={() => toggleAll(true)}>
                  Marcar todas
                </Button>
                <Button size='sm' variant='soft-slate' onClick={() => toggleAll(false)}>
                  Desmarcar todas
                </Button>
                {duplicateCount > 0 && (
                  <Button size='sm' variant='soft-amber' onClick={ignoreDuplicates}>
                    Ignorar duplicados
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant='surface'>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='text-sm w-full'>
                  <thead>
                    <tr className='text-left text-muted-foreground'>
                      <th className='px-3 py-2 border-b'></th>
                      <th className='px-3 py-2 border-b'>Fecha</th>
                      <th className='px-3 py-2 border-b'>Descripción</th>
                      <th className='px-3 py-2 border-b'>Monto</th>
                      <th className='px-3 py-2 border-b'>Categoría</th>
                      <th className='px-3 py-2 border-b'>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const options = categories.filter(
                        (c) => c.type === 'both' || c.type === r.type,
                      );
                      return (
                        <tr key={i} className={cn(r.error && 'opacity-60')}>
                          <td className='px-3 py-2 border-b'>
                            <Checkbox
                              checked={r.include}
                              disabled={!!r.error}
                              onCheckedChange={(v) =>
                                setRows((rs) =>
                                  rs.map((row, idx) =>
                                    idx === i ? { ...row, include: v === true } : row,
                                  ),
                                )
                              }
                            />
                          </td>
                          <td className='px-3 py-2 border-b whitespace-nowrap'>
                            {r.date ?? '—'}
                          </td>
                          <td className='px-3 py-2 border-b max-w-[220px] truncate'>
                            {r.description || '—'}
                          </td>
                          <td
                            className={cn(
                              'px-3 py-2 border-b tabular-nums whitespace-nowrap',
                              r.type === 'income' ? 'text-emerald-700' : 'text-rose-700',
                            )}
                          >
                            {r.amount !== null
                              ? formatCurrency(r.amount, selectedAccount?.currency ?? 'COP')
                              : '—'}
                          </td>
                          <td className='px-3 py-2 border-b min-w-[180px]'>
                            <Select
                              value={String(r.category_id)}
                              onValueChange={(v) =>
                                setRows((rs) =>
                                  rs.map((row, idx) =>
                                    idx === i ? { ...row, category_id: Number(v) } : row,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className='bg-white h-8 text-xs'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className='select-solid z-[140]'>
                                {options.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className='px-3 py-2 border-b'>
                            {r.error ? (
                              <Badge
                                variant='outline'
                                className='border-rose-300 text-rose-700 bg-rose-50'
                                title={r.error}
                              >
                                Error
                              </Badge>
                            ) : r.is_duplicate ? (
                              <Badge
                                variant='outline'
                                className='border-amber-300 text-amber-700 bg-amber-50'
                              >
                                Posible duplicado
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='border-emerald-300 text-emerald-700 bg-emerald-50'
                              >
                                Lista
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className='flex gap-2'>
            <Button variant='soft-slate' onClick={() => setStep('mapping')} disabled={loading}>
              Atrás
            </Button>
            <Button
              variant='soft-emerald'
              onClick={handleConfirm}
              disabled={loading || includedCount === 0}
            >
              {loading ? 'Importando…' : `Confirmar importación (${includedCount})`}
            </Button>
          </div>
        </div>
      )}

      {/* Paso 4: resultado */}
      {step === 'done' && result && (
        <Card variant='surface'>
          <CardContent className='p-6 space-y-4 max-w-lg text-center'>
            <p className='text-lg font-medium'>
              {result.created} movimientos importados
              {result.skipped > 0 && `, ${result.skipped} omitidos`}
            </p>
            <div className='flex gap-2 justify-center'>
              <Button variant='soft-slate' onClick={reset}>
                Importar otro archivo
              </Button>
              <Button asChild variant='soft-sky'>
                <Link href='/transactions'>Ver transacciones</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
