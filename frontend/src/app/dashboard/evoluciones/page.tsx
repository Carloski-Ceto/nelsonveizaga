'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteModule } from '@/lib/authorization';
import { ClipboardList, TrendingUp } from 'lucide-react';
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

interface EvolucionRow {
  id_evolucion: number;
  id_historial: number;
  id_especialista: number;
  nota_evolucion: string;
  registrado_por: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface EspecialistaOption {
  id_especialista: number;
  nombre_usuario: string;
  especialidad: string;
}

interface ApiPage<T> {
  count: number;
  results: T[];
}

const PAGE_SIZE = 10;

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

export default function EvolucionesPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [historiales, setHistoriales] = useState<HistorialRow[]>([]);
  const [historialesCount, setHistorialesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [historialesLoading, setHistorialesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Evoluciones states
  const [selectedHistorial, setSelectedHistorial] = useState<HistorialRow | null>(null);
  const [evoluciones, setEvoluciones] = useState<EvolucionRow[]>([]);
  const [especialistas, setEspecialistas] = useState<EspecialistaOption[]>([]);
  const [evolucionesLoading, setEvolucionesLoading] = useState(false);
  const [evolucionesErr, setEvolucionesErr] = useState<string | null>(null);
  const [nuevaEvolucion, setNuevaEvolucion] = useState({ id_especialista: '', nota_evolucion: '' });
  const [editingEvoId, setEditingEvoId] = useState<number | null>(null);
  const [editingNota, setEditingNota] = useState('');
  const [savingEvo, setSavingEvo] = useState(false);

  const canView = canViewClinicalModule(me, 'evoluciones', permissionCodes);
  const canWrite = canWriteModule(me, 'evoluciones', permissionCodes);

  // Fetch Clinical Histories
  const loadHistoriales = useCallback(async () => {
    setHistorialesLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('estado', 'ACTIVO'); // Evolutions are typically managed for active histories
      if (searchQuery.trim()) {
        // Assume search is for patient ID or history ID
        params.set('search', searchQuery.trim());
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
      loadHistoriales();
    } else {
      setHistorialesLoading(false);
      setError('No tienes permiso para ver el módulo de evoluciones.');
    }
  }, [canView, loadHistoriales]);

  // Load specialists list once
  const loadEspecialistas = useCallback(async () => {
    try {
      const res = await api.get<ApiPage<EspecialistaOption>>('/api/especialistas?page=1&page_size=500');
      setEspecialistas(res.data.results ?? []);
    } catch (e) {
      console.error('Error al cargar especialistas para evoluciones:', e);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      void loadEspecialistas();
    }
  }, [canView, loadEspecialistas]);

  // Load evolutions of the selected clinical history
  const loadEvoluciones = useCallback(async (historialId: number) => {
    setEvolucionesLoading(true);
    setEvolucionesErr(null);
    try {
      const res = await api.get<ApiPage<EvolucionRow>>(`/api/historial-clinico/${historialId}/evoluciones`);
      setEvoluciones(res.data.results ?? []);
    } catch (e) {
      setEvolucionesErr('No se pudieron cargar las evoluciones.');
    } finally {
      setEvolucionesLoading(false);
    }
  }, []);

  const handleSelectHistorial = (historial: HistorialRow) => {
    setSelectedHistorial(historial);
    setNuevaEvolucion({ id_especialista: '', nota_evolucion: '' });
    setEditingEvoId(null);
    setEditingNota('');
    setEvolucionesErr(null);
    setOk(null);
    void loadEvoluciones(historial.id_historial);
  };

  const submitNuevaEvolucion = async () => {
    if (!selectedHistorial) return;
    if (!nuevaEvolucion.id_especialista) {
      setEvolucionesErr('Debe seleccionar un especialista.');
      return;
    }
    if (!nuevaEvolucion.nota_evolucion.trim()) {
      setEvolucionesErr('La nota de evolución es obligatoria.');
      return;
    }
    setSavingEvo(true);
    setEvolucionesErr(null);
    setOk(null);
    try {
      await api.post(`/api/historial-clinico/${selectedHistorial.id_historial}/evoluciones`, {
        id_especialista: Number(nuevaEvolucion.id_especialista),
        nota_evolucion: nuevaEvolucion.nota_evolucion.trim(),
      });
      setOk('Evolución registrada correctamente.');
      setNuevaEvolucion({ id_especialista: '', nota_evolucion: '' });
      await loadEvoluciones(selectedHistorial.id_historial);
    } catch (e) {
      setEvolucionesErr(parseApiError(e));
    } finally {
      setSavingEvo(false);
    }
  };

  const startEditEvo = (evo: EvolucionRow) => {
    setEditingEvoId(evo.id_evolucion);
    setEditingNota(evo.nota_evolucion);
    setEvolucionesErr(null);
    setOk(null);
  };

  const cancelEditEvo = () => {
    setEditingEvoId(null);
    setEditingNota('');
  };

  const saveEditEvo = async (evo: EvolucionRow) => {
    if (!selectedHistorial) return;
    if (!editingNota.trim()) {
      setEvolucionesErr('La nota no puede estar vacía.');
      return;
    }
    setSavingEvo(true);
    setEvolucionesErr(null);
    setOk(null);
    try {
      await api.put(`/api/historial-clinico/${selectedHistorial.id_historial}/evoluciones/${evo.id_evolucion}`, {
        id_especialista: evo.id_especialista,
        nota_evolucion: editingNota.trim(),
      });
      setOk('Evolución actualizada correctamente.');
      setEditingEvoId(null);
      setEditingNota('');
      await loadEvoluciones(selectedHistorial.id_historial);
    } catch (e) {
      setEvolucionesErr(parseApiError(e));
    } finally {
      setSavingEvo(false);
    }
  };

  const deleteEvo = async (evo: EvolucionRow) => {
    if (!selectedHistorial) return;
    if (!window.confirm('¿Está seguro de eliminar esta nota de evolución clínica?')) return;
    setEvolucionesErr(null);
    setOk(null);
    try {
      await api.delete(`/api/historial-clinico/${selectedHistorial.id_historial}/evoluciones/${evo.id_evolucion}`);
      setOk('Evolución eliminada correctamente.');
      await loadEvoluciones(selectedHistorial.id_historial);
    } catch (e) {
      setEvolucionesErr(parseApiError(e));
    }
  };

  const totalHistorialesPages = Math.max(1, Math.ceil(historialesCount / PAGE_SIZE));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Evolución de paciente</h1>
        <p className={styles.subtitle}>
          Gestión, registro y seguimiento de la evolución clínica del paciente.
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

        {/* Columna Derecha: Detalles y Notas de Evolución */}
        <main className={styles.detailSection}>
          {!selectedHistorial ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon} aria-hidden>
                <TrendingUp size={48} />
              </div>
              <h2 className={styles.emptyStateTitle}>No hay paciente seleccionado</h2>
              <p className={styles.emptyStateSub}>
                Selecciona un paciente del listado izquierdo para revisar su historial de evoluciones médicas o registrar una nueva evolución clínica.
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

              {evolucionesErr && <div className={styles.error}>{evolucionesErr}</div>}

              <div className={styles.splitGrid}>
                {/* Notas Históricas */}
                <div className={styles.notesColumn}>
                  <h3 className={styles.columnTitle}>Evolución Clínica Histórica</h3>
                  
                  {evolucionesLoading ? (
                    <p className={styles.loadingText}>Cargando notas médicas...</p>
                  ) : evoluciones.length === 0 ? (
                    <p className={styles.loadingText}>No hay notas de evolución registradas para este paciente.</p>
                  ) : (
                    <div className={styles.evoList}>
                      {evoluciones.map((evo) => {
                        const esp = especialistas.find(e => e.id_especialista === evo.id_especialista);
                        const espLabel = esp ? `${esp.nombre_usuario} (${esp.especialidad})` : `Especialista #${evo.id_especialista}`;
                        const formattedDate = new Date(evo.fecha_creacion).toLocaleString('es-BO');
                        const isEditing = editingEvoId === evo.id_evolucion;

                        return (
                          <article key={evo.id_evolucion} className={styles.evoCard}>
                            <header className={styles.evoCardHeader}>
                              <div className={styles.evoMeta}>
                                <strong className={styles.evoEspecialistaName}>{espLabel}</strong>
                                <span className={styles.evoDate}>· {formattedDate}</span>
                              </div>
                              {canWrite && !isEditing && (
                                <div className={styles.evoCardActions}>
                                  <button
                                    type="button"
                                    className={styles.btnGhostLink}
                                    onClick={() => startEditEvo(evo)}
                                    disabled={savingEvo}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.btnDangerLink}
                                    onClick={() => void deleteEvo(evo)}
                                    disabled={savingEvo}
                                  >
                                    Borrar
                                  </button>
                                </div>
                              )}
                            </header>
                            
                            {isEditing ? (
                              <div className={styles.editWrap}>
                                <textarea
                                  className={styles.textarea}
                                  value={editingNota}
                                  onChange={(e) => setEditingNota(e.target.value)}
                                  disabled={savingEvo}
                                />
                                <div className={styles.editActions}>
                                  <button
                                    type="button"
                                    className={styles.btnSmall}
                                    onClick={cancelEditEvo}
                                    disabled={savingEvo}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.btnSmallPrimary}
                                    onClick={() => void saveEditEvo(evo)}
                                    disabled={savingEvo}
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={styles.evoNote}>{evo.nota_evolucion}</p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Nuevo Registro */}
                <div className={styles.formColumn}>
                  <h3 className={styles.columnTitle}>Registrar Nueva Evolución</h3>
                  {selectedHistorial.estado !== 'ACTIVO' ? (
                    <div className={styles.evoNotice}>
                      <strong>Expediente Archivado:</strong> No se pueden registrar evoluciones para un historial clínico archivado.
                    </div>
                  ) : !canWrite ? (
                    <div className={styles.evoNotice}>
                      <strong>Solo Lectura:</strong> Tu rol en el sistema no te permite registrar nuevas notas de evolución.
                    </div>
                  ) : (
                    <form
                      className={styles.evoForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submitNuevaEvolucion();
                      }}
                    >
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="evo_especialista">Especialista Tratante</label>
                        <select
                          id="evo_especialista"
                          className={styles.select}
                          value={nuevaEvolucion.id_especialista}
                          onChange={(e) => setNuevaEvolucion(p => ({ ...p, id_especialista: e.target.value }))}
                          required
                        >
                          <option value="">Seleccionar especialista...</option>
                          {especialistas.map((esp) => (
                            <option key={esp.id_especialista} value={esp.id_especialista}>
                              {esp.nombre_usuario} · {esp.especialidad}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="evo_nota">Nota Clínica</label>
                        <textarea
                          id="evo_nota"
                          className={styles.textarea}
                          style={{ minHeight: '12rem' }}
                          placeholder="Describe el estado de evolución clínica del paciente, cambios en síntomas o tratamiento..."
                          value={nuevaEvolucion.nota_evolucion}
                          onChange={(e) => setNuevaEvolucion(p => ({ ...p, nota_evolucion: e.target.value }))}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className={styles.btnPrimaryFull}
                        disabled={savingEvo || !nuevaEvolucion.id_especialista || !nuevaEvolucion.nota_evolucion.trim()}
                      >
                        {savingEvo ? 'Registrando...' : 'Registrar Nota'}
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
