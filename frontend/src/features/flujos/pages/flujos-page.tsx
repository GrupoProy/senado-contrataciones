import { useState } from 'react';
import { GitBranch, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { flujosApi } from '../api/flujos-api';

export function FlujosPage() {
  const { data: flujos, isLoading } = useQuery({
    queryKey: ['flujos'],
    queryFn: () => flujosApi.listar(),
  });

  const [flujoActivo, setFlujoActivo] = useState<number | null>(null);
  const { data: transiciones } = useQuery({
    queryKey: ['transiciones', flujoActivo],
    queryFn: () => flujosApi.listarTransiciones(flujoActivo!),
    enabled: !!flujoActivo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flujos de Trabajo"
        description="Configuración de transiciones y estados"
        icon={GitBranch}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lista de Flujos */}
        <div className="space-y-3">
          {isLoading ? (
            <p>Cargando…</p>
          ) : (
            flujos?.map((f) => (
              <Card
                key={f.id}
                className={`cursor-pointer p-4 transition-colors ${flujoActivo === f.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setFlujoActivo(f.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{f.nombre}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {f.codigo} v{f.version}
                    </p>
                  </div>
                  <ChevronRight
                    className={`size-4 ${flujoActivo === f.id ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Transiciones del flujo seleccionado */}
        <Card className="p-6 md:col-span-2">
          {!flujoActivo ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Seleccione un flujo para ver sus transiciones
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Transiciones del Flujo</h3>
              <div className="grid gap-3">
                {transiciones?.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                    <div className="w-[150px] shrink-0">
                      <p className="font-medium">{t.unidad_origen_nombre}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.estado_origen_codigo || 'INICIO'}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <div className="w-[100px] shrink-0">
                      <Badge variant="outline">{t.accion_codigo}</Badge>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      {t.permite_finalizacion ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle2 className="size-4" />
                          <span>FINALIZADO</span>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{t.unidad_destino_nombre}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t.estado_destino_codigo}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
