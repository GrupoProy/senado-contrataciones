import { ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusPill } from '@/components/shared/status-pill';
import { formatRelative } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  items: Array<{
    id: number;
    codigo: string | null;
    titulo: string;
    estadoCodigo: string;
    personaNombres: string;
    fechaCreacion: string;
  }>;
}

export function RecentRequirements({ items }: Props) {
  return (
    <Card className="col-span-1 shadow-sm lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Requerimientos Recientes</CardTitle>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link to="/requerimientos">
            Ver todos <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mt-4 space-y-4">
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay movimientos recientes.
            </p>
          ) : (
            items.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{r.titulo}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{r.codigo ?? `#${r.id}`}</span>
                      <span>•</span>
                      <span>{r.personaNombres}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill estado={r.estadoCodigo} />
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelative(r.fechaCreacion)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
