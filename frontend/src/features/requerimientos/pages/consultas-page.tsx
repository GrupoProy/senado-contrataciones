import { useState } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusPill } from '@/components/shared/status-pill';
import { CodeBadge } from '@/components/shared/code-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
// ✅ Usamos rutas absolutas para no fallar
import { useConsultarRequerimientos } from '@/features/requerimientos/hooks/use-requerimientos';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { formatRelative } from '@/lib/utils';
import type { Requerimiento } from '@/features/requerimientos/types/requerimiento-types';

export function ConsultasPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [codigo, setCodigo] = useState('');
  const [documento, setDocumento] = useState('');
  const [apellido, setApellido] = useState('');
  const [unidadId, setUnidadId] = useState('');

  const debouncedCodigo = useDebounce(codigo, 300);
  const debouncedDocumento = useDebounce(documento, 300);
  const debouncedApellido = useDebounce(apellido, 300);

  const { data: unidades } = useUnidades({ soloActivas: true });
  const { data, isLoading } = useConsultarRequerimientos({
    page,
    limit: limit === 0 ? 10000 : limit,
    codigo: debouncedCodigo || undefined,
    documento: debouncedDocumento || undefined,
    apellido: debouncedApellido || undefined,
    unidadId: unidadId ? Number(unidadId) : undefined,
  });

  const items = data?.data ?? [];
  const hayFiltros = !!(codigo || documento || apellido || unidadId);

  const limpiarFiltros = () => {
    setCodigo('');
    setDocumento('');
    setApellido('');
    setUnidadId('');
    setPage(1);
  };

  const columns: Column<Requerimiento>[] = [
    {
      key: 'codigo',
      header: 'Código',
      className: 'w-[180px]',
      render: (r) => <CodeBadge codigo={r.codigo} fallbackId={r.id} />,
    },
    {
      key: 'titulo',
      header: 'Título',
      render: (r) => <span className="truncate font-medium">{r.titulo}</span>,
    },
    {
      key: 'persona',
      header: 'Persona',
      className: 'w-[180px]',
      render: (r) => (
        <div>
          <p className="text-xs font-medium">{r.personaNombres}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{r.personaDocumento}</p>
        </div>
      ),
    },
    {
      key: 'unidades',
      header: 'Unidades',
      className: 'w-[200px]',
      render: (r) => (
        <div>
          <p className="text-xs">{r.unidadSolicitanteNombre}</p>
          <p className="text-[10px] text-muted-foreground">{r.unidadActualNombre}</p>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'w-[150px]',
      render: (r) => <StatusPill estado={r.estadoCodigo} />,
    },
    {
      key: 'fecha',
      header: 'Creado',
      className: 'w-[100px]',
      render: (r) => (
        <span className="text-xs text-muted-foreground">{formatRelative(r.fechaCreacion)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultas de Requerimientos"
        description="Búsqueda avanzada por código, documento, apellido o unidad"
        icon={Search}
      />

      {/* Filtros */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label>Código Requerimiento</Label>
          <Input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value);
              setPage(1);
            }}
            placeholder="Ej. REQ-2026..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nro. Documento</Label>
          <Input
            value={documento}
            onChange={(e) => {
              setDocumento(e.target.value);
              setPage(1);
            }}
            placeholder="Ej. 12345678"
          />
        </div>
        <div className="space-y-2">
          <Label>Apellido</Label>
          <Input
            value={apellido}
            onChange={(e) => {
              setApellido(e.target.value);
              setPage(1);
            }}
            placeholder="Ej. PEREZ"
          />
        </div>
        <div className="space-y-2">
          <Label>Unidad</Label>
          <Select
            value={unidadId || 'ALL'}
            onValueChange={(v) => {
              setUnidadId(v === 'ALL' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las unidades</SelectItem>
              {unidades?.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          {hayFiltros && (
            <Button variant="ghost" onClick={limpiarFiltros} className="w-full">
              <X className="mr-2 size-4" /> Limpiar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de Resultados */}
      <DataTable
        data={items}
        columns={columns}
        isLoading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        limitOptions={[10, 20, 0]}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          // Aquí puedes abrir el modal de detalle si lo deseas
          console.log('Ver detalle del requerimiento', r.id);
        }}
        emptyState={{
          icon: FileText,
          title: 'Sin resultados',
          description: 'No se encontraron requerimientos con los filtros aplicados.',
        }}
      />
    </div>
  );
}
