'use client';

import { useEffect, useState } from 'react';
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
import InfoHint from '@/components/ui/info-hint';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import type { Category, CategoryRule } from '@/types';
import { categoryLabel } from '@/lib/categoryTree';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: CategoryRule | null;
  /** Precarga (atajo "crear regla" desde una transacción). */
  initial?: { matchText?: string; categoryId?: number };
  onSaved: () => void;
}

export default function RuleModal({ open, onOpenChange, editing, initial, onSaved }: Props) {
  const isEdit = !!editing;

  const [matchText, setMatchText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setMatchText(editing.match_text);
      setCategoryId(String(editing.category_id));
    } else {
      setMatchText(initial?.matchText ?? '');
      setCategoryId(initial?.categoryId ? String(initial.categoryId) : '');
    }
  }, [open, editing, initial]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await api.get('/categories', { params: { status: 'active' } });
        setCategories((data as Category[]).filter((c) => !c.is_system));
      } catch {
        toast.error('Error al cargar categorías');
      }
    })();
  }, [open]);

  const canSubmit = !!matchText.trim() && !!categoryId && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return toast.error('Completa todos los campos');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/category-rules/${editing!.id}`, {
          match_text: matchText.trim(),
          category_id: Number(categoryId),
        });
        toast.success('Regla actualizada');
      } else {
        await api.post('/category-rules', {
          match_text: matchText.trim(),
          category_id: Number(categoryId),
        });
        toast.success('Regla creada');
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo guardar'
          : 'Error inesperado al guardar',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      className='w-[min(100vw-1rem,480px)]'
      title={
        <>
          {isEdit ? 'Editar regla' : 'Nueva regla'}
          <InfoHint side='top'>
            Si la descripción de una transacción contiene este texto, se sugiere la categoría
            elegida. No distingue mayúsculas.
          </InfoHint>
        </>
      }
      footer={
        <>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
              disabled={saving}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant='soft-emerald'
            className='sm:min-w-[160px]'
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear regla'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
        <div className='space-y-1'>
          <label htmlFor='rule-text' className='text-sm font-medium'>
            Si la descripción contiene…
          </label>
          <Input
            id='rule-text'
            value={matchText}
            onChange={(e) => setMatchText(e.target.value)}
            placeholder='Ej. netflix'
            disabled={saving}
            className='bg-white'
          />
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium'>…sugerir esta categoría</label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={saving}>
            <SelectTrigger className='bg-white'>
              <SelectValue placeholder='Selecciona la categoría' />
            </SelectTrigger>
            <SelectContent className='select-solid z-[140]'>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormModal>
  );
}
