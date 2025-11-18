import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { HistorialAlistamiento } from './alistamientos.models';
import { PaginatorComponent } from '../../shared/ui/paginator.component';
import { TipoIdentificacion } from '../../parametricas/servicios/parametricas.service';

@Component({
  selector: 'app-alistamientos-historial',
  standalone: true,
  imports: [PaginatorComponent],
  template: `
    <section class="d-grid gap-3">
      <header class="d-flex justify-content-between align-items-start gap-3">
        <div>
          <h5 class="mb-1">Historial de alistamientos</h5>
          @if (placa()) {
            <p class="text-muted mb-0 small">Vehículo {{ placa() }}</p>
          }
        </div>
        <!-- <div class="d-flex gap-2 align-items-center">
          @if (exportUrl()) {
            <a class="btn btn-sm btn-outline-secondary" [href]="exportUrl()" target="_blank">Exportar</a>
          }
        </div> -->
      </header>

      @if (loading()) {
        <div class="d-flex justify-content-center py-4">
          <div class="spinner-border text-primary" role="status" aria-label="Cargando historial"></div>
        </div>
      } @else {
        <div class="table-responsive border rounded">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Responsable</th>
                <th>Conductor</th>
                <th>Detalle de la actividad</th>
                <th>Estado</th>
                <!-- <th class="text-end">Acciones</th> -->
              </tr>
            </thead>
            <tbody>
              @if (!records().length) {
                <tr>
                  <td colspan="6" class="text-center text-muted py-4">Sin registros para mostrar</td>
                </tr>
              } @else {
                @for (item of registrosPaginados(); track item.id; let index = $index) {
                  <tr>
                    <td>{{ pageOffset() + index + 1 }}</td>
                    <td>{{ formatearFecha(item.created_at) }}</td>
                    <td>
                      <div class="fw-semibold">{{ item.nombre_responsable }}</div>
                      <div class="text-muted small">{{ formatIdent(item.tipo_identificacion_responsable, item.numero_identificacion_responsable) }}</div>
                    </td>
                    <td>
                      <div class="fw-semibold">{{ item.nombres_conductor }}</div>
                      <div class="text-muted small">{{ formatIdent(item.tipo_identificacion_conductor, item.numero_identificacion_conductor) }}</div>
                    </td>
                    <td>{{ item.detalle_actividades }}</td>
                    <td>
                      <span class="badge" [class.text-bg-success]="item.estado" [class.text-bg-secondary]="!item.estado">
                        {{ item.estado ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <!-- <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" type="button" (click)="ver.emit(item)">
                        Ver / editar
                      </button>
                    </td> -->
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 border rounded-bottom border-top-0 bg-light px-3 py-2 small">
          <div>
            @if (records().length) {
              Mostrando {{ pageInfo().inicio }}-{{ pageInfo().fin }} de {{ pageInfo().total }} registros
            } @else {
              Sin resultados
            }
          </div>
          @if (records().length) {
            <app-paginator
              [page]="paginaActual()"
              [total]="records().length"
              [pageSize]="effectiveSize()"
              storageKey="alistamientos_historial"
              (pageChange)="paginaActual.set($event)"
              (pageSizeChange)="selectedSize.set($event)"
            />
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlistamientosHistorialComponent {
  records = input<readonly HistorialAlistamiento[]>([]);
  placa = input<string>('');
  loading = input<boolean>(false);
  exportUrl = input<string | null>(null);
  pageSize = input<number>(5);
  idTypes = input<readonly TipoIdentificacion[]>([]);

  ver = output<HistorialAlistamiento>();

  protected readonly paginaActual = signal(1);
  protected readonly selectedSize = signal<number | null>(null);
  protected readonly effectiveSize = computed(() => this.selectedSize() ?? Math.max(1, this.pageSize()));
  protected readonly registrosPaginados = computed(() => {
    const items = this.records();
    const size = this.effectiveSize();
    const inicio = (this.paginaActual() - 1) * size;
    return items.slice(inicio, inicio + size);
  });
  protected readonly totalPaginas = computed(() => {
    const total = this.records().length;
    const size = this.effectiveSize();
    return total ? Math.ceil(total / size) : 1;
  });
  protected readonly enPrimeraPagina = computed(() => this.paginaActual() <= 1);
  protected readonly enUltimaPagina = computed(() => this.paginaActual() >= this.totalPaginas());
  protected readonly pageOffset = computed(() => {
    if (!this.records().length) return 0;
    return (this.paginaActual() - 1) * this.effectiveSize();
  });
  protected readonly pageInfo = computed(() => {
    const total = this.records().length;
    if (!total) {
      return { inicio: 0, fin: 0, total: 0 } as const;
    }
    const size = this.effectiveSize();
    const inicio = (this.paginaActual() - 1) * size + 1;
    const fin = Math.min(inicio + size - 1, total);
    return { inicio, fin, total } as const;
  });

  constructor() {
    effect(() => {
      const paginas = this.totalPaginas();
      const actual = this.paginaActual();
      if (actual > paginas) {
        this.paginaActual.set(paginas);
      }
    });

    effect(() => {
      // Reinicia al cargar un nuevo conjunto de registros o al cambiar el tamaño de página.
      this.records();
      this.pageSize();
      if (this.paginaActual() !== 1) {
        this.paginaActual.set(1);
      }
    });
  }

  formatearFecha(fecha: string | undefined | null) {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  protected irAPaginaAnterior() {
    this.paginaActual.update(page => Math.max(1, page - 1));
  }

  protected irAPaginaSiguiente() {
    this.paginaActual.update(page => Math.min(this.totalPaginas(), page + 1));
  }

  // Helpers para mostrar abreviatura del tipo de identificación
  protected formatIdent(tipo: unknown, numero: unknown): string {
    const abbr = this.abbrTipoId(tipo);
    const num = numero == null ? '' : String(numero);
    return abbr ? `${abbr} ${num}` : num;
  }

  private abbrTipoId(tipo: unknown): string {
    if (tipo == null) return '';
    const raw = String(tipo).trim();
    // 1) Si viene como abreviatura ya válida
    const map: Record<string, string> = {
      '1': 'CC', // Cédula de ciudadanía
      '2': 'CE', // Cédula de extranjería
      '3': 'TI', // Tarjeta de identidad
      '4': 'RC',  // Registro civil
      '5': 'CE',  // Históricos pueden diferir; se recalcula abajo con catálogo
      '6': 'PAS', // Pasaporte
      '7': 'PEP',
      '8': 'DIE',
      '9': 'PPT',
    };
    const upper = this.removeDiacritics(raw).toUpperCase();
    if (['CC','CE','TI','NIT','PAS','PPT','PEP','DIE','RC'].includes(upper)) return upper;

    // 2) Intentar con el catálogo en tiempo de ejecución (ids numéricos o string)
    const tipos = this.idTypes();
    if (tipos && tipos.length) {
      const match = tipos.find(t => String(t.id).trim() === raw);
      if (match) {
        const ab = this.abbrFromDescription(match.nombre);
        if (ab) return ab;
      }
    }

    // 3) Si el valor en 'tipo' es un texto descriptivo, derivar abreviatura
    const byText = this.abbrFromDescription(raw);
    if (byText) return byText;

    if (upper.includes('EXTRANJ')) return 'CE';
    if (upper.includes('TARJETA')) return 'TI';
    if (upper.includes('PASAP')) return 'PAS';
    if (upper.includes('REGISTRO') || upper === 'RC') return 'RC';
    if (upper.includes('NIT')) return 'NIT';
    if (upper.includes('CEDULA') || upper.includes('CEDULA DE CIUDADANIA')) return 'CC';
    return raw; // fallback: mostrar el valor tal cual
  }

  private abbrFromDescription(desc: string | null | undefined): string {
    if (!desc) return '';
    const u = this.removeDiacritics(String(desc)).toUpperCase();
    if (u.includes('PERMISO POR PROTECCION TEMPORAL') || u.includes('PPT')) return 'PPT';
    if (u.includes('PERMISO ESPECIAL DE PERMANENCIA') || u.includes('PEP')) return 'PEP';
    if (u.includes('DOCUMENTO DE IDENTIFICACION EXTRANJERO') || u.includes('DIE')) return 'DIE';
    if (u.includes('PASAP')) return 'PAS';
    if (u.includes('EXTRANJ')) return 'CE';
    if (u.includes('TARJETA')) return 'TI';
    if (u.includes('REGISTRO CIVIL')) return 'RC';
    if (u.includes('CEDULA')) return 'CC';
    return '';
  }

  private removeDiacritics(s: string): string {
    return s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
  }
}
