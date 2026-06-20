'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule } from '@/lib/authorization';
import styles from './page.module.css';

type PacienteAtendido = {
  id_paciente: number;
  paciente: string;
  documento_identidad: string;
  total_consultas: number;
  primera_atencion: string | null;
  ultima_atencion: string | null;
};
type CitaPorEstado = { fecha: string | null; estado: string; total: number };
type ConsultaEspecialista = { id_especialista: number; especialista: string; especialidad: string; total_consultas: number };
type ReportRes<T> = { periodo: { tipo: string; desde: string; hasta: string }; summary: Record<string, number>; items: T[] };
type SortDir = 'asc' | 'desc';

type PacCols = 'id_paciente' | 'paciente' | 'documento_identidad' | 'total_consultas' | 'primera_atencion' | 'ultima_atencion';
type CitCols = 'fecha' | 'estado' | 'total';
type EspCols = 'id_especialista' | 'especialista' | 'especialidad' | 'total_consultas';

type Prefs = {
  pacientes: { q: string; sortBy: keyof PacienteAtendido; dir: SortDir; page: number; pageSize: number; cols: PacCols[] };
  citas: { q: string; sortBy: keyof CitaPorEstado; dir: SortDir; page: number; pageSize: number; cols: CitCols[] };
  especialistas: { q: string; sortBy: keyof ConsultaEspecialista; dir: SortDir; page: number; pageSize: number; cols: EspCols[] };
};

const DEFAULT_PREFS: Prefs = {
  pacientes: {
    q: '', sortBy: 'paciente', dir: 'asc', page: 1, pageSize: 10,
    cols: ['id_paciente', 'paciente', 'documento_identidad', 'total_consultas', 'primera_atencion', 'ultima_atencion'],
  },
  citas: { q: '', sortBy: 'fecha', dir: 'asc', page: 1, pageSize: 10, cols: ['fecha', 'estado', 'total'] },
  especialistas: { q: '', sortBy: 'especialista', dir: 'asc', page: 1, pageSize: 10, cols: ['id_especialista', 'especialista', 'especialidad', 'total_consultas'] },
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function fmtDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
function normalize(v: unknown): string { return v == null ? '' : String(v).toLowerCase(); }
function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } }).response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && typeof d.detail === 'string') return d.detail;
  return 'No se pudo cargar reportes.';
}
function fmtDateTime(value: string | null): string {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(dt);
}
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const p = Math.max(1, page);
  const start = (p - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default function ReportesPage() {
  const { me, permissionCodes } = useDashboardUser();
  const canView = canViewClinicalModule(me, 'reportes', permissionCodes);
  const prefsKey = `reportes:prefs:${me?.id ?? 'anon'}`;

  const now = new Date();
  const [dateFrom, setDateFrom] = useState(fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [dateTo, setDateTo] = useState(fmtDateInput(now));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  const [rp1, setRp1] = useState<ReportRes<PacienteAtendido> | null>(null);
  const [rp2, setRp2] = useState<ReportRes<CitaPorEstado> | null>(null);
  const [rp3, setRp3] = useState<ReportRes<ConsultaEspecialista> | null>(null);

  useEffect(() => {
    if (!me) return;
    try {
      const raw = window.localStorage.getItem(prefsKey);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch { /* noop */ }
  }, [me, prefsKey]);

  useEffect(() => {
    if (!me) return;
    window.localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [prefs, me, prefsKey]);

  async function load() {
    if (!canView) return setErr('No tienes permiso para ver reportes.');
    setLoading(true); setErr(null);
    const q = `?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`;
    try {
      const [a, b, c] = await Promise.all([
        api.get<ReportRes<PacienteAtendido>>(`/api/reportes/pacientes-atendidos${q}`),
        api.get<ReportRes<CitaPorEstado>>(`/api/reportes/citas-por-periodo${q}`),
        api.get<ReportRes<ConsultaEspecialista>>(`/api/reportes/consultas-por-especialista${q}`),
      ]);
      setRp1(a.data); setRp2(b.data); setRp3(c.data);
    } catch (e) { setErr(apiErr(e)); } finally { setLoading(false); }
  }

  const pacientesFiltered = useMemo(() => {
    const base = [...(rp1?.items ?? [])];
    const filtered = prefs.pacientes.q ? base.filter((it) => Object.values(it).some((v) => normalize(v).includes(normalize(prefs.pacientes.q)))) : base;
    filtered.sort((a, b) => {
      const av = a[prefs.pacientes.sortBy]; const bv = b[prefs.pacientes.sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return prefs.pacientes.dir === 'asc' ? av - bv : bv - av;
      const cmp = normalize(av).localeCompare(normalize(bv), 'es');
      return prefs.pacientes.dir === 'asc' ? cmp : -cmp;
    });
    return filtered;
  }, [rp1?.items, prefs.pacientes]);
  const citasFiltered = useMemo(() => {
    const base = [...(rp2?.items ?? [])];
    const filtered = prefs.citas.q ? base.filter((it) => Object.values(it).some((v) => normalize(v).includes(normalize(prefs.citas.q)))) : base;
    filtered.sort((a, b) => {
      const av = a[prefs.citas.sortBy]; const bv = b[prefs.citas.sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return prefs.citas.dir === 'asc' ? av - bv : bv - av;
      const cmp = normalize(av).localeCompare(normalize(bv), 'es');
      return prefs.citas.dir === 'asc' ? cmp : -cmp;
    });
    return filtered;
  }, [rp2?.items, prefs.citas]);
  const especialistasFiltered = useMemo(() => {
    const base = [...(rp3?.items ?? [])];
    const filtered = prefs.especialistas.q ? base.filter((it) => Object.values(it).some((v) => normalize(v).includes(normalize(prefs.especialistas.q)))) : base;
    filtered.sort((a, b) => {
      const av = a[prefs.especialistas.sortBy]; const bv = b[prefs.especialistas.sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return prefs.especialistas.dir === 'asc' ? av - bv : bv - av;
      const cmp = normalize(av).localeCompare(normalize(bv), 'es');
      return prefs.especialistas.dir === 'asc' ? cmp : -cmp;
    });
    return filtered;
  }, [rp3?.items, prefs.especialistas]);

  const pacientesView = useMemo(() => paginate(pacientesFiltered, prefs.pacientes.page, prefs.pacientes.pageSize), [pacientesFiltered, prefs.pacientes.page, prefs.pacientes.pageSize]);
  const citasView = useMemo(() => paginate(citasFiltered, prefs.citas.page, prefs.citas.pageSize), [citasFiltered, prefs.citas.page, prefs.citas.pageSize]);
  const especialistasView = useMemo(() => paginate(especialistasFiltered, prefs.especialistas.page, prefs.especialistas.pageSize), [especialistasFiltered, prefs.especialistas.page, prefs.especialistas.pageSize]);

  async function exportReport(kind: 'pacientes-atendidos' | 'citas-por-periodo' | 'consultas-por-especialista', format: 'csv' | 'xlsx' | 'pdf') {
    const st = kind === 'pacientes-atendidos' ? prefs.pacientes : kind === 'citas-por-periodo' ? prefs.citas : prefs.especialistas;
    const q = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      file_format: format,
      q: st.q,
      sort_by: String(st.sortBy),
      sort_dir: st.dir,
    });
    const res = await api.get(`/api/reportes/${kind}/export?${q.toString()}`, { responseType: 'blob' });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kind}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  return (
    <>
      <div className={styles.pageHeader}><h1 className={styles.title}>Reportes</h1><p className={styles.muted}>Pacientes atendidos, citas por período (fecha a fecha) y consultas por médico.</p></div>
      {err && <div className={styles.err}>{err}</div>}
      <div className={styles.toolbar}>
        <div className={styles.field}><label>Desde</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
        <div className={styles.field}><label>Hasta</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
        <div className={styles.actions}><button type="button" className={styles.btnPrimary} onClick={() => void load()} disabled={loading || !canView}>{loading ? 'Generando...' : 'Generar reportes'}</button></div>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}><h3 className={styles.sectionTitle}>Pacientes atendidos</h3><div className={styles.actions}><button className={styles.btnGhost} onClick={() => void exportReport('pacientes-atendidos', 'csv')}>CSV</button><button className={styles.btnGhost} onClick={() => void exportReport('pacientes-atendidos', 'xlsx')}>Excel</button><button className={styles.btnGhost} onClick={() => void exportReport('pacientes-atendidos', 'pdf')}>PDF</button></div></div>
        <div className={styles.sectionBody}>
          <p className={styles.summary}>Total pacientes: {pacientesFiltered.length}</p>
          <div className={styles.sectionFilters}>
            <input value={prefs.pacientes.q} onChange={(e) => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, q: e.target.value, page: 1 } }))} placeholder="Buscar paciente/documento..." />
            <select value={prefs.pacientes.sortBy} onChange={(e) => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, sortBy: e.target.value as keyof PacienteAtendido } }))}><option value="paciente">Paciente</option><option value="documento_identidad">Documento</option><option value="total_consultas">Total consultas</option><option value="primera_atencion">Primera atención</option><option value="ultima_atencion">Última atención</option></select>
            <select value={prefs.pacientes.dir} onChange={(e) => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, dir: e.target.value as SortDir } }))}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select>
            <select value={prefs.pacientes.pageSize} onChange={(e) => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, pageSize: Number(e.target.value), page: 1 } }))}>{PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} por página</option>)}</select>
          </div>
          <details className={styles.columnsBox}><summary>Columnas visibles</summary><div className={styles.columnsGrid}>{(['id_paciente', 'paciente', 'documento_identidad', 'total_consultas', 'primera_atencion', 'ultima_atencion'] as PacCols[]).map((col) => (<label key={col}><input type="checkbox" checked={prefs.pacientes.cols.includes(col)} onChange={() => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, cols: p.pacientes.cols.includes(col) ? p.pacientes.cols.filter((c) => c !== col) : [...p.pacientes.cols, col] } }))} /> {col}</label>))}</div></details>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr>{prefs.pacientes.cols.includes('id_paciente') && <th>ID</th>}{prefs.pacientes.cols.includes('paciente') && <th>Paciente</th>}{prefs.pacientes.cols.includes('documento_identidad') && <th>Documento</th>}{prefs.pacientes.cols.includes('total_consultas') && <th>Total consultas</th>}{prefs.pacientes.cols.includes('primera_atencion') && <th>Primera atención</th>}{prefs.pacientes.cols.includes('ultima_atencion') && <th>Última atención</th>}</tr></thead><tbody>{pacientesView.map((item) => (<tr key={`${item.id_paciente}-${item.documento_identidad}`}>{prefs.pacientes.cols.includes('id_paciente') && <td>{item.id_paciente}</td>}{prefs.pacientes.cols.includes('paciente') && <td>{item.paciente}</td>}{prefs.pacientes.cols.includes('documento_identidad') && <td>{item.documento_identidad}</td>}{prefs.pacientes.cols.includes('total_consultas') && <td>{item.total_consultas}</td>}{prefs.pacientes.cols.includes('primera_atencion') && <td>{fmtDateTime(item.primera_atencion)}</td>}{prefs.pacientes.cols.includes('ultima_atencion') && <td>{fmtDateTime(item.ultima_atencion)}</td>}</tr>))}</tbody></table></div>
          <div className={styles.pagination}><button className={styles.btnGhost} disabled={prefs.pacientes.page <= 1} onClick={() => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, page: p.pacientes.page - 1 } }))}>Anterior</button><span>Página {prefs.pacientes.page} de {Math.max(1, Math.ceil(pacientesFiltered.length / prefs.pacientes.pageSize))}</span><button className={styles.btnGhost} disabled={prefs.pacientes.page >= Math.max(1, Math.ceil(pacientesFiltered.length / prefs.pacientes.pageSize))} onClick={() => setPrefs((p) => ({ ...p, pacientes: { ...p.pacientes, page: p.pacientes.page + 1 } }))}>Siguiente</button></div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}><h3 className={styles.sectionTitle}>Citas por período</h3><div className={styles.actions}><button className={styles.btnGhost} onClick={() => void exportReport('citas-por-periodo', 'csv')}>CSV</button><button className={styles.btnGhost} onClick={() => void exportReport('citas-por-periodo', 'xlsx')}>Excel</button><button className={styles.btnGhost} onClick={() => void exportReport('citas-por-periodo', 'pdf')}>PDF</button></div></div>
        <div className={styles.sectionBody}>
          <p className={styles.summary}>Total filas: {citasFiltered.length}</p>
          <div className={styles.sectionFilters}><input value={prefs.citas.q} onChange={(e) => setPrefs((p) => ({ ...p, citas: { ...p.citas, q: e.target.value, page: 1 } }))} placeholder="Buscar fecha, estado o total..." /><select value={prefs.citas.sortBy} onChange={(e) => setPrefs((p) => ({ ...p, citas: { ...p.citas, sortBy: e.target.value as keyof CitaPorEstado } }))}><option value="fecha">Fecha</option><option value="estado">Estado</option><option value="total">Total</option></select><select value={prefs.citas.dir} onChange={(e) => setPrefs((p) => ({ ...p, citas: { ...p.citas, dir: e.target.value as SortDir } }))}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select><select value={prefs.citas.pageSize} onChange={(e) => setPrefs((p) => ({ ...p, citas: { ...p.citas, pageSize: Number(e.target.value), page: 1 } }))}>{PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} por página</option>)}</select></div>
          <details className={styles.columnsBox}><summary>Columnas visibles</summary><div className={styles.columnsGrid}>{(['fecha', 'estado', 'total'] as CitCols[]).map((col) => (<label key={col}><input type="checkbox" checked={prefs.citas.cols.includes(col)} onChange={() => setPrefs((p) => ({ ...p, citas: { ...p.citas, cols: p.citas.cols.includes(col) ? p.citas.cols.filter((c) => c !== col) : [...p.citas.cols, col] } }))} /> {col}</label>))}</div></details>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr>{prefs.citas.cols.includes('fecha') && <th>Fecha</th>}{prefs.citas.cols.includes('estado') && <th>Estado</th>}{prefs.citas.cols.includes('total') && <th>Total</th>}</tr></thead><tbody>{citasView.map((item, idx) => (<tr key={`${item.fecha ?? 'sf'}-${item.estado}-${idx}`}>{prefs.citas.cols.includes('fecha') && <td>{item.fecha ?? '—'}</td>}{prefs.citas.cols.includes('estado') && <td>{item.estado}</td>}{prefs.citas.cols.includes('total') && <td>{item.total}</td>}</tr>))}</tbody></table></div>
          <div className={styles.pagination}><button className={styles.btnGhost} disabled={prefs.citas.page <= 1} onClick={() => setPrefs((p) => ({ ...p, citas: { ...p.citas, page: p.citas.page - 1 } }))}>Anterior</button><span>Página {prefs.citas.page} de {Math.max(1, Math.ceil(citasFiltered.length / prefs.citas.pageSize))}</span><button className={styles.btnGhost} disabled={prefs.citas.page >= Math.max(1, Math.ceil(citasFiltered.length / prefs.citas.pageSize))} onClick={() => setPrefs((p) => ({ ...p, citas: { ...p.citas, page: p.citas.page + 1 } }))}>Siguiente</button></div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}><h3 className={styles.sectionTitle}>Consultas por médico</h3><div className={styles.actions}><button className={styles.btnGhost} onClick={() => void exportReport('consultas-por-especialista', 'csv')}>CSV</button><button className={styles.btnGhost} onClick={() => void exportReport('consultas-por-especialista', 'xlsx')}>Excel</button><button className={styles.btnGhost} onClick={() => void exportReport('consultas-por-especialista', 'pdf')}>PDF</button></div></div>
        <div className={styles.sectionBody}>
          <p className={styles.summary}>Total filas: {especialistasFiltered.length}</p>
          <div className={styles.sectionFilters}><input value={prefs.especialistas.q} onChange={(e) => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, q: e.target.value, page: 1 } }))} placeholder="Buscar especialista/especialidad..." /><select value={prefs.especialistas.sortBy} onChange={(e) => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, sortBy: e.target.value as keyof ConsultaEspecialista } }))}><option value="especialista">Especialista</option><option value="especialidad">Especialidad</option><option value="total_consultas">Total consultas</option><option value="id_especialista">ID especialista</option></select><select value={prefs.especialistas.dir} onChange={(e) => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, dir: e.target.value as SortDir } }))}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select><select value={prefs.especialistas.pageSize} onChange={(e) => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, pageSize: Number(e.target.value), page: 1 } }))}>{PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} por página</option>)}</select></div>
          <details className={styles.columnsBox}><summary>Columnas visibles</summary><div className={styles.columnsGrid}>{(['id_especialista', 'especialista', 'especialidad', 'total_consultas'] as EspCols[]).map((col) => (<label key={col}><input type="checkbox" checked={prefs.especialistas.cols.includes(col)} onChange={() => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, cols: p.especialistas.cols.includes(col) ? p.especialistas.cols.filter((c) => c !== col) : [...p.especialistas.cols, col] } }))} /> {col}</label>))}</div></details>
          <div className={styles.tableWrap}><table className={styles.table}><thead><tr>{prefs.especialistas.cols.includes('id_especialista') && <th>ID especialista</th>}{prefs.especialistas.cols.includes('especialista') && <th>Especialista</th>}{prefs.especialistas.cols.includes('especialidad') && <th>Especialidad</th>}{prefs.especialistas.cols.includes('total_consultas') && <th>Total consultas</th>}</tr></thead><tbody>{especialistasView.map((item) => (<tr key={item.id_especialista}>{prefs.especialistas.cols.includes('id_especialista') && <td>{item.id_especialista}</td>}{prefs.especialistas.cols.includes('especialista') && <td>{item.especialista}</td>}{prefs.especialistas.cols.includes('especialidad') && <td>{item.especialidad}</td>}{prefs.especialistas.cols.includes('total_consultas') && <td>{item.total_consultas}</td>}</tr>))}</tbody></table></div>
          <div className={styles.pagination}><button className={styles.btnGhost} disabled={prefs.especialistas.page <= 1} onClick={() => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, page: p.especialistas.page - 1 } }))}>Anterior</button><span>Página {prefs.especialistas.page} de {Math.max(1, Math.ceil(especialistasFiltered.length / prefs.especialistas.pageSize))}</span><button className={styles.btnGhost} disabled={prefs.especialistas.page >= Math.max(1, Math.ceil(especialistasFiltered.length / prefs.especialistas.pageSize))} onClick={() => setPrefs((p) => ({ ...p, especialistas: { ...p.especialistas, page: p.especialistas.page + 1 } }))}>Siguiente</button></div>
        </div>
      </section>
    </>
  );
}
