import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-conductores-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="row g-3">
        <div class="col-6 col-md-3">
          <label class="form-label">Tipo ID (principal)</label>
          <input type="number" class="form-control" formControlName="tipoIdentificacionPrincipal" />
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label">Número ID</label>
          <input class="form-control" formControlName="numeroIdentificacion" />
        </div>
        <div class="col-6 col-md-3"><label class="form-label">Primer nombre</label><input class="form-control" formControlName="primerNombrePrincipal" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Segundo nombre</label><input class="form-control" formControlName="segundoNombrePrincipal" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Primer apellido</label><input class="form-control" formControlName="primerApellidoPrincipal" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Segundo apellido</label><input class="form-control" formControlName="segundoApellidoPrincipal" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Alcoholimetría</label><input class="form-control" formControlName="idPruebaAlcoholimetria" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Examen médico</label><input class="form-control" formControlName="idExamenMedico" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Licencia</label><input class="form-control" formControlName="licenciaConduccion" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vence licencia</label><input type="date" class="form-control" formControlName="fechaVencimientoLicencia" /></div>
      </div>

      <hr />
      <div class="row g-3">
        <div class="col-12"><strong>Conductor secundario (opcional)</strong></div>
        <div class="col-6 col-md-3"><label class="form-label">Tipo ID (secundario)</label><input type="number" class="form-control" formControlName="tipoIdentificacionSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Número ID</label><input class="form-control" formControlName="numeroIdentificacionSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Primer nombre</label><input class="form-control" formControlName="primerNombreSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Segundo nombre</label><input class="form-control" formControlName="segundoNombreSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Primer apellido</label><input class="form-control" formControlName="primerApellidoSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Segundo apellido</label><input class="form-control" formControlName="segundoApellidoSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Alcoholimetría</label><input class="form-control" formControlName="idPruebaAlcoholimetriaSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Examen médico</label><input class="form-control" formControlName="idExamenMedicoSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Licencia</label><input class="form-control" formControlName="licenciaConduccionSecundario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vence licencia</label><input type="date" class="form-control" formControlName="fechaVencimientoLicenciaSecundario" /></div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-2">
        <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
        <button class="btn-brand" type="submit" [disabled]="form.invalid || saving()">@if (!saving()) { Guardar } @else { Guardando... }</button>
      </div>
    </form>
  `,
})
export class ConductoresFormComponent {
  idDespacho = input.required<number>();
  saving = input<boolean>(false);
  cancel = output<void>();
  submit = output<any>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    tipoIdentificacionPrincipal: [null as number | null, Validators.required],
    numeroIdentificacion: ['', Validators.required],
    primerNombrePrincipal: ['', Validators.required],
    segundoNombrePrincipal: [''],
    primerApellidoPrincipal: ['', Validators.required],
    segundoApellidoPrincipal: [''],
    idPruebaAlcoholimetria: [''],
    idExamenMedico: [''],
    licenciaConduccion: [''],
    fechaVencimientoLicencia: [''],

    tipoIdentificacionSecundario: [null as number | null],
    numeroIdentificacionSecundario: [''],
    primerNombreSecundario: [''],
    segundoNombreSecundario: [''],
    primerApellidoSecundario: [''],
    segundoApellidoSecundario: [''],
    idPruebaAlcoholimetriaSecundario: [''],
    idExamenMedicoSecundario: [''],
    licenciaConduccionSecundario: [''],
    fechaVencimientoLicenciaSecundario: [''],
  });

  onSubmit() {
    if (this.form.invalid) return;
    const payload = { idDespacho: this.idDespacho(), ...this.form.getRawValue() };
    this.submit.emit(payload);
  }
}
