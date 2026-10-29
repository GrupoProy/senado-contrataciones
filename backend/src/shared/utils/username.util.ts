import { query } from '../../config/database';

/**
 * Genera un username único según las reglas de negocio:
 * 1. Primera letra del nombre + primer apellido
 * 2. Si existe: primera letra del nombre + primera letra del segundo apellido + primer apellido
 * 3. Si existe: primera letra del nombre + dos primeras letras del segundo apellido + primer apellido
 * 4. Si ninguna variante está disponible, lanza error.
 */
export async function generarUsernameUnico(
  nombres: string,
  primerApellido: string,
  segundoApellido: string | null
): Promise<string> {
  const schema = process.env.DB_SCHEMA;
  const n = nombres.trim().toLowerCase();
  const pa = primerApellido.trim().toLowerCase();
  const sa = (segundoApellido ?? '').trim().toLowerCase();

  const variantes: string[] = [];

  // Variante 1: primera letra nombre + primer apellido
  variantes.push(`${n.charAt(0)}${pa}`);

  if (sa.length >= 1) {
    // Variante 2: primera letra nombre + primera letra segundo apellido + primer apellido
    variantes.push(`${n.charAt(0)}${sa.charAt(0)}${pa}`);
  }

  if (sa.length >= 2) {
    // Variante 3: primera letra nombre + dos primeras letras segundo apellido + primer apellido
    variantes.push(`${n.charAt(0)}${sa.substring(0, 2)}${pa}`);
  }

  for (const variante of variantes) {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${schema}.usuario WHERE username = $1`,
      [variante]
    );
    if (parseInt(result.rows[0].count, 10) === 0) {
      return variante;
    }
  }

  throw new Error(
    `No se pudo generar un username único para ${nombres} ${primerApellido}. ` +
      `Todas las variantes están en uso.`
  );
}