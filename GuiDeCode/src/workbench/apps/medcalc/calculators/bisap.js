export default {
  id: 'bisap',
  name: 'BISAP Score',
  shortDescription: 'Early severity prediction in acute pancreatitis within 24 hours',
  system: 'gastro_hepatology',
  specialty: ['Gastroenterology', 'Emergency Medicine', 'Surgery', 'Critical Care'],
  tags: ['pancreatitis', 'BISAP', 'severity', 'mortality', 'acute pancreatitis'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Wu BU et al.',
  creatorYear: '2008',
  description: 'The BISAP (Bedside Index for Severity in Acute Pancreatitis) score predicts mortality in acute pancreatitis using data available within the first 24 hours of admission. It uses five simple criteria: BUN > 25, Impaired mental status, SIRS, Age > 60, and Pleural effusion. It is simpler than Ranson and APACHE II while maintaining comparable accuracy.',
  whyUse: 'Simple, rapid prognostication in acute pancreatitis. Can be calculated within 24 hours of admission (unlike Ranson which requires 48h). Identifies patients who need ICU-level care and aggressive resuscitation.',
  whenToUse: [
    'All patients admitted with acute pancreatitis',
    'Within the first 24 hours of hospital admission',
    'Triage: floor vs. ICU disposition',
  ],
  nextSteps: 'Score 0: Very low mortality risk (~0.1%). Score 1-2: Low risk — floor admission, monitor. Score 3-5: High risk (~5-22% mortality) — ICU consideration, aggressive fluid resuscitation, close monitoring for organ failure.',
  pearls: [
    'BISAP is calculated within 24 hours — faster than Ranson (48h) and simpler than APACHE II.',
    'BISAP ≥ 3 is associated with up to 10× increased mortality risk.',
    'SIRS criteria within BISAP: ≥ 2 of temp > 38°C or < 36°C, HR > 90, RR > 20, WBC > 12K or < 4K.',
    'Pleural effusion on admission imaging (CXR or CT) scores +1.',
    'Does not predict necrotizing pancreatitis directly — use CT severity index (Balthazar) for that.',
    'Early aggressive IV fluid resuscitation (goal-directed) is critical regardless of score.',
  ],
  evidence: 'Derived by Wu et al. (Gut, 2008) from > 17,000 patients. Validated in multiple cohorts. BISAP ≥ 3 associated with 7-12× increase in organ failure and 10× increase in mortality compared to BISAP < 3.',
  formula: 'One point each (total 0-5):\nB = BUN > 25 mg/dL\nI = Impaired mental status (GCS < 15)\nS = SIRS (≥ 2 criteria)\nA = Age > 60 years\nP = Pleural effusion on imaging',
  references: [
    { text: 'Wu BU et al. The early prediction of mortality in acute pancreatitis: a large population-based study. Gut. 2008;57(12):1698-1703.', url: 'https://pubmed.ncbi.nlm.nih.gov/18519429/' },
  ],
  links: [
    { title: 'MDCalc — BISAP', url: 'https://www.mdcalc.com/calc/1868/bisap-score-pancreatitis-mortality', description: 'Interactive BISAP calculator' },
  ],
  interpretations: [
    { range: '0', label: '~0.1% mortality', action: 'Low risk; ward-level care; standard management' },
    { range: '1', label: '~0.4% mortality', action: 'Low risk; monitor for deterioration' },
    { range: '2', label: '~1.6% mortality', action: 'Moderate risk; close monitoring; aggressive hydration' },
    { range: '3', label: '~3.6% mortality', action: 'High risk; consider ICU; aggressive resuscitation' },
    { range: '4-5', label: '~7.4-22% mortality', action: 'High risk; ICU admission; monitor for organ failure and necrosis' },
  ],
  fields: [
    { key: 'bun', label: 'BUN > 25 mg/dL', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'mental', label: 'Impaired mental status (GCS < 15)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'sirs_present', label: 'SIRS criteria met (≥ 2 of 4)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'age60', label: 'Age > 60 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'effusion', label: 'Pleural effusion on imaging', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['bun', 'mental', 'sirs_present', 'age60', 'effusion']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const mortTable = { 0: '~0.1%', 1: '~0.4%', 2: '~1.6%', 3: '~3.6%', 4: '~7.4%', 5: '~22%' }
    let interp = ''
    if (score <= 2) interp = 'Low mortality risk — standard ward management with monitoring'
    else interp = 'Elevated mortality risk — consider ICU, aggressive fluid resuscitation'
    return {
      result: String(score),
      unit: 'points (0-5)',
      interpretation: interp,
      detail: `Estimated in-hospital mortality: ${mortTable[score] || '>22%'}`,
    }
  },
}
