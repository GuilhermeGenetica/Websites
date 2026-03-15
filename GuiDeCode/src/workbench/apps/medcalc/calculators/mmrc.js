export default {
  id: 'mmrc',
  name: 'mMRC Dyspnea Scale',
  shortDescription: 'Modified Medical Research Council scale for grading breathlessness severity',
  system: 'respiratory',
  specialty: ['Pulmonology', 'Internal Medicine', 'Primary Care'],
  tags: ['dyspnea', 'COPD', 'mMRC', 'breathlessness', 'respiratory', 'disability'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Medical Research Council / Bestall JC et al. (modified)',
  creatorYear: '1959 / 1999',
  description: 'The modified Medical Research Council (mMRC) Dyspnea Scale grades the severity of breathlessness during daily activities on a 0-4 scale. It is a key component of the GOLD COPD assessment framework (combined with FEV1 and exacerbation history) to guide COPD treatment decisions.',
  whyUse: 'Simple patient-reported outcome measure. Key component of GOLD COPD classification. Guides treatment escalation in COPD. Correlates with quality of life and exercise capacity.',
  whenToUse: [
    'COPD assessment and GOLD classification',
    'Baseline dyspnea evaluation in chronic respiratory disease',
    'Monitoring symptom progression over time',
    'Pulmonary rehabilitation assessment',
  ],
  nextSteps: 'mMRC 0-1: Less symptomatic (GOLD Group A or B). mMRC ≥ 2: More symptomatic (GOLD Group E if ≥ 2 exacerbations). Combine with CAT score, spirometry, and exacerbation history for complete GOLD assessment.',
  pearls: [
    'mMRC ≥ 2 defines "more symptoms" in the GOLD ABCD/ABE assessment tool.',
    'mMRC correlates with 6-minute walk distance and quality of life measures.',
    'It is a SELF-REPORTED scale — ask the patient to choose the statement that best describes their limitation.',
    'Does not capture all dyspnea dimensions — CAT score provides more comprehensive assessment.',
    'mMRC is static (daily activities) vs. Borg scale which is dynamic (during exercise).',
  ],
  evidence: 'Original MRC breathlessness scale (1959). Modified version validated by Bestall et al. (Thorax, 1999). Adopted by GOLD as a key symptom measure for COPD classification since 2011.',
  formula: 'Patient self-assessment:\n0 = Breathless only with strenuous exercise\n1 = Short of breath when hurrying on level or walking up slight hill\n2 = Walks slower than people of same age, or stops for breath on level\n3 = Stops for breath after ~100 meters or a few minutes on level\n4 = Too breathless to leave house, or breathless when dressing',
  references: [
    { text: 'Bestall JC et al. Usefulness of the Medical Research Council (MRC) dyspnoea scale. Thorax. 1999;54(7):581-586.', url: 'https://pubmed.ncbi.nlm.nih.gov/10377201/' },
  ],
  links: [
    { title: 'GOLD — COPD Guidelines', url: 'https://goldcopd.org/', description: 'GOLD COPD classification and management' },
  ],
  interpretations: [
    { range: '0', label: 'Grade 0 — No limitation', action: 'Breathless only with strenuous exercise; normal activity level' },
    { range: '1', label: 'Grade 1 — Mild', action: 'Short of breath when hurrying or walking up a slight hill' },
    { range: '2', label: 'Grade 2 — Moderate', action: 'Walks slower than same-age peers due to breathlessness; GOLD "more symptoms" threshold' },
    { range: '3', label: 'Grade 3 — Severe', action: 'Stops for breath after ~100m or a few minutes on level ground' },
    { range: '4', label: 'Grade 4 — Very severe', action: 'Too breathless to leave the house, or breathless when dressing/undressing' },
  ],
  fields: [
    {
      key: 'grade', label: 'Select the statement that best describes your breathlessness', type: 'score_picker',
      options: [
        { value: 0, label: '0 — Breathless only with strenuous exercise' },
        { value: 1, label: '1 — Short of breath when hurrying on level ground or walking up a slight hill' },
        { value: 2, label: '2 — Walks slower than same-age people, or has to stop for breath when walking at own pace on level' },
        { value: 3, label: '3 — Stops for breath after walking ~100 meters or after a few minutes on level ground' },
        { value: 4, label: '4 — Too breathless to leave the house, or breathless when dressing/undressing' },
      ],
    },
  ],
  calculate: (vals) => {
    const grade = parseInt(vals.grade)
    if (grade === undefined || grade === null || vals.grade === '' || vals.grade === null) return null
    const labels = { 0: 'No significant limitation', 1: 'Mild breathlessness', 2: 'Moderate — GOLD "more symptoms" threshold', 3: 'Severe breathlessness', 4: 'Very severe — housebound due to dyspnea' }
    let goldSymptom = grade >= 2 ? 'More symptomatic (GOLD threshold met)' : 'Less symptomatic'
    return {
      result: `Grade ${grade}`,
      unit: 'mMRC',
      interpretation: `${labels[grade]}. ${goldSymptom}`,
    }
  },
}
