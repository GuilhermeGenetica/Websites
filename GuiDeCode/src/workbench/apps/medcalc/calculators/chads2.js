export default {
  id: 'chads2',
  name: 'CHADS₂ Score',
  shortDescription: 'Original stroke risk score for atrial fibrillation (predecessor to CHA₂DS₂-VASc)',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Internal Medicine', 'Neurology'],
  tags: ['CHADS2', 'atrial fibrillation', 'stroke', 'anticoagulation', 'AF'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Gage BF et al.',
  creatorYear: '2001',
  description: 'CHADS₂ is the original clinical prediction rule for estimating stroke risk in patients with non-valvular atrial fibrillation. It has been largely superseded by CHA₂DS₂-VASc which provides better risk stratification in low-risk patients, but CHADS₂ remains historically important and is still referenced in some guidelines and clinical settings.',
  whyUse: 'Simple, rapid stroke risk estimation in AF. Still referenced in some guidelines. Useful when quick bedside assessment is needed.',
  whenToUse: [
    'Atrial fibrillation — stroke risk stratification',
    'Quick assessment when CHA₂DS₂-VASc is not needed for decision-making',
  ],
  nextSteps: 'CHADS₂ 0: Low risk — aspirin or no therapy. CHADS₂ 1: Intermediate — anticoagulation or aspirin. CHADS₂ ≥ 2: High risk — anticoagulation recommended. Note: CHA₂DS₂-VASc is preferred by current guidelines.',
  pearls: [
    'CHA₂DS₂-VASc has replaced CHADS₂ in most current guidelines (ESC, AHA/ACC).',
    'CHADS₂ groups many patients as "intermediate risk" (score 1) where CHA₂DS₂-VASc provides clearer guidance.',
    'Prior stroke/TIA carries the highest weight (+2 points) reflecting its strong predictive value.',
    'CHADS₂ = 0 does NOT mean zero risk — annual stroke rate is still ~1.9%.',
  ],
  evidence: 'Derived by Gage et al. (JAMA, 2001) from the National Registry of AF and AF Investigators pooled dataset. Validated in multiple cohorts. C-statistic ~0.82 for stroke prediction.',
  formula: 'C = CHF (+1)\nH = Hypertension (+1)\nA = Age ≥ 75 (+1)\nD = Diabetes (+1)\nS₂ = Prior Stroke/TIA (+2)\nTotal: 0-6',
  references: [
    { text: 'Gage BF et al. Validation of clinical classification schemes for predicting stroke: results from the National Registry of Atrial Fibrillation. JAMA. 2001;285(22):2864-2870.', url: 'https://pubmed.ncbi.nlm.nih.gov/11401607/' },
  ],
  links: [
    { title: 'MDCalc — CHADS₂', url: 'https://www.mdcalc.com/calc/40/chads2-score-atrial-fibrillation-stroke-risk', description: 'Interactive CHADS₂ calculator' },
  ],
  interpretations: [
    { range: '0', label: 'Low risk (~1.9% annual stroke rate)', action: 'Aspirin or no antithrombotic; consider CHA₂DS₂-VASc for further stratification' },
    { range: '1', label: 'Intermediate risk (~2.8%)', action: 'Aspirin or oral anticoagulation; use CHA₂DS₂-VASc to refine decision' },
    { range: '2', label: 'Moderate-high risk (~4.0%)', action: 'Oral anticoagulation recommended (DOAC preferred)' },
    { range: '3-4', label: 'High risk (~5.9-8.5%)', action: 'Oral anticoagulation strongly recommended' },
    { range: '5-6', label: 'Very high risk (~12.5-18.2%)', action: 'Oral anticoagulation essential' },
  ],
  fields: [
    { key: 'chf', label: 'Congestive Heart Failure', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'htn', label: 'Hypertension', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'age75', label: 'Age ≥ 75 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'dm', label: 'Diabetes Mellitus', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'stroke', label: 'Prior Stroke or TIA', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
  ],
  calculate: (vals) => {
    const fields = ['chf', 'htn', 'age75', 'dm', 'stroke']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const riskTable = { 0: '1.9%', 1: '2.8%', 2: '4.0%', 3: '5.9%', 4: '8.5%', 5: '12.5%', 6: '18.2%' }
    let interp = ''
    if (score === 0) interp = 'Low risk — consider CHA₂DS₂-VASc for better stratification'
    else if (score === 1) interp = 'Intermediate — CHA₂DS₂-VASc recommended for decision-making'
    else interp = 'Oral anticoagulation recommended (DOAC preferred over warfarin)'
    return {
      result: String(score),
      unit: 'points (0-6)',
      interpretation: interp,
      detail: `Annual stroke risk: ${riskTable[score] || '>18%'}`,
    }
  },
}
