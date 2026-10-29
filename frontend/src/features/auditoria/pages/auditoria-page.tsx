import { useState } from 'react';
import { ClipboardList, Eye, Filter, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../api/auditoria-api';
import { formatDateTime } from '@/lib/utils';
import type { Auditoria } from '../types/auditoria-types';
import { useDebounce } from '@/hooks/use-debounce';

export function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tabla, setTabla] = useState<string>('');
  const [operacion, setOperacion] = useState<string>('');
  const [detalle, setDetalle] = useState<Auditoria | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', page, debouncedSearch, tabla, operacion],
    queryFn: () =>
      auditoriaApi.listar({
        page,
        limit: 20,
        usuario: debouncedSearch || undefined,
        tabla: tabla || undefined,
        operacion: operacion || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const hayFiltros = !!(search || tabla || operacion);

  const columns: Column<Auditoria>[] = [
    {
      key: 'fecha',
      header: 'Fecha / Hora',
      className: 'w-[160px]',
      render: (a) => <span className="text-xs font-medium">{formatDateTime(a.cambiadoEn)}</span>,
    },
    {
      key: 'usuario',
      header: 'Usuario',
      className: 'w-[120px]',
      render: (a) => <span className="font-mono text-xs">{a.cambiadoPor}</span>,
    },
    {
      key: 'tabla',
      header: 'Tabla afectada',
      render: (a) => <span className="text-xs text-muted-foreground">{a.tablaNombre}</span>,
    },
    {
      key: 'op',
      header: 'Operación',
      className: 'w-[120px]',
      render: (a) => (
        <Badge
          variant={
            a.operacion === 'INSERT'
              ? 'default'
              : a.operacion === 'DELETE'
                ? 'destructive'
                : 'secondary'
          }
        >
          {a.operacion}
        </Badge>
      ),
    },
    {
      key: 'id',
      header: 'ID Reg.',
      className: 'w-[100px]',
      render: (a) => <span className="font-mono text-xs">{a.registroId ?? '—'}</span>,
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[60px] text-right',
      render: (a) => (
        <Button variant="ghost" size="icon-sm" onClick={() => setDetalle(a)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Registro histórico de cambios en el sistema"
        icon={ClipboardList}
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por usuario…"
          className="w-full max-w-sm"
        />

        <Select
          value={operacion || 'ALL'}
          onValueChange={(v) => {
            setOperacion(v === 'ALL' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2 truncate">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Operación" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las operaciones</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setOperacion('');
              setTabla('');
              setPage(1);
            }}
          >
            <X /> Limpiar
          </Button>
        )}
      </div>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        rowKey={(a) => a.auditId}
        emptyState={{
          icon: ClipboardList,
          title: 'Sin registros',
          description: 'No hay movimientos de auditoría que coincidan con los filtros.',
        }}
      />

      {/* Modal de detalle JSON */}
      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Cambio</DialogTitle>
          </DialogHeader>

          {detalle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tabla</p>
                  <p className="font-mono">{detalle.tablaNombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Operación</p>
                  <p className="font-mono">{detalle.operacion}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                  <p className="font-mono">{detalle.cambiadoPor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Origen</p>
                  <p className="font-mono">{detalle.ipOrigen ?? '—'}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Cambios realizados</p>
                {detalle.diferencia ? (
                  <pre className="max-h-[40vh] overflow-auto rounded-lg bg-muted p-4 text-xs">
                    {JSON.stringify(detalle.diferencia, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {detalle.operacion === 'INSERT'
                      ? 'Registro creado (ver datos nuevos).'
                      : 'Registro eliminado (ver datos anteriores).'}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
