export default {
  id: 'inversion_empirical_risk',
  name: 'Empirical Risk in Chromosome Inversions',
  shortDescription: 'Estimates the risk of viable unbalanced offspring for inversion carriers',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Reproductive Endocrinology', 'Obstetrics'],
  tags: ['inversion', 'paracentric', 'pericentric', 'recombination', 'empirical risk', 'recombinant chromosome', 'meiosis'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Gardner & Sutherland / Daniel et al.',
  creatorYear: '2018',
  description: 'Evaluates the risk of live-born offspring with chromosomal imbalances originating from carriers of paracentric or pericentric inversions. For pericentric inversions, the risk depends on the size of the inverted segment relative to the whole chromosome: larger inversions produce smaller (more viable) terminal imbalances when recombination occurs. For paracentric inversions, recombination yields dicentric and acentric products that are nearly always lethal. The calculator uses empirical consensus data (5-15% range for pericentric, <1% for paracentric) and distinguishes ascertainment mode.',
  whyUse: 'Guides reproductive counseling for incidentally discovered or familial inversions. Provides differentiated risk estimates based on the critical variables: inversion type, segment size, ascertainment mode, and whether the inversion involves an acrocentric chromosome.',
  whenToUse: [
    'Counseling a patient identified as carrying a chromosome inversion.',
    'Assessing recurrence risk after birth of a child with a recombinant chromosome.',
    'Deciding whether to offer prenatal diagnosis or PGT-SR for an inversion carrier.'
  ],
  nextSteps: 'Discuss the option of prenatal diagnosis or PGT-SR if the risk is deemed significant. For paracentric inversions discovered fortuitously, a conservative counseling approach emphasizing the very low risk is appropriate.',
  pearls: [
    'Paracentric inversions: crossing over yields dicentric + acentric chromosomes → almost always lethal. Risk of viable unbalanced liveborn is <0.1-0.5%.',
    'Pericentric inversions: LARGER inversions = HIGHER risk. Large inverted segments produce small terminal dup/del that are more survivable.',
    'Consensus empirical risk for pericentric inversions ascertained through an abnormal child: 5-15% (Groupe de Cytogeneticiens Francais 1986, Sherman et al. 1986, Daniel et al. 1989).',
    'For pericentric inversions ascertained fortuitously (NOT through an abnormal child): overall risk is ~1%.',
    'The combined genetic content of the DISTAL (non-inverted) segments is the direct determinant of viability of the recombinant form.',
    'Acrocentric pericentric inversions: only q-arm imbalance matters; p-arm loss/gain is without consequence. Large inversions with distal q breakpoints may carry particularly high risk.',
    'Some inv(8)(p23.1q22.1) carriers can produce inv dup del(8p) recombinants via a special mechanism.',
    'Common variant inversions (inv(2)(p11.2q13), inv(1/9/16/Y) heterochromatin) are generally innocuous and excluded from risk calculations.',
    'Risk up to ~50% has been estimated for specific inversions like inv(13)(p11q22) where both recombinant forms are viable (Williamson et al. 1980).',
    'The inv(8)(p23.1) paracentric inversion is an important exception: despite being paracentric, it predisposes to inv dup 8p via NAHR.'
  ],
  evidence: 'Gardner and Sutherland, Chapter 9. Ishii et al. (1997) review of 55 pericentric inversions with viable recombinants. Groupe de Cytogeneticiens Francais 1986b, Sherman et al. 1986, Daniel et al. 1989.',
  formula: 'Pericentric (ascertained via abnormal child): 5-15% empirical range, scaled by inversion size.\nPericentric (fortuitous): ~1% overall.\nParacentric: <0.5% (virtually zero for viable liveborn).\nAcrocentric pericentric: depends on q-arm breakpoint position.',
  references: [
    { text: 'Gardner RJM, Sutherland GR, Shaffer LG. Chromosome Abnormalities and Genetic Counseling. Chapter 9: Inversions.', url: '' },
    { text: 'Ishii F, Fujita H, Nagai A, et al. Viable recombinants from pericentric inversions. Am J Med Genet. 1997;70:15-20.', url: '' },
    { text: 'Daniel A, Hook EB, Wulf G. Risks of unbalanced progeny at amniocentesis to carriers of chromosomal rearrangements. Am J Med Genet. 1989;33:14-53.', url: '' }
  ],
  links: [],
  interpretations: [
    { range: '0-50', label: 'Empirical Risk', action: 'Counsel based on calculated risk.' }
  ],
  fields: [
    { key: 'inv_type', label: 'Inversion Type', type: 'select', options: [
      { value: 'pericentric', label: 'Pericentric (Centromere involved - breaks in both arms)' },
      { value: 'paracentric', label: 'Paracentric (Centromere NOT involved - breaks in same arm)' }
    ]},
    { key: 'inv_size_pct', label: 'Inverted segment as % of chromosome length', type: 'number', min: 1, max: 95, step: 1, placeholder: 'e.g., 60', hint: 'Estimate from ideogram or molecular data' },
    { key: 'ascertainment', label: 'How was the inversion discovered?', type: 'select', options: [
      { value: 'abnormal_child', label: 'Through an abnormal child (recombinant proven)' },
      { value: 'fortuitous', label: 'Fortuitously / Incidental finding (no abnormal offspring)' },
      { value: 'reproductive_loss', label: 'Through recurrent miscarriage' },
      { value: 'prenatal', label: 'At prenatal diagnosis (de novo or inherited)' }
    ]},
    { key: 'is_acrocentric', label: 'Acrocentric chromosome? (13, 14, 15, 21, 22)', type: 'select', options: [
      { value: 'no', label: 'No (Non-acrocentric)' },
      { value: 'yes', label: 'Yes (Acrocentric)' }
    ]},
    { key: 'is_variant', label: 'Is this a known common variant inversion?', type: 'select', options: [
      { value: 'no', label: 'No / Unknown' },
      { value: 'yes', label: 'Yes (e.g., inv(2)(p11.2q13), inv(1/9/16/Y) het)' }
    ]}
  ],
  calculate: (vals) => {
    if (!vals.inv_type || !vals.inv_size_pct || !vals.ascertainment || !vals.is_acrocentric || !vals.is_variant) return null

    const size = parseInt(vals.inv_size_pct)

    if (vals.is_variant === 'yes') {
      return {
        result: '~0%',
        unit: '',
        interpretation: 'Common Variant Inversion - No Known Genetic Risk',
        detail: 'This inversion is recognized as a common population variant (polymorphism). No genetic risks are known to be associated with these inversions. Family investigation of carrier status is not warranted. Examples include inv(2)(p11.2q13), and heterochromatic inversions of chromosomes 1, 9, 16, and Y.',
        breakdown: [
          { label: 'Inversion Type', value: vals.inv_type },
          { label: 'Classification', value: 'Common Variant / Polymorphism' },
          { label: 'Empirical Risk', value: '~0% (No genetic risk)' },
          { label: 'Prenatal Diagnosis', value: 'Not indicated' }
        ]
      }
    }

    let riskLow = 0
    let riskHigh = 0
    let riskBest = 0
    let detailText = ''
    let prenatalRec = ''

    if (vals.inv_type === 'paracentric') {
      riskLow = 0
      riskHigh = 0.5
      riskBest = 0.1

      detailText = 'Recombination within a paracentric inversion loop creates dicentric and acentric chromosomes, which are highly unstable and almost always result in early embryonic lethality. The risk for a viable malformed liveborn is extremely low (<0.5%). The vast majority of paracentric inversions are likely to be harmless (Madan 1995). "Better than 99.9%" might be a fair estimate of a favorable outcome.'

      if (vals.ascertainment === 'abnormal_child') {
        riskBest = 0.5
        riskHigh = 2.0
        detailText += ' However, since this family was ascertained through an abnormal child, the specific inversion may be one of the rare exceptions (e.g., viable U-loop reunion products). Prenatal diagnosis is warranted.'
        prenatalRec = 'Recommended'
      } else {
        prenatalRec = 'Discretionary (may be declined)'
      }
    } else {
      if (vals.ascertainment === 'abnormal_child') {
        if (size < 30) {
          riskLow = 1; riskHigh = 5; riskBest = 3
          detailText = 'Small pericentric inversions form smaller pairing loops in meiosis, reducing the chance of crossover within the loop. If crossover occurs, the resulting duplication/deletion involves LARGE terminal segments, which are typically lethal in utero. Risk is at the lower end of the empirical range.'
        } else if (size <= 50) {
          riskLow = 5; riskHigh = 10; riskBest = 7
          detailText = 'Medium pericentric inversions pose a moderate risk. The inversion loop is large enough for crossovers to occur regularly, and the resulting terminal imbalances are of intermediate size with variable viability.'
        } else if (size <= 70) {
          riskLow = 8; riskHigh = 15; riskBest = 12
          detailText = 'Large pericentric inversions have the highest risk for viable unbalanced offspring. Crossovers are highly likely in the large loop. The resulting terminal deletions/duplications are small enough to potentially be tolerated by the fetus.'
        } else {
          riskLow = 10; riskHigh = 50; riskBest = 15
          detailText = 'Very large pericentric inversions where both distal segments are small and potentially viable. The risk can approach 50% in exceptional cases where both recombinant forms are survivable (e.g., inv(13)(p11q22) in Williamson et al. 1980). Private segregation analysis within the family is strongly recommended.'
        }
        prenatalRec = 'Recommended'
      } else if (vals.ascertainment === 'fortuitous' || vals.ascertainment === 'prenatal') {
        riskBest = 1.0
        riskLow = 0.5
        riskHigh = 3.0

        if (size > 60) {
          riskBest = 2.0
          riskHigh = 5.0
          detailText = 'For fortuitously discovered large pericentric inversions, the overall risk is ~1% but may be higher for very large inversions. Since no abnormal child has been observed in this family, the risk is lower than the 5-15% range seen in families ascertained through an affected child.'
        } else {
          detailText = 'For families identified by means other than through the birth of an abnormal child (e.g., discovered fortuitously at prenatal diagnosis), the overall risk is about 1% (Daniel et al. 1988).'
        }
        prenatalRec = 'Discretionary'
      } else {
        riskBest = 2.0
        riskLow = 1.0
        riskHigh = 5.0
        detailText = 'Ascertained through reproductive loss. The losses themselves may represent lethal recombinant conceptions. Risk for a viable abnormal liveborn is likely lower than the full 5-15% but higher than the 1% baseline for fortuitous discovery.'
        prenatalRec = 'Recommended'
      }

      if (vals.is_acrocentric === 'yes' && vals.inv_type === 'pericentric') {
        detailText += ' ACROCENTRIC NOTE: For pericentric inversions in acrocentric chromosomes (13, 14, 15, 21, 22), only the q-arm imbalance matters phenotypically. Loss or gain of the p-arm satellite region is without consequence. If the q-arm breakpoint is distal, the risk may be particularly high (effectively a "single-segment" imbalance). For small inversions in chromosomes 14 and 15, the risk is practically zero (Leach et al. 2005).'
      }
    }

    return {
      result: `${riskBest.toFixed(1)}%`,
      unit: `(range: ${riskLow}-${riskHigh}%)`,
      interpretation: `Empirical Risk Estimate for Viable Unbalanced Offspring`,
      detail: detailText,
      breakdown: [
        { label: 'Inversion Type', value: vals.inv_type === 'pericentric' ? 'Pericentric' : 'Paracentric' },
        { label: 'Inverted Segment', value: `~${size}% of chromosome` },
        { label: 'Ascertainment', value: vals.ascertainment.replace(/_/g, ' ') },
        { label: 'Acrocentric', value: vals.is_acrocentric === 'yes' ? 'Yes' : 'No' },
        { label: 'Best Estimate', value: `${riskBest.toFixed(1)}%` },
        { label: 'Range', value: `${riskLow}% - ${riskHigh}%` },
        { label: 'Prenatal Diagnosis', value: prenatalRec }
      ]
    }
  }
}