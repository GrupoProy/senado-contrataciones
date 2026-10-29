import { useState } from 'react';
import {
  Loader2,
  UserCircle,
  Power,
  KeyRound,
  Plus,
  History,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserStatusBadge } from '@/components/shared/user-status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';
import { getInitials, formatDateTime, formatDate } from '@/lib/utils';
import {
  useUsuario,
  useRolVigente,
  useRolesDeUsuario,
  useAsignarRol,
  useInactivarRol,
  useReactivarRol,
  useCambiarEstadoUsuario,
  useResetPasswordUsuario,
} from '../hooks/use-usuarios';
import { useRoles } from '@/features/roles/hooks/use-roles';

interface Props {
  usuarioId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Accion =
  | null
  | { tipo: 'inactivar-rol' }
  | { tipo: 'reactivar-rol'; usuarioRolId: number }
  | { tipo: 'suspender' }
  | { tipo: 'reactivar' }
  | { tipo: 'reset' };

export function UsuarioDetalleDialog({ usuarioId, open, onOpenChange }: Props) {
  const { data: usuario, isLoading } = useUsuario(usuarioId);
  const { data: rolVigente } = useRolVigente(usuarioId);
  const { data: historial } = useRolesDeUsuario(usuarioId);
  const { data: roles } = useRoles();

  const asignarRol = useAsignarRol();
  const inactivarRol = useInactivarRol();
  const reactivarRol = useReactivarRol();
  const cambiarEstado = useCambiarEstadoUsuario();
  const resetPassword = useResetPasswordUsuario();

  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [motivoRol, setMotivoRol] = useState('ASIGNACION DESDE PANEL DE ADMINISTRACION');
  const [accion, setAccion] = useState<Accion>(null);
  const [resetResult, setResetResult] = useState<{
    username: string;
    passwordTemporal: string;
  } | null>(null);

  if (!usuarioId) return null;

  const initials = usuario ? getInitials(usuario.nombres, usuario.primer_apellido) : '??';

  const handleAsignarRol = () => {
    if (!rolSeleccionado) {
      toast.error('Seleccione un rol');
      return;
    }
    asignarRol.mutate(
      { id: usuarioId, rolId: Number(rolSeleccionado), motivo: motivoRol },
      { onSuccess: () => setRolSeleccionado('') }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de usuario</DialogTitle>
          </DialogHeader>

          {isLoading || !usuario ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Cabecera del usuario */}
              <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {usuario.nombres} {usuario.primer_apellido} {usuario.segundo_apellido ?? ''}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    @{usuario.username} · {usuario.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <UserStatusBadge estado={usuario.estado} />
                    {usuario.rol_nombre && <Badge variant="secondary">{usuario.rol_nombre}</Badge>}
                    {usuario.unidad_nombre && (
                      <Badge variant="outline">{usuario.unidad_nombre}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">
                    <UserCircle className="mr-2 size-4" />
                    Información
                  </TabsTrigger>
                  <TabsTrigger value="rol">
                    <KeyRound className="mr-2 size-4" />
                    Rol
                  </TabsTrigger>
                  <TabsTrigger value="acciones">
                    <Power className="mr-2 size-4" />
                    Acciones
                  </TabsTrigger>
                </TabsList>

                {/* Info */}
                <TabsContent value="info" className="space-y-3 py-4">
                  <InfoRow label="Username" value={usuario.username} mono />
                  <InfoRow label="Email" value={usuario.email} />
                  <InfoRow
                    label="Documento"
                    value={
                      usuario.tipo_documento && usuario.numero_documento
                        ? `${usuario.tipo_documento} ${usuario.numero_documento}`
                        : '—'
                    }
                  />
                  <InfoRow label="Teléfono" value={usuario.telefono ?? '—'} />
                  <InfoRow
                    label="Último acceso"
                    value={usuario.ultimo_acceso ? formatDateTime(usuario.ultimo_acceso) : 'Nunca'}
                  />
                </TabsContent>

                {/* Rol */}
                <TabsContent value="rol" className="space-y-4 py-4">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm font-medium">Rol vigente</p>
                    {rolVigente?.rolVigente ? (
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{rolVigente.rolVigente.rolNombre}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {rolVigente.rolVigente.rolCodigo}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAccion({ tipo: 'inactivar-rol' })}
                        >
                          Inactivar
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sin rol vigente asignado.
                      </p>
                    )}
                  </div>

                  {/* Asignar nuevo rol */}
                  <div className="space-y-3 rounded-lg border border-border p-4">
                    <p className="text-sm font-medium">Asignar nuevo rol</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles
                            ?.filter((r) => r.estado === 'ACT')
                            .map((r) => (
                              <SelectItem key={r.id} value={r.id.toString()}>
                                {r.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Motivo (mín. 5 caracteres)"
                        value={motivoRol}
                        onChange={(e) => setMotivoRol(e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                    </div>
                    <Button
                      onClick={handleAsignarRol}
                      disabled={!rolSeleccionado || asignarRol.isPending}
                      size="sm"
                    >
                      {asignarRol.isPending && <Loader2 className="animate-spin" />}
                      <Plus />
                      Asignar rol
                    </Button>
                  </div>

                  {/* Historial de roles */}
                  {historial?.roles && historial.roles.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2">
                        <History className="size-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Historial</p>
                      </div>
                      <div className="space-y-2">
                        {historial.roles.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between rounded border border-border/50 p-2 text-xs"
                          >
                            <div>
                              <p className="font-medium">{r.rol_nombre}</p>
                              <p className="text-muted-foreground">
                                {formatDate(r.fecha_desde)} —{' '}
                                {r.fecha_hasta ? formatDate(r.fecha_hasta) : 'vigente'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={r.estado === 'ACT' ? 'default' : 'secondary'}>
                                {r.estado}
                              </Badge>
                              {r.estado === 'INA' && !rolVigente?.rolVigente && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setAccion({
                                      tipo: 'reactivar-rol',
                                      usuarioRolId: r.id,
                                    })
                                  }
                                >
                                  Reactivar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Acciones */}
                <TabsContent value="acciones" className="space-y-3 py-4">
                  <AccionCard
                    title="Resetear contraseña"
                    description="Genera una contraseña temporal. El usuario deberá cambiarla en su próximo login."
                    actionLabel="Resetear"
                    onClick={() => setAccion({ tipo: 'reset' })}
                  />

                  {usuario.estado === 'ACT' ? (
                    <AccionCard
                      title="Suspender usuario"
                      description="El usuario no podrá iniciar sesión hasta ser reactivado."
                      actionLabel="Suspender"
                      variant="destructive"
                      onClick={() => setAccion({ tipo: 'suspender' })}
                    />
                  ) : usuario.estado === 'SUS' || usuario.estado === 'INA' ? (
                    <AccionCard
                      title="Reactivar usuario"
                      description="Vuelve a habilitar el acceso del usuario al sistema."
                      actionLabel="Reactivar"
                      onClick={() => setAccion({ tipo: 'reactivar' })}
                    />
                  ) : null}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Confirmaciones ──────────────────────────────────────── */}

      <ConfirmDialog
        open={accion?.tipo === 'inactivar-rol'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Inactivar rol vigente"
        description="El usuario quedará sin rol activo y no podrá operar hasta que se le asigne uno nuevo."
        confirmLabel="Inactivar"
        variant="destructive"
        isLoading={inactivarRol.isPending}
        onConfirm={() => {
          if (usuarioId) {
            inactivarRol.mutate(
              { id: usuarioId, motivo: 'INACTIVACION DESDE PANEL' },
              { onSuccess: () => setAccion(null) }
            );
          }
        }}
      />

      <ConfirmDialog
        open={accion?.tipo === 'reactivar-rol'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Reactivar rol"
        description="Se restaurará el rol como vigente del usuario."
        confirmLabel="Reactivar"
        isLoading={reactivarRol.isPending}
        onConfirm={() => {
          if (usuarioId && accion?.tipo === 'reactivar-rol') {
            reactivarRol.mutate(
              {
                id: usuarioId,
                usuarioRolId: accion.usuarioRolId,
                motivo: 'REACTIVACION DESDE PANEL',
              },
              { onSuccess: () => setAccion(null) }
            );
          }
        }}
      />

      <ConfirmDialog
        open={accion?.tipo === 'suspender'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Suspender usuario"
        description="El usuario no podrá iniciar sesión y su rol vigente será inactivado."
        confirmLabel="Suspender"
        variant="destructive"
        isLoading={cambiarEstado.isPending}
        onConfirm={() => {
          if (usuarioId) {
            cambiarEstado.mutate(
              { id: usuarioId, estado: 'SUS', motivo: 'SUSPENSION DESDE PANEL' },
              { onSuccess: () => setAccion(null) }
            );
          }
        }}
      />

      <ConfirmDialog
        open={accion?.tipo === 'reactivar'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Reactivar usuario"
        description="El usuario podrá volver a iniciar sesión."
        confirmLabel="Reactivar"
        isLoading={cambiarEstado.isPending}
        onConfirm={() => {
          if (usuarioId) {
            cambiarEstado.mutate(
              { id: usuarioId, estado: 'ACT', motivo: 'REACTIVACION DESDE PANEL' },
              { onSuccess: () => setAccion(null) }
            );
          }
        }}
      />

      <ConfirmDialog
        open={accion?.tipo === 'reset'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Resetear contraseña"
        description="Se generará una contraseña temporal nueva. El usuario deberá cambiarla en su próximo login."
        confirmLabel="Resetear"
        isLoading={resetPassword.isPending}
        onConfirm={() => {
          if (usuarioId) {
            resetPassword.mutate(
              { id: usuarioId, motivo: 'RESET DESDE PANEL' },
              {
                onSuccess: (res) => {
                  setAccion(null);
                  setResetResult({
                    username: res.username,
                    passwordTemporal: res.passwordTemporal,
                  });
                },
              }
            );
          }
        }}
      />

      {/* ─── Resultado del reset (con copiar) ────────────────────── */}
      <ResetPasswordResultDialog
        open={!!resetResult}
        onOpenChange={(o) => !o && setResetResult(null)}
        data={resetResult}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-componentes
// ═══════════════════════════════════════════════════════════════════════

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}

function AccionCard({
  title,
  description,
  actionLabel,
  variant = 'default',
  onClick,
}: {
  title: string;
  description: string;
  actionLabel: string;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Button variant={variant} size="sm" onClick={onClick}>
        {actionLabel}
      </Button>
    </div>
  );
}

function ResetPasswordResultDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: { username: string; passwordTemporal: string } | null;
}) {
  if (!data) return null;

  const copiarTodo = () => {
    const texto = `Usuario: ${data.username}\nContraseña temporal: ${data.passwordTemporal}\nCambie su contraseña en el primer inicio de sesión.`;
    navigator.clipboard.writeText(texto);
    toast.success('Credenciales copiadas en bloque');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success/10 p-2.5 text-success">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <DialogTitle>Contraseña reseteada</DialogTitle>
              <DialogDescription>
                Comparta estas credenciales con el usuario. Deberá cambiarlas en su próximo login.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Usuario
              </p>
              <code className="font-mono text-sm font-semibold">{data.username}</code>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(data.username);
                toast.success('Usuario copiado');
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Contraseña temporal
              </p>
              <code className="break-all font-mono text-sm font-semibold">
                {data.passwordTemporal}
              </code>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(data.passwordTemporal);
                toast.success('Contraseña copiada');
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={copiarTodo} className="w-full sm:w-auto">
            <Copy />
            Copiar todo
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
