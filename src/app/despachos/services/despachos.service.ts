// ...existing code...
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Integradora, RegistrarAutorizaciones, RegistrarConductores, RegistrarRutas, RegistrarVehiculos, Salidas } from '../models/Salidas';
import { BaseApiService } from 'src/app/core/base-api.service';
import { AutenticacionService } from 'src/app/core/autenticacion.service';

@Injectable({
  providedIn: 'root'
})
export class DespachosService {
  private readonly api = inject(BaseApiService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly llaveTokenExternoLocalStorage = this.autenticacionService.llaveTokenExternoLocalStorage;
  private readonly host = environment.urlBackend;
  private readonly backendRutas = environment.urlBackend
  private readonly backendIntegradora = environment.urlApiIntegradora
  private tokenSinst: any = localStorage.getItem(this.llaveTokenExternoLocalStorage);

  constructor(private http: HttpClient) {
  }

  obtenerSalidas(nit?:any) {
    const endpoint = `/api/v1/despachos`;
    if (nit) {
      return this.api.get(`${this.host}${endpoint}?nit=${nit}`);
    }
    return this.api.get(`${this.host}${endpoint}`);
  }

  obtenerSalida(id: number) {
    const endpoint = `/api/v1/despachos/${id}`;
    return this.api.get(`${this.host}${endpoint}`);
  }

  obtenerTerminalesDespacho() {
    const endpoint = `/api/v1/maestras/terminales`;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer a6edc4af-4b84-4444-8c98-8afa14437cd1'
    });
    return this.http.get(`${this.backendRutas}${endpoint}`, { headers: headers });
  }

  guardarDespacho(salida: Salidas, id?: any) {
    let endpoint;
    const body = {
      // idDespachoTerminal: salida.idDespachoTerminal,
      // terminalDespacho: salida.terminalDespacho,
      nitEmpresaTransporte: salida.nitEmpresaTransporte,
      razonSocial: salida.razonSocial,
      tipoDespacho: salida.tipoDespacho,
      // sede: salida.sede,
      numeroPasajero: salida.numeroPasajero,
      fechaSalida: salida.fechaSalida,
      horaSalida: salida.horaSalida,
      valorTiquete: salida.valorTiquete,
      valorTotalTasaUso: salida.valorTotalTasaUso,
      observaciones: salida.observaciones,
    };
    if (id) {
      endpoint = `/api/v1/despachos?id=${id}`;
      return this.api.put(`${this.host}${endpoint}`, body);
    } else {
      endpoint = `/api/v1/despachos`
      return this.api.post(`${this.host}${endpoint}`, body);
    }
  }

  consultaApiIntegradora(consultaIntegradora: Integradora) {
    const endpoint = `?numeroIdentificacion1=${consultaIntegradora.numeroIdentificacion1}&numeroIdentificacion2=${consultaIntegradora.numeroIdentificacion2}&placa=${consultaIntegradora.placa}&nit=${consultaIntegradora.nit}&fechaConsulta=${consultaIntegradora.fechaConsulta}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.tokenSinst}`
    });
    return this.http.post(`${this.backendIntegradora}${endpoint}`, {}, { headers });
  }

  consultarAutorizaciones(consultarAutorizacion: any) {
    const endpoint = `/api/v1/maestras/autorizaciones?nit=${consultarAutorizacion.nit}&placa=${consultarAutorizacion.placa}&fecha=${consultarAutorizacion.fecha}`;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer a6edc4af-4b84-4444-8c98-8afa14437cd1'
    });
    return this.http.get(`${this.backendRutas}${endpoint}`, { headers: headers });
  }

  obtenerNivelesServicio() {
    const endpoint = `/api/v1/nivelservicio`;
    return this.api.get(`${this.host}${endpoint}`);
  }

  obtenerRutas(nitEmpresa: any) {
    const endpoint = `/api/v1/maestras/rutas-activas-empresa?nit=${nitEmpresa}`;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer a6edc4af-4b84-4444-8c98-8afa14437cd1'
    });
    return this.http.get(`${this.backendRutas}${endpoint}`, { headers: headers });
  }

  cargarAutorizaciones(autorizaciones: RegistrarAutorizaciones) {
    let endpoint;
    const body = {
      idDespacho: autorizaciones.idDespacho,
      autorizacion: autorizaciones.autorizacion,
    };
    endpoint = `/api/v1/autorizaciones`
    return this.api.post(`${this.host}${endpoint}`, body);
  }

  guardarRutas(ruta: RegistrarRutas) {
    let endpoint;
    const body = {
      idDespacho: ruta.idDespacho,
      idRutaAutorizada: ruta.idRutaAutorizada,
      idOrigen: ruta.idOrigen,
      detalleOrigen: ruta.detalleOrigen,
      idDestino: ruta.idDestino,
      detalleDestino: ruta.detalleDestino,
      via: ruta.via,
      centroPobladoOrigen: ruta.centroPobladoOrigen,
      centroPobladoDestino: ruta.centroPobladoDestino,
      observaciones: ruta.observaciones,
    };
    endpoint = `/api/v1/rutas`
    return this.api.post(`${this.host}${endpoint}`, body);
  }

  guardarConductores(conductores: RegistrarConductores) {
    let endpoint;
    const body = {
      idDespacho: conductores.idDespacho,
      tipoIdentificacionPrincipal: conductores.tipoIdentificacionPrincipal!.toString(),
      numeroIdentificacion: conductores.numeroIdentificacion,
      primerNombrePrincipal: conductores.primerNombrePrincipal,
      segundoNombrePrincipal: conductores.segundoNombrePrincipal,
      primerApellidoPrincipal: conductores.primerApellidoPrincipal,
      segundoApellidoPrincipal: conductores.segundoApellidoPrincipal,
      tipoIdentificacionSecundario: (conductores.tipoIdentificacionSecundario ?? '').toString(),
      numeroIdentificacionSecundario: conductores.numeroIdentificacionSecundario,
      primerNombreSecundario: conductores.primerNombreSecundario,
      segundoNombreSecundario: conductores.segundoNombreSecundario,
      primerApellidoSecundario: conductores.primerApellidoSecundario,
      segundoApellidoSecundario: conductores.segundoApellidoSecundario,
      idPruebaAlcoholimetria: conductores.idPruebaAlcoholimetria.toString(),
      idExamenMedico: conductores.idExamenMedico.toString(),
      licenciaConduccion: conductores.licenciaConduccion,
      idPruebaAlcoholimetriaSecundario: conductores.idPruebaAlcoholimetriaSecundario.toString(),
      licenciaConduccionSecundario: conductores.licenciaConduccionSecundario,
      fechaVencimientoLicencia: conductores.fechaVencimientoLicencia,
      fechaVencimientoLicenciaSecundario: conductores.fechaVencimientoLicenciaSecundario,
      idExamenMedicoSecundario: conductores.idExamenMedicoSecundario.toString()
    };
    endpoint = `/api/v1/conductores`
    return this.api.post(`${this.host}${endpoint}`, body);
  }

  guardarVehiculo(vehiculo: RegistrarVehiculos) {
    let endpoint;
    const body = {
      idDespachos: vehiculo.idDespachos,
      placa: vehiculo.placa,
      soat: vehiculo.soat,
      fechaVencimientoSoat: vehiculo.fechaVencimientoSoat,
      revisionTecnicoMecanica: vehiculo.revisionTecnicoMecanica ? vehiculo.revisionTecnicoMecanica.toString() : '',
      fechaRevisionTecnicoMecanica: vehiculo.fechaRevisionTecnicoMecanica,
      idPolizaContractual: vehiculo.idPolizasContractual?.toString() ?? '',
      vigenciaContractual: vehiculo.vigenciaContractual,
      idPolizaExtracontractual: vehiculo.idPolizasExtracontractual?.toString(),
      vigenciaExtracontractual: vehiculo.vigenciaExtracontractual,
      tarjetaOperacion: vehiculo.tarjetaOperacion,
      fechaVencimientoTarjetaOperacion: vehiculo.fechaTarjetaOperacion,
      idMatenimientoPreventivo: vehiculo.idMatenimientoPreventivo?.toString(),
      fechaMantenimientoPreventivo: vehiculo.fechaMantenimiento,
      idProtocoloAlistamientodiario: vehiculo.idProtocoloAlistamientodiario?.toString(),
      fechaProtocoloAlistamientodiario: vehiculo.fechaProtocoloAlistamientodiario,
      observaciones: vehiculo.observaciones,
      clase: vehiculo.clase,
      nivelServicio: vehiculo.nivelServicio
    };
    endpoint = `/api/v1/vehiculos`
    return this.api.post(`${this.host}${endpoint}`, body);
  }

  crearNovedad(novedad: any) {
    const endpoint = `/api/v1/novedades/`;
    return this.api.post(`${this.host}${endpoint}`, novedad);
  }

  crearVehículoNovedad(novedadVehiculo: any) {
    /* console.log('Creando novedad de vehículo:', novedadVehiculo); */
    const endpoint = `/api/v1/novedadesvehiculo`;
    return this.api.post(`${this.host}${endpoint}`, novedadVehiculo);
  }

  crearConductorNovedad(novedadConductor: any) {
    const endpoint = `/api/v1/novedadesconductor`;
    return this.api.post(`${this.host}${endpoint}`, novedadConductor);
  }

  obtenerLlegadas(nitEmpresa?: any) {
    const endpoint = `/api/v1/llegada?nit=${nitEmpresa}`;
    return this.api.get(`${this.host}${endpoint}`);
  }

  consultarSalidaPorPlaca(placa: string, fecha?: string) {
    let endpoint = `/api/v1/despachos/placa/${placa}`;
    if (fecha) {
      endpoint += `?fechaSalida=${fecha}`;
    }
    return this.api.get(`${this.host}${endpoint}`);
  }

  registrarLlegada(llegada: any, editar: boolean = false) {
    const endpoint = `/api/v1/llegada`;
    if (editar) {
      return this.api.put(`${this.host}${endpoint}`, llegada);
    } else {
      return this.api.post(`${this.host}${endpoint}`, llegada);
    }
  }

  registrarLlegadaVehiculo(body: any) {
    const endpoint = `/api/v1/llegadavehiculo`;
    return this.api.post(`${this.host}${endpoint}`, body);
  }

  registrarLlegadaConductor(conductores: any) {
    const endpoint = '/api/v1/llegadaconductor';
    return this.api.post(`${this.host}${endpoint}`, conductores);
  }
}
