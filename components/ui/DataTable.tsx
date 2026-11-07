import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: Extract<keyof T, string>;
  title: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  /** Shown instead of a bare "No data available" when the table is empty. */
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className,
  emptyState,
}: DataTableProps<T>) {
  type ColumnKey = Extract<keyof T, string>;

  const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col, index) => (
              <th
                key={`${col.key}-${index}`}
                className={clsx(
                  'py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.sortable && 'cursor-pointer hover:bg-gray-50 transition-colors'
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className={clsx(
                  'flex items-center gap-1',
                  col.align === 'right' && 'justify-end',
                  col.align === 'center' && 'justify-center'
                )}>
                  {col.title}
                  {col.sortable && (
                    <span className="text-gray-400 flex-shrink-0">
                      {sortKey === col.key ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} className="opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sortedData.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'transition-colors',
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'
              )}
            >
              {columns.map((col, index) => (
                <td
                  key={`${keyExtractor(row)}-${col.key}-${index}`}
                  className={clsx(
                    'py-3 px-4 text-sm text-gray-700 whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center text-gray-400 text-sm">
                {emptyState ?? 'No data available'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
