import { useState } from 'react';
import { Loader2, Send, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useDerivar } from '../hooks/use-requerimientos';
import type { Requerimiento } from '../types/requerimiento-types';

interface Props {
  requerimiento: Requerimiento | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: (res: { codigoRequerimiento: string; codigoDerivacion: string }) => void;
}

export function DerivarDialog({ requerimiento, open, onOpenChange, onSuccess }: Props) {
  const derivar = useDerivar();
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  if (!requerimiento) return null;

  const handleSubmit = () => {
    derivar.mutate(
      {
        id: requerimiento.id,
        input: { motivo: motivo || null, observaciones: observaciones || null },
      },
      {
        onSuccess: (res: any) => {
          // ✅ Extraemos la data por si viene envuelta en { success, data }
          const data = res?.data || res;

          toast.success(`Derivado. Código ${data?.codigoDerivacion || 'OK'}`, {
            description: `Req: ${data?.codigoRequerimiento || 'Generado'}`,
            duration: 8000,
          });

          onOpenChange(false);

          // ✅ Pasamos los códigos extraídos de forma segura
          onSuccess?.({
            codigoRequerimiento: data?.codigoRequerimiento,
            codigoDerivacion: data?.codigoDerivacion,
          });

          setMotivo('');
          setObservaciones('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Send className="size-5" />
            </div>
            <div>
              <DialogTitle>Derivar requerimiento</DialogTitle>
              <DialogDescription>
                Se generará un código <strong>DER-</strong> y se enviará a la siguiente unidad según
                el flujo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold">
                {requerimiento.codigo ?? `#${requerimiento.id}`}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{requerimiento.estadoCodigo}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{requerimiento.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {requerimiento.personaNombres} · {requerimiento.personaDocumento}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <span className="font-medium">{requerimiento.unidadActualNombre ?? '—'}</span>
            <ArrowRight className="size-3 text-primary" />
            <span className="font-medium text-primary">Siguiente unidad</span>
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.toUpperCase())}
              placeholder="REVISAR EXPEDIENTE COMPLETO"
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales (opcional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={derivar.isPending}>
            {derivar.isPending && <Loader2 className="animate-spin" />}
            <Send /> Derivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
