import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ServicioArchivos, RespuestaArchivo } from '../../archivos/servicios/archivos.service';
import { ServiciosMantenimientos } from '../../mantenimientos/servicios/mantenimientos.service';
import { AlistamientoDocumento, AlistamientoRegistro, HistorialAlistamiento, ProtocoloAlistamiento } from './alistamientos.models';
import { DetallesActividades } from '../../mantenimientos/modelos/RegistroProtocoloAlistamiento';

const TIPO_ALISTAMIENTO = 3;

@Injectable({ providedIn: 'root' })
export class AlistamientosService {
  private readonly mantenimientos = inject(ServiciosMantenimientos);
  private readonly archivos = inject(ServicioArchivos);

  listarDocumentos(vigiladoId: string): Observable<AlistamientoDocumento[]> {
    return this.mantenimientos.listarDocumentos(TIPO_ALISTAMIENTO, vigiladoId).pipe(
      // Mapear formato crudo del backend a nuestro modelo tipado
      map((res: any) => {
        const arr: any[] = Array.isArray(res) ? res : [];
        return arr.map(d => ({
          documento: d.documento,
          ruta: d.ruta,
          nombreOriginal: d.nombreOriginal,
          fecha: d.fecha,
          estado: d.estado,
          id: d.id ?? d.mantenimiento_id ?? undefined,
          tipo_id: d.tipo_id ?? undefined,
        })) as AlistamientoDocumento[];
      })
    );
  }

  guardarArchivoMetadata(nombreAlmacenado: string, nombreOriginal: string, ruta: string, vigiladoId: string): Observable<unknown> {
    return this.mantenimientos.guardarArchivo(TIPO_ALISTAMIENTO, nombreAlmacenado, nombreOriginal, ruta, vigiladoId);
  }

  subirArchivo(archivo: File, vigiladoId: string): Observable<RespuestaArchivo> {
    return this.archivos.guardarArchivo(archivo, 'sicov', vigiladoId);
  }

  descargarArchivo(documento: string, ruta: string, nombreOriginal: string): void {
    this.archivos.descargarArchivo(documento, ruta, nombreOriginal);
  }

  listarRegistros(vigiladoId: string, rolId?: string | number | null): Observable<AlistamientoRegistro[]> {
    return this.mantenimientos.listarRegistros(TIPO_ALISTAMIENTO, vigiladoId, rolId) as Observable<AlistamientoRegistro[]>;
  }

  crearMantenimiento(vigiladoId: string, placa: string): Observable<{ id: string | number }> {
    return this.mantenimientos.guardarMantenimiento(vigiladoId, placa, TIPO_ALISTAMIENTO) as Observable<{ id: string | number }>;
  }

  guardarAlistamiento(protocolo: ProtocoloAlistamiento, mantenimientoId: string | number): Observable<unknown> {
    return this.mantenimientos.guardarAlistamiento(protocolo, mantenimientoId);
  }

  visualizarAlistamiento(mantenimientoId: string | number): Observable<ProtocoloAlistamiento> {
    return this.mantenimientos.visualizarAlistamiento(mantenimientoId) as Observable<ProtocoloAlistamiento>;
  }

  listarHistorial(vigiladoId: string, placa: string): Observable<HistorialAlistamiento[]> {
    return this.mantenimientos.historial(TIPO_ALISTAMIENTO, vigiladoId, placa) as Observable<HistorialAlistamiento[]>;
  }

  exportarHistorial(vigiladoId: string, placa: string): string {
    return this.mantenimientos.exportarHistorial(TIPO_ALISTAMIENTO, vigiladoId, placa);
  }

  listarActividades(): Observable<DetallesActividades[]> {
    return this.mantenimientos.listarActividades() as Observable<DetallesActividades[]>;
  }
}
