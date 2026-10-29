import { useState } from 'react';
import { Shield, Plus, Power, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRoles, useCambiarEstadoRol } from '../hooks/use-roles';
import { RolFormDialog } from '../components/rol-form-dialog';
import type { Rol } from '../types/rol-types';
import { cn } from '@/lib/utils';

export function RolesPage() {
  const { data, isLoading } = useRoles();
  const cambiarEstado = useCambiarEstadoRol();
  const [formOpen, setFormOpen] = useState(false);
  const [rolAEditar, setRolAEditar] = useState<Rol | null>(null);

  const columns: Column<Rol>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (r) => <span className="font-mono text-xs font-semibold">{r.codigo}</span>,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (r) => (
        <div>
          <p className="font-medium">{r.nombre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{r.descripcion ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'permisos',
      header: 'Permisos',
      render: (r) => (
        <Badge variant="secondary" className="font-mono">
          {r.total_permisos ?? 0}
        </Badge>
      ),
    },
    {
      key: 'menus',
      header: 'Menús',
      render: (r) => (
        <Badge variant="secondary" className="font-mono">
          {r.total_menus ?? 0}
        </Badge>
      ),
    },
    {
      key: 'usuarios',
      header: 'Usuarios',
      render: (r) => (
        <Badge variant="secondary" className="font-mono">
          {r.total_usuarios ?? 0}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (r) => (
        <Badge
          variant="outline"
          className={cn(
            r.estado === 'ACT'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400'
          )}
        >
          {r.estado === 'ACT' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[120px] text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setRolAEditar(r);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              cambiarEstado.mutate({
                id: r.id,
                estado: r.estado === 'ACT' ? 'INA' : 'ACT',
              })
            }
            title={r.estado === 'ACT' ? 'Inactivar' : 'Activar'}
          >
            <Power
              className={cn('size-4', r.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500')}
            />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Administración de roles del sistema"
        icon={Shield}
        actions={
          <Button
            onClick={() => {
              setRolAEditar(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Nuevo rol
          </Button>
        }
      />

      <DataTable
        data={data ?? []}
        columns={columns}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyState={{
          icon: Shield,
          title: 'Sin roles',
          description: 'No hay roles configurados.',
        }}
      />

      <RolFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setRolAEditar(null);
        }}
        rolAEditar={rolAEditar}
      />
    </div>
  );
}
