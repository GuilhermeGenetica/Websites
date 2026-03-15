export default {
  id: 'qtc',
  name: 'Corrected QT Interval (QTc)',
  shortDescription: 'Heart rate-corrected QT interval using Bazett, Fridericia, and Framingham formulas',
  system: 'cardiovascular',
  specialty: ['Cardiology', 'Emergency Medicine', 'Internal Medicine', 'Pharmacology'],
  tags: ['QTc', 'QT interval', 'ECG', 'arrhythmia', 'long QT', 'torsades', 'Bazett'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Bazett HC / Fridericia LS',
  creatorYear: '1920 / 1920',
  description: 'The corrected QT interval (QTc) adjusts the measured QT interval for heart rate, enabling comparison across different heart rates. Prolonged QTc is associated with increased risk of torsades de pointes (TdP) and sudden cardiac death. Multiple correction formulas exist; Bazett is most commonly used but overestimates at high HR and underestimates at low HR. Fridericia is preferred at extreme heart rates.',
  whyUse: 'Identifies patients at risk for torsades de pointes and sudden death. Guides drug safety monitoring (many drugs prolong QT). Essential for evaluating inherited long QT syndromes.',
  whenToUse: [
    'ECG interpretation when QT prolongation is suspected',
    'Monitoring QT-prolonging medications (antiarrhythmics, antipsychotics, antibiotics)',
    'Evaluation of syncope or unexplained cardiac arrest',
    'Screening for inherited long QT syndrome',
  ],
  nextSteps: 'QTc > 500 ms: High risk for TdP — review medications, correct electrolytes (K⁺, Mg²⁺), cardiology consult. QTc 450-500 ms (male) or 460-500 ms (female): Monitor closely, avoid additional QT-prolonging agents.',
  pearls: [
    'Normal QTc: < 450 ms (males), < 460 ms (females).',
    'Bazett formula overestimates QTc at HR > 100 and underestimates at HR < 60.',
    'Fridericia is recommended for HR < 60 or > 100 bpm.',
    'Always correct K⁺ and Mg²⁺ before attributing QT prolongation to medications.',
    'QTc > 500 ms or increase > 60 ms from baseline is considered high risk for TdP.',
    'Common QT-prolonging drugs: haloperidol, ondansetron, fluoroquinolones, methadone, amiodarone.',
  ],
  evidence: 'Bazett formula published 1920, remains the most commonly used despite known limitations. Fridericia (1920) shown to be more accurate at extreme heart rates. AHA/ACC/HRS 2017 guidelines recommend QTc monitoring with QT-prolonging drugs.',
  formula: 'RR interval = 60 / HR\nBazett: QTc = QT / √(RR)\nFridericia: QTc = QT / ∛(RR)\nFramingham: QTc = QT + 0.154 × (1 - RR)\n(QT in ms, RR in seconds)',
  references: [
    { text: 'Bazett HC. An analysis of the time-relations of electrocardiograms. Heart. 1920;7:353-370.', url: 'https://scholar.google.com/scholar?q=Bazett+analysis+time+relations+electrocardiograms' },
    { text: 'Drew BJ et al. Prevention of Torsade de Pointes in Hospital Settings. AHA/ACCF Scientific Statement. Circulation. 2010;121(8):1047-1060.', url: 'https://pubmed.ncbi.nlm.nih.gov/20185054/' },
  ],
  links: [
    { title: 'MDCalc — QTc Calculator', url: 'https://www.mdcalc.com/calc/48/corrected-qt-interval-qtc', description: 'Interactive QTc calculator' },
  ],
  interpretations: [
    { range: '<440', label: 'Normal QTc', action: 'No action needed' },
    { range: '440-469', label: 'Borderline prolonged', action: 'Monitor if on QT-prolonging medications; check electrolytes' },
    { range: '470-499', label: 'Prolonged', action: 'Review medications; correct K⁺ and Mg²⁺; avoid additional QT-prolonging drugs' },
    { range: '≥500', label: 'Significantly prolonged — high TdP risk', action: 'Discontinue offending drugs; correct electrolytes urgently; cardiology consult; continuous monitoring' },
  ],
  fields: [
    { key: 'qt', label: 'QT Interval', type: 'number', min: 100, max: 800, step: 1, placeholder: 'ms', hint: 'milliseconds' },
    { key: 'hr', label: 'Heart Rate', type: 'number', min: 20, max: 250, step: 1, placeholder: 'bpm', hint: 'beats per minute' },
  ],
  calculate: (vals) => {
    const qt = parseFloat(vals.qt)
    const hr = parseFloat(vals.hr)
    if (!qt || !hr || hr <= 0) return null
    const rr = 60 / hr
    const bazett = qt / Math.sqrt(rr)
    const fridericia = qt / Math.cbrt(rr)
    const framingham = qt + 154 * (1 - rr)
    const primary = Math.round(bazett)
    let interp = ''
    if (primary < 440) interp = 'Normal QTc'
    else if (primary < 470) interp = 'Borderline prolonged'
    else if (primary < 500) interp = 'Prolonged QTc'
    else interp = 'Significantly prolonged — high risk for torsades de pointes'
    return {
      result: String(primary),
      unit: 'ms (Bazett)',
      interpretation: interp,
      detail: `QT: ${qt} ms, HR: ${hr} bpm, RR: ${rr.toFixed(3)} s`,
      breakdown: [
        { label: 'Bazett QTc', value: `${Math.round(bazett)} ms` },
        { label: 'Fridericia QTc', value: `${Math.round(fridericia)} ms` },
        { label: 'Framingham QTc', value: `${Math.round(framingham)} ms` },
      ],
    }
  },
}
