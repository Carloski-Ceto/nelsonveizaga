'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import styles from '../iam.module.css';

interface RolRow {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

interface PermisoRow {
  id_permiso: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion: string | null;
}

interface RolPermisoApiRow {
  id_rol: number;
  id_permiso: number;
  fecha_asignacion?: string;
}

const PERM_PAGE = 20;

async function fetchAllPermisos(): Promise<PermisoRow[]> {
  const all: PermisoRow[] = [];
  let p = 1;
  while (true) {
    const res = await api.get<{ count: number; results: PermisoRow[] }>(
      `/api/permisos?page=${p}`,
    );
    const batch = res.data.results ?? [];
    all.push(...batch);
    if (batch.length < PERM_PAGE || all.length >= (res.data.count ?? 0)) break;
    p += 1;
  }
  return all;
}

async function syncRolePermisos(rolId: number, wanted: Set<number>): Promise<void> {
  const { data } = await api.get<RolPermisoApiRow[]>(`/api/roles/${rolId}/permisos`);
  const current = new Set(
    (Array.isArray(data) ? data : []).map((r) => Number(r.id_permiso)),
  );
  const toRemove = [...current].filter((id) => !wanted.has(id));
  const toAdd = [...wanted].filter((id) => !current.has(id));
  for (const pid of toRemove) {
    await api.delete(`/api/roles/${rolId}/permisos/${pid}`);
  }
  for (const pid of toAdd) {
    await api.post(`/api/roles/${rolId}/permisos`, { id_permiso: pid });
  }
}

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

const emptyForm = {
  nombre: '',
  descripcion: '',
  activo: true,
};

export default function RolesPage() {
  const [rows, setRows] = useState<RolRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const pageSize = 20;

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editPk, setEditPk] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [permCatalog, setPermCatalog] = useState<PermisoRow[]>([]);
  const [permCatalogLoading, setPermCatalogLoading] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(() => new Set());

  const loadRoles = useCallback(async (p: number) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{ count: number; results: RolRow[] }>(`/api/roles?page=${p}`);
      setRows(res.data.results);
      setCount(res.data.count);
    } catch (e) {
      setErr(
        (e as { response?: { status?: number } }).response?.status === 403
          ? 'Solo administradores pueden gestionar roles.'
          : 'No se pudo cargar el listado.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles(page);
  }, [page, loadRoles]);

  useEffect(() => {
    if (!modal) return;
    let cancel = false;
    setPermCatalogLoading(true);
    fetchAllPermisos()
      .then((list) => {
        if (!cancel) setPermCatalog(list);
      })
      .catch(() => {
        if (!cancel) setPermCatalog([]);
      })
      .finally(() => {
        if (!cancel) setPermCatalogLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [modal]);

  useEffect(() => {
    if (modal !== 'edit' || editPk == null) return;
    let cancel = false;
    api
      .get<RolPermisoApiRow[]>(`/api/roles/${editPk}/permisos`)
      .then(({ data }) => {
        if (cancel) return;
        const ids = new Set(
          (Array.isArray(data) ? data : []).map((r) => Number(r.id_permiso)),
        );
        setSelectedPermIds(ids);
      })
      .catch(() => {
        if (!cancel) setSelectedPermIds(new Set());
      });
    return () => {
      cancel = true;
    };
  }, [modal, editPk]);

  const permisosByModulo = useMemo(() => {
    const m = new Map<string, PermisoRow[]>();
    for (const p of permCatalog) {
      const key = p.modulo || '—';
      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.codigo.localeCompare(b.codigo));
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permCatalog]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormErr(null);
    setFieldErr({});
    setEditPk(null);
    setSelectedPermIds(new Set());
    setModal('create');
  };

  const openEdit = (r: RolRow) => {
    setForm({
      nombre: r.nombre,
      descripcion: r.descripcion ?? '',
      activo: r.activo,
    });
    setFormErr(null);
    setFieldErr({});
    setSelectedPermIds(new Set());
    setEditPk(r.id_rol);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditPk(null);
    setSaving(false);
    setPermCatalog([]);
    setSelectedPermIds(new Set());
  };

  function togglePermiso(id: number) {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const submit = async () => {
    setFormErr(null);
    setFieldErr({});
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        activo: form.activo,
      };
      let rolId: number | null = null;
      if (modal === 'create') {
        const res = await api.post<{ id_rol: number }>('/api/roles', body);
        rolId = res.data.id_rol;
      } else if (modal === 'edit' && editPk != null) {
        await api.patch(`/api/roles/${editPk}`, body);
        rolId = editPk;
      }
      if (rolId != null) {
        await syncRolePermisos(rolId, selectedPermIds);
      }
      closeModal();
      await loadRoles(page);
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

  const remove = async (r: RolRow) => {
    if (
      !window.confirm(
        `¿Eliminar rol "${r.nombre}"? Solo si no está en uso crítico.`,
      )
    ) {
      return;
    }
    setErr(null);
    try {
      await api.delete(`/api/roles/${r.id_rol}`);
      await loadRoles(page);
    } catch (e) {
      setErr(apiErr(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Roles</h1>
        <p className={styles.muted}>Conjuntos de acceso pensados para cada tipo de responsabilidad.</p>
      </div>

      <div className={styles.toolbar}>
        <span />
        <button type="button" className={styles.btnPrimary} onClick={openCreate}>
          Nuevo rol
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
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id_rol}>
                    <td>{r.nombre}</td>
                    <td>{r.descripcion ?? '—'}</td>
                    <td>{r.activo ? 'Sí' : 'No'}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btn}`}
                          onClick={() => openEdit(r)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${styles.btnSm} ${styles.btnDanger}`}
                          onClick={() => remove(r)}
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
              Página {page} de {totalPages} ({count} roles)
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
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '36rem' }}
          >
            <h2 className={styles.modalTitle}>
              {modal === 'create' ? 'Nuevo rol' : 'Editar rol'}
            </h2>
            {formErr && <div className={styles.err}>{formErr}</div>}
            <div className={styles.formRow}>
              <label htmlFor="r-nom">Nombre</label>
              <input
                id="r-nom"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              {fieldErr.nombre && <p className={styles.fieldErr}>{fieldErr.nombre}</p>}
            </div>
            <div className={styles.formRow}>
              <label htmlFor="r-desc">Descripción</label>
              <textarea
                id="r-desc"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formCheck}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                />
                Activo
              </label>
            </div>

            <div className={styles.formRow}>
              <label>Permisos del rol</label>
              {permCatalogLoading ? (
                <p className={styles.muted}>Cargando permisos…</p>
              ) : permCatalog.length === 0 ? (
                <p className={styles.muted}>No se pudieron cargar permisos.</p>
              ) : (
                <div
                  style={{
                    maxHeight: 'min(50vh, 280px)',
                    overflowY: 'auto',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 8,
                    padding: '0.5rem 0.75rem',
                  }}
                >
                  {permisosByModulo.map(([modulo, lista]) => (
                    <div key={modulo} style={{ marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-muted, #6b7280)',
                          marginBottom: 4,
                        }}
                      >
                        {modulo}
                      </div>
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {lista.map((p) => (
                          <li key={p.id_permiso} style={{ marginBottom: 4 }}>
                            <label
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'flex-start',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermIds.has(p.id_permiso)}
                                onChange={() => togglePermiso(p.id_permiso)}
                                disabled={saving}
                              />
                              <span>
                                <strong>{p.codigo}</strong>
                                {' — '}
                                {p.nombre}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              <p className={styles.muted} style={{ marginTop: 6, fontSize: '0.8rem' }}>
                {selectedPermIds.size} permiso(s) seleccionado(s). Se guardan al pulsar Guardar.
              </p>
            </div>

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
