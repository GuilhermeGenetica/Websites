export default {
  id: 'four_t_hit',
  name: '4Ts Score (HIT)',
  shortDescription: 'Pre-test probability of heparin-induced thrombocytopenia',
  system: 'hematology_oncology',
  specialty: ['Hematology', 'Critical Care', 'Internal Medicine', 'Surgery'],
  tags: ['HIT', 'heparin', 'thrombocytopenia', '4T', 'platelets', 'thrombosis'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Lo GK et al.',
  creatorYear: '2006',
  description: 'The 4Ts scoring system estimates the pre-test probability of heparin-induced thrombocytopenia (HIT). It evaluates four domains: Thrombocytopenia (degree and timing), Timing of onset, Thrombosis or other sequelae, and oTher causes of thrombocytopenia. The score guides decisions on heparin discontinuation and laboratory testing.',
  whyUse: 'Standardizes clinical assessment of HIT probability. High negative predictive value at low scores (< 4). Guides decision on stopping heparin and ordering confirmatory tests (SRA, ELISA). Avoids unnecessary alternative anticoagulation in low-risk patients.',
  whenToUse: [
    'Platelet drop > 50% or new thrombocytopenia in heparin-exposed patient',
    'New thrombosis in a patient on heparin',
    'Before ordering HIT antibody testing',
  ],
  nextSteps: 'Score 0-3: Low probability (NPV > 99%) — HIT very unlikely, continue heparin if clinically indicated. Score 4-5: Intermediate — stop heparin, start alternative anticoagulant, send HIT antibody testing. Score 6-8: High probability — stop heparin immediately, start alternative anticoagulant, send HIT testing.',
  pearls: [
    '4Ts score 0-3 has > 99% NPV — effectively rules out HIT.',
    'Intermediate and high scores require BOTH stopping heparin AND starting an alternative anticoagulant.',
    'Do NOT wait for lab confirmation to discontinue heparin in intermediate/high probability.',
    'Alternative anticoagulants for HIT: argatroban (hepatic clearance) or bivalirudin (renal clearance).',
    'HIT typically occurs 5-10 days after heparin exposure (or sooner if prior exposure within 100 days).',
    'Do NOT give warfarin until platelets recover — risk of venous limb gangrene/skin necrosis.',
  ],
  evidence: 'Derived by Lo et al. (J Thromb Haemost, 2006). Validated in multiple cohorts. Systematic review (Cuker et al., Blood 2012) confirmed NPV > 99% for scores 0-3. ASH 2018 guidelines recommend 4Ts as initial assessment tool.',
  formula: 'Four domains scored 0-2 each:\nThrombocytopenia (0-2)\nTiming of platelet fall (0-2)\nThrombosis or other sequelae (0-2)\noTher causes (0-2)\nTotal: 0-8',
  references: [
    { text: 'Lo GK et al. Evaluation of pretest clinical score (4 Ts) for the diagnosis of heparin-induced thrombocytopenia. J Thromb Haemost. 2006;4(4):759-765.', url: 'https://pubmed.ncbi.nlm.nih.gov/16634744/' },
    { text: 'Cuker A et al. The HIT Expert Probability (HEP) Score: a novel pre-test probability model for heparin-induced thrombocytopenia. J Thromb Haemost. 2010;8(12):2642-2650.', url: 'https://pubmed.ncbi.nlm.nih.gov/20854372/' },
  ],
  links: [
    { title: 'MDCalc — 4Ts HIT', url: 'https://www.mdcalc.com/calc/3950/4ts-score-heparin-induced-thrombocytopenia', description: 'Interactive 4Ts HIT calculator' },
  ],
  interpretations: [
    { range: '0-3', label: 'Low probability (~5% HIT)', action: 'HIT very unlikely (NPV > 99%); continue heparin if indicated; testing generally not needed' },
    { range: '4-5', label: 'Intermediate probability (~14%)', action: 'Stop heparin; start alternative anticoagulant; send HIT antibody testing' },
    { range: '6-8', label: 'High probability (~64%)', action: 'Stop heparin immediately; start alternative anticoagulant; send HIT testing; hematology consult' },
  ],
  fields: [
    {
      key: 'thrombocytopenia', label: 'Thrombocytopenia', type: 'score_picker',
      options: [
        { value: 0, label: 'Platelet fall < 30% or nadir < 10 ×10⁹/L (0)' },
        { value: 1, label: 'Platelet fall 30-50% or nadir 10-19 ×10⁹/L (1)' },
        { value: 2, label: 'Platelet fall > 50% AND nadir ≥ 20 ×10⁹/L (2)' },
      ],
    },
    {
      key: 'timing', label: 'Timing of platelet count fall', type: 'score_picker',
      options: [
        { value: 0, label: 'Fall < day 4 without recent heparin exposure (0)' },
        { value: 1, label: 'Consistent with fall at 5-10d but unclear; or fall after day 10; or fall ≤ 1d if heparin exposure in past 30-100d (1)' },
        { value: 2, label: 'Clear onset 5-10 days; or ≤ 1 day if heparin exposure within past 30 days (2)' },
      ],
    },
    {
      key: 'thrombosis', label: 'Thrombosis or other sequelae', type: 'score_picker',
      options: [
        { value: 0, label: 'None (0)' },
        { value: 1, label: 'Progressive or recurrent thrombosis; non-necrotizing skin lesions; suspected thrombosis (1)' },
        { value: 2, label: 'New thrombosis; skin necrosis; acute systemic reaction post heparin bolus (2)' },
      ],
    },
    {
      key: 'other_causes', label: 'Other causes for thrombocytopenia', type: 'score_picker',
      options: [
        { value: 0, label: 'Definite other cause present (0)' },
        { value: 1, label: 'Possible other cause (1)' },
        { value: 2, label: 'No other apparent cause (2)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['thrombocytopenia', 'timing', 'thrombosis', 'other_causes']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 3) interp = 'Low probability (~5%) — HIT very unlikely; continue heparin if indicated'
    else if (score <= 5) interp = 'Intermediate probability (~14%) — stop heparin, start alternative anticoagulant, send HIT testing'
    else interp = 'High probability (~64%) — stop heparin immediately, alternative anticoagulant, hematology consult'
    return {
      result: String(score),
      unit: 'points (0-8)',
      interpretation: interp,
      breakdown: [
        { label: 'Thrombocytopenia', value: String(vals.thrombocytopenia) },
        { label: 'Timing', value: String(vals.timing) },
        { label: 'Thrombosis/sequelae', value: String(vals.thrombosis) },
        { label: 'Other causes', value: String(vals.other_causes) },
      ],
    }
  },
}
