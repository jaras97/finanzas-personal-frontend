'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import CategoriesTabs from '@/components/layout/CategoriesTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { useCategoryRules } from '@/hooks/useCategoryRules';
import RuleModal from '@/components/forms/RuleModal';
import type { CategoryRule } from '@/types';
import { ListFilter, Pencil, Trash2, ArrowUp, ArrowDown, Wand2 } from 'lucide-react';

export default function RulesPage() {
  const { rules, loading, refresh } = useCategoryRules();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRule | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  const handleDelete = async (rule: CategoryRule) => {
    setBusyId(rule.id);
    try {
      await api.delete(`/category-rules/${rule.id}`);
      toast.success('Regla eliminada');
      await refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error?.response?.data?.detail || 'No se pudo eliminar' : 'Error inesperado',
      );
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = rules[index + direction];
    const current = rules[index];
    if (!target) return;
    setBusyId(current.id);
    try {
      await Promise.all([
        api.put(`/category-rules/${current.id}`, { priority: target.priority }),
        api.put(`/category-rules/${target.id}`, { priority: current.priority }),
      ]);
      await refresh();
    } catch {
      toast.error('No se pudo reordenar');
    } finally {
      setBusyId(null);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const { data } = await api.post('/category-rules/apply');
      toast.success(
        data.updated > 0
          ? `${data.updated} transacciones recategorizadas`
          : 'No había transacciones "Sin categorizar" que coincidieran con tus reglas',
      );
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error?.response?.data?.detail || 'No se pudo aplicar' : 'Error inesperado',
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Reglas de categorización'
        subtitle='Si la descripción de una transacción contiene un texto, se sugiere la categoría automáticamente.'
        actions={
          <div className='flex gap-2 flex-wrap'>
            <Button variant='soft-slate' onClick={handleApply} disabled={applying || rules.length === 0}>
              <Wand2 className='h-4 w-4 mr-1' />
              {applying ? 'Aplicando…' : 'Aplicar a existentes'}
            </Button>
            <Button
              variant='soft-sky'
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              + Nueva regla
            </Button>
          </div>
        }
      />
      <CategoriesTabs />

      {loading ? (
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title='Aún no tienes reglas'
          description='Crea una para que transacciones como "Netflix" se categoricen solas, cada vez.'
          actions={
            <Button variant='soft-sky' size='sm' onClick={() => setModalOpen(true)}>
              + Nueva regla
            </Button>
          }
        />
      ) : (
        <div className='space-y-2'>
          <p className='text-xs text-muted-foreground'>
            Se evalúan de arriba hacia abajo; gana la primera que coincide con la descripción.
          </p>
          {rules.map((r, i) => (
            <Card
              key={r.id}
              variant='white'
              className='p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <div className='flex flex-col'>
                  <Button
                    size='sm'
                    variant='soft-slate'
                    className='h-6 w-6 p-0'
                    disabled={i === 0 || busyId === r.id}
                    onClick={() => move(i, -1)}
                    title='Subir'
                  >
                    <ArrowUp className='h-3 w-3' />
                  </Button>
                  <Button
                    size='sm'
                    variant='soft-slate'
                    className='h-6 w-6 p-0 mt-1'
                    disabled={i === rules.length - 1 || busyId === r.id}
                    onClick={() => move(i, 1)}
                    title='Bajar'
                  >
                    <ArrowDown className='h-3 w-3' />
                  </Button>
                </div>
                <div className='min-w-0'>
                  <p className='font-medium truncate'>
                    Si contiene <span className='font-mono text-sky-700'>&quot;{r.match_text}&quot;</span>
                  </p>
                  <div className='flex gap-2 mt-1 items-center flex-wrap'>
                    <Badge variant='outline' className='w-fit'>
                      → {r.category_name}
                    </Badge>
                    {!r.is_active && (
                      <Badge variant='secondary' className='w-fit'>
                        Inactiva
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className='flex gap-2 flex-wrap shrink-0'>
                <Button
                  size='sm'
                  variant='soft-sky'
                  disabled={busyId === r.id}
                  onClick={() => {
                    setEditing(r);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className='h-4 w-4 mr-1' /> Editar
                </Button>
                <Button
                  size='sm'
                  variant='soft-rose'
                  disabled={busyId === r.id}
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className='h-4 w-4 mr-1' /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RuleModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSaved={refresh}
      />
    </div>
  );
}
