import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AutenticacionService } from '../../core/autenticacion.service';
import { CrearSalida, Salida } from './salidas.models';

@Injectable({ providedIn: 'root' })
export class SalidasService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AutenticacionService);
  private readonly baseUrl = environment.urlBackend;

  private headers() {
    const token = this.auth.getToken();
    let headers = new HttpHeaders({'Content-Type': 'application/json'});
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return { headers };
  }

  listar(nit?: string) {
    const url = nit ? `${this.baseUrl}/api/v1/despachos?nit=${encodeURIComponent(nit)}` : `${this.baseUrl}/api/v1/despachos`;
    return this.http.get<{ array_data?: Salida[]; data?: Salida[] }>(url, this.headers());
  }

  obtener(id: number) {
    const url = `${this.baseUrl}/api/v1/despachos/${id}`;
    return this.http.get<Salida>(url, this.headers());
  }

  guardar(body: CrearSalida, id?: number) {
    const url = id ? `${this.baseUrl}/api/v1/despachos?id=${id}` : `${this.baseUrl}/api/v1/despachos`;
    return id
      ? this.http.put(url, body, this.headers())
      : this.http.post(url, body, this.headers());
  }
}
