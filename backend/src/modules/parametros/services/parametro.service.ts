import { ParametroRepository, ParametroRow } from '../repositories/parametro.repository';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';

/**
 * Servicio central de parámetros del sistema.
 *
 * Fuente única de verdad para valores configurables (vigencias de token,
 * umbrales de bloqueo, flags de jobs, etc.). Mantiene una caché en memoria
 * que se carga al arranque y se invalida al editar un parámetro.
 *
 * Uso:
 *   parametroService.getInt('AUTH_ACCESS_TOKEN_MINUTES', 15)
 *   parametroService.getBool('JOB_CONTRATOS_HABILITADO', true)
 */
export class ParametroService {
  private repository = new ParametroRepository();

  /** Caché clave → valor parseado según tipo_dato. */
  private cache = new Map<string, unknown>();
  private cacheCargada = false;

  // ───────────────────────────────────────────────────────────────────────
  // Caché
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Carga (o recarga) todos los parámetros ACTIVOS desde la BD.
   * Se invoca al arranque del servidor y tras cada edición.
   */
  async cargarCache(): Promise<void> {
    const filas = await this.repository.listarTodosActivos();

    this.cache.clear();

    for (const fila of filas) {
      const valorCrudo = fila.valor ?? fila.valor_por_defecto;
      if (valorCrudo === null || valorCrudo === undefined) {
        console.warn(`⚠️  Parámetro '${fila.clave}' sin valor. Se ignora.`);
        continue;
      }
      try {
        this.cache.set(fila.clave, this.parsear(fila.tipo_dato, valorCrudo));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`❌ Error parseando parámetro '${fila.clave}': ${msg}`);
      }
    }

    this.cacheCargada = true;
    console.log(`✅ Parámetros cargados en caché: ${this.cache.size}`);
  }

  /** Vacía la caché para forzar recarga en el próximo acceso. */
  invalidarCache(): void {
    this.cache.clear();
    this.cacheCargada = false;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Lectura tipada
  // ───────────────────────────────────────────────────────────────────────

  /** Devuelve el valor parseado. Lanza si no existe y no se da default. */
  get<T = unknown>(clave: string): T {
    this.assertCacheCargada();
    if (!this.cache.has(clave)) {
      throw new NotFoundError(`Parámetro de sistema '${clave}' no encontrado o inactivo`);
    }
    return this.cache.get(clave) as T;
  }

  /** Devuelve el valor o un default si no existe. */
  getOr<T = unknown>(clave: string, defaultValue: T): T {
    if (!this.cacheCargada || !this.cache.has(clave)) return defaultValue;
    return this.cache.get(clave) as T;
  }

  getInt(clave: string, defaultVal?: number): number {
    if (defaultVal !== undefined) {
      const v = this.getOr<number>(clave, defaultVal);
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw new ValidationError(`Parámetro '${clave}' no es un entero válido`);
      }
      return v;
    }
    const v = this.get<number>(clave);
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new ValidationError(`Parámetro '${clave}' no es un entero válido`);
    }
    return v;
  }

  getBool(clave: string, defaultVal?: boolean): boolean {
    if (defaultVal !== undefined) {
      const v = this.getOr<boolean>(clave, defaultVal);
      if (typeof v !== 'boolean') {
        throw new ValidationError(`Parámetro '${clave}' no es booleano`);
      }
      return v;
    }
    const v = this.get<boolean>(clave);
    if (typeof v !== 'boolean') {
      throw new ValidationError(`Parámetro '${clave}' no es booleano`);
    }
    return v;
  }

  getString(clave: string, defaultVal?: string): string {
    if (defaultVal !== undefined) {
      const v = this.getOr<string>(clave, defaultVal);
      if (typeof v !== 'string') {
        throw new ValidationError(`Parámetro '${clave}' no es texto`);
      }
      return v;
    }
    const v = this.get<string>(clave);
    if (typeof v !== 'string') {
      throw new ValidationError(`Parámetro '${clave}' no es texto`);
    }
    return v;
  }

  getDecimal(clave: string, defaultVal?: number): number {
    if (defaultVal !== undefined) {
      const v = this.getOr<number>(clave, defaultVal);
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw new ValidationError(`Parámetro '${clave}' no es decimal válido`);
      }
      return v;
    }
    const v = this.get<number>(clave);
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new ValidationError(`Parámetro '${clave}' no es decimal válido`);
    }
    return v;
  }

  // ───────────────────────────────────────────────────────────────────────
  // CRUD
  // ───────────────────────────────────────────────────────────────────────

  /** Listado completo (para el frontend de administración). */
  async listar(grupo?: string) {
    return this.repository.listar(grupo);
  }

  /** Actualiza el valor de un parámetro y recarga la caché. */
  async actualizar(
    clave: string,
    nuevoValor: string,
    usuarioModificacion: string
  ): Promise<void> {
    const p = await this.repository.obtenerPorClave(clave);
    if (!p) throw new NotFoundError(`Parámetro '${clave}' no existe`);
    if (!p.es_editable) throw new ValidationError(`Parámetro '${clave}' no es editable`);

    // Validar parseable ANTES de persistir
    this.parsear(p.tipo_dato, nuevoValor);

    await this.repository.actualizar(clave, nuevoValor, usuarioModificacion);
    await this.cargarCache(); // impacto inmediato
  }

  // ───────────────────────────────────────────────────────────────────────
  // Privados
  // ───────────────────────────────────────────────────────────────────────

  private assertCacheCargada(): void {
    if (!this.cacheCargada) {
      throw new Error(
        'La caché de parámetros no ha sido cargada. ' +
          'Llame a parametroService.cargarCache() al iniciar el servidor.'
      );
    }
  }

  private parsear(tipo: ParametroRow['tipo_dato'], valor: string): unknown {
    switch (tipo) {
      case 'INTEGER': {
        const n = parseInt(valor, 10);
        if (Number.isNaN(n)) throw new Error(`Valor '${valor}' no es entero`);
        return n;
      }
      case 'DECIMAL': {
        const n = parseFloat(valor);
        if (Number.isNaN(n)) throw new Error(`Valor '${valor}' no es decimal`);
        return n;
      }
      case 'BOOLEAN': {
        const v = valor.trim().toLowerCase();
        if (['true', '1', 't', 'si', 'sí', 'yes', 'y'].includes(v)) return true;
        if (['false', '0', 'f', 'no', 'n'].includes(v)) return false;
        throw new Error(`Valor '${valor}' no es booleano`);
      }
      case 'JSON':
        return JSON.parse(valor);
      case 'STRING':
      case 'DATE':
      case 'DATETIME':
      default:
        return valor;
    }
  }

  
}

/** Singleton para todo el proceso. */
export const parametroService = new ParametroService();