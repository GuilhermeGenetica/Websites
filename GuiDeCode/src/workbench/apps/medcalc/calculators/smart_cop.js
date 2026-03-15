export default {
  id: 'smart_cop',
  name: 'SMART-COP',
  shortDescription: 'Predicts need for intensive respiratory or vasopressor support in community-acquired pneumonia.',
  system: 'respiratory',
  specialty: ['Pulmonology', 'Emergency Medicine', 'Critical Care', 'Internal Medicine'],
  tags: ['SMART-COP', 'pneumonia', 'CAP', 'ICU', 'severity', 'IRRT', 'vasopressor'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Charles PGP et al.',
  creatorYear: '2008',
  description: 'SMART-COP predicts the need for intensive respiratory or vasopressor support (IRVS) in community-acquired pneumonia. An acronym for Systolic BP, Multilobar CXR, Albumin, RR, Tachycardia, Confusion, Oxygenation, and pH.',
  whyUse: 'Better than CURB-65 and PSI for identifying patients who need ICU-level respiratory or vasopressor support, even if not initially presenting in shock.',
  whenToUse: [
    'Adults hospitalized with community-acquired pneumonia',
    'Deciding on ICU vs. ward admission',
    'Identifying patients who may deteriorate and need IRVS',
    'Complementary to CURB-65 and PSI',
  ],
  nextSteps: 'Score ≥5: 90% specificity for needing IRVS — consider ICU or HDU. Score 3-4: moderate risk — close monitoring. Score 0-2: low risk of IRVS.',
  pearls: [
    'IRVS = mechanical ventilation OR vasopressors.',
    'Age-adjusted oxygenation: SpO₂ <93% or PaO₂/FiO₂ <250 (<333 if ≥50 years).',
    'Albumin <3.5 g/dL scores 1 point — useful in elderly/malnourished.',
    'Validated in Australian multicenter cohort (n=882).',
  ],
  evidence: 'Charles et al. Clin Infect Dis 2008. AUC 0.87 for predicting need for IRVS. Validated externally in multiple cohorts.',
  formula: `S — SBP <90 mmHg: +2
M — Multilobar CXR infiltrates: +1
A — Albumin <3.5 g/dL: +1
R — RR ≥25 (<50yr) or ≥30 (≥50yr): +1
T — Tachycardia HR ≥125 bpm: +1
C — Confusion (new): +1
O — Poor oxygenation (age-adjusted): +2
P — pH <7.35: +2
Total: 0-11`,
  references: [
    { text: 'Charles PGP et al. SMART-COP: a tool for predicting the need for intensive respiratory or vasopressor support in community-acquired pneumonia. Clin Infect Dis. 2008;47(3):375-384.', url: 'https://pubmed.ncbi.nlm.nih.gov/18558884/' },
  ],
  links: [
    { title: 'MDCalc — SMART-COP', url: 'https://www.mdcalc.com/calc/10200/smart-cop-score-pneumonia-severity', description: 'Interactive SMART-COP calculator' },
  ],
  interpretations: [
    { range: '0-2', label: 'Low risk', action: 'Low risk of IRVS (<10%); ward admission may be appropriate' },
    { range: '3-4', label: 'Moderate risk', action: 'Moderate risk (~30-40% IRVS); close monitoring; consider step-down/HDU' },
    { range: '5-11', label: 'High risk', action: 'High risk of IRVS (>90% specificity at ≥5); ICU consideration' },
  ],
  fields: [
    { key: 'age', label: 'Age', type: 'number', unit: 'years', min: 18, max: 120, placeholder: 'e.g. 65' },
    { key: 'sbp', label: 'Systolic BP <90 mmHg', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
    { key: 'multilobar', label: 'Multilobar CXR infiltrates', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'albumin', label: 'Albumin <3.5 g/dL', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'rr', label: 'Elevated RR (≥25 if <50yr; ≥30 if ≥50yr)', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'tachycardia', label: 'Heart rate ≥125 bpm', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'confusion', label: 'New confusion/disorientation', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'oxygenation', label: 'Poor oxygenation (PaO₂<70 or SpO₂<93% or PaO₂/FiO₂<250 [or <333 if ≥50yr])', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
    { key: 'ph', label: 'Arterial pH <7.35', type: 'select', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
  ],
  calculate(fields) {
    const score = ['sbp','multilobar','albumin','rr','tachycardia','confusion','oxygenation','ph'].reduce((s, k) => s + parseFloat(fields[k] || 0), 0)
    let risk, action
    if (score <= 2) { risk = 'Low risk'; action = 'Low probability of IRVS (<10%); ward admission may be appropriate' }
    else if (score <= 4) { risk = 'Moderate risk'; action = '~30-40% risk of IRVS; close monitoring, consider HDU' }
    else { risk = 'High risk'; action = 'High probability of IRVS; ICU evaluation recommended' }
    const breakdown = [
      { label: 'SBP <90', value: `+${fields.sbp}` },
      { label: 'Multilobar', value: `+${fields.multilobar}` },
      { label: 'Albumin <3.5', value: `+${fields.albumin}` },
      { label: 'Elevated RR', value: `+${fields.rr}` },
      { label: 'Tachycardia', value: `+${fields.tachycardia}` },
      { label: 'Confusion', value: `+${fields.confusion}` },
      { label: 'Poor oxygenation', value: `+${fields.oxygenation}` },
      { label: 'pH <7.35', value: `+${fields.ph}` },
    ]
    return {
      result: score,
      unit: '/ 11',
      interpretation: `${risk}: ${action}`,
      breakdown,
    }
  },
}
