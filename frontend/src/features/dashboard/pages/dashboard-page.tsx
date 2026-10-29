import { FileText, Activity, Users2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '../components/kpi-card';
import { RecentRequirements } from '../components/recent-requirements';
import { RequerimientosChart } from '../components/requerimientos-chart';
import { ActivityFeed } from '../components/activity-feed';
import { useDashboardStats } from '../hooks/use-dashboard';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-muted-foreground">
        <AlertCircle className="mb-4 size-10 text-destructive" />
        <h2 className="text-lg font-semibold">No se pudo cargar el Dashboard</h2>
        <p className="text-sm">Verifique su conexión o contacte al administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Control"
        description="Resumen operativo y estadísticas del sistema"
        icon={Activity}
      />

      {/* 1. KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Requerimientos Totales"
          value={data.totalRequerimientos}
          icon={FileText}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
          delay={0.1}
        />
        <KpiCard
          label="Contratos en Curso"
          value={data.contratosEnCurso}
          icon={ShieldCheck}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-500/10"
          delay={0.2}
        />
        <KpiCard
          label="Senadores Activos"
          value={data.totalSenadores}
          icon={Users2}
          colorClass="text-amber-500"
          bgClass="bg-amber-500/10"
          delay={0.3}
        />
        <KpiCard
          label="Usuarios del Sistema"
          value={data.totalUsuarios}
          icon={Users2}
          colorClass="text-indigo-500"
          bgClass="bg-indigo-500/10"
          delay={0.4}
        />
      </div>

      {/* 2. Gráficos y Feed (Layout de 3 columnas) */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RequerimientosChart data={data.requerimientosPorMes || []} />
        </div>
        <div className="md:col-span-1">
          <ActivityFeed items={data.actividadReciente || []} />
        </div>
      </div>

      {/* 3. Requerimientos Recientes y Tarjeta de Seguridad */}
      <div className="grid gap-6 md:grid-cols-3">
        <RecentRequirements items={data.recientes || []} />

        <Card className="shadow-sm">
          <CardContent className="flex h-full flex-col items-center justify-center space-y-4 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center">
            <div className="rounded-full bg-primary/20 p-4 text-primary">
              <ShieldCheck className="size-10" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sistema Seguro</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas las operaciones están siendo auditadas y registradas automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
