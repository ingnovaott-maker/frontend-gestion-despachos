import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-salidas-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label">NIT empresa</label>
          <input class="form-control" formControlName="nitEmpresaTransporte" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Razón social</label>
          <input class="form-control" formControlName="razonSocial" />
        </div>
        <!-- <div class="col-6 col-md-3">
          <label class="form-label">Tipo despacho</label>
          <input type="number" class="form-control" formControlName="tipoDespacho" />
        </div> -->
        <div class="col-6 col-md-3">
          <label class="form-label">Pasajeros</label>
          <input type="number" class="form-control" formControlName="numeroPasajero" />
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label">Fecha salida</label>
          <input type="date" class="form-control" formControlName="fechaSalida" />
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label">Hora salida</label>
          <input type="time" class="form-control" formControlName="horaSalida" />
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label">Valor tiquete</label>
          <input class="form-control" formControlName="valorTiquete" />
        </div>
      </div>
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <label class="form-label">Valor total tasa uso</label>
          <input class="form-control" formControlName="valorTotalTasaUso" />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" formControlName="observaciones"></textarea>
        </div>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
        <button class="btn-brand" type="submit" [disabled]="form.invalid || saving()">
          @if (!saving()) { Guardar salida } @else { Guardando... }
        </button>
      </div>
    </form>
  `,
})
export class SalidasFormComponent {
  saving = input<boolean>(false);
  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    nitEmpresaTransporte: ['', [Validators.required]],
    razonSocial: ['', [Validators.required]],
    tipoDespacho: [1, [Validators.required]],
    numeroPasajero: [0, [Validators.required, Validators.min(0)]],
    fechaSalida: ['', [Validators.required]],
    horaSalida: ['', [Validators.required]],
    valorTiquete: [''],
    valorTotalTasaUso: [''],
    observaciones: [''],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.submit.emit(this.form.getRawValue());
  }
}
