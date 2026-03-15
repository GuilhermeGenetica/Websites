export default {
  id: 'map',
  name: 'Mean Arterial Pressure (MAP)',
  shortDescription: 'Estimates average arterial pressure during a cardiac cycle',
  system: 'cardiovascular',
  specialty: ['Critical Care', 'Emergency Medicine', 'Cardiology', 'Anesthesiology'],
  tags: ['blood pressure', 'MAP', 'hemodynamics', 'perfusion', 'shock'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: '',
  creatorYear: '',
  description: 'Mean Arterial Pressure (MAP) represents the average arterial pressure throughout the cardiac cycle. It is considered a better indicator of tissue perfusion than systolic or diastolic pressure alone. MAP is a primary hemodynamic target in critical care, with most guidelines recommending MAP ≥ 65 mmHg to ensure adequate organ perfusion.',
  whyUse: 'MAP is the primary hemodynamic target in septic shock and critical care management. It is more physiologically relevant than systolic BP for assessing organ perfusion. Used for vasopressor titration and hemodynamic monitoring.',
  whenToUse: [
    'Hemodynamic monitoring in ICU and perioperative settings',
    'Vasopressor titration targeting MAP ≥ 65 mmHg',
    'Assessment of cerebral perfusion pressure (CPP = MAP - ICP)',
    'Evaluation of shock states',
  ],
  nextSteps: 'MAP < 65: consider fluid resuscitation and/or vasopressors. MAP > 100-110: evaluate for hypertensive emergency. For cerebral perfusion, calculate CPP = MAP - ICP.',
  pearls: [
    'MAP = DBP + 1/3(SBP - DBP), reflecting that ~2/3 of the cardiac cycle is in diastole.',
    'Target MAP ≥ 65 mmHg is recommended in septic shock (Surviving Sepsis Campaign).',
    'In traumatic brain injury, MAP targets are higher to maintain CPP > 60-70 mmHg.',
    'MAP measured by arterial line (gold standard) may differ from non-invasive cuff oscillometry.',
    'Chronic hypertension patients may need higher MAP targets to maintain organ perfusion.',
  ],
  evidence: 'Surviving Sepsis Campaign (2021) recommends initial target MAP ≥ 65 mmHg. SEPSISPAM trial showed no benefit to targeting MAP 80-85 vs 65-70 except in chronic hypertension subgroup.',
  formula: 'MAP = Diastolic + ⅓ × (Systolic - Diastolic)\n\nAlternative: MAP = (SBP + 2 × DBP) / 3',
  references: [
    { text: 'Evans L et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063-e1143.', url: 'https://pubmed.ncbi.nlm.nih.gov/34605781/' },
    { text: 'Asfar P et al. High versus low blood-pressure target in patients with septic shock. N Engl J Med. 2014;370(17):1583-1593.', url: 'https://pubmed.ncbi.nlm.nih.gov/24635770/' },
  ],
  links: [
    { title: 'MDCalc — MAP', url: 'https://www.mdcalc.com/calc/74/mean-arterial-pressure-map', description: 'Interactive MAP calculator' },
    { title: 'Surviving Sepsis Campaign 2021', url: 'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines/Adult-Patients', description: 'Current sepsis management guidelines' },
  ],
  interpretations: [
    { range: '<60', label: 'Hypotension — risk of organ hypoperfusion', action: 'Urgent: fluid resuscitation ± vasopressors; identify cause' },
    { range: '60-64', label: 'Borderline low', action: 'Close monitoring; consider fluid bolus if symptomatic' },
    { range: '65-100', label: 'Normal target range', action: 'Maintain; standard for most ICU patients' },
    { range: '>100', label: 'Elevated', action: 'Evaluate for hypertensive crisis; consider antihypertensives' },
  ],
  fields: [
    { key: 'systolic', label: 'Systolic Blood Pressure', type: 'number', min: 30, max: 300, placeholder: 'mmHg', hint: 'mmHg' },
    { key: 'diastolic', label: 'Diastolic Blood Pressure', type: 'number', min: 10, max: 200, placeholder: 'mmHg', hint: 'mmHg' },
  ],
  calculate: (vals) => {
    const sys = parseFloat(vals.systolic)
    const dia = parseFloat(vals.diastolic)
    if (!sys || !dia) return null
    if (dia > sys) return { result: 'Error', unit: '', interpretation: 'Diastolic cannot exceed systolic pressure.' }
    const map = dia + (sys - dia) / 3
    let interp = 'Normal target range (65-100 mmHg)'
    if (map < 60) interp = 'Hypotension — risk of organ hypoperfusion'
    else if (map < 65) interp = 'Borderline low — monitor closely'
    else if (map > 100) interp = 'Elevated — evaluate for hypertensive crisis'
    return {
      result: map.toFixed(0),
      unit: 'mmHg',
      interpretation: interp,
      detail: `SBP ${sys} / DBP ${dia} mmHg → Pulse pressure: ${(sys - dia).toFixed(0)} mmHg`,
    }
  },
}
