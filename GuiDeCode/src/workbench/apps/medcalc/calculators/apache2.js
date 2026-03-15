export default {
  id: 'apache2',
  name: 'APACHE II',
  shortDescription: 'Acute Physiology and Chronic Health Evaluation for ICU mortality prediction',
  system: 'critical_care',
  specialty: ['Critical Care', 'Internal Medicine', 'Surgery'],
  tags: ['APACHE', 'ICU', 'mortality', 'severity', 'prognosis', 'critical care'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Knaus WA et al.',
  creatorYear: '1985',
  description: 'APACHE II (Acute Physiology and Chronic Health Evaluation II) is the most widely used ICU severity scoring system worldwide. It uses 12 acute physiological variables (worst values in first 24h of ICU), age points, and chronic health points to estimate in-hospital mortality risk. The score ranges from 0-71, with higher scores indicating greater severity.',
  whyUse: 'Gold standard for ICU severity benchmarking. Predicts in-hospital mortality risk. Required for many clinical trials and quality metrics. Enables case-mix comparison across ICUs.',
  whenToUse: [
    'Within first 24 hours of ICU admission',
    'ICU quality benchmarking and research',
    'Prognostication and goals of care discussions',
    'Clinical trial enrollment criteria',
  ],
  nextSteps: 'Score 0-9: ~4% mortality. Score 10-14: ~8%. Score 15-19: ~12%. Score 20-24: ~30%. Score 25-29: ~50%. Score 30-34: ~73%. Score ≥ 35: ~85%. Use for prognostic discussions but NEVER as sole basis for treatment decisions.',
  pearls: [
    'Use WORST values from the first 24 hours of ICU admission.',
    'GCS is inverted: APACHE GCS points = 15 - actual GCS.',
    'Chronic health points: +5 for non-elective surgical/medical patients with severe organ insufficiency; +2 for elective surgical.',
    'APACHE II was calibrated in 1985 — modern ICU mortality may be lower at equivalent scores.',
    'Does NOT account for diagnosis — same score may have different mortality depending on underlying condition.',
    'APACHE III and IV exist but APACHE II remains the most commonly referenced version.',
  ],
  evidence: 'Developed by Knaus et al. (Crit Care Med, 1985) from 5,815 ICU admissions at 13 hospitals. Extensively validated worldwide. Standard ICU severity metric for > 35 years despite known limitations.',
  formula: 'APACHE II = Acute Physiology Score (0-60) + Age Points (0-6) + Chronic Health Points (0-5)\nAPS: 12 variables scored 0-4 each (worst in first 24h)\nTotal range: 0-71',
  references: [
    { text: 'Knaus WA et al. APACHE II: A severity of disease classification system. Crit Care Med. 1985;13(10):818-829.', url: 'https://pubmed.ncbi.nlm.nih.gov/3928249/' },
  ],
  links: [
    { title: 'MDCalc — APACHE II', url: 'https://www.mdcalc.com/calc/1868/apache-ii-score', description: 'Interactive APACHE II calculator' },
  ],
  interpretations: [
    { range: '0-9', label: 'Low severity (~4% mortality)', action: 'Standard ICU care; likely good prognosis' },
    { range: '10-14', label: 'Moderate (~8% mortality)', action: 'Standard ICU care; monitor for deterioration' },
    { range: '15-19', label: 'Moderate-high (~12% mortality)', action: 'Aggressive ICU management' },
    { range: '20-24', label: 'High severity (~30% mortality)', action: 'Consider goals of care discussion if not improving' },
    { range: '25-29', label: 'Very high (~50% mortality)', action: 'Goals of care discussion; intensive support' },
    { range: '30-34', label: 'Critical (~73% mortality)', action: 'Discuss prognosis with family; consider comfort care if appropriate' },
    { range: '≥35', label: 'Extremely high (~85% mortality)', action: 'Very poor prognosis; compassionate goals of care discussion' },
  ],
  fields: [
    { key: 'temp', label: 'Temperature (°C, worst in 24h)', type: 'number', min: 25, max: 45, step: 0.1, placeholder: '°C', hint: '°C — rectal/core' },
    { key: 'map_val', label: 'Mean Arterial Pressure (mmHg)', type: 'number', min: 20, max: 250, step: 1, placeholder: 'mmHg', hint: 'mmHg — worst in 24h' },
    { key: 'hr', label: 'Heart Rate (bpm)', type: 'number', min: 10, max: 300, step: 1, placeholder: 'bpm', hint: 'worst in 24h' },
    { key: 'rr', label: 'Respiratory Rate', type: 'number', min: 1, max: 80, step: 1, placeholder: '/min', hint: '/min — worst in 24h' },
    { key: 'fio2_high', label: 'FiO₂ ≥ 0.5? (determines A-a vs PaO₂)', type: 'score_picker', options: [{ value: 0, label: 'No — FiO₂ < 0.5 (use PaO₂)' }, { value: 1, label: 'Yes — FiO₂ ≥ 0.5 (use A-a gradient)' }] },
    { key: 'oxygenation', label: 'If FiO₂ < 0.5: PaO₂ (mmHg) | If FiO₂ ≥ 0.5: A-a gradient (mmHg)', type: 'number', min: 0, max: 700, step: 1, placeholder: 'mmHg', hint: 'PaO₂ or A-a gradient depending on FiO₂' },
    { key: 'ph', label: 'Arterial pH', type: 'number', min: 6.5, max: 8.0, step: 0.01, placeholder: 'pH', hint: 'worst in 24h' },
    { key: 'sodium', label: 'Serum Sodium (mEq/L)', type: 'number', min: 100, max: 200, step: 1, placeholder: 'mEq/L', hint: 'worst in 24h' },
    { key: 'potassium', label: 'Serum Potassium (mEq/L)', type: 'number', min: 1, max: 10, step: 0.1, placeholder: 'mEq/L', hint: 'worst in 24h' },
    { key: 'creatinine', label: 'Serum Creatinine (mg/dL)', type: 'number', min: 0.1, max: 20, step: 0.1, placeholder: 'mg/dL', hint: 'worst in 24h (double points if ARF)' },
    { key: 'arf', label: 'Acute Renal Failure', type: 'score_picker', options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes (double creatinine points)' }] },
    { key: 'hematocrit', label: 'Hematocrit (%)', type: 'number', min: 5, max: 75, step: 0.1, placeholder: '%', hint: 'worst in 24h' },
    { key: 'wbc', label: 'WBC (×10³/µL)', type: 'number', min: 0.1, max: 100, step: 0.1, placeholder: '×10³/µL', hint: 'worst in 24h' },
    { key: 'gcs_val', label: 'Glasgow Coma Scale (actual GCS)', type: 'number', min: 3, max: 15, step: 1, placeholder: '3-15', hint: 'actual GCS (15 - GCS will be scored)' },
    { key: 'age', label: 'Age', type: 'number', min: 16, max: 120, step: 1, placeholder: 'years', hint: 'years' },
    { key: 'chronic', label: 'Chronic Health Points', type: 'score_picker', options: [{ value: 0, label: 'None / No severe organ insufficiency (0)' }, { value: 2, label: 'Elective postoperative with severe organ insufficiency (+2)' }, { value: 5, label: 'Non-operative or emergency postop with severe organ insufficiency (+5)' }] },
  ],
  calculate: (vals) => {
    const temp = parseFloat(vals.temp)
    const mapVal = parseFloat(vals.map_val)
    const hr = parseFloat(vals.hr)
    const rr = parseFloat(vals.rr)
    const fio2High = parseInt(vals.fio2_high)
    const oxy = parseFloat(vals.oxygenation)
    const ph = parseFloat(vals.ph)
    const na = parseFloat(vals.sodium)
    const k = parseFloat(vals.potassium)
    const cr = parseFloat(vals.creatinine)
    const arf = parseInt(vals.arf)
    const hct = parseFloat(vals.hematocrit)
    const wbc = parseFloat(vals.wbc)
    const gcsVal = parseInt(vals.gcs_val)
    const age = parseFloat(vals.age)
    const chronic = parseInt(vals.chronic)
    if (!temp || !mapVal || !hr || !rr || !oxy || !ph || !na || !k || !cr || !hct || !wbc || !gcsVal || !age) return null
    const scoreRange = (val, ranges) => { for (const [lo, hi, pts] of ranges) { if (val >= lo && val <= hi) return pts } return 0 }
    const tempPts = scoreRange(temp, [[41,99,4],[39,40.9,3],[38.5,38.9,1],[36,38.4,0],[34,35.9,1],[32,33.9,2],[30,31.9,3],[0,29.9,4]])
    const mapPts = scoreRange(mapVal, [[160,999,4],[130,159,3],[110,129,2],[70,109,0],[50,69,2],[0,49,4]])
    const hrPts = scoreRange(hr, [[180,999,4],[140,179,3],[110,139,2],[70,109,0],[55,69,2],[40,54,3],[0,39,4]])
    const rrPts = scoreRange(rr, [[50,999,4],[35,49,3],[25,34,1],[12,24,0],[10,11,1],[6,9,2],[0,5,4]])
    let oxyPts = 0
    if (fio2High === 1) {
      oxyPts = scoreRange(oxy, [[500,999,4],[350,499,3],[200,349,2],[0,199,0]])
    } else {
      oxyPts = scoreRange(oxy, [[70,999,0],[61,69,1],[55,60,3],[0,54,4]])
    }
    const phPts = scoreRange(ph, [[7.7,9,4],[7.6,7.69,3],[7.5,7.59,1],[7.33,7.49,0],[7.25,7.32,2],[7.15,7.24,3],[0,7.14,4]])
    const naPts = scoreRange(na, [[180,999,4],[160,179,3],[155,159,2],[150,154,1],[130,149,0],[120,129,2],[111,119,3],[0,110,4]])
    const kPts = scoreRange(k, [[7,99,4],[6,6.9,3],[5.5,5.9,1],[3.5,5.4,0],[3,3.4,1],[2.5,2.9,2],[0,2.4,4]])
    let crPts = scoreRange(cr, [[3.5,99,4],[2,3.4,3],[1.5,1.9,2],[0.6,1.4,0],[0,0.59,2]])
    if (arf === 1) crPts *= 2
    const hctPts = scoreRange(hct, [[60,99,4],[50,59.9,2],[46,49.9,1],[30,45.9,0],[20,29.9,2],[0,19.9,4]])
    const wbcPts = scoreRange(wbc, [[40,999,4],[20,39.9,2],[15,19.9,1],[3,14.9,0],[1,2.9,2],[0,0.9,4]])
    const gcsPts = 15 - gcsVal
    let agePts = 0
    if (age < 45) agePts = 0
    else if (age <= 54) agePts = 2
    else if (age <= 64) agePts = 3
    else if (age <= 74) agePts = 5
    else agePts = 6
    const aps = tempPts + mapPts + hrPts + rrPts + oxyPts + phPts + naPts + kPts + crPts + hctPts + wbcPts + gcsPts
    const total = aps + agePts + chronic
    let mortality = ''
    if (total <= 4) mortality = '~4%'
    else if (total <= 9) mortality = '~4%'
    else if (total <= 14) mortality = '~8%'
    else if (total <= 19) mortality = '~12%'
    else if (total <= 24) mortality = '~30%'
    else if (total <= 29) mortality = '~50%'
    else if (total <= 34) mortality = '~73%'
    else mortality = '~85%'
    return {
      result: String(total),
      unit: 'points (0-71)',
      interpretation: `Estimated in-hospital mortality: ${mortality}`,
      breakdown: [
        { label: 'Acute Physiology Score', value: `${aps}` },
        { label: 'Age Points', value: `${agePts}` },
        { label: 'Chronic Health Points', value: `${chronic}` },
        { label: 'Total APACHE II', value: `${total}` },
      ],
    }
  },
}
