'use client';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const palette = [
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#84CC16',
  '#E11D48',
  '#14B8A6',
  '#F97316',
];

export function DonutByCategory({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  return (
    <div className='rounded-2xl bg-card shadow-sm p-4'>
      <h3 className='text-sm font-medium mb-2'>{title}</h3>
      <ResponsiveContainer width='100%' height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey='value'
            nameKey='name'
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign='bottom' height={24} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
