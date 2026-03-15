export default {
  id: 'pecarn',
  name: 'PECARN Pediatric Head Injury Rule',
  shortDescription: 'Identifies children at very low risk for clinically important traumatic brain injury',
  system: 'pediatrics',
  specialty: ['Pediatric Emergency Medicine', 'Emergency Medicine', 'Pediatrics'],
  tags: ['PECARN', 'pediatric', 'head injury', 'TBI', 'CT', 'trauma', 'concussion'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Kuppermann N et al.',
  creatorYear: '2009',
  description: 'The PECARN (Pediatric Emergency Care Applied Research Network) Head Injury algorithm identifies children with minor head trauma who are at very low risk for clinically important traumatic brain injury (ciTBI) and therefore do NOT need CT imaging. It uses age-stratified criteria (< 2 years and ≥ 2 years) to guide CT decisions.',
  whyUse: 'Reduces unnecessary CT scans in children (radiation exposure). Identifies very low-risk patients (< 0.05% ciTBI risk) who can be observed. Largest validated pediatric TBI clinical prediction rule (> 42,000 patients).',
  whenToUse: [
    'Children presenting with minor head trauma (GCS ≥ 14)',
    'Decision on CT head imaging after pediatric head injury',
  ],
  nextSteps: 'All criteria negative: Very low risk (< 0.05% ciTBI). CT NOT recommended — observation is sufficient. Any criterion positive: Risk not negligible. Consider CT based on severity, clinical judgment, and parental preference.',
  pearls: [
    'PECARN is for GCS ≥ 14 only. GCS < 14 should get CT regardless.',
    'Two separate algorithms: one for age < 2 years, another for ≥ 2 years.',
    'ciTBI defined as: death, neurosurgery, intubation > 24h, or hospital admission ≥ 2 nights for TBI.',
    'A "very low risk" categorization has sensitivity > 99% for ciTBI.',
    'Observation for 4-6 hours is a valid alternative to CT in intermediate-risk patients.',
    'Scalp hematoma in children < 2 years (especially occipital, temporal, or parietal) is concerning.',
  ],
  evidence: 'Kuppermann et al. (Lancet, 2009). Prospective multicenter study of 42,412 children < 18 years with head trauma. Validated with > 99% sensitivity and > 99% NPV for ciTBI in very low-risk groups.',
  formula: 'Age < 2 years — high risk if ANY present:\n• GCS < 15\n• Altered mental status\n• Palpable skull fracture\n\nAge < 2 years — intermediate risk:\n• Non-frontal scalp hematoma\n• Loss of consciousness ≥ 5 seconds\n• Severe mechanism of injury\n• Not acting normally per parent\n\nAge ≥ 2 years — high risk if ANY present:\n• GCS < 15\n• Altered mental status\n• Signs of basilar skull fracture\n\nAge ≥ 2 years — intermediate risk:\n• LOC\n• Vomiting\n• Severe mechanism\n• Severe headache',
  references: [
    { text: 'Kuppermann N et al. Identification of children at very low risk of clinically-important brain injuries after head trauma: a prospective cohort study. Lancet. 2009;374(9696):1160-1170.', url: 'https://pubmed.ncbi.nlm.nih.gov/19758692/' },
  ],
  links: [
    { title: 'MDCalc — PECARN', url: 'https://www.mdcalc.com/calc/589/pecarn-pediatric-head-injury-trauma-algorithm', description: 'Interactive PECARN algorithm' },
  ],
  interpretations: [
    { range: '0', label: 'Very low risk (< 0.05% ciTBI)', action: 'CT NOT recommended; observation sufficient' },
    { range: '1-2', label: 'Intermediate risk', action: 'CT vs. observation based on clinical factors, worsening symptoms, physician experience, parental preference' },
    { range: '≥3', label: 'Higher risk', action: 'CT recommended' },
  ],
  fields: [
    {
      key: 'age_group', label: 'Age group', type: 'score_picker',
      options: [
        { value: 'under2', label: '< 2 years' },
        { value: '2andover', label: '≥ 2 years' },
      ],
    },
    { key: 'gcs_abnormal', label: 'GCS < 15', type: 'score_picker', options: [{ value: 0, label: 'No (GCS = 15)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'altered_mental', label: 'Altered mental status (agitation, somnolence, repetitive questioning, slow response)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'skull_signs', label: '< 2yr: Palpable skull fracture | ≥ 2yr: Signs of basilar skull fracture', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'scalp_loc', label: '< 2yr: Non-frontal scalp hematoma | ≥ 2yr: History of LOC', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'mechanism', label: 'Severe mechanism (MVC ejection, pedestrian/bike vs car, fall > 0.9m [<2yr] or > 1.5m [≥2yr])', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'behavior', label: '< 2yr: Not acting normally (per parent) | ≥ 2yr: Vomiting or severe headache', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['gcs_abnormal', 'altered_mental', 'skull_signs', 'scalp_loc', 'mechanism', 'behavior']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled || !vals.age_group) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const ageLabel = vals.age_group === 'under2' ? '< 2 years' : '≥ 2 years'
    const highRisk = parseInt(vals.gcs_abnormal) + parseInt(vals.altered_mental) + parseInt(vals.skull_signs)
    let interp = ''
    if (score === 0) interp = 'Very low risk (< 0.05% ciTBI) — CT NOT recommended; observation sufficient'
    else if (highRisk > 0) interp = 'High-risk criterion present — CT recommended'
    else interp = 'Intermediate risk — consider CT vs. observation based on clinical judgment and multiple risk factors'
    return {
      result: score === 0 ? 'VERY LOW RISK' : `${score} risk factor${score > 1 ? 's' : ''}`,
      unit: `(${ageLabel})`,
      interpretation: interp,
    }
  },
}
