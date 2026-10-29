import { useState } from 'react';
import { Users, Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { usePersonas, useEliminarPersona } from '../hooks/use-personas';
import { PersonaFormDialog } from '../components/persona-form-dialog';
import { formatDate } from '@/lib/utils';
import type { Persona } from '../types/persona-types';

export function PersonasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [personaAEditar, setPersonaAEditar] = useState<Persona | null>(null);
  const [personaAEliminar, setPersonaAEliminar] = useState<Persona | null>(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = usePersonas({
    page,
    limit: 20,
    search: debounced || undefined,
  });

  const eliminar = useEliminarPersona();

  const columns: Column<Persona>[] = [
    {
      key: 'documento',
      header: 'Documento',
      render: (p) => (
        <span className="font-mono text-xs">
          {p.tipo_documento} {p.numero_documento}
          {p.complemento && `-${p.complemento}`}
        </span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre completo',
      render: (p) => (
        <div>
          <p className="font-medium">
            {p.primer_apellido} {p.segundo_apellido ?? ''}
          </p>
          <p className="text-xs text-muted-foreground">{p.nombres}</p>
        </div>
      ),
    },
    {
      key: 'nacimiento',
      header: 'F. Nacimiento',
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.fecha_nacimiento ? formatDate(p.fecha_nacimiento) : '—'}
        </span>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (p) => (
        <div>
          <p className="text-xs">{p.email ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{p.telefono ?? ''}</p>
        </div>
      ),
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
      className: 'w-[100px] text-right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              setPersonaAEditar(p);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              setPersonaAEliminar(p);
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personas"
        description="Registro central de personas del sistema"
        icon={Users}
        actions={
          <Button
            onClick={() => {
              setPersonaAEditar(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Nueva persona
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Buscar por nombre o documento…"
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
        rowKey={(p) => p.id}
        emptyState={{
          icon: Users,
          title: 'Sin personas registradas',
          description: 'Las personas se crean al registrar requerimientos o directamente aquí.',
        }}
      />

      <PersonaFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setPersonaAEditar(null);
        }}
        personaAEditar={personaAEditar}
      />

      <ConfirmDialog
        open={!!personaAEliminar}
        onOpenChange={(o) => !o && setPersonaAEliminar(null)}
        title="Eliminar persona"
        description={`¿Eliminar lógicamente a ${personaAEliminar?.nombres} ${personaAEliminar?.primer_apellido}?`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={eliminar.isPending}
        onConfirm={() => {
          if (personaAEliminar) {
            eliminar.mutate(personaAEliminar.id, {
              onSuccess: () => setPersonaAEliminar(null),
            });
          }
        }}
      />
    </div>
  );
}
