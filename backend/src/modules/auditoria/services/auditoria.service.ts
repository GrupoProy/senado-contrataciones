import { AuditoriaRepository } from '../repositories/auditoria.repository';
import type { ListarAuditoriaDto } from '../dto/auditoria.dto';

export class AuditoriaService {
  private repository = new AuditoriaRepository();

  async listar(dto: ListarAuditoriaDto) {
    return this.repository.listar(dto);
  }
}