import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BaseApiService } from '../../core/base-api.service';

export interface RespuestaArchivo {
  nombreAlmacenado: string;
  nombreOriginalArchivo: string;
  ruta: string;
}

@Injectable({ providedIn: 'root' })
export class ServicioArchivos {
  private readonly api = inject(BaseApiService);

  // Mock básico para subir archivo. Reemplazar con endpoint real cuando esté disponible.
  guardarArchivo(archivo: File, categoria: string, usuario: string): Observable<RespuestaArchivo> {
    // Implementación real: API global para cargue de archivos.
    // Endpoint esperado (según Postman): POST /api/v1/archivos
    // Body (form-data):
    //  - archivo: File
    //  - idVigilado: string | number (tercer parámetro)
    //  - rutaRaiz: string (segundo parámetro, p.e. 'sicov')

    const fd = new FormData();
    fd.append('archivo', archivo);
    fd.append('idVigilado', String(usuario ?? ''));
    fd.append('rutaRaiz', categoria);

    return this.api.post<RespuestaArchivo>('/api/v1/archivos', fd, true);
  }

  descargarArchivo(nombre: string, ruta: string, nombreOriginal?: string): void {
    // Implementación simple: abrir la ruta; personalizar cuando haya API/firmas.
    const url = ruta.startsWith('http') ? ruta : `${ruta}/${encodeURIComponent(nombre)}`;
    window.open(url, '_blank');
  }
}
