'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteModule } from '@/lib/authorization';
import styles from './page.module.css';

interface PacienteRow {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  fecha_nacimiento: string;
  sexo: 'F' | 'M' | 'O';
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  fecha_creacion: string;
}

interface ApiPage<T> {
  count: number;
  results: T[];
}

type SexoValue = 'F' | 'M' | 'O' | '';
type ModalKind = 'create' | 'edit' | null;

const PAGE_SIZE = 20;

const emptyForm = {
  nombres: '',
  apellidos: '',
  documento_identidad: '',
  fecha_nacimiento: '',
  sexo: 'F' as SexoValue,
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
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

function sexoLabel(sexo: PacienteRow['sexo']): string {
  if (sexo === 'F') return 'Femenino';
  if (sexo === 'M') return 'Masculino';
  return 'Otro';
}

function fieldErrorsFrom(error: unknown): Record<string, string> {
  const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
  const map: Record<string, string> = {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) return map;
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value[0]) map[key] = String(value[0]);
    else if (typeof value === 'string') map[key] = value;
  }
  return map;
}

export default function PacientesPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [rows, setRows] = useState<PacienteRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [filterSexo, setFilterSexo] = useState<SexoValue>('');
  const [filterActivo, setFilterActivo] = useState<string>('');

  const [modal, setModal] = useState<ModalKind>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (q.trim()) params.set('search', q.trim());
    if (filterSexo) params.set('sexo', filterSexo);
    if (filterActivo !== '') params.set('activo', filterActivo);
    params.set('ordering', 'apellidos');
    return params.toString();
  }, [page, q, filterSexo, filterActivo]);

  const canViewPacientes = canViewClinicalModule(me, 'pacientes', permissionCodes);

  const load = useCallback(async () => {
    if (!canViewPacientes) {
      setRows([]);
      setCount(0);
      setError('No tienes permiso para ver el módulo de pacientes.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiPage<PacienteRow>>(`/api/pacientes?${query}`);
      setRows(res.data.results ?? []);
      setCount(res.data.count ?? 0);
    } catch (e) {
      setError(
        (e as { response?: { status?: number } }).response?.status === 403
          ? 'No tienes permiso para gestionar pacientes.'
          : 'No se pudo cargar el módulo de pacientes.'
      );
    } finally {
      setLoading(false);
    }
  }, [canViewPacientes, query]);

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

  useEffect(() => {
    if (!modal) return;
    firstFieldRef.current?.focus();
  }, [modal]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const activos = rows.filter((r) => r.activo).length;
  const inactivos = rows.length - activos;
  const canManagePacientes = canWriteModule(me, 'pacientes', permissionCodes);

  function resetMessages() {
    setError(null);
    setOk(null);
    setFormErr(null);
  }

  function openCreate() {
    if (!canManagePacientes) {
      setError('No tienes permiso para crear pacientes.');
      return;
    }
    resetMessages();
    setFieldErr({});
    setForm(emptyForm);
    setEditId(null);
    setModal('create');
  }

  function openEdit(row: PacienteRow) {
    if (!canManagePacientes) {
      setError('No tienes permiso para editar pacientes.');
      return;
    }
    resetMessages();
    setFieldErr({});
    setForm({
      nombres: row.nombres,
      apellidos: row.apellidos,
      documento_identidad: row.documento_identidad,
      fecha_nacimiento: row.fecha_nacimiento,
      sexo: row.sexo,
      telefono: row.telefono ?? '',
      email: row.email ?? '',
      direccion: row.direccion ?? '',
      activo: row.activo,
    });
    setEditId(row.id_paciente);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditId(null);
    setSaving(false);
  }

  async function submit() {
    if (!canManagePacientes) {
      setFormErr('No tienes permiso para guardar cambios en pacientes.');
      return;
    }
    setSaving(true);
    setFormErr(null);
    setFieldErr({});
    try {
      const payload = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        documento_identidad: form.documento_identidad.trim(),
        fecha_nacimiento: form.fecha_nacimiento,
        sexo: form.sexo,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        activo: form.activo,
      };

      if (modal === 'create') {
        await api.post('/api/pacientes', payload);
        setOk('Paciente registrado correctamente.');
      } else if (modal === 'edit' && editId != null) {
        await api.patch(`/api/pacientes/${editId}`, payload);
        setOk('Paciente actualizado correctamente.');
      }

      closeModal();
      await load();
    } catch (e) {
      setFormErr(parseApiError(e));
      setFieldErr(fieldErrorsFrom(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: PacienteRow) {
    if (!canManagePacientes) {
      setError('No tienes permiso para eliminar pacientes.');
      return;
    }
    if (!window.confirm(`¿Eliminar paciente ${row.nombres} ${row.apellidos}?`)) return;
    setError(null);
    setOk(null);
    try {
      await api.delete(`/api/pacientes/${row.id_paciente}`);
      setOk('Paciente eliminado correctamente.');
      await load();
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        const shouldDeactivate = window.confirm(
          'No se puede eliminar porque tiene historial clínico asociado. ¿Quieres desactivarlo ahora?'
        );
        if (shouldDeactivate) {
          await deactivate(row);
          return;
        }
      }
      setError(parseApiError(e));
    }
  }

  async function deactivate(row: PacienteRow) {
    if (!canManagePacientes) {
      setError('No tienes permiso para desactivar pacientes.');
      return;
    }
    if (!row.activo) {
      setOk('El paciente ya está inactivo.');
      return;
    }
    setError(null);
    setOk(null);
    try {
      await api.patch(`/api/pacientes/${row.id_paciente}`, { activo: false });
      setOk('Paciente desactivado correctamente.');
      await load();
    } catch (e) {
      setError(parseApiError(e));
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de pacientes</h1>
        <p className={styles.subtitle}>
          Directorio clínico operativo para registrar, actualizar y consultar pacientes del flujo SI1.
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
              <strong className={styles.kpiValue}>{activos}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Inactivos</span>
              <strong className={styles.kpiValue}>{inactivos}</strong>
            </article>
          </div>
        </div>
      </div>
      {!canManagePacientes && <div className={styles.error}>Tu rol es de solo lectura en Pacientes. Puedes consultar y filtrar, pero no crear, editar ni eliminar.</div>}

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="search">Buscar</label>
          <input
            id="search"
            className={styles.input}
            placeholder="Nombre, apellido, CI, teléfono, email"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sexo">Sexo</label>
          <select
            id="sexo"
            className={styles.select}
            value={filterSexo}
            onChange={(e) => {
              setPage(1);
              setFilterSexo(e.target.value as SexoValue);
            }}
          >
            <option value="">Todos</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="activo">Estado</label>
          <select
            id="activo"
            className={styles.select}
            value={filterActivo}
            onChange={(e) => {
              setPage(1);
              setFilterActivo(e.target.value);
            }}
          >
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => load()} disabled={loading}>
            Recargar
          </button>
          <button type="button" className={styles.btnPrimary} onClick={openCreate} disabled={!canManagePacientes}>
            Nuevo paciente
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
              <th>Paciente</th>
              <th>Documento</th>
              <th>Contacto</th>
              <th>Sexo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Cargando pacientes...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7}>No hay resultados para esos filtros.</td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.id_paciente}>
                <td>{row.id_paciente}</td>
                <td>
                  <strong>{row.apellidos}, {row.nombres}</strong>
                  <br />
                  <small>Nac. {row.fecha_nacimiento}</small>
                </td>
                <td>{row.documento_identidad}</td>
                <td>
                  {row.telefono || '-'}
                  <br />
                  <small>{row.email || '-'}</small>
                </td>
                <td>{sexoLabel(row.sexo)}</td>
                <td>
                  <span className={`${styles.badge} ${row.activo ? styles.badgeActive : styles.badgeInactive}`}>
                    {row.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className={styles.tableActions}>
                    <button type="button" className={styles.btnGhost} onClick={() => openEdit(row)} disabled={!canManagePacientes}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => deactivate(row)}
                      disabled={!canManagePacientes || !row.activo}
                      title={row.activo ? 'Desactivar paciente' : 'Paciente ya inactivo'}
                    >
                      Desactivar
                    </button>
                    <button type="button" className={styles.btnDanger} onClick={() => remove(row)} disabled={!canManagePacientes}>
                      Eliminar
                    </button>
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

      {modal && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={closeModal}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Formulario de paciente"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>{modal === 'create' ? 'Nuevo paciente' : 'Editar paciente'}</h2>
            {formErr && <div className={styles.error}>{formErr}</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nombres">Nombres</label>
                <input
                  ref={firstFieldRef}
                  id="nombres"
                  className={styles.input}
                  value={form.nombres}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombres: e.target.value }))}
                />
                {fieldErr.nombres && <span className={styles.fieldErr}>{fieldErr.nombres}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="apellidos">Apellidos</label>
                <input
                  id="apellidos"
                  className={styles.input}
                  value={form.apellidos}
                  onChange={(e) => setForm((prev) => ({ ...prev, apellidos: e.target.value }))}
                />
                {fieldErr.apellidos && <span className={styles.fieldErr}>{fieldErr.apellidos}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="documento_identidad">Documento</label>
                <input
                  id="documento_identidad"
                  className={styles.input}
                  value={form.documento_identidad}
                  onChange={(e) => setForm((prev) => ({ ...prev, documento_identidad: e.target.value }))}
                />
                {fieldErr.documento_identidad && <span className={styles.fieldErr}>{fieldErr.documento_identidad}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="fecha_nacimiento">Fecha nacimiento</label>
                <input
                  id="fecha_nacimiento"
                  className={styles.input}
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_nacimiento: e.target.value }))}
                />
                {fieldErr.fecha_nacimiento && <span className={styles.fieldErr}>{fieldErr.fecha_nacimiento}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="sexo_form">Sexo</label>
                <select
                  id="sexo_form"
                  className={styles.select}
                  value={form.sexo}
                  onChange={(e) => setForm((prev) => ({ ...prev, sexo: e.target.value as SexoValue }))}
                >
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="O">Otro</option>
                </select>
                {fieldErr.sexo && <span className={styles.fieldErr}>{fieldErr.sexo}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  className={styles.input}
                  value={form.telefono}
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                />
                {fieldErr.telefono && <span className={styles.fieldErr}>{fieldErr.telefono}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  className={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                {fieldErr.email && <span className={styles.fieldErr}>{fieldErr.email}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="activo_form">Estado</label>
                <select
                  id="activo_form"
                  className={styles.select}
                  value={String(form.activo)}
                  onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.value === 'true' }))}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
                {fieldErr.activo && <span className={styles.fieldErr}>{fieldErr.activo}</span>}
              </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="direccion">Dirección</label>
                <textarea
                  id="direccion"
                  className={styles.textarea}
                  value={form.direccion}
                  onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
                />
                {fieldErr.direccion && <span className={styles.fieldErr}>{fieldErr.direccion}</span>}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnGhost} onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : modal === 'create' ? 'Crear paciente' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
