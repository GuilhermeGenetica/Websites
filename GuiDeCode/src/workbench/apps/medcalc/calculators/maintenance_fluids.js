export default {
  id: 'maintenance_fluids',
  name: 'Maintenance IV Fluids (4-2-1 Rule)',
  shortDescription: 'Holliday-Segar method for calculating maintenance fluid requirements',
  system: 'pediatrics',
  specialty: ['Pediatrics', 'Surgery', 'Anesthesia', 'Internal Medicine', 'Emergency Medicine'],
  tags: ['fluids', 'IV', 'maintenance', '4-2-1', 'Holliday-Segar', 'pediatrics', 'hydration'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Holliday MA, Segar WE',
  creatorYear: '1957',
  description: 'The Holliday-Segar method (4-2-1 rule) calculates maintenance fluid requirements based on body weight. It is the standard method for determining baseline IV fluid rates in both pediatric and adult patients. The rule provides hourly and daily rates that approximate insensible losses and basal metabolic water requirements.',
  whyUse: 'Universal standard for maintenance fluid calculation. Essential for pediatric fluid management. Used perioperatively, in NPO patients, and as a starting point for IV fluid orders.',
  whenToUse: [
    'Any patient requiring maintenance IV fluids',
    'Perioperative fluid management',
    'NPO patients needing basal hydration',
    'Pediatric fluid calculations',
  ],
  nextSteps: 'Maintenance rate is a STARTING point. Adjust for: fever (+10% per °C above 37°C), ongoing losses (drains, NG, diarrhea), third-spacing, renal function. Choose appropriate fluid (D5 0.45% NS for adults, D5 0.2% NS for young children — follow institutional protocols).',
  pearls: [
    '4 mL/kg/h for first 10 kg, 2 mL/kg/h for next 10 kg, 1 mL/kg/h for each kg above 20.',
    'Daily equivalent: 100 mL/kg for first 10 kg, 50 mL/kg for next 10 kg, 20 mL/kg per kg above 20.',
    'Maximum practical maintenance rate is typically ~125 mL/h for adults (rarely exceed this).',
    'This formula does NOT account for ongoing losses, fever, or pathological states.',
    'In pediatrics, electrolyte composition of maintenance fluids is critical — isotonic fluids (NS or balanced) preferred to reduce hyponatremia risk.',
    'The rule slightly overestimates needs in obese patients — consider ideal body weight.',
  ],
  evidence: 'Holliday and Segar (Pediatrics, 1957). Based on metabolic rate and water requirements. Universally adopted worldwide. Recent NICE and AAP guidelines recommend isotonic maintenance fluids in children to prevent hospital-acquired hyponatremia.',
  formula: '4-2-1 Rule (hourly):\nFirst 10 kg: 4 mL/kg/hr\n10-20 kg: 2 mL/kg/hr\n> 20 kg: 1 mL/kg/hr\n\nDaily equivalent:\nFirst 10 kg: 100 mL/kg/day\n10-20 kg: 50 mL/kg/day\n> 20 kg: 20 mL/kg/day',
  references: [
    { text: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823-832.', url: 'https://pubmed.ncbi.nlm.nih.gov/13431307/' },
  ],
  links: [
    { title: 'MDCalc — Maintenance Fluids', url: 'https://www.mdcalc.com/calc/86/maintenance-fluids-calculations', description: 'Interactive maintenance fluids calculator' },
  ],
  interpretations: [
    { range: '<50', label: 'Small patient (infant/toddler)', action: 'Use precise fluid management; buretrol/syringe pump recommended' },
    { range: '50-100', label: 'Pediatric/small adult range', action: 'Standard maintenance; monitor I/Os' },
    { range: '>100', label: 'Adult range', action: 'Standard maintenance; consider capping at ~125 mL/hr for large patients' },
  ],
  fields: [
    { key: 'weight', label: 'Body Weight', type: 'number', min: 0.5, max: 300, step: 0.1, placeholder: 'kg', hint: 'kg' },
  ],
  calculate: (vals) => {
    const wt = parseFloat(vals.weight)
    if (!wt || wt <= 0) return null
    let hourly = 0
    let daily = 0
    if (wt <= 10) {
      hourly = 4 * wt
      daily = 100 * wt
    } else if (wt <= 20) {
      hourly = 40 + 2 * (wt - 10)
      daily = 1000 + 50 * (wt - 10)
    } else {
      hourly = 60 + 1 * (wt - 20)
      daily = 1500 + 20 * (wt - 20)
    }
    return {
      result: Math.round(hourly).toString(),
      unit: 'mL/hr',
      interpretation: `Maintenance rate: ${Math.round(hourly)} mL/hr (${Math.round(daily)} mL/day)`,
      detail: `Weight: ${wt} kg`,
      breakdown: [
        { label: 'Hourly rate', value: `${Math.round(hourly)} mL/hr` },
        { label: 'Daily volume', value: `${Math.round(daily)} mL/day` },
        { label: 'Per kg/day', value: `${(daily / wt).toFixed(1)} mL/kg/day` },
      ],
    }
  },
}
