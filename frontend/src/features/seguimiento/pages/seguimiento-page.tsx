import { useState } from 'react';
import { Activity, Eye, Filter, X, Inbox, Clock, AlertCircle, FileSignature } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusPill } from '@/components/shared/status-pill';
import { CodeBadge } from '@/components/shared/code-badge';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
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
import { useBandejaSeguimiento, useSeguimientoStats } from '../hooks/use-seguimiento';
import { SeguimientoDetalleDialog } from '../components/seguimiento-detalle-dialog';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { formatRelative, cn } from '@/lib/utils';
import type { BandejaSeguimientoItem } from '../types/seguimiento-types';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';

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
      keys: ['PENDIENTE_RECEPCION'],
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

export function SeguimientoPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // ✅ Estado para el límite
  const [search, setSearch] = useState('');
  const [unidadSolicitanteId, setUnidadSolicitanteId] = useState<string>('');
  const [detalleId, setDetalleId] = useState<number | null>(null);
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
  // ✅ Adaptamos la llamada para enviar el límite (0 = todos, pero enviamos 10000 para evitar problemas en el backend)
  const { data, isLoading } = useBandejaSeguimiento(page, limit === 0 ? 10000 : limit);
  const { data: statsRes } = useSeguimientoStats();

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

  const columns: Column<BandejaSeguimientoItem>[] = [
    {
      key: 'codigo',
      header: 'Código',
      className: 'w-[240px]',
      render: (r) => {
        const isPendiente = String(r.estadoCodigo).toUpperCase() === 'PENDIENTE_RECEPCION';
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
      key: 'ultimoMov',
      header: 'Último movimiento',
      className: 'w-[160px]',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {r.ultimaFechaEnvio ? formatRelative(r.ultimaFechaEnvio) : '—'}
          </p>
          {r.ultimoCodigoDerivacion && (
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {r.ultimoCodigoDerivacion}
            </p>
          )}
        </div>
      ),
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
    <div className="space-y-6">
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
        rowKey={(r) => r.requerimientoId}
        onRowClick={(r) => setDetalleId(r.requerimientoId)}

        // ✅ RESALTADO DE FILA COMPLETA (Fondo rojo sólido)
        rowClassName={(r) => {
          const isPendiente = String(r.estadoCodigo).toUpperCase() === 'PENDIENTE_RECEPCION';
          const dias = calcularDiasAlerta(r);
          return isPendiente && dias >= limiteSeguro
            ? 'bg-red-100/80 hover:bg-red-200/80 dark:bg-red-900/40 dark:hover:bg-red-900/60 transition-colors'
            : '';
        }}

        // ✅ TOOLTIP CON EL MENSAJE
        rowTooltip={(r) => {
          const isPendiente = String(r.estadoCodigo).toUpperCase() === 'PENDIENTE_RECEPCION';
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

      <SeguimientoDetalleDialog
        requerimientoId={detalleId}
        open={!!detalleId}
        onOpenChange={(o: boolean) => !o && setDetalleId(null)}
      />
    </div>
  );
}
