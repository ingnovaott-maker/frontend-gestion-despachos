import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AutorizacionFormulario } from './autorizaciones.models';
import { AutorizacionesService } from './autorizaciones.service';
import { ParametricasService } from '../../parametricas/servicios/parametricas.service';

export interface AutorizacionFormContext {
  mantenimientoId?: string | number;
  vigiladoId: string;
  placa: string;
  editar: boolean;
}

export type SubmitEvent = { form: AutorizacionFormulario; mantenimientoId?: string | number };

@Component({
  selector: 'app-autorizaciones-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" class="d-grid gap-3" (ngSubmit)="onSubmit()">

      <h5>Información del viaje</h5>
      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Placa</label>
          <input type="text" class="form-control" [value]="context().placa" disabled />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Fecha del viaje</label>
          <input type="date" class="form-control" formControlName="fechaViaje" [attr.min]="minDate" placeholder="dd/mm/aaaa" />
        </div>
      </div>

      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Departamento origen (Filtro)</label>
          <select class="form-select" formControlName="departamentoOrigen" (change)="onDepartamentoChange('origen')">
            <option [ngValue]="null">Seleccione un departamento</option>
            @for (d of departamentos(); track d.codigo) { <option [value]="d.codigo">{{ d.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Departamento destino (Filtro)</label>
          <select class="form-select" formControlName="departamentoDestino" (change)="onDepartamentoChange('destino')">
            <option [ngValue]="null">Seleccione un departamento</option>
            @for (d of departamentos(); track d.codigo) { <option [value]="d.codigo">{{ d.descripcion }}</option> }
          </select>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Municipio origen (Filtro)</label>
          <select class="form-select" formControlName="municipioOrigen" (change)="onMunicipioChange('origen')" [disabled]="!form.get('departamentoOrigen')?.value">
            <option [ngValue]="null">Seleccione un municipio</option>
            @for (m of municipiosOrigen(); track m.codigo) { <option [value]="m.codigo">{{ m.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Municipio destino (Filtro)</label>
          <select class="form-select" formControlName="municipioDestino" (change)="onMunicipioChange('destino')" [disabled]="!form.get('departamentoDestino')?.value">
            <option [ngValue]="null">Seleccione un municipio</option>
            @for (m of municipiosDestino(); track m.codigo) { <option [value]="m.codigo">{{ m.descripcion }}</option> }
          </select>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Centro poblado origen</label>
          <select class="form-select" formControlName="origen" [disabled]="!form.get('municipioOrigen')?.value">
            <option [ngValue]="null">Seleccione un centro poblado</option>
            @for (u of ubicacionesOrigen(); track u.codigo) { <option [value]="u.codigo">{{ u.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Centro poblado destino</label>
          <select class="form-select" formControlName="destino" [disabled]="!form.get('municipioDestino')?.value">
            <option [ngValue]="null">Seleccione un centro poblado</option>
            @for (u of ubicacionesDestino(); track u.codigo) { <option [value]="u.codigo">{{ u.descripcion }}</option> }
          </select>
        </div>
      </div>

      <hr />
      <h5>Información del menor de edad - Niño, Niña o Adolescente (NNA)</h5>
      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Tipo de identificación</label>
          <select class="form-select" formControlName="tipoIdentificacionNna">
            <option [ngValue]="null">Seleccione un tipo</option>
            @for (t of tiposIdentificacionesNna(); track t.codigo) { <option [value]="t.codigo">{{ t.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Número de identificación</label>
          <input class="form-control" formControlName="numeroIdentificacionNna" placeholder="Ej: 1023456789" />
        </div>
        <div class="col-lg-4">
          <label class="form-label">Nombres y apellidos</label>
          <input class="form-control" formControlName="nombresApellidosNna" placeholder="Ej: Juan Pérez Ramírez" />
        </div>
      </div>

      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">¿El menor se encuentra en situación de discapacidad?</label>
          <select class="form-select" formControlName="situacionDiscapacidad" (change)="onSituacionDiscapacidad()">
            <option [ngValue]="null">Seleccione una respuesta</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Tipo de discapacidad</label>
          <select class="form-select" formControlName="tipoDiscapacidad" [disabled]="form.get('situacionDiscapacidad')?.value!=='SI'">
            <option [ngValue]="null">Seleccione un tipo</option>
            @for (t of discapacidades(); track t.codigo) { <option [value]="t.codigo">{{ t.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">¿Pertenece a alguna comunidad étnica?</label>
          <select class="form-select" formControlName="perteneceComunidadEtnica" (change)="onPertenenciaEtnica()">
            <option [ngValue]="null">Seleccione una respuesta</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Tipo de población étnica</label>
          <select class="form-select" formControlName="tipoPoblacionEtnica" [disabled]="form.get('perteneceComunidadEtnica')?.value!=='SI'">
            <option [ngValue]="null">Seleccione un tipo</option>
            @for (e of etnias(); track e.codigo) { <option [value]="e.codigo">{{ e.descripcion }}</option> }
          </select>
        </div>
      </div>

      <hr />
      <h5>Información del otorgante de la autorización</h5>
      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Tipo de identificación</label>
          <select class="form-select" formControlName="tipoIdentificacionOtorgante">
            <option [ngValue]="null">Seleccione un tipo</option>
            @for (t of tiposIdentificaciones(); track t.codigo) { <option [value]="t.codigo">{{ t.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Número de identificación</label>
          <input class="form-control" formControlName="numeroIdentificacionOtorgante" placeholder="Ej: 1234567890" />
        </div>
        <div class="col-lg-4">
          <label class="form-label">Nombres y apellidos</label>
          <input class="form-control" formControlName="nombresApellidosOtorgante" placeholder="Ej: María Gómez" />
        </div>
      </div>

      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Correo electrónico</label>
          <input class="form-control" formControlName="correoElectronicoOtorgante" placeholder="Ej: correo@dominio.com" />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Teléfono</label>
          <input class="form-control" formControlName="numeroTelefonicoOtorgante" placeholder="Ej: 3001234567" />
        </div>
        <div class="col-lg-4">
          <label class="form-label">Dirección física</label>
          <input class="form-control" formControlName="direccionFisicaOtorgante" placeholder="Ej: Calle 123 #45-67" />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Sexo</label>
          <select class="form-select" formControlName="sexoOtorgante">
            <option [ngValue]="null">Seleccione una opción</option>
            @for (s of sexos(); track s.codigo) { <option [value]="s.codigo">{{ s.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Género</label>
          <select class="form-select" formControlName="generoOtorgante">
            <option [ngValue]="null">Seleccione una opción</option>
            @for (g of generos(); track g.codigo) { <option [value]="g.codigo">{{ g.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Calidad en que actúa</label>
          <select class="form-select" formControlName="calidadActua">
            <option [ngValue]="null">Seleccione una opción</option>
            @for (p of parentescos(); track p.codigo) { <option [value]="p.codigo">{{ p.descripcion }}</option> }
          </select>
        </div>
      </div>

      <hr />
      <h5>Información de la persona autorizada para viajar con el menor de edad</h5>
      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Tipo de identificación</label>
          <select class="form-select" formControlName="tipoIdentificacionAutorizadoViajar">
            <option [ngValue]="null">Seleccione un tipo</option>
            @for (t of tiposIdentificaciones(); track t.codigo) { <option [value]="t.codigo">{{ t.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Nombres y apellidos</label>
          <input class="form-control" formControlName="nombresApellidosAutorizadoViajar" placeholder="Ej: Pedro López" />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Número de identificación</label>
          <input class="form-control" formControlName="numeroIdentificacionAutorizadoViajar" placeholder="Ej: 987654321" />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Número telefónico</label>
          <input class="form-control" formControlName="numeroTelefonicoAutorizadoViajar" placeholder="Ej: 3117654321" />
        </div>
        <div class="col-lg-4">
          <label class="form-label">Dirección física</label>
          <input class="form-control" formControlName="direccionFisicaAutorizadoViajar" placeholder="Ej: Av. Siempre Viva 742" />
        </div>
      </div>

      <hr />
      <h5>Información de la persona autorizada para recoger al menor de edad</h5>
      <div class="row g-3">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Tipo de identificación</label>
          <select class="form-select" formControlName="tipoIdentificacionAutorizadoRecoger">
            <option [ngValue]="null">Seleccione un tipo</option>
            @for (t of tiposIdentificaciones(); track t.codigo) { <option [value]="t.codigo">{{ t.descripcion }}</option> }
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Nombres y apellidos</label>
          <input class="form-control" formControlName="nombresApellidosAutorizadoRecoger" placeholder="Ej: Laura Martínez" />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Número de identificación</label>
          <input class="form-control" formControlName="numeroIdentificacionAutorizadoRecoger" placeholder="Ej: 1122334455" />
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label">Número telefónico</label>
          <input class="form-control" formControlName="numeroTelefonicoAutorizadoRecoger" placeholder="Ej: 3209988776" />
        </div>
        <div class="col-lg-4">
          <label class="form-label">Dirección física</label>
          <input class="form-control" formControlName="direccionFisicaAutorizadoRecoger" placeholder="Ej: Cra. 10 #20-30" />
        </div>
      </div>

      <hr />
      <fieldset class="border rounded p-3">
        <legend class="float-none w-auto px-2 small text-muted mb-0">Documentación requerida</legend>
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label">Copia de la manifestación expresa de autorización del viaje</label>
            <input type="file" class="form-control" (change)="onFileChange($event, 1)" accept=".pdf" />
          </div>
          <div class="col-md-6 d-flex gap-2">
            @if (doc1Nombre()) {
              <span class="small text-muted">{{ doc1Nombre() }}</span>
              <button type="button" class="btn btn-sm btn-outline-secondary" (click)="descargar(1)" [disabled]="!puedeDescargar(1)"><i class="bi bi-download"></i></button>
            }
          </div>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label">Copia del documento que pruebe el parentesco</label>
            <input type="file" class="form-control" (change)="onFileChange($event, 2)" accept=".pdf" />
          </div>
          <div class="col-md-6 d-flex gap-2">
            @if (doc2Nombre()) {
              <span class="small text-muted">{{ doc2Nombre() }}</span>
              <button type="button" class="btn btn-sm btn-outline-secondary" (click)="descargar(2)" [disabled]="!puedeDescargar(2)"><i class="bi bi-download"></i></button>
            }
          </div>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label">Copia del documento de identidad del mayor de edad que se autoriza</label>
            <input type="file" class="form-control" (change)="onFileChange($event, 3)" accept=".pdf" />
          </div>
          <div class="col-md-6 d-flex gap-2">
            @if (doc3Nombre()) {
              <span class="small text-muted">{{ doc3Nombre() }}</span>
              <button type="button" class="btn btn-sm btn-outline-secondary" (click)="descargar(3)" [disabled]="!puedeDescargar(3)"><i class="bi bi-download"></i></button>
            }
          </div>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-md-6">
            <label class="form-label">Copia del documento de constancia de entrega del menor de edad</label>
            <input type="file" class="form-control" (change)="onFileChange($event, 4)" accept=".pdf" />
          </div>
          <div class="col-md-6 d-flex gap-2">
            @if (doc4Nombre()) {
              <span class="small text-muted">{{ doc4Nombre() }}</span>
              <button type="button" class="btn btn-sm btn-outline-secondary" (click)="descargar(4)" [disabled]="!puedeDescargar(4)"><i class="bi bi-download"></i></button>
            }
          </div>
        </div>
        <small class="text-muted">Solo PDF. Máx 4 MB.</small>
      </fieldset>

      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-outline-secondary" (click)="cancel.emit()" [disabled]="saving()">Cancelar</button>
  <button type="submit" class="btn btn-primary" [disabled]="saving() || form.invalid">{{ context().editar ? 'Actualizar' : 'Guardar' }}</button>
      </div>
    </form>
  `,
})
export class AutorizacionesFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AutorizacionesService);
  private readonly parametricas = inject(ParametricasService);

  context = input.required<AutorizacionFormContext>();
  saving = input<boolean>(false);
  submit = output<SubmitEvent>();
  cancel = output<void>();

  minDate = new Date().toISOString().split('T')[0];

  form: FormGroup = this.fb.group({
    fechaViaje: new FormControl<string | null>(null, { nonNullable: false, validators: [Validators.required] }),
    // Cascadas de ubicación (departamento/municipio son auxiliares de UI)
  departamentoOrigen: [null],
  municipioOrigen: [null],
  origen: [null, Validators.required],
  departamentoDestino: [null],
  municipioDestino: [null],
  destino: [null, Validators.required],

  tipoIdentificacionNna: [null, Validators.required],
    numeroIdentificacionNna: ['', [Validators.required, Validators.pattern(/^[0-9]{5,14}$/)]],
    nombresApellidosNna: ['', [Validators.required, Validators.minLength(3)]],
  situacionDiscapacidad: [null],
  tipoDiscapacidad: [null],
  perteneceComunidadEtnica: [null],
  tipoPoblacionEtnica: [null],

  tipoIdentificacionOtorgante: [null, Validators.required],
    numeroIdentificacionOtorgante: ['', [Validators.required, Validators.pattern(/^[0-9]{5,14}$/)]],
    nombresApellidosOtorgante: ['', [Validators.required, Validators.minLength(3)]],
    numeroTelefonicoOtorgante: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
    correoElectronicoOtorgante: ['', [Validators.required, Validators.email]],
    direccionFisicaOtorgante: ['', Validators.required],
  sexoOtorgante: [null],
  generoOtorgante: [null],
  calidadActua: [null],

  tipoIdentificacionAutorizadoViajar: [null, Validators.required],
    numeroIdentificacionAutorizadoViajar: ['', [Validators.required, Validators.pattern(/^[0-9]{5,14}$/)]],
    nombresApellidosAutorizadoViajar: ['', [Validators.required, Validators.minLength(3)]],
    numeroTelefonicoAutorizadoViajar: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
    direccionFisicaAutorizadoViajar: ['', Validators.required],

  tipoIdentificacionAutorizadoRecoger: [null, Validators.required],
    numeroIdentificacionAutorizadoRecoger: ['', [Validators.required, Validators.pattern(/^[0-9]{5,14}$/)]],
    nombresApellidosAutorizadoRecoger: ['', [Validators.required, Validators.minLength(3)]],
    numeroTelefonicoAutorizadoRecoger: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
    direccionFisicaAutorizadoRecoger: ['', Validators.required],

    // opcionales (se llenan al subir archivos)
    copiaAutorizacionViajeNombreOriginal: [''],
    copiaAutorizacionViajeDocumento: [''],
    copiaAutorizacionViajeRuta: [''],
    copiaDocumentoParentescoNombreOriginal: [''],
    copiaDocumentoParentescoDocumento: [''],
    copiaDocumentoParentescoRuta: [''],
    copiaDocumentoIdentidadAutorizadoNombreOriginal: [''],
    copiaDocumentoIdentidadAutorizadoDocumento: [''],
    copiaDocumentoIdentidadAutorizadoRuta: [''],
    copiaConstanciaEntregaNombreOriginal: [''],
    copiaConstanciaEntregaDocumento: [''],
    copiaConstanciaEntregaRuta: [''],
  });

  // Document display signals
  doc1Nombre = signal<string>('');
  doc2Nombre = signal<string>('');
  doc3Nombre = signal<string>('');
  doc4Nombre = signal<string>('');

  // Paramétricas
  departamentos = signal<any[]>([]);
  municipiosOrigen = signal<any[]>([]);
  municipiosDestino = signal<any[]>([]);
  ubicacionesOrigen = signal<any[]>([]);
  ubicacionesDestino = signal<any[]>([]);
  tiposIdentificaciones = signal<any[]>([]);
  tiposIdentificacionesNna = signal<any[]>([]);
  discapacidades = signal<any[]>([]);
  etnias = signal<any[]>([]);
  sexos = signal<any[]>([]);
  generos = signal<any[]>([]);
  parentescos = signal<any[]>([]);

  constructor() {
    effect(() => {
      const ctx = this.context();
      if (!ctx) return;

      if (ctx.editar && ctx.mantenimientoId != null) {
        this.service.visualizar(ctx.mantenimientoId).pipe(takeUntilDestroyed()).subscribe((res) => {
          const fecha = res.fechaViaje ? new Date(res.fechaViaje).toISOString().split('T')[0] : null;
          this.form.patchValue({ ...res, fechaViaje: fecha });
          this.doc1Nombre.set(res.copiaAutorizacionViajeNombreOriginal || '');
          this.doc2Nombre.set(res.copiaDocumentoParentescoNombreOriginal || '');
          this.doc3Nombre.set(res.copiaDocumentoIdentidadAutorizadoNombreOriginal || '');
          this.doc4Nombre.set(res.copiaConstanciaEntregaNombreOriginal || '');
          // Cargar combos por código (cuando viene editando)
          if (res.origen) this.listarUbicacionesPorCodigo(String(res.origen), 'origen');
          if (res.destino) this.listarUbicacionesPorCodigo(String(res.destino), 'destino');
        });
      } else {
        this.form.reset();
        // limpiar documentos
        this.doc1Nombre.set('');
        this.doc2Nombre.set('');
        this.doc3Nombre.set('');
        this.doc4Nombre.set('');
      }
    });

    // Cargar paramétricas base
    this.cargarParametricas();

    // Estado inicial: deshabilitar cascadas hasta escoger padre
    this.form.get('municipioOrigen')?.disable({ emitEvent: false });
    this.form.get('origen')?.disable({ emitEvent: false });
    this.form.get('municipioDestino')?.disable({ emitEvent: false });
    this.form.get('destino')?.disable({ emitEvent: false });
    // Discapacidad / Etnia inicialmente inactivos hasta responder "Sí"
    if (this.form.get('situacionDiscapacidad')?.value !== 'SI') {
      this.form.get('tipoDiscapacidad')?.disable({ emitEvent: false });
    }
    if (this.form.get('perteneceComunidadEtnica')?.value !== 'SI') {
      this.form.get('tipoPoblacionEtnica')?.disable({ emitEvent: false });
    }

    // Reactivar/desactivar según selección de departamento/municipio
    this.form.get('departamentoOrigen')?.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      const has = !!v;
      const mun = this.form.get('municipioOrigen');
      const cp = this.form.get('origen');
      if (!mun || !cp) return;
      if (has) {
        mun.enable({ emitEvent: false });
      } else {
        mun.disable({ emitEvent: false });
        mun.setValue(null, { emitEvent: false });
        cp.disable({ emitEvent: false });
        cp.setValue(null, { emitEvent: false });
        this.municipiosOrigen.set([]);
        this.ubicacionesOrigen.set([]);
      }
    });
    this.form.get('municipioOrigen')?.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      const cp = this.form.get('origen');
      if (!cp) return;
      if (v) {
        cp.enable({ emitEvent: false });
      } else {
        cp.disable({ emitEvent: false });
        cp.setValue(null, { emitEvent: false });
        this.ubicacionesOrigen.set([]);
      }
    });

    this.form.get('departamentoDestino')?.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      const has = !!v;
      const mun = this.form.get('municipioDestino');
      const cp = this.form.get('destino');
      if (!mun || !cp) return;
      if (has) {
        mun.enable({ emitEvent: false });
      } else {
        mun.disable({ emitEvent: false });
        mun.setValue(null, { emitEvent: false });
        cp.disable({ emitEvent: false });
        cp.setValue(null, { emitEvent: false });
        this.municipiosDestino.set([]);
        this.ubicacionesDestino.set([]);
      }
    });
    this.form.get('municipioDestino')?.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      const cp = this.form.get('destino');
      if (!cp) return;
      if (v) {
        cp.enable({ emitEvent: false });
      } else {
        cp.disable({ emitEvent: false });
        cp.setValue(null, { emitEvent: false });
        this.ubicacionesDestino.set([]);
      }
    });
  }

  puedeDescargar(tipo: number): boolean {
    const m = new Map<number, [string, string, string]>([
      [1, ['copiaAutorizacionViajeDocumento', 'copiaAutorizacionViajeRuta', 'copiaAutorizacionViajeNombreOriginal']],
      [2, ['copiaDocumentoParentescoDocumento', 'copiaDocumentoParentescoRuta', 'copiaDocumentoParentescoNombreOriginal']],
      [3, ['copiaDocumentoIdentidadAutorizadoDocumento', 'copiaDocumentoIdentidadAutorizadoRuta', 'copiaDocumentoIdentidadAutorizadoNombreOriginal']],
      [4, ['copiaConstanciaEntregaDocumento', 'copiaConstanciaEntregaRuta', 'copiaConstanciaEntregaNombreOriginal']],
    ]);
    const [doc, ruta, nombre] = m.get(tipo)!;
    const v = this.form.value as any;
    return Boolean(v[doc] && v[ruta] && v[nombre]);
  }

  descargar(tipo: number) {
    const get = (k: string) => (this.form.value as any)[k] as string;
    if (tipo === 1) this.service.descargarArchivo(get('copiaAutorizacionViajeDocumento'), get('copiaAutorizacionViajeRuta'), get('copiaAutorizacionViajeNombreOriginal'));
    if (tipo === 2) this.service.descargarArchivo(get('copiaDocumentoParentescoDocumento'), get('copiaDocumentoParentescoRuta'), get('copiaDocumentoParentescoNombreOriginal'));
    if (tipo === 3) this.service.descargarArchivo(get('copiaDocumentoIdentidadAutorizadoDocumento'), get('copiaDocumentoIdentidadAutorizadoRuta'), get('copiaDocumentoIdentidadAutorizadoNombreOriginal'));
    if (tipo === 4) this.service.descargarArchivo(get('copiaConstanciaEntregaDocumento'), get('copiaConstanciaEntregaRuta'), get('copiaConstanciaEntregaNombreOriginal'));
  }

  async onFileChange(event: Event, tipo: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    // Validaciones básicas
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      input.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('El archivo supera 4 MB.');
      input.value = '';
      return;
    }

    const ctx = this.context();
    if (!ctx) return;
    const res = await this.service.subirArchivo(file, ctx.vigiladoId).toPromise();
    if (!res) return;

    const patch: any = {};
    if (tipo === 1) {
      patch.copiaAutorizacionViajeNombreOriginal = res.nombreOriginalArchivo;
      patch.copiaAutorizacionViajeDocumento = res.nombreAlmacenado;
      patch.copiaAutorizacionViajeRuta = res.ruta;
      this.doc1Nombre.set(res.nombreOriginalArchivo);
    }
    if (tipo === 2) {
      patch.copiaDocumentoParentescoNombreOriginal = res.nombreOriginalArchivo;
      patch.copiaDocumentoParentescoDocumento = res.nombreAlmacenado;
      patch.copiaDocumentoParentescoRuta = res.ruta;
      this.doc2Nombre.set(res.nombreOriginalArchivo);
    }
    if (tipo === 3) {
      patch.copiaDocumentoIdentidadAutorizadoNombreOriginal = res.nombreOriginalArchivo;
      patch.copiaDocumentoIdentidadAutorizadoDocumento = res.nombreAlmacenado;
      patch.copiaDocumentoIdentidadAutorizadoRuta = res.ruta;
      this.doc3Nombre.set(res.nombreOriginalArchivo);
    }
    if (tipo === 4) {
      patch.copiaConstanciaEntregaNombreOriginal = res.nombreOriginalArchivo;
      patch.copiaConstanciaEntregaDocumento = res.nombreAlmacenado;
      patch.copiaConstanciaEntregaRuta = res.ruta;
      this.doc4Nombre.set(res.nombreOriginalArchivo);
    }
    this.form.patchValue(patch);
  }

  onSubmit() {
    const ctx = this.context();
    if (!ctx) return;

    // Reglas: en creación, los 4 docs son obligatorios
    if (!ctx.editar) {
      const v = this.form.value as any;
      const requiredDocs = [
        'copiaAutorizacionViajeDocumento',
        'copiaDocumentoParentescoDocumento',
        'copiaDocumentoIdentidadAutorizadoDocumento',
        'copiaConstanciaEntregaDocumento',
      ];
      const falta = requiredDocs.some((k) => !v[k]);
      if (falta) {
        alert('Debes cargar los 4 documentos requeridos.');
        return;
      }
    }

    if (this.form.invalid) return;

    // Ajustes según reglas del legado
    const sd = this.form.get('situacionDiscapacidad')?.value as string | undefined;
    const pc = this.form.get('perteneceComunidadEtnica')?.value as string | undefined;
  if (sd === 'NO') this.form.patchValue({ tipoDiscapacidad: '9' });
  if (pc === 'NO') this.form.patchValue({ tipoPoblacionEtnica: '7' });
    if (this.form.get('generoOtorgante')?.value === '') this.form.patchValue({ generoOtorgante: null });

    const payload: AutorizacionFormulario = this.form.getRawValue();
    this.submit.emit({ form: payload, mantenimientoId: ctx.mantenimientoId });
  }

  // ----- Paramétricas y cascadas
  private cargarParametricas() {
    this.parametricas.obtenerParametrica<any[]>('listar-departamentos').subscribe((r) => this.departamentos.set(r ?? []));
    this.parametricas.obtenerParametrica<any[]>('listar-tipo-identificaciones').subscribe((r) => {
      const lista = r ?? [];
      this.tiposIdentificaciones.set(lista);
      // Excluir 1,2,4 para NNA como en legado
      const excl = new Set([1, 2, 4].map(String));
      this.tiposIdentificacionesNna.set(lista.filter((x: any) => !excl.has(String(x.codigo))));
    });
    this.parametricas.obtenerParametrica<any[]>('listar-tipo-discapacidades').subscribe((r) => this.discapacidades.set(r ?? []));
    this.parametricas.obtenerParametrica<any[]>('listar-tipo-poblaciones-etnicas').subscribe((r) => this.etnias.set(r ?? []));
    this.parametricas.obtenerParametrica<any[]>('listar-tipo-sexos').subscribe((r) => this.sexos.set(r ?? []));
    this.parametricas.obtenerParametrica<any[]>('listar-tipo-generos').subscribe((r) => this.generos.set(r ?? []));
    this.parametricas.obtenerParametrica<any[]>('listar-tipo-parentescos').subscribe((r) => this.parentescos.set(r ?? []));
  }

  onDepartamentoChange(tipo: 'origen' | 'destino') {
    const dep = this.form.get(tipo === 'origen' ? 'departamentoOrigen' : 'departamentoDestino')?.value;
    if (!dep) {
      if (tipo === 'origen') { this.municipiosOrigen.set([]); this.ubicacionesOrigen.set([]); this.form.patchValue({ municipioOrigen: null, origen: null }); }
      else { this.municipiosDestino.set([]); this.ubicacionesDestino.set([]); this.form.patchValue({ municipioDestino: null, destino: null }); }
      return;
    }
    this.parametricas.obtenerParametrica<any[]>(`listar-municipios?codigoDepartamento=${dep}`).subscribe((r) => {
      if (tipo === 'origen') { this.municipiosOrigen.set(r ?? []); this.ubicacionesOrigen.set([]); this.form.patchValue({ municipioOrigen: null, origen: null }); }
      else { this.municipiosDestino.set(r ?? []); this.ubicacionesDestino.set([]); this.form.patchValue({ municipioDestino: null, destino: null }); }
    });
  }

  onMunicipioChange(tipo: 'origen' | 'destino') {
    const mun = this.form.get(tipo === 'origen' ? 'municipioOrigen' : 'municipioDestino')?.value;
    if (!mun) {
      if (tipo === 'origen') { this.ubicacionesOrigen.set([]); this.form.patchValue({ origen: null }); }
      else { this.ubicacionesDestino.set([]); this.form.patchValue({ destino: null }); }
      return;
    }
    this.parametricas.obtenerParametrica<any[]>(`listar-centros-poblados?codigoMunicipio=${mun}`).subscribe((r) => {
      if (tipo === 'origen') this.ubicacionesOrigen.set(r ?? []);
      else this.ubicacionesDestino.set(r ?? []);
    });
  }

  private listarUbicacionesPorCodigo(codigo: string, tipo: 'origen' | 'destino') {
    this.parametricas.obtenerParametrica<any[]>(`listar-centros-poblados?codigo=${codigo}`).subscribe((r) => {
      if (tipo === 'origen') this.ubicacionesOrigen.set(r ?? []);
      else this.ubicacionesDestino.set(r ?? []);
    });
  }

  onSituacionDiscapacidad() {
    const v = this.form.get('situacionDiscapacidad')?.value as string | undefined;
    const tipoCtrl = this.form.get('tipoDiscapacidad');
    if (!tipoCtrl) return;
    if (v === 'SI') {
      tipoCtrl.enable({ emitEvent: false });
    } else if (v === 'NO') {
      // Regla legacy cuando es NO
      this.form.patchValue({ tipoDiscapacidad: '9' });
      tipoCtrl.disable({ emitEvent: false });
    } else {
      // Si queda en null (Seleccione una respuesta), limpiar y deshabilitar
      this.form.patchValue({ tipoDiscapacidad: null });
      tipoCtrl.disable({ emitEvent: false });
    }
  }

  onPertenenciaEtnica() {
    const v = this.form.get('perteneceComunidadEtnica')?.value as string | undefined;
    const tipoCtrl = this.form.get('tipoPoblacionEtnica');
    if (!tipoCtrl) return;
    if (v === 'SI') {
      tipoCtrl.enable({ emitEvent: false });
    } else if (v === 'NO') {
      // Regla legacy cuando es NO
      this.form.patchValue({ tipoPoblacionEtnica: '7' });
      tipoCtrl.disable({ emitEvent: false });
    } else {
      // Si queda en null, limpiar y deshabilitar
      this.form.patchValue({ tipoPoblacionEtnica: null });
      tipoCtrl.disable({ emitEvent: false });
    }
  }
}
