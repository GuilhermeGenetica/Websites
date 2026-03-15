export default {
  id: 'qsofa',
  name: 'qSOFA (Quick SOFA)',
  shortDescription: 'Bedside sepsis screening tool — no lab tests required',
  system: 'critical_care',
  specialty: ['Emergency Medicine', 'Internal Medicine', 'Critical Care'],
  tags: ['sepsis', 'qSOFA', 'screening', 'infection', 'ICU', 'mortality'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Seymour CW et al. (Sepsis-3)',
  creatorYear: '2016',
  description: 'Quick SOFA (qSOFA) is a bedside screening tool introduced with the Sepsis-3 definitions. It identifies patients with suspected infection who are at risk for poor outcomes (ICU admission or death). It requires no laboratory tests and uses only three clinical criteria: altered mentation, respiratory rate ≥ 22, and systolic BP ≤ 100.',
  whyUse: 'Rapid bedside screening for sepsis risk — no labs needed. Identifies patients who need further assessment with full SOFA score. Designed for use outside the ICU (ED, wards, pre-hospital).',
  whenToUse: [
    'Suspected infection on general wards or in ED',
    'Bedside screening when lab results are not yet available',
    'Triage tool to identify patients needing ICU-level assessment',
  ],
  nextSteps: 'qSOFA ≥ 2: Assess for organ dysfunction with full SOFA score. Consider lactate measurement. Initiate sepsis bundle if sepsis confirmed. qSOFA < 2 does NOT exclude sepsis — maintain clinical vigilance.',
  pearls: [
    'qSOFA is a SCREENING tool, not a diagnostic criterion for sepsis.',
    'qSOFA ≥ 2 does NOT equal sepsis — it identifies patients needing further evaluation.',
    'Sensitivity for sepsis is moderate — do NOT use qSOFA alone to rule out sepsis.',
    'Most useful outside the ICU; inside ICU, use full SOFA score.',
    'Altered mentation = GCS < 15 (any new change from baseline).',
  ],
  evidence: 'Derived from Sepsis-3 consensus (Seymour et al., JAMA 2016). qSOFA ≥ 2 associated with 3-14× higher in-hospital mortality in patients with suspected infection. Criticized for low sensitivity (~50%) — should not replace clinical judgment.',
  formula: 'One point each for:\n1. Altered mentation (GCS < 15)\n2. Respiratory rate ≥ 22/min\n3. Systolic blood pressure ≤ 100 mmHg\nPositive: ≥ 2 points',
  references: [
    { text: 'Seymour CW et al. Assessment of Clinical Criteria for Sepsis. JAMA. 2016;315(8):762-774.', url: 'https://pubmed.ncbi.nlm.nih.gov/26903335/' },
    { text: 'Singer M et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.', url: 'https://pubmed.ncbi.nlm.nih.gov/26903338/' },
  ],
  links: [
    { title: 'MDCalc — qSOFA', url: 'https://www.mdcalc.com/calc/2654/qsofa-quick-sofa-score-sepsis', description: 'Interactive qSOFA calculator' },
  ],
  interpretations: [
    { range: '0', label: 'Low risk', action: 'Continue monitoring; qSOFA negative does not exclude sepsis' },
    { range: '1', label: 'Intermediate — not yet positive', action: 'Monitor closely; reassess if clinical condition changes' },
    { range: '2-3', label: 'Positive qSOFA — high risk', action: 'Assess with full SOFA score. Consider lactate. Initiate sepsis workup/bundle.' },
  ],
  fields: [
    { key: 'mentation', label: 'Altered mentation (GCS < 15)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'rr', label: 'Respiratory rate ≥ 22/min', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'sbp', label: 'Systolic BP ≤ 100 mmHg', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['mentation', 'rr', 'sbp']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score < 2) interp = 'qSOFA negative — low risk but does not exclude sepsis'
    else interp = 'qSOFA positive (≥ 2) — assess for organ dysfunction, consider sepsis bundle'
    return {
      result: String(score),
      unit: 'points (0-3)',
      interpretation: interp,
    }
  },
}
