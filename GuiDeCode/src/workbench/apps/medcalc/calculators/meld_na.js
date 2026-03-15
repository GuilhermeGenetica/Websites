export default {
  id: 'meld_na',
  name: 'MELD-Na Score',
  shortDescription: 'Model for End-Stage Liver Disease with sodium correction',
  system: 'gastro_hepatology',
  specialty: ['Hepatology', 'Gastroenterology', 'Transplant Surgery', 'Critical Care'],
  tags: ['cirrhosis', 'liver', 'transplant', 'MELD', 'mortality', 'liver disease'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Kamath PS et al. / Kim WR et al.',
  creatorYear: '2001 / 2008',
  description: 'The MELD-Na score incorporates serum sodium into the original MELD model to improve 90-day mortality prediction in patients with end-stage liver disease. It is used by UNOS (since January 2016) for liver transplant allocation priority in the United States. MELD-Na better captures mortality risk in patients with hyponatremia, a common finding in advanced cirrhosis.',
  whyUse: 'Official score used for liver transplant allocation in the US (UNOS). More accurate than original MELD for predicting waitlist mortality. Guides timing of transplant listing and prioritization.',
  whenToUse: [
    'Liver transplant candidate evaluation and listing priority',
    'Prognosis estimation in cirrhosis',
    'Decision on TIPS placement, surgical procedures in cirrhotic patients',
    'Monitoring disease progression in chronic liver disease',
  ],
  nextSteps: 'MELD-Na ≥ 15: list for transplant evaluation. MELD-Na ≥ 20-25: increasing priority. Reassess every 7-90 days depending on score range. Combine with clinical assessment for transplant decision-making.',
  pearls: [
    'Serum Na is bounded between 125-137 mEq/L in the MELD-Na formula — values outside this range are capped.',
    'Lab values must be from the same day for accurate scoring.',
    'MELD-Na replaces MELD for UNOS allocation since January 2016.',
    'In 2022, UNOS transitioned to MELD 3.0, which incorporates sex and albumin — check if your institution uses MELD 3.0.',
    'INR can be falsely elevated by anticoagulants (warfarin) — this inflates the score.',
    'Minimum MELD score is 6, and values are rounded to the nearest integer for UNOS.',
  ],
  evidence: 'Original MELD validated for TIPS mortality prediction, then adopted for transplant allocation. MELD-Na (Kim et al., Hepatology 2008) demonstrated improved c-statistic for 90-day waitlist mortality. UNOS adopted MELD-Na in 2016 after extensive validation.',
  formula: 'MELD = 10 × [0.957 × ln(Creatinine) + 0.378 × ln(Bilirubin) + 1.120 × ln(INR)] + 6.43\nMELD-Na = MELD - Na - [0.025 × MELD × (140 - Na)] + 140\n(Na bounded 125-137; Cr, Bili, INR minimum 1.0; Cr capped at 4.0)',
  references: [
    { text: 'Kamath PS et al. A model to predict survival in patients with end-stage liver disease. Hepatology. 2001;33(2):464-470.', url: 'https://pubmed.ncbi.nlm.nih.gov/11172350/' },
    { text: 'Kim WR et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-1026.', url: 'https://pubmed.ncbi.nlm.nih.gov/18768945/' },
  ],
  links: [
    { title: 'MDCalc — MELD-Na', url: 'https://www.mdcalc.com/calc/10437/meld-na-meld-sodium-score', description: 'Interactive MELD-Na calculator' },
    { title: 'UNOS — Organ Allocation', url: 'https://unos.org/policy/organ-allocation/', description: 'Official UNOS liver allocation policies' },
  ],
  interpretations: [
    { range: '<10', label: 'Low severity', action: 'Monitor; transplant listing generally not indicated' },
    { range: '10-14', label: 'Moderate severity', action: 'Close monitoring; consider transplant evaluation' },
    { range: '15-19', label: 'Significant liver disease (~6% 90-day mortality)', action: 'List for transplant evaluation' },
    { range: '20-24', label: 'Severe (~20% 90-day mortality)', action: 'Active transplant listing; increasing priority' },
    { range: '25-29', label: 'Very severe (~40% 90-day mortality)', action: 'High transplant priority' },
    { range: '30-39', label: 'Critical (~50-70% 90-day mortality)', action: 'Urgent transplant listing' },
    { range: '≥40', label: 'Extremely severe (>70% 90-day mortality)', action: 'Highest priority; assess candidacy for transplant' },
  ],
  fields: [
    { key: 'creatinine', label: 'Serum Creatinine', type: 'number', min: 0.1, max: 15, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL (capped at 4.0 in formula)' },
    { key: 'bilirubin', label: 'Total Bilirubin', type: 'number', min: 0.1, max: 80, step: 0.1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'inr', label: 'INR', type: 'number', min: 0.5, max: 20, step: 0.1, placeholder: 'e.g. 1.5', hint: '' },
    { key: 'sodium', label: 'Serum Sodium', type: 'number', min: 100, max: 160, step: 1, placeholder: 'mEq/L', hint: 'mEq/L (bounded 125-137 in formula)' },
    { key: 'dialysis', label: 'Dialysis (at least 2× in past week)', type: 'score_picker', options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  ],
  calculate: (vals) => {
    let cr = parseFloat(vals.creatinine)
    let bili = parseFloat(vals.bilirubin)
    let inr = parseFloat(vals.inr)
    let na = parseFloat(vals.sodium)
    const dialysis = parseInt(vals.dialysis)
    if (!cr || !bili || !inr || !na || dialysis === undefined || dialysis === null || dialysis === '') return null
    if (cr < 1) cr = 1
    if (bili < 1) bili = 1
    if (inr < 1) inr = 1
    if (dialysis === 1) cr = 4.0
    if (cr > 4) cr = 4
    let boundedNa = na
    if (boundedNa < 125) boundedNa = 125
    if (boundedNa > 137) boundedNa = 137
    const meld = 10 * (0.957 * Math.log(cr) + 0.378 * Math.log(bili) + 1.120 * Math.log(inr)) + 6.43
    const roundedMeld = Math.max(6, Math.round(meld))
    const meldNa = roundedMeld - boundedNa - (0.025 * roundedMeld * (140 - boundedNa)) + 140
    const finalScore = Math.max(6, Math.min(40, Math.round(meldNa)))
    let mortality = ''
    if (finalScore < 10) mortality = '~1.9% 90-day mortality'
    else if (finalScore < 20) mortality = '~6% 90-day mortality'
    else if (finalScore < 30) mortality = '~20-40% 90-day mortality'
    else if (finalScore < 40) mortality = '~50-70% 90-day mortality'
    else mortality = '>70% 90-day mortality'
    return {
      result: String(finalScore),
      unit: 'points',
      interpretation: mortality,
      breakdown: [
        { label: 'MELD (without Na)', value: String(roundedMeld) },
        { label: 'MELD-Na', value: String(finalScore) },
        { label: 'Bounded Na', value: `${boundedNa} mEq/L` },
        { label: 'Bounded Cr', value: `${cr.toFixed(1)} mg/dL` },
      ],
    }
  },
}
