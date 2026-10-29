/**
 * Calcula la edad en años a partir de la fecha de nacimiento.
 */
export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/**
 * Valida que una persona sea mayor de 18 años.
 */
export function esMayorDeEdad(fechaNacimiento: Date): boolean {
  return calcularEdad(fechaNacimiento) >= 18;
}