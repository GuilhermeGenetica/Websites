export default {
  id: 'sofa',
  name: 'SOFA Score',
  shortDescription: 'Sequential Organ Failure Assessment for ICU mortality prediction',
  system: 'critical_care',
  specialty: ['Critical Care', 'Emergency Medicine', 'Internal Medicine'],
  tags: ['sepsis', 'organ failure', 'ICU', 'mortality', 'SOFA'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Vincent JL et al.',
  creatorYear: '1996',
  description: 'The Sequential Organ Failure Assessment (SOFA) score quantifies the degree of organ dysfunction across six organ systems: respiratory, coagulation, liver, cardiovascular, CNS, and renal. It is used to track ICU patient status over time. An acute change in SOFA ≥ 2 from baseline is part of the Sepsis-3 definition for sepsis.',
  whyUse: 'Tracks organ dysfunction longitudinally in ICU patients. An increase in SOFA ≥ 2 is a key criterion for sepsis diagnosis (Sepsis-3). Predicts ICU mortality and helps guide escalation/de-escalation of care.',
  whenToUse: [
    'ICU admission for organ dysfunction assessment',
    'Suspected sepsis (Sepsis-3 definition: infection + SOFA increase ≥ 2)',
    'Daily ICU assessment to track clinical trajectory',
    'Prognostication and family discussions',
  ],
  nextSteps: 'SOFA ≥ 2 with suspected infection = sepsis. Increasing SOFA suggests clinical deterioration; consider escalation. Decreasing SOFA suggests improvement. Initial SOFA and maximum SOFA correlate with ICU mortality.',
  pearls: [
    'SOFA is designed for serial measurement — trends are more informative than single values.',
    'Baseline SOFA is assumed to be 0 for patients without known pre-existing organ dysfunction.',
    'qSOFA (≥2 of: RR ≥22, altered mentation, SBP ≤100) is a bedside screening tool, NOT a substitute for SOFA.',
    'SOFA does not include lactate — consider it separately for septic shock assessment.',
    'Cardiovascular SOFA component includes vasopressor doses — ensure accurate documentation.',
  ],
  evidence: 'Validated in multiple large ICU cohorts. The Sepsis-3 consensus (JAMA 2016) adopted SOFA as the primary organ dysfunction tool for sepsis definition. Initial SOFA >11 associated with >80% ICU mortality in the original study.',
  formula: 'Sum of 6 organ system scores (0-4 each, total 0-24):\nRespiration: PaO₂/FiO₂\nCoagulation: Platelets\nLiver: Bilirubin\nCardiovascular: MAP and vasopressors\nCNS: Glasgow Coma Scale\nRenal: Creatinine or urine output',
  references: [
    { text: 'Vincent JL et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-710.', url: 'https://pubmed.ncbi.nlm.nih.gov/8844239/' },
    { text: 'Singer M et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.', url: 'https://pubmed.ncbi.nlm.nih.gov/26903338/' },
  ],
  links: [
    { title: 'MDCalc — SOFA Score', url: 'https://www.mdcalc.com/calc/691/sequential-organ-failure-assessment-sofa-score', description: 'Interactive SOFA calculator' },
    { title: 'Surviving Sepsis Campaign', url: 'https://www.sccm.org/SurvivingSepsisCampaign/Home', description: 'Guidelines for sepsis management' },
  ],
  interpretations: [
    { range: '0-1', label: 'Minimal organ dysfunction', action: 'Routine ICU monitoring' },
    { range: '2-3', label: 'Mild organ dysfunction (~<10% mortality)', action: 'Close monitoring; if infection suspected, meets sepsis criteria if SOFA change ≥2' },
    { range: '4-6', label: 'Moderate organ dysfunction (~15-20% mortality)', action: 'Aggressive support; reassess diagnosis and treatment' },
    { range: '7-9', label: 'Severe organ dysfunction (~30-40% mortality)', action: 'Intensive support; consider goals of care discussion' },
    { range: '10-12', label: 'Very severe dysfunction (~50-60% mortality)', action: 'Maximal support; palliative care consultation may be appropriate' },
    { range: '>12', label: 'Critical (~>80% mortality)', action: 'Discuss prognosis with family; consider comfort-focused care' },
  ],
  fields: [
    {
      key: 'respiration', label: 'Respiration — PaO₂/FiO₂ (mmHg)', type: 'score_picker',
      options: [
        { value: 0, label: '≥400 (0)' },
        { value: 1, label: '<400 (1)' },
        { value: 2, label: '<300 (2)' },
        { value: 3, label: '<200 + vent (3)' },
        { value: 4, label: '<100 + vent (4)' },
      ],
    },
    {
      key: 'coagulation', label: 'Coagulation — Platelets (×10³/µL)', type: 'score_picker',
      options: [
        { value: 0, label: '≥150 (0)' },
        { value: 1, label: '<150 (1)' },
        { value: 2, label: '<100 (2)' },
        { value: 3, label: '<50 (3)' },
        { value: 4, label: '<20 (4)' },
      ],
    },
    {
      key: 'liver', label: 'Liver — Bilirubin (mg/dL)', type: 'score_picker',
      options: [
        { value: 0, label: '<1.2 (0)' },
        { value: 1, label: '1.2-1.9 (1)' },
        { value: 2, label: '2.0-5.9 (2)' },
        { value: 3, label: '6.0-11.9 (3)' },
        { value: 4, label: '≥12.0 (4)' },
      ],
    },
    {
      key: 'cardiovascular', label: 'Cardiovascular', type: 'score_picker',
      options: [
        { value: 0, label: 'MAP ≥70 (0)' },
        { value: 1, label: 'MAP <70 (1)' },
        { value: 2, label: 'Dopa ≤5 or Dobu (2)' },
        { value: 3, label: 'Dopa >5 or Epi/NE ≤0.1 (3)' },
        { value: 4, label: 'Dopa >15 or Epi/NE >0.1 (4)' },
      ],
    },
    {
      key: 'cns', label: 'CNS — Glasgow Coma Scale', type: 'score_picker',
      options: [
        { value: 0, label: '15 (0)' },
        { value: 1, label: '13-14 (1)' },
        { value: 2, label: '10-12 (2)' },
        { value: 3, label: '6-9 (3)' },
        { value: 4, label: '<6 (4)' },
      ],
    },
    {
      key: 'renal', label: 'Renal — Creatinine (mg/dL) or Urine Output', type: 'score_picker',
      options: [
        { value: 0, label: '<1.2 (0)' },
        { value: 1, label: '1.2-1.9 (1)' },
        { value: 2, label: '2.0-3.4 (2)' },
        { value: 3, label: '3.5-4.9 or UO <500mL/d (3)' },
        { value: 4, label: '≥5.0 or UO <200mL/d (4)' },
      ],
    },
  ],
  calculate: (vals) => {
    const fields = ['respiration', 'coagulation', 'liver', 'cardiovascular', 'cns', 'renal']
    const allFilled = fields.every(f => vals[f] !== undefined && vals[f] !== '' && vals[f] !== null)
    if (!allFilled) return null
    const components = fields.map(f => parseInt(vals[f]) || 0)
    const score = components.reduce((a, b) => a + b, 0)
    let mortality = ''
    if (score <= 1) mortality = '<10%'
    else if (score <= 3) mortality = '~15%'
    else if (score <= 6) mortality = '~20%'
    else if (score <= 9) mortality = '~30-40%'
    else if (score <= 12) mortality = '~50-60%'
    else mortality = '>80%'
    let interp = `Estimated ICU mortality: ${mortality}`
    return {
      result: String(score),
      unit: 'points (0-24)',
      interpretation: interp,
      breakdown: [
        { label: 'Respiration', value: String(components[0]) },
        { label: 'Coagulation', value: String(components[1]) },
        { label: 'Liver', value: String(components[2]) },
        { label: 'Cardiovascular', value: String(components[3]) },
        { label: 'CNS', value: String(components[4]) },
        { label: 'Renal', value: String(components[5]) },
      ],
    }
  },
}
