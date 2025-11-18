import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacionService } from './autenticacion.service';
import { IniciarSesionRespuesta } from './models/auth.models';
import { firstValueFrom } from 'rxjs';

export type User = { username: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly authApi = inject(AutenticacionService);

  private readonly userSig = signal<User | null>(null);
  readonly user: Signal<User | null> = this.userSig.asReadonly();
  readonly isAuthenticated = computed(() => this.userSig() !== null);

  constructor() {
    const raw = localStorage.getItem('auth:user');
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Partial<User> & { email?: string };
        const username = stored?.username ?? stored?.email;
        if (username) {
          this.userSig.set({ username });
          if (!stored.username) {
            localStorage.setItem('auth:user', JSON.stringify({ username } satisfies User));
          }
        } else {
          localStorage.removeItem('auth:user');
        }
      } catch {
        localStorage.removeItem('auth:user');
      }
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    if (!username || !password) return false;
    let resp: IniciarSesionRespuesta | null = null;
    try {
      resp = await firstValueFrom(this.authApi.iniciarSesion(username, password));
    } catch {
      return false;
    }
    if (!resp || !resp.token) return false;
    // Guardar información en storage para Sidebar/rutas
    this.authApi.guardarInformacionInicioSesion(
      resp.token,
      resp.tokenExterno,
      resp.rol as unknown as object,
      resp.usuario as unknown as object,
      resp.aplicativos as unknown as object,
      (resp.modulos && resp.modulos.length ? resp.modulos : resp.rol?.modulos) as unknown as object
    );
    const u = { username: resp.usuario.usuario } satisfies User;
    this.userSig.set(u);
    localStorage.setItem('auth:user', JSON.stringify(u));
    return true;
  }

  async recover(usuario: string, correo: string): Promise<boolean> {
    if (!usuario || !correo) return false;
    try {
      await firstValueFrom(this.authApi.recuperarContrasena({ usuario: String(usuario).trim(), correo: String(correo).trim() }));
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.userSig.set(null);
    localStorage.removeItem('auth:user');
    this.authApi.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
