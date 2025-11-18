import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { IniciarSesionRespuesta, PeticionRecuperarContrasena, Rol, Usuario, Modulo, Submodulo } from './models/auth.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly http = inject(HttpClient);

  // URLs de backend (placeholder hasta tener APIs reales)
  private urlBackend = environment.urlBackend;
  private urlSinst = '';

  // Headers base
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  // Llaves en localStorage
  readonly llaveTokenLocalStorage = 'jwtTerminales';
  readonly llaveTokenExternoLocalStorage = 'jwtExternoTerminales';
  readonly llaveUsuarioLocalStorage = 'UsuarioTerminales';
  readonly llaveRolesLocalStorage = 'rolTerminales';
  readonly llaveModulosLocalStorage = 'modulosTerminales';

  // Modo mock mientras no hay API
  private readonly usarMock = false;

  public iniciarSesion(documento: string, clave: string): Observable<IniciarSesionRespuesta> {
    if (this.usarMock) {
      return this.mockLogin(documento, clave).pipe(delay(500));
    }
    const endpoint = '/api/v1/autenticacion/inicio-sesion';
    const body = { usuario: documento, contrasena: clave };
    return this.http.post<IniciarSesionRespuesta>(`${this.urlBackend}${endpoint}`, body, {
      headers: this.headers,
    });
  }

  public iniciarSesion2(documento: string, clave: string): Observable<IniciarSesionRespuesta> {
    if (this.usarMock) {
      return this.mockLogin(documento, clave).pipe(delay(500));
    }
    const endpoint = '/api/v1/autenticacion/inicio-sesion';
    const body = { usuario: documento, contrasena: clave };
    return this.http.post<IniciarSesionRespuesta>(`${this.urlSinst}${endpoint}`, body, {
      headers: this.headers,
    });
  }

  public recuperarContrasena(payload: PeticionRecuperarContrasena): Observable<string> {
    if (this.usarMock) {
      return of('OK').pipe(delay(500));
    }
    const endpoint = '/api/v1/envio-email';
    return this.http.post<string>(`${this.urlBackend}${endpoint}`, payload, {
      headers: this.headers,
    });
  }

  public cambiarClave(identificacion: string | number, clave: string, nuevaClave: string): Observable<unknown> {
    const endpoint = '/api/v1/autenticacion/cambiar-clave';
    const body = { identificacion: String(identificacion), clave, nuevaClave };
    return this.http.post(`${this.urlBackend}${endpoint}`, body, { headers: this.headers });
  }

  public cerrarSesion(): void {
    localStorage.removeItem('inicio-sesion');
    localStorage.removeItem('inicio-vigia2');
    localStorage.removeItem(this.llaveUsuarioLocalStorage);
    localStorage.removeItem(this.llaveTokenLocalStorage);
    localStorage.removeItem(this.llaveRolesLocalStorage);
    localStorage.removeItem(this.llaveModulosLocalStorage);
    localStorage.removeItem('rutasRevisadas');
  }

  // Lectura rápida desde localStorage
  public getRol(): Rol | null {
    const raw = localStorage.getItem(this.llaveRolesLocalStorage);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Rol;
    } catch {
      return null;
    }
  }

  public getModulos(): Modulo[] {
    // Preferir módulos guardados en la raíz de la respuesta de inicio de sesión
    let origen: any[] = [];
    const rawRoot = localStorage.getItem(this.llaveModulosLocalStorage);
    if (rawRoot) {
      try {
        origen = JSON.parse(rawRoot) as any[];
      } catch {
        origen = [];
      }
    }
    if (!origen.length) {
      origen = (this.getRol()?.modulos as any[]) ?? [];
    }

    const modulos: Modulo[] = [...origen].map((raw, index) => this.normalizarModulo(raw, index));

    const tieneInicio = modulos.some((m) => this.esRutaInicio(m.ruta));
    if (!tieneInicio) {
      modulos.unshift(this.moduloInicio());
    } else {
      // Garantiza que el módulo de inicio sea el primero si ya venía del backend.
      modulos.sort((a, b) => (this.esRutaInicio(a.ruta) ? -1 : this.esRutaInicio(b.ruta) ? 1 : 0));
    }

    return modulos;
  }

  // Normaliza objetos de módulo que pueden venir con propiedades subrayadas o con nombres alternos
  private normalizarModulo(raw: any, index: number, rutaPadre?: string): Modulo {
    const id = String(raw?.id ?? raw?._id ?? raw?.codigo ?? raw?.value ?? '');
    const nombre = String(raw?.nombre ?? raw?._nombre ?? raw?.name ?? raw?.titulo ?? '');
    const nombreMostrar = String(
      raw?.nombreMostrar ?? raw?._nombreMostrar ?? raw?.label ?? raw?.titulo ?? nombre
    );
    const rutaRaw = String(raw?.ruta ?? raw?._ruta ?? raw?.path ?? raw?.url ?? '');
    const ruta = this.normalizarRuta(rutaRaw, Boolean(rutaPadre), rutaPadre);
    const icono = String(raw?.icono ?? raw?._icono ?? this.iconosPredefinidos[index] ?? 'bi-grid');
    const estado = Boolean(raw?.estado ?? raw?._estado ?? true);
    const creacion = new Date(raw?.creacion ?? raw?._creacion ?? Date.now());
    const actualizacion = new Date(raw?.actualizacion ?? raw?._actualizacion ?? Date.now());

    const subraw: any[] = (raw?.submodulos ?? raw?._submodulos ?? raw?.sub_modulos ?? []) as any[];
    const submodulos: Submodulo[] = subraw.map((sr, i) => {
      const sid = String(sr?.id ?? sr?._id ?? sr?.codigo ?? sr?.value ?? '');
      const snombre = String(sr?.nombre ?? sr?._nombre ?? sr?.name ?? sr?.titulo ?? '');
      const snombreMostrar = String(
        sr?.nombreMostrar ?? sr?._nombreMostrar ?? sr?.label ?? sr?.titulo ?? snombre
      );
      const srutaRaw = String(sr?.ruta ?? sr?._ruta ?? sr?.path ?? sr?.url ?? '');
      const sruta = this.normalizarRuta(srutaRaw, true, ruta);
      const sicono = String(sr?.icono ?? sr?._icono ?? '');
      const sestado = Boolean(sr?.estado ?? sr?._estado ?? true);
      const screacion = new Date(sr?.creacion ?? sr?._creacion ?? Date.now());
      const sactualizacion = new Date(sr?.actualizacion ?? sr?._actualizacion ?? Date.now());
      return {
        id: sid,
        nombre: snombre,
        nombreMostrar: snombreMostrar,
        ruta: sruta,
        icono: sicono,
        estado: sestado,
        creacion: screacion,
        actualizacion: sactualizacion,
      } as Submodulo;
    });

    return {
      id,
      nombre,
      nombreMostrar,
      ruta,
      icono,
      estado,
      creacion,
      actualizacion,
      submodulos,
    } as Modulo;
  }

  public getRutaInicialPorRol(): string {
    const modulos = this.getModulos();
    if (!modulos.length) {
      return '/dashboard';
    }

    const primerModulo = modulos[0];
    if (this.esRutaInicio(primerModulo.ruta)) {
      return '/dashboard';
    }

    const primerSub = primerModulo.submodulos?.[0];
    if (primerSub) {
      return this.normalizarRuta(primerSub.ruta, true, primerModulo.ruta) || '/dashboard';
    }

    return this.normalizarRuta(primerModulo.ruta) || '/dashboard';
  }

  public getUsuario(): Usuario | null {
    const raw = localStorage.getItem(this.llaveUsuarioLocalStorage);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  public getToken(): string | null {
    return localStorage.getItem(this.llaveTokenLocalStorage);
  }

  public guardarInformacionInicioSesion(
    jwt: string,
    tokenExterno: string | undefined,
    rol: object,
    usuario: object,
    aplicativos?: object,
    modulosRoot?: object
  ): void {
    localStorage.setItem(this.llaveTokenLocalStorage, jwt);
    if (tokenExterno) {
      localStorage.setItem(this.llaveTokenExternoLocalStorage, tokenExterno);
    }
    localStorage.setItem(this.llaveRolesLocalStorage, JSON.stringify(rol));
    localStorage.setItem(this.llaveUsuarioLocalStorage, JSON.stringify(usuario));
    if (aplicativos) {
      localStorage.setItem('aplicativosTerminales', JSON.stringify(aplicativos));
    }
    if (modulosRoot) {
      try {
        localStorage.setItem(this.llaveModulosLocalStorage, JSON.stringify(modulosRoot));
      } catch {
        // Silenciar errores de storage
      }
    }
  }

  private readonly iconosPredefinidos = ['bi-house-door', 'bi-people', 'bi-sliders2', 'bi-shield-lock', 'bi-truck', 'bi-clock-history'];

  private moduloInicio(): Modulo {
    const ahora = new Date();
    return {
      id: 'inicio-fixed',
      nombre: 'Inicio',
      nombreMostrar: 'Inicio',
      ruta: '/dashboard',
      icono: 'bi-house-door',
      estado: true,
      creacion: ahora,
      actualizacion: ahora,
      submodulos: [],
    };
  }

  private normalizarRuta(ruta?: string, esSub = false, rutaPadre?: string): string {
    if (!ruta) {
      return esSub ? this.normalizarRuta(rutaPadre ?? '/dashboard') : '/dashboard';
    }
    const candidata = ruta.startsWith('/') ? ruta : `/${ruta}`;
    if (esSub && !candidata.startsWith('/dashboard')) {
      const base = this.normalizarRuta(rutaPadre ?? '/dashboard');
      const subRuta = candidata.startsWith('/') ? candidata.slice(1) : candidata;
      return `${base.replace(/\/$/, '')}/${subRuta}`;
    }
    return candidata;
  }

  private esRutaDashboard(ruta?: string): boolean {
    if (!ruta) return false;
    return this.normalizarRuta(ruta).startsWith('/dashboard');
  }

  private esRutaInicio(ruta?: string): boolean {
    if (!ruta) return false;
    const normalizada = this.normalizarRuta(ruta);
    return normalizada === '/dashboard' || normalizada === '/dashboard/inicio';
  }

  // Helpers
  private mockLogin(documento: string, clave: string): Observable<IniciarSesionRespuesta> {
    // Regla simple de mock: error si faltan datos
    if (!documento || !clave) {
      const rolVacio: Rol = {
        id: '0',
        nombre: 'Sin rol',
        estado: false,
        creacion: new Date().toISOString(),
        actualizacion: new Date().toISOString(),
        modulos: [],
      };
      const usuarioMin: Usuario = {
        id: '0',
        usuario: documento || '',
        nombre: '',
        apellido: '',
        telefono: '',
        correo: '',
        abrirModal: false,
        departamentoId: 0,
        municipioId: 0,
        esDepartamental: 0,
        nombreCiudad: '',
        nombreDepartamento: '',
        reportaOtroMunicipio: false,
      };
      return of({ token: '', rol: rolVacio, usuario: usuarioMin, claveTemporal: false });
    }

    const submods: Submodulo[] = [
      /* {
        id: 'sub-1',
        nombre: 'Inicio',
        nombreMostrar: 'Inicio',
        ruta: '/dashboard/inicio',
        icono: 'home',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
      }, */
    ];
    const modulos: Modulo[] = [
      {
        id: 'mod-1',
        nombre: 'Dashboard',
        nombreMostrar: 'Inicio',
        ruta: '/dashboard/inicio',
        icono: 'dashboard',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
        submodulos: submods,
      },
      {
        id: 'mod-2',
        nombre: 'Mantenimientos',
        nombreMostrar: 'Mantenimientos',
        ruta: '/dashboard/mantenimientos',
        icono: 'bi-nut',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
        submodulos: submods,
      },
      {
        id: 'mod-3',
        nombre: 'Alistamientos',
        nombreMostrar: 'Alistamientos',
        ruta: '/dashboard/alistamientos',
        icono: 'bi-box-seam',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
        submodulos: submods,
      },
      {
        id: 'mod-4',
        nombre: 'Autorizaciones',
        nombreMostrar: 'Autorizaciones',
        ruta: '/dashboard/autorizaciones',
        icono: 'bi-shield-lock',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
        submodulos: submods,
      },
      {
        id: 'mod-5',
        nombre: 'Salidas',
        nombreMostrar: 'Salidas',
        ruta: '/dashboard/salidas',
        icono: 'bi-car-front',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
        submodulos: submods,
      },
      {
        id: 'mod-6',
        nombre: 'Llegadas',
        nombreMostrar: 'Llegadas',
        ruta: '/dashboard/llegadas',
        icono: 'bi-car-front-fill',
        estado: true,
        creacion: new Date(),
        actualizacion: new Date(),
        submodulos: submods,
      },
    ];
    const rol: Rol = {
      id: 'rol-1',
      nombre: 'Operador',
      estado: true,
      creacion: new Date().toISOString(),
      actualizacion: new Date().toISOString(),
      modulos,
    };
    const usuario: Usuario = {
      id: '1',
      usuario: documento,
      nombre: 'Usuario',
      apellido: 'Demo',
      telefono: '+57 300 000 0000',
      correo: 'demo@example.com',
      abrirModal: false,
      departamentoId: 11,
      municipioId: 11001,
      esDepartamental: 0,
      nombreCiudad: 'Bogotá',
      nombreDepartamento: 'Cundinamarca',
      reportaOtroMunicipio: false,
    };
    const resp: IniciarSesionRespuesta = {
      token: 'mock-token-' + Math.random().toString(36).slice(2),
      rol,
      usuario,
      claveTemporal: false,
    };
    return of(resp);
  }
}
