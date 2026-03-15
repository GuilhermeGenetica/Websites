export default {
  id: 'has_bled',
  name: 'HAS-BLED Score',
  shortDescription: 'Major bleeding risk assessment for patients on anticoagulation',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Internal Medicine', 'Hematology'],
  tags: ['bleeding', 'anticoagulation', 'atrial fibrillation', 'HAS-BLED', 'warfarin', 'DOAC'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Pisters R et al.',
  creatorYear: '2010',
  description: 'HAS-BLED estimates the 1-year risk of major bleeding in patients with atrial fibrillation on anticoagulation therapy. It is used alongside CHA₂DS₂-VASc to weigh stroke prevention benefit against bleeding risk. A high HAS-BLED score should prompt review of modifiable risk factors, not necessarily avoidance of anticoagulation.',
  whyUse: 'Identifies modifiable bleeding risk factors. Guides shared decision-making about anticoagulation. Recommended by ESC and AHA/ACC guidelines alongside CHA₂DS₂-VASc.',
  whenToUse: [
    'Atrial fibrillation patients being considered for anticoagulation',
    'Annual reassessment of patients on chronic anticoagulation',
    'After a bleeding event to re-evaluate risk-benefit',
  ],
  nextSteps: 'Score ≥ 3: High bleeding risk — address modifiable factors (BP control, stop unnecessary NSAIDs/antiplatelet, reduce alcohol, optimize INR control). A high score alone should NOT preclude anticoagulation when CHA₂DS₂-VASc indicates benefit.',
  pearls: [
    'HAS-BLED ≥ 3 means "high risk" but does NOT mean "do not anticoagulate".',
    'Focus on MODIFIABLE factors: uncontrolled BP, labile INR, drugs (NSAIDs, antiplatelets), alcohol.',
    'Labile INR only applies to VKA (warfarin) users, not DOACs.',
    'DOACs generally have lower bleeding risk than warfarin at equivalent HAS-BLED scores.',
    'The score should be recalculated periodically as risk factors change.',
  ],
  evidence: 'Derived from the Euro Heart Survey (Pisters et al., Chest 2010). Validated in multiple AF cohorts. C-statistic ~0.72 for major bleeding prediction. Endorsed by ESC 2020 AF guidelines.',
  formula: 'H = Hypertension (uncontrolled, SBP > 160) (+1)\nA = Abnormal renal/liver function (+1 each, max +2)\nS = Stroke history (+1)\nB = Bleeding history or predisposition (+1)\nL = Labile INR (TTR < 60%) (+1)\nE = Elderly (> 65) (+1)\nD = Drugs (antiplatelets, NSAIDs) or alcohol (+1 each, max +2)',
  references: [
    { text: 'Pisters R et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-1100.', url: 'https://pubmed.ncbi.nlm.nih.gov/20299623/' },
  ],
  links: [
    { title: 'MDCalc — HAS-BLED', url: 'https://www.mdcalc.com/calc/807/has-bled-score-major-bleeding-risk', description: 'Interactive HAS-BLED calculator' },
  ],
  interpretations: [
    { range: '0', label: 'Low risk (~1.13% annual major bleeding)', action: 'Anticoagulate as indicated by CHA₂DS₂-VASc' },
    { range: '1', label: 'Low-moderate risk (~1.02%)', action: 'Anticoagulate; routine monitoring' },
    { range: '2', label: 'Moderate risk (~1.88%)', action: 'Anticoagulate; address modifiable factors' },
    { range: '3', label: 'High risk (~3.74%)', action: 'Address modifiable factors aggressively; consider DOAC over warfarin' },
    { range: '4', label: 'High risk (~8.70%)', action: 'Careful risk-benefit discussion; optimize all modifiable factors' },
    { range: '≥5', label: 'Very high risk (>12%)', action: 'Individualized decision; multidisciplinary discussion recommended' },
  ],
  fields: [
    { key: 'hypertension', label: 'Hypertension (uncontrolled, SBP > 160 mmHg)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'renal', label: 'Abnormal renal function (dialysis, transplant, Cr > 2.26 mg/dL)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'liver', label: 'Abnormal liver function (cirrhosis, bilirubin > 2×ULN, ALT/AST > 3×ULN)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'stroke', label: 'Stroke history', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bleeding', label: 'Bleeding history or predisposition', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'labile_inr', label: 'Labile INR (TTR < 60%, on warfarin)', type: 'score_picker', options: [{ value: 0, label: 'No / Not on VKA (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'elderly', label: 'Age > 65 years', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'drugs', label: 'Drugs (antiplatelet agents or NSAIDs)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'alcohol', label: 'Alcohol excess (≥ 8 drinks/week)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
  ],
  calculate: (vals) => {
    const fields = ['hypertension', 'renal', 'liver', 'stroke', 'bleeding', 'labile_inr', 'elderly', 'drugs', 'alcohol']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 1) interp = 'Low bleeding risk — anticoagulate as indicated'
    else if (score === 2) interp = 'Moderate bleeding risk — anticoagulate, address modifiable factors'
    else interp = 'High bleeding risk (≥ 3) — aggressively address modifiable factors; do NOT withhold anticoagulation solely based on HAS-BLED'
    return {
      result: String(score),
      unit: 'points (0-9)',
      interpretation: interp,
    }
  },
}
