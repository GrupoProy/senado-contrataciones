import { useState } from 'react';
import { ListTree, Plus, ChevronRight, Power } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useCatalogos,
  useCatalogo,
  useCambiarEstadoCatalogo,
  useCambiarEstadoDetalle,
} from '../hooks/use-catalogos';
import { cn } from '@/lib/utils';
import type { Catalogo } from '../types/catalogo-types';

export function CatalogosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useCatalogos({
    page,
    limit: 20,
    search: debounced || undefined,
  });
  const cambiarEstado = useCambiarEstadoCatalogo();

  const columns: Column<Catalogo>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (c) => <span className="font-mono text-xs font-semibold">{c.codigo}</span>,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (c) => (
        <div>
          <p className="font-medium">{c.nombre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{c.descripcion ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'detalles',
      header: 'Detalles',
      render: (c) => (
        <Badge variant="secondary" className="font-mono">
          {c.total_detalles ?? 0}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <Badge
          variant="outline"
          className={cn(
            c.estado === 'ACT'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400'
          )}
        >
          {c.estado === 'ACT' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[140px] text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              setDetalleId(c.id);
            }}
            title="Ver detalles"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              cambiarEstado.mutate({
                id: c.id,
                estado: c.estado === 'ACT' ? 'INA' : 'ACT',
              });
            }}
            title={c.estado === 'ACT' ? 'Inactivar' : 'Activar'}
          >
            <Power
              className={cn('size-4', c.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500')}
            />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogos"
        description="Administración de catálogos y sus valores"
        icon={ListTree}
        actions={
          <Button>
            <Plus />
            Nuevo catálogo
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Buscar catálogo…"
        className="max-w-md"
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        rowKey={(c) => c.id}
        emptyState={{
          icon: ListTree,
          title: 'Sin catálogos',
          description: 'No hay catálogos configurados.',
        }}
      />

      <CatalogoDetalleDialog
        catalogoId={detalleId}
        open={!!detalleId}
        onOpenChange={(o) => !o && setDetalleId(null)}
      />
    </div>
  );
}

function CatalogoDetalleDialog({
  catalogoId,
  open,
  onOpenChange,
}: {
  catalogoId: number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data, isLoading } = useCatalogo(catalogoId);
  const cambiarEstado = useCambiarEstadoDetalle();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isLoading ? 'Cargando…' : `Detalles de ${data?.nombre}`}</DialogTitle>
        </DialogHeader>

        {!isLoading && data && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <span className="font-mono text-xs font-semibold">{data.codigo}</span>
              <span className="text-xs text-muted-foreground">{data.nombre}</span>
            </div>

            {data.detalles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay detalles configurados.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {data.detalles.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold">{d.codigo}</span>
                        <Badge variant="outline" className="text-[10px]">
                          orden {d.orden}
                        </Badge>
                        {d.estado === 'INA' && (
                          <Badge variant="secondary" className="text-[10px]">
                            inactivo
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm">{d.nombre}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        cambiarEstado.mutate({
                          detalleId: d.id,
                          estado: d.estado === 'ACT' ? 'INA' : 'ACT',
                        })
                      }
                    >
                      <Power
                        className={cn(
                          'size-4',
                          d.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500'
                        )}
                      />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
