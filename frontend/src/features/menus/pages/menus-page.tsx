import { Menu as MenuIcon, Plus, Power } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMenus, useCambiarEstadoMenu } from '../hooks/use-menus';
import { cn } from '@/lib/utils';
import type { Menu } from '../types/menu-types';

export function MenusPage() {
  const { data, isLoading } = useMenus();
  const cambiarEstado = useCambiarEstadoMenu();

  const columns: Column<Menu>[] = [
    {
      key: 'etiqueta',
      header: 'Etiqueta',
      render: (m) => <span className="font-medium">{m.etiqueta}</span>,
    },
    {
      key: 'clave',
      header: 'Clave',
      render: (m) => <span className="font-mono text-xs text-muted-foreground">{m.clave}</span>,
    },
    {
      key: 'ruta',
      header: 'Ruta',
      render: (m) => <span className="text-xs">{m.ruta || '—'}</span>,
    },
    { key: 'orden', header: 'Orden', render: (m) => <span className="text-xs">{m.orden}</span> },
    {
      key: 'estado',
      header: 'Estado',
      render: (m) => (
        <Badge variant={m.estado === 'ACT' ? 'default' : 'secondary'}>
          {m.estado === 'ACT' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[80px] text-right',
      render: (m) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            cambiarEstado.mutate({ id: m.id, estado: m.estado === 'ACT' ? 'INA' : 'ACT' })
          }
        >
          <Power
            className={cn('size-4', m.estado === 'ACT' ? 'text-destructive' : 'text-emerald-500')}
          />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menús"
        description="Gestión de opciones del sistema"
        icon={MenuIcon}
        actions={
          <Button>
            <Plus /> Nuevo Menú
          </Button>
        }
      />
      <DataTable
        data={data ?? []}
        columns={columns}
        isLoading={isLoading}
        rowKey={(m) => m.id}
        emptyState={{ icon: MenuIcon, title: 'Sin menús' }}
      />
    </div>
  );
}
