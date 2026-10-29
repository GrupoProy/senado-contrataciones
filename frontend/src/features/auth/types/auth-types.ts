export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  debeCambiarPassword: boolean;
  expiraEnMinutos?: number;
  usuario: {
    id: number;
    username: string;
    email: string;
    nombres: string;
    primerApellido: string;
    segundoApellido: string | null;
    unidadId: number | null;
    rol: {
      id: number;
      codigo: string;
      nombre: string;
    };
  };
}

export interface MiPerfil {
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
  unidad_id: number | null;
  unidad_nombre: string | null;
  rol_codigo: string | null;
  rol_nombre: string | null;
  ultimo_acceso: string | null;
  debe_cambiar_password: boolean;
  permisos: string[];
}
