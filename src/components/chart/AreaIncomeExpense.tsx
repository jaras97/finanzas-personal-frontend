'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export function AreaIncomeExpense({
  data,
}: {
  data: { date: string; income: number; expense: number }[];
}) {
  return (
    <div className='rounded-2xl bg-card shadow-sm p-4'>
      <ResponsiveContainer width='100%' height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id='inc' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#10B981' stopOpacity={0.4} />
              <stop offset='100%' stopColor='#10B981' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='exp' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#EF4444' stopOpacity={0.35} />
              <stop offset='100%' stopColor='#EF4444' stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 3' stroke='rgba(2,6,23,0.06)' />
          <XAxis dataKey='date' tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area
            type='monotone'
            dataKey='income'
            stroke='#059669'
            fill='url(#inc)'
            strokeWidth={2}
            animationDuration={700}
          />
          <Area
            type='monotone'
            dataKey='expense'
            stroke='#DC2626'
            fill='url(#exp)'
            strokeWidth={2}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
