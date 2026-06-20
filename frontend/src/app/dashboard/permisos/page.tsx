'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import styles from '../iam.module.css';

interface PermisoRow {
  id_permiso: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion: string | null;
}

export default function PermisosPage() {
  const [rows, setRows] = useState<PermisoRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setErr(null);
    api
      .get<{ count: number; results: PermisoRow[] }>(`/api/permisos?page=${page}`)
      .then((res) => {
        if (!cancel) {
          setRows(res.data.results);
          setCount(res.data.count);
        }
      })
      .catch((e) => {
        if (!cancel) {
          setErr(
            e.response?.status === 403
              ? 'Solo administradores pueden gestionar permisos.'
              : 'No se pudo cargar el listado.'
          );
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Permisos</h1>
        <p className={styles.muted}>Acciones disponibles en la herramienta, organizadas por módulo.</p>
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
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Módulo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id_permiso}>
                    <td>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td>{p.modulo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <span>
              Página {page} de {totalPages} ({count} permisos)
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
    </>
  );
}
