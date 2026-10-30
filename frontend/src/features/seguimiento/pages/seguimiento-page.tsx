import { useState } from 'react';
import {
  Activity,
  Eye,
  Filter,
  X,
  Inbox,
  Clock,
  AlertCircle,
  FileSignature,
  CheckSquare,
  Square,
  Send,
  Loader2,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  useBandejaSeguimiento,
  useSeguimientoStats,
  useRecibirMasivo,
  useDerivarMasivoPosterior,
} from '../hooks/use-seguimiento';
import { SeguimientoDetalleDialog } from '../components/seguimiento-detalle-dialog';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { cn } from '@/lib/utils'; // formatRelative eliminado
import type { BandejaSeguimientoItem } from '../types/seguimiento-types';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

const PRIORIDAD_STYLES: Record<string, string> = {
  BAJA: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  MEDIA: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ALTA: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  URGENTE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

function formatBs(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `Bs. ${value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
}

const KPI_CONFIG: Record<
  string,
  Array<{ label: string; keys: string[]; icon: any; color: string; bg: string }>
> = {
  DRH: [
    {
      label: 'Por Recepcionar',
      keys: ['PENDIENTE_RECEPCION', 'PENDIENTE_RECEPCION_CIERRE'],
      icon: Inbox,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'En Proceso',
      keys: [
        'RECIBIDO',
        'EN_REVISION',
        'REVISADO',
        'SUBSANADO',
        'EN_ELABORACION_CONTRATO',
        'PARA_FIRMA',
        'FIRMADO',
        'APROBADO',
        'RECIBIDO_CIERRE',
      ],
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Observados',
      keys: ['OBSERVADO'],
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ],
  DGAL: [
    {
      label: 'Por Recepcionar',
      keys: ['PENDIENTE_RECEPCION'],
      icon: Inbox,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'En Elaboración / Firma',
      keys: ['RECIBIDO', 'EN_ELABORACION_CONTRATO', 'PARA_FIRMA', 'FIRMADO'],
      icon: FileSignature,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Observados',
      keys: ['OBSERVADO'],
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ],
  OM: [
    {
      label: 'Por Recepcionar',
      keys: ['PENDIENTE_RECEPCION', 'PENDIENTE_RECEPCION_CIERRE'],
      icon: Inbox,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Por Aprobar',
      keys: ['RECIBIDO', 'RECIBIDO_CIERRE'],
      icon: FileSignature,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Observados',
      keys: ['OBSERVADO'],
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ],
  DEFAULT: [
    {
      label: 'Por Recepcionar',
      keys: ['PENDIENTE_RECEPCION', 'PENDIENTE_RECEPCION_CIERRE'],
      icon: Inbox,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'En Proceso',
      keys: [
        'RECIBIDO',
        'EN_REVISION',
        'SUBSANADO',
        'REVISADO',
        'EN_ELABORACION_CONTRATO',
        'PARA_FIRMA',
        'FIRMADO',
        'APROBADO',
        'RECIBIDO_CIERRE',
      ],
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Observados',
      keys: ['OBSERVADO'],
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ],
};

// ✅ Función auxiliar para evaluar si un estado es de recepción
const esEstadoRecepcion = (estado: string) => {
  const est = String(estado).toUpperCase();
  return est === 'PENDIENTE_RECEPCION' || est === 'PENDIENTE_RECEPCION_CIERRE';
};

export function SeguimientoPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [unidadSolicitanteId, setUnidadSolicitanteId] = useState<string>('');
  const [detalleId, setDetalleId] = useState<number | null>(null);

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [modoAccion, setModoAccion] = useState<'RECIBIR' | 'DERIVAR' | null>(null);
  const [confirmRecibirOpen, setConfirmRecibirOpen] = useState(false);
  const [confirmDerivarOpen, setConfirmDerivarOpen] = useState(false);
  const [motivoMasivo, setMotivoMasivo] = useState('');
  const [obsMasivo, setObsMasivo] = useState('');

  const debounced = useDebounce(search, 300);

  const user = useAuthStore((state: any) => state.user);
  const unidadCodigo = user?.unidadCodigo || 'DEFAULT';
  const kpiCards = KPI_CONFIG[unidadCodigo] || KPI_CONFIG['DEFAULT'];

  const { data: parametrosRaw } = useQuery({
    queryKey: ['parametros', 'ALERTAS'],
    queryFn: () => apiClient.get<any>('/parametros?grupo=ALERTAS'),
  });

  const parametros = Array.isArray(parametrosRaw) ? parametrosRaw : (parametrosRaw?.data ?? []);
  const parametroAlerta = parametros.find(
    (p: any) => p.clave === 'ALERTA_SEGUIMIENTO_DIAS' || p.codigo === 'ALERTA_SEGUIMIENTO_DIAS'
  );

  const alertaLimite = parametroAlerta ? Number(parametroAlerta.valor) : 1;
  const limiteSeguro = isNaN(alertaLimite) || alertaLimite < 1 ? 1 : alertaLimite;

  const { data: unidades } = useUnidades({ soloActivas: true });
  const { data, isLoading } = useBandejaSeguimiento(page, limit === 0 ? 10000 : limit);
  const { data: statsRes } = useSeguimientoStats();

  const recibirMasivo = useRecibirMasivo();
  const derivarMasivo = useDerivarMasivoPosterior();

  const stats = (statsRes as any)?.data || statsRes || {};

  const items = (data?.data ?? []).filter((r) => {
    if (unidadSolicitanteId && r.unidadSolicitanteId !== Number(unidadSolicitanteId)) return false;
    if (!debounced) return true;
    const s = debounced.toLowerCase();
    return (
      r.requerimientoTitulo.toLowerCase().includes(s) ||
      r.personaNombres.toLowerCase().includes(s) ||
      (r.requerimientoCodigo ?? '').toLowerCase().includes(s) ||
      r.personaDocumento.toLowerCase().includes(s) ||
      r.nroCertificacion.toLowerCase().includes(s) ||
      (r.unidadSolicitanteNombre ?? '').toLowerCase().includes(s) ||
      (r.cargoNombre ?? '').toLowerCase().includes(s) ||
      (r.cargoCodigo ?? '').toLowerCase().includes(s)
    );
  });

  const hayFiltros = !!(search || unidadSolicitanteId);

  const calcularDiasAlerta = (r: BandejaSeguimientoItem) => {
    let dias = r.diasTranscurridos || 0;
    const fechaBase = r.ultimaFechaEnvio || (r as any).fechaCreacion;
    if (fechaBase) {
      let dateStr = String(fechaBase);
      if (dateStr.includes(' ') && !dateStr.includes('T')) dateStr = dateStr.replace(' ', 'T');
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        dias = Math.max(
          dias,
          Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
        );
      }
    }
    return dias;
  };

  // ─── Lógica de Selección ───
  const toggle = (id: number, tipo: 'RECIBIR' | 'DERIVAR') => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setModoAccion(null);
      } else {
        if (modoAccion && modoAccion !== tipo) {
          toast.error('No puede mezclar requerimientos para recibir y derivar en el mismo lote.');
          return prev;
        }
        if (!modoAccion) setModoAccion(tipo);
        next.add(id);
      }
      return next;
    });
  };

  // ✅ Filtros corregidos usando la función auxiliar
  const recepcionables = items.filter((r) => esEstadoRecepcion(r.estadoCodigo));
  const derivables = items.filter((r) => {
    const est = String(r.estadoCodigo).toUpperCase();
    return (
      !esEstadoRecepcion(est) &&
      est !== 'FINALIZADO' &&
      est !== 'RECHAZADO' &&
      est !== 'ANULADO' &&
      est !== 'CONCLUIDO'
    );
  });

  const todosRecepcionablesSeleccionados =
    recepcionables.length > 0 && recepcionables.every((r) => seleccionados.has(r.requerimientoId));
  const todosDerivablesSeleccionados =
    derivables.length > 0 && derivables.every((r) => seleccionados.has(r.requerimientoId));

  const toggleTodosRecepcionables = () => {
    if (todosRecepcionablesSeleccionados) {
      const next = new Set(seleccionados);
      recepcionables.forEach((r) => next.delete(r.requerimientoId));
      setSeleccionados(next);
      if (next.size === 0) setModoAccion(null);
    } else {
      if (modoAccion && modoAccion !== 'RECIBIR') {
        toast.error('Ya tiene derivaciones seleccionadas.');
        return;
      }
      const next = new Set(seleccionados);
      recepcionables.forEach((r) => next.add(r.requerimientoId));
      setSeleccionados(next);
      setModoAccion('RECIBIR');
    }
  };

  const toggleTodosDerivables = () => {
    if (todosDerivablesSeleccionados) {
      const next = new Set(seleccionados);
      derivables.forEach((r) => next.delete(r.requerimientoId));
      setSeleccionados(next);
      if (next.size === 0) setModoAccion(null);
    } else {
      if (modoAccion && modoAccion !== 'DERIVAR') {
        toast.error('Ya tiene recepciones seleccionadas.');
        return;
      }
      const next = new Set(seleccionados);
      derivables.forEach((r) => next.add(r.requerimientoId));
      setSeleccionados(next);
      setModoAccion('DERIVAR');
    }
  };

  const limpiarSeleccion = () => {
    setSeleccionados(new Set());
    setModoAccion(null);
  };

  const handleRecibirMasivo = () => {
    recibirMasivo.mutate(
      { requerimientoIds: Array.from(seleccionados), observaciones: obsMasivo || null },
      {
        onSuccess: () => {
          limpiarSeleccion();
          setConfirmRecibirOpen(false);
          setObsMasivo('');
        },
      }
    );
  };

  const handleDerivarMasivo = () => {
    derivarMasivo.mutate(
      {
        requerimientoIds: Array.from(seleccionados),
        motivo: motivoMasivo || null,
        observaciones: obsMasivo || null,
      },
      {
        onSuccess: () => {
          limpiarSeleccion();
          setConfirmDerivarOpen(false);
          setMotivoMasivo('');
          setObsMasivo('');
        },
      }
    );
  };

  const columns: Column<BandejaSeguimientoItem>[] = [
    {
      key: 'select',
      header: (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={
              (recepcionables.length > 0 && todosRecepcionablesSeleccionados) ||
              (recepcionables.length === 0 && derivables.length > 0 && todosDerivablesSeleccionados)
            }
            onCheckedChange={
              recepcionables.length > 0 ? toggleTodosRecepcionables : toggleTodosDerivables
            }
            title="Seleccionar lote"
          />
        </div>
      ),
      className: 'w-[44px]',
      render: (r) => {
        const esRecepcionable = esEstadoRecepcion(r.estadoCodigo);
        const esDerivable =
          !esRecepcionable &&
          String(r.estadoCodigo).toUpperCase() !== 'FINALIZADO' &&
          String(r.estadoCodigo).toUpperCase() !== 'RECHAZADO' &&
          String(r.estadoCodigo).toUpperCase() !== 'ANULADO' &&
          String(r.estadoCodigo).toUpperCase() !== 'CONCLUIDO';

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={seleccionados.has(r.requerimientoId)}
              disabled={!esRecepcionable && !esDerivable}
              onCheckedChange={() =>
                toggle(r.requerimientoId, esRecepcionable ? 'RECIBIR' : 'DERIVAR')
              }
            />
          </div>
        );
      },
    },
    {
      key: 'codigo',
      header: 'Código',
      className: 'w-[240px]',
      render: (r) => {
        const isPendiente = esEstadoRecepcion(r.estadoCodigo);
        const dias = calcularDiasAlerta(r);
        const esAlerta = isPendiente && dias >= limiteSeguro;

        return (
          <div className="flex flex-col items-start gap-1.5">
            <CodeBadge codigo={r.requerimientoCodigo} fallbackId={r.requerimientoId} />
            {esAlerta && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
                <AlertCircle className="size-3 animate-pulse" />
                Pendiente {dias} d.
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
          <p className="truncate font-medium">{r.requerimientoTitulo}</p>
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
          <p className="truncate text-xs font-medium">{r.personaNombres}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {r.personaDocumento}
          </p>
        </div>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo',
      className: 'w-[200px]',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{r.cargoNombre ?? '—'}</p>
          {(r.cargoCodigo || r.cargoSalarioMes != null) && (
            <p className="truncate text-[10px] text-muted-foreground">
              <span className="font-mono">{r.cargoCodigo ?? '—'}</span>
              <span className="mx-1">·</span>
              <span className="font-mono">{formatBs(r.cargoSalarioMes)}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'unidadSolicitante',
      header: 'Unidad solicitante',
      className: 'w-[160px]',
      render: (r) => <span className="truncate text-xs">{r.unidadSolicitanteNombre ?? '—'}</span>,
    },
    {
      key: 'unidadActual',
      header: 'Unidad actual',
      className: 'w-[160px]',
      render: (r) => (
        <span className="truncate text-xs font-medium">{r.unidadActualNombre ?? '—'}</span>
      ),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      className: 'w-[110px]',
      render: (r) => (
        <Badge variant="outline" className={cn('text-[10px]', PRIORIDAD_STYLES[r.prioridad])}>
          {r.prioridad}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      className: 'w-[170px]',
      render: (r) => <StatusPill estado={r.estadoCodigo} />,
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-[130px] text-right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDetalleId(r.requerimientoId);
          }}
        >
          <Eye /> Ver y actuar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Seguimiento"
        description="Requerimientos activos en tu unidad. Ejecuta las acciones del flujo."
        icon={Activity}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {kpiCards.map((card, idx) => {
          const total = card.keys.reduce((acc, key) => acc + (stats?.[key] || 0), 0);
          return (
            <KpiCard
              key={card.label}
              label={card.label}
              value={total}
              icon={card.icon}
              colorClass={card.color}
              bgClass={card.bg}
              delay={0.1 * (idx + 1)}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar…"
          className="w-full max-w-md"
        />
        <Select
          value={unidadSolicitanteId || 'ALL'}
          onValueChange={(v) => {
            setUnidadSolicitanteId(v === 'ALL' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <div className="flex items-center gap-2 truncate">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Unidad solicitante" />
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
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setUnidadSolicitanteId('');
              setPage(1);
            }}
          >
            <X /> Limpiar
          </Button>
        )}
      </div>

      {/* Banner de selección masiva INTELIGENTE */}
      {!isLoading && items.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          {recepcionables.length > 0 ? (
            <button
              type="button"
              onClick={toggleTodosRecepcionables}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            >
              {todosRecepcionablesSeleccionados ? (
                <CheckSquare className="size-4 text-primary" />
              ) : (
                <Square className="size-4 text-muted-foreground" />
              )}
              {todosRecepcionablesSeleccionados
                ? 'Deseleccionar recepcionables'
                : `Seleccionar los ${recepcionables.length} recepcionables`}
            </button>
          ) : derivables.length > 0 ? (
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
                ? 'Deseleccionar derivables'
                : `Seleccionar los ${derivables.length} derivables`}
            </button>
          ) : null}
          {seleccionados.size > 0 && (
            <Badge variant="default">{seleccionados.size} seleccionado(s)</Badge>
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
        rowKey={(r) => r.requerimientoId}
        onRowClick={(r) => setDetalleId(r.requerimientoId)}
        rowClassName={(r) => {
          const isPendiente = esEstadoRecepcion(r.estadoCodigo);
          const dias = calcularDiasAlerta(r);
          return isPendiente && dias >= limiteSeguro
            ? 'bg-red-100/80 hover:bg-red-200/80 dark:bg-red-900/40 dark:hover:bg-red-900/60 transition-colors'
            : '';
        }}
        rowTooltip={(r) => {
          const isPendiente = esEstadoRecepcion(r.estadoCodigo);
          const dias = calcularDiasAlerta(r);
          if (!isPendiente || dias < limiteSeguro) return null;
          return (
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-destructive" />
              <span>
                Este seguimiento lleva <b>{dias} días</b> pendiente de recepción.
              </span>
            </div>
          );
        }}
        emptyState={{
          icon: Activity,
          title: 'Sin requerimientos en tu bandeja',
          description: 'Los requerimientos aparecerán aquí cuando estén activos en tu unidad.',
        }}
      />

      {/* Barra flotante de acciones masivas */}
      {seleccionados.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
            <span className="text-sm font-medium">
              {seleccionados.size} seleccionado{seleccionados.size > 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={limpiarSeleccion}>
              Cancelar
            </Button>

            {modoAccion === 'RECIBIR' ? (
              <Button
                onClick={() => setConfirmRecibirOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Inbox className="mr-2 size-4" /> Recibir Lote
              </Button>
            ) : (
              <Button onClick={() => setConfirmDerivarOpen(true)}>
                <Send className="mr-2 size-4" /> Derivar Lote
              </Button>
            )}
          </div>
        </div>
      )}

      <SeguimientoDetalleDialog
        requerimientoId={detalleId}
        open={!!detalleId}
        onOpenChange={(o: boolean) => !o && setDetalleId(null)}
      />

      {/* Diálogo Confirmación Recepción Masiva */}
      <Dialog open={confirmRecibirOpen} onOpenChange={setConfirmRecibirOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                <Inbox className="size-5" />
              </div>
              <div>
                <DialogTitle>Confirmar Recepción Masiva</DialogTitle>
                <DialogDescription>
                  Se recibirán {seleccionados.size} requerimientos a la vez.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={obsMasivo}
                onChange={(e) => setObsMasivo(e.target.value)}
                rows={2}
                placeholder="Observaciones (opcional)"
                className="uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRecibirOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRecibirMasivo}
              disabled={recibirMasivo.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {recibirMasivo.isPending && <Loader2 className="mr-2 animate-spin" />}{' '}
              <Inbox className="mr-2 size-4" /> Recibir {seleccionados.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Confirmación Derivación Masiva */}
      <Dialog open={confirmDerivarOpen} onOpenChange={setConfirmDerivarOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Send className="size-5" />
              </div>
              <div>
                <DialogTitle>Confirmar Derivación Masiva</DialogTitle>
                <DialogDescription>
                  Se derivarán {seleccionados.size} requerimientos a la siguiente unidad.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                value={motivoMasivo}
                onChange={(e) => setMotivoMasivo(e.target.value.toUpperCase())}
                placeholder="MOTIVO DEL LOTE"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={obsMasivo}
                onChange={(e) => setObsMasivo(e.target.value)}
                rows={2}
                className="uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDerivarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDerivarMasivo} disabled={derivarMasivo.isPending}>
              {derivarMasivo.isPending && <Loader2 className="mr-2 animate-spin" />}{' '}
              <Send className="mr-2 size-4" /> Derivar {seleccionados.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
