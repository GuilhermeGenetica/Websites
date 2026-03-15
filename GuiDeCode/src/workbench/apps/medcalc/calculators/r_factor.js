export default {
  id: 'r_factor',
  name: 'R-Factor (Hepatotoxicity Pattern)',
  shortDescription: 'Classifies drug-induced liver injury pattern as hepatocellular, cholestatic, or mixed',
  system: 'gastro_hepatology',
  specialty: ['Hepatology', 'Gastroenterology', 'Internal Medicine', 'Pharmacology'],
  tags: ['R-factor', 'DILI', 'hepatotoxicity', 'ALT', 'ALP', 'liver injury'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'CIOMS/RUCAM Council',
  creatorYear: '1989',
  description: 'The R-factor (R-value) classifies the pattern of drug-induced liver injury (DILI) as hepatocellular, cholestatic, or mixed based on the ratio of ALT to ALP elevations (each expressed as multiples of their upper limit of normal). This classification is important for determining causality, prognosis, and management.',
  whyUse: 'Classifies DILI pattern to guide workup and management. Hepatocellular DILI has higher risk of acute liver failure (Hy Law). Part of RUCAM/CIOMS causality assessment. Helps determine which drugs are likely causative.',
  whenToUse: [
    'Suspected drug-induced liver injury',
    'New liver enzyme elevation on medication',
    'RUCAM causality assessment for DILI',
  ],
  nextSteps: "R > 5 (hepatocellular): Higher risk of ALF — check INR, bilirubin (Hy's Law). R 2-5 (mixed): Intermediate pattern. R < 2 (cholestatic): Usually better prognosis; evaluate for biliary obstruction.",
  pearls: [
    "R > 5 = hepatocellular pattern. R 2-5 = mixed. R < 2 = cholestatic pattern.",
    "Hy's Law: hepatocellular DILI with bilirubin > 2× ULN (without obstruction) → ~10% risk of fatal ALF.",
    'Use the FIRST set of abnormal labs (at onset of injury) for R-factor calculation.',
    'Both ALT and ALP must be expressed as multiples of ULN (not raw values).',
    'Common hepatocellular DILI drugs: acetaminophen, isoniazid, statins, NSAIDs.',
    'Common cholestatic DILI drugs: amoxicillin-clavulanate, anabolic steroids, estrogens.',
  ],
  evidence: 'Defined by the Council for International Organizations of Medical Sciences (CIOMS) in 1989. Integral to the RUCAM/CIOMS scale for DILI causality assessment. Widely used in hepatology and pharmacovigilance.',
  formula: 'R = (ALT / ALT ULN) / (ALP / ALP ULN)\nR > 5: Hepatocellular\nR 2-5: Mixed\nR < 2: Cholestatic',
  references: [
    { text: 'Danan G, Benichou C. Causality assessment of adverse reactions to drugs: a novel method based on the conclusions of international consensus meetings. J Clin Epidemiol. 1993;46(11):1323-1330.', url: 'https://pubmed.ncbi.nlm.nih.gov/8229110/' },
  ],
  links: [
    { title: 'MDCalc — R-Factor', url: 'https://www.mdcalc.com/calc/10092', description: 'Interactive R-Factor calculator' },
  ],
  interpretations: [
    { range: '>5', label: 'Hepatocellular pattern', action: "Higher risk of ALF; check INR and bilirubin (Hy's Law); consider drug discontinuation" },
    { range: '2-5', label: 'Mixed pattern', action: 'Features of both; evaluate thoroughly; monitor closely' },
    { range: '<2', label: 'Cholestatic pattern', action: 'Generally better prognosis; rule out biliary obstruction with imaging' },
  ],
  fields: [
    { key: 'alt', label: 'ALT (patient value)', type: 'number', min: 1, max: 20000, step: 1, placeholder: 'U/L', hint: 'U/L' },
    { key: 'alt_uln', label: 'ALT Upper Limit of Normal', type: 'number', min: 10, max: 100, step: 1, placeholder: 'U/L', hint: 'U/L (typically 35-40)' },
    { key: 'alp', label: 'ALP (patient value)', type: 'number', min: 1, max: 5000, step: 1, placeholder: 'U/L', hint: 'U/L' },
    { key: 'alp_uln', label: 'ALP Upper Limit of Normal', type: 'number', min: 30, max: 200, step: 1, placeholder: 'U/L', hint: 'U/L (typically 120-150)' },
  ],
  calculate: (vals) => {
    const alt = parseFloat(vals.alt)
    const altULN = parseFloat(vals.alt_uln)
    const alp = parseFloat(vals.alp)
    const alpULN = parseFloat(vals.alp_uln)
    if (!alt || !altULN || !alp || !alpULN) return null
    const altRatio = alt / altULN
    const alpRatio = alp / alpULN
    if (alpRatio <= 0) return null
    const rFactor = altRatio / alpRatio
    let pattern = ''
    if (rFactor > 5) pattern = 'Hepatocellular pattern — higher ALF risk'
    else if (rFactor >= 2) pattern = 'Mixed pattern'
    else pattern = 'Cholestatic pattern'
    return {
      result: rFactor.toFixed(1),
      unit: 'R-factor',
      interpretation: pattern,
      breakdown: [
        { label: 'ALT × ULN', value: `${altRatio.toFixed(1)}× ULN` },
        { label: 'ALP × ULN', value: `${alpRatio.toFixed(1)}× ULN` },
        { label: 'R-Factor', value: rFactor.toFixed(1) },
      ],
    }
  },
}
