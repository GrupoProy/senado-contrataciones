import { Key, Plus, Power } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermisos, useCambiarEstadoPermiso } from '../hooks/use-permisos';
import { cn } from '@/lib/utils';
import type { Permiso } from '../types/permiso-types';

export function PermisosPage() {
  const { data, isLoading } = usePermisos();
  const cambiarEstado = useCambiarEstadoPermiso();

  const columns: Column<Permiso>[] = [
    {
      key: 'clave',
      header: 'Clave',
      render: (p) => <span className="font-mono text-xs font-semibold">{p.clave}</span>,
    },
    {
      key: 'modulo',
      header: 'Módulo',
      render: (p) => <span className="text-xs text-muted-foreground">{p.modulo}</span>,
    },
    { key: 'accion', header: 'Acción', render: (p) => <Badge variant="outline">{p.accion}</Badge> },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (p) => <span className="text-sm">{p.descripcion || '—'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p) => (
        <Badge variant={p.estado === 'ACT' ? 'default' : 'secondary'}>
          {p.estado === 'ACT' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[80px] text-right',
      render: (p) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            cambiarEstado.mutate({ id: p.id, estado: p.estado === 'ACT' ? 'INA' : 'ACT' })
          }
        >
          <Power
            className={cn('size-4', p.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500')}
          />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permisos"
        description="Gestión de permisos base del sistema"
        icon={Key}
        actions={
          <Button>
            <Plus /> Nuevo Permiso
          </Button>
        }
      />
      <DataTable
        data={data ?? []}
        columns={columns}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        emptyState={{ icon: Key, title: 'Sin permisos' }}
      />
    </div>
  );
}
