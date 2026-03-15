export default {
  id: 'hardy_weinberg',
  name: 'Hardy-Weinberg Carrier Risk',
  shortDescription: 'Calculates carrier frequency and reproductive risk for autosomal recessive diseases',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Obstetrics', 'Pediatrics'],
  tags: ['carrier', 'recessive', 'Hardy-Weinberg', 'allele', 'reproductive risk', 'population genetics'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Hardy GH / Weinberg W',
  creatorYear: '1908',
  description: 'The Hardy-Weinberg principle establishes that in a large, randomly mating population free from selection, mutation, and migration, allele and genotype frequencies remain constant across generations. In clinical genetics, this equilibrium is used to derive carrier frequencies (2pq) when only the disease incidence (q²) is known — enabling risk counseling without requiring population genotyping studies.',
  whyUse: 'Essential for reproductive risk counseling when one partner is a known carrier or affected individual and the other partner has unknown carrier status. Provides the mathematical backbone for most autosomal recessive risk calculations in clinical genetics.',
  whenToUse: [
    'Preconception counseling for autosomal recessive conditions (CF, SMA, thalassemia, PKU, etc.)',
    'Calculating the general population carrier risk for the partner of a known carrier',
    'Estimating reproductive risk when consanguinity is NOT a factor',
    'Establishing prior probabilities before residual risk calculations',
  ],
  nextSteps: 'Combine with partner\'s carrier status to calculate final reproductive risk. If the partner was screened and tested negative, use the Residual Carrier Risk calculator to apply Bayesian correction. For consanguineous couples, use the Coefficient of Consanguinity (F) calculator alongside this result.',
  pearls: [
    'For rare diseases (q << 1), p ≈ 1, so carrier frequency (2pq) ≈ 2q — a useful mental shortcut.',
    'Example: CF incidence 1 in 3,500 Caucasians → q = 1/59.16, carrier freq ≈ 1 in 30.',
    'HWE assumes random mating: it is NOT valid for consanguineous couples.',
    'X-linked traits require a different formula: in males, disease incidence = q (not q²).',
    'Autosomal dominant: HWE calculates genotype frequencies, but clinical risk is simpler (50% from affected parent).',
    'This model gives POPULATION estimates; individual couples may have higher risk based on ancestry, ethnicity, or prior affected children.',
  ],
  evidence: 'A foundational principle of population genetics independently derived by G.H. Hardy (Cambridge) and Wilhelm Weinberg (Stuttgart) in 1908. Universally applied in carrier screening, prenatal counseling, and risk assessment across all recessive Mendelian diseases. Validated empirically in hundreds of population studies worldwide.',
  formula: 'p + q = 1\np² + 2pq + q² = 1\n\nq² = Disease incidence (homozygous frequency)\nq  = Mutant allele frequency = √(q²)\np  = Wild-type allele frequency = 1 − q\n2pq = Carrier frequency (heterozygous)\n\nReproductive risk:\n  Both parents unknown: (2pq)² × ¼\n  One known carrier: 1 × (2pq) × ¼\n  One affected:       1 × (2pq) × ½',
  references: [
    { text: 'Hardy GH. Mendelian Proportions in a Mixed Population. Science. 1908;28(706):49-50.', url: 'https://pubmed.ncbi.nlm.nih.gov/17779291/' },
    { text: 'Weinberg W. Über den Nachweis der Vererbung beim Menschen. Jahresh Verein f vaterl Naturk Württemb. 1908;64:368-382.' },
    { text: 'Teare MD, Barrett JH. Genetic Linkage Studies. Lancet. 2005;366(9490):1036-1044.', url: 'https://pubmed.ncbi.nlm.nih.gov/16168786/' },
  ],
  links: [
    { title: 'ACMG — Carrier Screening Guidelines', url: 'https://www.acmg.net/PDFLibrary/Carrier-Screening-in-Couples-Planning-a-Pregnancy.pdf', description: 'ACMG recommendations on population carrier screening' },
    { title: 'OMIM — Online Mendelian Inheritance in Man', url: 'https://omim.org/', description: 'Disease incidence data for HWE calculations' },
  ],
  interpretations: [
    { range: '0-1', label: 'General Population Risk', action: 'Applies to unscreened couples from the general population.' },
  ],
  fields: [
    {
      key: 'incidence_denominator',
      label: 'Disease Incidence in Population (1 in X)',
      type: 'number', min: 1, max: 10000000, step: 1, placeholder: 'e.g., 3500',
      hint: 'Enter denominator only. Example: for CF in Caucasians (1 in 3,500), enter 3500',
    },
    {
      key: 'partner_status',
      label: 'Partner 1 Status',
      type: 'select',
      options: [
        { value: 'unknown', label: 'Unknown / Not Tested (general population risk applies)' },
        { value: 'carrier', label: 'Known Carrier (confirmed heterozygous)' },
        { value: 'affected', label: 'Affected Individual (homozygous / compound het)' },
      ],
      required: false,
    },
  ],
  calculate: (vals) => {
    const denom = parseFloat(vals.incidence_denominator)
    if (!denom || denom <= 0) return null

    const qSquared = 1 / denom
    const q = Math.sqrt(qSquared)
    const p = 1 - q
    const carrierFreqRaw = 2 * p * q

    const fmtRatio = (dec) => {
      if (dec <= 0) return '0'
      const r = Math.round(1 / dec)
      return `1 in ${r.toLocaleString()}`
    }
    const fmtPct = (dec) => {
      if (dec <= 0) return '0%'
      if (dec < 0.00001) return '< 0.001%'
      return (dec * 100).toFixed(3).replace(/\.?0+$/, '') + '%'
    }

    const partnerStatus = vals.partner_status || 'unknown'
    let coupleRisk = 0
    let riskScenario = ''
    let riskNote = ''

    if (partnerStatus === 'carrier') {
      coupleRisk = 1 * carrierFreqRaw * 0.25
      riskScenario = 'Partner 1 is a KNOWN CARRIER × Partner 2 general population carrier risk × 1/4'
      riskNote = 'If Partner 2 is screened and tests negative, use the Residual Risk calculator to refine this estimate.'
    } else if (partnerStatus === 'affected') {
      coupleRisk = 1 * carrierFreqRaw * 0.50
      riskScenario = 'Partner 1 is AFFECTED (homozygous) × Partner 2 general population carrier risk × 1/2'
      riskNote = 'All offspring of the affected partner will be obligate carriers at minimum; risk of affected child depends on Partner 2 status.'
    } else {
      coupleRisk = carrierFreqRaw * carrierFreqRaw * 0.25
      riskScenario = 'Both partners from general population: Carrier Freq × Carrier Freq × 1/4'
      riskNote = 'Consider offering carrier screening to refine this estimate, especially in high-risk ethnicities.'
    }

    return {
      result: fmtRatio(carrierFreqRaw),
      unit: 'Carrier Frequency (2pq)',
      interpretation: `General population carrier frequency is ${fmtPct(carrierFreqRaw)} (${fmtRatio(carrierFreqRaw)}).`,
      detail: `${riskScenario}.\nRisk of affected offspring: ${fmtRatio(coupleRisk)} (${fmtPct(coupleRisk)}).\n\n${riskNote}`,
      breakdown: [
        { label: 'Disease Incidence (q²)', value: `1 in ${denom.toLocaleString()} (${fmtPct(qSquared)})` },
        { label: 'Mutant Allele Freq (q)', value: fmtPct(q) },
        { label: 'Wild-type Allele Freq (p)', value: fmtPct(p) },
        { label: 'Carrier Frequency (2pq)', value: `${fmtRatio(carrierFreqRaw)} (${fmtPct(carrierFreqRaw)})` },
        { label: 'Risk of Affected Child', value: `${fmtRatio(coupleRisk)} (${fmtPct(coupleRisk)})` },
      ],
    }
  },
}
