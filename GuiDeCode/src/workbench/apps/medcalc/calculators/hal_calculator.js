export default {
  id: 'hal_calculator',
  name: 'Haploid Autosomal Length (HAL) Calculator',
  shortDescription: 'Converts the physical portion of a chromosome arm into a percentage of the total autosomal genome',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Cytogenetics'],
  tags: ['HAL', 'cytogenetics', 'translocation', 'genome size', 'monosomy', 'trisomy', 'haploid autosomal length', 'breakpoint'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Daniel A.',
  creatorYear: '1979',
  description: 'Essential for calculating the quantitative impact of chromosomal rearrangements. The tool converts the physical portion of an involved chromosome arm into a percentage of the total Haploid Autosomal Length (HAL). It includes both the classic Daniel (1985) proportions and updated hg38 genome assembly values. The total autosomal genome is 2,875 Mb (hg38).',
  whyUse: 'Required to feed data into viability models (like Cohen & Daniel) to predict reproductive outcomes for translocation carriers.',
  whenToUse: [
    'Evaluating the size of deletions and duplications from a karyotype.',
    'Calculating the unbalanced genomic load of adjacent-1 or adjacent-2 meiotic segregations.',
    'Estimating the proportion of the genome affected by an inversion recombinant.',
    'Translating cytogenetic band positions into approximate megabase and HAL percentages.'
  ],
  nextSteps: 'Use the resulting HAL percentage as the Monosomy or Trisomy input in the Cohen & Daniel Viability Calculator.',
  pearls: [
    '1% of HAL is roughly equivalent to 28.75 Megabases (Mb) of DNA (hg38: 2,875 Mb total autosomal).',
    'Chromosome 1 is the largest, representing approximately 8.66% of the HAL (hg38), while Chromosome 21 represents about 1.62%.',
    'Acrocentric chromosomes (13, 14, 15, 21, 22) have negligible p-arm euchromatin; p-arm values reflect satellite/stalk regions only.',
    'This calculator can be used iteratively: calculate the monosomy segment and trisomy segment separately for a given translocation, then feed both values into the Viability Calculator.',
    'The fraction can be estimated by measuring the segment on a chromosome ideogram with a ruler, or from molecular breakpoint positions.'
  ],
  evidence: 'Derived from standardized relative chromosome length measurements. Daniel A. (1985) original values and UCSC Genome Browser hg38 assembly (Gardner & Sutherland, Table A-1).',
  formula: 'Segment HAL % = (Arm HAL %) × (Fraction of arm involved)\nApproximate Mb = Segment HAL % × 28.75',
  references: [
    { text: 'Daniel A. The haploid autosomal length (HAL). Ann Hum Genet. 1985;49:265-271.', url: '' },
    { text: 'Gardner RJM, Sutherland GR, Shaffer LG. Chromosome Abnormalities and Genetic Counseling. Table A-1.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: '>0', label: 'Genomic Load Calculated', action: 'Input this value into viability calculators.' }
  ],
  fields: [
    {
      key: 'chromosome', label: 'Chromosome', type: 'select',
      options: [
        { value: '1', label: 'Chr 1 (248.96 Mb, 8.66% HAL)' },
        { value: '2', label: 'Chr 2 (242.19 Mb, 8.42% HAL)' },
        { value: '3', label: 'Chr 3 (198.30 Mb, 6.90% HAL)' },
        { value: '4', label: 'Chr 4 (190.21 Mb, 6.62% HAL)' },
        { value: '5', label: 'Chr 5 (181.54 Mb, 6.31% HAL)' },
        { value: '6', label: 'Chr 6 (170.81 Mb, 5.94% HAL)' },
        { value: '7', label: 'Chr 7 (159.35 Mb, 5.54% HAL)' },
        { value: '8', label: 'Chr 8 (145.14 Mb, 5.05% HAL)' },
        { value: '9', label: 'Chr 9 (138.39 Mb, 4.81% HAL)' },
        { value: '10', label: 'Chr 10 (133.80 Mb, 4.65% HAL)' },
        { value: '11', label: 'Chr 11 (135.09 Mb, 4.70% HAL)' },
        { value: '12', label: 'Chr 12 (133.28 Mb, 4.64% HAL)' },
        { value: '13', label: 'Chr 13 (114.36 Mb, 3.98% HAL)' },
        { value: '14', label: 'Chr 14 (107.04 Mb, 3.72% HAL)' },
        { value: '15', label: 'Chr 15 (101.99 Mb, 3.55% HAL)' },
        { value: '16', label: 'Chr 16 (90.34 Mb, 3.14% HAL)' },
        { value: '17', label: 'Chr 17 (83.26 Mb, 2.90% HAL)' },
        { value: '18', label: 'Chr 18 (80.37 Mb, 2.80% HAL)' },
        { value: '19', label: 'Chr 19 (58.62 Mb, 2.04% HAL)' },
        { value: '20', label: 'Chr 20 (64.44 Mb, 2.24% HAL)' },
        { value: '21', label: 'Chr 21 (46.71 Mb, 1.62% HAL)' },
        { value: '22', label: 'Chr 22 (50.82 Mb, 1.77% HAL)' }
      ]
    },
    { key: 'arm', label: 'Arm', type: 'select', options: [
      { value: 'p', label: 'p (short arm)' },
      { value: 'q', label: 'q (long arm)' },
      { value: 'whole', label: 'Whole chromosome' }
    ]},
    { key: 'fraction', label: 'Fraction of arm involved (0.01 to 1.0)', type: 'number', min: 0.01, max: 1.0, step: 0.01, placeholder: 'e.g., 0.5 for half the arm', hint: '1.0 = entire arm' },
    { key: 'data_source', label: 'Data Source', type: 'select', options: [
      { value: 'hg38', label: 'hg38 Genome Assembly (Recommended)' },
      { value: 'daniel', label: 'Daniel 1985 (Classic)' }
    ]}
  ],
  calculate: (vals) => {
    if (!vals.chromosome || !vals.arm || !vals.fraction || !vals.data_source) return null
    const fraction = parseFloat(vals.fraction)
    if (isNaN(fraction) || fraction <= 0 || fraction > 1.0) return null

    const halDataHg38 = {
      '1':  { total: 8.66, p: 4.28, q: 4.38, mb: 248.96 },
      '2':  { total: 8.42, p: 3.22, q: 5.20, mb: 242.19 },
      '3':  { total: 6.90, p: 3.17, q: 3.73, mb: 198.30 },
      '4':  { total: 6.62, p: 1.67, q: 4.95, mb: 190.21 },
      '5':  { total: 6.31, p: 1.59, q: 4.72, mb: 181.54 },
      '6':  { total: 5.94, p: 2.12, q: 3.82, mb: 170.81 },
      '7':  { total: 5.54, p: 2.08, q: 3.46, mb: 159.35 },
      '8':  { total: 5.05, p: 1.56, q: 3.49, mb: 145.14 },
      '9':  { total: 4.81, p: 1.65, q: 3.16, mb: 138.39 },
      '10': { total: 4.65, p: 1.38, q: 3.27, mb: 133.80 },
      '11': { total: 4.70, p: 1.75, q: 2.95, mb: 135.09 },
      '12': { total: 4.64, p: 1.20, q: 3.44, mb: 133.28 },
      '13': { total: 3.98, p: 0.62, q: 3.36, mb: 114.36 },
      '14': { total: 3.72, p: 0.59, q: 3.13, mb: 107.04 },
      '15': { total: 3.55, p: 0.57, q: 2.98, mb: 101.99 },
      '16': { total: 3.14, p: 1.25, q: 1.89, mb: 90.34 },
      '17': { total: 2.90, p: 0.87, q: 2.03, mb: 83.26 },
      '18': { total: 2.80, p: 0.61, q: 2.19, mb: 80.37 },
      '19': { total: 2.04, p: 0.87, q: 1.17, mb: 58.62 },
      '20': { total: 2.24, p: 0.91, q: 1.33, mb: 64.44 },
      '21': { total: 1.62, p: 0.41, q: 1.21, mb: 46.71 },
      '22': { total: 1.77, p: 0.42, q: 1.35, mb: 50.82 }
    }

    const halDataDaniel = {
      '1':  { total: 9.24, p: 4.10, q: 5.14, mb: 248.96 },
      '2':  { total: 8.02, p: 3.10, q: 4.92, mb: 242.19 },
      '3':  { total: 6.83, p: 3.10, q: 3.73, mb: 198.30 },
      '4':  { total: 6.30, p: 1.90, q: 4.40, mb: 190.21 },
      '5':  { total: 6.08, p: 1.80, q: 4.28, mb: 181.54 },
      '6':  { total: 5.90, p: 2.10, q: 3.80, mb: 170.81 },
      '7':  { total: 5.36, p: 1.90, q: 3.46, mb: 159.35 },
      '8':  { total: 4.93, p: 1.50, q: 3.43, mb: 145.14 },
      '9':  { total: 4.80, p: 1.60, q: 3.20, mb: 138.39 },
      '10': { total: 4.59, p: 1.30, q: 3.29, mb: 133.80 },
      '11': { total: 4.61, p: 1.60, q: 3.01, mb: 135.09 },
      '12': { total: 4.66, p: 1.30, q: 3.36, mb: 133.28 },
      '13': { total: 3.74, p: 0.40, q: 3.34, mb: 114.36 },
      '14': { total: 3.56, p: 0.40, q: 3.16, mb: 107.04 },
      '15': { total: 3.46, p: 0.40, q: 3.06, mb: 101.99 },
      '16': { total: 3.36, p: 1.20, q: 2.16, mb: 90.34 },
      '17': { total: 3.46, p: 0.90, q: 2.56, mb: 83.26 },
      '18': { total: 2.93, p: 0.80, q: 2.13, mb: 80.37 },
      '19': { total: 2.67, p: 0.90, q: 1.77, mb: 58.62 },
      '20': { total: 2.56, p: 0.90, q: 1.66, mb: 64.44 },
      '21': { total: 1.90, p: 0.40, q: 1.50, mb: 46.71 },
      '22': { total: 2.04, p: 0.40, q: 1.64, mb: 50.82 }
    }

    const halSource = vals.data_source === 'daniel' ? halDataDaniel : halDataHg38
    const sourceName = vals.data_source === 'daniel' ? 'Daniel 1985' : 'hg38'
    const chrData = halSource[vals.chromosome]

    let armTotalHal = 0
    let armLabel = ''
    if (vals.arm === 'whole') {
      armTotalHal = chrData.total
      armLabel = 'whole chromosome'
    } else {
      armTotalHal = chrData[vals.arm]
      armLabel = vals.arm + '-arm'
    }

    const segmentHal = armTotalHal * fraction
    const segmentMb = (segmentHal / 100 * 2875).toFixed(1)
    const isAcrocentric = ['13','14','15','21','22'].includes(vals.chromosome)
    let acrocentricWarning = ''
    if (isAcrocentric && vals.arm === 'p') {
      acrocentricWarning = ' Note: Acrocentric p-arms contain mostly satellite/repetitive DNA. Loss or gain of this material is generally without phenotypic consequence.'
    }

    return {
      result: segmentHal.toFixed(3),
      unit: '% of HAL',
      interpretation: `This segment represents ${segmentHal.toFixed(3)}% of the haploid autosomal length (~${segmentMb} Mb).${acrocentricWarning}`,
      detail: `Data source: ${sourceName}. Total HAL for Chromosome ${vals.chromosome} ${armLabel} is ${armTotalHal}%. Involved segment: ${armTotalHal} × ${fraction} = ${segmentHal.toFixed(3)}%. Chromosome ${vals.chromosome} total size: ${chrData.mb} Mb.`,
      breakdown: [
        { label: `Chr ${vals.chromosome} ${armLabel} HAL (${sourceName})`, value: `${armTotalHal}%` },
        { label: 'Fraction Involved', value: `${(fraction * 100).toFixed(1)}%` },
        { label: 'Segment HAL', value: `${segmentHal.toFixed(3)}%` },
        { label: 'Approximate Size', value: `~${segmentMb} Mb` },
        { label: 'Chromosome Total', value: `${chrData.total}% (${chrData.mb} Mb)` }
      ]
    }
  }
}