export default {
  id: 'insulin_correction',
  name: 'Insulin Correction & Sensitivity Calculator',
  shortDescription: 'Calculates insulin sensitivity factor, correction dose, and I:C ratio',
  system: 'endocrinology',
  specialty: ['Endocrinology', 'Internal Medicine', 'Primary Care', 'Critical Care'],
  tags: ['insulin', 'diabetes', 'correction factor', 'sensitivity', 'sliding scale', 'carb ratio'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Davidson PC / Walsh J et al.',
  creatorYear: '1990s',
  description: 'Calculates the Insulin Sensitivity Factor (ISF/correction factor) using the 1800 rule (rapid-acting) or 1500 rule (regular insulin), the correction dose for hyperglycemia, and the Insulin-to-Carb (I:C) ratio using the 500 rule. These calculations are fundamental to diabetes management for both insulin pump users and MDI (multiple daily injection) patients.',
  whyUse: 'Personalizes insulin dosing. Calculates how much 1 unit of insulin will lower blood glucose. Determines correction doses for hyperglycemia. Estimates carb coverage ratios.',
  whenToUse: [
    'Setting up insulin pump parameters',
    'Initiating or adjusting MDI (basal-bolus) regimens',
    'Calculating correction doses for hyperglycemia',
    'Adjusting insulin-to-carb ratios',
  ],
  nextSteps: 'ISF and I:C ratios are starting estimates — titrate based on glucose monitoring (CGM or SMBG). Correction dose = (Current BG - Target BG) / ISF. Review every 1-2 weeks during initiation. Always consider active insulin on board (IOB).',
  pearls: [
    '1800 Rule (rapid-acting: lispro, aspart, glulisine): ISF = 1800 / TDD.',
    '1500 Rule (regular insulin): ISF = 1500 / TDD.',
    '500 Rule (I:C ratio): I:C = 500 / TDD (grams of carb per 1 unit).',
    'TDD = Total Daily Dose of all insulin (basal + bolus).',
    'These are STARTING estimates — always individualize based on monitoring.',
    'ISF typically ranges from 20-100 mg/dL per unit in adults.',
    'Sick patients, steroid use, and stress can significantly alter insulin sensitivity.',
  ],
  evidence: 'The 1800 rule (Walsh et al., Pumping Insulin) and 500 rule are widely used in clinical practice and ADA/AACE guidelines. Evidence is largely empirical and consensus-based. Individualization through glucose monitoring is always required.',
  formula: 'ISF (mg/dL per unit) = 1800 / TDD (rapid-acting)\nISF = 1500 / TDD (regular insulin)\nCorrection dose (units) = (Current BG - Target BG) / ISF\nI:C ratio = 500 / TDD (grams carb per 1 unit)',
  references: [
    { text: 'Walsh J, Roberts R. Pumping Insulin. 6th ed. Torrey Pines Press; 2016.', url: 'https://www.diabetesnet.com/' },
    { text: 'American Diabetes Association. Standards of Care in Diabetes — 2024. Diabetes Care. 2024;47(Suppl 1).', url: 'https://diabetesjournals.org/care/issue/47/Supplement_1' },
  ],
  links: [
    { title: 'MDCalc — Insulin Dosing', url: 'https://www.mdcalc.com/calc/10475/insulin-dosing-calculator', description: 'Insulin dosing calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'tdd', label: 'Total Daily Dose (TDD) of Insulin', type: 'number', min: 1, max: 500, step: 1, placeholder: 'units/day', hint: 'units/day (all insulin: basal + bolus)' },
    { key: 'insulin_type', label: 'Insulin Type for Correction', type: 'select', options: [{ value: 'rapid', label: 'Rapid-acting (1800 rule)' }, { value: 'regular', label: 'Regular insulin (1500 rule)' }] },
    { key: 'current_bg', label: 'Current Blood Glucose', type: 'number', min: 30, max: 800, step: 1, placeholder: 'mg/dL', hint: 'mg/dL' },
    { key: 'target_bg', label: 'Target Blood Glucose', type: 'number', min: 70, max: 200, step: 1, placeholder: 'mg/dL', hint: 'mg/dL (typically 100-150)' },
  ],
  calculate: (vals) => {
    const tdd = parseFloat(vals.tdd)
    const type = vals.insulin_type
    const currentBG = parseFloat(vals.current_bg)
    const targetBG = parseFloat(vals.target_bg)
    if (!tdd || !type || !currentBG || !targetBG) return null
    const divisor = type === 'rapid' ? 1800 : 1500
    const isf = divisor / tdd
    const correctionDose = currentBG > targetBG ? (currentBG - targetBG) / isf : 0
    const icRatio = 500 / tdd
    return {
      result: isf.toFixed(0),
      unit: 'mg/dL per unit (ISF)',
      interpretation: `1 unit lowers BG by ~${isf.toFixed(0)} mg/dL. Correction dose: ${correctionDose.toFixed(1)} units.`,
      breakdown: [
        { label: 'Insulin Sensitivity Factor', value: `${isf.toFixed(0)} mg/dL per unit` },
        { label: 'Correction Dose', value: `${correctionDose.toFixed(1)} units` },
        { label: 'I:C Ratio (500 rule)', value: `1:${icRatio.toFixed(0)} (1 unit per ${icRatio.toFixed(0)}g carb)` },
        { label: 'Rule Used', value: `${divisor} / ${tdd} TDD` },
      ],
    }
  },
}
