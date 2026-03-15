export default {
  id: 'shock_index',
  name: 'Shock Index',
  shortDescription: 'Heart rate / systolic BP ratio for hemodynamic instability detection',
  system: 'surgery_trauma',
  specialty: ['Emergency Medicine', 'Surgery', 'Trauma', 'Critical Care', 'Obstetrics'],
  tags: ['shock', 'hemodynamic', 'trauma', 'hemorrhage', 'triage', 'shock index'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Allgöwer M, Burri C',
  creatorYear: '1967',
  description: 'The Shock Index (SI) is the ratio of heart rate to systolic blood pressure (HR/SBP). A normal SI is 0.5-0.7 in healthy adults. An elevated SI (> 0.9-1.0) is an early indicator of hemodynamic compromise, often detecting occult shock before traditional vital signs (HR and SBP individually) become abnormal.',
  whyUse: 'Detects occult shock earlier than HR or SBP alone. Simple, fast bedside calculation. Useful in trauma triage, postpartum hemorrhage, and GI bleeding. Better predictor of transfusion need than individual vital signs.',
  whenToUse: [
    'Trauma triage and hemorrhage assessment',
    'Postpartum hemorrhage evaluation',
    'GI bleeding severity assessment',
    'Any suspected occult hypovolemia',
  ],
  nextSteps: 'SI > 0.9: Consider occult hemorrhage, early resuscitation. SI > 1.0: Likely significant hemodynamic compromise — aggressive fluid/blood resuscitation. SI > 1.4: Severe shock — massive transfusion protocol consideration.',
  pearls: [
    'Normal SI = 0.5-0.7. A "normal" HR of 90 with SBP of 90 gives SI = 1.0 — already concerning.',
    'SI detects shock before hypotension develops (compensatory mechanisms maintain BP initially).',
    'In pregnancy, normal SI may be slightly higher (up to 0.9) due to physiologic changes.',
    'Pediatric SI norms are different — use age-adjusted references (SIPA).',
    'Beta-blockers blunt tachycardia and can mask elevated SI — interpret with caution.',
    'Modified Shock Index (MSI) = HR/MAP may be more accurate in some settings.',
  ],
  evidence: 'Described by Allgöwer and Burri (1967). Multiple trauma studies validate SI > 0.9-1.0 as predictor of transfusion need, ICU admission, and mortality. Validated in postpartum hemorrhage (Nathan et al., Obstet Gynecol 2015).',
  formula: 'Shock Index = Heart Rate / Systolic Blood Pressure\nNormal: 0.5-0.7\nElevated: > 0.9-1.0',
  references: [
    { text: 'Allgöwer M, Burri C. Schockindex. Dtsch Med Wochenschr. 1967;92(43):1947-1950.', url: 'https://pubmed.ncbi.nlm.nih.gov/5299769/' },
    { text: 'Mutschler M et al. Renaissance of base deficit for the initial assessment of trauma patients. Injury. 2013;44(12):1698-1702.', url: 'https://pubmed.ncbi.nlm.nih.gov/23871193/' },
  ],
  links: [
    { title: 'MDCalc — Shock Index', url: 'https://www.mdcalc.com/calc/1316/shock-index', description: 'Interactive Shock Index calculator' },
  ],
  interpretations: [
    { range: '<0.6', label: 'Normal', action: 'Hemodynamically stable; routine monitoring' },
    { range: '0.6-0.9', label: 'Normal to borderline', action: 'Monitor closely; repeat assessment' },
    { range: '0.9-1.3', label: 'Elevated — probable shock', action: 'Aggressive fluid resuscitation; identify source; prepare for transfusion' },
    { range: '>1.3', label: 'Severely elevated — critical shock', action: 'Massive transfusion protocol consideration; emergent intervention' },
  ],
  fields: [
    { key: 'hr', label: 'Heart Rate', type: 'number', min: 20, max: 250, step: 1, placeholder: 'bpm', hint: 'beats per minute' },
    { key: 'sbp', label: 'Systolic Blood Pressure', type: 'number', min: 30, max: 300, step: 1, placeholder: 'mmHg', hint: 'mmHg' },
  ],
  calculate: (vals) => {
    const hr = parseFloat(vals.hr)
    const sbp = parseFloat(vals.sbp)
    if (!hr || !sbp || sbp <= 0) return null
    const si = hr / sbp
    let interp = ''
    if (si < 0.6) interp = 'Normal — hemodynamically stable'
    else if (si < 0.9) interp = 'Normal to borderline'
    else if (si < 1.3) interp = 'Elevated — probable hemodynamic compromise'
    else interp = 'Severely elevated — critical shock, consider massive transfusion'
    return {
      result: si.toFixed(2),
      unit: '',
      interpretation: interp,
      detail: `HR: ${hr} bpm, SBP: ${sbp} mmHg`,
    }
  },
}
