import { Injectable, inject } from '@angular/core';
import { AutenticacionService } from '../../core/autenticacion.service';
import { Usuario, Rol } from '../../core/models/auth.models';

@Injectable({ providedIn: 'root' })
export class ServicioLocalStorage {
  private readonly auth = inject(AutenticacionService);

  obtenerUsuario(): Usuario | null {
    return this.auth.getUsuario();
  }

  obtenerRol(): Rol | null {
    return this.auth.getRol();
  }
}
