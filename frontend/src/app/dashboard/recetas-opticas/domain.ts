export type TipoReceta = 'ANTEOJOS' | 'CONTACTO' | 'AMBOS';
export type TipoCorreccion = 'ANTEOJOS' | 'CONTACTO';
export type Ojo = 'OD' | 'OI';
export type BasePrisma = 'SUPERIOR' | 'INFERIOR' | 'INTERNA' | 'EXTERNA';

export interface ApiPage<T> { count: number; results: T[] }

export interface Historial {
  id_historial: number;
  id_paciente: number;
  estado: 'ACTIVO' | 'ARCHIVADO';
  paciente_nombre_completo?: string;
}

export interface Consulta {
  id_consulta: number;
  id_paciente: number;
  id_especialista: number;
  fecha_creacion: string;
  refraccion_od_esfera: string | null;
  refraccion_od_cilindro: string | null;
  refraccion_od_eje: number | null;
  refraccion_oi_esfera: string | null;
  refraccion_oi_cilindro: string | null;
  refraccion_oi_eje: number | null;
}

export interface Detalle {
  id_detalle_receta_optica?: number;
  tipo_correccion: TipoCorreccion;
  ojo: Ojo;
  esfera: string;
  cilindro: string;
  eje: string;
  adicion: string;
  prisma: string;
  base_prisma: BasePrisma | '';
  distancia_pupilar_mm: string;
  curva_base_mm: string;
  diametro_mm: string;
  marca: string;
  modelo: string;
  material: string;
  modalidad_reemplazo: string;
  observaciones: string;
}

export type DetalleEditableField = Exclude<keyof Detalle, 'id_detalle_receta_optica'>;

export interface Receta {
  id_receta_optica: number;
  id_consulta: number;
  tipo: TipoReceta;
  indicaciones: string | null;
  detalles: Detalle[];
  registrado_por_nombre: string;
  fecha_emision: string;
}

export const tipoLabel: Record<TipoReceta | TipoCorreccion, string> = {
  ANTEOJOS: 'Anteojos',
  CONTACTO: 'Lentes de contacto',
  AMBOS: 'Anteojos y lentes de contacto',
};

export function tiposPara(tipo: TipoReceta): TipoCorreccion[] {
  return tipo === 'AMBOS' ? ['ANTEOJOS', 'CONTACTO'] : [tipo];
}

export function crearDetalles(consulta: Consulta, tipo: TipoReceta): Detalle[] {
  return tiposPara(tipo).flatMap((tipoCorreccion) =>
    (['OD', 'OI'] as Ojo[]).map((ojo) => ({
      tipo_correccion: tipoCorreccion,
      ojo,
      esfera: (ojo === 'OD' ? consulta.refraccion_od_esfera : consulta.refraccion_oi_esfera) ?? '',
      cilindro: (ojo === 'OD' ? consulta.refraccion_od_cilindro : consulta.refraccion_oi_cilindro) ?? '0.00',
      eje: String((ojo === 'OD' ? consulta.refraccion_od_eje : consulta.refraccion_oi_eje) ?? ''),
      adicion: '', prisma: '', base_prisma: '', distancia_pupilar_mm: '',
      curva_base_mm: '', diametro_mm: '', marca: '', modelo: '', material: '',
      modalidad_reemplazo: '', observaciones: '',
    })),
  );
}

function normalizarDetalle(detalle: Detalle): Detalle {
  return Object.fromEntries(
    Object.entries(detalle).map(([key, value]) => [
      key,
      key === 'id_detalle_receta_optica' ? value : String(value ?? ''),
    ]),
  ) as unknown as Detalle;
}

export function reconciliarDetalles(
  consulta: Consulta,
  tipo: TipoReceta,
  actuales: Detalle[],
): Detalle[] {
  const base = crearDetalles(consulta, tipo);
  return base.map((detalleBase) => {
    const existente = actuales.find((detalle) =>
      detalle.tipo_correccion === detalleBase.tipo_correccion && detalle.ojo === detalleBase.ojo,
    );
    return existente ? normalizarDetalle(existente) : detalleBase;
  });
}

export function construirDetallePayload(detalle: Detalle): Record<string, string> {
  return Object.fromEntries(
    Object.entries(detalle)
      .filter(([key, value]) => key !== 'id_detalle_receta_optica' && value !== '' && value != null)
      .map(([key, value]) => [key, String(value).trim()]),
  );
}

function collectMessages(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return [path ? `${path}: ${value}` : value];
  if (Array.isArray(value)) return value.flatMap((item) => collectMessages(item, path));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      collectMessages(item, key === 'non_field_errors' ? path : key.replaceAll('_', ' ')),
    );
  }
  return [];
}

export function errorMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } }).response?.data;
  const messages = collectMessages(data);
  return messages.length > 0 ? messages.join(' · ') : 'No se pudo completar la operación. Intenta nuevamente.';
}
