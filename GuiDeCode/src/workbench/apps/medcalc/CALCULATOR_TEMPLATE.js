// ============================================================================
// CALCULATOR TEMPLATE
// Copy this file to medcalc/calculators/your_calculator.js
// Fill in all fields and export default.
// The registry will auto-detect your calculator.
// ============================================================================

export default {
  // ─── Identity ────────────────────────────────────────────────────
  id: 'unique_calculator_id',
  name: 'Calculator Display Name',
  shortDescription: 'One-line summary shown in card view',

  // ─── Classification ──────────────────────────────────────────────
  // System keys: cardiovascular, critical_care, respiratory, neurology,
  //   surgery_trauma, gastro_hepatology, nephrology, endocrinology,
  //   hematology_oncology, infectious_disease, pharmacology, pediatrics,
  //   obstetrics, nutrition, psychiatry, dermatology, genetics,
  //   radiology, utilities
  system: 'utilities',
  specialty: ['General Practice'],
  tags: ['keyword1', 'keyword2'],

  // ─── Versioning ──────────────────────────────────────────────────
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Original Author Name',
  creatorYear: 'YYYY',

  // ─── Description & Education ─────────────────────────────────────
  description: 'Full description of what this calculator does, its history, and clinical significance.',
  whyUse: 'Brief explanation of clinical utility.',
  whenToUse: [
    'Clinical scenario 1',
    'Clinical scenario 2',
  ],
  nextSteps: 'What to do with the result.',

  // ─── Pearls, Pitfalls, Evidence ──────────────────────────────────
  pearls: [
    'Useful clinical pearl',
    'Common pitfall to avoid',
  ],
  evidence: 'Summary of validation studies and level of evidence.',
  formula: 'Mathematical formula displayed in code block',

  // ─── References & Links ──────────────────────────────────────────
  references: [
    {
      text: 'Author et al. Title. Journal. Year;Vol:Pages.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/XXXXXXXX/',
    },
  ],
  links: [
    {
      title: 'MDCalc — Calculator Name',
      url: 'https://www.mdcalc.com/calc/XXXX',
      description: 'Interactive calculator with evidence review',
    },
  ],

  // ─── Interpretation Table ────────────────────────────────────────
  // range: used for highlighting active row based on result
  // Supported formats: "0-2", "<18.5", "≥30", ">100", exact number
  interpretations: [
    { range: '0-5', label: 'Low risk', action: 'Routine follow-up' },
    { range: '6-10', label: 'Moderate risk', action: 'Consider intervention' },
    { range: '>10', label: 'High risk', action: 'Urgent evaluation' },
  ],

  // ─── Input Fields ────────────────────────────────────────────────
  // Types: 'number', 'select', 'checkbox', 'radio', 'score_picker'
  //
  // number:       { key, label, type: 'number', min, max, step, placeholder, hint }
  // select:       { key, label, type: 'select', options: ['A','B'] or [{value:'a',label:'A'}] }
  // checkbox:     { key, label, type: 'checkbox', checkboxLabel: 'Yes' }
  // radio:        { key, label, type: 'radio', options: ['A','B'] }
  // score_picker: { key, label, type: 'score_picker', options: [{value:0,label:'No (0)'},{value:1,label:'Yes (+1)'}] }
  //
  // Add required: false if field is optional (default is required)
  fields: [
    { key: 'field1', label: 'Field Label', type: 'number', placeholder: 'Enter value', hint: 'unit or guidance' },
  ],

  // ─── Calculate Function ──────────────────────────────────────────
  // Receives object with field keys as properties.
  // Must return: { result, unit, interpretation, detail?, breakdown? }
  //   result:         string or number displayed as main result
  //   unit:           unit string
  //   interpretation: main interpretation text
  //   detail:         optional extra explanation
  //   breakdown:      optional array of { label, value } for sub-scores
  // Return null if inputs are insufficient.
  calculate: (vals) => {
    return null
  },
}
