'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteModule } from '@/lib/authorization';
import styles from './page.module.css';

interface HistorialRow {
  id_historial: number;
  id_paciente: number;
  estado: 'ACTIVO' | 'ARCHIVADO';
  motivo_archivo: string | null;
  archivado_por: number | null;
  fecha_archivo: string | null;
  registrado_por: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface ApiPage<T> {
  count: number;
  results: T[];
}

type FilterEstado = 'ACTIVO' | 'ARCHIVADO' | '';
type ModalKind = 'archivar' | null;

const PAGE_SIZE = 20;

function parseApiError(error: unknown): string {
  const ax = error as {
    response?: {
      data?: Record<string, unknown> | string;
    };
  };
  const data = ax.response?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.error === 'string') return data.error;
    const values = Object.values(data).flat();
    const firstText = values.find((value) => typeof value === 'string');
    if (typeof firstText === 'string') return firstText;
  }
  return 'No se pudo completar la operación.';
}

export default function HistorialClinicoPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [rows, setRows] = useState<HistorialRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [filterEstado, setFilterEstado] = useState<FilterEstado>('');

  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [motivoArchivo, setMotivoArchivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const canView = canViewClinicalModule(me, 'historialclinico', permissionCodes);
  const canWrite = canWriteModule(me, 'historialclinico', permissionCodes);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (filterEstado) params.set('estado', filterEstado);
    return params.toString();
  }, [page, filterEstado]);

  const load = useCallback(async () => {
    if (!canView) {
      setRows([]);
      setCount(0);
      setError('No tienes permiso para ver el módulo de historial clínico.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiPage<HistorialRow>>(`/api/historial-clinico?${query}`);
      setRows(res.data.results ?? []);
      setCount(res.data.count ?? 0);
    } catch (e) {
      setError(
        (e as { response?: { status?: number } }).response?.status === 403
          ? 'No tienes permiso para gestionar el historial clínico.'
          : 'No se pudo cargar el módulo de historial clínico.'
      );
    } finally {
      setLoading(false);
    }
  }, [canView, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const totalActivos = rows.filter((r) => r.estado === 'ACTIVO').length;
  const totalArchivados = rows.filter((r) => r.estado === 'ARCHIVADO').length;

  function closeModal() {
    setModal(null);
    setSelectedId(null);
    setMotivoArchivo('');
    setFormErr(null);
    setSaving(false);
  }

  function openArchivar(id: number) {
    if (!canWrite) {
      setError('No tienes permiso para archivar historiales clínicos.');
      return;
    }
    setError(null);
    setOk(null);
    setFormErr(null);
    setMotivoArchivo('');
    setSelectedId(id);
    setModal('archivar');
  }

  async function submitArchivar() {
    if (!selectedId) return;
    if (!motivoArchivo.trim()) {
      setFormErr('El motivo de archivo es obligatorio.');
      return;
    }
    setSaving(true);
    setFormErr(null);
    try {
      await api.post(`/api/historial-clinico/${selectedId}/archivar`, {
        motivo_archivo: motivoArchivo.trim(),
      });
      setOk('Historial clínico archivado correctamente.');
      closeModal();
      await load();
    } catch (e) {
      setFormErr(parseApiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function restaurar(row: HistorialRow) {
    if (!canWrite) {
      setError('No tienes permiso para restaurar historiales clínicos.');
      return;
    }
    if (!window.confirm(`¿Restaurar historial clínico #${row.id_historial}?`)) return;
    setError(null);
    setOk(null);
    try {
      await api.post(`/api/historial-clinico/${row.id_historial}/restaurar`, {});
      setOk('Historial clínico restaurado correctamente.');
      await load();
    } catch (e) {
      setError(parseApiError(e));
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Historial clínico</h1>
        <p className={styles.subtitle}>
          Consulta y gestión de historiales clínicos del sistema SI1.
        </p>
      </header>

      <div className={styles.heroBand}>
        <div className={styles.heroContent}>
          <p className={styles.subtitle}>Módulo clínico conectado al backend real con filtros y trazabilidad básica.</p>
          <div className={styles.kpiRow}>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>En página</span>
              <strong className={styles.kpiValue}>{rows.length}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Activos</span>
              <strong className={styles.kpiValue}>{totalActivos}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Archivados</span>
              <strong className={styles.kpiValue}>{totalArchivados}</strong>
            </article>
          </div>
        </div>
      </div>

      {!canWrite && (
        <div className={styles.error}>
          Tu rol es de solo lectura en Historial clínico. Puedes consultar y filtrar, pero no archivar ni restaurar.
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="estado">Estado</label>
          <select
            id="estado"
            className={styles.select}
            value={filterEstado}
            onChange={(e) => {
              setPage(1);
              setFilterEstado(e.target.value as FilterEstado);
            }}
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="ARCHIVADO">Archivado</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => load()} disabled={loading}>
            Recargar
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Paciente ID</th>
              <th>Estado</th>
              <th>Fecha archivo</th>
              <th>Motivo archivo</th>
              <th>Fecha creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Cargando historial clínico...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7}>No hay resultados para esos filtros.</td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.id_historial}>
                <td>{row.id_historial}</td>
                <td>{row.id_paciente}</td>
                <td>
                  <span className={`${styles.badge} ${row.estado === 'ACTIVO' ? styles.badgeActive : styles.badgeInactive}`}>
                    {row.estado}
                  </span>
                </td>
                <td>{row.fecha_archivo ?? '-'}</td>
                <td>
                  {row.motivo_archivo
                    ? row.motivo_archivo.length > 40
                      ? `${row.motivo_archivo.slice(0, 40)}…`
                      : row.motivo_archivo
                    : '-'}
                </td>
                <td>{row.fecha_creacion}</td>
                <td>
                  <div className={styles.tableActions}>
                    {row.estado === 'ACTIVO' && canWrite && (
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={() => openArchivar(row.id_historial)}
                      >
                        Archivar
                      </button>
                    )}
                    {row.estado === 'ARCHIVADO' && canWrite && (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => restaurar(row)}
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pager}>
        <p className={styles.pagerText}>Página {page} de {totalPages} · Total {count}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Anterior
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Siguiente
          </button>
        </div>
      </div>

      {modal === 'archivar' && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={closeModal}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Archivar historial clínico"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Archivar historial clínico</h2>
            {formErr && <div className={styles.error}>{formErr}</div>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitArchivar();
              }}
            >
              <div className={styles.field}>
                <label className={styles.label} htmlFor="motivo_archivo">Motivo del archivo</label>
                <textarea
                  id="motivo_archivo"
                  className={styles.textarea}
                  placeholder="Motivo del archivo..."
                  value={motivoArchivo}
                  onChange={(e) => setMotivoArchivo(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnGhost} onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Archivando...' : 'Archivar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
