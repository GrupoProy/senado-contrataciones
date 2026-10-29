import { useState } from 'react';
import { Building2, Plus, Pencil, Power } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useUnidades, useCambiarEstadoUnidad } from '../hooks/use-unidades';
import { UnidadFormDialog } from '../components/unidad-form-dialog'; // ✅ Importamos el modal
import { cn } from '@/lib/utils';
import type { Unidad } from '../types/unidad-types';

export function UnidadesPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useUnidades();
  const cambiarEstado = useCambiarEstadoUnidad();

  // ✅ Estados para el modal
  const [formOpen, setFormOpen] = useState(false);
  const [unidadAEditar, setUnidadAEditar] = useState<Unidad | null>(null);

  const items = (data ?? []).filter(
    (u) =>
      u.nombre.toLowerCase().includes(debounced.toLowerCase()) ||
      u.codigo.toLowerCase().includes(debounced.toLowerCase())
  );

  const columns: Column<Unidad>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (u) => <span className="font-mono text-xs font-semibold">{u.codigo}</span>,
    },
    {
      key: 'nombre',
      header: 'Unidad',
      render: (u) => (
        <div>
          <p className="font-medium">{u.nombre}</p>
          <p className="text-xs text-muted-foreground">{u.sigla ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'padre',
      header: 'Depende de',
      render: (u) => <span className="text-xs">{u.padre_nombre ?? 'Raíz'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (u) => (
        <Badge variant={u.estado === 'ACT' ? 'default' : 'secondary'}>
          {u.estado === 'ACT' ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[100px] text-right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          {/* ✅ Botón editar conectado */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setUnidadAEditar(u);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              cambiarEstado.mutate({ id: u.id, estado: u.estado === 'ACT' ? 'INA' : 'ACT' })
            }
          >
            <Power
              className={cn('size-4', u.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500')}
            />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades"
        description="Estructura organizacional"
        icon={Building2}
        actions={
          // ✅ Botón nueva unidad conectado
          <Button
            onClick={() => {
              setUnidadAEditar(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nueva Unidad
          </Button>
        }
      />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar unidad…"
        className="max-w-md"
      />
      <DataTable
        data={items}
        columns={columns}
        isLoading={isLoading}
        rowKey={(u) => u.id}
        emptyState={{ icon: Building2, title: 'Sin unidades' }}
      />

      {/* ✅ Renderizamos el Dialog */}
      <UnidadFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setUnidadAEditar(null); // Limpiamos al cerrar
        }}
        unidadAEditar={unidadAEditar}
      />
    </div>
  );
}
