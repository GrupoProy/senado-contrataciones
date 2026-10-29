import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Building } from 'lucide-react';

export function PerfilPage() {
  const { usuario } = useAuthStore();

  if (!usuario) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Perfil" description="Información de su cuenta de usuario" icon={User} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {usuario.nombres} {usuario.primerApellido}
                </p>
                <p className="font-mono text-xs text-muted-foreground">@{usuario.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <p>{usuario.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rol y Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{usuario.rol.nombre}</p>
                <Badge variant="secondary" className="mt-1 font-mono text-[10px]">
                  {usuario.rol.codigo}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="size-4 text-muted-foreground" />
              <p>Unidad ID: {usuario.unidadId ?? 'No asignada'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
