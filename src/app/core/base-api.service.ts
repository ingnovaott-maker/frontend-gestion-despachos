import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AutenticacionService } from './autenticacion.service';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AutenticacionService);
  private readonly baseUrl = environment.urlBackend;

  private authHeaders(extra?: Record<string, string>, contentType: 'json' | 'none' = 'json') {
    const token = this.auth.getToken();
    // Only set Content-Type for JSON bodies. For FormData, the browser sets the correct boundary.
    let headers = new HttpHeaders(
      contentType === 'json' ? { 'Content-Type': 'application/json', ...(extra || {}) } : { ...(extra || {}) }
    );
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return { headers };
  }

  get<T>(endpointOrUrl: string, params?: HttpParams) {
    const url = endpointOrUrl.startsWith('http') ? endpointOrUrl : `${this.baseUrl}${endpointOrUrl}`;
    return this.http.get<T>(url, { ...this.authHeaders(), params });
  }

  post<T>(endpointOrUrl: string, body: unknown, isFormData = false) {
    const url = endpointOrUrl.startsWith('http') ? endpointOrUrl : `${this.baseUrl}${endpointOrUrl}`;
    const opts = isFormData ? this.authHeaders({}, 'none') : this.authHeaders();
    return this.http.post<T>(url, body, opts);
  }

  put<T>(endpointOrUrl: string, body: unknown, isFormData = false) {
    const url = endpointOrUrl.startsWith('http') ? endpointOrUrl : `${this.baseUrl}${endpointOrUrl}`;
    const opts = isFormData ? this.authHeaders({}, 'none') : this.authHeaders();
    return this.http.put<T>(url, body, opts);
  }

  delete<T>(endpointOrUrl: string) {
    const url = endpointOrUrl.startsWith('http') ? endpointOrUrl : `${this.baseUrl}${endpointOrUrl}`;
    return this.http.delete<T>(url, this.authHeaders());
  }
}
