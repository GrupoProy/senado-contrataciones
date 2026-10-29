import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Inbox, type LucideIcon } from 'lucide-react';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// ✅ IMPORTAMOS EL TOOLTIP
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  limitOptions?: number[];
  onLimitChange?: (limit: number) => void;
  emptyState?: {
    icon: LucideIcon;
    title: string;
    description?: string;
  };
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  rowTooltip?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  total = 0,
  page = 1,
  limit = 10,
  onPageChange,
  limitOptions = [10, 20, 50, 100],
  onLimitChange,
  emptyState,
  rowKey,
  onRowClick,
  rowClassName,
  rowTooltip,
}: DataTableProps<T>) {
  const isAll = limit === 0 || limit >= 10000;
  const effectiveLimit = isAll ? total : limit;
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit));
  const showPagination = total > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      description={emptyState.description}
                    />
                  ) : (
                    <EmptyState icon={Inbox} title="Sin datos" description="No hay registros." />
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = rowKey(row) ?? `row-${index}`;
                const tooltipContent = rowTooltip?.(row);

                const trElement = (
                  <tr
                    key={key}
                    className={cn(
                      'transition-colors hover:bg-accent/50',
                      onRowClick && 'cursor-pointer',
                      rowClassName?.(row)
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3', col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );

                if (tooltipContent) {
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>{trElement}</TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        {tooltipContent}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return trElement;
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination && !isLoading && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-medium">{(page - 1) * effectiveLimit + 1}</span> –{' '}
            <span className="font-medium">{Math.min(page * effectiveLimit, total)}</span> de{' '}
            <span className="font-medium">{total}</span>
          </p>

          <div className="flex items-center gap-4">
            {onLimitChange && (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Filas por pág:
                </span>
                <Select
                  value={isAll ? '0' : limit.toString()}
                  onValueChange={(v) => onLimitChange(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {limitOptions.map((opt) => (
                      <SelectItem key={opt} value={opt.toString()}>
                        {opt === 0 ? 'Todos' : opt}
                      </SelectItem>
                    ))}
                    {!limitOptions.includes(0) && <SelectItem value="0">Todos</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isAll && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange?.(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-3 text-xs font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange?.(page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
