export default {
  id: 'consanguinity',
  name: 'Coefficient of Consanguinity & Inbreeding (F)',
  shortDescription: 'Calculates the inbreeding coefficient F and reproductive risk for consanguineous unions',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Pediatrics', 'Obstetrics'],
  tags: ['consanguinity', 'inbreeding', 'recessive', 'pedigree', 'AOH', 'IBD', 'microarray', 'F coefficient'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Wright S.',
  creatorYear: '1922',
  description: 'The Coefficient of Inbreeding (F) is the probability that both alleles at a given locus in an individual are identical by descent (IBD) — inherited from a single ancestral copy. It quantifies the degree to which a consanguineous mating increases the risk of homozygosity throughout the genome. The Coefficient of Relationship (R) between two individuals is the expected fraction of alleles shared IBD, and equals 2F for their offspring. Consanguinity increases the risk of autosomal recessive (AR) disorders by elevating the probability that both parents are carriers of the same ancestral recessive allele. On chromosomal microarray, the expected proportion of the genome showing Absence of Heterozygosity (AOH) is approximately equal to F.',
  whyUse: 'Essential for estimating the incremental risk of autosomal recessive disorders in consanguineous couples above the general population background rate. Also useful for correlating with microarray AOH findings, detecting undisclosed consanguinity, and guiding expanded carrier screening decisions.',
  whenToUse: [
    'Preconception or prenatal counseling for consanguineous couples',
    'Pediatric evaluation of a child with multiple congenital anomalies, intellectual disability, or suspected recessive conditions',
    'Interpreting chromosomal microarray results showing extensive regions of AOH (runs of homozygosity)',
    'Estimating F when microarray AOH extent is known and comparing to declared relationship',
    'Populations with high rates of consanguinity (Middle East, South Asia, North Africa, isolated communities)',
  ],
  nextSteps: 'Correlate the calculated F with microarray AOH. If observed AOH significantly exceeds expected F, consider a closer unrecorded relationship or multiple consanguineous loops. Offer expanded carrier screening to both partners, prioritizing the most prevalent recessive disorders in the couple\'s ethnic background. For known recessive conditions in the family, offer targeted carrier testing first.',
  pearls: [
    'F = 1/16 (6.25%) for first cousins — the offspring is expected to be homozygous by descent at 6.25% of loci (≈ 187 Mb of the 3 Gb genome).',
    'Background risk of major congenital anomalies is ~2–3%; first-cousin union adds ~1.7–2.8% (ACOG, 2017).',
    'A child of first cousins has a 1 in 16 chance that any given locus is homozygous by descent — not a 1 in 16 chance of being affected (disease risk also depends on having a pathogenic allele in the pedigree).',
    'Multiple consanguineous loops in a pedigree are additive for F.',
    'For non-paternity investigations: microarray AOH consistently >15% in an unrelated couple strongly suggests undisclosed consanguinity (F > ~0.06).',
    'Populations: F ~0.01–0.04 is common in consanguineous communities; F ≥ 0.125 represents close consanguinity requiring referral.',
  ],
  evidence: 'Wright S. Coefficients of inbreeding and relationship. Am Nat. 1922;56:330-338. ACOG Practice Bulletin on Reproductive and Sexual Coercion (2013) and Preconception Care guidelines address consanguinity counseling. Risk data from Bennett et al. J Genet Couns. 2002. Supported by ACMG, ESHG, and BSGM guidelines.',
  formula: 'Coefficient of Relationship (R) = ∑ (1/2)ⁿ\n  where n = total path steps through each common ancestor\n\nCoefficient of Inbreeding (F) = R / 2\n  (F of offspring = half the R of parents)\n\nExpected AOH = F × genome size (3,000 Mb)\nFor first cousins: R = 1/8, F = 1/16 = 6.25%',
  references: [
    { text: 'Wright S. Coefficients of inbreeding and relationship. Am Nat. 1922;56:330-338.' },
    { text: 'Bennett RL et al. Genetic counseling and screening of consanguineous couples and their offspring. J Genet Couns. 2002;11(2):97-119.', url: 'https://pubmed.ncbi.nlm.nih.gov/12602343/' },
    { text: 'ACOG Committee Opinion 762: Prepregnancy Counseling. Obstet Gynecol. 2019;133(1):e78-e89.', url: 'https://pubmed.ncbi.nlm.nih.gov/30575674/' },
    { text: 'Hamamy H et al. Consanguineous marriages: recommendations from the International Workshop on Consanguinity. Genet Med. 2011;13(11):935-936.', url: 'https://pubmed.ncbi.nlm.nih.gov/21546843/' },
  ],
  links: [
    { title: 'ACOG — Consanguinity Counseling Resources', url: 'https://www.acog.org', description: 'ACOG guidelines on preconception care including consanguinity' },
    { title: 'ESHG Recommendations on Consanguinity', url: 'https://www.eshg.org', description: 'European Society of Human Genetics guidelines' },
  ],
  interpretations: [
    { range: '0', label: 'Unrelated (F = 0)', action: 'Standard population-based screening. No increased AR risk from consanguinity.' },
    { range: '0.0039', label: 'Third Cousins (F ≈ 0.4%)', action: 'Negligible increase above background. Standard care.' },
    { range: '0.0078', label: '2nd Cousins Once Removed (F ≈ 0.8%)', action: 'Minimal increase. Standard carrier screening.' },
    { range: '0.0156', label: 'Second Cousins (F ≈ 1.6%)', action: 'Slight increase. Expanded carrier screening advisable.' },
    { range: '0.0313', label: '1st Cousins Once Removed (F ≈ 3.1%)', action: 'Moderate increase. Expanded carrier screening recommended.' },
    { range: '0.0625', label: 'First Cousins (F ≈ 6.25%)', action: 'Significant increase (+2–3% above background). Expanded carrier screening strongly recommended. Genetic counseling.' },
    { range: '0.125', label: 'Uncle-Niece / Double First Cousins (F ≈ 12.5%)', action: 'High risk. Comprehensive carrier screening and genetic counseling imperative. Fetal microarray if pregnancy.' },
    { range: '0.25', label: 'First-Degree Relatives (F ≈ 25%)', action: 'Extreme risk. Contraindicated in most jurisdictions. Mandatory genetic counseling and comprehensive screening.' },
  ],
  fields: [
    {
      key: 'relationship',
      label: 'Degree of Biological Relationship Between Parents',
      type: 'select',
      options: [
        { value: '0', label: 'Unrelated — General Population (F = 0)' },
        { value: '0.25', label: 'First-Degree — Siblings or Parent-Child (F = 1/4 = 25%)' },
        { value: '0.125_a', label: 'Second-Degree — Uncle-Niece or Aunt-Nephew (F = 1/8 = 12.5%)' },
        { value: '0.125_b', label: 'Double First Cousins (F = 1/8 = 12.5%)' },
        { value: '0.0625', label: 'First Cousins / Third-Degree (F = 1/16 = 6.25%)' },
        { value: '0.03125', label: 'First Cousins Once Removed (F = 1/32 = 3.125%)' },
        { value: '0.015625', label: 'Second Cousins / Fifth-Degree (F = 1/64 = 1.5625%)' },
        { value: '0.0078125', label: 'Second Cousins Once Removed (F = 1/128 ≈ 0.78%)' },
        { value: '0.00390625', label: 'Third Cousins / Seventh-Degree (F = 1/256 ≈ 0.39%)' },
      ],
    },
    {
      key: 'background_risk',
      label: 'Background Risk for Major Congenital Anomalies / Severe Recessive Disease (%)',
      type: 'number', min: 1, max: 10, step: 0.1, placeholder: '3',
      hint: 'General population background is typically 2–3% for major congenital anomalies',
      required: false,
    },
  ],
  calculate: (vals) => {
    if (!vals.relationship && vals.relationship !== '0') return null

    const fStr = vals.relationship.split('_')[0]
    const F = parseFloat(fStr)
    const R = F * 2

    const bgRisk = parseFloat(vals.background_risk) || 3.0

    const fPct = (F * 100).toFixed(4).replace(/\.?0+$/, '') + '%'
    const rPct = (R * 100).toFixed(4).replace(/\.?0+$/, '') + '%'

    const expectedAOH_Mb = (F * 3000).toFixed(0)

    let interpretation = ''
    let additionalRisk = 0
    let recommendation = ''

    if (F === 0) {
      interpretation = 'Unrelated. No increased AR risk above background from consanguinity.'
      additionalRisk = 0
      recommendation = 'Standard screening per ethnicity-based guidelines.'
    } else if (F >= 0.25) {
      interpretation = 'First-degree consanguinity (incestuous union). Extreme risk of autosomal recessive conditions and complex multi-system anomalies.'
      additionalRisk = bgRisk * 4
      recommendation = 'Mandatory comprehensive genetic counseling. Full AR carrier screening. Prenatal microarray if pregnancy achieved. Many jurisdictions prohibit legally.'
    } else if (F >= 0.125) {
      interpretation = 'Close consanguinity (2nd-degree equivalent). High risk of AR conditions.'
      additionalRisk = 6.0
      recommendation = 'Comprehensive carrier screening and genetic counseling imperative. Prenatal diagnosis should be discussed.'
    } else if (F >= 0.0625) {
      interpretation = 'First cousins. Significant increase above background AR risk.'
      additionalRisk = 2.5
      recommendation = 'Expanded carrier screening strongly recommended. Genetic counseling advised. Consider prenatal microarray.'
    } else if (F >= 0.03125) {
      interpretation = 'First cousins once removed. Moderate but real increase in AR risk.'
      additionalRisk = 1.5
      recommendation = 'Expanded carrier screening recommended. Genetic counseling beneficial.'
    } else if (F >= 0.015625) {
      interpretation = 'Second cousins. Slight increase above background risk.'
      additionalRisk = 0.8
      recommendation = 'Expanded carrier screening advisable. Routine counseling.'
    } else {
      interpretation = 'Distant relationship. Minimal increase above population background risk.'
      additionalRisk = 0.3
      recommendation = 'Standard ethnic-based carrier screening. No additional interventions routinely required.'
    }

    const totalRisk = (bgRisk + additionalRisk).toFixed(1)

    return {
      result: F.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''),
      unit: 'Coefficient of Inbreeding (F)',
      interpretation: interpretation,
      detail: F > 0
        ? `Estimated proportion of genome homozygous by descent (expected AOH): ${fPct} (~${expectedAOH_Mb} Mb).\nEstimated major congenital anomaly risk: ~${totalRisk}% (Background ${bgRisk}% + Consanguinity ~${additionalRisk}%).\n\n${recommendation}`
        : `Standard population risk applies (~${bgRisk}% background). ${recommendation}`,
      breakdown: [
        { label: 'Coefficient of Relationship (R)', value: `${R.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} (${rPct})` },
        { label: 'Coefficient of Inbreeding (F)', value: `${F.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} (${fPct})` },
        { label: 'Expected AOH (3 Gb genome)', value: `~${expectedAOH_Mb} Mb` },
        { label: 'Background Anomaly Risk', value: `~${bgRisk}%` },
        { label: 'Consanguinity Added Risk', value: `~${additionalRisk}%` },
        { label: 'Estimated Total Anomaly Risk', value: `~${totalRisk}%` },
      ],
    }
  },
}
