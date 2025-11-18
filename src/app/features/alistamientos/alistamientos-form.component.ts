import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoIdentificacion } from '../../parametricas/modelos/tipo-identificacion';
import { DetallesActividades, ProtocoloAlistamiento } from '../../mantenimientos/modelos/RegistroProtocoloAlistamiento';

export interface AlistamientoFormContext {
  placa: string;
  modo: 'create' | 'edit';
  initial?: ProtocoloAlistamiento | null;
}

export interface SubmitEvent {
  protocolo: ProtocoloAlistamiento;
  modo: 'create' | 'edit';
}

@Component({
  selector: 'app-alistamientos-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" (ngSubmit)="onSubmit()" [formGroup]="form">
      <section class="d-grid gap-2">
        <label class="form-label fw-semibold mb-0">Responsable</label>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label fw-semibold" for="responsable-tipo-id">Tipo de identificación</label>
            <select id="responsable-tipo-id" class="form-select" formControlName="tipoIdentificacionResponsable" required>
              <option value="" disabled>Seleccione</option>
              @for (tipo of tiposIdentificacion(); track tipo.id) {
                <option [value]="tipo.id">{{ tipo.nombre }}</option>
              }
            </select>
            @if (controlInvalid(tipoIdentificacionResponsable)) {
              <p class="text-danger small mb-0">Seleccione el tipo de identificación.</p>
            }
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold" for="responsable-numero-id">Número de identificación</label>
            <input id="responsable-numero-id" type="text" class="form-control" formControlName="numeroIdentificacionResponsable" autocomplete="off" (input)="onNumeroIdentificacionResponsableInput($event)" />
            @if (controlInvalid(numeroIdentificacionResponsable)) {
              <p class="text-danger small mb-0">
                @if (numeroIdentificacionResponsable.errors?.['required']) { Requerido. }
                @if (numeroIdentificacionResponsable.errors?.['pattern']) { Sólo letras y números. }
                @if (numeroIdentificacionResponsable.errors?.['maxlength']) { Máximo 15 caracteres. }
              </p>
            }
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold" for="responsable-nombres">Nombres y apellidos</label>
            <input id="responsable-nombres" type="text" class="form-control" formControlName="nombreResponsable" autocomplete="off" />
            @if (controlInvalid(nombreResponsable)) {
              <p class="text-danger small mb-0">Ingrese los nombres completos.</p>
            }
          </div>
        </div>
      </section>

      <section class="d-grid gap-2">
        <label class="form-label fw-semibold mb-0">Conductor</label>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label fw-semibold" for="conductor-tipo-id">Tipo de identificación</label>
            <select id="conductor-tipo-id" class="form-select" formControlName="tipoIdentificacionConductor" required>
              <option value="" disabled>Seleccione</option>
              @for (tipo of tiposIdentificacion(); track tipo.id) {
                <option [value]="tipo.id">{{ tipo.nombre }}</option>
              }
            </select>
            @if (controlInvalid(tipoIdentificacionConductor)) {
              <p class="text-danger small mb-0">Seleccione el tipo de identificación.</p>
            }
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold" for="conductor-numero-id">Número de identificación</label>
            <input id="conductor-numero-id" type="text" class="form-control" formControlName="numeroIdentificacionConductor" autocomplete="off" (input)="onNumeroIdentificacionConductorInput($event)" />
            @if (controlInvalid(numeroIdentificacionConductor)) {
              <p class="text-danger small mb-0">
                @if (numeroIdentificacionConductor.errors?.['required']) { Requerido. }
                @if (numeroIdentificacionConductor.errors?.['pattern']) { Sólo letras y números. }
                @if (numeroIdentificacionConductor.errors?.['maxlength']) { Máximo 15 caracteres. }
              </p>
            }
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold" for="conductor-nombres">Nombres y apellidos</label>
            <input id="conductor-nombres" type="text" class="form-control" formControlName="nombreConductor" autocomplete="off" />
            @if (controlInvalid(nombreConductor)) {
              <p class="text-danger small mb-0">Ingrese los nombres completos.</p>
            }
          </div>
        </div>
      </section>

      <section>
        <label class="form-label fw-semibold" for="observaciones">Observaciones</label>
        <textarea id="observaciones" rows="3" class="form-control" formControlName="detalleActividades" maxlength="500"></textarea>
        @if (controlInvalid(detalleActividades)) {
          <p class="text-danger small mb-0">La observación es obligatoria.</p>
        }
      </section>

      <div class="card border-1 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Actividades del protocolo</h6>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" [checked]="todosSeleccionados()" (change)="toggleTodos($event)" />
              <label class="form-check-label">Seleccionar todo</label>
            </div>
          </div>
          <div class="row g-2">
            @for (actividad of actividades(); track actividad.id) {
              <div class="col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" [id]="'actividad-' + actividad.id" [checked]="actividadSeleccionada(actividad.id)" (change)="toggleActividad(actividad.id, $event)" />
                  <label class="form-check-label" [for]="'actividad-' + actividad.id">{{ actividad.nombre }}</label>
                </div>
              </div>
            }
          </div>
          @if (actividadesInvalidas()) {
            <p class="text-danger small mb-0 mt-2">Selecciona al menos una actividad.</p>
          }
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-outline-secondary" type="button" (click)="cancel.emit()" [disabled]="saving()">Cancelar</button>
  <button class="btn-brand" type="submit" [disabled]="saving() || form.invalid || selectedActividades().size === 0">
          {{ saving() ? 'Guardando...' : (modo() === 'edit' ? 'Actualizar' : 'Guardar') }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlistamientosFormComponent {
  private readonly fb = inject(FormBuilder);

  context = input<AlistamientoFormContext | null>(null);
  tiposIdentificacion = input<readonly TipoIdentificacion[]>([]);
  actividades = input<readonly DetallesActividades[]>([]);
  saving = input<boolean>(false);

  submit = output<SubmitEvent>();
  cancel = output<void>();

  selectedActividades = signal<Set<number>>(new Set());

  form = this.fb.nonNullable.group({
    tipoIdentificacionResponsable: ['', Validators.required],
    numeroIdentificacionResponsable: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/), Validators.maxLength(15)]],
    nombreResponsable: ['', [Validators.required, Validators.maxLength(120)]],
    tipoIdentificacionConductor: ['', Validators.required],
    numeroIdentificacionConductor: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/), Validators.maxLength(15)]],
    nombreConductor: ['', [Validators.required, Validators.maxLength(120)]],
    detalleActividades: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly tipoIdentificacionResponsable = this.form.controls.tipoIdentificacionResponsable;
  readonly numeroIdentificacionResponsable = this.form.controls.numeroIdentificacionResponsable;
  readonly nombreResponsable = this.form.controls.nombreResponsable;
  readonly tipoIdentificacionConductor = this.form.controls.tipoIdentificacionConductor;
  readonly numeroIdentificacionConductor = this.form.controls.numeroIdentificacionConductor;
  readonly nombreConductor = this.form.controls.nombreConductor;
  readonly detalleActividades = this.form.controls.detalleActividades;

  modo = computed(() => this.context()?.modo ?? 'create');
  placa = computed(() => this.context()?.placa ?? '');

  private readonly contextWatcher = effect(() => {
    const ctx = this.context();
    if (!ctx) {
      this.form.reset();
      this.selectedActividades.set(new Set());
      return;
    }

    this.form.reset({
      tipoIdentificacionResponsable: ctx.initial?.tipoIdentificacion ?? '',
      numeroIdentificacionResponsable: ctx.initial?.numeroIdentificacion ? String(ctx.initial.numeroIdentificacion) : '',
      nombreResponsable: ctx.initial?.nombreResponsable ?? '',
      tipoIdentificacionConductor: ctx.initial?.tipoIdentificacionConductor ?? '',
      numeroIdentificacionConductor: ctx.initial?.numeroIdentificacionConductor ? String(ctx.initial.numeroIdentificacionConductor) : '',
      nombreConductor: ctx.initial?.nombreConductor ?? '',
      detalleActividades: ctx.initial?.detalleActividades ?? '',
    });

    const initialSelecion = new Set<number>();
    if (ctx.initial?.actividades) {
      for (const actividad of ctx.initial.actividades as Array<{ id?: number } | number>) {
        if (typeof actividad === 'number') {
          initialSelecion.add(Number(actividad));
        } else if (actividad?.id !== undefined) {
          initialSelecion.add(Number(actividad.id));
        }
      }
    }
    this.selectedActividades.set(initialSelecion);
  }, { allowSignalWrites: true });

  controlInvalid(control: FormControl<unknown>) {
    return control.invalid && control.touched;
  }

  actividadesInvalidas() {
    return this.form.touched && this.selectedActividades().size === 0;
  }

  actividadSeleccionada(id: number | undefined) {
    if (id === undefined) return false;
    return this.selectedActividades().has(Number(id));
  }

  toggleActividad(id: number | undefined, event: Event) {
    if (id === undefined) return;
    const checkbox = event.target as HTMLInputElement;
    const copia = new Set(this.selectedActividades());
    if (checkbox.checked) {
      copia.add(Number(id));
    } else {
      copia.delete(Number(id));
    }
    this.selectedActividades.set(copia);
    this.form.markAsTouched();
  }

  onNumeroIdentificacionResponsableInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const cleaned = (el.value || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 15);
    if (cleaned !== el.value) {
      el.value = cleaned;
      this.numeroIdentificacionResponsable.setValue(cleaned);
    }
  }

  onNumeroIdentificacionConductorInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const cleaned = (el.value || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 15);
    if (cleaned !== el.value) {
      el.value = cleaned;
      this.numeroIdentificacionConductor.setValue(cleaned);
    }
  }

  toggleTodos(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      const all = new Set<number>();
      for (const actividad of this.actividades()) {
        if (actividad?.id !== undefined) all.add(Number(actividad.id));
      }
      this.selectedActividades.set(all);
    } else {
      this.selectedActividades.set(new Set());
    }
    this.form.markAsTouched();
  }

  todosSeleccionados() {
    const actividades = this.actividades();
    if (!actividades.length) return false;
    return actividades.every((actividad) => actividad?.id !== undefined && this.selectedActividades().has(Number(actividad.id)));
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.selectedActividades().size === 0) {
      return;
    }

    const protocolo: ProtocoloAlistamiento = {
      placa: this.placa(),
      tipoIdentificacion: this.tipoIdentificacionResponsable.value,
      numeroIdentificacion: Number(this.numeroIdentificacionResponsable.value),
      nombreResponsable: this.nombreResponsable.value,
      tipoIdentificacionConductor: this.tipoIdentificacionConductor.value,
      numeroIdentificacionConductor: Number(this.numeroIdentificacionConductor.value),
      nombreConductor: this.nombreConductor.value,
      actividades: Array.from(this.selectedActividades()),
      detalleActividades: this.detalleActividades.value,
    };

    this.submit.emit({ protocolo, modo: this.modo() });
  }
}
