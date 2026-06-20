'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule } from '@/lib/authorization';
import styles from '../clinic.module.css';

interface CitaRow { id_cita: number; id_paciente: number; id_especialista: number; fecha_hora_inicio: string; fecha_hora_fin: string; estado: string; motivo: string; }
interface PageRes<T> { count: number; results: T[]; }

function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } }).response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && typeof d.detail === 'string') return d.detail;
  return 'No se pudo cargar la agenda.';
}

export default function AgendaMedicaPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [rows, setRows] = useState<CitaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const canViewAgenda = canViewClinicalModule(me, 'agenda', permissionCodes);

  const load = useCallback(async () => {
    if (!canViewAgenda) {
      setRows([]);
      setErr('No tienes permiso para ver la agenda médica.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<PageRes<CitaRow>>('/api/agenda-medica?page=1');
      setRows(res.data.results ?? []);
    } catch (error) {
      setErr(apiErr(error));
    } finally { setLoading(false); }
  }, [canViewAgenda]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Agenda medica</h1>
        <p className={styles.muted}>Vista de lectura para seguimiento de la jornada clinica.</p>
      </div>
      {err && <div className={styles.err}>{err}</div>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Cita</th><th>Paciente</th><th>Especialista</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Motivo</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}>Cargando agenda...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7}>No hay citas para mostrar.</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id_cita}>
                <td>{r.id_cita}</td>
                <td>{r.id_paciente}</td>
                <td>{r.id_especialista}</td>
                <td>{new Date(r.fecha_hora_inicio).toLocaleString('es-BO')}</td>
                <td>{new Date(r.fecha_hora_fin).toLocaleString('es-BO')}</td>
                <td>{r.estado}</td>
                <td>{r.motivo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
