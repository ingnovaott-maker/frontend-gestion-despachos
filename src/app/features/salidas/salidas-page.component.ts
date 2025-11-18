import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { ServicioLocalStorage } from '../../administrador/servicios/local-storage.service';
import { Usuario, Rol } from '../../core/models/auth.models';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SalidasFormComponent } from './salidas-form.component';
import { SalidasNovedadModalComponent } from './salidas-novedad-modal.component';
import { SalidasNovedadesHistorialComponent } from './salidas-novedades-historial.component';
import Swal from 'sweetalert2';
import { SalidasService } from './salidas.service';
import { Salida } from './salidas.models';

@Component({
  selector: 'app-salidas-page',
  template: `
    <div class="container-fluid py-3">
      <app-page-header [title]="'Novedades'" [subtitle]="'Gestión de novedades.'" [usuarioInput]="usuario()" />

      <section class="card border-1 shadow-sm">
        <div class="card-body d-grid gap-3">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Registros</h5>
            <!-- @if (rangoActual().total) {
              <div class="text-muted small">Mostrando {{ rangoActual().desde }}–{{ rangoActual().hasta }} de {{ rangoActual().total }}</div>
            } -->
          </div>

          <div class="d-flex justify-content-between align-items-center gap-2">
            <div>
              <!-- <button class="btn-brand btn-brand--sm" type="button" (click)="nuevoRegistro()">
                <i class="bi bi-plus-lg"></i> Registrar salida
              </button> -->
            </div>
            <div class="input-group input-group-sm" style="max-width: 320px;">
              <input type="search" class="form-control" placeholder="Placa, fecha, estado o razón social" [value]="filtro()" (input)="onFiltro($event)" />
              <button type="button" class="btn-outline-brand btn-brand--sm" (click)="limpiarFiltro()" [disabled]="!filtro()">Limpiar</button>
            </div>
          </div>

          <div class="table-responsive border rounded">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:60px;">#</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Razón social</th>
                  <th>NIT</th>
                  <th>Pasajeros</th>
                  <th>Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <tr>
                    <td colspan="8" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status" aria-label="Cargando"></div>
                    </td>
                  </tr>
                } @else if (!registros().length) {
                  <tr>
                    <td colspan="8" class="text-center text-muted py-4">No hay salidas registradas.</td>
                  </tr>
                } @else if (!registrosFiltrados().length) {
                  <tr>
                    <td colspan="8" class="text-center text-muted py-4">Sin resultados</td>
                  </tr>
                } @else {
                  @for (r of registrosPaginados(); track r.id ?? $index; let i = $index) {
                    <tr>
                      <td>{{ (page() - 1) * pageSize() + i + 1 }}</td>
                      <td>{{ fechaLegible(r.fechaSalida) }}</td>
                      <td>{{ r.horaSalida || '-' }}</td>
                      <td>{{ r.razonSocial || '-' }}</td>
                      <td>{{ r.nitEmpresaTransporte || '-' }}</td>
                      <td>{{ r.numeroPasajero ?? '-' }}</td>
                      <td>
                        <span class="badge" [class.text-bg-success]="r.estado" [class.text-bg-secondary]="r.estado === false">{{ r.estado === false ? 'Inactivo' : 'Activo' }}</span>
                      </td>
                      <td class="text-end d-flex gap-2 justify-content-end">
                        <!-- <button class="btn btn-sm btn-outline-primary" type="button" (click)="verDetalle(r)"><i class="bi bi-eye"></i> Ver</button> -->
                        <button class="btn btn-sm btn-outline-primary" type="button" [disabled]="(r['llegadas']?.length ?? 0) > 0" (click)="abrirNovedad(r)">
                          <i class="bi bi-clipboard2-plus"></i> Registrar novedad
                        </button>
                        <button class="btn btn-sm btn-outline-primary" type="button" (click)="abrirHistorial(r)">
                          <i class="bi bi-card-list"></i> Historial
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (registrosFiltrados().length) {
            <div class="d-flex justify-content-between align-items-center">
              <div></div>
              <!-- <small class="text-muted">Mostrando {{ rangoActual().desde }}–{{ rangoActual().hasta }} de {{ rangoActual().total }}</small> -->
              <app-paginator
                [page]="page()"
                [total]="registrosFiltrados().length"
                [pageSize]="pageSize()"
                storageKey="salidas_registros"
                (pageChange)="page.set($event)"
                (pageSizeChange)="pageSize.set($event)"
              />
            </div>
          }
        </div>
      </section>

      <app-modal [open]="formAbierto()" title="Registrar salida" size="lg" (closed)="cerrarFormulario()">
        @if (formAbierto()) {
          <app-salidas-form [saving]="guardando()" (submit)="onFormSubmit($event)" (cancel)="cerrarFormulario()" />
        } @else {
          <div class="py-5 text-center text-muted">Selecciona un registro para continuar.</div>
        }
      </app-modal>

      <app-modal [open]="novedadAbierta()" title="Registrar novedad" size="xl" (closed)="onModalNovedadClosed()">
        @if (novedadAbierta() && salidaFocusId()) {
          <app-salidas-novedad-modal
            [idSalida]="salidaFocusId()!"
            [placaSalida]="salidaFocusPlaca() || ''"
            [nit]="usuario()?.usuario || ''"
            (guardado)="onNovedadGuardada()"
            (cerrar)="cerrarNovedad()"
          />
        } @else {
          <div class="py-5 text-center text-muted">Selecciona un despacho para continuar.</div>
        }
      </app-modal>

      <app-modal [open]="historialAbierto()" title="Historial de novedades" size="xl" (closed)="cerrarHistorial()">
        @if (historialAbierto() && salidaFocusId()) {
          <app-salidas-novedades-historial [idSalida]="salidaFocusId()!" />
        } @else {
          <div class="py-5 text-center text-muted">Selecciona un despacho para continuar.</div>
        }
      </app-modal>
    </div>
  `,
  styles: [
    `:host{display:block;}`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, PaginatorComponent, ModalComponent, SalidasFormComponent, SalidasNovedadModalComponent, SalidasNovedadesHistorialComponent],
})
export class SalidasPageComponent {
  private readonly storage = inject(ServicioLocalStorage);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(SalidasService);

  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly rol = signal<Rol | null>(null);
  protected readonly registros = signal<Salida[]>([]);
  protected readonly loading = signal(false);
  protected readonly filtro = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly formAbierto = signal(false);
  protected readonly guardando = signal(false);
  protected readonly novedadAbierta = signal(false);
  protected readonly historialAbierto = signal(false);
  protected readonly salidaFocusId = signal<number | null>(null);
  protected readonly salidaFocusPlaca = signal<string | null>(null);
  protected readonly novedadRegistrada = signal(false);

  private readonly fecha = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  constructor() {
    this.rol.set(this.storage.obtenerRol());
    this.usuario.set(this.storage.obtenerUsuario());

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawUsuario = params.get('usuario');
      if (!rawUsuario) return;
      try {
        const parsed = JSON.parse(rawUsuario) as Usuario;
        this.usuario.set(parsed);
      } catch {
        console.warn('No se pudo interpretar el usuario recibido en la ruta.');
      }
    });

    // Cargar salidas al tener usuario
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          const nit = this.usuario()?.usuario;
          if (!nit) return of({ array_data: [] as Salida[] });
          this.loading.set(true);
          return this.service.listar(nit).pipe(finalize(() => this.loading.set(false)));
        })
      )
      .subscribe((res) => {
        const lista = (res as any)?.array_data ?? (res as any)?.data ?? [];
        this.registros.set(Array.isArray(lista) ? lista : []);
      });
  }

  protected readonly registrosFiltrados = computed(() => {
    const term = this.filtro().trim().toLowerCase();
    const lista = this.registros();
    if (!term) return lista;
    const toText = (v: unknown) => String(v ?? '').toLowerCase();
    return lista.filter((r) => [
      this.fechaLegible(r.fechaSalida),
      r.horaSalida,
      r.razonSocial,
      r.nitEmpresaTransporte,
      r.estado === false ? 'inactivo' : 'activo'
    ].some((f) => toText(f).includes(term)));
  });

  protected readonly registrosPaginados = computed(() => {
    const size = Math.max(1, this.pageSize());
    const start = (this.page() - 1) * size;
    return this.registrosFiltrados().slice(start, start + size);
  });

  protected readonly rangoActual = computed(() => {
    const total = this.registrosFiltrados().length;
    if (!total) return { desde: 0, hasta: 0, total };
    const size = Math.max(1, this.pageSize());
    const desde = (this.page() - 1) * size + 1;
    const hasta = Math.min(desde + size - 1, total);
    return { desde, hasta, total };
  });

  fechaLegible(d?: string) { return d ? this.fecha.format(new Date(d)) : '-'; }
  onFiltro(e: Event) { this.filtro.set((e.target as HTMLInputElement).value ?? ''); this.page.set(1); }
  limpiarFiltro() { this.filtro.set(''); this.page.set(1); }
  verDetalle(_r: Salida) {/* se implementará en próxima iteración */}
  cerrarFormulario() { this.formAbierto.set(false); }
  onFormSubmit(body: any) {
    const nit = this.usuario()?.usuario;
    if (!nit) return;
    this.guardando.set(true);
    this.service.guardar(body).pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Salida registrada', timer: 1500, showConfirmButton: false });
        this.cerrarFormulario();
        // refrescar lista
        this.loading.set(true);
        this.service.listar(nit).pipe(finalize(() => this.loading.set(false))).subscribe((res) => {
          const lista = (res as any)?.array_data ?? (res as any)?.data ?? [];
          this.registros.set(Array.isArray(lista) ? lista : []);
        });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la salida' })
    });
  }
  nuevoRegistro() { this.formAbierto.set(true); }

  abrirNovedad(r: any) {
    this.salidaFocusId.set(r?.id ?? null);
    this.salidaFocusPlaca.set(r?.placa ?? null);
    // Reset helpers used by legacy logic
    localStorage.setItem('numeroConductores', '0');
    localStorage.setItem('vehiculoRegistrado', '0');
    localStorage.removeItem('identificacionConductor');
    this.novedadAbierta.set(true);
    this.novedadRegistrada.set(false);
  }
  cerrarNovedad() { this.novedadAbierta.set(false); }
  onNovedadGuardada() {
    // Novedad registrada; refrescar listado y bloquear cierre por backdrop
    this.novedadRegistrada.set(true);
    this.refrescar();
  }
  onModalNovedadClosed() {
    // Ignorar cierre por backdrop si ya hay novedad registrada
    if (!this.novedadRegistrada()) {
      this.cerrarNovedad();
    }
  }

  abrirHistorial(r: any) {
    this.salidaFocusId.set(r?.id ?? null);
    this.historialAbierto.set(true);
  }
  cerrarHistorial() { this.historialAbierto.set(false); }

  refrescar() {
    const nit = this.usuario()?.usuario;
    if (!nit) return;
    this.loading.set(true);
    this.service.listar(nit).pipe(finalize(() => this.loading.set(false))).subscribe((res) => {
      const lista = (res as any)?.array_data ?? (res as any)?.data ?? [];
      this.registros.set(Array.isArray(lista) ? lista : []);
    });
  }
}
