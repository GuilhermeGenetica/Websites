export default {
  id: 'ranson',
  name: "Ranson's Criteria (Pancreatitis)",
  shortDescription: 'Predicts severity and mortality in acute pancreatitis at admission and 48 hours',
  system: 'gastro_hepatology',
  specialty: ['Gastroenterology', 'Surgery', 'Emergency Medicine', 'Critical Care'],
  tags: ['Ranson', 'pancreatitis', 'severity', 'mortality', 'acute pancreatitis'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Ranson JH et al.',
  creatorYear: '1974',
  description: "Ranson's criteria predict severity and mortality in acute pancreatitis using 5 parameters at admission and 6 additional parameters at 48 hours (total 11 criteria). A score ≥ 3 suggests severe pancreatitis. While BISAP is simpler and faster, Ranson's remains a well-known scoring system for pancreatitis severity.",
  whyUse: 'Well-established severity prediction for acute pancreatitis. Identifies patients at risk for complications. Guides ICU admission decisions.',
  whenToUse: [
    'Acute pancreatitis severity assessment',
    'At admission (5 criteria) and at 48 hours (6 additional criteria)',
  ],
  nextSteps: 'Score 0-2: Mild pancreatitis (~1% mortality), likely non-severe. Score 3-5: Moderate (~15% mortality), consider ICU. Score ≥ 6: Severe (~40% mortality), ICU admission, aggressive management.',
  pearls: [
    'Ranson requires 48 hours to complete — BISAP can be calculated within 24 hours.',
    'Different criteria exist for gallstone pancreatitis vs. alcoholic pancreatitis — this version is for alcoholic/general.',
    'The admission criteria and 48-hour criteria are SEPARATE — do not use 48-hour values at admission.',
    'Ranson ≥ 3 is the classic threshold for "severe" pancreatitis.',
    'Imaging (CT severity index) is a complementary assessment, not a replacement.',
  ],
  evidence: 'Original study by Ranson et al. (Surg Gynecol Obstet, 1974). Extensively validated. Sensitivity ~65-80% for severe pancreatitis. Limitations include the 48-hour delay for complete scoring.',
  formula: 'At admission (1 point each):\n• Age > 55\n• WBC > 16,000\n• Glucose > 200 mg/dL\n• LDH > 350 IU/L\n• AST > 250 U/L\n\nAt 48 hours (1 point each):\n• Hct drop > 10%\n• BUN increase > 5 mg/dL\n• Calcium < 8 mg/dL\n• PaO₂ < 60 mmHg\n• Base deficit > 4 mEq/L\n• Fluid sequestration > 6L',
  references: [
    { text: 'Ranson JH et al. Prognostic signs and the role of operative management in acute pancreatitis. Surg Gynecol Obstet. 1974;139(1):69-81.', url: 'https://pubmed.ncbi.nlm.nih.gov/4834279/' },
  ],
  links: [
    { title: 'MDCalc — Ranson Criteria', url: 'https://www.mdcalc.com/calc/89/ransons-criteria-pancreatitis-mortality', description: 'Interactive Ranson calculator' },
  ],
  interpretations: [
    { range: '0-2', label: 'Mild (~1% mortality)', action: 'Ward management; supportive care; NPO → early feeding when tolerated' },
    { range: '3-5', label: 'Moderate (~15% mortality)', action: 'Consider ICU; aggressive fluid resuscitation; monitor for complications' },
    { range: '6-11', label: 'Severe (~40% mortality)', action: 'ICU admission; aggressive management; monitor for organ failure and necrosis' },
  ],
  fields: [
    { key: 'age55', label: 'Age > 55 years (admission)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'wbc16', label: 'WBC > 16,000/µL (admission)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'glucose200', label: 'Glucose > 200 mg/dL (admission)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'ldh350', label: 'LDH > 350 IU/L (admission)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'ast250', label: 'AST > 250 U/L (admission)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'hct_drop', label: 'Hematocrit drop > 10% (48h)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bun_rise', label: 'BUN increase > 5 mg/dL (48h)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'calcium', label: 'Calcium < 8 mg/dL (48h)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'pao2', label: 'PaO₂ < 60 mmHg (48h)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'base_deficit', label: 'Base deficit > 4 mEq/L (48h)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'fluid_seq', label: 'Fluid sequestration > 6L (48h)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['age55', 'wbc16', 'glucose200', 'ldh350', 'ast250', 'hct_drop', 'bun_rise', 'calcium', 'pao2', 'base_deficit', 'fluid_seq']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const admFields = ['age55', 'wbc16', 'glucose200', 'ldh350', 'ast250']
    const h48Fields = ['hct_drop', 'bun_rise', 'calcium', 'pao2', 'base_deficit', 'fluid_seq']
    const admScore = admFields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const h48Score = h48Fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    const score = admScore + h48Score
    let interp = ''
    if (score <= 2) interp = 'Mild pancreatitis (~1% mortality)'
    else if (score <= 5) interp = 'Moderate pancreatitis (~15% mortality) — consider ICU'
    else interp = 'Severe pancreatitis (~40% mortality) — ICU admission recommended'
    return {
      result: String(score),
      unit: 'points (0-11)',
      interpretation: interp,
      breakdown: [
        { label: 'Admission criteria', value: `${admScore}/5` },
        { label: '48-hour criteria', value: `${h48Score}/6` },
        { label: 'Total', value: `${score}/11` },
      ],
    }
  },
}
