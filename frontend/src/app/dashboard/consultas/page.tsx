'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteModule } from '@/lib/authorization';
import styles from '../clinic.module.css';

interface PageRes<T> { count: number; results: T[]; }
interface CitaRow { id_cita: number; id_paciente: number; id_especialista: number; estado: string; }
interface ConsultaRow { id_consulta: number; id_cita: number; id_paciente: number; id_especialista: number; diagnostico: string; fecha_creacion: string; }

function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } }).response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object') {
    const vals = Object.values(d).flat();
    const first = vals.find((v) => typeof v === 'string');
    if (typeof first === 'string') return first;
  }
  return 'No se pudo completar la accion.';
}

export default function ConsultasPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [citas, setCitas] = useState<CitaRow[]>([]);
  const [rows, setRows] = useState<ConsultaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const citaSelectRef = useRef<HTMLSelectElement | null>(null);

  const [form, setForm] = useState({
    id_cita: '', id_paciente: '', id_especialista: '', motivo_consulta: '', anamnesis: '', hallazgos: '', diagnostico: '', plan_tratamiento: '',
    peso_kg: '', talla_cm: '', temperatura_c: '', presion_arterial: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', saturacion_oxigeno: '', triaje_observaciones: '',
    presion_intraocular_od: '', presion_intraocular_oi: '',
    refraccion_od_esfera: '', refraccion_od_cilindro: '', refraccion_od_eje: '',
    refraccion_oi_esfera: '', refraccion_oi_cilindro: '', refraccion_oi_eje: '',
    agudeza_visual_sc: '', agudeza_visual_cc: '', diagnostico_secundario: '', codigo_cie10: '',
  });

  const canManageConsultas = canWriteModule(me, 'consultas', permissionCodes);
  const canViewConsultas = canViewClinicalModule(me, 'consultas', permissionCodes);
  const canSubmitConsulta =
    !!form.id_cita &&
    !!form.id_paciente &&
    !!form.id_especialista &&
    form.diagnostico.trim().length > 0 &&
    form.plan_tratamiento.trim().length > 0;

  const load = useCallback(async () => {
    if (!canViewConsultas) {
      setCitas([]);
      setRows([]);
      setErr('No tienes permiso para ver el módulo de consultas.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [c, q] = await Promise.all([
        api.get<PageRes<CitaRow>>('/api/citas?page=1'),
        api.get<PageRes<ConsultaRow>>('/api/consultas-medicas?page=1'),
      ]);
      setCitas(c.data.results ?? []);
      setRows(q.data.results ?? []);
    } catch (error) {
      setErr(apiErr(error));
    } finally { setLoading(false); }
  }, [canViewConsultas]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isCreateOpen) return;
    citaSelectRef.current?.focus();
  }, [isCreateOpen]);

  useEffect(() => {
    if (!isCreateOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCreateOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCreateOpen]);

  function onPickCita(id: string) {
    setForm((p) => ({ ...p, id_cita: id }));
    const c = citas.find((x) => String(x.id_cita) === id);
    if (c) {
      setForm((p) => ({ ...p, id_cita: id, id_paciente: String(c.id_paciente), id_especialista: String(c.id_especialista) }));
    }
  }

  async function createConsulta() {
    if (!canManageConsultas) {
      setErr('No tienes permiso para registrar consultas.');
      return;
    }
    if (!form.id_cita || !form.id_paciente || !form.id_especialista) {
      setErr('Selecciona una cita válida para autocompletar paciente y especialista.');
      return;
    }
    if (!form.diagnostico.trim()) {
      setErr('El diagnóstico principal es obligatorio.');
      return;
    }
    if (!form.plan_tratamiento.trim()) {
      setErr('El plan de tratamiento es obligatorio.');
      return;
    }
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      await api.post('/api/consultas-medicas', {
        id_cita: Number(form.id_cita),
        id_paciente: Number(form.id_paciente),
        id_especialista: Number(form.id_especialista),
        motivo_consulta: form.motivo_consulta,
        anamnesis: form.anamnesis,
        hallazgos: form.hallazgos,
        peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
        talla_cm: form.talla_cm ? Number(form.talla_cm) : null,
        temperatura_c: form.temperatura_c ? Number(form.temperatura_c) : null,
        presion_arterial: form.presion_arterial || null,
        frecuencia_cardiaca: form.frecuencia_cardiaca ? Number(form.frecuencia_cardiaca) : null,
        frecuencia_respiratoria: form.frecuencia_respiratoria ? Number(form.frecuencia_respiratoria) : null,
        saturacion_oxigeno: form.saturacion_oxigeno ? Number(form.saturacion_oxigeno) : null,
        triaje_observaciones: form.triaje_observaciones || null,
        presion_intraocular_od: form.presion_intraocular_od ? Number(form.presion_intraocular_od) : null,
        presion_intraocular_oi: form.presion_intraocular_oi ? Number(form.presion_intraocular_oi) : null,
        refraccion_od_esfera: form.refraccion_od_esfera ? Number(form.refraccion_od_esfera) : null,
        refraccion_od_cilindro: form.refraccion_od_cilindro ? Number(form.refraccion_od_cilindro) : null,
        refraccion_od_eje: form.refraccion_od_eje ? Number(form.refraccion_od_eje) : null,
        refraccion_oi_esfera: form.refraccion_oi_esfera ? Number(form.refraccion_oi_esfera) : null,
        refraccion_oi_cilindro: form.refraccion_oi_cilindro ? Number(form.refraccion_oi_cilindro) : null,
        refraccion_oi_eje: form.refraccion_oi_eje ? Number(form.refraccion_oi_eje) : null,
        agudeza_visual_sc: form.agudeza_visual_sc || null,
        agudeza_visual_cc: form.agudeza_visual_cc || null,
        diagnostico: form.diagnostico,
        diagnostico_secundario: form.diagnostico_secundario || null,
        codigo_cie10: form.codigo_cie10 || null,
        plan_tratamiento: form.plan_tratamiento,
      });
      setOk('Consulta registrada y cita marcada como ATENDIDA.');
      setIsCreateOpen(false);
      setForm({
        id_cita: '', id_paciente: '', id_especialista: '', motivo_consulta: '', anamnesis: '', hallazgos: '', diagnostico: '', plan_tratamiento: '',
        peso_kg: '', talla_cm: '', temperatura_c: '', presion_arterial: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', saturacion_oxigeno: '', triaje_observaciones: '',
        presion_intraocular_od: '', presion_intraocular_oi: '',
        refraccion_od_esfera: '', refraccion_od_cilindro: '', refraccion_od_eje: '',
        refraccion_oi_esfera: '', refraccion_oi_cilindro: '', refraccion_oi_eje: '',
        agudeza_visual_sc: '', agudeza_visual_cc: '', diagnostico_secundario: '', codigo_cie10: '',
      });
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Consultas medicas</h1>
        <p className={styles.muted}>Registro clínico con triaje, presión intraocular, refracción, diagnóstico y plan de tratamiento.</p>
      </div>
      {err && <div className={styles.err}>{err}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}
      {!canManageConsultas && <div className={styles.err}>Tu rol es de solo lectura en Consultas. Puedes revisar historial, pero no registrar nuevas consultas.</div>}

      <div className={styles.actions} style={{ marginBottom: '1rem' }}>
        <button type="button" className={styles.btnPrimary} onClick={() => setIsCreateOpen(true)} disabled={loading || !canManageConsultas}>Registrar consulta</button>
      </div>

      {isCreateOpen && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsCreateOpen(false)}>
          <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="create-consulta-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="create-consulta-title" className={styles.modalTitle}>Registrar consulta médica</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void createConsulta();
              }}
            >
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label>Cita</label>
                  <select ref={citaSelectRef} value={form.id_cita} onChange={(e) => onPickCita(e.target.value)}>
                    <option value="">Selecciona cita</option>
                    {citas.map((c) => <option key={c.id_cita} value={c.id_cita}>Cita {c.id_cita} · Paciente {c.id_paciente} · Estado {c.estado}</option>)}
                  </select>
                </div>
                <div className={styles.field}><label>Paciente ID</label><input value={form.id_paciente} onChange={(e) => setForm((p) => ({ ...p, id_paciente: e.target.value }))} /></div>
                <div className={styles.field}><label>Médico (ID profesional)</label><input value={form.id_especialista} onChange={(e) => setForm((p) => ({ ...p, id_especialista: e.target.value }))} /></div>
              </div>

              <h3 className={styles.subtitle}>Triaje y presión intraocular</h3>
              <div className={styles.grid2}>
        <div className={styles.field}><label>Peso (kg)</label><input type="number" step="0.01" value={form.peso_kg} onChange={(e) => setForm((p) => ({ ...p, peso_kg: e.target.value }))} /></div>
        <div className={styles.field}><label>Talla (cm)</label><input type="number" step="0.01" value={form.talla_cm} onChange={(e) => setForm((p) => ({ ...p, talla_cm: e.target.value }))} /></div>
        <div className={styles.field}><label>Temperatura (°C)</label><input type="number" step="0.1" value={form.temperatura_c} onChange={(e) => setForm((p) => ({ ...p, temperatura_c: e.target.value }))} /></div>
        <div className={styles.field}><label>Presión arterial</label><input placeholder="120/80" value={form.presion_arterial} onChange={(e) => setForm((p) => ({ ...p, presion_arterial: e.target.value }))} /></div>
        <div className={styles.field}><label>Frecuencia cardiaca</label><input type="number" value={form.frecuencia_cardiaca} onChange={(e) => setForm((p) => ({ ...p, frecuencia_cardiaca: e.target.value }))} /></div>
        <div className={styles.field}><label>Frecuencia respiratoria</label><input type="number" value={form.frecuencia_respiratoria} onChange={(e) => setForm((p) => ({ ...p, frecuencia_respiratoria: e.target.value }))} /></div>
        <div className={styles.field}><label>Saturación O₂</label><input type="number" value={form.saturacion_oxigeno} onChange={(e) => setForm((p) => ({ ...p, saturacion_oxigeno: e.target.value }))} /></div>
        <div className={styles.field}><label>PIO OD (mmHg)</label><input type="number" step="0.1" value={form.presion_intraocular_od} onChange={(e) => setForm((p) => ({ ...p, presion_intraocular_od: e.target.value }))} /></div>
        <div className={styles.field}><label>PIO OI (mmHg)</label><input type="number" step="0.1" value={form.presion_intraocular_oi} onChange={(e) => setForm((p) => ({ ...p, presion_intraocular_oi: e.target.value }))} /></div>
        <div className={styles.field}><label>Observaciones triaje</label><textarea value={form.triaje_observaciones} onChange={(e) => setForm((p) => ({ ...p, triaje_observaciones: e.target.value }))} /></div>
              </div>

              <h3 className={styles.subtitle}>Examen de refracción</h3>
              <div className={styles.grid2}>
        <div className={styles.field}><label>OD Esfera</label><input type="number" step="0.25" value={form.refraccion_od_esfera} onChange={(e) => setForm((p) => ({ ...p, refraccion_od_esfera: e.target.value }))} /></div>
        <div className={styles.field}><label>OD Cilindro</label><input type="number" step="0.25" value={form.refraccion_od_cilindro} onChange={(e) => setForm((p) => ({ ...p, refraccion_od_cilindro: e.target.value }))} /></div>
        <div className={styles.field}><label>OD Eje</label><input type="number" value={form.refraccion_od_eje} onChange={(e) => setForm((p) => ({ ...p, refraccion_od_eje: e.target.value }))} /></div>
        <div className={styles.field}><label>OI Esfera</label><input type="number" step="0.25" value={form.refraccion_oi_esfera} onChange={(e) => setForm((p) => ({ ...p, refraccion_oi_esfera: e.target.value }))} /></div>
        <div className={styles.field}><label>OI Cilindro</label><input type="number" step="0.25" value={form.refraccion_oi_cilindro} onChange={(e) => setForm((p) => ({ ...p, refraccion_oi_cilindro: e.target.value }))} /></div>
        <div className={styles.field}><label>OI Eje</label><input type="number" value={form.refraccion_oi_eje} onChange={(e) => setForm((p) => ({ ...p, refraccion_oi_eje: e.target.value }))} /></div>
        <div className={styles.field}><label>Agudeza visual SC</label><input placeholder="20/40" value={form.agudeza_visual_sc} onChange={(e) => setForm((p) => ({ ...p, agudeza_visual_sc: e.target.value }))} /></div>
        <div className={styles.field}><label>Agudeza visual CC</label><input placeholder="20/20" value={form.agudeza_visual_cc} onChange={(e) => setForm((p) => ({ ...p, agudeza_visual_cc: e.target.value }))} /></div>
              </div>

              <h3 className={styles.subtitle}>Diagnóstico y plan</h3>
              <div className={styles.grid2}>
        <div className={styles.field}><label>Motivo consulta</label><textarea value={form.motivo_consulta} onChange={(e) => setForm((p) => ({ ...p, motivo_consulta: e.target.value }))} /></div>
        <div className={styles.field}><label>Anamnesis</label><textarea value={form.anamnesis} onChange={(e) => setForm((p) => ({ ...p, anamnesis: e.target.value }))} /></div>
        <div className={styles.field}><label>Hallazgos</label><textarea value={form.hallazgos} onChange={(e) => setForm((p) => ({ ...p, hallazgos: e.target.value }))} /></div>
        <div className={styles.field}><label>Diagnóstico principal</label><textarea value={form.diagnostico} onChange={(e) => setForm((p) => ({ ...p, diagnostico: e.target.value }))} /></div>
        <div className={styles.field}><label>Diagnóstico secundario</label><textarea value={form.diagnostico_secundario} onChange={(e) => setForm((p) => ({ ...p, diagnostico_secundario: e.target.value }))} /></div>
        <div className={styles.field}><label>Código CIE10</label><input value={form.codigo_cie10} onChange={(e) => setForm((p) => ({ ...p, codigo_cie10: e.target.value }))} /></div>
        <div className={styles.field}><label>Plan de tratamiento</label><textarea value={form.plan_tratamiento} onChange={(e) => setForm((p) => ({ ...p, plan_tratamiento: e.target.value }))} /></div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={() => setIsCreateOpen(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={loading || saving || !canManageConsultas || !canSubmitConsulta}>Guardar consulta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableWrap} style={{ marginTop: '1rem' }}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Cita</th><th>Paciente</th><th>Especialista</th><th>Diagnóstico</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6}>Cargando...</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id_consulta}>
                <td>{r.id_consulta}</td>
                <td>{r.id_cita}</td>
                <td>{r.id_paciente}</td>
                <td>{r.id_especialista}</td>
                <td>{r.diagnostico || '-'}</td>
                <td>{new Date(r.fecha_creacion).toLocaleString('es-BO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
