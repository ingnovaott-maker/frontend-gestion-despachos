export interface RegistroProtocoloAlistamiento {
  id?: string
  fechaDiligenciamiento?: string;
  placa?: string;
  estadoMantenimiento?: string;
  tipoId?: string;
  mantenimiento_id?: string;
}

export interface ProtocoloAlistamiento {
  id?: string;
  placa?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: number;
  nombreResponsable?: string;
  tipoIdentificacionConductor?: string;
  numeroIdentificacionConductor?: number;
  nombreConductor?: string;
  actividades?: any[];
  detalleActividades?: string;
}

export interface DetallesActividades {
id?: number;
nombre?: string;
estado?: boolean;
}
