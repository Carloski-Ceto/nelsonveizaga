import type { Detalle, DetalleEditableField, TipoCorreccion } from '../domain';
import { tipoLabel } from '../domain';
import styles from '../page.module.css';

interface Props {
  tipo: TipoCorreccion;
  detalles: Detalle[];
  disabled: boolean;
  onChange: (index: number, field: DetalleEditableField, value: string) => void;
}

interface NumericFieldProps {
  id: string;
  label: string;
  value: string;
  step: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}

function NumericField(props: NumericFieldProps) {
  const { id, label, value, step, min, max, required, disabled, onChange } = props;
  return (
    <label htmlFor={id}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      <input id={id} type="number" inputMode="decimal" step={step} min={min} max={max}
        value={value} required={required} disabled={disabled}
        onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export default function PrescriptionDetailsForm({ tipo, detalles, disabled, onChange }: Props) {
  return (
    <section className={styles.lensSection} aria-labelledby={`section-${tipo}`}>
      <div className={styles.lensHeading}>
        <h4 id={`section-${tipo}`}>{tipoLabel[tipo]}</h4>
        <small>{tipo === 'ANTEOJOS'
          ? 'La distancia pupilar es monocular y obligatoria por ojo.'
          : 'La adaptación requiere curva base, diámetro, marca y modelo.'}</small>
      </div>

      {detalles.map((detalle, index) => detalle.tipo_correccion === tipo && (
        <fieldset className={styles.eyeCard} key={`${tipo}-${detalle.ojo}`} disabled={disabled}>
          <legend>{detalle.ojo === 'OD' ? 'Ojo derecho (OD)' : 'Ojo izquierdo (OI)'}</legend>
          <p className={styles.prefillHint}>ESF, CIL y EJE fueron precargados desde el examen de refracción. Confirma o ajusta la prescripción final.</p>
          <div className={styles.fieldsGrid}>
            <NumericField id={`${tipo}-${detalle.ojo}-esfera`} label="Esfera (D)" value={detalle.esfera} step="0.25" min="-30" max="30" required disabled={disabled} onChange={(value) => onChange(index, 'esfera', value)} />
            <NumericField id={`${tipo}-${detalle.ojo}-cilindro`} label="Cilindro (D)" value={detalle.cilindro} step="0.25" min="-15" max="15" required disabled={disabled} onChange={(value) => onChange(index, 'cilindro', value)} />
            <NumericField id={`${tipo}-${detalle.ojo}-eje`} label="Eje (°)" value={detalle.eje} step="1" min="0" max="180" required={Number(detalle.cilindro) !== 0} disabled={disabled} onChange={(value) => onChange(index, 'eje', value)} />
            <NumericField id={`${tipo}-${detalle.ojo}-adicion`} label="Adición (D)" value={detalle.adicion} step="0.25" min="0" max="6" disabled={disabled} onChange={(value) => onChange(index, 'adicion', value)} />

            {tipo === 'ANTEOJOS' ? <>
              <NumericField id={`${tipo}-${detalle.ojo}-dp`} label="DP monocular (mm)" value={detalle.distancia_pupilar_mm} step="0.5" min="20" max="45" required disabled={disabled} onChange={(value) => onChange(index, 'distancia_pupilar_mm', value)} />
              <NumericField id={`${tipo}-${detalle.ojo}-prisma`} label="Prisma (Δ)" value={detalle.prisma} step="0.25" min="0.01" max="20" disabled={disabled} onChange={(value) => {
                onChange(index, 'prisma', value);
                if (!value) onChange(index, 'base_prisma', '');
              }} />
              <label htmlFor={`${tipo}-${detalle.ojo}-base`}><span>Base del prisma</span>
                <select id={`${tipo}-${detalle.ojo}-base`} value={detalle.base_prisma} disabled={disabled || !detalle.prisma} required={Boolean(detalle.prisma)} onChange={(event) => onChange(index, 'base_prisma', event.target.value)}>
                  <option value="">Seleccionar…</option><option value="SUPERIOR">Superior</option><option value="INFERIOR">Inferior</option><option value="INTERNA">Interna</option><option value="EXTERNA">Externa</option>
                </select>
              </label>
            </> : <>
              <NumericField id={`${tipo}-${detalle.ojo}-curva`} label="Curva base (mm)" value={detalle.curva_base_mm} step="0.1" min="6" max="10" required disabled={disabled} onChange={(value) => onChange(index, 'curva_base_mm', value)} />
              <NumericField id={`${tipo}-${detalle.ojo}-diametro`} label="Diámetro (mm)" value={detalle.diametro_mm} step="0.1" min="10" max="17" required disabled={disabled} onChange={(value) => onChange(index, 'diametro_mm', value)} />
              <label htmlFor={`${tipo}-${detalle.ojo}-marca`}><span>Marca *</span><input id={`${tipo}-${detalle.ojo}-marca`} type="text" maxLength={120} value={detalle.marca} required disabled={disabled} onChange={(event) => onChange(index, 'marca', event.target.value)} /></label>
              <label htmlFor={`${tipo}-${detalle.ojo}-modelo`}><span>Modelo *</span><input id={`${tipo}-${detalle.ojo}-modelo`} type="text" maxLength={120} value={detalle.modelo} required disabled={disabled} onChange={(event) => onChange(index, 'modelo', event.target.value)} /></label>
              <label htmlFor={`${tipo}-${detalle.ojo}-material`}><span>Material</span><input id={`${tipo}-${detalle.ojo}-material`} type="text" maxLength={120} value={detalle.material} disabled={disabled} onChange={(event) => onChange(index, 'material', event.target.value)} /></label>
              <label htmlFor={`${tipo}-${detalle.ojo}-reemplazo`}><span>Reemplazo</span><input id={`${tipo}-${detalle.ojo}-reemplazo`} type="text" maxLength={80} value={detalle.modalidad_reemplazo} placeholder="Ej. mensual" disabled={disabled} onChange={(event) => onChange(index, 'modalidad_reemplazo', event.target.value)} /></label>
            </>}
          </div>
          <label className={styles.observationField} htmlFor={`${tipo}-${detalle.ojo}-observaciones`}><span>Observaciones del ojo</span><input id={`${tipo}-${detalle.ojo}-observaciones`} type="text" maxLength={255} value={detalle.observaciones} disabled={disabled} onChange={(event) => onChange(index, 'observaciones', event.target.value)} /></label>
        </fieldset>
      ))}
    </section>
  );
}
