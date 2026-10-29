import { useState, useEffect } from 'react';
// ✅ Quitamos CheckSquare
import { Loader2, Save, FileCheck2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useChecklist, useGuardarChecklist } from '../hooks/use-seguimiento';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requerimientoId: number;
}

export function ChecklistRequisitosModal({ open, onOpenChange, requerimientoId }: Props) {
  const { data: checklist, isLoading } = useChecklist(requerimientoId);
  const guardar = useGuardarChecklist();

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (checklist) {
      // ✅ SOLUCIÓN: Filtramos duplicados en el frontend usando el código como identificador único
      const itemsUnicos = Array.from(
        new Map(checklist.map((item: any) => [item.codigo, item])).values()
      );
      setItems(itemsUnicos);
    }
  }, [checklist]);

  const toggleItem = (codigo: string) => {
    setItems((prev) =>
      prev.map((i) => (i.codigo === codigo ? { ...i, verificado: !i.verificado } : i))
    );
  };

  const handleSave = () => {
    guardar.mutate(
      { id: requerimientoId, requisitos: items },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const total = items.length;
  const verificados = items.filter((i) => i.verificado).length;
  const completo = total > 0 && total === verificados;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="size-5 text-primary" />
            Verificación de Requisitos
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${completo ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
            >
              <AlertCircle className="size-4 shrink-0" />
              <p>
                {verificados} de {total} requisitos verificados.{' '}
                {!completo && 'Faltan requisitos obligatorios.'}
              </p>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-2">
              {items.map((item) => (
                <div
                  key={item.codigo}
                  className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
                >
                  <Checkbox
                    checked={item.verificado}
                    onCheckedChange={() => toggleItem(item.codigo)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.nombre}</p>
                    <Input
                      placeholder="Observaciones (opcional)"
                      className="mt-2 h-8 text-xs"
                      value={item.observaciones || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems((prev) =>
                          prev.map((i) =>
                            i.codigo === item.codigo ? { ...i, observaciones: val } : i
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={guardar.isPending}>
            {guardar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" /> Guardar Verificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
