import { useState, useEffect } from 'react';
import { ShieldCheck, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoles } from '@/features/roles/hooks/use-roles';
import { useMatrizRol, useSincronizarMatriz } from '../hooks/use-matriz';

export function MatrizPage() {
  const { data: roles } = useRoles();
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  const { data: matriz, isLoading } = useMatrizRol(rolSeleccionado);
  const sincronizar = useSincronizarMatriz();

  const [permisosSel, setPermisosSel] = useState<Set<number>>(new Set());
  const [menusSel, setMenusSel] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (matriz) {
      // ✅ FIX: Forzamos a que el ID sea un número
      setPermisosSel(new Set(matriz.permisos.filter((p) => p.asignado).map((p) => Number(p.id))));
      setMenusSel(new Set(matriz.menus.filter((m) => m.asignado).map((m) => Number(m.id))));
    }
  }, [matriz]);

  const togglePermiso = (id: number) => {
    const numId = Number(id);
    const next = new Set(permisosSel);
    if (next.has(numId)) next.delete(numId);
    else next.add(numId);
    setPermisosSel(next);
  };

  const toggleMenu = (id: number) => {
    const numId = Number(id);
    const next = new Set(menusSel);
    if (next.has(numId)) next.delete(numId);
    else next.add(numId);
    setMenusSel(next);
  };

  const guardar = () => {
    if (!rolSeleccionado) return;
    sincronizar.mutate({
      rolId: rolSeleccionado,
      permisos: Array.from(permisosSel),
      menus: Array.from(menusSel),
    });
  };

  const permisosPorModulo =
    matriz?.permisos.reduce(
      (acc, p) => {
        if (!acc[p.modulo]) acc[p.modulo] = [];
        acc[p.modulo].push(p);
        return acc;
      },
      {} as Record<string, typeof matriz.permisos>
    ) || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matriz de Accesos"
        description="Configure permisos y menús por rol"
        icon={ShieldCheck}
      />

      <div className="flex items-end gap-4">
        <div className="w-[300px] space-y-2">
          <label className="text-sm font-medium">Seleccione un Rol</label>
          <Select
            value={rolSeleccionado?.toString()}
            onValueChange={(v) => setRolSeleccionado(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione rol…" />
            </SelectTrigger>
            <SelectContent>
              {roles?.map((r) => (
                <SelectItem key={r.id} value={r.id.toString()}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={guardar} disabled={!rolSeleccionado || sincronizar.isPending}>
          {sincronizar.isPending ? <Loader2 className="animate-spin" /> : <Save />} Guardar Cambios
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}

      {matriz && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permisos del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] space-y-6 overflow-y-auto">
              {Object.entries(permisosPorModulo).map(([modulo, permisos]) => (
                <div key={modulo} className="space-y-3">
                  <h4 className="rounded bg-muted p-2 text-sm font-semibold">{modulo}</h4>
                  {permisos.map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`p-${p.id}`}
                        checked={permisosSel.has(Number(p.id))}
                        onCheckedChange={() => togglePermiso(p.id)}
                      />
                      <label htmlFor={`p-${p.id}`} className="text-sm">
                        {p.descripcion || p.clave}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Menús de Navegación</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] space-y-3 overflow-y-auto">
              {matriz.menus.map((m) => (
                <div key={m.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`m-${m.id}`}
                    checked={menusSel.has(Number(m.id))}
                    onCheckedChange={() => toggleMenu(m.id)}
                  />
                  <label htmlFor={`m-${m.id}`} className="text-sm">
                    {m.etiqueta} <span className="text-xs text-muted-foreground">({m.ruta})</span>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
