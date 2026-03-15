export default {
  id: 'parkland',
  name: 'Parkland Formula (Burns)',
  shortDescription: 'Fluid resuscitation calculation for burn patients',
  system: 'surgery_trauma',
  specialty: ['Emergency Medicine', 'Surgery', 'Burn Surgery', 'Critical Care'],
  tags: ['burns', 'Parkland', 'fluid resuscitation', 'TBSA', 'trauma'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Baxter CR, Shires T',
  creatorYear: '1968',
  description: 'The Parkland formula (also Baxter formula) calculates the estimated crystalloid fluid requirement for the first 24 hours of resuscitation in major burn patients. It uses body weight and total body surface area (TBSA) burned. Half of the total is given in the first 8 hours from time of burn, and the remaining half over the next 16 hours.',
  whyUse: 'Standard initial estimate for burn fluid resuscitation. Prevents under-resuscitation (renal failure, shock) and over-resuscitation (compartment syndrome, pulmonary edema). Starting point — titrate to urine output.',
  whenToUse: [
    'Burns > 20% TBSA in adults, > 10% in children',
    'Initial fluid resuscitation planning for burn patients',
    'Burn center transfer preparation',
  ],
  nextSteps: 'Start Lactated Ringer at calculated rate. Titrate to urine output: 0.5-1.0 mL/kg/hr (adults), 1.0-1.5 mL/kg/hr (children). Monitor for compartment syndrome, abdominal compartment syndrome, and pulmonary edema.',
  pearls: [
    'The formula provides an ESTIMATE — always titrate to clinical endpoints (urine output, vitals, lactate).',
    'Half the total volume in the first 8 hours from TIME OF BURN, not time of presentation.',
    'Use Lactated Ringer (LR) — avoid normal saline (hyperchloremic acidosis risk).',
    'TBSA estimation: Rule of 9s (adults), Lund-Browder chart (children) — only count 2nd and 3rd degree burns.',
    'Patients with inhalation injury, delayed resuscitation, or electrical burns often require more than Parkland estimate.',
    '"Fluid creep" — over-resuscitation is increasingly recognized; stay goal-directed.',
  ],
  evidence: 'Developed at Parkland Memorial Hospital (Baxter & Shires, 1968). ABA (American Burn Association) guidelines recommend 2-4 mL/kg/%TBSA as initial estimate. Modified Brooke formula uses 2 mL/kg/%TBSA as an alternative starting point.',
  formula: 'Total fluid (mL) = 4 × Weight (kg) × %TBSA burned\nFirst 8 hours: 50% of total\nNext 16 hours: remaining 50%\nFluid: Lactated Ringer',
  references: [
    { text: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci. 1968;150(3):874-894.', url: 'https://pubmed.ncbi.nlm.nih.gov/4973463/' },
    { text: 'Saffle JI. The phenomenon of "fluid creep" in acute burn resuscitation. J Burn Care Res. 2007;28(3):382-395.', url: 'https://pubmed.ncbi.nlm.nih.gov/17438489/' },
  ],
  links: [
    { title: 'MDCalc — Parkland Formula', url: 'https://www.mdcalc.com/calc/83/parkland-formula-burns', description: 'Interactive Parkland formula calculator' },
  ],
  interpretations: [
    { range: '<5000', label: 'Moderate fluid requirement', action: 'Standard resuscitation; monitor urine output closely' },
    { range: '5000-10000', label: 'Significant fluid requirement', action: 'Large-bore IV access; Foley catheter; consider central line' },
    { range: '>10000', label: 'Massive resuscitation', action: 'Burn center transfer; monitor for compartment syndrome and fluid overload' },
  ],
  fields: [
    { key: 'weight', label: 'Body Weight', type: 'number', min: 1, max: 300, step: 0.1, placeholder: 'kg', hint: 'kg' },
    { key: 'tbsa', label: 'Total Body Surface Area Burned', type: 'number', min: 1, max: 100, step: 1, placeholder: '%', hint: '% TBSA (2nd + 3rd degree only)' },
  ],
  calculate: (vals) => {
    const wt = parseFloat(vals.weight)
    const tbsa = parseFloat(vals.tbsa)
    if (!wt || !tbsa || wt <= 0 || tbsa <= 0) return null
    const totalFluid = 4 * wt * tbsa
    const first8hr = totalFluid / 2
    const next16hr = totalFluid / 2
    const rateFirst8 = first8hr / 8
    const rateNext16 = next16hr / 16
    return {
      result: Math.round(totalFluid).toLocaleString(),
      unit: 'mL / 24 hours (LR)',
      interpretation: `First 8h: ${Math.round(first8hr).toLocaleString()} mL (${Math.round(rateFirst8)} mL/hr), Next 16h: ${Math.round(next16hr).toLocaleString()} mL (${Math.round(rateNext16)} mL/hr)`,
      detail: `Weight: ${wt} kg, %TBSA: ${tbsa}%`,
      breakdown: [
        { label: 'Total 24h fluid', value: `${Math.round(totalFluid).toLocaleString()} mL` },
        { label: 'First 8 hours', value: `${Math.round(first8hr).toLocaleString()} mL (${Math.round(rateFirst8)} mL/hr)` },
        { label: 'Next 16 hours', value: `${Math.round(next16hr).toLocaleString()} mL (${Math.round(rateNext16)} mL/hr)` },
      ],
    }
  },
}
