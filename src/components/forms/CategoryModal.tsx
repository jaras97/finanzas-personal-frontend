'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import api from '@/lib/api';

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

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
    } else {
      setName('');
      setType('');
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!name || !type) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    try {
      if (category) {
        await api.put(`/categories/${category.id}`, { name, type });
        toast.success('Categoría actualizada correctamente');
      } else {
        await api.post('/categories', { name, type });
        toast.success('Categoría creada correctamente');
      }
      onCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al guardar la categoría',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar categoría' : 'Nueva categoría'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          <Input
            placeholder='Nombre de la categoría'
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <Select
            value={type}
            onValueChange={(v) => setType(v as 'income' | 'expense' | 'both')}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar tipo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='income'>Ingreso</SelectItem>
              <SelectItem value='expense'>Egreso</SelectItem>
              <SelectItem value='both'>Ambos</SelectItem>
            </SelectContent>
          </Select>

          <p className='text-sm text-muted-foreground'>
            ⚠️ Nota: No puedes cambiar el tipo de la categoría si tiene
            transacciones asociadas.
          </p>

          <Button onClick={handleSubmit} disabled={loading} className='w-full'>
            {loading
              ? category
                ? 'Actualizando...'
                : 'Creando...'
              : category
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
