import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/base-api.service';
import { MantenimientoPreventivo } from '../modelos/RegistroMantenimiento';
import { ProtocoloAlistamiento } from '../modelos/RegistroProtocoloAlistamiento';
import { Autorizacion } from '../modelos/RegistroAutorizacion';

@Injectable({ providedIn: 'root' })
export class ServiciosMantenimientos {
  private readonly api = inject(BaseApiService);

  guardarArchivo(tipo: any, documento: string, nombreOriginal: string, ruta: string, vigiladoId: any): Observable<unknown> {
    const endpoint = '/api/v1/archivos_programas'
    const formData = new FormData()
    formData.append('tipoId', tipo)
    formData.append('documento', documento)
    formData.append('nombreOriginal', nombreOriginal)
    formData.append('ruta', ruta)
    formData.append('vigiladoId', vigiladoId)
    return this.api.post<unknown>(endpoint, formData, true)
  }

  listarDocumentos(tipoId: any, vigiladoId: any) {
    const endpoint = `/api/v1/archivos_programas?tipoId=${tipoId}&vigiladoId=${vigiladoId}`
    return this.api.get(endpoint)
  }

  listarRegistros(tipoId: any, vigiladoId: any, rolId?: any) {
    let endpoint = ''
    if (rolId == 9) {
      endpoint = `/api/v1/mantenimiento/listar-placas-todas?tipoId=${tipoId}&vigiladoId=${vigiladoId}`
    } else {
      endpoint = `/api/v1/mantenimiento/listar-placas?tipoId=${tipoId}&vigiladoId=${vigiladoId}`
    }
    return this.api.get(endpoint)
  }

  listarRegistrosTodos(tipoId: any, vigiladoId: any) {
    const endpoint = `/api/v1/mantenimiento/listar-placas-todas?tipoId=${tipoId}&vigiladoId=${vigiladoId}`
    return this.api.get(endpoint)
  }

  guardarMantenimiento(vigiladoId: any, placa: any, tipoId: any) {
    const endpoint = `/api/v1/mantenimiento/guardar-mantenimieto`
    const formData = new FormData()
    formData.append('tipoId', tipoId)
    formData.append('vigiladoId', vigiladoId)
    formData.append('placa', placa)
    return this.api.post(endpoint, formData, true)
  }

  guardarMantenimientoPreventivo(mantenimiento: MantenimientoPreventivo, id: any) {
    const endpoint = `/api/v1/mantenimiento/guardar-preventivo`
    const formData = new FormData()
    formData.append('mantenimientoId', id)
    formData.append('placa', mantenimiento.placa!)
    formData.append('fecha', mantenimiento.fecha!)
    formData.append('hora', mantenimiento.hora!)
    formData.append('nit', mantenimiento.nit!.toString())
    formData.append('razonSocial', mantenimiento.razonSocial!)
    formData.append('tipoIdentificacion', mantenimiento.tipoIdentificacion!)
    formData.append('numeroIdentificacion', mantenimiento.numeroIdentificacion!.toString())
    formData.append('nombresResponsable', mantenimiento.nombreIngeniero!)
    formData.append('detalleActividades', mantenimiento.detalleActividades!)
    return this.api.post(endpoint, formData, true)
  }

  guardarMantenimientoCorrectivo(mantenimiento: MantenimientoPreventivo, id: any) {
    const endpoint = `/api/v1/mantenimiento/guardar-correctivo`
    const formData = new FormData()
    formData.append('mantenimientoId', id)
    formData.append('placa', mantenimiento.placa!)
    formData.append('fecha', mantenimiento.fecha!)
    formData.append('hora', mantenimiento.hora!)
    formData.append('nit', mantenimiento.nit!.toString())
    formData.append('razonSocial', mantenimiento.razonSocial!)
    formData.append('tipoIdentificacion', mantenimiento.tipoIdentificacion!)
    formData.append('numeroIdentificacion', mantenimiento.numeroIdentificacion!.toString())
    formData.append('nombresResponsable', mantenimiento.nombreIngeniero!)
    formData.append('detalleActividades', mantenimiento.detalleActividades!)
    return this.api.post(endpoint, formData, true)
  }

  guardarAlistamiento(protocoloAlistamiento: ProtocoloAlistamiento, id: any) {
    const endpoint = `/api/v1/mantenimiento/guardar-alistamiento`
    const body = {
      mantenimientoId: id,
      placa: protocoloAlistamiento.placa,
      tipoIdentificacionResponsable: protocoloAlistamiento.tipoIdentificacion,
      numeroIdentificacionResponsable: protocoloAlistamiento.numeroIdentificacion,
      nombreResponsable: protocoloAlistamiento.nombreResponsable,
      tipoIdentificacionConductor: protocoloAlistamiento.tipoIdentificacionConductor,
      numeroIdentificacionConductor: protocoloAlistamiento.numeroIdentificacionConductor,
      nombresConductor: protocoloAlistamiento.nombreConductor,
      actividades: protocoloAlistamiento.actividades,
      detalleActividades: protocoloAlistamiento.detalleActividades
    };
    return this.api.post(endpoint, body)
  }

  guardarAutorizacion(autorizacion: Autorizacion, id: any) {
    const endpoint = `/api/v1/mantenimiento/guardar-autorizacion`
    const body = {
      mantenimientoId: id,
      fechaViaje: autorizacion.fechaViaje,
      origen: autorizacion.origen,
      destino: autorizacion.destino,
      tipoIdentificacionNna: autorizacion.tipoIdentificacionNna,
      numeroIdentificacionNna: autorizacion.numeroIdentificacionNna,
      nombresApellidosNna: autorizacion.nombresApellidosNna,
      situacionDiscapacidad: autorizacion.situacionDiscapacidad,
      tipoDiscapacidad: autorizacion.tipoDiscapacidad,
      perteneceComunidadEtnica: autorizacion.perteneceComunidadEtnica,
      tipoPoblacionEtnica: autorizacion.tipoPoblacionEtnica,
      tipoIdentificacionOtorgante: autorizacion.tipoIdentificacionOtorgante,
      numeroIdentificacionOtorgante: autorizacion.numeroIdentificacionOtorgante,
      nombresApellidosOtorgante: autorizacion.nombresApellidosOtorgante,
      numeroTelefonicoOtorgante: autorizacion.numeroTelefonicoOtorgante,
      correoElectronicoOtorgante: autorizacion.correoElectronicoOtorgante,
      direccionFisicaOtorgante: autorizacion.direccionFisicaOtorgante,
      sexoOtorgante: autorizacion.sexoOtorgante,
      generoOtorgante: autorizacion.generoOtorgante,
      calidadActua: autorizacion.calidadActua,
      tipoIdentificacionAutorizadoViajar: autorizacion.tipoIdentificacionAutorizadoViajar,
      numeroIdentificacionAutorizadoViajar: autorizacion.numeroIdentificacionAutorizadoViajar,
      nombresApellidosAutorizadoViajar: autorizacion.nombresApellidosAutorizadoViajar,
      numeroTelefonicoAutorizadoViajar: autorizacion.numeroTelefonicoAutorizadoViajar,
      direccionFisicaAutorizadoViajar: autorizacion.direccionFisicaAutorizadoViajar,
      tipoIdentificacionAutorizadoRecoger: autorizacion.tipoIdentificacionAutorizadoRecoger,
      numeroIdentificacionAutorizadoRecoger: autorizacion.numeroIdentificacionAutorizadoRecoger,
      nombresApellidosAutorizadoRecoger: autorizacion.nombresApellidosAutorizadoRecoger,
      numeroTelefonicoAutorizadoRecoger: autorizacion.numeroTelefonicoAutorizadoRecoger,
      direccionFisicaAutorizadoRecoger: autorizacion.direccionFisicaAutorizadoRecoger,
      copiaAutorizacionViajeNombreOriginal: autorizacion.copiaAutorizacionViajeNombreOriginal,
      copiaAutorizacionViajeDocumento: autorizacion.copiaAutorizacionViajeDocumento,
      copiaAutorizacionViajeRuta: autorizacion.copiaAutorizacionViajeRuta,
      copiaDocumentoParentescoNombreOriginal: autorizacion.copiaDocumentoParentescoNombreOriginal,
      copiaDocumentoParentescoDocumento: autorizacion.copiaDocumentoParentescoDocumento,
      copiaDocumentoParentescoRuta: autorizacion.copiaDocumentoParentescoRuta,
      copiaDocumentoIdentidadAutorizadoNombreOriginal: autorizacion.copiaDocumentoIdentidadAutorizadoNombreOriginal,
      copiaDocumentoIdentidadAutorizadoDocumento: autorizacion.copiaDocumentoIdentidadAutorizadoDocumento,
      copiaDocumentoIdentidadAutorizadoRuta: autorizacion.copiaDocumentoIdentidadAutorizadoRuta,
      copiaConstanciaEntregaNombreOriginal: autorizacion.copiaConstanciaEntregaNombreOriginal,
      copiaConstanciaEntregaDocumento: autorizacion.copiaConstanciaEntregaDocumento,
      copiaConstanciaEntregaRuta: autorizacion.copiaConstanciaEntregaRuta,
    };
    return this.api.post(endpoint, body)
  }

  visualizarMantenimientoPreventivo(id: any) {
    const endpoint = `/api/v1/mantenimiento/visualizar-preventivo?mantenimientoId=${id}`
    return this.api.get(endpoint)
  }

  visualizarMantenimientoCorrectivo(id: any) {
    const endpoint = `/api/v1/mantenimiento/visualizar-correctivo?mantenimientoId=${id}`
    return this.api.get(endpoint)
  }

  visualizarAlistamiento(id: any) {
    const endpoint = `/api/v1/mantenimiento/visualizar-alistamiento?mantenimientoId=${id}`
    return this.api.get(endpoint)
  }

  visualizarAutorizacion(id: any) {
    const endpoint = `/api/v1/mantenimiento/visualizar-autorizacion?mantenimientoId=${id}`
    return this.api.get(endpoint)
  }

  historial(tipoId: any, vigiladoId: any, placa: string) {
    const endpoint = `/api/v1/mantenimiento/listar-historial?tipoId=${tipoId}&vigiladoId=${vigiladoId}&placa=${placa}`;
    return this.api.get(endpoint)
  }

  listarActividades() {
    const endpoint = `/api/v1/mantenimiento/listar-actividades`
    return this.api.get(endpoint)
  }

  exportarHistorial(tipoId: any, vigiladoId: any, placa: string) {
    const endpoint = `/api/v1/mantenimiento/exportar-historial?tipoId=${tipoId}&vigiladoId=${vigiladoId}&placa=${placa}`;
    const url = `${location.origin}${endpoint}`;
    return url;
  }
}
