import { useState } from 'react';
import {
  FileText,
  Plus,
  X,
  Send,
  CheckSquare,
  Square,
  Loader2,
  Layers,
  AlertCircle,
  Filter,
  Pencil,
  FileClock,
  CheckCircle2,
  Inbox,
  Printer,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusPill } from '@/components/shared/status-pill';
import { CodeBadge } from '@/components/shared/code-badge';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useRequerimientos,
  useDerivarMasivo,
  useRequerimientoStats,
} from '../hooks/use-requerimientos';
import { useCatalogoPorCodigo } from '@/features/catalogos/hooks/use-catalogos';
import { RequerimientoFormDialog } from '../components/requerimiento-form-dialog';
import { RequerimientoDetalleDialog } from '../components/requerimiento-detalle-dialog';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { formatRelative, cn } from '@/lib/utils';
import type { Requerimiento } from '../types/requerimiento-types';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { generarPdfDerivacion } from '@/lib/pdf-utils';

const PRIORIDAD_STYLES: Record<string, string> = {
  BAJA: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  MEDIA: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ALTA: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  URGENTE: 'bg-red-500/10 text-red-600 border-red-500/20',
  URGENTE01: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function RequerimientosPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<string>('');
  const [prioridad, setPrioridad] = useState<string>('');
  const [unidadSolicitanteId, setUnidadSolicitanteId] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [reqAEditar, setReqAEditar] = useState<Requerimiento | null>(null);
  const [detalleId, setDetalleId] = useState<number | null>(null);

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const debounced = useDebounce(search, 300);

  const { data: parametrosRaw } = useQuery({
    queryKey: ['parametros', 'ALERTAS'],
    queryFn: () => apiClient.get<any>('/parametros?grupo=ALERTAS'),
  });

  const parametros = Array.isArray(parametrosRaw) ? parametrosRaw : (parametrosRaw?.data ?? []);
  const parametroAlerta = parametros.find(
    (p: any) => p.clave === 'ALERTA_REQUERIMIENTO_DIAS' || p.codigo === 'ALERTA_REQUERIMIENTO_DIAS'
  );

  const alertaLimite = parametroAlerta ? Number(parametroAlerta.valor) : 1;
  const limiteSeguro = isNaN(alertaLimite) || alertaLimite < 1 ? 1 : alertaLimite;

  const { data: unidades } = useUnidades({ soloActivas: true });
  const { data: prioridades } = useCatalogoPorCodigo('PRIORIDAD_REQUERIMIENTO');
  const { data: statsRes } = useRequerimientoStats();

  const stats = (statsRes as any)?.data || statsRes || {};

  const { data, isLoading } = useRequerimientos({
    page,
    limit: limit === 0 ? 10000 : limit,
    search: debounced || undefined,
    estadoCodigo: estado || undefined,
    prioridad: prioridad || undefined,
    unidadSolicitanteId: unidadSolicitanteId ? Number(unidadSolicitanteId) : undefined,
  });

  const derivarMasivo = useDerivarMasivo();
  const hayFiltros = !!(estado || prioridad || search || unidadSolicitanteId);
  const items = data?.data ?? [];

  const toggle = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const derivables = items.filter((r) => String(r.estadoCodigo).toUpperCase() === 'REGISTRADO');
  const todosDerivablesSeleccionados =
    derivables.length > 0 && derivables.every((r) => seleccionados.has(r.id));

  const toggleTodosDerivables = () => {
    if (todosDerivablesSeleccionados) setSeleccionados(new Set());
    else setSeleccionados(new Set(derivables.map((r) => r.id)));
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const limpiarFiltros = () => {
    setSearch('');
    setEstado('');
    setPrioridad('');
    setUnidadSolicitanteId('');
    setPage(1);
    limpiarSeleccion();
  };

  const handleDerivar = () => {
    derivarMasivo.mutate(
      {
        requerimientoIds: Array.from(seleccionados),
        motivo: motivo || null,
        observaciones: observaciones || null,
      },
      {
        onSuccess: (res: any) => {
          const dataRes = res?.data || res;
          const esMasivo = dataRes.requerimientos && dataRes.requerimientos.length > 1;

          if (esMasivo) {
            // ✅ GENERAR PDF MASIVO CON TABLA DE DETALLE
            const loteData = dataRes.requerimientos.map((r: any) => {
              const reqOriginal = items.find((i) => i.id === r.requerimientoId);
              return {
                codigo: r.codigoRequerimiento,
                titulo: reqOriginal?.titulo || '—',
                persona: reqOriginal?.personaNombres || '—',
                cargo: reqOriginal?.cargoNombre || '—',
              };
            });

            // Tomamos los datos del primer requerimiento para la cabecera (unidad, etc.)
            const primerReq = items.find((i) => i.id === dataRes.requerimientos[0].requerimientoId);

            generarPdfDerivacion({
              codigoRequerimiento: dataRes.codigoRequerimientoLote, // Este es el codigo_grupo
              fecha: new Date().toLocaleString('es-BO'),
              unidadSolicitante: primerReq?.unidadSolicitanteNombre || 'OFICIALIA MAYOR',
              unidadDestino: 'DIRECCION DE RECURSOS HUMANOS',
              observaciones: observaciones,
              usuarioEnvio: 'OFICIALIA MAYOR',
              esMasivo: true,
              cantidadLote: dataRes.requerimientos.length,
              requerimientosLote: loteData,
            });
          } else if (dataRes.requerimientos && dataRes.requerimientos.length === 1) {
            // ✅ GENERAR PDF INDIVIDUAL (Si se derivó solo uno desde la tabla)
            const r = dataRes.requerimientos[0];
            const reqOriginal = items.find((i) => i.id === r.requerimientoId);

            generarPdfDerivacion({
              codigoRequerimiento: r.codigoRequerimiento,
              fecha: new Date().toLocaleString('es-BO'),
              nroCertificacion: reqOriginal?.nroCertificacion || '',
              titulo: reqOriginal?.titulo || '',
              personaNombres: reqOriginal?.personaNombres || '',
              personaDocumento: reqOriginal?.personaDocumento || '',
              cargoNombre: reqOriginal?.cargoNombre || '',
              unidadSolicitante: reqOriginal?.unidadSolicitanteNombre || '',
              unidadDestino: 'DIRECCION DE RECURSOS HUMANOS',
              observaciones: observaciones,
              usuarioEnvio: 'OFICIALIA MAYOR',
              esMasivo: false,
            });
          }

          setSeleccionados(new Set());
          setConfirmOpen(false);
          setMotivo('');
          setObservaciones('');
        },
      }
    );
  };

  const calcularDiasAlerta = (r: Requerimiento) => {
    let dias = r.diasTranscurridos || 0;
    const fechaBase = r.fechaCreacion || (r as any).fechaSolicitud;
    if (fechaBase) {
      let dateStr = String(fechaBase);
      if (dateStr.includes(' ') && !dateStr.includes('T')) dateStr = dateStr.replace(' ', 'T');
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        const diffTime = Math.max(0, new Date().getTime() - dateObj.getTime());
        dias = Math.max(dias, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }
    }
    return dias;
  };

  const columns: Column<Requerimiento>[] = [
    {
      key: 'select',
      header:
        derivables.length > 0 ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={todosDerivablesSeleccionados}
              onCheckedChange={toggleTodosDerivables}
            />
          </div>
        ) : (
          <span className="sr-only">Selección</span>
        ),
      className: 'w-[44px]',
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={seleccionados.has(r.id)}
            disabled={String(r.estadoCodigo).toUpperCase() !== 'REGISTRADO'}
            onCheckedChange={() => toggle(r.id)}
          />
        </div>
      ),
    },
    {
      key: 'codigo',
      header: 'Código',
      className: 'w-[240px]',
      render: (r) => {
        const isRegistrado = String(r.estadoCodigo).toUpperCase() === 'REGISTRADO';
        const dias = calcularDiasAlerta(r);
        const esAlerta = isRegistrado && dias >= limiteSeguro;

        return (
          <div className="flex flex-col items-start gap-1.5">
            <CodeBadge codigo={r.codigo} fallbackId={r.id} />
            {esAlerta && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
                <AlertCircle className="size-3 animate-pulse" />
                Sin derivar {dias} d.
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'titulo',
      header: 'Requerimiento',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.titulo}</p>
          <p className="truncate text-xs text-muted-foreground">
            Cert: <span className="font-mono">{r.nroCertificacion}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'persona',
      header: 'Persona',
      className: 'w-[180px]',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{r.personaNombres ?? '—'}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {r.personaDocumento ?? ''}
          </p>
        </div>
      ),
    },
    {
      key: 'tipoReq',
      header: 'Tipo Req.',
      className: 'w-[140px]',
      render: (r) => (
        <span className="truncate text-xs">
          {r.tipoRequerimientoNombre || r.tipoRequerimiento || '—'}
        </span>
      ),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      className: 'w-[110px]',
      render: (r) => {
        const prioObj = prioridades?.find((p) => p.codigo === r.prioridad);
        const label = prioObj ? prioObj.nombre : r.prioridad;
        const styleClass =
          PRIORIDAD_STYLES[r.prioridad] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        return (
          <Badge variant="outline" className={cn('text-[10px]', styleClass)}>
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'w-[170px]',
      render: (r) => <StatusPill estado={r.estadoCodigo} />,
    },
    {
      key: 'fecha',
      header: 'Creado',
      className: 'w-[110px]',
      render: (r) => (
        <span className="text-xs text-muted-foreground">{formatRelative(r.fechaCreacion)}</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[100px] text-right',
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {String(r.estadoCodigo).toUpperCase() === 'REGISTRADO' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setReqAEditar(r);
                setFormOpen(true);
              }}
              title="Editar"
            >
              <Pencil className="size-4 text-primary" />
            </Button>
          )}
          {/* BOTÓN DE RE-DESCARGAR PDF */}
          {r.codigo && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                generarPdfDerivacion({
                  codigoRequerimiento: r.codigo!,
                  fecha: new Date().toLocaleString('es-BO'),
                  titulo: r.titulo,
                  nroCertificacion: r.nroCertificacion,
                  personaNombres: r.personaNombres || '',
                  personaDocumento: r.personaDocumento || '',
                  cargoNombre: r.cargoNombre || '',
                  unidadSolicitante: r.unidadSolicitanteNombre || '',
                  unidadDestino: r.unidadActualNombre || 'DIRECCION DE RECURSOS HUMANOS',
                  usuarioEnvio: 'OFICIALIA MAYOR',
                  esMasivo: false,
                });
              }}
              title="Descargar Reporte PDF"
            >
              <Printer className="size-4 text-slate-500 hover:text-slate-800" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Requerimientos"
        description="Registro y seguimiento de solicitudes de contratación"
        icon={FileText}
        actions={
          <Button
            onClick={() => {
              setReqAEditar(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nuevo requerimiento
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Registrados"
          value={stats?.REGISTRADO || 0}
          icon={FileText}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
          delay={0.1}
        />
        <KpiCard
          label="Pendientes Recepción"
          value={stats?.PENDIENTE_RECEPCION || 0}
          icon={Inbox}
          colorClass="text-amber-500"
          bgClass="bg-amber-500/10"
          delay={0.2}
        />
        <KpiCard
          label="En Proceso"
          value={
            (stats?.RECIBIDO || 0) +
            (stats?.EN_REVISION || 0) +
            (stats?.OBSERVADO || 0) +
            (stats?.SUBSANADO || 0) +
            (stats?.REVISADO || 0) +
            (stats?.EN_ELABORACION_CONTRATO || 0) +
            (stats?.PARA_FIRMA || 0) +
            (stats?.FIRMADO || 0) +
            (stats?.APROBADO || 0)
          }
          icon={FileClock}
          colorClass="text-indigo-500"
          bgClass="bg-indigo-500/10"
          delay={0.3}
        />
        <KpiCard
          label="Finalizados"
          value={
            (stats?.FINALIZADO || 0) +
            (stats?.CONCLUIDO || 0) +
            (stats?.RECHAZADO || 0) +
            (stats?.ANULADO || 0)
          }
          icon={CheckCircle2}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          delay={0.4}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
            limpiarSeleccion();
          }}
          placeholder="Buscar…"
          className="w-full max-w-md"
        />
        <Select
          value={unidadSolicitanteId || 'ALL'}
          onValueChange={(v) => {
            setUnidadSolicitanteId(v === 'ALL' ? '' : v);
            setPage(1);
            limpiarSeleccion();
          }}
        >
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2 truncate">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Unidad" />
            </div>
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
        <Select
          value={prioridad || 'ALL'}
          onValueChange={(v) => {
            setPrioridad(v === 'ALL' ? '' : v);
            setPage(1);
            limpiarSeleccion();
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las prioridades</SelectItem>
            {prioridades?.map((p) => (
              <SelectItem key={p.codigo} value={p.codigo}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
            <X /> Limpiar
          </Button>
        )}
      </div>

      {!isLoading && derivables.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <button
            type="button"
            onClick={toggleTodosDerivables}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
          >
            {todosDerivablesSeleccionados ? (
              <CheckSquare className="size-4 text-primary" />
            ) : (
              <Square className="size-4 text-muted-foreground" />
            )}
            {todosDerivablesSeleccionados
              ? 'Deseleccionar todo'
              : `Seleccionar los ${derivables.length} derivables`}
          </button>
          {seleccionados.size > 0 && (
            <Badge variant="default">
              {seleccionados.size} de {derivables.length} seleccionados
            </Badge>
          )}
        </div>
      )}

      <DataTable
        data={items}
        columns={columns}
        isLoading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={limit}
        onPageChange={(p) => {
          setPage(p);
          limpiarSeleccion();
        }}
        limitOptions={[10, 20, 0]}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
          limpiarSeleccion();
        }}
        rowKey={(r) => r.id}
        onRowClick={(r) => setDetalleId(r.id)}
        rowClassName={(r) => {
          const isRegistrado = String(r.estadoCodigo).toUpperCase() === 'REGISTRADO';
          const dias = calcularDiasAlerta(r);
          return isRegistrado && dias >= limiteSeguro
            ? 'bg-red-100/80 hover:bg-red-200/80 dark:bg-red-900/40 dark:hover:bg-red-900/60 transition-colors'
            : '';
        }}
        rowTooltip={(r) => {
          const isRegistrado = String(r.estadoCodigo).toUpperCase() === 'REGISTRADO';
          const dias = calcularDiasAlerta(r);
          if (!isRegistrado || dias < limiteSeguro) return null;

          return (
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-destructive" />
              <span>
                Este requerimiento lleva <b>{dias} días</b> sin ser derivado.
              </span>
            </div>
          );
        }}
        emptyState={{
          icon: FileText,
          title: 'Sin requerimientos',
          description: hayFiltros
            ? 'No hay resultados.'
            : 'Comience registrando el primer requerimiento.',
        }}
      />

      {seleccionados.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
            <span className="text-sm font-medium">
              {seleccionados.size} seleccionado{seleccionados.size > 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={limpiarSeleccion}>
              Cancelar
            </Button>
            <Button onClick={() => setConfirmOpen(true)}>
              <Send /> Derivar
            </Button>
          </div>
        </div>
      )}

      <RequerimientoFormDialog
        open={formOpen}
        onOpenChange={(o: boolean) => {
          setFormOpen(o);
          if (!o) setReqAEditar(null);
        }}
        requerimientoAEditar={reqAEditar}
      />
      <RequerimientoDetalleDialog
        requerimientoId={detalleId}
        open={!!detalleId}
        onOpenChange={(o) => !o && setDetalleId(null)}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Layers className="size-5" />
              </div>
              <div>
                <DialogTitle>Confirmar derivación</DialogTitle>
                <DialogDescription>
                  Se derivarán {seleccionados.size} requerimientos con un código único.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-info/40 bg-info/5 p-3 text-xs">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-info" />
              <p className="text-muted-foreground">
                Todos compartirán el mismo <strong>REQ-</strong> y <strong>DER-</strong>.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.toUpperCase())}
                placeholder="LOTE URGENTE"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                className="uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDerivar} disabled={derivarMasivo.isPending}>
              {derivarMasivo.isPending && <Loader2 className="animate-spin" />} <Send /> Derivar{' '}
              {seleccionados.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
