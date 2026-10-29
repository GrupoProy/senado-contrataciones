import { useState } from 'react';
import { Users2, Plus, Pencil, Power, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useSenadores, useCambiarEstadoSenador, useEliminarSenador } from '../hooks/use-senadores';
import { SenadorFormDialog } from '../components/senador-form-dialog';
import { formatDate, cn } from '@/lib/utils';
import type { Senador } from '../types/senador-types';

export function SenadoresPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [senadorAEditar, setSenadorAEditar] = useState<Senador | null>(null);
  const [senadorAEliminar, setSenadorAEliminar] = useState<Senador | null>(null);

  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useSenadores({ page, limit: 20, search: debounced || undefined });

  const cambiarEstado = useCambiarEstadoSenador();
  const eliminar = useEliminarSenador();

  const columns: Column<Senador>[] = [
    {
      key: 'nombre',
      header: 'Senador(a)',
      render: (s) => (
        <div>
          <p className="font-medium">
            {s.primerApellido} {s.segundoApellido ?? ''}
          </p>
          <p className="text-xs text-muted-foreground">{s.nombres}</p>
        </div>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      render: (s) => (
        <span className="font-mono text-xs">
          {s.tipoDocumento} {s.numeroDocumento}
        </span>
      ),
    },
    {
      key: 'sigla',
      header: 'Sigla Política',
      render: (s) =>
        s.siglaPolitica ? (
          <Badge variant="outline">{s.siglaPolitica}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'periodo',
      header: 'Periodo',
      render: (s) => (
        <span className="text-xs text-muted-foreground">
          {s.periodoInicio ? formatDate(s.periodoInicio) : '—'} -{' '}
          {s.periodoFin ? formatDate(s.periodoFin) : '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (s) => (
        <Badge variant={s.estado === 'ACT' ? 'default' : 'secondary'}>
          {s.estado === 'ACT' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[130px] text-right',
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSenadorAEditar(s);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              cambiarEstado.mutate({ id: s.id, estado: s.estado === 'ACT' ? 'INA' : 'ACT' })
            }
            title={s.estado === 'ACT' ? 'Suspender' : 'Reactivar'}
          >
            <Power
              className={cn('size-4', s.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500')}
            />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setSenadorAEliminar(s)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Senadores"
        description="Padrón de Senadores de la Cámara"
        icon={Users2}
        actions={
          <Button
            onClick={() => {
              setSenadorAEditar(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nuevo Senador
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Buscar por nombre, documento o partido…"
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
        rowKey={(s) => s.id}
        emptyState={{
          icon: Users2,
          title: 'Sin senadores',
          description: 'No se encontraron resultados.',
        }}
      />

      <SenadorFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setSenadorAEditar(null);
        }}
        senadorAEditar={senadorAEditar}
      />

      <ConfirmDialog
        open={!!senadorAEliminar}
        onOpenChange={(o) => !o && setSenadorAEliminar(null)}
        title="Eliminar Senador"
        description={`¿Está seguro de eliminar permanentemente a ${senadorAEliminar?.nombres} ${senadorAEliminar?.primerApellido}?`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={eliminar.isPending}
        onConfirm={() => {
          if (senadorAEliminar) {
            eliminar.mutate(senadorAEliminar.id, {
              onSuccess: () => setSenadorAEliminar(null),
            });
          }
        }}
      />
    </div>
  );
}
