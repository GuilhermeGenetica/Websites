export default {
  id: 'alvarado',
  name: 'Alvarado Score (MANTRELS)',
  shortDescription: 'Clinical prediction rule for acute appendicitis',
  system: 'surgery_trauma',
  specialty: ['Emergency Medicine', 'Surgery', 'General Practice'],
  tags: ['appendicitis', 'Alvarado', 'MANTRELS', 'abdominal pain', 'surgical abdomen'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Alvarado A',
  creatorYear: '1986',
  description: 'The Alvarado score (MANTRELS mnemonic) is a clinical scoring system for the diagnosis of acute appendicitis. It uses symptoms (migration of pain, anorexia, nausea/vomiting), signs (RLQ tenderness, rebound pain, elevated temperature), and laboratory findings (leukocytosis, left shift) to estimate the likelihood of appendicitis.',
  whyUse: 'Standardized clinical assessment for suspected appendicitis. Helps guide imaging decisions (CT abdomen/pelvis). Reduces negative appendectomy rates when used alongside imaging.',
  whenToUse: [
    'Acute abdominal pain suspicious for appendicitis',
    'Decision support for CT imaging in RLQ pain',
    'Triage tool in emergency department',
  ],
  nextSteps: 'Score 1-4: Appendicitis unlikely, consider other diagnoses. Score 5-6: Equivocal — CT abdomen/pelvis recommended. Score 7-8: Probable appendicitis — surgical consultation. Score 9-10: Very probable — urgent surgical consultation.',
  pearls: [
    'MANTRELS mnemonic: Migration, Anorexia, Nausea, Tenderness RLQ, Rebound, Elevation (temp), Leukocytosis, Shift (left).',
    'The score is most useful for determining whether imaging is needed, not for replacing imaging.',
    'In women of childbearing age, always consider gynecologic causes (ectopic, ovarian torsion, PID).',
    'CT has higher accuracy than Alvarado alone — use both together for best decisions.',
    'Modified Alvarado (no left shift) scores out of 9 and is sometimes used when differential not available.',
  ],
  evidence: 'Developed by Alvarado (Ann Emerg Med, 1986). Multiple validation studies show sensitivity ~68-82% and specificity ~50-75%. Best at ruling out appendicitis with low scores. CT scan remains the gold standard for diagnosis.',
  formula: 'M = Migration of pain to RLQ (+1)\nA = Anorexia (+1)\nN = Nausea/Vomiting (+1)\nT = Tenderness in RLQ (+2)\nR = Rebound pain (+1)\nE = Elevated temperature > 37.3°C (+1)\nL = Leukocytosis > 10,000 (+2)\nS = Shift to left (> 75% neutrophils) (+1)\nTotal: 0-10',
  references: [
    { text: 'Alvarado A. A practical score for the early diagnosis of acute appendicitis. Ann Emerg Med. 1986;15(5):557-564.', url: 'https://pubmed.ncbi.nlm.nih.gov/3963537/' },
    { text: 'Ohle R et al. The Alvarado score for predicting acute appendicitis: a systematic review. BMC Med. 2011;9:139.', url: 'https://pubmed.ncbi.nlm.nih.gov/22204638/' },
  ],
  links: [
    { title: 'MDCalc — Alvarado Score', url: 'https://www.mdcalc.com/calc/617/alvarado-score-acute-appendicitis', description: 'Interactive Alvarado calculator' },
  ],
  interpretations: [
    { range: '0-4', label: 'Appendicitis unlikely', action: 'Consider alternative diagnoses; discharge with precautions if low suspicion' },
    { range: '5-6', label: 'Equivocal', action: 'CT abdomen/pelvis recommended; observation and reassessment' },
    { range: '7-8', label: 'Probable appendicitis', action: 'Surgical consultation; CT if not already obtained' },
    { range: '9-10', label: 'Very probable appendicitis', action: 'Urgent surgical consultation; OR preparation' },
  ],
  fields: [
    { key: 'migration', label: 'Migration of pain to RLQ', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'anorexia', label: 'Anorexia', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'nausea', label: 'Nausea / Vomiting', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'tenderness', label: 'Tenderness in RLQ', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
    { key: 'rebound', label: 'Rebound pain', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'temperature', label: 'Elevated temperature (> 37.3°C / 99.1°F)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'leukocytosis', label: 'Leukocytosis (WBC > 10,000)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 2, label: 'Yes (+2)' }] },
    { key: 'shift', label: 'Left shift (neutrophils > 75%)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['migration', 'anorexia', 'nausea', 'tenderness', 'rebound', 'temperature', 'leukocytosis', 'shift']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 4) interp = 'Appendicitis unlikely'
    else if (score <= 6) interp = 'Equivocal — CT recommended'
    else if (score <= 8) interp = 'Probable appendicitis — surgical consultation'
    else interp = 'Very probable appendicitis — urgent surgery'
    return {
      result: String(score),
      unit: 'points (0-10)',
      interpretation: interp,
    }
  },
}
