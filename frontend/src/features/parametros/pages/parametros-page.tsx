import { useState } from 'react';
import { Settings, Pencil, RefreshCw, Loader2, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParametros, useRecargarCache } from '../hooks/use-parametros';
import { ParametroFormDialog } from '../components/parametro-form-dialog';
import type { Parametro } from '../types/parametro-types';

export function ParametrosPage() {
  const [grupo, setGrupo] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [parametroAEditar, setParametroAEditar] = useState<Parametro | null>(null);

  const { data: parametros, isLoading } = useParametros(grupo === 'ALL' ? undefined : grupo);
  const recargar = useRecargarCache();

  const items = (parametros ?? []).filter(
    (p) =>
      p.clave.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Parametro>[] = [
    {
      key: 'grupo',
      header: 'Grupo',
      className: 'w-[120px]',
      render: (p) => (
        <Badge variant="outline" className="text-[10px]">
          {p.grupo}
        </Badge>
      ),
    },
    {
      key: 'clave',
      header: 'Clave',
      render: (p) => <span className="font-mono text-xs font-medium">{p.clave}</span>,
    },
    {
      key: 'valor',
      header: 'Valor Actual',
      className: 'w-[150px]',
      render: (p) => {
        const esBooleano = p.tipo_dato === 'BOOLEAN';
        return (
          <span
            className={`line-clamp-2 break-all rounded px-2 py-1 font-mono text-xs ${
              esBooleano && p.valor === 'true'
                ? 'bg-emerald-500/10 text-emerald-600'
                : esBooleano && p.valor === 'false'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-muted text-muted-foreground'
            }`}
            title={p.valor}
          >
            {p.valor}
          </span>
        );
      },
    },
    {
      key: 'tipo',
      header: 'Tipo',
      className: 'w-[100px]',
      render: (p) => (
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {p.tipo_dato}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (p) => (
        <span className="line-clamp-2 text-xs" title={p.descripcion ?? ''}>
          {p.descripcion || '—'}
        </span>
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
          disabled={!p.es_editable}
          title={p.es_editable ? 'Editar parámetro' : 'No editable'}
          onClick={() => {
            setParametroAEditar(p);
            setFormOpen(true);
          }}
        >
          <Pencil
            className={`size-4 ${p.es_editable ? 'text-primary' : 'text-muted-foreground/30'}`}
          />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parámetros del Sistema"
        description="Configuraciones globales y variables de la plataforma"
        icon={Settings}
        actions={
          <Button variant="outline" onClick={() => recargar.mutate()} disabled={recargar.isPending}>
            {recargar.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Recargar Caché
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por clave o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={grupo} onValueChange={setGrupo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los grupos</SelectItem>
            {/* ✅ Ajustado a tus grupos reales */}
            <SelectItem value="SEGURIDAD">SEGURIDAD</SelectItem>
            <SelectItem value="FLUJO">FLUJO</SelectItem>
            <SelectItem value="JOBS">JOBS</SelectItem>
            <SelectItem value="ALERTAS">ALERTAS</SelectItem>
            <SelectItem value="CONTRATOS">CONTRATOS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={items}
        columns={columns}
        isLoading={isLoading}
        rowKey={(p) => p.clave}
        emptyState={{
          icon: Settings,
          title: 'Sin parámetros',
          description: 'No se encontraron parámetros con los filtros seleccionados.',
        }}
      />

      <ParametroFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setParametroAEditar(null);
        }}
        parametro={parametroAEditar}
      />
    </div>
  );
}
