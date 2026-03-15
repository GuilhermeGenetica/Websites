export default {
  id: 'killip',
  name: 'Killip Classification',
  shortDescription: 'Bedside classification of heart failure severity after acute MI',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Emergency Medicine', 'Critical Care'],
  tags: ['Killip', 'MI', 'heart failure', 'acute myocardial infarction', 'cardiogenic shock'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Killip T, Kimball JT',
  creatorYear: '1967',
  description: 'The Killip classification stratifies patients with acute myocardial infarction based on clinical signs of heart failure at presentation. It predicts in-hospital mortality and guides the intensity of hemodynamic support and monitoring. Classes range from I (no heart failure) to IV (cardiogenic shock).',
  whyUse: 'Rapid bedside assessment requiring only physical exam. Strong predictor of in-hospital mortality after MI. Guides level of care: ICU vs. telemetry vs. CCU. Component of GRACE and other risk models.',
  whenToUse: [
    'Acute myocardial infarction at presentation',
    'Serial assessment of hemodynamic status during MI management',
    'Component of GRACE risk score calculation',
  ],
  nextSteps: 'Class I: Standard MI management, telemetry. Class II: Diuretics, monitoring for deterioration. Class III: Aggressive diuresis, NIV, consider ICU/CCU. Class IV: Cardiogenic shock — vasopressors, inotropes, mechanical circulatory support, emergent cath.',
  pearls: [
    'Killip class at presentation is one of the strongest predictors of MI mortality.',
    'Class IV (cardiogenic shock) has ~50-80% mortality without revascularization.',
    'Modern reperfusion therapy has improved outcomes across all Killip classes.',
    'S3 gallop and JVD indicate Class II; rales in > 50% of lung fields indicate Class III.',
    'Killip class can change during hospitalization — reassess serially.',
  ],
  evidence: 'Original publication by Killip and Kimball (Am J Cardiol, 1967). Pre-reperfusion mortality: Class I ~6%, II ~17%, III ~38%, IV ~81%. Modern era with PCI: significantly lower but class remains prognostic.',
  formula: 'Class I: No clinical signs of heart failure\nClass II: Rales, S3, JVD\nClass III: Frank pulmonary edema\nClass IV: Cardiogenic shock (SBP < 90, signs of hypoperfusion)',
  references: [
    { text: 'Killip T, Kimball JT. Treatment of myocardial infarction in a coronary care unit. Am J Cardiol. 1967;20(4):457-464.', url: 'https://pubmed.ncbi.nlm.nih.gov/6059183/' },
  ],
  links: [
    { title: 'MDCalc — Killip Classification', url: 'https://www.mdcalc.com/calc/1094/killip-classification-heart-failure-mi', description: 'Interactive Killip classification' },
  ],
  interpretations: [
    { range: '1', label: 'Class I — No heart failure', action: 'Standard MI management; telemetry monitoring' },
    { range: '2', label: 'Class II — Mild-moderate HF', action: 'Diuretics; close monitoring; consider CCU' },
    { range: '3', label: 'Class III — Pulmonary edema', action: 'Aggressive diuresis; NIV/ventilation; ICU/CCU admission' },
    { range: '4', label: 'Class IV — Cardiogenic shock', action: 'Vasopressors, inotropes; emergent cath/PCI; mechanical support (IABP/Impella/ECMO)' },
  ],
  fields: [
    {
      key: 'killip_class', label: 'Clinical findings at presentation', type: 'score_picker',
      options: [
        { value: 1, label: 'Class I — No signs of heart failure' },
        { value: 2, label: 'Class II — Rales, S3, or JVD' },
        { value: 3, label: 'Class III — Frank pulmonary edema' },
        { value: 4, label: 'Class IV — Cardiogenic shock (SBP < 90, hypoperfusion)' },
      ],
    },
  ],
  calculate: (vals) => {
    const cls = parseInt(vals.killip_class)
    if (!cls) return null
    const mortality = { 1: '~6%', 2: '~17%', 3: '~38%', 4: '~67-81%' }
    const labels = { 1: 'No heart failure', 2: 'Mild-moderate heart failure (rales, S3, JVD)', 3: 'Frank pulmonary edema', 4: 'Cardiogenic shock' }
    return {
      result: `Class ${cls}`,
      unit: '',
      interpretation: `${labels[cls]} — in-hospital mortality: ${mortality[cls]}`,
    }
  },
}
