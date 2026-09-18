import { configuracionSitio } from './configuracionSitio';
import { miembroEquipo } from './miembroEquipo';
import { preguntaFrecuente } from './preguntaFrecuente';
import { proyecto } from './proyecto';
import { servicio } from './servicio';
import { testimonio } from './testimonio';

/** Tipos de los que solo debe existir un documento. */
export const SINGLETONS = ['configuracionSitio'];

export const schemaTypes = [
  proyecto,
  servicio,
  testimonio,
  preguntaFrecuente,
  miembroEquipo,
  configuracionSitio,
];
