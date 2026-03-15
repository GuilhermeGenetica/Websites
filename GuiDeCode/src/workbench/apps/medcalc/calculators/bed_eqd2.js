export default {
  id: 'bed_eqd2',
  name: 'BED / EQD2 Calculator',
  shortDescription: 'Biologically Effective Dose and Equivalent Dose in 2 Gy fractions for radiotherapy.',
  system: 'radiology',
  specialty: ['Radiation Oncology', 'Oncology', 'Radiology'],
  tags: ['BED', 'EQD2', 'radiotherapy', 'radiation', 'fractionation', 'linear quadratic', 'alpha beta'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Fowler JF',
  creatorYear: '1989',
  description: 'Calculates the Biologically Effective Dose (BED) and Equivalent Dose in 2 Gy fractions (EQD2) using the Linear-Quadratic (LQ) model. Allows comparison of different radiotherapy fractionation schedules.',
  whyUse: 'Enables meaningful comparison of hypofractionated, hyperfractionated, and standard regimens. Essential for SBRT/SABR dose prescription and reporting.',
  whenToUse: [
    'Comparing different radiotherapy fractionation schedules',
    'Converting SBRT/SABR doses to EQD2 for toxicity modeling',
    'Designing altered fractionation regimens',
    'Literature comparison and trial interpretation',
  ],
  nextSteps: 'Use EQD2 for comparing schedules in terms of tumor control and normal tissue toxicity. Standard α/β = 10 Gy for tumors (fast-proliferating); α/β = 3 Gy for late-responding tissues (spinal cord, rectum).',
  pearls: [
    'α/β = 10 Gy: most tumors, acute-responding tissues (mucosa).',
    'α/β = 3 Gy: late-responding tissues (spinal cord, brain, rectum, bladder).',
    'α/β = 1.5 Gy: prostate cancer (evidence of low α/β).',
    'BED and EQD2 assume LQ model — may overestimate efficacy at very high doses/fraction (>8-10 Gy).',
    'EQD2 = BED / (1 + 2/[α/β])',
  ],
  evidence: 'Fowler JF. The linear-quadratic formula and progress in fractionated radiotherapy. Br J Radiol. 1989;62:679-694.',
  formula: `BED = D × (1 + d / (α/β))
EQD2 = D × (d + α/β) / (2 + α/β)
D = total dose (Gy), d = dose per fraction (Gy), n = number of fractions`,
  references: [
    { text: 'Fowler JF. The linear-quadratic formula and progress in fractionated radiotherapy. Br J Radiol. 1989;62(740):679-694.', url: 'https://pubmed.ncbi.nlm.nih.gov/2670032/' },
    { text: 'Joiner M, van der Kogel A. Basic Clinical Radiobiology. 4th ed. 2009.', url: 'https://www.crcpress.com/' },
  ],
  links: [
    { title: 'MDCalc — BED Calculator', url: 'https://www.mdcalc.com/calc/10177/biologically-effective-dose-bed-calculator', description: 'Interactive BED calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'total_dose', label: 'Total Dose (D)', type: 'number', unit: 'Gy', min: 0.1, max: 200, step: 0.1, placeholder: 'e.g. 45' },
    { key: 'fractions', label: 'Number of Fractions (n)', type: 'number', unit: 'fractions', min: 1, max: 100, step: 1, placeholder: 'e.g. 25' },
    { key: 'alpha_beta', label: 'α/β Ratio', type: 'select', options: [{ value: 10, label: '10 Gy — Tumor / acute tissue' }, { value: 3, label: '3 Gy — Late-responding tissue' }, { value: 1.5, label: '1.5 Gy — Prostate cancer' }, { value: 2, label: '2 Gy — Custom (some late tissues)' }] },
    { key: 'custom_ab', label: 'Custom α/β (overrides dropdown if filled)', type: 'number', unit: 'Gy', min: 0.5, max: 30, step: 0.5, placeholder: 'Leave blank to use selection above' },
  ],
  calculate(fields) {
    const D = parseFloat(fields.total_dose)
    const n = parseFloat(fields.fractions)
    const ab = fields.custom_ab ? parseFloat(fields.custom_ab) : parseFloat(fields.alpha_beta)
    const d = D / n
    const bed = D * (1 + d / ab)
    const eqd2 = D * (d + ab) / (2 + ab)
    const breakdown = [
      { label: 'Total dose (D)', value: D.toFixed(1) + ' Gy' },
      { label: 'Fractions (n)', value: n + ' fx' },
      { label: 'Dose per fraction (d)', value: d.toFixed(2) + ' Gy/fx' },
      { label: 'α/β used', value: ab + ' Gy' },
      { label: 'BED', value: bed.toFixed(2) + ' Gy' },
      { label: 'EQD2', value: eqd2.toFixed(2) + ' Gy' },
    ]
    let note = ''
    if (d > 8) note = ' ⚠ High dose per fraction (>8 Gy): LQ model may underestimate toxicity — apply caution.'
    return {
      result: eqd2.toFixed(2),
      unit: `Gy (EQD2) | BED = ${bed.toFixed(2)} Gy`,
      interpretation: `${n} fx × ${d.toFixed(2)} Gy/fx → BED ${bed.toFixed(2)} Gy, EQD2 ${eqd2.toFixed(2)} Gy (α/β=${ab}).${note}`,
      breakdown,
    }
  },
}
