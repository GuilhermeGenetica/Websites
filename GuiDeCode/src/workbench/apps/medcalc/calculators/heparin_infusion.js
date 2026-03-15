export default {
  id: 'heparin_infusion',
  name: 'Heparin Infusion Calculator',
  shortDescription: 'Weight-based heparin bolus and drip rate calculator for VTE and ACS.',
  system: 'pharmacology',
  specialty: ['Cardiology', 'Hematology', 'Emergency Medicine', 'Critical Care', 'Internal Medicine'],
  tags: ['heparin', 'anticoagulation', 'VTE', 'DVT', 'PE', 'ACS', 'UFH', 'infusion', 'bolus'],
  version: '1.0.0',
  updatedAt: '2025-01-01',
  creatorName: 'Raschke RA et al.',
  creatorYear: '1993',
  description: 'Weight-based unfractionated heparin (UFH) dosing calculator for VTE treatment and ACS. Based on the Raschke nomogram. Calculates initial bolus dose, starting infusion rate, and aPTT-based adjustment guidance.',
  whyUse: 'Weight-based heparin dosing achieves therapeutic aPTT faster and more reliably than fixed-dose protocols, reducing recurrent VTE and bleeding complications.',
  whenToUse: [
    'Treatment of DVT or PE',
    'ACS (NSTEMI/UA) with planned catheterization',
    'Bridge anticoagulation',
    'Prophylaxis in high-risk surgical patients (adjusted dosing)',
  ],
  nextSteps: 'Check aPTT 6 hours after initiation. Adjust infusion per institutional nomogram. Target aPTT typically 60-100 seconds (corresponds to anti-Xa 0.3-0.7 U/mL). Recheck aPTT 6h after each change.',
  pearls: [
    'Use actual body weight (ABW) for dosing; cap at 10,000 U bolus for obese patients.',
    'Standard bag: 25,000 U in 250 mL NS = 100 U/mL.',
    'aPTT subtherapeutic (<60s): rebols 40 U/kg + increase rate by 2 U/kg/h.',
    'aPTT supratherapeutic (>100s): hold 1h + decrease rate by 3 U/kg/h.',
    'Monitor platelets every 2-3 days (HIT screening).',
    'Hold 4-6h before procedures; restart without bolus.',
  ],
  evidence: 'Raschke RA et al. JAMA 1993. Weight-based heparin protocol vs. standard-dose: therapeutic aPTT achieved faster (mean 17h vs. 27h, p<0.001).',
  formula: `VTE treatment:
Bolus: 80 U/kg IV (max 10,000 U)
Initial rate: 18 U/kg/hr
Rate in mL/hr (if 100 U/mL standard bag) = (U/kg/hr × weight) / 100

ACS (NSTEMI):
Bolus: 60 U/kg IV (max 4,000 U)
Initial rate: 12 U/kg/hr (max 1,000 U/hr)`,
  references: [
    { text: 'Raschke RA et al. The weight-based heparin dosing nomogram compared with a "standard care" nomogram. JAMA. 1993;270(19):2317-2321.', url: 'https://pubmed.ncbi.nlm.nih.gov/8230592/' },
    { text: 'Kearon C et al. Antithrombotic Therapy for VTE Disease. CHEST. 2016;149(2):315-352.', url: 'https://pubmed.ncbi.nlm.nih.gov/26867832/' },
  ],
  links: [
    { title: 'MDCalc — Heparin Dosing', url: 'https://www.mdcalc.com/calc/1350/heparin-infusion-rate-weight-based-dosing-dvt-pe', description: 'Interactive heparin calculator' },
  ],
  interpretations: [],
  fields: [
    { key: 'weight', label: 'Actual Body Weight', type: 'number', unit: 'kg', min: 1, max: 300, placeholder: 'e.g. 80' },
    {
      key: 'indication', label: 'Indication', type: 'select',
      options: [
        { value: 'vte', label: 'VTE (DVT/PE) treatment' },
        { value: 'acs', label: 'ACS (NSTEMI/UA)' },
      ],
    },
    { key: 'concentration', label: 'Heparin bag concentration', type: 'select', options: [{ value: 100, label: '25,000 U in 250 mL = 100 U/mL (standard)' }, { value: 50, label: '25,000 U in 500 mL = 50 U/mL' }, { value: 200, label: '50,000 U in 250 mL = 200 U/mL' }] },
  ],
  calculate(fields) {
    const wt = parseFloat(fields.weight)
    const ind = fields.indication
    const conc = parseFloat(fields.concentration)
    let bolus_raw, rate_u_hr, max_bolus, max_rate
    if (ind === 'vte') {
      bolus_raw = 80 * wt; max_bolus = 10000
      rate_u_hr = 18 * wt; max_rate = null
    } else {
      bolus_raw = 60 * wt; max_bolus = 4000
      rate_u_hr = 12 * wt; max_rate = 1000
    }
    const bolus = Math.min(bolus_raw, max_bolus)
    const rate_capped = max_rate ? Math.min(rate_u_hr, max_rate) : rate_u_hr
    const ml_hr = (rate_capped / conc).toFixed(1)
    const breakdown = [
      { label: 'Weight', value: wt + ' kg' },
      { label: 'Indication', value: ind === 'vte' ? 'VTE treatment' : 'ACS (NSTEMI)' },
      { label: 'Bolus dose (raw)', value: bolus_raw.toFixed(0) + ' U' + (bolus_raw > max_bolus ? ` → capped at ${max_bolus} U` : '') },
      { label: 'Initial rate', value: rate_capped.toFixed(0) + ' U/hr' + (max_rate && rate_u_hr > max_rate ? ` (capped at ${max_rate} U/hr)` : '') },
      { label: 'Bag concentration', value: conc + ' U/mL' },
      { label: 'Pump rate', value: ml_hr + ' mL/hr' },
    ]
    return {
      result: `${bolus.toFixed(0)} U bolus → ${ml_hr} mL/hr`,
      unit: `(${rate_capped.toFixed(0)} U/hr)`,
      interpretation: `Bolus ${bolus.toFixed(0)} U IV over 5-10 min, then ${ml_hr} mL/hr (${rate_capped.toFixed(0)} U/hr). Check aPTT in 6 hours. Target aPTT 60-100 sec.`,
      breakdown,
    }
  },
}
