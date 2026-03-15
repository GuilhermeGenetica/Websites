export default {
  id: 'koolen_de_vries_risk',
  name: '17q21.31 Microdeletion Risk (Koolen-de Vries)',
  shortDescription: 'Estimates KdVS risk based on parental H1/H2 inversion genotypes using Koolen et al. Bayesian model',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Pediatrics', 'Reproductive Endocrinology'],
  tags: ['Koolen-de Vries', '17q21.31', 'microdeletion', 'H2 haplotype', 'inversion', 'NAHR', 'KANSL1'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Koolen DA et al.',
  creatorYear: '2006 / 2012',
  description: 'Koolen-de Vries Syndrome (KdVS) is mostly caused by a ~500-600kb microdeletion at 17q21.31 encompassing the KANSL1 gene. This deletion occurs almost exclusively on the H2 inversion haplotype background via Non-Allelic Homologous Recombination (NAHR). The H2 haplotype is a ~900kb inversion polymorphism common in Europeans (~20% allele frequency). This tool implements the exact Koolen et al. (2012) Bayesian model to calculate offspring risk based on parental genotypes, using Hardy-Weinberg proportions and weighted risk calculations.',
  whyUse: 'Stratifies recurrence risk precisely based on parental H1/H2 genotype rather than using a blunt population average. The mathematical model from Koolen et al. demonstrates that although differences between genotype combinations are small in absolute terms, the principle of personalized risk is important.',
  whenToUse: [
    'Counseling couples where one or both parents have known H1/H2 inversion status.',
    'After the birth of a child with KdVS, estimating recurrence risk.',
    'Estimating population-specific risks for 17q21.31 deletions in different ethnic backgrounds.'
  ],
  nextSteps: 'Discuss the relatively low absolute risk. Consider that ~5% of KdVS cases are caused by point mutations in KANSL1 rather than deletion (not covered by this calculator).',
  pearls: [
    'The H2 haplotype frequency is ~20% in Europeans, but rare (<5%) in Africans and East Asians. Adjust the population frequency accordingly.',
    'Population frequency of KdVS deletion is approximately 1 in 16,000 live births.',
    'Using Koolen et al. (2012) math: with p(H1)=0.8, q(H2)=0.2, the six couple combinations are NN×NN (41%), NN×NV (41%), NN×VV (5%), NV×NV (10%), NV×VV (2.5%), VV×VV (0.5%).',
    'The calculated "a" (risk per H2 allele from one heterozygous parent) works out to approximately 1/12,093, and 2a for homozygous = 1/6,047.',
    'Without the H2 allele (H1/H1 × H1/H1), the risk of the classical NAHR-mediated deletion is virtually zero.',
    'About 5% of KdVS is due to KANSL1 intragenic mutations, not captured by this deletion model.'
  ],
  evidence: 'Koolen DA et al. Nat Genet. 2006;38(9):999-1001. Koolen DA et al. Clinical and molecular delineation of the 17q21.31 microdeletion syndrome. J Med Genet. 2008;45:710-720. Koolen DA et al. The Koolen-de Vries syndrome. In: GeneReviews, 2012.',
  formula: 'f(NN)=p²=0.64, f(NV)=2pq=0.32, f(VV)=q²=0.04\nRelative risk r: NN×NN=0, NN×NV=a, NN×VV=2a, NV×NV=2a, NV×VV=3a, VV×VV=4a\nSolving: Σ(f×r) = 1/16000 → a ≈ 1/12,093\nRecurrence per couple = r value for their genotype combination',
  references: [
    { text: 'Koolen DA et al. Mutations in the chromatin modifier gene KANSL1 cause the 17q21.31 microdeletion syndrome. Nat Genet. 2012;44:639-641.', url: '' },
    { text: 'Koolen DA et al. A new chromosome 17q21.31 microdeletion syndrome. Nat Genet. 2006;38(9):999-1001.', url: '' },
    { text: 'Gardner RJM, Sutherland GR, Shaffer LG. Chromosome Abnormalities and Genetic Counseling. Chapter 4, pp. 120-122.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: '0-1', label: 'Calculated Risk', action: 'Standard counseling. Risk is very low in absolute terms.' }
  ],
  fields: [
    { key: 'parent1', label: 'Parent 1 Genotype', type: 'select', options: [
      { value: 'unknown', label: 'Unknown (use population frequency)' },
      { value: 'H1H1', label: 'H1/H1 (NN - No inversion)' },
      { value: 'H1H2', label: 'H1/H2 (NV - Heterozygous carrier)' },
      { value: 'H2H2', label: 'H2/H2 (VV - Homozygous inverted)' }
    ]},
    { key: 'parent2', label: 'Parent 2 Genotype', type: 'select', options: [
      { value: 'unknown', label: 'Unknown (use population frequency)' },
      { value: 'H1H1', label: 'H1/H1 (NN - No inversion)' },
      { value: 'H1H2', label: 'H1/H2 (NV - Heterozygous carrier)' },
      { value: 'H2H2', label: 'H2/H2 (VV - Homozygous inverted)' }
    ]},
    { key: 'population', label: 'Population / H2 allele frequency', type: 'select', options: [
      { value: 'european', label: 'European (~20% H2 frequency)' },
      { value: 'african', label: 'African (~5% H2 frequency)' },
      { value: 'east_asian', label: 'East Asian (~2% H2 frequency)' },
      { value: 'custom', label: 'Custom frequency (use field below)' }
    ]},
    { key: 'custom_h2_freq', label: 'Custom H2 allele frequency (if applicable)', type: 'number', min: 0.001, max: 0.50, step: 0.001, placeholder: 'e.g., 0.20', required: false }
  ],
  calculate: (vals) => {
    if (!vals.parent1 || !vals.parent2 || !vals.population) return null

    let q = 0.20
    if (vals.population === 'european') q = 0.20
    else if (vals.population === 'african') q = 0.05
    else if (vals.population === 'east_asian') q = 0.02
    else if (vals.population === 'custom') {
      if (!vals.custom_h2_freq) return null
      q = parseFloat(vals.custom_h2_freq)
    }
    const p = 1 - q

    const POPULATION_INCIDENCE = 1 / 16000

    const fNN = p * p
    const fNV = 2 * p * q
    const fVV = q * q

    const coupleFreqs = {
      'NN_NN': fNN * fNN,
      'NN_NV': 2 * fNN * fNV,
      'NN_VV': 2 * fNN * fVV,
      'NV_NV': fNV * fNV,
      'NV_VV': 2 * fNV * fVV,
      'VV_VV': fVV * fVV
    }

    const coupleRiskMultipliers = {
      'NN_NN': 0,
      'NN_NV': 1,
      'NN_VV': 2,
      'NV_NV': 2,
      'NV_VV': 3,
      'VV_VV': 4
    }

    let weightedSum = 0
    for (const key of Object.keys(coupleFreqs)) {
      weightedSum += coupleFreqs[key] * coupleRiskMultipliers[key]
    }

    const a = POPULATION_INCIDENCE / weightedSum

    const getCoupleKey = (g1, g2) => {
      const order = ['H1H1', 'H1H2', 'H2H2']
      const map = { 'H1H1': 'NN', 'H1H2': 'NV', 'H2H2': 'VV' }
      const idx1 = order.indexOf(g1)
      const idx2 = order.indexOf(g2)
      const first = idx1 <= idx2 ? g1 : g2
      const second = idx1 <= idx2 ? g2 : g1
      return map[first] + '_' + map[second]
    }

    let coupleKey = ''
    let finalRisk = 0
    let isKnown = true

    if (vals.parent1 === 'unknown' && vals.parent2 === 'unknown') {
      isKnown = false
      let totalWeightedRisk = 0
      for (const key of Object.keys(coupleFreqs)) {
        totalWeightedRisk += coupleFreqs[key] * coupleRiskMultipliers[key] * a
      }
      finalRisk = totalWeightedRisk
      coupleKey = 'Population average (both unknown)'
    } else if (vals.parent1 === 'unknown' || vals.parent2 === 'unknown') {
      isKnown = false
      const known = vals.parent1 === 'unknown' ? vals.parent2 : vals.parent1
      const knownMap = { 'H1H1': 'NN', 'H1H2': 'NV', 'H2H2': 'VV' }
      const kn = knownMap[known]

      let totalWeighted = 0
      const possiblePartners = { 'NN': fNN, 'NV': fNV, 'VV': fVV }
      for (const [partner, freq] of Object.entries(possiblePartners)) {
        const k1 = kn <= partner ? kn + '_' + partner : partner + '_' + kn
        totalWeighted += freq * coupleRiskMultipliers[k1] * a
      }
      finalRisk = totalWeighted
      coupleKey = `${known} × Unknown (weighted)`
    } else {
      isKnown = true
      coupleKey = getCoupleKey(vals.parent1, vals.parent2)
      finalRisk = coupleRiskMultipliers[coupleKey] * a
    }

    if (finalRisk === 0 || finalRisk < 1e-10) {
      return {
        result: 'Virtually 0',
        unit: '',
        interpretation: 'Extremely Low Risk (No H2 allele pathway)',
        detail: `Both parents are H1/H1 (NN). Since the classical 17q21.31 deletion occurs via NAHR on the H2 haplotype background, the risk for NAHR-mediated deletion is essentially zero. Note: ~5% of KdVS is caused by KANSL1 point mutations (not modeled here).`,
        breakdown: [
          { label: 'Couple Genotype', value: coupleKey },
          { label: 'Risk Multiplier', value: '0×a' },
          { label: 'H2 Allele Frequency', value: `${(q * 100).toFixed(1)}%` },
          { label: 'KANSL1 Mutation Risk', value: 'Not calculated (~5% of all KdVS)' }
        ]
      }
    }

    const riskDenominator = Math.round(1 / finalRisk)
    const riskPercent = (finalRisk * 100).toFixed(4)
    const aValue = a > 0 ? Math.round(1 / a) : 'N/A'

    return {
      result: `1 in ${riskDenominator.toLocaleString()}`,
      unit: `(${riskPercent}%)`,
      interpretation: `Risk of 17q21.31 deletion (KdVS) in offspring`,
      detail: `Using Koolen et al. Bayesian model with H2 frequency q=${q}. Calculated a = 1/${aValue} (risk per H2 allele from heterozygous parent). Couple category: ${coupleKey}. Risk multiplier: ${coupleRiskMultipliers[coupleKey] !== undefined ? coupleRiskMultipliers[coupleKey] + '×a' : 'weighted average'}. Note: ~5% of KdVS is caused by KANSL1 point mutations, not modeled here.`,
      breakdown: [
        { label: 'H2 Allele Frequency (q)', value: `${(q * 100).toFixed(1)}%` },
        { label: 'Couple Category', value: coupleKey },
        { label: 'Calculated "a" (risk per H2)', value: `1 in ${aValue.toLocaleString()}` },
        { label: 'Risk Multiplier', value: coupleRiskMultipliers[coupleKey] !== undefined ? `${coupleRiskMultipliers[coupleKey]}×a` : 'weighted' },
        { label: 'Deletion Risk', value: `1 in ${riskDenominator.toLocaleString()} (${riskPercent}%)` },
        { label: 'Population Incidence', value: '1 in 16,000' },
        { label: 'Caveat', value: '~5% of KdVS = KANSL1 point mutations' }
      ]
    }
  }
}