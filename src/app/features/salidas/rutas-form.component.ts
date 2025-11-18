import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-rutas-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <label class="form-label">Ruta autorizada</label>
          <input class="form-control" formControlName="idRutaAutorizada" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Origen</label>
          <input class="form-control" formControlName="idOrigen" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Detalle origen</label>
          <input class="form-control" formControlName="detalleOrigen" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Destino</label>
          <input class="form-control" formControlName="idDestino" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Detalle destino</label>
          <input class="form-control" formControlName="detalleDestino" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">Vía</label>
          <input class="form-control" formControlName="via" />
        </div>
        <div class="col-6 col-md-6">
          <label class="form-label">Centro poblado origen</label>
          <input class="form-control" formControlName="centroPobladoOrigen" />
        </div>
        <div class="col-6 col-md-6">
          <label class="form-label">Centro poblado destino</label>
          <input class="form-control" formControlName="centroPobladoDestino" />
        </div>
        <div class="col-12">
          <label class="form-label">Observaciones</label>
          <input class="form-control" formControlName="observaciones" />
        </div>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
        <button class="btn-brand" type="submit" [disabled]="form.invalid || saving()">@if (!saving()) { Guardar } @else { Guardando... }</button>
      </div>
    </form>
  `,
})
export class RutasFormComponent {
  idDespacho = input.required<number>();
  saving = input<boolean>(false);
  cancel = output<void>();
  submit = output<any>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    idRutaAutorizada: ['', Validators.required],
    idOrigen: ['', Validators.required],
    detalleOrigen: [''],
    idDestino: ['', Validators.required],
    detalleDestino: [''],
    via: [''],
    centroPobladoOrigen: [''],
    centroPobladoDestino: [''],
    observaciones: [''],
  });

  onSubmit() {
    if (this.form.invalid) return;
    const payload = { idDespacho: this.idDespacho(), ...this.form.getRawValue() };
    this.submit.emit(payload);
  }
}
