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
import api from '@/lib/api';
import { toast } from 'sonner';
import { TransactionWithCategoryRead } from '@/types';
import axios from 'axios';

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  is_system?: boolean;
};

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
  const [description, setDescription] = useState(transaction.description ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    transaction.category ? transaction.category.id.toString() : '',
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  // Cargar categorías del mismo tipo y filtrar las de sistema
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get<Category[]>('/categories', {
          params: { type: transaction.type, status: 'active' },
        });
        setCategories((data || []).filter((c) => !c.is_system));
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    if (open) fetchCategories();
  }, [open, transaction.type]);

  const handleSubmit = async () => {
    if (!description.trim() || !categoryId) {
      toast.error('Completa descripción y categoría');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/transactions/${transaction.id}`, {
        description: description.trim(),
        category_id: parseInt(categoryId, 10),
      });
      toast.success('Transacción actualizada');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al actualizar transacción',
        );
      } else {
        toast.error('Error al actualizar transacción');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground max-w-md'>
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            Por seguridad y trazabilidad contable, solo puedes modificar la{' '}
            <strong>descripción</strong> y la <strong>categoría</strong>.
          </p>

          <Input
            placeholder='Descripción'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

          <Button onClick={handleSubmit} className='w-full' disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
