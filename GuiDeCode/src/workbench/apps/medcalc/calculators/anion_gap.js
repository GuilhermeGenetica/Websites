export default {
  id: 'anion_gap',
  name: 'Anion Gap',
  shortDescription: 'Serum anion gap calculation for metabolic acidosis differential',
  system: 'nephrology',
  specialty: ['Internal Medicine', 'Emergency Medicine', 'Nephrology', 'Critical Care'],
  tags: ['anion gap', 'metabolic acidosis', 'electrolytes', 'MUDPILES', 'acid-base'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Emmett M, Narins RG',
  creatorYear: '1977',
  description: 'The serum anion gap (AG) helps differentiate causes of metabolic acidosis. An elevated AG (> 12) suggests accumulation of unmeasured anions (lactic acid, ketoacids, uremic toxins, toxic alcohols). Normal AG acidosis (hyperchloremic) suggests bicarbonate loss (diarrhea, RTA). Albumin-corrected AG improves accuracy in hypoalbuminemic patients.',
  whyUse: 'Essential for metabolic acidosis differential diagnosis. Guides workup: elevated AG prompts evaluation for lactate, ketones, toxins, renal failure. Albumin correction prevents false normals in ICU patients.',
  whenToUse: [
    'Metabolic acidosis (low bicarbonate) on arterial blood gas or BMP',
    'Suspected poisoning or toxic ingestion',
    'DKA or lactic acidosis evaluation',
    'Acid-base disturbance workup',
  ],
  nextSteps: 'Elevated AG: Check lactate, ketones, BUN/Cr, osmolar gap (if toxic alcohol suspected). Normal AG: Check urine anion gap, consider RTA or GI bicarbonate loss. Calculate delta-delta ratio to check for mixed disorders.',
  pearls: [
    'Normal AG is ~12 ± 4 (or 8-12 without potassium in formula).',
    'MUDPILES mnemonic for elevated AG: Methanol, Uremia, DKA, Propylene glycol, INH/Iron, Lactic acidosis, Ethylene glycol, Salicylates.',
    'Correct AG for albumin: for every 1 g/dL decrease in albumin below 4.0, AG decreases by ~2.5.',
    'Normal AG acidosis (HARDUPS): Hyperalimentation, Addison, RTA, Diarrhea, Uretero-pelvic, Pancreatic fistula, Saline infusion.',
    'Delta-delta ratio = (AG - 12) / (24 - HCO3): < 1 = mixed NAGMA; 1-2 = pure AGMA; > 2 = concurrent metabolic alkalosis.',
  ],
  evidence: 'Classic clinical tool described by Emmett and Narins (Medicine, 1977). Albumin-corrected AG described by Figge et al. (Crit Care Med, 1998). Universally used in acid-base physiology and critical care.',
  formula: 'AG = Na - (Cl + HCO₃)\nAlbumin-corrected AG = AG + 2.5 × (4.0 - Albumin)\nNormal AG: 8-12 mEq/L',
  references: [
    { text: 'Emmett M, Narins RG. Clinical use of the anion gap. Medicine (Baltimore). 1977;56(1):38-54.', url: 'https://pubmed.ncbi.nlm.nih.gov/401925/' },
    { text: 'Figge J et al. Anion gap and hypoalbuminemia. Crit Care Med. 1998;26(11):1807-1810.', url: 'https://pubmed.ncbi.nlm.nih.gov/9824071/' },
  ],
  links: [
    { title: 'MDCalc — Anion Gap', url: 'https://www.mdcalc.com/calc/1669/anion-gap', description: 'Interactive anion gap calculator' },
  ],
  interpretations: [
    { range: '<3', label: 'Very low — consider lab error or abnormal proteins', action: 'Verify electrolytes; consider multiple myeloma (cationic paraprotein)' },
    { range: '3-11', label: 'Normal anion gap', action: 'If acidosis present: non-AG metabolic acidosis (hyperchloremic). Check urine AG, consider RTA or GI losses.' },
    { range: '12-20', label: 'Elevated anion gap', action: 'Anion gap metabolic acidosis: check lactate, ketones, BUN/Cr, osmolar gap' },
    { range: '>20', label: 'Severely elevated', action: 'Significant unmeasured anion accumulation. Urgent workup: lactate, ketoacids, toxic alcohols, salicylates.' },
  ],
  fields: [
    { key: 'sodium', label: 'Sodium (Na⁺)', type: 'number', min: 100, max: 180, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'chloride', label: 'Chloride (Cl⁻)', type: 'number', min: 60, max: 140, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'bicarb', label: 'Bicarbonate (HCO₃⁻)', type: 'number', min: 1, max: 50, step: 1, placeholder: 'mEq/L', hint: 'mEq/L' },
    { key: 'albumin', label: 'Albumin (optional, for correction)', type: 'number', min: 0.5, max: 6, step: 0.1, placeholder: 'g/dL', hint: 'g/dL — leave blank to skip correction', required: false },
  ],
  calculate: (vals) => {
    const na = parseFloat(vals.sodium)
    const cl = parseFloat(vals.chloride)
    const hco3 = parseFloat(vals.bicarb)
    if (!na || !cl || !hco3) return null
    const ag = na - (cl + hco3)
    const alb = parseFloat(vals.albumin)
    let correctedAG = null
    let detail = `Na: ${na}, Cl: ${cl}, HCO₃: ${hco3}`
    if (alb && alb > 0) {
      correctedAG = ag + 2.5 * (4.0 - alb)
      detail += `, Albumin: ${alb} g/dL`
    }
    const displayAG = correctedAG !== null ? correctedAG : ag
    let interp = ''
    if (displayAG < 3) interp = 'Very low AG — consider lab error or abnormal proteins'
    else if (displayAG <= 11) interp = 'Normal anion gap'
    else if (displayAG <= 20) interp = 'Elevated anion gap — AGMA workup indicated'
    else interp = 'Severely elevated AG — urgent evaluation for lactate, ketoacids, toxins'
    const breakdown = [{ label: 'Anion Gap', value: `${ag.toFixed(1)} mEq/L` }]
    if (correctedAG !== null) {
      breakdown.push({ label: 'Albumin-Corrected AG', value: `${correctedAG.toFixed(1)} mEq/L` })
    }
    return {
      result: displayAG.toFixed(1),
      unit: 'mEq/L',
      interpretation: interp,
      detail: detail,
      breakdown: breakdown,
    }
  },
}
