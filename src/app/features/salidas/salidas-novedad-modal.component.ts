import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SalidasRegistroService } from './salidas-registro.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-salidas-novedad-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" [formGroup]="novedadForm" (ngSubmit)="crearNovedad()">
      <!-- <h6 class="mb-0">Registrar novedad</h6> -->
      <div class="row g-2">
        <div class="col-12 col-md-3">
          <label class="form-label">Descripción</label>
          <input class="form-control form-control-sm" formControlName="descripcion" placeholder="Descripción" />
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label">Tipo de novedad</label>
          <select class="form-select form-select-sm" formControlName="idTipoNovedad" required>
            <option value="" disabled>Seleccione…</option>
            <option [value]="1">Conductor / Vehículo</option>
            <option [value]="2">Otra</option>
          </select>
        </div>
        <div class="col-12 col-md-2">
          <label class="form-label">Otros</label>
          <input class="form-control form-control-sm" formControlName="otros" placeholder="Otros" />
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label">Fecha novedad</label>
          <input type="date" class="form-control form-control-sm" formControlName="fechaNovedad" />
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label">Hora novedad</label>
          <input type="time" class="form-control form-control-sm" formControlName="horaNovedad" />
        </div>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-sm btn-outline-primary" type="submit" [disabled]="creando() || novedadForm.invalid || !!novedadId()">
          {{ creando() ? 'Creando…' : 'Crear novedad' }}
        </button>
        @if (!!novedadId()) {
          <span class="badge text-bg-success align-self-center">Novedad registrada</span>
        } @else {
          <button class="btn btn-sm btn-outline-secondary" type="button" (click)="cerrar.emit()">Cancelar</button>
        }
      </div>
    </form>

    @if (mostrarIntegradora()) {
      <hr />
      <section class="d-grid gap-3">
        <form class="d-grid gap-2" [formGroup]="integradoraForm" (ngSubmit)="consultarIntegradora()">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-5">
              <label class="form-label">N° identificación del conductor</label>
              <input type="text" class="form-control form-control-sm" formControlName="numeroIdentificacion1" />
            </div>
            <div class="col-12 col-md-5">
              <label class="form-label">Placa</label>
              <input type="text" class="form-control form-control-sm" formControlName="placa" />
            </div>
            <div class="col-12 col-md-2 d-grid">
              <button type="submit" class="btn btn-brand btn-brand-sm" [disabled]="consultando() || integradoraForm.invalid">
                {{ consultando() ? 'Consultando…' : 'Consultar' }}
              </button>
            </div>
          </div>
        </form>

        @if (respIntegradora()) {
          <ul class="nav nav-tabs small" role="tablist">
            <li class="nav-item" role="presentation">
              <button type="button" role="tab" class="nav-link" [class.active]="tab() === 'conductor'" aria-selected="{{ tab() === 'conductor' }}" (click)="tab.set('conductor')">Conductor</button>
            </li>
            <li class="nav-item" role="presentation">
              <button type="button" role="tab" class="nav-link" [class.active]="tab() === 'vehiculo'" aria-selected="{{ tab() === 'vehiculo' }}" (click)="tab.set('vehiculo')">Vehículo</button>
            </li>
          </ul>
        }

        @if (respIntegradora() && tab() === 'conductor') {
          <form class="border rounded p-3 d-grid gap-3" [formGroup]="conductorForm" (ngSubmit)="registrarConductor()">
            <label for="infoPersonal" class="fw-bold">Información Personal</label>
            <div id="infoPersonal" class="row g-2">
              <div class="col-6 col-md-3">
                <label class="form-label">Tipo de Identificación</label>
                <input class="form-control form-control-sm" formControlName="tipoIdentificacionConductor" [disabled]="true" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Número de Identificación</label>
                <input class="form-control form-control-sm" formControlName="numeroIdentificacion" [disabled]="true" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Primer Nombre</label>
                <input class="form-control form-control-sm" formControlName="primerNombreConductor" [disabled]="true" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Segundo Nombre</label>
                <input class="form-control form-control-sm" formControlName="segundoNombreConductor" [disabled]="true" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Primer Apellido</label>
                <input class="form-control form-control-sm" formControlName="primerApellidoConductor" [disabled]="true" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Segundo Apellido</label>
                <input class="form-control form-control-sm" formControlName="segundoApellidoConductor" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoPruebaAlcoholimetria" class="fw-bold">Datos de alcoholimetría</label>
            <div id="infoPruebaAlcoholimetria" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">ID Prueba Alcoholimetría</label>
                <input class="form-control form-control-sm" formControlName="idPruebaAlcoholimetria" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Resultado Prueba Alcoholimetría</label>
                <input class="form-control form-control-sm" formControlName="resultadoPruebaAlcoholimetria" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Última Prueba Alcoholimetría</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaUltimaPruebaAlcoholimetria" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoLicenciaConduccion" class="fw-bold">Datos de licencia de conducción</label>
            <div id="infoLicenciaConduccion" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">Licencia de Conducción</label>
                <input class="form-control form-control-sm" formControlName="licenciaConduccion" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Vencimiento Licencia</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaVencimientoLicencia" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoExamenAptitudFisica" class="fw-bold"> Datos del examen de aptitud física</label>
            <div id="infoExamenAptitudFisica" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">Examen Aptitud Física</label>
                <input class="form-control form-control-sm" formControlName="idExamenMedico" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Último Examen Aptitud Física</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaUltimoExamenMedico" [disabled]="true" />
              </div>
            </div><hr>
            <div id="infoObservaciones" class="row g-2">
              <div class="col-12">
                <label class="form-label">Observaciones</label>
                <textarea class="form-control form-control-sm" formControlName="observaciones"></textarea>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" type="submit" [title]="conductorGuardado() ? 'Conductor ya registrado' : ''" [disabled]="registrandoConductor() || !novedadId() || conductorGuardado() || conductorForm.invalid">{{ registrandoConductor() ? 'Guardando…' : 'Registrar' }}</button>
              @if (conductorGuardado()) {
                <span class="badge text-bg-success align-self-center">Conductor registrado ({{ conductoresRegistrados() }}/2)</span>
                @if (conductoresRegistrados() < 2) {
                  <span class="small text-muted align-self-center">Realice nueva consulta para el segundo conductor.</span>
                }
              }
            </div>
          </form>
        }

        @if (respIntegradora() && tab() === 'vehiculo') {
          <form class="border rounded p-3 d-grid gap-3" [formGroup]="vehiculoForm" (ngSubmit)="registrarVehiculo()">
            <label for="infoVehiculo" class="fw-bold">Información del vehículo</label>
            <div id="infoVehiculo" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">Placa</label>
                <input class="form-control form-control-sm" formControlName="placa" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">SOAT</label>
                <input class="form-control form-control-sm" formControlName="soat" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Vencimiento SOAT</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaVencimientoSoat" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoRevisionTecnicoMecanica" class="fw-bold">Información de Revisión Técnico-Mecánica</label>
            <div id="infoRevisionTecnicoMecanica" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">Revisión Técnico-Mecánica</label>
                <input class="form-control form-control-sm" formControlName="revisionTecnicoMecanica" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Revisión Técnico-Mecánica</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaRevisionTecnicoMecanica" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoPolizas" class="fw-bold">Información de Pólizas</label>
            <div id="infoPolizas" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">N° Pólizas contractual</label>
                <input class="form-control form-control-sm" formControlName="idPolizasContractual" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Vigencia póliza contractual</label>
                <input type="date" class="form-control form-control-sm" formControlName="vigenciaContractual" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">N° Pólizas extracontractual</label>
                <input class="form-control form-control-sm" formControlName="idPolizasExtracontractual" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Vigencia póliza extracontractual</label>
                <input type="date" class="form-control form-control-sm" formControlName="vigenciaExtracontractual" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoTarjetaOperaciones" class="fw-bold">Información de la Tarjeta de Operaciones</label>
            <div id="infoTarjetaOperaciones" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">Tarjeta de Operación</label>
                <input class="form-control form-control-sm" formControlName="tarjetaOperacion" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha vencimiento Tarjeta de Operación</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaTarjetaOperacion" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoMantenimientoAlistamiento" class="fw-bold">Información de Mantenimiento y Alistamiento Diario</label>
            <div id="infoMantenimientoAlistamiento" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">N° Mantenimiento</label>
                <input class="form-control form-control-sm" formControlName="idMantenimiento" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Mantenimiento</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaMantenimiento" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">ID Protocolo Alistamiento Diario</label>
                <input class="form-control form-control-sm" formControlName="idProtocoloAlistamientoDiario" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Fecha Protocolo Alistamiento Diario</label>
                <input type="date" class="form-control form-control-sm" formControlName="fechaProtocoloAlistamientoDiario" [disabled]="true" />
              </div>
            </div><hr>
            <label for="infoClaseNivel" class="fw-bold">Información de Clase y Nivel de Servicio</label>
            <div id="infoClaseNivel" class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label">Clase</label>
                <input class="form-control form-control-sm" formControlName="clase" [disabled]="true" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label">Nivel de Servicio</label>
                <select class="form-select form-select-sm" formControlName="nivelServicio">
                  <option value="" disabled>Seleccione…</option>
                  @for (n of nivelesServicio(); track n.id) {
                    <option [value]="n.id">{{ n.nombre }}</option>
                  }
                </select>
              </div>
            </div><hr>
            <div id="infoObservacionesVehiculo" class="row g-2">
              <div class="col-12">
                <label class="form-label">Observaciones</label>
                <textarea class="form-control form-control-sm" formControlName="observaciones"></textarea>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" type="submit" [title]="vehiculoGuardado() ? 'Vehículo ya registrado' : ''" [disabled]="registrandoVehiculo() || !novedadId() || vehiculoGuardado() || vehiculoForm.invalid">{{ registrandoVehiculo() ? 'Guardando…' : 'Registrar' }}</button>
              @if (vehiculoGuardado()) {
                <span class="badge text-bg-success align-self-center">Vehículo registrado</span>
              }
            </div>
          </form>
        }

        <div class="d-flex justify-content-end">
          <button class="btn btn-sm btn-success" type="button" [disabled]="!puedeFinalizar()" (click)="finalizar()">Finalizar</button>
        </div>
      </section>
    }
  `,
  styles: [
    `:host{display:block}`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalidasNovedadModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly registro = inject(SalidasRegistroService);

  idSalida = input<number>();
  placaSalida = input<string | undefined>();
  nit = input<string | undefined>();
  cerrar = output<void>();
  guardado = output<boolean>();

  creando = signal(false);
  consultando = signal(false);
  registrandoConductor = signal(false);
  registrandoVehiculo = signal(false);
  novedadId = signal<number | null>(null);
  respIntegradora = signal<any | null>(null);
  nivelesServicio = signal<Array<{id:number; nombre:string}>>([]);
  tab = signal<'conductor' | 'vehiculo'>('conductor');
  conductorGuardado = signal(false);
  vehiculoGuardado = signal(false);
  mostrarIntegradora = computed(() => {
    const tipo = Number(this.novedadForm.get('idTipoNovedad')?.value || 0);
    return !!this.novedadId() && tipo === 1;
  });
  puedeFinalizar = computed(() => this.conductorGuardado() || this.vehiculoGuardado());

  novedadForm = this.fb.group({
    idTipoNovedad: ['', Validators.required],
    fechaNovedad: [''],
    horaNovedad: [''],
    descripcion: ['', Validators.required],
    otros: ['']
  });

  integradoraForm = this.fb.group({
    numeroIdentificacion1: [''],
    placa: [''],
    fechaConsulta: ['']
  });

  conductorForm = this.fb.group({
    tipoIdentificacionConductor: [''],
    numeroIdentificacion: [''],
    primerNombreConductor: [''],
    segundoNombreConductor: [''],
    primerApellidoConductor: [''],
    segundoApellidoConductor: [''],
    idPruebaAlcoholimetria: [''],
    resultadoPruebaAlcoholimetria: [''],
    fechaUltimaPruebaAlcoholimetria: [''],
    licenciaConduccion: [''],
    fechaVencimientoLicencia: [''],
    idExamenMedico: [''],
    fechaUltimoExamenMedico: [''],
    observaciones: ['', Validators.required]
  });

  vehiculoForm = this.fb.group({
    placa: [''],
    soat: [''],
    fechaVencimientoSoat: [''],
    revisionTecnicoMecanica: [''],
    fechaRevisionTecnicoMecanica: [''],
    idPolizasContractual: [''],
    vigenciaContractual: [''],
    idPolizasExtracontractual: [''],
    vigenciaExtracontractual: [''],
    tarjetaOperacion: [''],
    fechaTarjetaOperacion: [''],
    idMantenimiento: [''],
    fechaMantenimiento: [''],
    idProtocoloAlistamientoDiario: [''],
    fechaProtocoloAlistamientoDiario: [''],
    observaciones: ['', Validators.required],
    clase: [''],
    nivelServicio: ['', Validators.required]
  });

  ngOnInit(): void {
    const today = new Date();
    const yyyyMmDd = today.toISOString().slice(0, 10);
    const hh = String(today.getHours()).padStart(2, '0');
    const mm = String(today.getMinutes()).padStart(2, '0');
    this.novedadForm.patchValue({ fechaNovedad: yyyyMmDd, horaNovedad: `${hh}:${mm}` });
    this.integradoraForm.patchValue({ fechaConsulta: yyyyMmDd, placa: this.placaSalida() ?? '' });
    // cargar niveles de servicio
    this.registro.obtenerNivelesServicio().subscribe((resp: any) => {
      const raw = resp?.array_data ?? resp?.obj?.array_data ?? resp?.data ?? [];
      const list = Array.isArray(raw) ? raw : Object.values(raw ?? {});
      const mapped = list.map((it: any) => ({ id: Number(it?.id), nombre: String(it?.nombre ?? '') }));
      this.nivelesServicio.set(mapped);
      console.log('Niveles de servicio cargados:', mapped);
    });
  }

  crearNovedad() {
    if (!this.idSalida()) return;
    if (this.novedadForm.invalid) return;
    const payload = { idDespacho: this.idSalida(), ...this.novedadForm.getRawValue() } as any;
    this.creando.set(true);
    this.registro.crearNovedad(payload).subscribe({
      next: (resp: any) => {
        const id =
          resp?.obj?.obj?.id ??
          resp?.obj?.id ??
          resp?.obj?.novedad?.id ??
          resp?.data?.id ??
          resp?.id ??
          null;
        if (id) this.novedadId.set(id);
        // Deshabilitar todos los campos para evitar modificaciones posteriores
        this.novedadForm.disable();
        this.guardado.emit(true);
        Swal.fire({ icon: 'success', title: resp?.mensaje ?? 'Novedad registrada', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.mensajes ?? 'No fue posible registrar la novedad' });
        this.creando.set(false);
      },
      complete: () => this.creando.set(false)
    });
  }

  consultarIntegradora() {
    if (!this.nit()) return;
    const form = this.integradoraForm.getRawValue();
    const req = {
      numeroIdentificacion1: String(form.numeroIdentificacion1 || ''),
      placa: String(form.placa || ''),
      nit: String(this.nit() || ''),
      fechaConsulta: String(form.fechaConsulta || '')
    };
    this.consultando.set(true);
    this.registro.consultarIntegradora(req).subscribe({
      next: (resp: any) => {
        this.respIntegradora.set(resp);
        // Rehabilitar botón de registrar conductor si aún no se alcanzó el límite de 2
        const countConductores = Number(localStorage.getItem('numeroConductores') || '0');
        if (countConductores < 2) {
          this.conductorGuardado.set(false);
        }
        const root = resp?.obj ?? {};
        const c = root?.conductor1;
        if (c?.persona) {
          const tipoDocMap: Record<string | number, string> = {
            1: 'Cédula de ciudadanía', 2: 'Tarjeta de identidad', 3: 'Cédula de extranjería', 4: 'Pasaporte',
          };
          this.conductorForm.patchValue({
            tipoIdentificacionConductor: tipoDocMap[c.persona?.tipoDocumento as any] ?? String(c.persona?.tipoDocumento ?? ''),
            numeroIdentificacion: c.persona?.numeroIdentificacion ?? '',
            primerNombreConductor: c.persona?.primerNombre ?? '',
            segundoNombreConductor: c.persona?.segundoNombre ?? '',
            primerApellidoConductor: c.persona?.primerApellido ?? '',
            segundoApellidoConductor: c.persona?.segundoApellido ?? '',
            idPruebaAlcoholimetria: c.alcoholimetria?.codigo ?? '',
            resultadoPruebaAlcoholimetria: c.alcoholimetria?.resultado ?? '',
            fechaUltimaPruebaAlcoholimetria: c.alcoholimetria?.fecha ?? '',
            licenciaConduccion: c.licencia?.numeroLicencia ?? '',
            fechaVencimientoLicencia: c.licencia?.fechaVencimiento ?? '',
            idExamenMedico: c.examenMedico?.codigo ?? c.aptitudFisica?.codigo ?? '',
            fechaUltimoExamenMedico: c.examenMedico?.fecha ?? c.aptitudFisica?.fecha ?? '',
          });
          // disable all but observation
          this.conductorForm.disable();
          this.conductorForm.get('observaciones')?.enable();
        }
        const v = root?.vehiculo;
        const pol = root?.polizas;
        const tobj = root?.tarjetaOperacion;
        const mprev = root?.mantenimientoPreventivo;
        const alist = root?.alistamientoDiario;
        if (v) {
          this.vehiculoForm.patchValue({
            placa: v.placa ?? '',
            soat: v.numeroSoat ?? '',
            fechaVencimientoSoat: v.soatVencimiento ?? v.soat_vencimiento ?? '',
            revisionTecnicoMecanica: v.numeroRtm ?? v.revisionTecnicoMecanica ?? '',
            fechaRevisionTecnicoMecanica: v.rtmVencimiento ?? v.fechaRevisionTecnicoMecanica ?? '',
            tarjetaOperacion: tobj?.numero ?? '',
            fechaTarjetaOperacion: tobj?.vencimiento ?? tobj?.fechaExpedicion ?? '',
            idMantenimiento: mprev?.id ?? '',
            fechaMantenimiento: mprev?.fecha ?? '',
            idProtocoloAlistamientoDiario: alist?.id ?? '',
            fechaProtocoloAlistamientoDiario: alist?.fecha ?? '',
            idPolizasContractual: pol?.contractual?.numeroPoliza ?? '',
            vigenciaContractual: pol?.contractual?.vencimiento ?? '',
            idPolizasExtracontractual: pol?.extracontractual?.numeroPoliza ?? '',
            vigenciaExtracontractual: pol?.extracontractual?.vencimiento ?? '',
            clase: v.claseVehiculoCodigo ?? ''
          });
          // disable all but nivelServicio and observaciones
          this.vehiculoForm.disable();
          this.vehiculoForm.get('nivelServicio')?.enable();
          this.vehiculoForm.get('observaciones')?.enable();
        }
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error integradora', text: err?.error?.mensajes ?? 'No fue posible consultar' });
        this.consultando.set(false);
      },
      complete: () => this.consultando.set(false)
    });
  }

  registrarConductor() {
    if (!this.novedadId()) return;
    // Max 2 conductores, evitar duplicados
    const prevCount = Number(localStorage.getItem('numeroConductores') || '0');
    if (prevCount >= 2) {
      Swal.fire({ icon: 'info', title: 'Máximo de conductores alcanzado' });
      return;
    }
    this.registrandoConductor.set(true);
    const raw = this.conductorForm.getRawValue();
    const body = {
      idNovedad: this.novedadId(),
      ...raw,
      tipoIdentificacionConductor: String(raw.tipoIdentificacionConductor ?? ''),
      idPruebaAlcoholimetria: String(raw.idPruebaAlcoholimetria ?? ''),
      idExamenMedico: String(raw.idExamenMedico ?? ''),
    };
    // evitar duplicidad por doc exacto
    const prev = localStorage.getItem('identificacionConductor');
    if (prev && prev === (raw.numeroIdentificacion ?? '')) {
      Swal.fire({ icon: 'warning', title: 'Conductor ya registrado' });
      this.registrandoConductor.set(false);
      return;
    }
    this.registro.crearNovedadConductor(body).subscribe({
      next: (resp: any) => {
        localStorage.setItem('identificacionConductor', raw.numeroIdentificacion ?? '');
        const n = prevCount + 1;
        localStorage.setItem('numeroConductores', String(n));
        Swal.fire({ icon: 'success', title: resp?.mensaje ?? 'Conductor registrado' });
        this.conductorGuardado.set(true);
        // Requerir nueva consulta para un segundo conductor
        if (n < 2) {
          Swal.fire({ icon: 'info', title: 'Si requiere registrar un segundo conductor, realice la consulta nuevamente.' });
              // Mantener formularios visibles; dejar el formulario deshabilitado para evitar edición directa.
              this.conductorForm.disable();
              this.conductorForm.get('observaciones')?.enable();
        } else {
          // Deshabilitar formulario completamente (límite alcanzado)
          this.conductorForm.disable();
        }
      },
      error: (err) => { Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.mensajes ?? 'No fue posible registrar el conductor' }); this.registrandoConductor.set(false); },
      complete: () => this.registrandoConductor.set(false)
    });
  }

  registrarVehiculo() {
    if (!this.novedadId()) return;
    if (this.vehiculoGuardado()) {
      Swal.fire({ icon: 'info', title: 'Ya se registró un vehículo' });
      return;
    }
    const raw = this.vehiculoForm.getRawValue();
    if (this.placaSalida() && this.placaSalida() === raw.placa) {
      Swal.fire({ icon: 'warning', title: 'Placa inválida', text: 'No puede registrar el mismo vehículo.' });
      return;
    }
    this.registrandoVehiculo.set(true);
    const body = {
      idNovedad: this.novedadId(),
      placa: raw.placa,
      soat: raw.soat,
      fechaVencimientoSoat: raw.fechaVencimientoSoat,
      revisionTecnicoMecanica: raw.revisionTecnicoMecanica ? String(raw.revisionTecnicoMecanica) : '',
      fechaRevisionTecnicoMecanica: raw.fechaRevisionTecnicoMecanica,
      tarjetaOperacion: raw.tarjetaOperacion,
      fechaVencimientoTarjetaOperacion: raw.fechaTarjetaOperacion,
      idMatenimientoPreventivo: raw.idMantenimiento ? String(raw.idMantenimiento) : '',
      fechaMantenimientoPreventivo: raw.fechaMantenimiento,
      idProtocoloAlistamientodiario: raw.idProtocoloAlistamientoDiario ? String(raw.idProtocoloAlistamientoDiario) : '',
      fechaProtocoloAlistamientodiario: raw.fechaProtocoloAlistamientoDiario,
      observaciones: raw.observaciones,
      clase: raw.clase,
      nivelServicio: raw.nivelServicio,
      idPolizaContractual: raw.idPolizasContractual ? String(raw.idPolizasContractual) : '',
      idPolizaExtracontractual: raw.idPolizasExtracontractual ? String(raw.idPolizasExtracontractual) : '',
      vigenciaContractual: raw.vigenciaContractual,
      vigenciaExtracontractual: raw.vigenciaExtracontractual,
      estado: true
    };
    this.registro.crearNovedadVehiculo(body).subscribe({
      next: (resp: any) => {
        localStorage.setItem('vehiculoRegistrado', '1');
        Swal.fire({ icon: 'success', title: resp?.mensaje ?? 'Vehículo registrado' });
        this.vehiculoGuardado.set(true);
        // Deshabilitar el formulario para evitar múltiples registros
        this.vehiculoForm.disable();
      },
      error: (err) => { Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.mensajes ?? 'No fue posible registrar el vehículo' }); this.registrandoVehiculo.set(false); },
      complete: () => this.registrandoVehiculo.set(false)
    });
  }
  finalizar() {
    this.cerrar.emit();
  }

  // Helper para template: número de conductores registrados (persistido en localStorage)
  conductoresRegistrados(): number {
    return Number(localStorage.getItem('numeroConductores') || '0');
  }
}
