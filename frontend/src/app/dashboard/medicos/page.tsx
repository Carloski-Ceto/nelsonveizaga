"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { canViewClinicalModule, canWriteModule } from "@/lib/authorization";
import styles from "../clinic.module.css";

interface UserLite {
  id: number;
  nombre_completo?: string;
  username?: string;
  tipo_usuario?: string;
}

interface MedicoRow {
  id_medico: number;
  id_usuario: number;
  nombre_usuario: string;
  matricula: string;
  anios_experiencia: number;
  activo: boolean;
}

interface MedicoEditForm {
  matricula: string;
  anios_experiencia: string;
  activo: boolean;
}

interface PageRes<T> {
  count: number;
  results: T[];
}

function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } }).response?.data;
  if (typeof d === "string") return d;
  if (d && typeof d === "object") {
    const msg = (d.detail || d.error) as string | undefined;
    if (msg) return msg;
  }
  return "Error de solicitud.";
}

export default function MedicosPage() {
  const { me, permissionCodes } = useDashboardUser();
  const canView = canViewClinicalModule(me, "medicos", permissionCodes);
  const canManage = canWriteModule(me, "medicos", permissionCodes);

  const [users, setUsers] = useState<UserLite[]>([]);
  const [rows, setRows] = useState<MedicoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState({
    id_usuario: "",
    matricula: "",
    anios_experiencia: "0",
    activo: true,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createFirstFieldRef = useRef<HTMLSelectElement | null>(null);
  const [editing, setEditing] = useState<MedicoRow | null>(null);
  const [editForm, setEditForm] = useState<MedicoEditForm>({
    matricula: "",
    anios_experiencia: "0",
    activo: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!isCreateOpen && !editing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateOpen(false);
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCreateOpen, editing]);

  useEffect(() => {
    if (!isCreateOpen) return;
    createFirstFieldRef.current?.focus();
  }, [isCreateOpen]);

  const canSubmit =
    !!form.id_usuario &&
    form.matricula.trim().length > 0;

  const load = useCallback(async () => {
    if (!canView) {
      setErr("No tienes permiso para ver Médicos.");
      setLoading(false);
      setRows([]);
      setUsers([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [u, m] = await Promise.all([
        api.get<PageRes<UserLite>>("/api/users?page=1"),
        api.get<PageRes<MedicoRow>>("/api/medicos?page=1"),
      ]);
      setUsers(u.data.results ?? []);
      setRows(m.data.results ?? []);
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addMedico() {
    if (!canManage) return setErr("No tienes permiso para crear médicos.");
    if (!form.id_usuario) return setErr("Selecciona un usuario.");
    if (!form.matricula.trim()) return setErr("Ingresa la matrícula.");
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/medicos", {
        id_usuario: Number(form.id_usuario),
        matricula: form.matricula.trim(),
        anios_experiencia: Number(form.anios_experiencia || "0"),
        activo: form.activo,
      });
      setOk("Médico creado.");
      setIsCreateOpen(false);
      setForm({ id_usuario: "", matricula: "", anios_experiencia: "0", activo: true });
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(row: MedicoRow) {
    setErr(null);
    setOk(null);
    setEditing(row);
    setEditForm({
      matricula: row.matricula,
      anios_experiencia: String(row.anios_experiencia),
      activo: row.activo,
    });
  }

  async function saveEditMedico() {
    if (!editing) return;
    if (!canManage) {
      setErr("No tienes permiso para editar médicos.");
      return;
    }
    if (!editForm.matricula.trim()) {
      setErr("La matrícula es obligatoria.");
      return;
    }
    setSavingEdit(true);
    setErr(null);
    try {
      await api.patch(`/api/medicos/${editing.id_medico}`, {
        matricula: editForm.matricula.trim(),
        anios_experiencia: Number(editForm.anios_experiencia || "0"),
        activo: editForm.activo,
      });
      setOk("Médico actualizado.");
      setEditing(null);
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSavingEdit(false);
    }
  }

  async function deactivateMedico(row: MedicoRow) {
    if (!canManage) return setErr("No tienes permiso para desactivar médicos.");
    if (!row.activo) return setOk("El médico ya está inactivo.");
    setErr(null);
    setOk(null);
    try {
      await api.patch(`/api/medicos/${row.id_medico}`, { activo: false });
      setOk("Médico desactivado.");
      await load();
    } catch (error) {
      setErr(apiErr(error));
    }
  }

  async function removeMedico(id: number) {
    if (!canManage) return setErr("No tienes permiso para eliminar médicos.");
    if (!window.confirm("¿Eliminar médico?")) return;
    setErr(null);
    try {
      await api.delete(`/api/medicos/${id}`);
      setOk("Médico eliminado.");
      await load();
    } catch (error) {
      setErr(apiErr(error));
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Médicos</h1>
        <p className={styles.muted}>Gestión del perfil médico con atributos propios.</p>
      </div>

      {err && <div className={styles.err}>{err}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}

      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => {
            setErr(null);
            setOk(null);
            setIsCreateOpen(true);
          }}
          disabled={!canManage || loading}
        >
          Crear médico
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Usuario</th><th>Matrícula</th><th>Experiencia</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6}>Cargando...</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id_medico}>
                <td>{r.id_medico}</td>
                <td>{r.nombre_usuario || r.id_usuario}</td>
                <td>{r.matricula}</td>
                <td>{r.anios_experiencia} años</td>
                <td><span className={`${styles.badge} ${r.activo ? styles.badgeActive : styles.badgeInactive}`}>{r.activo ? "Activo" : "Inactivo"}</span></td>
                <td>
                  <div className={styles.tableActions}>
                    <button className={styles.btnGhost} type="button" onClick={() => openEdit(r)} disabled={!canManage}>Editar</button>
                    <button className={styles.btn} type="button" onClick={() => void deactivateMedico(r)} disabled={!canManage || !r.activo}>Desactivar</button>
                    <button className={styles.btnDanger} type="button" onClick={() => void removeMedico(r.id_medico)} disabled={!canManage}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setEditing(null)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="medico-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="medico-edit-title" className={styles.modalTitle}>Editar médico #{editing.id_medico}</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="edit-mat">Matrícula</label>
                <input id="edit-mat" value={editForm.matricula} onChange={(e) => setEditForm((p) => ({ ...p, matricula: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-exp">Años experiencia</label>
                <input id="edit-exp" type="number" min={0} max={80} value={editForm.anios_experiencia} onChange={(e) => setEditForm((p) => ({ ...p, anios_experiencia: e.target.value }))} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnGhost} type="button" onClick={() => setEditing(null)} disabled={savingEdit}>Cancelar</button>
              <button className={styles.btnPrimary} type="button" onClick={() => void saveEditMedico()} disabled={savingEdit}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="medico-create-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="medico-create-title" className={styles.modalTitle}>Registrar nuevo médico</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void addMedico();
              }}
            >
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label htmlFor="u">Usuario</label>
                  <select ref={createFirstFieldRef} id="u" value={form.id_usuario} onChange={(e) => setForm((p) => ({ ...p, id_usuario: e.target.value }))}>
                    <option value="">Selecciona usuario</option>
                    {users
                      .filter((u) => u.tipo_usuario === "MEDICO" || u.tipo_usuario === "ADMIN")
                      .map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre_completo || u.username || `Usuario ${u.id}`}</option>
                      ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="mat">Matrícula</label>
                  <input id="mat" value={form.matricula} onChange={(e) => setForm((p) => ({ ...p, matricula: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="exp">Años experiencia</label>
                  <input id="exp" type="number" min={0} max={80} value={form.anios_experiencia} onChange={(e) => setForm((p) => ({ ...p, anios_experiencia: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.btnGhost} type="button" onClick={() => setIsCreateOpen(false)} disabled={saving}>Cancelar</button>
                <button className={styles.btnPrimary} type="submit" disabled={!canManage || !canSubmit || saving || loading}>Guardar médico</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
