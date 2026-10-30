export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  estado: string;
  intentos_fallidos: number;
  bloqueado_hasta?: string | null;
  debe_cambiar_password: boolean;
  unidad_id: number | null;
  unidad_nombre: string | null;
  rol_codigo: string | null;
  rol_nombre: string | null;
  ultimo_acceso: string | null;
  fecha_creacion: string;
}

export interface CrearUsuarioInput {
  email: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  primerApellido: string;
  segundoApellido?: string | null;
  telefono?: string | null;
  unidadOrganizacionalId: number;
  rolId: number;
}

export interface UsuarioRol {
  id: number;
  usuario_id: number;
  rol_id: number;
  rol_codigo: string;
  rol_nombre: string;
  fecha_desde: string;
  fecha_hasta: string | null;
  estado: string;
}

export interface RolVigente {
  usuarioRolId: number;
  rolId: number;
  rolCodigo: string;
  rolNombre: string;
  fechaDesde: string;
  fechaHasta: string | null;
}

export interface UsuariosQuery {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  unidadId?: number;
}
