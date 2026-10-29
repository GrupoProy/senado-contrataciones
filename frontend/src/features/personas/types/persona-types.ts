export interface Persona {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  complemento: string | null;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  estado_civil: string | null;
  nacionalidad: string | null;
  lugar_nacimiento: string | null;
  profesion: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  pais_residencia: string | null;
  ciudad_residencia: string | null;
  estado: string;
  edad?: number | null;
}

export interface CrearPersonaInput {
  tipoDocumento: string;
  numeroDocumento: string;
  complemento?: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido?: string | null;
  fechaNacimiento: string;
  genero?: string | null;
  estadoCivil?: string | null;
  nacionalidad?: string | null;
  lugarNacimiento?: string | null;
  profesion?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  paisResidencia?: string | null;
  ciudadResidencia?: string | null;
}

export interface PersonasQuery {
  page?: number;
  limit?: number;
  search?: string;
}
