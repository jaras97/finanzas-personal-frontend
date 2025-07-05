import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

export function SummaryLineChart({
  data,
}: {
  data: { date: string; income: number; expense: number }[];
}) {
  return (
    <Card>
      <CardContent>
        <h3 className='text-lg font-semibold mb-2'>
          Evolución de Ingresos y Gastos
        </h3>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={data}>
            <XAxis dataKey='date' />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Line
              type='monotone'
              dataKey='income'
              stroke='#82ca9d'
              strokeWidth={2}
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='expense'
              stroke='#ff7f50'
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
