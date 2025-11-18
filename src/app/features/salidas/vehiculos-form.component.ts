import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-vehiculos-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form class="d-grid gap-3" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="row g-3">
        <div class="col-6 col-md-3"><label class="form-label">Placa</label><input class="form-control" formControlName="placa" /></div>
        <div class="col-6 col-md-3"><label class="form-label">SOAT</label><input class="form-control" formControlName="soat" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vence SOAT</label><input type="date" class="form-control" formControlName="fechaVencimientoSoat" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Rev. Tecno</label><input class="form-control" formControlName="revisionTecnicoMecanica" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vence Rev. Tecno</label><input type="date" class="form-control" formControlName="fechaRevisionTecnicoMecanica" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Póliza contractual</label><input class="form-control" formControlName="idPolizasContractual" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vigencia contractual</label><input class="form-control" formControlName="vigenciaContractual" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Póliza extra</label><input class="form-control" formControlName="idPolizasExtracontractual" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vigencia extra</label><input class="form-control" formControlName="vigenciaExtracontractual" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Tarjeta operación</label><input class="form-control" formControlName="tarjetaOperacion" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Vence tarjeta</label><input type="date" class="form-control" formControlName="fechaTarjetaOperacion" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Mantenimiento prev.</label><input class="form-control" formControlName="idMatenimientoPreventivo" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Fecha mant.</label><input type="date" class="form-control" formControlName="fechaMantenimiento" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Protocolo alistamiento</label><input class="form-control" formControlName="idProtocoloAlistamientodiario" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Fecha protocolo</label><input type="date" class="form-control" formControlName="fechaProtocoloAlistamientodiario" /></div>
        <div class="col-12"><label class="form-label">Observaciones</label><input class="form-control" formControlName="observaciones" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Clase</label><input type="number" class="form-control" formControlName="clase" /></div>
        <div class="col-6 col-md-3"><label class="form-label">Nivel servicio</label><input type="number" class="form-control" formControlName="nivelServicio" /></div>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-2">
        <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
        <button class="btn-brand" type="submit" [disabled]="form.invalid || saving()">@if (!saving()) { Guardar } @else { Guardando... }</button>
      </div>
    </form>
  `,
})
export class VehiculosFormComponent {
  idDespachos = input.required<number>();
  saving = input<boolean>(false);
  cancel = output<void>();
  submit = output<any>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    placa: ['', Validators.required],
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
    idMatenimientoPreventivo: [''],
    fechaMantenimiento: [''],
    idProtocoloAlistamientodiario: [''],
    fechaProtocoloAlistamientodiario: [''],
    observaciones: [''],
    clase: [null as number | null],
    nivelServicio: [null as number | null],
  });

  onSubmit() {
    if (this.form.invalid) return;
    const payload = { idDespachos: this.idDespachos(), ...this.form.getRawValue() };
    this.submit.emit(payload);
  }
}
