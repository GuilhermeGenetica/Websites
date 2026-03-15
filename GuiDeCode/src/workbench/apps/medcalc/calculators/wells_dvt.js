export default {
  id: 'wells_dvt',
  name: 'Wells Score for DVT',
  shortDescription: 'Clinical prediction rule for deep vein thrombosis probability',
  system: 'cardiovascular',
  specialty: ['Emergency Medicine', 'Internal Medicine', 'Hematology', 'Vascular Medicine'],
  tags: ['DVT', 'deep vein thrombosis', 'VTE', 'thrombosis', 'D-dimer'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Wells PS et al.',
  creatorYear: '1997',
  description: 'The Wells score for DVT is a clinical prediction rule that estimates the pretest probability of deep vein thrombosis. It combines clinical signs, risk factors, and the likelihood of an alternative diagnosis to categorize patients into low, moderate, or high probability groups, guiding subsequent diagnostic workup with D-dimer testing and/or compression ultrasonography.',
  whyUse: 'Standardizes clinical assessment of DVT probability, reduces unnecessary imaging, and guides cost-effective diagnostic pathways. A negative D-dimer combined with low Wells score safely excludes DVT.',
  whenToUse: [
    'Suspected lower extremity DVT in outpatient or emergency setting',
    'To determine whether D-dimer or ultrasound is the appropriate next test',
    'Risk stratification before initiating empiric anticoagulation',
  ],
  nextSteps: 'Low probability (≤0): D-dimer; if negative, DVT excluded. Moderate probability (1-2): D-dimer; if positive, proceed to compression ultrasound. High probability (≥3): Compression ultrasound directly (D-dimer not sufficient to exclude). If ultrasound negative but high clinical suspicion, consider repeat ultrasound in 5-7 days or alternative imaging.',
  pearls: [
    'The "alternative diagnosis equally or more likely" criterion is subjective but critically important — it subtracts 2 points.',
    'Wells score should not be used in pregnant patients, patients on anticoagulation, or those with prior DVT in the last month.',
    'A Wells score ≤1 combined with negative D-dimer has a negative predictive value >99% for DVT.',
    'In hospitalized patients, the score performs less well due to higher baseline VTE risk.',
    'There is also a separate Wells score for PE — do not confuse the two.',
  ],
  evidence: 'Validated in multiple prospective studies with >5,000 patients. The combination of low Wells score + negative D-dimer safely excluded DVT with <1% failure rate at 3-month follow-up.',
  formula: 'Sum of clinical criteria (range -2 to +9):\nActive cancer (+1), Paralysis/immobilization (+1),\nBedridden >3d or surgery <12wk (+1),\nLocalized tenderness (+1), Entire leg swollen (+1),\nCalf swelling >3cm (+1), Pitting edema (+1),\nCollateral veins (+1), Previous DVT (+1),\nAlternative dx equally likely (-2)',
  references: [
    { text: 'Wells PS et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798.', url: 'https://pubmed.ncbi.nlm.nih.gov/9428249/' },
    { text: 'Wells PS et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med. 2003;349(13):1227-1235.', url: 'https://pubmed.ncbi.nlm.nih.gov/14507948/' },
  ],
  links: [
    { title: 'MDCalc — Wells DVT', url: 'https://www.mdcalc.com/calc/362/wells-criteria-dvt', description: 'Interactive Wells DVT calculator' },
    { title: 'ACEP — DVT Clinical Policy', url: 'https://www.acep.org/patient-care/clinical-policies/', description: 'Emergency medicine clinical policies for VTE' },
  ],
  interpretations: [
    { range: '<1', label: 'Low probability (~5% prevalence)', action: 'D-dimer test; if negative, DVT excluded' },
    { range: '1-2', label: 'Moderate probability (~17% prevalence)', action: 'D-dimer test; if positive, compression ultrasound' },
    { range: '>2', label: 'High probability (~53% prevalence)', action: 'Compression ultrasound directly; consider empiric anticoagulation' },
  ],
  fields: [
    { key: 'cancer', label: 'Active cancer (treatment within 6 months or palliative)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'paralysis', label: 'Paralysis, paresis, or recent cast immobilization of lower extremity', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'bedridden', label: 'Bedridden >3 days or major surgery within 12 weeks', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'tenderness', label: 'Localized tenderness along deep venous system', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'swelling', label: 'Entire leg swollen', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'calf', label: 'Calf swelling >3 cm compared to asymptomatic leg', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'pitting', label: 'Pitting edema (greater in symptomatic leg)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'collateral', label: 'Collateral superficial veins (non-varicose)', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'previous', label: 'Previously documented DVT', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: 1, label: 'Yes (+1)' }] },
    { key: 'alternative', label: 'Alternative diagnosis at least as likely', type: 'score_picker', options: [{ value: 0, label: 'No (0)' }, { value: -2, label: 'Yes (-2)' }] },
  ],
  calculate: (vals) => {
    const fields = ['cancer', 'paralysis', 'bedridden', 'tenderness', 'swelling', 'calf', 'pitting', 'collateral', 'previous', 'alternative']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const score = fields.reduce((sum, f) => sum + (parseInt(vals[f]) || 0), 0)
    let interp = ''
    if (score <= 0) interp = 'Low probability — prevalence ~5%'
    else if (score <= 2) interp = 'Moderate probability — prevalence ~17%'
    else interp = 'High probability — prevalence ~53%'
    return {
      result: String(score),
      unit: 'points',
      interpretation: interp,
    }
  },
}
