'use client';

/**
 * Bitácora — datos desde API (paginación servidor).
 * Horas mostradas en Bolivia (UTC-4) vía helpers en @/lib/timezone.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Search, RotateCcw, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Shield, LogIn,
  AlertTriangle, Clock,
} from 'lucide-react';
import { fmtDate, fmtTimeFull, fmtRelative, nowBoliviaTime, nowBoliviaDateFull } from '@/lib/timezone';
import api from '@/lib/api';
import styles from './page.module.css';

type Accion =
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FALLIDO'
  | 'CREAR' | 'EDITAR' | 'ELIMINAR'
  | 'CAMBIAR_PASSWORD' | 'RECUPERAR_PASSWORD'
  | 'REPROGRAMAR' | 'CANCELAR' | 'CONFIRMAR';

interface BitacoraEvento {
  id_bitacora: number;
  usuario_nombre: string;
  usuario_username: string | null;
  modulo: string;
  tabla_afectada: string | null;
  id_registro_afectado: number | null;
  accion: Accion;
  descripcion: string | null;
  ip_origen: string | null;
  fecha_evento: string;
}

const ACCION_LABEL: Record<Accion, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FALLIDO: 'Login fallido',
  CREAR: 'Crear',
  EDITAR: 'Editar',
  ELIMINAR: 'Eliminar',
  CAMBIAR_PASSWORD: 'Cambiar contraseña',
  RECUPERAR_PASSWORD: 'Recuperar contraseña',
  REPROGRAMAR: 'Reprogramar',
  CANCELAR: 'Cancelar',
  CONFIRMAR: 'Confirmar',
};

const MODULOS = ['Todos', 'auth', 'users', 'roles', 'permisos', 'bitacora'];
const ACCIONES: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Todas las acciones' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FALLIDO', label: 'Login fallido' },
  { value: 'CREAR', label: 'Crear' },
  { value: 'EDITAR', label: 'Editar' },
  { value: 'ELIMINAR', label: 'Eliminar' },
  { value: 'CAMBIAR_PASSWORD', label: 'Cambiar contraseña' },
  { value: 'REPROGRAMAR', label: 'Reprogramar' },
  { value: 'CANCELAR', label: 'Cancelar' },
  { value: 'CONFIRMAR', label: 'Confirmar' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

type SortField = 'fecha_evento' | 'accion' | 'modulo' | 'usuario_nombre';
type SortDir = 'asc' | 'desc';

function BoliviaClock() {
  const [time, setTime] = useState('');
  const [dateStr, setDate] = useState('');

  useEffect(() => {
    function tick() {
      setTime(nowBoliviaTime());
      setDate(nowBoliviaDateFull());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.clockBox}>
      <span className={styles.clockLabel}>
        <span className={styles.clockDot} />
        Santa Cruz, Bolivia (UTC-4)
      </span>
      <span className={styles.clockTime}>{time || '—'}</span>
      <span className={styles.clockDate}>{dateStr}</span>
    </div>
  );
}

export default function BitacoraPage() {
  const [rows, setRows] = useState<BitacoraEvento[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterAcc, setFilterAcc] = useState('all');
  const [filterMod, setFilterMod] = useState('Todos');
  const [sortField, setSortField] = useState<SortField>('fecha_evento');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search.trim()) params.set('search', search.trim());
    if (filterAcc !== 'all') params.set('accion', filterAcc);
    if (filterMod !== 'Todos') params.set('modulo', filterMod);
    const ord = sortDir === 'asc' ? sortField : `-${sortField}`;
    params.set('ordering', ord);
    try {
      const { data } = await api.get<{ count: number; results: BitacoraEvento[] }>(
        `/api/bitacora?${params.toString()}`
      );
      setRows(data.results);
      setCount(data.count);
    } catch (e: unknown) {
      const ex = e as { response?: { status?: number } };
      setLoadErr(
        ex.response?.status === 403
          ? 'No tienes permiso para ver la bitácora.'
          : 'No se pudo cargar la bitácora.'
      );
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterAcc, filterMod, sortField, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className={styles.sortIcon} />;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className={`${styles.sortIcon} ${styles.active}`} />
    ) : (
      <ArrowDown size={12} className={`${styles.sortIcon} ${styles.active}`} />
    );
  }

  const stats = {
    total: count,
    hoy: rows.filter((e) => fmtDate(e.fecha_evento) === fmtDate(new Date().toISOString())).length,
    fallidos: rows.filter((e) => e.accion === 'LOGIN_FALLIDO').length,
    sesiones: rows.filter((e) => e.accion === 'LOGIN').length,
  };

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setFilterAcc('all');
    setFilterMod('Todos');
    setPage(1);
  }

  const hasFilters = search || filterAcc !== 'all' || filterMod !== 'Todos';

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitleRow}>
            <Activity size={22} color="var(--color-primary)" strokeWidth={2} />
            <h1 className={styles.pageTitle}>Bitácora del Sistema</h1>
          </div>
          <p className={styles.pageSubtitle}>
            Auditoría — hora Bolivia (UTC-4). Datos desde el backend.
          </p>
        </div>
        <BoliviaClock />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EDE9FE' }}>
            <Shield size={19} color="var(--color-primary)" strokeWidth={1.8} />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>{stats.total.toLocaleString()}</p>
            <p className={styles.statLabel}>Total (filtrado)</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#DBEAFE' }}>
            <Clock size={19} color="#2563EB" strokeWidth={1.8} />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>{stats.hoy}</p>
            <p className={styles.statLabel}>En esta página (hoy)</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#DCFCE7' }}>
            <LogIn size={19} color="#16A34A" strokeWidth={1.8} />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>{stats.sesiones}</p>
            <p className={styles.statLabel}>Login (página)</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FEE2E2' }}>
            <AlertTriangle size={19} color="#DC2626" strokeWidth={1.8} />
          </div>
          <div className={styles.statBody}>
            <p className={styles.statValue}>{stats.fallidos}</p>
            <p className={styles.statLabel}>Fallidos (página)</p>
          </div>
        </div>
      </div>

      {loadErr && (
        <div style={{ padding: '1rem', background: '#FEF2F2', color: '#991B1B', borderRadius: 8 }}>
          {loadErr}
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <Search size={15} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar (descripción, módulo, IP, usuario)…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={filterAcc}
            onChange={(e) => {
              setFilterAcc(e.target.value);
              setPage(1);
            }}
          >
            {ACCIONES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filterMod}
            onChange={(e) => {
              setFilterMod(e.target.value);
              setPage(1);
            }}
          >
            {MODULOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button type="button" className={styles.clearBtn} onClick={clearFilters}>
              <RotateCcw size={13} /> Limpiar
            </button>
          )}

          <span className={styles.resultCount}>{count} eventos</span>
        </div>

        <div className={styles.tableWrap}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando…</p>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Search size={22} />
              </div>
              <p className={styles.emptyTitle}>Sin resultados</p>
              <p className={styles.emptyText}>No hay eventos para los filtros actuales.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => toggleSort('fecha_evento')}>
                    Fecha / Hora (BO) <SortIcon field="fecha_evento" />
                  </th>
                  <th onClick={() => toggleSort('usuario_nombre')}>
                    Usuario <SortIcon field="usuario_nombre" />
                  </th>
                  <th onClick={() => toggleSort('modulo')}>
                    Módulo <SortIcon field="modulo" />
                  </th>
                  <th onClick={() => toggleSort('accion')}>
                    Acción <SortIcon field="accion" />
                  </th>
                  <th>Descripción</th>
                  <th>IP Origen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ev) => (
                  <tr key={ev.id_bitacora}>
                    <td className={styles.tdTimestamp}>
                      <span className={styles.tsDate}>{fmtDate(ev.fecha_evento)}</span>
                      <span className={styles.tsTime}>{fmtTimeFull(ev.fecha_evento)}</span>
                      <span className={styles.tsRelative}>{fmtRelative(ev.fecha_evento)}</span>
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>{getInitials(ev.usuario_nombre)}</div>
                        <div>
                          <span className={styles.userName}>{ev.usuario_nombre}</span>
                          {ev.usuario_username && (
                            <span className={styles.userRole}>@{ev.usuario_username}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.moduloCell}>
                        <span className={styles.moduloName}>{ev.modulo}</span>
                        {ev.tabla_afectada && (
                          <span className={styles.tablaName}>{ev.tabla_afectada}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${ev.accion}`] ?? ''}`}>
                        {ACCION_LABEL[ev.accion] ?? ev.accion}
                      </span>
                    </td>
                    <td className={styles.descCell} title={ev.descripcion ?? ''}>
                      {ev.descripcion ?? '—'}
                    </td>
                    <td className={styles.ipCell}>{ev.ip_origen ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages} ({count} eventos)
            </span>
            <div className={styles.pageButtons}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
