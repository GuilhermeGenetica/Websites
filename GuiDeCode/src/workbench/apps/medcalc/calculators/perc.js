export default {
  id: 'perc',
  name: 'PERC Rule',
  shortDescription: 'Pulmonary Embolism Rule-out Criteria — excludes PE without testing',
  system: 'cardiovascular',
  specialty: ['Emergency Medicine'],
  tags: ['PE', 'pulmonary embolism', 'PERC', 'rule out', 'D-dimer'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Kline JA et al.',
  creatorYear: '2004',
  description: 'The PERC rule identifies very low-risk patients in whom PE can be excluded without D-dimer testing or imaging. If ALL 8 criteria are absent in a patient with low clinical suspicion (Wells ≤ 4 or gestalt < 15%), PE can be safely excluded. PERC reduces unnecessary D-dimer testing and its associated false-positive cascade.',
  whyUse: 'Eliminates need for D-dimer in very low-risk patients. Prevents the false-positive cascade (elevated D-dimer → unnecessary CTPA). Validated with < 2% miss rate when properly applied.',
  whenToUse: [
    'Low clinical suspicion for PE (Wells ≤ 4 or physician gestalt < 15%)',
    'Before ordering D-dimer in low-risk chest pain or dyspnea patients',
  ],
  nextSteps: 'All criteria negative (PERC negative): PE excluded, no further testing needed. Any criterion positive: PERC positive — proceed with D-dimer testing. PERC should only be applied when pre-test probability is LOW.',
  pearls: [
    'PERC is ONLY for LOW pre-test probability patients. Never apply to moderate/high risk.',
    'ALL 8 criteria must be absent to rule out PE. Even one positive criterion = proceed to D-dimer.',
    'PERC is meant to AVOID testing, not to diagnose. It is a rule-out tool only.',
    'Do NOT apply PERC to hospitalized patients or those with strong clinical suspicion.',
    'The concept: if PE testing would cause more harm than benefit in very low-risk patients, skip it.',
    'Validated miss rate < 2% (below the test threshold).',
  ],
  evidence: 'Derived by Kline et al. (J Thromb Haemost, 2004). Validated in the PROPER trial (JAMA 2018, non-inferiority) in French EDs. Miss rate ~1% when applied to low pre-test probability patients.',
  formula: 'ALL must be absent to rule out PE:\n1. Age < 50\n2. HR < 100\n3. SpO₂ ≥ 95% on room air\n4. No unilateral leg swelling\n5. No hemoptysis\n6. No recent surgery/trauma (≤ 4 weeks)\n7. No prior PE/DVT\n8. No estrogen use (OCP, HRT)',
  references: [
    { text: 'Kline JA et al. Clinical criteria to prevent unnecessary diagnostic testing in emergency department patients with suspected pulmonary embolism. J Thromb Haemost. 2004;2(8):1247-1255.', url: 'https://pubmed.ncbi.nlm.nih.gov/15304025/' },
    { text: 'Freund Y et al. Effect of the Pulmonary Embolism Rule-Out Criteria on subsequent thromboembolic events among low-risk emergency department patients (PROPER). JAMA. 2018;319(6):559-566.', url: 'https://pubmed.ncbi.nlm.nih.gov/29450523/' },
  ],
  links: [
    { title: 'MDCalc — PERC Rule', url: 'https://www.mdcalc.com/calc/347/perc-rule-pulmonary-embolism', description: 'Interactive PERC calculator' },
  ],
  interpretations: [
    { range: '0', label: 'PERC NEGATIVE — PE excluded', action: 'No D-dimer or imaging needed (in low pre-test probability patients)' },
    { range: '1-8', label: 'PERC POSITIVE — cannot rule out', action: 'Proceed with D-dimer testing; if positive, obtain CTPA' },
  ],
  fields: [
    { key: 'age50', label: 'Age ≥ 50 years', type: 'score_picker', options: [{ value: 0, label: 'No (age < 50)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hr100', label: 'Heart rate ≥ 100 bpm', type: 'score_picker', options: [{ value: 0, label: 'No (HR < 100)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'spo2', label: 'SpO₂ < 95% on room air', type: 'score_picker', options: [{ value: 0, label: 'No (SpO₂ ≥ 95%)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'leg_swelling', label: 'Unilateral leg swelling', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hemoptysis', label: 'Hemoptysis', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'surgery_trauma', label: 'Recent surgery or trauma (≤ 4 weeks)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'prior_pe_dvt', label: 'Prior PE or DVT', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'estrogen', label: 'Estrogen use (OCP, HRT)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['age50', 'hr100', 'spo2', 'leg_swelling', 'hemoptysis', 'surgery_trauma', 'prior_pe_dvt', 'estrogen']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score === 0) interp = 'PERC NEGATIVE — PE can be excluded without further testing (in low pre-test probability patients)'
    else interp = `PERC POSITIVE (${score} criterion${score > 1 ? 'a' : ''}) — proceed with D-dimer`
    return {
      result: score === 0 ? 'NEGATIVE' : 'POSITIVE',
      unit: `${score}/8 criteria present`,
      interpretation: interp,
    }
  },
}
