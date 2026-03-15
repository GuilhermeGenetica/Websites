export default {
  id: 'rox_index',
  name: 'ROX Index',
  shortDescription: 'Predicts success/failure of high-flow nasal cannula to avoid intubation',
  system: 'respiratory',
  specialty: ['Critical Care', 'Pulmonology', 'Emergency Medicine'],
  tags: ['ROX', 'HFNC', 'high-flow', 'oxygen', 'intubation', 'respiratory failure'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Roca O et al.',
  creatorYear: '2016',
  description: 'The ROX (Respiratory rate-OXygenation) Index predicts the need for intubation in patients receiving high-flow nasal cannula (HFNC) for acute hypoxemic respiratory failure. It combines SpO₂/FiO₂ ratio with respiratory rate. A ROX ≥ 4.88 at 2, 6, or 12 hours is associated with low risk of intubation.',
  whyUse: 'Guides early identification of HFNC failure. Helps avoid delayed intubation (which increases mortality). Simple bedside calculation with continuous monitoring parameters.',
  whenToUse: [
    'Patients on HFNC for acute hypoxemic respiratory failure',
    'Serial assessment at 2, 6, and 12 hours of HFNC therapy',
    'Decision support for escalation to intubation',
  ],
  nextSteps: 'ROX ≥ 4.88: Low intubation risk, continue HFNC. ROX < 3.85: High risk of HFNC failure — prepare for intubation. ROX 3.85-4.88: Reassess in 1-2 hours; consider escalation if not improving.',
  pearls: [
    'ROX ≥ 4.88 at 2, 6, or 12 hours is the validated threshold for low intubation risk.',
    'ROX < 3.85 at 12 hours is associated with high intubation risk.',
    'Trend is important: a FALLING ROX index is concerning even if still above threshold.',
    'Validated primarily in pneumonia patients; use with caution in other etiologies.',
    'FiO₂ on HFNC is estimated based on flow rate and patient inspiratory demand.',
    'Does not replace clinical judgment — assess work of breathing, mental status, hemodynamics.',
  ],
  evidence: 'Derived by Roca et al. (J Crit Care 2016) in 157 patients with pneumonia on HFNC. Validated in a multicenter cohort (Roca et al., Chest 2019). ROX ≥ 4.88 associated with low intubation risk (HR 0.27).',
  formula: 'ROX = (SpO₂ / FiO₂) / Respiratory Rate\nSpO₂ in %, FiO₂ as decimal (e.g., 0.60 for 60%)\nThreshold: ≥ 4.88 = low risk of intubation',
  references: [
    { text: 'Roca O et al. An index combining respiratory rate and oxygenation to predict outcome of nasal high-flow therapy. Am J Respir Crit Care Med. 2019;199(11):1368-1376.', url: 'https://pubmed.ncbi.nlm.nih.gov/30576221/' },
  ],
  links: [
    { title: 'MDCalc — ROX Index', url: 'https://www.mdcalc.com/calc/10092/rox-index-intubation-hfnc', description: 'Interactive ROX Index calculator' },
  ],
  interpretations: [
    { range: '≥4.88', label: 'Low risk of intubation', action: 'Continue HFNC; reassess periodically' },
    { range: '3.85-4.87', label: 'Indeterminate — borderline risk', action: 'Close monitoring; reassess in 1-2 hours; prepare for possible intubation' },
    { range: '<3.85', label: 'High risk of HFNC failure', action: 'Consider intubation; do not delay if clinical deterioration' },
  ],
  fields: [
    { key: 'spo2', label: 'SpO₂', type: 'number', min: 50, max: 100, step: 1, placeholder: '%', hint: '%' },
    { key: 'fio2', label: 'FiO₂', type: 'number', min: 21, max: 100, step: 1, placeholder: '%', hint: '% (e.g., 60 for 60%)' },
    { key: 'rr', label: 'Respiratory Rate', type: 'number', min: 1, max: 80, step: 1, placeholder: 'breaths/min', hint: 'breaths/min' },
  ],
  calculate: (vals) => {
    const spo2 = parseFloat(vals.spo2)
    const fio2 = parseFloat(vals.fio2)
    const rr = parseFloat(vals.rr)
    if (!spo2 || !fio2 || !rr || rr <= 0 || fio2 <= 0) return null
    const fio2Decimal = fio2 / 100
    const rox = (spo2 / fio2Decimal) / rr
    let interp = ''
    if (rox >= 4.88) interp = 'Low risk of intubation — continue HFNC'
    else if (rox >= 3.85) interp = 'Borderline — close monitoring, reassess in 1-2 hours'
    else interp = 'High risk of HFNC failure — consider intubation'
    return {
      result: rox.toFixed(2),
      unit: '',
      interpretation: interp,
      detail: `SpO₂: ${spo2}%, FiO₂: ${fio2}%, RR: ${rr}/min`,
    }
  },
}
