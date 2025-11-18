import { Injectable, inject } from '@angular/core';
import { DespachosService } from '../../despachos/services/despachos.service';
import { RegistrarAutorizaciones, RegistrarConductores, RegistrarRutas, RegistrarVehiculos } from '../../despachos/models/Salidas';
import { Novedad } from '../../despachos/models/Novedades';

@Injectable({ providedIn: 'root' })
export class SalidasRegistroService {
  private readonly despachos = inject(DespachosService);

  guardarRutas(payload: RegistrarRutas) {
    return this.despachos.guardarRutas(payload);
  }
  guardarConductores(payload: RegistrarConductores) {
    return this.despachos.guardarConductores(payload);
  }
  guardarVehiculo(payload: RegistrarVehiculos) {
    return this.despachos.guardarVehiculo(payload);
  }
  cargarAutorizaciones(payload: RegistrarAutorizaciones) {
    return this.despachos.cargarAutorizaciones(payload);
  }

  obtenerNivelesServicio() {
    return this.despachos.obtenerNivelesServicio();
  }
  obtenerRutas(nit: string) {
    return this.despachos.obtenerRutas(nit);
  }
  consultarAutorizaciones(p: { nit: string; placa: string; fecha: string; }) {
    return this.despachos.consultarAutorizaciones(p);
  }

  // Novedades
  crearNovedad(payload: Novedad) {
    return this.despachos.crearNovedad(payload);
  }
  crearNovedadVehiculo(payload: any) {
    return this.despachos.crearVehículoNovedad(payload);
  }
  crearNovedadConductor(payload: any) {
    return this.despachos.crearConductorNovedad(payload);
  }
  consultarIntegradora(p: { numeroIdentificacion1: string; numeroIdentificacion2?: string; placa: string; nit: string; fechaConsulta: string; }) {
    const req = { ...p, numeroIdentificacion2: p.numeroIdentificacion2 ?? p.numeroIdentificacion1 };
    return this.despachos.consultaApiIntegradora(req as any);
  }
  obtenerSalida(id: number) {
    return this.despachos.obtenerSalida(id);
  }
}
