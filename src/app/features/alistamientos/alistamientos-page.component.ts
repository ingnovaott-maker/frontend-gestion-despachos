import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ServicioLocalStorage } from '../../administrador/servicios/local-storage.service';
import { Usuario, Rol } from '../../core/models/auth.models';
import { ModalComponent } from '../../shared/ui/modal.component';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { AlistamientosService } from './alistamientos.service';
import { AlistamientosFormComponent, AlistamientoFormContext, SubmitEvent } from './alistamientos-form.component';
import { AlistamientosHistorialComponent } from './alistamientos-historial.component';
import { AlistamientoDocumento, AlistamientoRegistro, HistorialAlistamiento, ProtocoloAlistamiento } from './alistamientos.models';
import { DetallesActividades } from '../../mantenimientos/modelos/RegistroProtocoloAlistamiento';
import { ParametricasService, TipoIdentificacion } from '../../parametricas/servicios/parametricas.service';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

const PAGE_SIZE = 5;
const DOCUMENTOS_PAGE_SIZE = 5;
const HISTORIAL_PAGE_SIZE = 5;
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf'];
const DEMO_ENABLED = !environment.production;

interface FormContext extends AlistamientoFormContext {
  mantenimientoId?: string | number;
  vigiladoId: string;
}

@Component({
  selector: 'app-alistamientos-page',
  imports: [ModalComponent, AlistamientosFormComponent, AlistamientosHistorialComponent, PageHeaderComponent, PaginatorComponent],
  template: `
    <div class="container-fluid py-3">
      <app-page-header [title]="'Alistamientos'" [subtitle]="'Gestión del protocolo diario y su documentación de soporte.'" [usuarioInput]="usuario()" />

      <div class="d-grid gap-3">
        <!-- <section class="card border-1 shadow-sm">
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-sm-6 col-lg-4">
                <label class="form-label text-muted mb-1">Nit</label>
                <div class="fw-semibold">{{ usuario()?.usuario || '—' }}</div>
              </div>
              <div class="col-sm-6 col-lg-4">
                <label class="form-label text-muted mb-1">Razón social</label>
                <div class="fw-semibold">{{ usuario()?.nombre || '—' }}</div>
              </div>
            </div>
          </div>
        </section> -->

        <section class="card border-1 shadow-sm">
          <div class="card-body d-grid gap-3">
            <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <h5 class="mb-1">PDF del alistamiento diario</h5>
                <!-- <p class="text-muted small mb-0">Carga diaria en PDF, máximo 4&nbsp;MB.</p> -->
              </div>
              <div class="d-flex align-items-center gap-2">
                <label class="btn-brand btn-brand--sm mb-0">
                  <input type="file" class="visually-hidden" accept=".pdf" (change)="onArchivoSeleccionado($event)" />
                  <i class="bi bi-upload"></i> Cargar archivo
                </label>
                <small class="text-muted">Formato permitido: PDF. Máx 4&nbsp;MB.</small>
              </div>
            </div>

            <div class="d-flex justify-content-end">
              <div class="input-group input-group-sm" style="max-width: 320px;">
                <input type="search" class="form-control" placeholder="Documento, fecha o estado" [value]="filtroDocs()" (input)="onDocumentosFilterChange($event)" />
                <button type="button" class="btn-outline-brand btn-brand--sm" (click)="limpiarDocumentosFiltro()" [disabled]="!filtroDocs()">Limpiar</button>
              </div>
            </div>

            <div class="table-responsive border rounded">
              <table class="table table-sm align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Documento</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @if (documentosLoading()) {
                    <tr>
                      <td colspan="4" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status" aria-label="Cargando documentos"></div>
                      </td>
                    </tr>
                  } @else if (!documentos().length) {
                    <tr>
                      <td colspan="4" class="text-center text-muted py-4">Sin documentos cargados</td>
                    </tr>
                  } @else if (!documentosFiltrados().length) {
                    <tr>
                      <td colspan="4" class="text-center text-muted py-4">Sin resultados</td>
                    </tr>
                  } @else {
                    @for (doc of documentosPaginados(); track doc.id ?? doc.documento) {
                      <tr>
                        <td class="fw-semibold">{{ doc.nombreOriginal }}</td>
                        <td>{{ fechaLegible(doc.fecha) }}</td>
                        <td>
                          <span class="badge" [class.text-bg-success]="doc.estado" [class.text-bg-secondary]="doc.estado === false">
                            {{ doc.estado === false ? 'Inactivo' : 'Activo' }}
                          </span>
                        </td>
                        <td class="text-end">
                          <button type="button" class="btn btn-sm btn-outline-primary" (click)="descargar(doc)">
                            <span><i class="bi bi-download"></i> Descargar</span>
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            @if (!documentosLoading() && documentosFiltrados().length) {
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">Mostrando {{ documentosRango().desde }}–{{ documentosRango().hasta }} de {{ documentosRango().total }}</small>
                <app-paginator
                  [page]="documentosPage()"
                  [total]="documentosFiltrados().length"
                  [pageSize]="documentosPageSize()"
                  [showSummary]="false"
                  storageKey="alistamientos_docs"
                  (pageChange)="documentosPage.set($event)"
                  (pageSizeChange)="documentosPageSize.set($event)"
                />
              </div>
            }
          </div>
        </section>

        <section class="card border-1 shadow-sm">
          <div class="card-body d-grid gap-3">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Vehículos</h5>
              @if (rangoActual().total) {
                <div class="text-muted small">
                  Mostrando {{ rangoActual().desde }}–{{ rangoActual().hasta }} de {{ rangoActual().total }}
                </div>
              }
            </div>

            <div class="d-flex justify-content-end">
              <div class="input-group input-group-sm" style="max-width: 320px;">
                <input type="search" class="form-control" placeholder="Placa, fecha o estado" [value]="filtro()" (input)="onFilterChange($event)" />
                <button type="button" class="btn-outline-brand btn-brand--sm" (click)="limpiarFiltro()" [disabled]="!filtro()">Limpiar</button>
              </div>
            </div>

            <div class="table-responsive border rounded">
              <table class="table align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width: 60px;">#</th>
                    <th>Placa</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @if (registrosLoading()) {
                    <tr>
                      <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status" aria-label="Cargando registros"></div>
                      </td>
                    </tr>
                  } @else if (!registros().length) {
                    <tr>
                      <td colspan="5" class="text-center text-muted py-4">
                        {{ verificador() ? 'Carga el protocolo para habilitar los vehículos.' : 'No hay vehículos disponibles.' }}
                      </td>
                    </tr>
                  } @else if (!registrosFiltrados().length) {
                    <tr>
                      <td colspan="5" class="text-center text-muted py-4">Sin resultados</td>
                    </tr>
                  } @else {
                    @for (registro of registrosPaginados(); track registro.placa ?? ($index + 1); let idx = $index) {
                      <tr>
                        <td>{{ (page() - 1) * pageSize() + idx + 1 }}</td>
                        <td class="fw-semibold">{{ registro.placa }}</td>
                        <td>{{ fechaLegible(registro.fechaDiligenciamiento) }}</td>
                        <td>{{ estadoTexto(registro) }}</td>
                        <td class="text-end d-flex justify-content-end gap-2">
                          <button class="btn-brand btn-brand--sm" type="button" (click)="abrirFormularioNuevo(registro)">
                            <i class="bi bi-plus-lg"></i> Registrar alistamiento
                          </button>
                          <button class="btn-outline-brand btn-brand--sm" type="button" (click)="abrirHistorial(registro)">
                            <i class="bi bi-clock-history"></i> Historial
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
                <small class="text-muted">Mostrando {{ rangoActual().desde }}–{{ rangoActual().hasta }} de {{ rangoActual().total }}</small>
                <app-paginator
                  [page]="page()"
                  [total]="registrosFiltrados().length"
                  [pageSize]="pageSize()"
                  [showSummary]="false"
                  storageKey="alistamientos_registros"
                  (pageChange)="page.set($event)"
                  (pageSizeChange)="pageSize.set($event)"
                />
              </div>
            }
          </div>
        </section>
      </div>

      <app-modal [open]="formAbierto()" [title]="formTitulo()" size="xl" (closed)="cerrarFormulario()">
        @if (formAbierto() && formViewContext()) {
          <app-alistamientos-form
            [context]="formViewContext()"
            [actividades]="actividades()"
            [tiposIdentificacion]="tiposIdentificacion()"
            [saving]="guardandoFormulario()"
            (submit)="onFormSubmit($event)"
            (cancel)="cerrarFormulario()"
          />
        } @else {
          <div class="py-5 text-center text-muted">Selecciona un registro para continuar.</div>
        }
      </app-modal>

      <app-modal [open]="historialAbierto()" title="Historial de alistamiento" size="xl" (closed)="cerrarHistorial()">
        <app-alistamientos-historial
          [records]="historial()"
          [placa]="historialPlaca()"
          [loading]="historialLoading()"
          [exportUrl]="historialExport()"
          [pageSize]="${HISTORIAL_PAGE_SIZE}"
          [idTypes]="tiposIdentificacion()"
          (ver)="abrirEdicionDesdeHistorial($event)"
        ></app-alistamientos-historial>
      </app-modal>
    </div>
  `,
  styles: [`:host{display:block;}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlistamientosPageComponent {
  private readonly storage = inject(ServicioLocalStorage);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly service = inject(AlistamientosService);
  private readonly parametricas = inject(ParametricasService);

  private readonly fechaFormatter = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly rol = signal<Rol | null>(null);
  protected readonly documentos = signal<AlistamientoDocumento[]>([]);
  protected readonly documentosLoading = signal(false);
  protected readonly documentosPage = signal(1);
  protected readonly documentosPageSize = signal(5);
  protected readonly filtroDocs = signal('');
  protected readonly subiendoArchivo = signal(false);
  protected readonly registros = signal<AlistamientoRegistro[]>([]);
  protected readonly registrosLoading = signal(false);
  protected readonly filtro = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);
  protected readonly verificador = signal(false);
  protected readonly actividades = signal<DetallesActividades[]>([]);
  protected readonly tiposIdentificacion = signal<TipoIdentificacion[]>([]);
  protected readonly historial = signal<HistorialAlistamiento[]>([]);
  protected readonly historialLoading = signal(false);
  protected readonly historialPlaca = signal('');
  protected readonly historialExport = signal<string | null>(null);
  protected readonly historialAbierto = signal(false);
  protected readonly formContext = signal<FormContext | null>(null);
  protected readonly guardandoFormulario = signal(false);

  protected readonly documentosFiltrados = computed(() => {
    const term = this.filtroDocs().trim().toLowerCase();
    const lista = this.documentos();
    if (!term) return lista;
    return lista.filter((doc) => {
      const nombre = (doc.nombreOriginal ?? '').toLowerCase();
      const fecha = this.fechaLegible(doc.fecha).toLowerCase();
      const estado = (doc.estado === false ? 'inactivo' : 'activo');
      return nombre.includes(term) || fecha.includes(term) || estado.includes(term);
    });
  });

  protected readonly documentosPaginados = computed(() => {
    const lista = this.documentosFiltrados();
    const size = Math.max(1, this.documentosPageSize());
    const start = (this.documentosPage() - 1) * size;
    return lista.slice(start, start + size);
  });

  protected readonly documentosTotalPaginas = computed(() => {
    const total = this.documentosFiltrados().length;
    const size = Math.max(1, this.documentosPageSize());
    return total ? Math.max(1, Math.ceil(total / size)) : 1;
  });

  protected readonly documentosRango = computed(() => {
    const total = this.documentosFiltrados().length;
    if (!total) return { desde: 0, hasta: 0, total };
    const size = Math.max(1, this.documentosPageSize());
    const desde = (this.documentosPage() - 1) * size + 1;
    const hasta = Math.min(desde + size - 1, total);
    return { desde, hasta, total };
  });

  private lastVigilado: string | null = null;
  private readonly demoDocumentos: readonly AlistamientoDocumento[] = DEMO_ENABLED
    ? [
        {
          id: 1,
          documento: 'demo-protocolo-2025-11-06.pdf',
          ruta: '/demo/alistamientos',
          nombreOriginal: 'Protocolo alistamiento 06-11-2025.pdf',
          fecha: '2025-11-06T08:00:00Z',
          estado: true,
        },
        {
          id: 2,
          documento: 'demo-protocolo-2025-11-05.pdf',
          ruta: '/demo/alistamientos',
          nombreOriginal: 'Protocolo alistamiento 05-11-2025.pdf',
          fecha: '2025-11-05T08:05:00Z',
          estado: false,
        },
      ]
    : [];

  private readonly demoRegistros: readonly AlistamientoRegistro[] = DEMO_ENABLED
    ? [
        {
          placa: 'ABC123',
          fechaDiligenciamiento: '2025-11-07T07:45:00Z',
          estadoMantenimiento: 'Cumplido',
          mantenimiento_id: 101,
          estado: true,
        },
        {
          placa: 'DEF456',
          fechaDiligenciamiento: '2025-11-06T07:38:00Z',
          estadoMantenimiento: 'Pendiente por cierre',
          mantenimiento_id: 102,
          estado: true,
        },
        {
          placa: 'GHI789',
          fechaDiligenciamiento: '2025-11-05T07:20:00Z',
          estadoMantenimiento: 'No inició',
          mantenimiento_id: 103,
          estado: false,
        },
      ]
    : [];

  private readonly demoHistorial = DEMO_ENABLED
    ? new Map<string, HistorialAlistamiento[]>([
        [
          'ABC123',
          [
            {
              id: 'h-101-a',
              placa: 'ABC123',
              mantenimiento_id: 101,
              estado: true,
              estadoMantenimiento: true,
              created_at: '2025-11-07T07:45:00Z',
              updated_at: '2025-11-07T08:10:00Z',
              nombre_responsable: 'Laura Martínez',
              numero_identificacion_responsable: 1012333444,
              tipo_identificacion_responsable: 1,
              nombres_conductor: 'Carlos Pérez',
              numero_identificacion_conductor: 1022333455,
              tipo_identificacion_conductor: 1,
              detalle_actividades: 'Revisión de luces, señalización y kit de carretera completa.',
            },
            {
              id: 'h-101-b',
              placa: 'ABC123',
              mantenimiento_id: 101,
              estado: true,
              estadoMantenimiento: true,
              created_at: '2025-11-06T07:40:00Z',
              updated_at: '2025-11-06T08:00:00Z',
              nombre_responsable: 'Laura Martínez',
              numero_identificacion_responsable: 1012333444,
              tipo_identificacion_responsable: 1,
              nombres_conductor: 'Carlos Pérez',
              numero_identificacion_conductor: 1022333455,
              tipo_identificacion_conductor: 1,
              detalle_actividades: 'Control de extintor, cinturones y llantas en óptimas condiciones.',
            },
          ],
        ],
        [
          'DEF456',
          [
            {
              id: 'h-102-a',
              placa: 'DEF456',
              mantenimiento_id: 102,
              estado: true,
              estadoMantenimiento: true,
              created_at: '2025-11-06T07:38:00Z',
              updated_at: '2025-11-06T07:55:00Z',
              nombre_responsable: 'Andrés Quiñones',
              numero_identificacion_responsable: 1044556677,
              tipo_identificacion_responsable: 1,
              nombres_conductor: 'María Gómez',
              numero_identificacion_conductor: 1033344556,
              tipo_identificacion_conductor: 1,
              detalle_actividades: 'Se revisó documentación del vehículo, kit de carretera y niveles de fluidos.',
            },
          ],
        ],
      ])
    : new Map<string, HistorialAlistamiento[]>();

  private readonly demoProtocolos = DEMO_ENABLED
    ? new Map<string | number, ProtocoloAlistamiento>([
        [
          101,
          {
            placa: 'ABC123',
            tipoIdentificacion: 'CC',
            numeroIdentificacion: 1012333444,
            nombreResponsable: 'Laura Martínez',
            tipoIdentificacionConductor: 'CC',
            numeroIdentificacionConductor: 1022333455,
            nombreConductor: 'Carlos Pérez',
            actividades: [1, 2, 3, 5, 8],
            detalleActividades: 'Verificación completa de elementos de seguridad y documentación al día.',
          },
        ],
        [
          102,
          {
            placa: 'DEF456',
            tipoIdentificacion: 'CC',
            numeroIdentificacion: 1044556677,
            nombreResponsable: 'Andrés Quiñones',
            tipoIdentificacionConductor: 'CC',
            numeroIdentificacionConductor: 1033344556,
            nombreConductor: 'María Gómez',
            actividades: [1, 4, 6, 7],
            detalleActividades: 'Pendiente confirmación de recarga de extintor, resto conforme.',
          },
        ],
      ])
    : new Map<string | number, ProtocoloAlistamiento>();

  private readonly demoActividades: readonly DetallesActividades[] = DEMO_ENABLED
    ? [
        { id: 1, nombre: 'Documentación del vehículo', estado: true },
        { id: 2, nombre: 'Elementos de seguridad', estado: true },
        { id: 3, nombre: 'Revisión de luces', estado: true },
        { id: 4, nombre: 'Kit de carretera', estado: true },
        { id: 5, nombre: 'Neumáticos', estado: true },
        { id: 6, nombre: 'Sistema de frenos', estado: true },
        { id: 7, nombre: 'Extintor', estado: true },
        { id: 8, nombre: 'Cinturones de seguridad', estado: true },
      ]
    : [];

  private readonly demoTiposIdentificacion: readonly TipoIdentificacion[] = DEMO_ENABLED
    ? [
        { id: 'CC', nombre: 'Cédula de ciudadanía' },
        { id: 'CE', nombre: 'Cédula de extranjería' },
        { id: 'TI', nombre: 'Tarjeta de identidad' },
      ]
    : [];

  protected readonly isSupervisor = computed(() => {
    const id = this.rol()?.id;
    return Number(id) === 1;
  });

  protected readonly registrosFiltrados = computed(() => {
    const term = this.filtro().trim().toLowerCase();
    const registros = this.registros();
    if (!term) return registros;
    return registros.filter((registro) => {
      const placa = (registro.placa ?? '').toLowerCase();
      const fecha = this.fechaLegible(registro.fechaDiligenciamiento).toLowerCase();
      const estado = this.estadoTexto(registro).toLowerCase();
      return placa.includes(term) || fecha.includes(term) || estado.includes(term);
    });
  });

  protected readonly registrosPaginados = computed(() => {
    const lista = this.registrosFiltrados();
    const size = Math.max(1, this.pageSize());
    const start = (this.page() - 1) * size;
    return lista.slice(start, start + size);
  });

  protected readonly totalPaginas = computed(() => {
    const total = this.registrosFiltrados().length;
    const size = Math.max(1, this.pageSize());
    return total ? Math.max(1, Math.ceil(total / size)) : 1;
  });

  protected readonly rangoActual = computed(() => {
    const total = this.registrosFiltrados().length;
    if (!total) return { desde: 0, hasta: 0, total };
    const size = Math.max(1, this.pageSize());
    const desde = (this.page() - 1) * size + 1;
    const hasta = Math.min(desde + size - 1, total);
    return { desde, hasta, total };
  });

  protected readonly formAbierto = computed(() => this.formContext() !== null);

  protected readonly formViewContext = computed<AlistamientoFormContext | null>(() => {
    const ctx = this.formContext();
    if (!ctx) return null;
    return { placa: ctx.placa, modo: ctx.modo, initial: ctx.initial ?? null };
  });

  protected readonly formTitulo = computed(() => {
    const ctx = this.formContext();
    if (!ctx) return 'Registro de alistamiento';
    return ctx.modo === 'edit' ? `Editar alistamiento (${ctx.placa})` : `Nuevo alistamiento (${ctx.placa})`;
  });

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

    effect(() => {
      const vigilado = this.usuario()?.usuario;
      if (!vigilado || vigilado === this.lastVigilado) return;
      this.lastVigilado = vigilado;
      this.cargarDocumentos(vigilado);
      this.cargarRegistros(vigilado);
      if (!this.actividades().length) this.cargarActividades();
      if (!this.tiposIdentificacion().length) this.cargarTiposIdentificacion();
    });

    effect(() => {
      const totalPaginas = this.totalPaginas();
      const paginaActual = this.page();
      if (paginaActual > totalPaginas) {
        this.page.set(totalPaginas);
      }
    });

    effect(() => {
      const total = this.documentosTotalPaginas();
      const actual = this.documentosPage();
      if (actual > total) {
        this.documentosPage.set(total);
      } else if (actual < 1) {
        this.documentosPage.set(1);
      }
    });
  }

  protected onFilterChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value ?? '';
    this.filtro.set(valor);
    this.page.set(1);
  }

  protected limpiarFiltro() {
    this.filtro.set('');
    this.page.set(1);
  }

  protected onDocumentosFilterChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value ?? '';
    this.filtroDocs.set(valor);
    this.documentosPage.set(1);
  }

  protected limpiarDocumentosFiltro() {
    this.filtroDocs.set('');
    this.documentosPage.set(1);
  }

  protected paginaAnterior() {
    if (this.page() > 1) this.page.update((current) => current - 1);
  }

  protected paginaSiguiente() {
    if (this.page() < this.totalPaginas()) this.page.update((current) => current + 1);
  }

  protected documentosPaginaAnterior() {
    if (this.documentosPage() > 1) this.documentosPage.update((current) => current - 1);
  }

  protected documentosPaginaSiguiente() {
    if (this.documentosPage() < this.documentosTotalPaginas()) {
      this.documentosPage.update((current) => current + 1);
    }
  }

  protected fechaLegible(fecha?: string | null): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '';
    return this.fechaFormatter.format(date);
  }

  protected estadoTexto(registro: AlistamientoRegistro): string {
    const estadoTexto = (registro.estadoMantenimiento ?? '').toString().trim();
    if (estadoTexto) return estadoTexto;
    if (typeof (registro as { estado?: boolean }).estado === 'boolean') {
      return (registro as { estado: boolean }).estado ? 'Activo' : 'Inactivo';
    }
    return '—';
  }

  protected descargar(doc: AlistamientoDocumento) {
    this.service.descargarArchivo(doc.documento, doc.ruta, doc.nombreOriginal);
  }

  protected onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;
    const file = files[0];
    input.value = '';

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un archivo PDF válido.' });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      Swal.fire({ icon: 'warning', title: 'El archivo supera los 4 MB permitidos.' });
      return;
    }

    const vigilado = this.usuario()?.usuario;
    if (!vigilado) {
      Swal.fire({ icon: 'error', title: 'No encontramos el identificador del vigilado.' });
      return;
    }

    this.subiendoArchivo.set(true);
    Swal.fire({ title: 'Cargando archivo...', didOpen: () => Swal.showLoading() });
    this.service
      .subirArchivo(file, vigilado)
      .pipe(
        switchMap((respuesta) =>
          this.service.guardarArchivoMetadata(
            respuesta.nombreAlmacenado,
            respuesta.nombreOriginalArchivo,
            respuesta.ruta,
            vigilado
          )
        ),
        finalize(() => this.subiendoArchivo.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Archivo cargado correctamente', timer: 1500, showConfirmButton: false });
          this.cargarDocumentos(vigilado);
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'No fue posible cargar el archivo' });
        },
      });
  }

  protected abrirFormularioNuevo(registro: AlistamientoRegistro) {
    const vigilado = this.usuario()?.usuario;
    if (!vigilado || !registro.placa) return;
    // Siempre crear un nuevo objeto para forzar reset en el formulario hijo
    this.formContext.set({
      placa: registro.placa,
      modo: 'create',
      mantenimientoId: registro.mantenimiento_id,
      vigiladoId: vigilado,
      initial: null,
    });
  }

  protected cerrarFormulario() {
    this.formContext.set(null);
  }

  protected onFormSubmit(evento: SubmitEvent) {
    const ctx = this.formContext();
    if (!ctx) return;
    const vigilado = ctx.vigiladoId;
    const placa = ctx.placa;
    if (!vigilado || !placa) return;

    this.guardandoFormulario.set(true);

    const mantenimiento$ = ctx.mantenimientoId
      ? of(ctx.mantenimientoId)
      : this.service
          .crearMantenimiento(vigilado, placa)
          .pipe(
            tap((resp) => {
              const actualizado: FormContext = { ...ctx, mantenimientoId: resp.id };
              this.formContext.set(actualizado);
            }),
            map((resp) => resp.id)
          );

    mantenimiento$
      .pipe(
        switchMap((mantenimientoId) => this.service.guardarAlistamiento(evento.protocolo, mantenimientoId)),
        finalize(() => this.guardandoFormulario.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: evento.modo === 'edit' ? 'Alistamiento actualizado' : 'Alistamiento registrado',
            timer: 1600,
            showConfirmButton: false,
          });
          this.cerrarFormulario();
          this.cargarRegistros(vigilado);
          if (this.historialAbierto() && this.historialPlaca() === placa) {
            this.cargarHistorial(vigilado, placa);
          }
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'No fue posible guardar la información' });
        },
      });
  }

  protected abrirHistorial(registro: AlistamientoRegistro) {
    const vigilado = this.usuario()?.usuario;
    if (!vigilado || !registro.placa) return;
    this.historialPlaca.set(registro.placa);
    this.historialAbierto.set(true);
    this.historial.set([]);
    this.historialExport.set(this.service.exportarHistorial(vigilado, registro.placa));
    this.cargarHistorial(vigilado, registro.placa);
  }

  protected cerrarHistorial() {
    this.historialAbierto.set(false);
  }

  protected abrirEdicionDesdeHistorial(item: HistorialAlistamiento) {
    const vigilado = this.usuario()?.usuario;
    if (!vigilado || !item.placa || item.mantenimiento_id === undefined) return;

    if (DEMO_ENABLED) {
      const demo = this.demoProtocolos.get(item.mantenimiento_id);
      if (demo) {
        this.historialAbierto.set(false);
        this.formContext.set({
          placa: item.placa ?? '',
          modo: 'edit',
          mantenimientoId: item.mantenimiento_id,
          vigiladoId: vigilado,
          initial: { ...demo },
        });
        return;
      }
    }

    this.historialAbierto.set(false);
    this.guardandoFormulario.set(true);

    this.service
      .visualizarAlistamiento(item.mantenimiento_id)
      .pipe(finalize(() => this.guardandoFormulario.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (protocolo) => {
          this.formContext.set({
            placa: item.placa ?? '',
            modo: 'edit',
            mantenimientoId: item.mantenimiento_id,
            vigiladoId: vigilado,
            initial: protocolo,
          });
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'No fue posible cargar el registro seleccionado' });
        },
      });
  }

  private cargarDocumentos(vigilado: string) {
    this.documentosLoading.set(true);
    this.service
      .listarDocumentos(vigilado)
      .pipe(finalize(() => this.documentosLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (docs) => {
          const lista = Array.isArray(docs) ? docs : [];
          this.documentos.set(lista.length || !DEMO_ENABLED ? lista : [...this.demoDocumentos]);
          this.documentosPage.set(1);
        },
        error: () => {
          this.documentos.set(DEMO_ENABLED ? [...this.demoDocumentos] : []);
          this.documentosPage.set(1);
        },
      });
  }

  private cargarRegistros(vigilado: string) {
    this.registrosLoading.set(true);
    this.service
      .listarRegistros(vigilado, this.rol()?.id ?? null)
      .pipe(finalize(() => this.registrosLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registros) => {
          const lista = Array.isArray(registros) ? registros : [];
          if (lista.length) {
            this.verificador.set(false);
            this.registros.set(lista);
          } else if (DEMO_ENABLED) {
            this.verificador.set(false);
            this.registros.set([...this.demoRegistros]);
          } else {
            this.registros.set([]);
          }
        },
        error: (error) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            if (DEMO_ENABLED) {
              this.registros.set([...this.demoRegistros]);
              this.verificador.set(false);
            } else {
              this.registros.set([]);
              this.verificador.set(true);
            }
          } else {
            if (DEMO_ENABLED) {
              this.registros.set([...this.demoRegistros]);
              this.verificador.set(false);
            } else {
              Swal.fire({ icon: 'error', title: 'No fue posible obtener los registros' });
            }
          }
        },
      });
  }

  private cargarHistorial(vigilado: string, placa: string) {
    this.historialLoading.set(true);
    this.service
      .listarHistorial(vigilado, placa)
      .pipe(finalize(() => this.historialLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (historial) => {
          const lista = Array.isArray(historial) ? historial : [];
          if (lista.length) {
            this.historial.set(lista);
          } else if (DEMO_ENABLED && placa) {
            this.historial.set([...(this.demoHistorial.get(placa) ?? [])]);
          } else {
            this.historial.set([]);
          }
        },
        error: () => {
          if (DEMO_ENABLED && placa) {
            this.historial.set([...(this.demoHistorial.get(placa) ?? [])]);
          } else {
            this.historial.set([]);
            Swal.fire({ icon: 'error', title: 'No fue posible cargar el historial' });
          }
        },
      });
  }

  private cargarActividades() {
    this.service
      .listarActividades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actividades) => {
          const lista = Array.isArray(actividades) ? actividades : [];
          this.actividades.set(lista.length || !DEMO_ENABLED ? lista : [...this.demoActividades]);
        },
        error: () => {
          if (DEMO_ENABLED) {
            this.actividades.set([...this.demoActividades]);
          } else {
            console.warn('No fue posible obtener las actividades del protocolo.');
          }
        },
      });
  }

  private cargarTiposIdentificacion() {
    this.parametricas
      .obtenerTipoIdentificaciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tipos) => {
          const lista = Array.isArray(tipos) ? tipos : [];
          this.tiposIdentificacion.set(lista.length || !DEMO_ENABLED ? lista : [...this.demoTiposIdentificacion]);
        },
        error: () => {
          if (DEMO_ENABLED) {
            this.tiposIdentificacion.set([...this.demoTiposIdentificacion]);
          } else {
            console.warn('No fue posible obtener los tipos de identificación.');
          }
        },
      });
  }
}
