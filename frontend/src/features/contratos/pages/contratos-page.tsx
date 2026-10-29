import { useState } from 'react';
import { FileSignature, Plus, X, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { CodeBadge } from '@/components/shared/code-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useContratos } from '../hooks/use-contratos';
import { ContratoFormDialog } from '../components/contrato-form-dialog';
import { ContratoDetalleDialog } from '../components/contrato-detalle-dialog';
import { formatDate, formatRelative, cn } from '@/lib/utils';
import type { Contrato, EstadoContrato } from '../types/contrato-types';

const ESTADO_STYLES: Record<EstadoContrato, string> = {
  EN_CURSO: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  CONCLUIDO: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  ANULADO: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  PENDIENTE: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
};

const ESTADO_LABEL: Record<EstadoContrato, string> = {
  EN_CURSO: 'En curso',
  CONCLUIDO: 'Concluido',
  ANULADO: 'Anulado',
  PENDIENTE: 'Pendiente',
};

export function ContratosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useContratos({
    page,
    limit: 20,
    search: debounced || undefined,
    estadoCodigo: (estado as EstadoContrato) || undefined,
  });

  const items = data?.data ?? [];
  const hayFiltros = !!(search || estado);

  const columns: Column<Contrato>[] = [
    {
      key: 'numero',
      header: 'Número',
      className: 'w-[200px]',
      render: (c) => <CodeBadge codigo={c.numero} />,
    },
    {
      key: 'persona',
      header: 'Persona',
      className: 'w-[220px]',
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{c.personaNombres}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {c.personaDocumento}
          </p>
        </div>
      ),
    },
    {
      key: 'requerimiento',
      header: 'Requerimiento',
      className: 'w-[180px]',
      render: (c) => (
        <span className="font-mono text-xs">
          {c.requerimientoCodigo ?? `#${c.requerimientoId}`}
        </span>
      ),
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      className: 'w-[220px]',
      render: (c) => (
        <div className="text-xs">
          <p>{formatDate(c.fechaDesde)}</p>
          <p className="text-muted-foreground">hasta {formatDate(c.fechaHasta)}</p>
        </div>
      ),
    },
    {
      key: 'salario',
      header: 'Salario',
      className: 'w-[140px]',
      render: (c) => (
        <span className="font-mono text-xs">
          {c.salarioMes
            ? `Bs. ${c.salarioMes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'w-[130px]',
      render: (c) => (
        <Badge variant="outline" className={cn('text-[10px]', ESTADO_STYLES[c.estadoCodigo])}>
          {ESTADO_LABEL[c.estadoCodigo]}
        </Badge>
      ),
    },
    {
      key: 'creado',
      header: 'Creado',
      className: 'w-[120px]',
      render: (c) => (
        <span className="text-xs text-muted-foreground">{formatRelative(c.fechaCreacion)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Administración de contratos formales del sistema"
        icon={FileSignature}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus />
            Nuevo contrato
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por número, persona o documento…"
          className="w-full max-w-md"
        />

        <Select
          value={estado || 'ALL'}
          onValueChange={(v) => {
            setEstado(v === 'ALL' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2 truncate">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Estado" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="EN_CURSO">En curso</SelectItem>
            <SelectItem value="CONCLUIDO">Concluido</SelectItem>
            <SelectItem value="ANULADO">Anulado</SelectItem>
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setEstado('');
              setPage(1);
            }}
          >
            <X />
            Limpiar
          </Button>
        )}
      </div>

      <DataTable
        data={items}
        columns={columns}
        isLoading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        rowKey={(c) => c.id}
        onRowClick={(c) => setDetalleId(c.id)}
        emptyState={{
          icon: FileSignature,
          title: 'Sin contratos',
          description: hayFiltros
            ? 'No hay resultados para los filtros aplicados.'
            : 'Registre el primer contrato desde un requerimiento aprobado.',
        }}
      />

      <ContratoFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ContratoDetalleDialog
        contratoId={detalleId}
        open={!!detalleId}
        onOpenChange={(o: boolean) => !o && setDetalleId(null)}
      />
    </div>
  );
}
