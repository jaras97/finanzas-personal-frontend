'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import InfoHint from '@/components/ui/info-hint';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  category?: {
    id: number;
    name: string;
    type: 'income' | 'expense' | 'both';
  };
};

export default function CategoryModal({
  open,
  onOpenChange,
  onCreated,
  category,
}: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'both' | ''>('');
  const [loading, setLoading] = useState(false);

  // IDs accesibles
  const idName = 'cat-name';
  const idType = 'cat-type';

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
    } else {
      setName('');
      setType('');
    }
  }, [category]);

  // Manejo de errores (evita pasar objetos al toast)
  const extractApiError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const data: any = err.response?.data;
      const detail =
        data?.detail ?? data?.message ?? data?.error ?? data?.errors;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const msgs = detail.map((e: any) => e?.msg).filter(Boolean);
        if (msgs.length) return msgs.join(' • ');
      }
      try {
        return JSON.stringify(detail ?? data ?? err);
      } catch {
        return err.message || 'Error inesperado';
      }
    }
    return 'Error inesperado';
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!name.trim() || !type) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (category) {
        await api.put(`/categories/${category.id}`, {
          name: name.trim(),
          type,
        });
        toast.success('Categoría actualizada correctamente');
      } else {
        await api.post('/categories', {
          name: name.trim(),
          type,
        });
        toast.success('Categoría creada correctamente');
      }
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !loading && onOpenChange(o)}
      size='md'
      className='w-[min(100vw-1rem,520px)]'
      title={category ? 'Editar categoría' : 'Nueva categoría'}
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
            onClick={handleSubmit}
            disabled={loading}
            aria-disabled={loading}
            className='sm:min-w-[160px]'
          >
            {loading
              ? category
                ? 'Actualizando…'
                : 'Creando…'
              : category
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={loading}>
            {/* Nombre */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idName} className='text-sm font-medium'>
                  Nombre
                </label>
                <InfoHint side='top'>
                  Usa un nombre corto y claro (ej. “Salario”, “Alimentación”).
                </InfoHint>
              </div>
              <Input
                id={idName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className='bg-white'
              />
            </div>

            {/* Tipo */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idType} className='text-sm font-medium'>
                  Tipo
                </label>
                <InfoHint side='top'>
                  Si la categoría tiene transacciones, el backend puede impedir
                  cambiar el tipo.
                </InfoHint>
              </div>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as 'income' | 'expense' | 'both')
                }
                disabled={loading}
              >
                <SelectTrigger id={idType} className='bg-white'>
                  <SelectValue placeholder='Seleccionar tipo' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  <SelectItem value='income'>Ingreso</SelectItem>
                  <SelectItem value='expense'>Egreso</SelectItem>
                  <SelectItem value='both'>Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className='text-xs text-muted-foreground'>
              ⚠️ Nota: No puedes cambiar el tipo si ya existen transacciones
              asociadas a esta categoría.
            </p>
      </div>
    </FormModal>
  );
}
