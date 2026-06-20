'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import api from '@/lib/api';
import { useDashboardUser } from '@/contexts/DashboardUserContext';
import { canViewClinicalModule, canWriteCitaAction, canWriteModule } from '@/lib/authorization';
import styles from '../clinic.module.css';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface PageRes<T> { count: number; results: T[]; }
interface PacienteRow {
  id_paciente: number;
  nombres: string;
  apellidos: string;
  documento_identidad?: string;
  fecha_nacimiento?: string;
}
interface EspecialistaRow { id_especialista: number; nombre_usuario: string; especialidad: string; }
interface CitaRow { id_cita: number; id_paciente: number; id_especialista: number; fecha_hora_inicio: string; fecha_hora_fin: string; motivo: string; estado: string; }
interface HorarioRow {
  id_horario: number;
  id_especialista: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_min: number;
  activo: boolean;
}

const MIN_MOTIVO_LEN = 8;
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function apiErr(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> | string } }).response?.data;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object') {
    if (typeof d.detail === 'string') return d.detail;
    const vals = Object.values(d).flat();
    const v = vals.find((x) => typeof x === 'string');
    if (typeof v === 'string') return v;
  }
  return 'Error en solicitud.';
}

interface CreateCitaModalProps {
  form: { id_paciente: string; id_especialista: string; fecha: string; hora: string; motivo: string };
  setForm: React.Dispatch<React.SetStateAction<{ id_paciente: string; id_especialista: string; fecha: string; hora: string; motivo: string }>>;
  canCreateCitas: boolean;
  pacientes: PacienteRow[];
  especialistas: EspecialistaRow[];
  horarios: HorarioRow[];
  loading: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  reload: () => Promise<void>;
  createPacienteRef: React.RefObject<HTMLSelectElement>;
}

function CreateCitaModal({
  form, setForm, canCreateCitas, pacientes, especialistas, horarios,
  loading, onClose, onSuccess, onError, reload, createPacienteRef,
}: CreateCitaModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h * 60) + m;
  }

  function toHHMM(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function getBackendDayIndex(dateISO: string): number | null {
    if (!dateISO) return null;
    const jsDay = new Date(`${dateISO}T00:00:00`).getDay();
    return (jsDay + 6) % 7;
  }

  const selectedBackendDay = getBackendDayIndex(form.fecha);
  const horariosEspecialistaSemana = horarios
    .filter((h) => h.id_especialista === Number(form.id_especialista))
    .sort((a, b) => (a.dia_semana - b.dia_semana) || a.hora_inicio.localeCompare(b.hora_inicio));
  const horariosDelEspecialista = horarios.filter(
    (h) => h.id_especialista === Number(form.id_especialista) && selectedBackendDay !== null && h.dia_semana === selectedBackendDay,
  );
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const horasDisponibles = horariosDelEspecialista.flatMap((h) => {
    const start = toMinutes(h.hora_inicio.slice(0, 5));
    const end = toMinutes(h.hora_fin.slice(0, 5));
    const step = Math.max(5, h.duracion_slot_min || 30);
    const slots: string[] = [];
    for (let t = start; t + step <= end; t += step) {
      slots.push(toHHMM(t));
    }
    return slots;
  });
  const horasDisponiblesUnicas = Array.from(new Set(horasDisponibles)).sort();

  async function handleSubmit() {
    if (!canCreateCitas) { onError('No tienes permiso para programar citas.'); return; }
    if (!form.id_paciente || !form.id_especialista || !form.fecha || !form.hora) {
      onError('Completa paciente, especialista, fecha y hora para programar la cita.');
      return;
    }
    if (!stripe || !elements) { onError('Stripe no está listo. Recargá la página.'); return; }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { onError('Error al cargar el formulario de pago.'); return; }

    setSaving(true);
    onError('');

    try {
      const intentRes = await api.post<{ client_secret: string; payment_intent_id: string }>(
        '/api/pagos/crear-intent',
        {},
      );
      const { client_secret, payment_intent_id } = intentRes.data;

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        onError(stripeError.message ?? 'Error al procesar el pago.');
        return;
      }
      if (paymentIntent?.status !== 'succeeded') {
        onError('El pago no fue aprobado. Intentá con otra tarjeta.');
        return;
      }

      const iso = new Date(`${form.fecha}T${form.hora}:00`).toISOString();
      await api.post('/api/citas', {
        id_paciente: Number(form.id_paciente),
        id_especialista: Number(form.id_especialista),
        fecha_hora_inicio: iso,
        motivo: form.motivo,
        stripe_payment_intent_id: payment_intent_id,
      });

      onSuccess('Cita programada y pago procesado.');
      onClose();
      setForm({ id_paciente: '', id_especialista: '', fecha: '', hora: '', motivo: '' });
      await reload();
    } catch (error) {
      onError(apiErr(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="create-cita-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="create-cita-title" className={styles.modalTitle}>Programar cita</h2>
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
          <div className={styles.grid2}>
            <div className={styles.field}><label>Paciente</label><select ref={createPacienteRef} value={form.id_paciente} onChange={(e) => setForm((p) => ({ ...p, id_paciente: e.target.value }))}><option value="">Selecciona</option>{pacientes.map((p) => <option key={p.id_paciente} value={p.id_paciente}>{p.apellidos}, {p.nombres} · {p.documento_identidad || `ID ${p.id_paciente}`}{p.fecha_nacimiento ? ` · Nac. ${p.fecha_nacimiento}` : ''}</option>)}</select></div>
            <div className={styles.field}><label>Especialista</label><select value={form.id_especialista} onChange={(e) => setForm((p) => ({ ...p, id_especialista: e.target.value }))}><option value="">Selecciona</option>{especialistas.map((e) => <option key={e.id_especialista} value={e.id_especialista}>{e.nombre_usuario} · {e.especialidad}</option>)}</select></div>
            <div className={styles.field}><label>Fecha</label><input type="date" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} /></div>
            <div className={styles.field}>
              <label>Hora</label>
              <input
                type="time"
                list="horas-disponibles-especialista"
                value={form.hora}
                onChange={(e) => setForm((p) => ({ ...p, hora: e.target.value }))}
              />
              {form.id_especialista && form.fecha && horariosDelEspecialista.length === 0 && (
                <small className={styles.fieldErr}>El especialista no tiene horario configurado para ese día.</small>
              )}
              {form.id_especialista && !form.fecha && horariosEspecialistaSemana.length > 0 && (
                <small className={styles.muted}>Selecciona una fecha para ver horas disponibles ese día.</small>
              )}
              {horasDisponiblesUnicas.length > 0 && (
                <small className={styles.muted}>
                  Horarios sugeridos: {horasDisponiblesUnicas.slice(0, 8).join(', ')}{horasDisponiblesUnicas.length > 8 ? '…' : ''}
                </small>
              )}
              <datalist id="horas-disponibles-especialista">
                {horasDisponiblesUnicas.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>
          </div>
          {form.id_especialista && horariosEspecialistaSemana.length > 0 && (
            <div className={styles.field} style={{ marginTop: '0.5rem' }}>
              <label>Horarios del especialista</label>
              <small className={styles.muted}>
                {horariosEspecialistaSemana
                  .map((h) => `${diasSemana[h.dia_semana] ?? h.dia_semana}: ${h.hora_inicio.slice(0, 5)}-${h.hora_fin.slice(0, 5)} (${h.duracion_slot_min} min)`)
                  .join(' · ')}
              </small>
            </div>
          )}
          <div className={styles.field} style={{ marginTop: '1rem' }}>
            <label>Motivo</label>
            <input value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))} />
          </div>
          <div className={styles.field} style={{ marginTop: '1rem' }}>
            <label>Pago con tarjeta (modo prueba)</label>
            <div className={styles.cardWrapper}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '15px',
                      color: '#1e293b',
                      '::placeholder': { color: '#94a3b8' },
                    },
                  },
                  hidePostalCode: true,
                }}
              />
            </div>
            <p className={styles.cardHint}>Tarjeta de prueba: 4242 4242 4242 4242 · Vto: cualquier fecha futura · CVC: cualquier 3 dígitos</p>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btn} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || loading || !canCreateCitas}>{saving ? 'Procesando pago...' : 'Pagar y guardar cita'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CitasPage() {
  const { me, permissionCodes } = useDashboardUser();
  const [pacientes, setPacientes] = useState<PacienteRow[]>([]);
  const [especialistas, setEspecialistas] = useState<EspecialistaRow[]>([]);
  const [rows, setRows] = useState<CitaRow[]>([]);
  const [horarios, setHorarios] = useState<HorarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState({ id_paciente: '', id_especialista: '', fecha: '', hora: '', motivo: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [cancelModal, setCancelModal] = useState({ isOpen: false, citaId: null as number | null, motivo: '' });
  const [reschModal, setReschModal] = useState({ isOpen: false, citaId: null as number | null, fecha: '', hora: '', motivo: '' });
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [cancelTouched, setCancelTouched] = useState(false);
  const [reschTouched, setReschTouched] = useState(false);
  const canManageCitas = canWriteModule(me, 'citas', permissionCodes);
  const canCreateCitas = canWriteCitaAction(me, 'crear', permissionCodes);
  const canReprogramCitas = canWriteCitaAction(me, 'reprogramar', permissionCodes);
  const canCancelCitas = canWriteCitaAction(me, 'cancelar', permissionCodes);
  const canViewCitas = canViewClinicalModule(me, 'citas', permissionCodes);

  const cancelPanelRef = useRef<HTMLDivElement | null>(null);
  const reschPanelRef = useRef<HTMLDivElement | null>(null);
  const cancelMotivoRef = useRef<HTMLTextAreaElement | null>(null);
  const reschFechaRef = useRef<HTMLInputElement | null>(null);
  const createPacienteRef = useRef<HTMLSelectElement | null>(null);

  const cancelMotivoLen = cancelModal.motivo.trim().length;
  const cancelMotivoErr = cancelTouched && cancelMotivoLen < MIN_MOTIVO_LEN
    ? `El motivo debe tener al menos ${MIN_MOTIVO_LEN} caracteres.`
    : null;
  const reschMotivoLen = reschModal.motivo.trim().length;
  const reschFechaErr = reschTouched && !reschModal.fecha ? 'La fecha es obligatoria.' : null;
  const reschHoraErr = reschTouched && !reschModal.hora ? 'La hora es obligatoria.' : null;
  const reschMotivoErr = reschTouched && reschMotivoLen < MIN_MOTIVO_LEN
    ? `El motivo debe tener al menos ${MIN_MOTIVO_LEN} caracteres.`
    : null;

  const openCancelModal = (id: number) => {
    if (!canCancelCitas) return;
    setCancelTouched(false);
    setCancelModal({ isOpen: true, citaId: id, motivo: '' });
  };

  const closeCancelModal = useCallback(() => {
    if (submittingCancel) return;
    setCancelTouched(false);
    setCancelModal({ isOpen: false, citaId: null, motivo: '' });
  }, [submittingCancel]);

  const openReschModal = (id: number) => {
    if (!canReprogramCitas) return;
    setReschTouched(false);
    setReschModal({ isOpen: true, citaId: id, fecha: '', hora: '', motivo: '' });
  };

  const closeReschModal = useCallback(() => {
    if (submittingReschedule) return;
    setReschTouched(false);
    setReschModal({ isOpen: false, citaId: null, fecha: '', hora: '', motivo: '' });
  }, [submittingReschedule]);

  const trapFocus = (panel: HTMLDivElement, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (cancelModal.isOpen) {
      cancelMotivoRef.current?.focus();
    }
  }, [cancelModal.isOpen]);

  useEffect(() => {
    if (reschModal.isOpen) {
      reschFechaRef.current?.focus();
    }
  }, [reschModal.isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCreateOpen) {
          event.preventDefault();
          setIsCreateOpen(false);
          return;
        }
        if (cancelModal.isOpen) {
          event.preventDefault();
          closeCancelModal();
          return;
        }
        if (reschModal.isOpen) {
          event.preventDefault();
          closeReschModal();
        }
        return;
      }

      if (cancelModal.isOpen && cancelPanelRef.current) {
        trapFocus(cancelPanelRef.current, event);
        return;
      }

      if (reschModal.isOpen && reschPanelRef.current) {
        trapFocus(reschPanelRef.current, event);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelModal.isOpen, closeCancelModal, closeReschModal, isCreateOpen, reschModal.isOpen]);

  useEffect(() => {
    if (isCreateOpen) createPacienteRef.current?.focus();
  }, [isCreateOpen]);

  const load = useCallback(async () => {
    if (!canViewCitas) {
      setPacientes([]);
      setEspecialistas([]);
      setRows([]);
      setErr('No tienes permiso para ver el módulo de citas.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      if (!canCreateCitas) {
        const [pRes, cRes] = await Promise.all([
          api.get<PageRes<PacienteRow>>('/api/pacientes?page=1&page_size=500&ordering=apellidos'),
          api.get<PageRes<CitaRow>>('/api/citas?page=1'),
        ]);
        const uniquePacientes = Array.from(
          new Map((pRes.data.results ?? []).map((item) => [item.id_paciente, item])).values(),
        );
        setPacientes(uniquePacientes);
        setRows(cRes.data.results ?? []);
        setEspecialistas([]);
        setHorarios([]);
      } else {
        const [p, e, c, h] = await Promise.all([
          api.get<PageRes<PacienteRow>>('/api/pacientes?page=1&page_size=500&ordering=apellidos'),
          api.get<PageRes<EspecialistaRow>>('/api/especialistas?page=1'),
          api.get<PageRes<CitaRow>>('/api/citas?page=1'),
          api.get<PageRes<HorarioRow>>('/api/horarios-especialista?page=1&page_size=500'),
        ]);
        const uniquePacientes = Array.from(
          new Map((p.data.results ?? []).map((item) => [item.id_paciente, item])).values(),
        );
        setPacientes(uniquePacientes);
        setEspecialistas(e.data.results ?? []);
        setRows(c.data.results ?? []);
        setHorarios((h.data.results ?? []).filter((x) => x.activo));
      }
    } catch (error) {
      setErr(apiErr(error));
    } finally { setLoading(false); }
  }, [canViewCitas, canCreateCitas]);

  useEffect(() => { load(); }, [load]);

  const getPacienteNombre = (id: number) => {
    const p = pacientes.find(x => x.id_paciente === id);
    return p
      ? `${p.nombres} ${p.apellidos}${p.documento_identidad ? ` · ${p.documento_identidad}` : ''}`
      : id;
  };

  const getEspecialistaNombre = (id: number) => {
    const e = especialistas.find(x => x.id_especialista === id);
    return e ? `${e.nombre_usuario} (${e.especialidad})` : id;
  };

  async function confirmarCancelar() {
    if (!canCancelCitas) {
      setErr('No tienes permiso para cancelar citas.');
      return;
    }
    const motivo = cancelModal.motivo.trim();
    setCancelTouched(true);
    if (!cancelModal.citaId || motivo.length < MIN_MOTIVO_LEN || submittingCancel) return;
    setErr(null);
    setSubmittingCancel(true);
    try {
      await api.post(`/api/citas/${cancelModal.citaId}/cancelar`, { motivo_cancelacion: motivo });
      setOk('Cita cancelada exitosamente.');
      closeCancelModal();
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSubmittingCancel(false);
    }
  }

  async function confirmarReprogramar() {
    if (!canReprogramCitas) {
      setErr('No tienes permiso para reprogramar citas.');
      return;
    }
    const motivo = reschModal.motivo.trim();
    setReschTouched(true);
    if (!reschModal.citaId || !reschModal.fecha || !reschModal.hora || motivo.length < MIN_MOTIVO_LEN || submittingReschedule) return;
    setErr(null);
    setSubmittingReschedule(true);
    try {
      const dt = new Date(`${reschModal.fecha}T${reschModal.hora}:00`);
      if (Number.isNaN(dt.getTime())) {
        setErr('Fecha u hora invalida para reprogramar la cita.');
        return;
      }
      const iso = dt.toISOString();
      await api.post(`/api/citas/${reschModal.citaId}/reprogramar`, {
        nueva_fecha_hora_inicio: iso,
        motivo_reprogramacion: motivo,
      });
      setOk('Cita reprogramada exitosamente.');
      closeReschModal();
      await load();
    } catch (error) {
      setErr(apiErr(error));
    } finally {
      setSubmittingReschedule(false);
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Citas</h1>
        <p className={styles.muted}>Programacion operativa con acciones de negocio: reprogramar y cancelar.</p>
      </div>
      <div className={styles.hero}>Las validaciones de disponibilidad y solapamiento viven en backend.</div>
      {err && <div className={styles.err}>{err}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}
      {!canManageCitas && <div className={styles.err}>Tu rol es de solo lectura en Citas. Puedes consultar agenda y estados, pero no programar ni modificar citas.</div>}
      {canManageCitas && (!canCreateCitas || !canReprogramCitas || !canCancelCitas) && (
        <div className={styles.muted}>Permisos activos en Citas: {canCreateCitas ? 'crear ' : ''}{canReprogramCitas ? 'reprogramar ' : ''}{canCancelCitas ? 'cancelar' : ''}</div>
      )}

      <div className={styles.actions} style={{ marginBottom: '1rem' }}>
        <button type="button" className={styles.btnPrimary} onClick={() => { setIsCreateOpen(true); }} disabled={loading || !canCreateCitas}>Programar cita</button>
      </div>

      {isCreateOpen && (
        <Elements stripe={stripePromise}>
          <CreateCitaModal
            form={form}
            setForm={setForm}
            canCreateCitas={canCreateCitas}
            pacientes={pacientes}
            especialistas={especialistas}
            horarios={horarios}
            loading={loading}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={(msg) => setOk(msg)}
            onError={(msg) => setErr(msg || null)}
            reload={load}
            createPacienteRef={createPacienteRef}
          />
        </Elements>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Paciente</th><th>Especialista</th><th>Inicio</th><th>Estado</th><th>Motivo</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}>Cargando...</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id_cita}>
                <td>{r.id_cita}</td>
                <td>{getPacienteNombre(r.id_paciente)}</td>
                <td>{getEspecialistaNombre(r.id_especialista)}</td>
                <td>{new Date(r.fecha_hora_inicio).toLocaleString('es-BO')}</td>
                <td>{r.estado}</td>
                <td>{r.motivo}</td>
                <td>
                  <div className={styles.tableActions}>
                    <button type="button" className={styles.btn} onClick={() => openReschModal(r.id_cita)} disabled={!canReprogramCitas}>Reprogramar</button>
                    <button type="button" className={styles.btnDanger} onClick={() => openCancelModal(r.id_cita)} disabled={!canCancelCitas}>Cancelar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {cancelModal.isOpen && (
        <div className={styles.modalBackdrop} onClick={closeCancelModal}>
          <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title" ref={cancelPanelRef} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle} id="cancel-modal-title">Cancelar Cita #{cancelModal.citaId}</h2>
            <div className={styles.field}>
              <label>Motivo de cancelación</label>
              <textarea ref={cancelMotivoRef} value={cancelModal.motivo} onChange={(e) => setCancelModal(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Explique brevemente por qué se cancela la cita..." aria-invalid={Boolean(cancelMotivoErr)} aria-describedby="cancel-motivo-help" />
              <small id="cancel-motivo-help" className={cancelMotivoErr ? styles.fieldErr : styles.muted}>
                {cancelMotivoErr ?? `Minimo ${MIN_MOTIVO_LEN} caracteres.`}
              </small>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btn} onClick={closeCancelModal} disabled={submittingCancel}>Volver</button>
              <button type="button" className={styles.btnDanger} onClick={confirmarCancelar} disabled={cancelModal.motivo.trim().length < MIN_MOTIVO_LEN || submittingCancel}>{submittingCancel ? 'Cancelando...' : 'Confirmar Cancelación'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschModal.isOpen && (
        <div className={styles.modalBackdrop} onClick={closeReschModal}>
          <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="resch-modal-title" ref={reschPanelRef} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle} id="resch-modal-title">Reprogramar Cita #{reschModal.citaId}</h2>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Nueva Fecha</label>
                <input ref={reschFechaRef} type="date" value={reschModal.fecha} onChange={(e) => setReschModal(prev => ({ ...prev, fecha: e.target.value }))} aria-invalid={Boolean(reschFechaErr)} aria-describedby="resch-fecha-help" />
                {reschFechaErr && <small id="resch-fecha-help" className={styles.fieldErr}>{reschFechaErr}</small>}
              </div>
              <div className={styles.field}>
                <label>Nueva Hora</label>
                <input type="time" value={reschModal.hora} onChange={(e) => setReschModal(prev => ({ ...prev, hora: e.target.value }))} aria-invalid={Boolean(reschHoraErr)} aria-describedby="resch-hora-help" />
                {reschHoraErr && <small id="resch-hora-help" className={styles.fieldErr}>{reschHoraErr}</small>}
              </div>
            </div>
            <div className={styles.field} style={{ marginTop: '1rem' }}>
              <label>Motivo de Reprogramación</label>
              <textarea value={reschModal.motivo} onChange={(e) => setReschModal(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Explique el motivo..." aria-invalid={Boolean(reschMotivoErr)} aria-describedby="resch-motivo-help" />
              <small id="resch-motivo-help" className={reschMotivoErr ? styles.fieldErr : styles.muted}>
                {reschMotivoErr ?? `Minimo ${MIN_MOTIVO_LEN} caracteres.`}
              </small>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btn} onClick={closeReschModal} disabled={submittingReschedule}>Volver</button>
              <button type="button" className={styles.btnPrimary} onClick={confirmarReprogramar} disabled={!reschModal.fecha || !reschModal.hora || reschModal.motivo.trim().length < MIN_MOTIVO_LEN || submittingReschedule}>{submittingReschedule ? 'Reprogramando...' : 'Confirmar Reprogramación'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
