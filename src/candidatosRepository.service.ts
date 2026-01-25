import { Injectable, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { EstadoVoto } from './census.service';

/**
 * Servicio de repositorio para la gestión del padrón electoral en Supabase.
 * Maneja todas las operaciones CRUD relacionadas con los datos de ciudadanos.
 */
@Injectable()
export class CandidatosService implements OnModuleInit {
  private readonly logger = new Logger(CandidatosService.name);
  private supabase: SupabaseClient<any, any, any>;

  constructor(private configService: ConfigService) {}

  /**
   * Inicializa la conexión con Supabase al arrancar el módulo.
   * 
   * @throws Error si faltan las credenciales de Supabase
   */
  onModuleInit(): void {
    try {
      const url = this.configService.get<string>('SUPABASE_URL');
      const key = this.configService.get<string>('SUPABASE_KEY');

      if (!url || !key) {
        throw new Error('Credenciales de Supabase no configuradas correctamente');
      }

      this.supabase = createClient(url, key, {
        db: { schema: 'public' }
      });
      
      this.logger.log('Conexión a Supabase inicializada correctamente');
    } catch (error) {
      this.logger.error('Error inicializando conexión a Supabase:', error);
      throw error;
    }
  }

  /**
   * Busca un ciudadano por su número de cédula.
   * 
   * @param cedula - Número de cédula del ciudadano
   * @returns Datos del ciudadano o null si no existe
   * @throws InternalServerErrorException si ocurre un error en la consulta
   */
  async obtenerCandidato(cedula: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('padron_electoral')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error) {
        this.logger.error(`Error consultando ciudadano ${cedula}:`, error.message);
        throw new InternalServerErrorException(`Error al buscar candidato: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Excepción buscando ciudadano ${cedula}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de votación de un ciudadano por su ID.
   * 
   * @param id - ID del ciudadano (como string)
   * @param nuevoEstado - Nuevo estado de votación
   * @returns Datos actualizados del ciudadano
   * @throws InternalServerErrorException si el ID es inválido o hay error en la actualización
   */
  async actualizarEstado(id: string, nuevoEstado: EstadoVoto): Promise<any> {
    try {
      const numericId = parseInt(id, 10);

      if (isNaN(numericId)) {
        throw new InternalServerErrorException(`ID inválido: ${id}`);
      }

      this.logger.log(`Actualizando estado para ID ${numericId}: ${nuevoEstado}`);

      const { data, error } = await this.supabase
        .from('padron_electoral')
        .update({
          estado_voto: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', numericId)
        .select()
        .single();

      if (error) {
        this.logger.error(`Error Supabase actualizando estado:`, error);
        throw new InternalServerErrorException(`Error al actualizar estado: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Error actualizando estado para ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Busca un ciudadano por su ID interno.
   * 
   * @param id - ID interno del ciudadano
   * @returns Datos del ciudadano o null si no existe
   * @throws InternalServerErrorException si ocurre un error en la consulta
   */
  async obtenerCandidatoPorId(id: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('padron_electoral')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        this.logger.error(`Error consultando ciudadano por ID ${id}:`, error.message);
        throw new InternalServerErrorException(`Error al buscar candidato: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Excepción buscando ciudadano por ID ${id}:`, error);
      throw error;
    }
  }
}