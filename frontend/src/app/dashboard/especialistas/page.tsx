"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { canViewClinicalModule, canWriteModule } from "@/lib/authorization";
import styles from "../clinic.module.css";

interface MedicoOption {
  id_medico: number;
  nombre_usuario: string;
}
interface EspecialistaRow {
  id_especialista: number;
  id_medico?: number;
  id_usuario?: number;
  nombre_usuario: string;
  especialidad: string;
  registro_profesional: string;
  activo: boolean;
}
interface HorarioRow {
  id_horario: number;
  id_especialista: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_min: number;
  activo: boolean;
}
interface EspecialistaEditForm {
  especialidad: string;
  registro_profesional: string;
  activo: boolean;
}

interface HorarioEditForm {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_min: string;
  activo: boolean;
}
interface PageRes<T> {
  count: number;
  results: T[];
}

const dias = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } })
    .response?.data;
  if (typeof d === "string") return d;
  if (d && typeof d === "object") {
    const msg = (d.detail || d.error) as string | undefined;
    if (msg) return msg;
  }
  return "Error de solicitud.";
}

export default function EspecialistasPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [medicos, setMedicos] = useState<MedicoOption[]>([]);
  const [rows, setRows] = useState<EspecialistaRow[]>([]);
  const [horarios, setHorarios] = useState<HorarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState({
    id_medico: "",
    especialidad: "",
    registro_profesional: "",
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [isCreateEspecialistaOpen, setIsCreateEspecialistaOpen] =
    useState(false);
  const especialistaFirstFieldRef = useRef<HTMLSelectElement | null>(null);
  const [editingEspecialista, setEditingEspecialista] =
    useState<EspecialistaRow | null>(null);
  const [editEspecialistaForm, setEditEspecialistaForm] =
    useState<EspecialistaEditForm>({
      especialidad: "",
      registro_profesional: "",
      activo: true,
    });
  const [savingEditEspecialista, setSavingEditEspecialista] = useState(false);

  const [hForm, setHForm] = useState({
    id_especialista: "",
    dia_semana: "0",
    hora_inicio: "08:00",
    hora_fin: "12:00",
    duracion_slot_min: "30",
    activo: true,
  });
  const [savingH, setSavingH] = useState(false);
  const [isCreateHorarioOpen, setIsCreateHorarioOpen] = useState(false);
  const horarioFirstFieldRef = useRef<HTMLSelectElement | null>(null);
  const [editingHorario, setEditingHorario] = useState<HorarioRow | null>(null);
  const [editHorarioForm, setEditHorarioForm] = useState<HorarioEditForm>({
    dia_semana: "0",
    hora_inicio: "08:00",
    hora_fin: "12:00",
    duracion_slot_min: "30",
    activo: true,
  });
  const [savingEditHorario, setSavingEditHorario] = useState(false);
  const canManageEspecialistas = canWriteModule(
    me,
    "especialistas",
    permissionCodes,
  );
  const canViewEspecialistas = canViewClinicalModule(
    me,
    "especialistas",
    permissionCodes,
  );
  const canSubmitEspecialista =
    !!form.id_medico &&
    form.especialidad.trim().length > 0 &&
    form.registro_profesional.trim().length > 0;
  const canSubmitHorario =
    !!hForm.id_especialista &&
    hForm.hora_inicio.trim().length > 0 &&
    hForm.hora_fin.trim().length > 0;

  useEffect(() => {
    const anyModalOpen =
      isCreateEspecialistaOpen ||
      isCreateHorarioOpen ||
      Boolean(editingEspecialista) ||
      Boolean(editingHorario);
    if (!anyModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateEspecialistaOpen(false);
        setIsCreateHorarioOpen(false);
        setEditingEspecialista(null);
        setEditingHorario(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isCreateEspecialistaOpen,
    isCreateHorarioOpen,
    editingEspecialista,
    editingHorario,
  ]);

  useEffect(() => {
    if (isCreateEspecialistaOpen) especialistaFirstFieldRef.current?.focus();
  }, [isCreateEspecialistaOpen]);

  useEffect(() => {
    if (isCreateHorarioOpen) horarioFirstFieldRef.current?.focus();
  }, [isCreateHorarioOpen]);

  const load = useCallback(async () => {
    if (!canViewEspecialistas) {
      setMedicos([]);
      setRows([]);
      setHorarios([]);
      setErr("No tienes permiso para ver Especialistas y Horarios.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [u, e, h] = await Promise.all([
        api.get<PageRes<MedicoOption>>("/api/medicos?page=1"),
        api.get<PageRes<EspecialistaRow>>("/api/especialistas?page=1"),
        api.get<PageRes<HorarioRow>>("/api/horarios-especialista?page=1"),
      ]);
      setMedicos(u.data.results ?? []);
      setRows(e.data.results ?? []);
      setHorarios(h.data.results ?? []);
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setLoading(false);
    }
  }, [canViewEspecialistas]);

  useEffect(() => {
    load();
  }, [load]);

  async function addEspecialista() {
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para crear especialistas.");
      return;
    }
    if (!form.id_medico) {
      setErr("Selecciona un médico para crear el especialista.");
      return;
    }
    if (!form.especialidad.trim()) {
      setErr("Ingresa la especialidad.");
      return;
    }
    if (!form.registro_profesional.trim()) {
      setErr("Ingresa el registro profesional.");
      return;
    }
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/especialistas", {
        id_medico: Number(form.id_medico),
        especialidad: form.especialidad.trim(),
        registro_profesional: form.registro_profesional.trim(),
        activo: form.activo,
      });
      setOk("Especialista creado.");
      setIsCreateEspecialistaOpen(false);
      setForm({
        id_medico: "",
        especialidad: "",
        registro_profesional: "",
        activo: true,
      });
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSaving(false);
    }
  }

  async function removeEspecialista(id: number) {
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para eliminar especialistas.");
      return;
    }
    if (!window.confirm("Eliminar especialista?")) return;
    setErr(null);
    try {
      await api.delete(`/api/especialistas/${id}`);
      setOk("Especialista eliminado.");
      await load();
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 409) {
        const row = rows.find((r) => r.id_especialista === id);
        const shouldDeactivate = window.confirm(
          "No se puede eliminar porque tiene historial clínico asociado. ¿Quieres desactivarlo ahora?",
        );
        if (row && shouldDeactivate) {
          await deactivateEspecialista(row);
          return;
        }
      }
      setErr(apiErr(error));
    }
  }

  async function deactivateEspecialista(row: EspecialistaRow) {
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para desactivar especialistas.");
      return;
    }
    if (!row.activo) {
      setOk("El especialista ya está inactivo.");
      return;
    }
    setErr(null);
    setOk(null);
    try {
      await api.patch(`/api/especialistas/${row.id_especialista}`, {
        activo: false,
      });
      setOk("Especialista desactivado.");
      await load();
    } catch (error) {
      setErr(apiErr(error));
    }
  }

  function openEditEspecialista(row: EspecialistaRow) {
    setErr(null);
    setOk(null);
    setEditingEspecialista(row);
    setEditEspecialistaForm({
      especialidad: row.especialidad,
      registro_profesional: row.registro_profesional,
      activo: row.activo,
    });
  }

  async function saveEditEspecialista() {
    if (!editingEspecialista) return;
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para editar especialistas.");
      return;
    }
    if (!editEspecialistaForm.especialidad.trim()) {
      setErr("Ingresa la especialidad.");
      return;
    }
    if (!editEspecialistaForm.registro_profesional.trim()) {
      setErr("Ingresa el registro profesional.");
      return;
    }
    setSavingEditEspecialista(true);
    setErr(null);
    try {
      await api.patch(`/api/especialistas/${editingEspecialista.id_especialista}`, {
        especialidad: editEspecialistaForm.especialidad.trim(),
        registro_profesional: editEspecialistaForm.registro_profesional.trim(),
        activo: editEspecialistaForm.activo,
      });
      setOk("Especialista actualizado.");
      setEditingEspecialista(null);
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSavingEditEspecialista(false);
    }
  }

  async function addHorario() {
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para crear horarios.");
      return;
    }
    if (!hForm.id_especialista) {
      setErr("Selecciona un especialista para crear el horario.");
      return;
    }
    if (!hForm.hora_inicio || !hForm.hora_fin) {
      setErr("Debes definir hora de inicio y fin.");
      return;
    }
    setSavingH(true);
    setErr(null);
    try {
      await api.post("/api/horarios-especialista", {
        id_especialista: Number(hForm.id_especialista),
        dia_semana: Number(hForm.dia_semana),
        hora_inicio: hForm.hora_inicio,
        hora_fin: hForm.hora_fin,
        duracion_slot_min: Number(hForm.duracion_slot_min),
        activo: hForm.activo,
      });
      setOk("Horario creado.");
      setIsCreateHorarioOpen(false);
      setHForm({
        id_especialista: "",
        dia_semana: "0",
        hora_inicio: "08:00",
        hora_fin: "12:00",
        duracion_slot_min: "30",
        activo: true,
      });
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSavingH(false);
    }
  }

  async function removeHorario(id: number) {
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para eliminar horarios.");
      return;
    }
    if (!window.confirm("Eliminar horario?")) return;
    setErr(null);
    try {
      await api.delete(`/api/horarios-especialista/${id}`);
      setOk("Horario eliminado.");
      await load();
    } catch (error) {
      setErr(apiErr(error));
    }
  }

  function openEditHorario(row: HorarioRow) {
    setErr(null);
    setOk(null);
    setEditingHorario(row);
    setEditHorarioForm({
      dia_semana: String(row.dia_semana),
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      duracion_slot_min: String(row.duracion_slot_min),
      activo: row.activo,
    });
  }

  async function saveEditHorario() {
    if (!editingHorario) return;
    if (!canManageEspecialistas) {
      setErr("No tienes permiso para editar horarios.");
      return;
    }
    if (!editHorarioForm.hora_inicio || !editHorarioForm.hora_fin) {
      setErr("Debes definir hora de inicio y fin.");
      return;
    }
    setSavingEditHorario(true);
    setErr(null);
    try {
      await api.patch(`/api/horarios-especialista/${editingHorario.id_horario}`, {
        dia_semana: Number(editHorarioForm.dia_semana),
        hora_inicio: editHorarioForm.hora_inicio,
        hora_fin: editHorarioForm.hora_fin,
        duracion_slot_min: Number(editHorarioForm.duracion_slot_min),
        activo: editHorarioForm.activo,
      });
      setOk("Horario actualizado.");
      setEditingHorario(null);
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSavingEditHorario(false);
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Especialistas y horarios</h1>
        <p className={styles.muted}>
          Gestion de perfiles profesionales y disponibilidad base para citas.
        </p>
      </div>

      <div className={styles.hero}>
        Primero registra el especialista y luego configura sus bloques de
        horario semanales.
      </div>
      {err && <div className={styles.err}>{err}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}
      {!canManageEspecialistas && (
        <div className={styles.err}>
          Tu rol es de solo lectura en Especialistas y Horarios. Puedes
          consultar datos, pero no crear ni eliminar.
        </div>
      )}

      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => {
            setErr(null);
            setOk(null);
            setIsCreateEspecialistaOpen(true);
          }}
          disabled={!canManageEspecialistas || loading}
        >
          Crear especialista
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Especialidad</th>
              <th>Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>Cargando...</td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id_especialista}>
                  <td>{r.id_especialista}</td>
                  <td>{r.nombre_usuario || (r.id_usuario ?? r.id_medico ?? "—")}</td>
                  <td>{r.especialidad}</td>
                  <td>{r.registro_profesional}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${r.activo ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      {r.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        className={styles.btnGhost}
                        type="button"
                        onClick={() => openEditEspecialista(r)}
                        disabled={!canManageEspecialistas}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btn}
                        type="button"
                        onClick={() => deactivateEspecialista(r)}
                        disabled={!canManageEspecialistas || !r.activo}
                        title={r.activo ? "Desactivar especialista" : "Especialista ya inactivo"}
                      >
                        Desactivar
                      </button>
                      <button
                        className={styles.btnDanger}
                        type="button"
                        onClick={() => removeEspecialista(r.id_especialista)}
                        disabled={!canManageEspecialistas}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div style={{ height: "1rem" }} />

      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => {
            setErr(null);
            setOk(null);
            setIsCreateHorarioOpen(true);
          }}
          disabled={!canManageEspecialistas || loading}
        >
          Crear horario
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Especialista</th>
              <th>Dia</th>
              <th>Bloque</th>
              <th>Duracion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>Cargando...</td>
              </tr>
            )}
            {!loading &&
              horarios.map((h) => (
                <tr key={h.id_horario}>
                  <td>{h.id_horario}</td>
                  <td>{h.id_especialista}</td>
                  <td>{dias[h.dia_semana] || h.dia_semana}</td>
                  <td>
                    {h.hora_inicio} - {h.hora_fin}
                  </td>
                  <td>{h.duracion_slot_min} min</td>
                  <td>
                    <button
                      className={styles.btnGhost}
                      type="button"
                      onClick={() => openEditHorario(h)}
                      disabled={!canManageEspecialistas}
                      style={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDanger}
                      type="button"
                      onClick={() => removeHorario(h.id_horario)}
                      disabled={!canManageEspecialistas}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isCreateEspecialistaOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setIsCreateEspecialistaOpen(false)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-especialista-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-especialista-title" className={styles.modalTitle}>
              Registrar especialista
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void addEspecialista();
              }}
            >
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label htmlFor="create-u">Médico</label>
                  <select
                    ref={especialistaFirstFieldRef}
                    id="create-u"
                    value={form.id_medico}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, id_medico: e.target.value }))
                    }
                  >
                    <option value="">Selecciona médico</option>
                    {medicos.map((m) => (
                      <option key={m.id_medico} value={m.id_medico}>
                        {m.nombre_usuario || `Médico ${m.id_medico}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-esp">Especialidad</label>
                  <input
                    id="create-esp"
                    value={form.especialidad}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, especialidad: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-reg">Registro profesional</label>
                  <input
                    id="create-reg"
                    value={form.registro_profesional}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        registro_profesional: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  className={styles.btnGhost}
                  type="button"
                  onClick={() => setIsCreateEspecialistaOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnPrimary}
                  type="submit"
                  disabled={
                    saving ||
                    loading ||
                    !canManageEspecialistas ||
                    !canSubmitEspecialista
                  }
                >
                  Guardar especialista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateHorarioOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setIsCreateHorarioOpen(false)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-horario-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-horario-title" className={styles.modalTitle}>
              Registrar horario
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void addHorario();
              }}
            >
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label htmlFor="create-he">Especialista</label>
                  <select
                    ref={horarioFirstFieldRef}
                    id="create-he"
                    value={hForm.id_especialista}
                    onChange={(e) =>
                      setHForm((p) => ({ ...p, id_especialista: e.target.value }))
                    }
                  >
                    <option value="">Selecciona especialista</option>
                    {rows.map((r) => (
                      <option key={r.id_especialista} value={r.id_especialista}>
                        {r.nombre_usuario} · {r.especialidad}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-dia">Día semana</label>
                  <select
                    id="create-dia"
                    value={hForm.dia_semana}
                    onChange={(e) =>
                      setHForm((p) => ({ ...p, dia_semana: e.target.value }))
                    }
                  >
                    {dias.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-ini">Hora inicio</label>
                  <input
                    id="create-ini"
                    type="time"
                    value={hForm.hora_inicio}
                    onChange={(e) =>
                      setHForm((p) => ({ ...p, hora_inicio: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="create-fin">Hora fin</label>
                  <input
                    id="create-fin"
                    type="time"
                    value={hForm.hora_fin}
                    onChange={(e) =>
                      setHForm((p) => ({ ...p, hora_fin: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  className={styles.btnGhost}
                  type="button"
                  onClick={() => setIsCreateHorarioOpen(false)}
                  disabled={savingH}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnPrimary}
                  type="submit"
                  disabled={
                    savingH ||
                    loading ||
                    !canManageEspecialistas ||
                    !canSubmitHorario
                  }
                >
                  Guardar horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEspecialista && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setEditingEspecialista(null)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-especialista-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-especialista-title" className={styles.modalTitle}>
              Editar especialista #{editingEspecialista.id_especialista}
            </h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="edit-especialidad">Especialidad</label>
                <input
                  id="edit-especialidad"
                  value={editEspecialistaForm.especialidad}
                  onChange={(e) =>
                    setEditEspecialistaForm((p) => ({
                      ...p,
                      especialidad: e.target.value,
                    }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-registro">Registro profesional</label>
                <input
                  id="edit-registro"
                  value={editEspecialistaForm.registro_profesional}
                  onChange={(e) =>
                    setEditEspecialistaForm((p) => ({
                      ...p,
                      registro_profesional: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.btnGhost}
                type="button"
                onClick={() => setEditingEspecialista(null)}
                disabled={savingEditEspecialista}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                type="button"
                onClick={() => void saveEditEspecialista()}
                disabled={savingEditEspecialista}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {editingHorario && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setEditingHorario(null)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-horario-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-horario-title" className={styles.modalTitle}>
              Editar horario #{editingHorario.id_horario}
            </h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="edit-dia">Día semana</label>
                <select
                  id="edit-dia"
                  value={editHorarioForm.dia_semana}
                  onChange={(e) =>
                    setEditHorarioForm((p) => ({ ...p, dia_semana: e.target.value }))
                  }
                >
                  {dias.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-duracion">Duración slot (min)</label>
                <input
                  id="edit-duracion"
                  type="number"
                  min={5}
                  value={editHorarioForm.duracion_slot_min}
                  onChange={(e) =>
                    setEditHorarioForm((p) => ({
                      ...p,
                      duracion_slot_min: e.target.value,
                    }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-inicio">Hora inicio</label>
                <input
                  id="edit-inicio"
                  type="time"
                  value={editHorarioForm.hora_inicio}
                  onChange={(e) =>
                    setEditHorarioForm((p) => ({ ...p, hora_inicio: e.target.value }))
                  }
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-fin">Hora fin</label>
                <input
                  id="edit-fin"
                  type="time"
                  value={editHorarioForm.hora_fin}
                  onChange={(e) =>
                    setEditHorarioForm((p) => ({ ...p, hora_fin: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.btnGhost}
                type="button"
                onClick={() => setEditingHorario(null)}
                disabled={savingEditHorario}
              >
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                type="button"
                onClick={() => void saveEditHorario()}
                disabled={savingEditHorario}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
