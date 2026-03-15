export default {
  id: 'sirs',
  name: 'SIRS Criteria',
  shortDescription: 'Systemic Inflammatory Response Syndrome identification',
  system: 'critical_care',
  specialty: ['Emergency Medicine', 'Critical Care', 'Internal Medicine'],
  tags: ['SIRS', 'sepsis', 'inflammatory', 'infection', 'fever', 'tachycardia'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Bone RC et al. (ACCP/SCCM Consensus)',
  creatorYear: '1992',
  description: 'SIRS criteria identify patients with systemic inflammatory response. Meeting ≥ 2 of 4 criteria defines SIRS. While the Sepsis-3 definitions (2016) moved away from SIRS for defining sepsis, SIRS remains widely used in clinical practice, many EMR alert systems, and is still part of several clinical protocols.',
  whyUse: 'Rapid bedside identification of systemic inflammation. Still used in many hospital sepsis screening protocols and EMR alerts. Historical importance — understanding SIRS terminology remains essential.',
  whenToUse: [
    'Screening for systemic inflammation at bedside',
    'Part of hospital sepsis alert systems',
    'Trauma and post-operative monitoring',
    'Pancreatitis severity assessment (SIRS-based criteria)',
  ],
  nextSteps: 'SIRS ≥ 2 with suspected infection: Evaluate for sepsis. Obtain cultures, lactate, and initiate sepsis workup. SIRS without infection: Consider non-infectious causes (pancreatitis, burns, trauma, post-surgical, transfusion reaction).',
  pearls: [
    'SIRS ≥ 2 + infection source was the pre-2016 definition of sepsis.',
    'Sepsis-3 (2016) replaced SIRS with SOFA for sepsis definition, but SIRS is still widely used clinically.',
    'SIRS is sensitive but NOT specific for infection — many non-infectious conditions trigger SIRS.',
    'Up to 12% of ICU patients with sepsis do NOT meet SIRS criteria — it should not be used to exclude sepsis.',
    'Post-surgical patients commonly meet SIRS criteria without infection.',
  ],
  evidence: 'Defined by the 1991 ACCP/SCCM Consensus Conference (Bone et al., Chest 1992). Superseded for sepsis definition by Sepsis-3 (2016) but remains in widespread clinical use for screening.',
  formula: '≥ 2 of the following criteria:\n1. Temperature > 38°C or < 36°C\n2. Heart rate > 90 bpm\n3. Respiratory rate > 20/min or PaCO₂ < 32 mmHg\n4. WBC > 12,000 or < 4,000 or > 10% bands',
  references: [
    { text: 'Bone RC et al. Definitions for sepsis and organ failure and guidelines for the use of innovative therapies in sepsis. Chest. 1992;101(6):1644-1655.', url: 'https://pubmed.ncbi.nlm.nih.gov/1303622/' },
  ],
  links: [
    { title: 'MDCalc — SIRS Criteria', url: 'https://www.mdcalc.com/calc/1096/sirs-sepsis-septic-shock-criteria', description: 'Interactive SIRS calculator' },
  ],
  interpretations: [
    { range: '0-1', label: 'SIRS criteria NOT met', action: 'Does not exclude infection or sepsis; maintain clinical vigilance' },
    { range: '2', label: 'SIRS criteria met (2/4)', action: 'Systemic inflammation present; evaluate for infectious vs non-infectious cause' },
    { range: '3-4', label: 'SIRS criteria met (3-4/4)', action: 'Significant systemic inflammation; if infection suspected, initiate sepsis workup' },
  ],
  fields: [
    { key: 'temp', label: 'Temperature > 38°C (100.4°F) or < 36°C (96.8°F)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hr', label: 'Heart rate > 90 bpm', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'rr', label: 'Respiratory rate > 20/min or PaCO₂ < 32 mmHg', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'wbc', label: 'WBC > 12,000 or < 4,000 or > 10% bands', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['temp', 'hr', 'rr', 'wbc']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score < 2) interp = 'SIRS criteria NOT met — does not exclude sepsis'
    else interp = `SIRS criteria MET (${score}/4) — evaluate for infection and organ dysfunction`
    return {
      result: `${score}/4`,
      unit: 'criteria met',
      interpretation: interp,
    }
  },
}
