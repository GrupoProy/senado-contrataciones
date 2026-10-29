import { useState } from 'react';
import { Users, Plus, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { UserStatusBadge } from '@/components/shared/user-status-badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { useUsuarios } from '../hooks/use-usuarios';
import { getInitials, formatRelative } from '@/lib/utils';
import { UsuarioFormDialog } from '../components/usuario-form-dialog';
import { UsuarioDetalleDialog } from '../components/usuario-detalle-dialog';
import { UsuarioEditarDialog } from '../components/usuario-editar-dialog';
import type { Usuario } from '../types/usuario-types';

export function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [editarId, setEditarId] = useState<number | null>(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useUsuarios({
    page,
    limit: 20,
    search: debounced || undefined,
  });

  const columns: Column<Usuario>[] = [
    {
      key: 'usuario',
      header: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(u.nombres, u.primer_apellido)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {u.nombres} {u.primer_apellido}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{u.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-xs">{u.email}</span>,
    },
    {
      key: 'unidad',
      header: 'Unidad',
      render: (u) => (
        <span className="text-xs text-muted-foreground">{u.unidad_nombre ?? '—'}</span>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) =>
        u.rol_nombre ? (
          <span className="text-xs font-medium">{u.rol_nombre}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin rol</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (u) => <UserStatusBadge estado={u.estado} />,
    },
    {
      key: 'ultimoAcceso',
      header: 'Último acceso',
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.ultimo_acceso ? formatRelative(u.ultimo_acceso) : 'Nunca'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[80px] text-right',
      render: (u) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditarId(u.id);
          }}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios del sistema"
        icon={Users}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus />
            Nuevo usuario
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Buscar por nombre, username o email…"
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
        rowKey={(u) => u.id}
        onRowClick={(u) => setDetalleId(u.id)}
        emptyState={{
          icon: Users,
          title: 'Sin usuarios',
          description: 'No se encontraron usuarios con los filtros actuales.',
        }}
      />

      <UsuarioFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <UsuarioDetalleDialog
        usuarioId={detalleId}
        open={!!detalleId}
        onOpenChange={(o) => !o && setDetalleId(null)}
      />

      <UsuarioEditarDialog
        usuarioId={editarId}
        open={!!editarId}
        onOpenChange={(o) => !o && setEditarId(null)}
      />
    </div>
  );
}
