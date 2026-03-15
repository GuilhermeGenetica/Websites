export default {
  id: 'gad7',
  name: 'GAD-7',
  shortDescription: 'Screening and severity measure for generalized anxiety disorder',
  system: 'psychiatry',
  specialty: ['Psychiatry', 'Primary Care', 'Psychology'],
  tags: ['anxiety', 'GAD', 'mental health', 'screening', 'psychiatry'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Spitzer RL, Kroenke K, Williams JB, Löwe B',
  creatorYear: '2006',
  description: 'The GAD-7 is a validated self-report questionnaire used to screen for and measure the severity of generalized anxiety disorder. It assesses seven symptoms over the past 2 weeks, scoring 0-3 for each. It is commonly used alongside the PHQ-9 for depression screening in primary care and mental health settings.',
  whyUse: 'Brief, validated screening tool for generalized anxiety. Monitors treatment response over time. Widely used in primary care and mental health. Recommended by multiple clinical guidelines.',
  whenToUse: [
    'Screening for generalized anxiety disorder in primary care',
    'Baseline assessment before initiating anxiolytic therapy',
    'Monitoring treatment response (repeat every 2-4 weeks)',
    'Research and epidemiological studies',
  ],
  nextSteps: 'Score ≥ 10: Probable GAD — consider clinical interview for formal diagnosis. Score ≥ 15: Severe anxiety — refer to mental health specialist. All positive screens should include assessment of functional impairment and safety.',
  pearls: [
    'GAD-7 ≥ 10 has a sensitivity of 89% and specificity of 82% for GAD.',
    'Also screens reasonably well for panic disorder, social anxiety, and PTSD.',
    'Use alongside PHQ-9 — anxiety and depression are highly comorbid.',
    'A 5-point change is considered clinically significant for treatment monitoring.',
    'Item 10 (difficulty question) assesses functional impairment but is not part of the total score.',
    'Patient self-report — quick to administer (< 2 minutes).',
  ],
  evidence: 'Developed and validated by Spitzer et al. (Arch Intern Med, 2006) in 2,740 primary care patients. Internal consistency α = 0.92. Test-retest reliability ICC = 0.83. Validated in multiple languages and populations.',
  formula: 'Sum of 7 items, each scored 0-3:\n0 = Not at all, 1 = Several days,\n2 = More than half the days, 3 = Nearly every day\nTotal range: 0-21',
  references: [
    { text: 'Spitzer RL et al. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-1097.', url: 'https://pubmed.ncbi.nlm.nih.gov/16717171/' },
  ],
  links: [
    { title: 'MDCalc — GAD-7', url: 'https://www.mdcalc.com/calc/1727/gad7-general-anxiety-disorder7', description: 'Interactive GAD-7 calculator' },
  ],
  interpretations: [
    { range: '0-4', label: 'Minimal anxiety', action: 'No treatment indicated; reassess if clinically concerned' },
    { range: '5-9', label: 'Mild anxiety', action: 'Watchful waiting; repeat GAD-7 at follow-up; consider psychoeducation' },
    { range: '10-14', label: 'Moderate anxiety — probable GAD', action: 'Clinical interview for diagnosis; consider CBT or pharmacotherapy' },
    { range: '15-21', label: 'Severe anxiety', action: 'Active treatment warranted; refer to mental health specialist; consider combined CBT + medication' },
  ],
  fields: [
    {
      key: 'q1', label: '1. Feeling nervous, anxious, or on edge', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
    {
      key: 'q2', label: '2. Not being able to stop or control worrying', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
    {
      key: 'q3', label: '3. Worrying too much about different things', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
    {
      key: 'q4', label: '4. Trouble relaxing', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
    {
      key: 'q5', label: '5. Being so restless that it is hard to sit still', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
    {
      key: 'q6', label: '6. Becoming easily annoyed or irritable', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
    {
      key: 'q7', label: '7. Feeling afraid, as if something awful might happen', type: 'score_picker',
      options: [{ value: 0, label: 'Not at all (0)' }, { value: 1, label: 'Several days (1)' }, { value: 2, label: 'More than half the days (2)' }, { value: 3, label: 'Nearly every day (3)' }],
    },
  ],
  calculate: (vals) => {
    const fields = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let severity = ''
    if (score <= 4) severity = 'Minimal anxiety'
    else if (score <= 9) severity = 'Mild anxiety'
    else if (score <= 14) severity = 'Moderate anxiety — probable GAD'
    else severity = 'Severe anxiety'
    return {
      result: String(score),
      unit: 'points (0-21)',
      interpretation: severity,
    }
  },
}
