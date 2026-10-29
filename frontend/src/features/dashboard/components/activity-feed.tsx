import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Activity, Send } from 'lucide-react';
import type { ActividadItem } from '../types/dashboard-types';

interface Props {
  items: ActividadItem[];
}

const ICONS: Record<ActividadItem['tipo'], React.ComponentType<{ className?: string }>> = {
  creacion: Clock,
  derivacion: Activity,
  recepcion: Send,
  finalizacion: CheckCircle2,
};

const COLORS: Record<ActividadItem['tipo'], string> = {
  creacion: 'text-info',
  derivacion: 'text-primary',
  recepcion: 'text-warning',
  finalizacion: 'text-success',
};

export function ActivityFeed({ items }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="text-base font-semibold">Actividad reciente</h2>
        <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
      </div>
      <div className="space-y-4 p-5">
        {items.map((item) => {
          const Icon = ICONS[item.tipo];
          const color = COLORS[item.tipo];
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`bg-current/10 mt-0.5 rounded-lg p-2 ${color}`}>
                <Icon className="size-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">{item.texto}</p>
                <p className="text-[10px] text-muted-foreground">{item.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
