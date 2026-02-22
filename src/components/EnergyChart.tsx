import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface EnergyChartProps {
    data: any[] | null;
}

export const EnergyChart = ({ data }: EnergyChartProps) => {
    const defaultData = [
        { name: 'A*', energy: 3500, color: 'var(--electric-purple)' },
        { name: 'HPA*', energy: 1200, color: '#facc15' },
        { name: 'Hybrid GA', energy: 2450, color: 'var(--neon-blue)' },
    ];

    const chartData = data ? data.map(d => ({
        name: d.name === 'Hierarchical (HPA*)' ? 'HPA*' : d.name === 'A* Search' ? 'A*' : d.name,
        energy: Math.round(d.energy),
        color: d.color
    })) : defaultData;

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ backgroundColor: 'rgba(5, 11, 20, 0.9)', border: '1px solid var(--neon-blue)', borderRadius: '8px' }}
                    />
                    <Bar
                        dataKey="energy"
                        name="Energy (kJ)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
