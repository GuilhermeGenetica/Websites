export default {
  id: 'unit_converter',
  name: 'Medical Unit Converter',
  shortDescription: 'Common medical unit conversions: mg↔µg, mmol↔mg/dL, kg↔lb, °C↔°F, etc.',
  system: 'utilities',
  specialty: ['All Specialties'],
  tags: ['converter', 'units', 'mg', 'mcg', 'mmol', 'temperature', 'weight', 'length'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard conversion factors',
  creatorYear: '',
  description: 'A comprehensive medical unit converter for commonly needed clinical conversions including weight (mg, µg, kg, lb, oz), temperature (°C, °F), length (cm, inches, feet), volume (mL, L), concentration (mmol/L to mg/dL for glucose, creatinine, calcium, etc.), and other frequently used medical conversions.',
  whyUse: 'Rapid bedside unit conversion. Prevents conversion errors that can cause dosing mistakes. Essential for international practice (metric ↔ imperial). Common lab value conversions across different reporting systems.',
  whenToUse: [
    'Converting between metric and imperial units',
    'Lab value conversions between mmol/L and mg/dL',
    'Temperature conversions',
    'Drug dosing unit conversions (mg ↔ mcg)',
  ],
  nextSteps: 'Always double-check critical conversions (drug doses, lab values). Be aware that conversion factors differ by analyte for mmol/L to mg/dL conversions.',
  pearls: [
    '1 mg = 1000 mcg (µg). 1 g = 1000 mg.',
    '°C to °F: F = (C × 9/5) + 32. °F to °C: C = (F - 32) × 5/9.',
    '1 kg = 2.205 lb. 1 inch = 2.54 cm.',
    'Glucose: mg/dL × 0.0555 = mmol/L. Creatinine: mg/dL × 88.4 = µmol/L.',
    'Calcium: mg/dL × 0.25 = mmol/L. Na/K: mEq/L = mmol/L (monovalent).',
    'Bilirubin: mg/dL × 17.1 = µmol/L.',
  ],
  evidence: 'Standard international conversion factors.',
  formula: 'See individual conversion factors in results.',
  references: [],
  links: [],
  interpretations: [],
  fields: [
    { key: 'value', label: 'Value to Convert', type: 'number', min: -1000, max: 1000000, step: 0.001, placeholder: 'Enter value', hint: 'Enter the number to convert' },
    {
      key: 'conversion', label: 'Conversion Type', type: 'select',
      options: [
        { value: 'c_to_f', label: '°C → °F' },
        { value: 'f_to_c', label: '°F → °C' },
        { value: 'kg_to_lb', label: 'kg → lb' },
        { value: 'lb_to_kg', label: 'lb → kg' },
        { value: 'cm_to_in', label: 'cm → inches' },
        { value: 'in_to_cm', label: 'inches → cm' },
        { value: 'mg_to_mcg', label: 'mg → mcg (µg)' },
        { value: 'mcg_to_mg', label: 'mcg (µg) → mg' },
        { value: 'glucose_mgdl_mmol', label: 'Glucose: mg/dL → mmol/L' },
        { value: 'glucose_mmol_mgdl', label: 'Glucose: mmol/L → mg/dL' },
        { value: 'creat_mgdl_umol', label: 'Creatinine: mg/dL → µmol/L' },
        { value: 'creat_umol_mgdl', label: 'Creatinine: µmol/L → mg/dL' },
        { value: 'bili_mgdl_umol', label: 'Bilirubin: mg/dL → µmol/L' },
        { value: 'bili_umol_mgdl', label: 'Bilirubin: µmol/L → mg/dL' },
        { value: 'calcium_mgdl_mmol', label: 'Calcium: mg/dL → mmol/L' },
        { value: 'calcium_mmol_mgdl', label: 'Calcium: mmol/L → mg/dL' },
      ],
    },
  ],
  calculate: (vals) => {
    const v = parseFloat(vals.value)
    const conv = vals.conversion
    if (v === undefined || v === null || isNaN(v) || !conv) return null
    const conversions = {
      c_to_f: { calc: (v) => (v * 9 / 5) + 32, unit: '°F', label: '°C → °F' },
      f_to_c: { calc: (v) => (v - 32) * 5 / 9, unit: '°C', label: '°F → °C' },
      kg_to_lb: { calc: (v) => v * 2.20462, unit: 'lb', label: 'kg → lb' },
      lb_to_kg: { calc: (v) => v / 2.20462, unit: 'kg', label: 'lb → kg' },
      cm_to_in: { calc: (v) => v / 2.54, unit: 'inches', label: 'cm → inches' },
      in_to_cm: { calc: (v) => v * 2.54, unit: 'cm', label: 'in → cm' },
      mg_to_mcg: { calc: (v) => v * 1000, unit: 'mcg', label: 'mg → mcg' },
      mcg_to_mg: { calc: (v) => v / 1000, unit: 'mg', label: 'mcg → mg' },
      glucose_mgdl_mmol: { calc: (v) => v * 0.0555, unit: 'mmol/L', label: 'Glucose mg/dL → mmol/L' },
      glucose_mmol_mgdl: { calc: (v) => v / 0.0555, unit: 'mg/dL', label: 'Glucose mmol/L → mg/dL' },
      creat_mgdl_umol: { calc: (v) => v * 88.4, unit: 'µmol/L', label: 'Creatinine mg/dL → µmol/L' },
      creat_umol_mgdl: { calc: (v) => v / 88.4, unit: 'mg/dL', label: 'Creatinine µmol/L → mg/dL' },
      bili_mgdl_umol: { calc: (v) => v * 17.1, unit: 'µmol/L', label: 'Bilirubin mg/dL → µmol/L' },
      bili_umol_mgdl: { calc: (v) => v / 17.1, unit: 'mg/dL', label: 'Bilirubin µmol/L → mg/dL' },
      calcium_mgdl_mmol: { calc: (v) => v * 0.25, unit: 'mmol/L', label: 'Calcium mg/dL → mmol/L' },
      calcium_mmol_mgdl: { calc: (v) => v / 0.25, unit: 'mg/dL', label: 'Calcium mmol/L → mg/dL' },
    }
    const c = conversions[conv]
    if (!c) return null
    const result = c.calc(v)
    return {
      result: Math.abs(result) < 0.01 ? result.toFixed(4) : result < 10 ? result.toFixed(2) : result.toFixed(1),
      unit: c.unit,
      interpretation: c.label,
    }
  },
}
