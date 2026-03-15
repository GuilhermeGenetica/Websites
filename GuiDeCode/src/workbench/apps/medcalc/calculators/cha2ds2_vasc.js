export default {
  id: 'cha2ds2_vasc',
  name: 'CHA₂DS₂-VASc Score',
  shortDescription: 'Stroke risk stratification in atrial fibrillation',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Internal Medicine', 'Neurology', 'Emergency Medicine'],
  tags: ['atrial fibrillation', 'stroke', 'anticoagulation', 'AF', 'embolic risk'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Lip GYH et al.',
  creatorYear: '2010',
  description: 'The CHA₂DS₂-VASc score refines the original CHADS₂ score by incorporating additional stroke risk factors (vascular disease, age 65–74, sex category). It is the guideline-recommended tool for stroke risk assessment in patients with non-valvular atrial fibrillation, guiding decisions on anticoagulation therapy.',
  whyUse: 'Guideline-recommended (ESC, AHA/ACC) for anticoagulation decision-making in atrial fibrillation. Identifies truly low-risk patients who may safely avoid anticoagulation.',
  whenToUse: [
    'Non-valvular atrial fibrillation or atrial flutter',
    'Decision-making regarding oral anticoagulation initiation',
    'Risk re-stratification during follow-up visits',
  ],
  nextSteps: 'For scores ≥ 2 (males) or ≥ 3 (females), initiate oral anticoagulation (DOAC preferred over warfarin). For score 1 (males) or 2 (females), anticoagulation should be considered. For score 0 (males) or 1 (females with only sex criterion), no antithrombotic therapy recommended. Always assess bleeding risk with HAS-BLED concurrently.',
  pearls: [
    'Female sex alone (score of 1 in females) does not warrant anticoagulation — it is a risk modifier, not an independent indication.',
    'The maximum score is 9, not 10, because the age categories are mutually exclusive.',
    'Vascular disease includes prior MI, peripheral artery disease, and aortic plaque.',
    'HAS-BLED should be used alongside CHA₂DS₂-VASc — a high bleeding risk rarely justifies withholding anticoagulation.',
    'DOACs (apixaban, rivaroxaban, edoxaban, dabigatran) are preferred over warfarin for most patients with non-valvular AF.',
  ],
  evidence: 'Validated in multiple large cohorts (>170,000 patients). ESC 2020 and AHA/ACC/HRS 2019 guidelines recommend CHA₂DS₂-VASc as the primary stroke risk tool in AF. Annualized stroke rates range from ~0% (score 0) to >15% (score 9).',
  formula: 'C: CHF/LV dysfunction (+1)\nH: Hypertension (+1)\nA₂: Age ≥75 (+2)\nD: Diabetes (+1)\nS₂: Stroke/TIA/thromboembolism (+2)\nV: Vascular disease (+1)\nA: Age 65-74 (+1)\nSc: Sex category — Female (+1)',
  references: [
    { text: 'Lip GYH et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation using a novel risk factor-based approach: the euro heart survey on atrial fibrillation. Chest. 2010;137(2):263-272.', url: 'https://pubmed.ncbi.nlm.nih.gov/19762550/' },
    { text: 'Hindricks G et al. 2020 ESC Guidelines for the diagnosis and management of atrial fibrillation. Eur Heart J. 2021;42(5):373-498.', url: 'https://pubmed.ncbi.nlm.nih.gov/32860505/' },
  ],
  links: [
    { title: 'MDCalc — CHA₂DS₂-VASc', url: 'https://www.mdcalc.com/calc/801/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk', description: 'Interactive calculator with full evidence review' },
    { title: 'ESC AF Guidelines 2020', url: 'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Atrial-Fibrillation-Management', description: 'Complete European AF management guidelines' },
  ],
  interpretations: [
    { range: '0', label: 'Low risk (0.2% annual stroke risk in males)', action: 'No antithrombotic therapy recommended (males); reassess periodically' },
    { range: '1', label: 'Low-moderate risk (0.6% annual)', action: 'Consider oral anticoagulation (males); if female with score 1 from sex alone, no therapy needed' },
    { range: '2', label: 'Moderate risk (2.2% annual)', action: 'Oral anticoagulation recommended (DOAC preferred)' },
    { range: '3', label: 'Moderate-high risk (3.2% annual)', action: 'Oral anticoagulation recommended' },
    { range: '4', label: 'High risk (4.8% annual)', action: 'Oral anticoagulation strongly recommended' },
    { range: '5-6', label: 'High risk (7.2-9.7% annual)', action: 'Oral anticoagulation strongly recommended' },
    { range: '7-9', label: 'Very high risk (11.2-15.2% annual)', action: 'Oral anticoagulation essential; consider additional risk factor management' },
  ],
  fields: [
    { key: 'chf', label: 'Congestive Heart Failure / LV Dysfunction', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hypertension', label: 'Hypertension', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'age', label: 'Age', type: 'score_picker', options: [{ value: 0, label: '<65 (0)' }, { value: 1, label: '65-74 (+1)' }, { value: 2, label: '≥75 (+2)' }] },
    { key: 'diabetes', label: 'Diabetes Mellitus', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'stroke', label: 'Prior Stroke / TIA / Thromboembolism', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
    { key: 'vascular', label: 'Vascular Disease (prior MI, PAD, aortic plaque)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'sex', label: 'Sex Category', type: 'score_picker', options: [{ value: 0, label: 'Male (0)' }, { value: 1, label: 'Female (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['chf', 'hypertension', 'age', 'diabetes', 'stroke', 'vascular', 'sex']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const riskTable = {
      0: '0.2%', 1: '0.6%', 2: '2.2%', 3: '3.2%', 4: '4.8%',
      5: '7.2%', 6: '9.7%', 7: '11.2%', 8: '13.9%', 9: '15.2%',
    }
    const annualRisk = riskTable[score] || '>15%'
    let recommendation = ''
    if (score === 0) recommendation = 'No antithrombotic therapy recommended'
    else if (score === 1) recommendation = 'Consider oral anticoagulation'
    else recommendation = 'Oral anticoagulation recommended (DOAC preferred)'
    return {
      result: String(score),
      unit: 'points',
      interpretation: recommendation,
      detail: `Annual stroke risk: ~${annualRisk}`,
      breakdown: [
        { label: 'CHF / LV dysfunction', value: `+${vals.chf || 0}` },
        { label: 'Hypertension', value: `+${vals.hypertension || 0}` },
        { label: 'Age', value: `+${vals.age || 0}` },
        { label: 'Diabetes', value: `+${vals.diabetes || 0}` },
        { label: 'Stroke/TIA', value: `+${vals.stroke || 0}` },
        { label: 'Vascular disease', value: `+${vals.vascular || 0}` },
        { label: 'Sex (female)', value: `+${vals.sex || 0}` },
      ],
    }
  },
}
