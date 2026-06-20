'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule } from '@/lib/authorization';
import styles from './page.module.css';

interface SummaryRes {
  periodo: { tipo: string; desde: string; hasta: string };
  headline: {
    pacientes_activos: number;
    citas_mes_total: number;
    citas_atendidas: number;
    citas_canceladas: number;
    cancelacion_pct: number;
    atencion_pct: number;
  };
  distribucion_estados: { estado: string; total: number }[];
  tactico: { reprogramadas_mes: number; canceladas_mes: number };
}

interface OperativoRes {
  periodo: { tipo: string; desde: string; hasta: string };
  operativo: {
    citas_hoy_total: number;
    programadas_hoy: number;
    atendidas_hoy: number;
    canceladas_hoy: number;
  };
  por_especialista: {
    id_especialista: number;
    id_especialista__id_usuario__nombres: string;
    id_especialista__id_usuario__apellidos: string;
    total: number;
    atendidas: number;
    canceladas: number;
  }[];
  alertas: { nivel: 'info' | 'warning'; mensaje: string }[];
}

interface DrilldownRes {
  count: number;
  page: number;
  page_size: number;
  results: {
    id_cita: number;
    fecha_hora_inicio: string;
    estado: string;
    motivo: string;
    paciente: string;
    especialista: string;
  }[];
}

type PresetPeriod = 'today' | '7d' | '30d' | 'month' | 'custom';

function fmtDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getPresetDates(preset: PresetPeriod): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') {
    const v = fmtDateInput(today);
    return { from: v, to: v };
  }
  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: fmtDateInput(from), to: fmtDateInput(today) };
  }
  if (preset === '30d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: fmtDateInput(from), to: fmtDateInput(today) };
  }
  if (preset === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmtDateInput(from), to: fmtDateInput(today) };
  }
  return { from: '', to: '' };
}

function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } }).response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && typeof d.detail === 'string') return d.detail;
  return 'No se pudo cargar el dashboard.';
}

export default function DashboardAnalyticsPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [summary, setSummary] = useState<SummaryRes | null>(null);
  const [operativo, setOperativo] = useState<OperativoRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoDrill, setEstadoDrill] = useState<string>('');
  const [drill, setDrill] = useState<DrilldownRes | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [preset, setPreset] = useState<PresetPeriod>('month');
  const [drillPage, setDrillPage] = useState(1);
  const drillPageSize = 10;
  const canViewDashboard = canViewClinicalModule(me, 'dashboard', permissionCodes);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!canViewDashboard) {
        setSummary(null);
        setOperativo(null);
        setDrill(null);
        setError('No tienes permiso para ver el dashboard.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (dateFrom && dateTo) {
          params.set('date_from', dateFrom);
          params.set('date_to', dateTo);
        }
        const query = params.toString() ? `?${params.toString()}` : '';

        const [s, o, d] = await Promise.all([
          api.get<SummaryRes>(`/api/dashboard/summary${query}`),
          api.get<OperativoRes>(`/api/dashboard/operativo${query}`),
          api.get<DrilldownRes>(`/api/dashboard/citas-drilldown${query}&page=1&page_size=${drillPageSize}`),
        ]);
        if (!mounted) return;
        setSummary(s.data);
        setOperativo(o.data);
        setDrill(d.data);
      } catch (e) {
        if (!mounted) return;
        setError(apiErr(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [canViewDashboard, dateFrom, dateTo]);

  useEffect(() => {
    let mounted = true;
    async function loadDrill() {
      const params = new URLSearchParams();
      if (dateFrom && dateTo) {
        params.set('date_from', dateFrom);
        params.set('date_to', dateTo);
      }
      if (estadoDrill) params.set('estado', estadoDrill);
      params.set('page', String(drillPage));
      params.set('page_size', String(drillPageSize));
      const query = params.toString() ? `?${params.toString()}` : '';
      try {
        const res = await api.get<DrilldownRes>(`/api/dashboard/citas-drilldown${query}`);
        if (mounted) setDrill(res.data);
      } catch {
        if (mounted) setDrill({ count: 0, page: 1, page_size: drillPageSize, results: [] });
      }
    }
    loadDrill();
    return () => {
      mounted = false;
    };
  }, [canViewDashboard, estadoDrill, dateFrom, dateTo, drillPage]);

  useEffect(() => {
    const { from, to } = getPresetDates(preset);
    setDateFrom(from);
    setDateTo(to);
    setDrillPage(1);
  }, [preset]);

  async function handleExportCsv() {
    const params = new URLSearchParams();
    if (dateFrom && dateTo) {
      params.set('date_from', dateFrom);
      params.set('date_to', dateTo);
    }
    if (estadoDrill) params.set('estado', estadoDrill);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await api.get(`/api/dashboard/citas-drilldown/export${query}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'dashboard-citas-drilldown.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Dashboard clínico</h1>
        <p className={styles.muted}>Vista estratégica, táctica y operativa para decisiones del día a día.</p>
        <div className={styles.filters}>
          <div className={styles.presets}>
            <button type="button" className={preset === 'today' ? styles.presetActive : styles.presetBtn} onClick={() => setPreset('today')}>Hoy</button>
            <button type="button" className={preset === '7d' ? styles.presetActive : styles.presetBtn} onClick={() => setPreset('7d')}>7d</button>
            <button type="button" className={preset === '30d' ? styles.presetActive : styles.presetBtn} onClick={() => setPreset('30d')}>30d</button>
            <button type="button" className={preset === 'month' ? styles.presetActive : styles.presetBtn} onClick={() => setPreset('month')}>Mes</button>
          </div>
          <div className={styles.field}>
            <label htmlFor="dateFrom">Desde</label>
            <input id="dateFrom" type="date" value={dateFrom} onChange={(e) => { setPreset('custom'); setDateFrom(e.target.value); setDrillPage(1); }} />
          </div>
          <div className={styles.field}>
            <label htmlFor="dateTo">Hasta</label>
            <input id="dateTo" type="date" value={dateTo} onChange={(e) => { setPreset('custom'); setDateTo(e.target.value); setDrillPage(1); }} />
          </div>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setPreset('month');
              setEstadoDrill('');
              setDrillPage(1);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loader}>Cargando métricas...</div>}

      {!loading && summary && operativo && (
        <>
          <div className={styles.kpiGrid}>
            <article className={styles.card}>
              <span className={styles.label}>Pacientes activos</span>
              <p className={styles.value}>{summary.headline.pacientes_activos}</p>
            </article>
            <article className={styles.card}>
              <span className={styles.label}>Citas del mes</span>
              <p className={styles.value}>{summary.headline.citas_mes_total}</p>
              <p className={styles.subtle}>Atención {summary.headline.atencion_pct}%</p>
            </article>
            <article className={styles.card}>
              <span className={styles.label}>Atendidas</span>
              <p className={styles.value}>{summary.headline.citas_atendidas}</p>
            </article>
            <article className={styles.card}>
              <span className={styles.label}>Cancelación</span>
              <p className={styles.value}>{summary.headline.cancelacion_pct}%</p>
              <p className={styles.subtle}>{summary.headline.citas_canceladas} canceladas en el mes</p>
            </article>
          </div>

          <div className={styles.mainGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Distribución mensual de estados</h2>
                <div className={styles.chips}>
                  <span className={styles.chip}>Reprogramadas: {summary.tactico.reprogramadas_mes}</span>
                  <span className={styles.chip}>Canceladas: {summary.tactico.canceladas_mes}</span>
                </div>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.distribucion_estados.map((row) => (
                        <tr key={row.estado}>
                          <td>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => {
                                setEstadoDrill((prev) => (prev === row.estado ? '' : row.estado));
                                setDrillPage(1);
                              }}
                            >
                              {row.estado}
                            </button>
                          </td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Operativo de hoy</h2>
                <span className={styles.chip}>{new Date(operativo.periodo.desde).toLocaleDateString('es-BO')}</span>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.chips}>
                  <span className={styles.chip}>Total: {operativo.operativo.citas_hoy_total}</span>
                  <span className={styles.chip}>Programadas: {operativo.operativo.programadas_hoy}</span>
                  <span className={styles.chip}>Atendidas: {operativo.operativo.atendidas_hoy}</span>
                  <span className={styles.chip}>Canceladas: {operativo.operativo.canceladas_hoy}</span>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Carga por especialista (hoy)</h2>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Especialista</th>
                        <th>Total</th>
                        <th>Atendidas</th>
                        <th>Canceladas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativo.por_especialista.length === 0 && (
                        <tr>
                          <td colSpan={4}>Sin registros para hoy.</td>
                        </tr>
                      )}
                      {operativo.por_especialista.map((row) => (
                        <tr key={row.id_especialista}>
                          <td>{row.id_especialista__id_usuario__apellidos}, {row.id_especialista__id_usuario__nombres}</td>
                          <td>{row.total}</td>
                          <td>{row.atendidas}</td>
                          <td>{row.canceladas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Alertas</h2>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.alerts}>
                  {operativo.alertas.length === 0 && <div className={`${styles.alert} ${styles.info}`}>Sin alertas críticas hoy.</div>}
                  {operativo.alertas.map((a, idx) => (
                    <div key={`${a.nivel}-${idx}`} className={`${styles.alert} ${a.nivel === 'warning' ? styles.warning : styles.info}`}>
                      {a.nivel === 'warning' ? '🟡' : '🔵'} {a.mensaje}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Drilldown de citas {estadoDrill ? `(${estadoDrill})` : ''}</h2>
                <div className={styles.chips}>
                  <span className={styles.chip}>Total: {drill?.count ?? 0}</span>
                  <button type="button" className={styles.presetBtn} onClick={handleExportCsv}>Exportar CSV</button>
                </div>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Paciente</th>
                        <th>Especialista</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!drill || drill.results.length === 0 ? (
                        <tr>
                          <td colSpan={5}>Sin registros para este filtro.</td>
                        </tr>
                      ) : (
                        drill.results.map((r) => (
                          <tr key={r.id_cita}>
                            <td>{r.id_cita}</td>
                            <td>{new Date(r.fecha_hora_inicio).toLocaleString('es-BO')}</td>
                            <td>{r.estado}</td>
                            <td>{r.paciente}</td>
                            <td>{r.especialista}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={styles.pager}>
                  <button
                    type="button"
                    className={styles.resetBtn}
                    disabled={!drill || drillPage <= 1}
                    onClick={() => setDrillPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <span className={styles.pageText}>Página {drill?.page ?? 1}</span>
                  <button
                    type="button"
                    className={styles.resetBtn}
                    disabled={!drill || drill.results.length < drillPageSize}
                    onClick={() => setDrillPage((p) => p + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
