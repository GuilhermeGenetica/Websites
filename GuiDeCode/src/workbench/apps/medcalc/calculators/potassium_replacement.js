export default {
  id: 'potassium_replacement',
  name: 'Potassium Replacement Calculator',
  shortDescription: 'Estimates KCl dose needed to correct hypokalemia',
  system: 'nephrology',
  specialty: ['Internal Medicine', 'Critical Care', 'Nephrology', 'Emergency Medicine'],
  tags: ['potassium', 'hypokalemia', 'KCl', 'electrolytes', 'replacement', 'repletion'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Standard clinical estimation',
  creatorYear: '',
  description: 'Estimates the amount of potassium chloride (KCl) needed to correct hypokalemia. A rough rule is that for each 0.3 mEq/L below 3.5, approximately 100 mEq of total body potassium deficit exists (in a 70 kg adult). This calculator provides dose estimates and practical administration guidance.',
  whyUse: 'Guides safe and effective potassium repletion. Prevents under-dosing (persistent hypokalemia) and over-dosing (hyperkalemia). Practical conversion to common KCl preparations.',
  whenToUse: [
    'Serum K⁺ < 3.5 mEq/L',
    'Symptomatic hypokalemia (weakness, arrhythmias, ECG changes)',
    'Prophylactic supplementation (diuretic use, DKA recovery)',
  ],
  nextSteps: 'Give oral KCl if K ≥ 3.0 and asymptomatic. IV KCl if K < 3.0, symptomatic, or NPO. Max IV rate: 10-20 mEq/hr peripheral, 40 mEq/hr central (with cardiac monitoring). Recheck K⁺ after each 40-60 mEq given. Always check and correct Mg²⁺.',
  pearls: [
    'Each 10 mEq of K replaced raises serum K by approximately 0.1 mEq/L (transient).',
    'Total body K deficit may be 200-400 mEq for each 1 mEq/L drop below 4.0.',
    'ALWAYS check magnesium — hypomagnesemia causes refractory hypokalemia.',
    'Max concentration: 40 mEq/L peripheral IV, 60 mEq/L central line.',
    'Max IV rate with cardiac monitoring: 10-20 mEq/hr peripheral, up to 40 mEq/hr central.',
    'Oral KCl is preferred when possible — better tolerated and steadier correction.',
    'DKA: K may drop rapidly during insulin/fluid treatment — monitor every 1-2 hours.',
  ],
  evidence: 'Based on clinical practice guidelines and physiological estimates. Exact body K deficit is difficult to measure. Rule of thumb (100 mEq per 0.3 mEq/L deficit) is widely cited in clinical medicine textbooks and UpToDate.',
  formula: 'Estimated deficit (mEq) ≈ (3.5 - Current K) / 0.3 × 100\nPractical approach:\nK 3.0-3.5: Give 40-80 mEq KCl\nK 2.5-3.0: Give 80-120 mEq KCl\nK < 2.5: Give 120-160+ mEq KCl (with cardiac monitoring)',
  references: [
    { text: 'Gennari FJ. Hypokalemia. N Engl J Med. 1998;339(7):451-458.', url: 'https://pubmed.ncbi.nlm.nih.gov/9700180/' },
  ],
  links: [],
  interpretations: [
    { range: '3-3.4', label: 'Mild hypokalemia', action: 'Oral KCl 40-80 mEq; recheck in 4-6h' },
    { range: '2.5-2.9', label: 'Moderate hypokalemia', action: 'IV KCl 40-80 mEq + oral; continuous ECG if symptomatic' },
    { range: '<2.5', label: 'Severe hypokalemia', action: 'IV KCl with cardiac monitoring; check Mg²⁺; recheck K every 2h' },
  ],
  fields: [
    { key: 'current_k', label: 'Current Serum Potassium', type: 'number', min: 1, max: 6, step: 0.1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'target_k', label: 'Target Potassium', type: 'number', min: 3, max: 5, step: 0.1, placeholder: 'mEq/L', hint: 'mEq/L (typically 4.0)' },
    {
      key: 'route', label: 'Route of Administration', type: 'select',
      options: [
        { value: 'oral', label: 'Oral (preferred if tolerated)' },
        { value: 'iv_peripheral', label: 'IV — Peripheral line' },
        { value: 'iv_central', label: 'IV — Central line' },
      ],
    },
  ],
  calculate: (vals) => {
    const curK = parseFloat(vals.current_k)
    const targetK = parseFloat(vals.target_k)
    const route = vals.route
    if (!curK || !targetK || !route || curK >= targetK) return null
    const deficit = (targetK - curK) / 0.3 * 100
    const practicalDose = Math.min(Math.round(deficit / 20) * 20, 200)
    let maxRate = ''
    let preparation = ''
    if (route === 'oral') {
      maxRate = 'Give in divided doses (20-40 mEq per dose, 2-4× daily)'
      preparation = `KCl oral: ${practicalDose} mEq total (e.g., ${Math.ceil(practicalDose / 20)} × 20 mEq tabs)`
    } else if (route === 'iv_peripheral') {
      maxRate = 'Max 10-20 mEq/hr, max concentration 40 mEq/L'
      preparation = `KCl IV: ${practicalDose} mEq in NS (max 40 mEq/L). Rate: 10-20 mEq/hr.`
    } else {
      maxRate = 'Max 40 mEq/hr with continuous cardiac monitoring, max concentration 60 mEq/L'
      preparation = `KCl IV central: ${practicalDose} mEq. Rate: up to 40 mEq/hr with cardiac monitoring.`
    }
    return {
      result: String(practicalDose),
      unit: 'mEq KCl (estimated)',
      interpretation: preparation,
      detail: maxRate,
      breakdown: [
        { label: 'Estimated total body deficit', value: `~${Math.round(deficit)} mEq` },
        { label: 'Practical replacement dose', value: `${practicalDose} mEq` },
        { label: 'Current K⁺', value: `${curK} mEq/L` },
        { label: 'Target K⁺', value: `${targetK} mEq/L` },
        { label: 'Recheck K⁺', value: 'After each 40-60 mEq given' },
      ],
    }
  },
}
