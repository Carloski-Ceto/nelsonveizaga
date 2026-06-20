'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import type { MeProfile } from '@/lib/meProfile';
import styles from '../iam.module.css';

interface UsuarioRow {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  tipo_usuario: string;
  estado: string;
  is_staff: boolean;
}

interface UsuarioRolRow {
  id: number;
  id_rol: number;
  rol_nombre: string;
}

interface RolOption {
  id_rol: number;
  nombre: string;
}

const TIPO_OPTIONS = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'MEDICO', label: 'Médico' },
  { value: 'ESPECIALISTA', label: 'Especialista' },
  { value: 'ADMIN', label: 'Admin del Sistema' },
];

const ESTADO_OPTIONS = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
];

function apiErr(e: unknown): string {
  const ax = e as {
    response?: { data?: Record<string, unknown> | string };
  };
  const d = ax.response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    if (typeof d.error === 'string') return d.error;
    if (typeof d.detail === 'string') return d.detail;
    const vals = Object.values(d).flat();
    const first = vals.find((x) => typeof x === 'string') as string | undefined;
    if (first) return first;
  }
  return 'Error al procesar la solicitud.';
}

function canDeleteUser(me: MeProfile | null, row: UsuarioRow): boolean {
  if (!me) return false;
  if (row.id === me.id) return false;
  if (row.tipo_usuario === 'ADMIN' && me.tipo_usuario !== 'ADMIN') return false;
  return true;
}

function deleteBlockedReason(me: MeProfile | null, row: UsuarioRow): string | null {
  if (!me) return 'Cargando sesión…';
  if (row.id === me.id) return 'No puedes eliminar tu propia cuenta.';
  if (row.tipo_usuario === 'ADMIN' && me.tipo_usuario !== 'ADMIN') {
    return 'Solo un administrador del sistema puede eliminar cuentas Admin.';
  }
  return null;
}

const emptyCreate = {
  username: '',
  email: '',
  password: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  tipo_usuario: 'ADMINISTRATIVO',
  estado: 'ACTIVO',
  is_staff: false,
};

export default function UsuariosPage() {
  const { me } = useDashboardUser();
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const pageSize = 20;

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCreate);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const [userRoles, setUserRoles] = useState<UsuarioRolRow[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolOptions, setRolOptions] = useState<RolOption[]>([]);
  const [rolToAdd, setRolToAdd] = useState<string>('');

  const loadUsers = useCallback(async (p: number) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{ count: number; results: UsuarioRow[] }>(
        `/api/users?page=${p}`
      );
      setRows(res.data.results);
      setCount(res.data.count);
    } catch (e) {
      setErr(
        (e as { response?: { status?: number } }).response?.status === 403
          ? 'No tienes permiso para gestionar usuarios.'
          : 'No se pudo cargar el listado.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  const loadRolOptions = useCallback(async () => {
    try {
      const res = await api.get<{ results: RolOption[] }>('/api/roles?page=1');
      setRolOptions(res.data.results ?? []);
    } catch {
      setRolOptions([]);
    }
  }, []);

  const loadUserRoles = useCallback(async (userId: number) => {
    setRolesLoading(true);
    try {
      const res = await api.get<UsuarioRolRow[]>(`/api/users/${userId}/roles`);
      setUserRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUserRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modal === 'edit' && editId != null) {
      loadUserRoles(editId);
      loadRolOptions();
    } else {
      setUserRoles([]);
      setRolToAdd('');
    }
  }, [modal, editId, loadUserRoles, loadRolOptions]);

  const openCreate = () => {
    setForm(emptyCreate);
    setFormErr(null);
    setFieldErr({});
    setShowCreatePassword(false);
    setEditId(null);
    setModal('create');
  };

  const openEdit = (u: UsuarioRow) => {
    setForm({
      username: u.username,
      email: u.email,
      password: '',
      nombres: u.nombres,
      apellidos: u.apellidos,
      telefono: u.telefono ?? '',
      tipo_usuario: u.tipo_usuario,
      estado: u.estado,
      is_staff: u.is_staff,
    });
    setFormErr(null);
    setFieldErr({});
    setEditId(u.id);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditId(null);
    setSaving(false);
  };

  const submit = async () => {
    setFormErr(null);
    setFieldErr({});
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/api/users', {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim() || undefined,
          tipo_usuario: form.tipo_usuario,
          estado: form.estado,
          is_staff: form.is_staff,
        });
      } else if (modal === 'edit' && editId != null) {
        await api.patch(`/api/users/${editId}`, {
          username: form.username.trim(),
          email: form.email.trim(),
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim() || undefined,
          tipo_usuario: form.tipo_usuario,
          estado: form.estado,
          is_staff: form.is_staff,
        });
      }
      closeModal();
      await loadUsers(page);
    } catch (e) {
      const msg = apiErr(e);
      setFormErr(msg);
      const d = (e as { response?: { data?: Record<string, string[]> } }).response?.data;
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(d)) {
          if (Array.isArray(v) && v[0]) fe[k] = String(v[0]);
          else if (typeof v === 'string') fe[k] = v;
        }
        setFieldErr(fe);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, username: string) => {
    if (!window.confirm(`¿Eliminar usuario "${username}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setErr(null);
    try {
      await api.delete(`/api/users/${id}`);
      await loadUsers(page);
    } catch (e) {
      setErr(apiErr(e));
    }
  };

  const activar = async (id: number) => {
    setErr(null);
    try {
      await api.post(`/api/users/${id}/activar`);
      await loadUsers(page);
    } catch (e) {
      setErr(apiErr(e));
    }
  };

  const bloquear = async (id: number) => {
    setErr(null);
    try {
      await api.post(`/api/users/${id}/bloquear`);
      await loadUsers(page);
    } catch (e) {
      setErr(apiErr(e));
    }
  };

  const addRol = async () => {
    if (editId == null || !rolToAdd) return;
    setFormErr(null);
    try {
      await api.post(`/api/users/${editId}/roles`, { id_rol: Number(rolToAdd) });
      setRolToAdd('');
      await loadUserRoles(editId);
    } catch (e) {
      setFormErr(apiErr(e));
    }
  };

  const removeRol = async (ur: UsuarioRolRow) => {
    if (!window.confirm(`¿Quitar rol "${ur.rol_nombre}" de este usuario?`)) return;
    setFormErr(null);
    try {
      await api.delete(`/api/usuario-roles/${ur.id}`);
      if (editId != null) await loadUserRoles(editId);
    } catch (e) {
      setFormErr(apiErr(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const assignedIds = new Set(userRoles.map((r) => r.id_rol));
  const rolPickOptions = rolOptions.filter((r) => !assignedIds.has(r.id_rol));

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Usuarios</h1>
        <p className={styles.muted}>Personas con acceso al sistema y cómo se reparten sus permisos.</p>
      </div>

      <div className={styles.toolbar}>
        <span />
        <button type="button" className={styles.btnPrimary} onClick={openCreate}>
          Nuevo usuario
        </button>
      </div>

      {err && <div className={styles.err}>{err}</div>}

      {loading ? (
        <p className={styles.loading}>Cargando…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>
                      {u.nombres} {u.apellidos}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.tipo_usuario}</td>
                    <td>{u.estado}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btn}`}
                          onClick={() => openEdit(u)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btn}`}
                          onClick={() => activar(u.id)}
                          disabled={u.estado === 'ACTIVO'}
                        >
                          Activar
                        </button>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btn}`}
                          onClick={() => bloquear(u.id)}
                          disabled={u.estado === 'BLOQUEADO' || u.id === me?.id}
                          title={u.id === me?.id ? 'No puedes bloquear tu propia cuenta.' : undefined}
                        >
                          Bloquear
                        </button>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btnDanger}`}
                          onClick={() => remove(u.id, u.username)}
                          disabled={!canDeleteUser(me, u)}
                          title={deleteBlockedReason(me, u) ?? undefined}
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

          <div className={styles.pager}>
            <span>
              Página {page} de {totalPages} ({count} usuarios)
            </span>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {modal && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) closeModal();
          }}
        >
          <div className={styles.modalPanel} role="dialog" aria-modal="true">
            <h2 className={styles.modalTitle}>
              {modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
            </h2>
            {formErr && <div className={styles.err}>{formErr}</div>}
            <div className={styles.formRow}>
              <label htmlFor="u-user">Usuario</label>
              <input
                id="u-user"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoComplete="username"
              />
              {fieldErr.username && <p className={styles.fieldErr}>{fieldErr.username}</p>}
            </div>
            <div className={styles.formRow}>
              <label htmlFor="u-email">Correo</label>
              <input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {fieldErr.email && <p className={styles.fieldErr}>{fieldErr.email}</p>}
            </div>
            {modal === 'create' && (
              <div className={styles.formRow}>
                <label htmlFor="u-pass">Contraseña</label>
                <div className={styles.pwdField}>
                  <input
                    id="u-pass"
                    type={showCreatePassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.pwdToggle}
                    onClick={() => setShowCreatePassword((v) => !v)}
                    aria-label={showCreatePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showCreatePassword}
                    aria-controls="u-pass"
                    title={showCreatePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showCreatePassword ? (
                      <EyeOff aria-hidden="true" size={16} strokeWidth={1.8} />
                    ) : (
                      <Eye aria-hidden="true" size={16} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
                {fieldErr.password && <p className={styles.fieldErr}>{fieldErr.password}</p>}
              </div>
            )}
            <div className={styles.formRow}>
              <label htmlFor="u-nom">Nombres</label>
              <input
                id="u-nom"
                value={form.nombres}
                onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
              />
              {fieldErr.nombres && <p className={styles.fieldErr}>{fieldErr.nombres}</p>}
            </div>
            <div className={styles.formRow}>
              <label htmlFor="u-ape">Apellidos</label>
              <input
                id="u-ape"
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
              />
              {fieldErr.apellidos && <p className={styles.fieldErr}>{fieldErr.apellidos}</p>}
            </div>
            <div className={styles.formRow}>
              <label htmlFor="u-tel">Teléfono</label>
              <input
                id="u-tel"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <label htmlFor="u-tipo">Tipo</label>
              <select
                id="u-tipo"
                value={form.tipo_usuario}
                onChange={(e) => setForm((f) => ({ ...f, tipo_usuario: e.target.value }))}
              >
                {TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formRow}>
              <label htmlFor="u-est">Estado</label>
              <select
                id="u-est"
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              >
                {ESTADO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formCheck}>
                <input
                  type="checkbox"
                  checked={form.is_staff}
                  onChange={(e) => setForm((f) => ({ ...f, is_staff: e.target.checked }))}
                />
                Staff (acceso admin Django)
              </label>
            </div>

            {modal === 'edit' && editId != null && (
              <div className={styles.formRow}>
                <label>Roles</label>
                {rolesLoading ? (
                  <p className={styles.muted}>Cargando roles…</p>
                ) : (
                  <>
                    <ul className={styles.rolesList}>
                      {userRoles.map((ur) => (
                        <li key={ur.id}>
                          <span>{ur.rol_nombre}</span>
                          <button
                            type="button"
                            className={`${styles.btnSm} ${styles.btnDanger}`}
                            onClick={() => removeRol(ur)}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                      {userRoles.length === 0 && (
                        <li style={{ border: 'none', color: 'var(--color-text-muted)' }}>
                          Sin roles asignados
                        </li>
                      )}
                    </ul>
                    <div style={{ display: 'flex', gap: '8px', marginTop: 8, flexWrap: 'wrap' }}>
                      <select
                        value={rolToAdd}
                        onChange={(e) => setRolToAdd(e.target.value)}
                        style={{ flex: 1, minWidth: '12rem' }}
                      >
                        <option value="">— Añadir rol —</option>
                        {rolPickOptions.map((r) => (
                          <option key={r.id_rol} value={r.id_rol}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        disabled={!rolToAdd}
                        onClick={() => addRol()}
                      >
                        Añadir
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost} onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className={styles.btnPrimary} onClick={submit} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
