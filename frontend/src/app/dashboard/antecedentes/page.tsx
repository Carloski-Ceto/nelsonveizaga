'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteModule } from '@/lib/authorization';
import { ClipboardList, HeartPulse, Trash2, Edit2, PlusCircle } from 'lucide-react';
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
  paciente_nombre_completo?: string;
}

interface AntecedenteRow {
  id_antecedente: number;
  id_historial: number;
  tipo_antecedente: 'PATOLOGICO' | 'NO_PATOLOGICO' | 'FAMILIAR' | 'QUIRURGICO' | 'ALERGICO' | 'OTRO';
  descripcion: string;
  registrado_por: number;
  registrado_por_nombre?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface ApiPage<T> {
  count: number;
  results: T[];
}

const PAGE_SIZE = 10;

const TIPO_ANTECEDENTE_LABELS: Record<string, string> = {
  PATOLOGICO: 'Patológico',
  NO_PATOLOGICO: 'No Patológico',
  FAMILIAR: 'Familiar',
  QUIRURGICO: 'Quirúrgico',
  ALERGICO: 'Alérgico',
  OTRO: 'Otro',
};

const TIPO_ANTECEDENTE_BADGE_STYLE: Record<string, React.CSSProperties> = {
  PATOLOGICO: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2' },
  NO_PATOLOGICO: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  FAMILIAR: { background: '#ecfdf5', color: '#047857', border: '1px solid #d1fae5' },
  QUIRURGICO: { background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' },
  ALERGICO: { background: '#faf5ff', color: '#6d28d9', border: '1px solid #f3e8ff' },
  OTRO: { background: '#f9fafb', color: '#4b5563', border: '1px solid #f3f4f6' },
};

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

export default function AntecedentesPage() {
  const { me, permissionCodes } = useDashboardUser();
  
  // Sidebar states
  const [historiales, setHistoriales] = useState<HistorialRow[]>([]);
  const [historialesCount, setHistorialesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [historialesLoading, setHistorialesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Detail & list states
  const [selectedHistorial, setSelectedHistorial] = useState<HistorialRow | null>(null);
  const [antecedentes, setAntecedentes] = useState<AntecedenteRow[]>([]);
  const [antecedentesLoading, setAntecedentesLoading] = useState(false);
  const [antecedentesErr, setAntecedentesErr] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>('');

  // Form states
  const [nuevoAntecedente, setNuevoAntecedente] = useState({ tipo_antecedente: 'PATOLOGICO', descripcion: '' });
  const [editingAntId, setEditingAntId] = useState<number | null>(null);
  const [editingDesc, setEditingDesc] = useState('');
  const [savingAnt, setSavingAnt] = useState(false);

  const canView = canViewClinicalModule(me, 'antecedentes', permissionCodes);
  const canWrite = canWriteModule(me, 'antecedentes', permissionCodes);

  // Fetch Clinical Histories
  const loadHistoriales = useCallback(async () => {
    setHistorialesLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('estado', 'ACTIVO'); // Normally retrieve active histories for modification
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      
      const res = await api.get<ApiPage<HistorialRow>>(`/api/historial-clinico?${params.toString()}`);
      setHistoriales(res.data.results ?? []);
      setHistorialesCount(res.data.count ?? 0);
    } catch (e) {
      setError('No se pudieron cargar los historiales clínicos.');
    } finally {
      setHistorialesLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    if (canView) {
      void loadHistoriales();
    } else {
      setHistorialesLoading(false);
      setError('No tienes permiso para ver el módulo de antecedentes.');
    }
  }, [canView, loadHistoriales]);

  // Load antecedents of the selected clinical history
  const loadAntecedentes = useCallback(async (historialId: number, tipo?: string) => {
    setAntecedentesLoading(true);
    setAntecedentesErr(null);
    try {
      const params = new URLSearchParams();
      if (tipo) {
        params.set('tipo_antecedente', tipo);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<ApiPage<AntecedenteRow>>(`/api/historial-clinico/${historialId}/antecedentes${query}`);
      setAntecedentes(res.data.results ?? []);
    } catch (e) {
      setAntecedentesErr('No se pudieron cargar los antecedentes clínicos.');
    } finally {
      setAntecedentesLoading(false);
    }
  }, []);

  const handleSelectHistorial = (historial: HistorialRow) => {
    setSelectedHistorial(historial);
    setNuevoAntecedente({ tipo_antecedente: 'PATOLOGICO', descripcion: '' });
    setEditingAntId(null);
    setEditingDesc('');
    setFilterTipo('');
    setAntecedentesErr(null);
    setOk(null);
    void loadAntecedentes(historial.id_historial);
  };

  const handleFilterChange = (tipo: string) => {
    setFilterTipo(tipo);
    if (selectedHistorial) {
      void loadAntecedentes(selectedHistorial.id_historial, tipo);
    }
  };

  const submitNuevoAntecedente = async () => {
    if (!selectedHistorial) return;
    if (!nuevoAntecedente.descripcion.trim()) {
      setAntecedentesErr('La descripción del antecedente es obligatoria.');
      return;
    }
    setSavingAnt(true);
    setAntecedentesErr(null);
    setOk(null);
    try {
      await api.post(`/api/historial-clinico/${selectedHistorial.id_historial}/antecedentes`, {
        tipo_antecedente: nuevoAntecedente.tipo_antecedente,
        descripcion: nuevoAntecedente.descripcion.trim(),
      });
      setOk('Antecedente clínico registrado correctamente.');
      setNuevoAntecedente({ tipo_antecedente: 'PATOLOGICO', descripcion: '' });
      await loadAntecedentes(selectedHistorial.id_historial, filterTipo);
    } catch (e) {
      setAntecedentesErr(parseApiError(e));
    } finally {
      setSavingAnt(false);
    }
  };

  const startEditAnt = (ant: AntecedenteRow) => {
    setEditingAntId(ant.id_antecedente);
    setEditingDesc(ant.descripcion);
    setAntecedentesErr(null);
    setOk(null);
  };

  const cancelEditAnt = () => {
    setEditingAntId(null);
    setEditingDesc('');
  };

  const saveEditAnt = async (ant: AntecedenteRow) => {
    if (!selectedHistorial) return;
    if (!editingDesc.trim()) {
      setAntecedentesErr('La descripción no puede estar vacía.');
      return;
    }
    setSavingAnt(true);
    setAntecedentesErr(null);
    setOk(null);
    try {
      await api.put(`/api/historial-clinico/${selectedHistorial.id_historial}/antecedentes/${ant.id_antecedente}`, {
        tipo_antecedente: ant.tipo_antecedente,
        descripcion: editingDesc.trim(),
      });
      setOk('Antecedente clínico actualizado correctamente.');
      setEditingAntId(null);
      setEditingDesc('');
      await loadAntecedentes(selectedHistorial.id_historial, filterTipo);
    } catch (e) {
      setAntecedentesErr(parseApiError(e));
    } finally {
      setSavingAnt(false);
    }
  };

  const deleteAnt = async (ant: AntecedenteRow) => {
    if (!selectedHistorial) return;
    if (!window.confirm('¿Está seguro de eliminar este antecedente clínico?')) return;
    setAntecedentesErr(null);
    setOk(null);
    try {
      await api.delete(`/api/historial-clinico/${selectedHistorial.id_historial}/antecedentes/${ant.id_antecedente}`);
      setOk('Antecedente clínico eliminado correctamente.');
      await loadAntecedentes(selectedHistorial.id_historial, filterTipo);
    } catch (e) {
      setAntecedentesErr(parseApiError(e));
    }
  };

  const totalHistorialesPages = Math.max(1, Math.ceil(historialesCount / PAGE_SIZE));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Antecedentes del Paciente</h1>
        <p className={styles.subtitle}>
          Registro y consulta del historial de antecedentes patológicos, no patológicos, familiares, quirúrgicos y alérgicos.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}

      <div className={styles.mainGrid}>
        {/* Columna Izquierda: Selección de paciente */}
        <aside className={styles.sidebarSection}>
          <div className={styles.searchBox}>
            <label className={styles.label} htmlFor="search">Buscar Paciente / Historial</label>
            <input
              id="search"
              type="text"
              className={styles.input}
              placeholder="Escribe ID o buscar..."
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
            />
          </div>

          <div className={styles.patientList}>
            {historialesLoading ? (
              <p className={styles.loadingText}>Cargando pacientes...</p>
            ) : historiales.length === 0 ? (
              <p className={styles.loadingText}>No se encontraron pacientes activos.</p>
            ) : (
              historiales.map((h) => {
                const isSelected = selectedHistorial?.id_historial === h.id_historial;
                return (
                  <button
                    key={h.id_historial}
                    type="button"
                    className={`${styles.patientCard} ${isSelected ? styles.patientCardActive : ''}`}
                    onClick={() => handleSelectHistorial(h)}
                  >
                    <div className={styles.patientCardIcon} aria-hidden>
                      <ClipboardList size={18} />
                    </div>
                    <div className={styles.patientCardDetails}>
                      <span className={styles.patientCardTitle}>
                        {h.paciente_nombre_completo || `Paciente #${h.id_paciente}`}
                      </span>
                      <span className={styles.patientCardSub}>
                        ID Paciente: {h.id_paciente} · Historial: {h.id_historial}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {totalHistorialesPages > 1 && (
            <div className={styles.sidebarPager}>
              <button
                type="button"
                className={styles.btnSmall}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || historialesLoading}
              >
                Anterior
              </button>
              <span className={styles.pagerLabel}>
                {page} / {totalHistorialesPages}
              </span>
              <button
                type="button"
                className={styles.btnSmall}
                onClick={() => setPage((p) => Math.min(totalHistorialesPages, p + 1))}
                disabled={page >= totalHistorialesPages || historialesLoading}
              >
                Sig.
              </button>
            </div>
          )}
        </aside>

        {/* Columna Derecha: Detalles y Antecedentes */}
        <main className={styles.detailSection}>
          {!selectedHistorial ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon} aria-hidden>
                <HeartPulse size={48} />
              </div>
              <h2 className={styles.emptyStateTitle}>No hay paciente seleccionado</h2>
              <p className={styles.emptyStateSub}>
                Selecciona un paciente del listado izquierdo para revisar su historial de antecedentes clínicos o registrar una nueva entrada.
              </p>
            </div>
          ) : (
            <div className={styles.contentWrap}>
              <header className={styles.detailHeader}>
                <div className={styles.headerInfo}>
                  <h2 className={styles.detailTitle}>
                    {selectedHistorial.paciente_nombre_completo || `Paciente #${selectedHistorial.id_paciente}`}
                  </h2>
                  <p className={styles.detailSubtitle}>
                    ID Paciente: {selectedHistorial.id_paciente} · Historial Clínico #{selectedHistorial.id_historial}
                  </p>
                </div>
                <span className={`${styles.badge} ${selectedHistorial.estado === 'ACTIVO' ? styles.badgeActive : styles.badgeInactive}`}>
                  {selectedHistorial.estado}
                </span>
              </header>

              {antecedentesErr && <div className={styles.error}>{antecedentesErr}</div>}

              <div className={styles.splitGrid}>
                {/* Historial de Antecedentes */}
                <div className={styles.notesColumn}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexShrink: 0 }}>
                    <h3 className={styles.columnTitle} style={{ margin: 0 }}>Antecedentes Clínicos</h3>
                    <select
                      className={styles.select}
                      style={{ width: '12rem', padding: '0.35rem 0.6rem', fontSize: 'var(--text-xs)' }}
                      value={filterTipo}
                      onChange={(e) => handleFilterChange(e.target.value)}
                    >
                      <option value="">Todos los tipos</option>
                      {Object.entries(TIPO_ANTECEDENTE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {antecedentesLoading ? (
                    <p className={styles.loadingText}>Cargando antecedentes...</p>
                  ) : antecedentes.length === 0 ? (
                    <p className={styles.loadingText}>No se encontraron antecedentes registrados.</p>
                  ) : (
                    <div className={styles.antList}>
                      {antecedentes.map((ant) => {
                        const registrarLabel = ant.registrado_por_nombre || `Usuario #${ant.registrado_por}`;
                        const formattedDate = new Date(ant.fecha_creacion).toLocaleString('es-BO');
                        const isEditing = editingAntId === ant.id_antecedente;
                        const badgeStyle = TIPO_ANTECEDENTE_BADGE_STYLE[ant.tipo_antecedente] ?? {};

                        return (
                          <article key={ant.id_antecedente} className={styles.antCard}>
                            <header className={styles.antCardHeader}>
                              <div className={styles.antMeta}>
                                <span className={styles.badge} style={{ marginRight: 'var(--space-2)', fontSize: '0.68rem', fontWeight: 800, ...badgeStyle }}>
                                  {TIPO_ANTECEDENTE_LABELS[ant.tipo_antecedente]}
                                </span>
                                <strong className={styles.antRegistradorName}>{registrarLabel}</strong>
                                <span className={styles.antDate}>· {formattedDate}</span>
                              </div>
                              {canWrite && !isEditing && (
                                <div className={styles.antCardActions}>
                                  <button
                                    type="button"
                                    className={styles.btnGhostLink}
                                    onClick={() => startEditAnt(ant)}
                                    disabled={savingAnt}
                                    title="Editar antecedente"
                                  >
                                    <Edit2 size={13} style={{ marginRight: '2px', display: 'inline' }} /> Editar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.btnDangerLink}
                                    onClick={() => void deleteAnt(ant)}
                                    disabled={savingAnt}
                                    title="Eliminar antecedente"
                                  >
                                    <Trash2 size={13} style={{ marginRight: '2px', display: 'inline' }} /> Borrar
                                  </button>
                                </div>
                              )}
                            </header>
                            
                            {isEditing ? (
                              <div className={styles.editWrap}>
                                <textarea
                                  className={styles.textarea}
                                  value={editingDesc}
                                  onChange={(e) => setEditingDesc(e.target.value)}
                                  disabled={savingAnt}
                                />
                                <div className={styles.editActions}>
                                  <button
                                    type="button"
                                    className={styles.btnSmall}
                                    onClick={cancelEditAnt}
                                    disabled={savingAnt}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.btnSmallPrimary}
                                    onClick={() => void saveEditAnt(ant)}
                                    disabled={savingAnt}
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={styles.antNote}>{ant.descripcion}</p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Nuevo Registro */}
                <div className={styles.formColumn}>
                  <h3 className={styles.columnTitle}>Registrar Antecedente</h3>
                  {selectedHistorial.estado !== 'ACTIVO' ? (
                    <div className={styles.antNotice}>
                      <strong>Expediente Archivado:</strong> No se pueden registrar o modificar antecedentes en un historial clínico archivado.
                    </div>
                  ) : !canWrite ? (
                    <div className={styles.antNotice}>
                      <strong>Solo Lectura:</strong> Tu rol en el sistema no te permite registrar nuevos antecedentes clínicos.
                    </div>
                  ) : (
                    <form
                      className={styles.antForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitNuevoAntecedente();
                      }}
                    >
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="ant_tipo">Tipo de Antecedente</label>
                        <select
                          id="ant_tipo"
                          className={styles.select}
                          value={nuevoAntecedente.tipo_antecedente}
                          onChange={(e) => setNuevoAntecedente(p => ({ ...p, tipo_antecedente: e.target.value }))}
                          required
                        >
                          {Object.entries(TIPO_ANTECEDENTE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="ant_desc">Descripción / Detalle</label>
                        <textarea
                          id="ant_desc"
                          className={styles.textarea}
                          style={{ minHeight: '12rem' }}
                          placeholder="Ingresa la descripción clínica del antecedente (diagnóstico, fecha estimada, severidad, tratamiento, etc.)..."
                          value={nuevoAntecedente.descripcion}
                          onChange={(e) => setNuevoAntecedente(p => ({ ...p, descripcion: e.target.value }))}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className={styles.btnPrimaryFull}
                        disabled={savingAnt || !nuevoAntecedente.descripcion.trim()}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                      >
                        <PlusCircle size={16} />
                        {savingAnt ? 'Registrando...' : 'Registrar Antecedente'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
