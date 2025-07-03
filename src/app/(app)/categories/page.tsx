'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import CategoryModal from '@/components/forms/CategoryModal';

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  is_active: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories?status=all');
      setCategories(data);
    } catch {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (category: Category) => {
    setProcessingId(category.id);
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Categoría desactivada correctamente');
      fetchCategories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al desactivar categoría',
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivate = async (category: Category) => {
    setProcessingId(category.id);
    try {
      await api.put(`/categories/${category.id}/reactivate`);
      toast.success('Categoría reactivada correctamente');
      fetchCategories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al reactivar categoría',
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-semibold'>Categorías</h1>
        <Button onClick={() => setModalOpen(true)}>+ Nueva Categoría</Button>
      </div>

      {loading ? (
        <p className='text-center p-4'>Cargando categorías...</p>
      ) : (
        <div className='space-y-2'>
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className='p-4 flex flex-col md:flex-row md:justify-between md:items-center bg-card text-card-foreground'
            >
              <div>
                <p
                  className={`font-medium ${
                    !cat.is_active ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {cat.name}
                </p>
                <div className='flex gap-2 mt-1'>
                  <Badge variant='outline' className='capitalize w-fit'>
                    {cat.type === 'income'
                      ? 'Ingreso'
                      : cat.type === 'expense'
                      ? 'Egreso'
                      : 'Ambos'}
                  </Badge>
                  <Badge
                    variant={cat.is_active ? 'default' : 'secondary'}
                    className='w-fit'
                  >
                    {cat.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>

              <div className='mt-2 md:mt-0 flex gap-2 flex-wrap'>
                {cat.is_active ? (
                  <>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEditCategory(cat)}
                    >
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      disabled={processingId === cat.id}
                      onClick={() => handleDeactivate(cat)}
                    >
                      {processingId === cat.id ? 'Procesando...' : 'Desactivar'}
                    </Button>
                  </>
                ) : (
                  <Button
                    size='sm'
                    variant='secondary'
                    disabled={processingId === cat.id}
                    onClick={() => handleReactivate(cat)}
                  >
                    {processingId === cat.id ? 'Procesando...' : 'Reactivar'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {categories.length === 0 && (
            <p className='text-center p-4 text-muted-foreground'>
              No hay categorías creadas aún.
            </p>
          )}
        </div>
      )}

      {/* Modal de creación / edición */}
      {modalOpen && (
        <CategoryModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCreated={fetchCategories}
        />
      )}
      {editCategory && (
        <CategoryModal
          open={!!editCategory}
          onOpenChange={(open) => !open && setEditCategory(null)}
          category={editCategory}
          onCreated={fetchCategories}
        />
      )}
    </div>
  );
}
