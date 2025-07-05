import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7f50',
  '#0088fe',
  '#00c49f',
  '#ffbb28',
];

export function SummaryPieChart({
  data,
  title,
}: {
  data: { name: string; value: number }[];
  title: string;
}) {
  return (
    <Card>
      <CardContent>
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <ResponsiveContainer width='100%' height={300}>
          <PieChart>
            <Pie
              data={data}
              cx='50%'
              cy='50%'
              outerRadius={100}
              fill='#8884d8'
              dataKey='value'
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
