import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { AutorizacionHistorial } from './autorizaciones.models';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { ParametricasService } from '../../parametricas/servicios/parametricas.service';

@Component({
  selector: 'app-autorizaciones-historial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginatorComponent],
  template: `
    <div class="d-grid gap-3">
      <div class="d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Historial de {{ placa() }}</h6>
        <div class="input-group input-group-sm" style="max-width: 320px;">
          <input type="search" class="form-control" placeholder="Fecha, origen o destino" [value]="filtro()" (input)="onFilter($event)" />
          <button type="button" class="btn-outline-brand btn-brand--sm" (click)="limpiar()" [disabled]="!filtro()">Limpiar</button>
        </div>
      </div>

      <div class="table-responsive border rounded">
        <table class="table table-sm align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 60px;">#</th>
              <th>Fecha</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Otorgante</th>
              <th>Acompañante autorizado</th>
              <th>Receptor autorizado</th>
              <th>Estado</th>
              <!-- <th class="text-end">Acciones</th> -->
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="6" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status" aria-label="Cargando"></div>
                </td>
              </tr>
            } @else if (!records().length) {
              <tr>
                <td colspan="6" class="text-center text-muted py-4">Sin registros</td>
              </tr>
            } @else if (!filtrados().length) {
              <tr>
                <td colspan="6" class="text-center text-muted py-4">Sin resultados</td>
              </tr>
            } @else {
              @for (r of paginados(); track r.id ?? $index; let i = $index) {
                <tr>
                  <td>{{ (page() - 1) * effectiveSize() + i + 1 }}</td>
                  <td>{{ fechaLegible(r.fecha_viaje) }}</td>
                  <td>{{ mostrarUbicacion(r.origen) }}</td>
                  <td>{{ mostrarUbicacion(r.destino) }}</td>
                  <td>{{ r.nombres_apellidos_otorgante }}</td>
                  <td>{{ r.nombres_apellidos_autorizado_viajar }}</td>
                  <td>{{ r.nombres_apellidos_autorizado_recoger }}</td>
                  <td>
                    <span class="badge" [class.text-bg-success]="r.estado" [class.text-bg-secondary]="r.estado === false">{{ r.estado === false ? 'Inactivo' : 'Activo' }}</span>
                  </td>
                  <!-- <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" type="button" (click)="ver.emit(r)">
                      <i class="bi bi-eye"></i> Ver/editar
                    </button>
                  </td> -->
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (filtrados().length > 0) {
        <app-paginator
          [total]="filtrados().length"
          [page]="page()"
          (pageChange)="page.set($event)"
          [pageSize]="effectiveSize()"
          (pageSizeChange)="onPageSize($event)"
          [storageKey]="'autorizaciones_historial'"
        ></app-paginator>
      }

      <!-- @if (exportUrl()) {
        <div class="d-flex justify-content-end">
          <a class="btn btn-sm btn-outline-success" [href]="exportUrl()!" target="_blank" rel="noopener"><i class="bi bi-download"></i> Exportar</a>
        </div>
      } -->
    </div>
  `,
})
export class AutorizacionesHistorialComponent {
  protected readonly selectedSize = signal<number | null>(null);
  records = input.required<AutorizacionHistorial[]>();
  placa = input<string>('');
  loading = input<boolean>(false);
  exportUrl = input<string | null>(null);
  pageSize = input<number>(5);
  ver = output<AutorizacionHistorial>();

  page = signal(1);
  filtro = signal('');
  private readonly ubicaciones = signal<{ codigo: string; descripcion: string }[]>([]);

  private readonly fecha = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  private readonly parametricas = inject(ParametricasService);

  constructor() {
    this.parametricas.obtenerParametrica<any[]>('listar-centros-poblados').subscribe((res) => this.ubicaciones.set(res ?? []));
  }

  onFilter(e: Event) {
    const v = (e.target as HTMLInputElement).value ?? '';
    this.filtro.set(v);
    this.page.set(1);
  }
  limpiar() { this.filtro.set(''); this.page.set(1); }

  filtrados = computed(() => {
    const term = this.filtro().trim().toLowerCase();
    if (!term) return this.records();
    const toText = (v: unknown) => String(v ?? '').toLowerCase();
    return this.records().filter(r => {
      const fecha = this.fechaLegible(r.fecha_viaje).toLowerCase();
      const origen = this.mostrarUbicacion(r.origen).toLowerCase();
      const destino = this.mostrarUbicacion(r.destino).toLowerCase();
      const estado = r.estado === false ? 'inactivo' : 'activo';
      return [fecha, origen, destino, estado].some(t => t.includes(term));
    });
  });

  effectiveSize = computed(() => this.selectedSize() ?? this.pageSize());

  paginados = computed(() => {
    const size = this.effectiveSize();
    const start = (this.page() - 1) * size;
    return this.filtrados().slice(start, start + size);
  });
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.effectiveSize())));

  fechaLegible(d?: string | Date) { return d ? this.fecha.format(new Date(d)) : ''; }
  mostrarUbicacion(codigo?: string) {
    if (!codigo) return '-';
    return this.ubicaciones().find(u => String(u.codigo) === String(codigo))?.descripcion || String(codigo);
  }

  onPageSize(size: number) {
    this.selectedSize.set(size);
    this.page.set(1);
  }
}
