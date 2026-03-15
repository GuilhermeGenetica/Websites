export default {
  id: 'iv_drip_rate',
  name: 'IV Drip Rate Calculator',
  shortDescription: 'Calculates drops/min for gravity infusions and mL/hr for pump infusions',
  system: 'pharmacology',
  specialty: ['Nursing', 'Emergency Medicine', 'Critical Care', 'Pharmacy', 'Pediatrics'],
  tags: ['IV', 'drip rate', 'infusion', 'drops', 'gtts', 'pump', 'fluid administration'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard nursing/pharmacy calculation',
  creatorYear: '',
  description: 'Calculates the IV drip rate for both gravity-fed infusions (drops per minute using a given drip set factor) and electronic pump infusions (mL/hr). Essential for calculating how fast to run an IV fluid or medication infusion to deliver the prescribed volume over the ordered time.',
  whyUse: 'Essential skill for safe IV medication/fluid administration. Prevents infusion rate errors. Supports both gravity (gtts/min) and electronic pump (mL/hr) calculations.',
  whenToUse: [
    'Setting up IV fluid infusions',
    'Gravity infusion without a pump — calculating drops/min',
    'Pump infusion — calculating mL/hr from total volume and time',
    'Verifying IV pump rate settings',
  ],
  nextSteps: 'Verify rate with a second provider for high-risk infusions. Monitor patient response. Adjust rate based on clinical assessment, vital signs, and urine output.',
  pearls: [
    'Common drip set factors: 10 gtts/mL (macro), 15 gtts/mL (macro), 20 gtts/mL (macro), 60 gtts/mL (micro/pediatric).',
    'Microdrip (60 gtts/mL): gtts/min = mL/hr (simplifies calculation).',
    'Always double-check high-risk infusions: vasopressors, insulin, heparin, chemotherapy.',
    'Consider maximum safe infusion rates for specific medications.',
    'Blood products: typically use 10 or 15 gtts/mL sets; do not exceed 4-hour infusion time.',
    'For KVO (keep vein open), typical rate is 10-30 mL/hr.',
  ],
  evidence: 'Standard pharmaceutical and nursing calculation. ISMP and Joint Commission safety guidelines recommend independent double-checks for high-risk infusions.',
  formula: 'Pump rate: mL/hr = Total Volume (mL) / Time (hours)\nDrip rate: gtts/min = (Total Volume × Drop Factor) / (Time in minutes)\nOr: gtts/min = mL/hr × Drop Factor / 60',
  references: [
    { text: 'Institute for Safe Medication Practices (ISMP). IV push medication safety guidelines.', url: 'https://www.ismp.org/' },
  ],
  links: [],
  interpretations: [],
  fields: [
    { key: 'volume', label: 'Total Volume to Infuse', type: 'number', min: 1, max: 10000, step: 1, placeholder: 'mL', hint: 'mL' },
    { key: 'time_hours', label: 'Time for Infusion', type: 'number', min: 0.1, max: 168, step: 0.1, placeholder: 'hours', hint: 'hours' },
    {
      key: 'drop_factor', label: 'Drop Factor (drip set)', type: 'score_picker',
      options: [
        { value: 10, label: '10 gtts/mL (macro)' },
        { value: 15, label: '15 gtts/mL (macro)' },
        { value: 20, label: '20 gtts/mL (macro)' },
        { value: 60, label: '60 gtts/mL (micro/pediatric)' },
      ],
    },
  ],
  calculate: (vals) => {
    const vol = parseFloat(vals.volume)
    const hours = parseFloat(vals.time_hours)
    const df = parseInt(vals.drop_factor)
    if (!vol || !hours || !df || hours <= 0) return null
    const mlPerHr = vol / hours
    const minutes = hours * 60
    const gttsPerMin = (vol * df) / minutes
    return {
      result: Math.round(mlPerHr).toString(),
      unit: 'mL/hr (pump)',
      interpretation: `Gravity: ${gttsPerMin.toFixed(1)} gtts/min (using ${df} gtts/mL set)`,
      breakdown: [
        { label: 'Pump rate', value: `${mlPerHr.toFixed(1)} mL/hr` },
        { label: 'Gravity drip rate', value: `${gttsPerMin.toFixed(1)} gtts/min` },
        { label: 'Total volume', value: `${vol} mL` },
        { label: 'Infusion time', value: `${hours} hours (${Math.round(minutes)} min)` },
      ],
    }
  },
}
