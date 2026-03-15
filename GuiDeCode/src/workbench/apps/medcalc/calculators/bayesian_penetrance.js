export default {
  id: 'bayesian_penetrance',
  name: 'Bayesian Conditional Risk (Age-Adjusted Penetrance)',
  shortDescription: 'Adjusts prior genetic risk downward based on age-specific penetrance in asymptomatic individuals',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Neurology', 'Oncology'],
  tags: ['Bayes', 'penetrance', 'conditional risk', 'Huntington', 'BRCA', 'pedigree', 'late-onset', 'AD', 'posterior probability'],
  version: '2.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Thomas Bayes (Applied to Clinical Genetics)',
  creatorYear: '1763',
  description: 'In autosomal dominant late-onset disorders, the a priori risk of inheriting the pathogenic variant (typically 50% from an affected parent) decreases progressively as the at-risk individual remains asymptomatic at ages when affected mutation carriers typically develop symptoms. This phenomenon is formalized using Bayes theorem: the prior (genetic) probability is conditioned on the observation that the patient is currently unaffected — a piece of clinical information that carries significant probabilistic weight. The result is a personalized "posterior" (a posteriori) risk that is lower than the prior, sometimes dramatically so in elderly asymptomatic individuals at risk for diseases with early or near-complete penetrance.',
  whyUse: 'Provides individualized risk estimates for pre-symptomatic counseling without predictive genetic testing. Allows meaningful quantification of reduced risk, which may alleviate anxiety and guide decisions about whether predictive testing is desired. Particularly powerful for counseling intervening relatives (e.g., at-risk sibling of an affected parent) and pedigrees with obligate carriers who died asymptomatic.',
  whenToUse: [
    'Asymptomatic adult child of a parent with a confirmed late-onset autosomal dominant condition (HD, SCA, FALS, Lynch syndrome, FAP, BRCA, HNPCC, etc.)',
    'Calculating residual risk for an at-risk individual whose intervening relative (between proband and patient) died asymptomatic at advanced age',
    'Pedigree analysis where multiple unaffected relatives can cumulatively lower a posterior risk across a pedigree',
    'Pre-counseling before offering formal predictive testing protocol',
  ],
  nextSteps: 'Use the posterior risk to guide the genetic counseling session. A significantly reduced posterior probability may reassure the patient and reduce urgency for predictive testing, though testing can still be offered if desired. Note: predictive testing protocols (e.g., for HD, FAP) involve multi-session counseling with psychological support regardless of posterior risk level.',
  pearls: [
    'Classic application: HD (100% penetrance). An at-risk individual aged 60 with no symptoms has substantial risk reduction — penetrance by age 60 is ~60-70%, dropping posterior risk from 50% to ~22-28%.',
    'Penetrance curves are age- and gene-specific: use published tables for each condition (e.g., HD, BRCA1/2, FAP, Lynch).',
    'The model assumes 0% phenocopy rate — people without the mutation do not develop identical symptoms. For common diseases (e.g., common breast cancer, dementia), phenocopies may inflate apparent penetrance, making this model less conservative.',
    'Multiple asymptomatic relatives can be combined as sequential Bayesian updates (use posterior of one as prior for the next).',
    'A prior of 25% (e.g., grandchild of affected, parent asymptomatic and untested) is equally valid as input.',
    'This calculation becomes irrelevant once the patient undergoes predictive genetic testing — then genetic status is known directly.',
  ],
  evidence: 'Fundamental application of Bayesian statistics in clinical genetics. Universally recommended by ACMG and medical genetics training programs for pedigree analysis of late-onset autosomal dominant conditions. Described in all major clinical genetics textbooks. Specific penetrance data for HD from the COHORT study (2012) and PREDICT-HD study; for BRCA1/2 from Antoniou et al. (2003), Kuchenbaecker et al. (2017).',
  formula: 'Prior(Mutation) = p  (e.g., 0.50 for offspring of affected)\nPrior(No Mutation) = 1 − p\n\nConditional(Asymptomatic | Mutation)    = 1 − penetrance\nConditional(Asymptomatic | No Mutation) = 1.0 (no phenocopies assumed)\n\nJoint(Mutation)    = p × (1 − penetrance)\nJoint(No Mutation) = (1 − p) × 1\n\nPosterior(Mutation | Asymptomatic) = Joint(Mutation) / [Joint(Mutation) + Joint(No Mutation)]',
  references: [
    { text: 'Young ID. Introduction to Risk Calculation in Genetic Counselling. 3rd ed. Oxford University Press; 2007.' },
    { text: 'Langbehn DR et al. A new model for prediction of the age of onset and penetrance for Huntington\'s disease based on CAG length. Clin Genet. 2004;65(4):267-277.', url: 'https://pubmed.ncbi.nlm.nih.gov/15025718/' },
    { text: 'Kuchenbaecker KB et al. Risks of Breast, Ovarian, and Contralateral Breast Cancer for BRCA1 and BRCA2 Mutation Carriers. JAMA. 2017;317(23):2402-2416.', url: 'https://pubmed.ncbi.nlm.nih.gov/28632866/' },
  ],
  links: [
    { title: 'HDSA — Huntington\'s Disease Penetrance Data', url: 'https://hdsa.org/', description: 'Huntington\'s Disease Society of America — clinical resources' },
    { title: 'OMIM — Gene-Specific Penetrance Tables', url: 'https://omim.org/', description: 'Online Mendelian Inheritance in Man — penetrance data by gene' },
  ],
  interpretations: [
    { range: '0-9', label: 'Significantly Reduced (< 10%)', action: 'Strongly reassuring. Risk approaches general population level. Predictive testing may still be offered if desired.' },
    { range: '10-19', label: 'Moderately Reduced (10–19%)', action: 'Meaningful risk reduction from prior. Still clinically significant depending on the condition. Offer predictive testing protocol.' },
    { range: '20-29', label: 'Mildly Reduced (20–29%)', action: 'Risk has decreased from prior. Predictive testing protocol should be offered.' },
    { range: '30-49', label: 'Modestly Reduced (30–49%)', action: 'Limited reduction from prior. Patient remains at substantial risk. Discuss predictive testing.' },
    { range: '50-100', label: 'Minimal Reduction (≥ 50%)', action: 'Little or no benefit from conditioning — penetrance at current age may be low. Revisit at older ages.' },
  ],
  fields: [
    {
      key: 'prior_risk',
      label: 'Prior Risk of Carrying the Mutation (%)',
      type: 'number', min: 0.1, max: 100, step: 0.1, placeholder: 'e.g., 50',
      hint: 'Typically 50% for offspring of an affected parent with AD condition; 25% for grandchild if parent untested',
    },
    {
      key: 'penetrance',
      label: 'Disease Penetrance at Patient\'s Current Age (%)',
      type: 'number', min: 0.1, max: 99.9, step: 0.5, placeholder: 'e.g., 65',
      hint: 'Proportion of confirmed mutation carriers who would be symptomatic by this age. Consult published penetrance curves for the specific gene.',
    },
  ],
  calculate: (vals) => {
    const priorPct = parseFloat(vals.prior_risk)
    const penPct = parseFloat(vals.penetrance)
    if (isNaN(priorPct) || isNaN(penPct)) return null
    if (priorPct <= 0 || priorPct > 100 || penPct <= 0 || penPct >= 100) return null

    const prior = priorPct / 100
    const penetrance = penPct / 100

    const condMut = 1 - penetrance
    const condNoMut = 1.0

    const jointMut = prior * condMut
    const jointNoMut = (1 - prior) * condNoMut
    const totalProb = jointMut + jointNoMut

    if (totalProb === 0) {
      return {
        result: '0%',
        unit: 'Posterior Risk',
        interpretation: 'Full penetrance at 100% with prior of 100% — deterministic scenario.',
        detail: 'With 100% penetrance, an asymptomatic individual cannot carry the mutation.',
        breakdown: [],
      }
    }

    const posterior = jointMut / totalProb
    const posteriorPct = (posterior * 100).toFixed(1)
    const reductionAbs = (priorPct - posterior * 100).toFixed(1)
    const reductionRel = (((prior - posterior) / prior) * 100).toFixed(0)

    let interp = ''
    if (posterior < 0.10) interp = 'Significantly Reduced Risk (< 10%) — approaches general population level for many conditions.'
    else if (posterior < 0.20) interp = 'Moderately Reduced Risk (10–19%) — meaningful but still clinically significant.'
    else if (posterior < 0.30) interp = 'Mildly Reduced Risk (20–29%) — some benefit from conditioning; patient remains at notable risk.'
    else if (posterior < 0.50) interp = 'Modest Reduction (30–49%) — limited benefit from current age; re-assess at older ages.'
    else interp = 'Minimal Reduction — penetrance at current age is low; conditioning provides little information yet.'

    return {
      result: `${posteriorPct}%`,
      unit: 'Posterior (Adjusted) Risk',
      interpretation: interp,
      detail: `Because this patient remains asymptomatic at an age when ${penPct}% of mutation carriers would show symptoms, their risk has been reduced from ${priorPct}% to ${posteriorPct}% — an absolute reduction of ${reductionAbs}% (${reductionRel}% relative reduction).`,
      breakdown: [
        { label: 'A Priori Risk', value: `${priorPct}%` },
        { label: 'Penetrance at Current Age', value: `${penPct}%` },
        { label: 'P(Asymptomatic | Mutation)', value: `${(condMut * 100).toFixed(1)}%` },
        { label: 'P(Asymptomatic | No Mutation)', value: '100%' },
        { label: 'Joint Probability — Has Mutation', value: jointMut.toFixed(5) },
        { label: 'Joint Probability — No Mutation', value: jointNoMut.toFixed(5) },
        { label: 'A Posteriori Risk', value: `${posteriorPct}%` },
        { label: 'Absolute Risk Reduction', value: `${reductionAbs}%` },
        { label: 'Relative Risk Reduction', value: `${reductionRel}%` },
      ],
    }
  },
}
