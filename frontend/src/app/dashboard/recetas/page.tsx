'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteModule } from '@/lib/authorization';
import { ClipboardList, FileText, Plus, Trash2, Printer } from 'lucide-react';
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

interface MedicamentoItem {
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
}

interface RecetaRow {
  id_receta: number;
  id_historial: number;
  id_consulta: number | null;
  medicamentos: MedicamentoItem[];
  indicaciones: string;
  registrado_por: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  registrado_por_nombre?: string;
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

export default function RecetasPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [historiales, setHistoriales] = useState<HistorialRow[]>([]);
  const [historialesCount, setHistorialesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [historialesLoading, setHistorialesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Recetas states
  const [selectedHistorial, setSelectedHistorial] = useState<HistorialRow | null>(null);
  const [recetas, setRecetas] = useState<RecetaRow[]>([]);
  const [recetasLoading, setRecetasLoading] = useState(false);
  const [recetasErr, setRecetasErr] = useState<string | null>(null);
  const [savingReceta, setSavingReceta] = useState(false);

  // Form states
  const [medicamentosForm, setMedicamentosForm] = useState<MedicamentoItem[]>([
    { nombre: '', dosis: '', frecuencia: '', duracion: '' }
  ]);
  const [indicacionesForm, setIndicacionesForm] = useState('');

  // Edit states
  const [editingRecetaId, setEditingRecetaId] = useState<number | null>(null);
  const [editingMedicamentos, setEditingMedicamentos] = useState<MedicamentoItem[]>([]);
  const [editingIndicaciones, setEditingIndicaciones] = useState('');

  // Print state
  const [recetaToPrint, setRecetaToPrint] = useState<RecetaRow | null>(null);

  const canView = canViewClinicalModule(me, 'recetas', permissionCodes);
  const canWrite = canWriteModule(me, 'recetas', permissionCodes);

  // Fetch Clinical Histories
  const loadHistoriales = useCallback(async () => {
    setHistorialesLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('estado', 'ACTIVO');
      if (searchQuery.trim()) {
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
      void loadHistoriales();
    } else {
      setHistorialesLoading(false);
      setError('No tienes permiso para ver el módulo de emisión de recetas.');
    }
  }, [canView, loadHistoriales]);

  // Load recipes for the selected patient
  const loadRecetas = useCallback(async (historialId: number) => {
    setRecetasLoading(true);
    setRecetasErr(null);
    try {
      const res = await api.get<ApiPage<RecetaRow>>(`/api/historial-clinico/${historialId}/recetas`);
      setRecetas(res.data.results ?? []);
    } catch (e) {
      setRecetasErr('No se pudieron cargar las recetas previas.');
    } finally {
      setRecetasLoading(false);
    }
  }, []);

  const handleSelectHistorial = (historial: HistorialRow) => {
    setSelectedHistorial(historial);
    setMedicamentosForm([{ nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
    setIndicacionesForm('');
    setEditingRecetaId(null);
    setEditingMedicamentos([]);
    setEditingIndicaciones('');
    setRecetasErr(null);
    setOk(null);
    void loadRecetas(historial.id_historial);
  };

  // Form handlers
  const handleAddMedicamento = () => {
    setMedicamentosForm([...medicamentosForm, { nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
  };

  const handleRemoveMedicamento = (index: number) => {
    if (medicamentosForm.length === 1) return;
    setMedicamentosForm(medicamentosForm.filter((_, i) => i !== index));
  };

  const handleMedicamentoChange = (index: number, field: keyof MedicamentoItem, value: string) => {
    const updated = [...medicamentosForm];
    updated[index][field] = value;
    setMedicamentosForm(updated);
  };

  const submitNuevaReceta = async () => {
    if (!selectedHistorial) return;
    
    // Validar medicamentos
    const validMedis = medicamentosForm.filter(m => m.nombre.trim());
    if (validMedis.length === 0) {
      setRecetasErr('Debe ingresar al menos un medicamento con su nombre.');
      return;
    }

    for (const med of validMedis) {
      if (!med.dosis.trim() || !med.frecuencia.trim() || !med.duracion.trim()) {
        setRecetasErr('Todos los campos del medicamento (dosis, frecuencia, duración) son obligatorios.');
        return;
      }
    }

    setSavingReceta(true);
    setRecetasErr(null);
    setOk(null);
    try {
      await api.post(`/api/historial-clinico/${selectedHistorial.id_historial}/recetas`, {
        medicamentos: validMedis,
        indicaciones: indicacionesForm.trim()
      });
      setOk('Receta médica emitida y registrada en el historial.');
      setMedicamentosForm([{ nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
      setIndicacionesForm('');
      await loadRecetas(selectedHistorial.id_historial);
    } catch (e) {
      setRecetasErr(parseApiError(e));
    } finally {
      setSavingReceta(false);
    }
  };

  // Edit handlers
  const startEditReceta = (receta: RecetaRow) => {
    setEditingRecetaId(receta.id_receta);
    setEditingMedicamentos(receta.medicamentos.map(m => ({ ...m })));
    setEditingIndicaciones(receta.indicaciones || '');
    setRecetasErr(null);
    setOk(null);
  };

  const cancelEditReceta = () => {
    setEditingRecetaId(null);
    setEditingMedicamentos([]);
    setEditingIndicaciones('');
  };

  const handleEditMedicamentoChange = (index: number, field: keyof MedicamentoItem, value: string) => {
    const updated = [...editingMedicamentos];
    updated[index][field] = value;
    setEditingMedicamentos(updated);
  };

  const handleAddEditMedicamento = () => {
    setEditingMedicamentos([...editingMedicamentos, { nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
  };

  const handleRemoveEditMedicamento = (index: number) => {
    if (editingMedicamentos.length === 1) return;
    setEditingMedicamentos(editingMedicamentos.filter((_, i) => i !== index));
  };

  const saveEditReceta = async (recetaId: number) => {
    if (!selectedHistorial) return;

    const validMedis = editingMedicamentos.filter(m => m.nombre.trim());
    if (validMedis.length === 0) {
      setRecetasErr('Debe ingresar al menos un medicamento con su nombre.');
      return;
    }

    for (const med of validMedis) {
      if (!med.dosis.trim() || !med.frecuencia.trim() || !med.duracion.trim()) {
        setRecetasErr('Todos los campos del medicamento (dosis, frecuencia, duración) son obligatorios.');
        return;
      }
    }

    setSavingReceta(true);
    setRecetasErr(null);
    setOk(null);
    try {
      await api.put(`/api/historial-clinico/${selectedHistorial.id_historial}/recetas/${recetaId}`, {
        medicamentos: validMedis,
        indicaciones: editingIndicaciones.trim()
      });
      setOk('Receta médica actualizada correctamente.');
      setEditingRecetaId(null);
      setEditingMedicamentos([]);
      setEditingIndicaciones('');
      await loadRecetas(selectedHistorial.id_historial);
    } catch (e) {
      setRecetasErr(parseApiError(e));
    } finally {
      setSavingReceta(false);
    }
  };

  const deleteReceta = async (receta: RecetaRow) => {
    if (!selectedHistorial) return;
    if (!window.confirm('¿Está seguro de eliminar esta receta médica?')) return;

    setRecetasErr(null);
    setOk(null);
    try {
      await api.delete(`/api/historial-clinico/${selectedHistorial.id_historial}/recetas/${receta.id_receta}`);
      setOk('Receta médica eliminada correctamente.');
      await loadRecetas(selectedHistorial.id_historial);
    } catch (e) {
      setRecetasErr(parseApiError(e));
    }
  };

  const handlePrint = (receta: RecetaRow) => {
    setRecetaToPrint(receta);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const totalHistorialesPages = Math.max(1, Math.ceil(historialesCount / PAGE_SIZE));

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Emitir Recetas</h1>
        <p className={styles.subtitle}>
          Emisión, registro e impresión de recetas médicas asociadas al historial clínico del paciente.
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

        {/* Columna Derecha: Detalle e historial de recetas */}
        <main className={styles.detailSection}>
          {!selectedHistorial ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon} aria-hidden>
                <FileText size={48} />
              </div>
              <h2 className={styles.emptyStateTitle}>No hay paciente seleccionado</h2>
              <p className={styles.emptyStateSub}>
                Selecciona un paciente del listado izquierdo para revisar su historial de recetas emitidas o confeccionar una nueva receta médica.
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

              {recetasErr && <div className={styles.error}>{recetasErr}</div>}

              <div className={styles.splitGrid}>
                {/* Historial de Recetas Emitidas */}
                <div className={styles.historyColumn}>
                  <h3 className={styles.columnTitle}>Recetas Emitidas Anteriores</h3>
                  
                  {recetasLoading ? (
                    <p className={styles.loadingText}>Cargando recetas...</p>
                  ) : recetas.length === 0 ? (
                    <p className={styles.loadingText}>No hay recetas previas registradas para este paciente.</p>
                  ) : (
                    <div className={styles.recetaList}>
                      {recetas.map((r) => {
                        const formattedDate = new Date(r.fecha_creacion).toLocaleString('es-BO');
                        const isEditing = editingRecetaId === r.id_receta;
                        return (
                          <article key={r.id_receta} className={styles.recetaCard}>
                            <header className={styles.recetaCardHeader}>
                              <div className={styles.recetaMeta}>
                                <strong className={styles.medicoName}>Recetado por: {r.registrado_por_nombre || `Médico #${r.registrado_por}`}</strong>
                                <span className={styles.recetaDate}>· {formattedDate}</span>
                              </div>
                              <div className={styles.recetaCardActions}>
                                <button
                                  type="button"
                                  className={styles.btnPrintGhost}
                                  onClick={() => handlePrint(r)}
                                  title="Imprimir Receta"
                                  disabled={savingReceta}
                                >
                                  <Printer size={14} />
                                  <span>Imprimir</span>
                                </button>
                                {canWrite && !isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.btnGhostLink}
                                      onClick={() => startEditReceta(r)}
                                      title="Editar Receta"
                                      disabled={savingReceta}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.btnDangerLink}
                                      onClick={() => void deleteReceta(r)}
                                      title="Borrar Receta"
                                      disabled={savingReceta}
                                    >
                                      Borrar
                                    </button>
                                  </>
                                )}
                              </div>
                            </header>
                            
                            {isEditing ? (
                              <div className={styles.editWrap}>
                                <div className={styles.formGroup}>
                                  <label className={styles.label}>Medicamentos a Recetar</label>
                                  {editingMedicamentos.map((med, idx) => (
                                    <div key={idx} className={styles.medicamentoRow}>
                                      <div className={styles.medInputsGrid}>
                                        <div className={styles.inputWrap}>
                                          <label className={styles.fieldLabel}>Medicamento</label>
                                          <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Nombre del medicamento (ej: Paracetamol 500mg)"
                                            value={med.nombre}
                                            onChange={(e) => handleEditMedicamentoChange(idx, 'nombre', e.target.value)}
                                          />
                                        </div>
                                        <div className={styles.medSubGrid}>
                                          <div className={styles.inputWrap}>
                                            <label className={styles.fieldLabel}>Dosis</label>
                                            <input
                                              type="text"
                                              className={styles.input}
                                              placeholder="Dosis (ej: 1 comp.)"
                                              value={med.dosis}
                                              onChange={(e) => handleEditMedicamentoChange(idx, 'dosis', e.target.value)}
                                            />
                                          </div>
                                          <div className={styles.inputWrap}>
                                            <label className={styles.fieldLabel}>Frecuencia</label>
                                            <input
                                              type="text"
                                              className={styles.input}
                                              placeholder="Frecuencia (ej: c/8 horas)"
                                              value={med.frecuencia}
                                              onChange={(e) => handleEditMedicamentoChange(idx, 'frecuencia', e.target.value)}
                                            />
                                          </div>
                                          <div className={styles.inputWrap}>
                                            <label className={styles.fieldLabel}>Duración</label>
                                            <input
                                              type="text"
                                              className={styles.input}
                                              placeholder="Duración (ej: 3 días)"
                                              value={med.duracion}
                                              onChange={(e) => handleEditMedicamentoChange(idx, 'duracion', e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className={styles.btnDangerIcon}
                                        onClick={() => handleRemoveEditMedicamento(idx)}
                                        disabled={editingMedicamentos.length === 1}
                                        title="Remover medicamento"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  ))}
                                  
                                  <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={handleAddEditMedicamento}
                                  >
                                    <Plus size={14} />
                                    <span>Añadir Medicamento</span>
                                  </button>
                                </div>

                                <div className={styles.formGroup}>
                                  <label className={styles.label}>Indicaciones Generales</label>
                                  <textarea
                                    className={styles.textarea}
                                    rows={3}
                                    placeholder="Indicaciones adicionales de administración, dieta, etc."
                                    value={editingIndicaciones}
                                    onChange={(e) => setEditingIndicaciones(e.target.value)}
                                  />
                                </div>

                                <div className={styles.editActions}>
                                  <button
                                    type="button"
                                    className={styles.btnSmall}
                                    onClick={cancelEditReceta}
                                    disabled={savingReceta}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.btnSmallPrimary}
                                    onClick={() => void saveEditReceta(r.id_receta)}
                                    disabled={savingReceta}
                                  >
                                    {savingReceta ? 'Guardando...' : 'Guardar'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.recetaBody}>
                                <table className={styles.miniTable}>
                                  <thead>
                                    <tr>
                                      <th>Medicamento</th>
                                      <th>Dosis</th>
                                      <th>Frecuencia</th>
                                      <th>Duración</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.medicamentos.map((med, idx) => (
                                      <tr key={idx}>
                                        <td>{med.nombre}</td>
                                        <td>{med.dosis}</td>
                                        <td>{med.frecuencia}</td>
                                        <td>{med.duracion}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {r.indicaciones && (
                                  <div className={styles.indicacionesBlock}>
                                    <strong>Indicaciones generales:</strong>
                                    <p>{r.indicaciones}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Formulario de Emisión */}
                {canWrite && (
                  <div className={styles.formColumn}>
                    <h3 className={styles.columnTitle}>Emitir Nueva Receta</h3>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Medicamentos a Recetar</label>
                      {medicamentosForm.map((med, idx) => (
                        <div key={idx} className={styles.medicamentoRow}>
                          <div className={styles.medInputsGrid}>
                            <div className={styles.inputWrap}>
                              <label className={styles.fieldLabel}>Medicamento</label>
                              <input
                                type="text"
                                className={styles.input}
                                placeholder="Nombre del medicamento (ej: Paracetamol 500mg)"
                                value={med.nombre}
                                onChange={(e) => handleMedicamentoChange(idx, 'nombre', e.target.value)}
                              />
                            </div>
                            <div className={styles.medSubGrid}>
                              <div className={styles.inputWrap}>
                                <label className={styles.fieldLabel}>Dosis</label>
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder="Dosis (ej: 1 comp.)"
                                  value={med.dosis}
                                  onChange={(e) => handleMedicamentoChange(idx, 'dosis', e.target.value)}
                                />
                              </div>
                              <div className={styles.inputWrap}>
                                <label className={styles.fieldLabel}>Frecuencia</label>
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder="Frecuencia (ej: c/8 horas)"
                                  value={med.frecuencia}
                                  onChange={(e) => handleMedicamentoChange(idx, 'frecuencia', e.target.value)}
                                />
                              </div>
                              <div className={styles.inputWrap}>
                                <label className={styles.fieldLabel}>Duración</label>
                                <input
                                  type="text"
                                  className={styles.input}
                                  placeholder="Duración (ej: 3 días)"
                                  value={med.duracion}
                                  onChange={(e) => handleMedicamentoChange(idx, 'duracion', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.btnDangerIcon}
                            onClick={() => handleRemoveMedicamento(idx)}
                            disabled={medicamentosForm.length === 1}
                            title="Remover medicamento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={handleAddMedicamento}
                      >
                        <Plus size={16} />
                        <span>Añadir Medicamento</span>
                      </button>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="indicaciones">Indicaciones Generales</label>
                      <textarea
                        id="indicaciones"
                        className={styles.textarea}
                        rows={4}
                        placeholder="Indicaciones adicionales de administración, dieta, etc."
                        value={indicacionesForm}
                        onChange={(e) => setIndicacionesForm(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => void submitNuevaReceta()}
                      disabled={savingReceta}
                    >
                      {savingReceta ? 'Guardando...' : 'Emitir Receta'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ÁREA DE IMPRESIÓN EXCLUSIVA (OCULTA EN PANTALLA) */}
      {recetaToPrint && (
        <div id="print-area" className={styles.printContainer}>
          <div className={styles.printHeader}>
            <h2>CLÍNICA DE OJOS NORTE</h2>
            <p>Atención Oftalmológica Integral Especializada</p>
            <div className={styles.divider} />
          </div>

          <div className={styles.printTitle}>
            <h3>RECETA DE MEDICAMENTOS</h3>
          </div>

          <div className={styles.printMetaSection}>
            <p><strong>Paciente:</strong> {selectedHistorial?.paciente_nombre_completo || `ID Paciente: ${selectedHistorial?.id_paciente}`}</p>
            <p><strong>Historial Clínico:</strong> #{selectedHistorial?.id_historial}</p>
            <p><strong>Fecha de Emisión:</strong> {new Date(recetaToPrint.fecha_creacion).toLocaleString('es-BO')}</p>
          </div>

          <div className={styles.printBody}>
            <h4>Medicamentos Recetados:</h4>
            <table className={styles.printTable}>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Frecuencia</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {recetaToPrint.medicamentos.map((med, idx) => (
                  <tr key={idx}>
                    <td>{med.nombre}</td>
                    <td>{med.dosis}</td>
                    <td>{med.frecuencia}</td>
                    <td>{med.duracion}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {recetaToPrint.indicaciones && (
              <div className={styles.printIndicaciones}>
                <h4>Indicaciones Generales:</h4>
                <p>{recetaToPrint.indicaciones}</p>
              </div>
            )}
          </div>

          <div className={styles.printFooter}>
            <div className={styles.signatureBox}>
              <div className={styles.signatureLine} />
              <p><strong>Firma y Sello Médico</strong></p>
              <p>{recetaToPrint.registrado_por_nombre || me?.nombre_completo || me?.username || 'Médico Autorizado'}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
