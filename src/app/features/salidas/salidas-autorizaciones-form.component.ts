import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-salidas-autorizaciones-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="row g-3">
        <div class="col-12"><strong>Autorizaciones</strong></div>
        <div class="col-12">
          @for (ctrl of autorizaciones.controls; track $index) {
            <div class="d-flex gap-2 align-items-start mb-2">
              <input class="form-control" [formControl]="ctrl" placeholder="Código autorización" />
              <button type="button" class="btn btn-outline-danger" (click)="remove($index)">Eliminar</button>
            </div>
          }
          <button class="btn btn-outline-primary mt-1" type="button" (click)="add()">Agregar autorización</button>
        </div>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-2">
        <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
        <button class="btn-brand" type="submit" [disabled]="form.invalid || saving()">@if (!saving()) { Guardar } @else { Guardando... }</button>
      </div>
    </form>
  `,
})
export class SalidasAutorizacionesFormComponent {
  idDespacho = input.required<number>();
  saving = input<boolean>(false);
  cancel = output<void>();
  submit = output<any>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    autorizacion: new FormArray<FormControl<string>>([
      this.fb.nonNullable.control('', Validators.required)
    ])
  });
  get autorizaciones(): FormArray<FormControl<string>> { return this.form.controls.autorizacion as FormArray<FormControl<string>>; }

  add() { this.autorizaciones.push(this.fb.nonNullable.control('', Validators.required)); }
  remove(i: number) { if (this.autorizaciones.length > 1) this.autorizaciones.removeAt(i); }

  onSubmit() {
    if (this.form.invalid) return;
    const payload = { idDespacho: this.idDespacho(), ...this.form.getRawValue() };
    this.submit.emit(payload);
  }
}
