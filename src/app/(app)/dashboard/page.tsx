'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardSummary } from '@/types';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/dashboard/resumen');
        setSummary(data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(
            error?.response?.data?.detail || 'Error al cargar el resumen',
          );
        }
      }
    };
    fetchSummary();
  }, []);

  if (!summary) return <p className='text-center p-6'>Cargando resumen...</p>;

  return (
    <main className='p-4 max-w-2xl mx-auto space-y-4'>
      <h1 className='text-2xl font-semibold text-center'>Resumen Financiero</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card className='p-4'>
          <p className='text-sm'>Ingresos del mes</p>
          <p className='text-xl font-bold text-green-600'>
            ${summary.ingresos_mes.toLocaleString()}
          </p>
        </Card>
        <Card className='p-4'>
          <p className='text-sm'>Egresos del mes</p>
          <p className='text-xl font-bold text-red-600'>
            ${summary.egresos_mes.toLocaleString()}
          </p>
        </Card>
        <Card className='p-4'>
          <p className='text-sm'>Ahorro del mes</p>
          <p className='text-xl font-bold text-blue-600'>
            ${summary.ahorro_mes.toLocaleString()}
          </p>
        </Card>
        <Card className='p-4'>
          <p className='text-sm'>Total en cuentas de ahorro</p>
          <p className='text-xl font-bold'>
            ${summary.total_ahorros.toLocaleString()}
          </p>
        </Card>
        <Card className='p-4 md:col-span-2'>
          <p className='text-sm'>Total de deudas</p>
          <p className='text-xl font-bold text-red-700'>
            ${summary.total_deudas.toLocaleString()}
          </p>
        </Card>
        <Card className='p-4 md:col-span-2'>
          <p className='text-sm'>Recomendación</p>
          <p className='text-md'>{summary.recomendacion}</p>
        </Card>
      </div>
    </main>
  );
}
