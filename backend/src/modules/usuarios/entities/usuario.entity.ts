export interface UsuarioEntity {
  id: number;
  username: string;
  email: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  telefono: string | null;
  unidadOrganizacionalId: number | null;
  estado: string;
  debeCambiarPassword: boolean;
  ultimoAcceso: Date | null;
  fechaCreacion: Date;
  // Relaciones
  unidadNombre?: string | null;
  rolId?: number | null;
  rolCodigo?: string | null;
  rolNombre?: string | null;
}

export interface UsuarioListado {
  id: number;
  username: string;
  email: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  estado: string;
  unidadNombre: string | null;
  rolNombre: string | null;
  ultimoAcceso: Date | null;
}