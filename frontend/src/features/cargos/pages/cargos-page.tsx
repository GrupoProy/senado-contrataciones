import { useState } from 'react';
import { Briefcase, Plus, Pencil, Power } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useCargos, useCambiarEstadoCargo } from '../hooks/use-cargos';
import { CargoFormDialog } from '../components/cargo-form-dialog';
import { cn } from '@/lib/utils';
import type { Cargo } from '../types/cargo-types';

export function CargosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [cargoAEditar, setCargoAEditar] = useState<Cargo | null>(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useCargos({ page, limit: 20, search: debounced || undefined });
  const cambiarEstado = useCambiarEstadoCargo();

  const columns: Column<Cargo>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (c) => <span className="font-mono text-xs font-semibold">{c.codigo}</span>,
    },
    {
      key: 'nombre',
      header: 'Cargo',
      render: (c) => (
        <div>
          <p className="font-medium">{c.nombre}</p>
          <p className="text-xs text-muted-foreground">{c.unidad_nombre ?? 'Sin unidad'}</p>
        </div>
      ),
    },
    {
      key: 'nivel',
      header: 'Nivel / Clase',
      render: (c) => (
        <div className="flex gap-1">
          <Badge variant="outline" className="text-[10px]">
            {c.nivel}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {c.clase}
          </Badge>
        </div>
      ),
    },
    {
      key: 'salario',
      header: 'Salario',
      render: (c) => (
        <span className="font-mono text-xs">
          Bs. {c.salario_mes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <Badge variant={c.estado === 'ACT' ? 'default' : 'secondary'}>
          {c.estado === 'ACT' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[100px] text-right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setCargoAEditar(c);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              cambiarEstado.mutate({ id: c.id, estado: c.estado === 'ACT' ? 'INA' : 'ACT' })
            }
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
        title="Cargos"
        description="Administración de plazas y salarios"
        icon={Briefcase}
        actions={
          <Button
            onClick={() => {
              setCargoAEditar(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nuevo Cargo
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Buscar por código o nombre…"
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
          icon: Briefcase,
          title: 'Sin cargos',
          description: 'Registre el primer cargo.',
        }}
      />

      <CargoFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setCargoAEditar(null);
        }}
        cargoAEditar={cargoAEditar}
      />
    </div>
  );
}
