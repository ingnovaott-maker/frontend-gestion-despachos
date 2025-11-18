import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalidasRegistroService } from './salidas-registro.service';
import { PaginatorComponent } from '../../shared/ui/paginator.component';

@Component({
  selector: 'app-salidas-novedades-historial',
  standalone: true,
  imports: [CommonModule, PaginatorComponent],
  template: `
    <div class="d-grid gap-3">
      <!-- <h6 class="mb-0">Historial de novedades</h6> -->
      @if (loading()) {
        <div class="text-center py-4"><div class="spinner-border" role="status"></div></div>
      } @else if (!novedades().length) {
        <div class="text-center text-muted py-4">Sin novedades registradas.</div>
      } @else {
        <div class="table-responsive border rounded">
          <table class="table align-middle mb-0">
            <thead class="table-light"><tr>
              <th style="width:60px;">#</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Hora</th>
            </tr></thead>
            <tbody>
              @for (n of paginados(); track n.id ?? $index; let i = $index) {
                <tr (click)="toggleExpand(n)" style="cursor: pointer;">
                  <td>{{ (page() - 1) * pageSize() + i + 1 }}</td>
                  <td>{{ n.descripcion || '-' }}</td>
                  <td>{{ tipoLegible(n.idTipoNovedad) }}</td>
                  <td>{{ (n.fecha_creacion ?? n.fechaNovedad) || '-' }}</td>
                  <td>{{ n.horaNovedad || '-' }}</td>
                </tr>
                @if (n.idTipoNovedad === 1) {
                  <tr class="detail-row" [@expand]="expandedId() === (n.id ?? null) ? 'expanded' : 'collapsed'">
                    <td colspan="5" class="p-0">
                      <div class="detail-wrapper border-top bg-white">
                        <div class="p-2 fw-semibold d-flex justify-content-between align-items-center">
                          <span>Detalle de novedad #{{ n.id ?? '-' }}</span>
                          <small class="text-muted">Click nuevamente para cerrar</small>
                        </div>
                        <div class="px-2 pb-3 d-grid gap-3">
                          <div class="table-responsive">
                            <table class="table table-sm mb-0">
                              <thead class="table-light">
                                <tr>
                                  <th style="width:40px;">#</th>
                                  <th>Nombre completo</th>
                                  <th>Número de Identificación</th>
                                  <th>Licencia</th>
                                  <th>Prueba de Alcoholimetría</th>
                                  <th>Observaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                @if (!conductores().length) {
                                  <tr><td colspan="6" class="text-center text-muted">No hay conductores registrados</td></tr>
                                } @else {
                                  @for (c of conductores(); track c.id ?? $index; let j = $index) {
                                    <tr>
                                      <td>{{ j + 1 }}</td>
                                      <td>{{ (c.primerNombreConductor || '') + ' ' + (c.segundoNombreConductor || '') + ' ' + (c.primerApellidoConductor || '') + ' ' + (c.segundoApellidoConductor || '') }}</td>
                                      <td>{{ c.numeroIdentificacion || '-' }}</td>
                                      <td>{{ c.licenciaConduccion || '-' }}</td>
                                      <td>{{ c.resultadoPruebaAlcoholimetria || '-' }}</td>
                                      <td>{{ c.observaciones || '-' }}</td>
                                    </tr>
                                  }
                                }
                              </tbody>
                            </table>
                          </div>
                          <div class="table-responsive">
                            <table class="table table-sm mb-0">
                              <thead class="table-light">
                                <tr>
                                  <th style="width:40px;">#</th>
                                  <th>Placa</th>
                                  <th>SOAT</th>
                                  <th>Tarjeta de operación</th>
                                  <th>Póliza contractual</th>
                                  <th>Póliza extracontractual</th>
                                  <th>Observaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                @if (!vehiculos().length) {
                                  <tr><td colspan="7" class="text-center text-muted">No hay vehículos registrados</td></tr>
                                } @else {
                                  @for (v of vehiculos(); track v.id ?? $index; let k = $index) {
                                    <tr>
                                      <td>{{ k + 1 }}</td>
                                      <td>{{ v.placa || '-' }}</td>
                                      <td>{{ v.soat || '-' }}</td>
                                      <td>{{ v.tarjetaOperacion || '-' }}</td>
                                      <td>{{ v.idPolizasContractual || '-' }}</td>
                                      <td>{{ v.idPolizasExtracontractual || '-' }}</td>
                                      <td>{{ v.observaciones || '-' }}</td>
                                    </tr>
                                  }
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-end">
          <app-paginator
            [page]="page()"
            [total]="novedades().length"
            [pageSize]="pageSize()"
            storageKey="salidas_historial_nov"
            (pageChange)="page.set($event)"
            (pageSizeChange)="pageSize.set($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`:host{display:block}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalidasNovedadesHistorialComponent implements OnChanges {
  private readonly registro = inject(SalidasRegistroService);

  idSalida = input<number | null>();

  loading = signal(false);
  novedades = signal<any[]>([]);
  page = signal(1);
  pageSize = signal(5);
  expandedId = signal<number | null>(null);
  conductores = signal<any[]>([]);
  vehiculos = signal<any[]>([]);

  paginados = computed(() => {
    const size = Math.max(1, this.pageSize());
    const start = (this.page() - 1) * size;
    return this.novedades().slice(start, start + size);
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idSalida']) {
      const id = this.idSalida();
      if (!id) { this.novedades.set([]); return; }
      this.loading.set(true);
      this.registro.obtenerSalida(id).subscribe({
        next: (resp: any) => {
          const list = resp?.obj?.novedades ?? [];
          this.novedades.set(Array.isArray(list) ? list : []);
        },
        error: () => { this.novedades.set([]); },
        complete: () => this.loading.set(false)
      });
    }
  }

  tipoLegible(tipo: any): string {
    return Number(tipo) === 1 ? 'Conductor / Vehículo' : 'Otra';
  }

  toggleExpand(n: any) {
    const id = n?.id;
    if (!id || n.idTipoNovedad !== 1) return; // solo expandir tipo 1
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(id);
    // cargar detalle nuevamente y filtrar posibles arrays si existen
    const salidaId = this.idSalida();
    if (!salidaId) return;
    this.registro.obtenerSalida(salidaId).subscribe({
      next: (resp: any) => {
        // posibles nombres de arrays en la respuesta
        const root = resp?.obj ?? {};
        const arrConductores = root?.novedadesConductor ?? root?.conductores ?? [];
        const arrVehiculos = root?.novedadesVehiculo ?? root?.vehiculos ?? [];
        // filtrar por idNovedad si la propiedad existe
        const filtroConductores = Array.isArray(arrConductores) ? arrConductores.filter((c: any) => (c.idNovedad ?? c.id_novedad) === id) : [];
        const filtroVehiculos = Array.isArray(arrVehiculos) ? arrVehiculos.filter((v: any) => (v.idNovedad ?? v.id_novedad) === id) : [];
        this.conductores.set(filtroConductores);
        this.vehiculos.set(filtroVehiculos);
      },
      error: () => {
        this.conductores.set([]);
        this.vehiculos.set([]);
      }
    });
  }
}
