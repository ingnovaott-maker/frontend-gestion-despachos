import { ChangeDetectionStrategy, Component, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosMantenimientos } from '../../../mantenimientos/servicios/mantenimientos.service';
import { ServicioLocalStorage } from '../../../administrador/servicios/local-storage.service';
import { ServicioArchivos } from '../../../archivos/servicios/archivos.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { RegistroPreventivoComponent } from './registro-preventivo.component';
import { PaginatorComponent } from '../../../shared/ui/paginator.component';

interface DocumentoItem {
  documento: string;
  ruta: string;
  nombreOriginal: string;
  fecha?: string;
  estado?: boolean;
}

@Component({
  selector: 'app-preventivos-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, RegistroPreventivoComponent, PaginatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="d-flex flex-column gap-3">
      <!-- Header card eliminado según nueva directriz -->

      <div class="card border-1 shadow-sm">
        <div class="card-body d-grid gap-3">
          <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <h5 class="card-title mb-0">PDF del programa de mantenimiento preventivo</h5>
            <div class="d-flex align-items-center gap-2">
              <label class="btn-brand btn-brand--sm mb-0">
                <input type="file" class="visualmente-oculto visually-hidden" accept=".pdf" (change)="onFileChange($event)" />
                <i class="bi bi-upload"></i> Cargar archivo
              </label>
              <small class="text-muted">Formato permitido: PDF. Máx 4&nbsp;MB.</small>
            </div>
          </div>

          <div class="d-flex justify-content-end">
            <div class="input-group input-group-sm" style="max-width: 320px;">
              <input type="search" class="form-control" placeholder="Buscar documento" [(ngModel)]="filtroDocs" />
              <button type="button" class="btn-outline-brand btn-brand--sm" (click)="filtroDocs='';" [disabled]="!filtroDocs">Limpiar
              </button>
            </div>
          </div>

          <div class="table-responsive border rounded">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of documentosPaginados()">
                  <td>{{ d.nombreOriginal }}</td>
                  <td>{{ fechaLegible(d.fecha) }}</td>
                  <td>
                    <span class="badge" [class.text-bg-success]="d.estado" [class.text-bg-secondary]="d.estado === false">
                      {{ d.estado === false ? 'Inactivo' : 'Activo' }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" (click)="descargar(d)">
                      <span><i class="bi bi-download"></i> Descargar</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="documentos.length === 0">
                  <td colspan="4" class="text-muted">Sin documentos</td>
                </tr>
                <tr *ngIf="documentos.length && !documentosFiltrados().length">
                  <td colspan="4" class="text-muted">Sin resultados</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-flex justify-content-between align-items-center" *ngIf="documentosFiltrados().length">
            <small class="text-muted">Mostrando {{ documentosRango().desde }}–{{ documentosRango().hasta }} de {{ documentosRango().total }}</small>
            <app-paginator
              [page]="docsPage"
              [total]="documentosFiltrados().length"
              [pageSize]="docsPageSize"
              [showSummary]="false"
              storageKey="preventivos_docs"
              (pageChange)="docsPage=$event"
              (pageSizeChange)="docsPageSize=$event"
            />
          </div>
        </div>
      </div>

      <!-- Vehículos (reemplaza historial inline) -->
      <div class="card border-1 shadow-sm">
        <div class="card-body d-grid gap-3">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Vehículos</h5>
            <div class="text-muted small" *ngIf="rangoActual.total">
              Mostrando {{ rangoActual.desde }}–{{ rangoActual.hasta }} de {{ rangoActual.total }}
            </div>
          </div>

          <div class="d-flex justify-content-end">
            <div class="input-group input-group-sm" style="max-width: 320px;">
              <input type="search" class="form-control" placeholder="Placa, fecha o estado" [(ngModel)]="filtro" (ngModelChange)="page=1" />
              <button type="button" class="btn-outline-brand btn-brand--sm" (click)="filtro=''; page=1" [disabled]="!filtro">Limpiar</button>
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
                <tr *ngIf="registrosLoading">
                  <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status" aria-label="Cargando registros"></div>
                  </td>
                </tr>
                <tr *ngIf="!registrosLoading && !registros.length">
                  <td colspan="5" class="text-center text-muted py-4">No hay vehículos disponibles.</td>
                </tr>
                <tr *ngIf="!registrosLoading && registros.length && !registrosPaginados().length">
                  <td colspan="5" class="text-center text-muted py-4">Sin resultados</td>
                </tr>
                <tr *ngFor="let registro of registrosPaginados(); let idx = index">
                  <td>{{ (page - 1) * pageSize + idx + 1 }}</td>
                  <td class="fw-semibold">{{ registro.placa }}</td>
                  <td>{{ fechaLegible(registro.fecha) }}</td>
                  <td>{{ estadoTexto(registro) }}</td>
                  <td class="text-end d-flex justify-content-end gap-2">
                    <button class="btn-brand btn-brand--sm" type="button" (click)="abrirFormularioNuevo(registro)">
                      <i class="bi bi-plus-lg"></i> Registrar mantenimiento
                    </button>
                    <button class="btn-outline-brand btn-brand--sm" type="button" (click)="abrirHistorial(registro)">
                      <i class="bi bi-clock-history"></i> Historial
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-content-between align-items-center" *ngIf="registrosFiltrados().length">
            <small class="text-muted">Mostrando {{ rangoActual.desde }} – {{ rangoActual.hasta }} de {{ rangoActual.total }}</small>
            <app-paginator
              [page]="page"
              [total]="registrosFiltrados().length"
              [pageSize]="pageSize"
              [showSummary]="false"
              storageKey="preventivos_registros"
              (pageChange)="page=$event"
              (pageSizeChange)="pageSize=$event"
            />
          </div>
        </div>
      </div>

      <!-- Modal de historial -->
      <app-modal [open]="historialOpen()" title="Historial de mantenimiento preventivo" size="xl" (closed)="historialOpen.set(false)">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="fw-semibold">Placa: {{ placaFiltro }}</div>
          <!-- <a class="btn btn-sm btn-outline-secondary" *ngIf="historial.length" [href]="exportarHistorial()" target="_blank">
            <i class="bi bi-file-earmark-arrow-down"></i> Exportar
          </a> -->
        </div>
        <div class="table-responsive border rounded">
          <table class="table align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>NIT</th>
                <th>Razón Social</th>
                <th>Tipo Identificación</th>
                <th>Número Identificación</th>
                <th>Nombre Ingeniero</th>
                <th>Detalle Actividades</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="!historial.length">
                <td colspan="9" class="text-center text-muted">No hay registros disponibles</td>
              </tr>
              <tr *ngFor="let r of pagedHistorial(); let i = index">
                <td>{{ (page-1)*pageSize + i + 1 }}</td>
                <td>{{ (r.fecha?.split('T')[0]) | date: 'dd/MM/yyyy' }}</td>
                <td>{{ r.hora }}</td>
                <td>{{ r.nit }}</td>
                <td>{{ r.razon_social || r.razonSocial }}</td>
                <td>{{ r.tipo_identificacion || r.tipoIdentificacion }}</td>
                <td>{{ r.numero_identificacion || r.numeroIdentificacion }}</td>
                <td>{{ r.nombres_responsable || r.nombreIngeniero }}</td>
                <td style="max-width: 300px; white-space: pre-wrap;">{{ r.detalle_actividades || r.detalleActividades }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2" *ngIf="historial.length">
          <div class="text-muted small">Mostrando {{ (page-1)*pageSize + 1 }} – {{ endIndex() }} de {{ historial.length }}</div>
          <app-paginator
            [page]="page"
            [total]="historial.length"
            [pageSize]="pageSize"
            [showSummary]="false"
            storageKey="preventivos_historial"
            (pageChange)="page=$event"
            (pageSizeChange)="pageSize=$event"
          />
        </div>
      </app-modal>

      <!-- Modal de registro -->
      <app-modal [open]="isRegistroOpen()" [title]="placaSeleccionada ? 'Nuevo mantenimiento preventivo — Placa: ' + placaSeleccionada : 'Nuevo mantenimiento preventivo'" size="xl" (closed)="isRegistroOpen.set(false)">
        <app-registro-preventivo [inModal]="true" [initialPlaca]="placaSeleccionada" [resetToken]="registroReset" [modalOpen]="isRegistroOpen()" (saved)="onRegistroSaved()" (closed)="isRegistroOpen.set(false)"></app-registro-preventivo>
      </app-modal>
    </div>
  `,
})
export class PreventivosComponent {
  private readonly api = inject(ServiciosMantenimientos);
  private readonly storage = inject(ServicioLocalStorage);
  private readonly archivos = inject(ServicioArchivos);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  documentos: DocumentoItem[] = [];
  private readonly TIPO_PREVENTIVO = 1;
  placaFiltro = '';
  placaSeleccionada: string | undefined;
  historial: any[] = [];
  page = 1;
  pageSize = 5;
  // Paginación de documentos
  docsPage = 1;
  docsPageSize = 5;
  isRegistroOpen = signal(false);
  historialOpen = signal(false);
  // Token para forzar reinicio del formulario hijo
  registroReset = 0;

  // Documentos filter
  filtroDocs = '';
  documentosFiltrados() {
    const q = (this.filtroDocs || '').toLowerCase();
    if (!q) return this.documentos;
    return this.documentos.filter((d) => (d.nombreOriginal || '').toLowerCase().includes(q));
  }
  documentosPaginados() {
    const start = (this.docsPage - 1) * this.docsPageSize;
    return this.documentosFiltrados().slice(start, start + this.docsPageSize);
  }
  documentosTotalPaginas() {
    const t = this.documentosFiltrados().length;
    return t ? Math.max(1, Math.ceil(t / this.docsPageSize)) : 1;
  }
  documentosPaginaAnterior() { if (this.docsPage > 1) this.docsPage--; }
  documentosPaginaSiguiente() { if (this.docsPage < this.documentosTotalPaginas()) this.docsPage++; }
  documentosRango() {
    const total = this.documentosFiltrados().length;
    if (!total) return { desde: 0, hasta: 0, total };
    const desde = (this.docsPage - 1) * this.docsPageSize + 1;
    const hasta = Math.min(desde + this.docsPageSize - 1, total);
    return { desde, hasta, total };
  }

  // Vehículos list
  registros: any[] = [];
  registrosLoading = false;
  filtro = '';
  pageSizeVeh = 7;
  get pageSizeVehiculos() { return this.pageSizeVeh; }

  ngOnInit() {
    this.cargarLista();
    this.cargarRegistros();
  }

  registrosFiltrados() {
    const term = (this.filtro || '').trim().toLowerCase();
    if (!term) return this.registros;
    return this.registros.filter((r) => {
      const placa = (r.placa || '').toLowerCase();
      const fecha = this.fechaLegible(r.fecha).toLowerCase();
      const estado = this.estadoTexto(r).toLowerCase();
      return placa.includes(term) || fecha.includes(term) || estado.includes(term);
    });
  }
  registrosPaginados() {
    const start = (this.page - 1) * this.pageSize;
    return this.registrosFiltrados().slice(start, start + this.pageSize);
  }
  totalPaginas() { const t = this.registrosFiltrados().length; return t ? Math.max(1, Math.ceil(t / this.pageSize)) : 1; }
  paginaAnterior() { if (this.page > 1) this.page--; }
  paginaSiguiente() { if (this.page < this.totalPaginas()) this.page++; }
  get rangoActual() {
    const total = this.registrosFiltrados().length;
    if (!total) return { desde: 0, hasta: 0, total };
    const desde = (this.page - 1) * this.pageSize + 1;
    const hasta = Math.min(desde + this.pageSize - 1, total);
    return { desde, hasta, total };
  }

  private cargarLista() {
    const usuario = this.storage.obtenerUsuario();
    const vigilado = usuario?.usuario; // En legacy usaban usuario como vigiladoId
    if (!vigilado) {
      this.documentos = this.getDocumentosMock();
      this.cdr.markForCheck();
      return;
    }
    this.api
      .listarDocumentos(this.TIPO_PREVENTIVO, vigilado)
      .pipe(
        catchError(() => of([])),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe((res: any) => {
        const listaCruda: any[] = Array.isArray(res) ? res : [];
        const lista: DocumentoItem[] = listaCruda.map(d => ({
          documento: d.documento,
          ruta: d.ruta,
          nombreOriginal: d.nombreOriginal,
          fecha: d.fecha,
          estado: d.estado,
        }));
        this.documentos = lista.length ? lista : this.getDocumentosMock();
      });
  }

  private cargarRegistros() {
    const usuario = this.storage.obtenerUsuario();
    const vigilado = usuario?.usuario;
    const rolId = this.storage.obtenerRol()?.id;
    if (!vigilado) {
      this.registros = this.getRegistrosMock();
      this.registrosLoading = false;
      this.cdr.markForCheck();
      return;
    }
    this.registrosLoading = true;
    const timeout = setTimeout(() => {
      if (this.registrosLoading) {
        this.registros = this.getRegistrosMock();
        this.registrosLoading = false;
        this.cdr.markForCheck();
      }
    }, 2000);

    this.api
      .listarRegistros(this.TIPO_PREVENTIVO, vigilado, rolId)
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          clearTimeout(timeout);
          this.registrosLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe((res: any) => {
        const lista = Array.isArray(res) ? res : [];
        // Backend: { placa, fechaDiligenciamiento, estadoMantenimiento, tipoId, id }
        // Adaptamos a la vista actual que usa 'fecha'
        this.registros = lista.length
          ? lista.map((r: any) => ({ ...r, fecha: r.fechaDiligenciamiento ?? r.fecha ?? null }))
          : this.getRegistrosMock();
      });
  }

  private getRegistrosMock() {
    const hoy = Date.now();
    const d = (dias: number) => new Date(hoy - dias * 24 * 60 * 60 * 1000).toISOString();
    return [];
  }

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      Swal.fire({ icon: 'warning', title: 'Formato inválido', text: 'Solo se permite PDF.' });
      input.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'El archivo pesa más de 4Mb' });
      input.value = '';
      return;
    }
    const usuario = this.storage.obtenerUsuario();
    const vigilado = usuario?.usuario;
    if (!vigilado) return;

    Swal.fire({ title: 'Cargando archivo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.archivos.guardarArchivo(file, 'sicov', vigilado).subscribe({
      next: (resp) => {
        this.api
          .guardarArchivo(this.TIPO_PREVENTIVO, resp.nombreAlmacenado, resp.nombreOriginalArchivo, resp.ruta, vigilado)
          .subscribe({
            next: () => {
              Swal.fire({ icon: 'success', title: 'Archivo cargado', timer: 1200, showConfirmButton: false });
              input.value = '';
              this.cargarLista();
            },
            error: () => {
              Swal.fire({ icon: 'error', title: 'Error al guardar el archivo' });
            },
          });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error al subir el archivo' }),
    });
  }

  descargar(d: DocumentoItem) {
    this.archivos.descargarArchivo(d.documento, d.ruta, d.nombreOriginal);
  }


  abrirFormularioNuevo(registro: any) {
  this.placaSeleccionada = (registro?.placa || '').trim() || undefined;
    // incrementar token antes de abrir el modal para que el hijo reinicie
    this.registroReset++;
    this.isRegistroOpen.set(true);
  }

  onRegistroSaved() {
    // Actualizar listado de registros y documentos si aplica
    this.cargarRegistros();
  }

  // Historial
  cargarHistorial() {
    const placa = (this.placaFiltro || '').trim();
    const usuario = this.storage.obtenerUsuario();
    const vigilado = usuario?.usuario;
    if (!placa) return;
    if (!vigilado) {
      this.historial = this.getHistorialMock(placa);
      this.page = 1;
      this.cdr.markForCheck();
      return;
    }
    this.api
      .historial(this.TIPO_PREVENTIVO, vigilado, placa)
      .pipe(
        catchError(() => of([])),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe((res: any) => {
        const lista = Array.isArray(res) ? res : [];
        this.historial = lista.length ? lista : this.getHistorialMock(placa);
        this.page = 1;
      });
  }

  abrirHistorial(registro: any) {
    this.placaFiltro = registro?.placa || '';
    if (this.placaFiltro) {
      this.cargarHistorial();
      this.historialOpen.set(true);
    }
  }

  exportarHistorial(): string | null {
    const placa = (this.placaFiltro || '').trim();
    const usuario = this.storage.obtenerUsuario();
    const vigilado = usuario?.usuario;
    if (!placa || !vigilado) return null;
    return this.api.exportarHistorial(this.TIPO_PREVENTIVO, vigilado, placa) as string;
  }

  pagedHistorial() {
    const start = (this.page - 1) * this.pageSize;
    return this.historial.slice(start, start + this.pageSize);
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.historial.length / this.pageSize));
  }

  nextPage() {
    if (this.page < this.totalPages()) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  endIndex() {
    const end = this.page * this.pageSize;
    return end > this.historial.length ? this.historial.length : end;
  }

  fechaLegible(fecha?: string | null): string {
    // Normaliza fechas vacías o inválidas
    if (!fecha || !fecha.toString().trim()) return '—';
    if (/^0{4}-0{2}-0{2}/.test(fecha)) return '—';
    let d = new Date(fecha);
    if (Number.isNaN(d.getTime())) {
      // Intento adicional: reemplazar espacio por 'T'
      const alt = fecha.replace(' ', 'T');
      d = new Date(alt);
      if (Number.isNaN(d.getTime())) return '—';
    }
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  estadoTexto(registro: any): string {
    const estadoTexto = (registro?.estadoMantenimiento ?? '').toString().trim();
    if (estadoTexto) return estadoTexto;
    if (typeof registro?.estado === 'boolean') {
      return registro.estado ? 'Activo' : 'Inactivo';
    }
    return '—';
  }

  // Mocks
  private getDocumentosMock(): DocumentoItem[] {
    return [];
  }
  isMockDoc(d: DocumentoItem): boolean { return d.ruta === 'mock'; }

  private getHistorialMock(placa: string) {
    const hoy = Date.now();
    const d = (dias: number) => new Date(hoy - dias * 86400000).toISOString();
    return [
      {
        placa,
        fecha: d(3),
        hora: '09:15',
        nit: '800086050',
        razon_social: 'Empresa prueba',
        tipo_identificacion: 'NIT',
        numero_identificacion: '800086050',
        nombres_responsable: 'Ing. Demo Uno',
        detalle_actividades: 'Revisión general y ajuste de niveles.'
      },
      {
        placa,
        fecha: d(15),
        hora: '10:40',
        nit: '800086050',
        razon_social: 'Empresa prueba',
        tipo_identificacion: 'NIT',
        numero_identificacion: '800086050',
        nombres_responsable: 'Ing. Demo Dos',
        detalle_actividades: 'Cambio de filtros y prueba de funcionamiento.'
      }
    ];
  }
}
