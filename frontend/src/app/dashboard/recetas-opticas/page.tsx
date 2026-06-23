'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, FileText, Glasses, Pencil, Printer, RefreshCw, Search, X } from 'lucide-react';

import { useDashboardUser } from '@/contexts/DashboardUserContext';
import api from '@/lib/api';
import { canViewClinicalModule, canWriteOpticalPrescription } from '@/lib/authorization';

import PrescriptionDetailsForm from './components/PrescriptionDetailsForm';
import {
  type ApiPage, type Consulta, type Detalle, type DetalleEditableField, type Historial, type Receta, type TipoReceta,
  construirDetallePayload, crearDetalles, errorMessage, reconciliarDetalles, tipoLabel, tiposPara,
} from './domain';
import styles from './page.module.css';

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/La_Paz',
});
const DATE_FORMAT = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium', timeZone: 'America/La_Paz',
});

function hasRefraction(consulta: Consulta): boolean {
  return consulta.refraccion_od_esfera != null && consulta.refraccion_oi_esfera != null;
}

export default function RecetasOpticasPage() {
  const { me, permissionCodes, loading: userLoading } = useDashboardUser();
  const canView = canViewClinicalModule(me, 'recetas_opticas', permissionCodes);
  const canCreate = canWriteOpticalPrescription(me, 'crear', permissionCodes);
  const canEdit = canWriteOpticalPrescription(me, 'editar', permissionCodes);
  const canWrite = canCreate || canEdit;
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Historial | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [consultaId, setConsultaId] = useState('');
  const [tipo, setTipo] = useState<TipoReceta>('ANTEOJOS');
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [indicaciones, setIndicaciones] = useState('');
  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [printReceta, setPrintReceta] = useState<Receta | null>(null);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
  const canUseForm = editingReceta ? canEdit : canCreate;

  useEffect(() => {
    if (userLoading) return;
    if (!canView) {
      setLoading(false);
      setError('No tienes permiso para consultar recetas ópticas.');
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ estado: 'ACTIVO' });
        if (search.trim()) params.set('search', search.trim());
        const { data } = await api.get<ApiPage<Historial>>(`/api/historial-clinico?${params}`, { signal: controller.signal });
        setHistoriales(data.results ?? []);
      } catch (requestError) {
        if ((requestError as { code?: string }).code !== 'ERR_CANCELED') setError(errorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [canView, search, userLoading]);

  const fetchPatientData = useCallback(async (historial: Historial) => {
    const recetasRequest = api.get<ApiPage<Receta>>(`/api/historial-clinico/${historial.id_historial}/recetas-opticas`);
    if (!canWrite) {
      const recetasRes = await recetasRequest;
      return { recetas: recetasRes.data.results ?? [], consultas: [] as Consulta[] };
    }
    const [recetasRes, consultasRes] = await Promise.all([
      recetasRequest,
      api.get<ApiPage<Consulta>>(`/api/consultas-medicas?id_paciente=${historial.id_paciente}&ordering=-fecha_creacion`),
    ]);
    return { recetas: recetasRes.data.results ?? [], consultas: consultasRes.data.results ?? [] };
  }, [canWrite]);

  const loadPatientData = useCallback(async (historial: Historial, resetFeedback = true) => {
    setSelected(historial);
    setPatientLoading(true);
    if (resetFeedback) { setError(null); setSuccess(null); }
    setConsultaId('');
    setDetalles([]);
    setEditingReceta(null);
    try {
      const data = await fetchPatientData(historial);
      setRecetas(data.recetas);
      setConsultas(data.consultas);
    } catch (requestError) {
      setError(errorMessage(requestError));
      setRecetas([]);
      setConsultas([]);
    } finally {
      setPatientLoading(false);
    }
  }, [fetchPatientData]);

  const consultasDisponibles = useMemo(() => {
    const ocupadas = new Set(recetas.map((receta) => receta.id_consulta));
    return consultas.filter((consulta) => hasRefraction(consulta) && !ocupadas.has(consulta.id_consulta));
  }, [consultas, recetas]);

  function selectConsulta(value: string) {
    setConsultaId(value);
    setSuccess(null);
    const consulta = consultas.find((item) => item.id_consulta === Number(value));
    setDetalles(consulta ? crearDetalles(consulta, tipo) : []);
  }

  function changeTipo(value: TipoReceta) {
    setTipo(value);
    const consulta = consultas.find((item) => item.id_consulta === Number(consultaId));
    setDetalles(consulta ? reconciliarDetalles(consulta, value, detalles) : []);
  }

  function edit(receta: Receta) {
    const consulta = consultas.find((item) => item.id_consulta === receta.id_consulta);
    if (!consulta) {
      setError('No se pudo cargar la consulta original de esta receta para editarla.');
      return;
    }
    setEditingReceta(receta);
    setConsultaId(String(receta.id_consulta));
    setTipo(receta.tipo);
    setIndicaciones(receta.indicaciones ?? '');
    setDetalles(reconciliarDetalles(consulta, receta.tipo, receta.detalles));
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingReceta(null);
    setConsultaId('');
    setTipo('ANTEOJOS');
    setDetalles([]);
    setIndicaciones('');
  }

  function updateDetalle(index: number, field: DetalleEditableField, value: string) {
    setDetalles((current) => current.map((detalle, idx) => {
      if (idx !== index) return detalle;
      if (field === 'prisma' && !value) return { ...detalle, prisma: '', base_prisma: '' };
      return { ...detalle, [field]: value };
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!(editingReceta ? canEdit : canCreate) || !selected || !consultaId) {
      setError('Selecciona una consulta con examen de refracción antes de emitir.');
      return;
    }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = {
        id_consulta: Number(consultaId), tipo, indicaciones: indicaciones.trim() || null,
        detalles: detalles.map(construirDetallePayload),
      };
      if (editingReceta) {
        await api.put(
          `/api/historial-clinico/${selected.id_historial}/recetas-opticas/${editingReceta.id_receta_optica}`,
          payload,
        );
        setSuccess('Receta óptica actualizada correctamente. La corrección quedó registrada en bitácora.');
      } else {
        await api.post(`/api/historial-clinico/${selected.id_historial}/recetas-opticas`, payload);
        setSuccess('Receta óptica emitida correctamente.');
      }
      setEditingReceta(null); setConsultaId(''); setTipo('ANTEOJOS'); setDetalles([]); setIndicaciones('');
      await loadPatientData(selected, false);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally { setSaving(false); }
  }

  function print(receta: Receta) {
    setPrintReceta(receta);
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.eyebrow}><Eye size={16} aria-hidden /> Gestión clínica · CU17</div>
        <h1>Recetas ópticas</h1>
        <p>Emite una prescripción para anteojos, lentes de contacto o ambos a partir de una consulta con examen de refracción.</p>
      </header>

      {error && <div className={styles.error} role="alert">{error}</div>}
      {success && <div className={styles.success} role="status" aria-live="polite">{success}</div>}

      <div className={styles.shell}>
        <aside className={styles.patientPanel} aria-label="Selección de paciente">
          <label htmlFor="patient-search">Buscar paciente</label>
          <div className={styles.searchControl}><Search size={17} aria-hidden /><input id="patient-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, documento o ID" /></div>
          <div className={styles.patientList} aria-busy={loading}>
            {loading ? <p className={styles.muted}>Cargando historiales…</p> : historiales.length === 0 ? <p className={styles.muted}>No se encontraron historiales activos.</p> : historiales.map((historial) => (
              <button type="button" key={historial.id_historial} aria-pressed={selected?.id_historial === historial.id_historial}
                className={selected?.id_historial === historial.id_historial ? styles.patientActive : styles.patient}
                onClick={() => void loadPatientData(historial)}>
                <span>{historial.paciente_nombre_completo || `Paciente #${historial.id_paciente}`}</span><small>Historial #{historial.id_historial}</small>
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.workspace}>
          {!selected ? <div className={styles.empty}><Glasses size={52} aria-hidden /><h2>Selecciona un paciente</h2><p>Verás sus recetas históricas y, si puedes emitir, sus consultas habilitadas.</p></div> : <>
            <div className={styles.patientHeading}><div><span>Paciente</span><h2>{selected.paciente_nombre_completo || `#${selected.id_paciente}`}</h2></div><strong>Historial #{selected.id_historial}</strong></div>
            {patientLoading ? <div className={styles.loadingState}><RefreshCw size={22} className={styles.spin} aria-hidden /> Cargando información clínica…</div> :
              <div className={styles.columns}>
                <section className={styles.history} aria-labelledby="history-title">
                  <div className={styles.sectionTitle}><div><span>Registro permanente</span><h3 id="history-title">Historial de prescripciones</h3></div><b>{recetas.length}</b></div>
                  {recetas.length === 0 ? <p className={styles.muted}>Aún no existen recetas ópticas para este paciente.</p> : recetas.map((receta, index) => (
                    <article className={`${styles.recipeCard} ${editingReceta?.id_receta_optica === receta.id_receta_optica ? styles.recipeCardEditing : ''}`} key={receta.id_receta_optica}>
                      <header><div><strong>{tipoLabel[receta.tipo]}</strong><small>{DATE_TIME_FORMAT.format(new Date(receta.fecha_emision))}</small></div>{index === 0 && <span>Más reciente</span>}</header>
                      <div className={styles.measureGrid}>{receta.detalles.map((detalle) => <div key={`${detalle.tipo_correccion}-${detalle.ojo}`}><b>{tipoLabel[detalle.tipo_correccion]} · {detalle.ojo}</b><code>ESF {detalle.esfera} · CIL {detalle.cilindro} · EJE {detalle.eje || '—'}</code>{detalle.tipo_correccion === 'CONTACTO' && <small>{detalle.marca} · {detalle.modelo} · CB {detalle.curva_base_mm} · DIA {detalle.diametro_mm}</small>}{detalle.observaciones?.trim() && <p className={styles.detailObservation}><strong>Observación:</strong> {detalle.observaciones}</p>}</div>)}</div>
                      {receta.indicaciones?.trim() && <div className={styles.recipeIndications}><strong>Indicaciones generales</strong><p>{receta.indicaciones}</p></div>}
                      <footer><small>Emitida por {receta.registrado_por_nombre}</small><div className={styles.cardActions}>{canEdit && <button type="button" onClick={() => edit(receta)} disabled={saving}><Pencil size={15} aria-hidden /> Editar</button>}<button type="button" onClick={() => print(receta)}><Printer size={15} aria-hidden /> Imprimir</button></div></footer>
                    </article>
                  ))}
                </section>

                <form className={styles.form} onSubmit={submit}>
                  <div className={styles.formTitle}><div><span>{editingReceta ? 'Corrección de emisión' : 'Nueva emisión'}</span><h3>{editingReceta ? `Editar receta #${editingReceta.id_receta_optica}` : 'Prescripción óptica'}</h3></div>{editingReceta ? <button className={styles.cancelEdit} type="button" onClick={cancelEdit} disabled={saving}><X size={18} aria-hidden /> Cancelar</button> : <FileText size={24} aria-hidden />}</div>
                  {!canUseForm ? <p className={styles.notice}>Tu perfil no tiene permiso para esta acción. Solo el especialista asignado a la consulta o un administrador puede emitir o editar.</p> : <p className={styles.formIntro}>{editingReceta ? 'Estás corrigiendo la receta existente. La consulta y los datos de emisión se mantienen.' : 'Los datos de CU13 se precargan como referencia. La prescripción final debe ser confirmada por el emisor.'}</p>}
                  <div className={styles.field}><label htmlFor="consulta">Consulta con refracción *</label><select id="consulta" value={consultaId} onChange={(event) => selectConsulta(event.target.value)} disabled={!canUseForm || saving || Boolean(editingReceta)} required><option value="">Seleccionar consulta…</option>{(editingReceta ? consultas.filter((consulta) => consulta.id_consulta === editingReceta.id_consulta) : consultasDisponibles).map((consulta) => <option key={consulta.id_consulta} value={consulta.id_consulta}>Consulta #{consulta.id_consulta} · {DATE_FORMAT.format(new Date(consulta.fecha_creacion))}</option>)}</select>{editingReceta ? <small>La consulta original no puede cambiarse; editar no consume una nueva consulta.</small> : canCreate && consultasDisponibles.length === 0 && <small>No hay consultas con refracción pendientes de receta.</small>}</div>
                  <fieldset className={styles.typePicker} disabled={!canUseForm || saving || !consultaId}><legend>Tipo de receta *</legend>{(['ANTEOJOS', 'CONTACTO', 'AMBOS'] as TipoReceta[]).map((value) => <label key={value}><input type="radio" name="tipo" checked={tipo === value} onChange={() => changeTipo(value)} />{tipoLabel[value]}</label>)}</fieldset>
                  {consultaId && tiposPara(tipo).map((tipoDetalle) => <PrescriptionDetailsForm key={tipoDetalle} tipo={tipoDetalle} detalles={detalles} disabled={!canUseForm || saving} onChange={updateDetalle} />)}
                  <div className={styles.field}><label htmlFor="indicaciones">Indicaciones generales</label><textarea id="indicaciones" rows={3} maxLength={2000} value={indicaciones} onChange={(event) => setIndicaciones(event.target.value)} placeholder="Uso, adaptación o controles posteriores" disabled={!canUseForm || saving} /></div>
                  <p className={styles.immutableNote}>{editingReceta ? 'Esta acción actualiza la misma receta y deja trazabilidad en bitácora.' : 'La receta podrá corregirse posteriormente, pero no eliminarse ni vincularse a otra consulta.'}</p>
                  <button className={styles.submit} type="submit" disabled={!(editingReceta ? canEdit : canCreate) || saving || !consultaId}>{saving ? (editingReceta ? 'Guardando cambios…' : 'Emitiendo…') : (editingReceta ? 'Guardar cambios' : 'Emitir receta óptica')}</button>
                </form>
              </div>}
          </>}
        </main>
      </div>

      {printReceta && <section className={styles.printArea} aria-label="Receta óptica para impresión">
        <header><h1>Clínica de Ojos Norte</h1><p>Prescripción óptica</p></header>
        <div className={styles.printMeta}><span>Paciente: {selected?.paciente_nombre_completo || `#${selected?.id_paciente}`}</span><span>Fecha: {DATE_FORMAT.format(new Date(printReceta.fecha_emision))}</span><span>Tipo: {tipoLabel[printReceta.tipo]}</span></div>
        <table><thead><tr><th>Corrección</th><th>Ojo</th><th>ESF</th><th>CIL</th><th>Eje</th><th>Adición</th><th>DP</th><th>Prisma/Base</th><th>CB</th><th>DIA</th><th>Marca/Modelo</th></tr></thead><tbody>{printReceta.detalles.map((detalle) => <tr key={`${detalle.tipo_correccion}-${detalle.ojo}`}><td>{tipoLabel[detalle.tipo_correccion]}</td><td>{detalle.ojo}</td><td>{detalle.esfera}</td><td>{detalle.cilindro}</td><td>{detalle.eje || '—'}</td><td>{detalle.adicion || '—'}</td><td>{detalle.distancia_pupilar_mm || '—'}</td><td>{detalle.prisma ? `${detalle.prisma} / ${detalle.base_prisma}` : '—'}</td><td>{detalle.curva_base_mm || '—'}</td><td>{detalle.diametro_mm || '—'}</td><td>{detalle.marca ? `${detalle.marca} / ${detalle.modelo}` : '—'}</td></tr>)}</tbody></table>
        {printReceta.indicaciones?.trim() && <p><strong>Indicaciones generales:</strong> {printReceta.indicaciones}</p>}
        {printReceta.detalles.some((detalle) => detalle.observaciones?.trim()) && <div className={styles.printObservations}><strong>Observaciones por ojo:</strong>{printReceta.detalles.filter((detalle) => detalle.observaciones?.trim()).map((detalle) => <p key={`observacion-${detalle.tipo_correccion}-${detalle.ojo}`}><b>{tipoLabel[detalle.tipo_correccion]} · {detalle.ojo}:</b> {detalle.observaciones}</p>)}</div>}
        <footer><div /><p>{printReceta.registrado_por_nombre}<br />Firma y sello</p></footer>
      </section>}
    </section>
  );
}
