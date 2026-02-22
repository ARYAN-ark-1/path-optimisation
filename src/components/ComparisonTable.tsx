import './ComparisonTable.css';
import CountUp from 'react-countup';

interface ComparisonTableProps {
    data: any[] | null;
}

export const ComparisonTable = ({ data }: ComparisonTableProps) => {
    const defaultAlgorithms = [
        { name: 'A* Search', pathCost: 56.4, time: 1.2, nodes: 4520, smooth: 'Low' },
        { name: 'Hierarchical (HPA*)', pathCost: 58.1, time: 0.4, nodes: 850, smooth: 'Medium' },
        { name: 'Hybrid GA', pathCost: 42.8, time: 1.4, nodes: 1250, smooth: 'High' },
    ];

    const algorithms = data || defaultAlgorithms;

    return (
        <div className="table-wrapper text-primary">
            <table className="comparison-table">
                <thead>
                    <tr>
                        <th>Algorithm</th>
                        <th>Path Cost (m)</th>
                        <th>Exec Time (ms)</th>
                        <th>Nodes Expanded</th>
                        <th>Smoothness</th>
                    </tr>
                </thead>
                <tbody>
                    {algorithms.map((algo, idx) => (
                        <tr key={idx} className="table-row">
                            <td className="font-display font-bold text-gradient">{algo.name}</td>
                            <td>
                                <CountUp end={algo.pathCost} decimals={1} duration={2} delay={0.5} />
                            </td>
                            <td>
                                <CountUp end={algo.time} decimals={1} duration={2} delay={0.5} />
                            </td>
                            <td>
                                <CountUp end={algo.nodes} duration={2.5} separator="," delay={0.5} />
                            </td>
                            <td>
                                <span className={`smooth-badge ${algo.smooth.toLowerCase()}`}>
                                    {algo.smooth}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
