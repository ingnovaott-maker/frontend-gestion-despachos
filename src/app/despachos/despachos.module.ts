import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
/* import { SalidasComponent } from './components/salidas/salidas.component';
import { NovedadesComponent } from './components/novedades/novedades.component';
import { LlegadasComponent } from './components/llegadas/llegadas.component';
import { InputsModule } from '../inputs/inputs.module'; */
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
/* import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgxCaptchaModule } from 'ngx-captcha';
import { NgxPaginationModule } from 'ngx-pagination';
import { AlertasModule } from '../alertas/alertas.module';
import { TemplatesModule } from '../templates/templates.module';
import { ModalRegistroSalidasComponent } from './components/salidas/modal-registro-salidas/modal-registro-salidas.component';
import { ModalContinuarRegistroSalidaComponent } from './components/salidas/modal-continuar-registro-salida/modal-continuar-registro-salida.component';
import { FormularioConductoresComponent } from './components/salidas/formulario-conductores/formulario-conductores.component';
import { FormularioVehiculosComponent } from './components/salidas/formulario-vehiculos/formulario-vehiculos.component';
import { FormularioRutasComponent } from './components/salidas/formulario-rutas/formulario-rutas.component';
import { FormularioAutorizacionesComponent } from './components/salidas/formulario-autorizaciones/formulario-autorizaciones.component';
import { FormularioNuevoConductorComponent } from './components/novedades/formulario-nuevo-conductor/formulario-nuevo-conductor.component';
import { FormularioNuevoVehiculoComponent } from './components/novedades/formulario-nuevo-vehiculo/formulario-nuevo-vehiculo.component';
import { ListadoNovedadesComponent } from './components/novedades/listado-novedades/listado-novedades.component';
import { RegistroLlegadasComponent } from './components/llegadas/registro-llegadas/registro-llegadas.component';
import { FormularioLlegadaVehiculoComponent } from './components/llegadas/formulario-llegada-vehiculo/formulario-llegada-vehiculo.component';
import { FormularioLlegadaConductoresComponent } from './components/llegadas/formulario-llegada-conductores/formulario-llegada-conductores.component'; */




@NgModule({
  declarations: [
    /* SalidasComponent,
    NovedadesComponent,
    LlegadasComponent,
    ModalRegistroSalidasComponent,
    ModalContinuarRegistroSalidaComponent,
    FormularioConductoresComponent,
    FormularioVehiculosComponent,
    FormularioRutasComponent,
    FormularioAutorizacionesComponent,
    FormularioNuevoConductorComponent,
    FormularioNuevoVehiculoComponent,
    ListadoNovedadesComponent,
    RegistroLlegadasComponent,
    FormularioLlegadaVehiculoComponent,
    FormularioLlegadaConductoresComponent, */
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    RouterModule,
  ]
})
export class DespachosModule { }
