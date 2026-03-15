export default {
  id: 'acmg_2015',
  name: 'ACMG-AMP 2015 Variant Pathogenicity Classifier',
  shortDescription: 'Standardized 5-tier classification of sequence variants per ACMG/AMP 2015 guidelines with VUS sub-classification',
  system: 'genetics',
  specialty: ['Clinical Genetics', 'Oncology', 'Pathology', 'Laboratory Genetics'],
  tags: ['ACMG', 'AMP', 'variants', 'pathogenic', 'benign', 'VUS', 'sequencing', 'classification', 'SNV', 'indel', 'CMV', 'ClinGen', 'SVI'],
  version: '3.0.0',
  updatedAt: '2026-03-02',
  creatorName: 'Richards S et al. (ACMG/AMP Joint Working Group)',
  creatorYear: '2015',
  description: 'The ACMG-AMP 2015 guidelines provide the global standard framework for classifying sequence variants (SNVs and small indels) into five tiers: Pathogenic (P), Likely Pathogenic (LP), Variant of Uncertain Significance (VUS), Likely Benign (LB), or Benign (B). The classification combines evidence from four domains: (1) Population Data — allele frequency in control databases (gnomAD/ExAC/1000G); (2) Computational/Predictive Data — in silico tools and conservation; (3) Functional Data — biochemical or cell-based assays; (4) Segregation/Observational Data — co-segregation in families and co-occurrence with other variants. Each evidence item is weighted by strength: Very Strong (PVS), Strong (PS/BS), Moderate (PM), Supporting (PP/BP), or Stand-alone (BA). This enhanced version includes Clinically Meaningful Variant (CMV) sub-classification of VUS into VUS-Favor Pathogenic (Hot VUS), VUS (Indeterminate), and VUS-Favor Benign (Cold VUS), per ClinGen SVI recommendations and Bayesian point-based refinements (Tavtigian et al. 2018). The CMV layer provides a finer-grained triage of VUS variants for clinical follow-up prioritization.',
  whyUse: 'The universal gold standard for variant interpretation in diagnostic and research molecular genetics. Ensures consistent, reproducible classification across laboratories and clinicians. Required by CAP, CLIA, and ISO 15189 accreditation. Accepted by insurance payers and clinical actionability frameworks. The CMV sub-classification helps laboratories and clinicians prioritize VUS variants for re-analysis and family follow-up.',
  whenToUse: [
    'Evaluating a novel or rare variant identified on clinical sequencing (WES, WGS, gene panel)',
    'Re-evaluating a historic VUS in light of new functional data, population data, or segregation evidence',
    'Classifying variants during family cascade testing after identification of a likely pathogenic variant',
    'Determining actionability of secondary/incidental findings per ACMG SF v3.2 list',
    'Laboratory classification meetings and multidisciplinary variant review',
    'Prioritizing VUS variants for re-contact or periodic re-review using CMV sub-classification',
  ],
  nextSteps: 'Pathogenic / Likely Pathogenic: Use for clinical decision-making, cascade family testing, and management per gene-specific guidelines. VUS-Favor Pathogenic (Hot VUS): Consider as a strong candidate for additional investigations — functional studies, segregation analysis, or re-review in 6–12 months. Do NOT use for predictive testing in relatives. VUS (Indeterminate): Do NOT use for clinical decision-making. Do NOT offer predictive testing to relatives. File for periodic re-review. VUS-Favor Benign (Cold VUS): Low priority for re-review; unlikely to be reclassified as pathogenic. Likely Benign / Benign: Do NOT use for clinical decision-making. Consider reporting as "not contributory."',
  pearls: [
    'BA1 (allele frequency > 5% in gnomAD) is a stand-alone rule that OVERRIDES nearly all pathogenic criteria for rare Mendelian diseases. Always check gnomAD first.',
    'PVS1 (null variant) requires that Loss-of-Function is the established disease mechanism for that gene. Do not apply to dominant-negative genes (e.g., COL1A1 structural domains).',
    'PM2 (absent/ultra-rare in gnomAD) is one of the most commonly applied criteria — but gnomAD v4 has population-specific subsets; use appropriate ancestry-matched population.',
    'A VUS is not a negative result — it means "insufficient or conflicting evidence." It is the DEFAULT classification when criteria do not clearly tip toward P/LP or B/LB.',
    'Conflicting evidence (e.g., one P criterion AND one B criterion met) automatically results in VUS regardless of additional evidence on either side.',
    'PP5/BP6 (reports from databases like ClinVar without underlying evidence) carry reduced weight per updated SVI recommendations (2020 ClinGen SVI guidance). Some expert panels now recommend NOT applying PP5/BP6 at all.',
    'Revised ClinGen SVI framework (2019–2024) provides refined rules for many criteria — this tool implements the original 2015 framework with Bayesian point-based extensions.',
    'PS2/PM6 (de novo) requires careful verification: PS2 requires confirmed maternity AND paternity via molecular methods.',
    'The Bayesian point-based system (Tavtigian et al. 2018) assigns: PVS = 8 pts, PS = 4 pts, PM = 2 pts, PP = 1 pt, BS = -4 pts, BP = -1 pt, BA = stand-alone benign. Total ≥10 = Pathogenic, 6–9 = Likely Pathogenic, 0–5 = VUS, -1 to -6 = Likely Benign, ≤-7 = Benign.',
    'CMV sub-classification: VUS-Favor Pathogenic = Bayesian points 4–5; VUS Indeterminate = points 1–3; VUS-Favor Benign = points 0 or negative (but not meeting LB/B threshold).',
  ],
  evidence: 'Richards S et al. Standards and guidelines for the interpretation of sequence variants: a joint consensus recommendation of the American College of Medical Genetics and Genomics and the Association for Molecular Pathology. Genet Med. 2015;17(5):405-424. Tavtigian SV et al. Modeling the ACMG/AMP variant classification guidelines as a Bayesian classification framework. Genet Med. 2018;20(9):1054-1060. ClinGen SVI Working Group ongoing refinements (2019–2024). Bayesian point-based system adopted by multiple ClinGen Variant Curation Expert Panels (VCEPs).',
  formula: 'PATHOGENIC requires (any one of):\n  ≥1 PVS + ≥1 PS or ≥2 PM or (1 PM + ≥1 PP) or ≥2 PP\n  ≥2 PS\n  1 PS + (≥3 PM or [2 PM + ≥2 PP] or [1 PM + ≥4 PP])\n\nLIKELY PATHOGENIC requires (any one of):\n  1 PVS + 1 PM\n  1 PS + (1–2 PM)\n  1 PS + ≥2 PP\n  ≥3 PM\n  2 PM + ≥2 PP\n  1 PM + ≥4 PP\n\nBENIGN requires:\n  ≥1 BA, OR ≥2 BS\n\nLIKELY BENIGN requires:\n  1 BS + 1 BP, OR ≥2 BP\n\nCONFLICT → VUS (default when evidence is insufficient or contradictory)\n\nBAYESIAN POINT SYSTEM (Tavtigian et al. 2018):\n  PVS1 = 8 pts, PS = 4 pts each, PM = 2 pts each, PP = 1 pt each\n  BA1 = stand-alone benign, BS = -4 pts each, BP = -1 pt each\n  Pathogenic ≥ 10 | Likely Path 6–9 | VUS-FP 4–5 | VUS 1–3 | VUS-FB 0 | Likely Benign -1 to -6 | Benign ≤ -7',
  references: [
    { text: 'Richards S et al. Standards and guidelines for the interpretation of sequence variants. Genet Med. 2015;17(5):405-424.', url: 'https://pubmed.ncbi.nlm.nih.gov/25741868/' },
    { text: 'Tavtigian SV et al. Modeling the ACMG/AMP variant classification guidelines as a Bayesian classification framework. Genet Med. 2018;20(9):1054-1060.', url: 'https://pubmed.ncbi.nlm.nih.gov/29300385/' },
    { text: 'Biesecker LG, Harrison SM. The ACMG/AMP reputable source criteria for the interpretation of sequence variants. Genet Med. 2018;20(12):1687-1688.', url: 'https://pubmed.ncbi.nlm.nih.gov/29300386/' },
    { text: 'Pejaver V et al. Calibration of computational tools for missense variant pathogenicity classification and ClinGen recommendations for PP3/BP4 criteria. Am J Hum Genet. 2022;109(12):2163-2177.', url: 'https://pubmed.ncbi.nlm.nih.gov/36413997/' },
    { text: 'ClinGen SVI Recommendation for de novo Criteria (PS2/PM6). 2019.', url: 'https://clinicalgenome.org/working-groups/sequence-variant-interpretation/' },
  ],
  links: [
    { title: 'ClinGen SVI — Variant Classification Resources', url: 'https://clinicalgenome.org/working-groups/sequence-variant-interpretation/', description: 'ClinGen Sequence Variant Interpretation Working Group guidelines and refinements' },
    { title: 'ClinVar — Public Variant Database', url: 'https://www.ncbi.nlm.nih.gov/clinvar/', description: 'NCBI ClinVar for public variant submissions and classifications' },
    { title: 'gnomAD — Population Allele Frequencies', url: 'https://gnomad.broadinstitute.org/', description: 'Essential for PM2 / BA1 / BS1 criteria evaluation' },
    { title: 'Intervar — Automated ACMG Classification', url: 'http://wintervar.wglab.org/', description: 'Automated variant interpretation tool implementing ACMG guidelines' },
    { title: 'ClinGen Bayesian Calculator', url: 'https://www.cardiodb.org/clingen/', description: 'Bayesian point-based calculator for ACMG evidence combination' },
  ],
  interpretations: [
    { range: 'Pathogenic', label: 'Pathogenic (P)', action: 'Use for clinical decision-making. Cascade family testing indicated. Condition-specific management guidelines apply.' },
    { range: 'Likely Pathogenic', label: 'Likely Pathogenic (LP)', action: 'Use for clinical decision-making (with transparency about classification). Treat as pathogenic for most clinical purposes.' },
    { range: 'VUS-Favor Pathogenic', label: 'VUS — Favor Pathogenic (Hot VUS / CMV)', action: 'Strong candidate for additional investigation (functional studies, segregation, re-review in 6-12 months). Do NOT use for predictive testing.' },
    { range: 'VUS', label: 'VUS — Indeterminate', action: 'Do NOT use for clinical decision-making. Do NOT offer predictive family testing. Schedule periodic re-review.' },
    { range: 'VUS-Favor Benign', label: 'VUS — Favor Benign (Cold VUS)', action: 'Low priority for re-review. Unlikely to be reclassified as pathogenic. Not for clinical decision-making.' },
    { range: 'Likely Benign', label: 'Likely Benign (LB)', action: 'Not contributory to disease causation. Report as clinically non-significant for this condition.' },
    { range: 'Benign', label: 'Benign (B)', action: 'Benign polymorphism. Report as clinically non-significant.' },
  ],
  fields: [
    { key: 'pvs1', label: 'PVS1 — Null variant (nonsense, frameshift, canonical ±1 or 2 splice sites, initiation codon, single/multi-exon deletion) in a gene where LOF is a known mechanism of disease', type: 'checkbox', checkboxLabel: 'PVS1 — Very Strong Pathogenic (8 pts)', required: false },
    { key: 'ps1', label: 'PS1 — Same amino acid change as a previously established pathogenic variant regardless of nucleotide change', type: 'checkbox', checkboxLabel: 'PS1 — Strong Pathogenic (4 pts)', required: false },
    { key: 'ps2', label: 'PS2 — De novo (both maternity and paternity confirmed) in a patient with the disease and no family history', type: 'checkbox', checkboxLabel: 'PS2 — Strong Pathogenic (4 pts)', required: false },
    { key: 'ps3', label: 'PS3 — Well-established in vitro or in vivo functional studies supportive of a damaging effect on the gene or gene product', type: 'checkbox', checkboxLabel: 'PS3 — Strong Pathogenic (4 pts)', required: false },
    { key: 'ps4', label: 'PS4 — Prevalence of the variant in affected individuals is significantly increased compared with controls (OR > 5 with CI not overlapping 1)', type: 'checkbox', checkboxLabel: 'PS4 — Strong Pathogenic (4 pts)', required: false },
    { key: 'pm1', label: 'PM1 — Located in a mutational hot spot and/or critical and well-established functional domain (e.g., active site) without benign variation', type: 'checkbox', checkboxLabel: 'PM1 — Moderate Pathogenic (2 pts)', required: false },
    { key: 'pm2', label: 'PM2 — Absent from controls or at extremely low frequency in gnomAD/ExAC for recessive disorders', type: 'checkbox', checkboxLabel: 'PM2 — Moderate Pathogenic (2 pts)', required: false },
    { key: 'pm3', label: 'PM3 — For recessive disorders: detected in trans with a pathogenic variant (phase confirmed)', type: 'checkbox', checkboxLabel: 'PM3 — Moderate Pathogenic (2 pts)', required: false },
    { key: 'pm4', label: 'PM4 — Protein length change due to in-frame deletions/insertions in a non-repeat region, or stop-loss variants', type: 'checkbox', checkboxLabel: 'PM4 — Moderate Pathogenic (2 pts)', required: false },
    { key: 'pm5', label: 'PM5 — Novel missense change at an amino acid residue where a different missense variant is established as pathogenic', type: 'checkbox', checkboxLabel: 'PM5 — Moderate Pathogenic (2 pts)', required: false },
    { key: 'pm6', label: 'PM6 — Assumed de novo (maternity and/or paternity NOT confirmed)', type: 'checkbox', checkboxLabel: 'PM6 — Moderate Pathogenic (2 pts)', required: false },
    { key: 'pp1', label: 'PP1 — Co-segregation with disease in multiple affected family members in a gene definitively known to cause the disease', type: 'checkbox', checkboxLabel: 'PP1 — Supporting Pathogenic (1 pt)', required: false },
    { key: 'pp2', label: 'PP2 — Missense variant in a gene with low rate of benign missense variation and where missense variants are a common disease mechanism', type: 'checkbox', checkboxLabel: 'PP2 — Supporting Pathogenic (1 pt)', required: false },
    { key: 'pp3', label: 'PP3 — Multiple lines of computational evidence support a deleterious effect (conservation, evolutionary, splicing impact)', type: 'checkbox', checkboxLabel: 'PP3 — Supporting Pathogenic (1 pt)', required: false },
    { key: 'pp4', label: 'PP4 — Patient\'s phenotype or family history is highly specific for a disease with a single genetic etiology', type: 'checkbox', checkboxLabel: 'PP4 — Supporting Pathogenic (1 pt)', required: false },
    { key: 'pp5', label: 'PP5 — Reputable source recently reports variant as pathogenic, but evidence is not available to the laboratory to independently evaluate (reduced weight per SVI 2020)', type: 'checkbox', checkboxLabel: 'PP5 — Supporting Pathogenic (1 pt)', required: false },
    { key: 'ba1', label: 'BA1 — Allele frequency > 5% in ExAC, 1000 Genomes, or gnomAD (stand-alone benign; overrides most pathogenic evidence)', type: 'checkbox', checkboxLabel: 'BA1 — Stand-Alone Benign', required: false },
    { key: 'bs1', label: 'BS1 — Allele frequency greater than expected for the disorder (disease-specific threshold, not 5%)', type: 'checkbox', checkboxLabel: 'BS1 — Strong Benign (-4 pts)', required: false },
    { key: 'bs2', label: 'BS2 — Observed in a healthy adult for a recessive (homozygous), dominant (heterozygous with full penetrance), or X-linked (hemizygous male) disorder', type: 'checkbox', checkboxLabel: 'BS2 — Strong Benign (-4 pts)', required: false },
    { key: 'bs3', label: 'BS3 — Well-established in vitro or in vivo functional studies show no damaging effect on protein function or splicing', type: 'checkbox', checkboxLabel: 'BS3 — Strong Benign (-4 pts)', required: false },
    { key: 'bs4', label: 'BS4 — Lack of segregation in affected members of a family (variant present in obligate unaffected carriers)', type: 'checkbox', checkboxLabel: 'BS4 — Strong Benign (-4 pts)', required: false },
    { key: 'bp1', label: 'BP1 — Missense variant in a gene for which primarily truncating variants cause disease (missense not a disease mechanism)', type: 'checkbox', checkboxLabel: 'BP1 — Supporting Benign (-1 pt)', required: false },
    { key: 'bp2', label: 'BP2 — Observed in trans with pathogenic variant for fully penetrant dominant disorder, or in cis with pathogenic variant in any inheritance pattern', type: 'checkbox', checkboxLabel: 'BP2 — Supporting Benign (-1 pt)', required: false },
    { key: 'bp3', label: 'BP3 — In-frame deletions/insertions in a repetitive region without known function', type: 'checkbox', checkboxLabel: 'BP3 — Supporting Benign (-1 pt)', required: false },
    { key: 'bp4', label: 'BP4 — Multiple lines of computational evidence suggest no impact on gene or gene product (conservation, splicing, missense tools)', type: 'checkbox', checkboxLabel: 'BP4 — Supporting Benign (-1 pt)', required: false },
    { key: 'bp5', label: 'BP5 — Variant found in a case with an alternate molecular basis for disease fully explaining the phenotype', type: 'checkbox', checkboxLabel: 'BP5 — Supporting Benign (-1 pt)', required: false },
    { key: 'bp6', label: 'BP6 — Reputable source recently reports variant as benign, but evidence not available to independent laboratory evaluation (reduced weight per SVI 2020)', type: 'checkbox', checkboxLabel: 'BP6 — Supporting Benign (-1 pt)', required: false },
    { key: 'bp7', label: 'BP7 — Synonymous variant for which splicing prediction algorithms predict no impact on splice consensus sequence nor creation of new splice site', type: 'checkbox', checkboxLabel: 'BP7 — Supporting Benign (-1 pt)', required: false },
  ],
  calculate: (vals) => {
    const pvs = vals.pvs1 ? 1 : 0
    const ps = [vals.ps1, vals.ps2, vals.ps3, vals.ps4].filter(Boolean).length
    const pm = [vals.pm1, vals.pm2, vals.pm3, vals.pm4, vals.pm5, vals.pm6].filter(Boolean).length
    const pp = [vals.pp1, vals.pp2, vals.pp3, vals.pp4, vals.pp5].filter(Boolean).length

    const ba = vals.ba1 ? 1 : 0
    const bs = [vals.bs1, vals.bs2, vals.bs3, vals.bs4].filter(Boolean).length
    const bp = [vals.bp1, vals.bp2, vals.bp3, vals.bp4, vals.bp5, vals.bp6, vals.bp7].filter(Boolean).length

    const bayesianPoints = (pvs * 8) + (ps * 4) + (pm * 2) + (pp * 1) + (bs * -4) + (bp * -1)

    if (pvs === 0 && ps === 0 && pm === 0 && pp === 0 && ba === 0 && bs === 0 && bp === 0) {
      return {
        result: 'Variant of Uncertain Significance (VUS)',
        unit: '',
        interpretation: 'No criteria selected. Insufficient evidence to classify — default classification is VUS (Indeterminate). Bayesian points: 0.',
        detail: 'Select applicable evidence criteria above. Each criterion requires careful evaluation of the specific variant and gene context. A VUS should be periodically re-reviewed as new evidence emerges.\n\nBayesian Point Total: 0\nCMV Sub-classification: VUS — Indeterminate (no evidence applied)',
        breakdown: [
          { label: 'Pathogenic Evidence', value: 'PVS:0 | PS:0 | PM:0 | PP:0' },
          { label: 'Benign Evidence', value: 'BA:0 | BS:0 | BP:0' },
          { label: 'Bayesian Points', value: '0' },
          { label: 'CMV Sub-class', value: 'Indeterminate (no data)' },
        ],
      }
    }

    let isPathogenic = false
    let isLikelyPathogenic = false
    let isBenign = false
    let isLikelyBenign = false

    if (
      (pvs >= 1 && (ps >= 1 || pm >= 2 || (pm >= 1 && pp >= 1) || pp >= 2)) ||
      ps >= 2 ||
      (ps === 1 && pm >= 3) ||
      (ps === 1 && pm === 2 && pp >= 2) ||
      (ps === 1 && pm === 1 && pp >= 4)
    ) {
      isPathogenic = true
    }

    if (!isPathogenic && (
      (pvs === 1 && pm === 1) ||
      (ps === 1 && (pm === 1 || pm === 2)) ||
      (ps === 1 && pp >= 2) ||
      pm >= 3 ||
      (pm === 2 && pp >= 2) ||
      (pm === 1 && pp >= 4)
    )) {
      isLikelyPathogenic = true
    }

    if (ba >= 1 || bs >= 2) {
      isBenign = true
    }

    if (!isBenign && ((bs === 1 && bp >= 1) || bp >= 2)) {
      isLikelyBenign = true
    }

    let resultName = ''
    let hasConflict = false
    let cmvSubclass = ''

    if ((isPathogenic || isLikelyPathogenic) && (isBenign || isLikelyBenign)) {
      resultName = 'Variant of Uncertain Significance (VUS)'
      hasConflict = true
      cmvSubclass = 'Conflicting Evidence (review required)'
    } else if (isPathogenic) {
      resultName = 'Pathogenic'
      cmvSubclass = 'N/A (classified P)'
    } else if (isLikelyPathogenic) {
      resultName = 'Likely Pathogenic'
      cmvSubclass = 'N/A (classified LP)'
    } else if (isBenign) {
      resultName = 'Benign'
      cmvSubclass = 'N/A (classified B)'
    } else if (isLikelyBenign) {
      resultName = 'Likely Benign'
      cmvSubclass = 'N/A (classified LB)'
    } else {
      resultName = 'Variant of Uncertain Significance (VUS)'
      if (bayesianPoints >= 6) {
        cmvSubclass = 'VUS — Favor Pathogenic (Hot VUS)'
      } else if (bayesianPoints >= 4) {
        cmvSubclass = 'VUS — Favor Pathogenic (Hot VUS)'
      } else if (bayesianPoints >= 1) {
        cmvSubclass = 'VUS — Indeterminate (Warm VUS)'
      } else if (bayesianPoints === 0) {
        cmvSubclass = 'VUS — Indeterminate'
      } else if (bayesianPoints >= -1) {
        cmvSubclass = 'VUS — Favor Benign (Cold VUS)'
      } else {
        cmvSubclass = 'VUS — Favor Benign (Cold VUS)'
      }
    }

    let interp = ''
    if (resultName === 'Pathogenic') interp = 'Criteria fulfilled for PATHOGENIC classification. Suitable for clinical decision-making.'
    else if (resultName === 'Likely Pathogenic') interp = 'Criteria fulfilled for LIKELY PATHOGENIC classification. Treat as pathogenic for most clinical purposes (>90% probability of pathogenicity).'
    else if (resultName === 'Benign') interp = 'Criteria fulfilled for BENIGN classification. Not contributory to disease.'
    else if (resultName === 'Likely Benign') interp = 'Criteria fulfilled for LIKELY BENIGN classification. Not expected to be causative.'
    else if (hasConflict) interp = 'CONFLICTING evidence: criteria satisfied for both pathogenic and benign categories → classified as VUS. Do not use for clinical decision-making. Requires expert review to resolve discrepancies.'
    else interp = `INSUFFICIENT evidence: criteria do not meet threshold for P/LP or B/LB → classified as VUS. CMV sub-classification: ${cmvSubclass}. Schedule for re-review when new evidence emerges.`

    let bayesianClassLabel = ''
    if (ba >= 1) {
      bayesianClassLabel = 'Benign (BA1 stand-alone)'
    } else if (bayesianPoints >= 10) {
      bayesianClassLabel = 'Pathogenic (≥10 pts)'
    } else if (bayesianPoints >= 6) {
      bayesianClassLabel = 'Likely Pathogenic (6–9 pts)'
    } else if (bayesianPoints >= 4) {
      bayesianClassLabel = 'VUS — Favor Pathogenic (4–5 pts)'
    } else if (bayesianPoints >= 1) {
      bayesianClassLabel = 'VUS — Indeterminate (1–3 pts)'
    } else if (bayesianPoints === 0) {
      bayesianClassLabel = 'VUS — Indeterminate (0 pts)'
    } else if (bayesianPoints >= -6) {
      bayesianClassLabel = 'Likely Benign (-1 to -6 pts)'
    } else {
      bayesianClassLabel = 'Benign (≤-7 pts)'
    }

    return {
      result: resultName,
      unit: '',
      interpretation: interp,
      detail: `Pathogenic evidence: PVS=${pvs} (Very Strong, 8pts each), PS=${ps} (Strong, 4pts each), PM=${pm} (Moderate, 2pts each), PP=${pp} (Supporting, 1pt each).\nBenign evidence: BA=${ba} (Stand-alone), BS=${bs} (Strong, -4pts each), BP=${bp} (Supporting, -1pt each).\n\nBayesian Point Total: ${bayesianPoints}\nBayesian Classification: ${bayesianClassLabel}\nCMV Sub-classification: ${cmvSubclass}\n\n${hasConflict ? '⚠ Conflict detected: opposing evidence in both pathogenic and benign domains forces VUS classification per ACMG-AMP 2015 rules. The Bayesian point system may still provide directional guidance — review each criterion carefully.' : ''}${ba >= 1 ? '\n⚠ BA1 applied: Stand-alone benign criterion met. Allele frequency > 5% in population databases overrides most pathogenic evidence for rare Mendelian diseases.' : ''}`,
      breakdown: [
        { label: 'PVS (Very Strong Pathogenic)', value: `${pvs} (${pvs * 8} pts)` },
        { label: 'PS (Strong Pathogenic)', value: `${ps} (${ps * 4} pts)` },
        { label: 'PM (Moderate Pathogenic)', value: `${pm} (${pm * 2} pts)` },
        { label: 'PP (Supporting Pathogenic)', value: `${pp} (${pp * 1} pts)` },
        { label: 'BA (Stand-alone Benign)', value: String(ba) },
        { label: 'BS (Strong Benign)', value: `${bs} (${bs * -4} pts)` },
        { label: 'BP (Supporting Benign)', value: `${bp} (${bp * -1} pts)` },
        { label: 'Bayesian Point Total', value: String(bayesianPoints) },
        { label: 'Bayesian Classification', value: bayesianClassLabel },
        { label: 'ACMG Rule-Based Class', value: resultName },
        { label: 'CMV Sub-classification', value: cmvSubclass },
      ],
    }
  },
}