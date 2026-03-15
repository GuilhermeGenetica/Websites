export default {
  id: 'rass',
  name: 'RASS',
  shortDescription: 'Richmond Agitation-Sedation Scale for ICU sedation assessment',
  system: 'critical_care',
  specialty: ['Critical Care', 'Anesthesia', 'Emergency Medicine'],
  tags: ['RASS', 'sedation', 'agitation', 'ICU', 'ventilator', 'consciousness'],
  version: '1.0.0',
  updatedAt: '2025-06-01',
  creatorName: 'Sessler CN et al.',
  creatorYear: '2002',
  description: 'The Richmond Agitation-Sedation Scale (RASS) is a 10-point scale used to assess the level of sedation and agitation in ICU patients. It ranges from -5 (unarousable) to +4 (combative), with 0 being alert and calm. RASS is used to titrate sedation to target levels and is a prerequisite for delirium assessment with CAM-ICU.',
  whyUse: 'Standard sedation assessment tool in ICUs worldwide. Required before CAM-ICU delirium screening. Guides sedation titration to target levels. Simple, reliable, inter-rater agreement > 0.9.',
  whenToUse: [
    'ICU sedation monitoring (every 2-4 hours, or with medication changes)',
    'Before CAM-ICU delirium assessment (requires RASS ≥ -3)',
    'Sedation titration for mechanically ventilated patients',
    'Assessment of agitation level for safety interventions',
  ],
  nextSteps: 'Target RASS 0 to -2 for most ICU patients (light sedation strategy). RASS +1 to +4: Assess for pain, delirium, hypoxia before increasing sedation. RASS -4 to -5: Hold sedation, daily awakening trial. Perform CAM-ICU when RASS ≥ -3.',
  pearls: [
    'Lighter sedation targets (RASS 0 to -2) are associated with shorter ICU stays and fewer ventilator days.',
    'CAM-ICU can only be performed if RASS ≥ -3 (anything deeper = assessment not possible).',
    'RASS +1 to +4: First assess for REVERSIBLE causes (pain, full bladder, ETT displacement, hypoxia).',
    'Daily sedation interruption (awakening trial) is recommended for most mechanically ventilated patients.',
    'RASS has excellent inter-rater reliability (κ = 0.91-0.94).',
    'Document RASS with every nursing assessment and sedation dose change.',
  ],
  evidence: 'Developed and validated by Sessler et al. (Am J Respir Crit Care Med, 2002). Inter-rater reliability κ > 0.9. Adopted worldwide as primary ICU sedation tool. PAD guidelines (SCCM 2018) recommend light sedation (RASS 0 to -2) for most patients.',
  formula: 'Assessment steps:\n1. Observe patient (30 seconds)\n2. If not alert: call name, ask to open eyes/make eye contact\n3. If no response to voice: physically stimulate (shoulder shake)\nScore from +4 (combative) to -5 (unarousable)',
  references: [
    { text: 'Sessler CN et al. The Richmond Agitation-Sedation Scale. Am J Respir Crit Care Med. 2002;166(10):1338-1344.', url: 'https://pubmed.ncbi.nlm.nih.gov/12421743/' },
    { text: 'Devlin JW et al. Clinical Practice Guidelines for the Prevention and Management of Pain, Agitation/Sedation, Delirium, Immobility, and Sleep Disruption in Adult Patients in the ICU. Crit Care Med. 2018;46(9):e825-e873.', url: 'https://pubmed.ncbi.nlm.nih.gov/30113379/' },
  ],
  links: [
    { title: 'MDCalc — RASS', url: 'https://www.mdcalc.com/calc/1872/richmond-agitation-sedation-scale-rass', description: 'Interactive RASS scale' },
  ],
  interpretations: [
    { range: '-5', label: 'Unarousable', action: 'Hold sedation; daily awakening trial; assess for oversedation or neurological event' },
    { range: '-4', label: 'Deep sedation', action: 'Reduce sedation if not clinically indicated; consider daily awakening trial' },
    { range: '-3', label: 'Moderate sedation', action: 'Minimum level for CAM-ICU assessment; adjust per target' },
    { range: '-2', label: 'Light sedation', action: 'Appropriate target for most ICU patients; perform CAM-ICU' },
    { range: '-1', label: 'Drowsy', action: 'Near-target range; routine monitoring' },
    { range: '0', label: 'Alert and calm', action: 'Ideal state; perform CAM-ICU; assess for extubation readiness' },
    { range: '1-2', label: 'Restless to agitated', action: 'Assess pain, delirium, reversible causes before increasing sedation' },
    { range: '3-4', label: 'Very agitated to combative', action: 'Safety risk; treat underlying cause; consider bolus sedation; physical safety measures' },
  ],
  fields: [
    {
      key: 'rass_score', label: 'Patient observation', type: 'score_picker',
      options: [
        { value: 4, label: '+4 Combative — violent, immediate danger to staff' },
        { value: 3, label: '+3 Very agitated — pulls or removes tubes/catheters, aggressive' },
        { value: 2, label: '+2 Agitated — frequent non-purposeful movement, fights ventilator' },
        { value: 1, label: '+1 Restless — anxious, apprehensive but movements not aggressive' },
        { value: 0, label: '  0 Alert and calm' },
        { value: -1, label: '-1 Drowsy — not fully alert, sustained (>10s) eye opening to voice' },
        { value: -2, label: '-2 Light sedation — briefly (<10s) awakens to voice, eye contact' },
        { value: -3, label: '-3 Moderate sedation — movement or eye opening to voice, no eye contact' },
        { value: -4, label: '-4 Deep sedation — no response to voice, movement to physical stimulation' },
        { value: -5, label: '-5 Unarousable — no response to voice or physical stimulation' },
      ],
    },
  ],
  calculate: (vals) => {
    const score = parseInt(vals.rass_score)
    if (score === undefined || score === null || vals.rass_score === '' || vals.rass_score === null) return null
    const labels = {
      4: 'Combative', 3: 'Very agitated', 2: 'Agitated', 1: 'Restless', 0: 'Alert and calm',
      '-1': 'Drowsy', '-2': 'Light sedation', '-3': 'Moderate sedation', '-4': 'Deep sedation', '-5': 'Unarousable',
    }
    let action = ''
    if (score >= 3) action = 'Safety concern — treat reversible causes, consider bolus sedation'
    else if (score >= 1) action = 'Assess for pain, delirium, hypoxia before escalating sedation'
    else if (score >= -2) action = 'Within target range for most ICU patients; perform CAM-ICU screening'
    else if (score >= -3) action = 'Deeper than typical target; can still assess CAM-ICU'
    else action = 'Over-sedated; hold sedation; daily awakening trial; rule out neurological event'
    return {
      result: `${score >= 0 ? '+' : ''}${score}`,
      unit: 'RASS',
      interpretation: `${labels[String(score)] || ''} — ${action}`,
    }
  },
}
