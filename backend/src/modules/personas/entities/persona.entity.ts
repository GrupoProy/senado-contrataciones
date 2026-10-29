export interface PersonaEntity {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  complemento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  fechaNacimiento: Date | null;
  genero: string | null;
  estadoCivil: string | null;
  nacionalidad: string | null;
  lugarNacimiento: string | null;
  profesion: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  paisResidencia: string | null;
  ciudadResidencia: string | null;
  estado: string;
  fechaCreacion: Date;
}

export interface PersonaListado {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  complemento: string | null;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  fechaNacimiento: Date | null;
  genero: string | null;
  email: string | null;
  telefono: string | null;
  estado: string;
}