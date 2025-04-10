// src/components/ui/Table.tsx
import { classNames } from '../../lib/classNames';

interface TableProps {
    children: React.ReactNode;
    className?: string;
}

interface TableCellProps extends TableProps {
    colSpan?: number;
    rowSpan?: number;
    align?: 'left' | 'center' | 'right';
}

export const Table = ({ children, className }: TableProps) => {
    return (
        <div className={classNames('overflow-x-auto rounded-lg shadow', className)}>
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                {children}
            </table>
        </div>
    );
};

export const TableHead = ({ children, className }: TableProps) => {
    return (
        <thead className={classNames('bg-gray-50 text-gray-700 border-b border-gray-200', className)}>
            {children}
        </thead>
    );
};

export const TableBody = ({ children, className }: TableProps) => {
    return (
        <tbody className={classNames('divide-y divide-gray-100 bg-white', className)}>
            {children}
        </tbody>
    );
};

export const TableRow = ({ children, className }: TableProps) => {
    return (
        <tr className={classNames('transition-colors duration-150 hover:bg-gray-100 even:bg-gray-50/30', className)}>
            {children}
        </tr>
    );
};

export const TableCell = ({ children, className, colSpan }: TableCellProps) => {
    return (
        <td colSpan={colSpan} className={classNames('py-3 px-3 text-gray-700 align-middle', className)}>
            {children}
        </td>
    );
};

export const TableHeader = ({ children, className }: TableProps) => {
    return (
        <th className={classNames('py-3 px-3 text-left bg-gray-200 text-gray-700 uppercase tracking-wider text-sm', className)}>
            {children}
        </th>
    );
};