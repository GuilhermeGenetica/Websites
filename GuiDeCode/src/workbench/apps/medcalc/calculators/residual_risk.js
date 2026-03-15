export default {
  id: 'residual_risk',
  name: 'Residual Carrier Risk (Negative Screen)',
  shortDescription: 'Post-test carrier probability after a negative screening result using Bayes theorem',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Obstetrics', 'Maternal-Fetal Medicine'],
  tags: ['carrier screening', 'residual risk', 'recessive', 'Bayes', 'preconception', 'ECS', 'cfDNA'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Bayesian Framework',
  creatorYear: '1763',
  description: 'When an individual tests negative on a carrier screening panel, their risk of being a carrier is dramatically reduced — but never reaches zero. This is because no panel has 100% detection rate (sensitivity). Mutations missed by the assay remain undetected. Using Bayes theorem, this calculator computes the precise "residual carrier risk" after a negative result, and propagates that risk to estimate the probability of having an affected child based on the partner\'s carrier status.',
  whyUse: 'Critical for post-test counseling in expanded carrier screening (ECS). Avoids the clinical error of treating a negative screen as a complete exclusion. Quantifies the safety margin provided by the test and allows couples to make truly informed reproductive decisions.',
  whenToUse: [
    'Post-test counseling after a negative expanded carrier screening result',
    'When one partner is a known carrier and the other has a negative panel result',
    'Comparing detection rates between targeted genotyping panels vs. sequencing approaches',
    'Explaining why a negative result is reassuring but not a guarantee',
  ],
  nextSteps: 'Communicate the residual risk clearly. If the residual carrier risk is unacceptably high for the couple (especially when the other partner is a known carrier), discuss: (1) next-generation sequencing of the gene if only genotyping was performed; (2) PGT-M (Preimplantation Genetic Testing for Monogenic Disorders); (3) Prenatal diagnosis (CVS or amniocentesis).',
  pearls: [
    'Residual Risk = [Prior × (1 − DR)] / [Prior × (1 − DR) + (1 − Prior) × 1]',
    'The higher the Detection Rate (sequencing > genotyping), the lower the residual risk.',
    'For CF genotyping panels (90% DR) in Caucasians (prior 1/25): residual risk ≈ 1 in 241.',
    'For CF sequencing (>99% DR) in the same population: residual risk drops to ≈ 1 in 2,500+.',
    'Always use ethnicity-specific detection rates — panels are calibrated to common mutations in specific ancestries.',
    'A negative result in a low-prior-risk population provides greater reassurance than in a high-prior-risk population.',
  ],
  evidence: 'Standard Bayesian calculation universally taught in genetic counseling and clinical genetics training programs. Endorsed by ACMG, SMFM, and ACOG for post-carrier-screening counseling. Applied in all major clinical genetics textbooks (Thompson & Thompson, Nussbaum et al.).',
  formula: 'Prior Risk (p) = 1 / carrier_frequency_denominator\nSensitivity (s) = detection_rate / 100\n\nResidual Carrier Risk:\n  = [p × (1 − s)] / [p × (1 − s) + (1 − p) × 1]\n\nOffspring Risk (partner = known carrier):\n  = Residual Risk × 1.0 × (1/4)\n\nOffspring Risk (partner = untested, population freq):\n  = Residual Risk × Population Carrier Freq × (1/4)',
  references: [
    { text: 'ACOG Committee Opinion 690: Carrier Screening in the Age of Genomic Medicine. Obstet Gynecol. 2017;129(3):e35-e40.', url: 'https://pubmed.ncbi.nlm.nih.gov/28225426/' },
    { text: 'Gregg AR et al. Expanding carrier screening: ACMG practice resource. Genet Med. 2021;23(10):1793-1806.', url: 'https://pubmed.ncbi.nlm.nih.gov/34385711/' },
    { text: 'Beaudet AL, Belmont JW. Array-Based DNA Diagnostics: Let the Revolution Begin. Annu Rev Med. 2008;59:113-129.', url: 'https://pubmed.ncbi.nlm.nih.gov/17705685/' },
  ],
  links: [
    { title: 'ACMG — Expanded Carrier Screening Guidelines', url: 'https://www.acmg.net/ACMG/Medical-Genetics-Practice-Resources/Carrier-Screening.aspx', description: 'ACMG practice guidelines on carrier screening' },
  ],
  interpretations: [
    { range: '0-1', label: 'Risk Assessment Complete', action: 'Compare residual risk to couple\'s threshold for concern; guide further testing decisions.' },
  ],
  fields: [
    {
      key: 'carrier_freq',
      label: 'A Priori Carrier Frequency (1 in X)',
      type: 'number', min: 2, max: 100000, step: 1, placeholder: 'e.g., 25',
      hint: 'Denominator only. Example: CF Caucasians = 25; SMA = 40–50; Tay-Sachs Ashkenazi = 30',
    },
    {
      key: 'detection_rate',
      label: 'Panel Detection Rate / Sensitivity (%)',
      type: 'number', min: 1, max: 99.99, step: 0.01, placeholder: 'e.g., 90',
      hint: 'Check lab report. Typical: targeted genotyping 80–95%; sequencing 97–99%+',
    },
    {
      key: 'partner_status',
      label: 'Partner\'s Carrier Status',
      type: 'select',
      options: [
        { value: 'unknown', label: 'Unknown / Untested (uses population carrier frequency)' },
        { value: 'carrier', label: 'Known Carrier (100% confirmed)' },
      ],
      required: false,
    },
  ],
  calculate: (vals) => {
    const freqDenom = parseFloat(vals.carrier_freq)
    const drPct = parseFloat(vals.detection_rate)
    if (!freqDenom || !drPct || freqDenom < 2 || drPct <= 0 || drPct >= 100) return null

    const priorRisk = 1 / freqDenom
    const sensitivity = drPct / 100

    const numerator = priorRisk * (1 - sensitivity)
    const denominator = numerator + (1 - priorRisk) * 1
    const residualRisk = numerator / denominator

    const residualDenom = Math.round(1 / residualRisk)
    const residualPct = (residualRisk * 100).toFixed(4).replace(/\.?0+$/, '')

    const reductionFactor = Math.round(priorRisk / residualRisk)

    let offspringRisk = 0
    let scenarioText = ''
    let scenarioDetail = ''

    const partnerStatus = vals.partner_status || 'unknown'

    if (partnerStatus === 'carrier') {
      offspringRisk = residualRisk * 1.0 * 0.25
      scenarioText = 'Partner is a KNOWN CARRIER'
      scenarioDetail = 'Formula: Residual Risk × 1 (carrier certainty) × ¼'
    } else {
      const popCarrierFreq = 1 / freqDenom
      const popCarrier2pq = 2 * Math.sqrt(1 / freqDenom) * (1 - Math.sqrt(1 / freqDenom))
      offspringRisk = residualRisk * popCarrier2pq * 0.25
      scenarioText = 'Partner is UNTESTED (population frequency applied)'
      scenarioDetail = `Formula: Residual Risk × Population Carrier Freq (~1 in ${Math.round(1/popCarrier2pq)}) × ¼`
    }

    const offspringDenom = Math.round(1 / offspringRisk)
    const offspringPct = (offspringRisk * 100).toFixed(5).replace(/\.?0+$/, '')

    return {
      result: `1 in ${residualDenom.toLocaleString()}`,
      unit: 'Residual Carrier Risk',
      interpretation: `Risk has been reduced from 1 in ${freqDenom} to 1 in ${residualDenom.toLocaleString()} (~${residualPct}%) — a ${reductionFactor}× reduction.`,
      detail: `${scenarioText}. ${scenarioDetail}.\nRisk of an affected child: 1 in ${offspringDenom.toLocaleString()} (${offspringPct}%).`,
      breakdown: [
        { label: 'Prior Carrier Frequency', value: `1 in ${freqDenom}` },
        { label: 'Panel Detection Rate', value: `${drPct}%` },
        { label: 'Fraction Missed by Panel', value: `${(100 - drPct).toFixed(2)}%` },
        { label: 'Residual Carrier Risk', value: `1 in ${residualDenom.toLocaleString()} (${residualPct}%)` },
        { label: 'Risk Reduction Factor', value: `${reductionFactor}×` },
        { label: 'Partner Status', value: partnerStatus === 'carrier' ? 'Known Carrier' : 'Untested (population)' },
        { label: 'Offspring Affected Risk', value: `1 in ${offspringDenom.toLocaleString()} (${offspringPct}%)` },
      ],
    }
  },
}
