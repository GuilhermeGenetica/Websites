// /src/utils/defaultRules.js

export const getDefaultRules = () => ({
  "Lifestyle Factors": [
    {
      id: 101,
      conditions: [{ field: 'activityLevel', operator: 'equals', value: ['Sedentary (Little or no exercise)'] }],
      logic: 'AND',
      response: `
<p>A sedentary lifestyle is a primary modifiable risk factor for cardiometabolic disease (CMD - conditions affecting heart and metabolism). This lack of regular movement poses a major risk by promoting impaired insulin sensitivity (how well your cells respond to the sugar-regulating hormone insulin), dyslipidemia (unhealthy cholesterol levels), endothelial dysfunction (damage to blood vessel linings), and low-grade systemic inflammation (a constant low-level 'fire' in the body). Intervention is critical; we strongly recommend incorporating at least 150 minutes of moderate activity (like brisk walking) or 75 minutes of vigorous activity (like jogging) each week, plus muscle-strengthening exercises twice a week.</p>
<p><strong>Nutraceutical Benefits:</strong> To support your body as you become more active:</p>
<ul>
    <li><strong>Coenzyme Q10:</strong> Acts as a vital 'spark plug' for your cells, essential for producing energy (ATP - the body's energy currency) in the mitochondria (your cells' powerhouses), especially in hardworking muscles like the heart.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> A powerful antioxidant that helps your body use glucose (sugar) for energy, supporting insulin sensitivity which can be reduced by inactivity.</li>
    <li><strong>L-carnitine:</strong> This nutrient acts like a shuttle, transporting fats into your mitochondria to be burned for fuel, crucial for producing energy during exercise.</li>
</ul>
`,
      keyNutrient: ['Coenzyme Q10', 'Alpha-lipoic acid', 'L-carnitine']
    },
     // Added rule for Lightly Active
    {
      id: 1011,
      conditions: [{ field: 'activityLevel', operator: 'equals', value: ['Lightly Active (Light exercise 1-3 days/week)'] }],
      logic: 'AND',
      response: `
<p>Your activity level is lightly active. While better than sedentary, increasing frequency or intensity could provide further benefits for cardiovascular health, insulin sensitivity (how well cells respond to the hormone insulin), and mood. Aiming for the recommended 150 minutes of moderate or 75 minutes of vigorous activity per week remains a valuable goal for long-term wellness.</p>
<p><strong>Nutraceutical Benefits:</strong> To support energy and recovery:</p>
<ul>
    <li><strong>Coenzyme Q10:</strong> Supports cellular energy production (ATP - the body's energy currency) needed for activity.</li>
    <li><strong>Magnesium:</strong> Crucial for muscle function, relaxation, and energy metabolism.</li>
</ul>
`,
      keyNutrient: ['Coenzyme Q10', 'Magnesium']
    },
    // Added rule for Moderately Active and above
    {
      id: 1012,
      conditions: [{ field: 'activityLevel', operator: 'equals', value: ['Moderately Active (Moderate exercise 3-5 days/week)', 'Very Active (Intense exercise 6-7 days/week)', 'Extremely Active (Daily intense workouts or physical job)'] }],
      logic: 'OR', // Trigger if any of these are selected
      response: `
<p>Your activity level meets or exceeds the general recommendations for health. Excellent! Consistent physical activity supports cardiovascular health, metabolic function, mood, and cognitive function. Maintaining this level of activity is a powerful investment in your long-term health. Ensure adequate recovery and nutrition to sustain this level.</p>
<p><strong>Nutraceutical Benefits:</strong> To support recovery and sustained performance:</p>
<ul>
    <li><strong>Magnesium:</strong> Essential for muscle recovery, preventing cramps, and energy production.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Help manage exercise-induced inflammation and support cardiovascular health. EPA (Eicosapentaenoic acid) and DHA (Docosahexaenoic acid) are key anti-inflammatory fats.</li>
    <li><strong>Whey Protein / Essential Amino Acids (EAAs):</strong> Provide the necessary building blocks to support muscle repair and growth, especially after resistance training.</li>
</ul>
`,
      keyNutrient: ['Magnesium', 'Omega-3 fatty acids', 'Whey protein', 'Essential amino acids (EAAs)']
    },
    {
      id: 102,
      conditions: [{ field: 'sleepHours', operator: 'lessThan', value: [7] }],
      logic: 'AND',
      response: `
<p>Chronic sleep deprivation (&lt;7 hours) profoundly dysregulates the <strong>HPA axis (Hypothalamic-Pituitary-Adrenal axis - your central stress response system)</strong> and autonomic nervous system (controlling involuntary functions like heart rate). This leads to elevated nocturnal cortisol (stress hormone), impaired glucose tolerance, and increased sympathetic tone ('fight-or-flight' activation). This disruption of the natural 24-hour clock (circadian rhythm) puts the body in a constant state of stress, driving metabolic dysfunction and inflammation. Prioritizing a consistent 7-9 hour sleep schedule is fundamental for health, allowing the body to repair and recharge.</p>
<p><strong>Nutraceutical Benefits:</strong> To support better sleep quality and help your body unwind:</p>
<ul>
    <li><strong>Magnesium:</strong> This essential mineral helps calm the nervous system by supporting <strong>GABA (Gamma-aminobutyric acid)</strong>, a major relaxing neurotransmitter. Forms like Magnesium Glycinate or Threonate are often preferred for sleep.</li>
    <li><strong>L-theanine:</strong> An amino acid from green tea that promotes a state of 'calm alertness' and relaxation without drowsiness by increasing alpha brain waves, helping to quiet a racing mind.</li>
    <li><strong>Apigenin:</strong> A natural bioflavonoid (famously found in chamomile) that helps reduce anxiety and bind to receptors in the brain that initiate sleep.</li>
    <li><strong>Valerian Root:</strong> A traditional herb used to promote tranquility and improve sleep quality by supporting GABA levels in the brain.</li>
</ul>
`,
      keyNutrient: ['Magnesium', 'L-theanine', 'Apigenin', 'Valerian root']
    },
    {
      id: 103, // Keep original ID for consistency
      conditions: [{ field: 'sleepHours', operator: 'greaterThanOrEqual', value: [7] }],
      logic: 'AND',
      response: `
<p>Sleep duration of ≥7 hours is consistent with clinical guidelines for optimal health, supporting <strong>HPA axis (stress response system)</strong> regulation, appropriate <strong>circadian signaling (internal body clock)</strong>, and efficient <strong>glymphatic clearance (brain's waste removal during sleep)</strong>. Excellent! Maintaining this habit is a powerful tool for long-term wellness, recovery, and hormonal balance, allowing your body and brain to fully repair and reset each night.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain high-quality sleep and resilience:</p>
<ul>
    <li><strong>L-theanine:</strong> Helps promote relaxation before bed, improving sleep quality even if duration is sufficient.</li>
    <li><strong>Magnesium:</strong> Supports the nervous system's relaxation pathways (GABA) and can be depleted by daily stress, making maintenance important.</li>
</ul>
`,
      keyNutrient: ['L-theanine', 'Magnesium']
    },
    {
      id: 104, // Keep original ID
      conditions: [{ field: 'stressLevel', operator: 'greaterThanOrEqual', value: [8] }],
      logic: 'AND',
      response: `
<p>A high perceived stress level (≥8/10) indicates probable chronic activation of the <strong>HPA axis (Hypothalamic-Pituitary-Adrenal stress response system)</strong> and <strong>sympathoadrenal system ('fight-or-flight' response)</strong>. This state, driven by the stress hormone cortisol, drives <strong>glucocorticoid resistance (cells become numb to cortisol's signal)</strong>, systemic inflammation, and hormonal imbalances. This contributes directly to cardiometabolic risk and potentially disrupts sleep, affects mood, increases sugar cravings, and leads to burnout. It's critical to implement daily stress-reduction techniques (like deep breathing, mindfulness, or walks in nature).</p>
<p><strong>Nutraceutical Benefits:</strong> Adaptogens and nutrients can help modulate the stress response:</p>
<ul>
    <li><strong>Ashwagandha:</strong> An <strong>adaptogenic herb</strong> (helps body adapt to stress) clinically shown to help reduce cortisol levels, mitigating the body's stress response and promoting a sense of calm.</li>
    <li><strong>Rhodiola rosea:</strong> Another adaptogen that helps improve resilience to stress, particularly beneficial for fighting stress-related fatigue and 'burnout'.</li>
    <li><strong>Phosphatidylserine:</strong> A phospholipid (fatty compound) that can help blunt the cortisol response to stress, especially physical stress.</li>
    <li><strong>L-theanine:</strong> Promotes a state of calm relaxation by increasing alpha brain waves, without causing drowsiness.</li>
    <li><strong>B-Complex Vitamins (B2, B6, B9, B12):</strong> These are rapidly depleted during stress and are essential <strong>cofactors (helpers)</strong> for producing 'calm' neurotransmitters like GABA and serotonin.</li>
</ul>
`,
      keyNutrient: ['Ashwagandha', 'Rhodiola rosea', 'Phosphatidylserine', 'L-theanine', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
     // Added rule for Moderate Stress
    {
      id: 1041,
      conditions: [{ field: 'stressLevel', operator: 'between', value: [5, 7] }],
      logic: 'AND',
      response: `
<p>Your stress level is moderate (5-7/10). While not extreme, chronic moderate stress can still negatively impact hormonal balance, sleep quality, and overall well-being over time. Continuing to practice stress management techniques (mindfulness, exercise, adequate sleep) is important for maintaining resilience and preventing stress from escalating.</p>
<p><strong>Nutraceutical Benefits:</strong> Supportive nutrients can enhance resilience:</p>
<ul>
    <li><strong>L-theanine:</strong> Promotes calm focus and can buffer daily stressors.</li>
    <li><strong>Magnesium:</strong> Helps regulate the nervous system's response to stress.</li>
    <li><strong>B-Complex Vitamins:</strong> Support neurotransmitter production and energy levels, which can be impacted by stress.</li>
</ul>
`,
      keyNutrient: ['L-theanine', 'Magnesium', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
    // Added rule for Low Stress
    {
      id: 1042,
      conditions: [{ field: 'stressLevel', operator: 'lessThan', value: [5] }],
      logic: 'AND',
      response: `
<p>Your reported stress level is low (<5/10). This is excellent and indicates effective stress management or a lower perception of stress, which is highly beneficial for overall health, supporting balanced hormonal function, better sleep, and reduced inflammation risk. Maintaining healthy coping mechanisms is key to preserving this state.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain this state of resilience:</p>
<ul>
    <li><strong>L-theanine:</strong> Helps buffer against minor daily stressors, supporting continued calm.</li>
    <li><strong>Magnesium:</strong> Foundational support for the nervous system; daily stress, even if low, can deplete stores.</li>
</ul>
`,
      keyNutrient: ['L-theanine', 'Magnesium']
    },
    {
      id: 105, // Keep original ID
      conditions: [{ field: 'smokingStatus', operator: 'equals', value: ['Daily smoker'] }],
      logic: 'AND',
      response: `
<p>Daily smoking introduces a massive, persistent burden of <strong>oxidative stress (cellular damage from unstable molecules)</strong> and systemic inflammation. It depletes <strong>endogenous antioxidants (your body's natural protectors like glutathione and Vitamin C)</strong> and is a primary driver of <strong>endothelial dysfunction (damage to blood vessel linings)</strong>, significantly accelerating <strong>atherosclerosis (plaque buildup)</strong> and <strong>carcinogenesis (cancer development)</strong>. It floods the body with harmful chemicals and is the most significant lifestyle risk factor for heart disease, lung disease, and cancer. Smoking cessation is the single most important action for health.</p>
<p><strong>Nutraceutical Benefits:</strong> While no supplement can undo smoking damage, these support antioxidant defenses:</p>
<ul>
    <li><strong>Vitamin C:</strong> Smokers have significantly higher requirements for this critical antioxidant, as it's used to neutralize the <strong>free radicals (damaging molecules)</strong> from smoke.</li>
    <li><strong>N-acetylcysteine (NAC):</strong> A precursor to glutathione, the body's 'master antioxidant', heavily depleted by smoke toxins. NAC also helps thin mucus in the lungs.</li>
    <li><strong>Glutathione:</strong> Supplementing directly (e.g., liposomal form for better absorption) helps replenish the body's primary defense against oxidative stress.</li>
    <li><strong>Vitamin E:</strong> A fat-soluble antioxidant protecting cell membranes from damage caused by smoking.</li>
</ul>
`,
      keyNutrient: ['Vitamin C', 'N-acetylcysteine (NAC)', 'Glutathione', 'Vitamin E (Tocopherols / Tocotrienols)']
    },
     // Added rule for Former/Occasional Smokers
    {
      id: 1051,
      conditions: [{ field: 'smokingStatus', operator: 'equals', value: ['Former smoker (quit >6 months ago)', 'Occasional smoker (<1 cigarette/day)'] }],
      logic: 'OR',
      response: `
<p>Being a former or occasional smoker carries significantly lower risk than daily smoking, but cumulative exposure still contributes to <strong>oxidative stress (cellular damage)</strong> and inflammation. Continuing cessation (for former smokers) or complete avoidance (for occasional smokers) is strongly advised. Supporting the body's antioxidant systems remains beneficial to address residual effects.</p>
<p><strong>Nutraceutical Benefits:</strong> To support antioxidant defenses:</p>
<ul>
    <li><strong>Vitamin C:</strong> Helps neutralize residual oxidative stress.</li>
    <li><strong>N-acetylcysteine (NAC):</strong> Supports <strong>glutathione (master antioxidant)</strong> production for ongoing detoxification.</li>
    <li><strong>Green Tea Extract (EGCG):</strong> Provides potent antioxidants to combat cellular damage.</li>
</ul>
`,
      keyNutrient: ['Vitamin C', 'N-acetylcysteine (NAC)', 'Green tea extract']
    },
    // Added rule for Never Smoked
     {
      id: 1052,
      conditions: [{ field: 'smokingStatus', operator: 'equals', value: ['Never smoked'] }],
      logic: 'AND',
      response: `
<p>Never having smoked is a major positive factor for long-term health, significantly reducing the risk of numerous chronic diseases including cardiovascular disease, respiratory illness, and many cancers. Maintaining this status is crucial for optimal wellness.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain general antioxidant defenses against environmental (non-smoking) stressors:</p>
<ul>
    <li><strong>Vitamin C:</strong> A foundational antioxidant for daily protection.</li>
    <li><strong>Glutathione (or N-acetylcysteine - NAC):</strong> Supports the body's primary detoxification and antioxidant system.</li>
</ul>
`,
      keyNutrient: ['Vitamin C', 'Glutathione', 'N-acetylcysteine (NAC)']
    },
    {
      id: 106, // Keep original ID
      conditions: [{ field: 'alcoholConsumption', operator: 'equals', value: ['High (>7 drinks/week)'] }],
      logic: 'AND',
      response: `
<p>High alcohol intake places a significant metabolic burden on the liver, induces <strong>dysbiosis (imbalance of gut bacteria)</strong>, and promotes <strong>intestinal hyperpermeability ('leaky gut')</strong>. It depletes key B-vitamins (especially thiamine/B1 and folate/B9) and magnesium, and its metabolism (breaking down alcohol) generates <strong>acetaldehyde (a toxic byproduct)</strong> and oxidative stress. Consumption is in a high-risk category. A substantial reduction is essential and strongly advised to protect liver and overall health.</p>
<p><strong>Nutraceutical Benefits:</strong> To support liver health and replenish nutrients depleted by alcohol:</p>
<ul>
    <li><strong>Milk Thistle (Silymarin):</strong> A well-researched herb supporting liver cell regeneration and protection from toxins.</li>
    <li><strong>B-Complex Vitamins (B-vitamins):</strong> Alcohol heavily depletes B-vitamins, critical for detoxification and energy.</li>
    <li><strong>N-acetylcysteine (NAC):</strong> Helps replenish glutathione, essential for detoxifying acetaldehyde.</li>
    <li><strong>Taurine:</strong> An amino acid protecting liver cells from alcohol-induced oxidative stress.</li>
    <li><strong>Zinc:</strong> Often depleted by alcohol; critical mineral for alcohol-detoxifying enzymes.</li>
</ul>
`,
      keyNutrient: ['Milk thistle (silymarin)', 'Vitamin B1 (Thiamine)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'N-acetylcysteine (NAC)', 'Taurine', 'Zinc'] // Added B1
    },
     // Added rule for Regular Alcohol Consumption
    {
      id: 1061,
      conditions: [{ field: 'alcoholConsumption', operator: 'equals', value: ['Regular (4-7 drinks/week)'] }],
      logic: 'AND',
      response: `
<p>Regular alcohol consumption (4-7 drinks/week) still places a consistent burden on liver detoxification pathways and can contribute to nutrient depletion (especially B vitamins and magnesium) over time. While potentially within some 'moderate' guidelines, minimizing intake further would reduce metabolic stress and inflammation risk. Ensure nutrient intake is adequate.</p>
<p><strong>Nutraceutical Benefits:</strong> To support liver function and nutrient status:</p>
<ul>
    <li><strong>B-Complex Vitamins (B-vitamins):</strong> Help replenish nutrients potentially depleted by regular alcohol processing.</li>
    <li><strong>Milk Thistle (Silymarin):</strong> Provides ongoing support for liver cell health and detoxification.</li>
    <li><strong>Magnesium:</strong> Supports enzymatic processes involved in alcohol metabolism and can be depleted.</li>
</ul>
`,
      keyNutrient: ['Vitamin B1 (Thiamine)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Milk thistle (silymarin)', 'Magnesium'] // Added B1
    },
    // Added rule for Rare/Social Alcohol Consumption
    {
      id: 1062,
      conditions: [{ field: 'alcoholConsumption', operator: 'equals', value: ['Rare (<1 drink/week)', 'Social (1-3 drinks/week)'] }],
      logic: 'OR',
      response: `
<p>Your alcohol consumption is low to moderate (≤3 drinks/week). This level is less likely to pose significant risks to liver health or cause major nutrient depletion. However, even moderate intake can impact sleep quality and contribute to inflammation for sensitive individuals. Mindful consumption remains advisable.</p>
<p><strong>Nutraceutical Benefits:</strong> To support foundational liver health and detoxification pathways:</p>
<ul>
    <li><strong>Milk Thistle (Silymarin):</strong> Provides general protection for liver cells, even with low exposure.</li>
    <li><strong>B-Complex Vitamins:</strong> Supports the energy and detoxification pathways used in alcohol metabolism.</li>
</ul>
`,
      keyNutrient: ['Milk thistle (silymarin)', 'Vitamin B1 (Thiamine)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
    {
      id: 107, // Keep original ID
      conditions: [{ field: 'alcoholConsumption', operator: 'equals', value: ['Never'] }],
      logic: 'AND',
      response: `
<p>Abstaining from alcohol consumption is an excellent choice, minimizing the metabolic burden on the liver, supporting a healthy gut microbiome, reducing risks of systemic inflammation and <strong>dysbiosis (gut imbalance)</strong>, and eliminating a source of 'empty calories'. We commend and support this healthy lifestyle choice.</p>
<p><strong>Nutraceutical Benefits:</strong> To support general gut and liver health:</p>
<ul>
    <li><strong>Probiotic multi-strain blends:</strong> Supports a diverse and healthy gut microbiome.</li>
    <li><strong>Curcumin:</strong> Provides potent antioxidant and anti-inflammatory support for overall health, including the liver.</li>
</ul>
`,
      keyNutrient: ['Probiotic multi-strain blends', 'Curcumin']
    }
  ],
  "Body Composition & Anthropometrics": [
    {
      id: 201, // Keep original ID
      conditions: [{ field: 'bmi', operator: 'lessThan', value: [18.5] }],
      logic: 'AND',
      response: `
<p>A <strong>Body Mass Index (BMI - a measure of body fat based on height and weight)</strong> in the underweight category may indicate malnutrition, <strong>malabsorption (poor nutrient uptake)</strong>, or an underlying <strong>catabolic state (body breaking down tissue)</strong>. This increases risks for <strong>sarcopenia (muscle loss)</strong>, <strong>osteopenia (low bone density)</strong>, and compromised immune function. Nutritional assessment is crucial to develop a strategy for achieving a healthy weight via a nutrient-dense diet.</p>
<p><strong>Nutraceutical Benefits:</strong> To support healthy weight gain and muscle preservation:</p>
<ul>
    <li><strong>Whey Protein:</strong> High-quality, easily absorbed protein providing building blocks (amino acids) for muscle tissue.</li>
    <li><strong>Essential Amino Acids (EAAs):</strong> Specific amino acids the body cannot make, directly stimulating muscle protein synthesis.</li>
    <li><strong>Creatine Monohydrate:</strong> Helps increase muscle mass (via cell hydration) and improves strength, aiding muscle-building workouts.</li>
</ul>
`,
      keyNutrient: ['Whey protein', 'Essential amino acids (EAAs)', 'Creatine monohydrate']
    },
    {
      id: 202, // Keep original ID
      conditions: [{ field: 'bmi', operator: 'between', value: [18.5, 24.9] }],
      logic: 'AND',
      response: `
<p>The <strong>BMI (Body Mass Index)</strong> is within the eumetabolic (optimal healthy weight) range. Congratulations! Maintaining this through a balanced, whole-foods diet and consistent physical activity minimizes long-term disease risk. Focus should be on optimizing body composition (preserving muscle, managing visceral/belly fat).</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain metabolic health and body composition:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Help maintain a healthy inflammatory balance and support metabolic function.</li>
    <li><strong>Whey Protein:</strong> Can be used to ensure adequate protein intake to preserve lean muscle mass, even in healthy individuals.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Whey protein']
    },
    {
      id: 203, // Keep original ID
      conditions: [{ field: 'bmi', operator: 'between', value: [25.0, 29.9] }],
      logic: 'AND',
      response: `
<p>A <strong>BMI (Body Mass Index)</strong> in the overweight range significantly increases risk of <strong>insulin resistance (step towards type 2 diabetes)</strong>, <strong>hypertension (high blood pressure)</strong>, and <strong>dyslipidemia (unhealthy cholesterol)</strong>, even before overt obesity. This is a crucial time and critical window for intervention (whole-foods, low-glycemic diet, regular activity) to prevent progression to <strong>cardiometabolic disease (CMD)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong> To support metabolic health and weight management:</p>
<ul>
    <li><strong>Berberine:</strong> Plant compound highly effective at improving insulin sensitivity and helping lower blood sugar, often compared to metformin.</li>
    <li><strong>Green Tea Extract (EGCG - Epigallocatechin gallate):</strong> Helps slightly increase metabolic rate and promotes fat oxidation (fat burning).</li>
    <li><strong>Chromium:</strong> Essential mineral enhancing insulin action, helping shuttle glucose into cells efficiently.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> Helps turn glucose into energy and improves insulin sensitivity.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Green tea extract', 'Chromium (chromium picolinate)', 'Alpha-lipoic acid']
    },
    {
      id: 204, // Keep original ID
      conditions: [{ field: 'bmi', operator: 'greaterThanOrEqual', value: [30.0] }],
      logic: 'AND',
      response: `
<p>A <strong>BMI (Body Mass Index)</strong> in the obese category indicates excess <strong>adiposity (body fat)</strong>, which functions as an active, <strong>pro-inflammatory endocrine organ (releases inflammatory signals)</strong>. This significantly elevates risk for <strong>type 2 diabetes (T2DM)</strong>, <strong>cardiovascular disease (CVD)</strong>, and certain cancers. A structured program, potentially including comprehensive, medically-supervised intervention, is strongly advised.</p>
<p><strong>Nutraceutical Benefits:</strong> To support weight management and reduce inflammation:</p>
<ul>
    <li><strong>Berberine:</strong> Highly effective at improving insulin sensitivity and blood sugar control, often a root cause of weight gain.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Help reduce the low-grade, chronic inflammation produced by excess fat tissue.</li>
    <li><strong>Conjugated Linoleic Acid (CLA):</strong> Type of fat that may help reduce body fat and slightly increase lean muscle mass.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Omega-3 fatty acids', 'Conjugated linoleic acid (CLA)']
    }
  ],
  "Hematology & Iron Status": [
    {
      id: 301, // Keep original ID
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'hemoglobin', operator: 'lessThan', value: [13.5] }
      ],
      logic: 'AND',
      response: `
<p><strong>Hemoglobin (the protein in red blood cells carrying oxygen)</strong> is below the reference range, indicating <strong>anemia (lack of healthy red blood cells)</strong>, leading to fatigue/weakness. In adult males, this uncommon finding warrants immediate medical investigation for root causes like <strong>occult gastrointestinal bleeding</strong>, <strong>malabsorption (e.g., celiac disease)</strong>, or chronic inflammation. A comprehensive workup (full iron panel, B12, folate) is essential before treatment.</p>
<p><strong>Nutraceutical Benefits:</strong> Once cause identified by physician, targeted treatment. Nutrients for red blood cells:</p>
<ul>
    <li><strong>Iron:</strong> Core component of hemoglobin carrying oxygen. Do not supplement unless iron deficiency confirmed by doctor.</li>
    <li><strong>Vitamin B12 (Cobalamin):</strong> Essential for <strong>DNA synthesis</strong> needed to produce new red blood cells.</li>
    <li><strong>Vitamin B9 (Folate):</strong> Works with B12 in DNA synthesis for cell division.</li>
</ul>
`,
      keyNutrient: ['Iron', 'Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)']
    },
     // Added rule for optimal Male Hemoglobin
    {
      id: 3011,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'hemoglobin', operator: 'between', value: [13.5, 17.5] }
      ],
      logic: 'AND',
      response: `
<p><strong>Hemoglobin (protein carrying oxygen)</strong> is within the standard reference range for males (13.5-17.5 g/dL), indicating sufficient red blood cell mass for adequate oxygen transport. Maintaining adequate intake of iron and B vitamins (B12, B9) through diet supports continued healthy levels.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain healthy red blood cell production:</p>
<ul>
    <li><strong>Vitamin B12 (Cobalamin) & Vitamin B9 (Folate / Folic acid):</strong> Essential for ongoing cell division and DNA synthesis.</li>
    <li><strong>Iron:</strong> Important to maintain adequate dietary intake; supplementation only if diet is consistently low (e.g., vegetarian/vegan).</li>
</ul>
`,
      keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)', 'Iron']
    },
    {
      id: 302, // Keep original ID
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'hemoglobin', operator: 'lessThan', value: [12.0] }
      ],
      logic: 'AND',
      response: `
<p><strong>Hemoglobin (protein carrying oxygen in red blood cells)</strong> is below the reference range, indicating <strong>anemia (lack of healthy red blood cells)</strong>, often causing fatigue, weakness, or feeling cold. For women, iron deficiency secondary to <strong>menses (monthly periods)</strong> is common, but other deficiencies (B12, folate) or inflammation must be evaluated. A complete iron panel is needed to confirm cause before treating.</p>
<p><strong>Nutraceutical Benefits:</strong> If iron deficiency is confirmed, supplementation is key:</p>
<ul>
    <li><strong>Iron:</strong> Core component of hemoglobin. Gentle, non-constipating form like Iron Bisglycinate often recommended.</li>
    <li><strong>Vitamin C:</strong> Taking Vitamin C with iron supplement/foods increases absorption up to 6x.</li>
    <li><strong>Vitamin B12 (Cobalamin) & Vitamin B9 (Folate):</strong> Also needed to build healthy red blood cells; deficiency can cause anemia.</li>
</ul>
`,
      keyNutrient: ['Iron', 'Vitamin C', 'Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)']
    },
     // Added rule for optimal Female Hemoglobin
    {
      id: 3021,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'hemoglobin', operator: 'between', value: [12.0, 15.5] }
      ],
      logic: 'AND',
      response: `
<p><strong>Hemoglobin (protein carrying oxygen)</strong> is within the standard reference range for females (12.0-15.5 g/dL), suggesting adequate red blood cell mass for oxygen transport. Given potential monthly losses (menses), ensuring consistent dietary intake of iron and B vitamins (B12, B9) is important for maintenance.</p>
<p><strong>Nutraceutical Benefits:</strong> To support healthy red blood cell levels:</p>
<ul>
    <li><strong>Iron:</strong> A low maintenance dose (e.g., Iron Bisglycinate) can help maintain stores, especially if dietary intake is low.</li>
    <li><strong>Vitamin C:</strong> Maximizes absorption of dietary and supplemental iron.</li>
    <li><strong>B-Complex Vitamins (B9, B12):</strong> Ensure cofactors for cell production are present.</li>
</ul>
`,
      keyNutrient: ['Iron', 'Vitamin C', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
    {
      id: 303, // Keep original ID
      conditions: [{ field: 'ferritin', operator: 'lessThan', value: [50] }],
      logic: 'AND',
      response: `
<p><strong>Ferritin (iron storage protein)</strong> is below the optimal functional range (50-150 ng/mL). Think of ferritin as the body's 'iron savings account'. While often "normal" by standard labs, this level indicates depleted iron stores (<strong>pre-anemia</strong>) and is insufficient for optimal energy, cognitive function, and thyroid hormone production, potentially causing fatigue, hair loss, brain fog even before full anemia. Iron supplementation is warranted.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Iron:</strong> Supplementing with a non-constipating form (like Iron Bisglycinate) helps rebuild ferritin stores.</li>
    <li><strong>Vitamin C:</strong> Taking Vitamin C with iron significantly increases gut absorption.</li>
</ul>
`,
      keyNutrient: ['Iron', 'Vitamin C']
    },
    { // Renamed from 304 for clarity
      id: 304,
      conditions: [{ field: 'ferritin', operator: 'between', value: [50, 150] }],
      logic: 'AND',
      response: `
<p>The <strong>Ferritin (iron storage protein)</strong> level is within the optimal functional range (50-150 ng/mL), indicating adequate iron stores ('iron savings account') for <strong>erythropoiesis (red blood cell production)</strong> and other metabolic demands. This supports good energy, healthy hair, and vitality. Maintenance through a balanced, iron-rich diet is appropriate.</p>
<p><strong>Nutraceutical Benefits:</strong> To help maintain optimal iron status and absorption:</p>
<ul>
    <li><strong>Vitamin C:</strong> Enhances the absorption of iron from dietary sources (like plants).</li>
    <li><strong>Copper:</strong> A trace mineral necessary for mobilizing iron from storage (ferritin) into the bloodstream.</li>
</ul>
`,
      keyNutrient: ['Vitamin C', 'Copper']
    },
    {
      id: 305, // Keep original ID
      conditions: [{ field: 'ferritin', operator: 'greaterThan', value: [150] }],
      logic: 'AND',
      response: `
<p>Elevated <strong>Ferritin (iron storage protein)</strong> acts as an <strong>acute phase reactant (a substance whose levels change significantly during inflammation)</strong> and can indicate chronic inflammation, <strong>NAFLD (Non-Alcoholic Fatty Liver Disease)</strong>, or iron overload (<strong>hemochromatosis</strong>), rather than just high stores. High ferritin often acts as a 'red flag'. Because excess iron is a <strong>pro-oxidant (promotes cellular damage)</strong>, investigate cause with full iron panel & inflammatory markers (<strong>hs-CRP</strong>, <strong>GGT</strong>). Avoid iron supplementation/fortified foods.</p>
<p><strong>Nutraceutical Benefits:</strong> To help manage inflammation associated with high ferritin:</p>
<ul>
    <li><strong>Curcumin:</strong> Active compound in turmeric; potent anti-inflammatory. Also acts as an <strong>iron chelator (gently binds excess iron)</strong>.</li>
    <li><strong>Quercetin:</strong> Plant bioflavonoid with strong anti-inflammatory/antioxidant properties, mitigating oxidative stress.</li>
</ul>
`,
      keyNutrient: ['Curcumin', 'Quercetin']
    },
    {
      id: 306, // Keep original ID
      conditions: [{ field: 'mcv', operator: 'lessThan', value: [85] }],
      logic: 'AND',
      response: `
<p><strong>Mean Corpuscular Volume (MCV - average red blood cell size)</strong> is below the optimal functional range (85-95 fL), indicating <strong>microcytosis (small cells)</strong>. This classically signifies iron deficiency anemia (insufficient iron for normal cell size) or potentially <strong>thalassemia trait (a genetic condition)</strong>. A full iron panel is warranted to differentiate the cause.</p>
<p><strong>Nutraceutical Benefits:</strong> If iron deficiency is confirmed:</p>
<ul>
    <li><strong>Iron:</strong> Provides raw material to build new, healthy-sized red blood cells.</li>
    <li><strong>Vitamin C:</strong> Enhances absorption of iron from diet and supplements.</li>
</ul>
`,
      keyNutrient: ['Iron', 'Vitamin C']
    },
    { // Renamed from 307
        id: 307,
        conditions: [{ field: 'mcv', operator: 'between', value: [85, 95] }],
        logic: 'AND',
        response: `
<p>The <strong>MCV (Mean Corpuscular Volume - average red blood cell size)</strong> is in the optimal functional range (85-95 fL), indicating healthy red blood cell size crucial for efficient oxygen transport. This suggests adequate status of iron, B12, and folate, vital for <strong>normocytic erythropoiesis (normal red blood cell production)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong> To support continued healthy red blood cell formation:</p>
<ul>
    <li><strong>B-Complex Vitamins (B9, B12, B6):</strong> Provide the essential cofactors for DNA synthesis and cell maturation.</li>
    <li><strong>Iron:</strong> Maintain adequate dietary intake to provide the core building block for hemoglobin.</li>
</ul>
`,
        keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Vitamin B6 (Pyridoxine)', 'Iron']
    },
    {
      id: 308, // Keep original ID
      conditions: [{ field: 'mcv', operator: 'greaterThan', value: [95] }],
      logic: 'AND',
      response: `
<p><strong>MCV (Mean Corpuscular Volume - average red blood cell size)</strong> is above the optimal functional range (>95 fL), indicating <strong>macrocytosis (large cells)</strong>. This is classically caused by a <strong>megaloblastic process</strong> due to <strong>Vitamin B12 or folate (B9) deficiency</strong>, as these B-vitamins are critical for <strong>DNA synthesis (cell blueprints)</strong>. Without them, cells grow large and immature. Evaluation of B12, folate, B6, and B2 is essential.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin B12 (Cobalamin):</strong> Essential for DNA synthesis and red blood cell formation.</li>
    <li><strong>Vitamin B9 (Folate / Folic acid):</strong> Works as a partner with B12 in DNA synthesis.</li>
    <li><strong>B-Complex Vitamins (B2, B6):</strong> Act as 'helpers' (cofactors) in metabolic pathways involving B12 and folate.</li>
</ul>
`,
      keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)']
    }
  ],
  "Micronutrient & Inflammation Status": [
    {
      id: 401, // Keep original ID
      conditions: [{ field: 'vitaminD', operator: 'lessThan', value: [40] }],
      logic: 'AND',
      response: `
<p>Serum <strong>25(OH)D (Vitamin D level)</strong> is below the optimal functional range (40-60 ng/mL). Think of Vitamin D as a 'master-switch'; this suboptimal status is insufficient for its <strong>pleiotropic (wide-ranging) endocrine functions</strong>, including <strong>immune modulation (balancing immune response)</strong>, <strong>calcium homeostasis (bone health)</strong>, and <strong>gene expression (turning genes on/off)</strong>. Correction is necessary for immune resilience and musculoskeletal health. We aim for 40-60 ng/mL for best results.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin D3:</strong> Most effective supplement form, directly raises active Vitamin D levels.</li>
    <li><strong>Vitamin K2 (Menaquinones, e.g., MK-7):</strong> The 'traffic cop' for calcium. Vitamin D aids calcium absorption; K2 helps direct it into bones/teeth, not arteries/soft tissues.</li>
</ul>
`,
      keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)']
    },
    { // Renamed from 402
        id: 402,
        conditions: [{ field: 'vitaminD', operator: 'between', value: [40, 60] }],
        logic: 'AND',
        response: `
<p>The serum <strong>25(OH)D (Vitamin D level)</strong> is in the optimal functional range (40-60 ng/mL). Excellent! This supports a healthy immune system, bone density, stable mood, and hormonal precursors. Continued sensible sun exposure and/or a maintenance dose is advised to keep it here.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain optimal levels and function:</p>
<ul>
    <li><strong>Vitamin D:</strong> A daily maintenance dose (e.g., 1000-2000 IU) is often needed, especially in winter.</li>
    <li><strong>Vitamin K2 (Menaquinones):</strong> Ensures calcium absorbed by Vitamin D is directed correctly.</li>
    <li><strong>Magnesium:</strong> A critical cofactor required by enzymes to convert Vitamin D into its active form.</li>
</ul>
`,
        keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)', 'Magnesium']
    },
     // Added rule for High Vitamin D
    {
        id: 4021,
        conditions: [{ field: 'vitaminD', operator: 'greaterThan', value: [80] }], // Using 80 as a potential upper limit concern
        logic: 'AND',
        response: `
<p>Serum <strong>25(OH)D (Vitamin D level)</strong> is high (>80 ng/mL). While optimal range is 40-60 ng/mL, levels significantly above this may increase risk of <strong>hypercalcemia (high blood calcium)</strong> over time, though toxicity is rare below 100-150 ng/mL. It is advisable to review current Vitamin D supplementation dosage with your healthcare provider and potentially reduce it to maintain levels within the optimal range.</p>
`,
        keyNutrient: null // No supplement recommended, potentially reduction needed
    },
    {
      id: 403, // Keep original ID
      conditions: [{ field: 'vitaminB12', operator: 'lessThan', value: [500] }],
      logic: 'AND',
      response: `
<p>Serum Vitamin B12 is below the optimal functional range (>500 pg/mL). While labs often use >200 as 'normal', functional medicine aims higher for optimal brain health, nerve function, and energy. Suboptimal levels can cause neurological symptoms (<strong>paresthesia/tingling, cognitive fog</strong>), fatigue, and impaired <strong>methylation (a key biochemical process)</strong>. Common in plant-based diets or with acid-blocking meds. Supplementation with an active form (e.g., <strong>methylcobalamin</strong>) is advised.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin B12 (as Methylcobalamin):</strong> 'Active' form body uses directly; critical for nerve health and energy metabolism.</li>
    <li><strong>B-Complex Vitamins (B2, B6, Folate):</strong> Work as a team with B12, especially in the methylation cycle.</li>
</ul>
`,
      keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)']
    },
     // Added rule for Optimal B12
    {
      id: 4031,
      conditions: [{ field: 'vitaminB12', operator: 'greaterThanOrEqual', value: [500] }],
      logic: 'AND',
      response: `
<p>Serum Vitamin B12 is within or above the optimal functional range (≥500 pg/mL). This level supports healthy neurological function, energy metabolism, and <strong>methylation (key biochemical process)</strong>. Maintaining adequate intake through diet or continued appropriate supplementation (if necessary due to diet or absorption issues) is recommended.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain healthy methylation and nerve function:</p>
<ul>
    <li><strong>B-Complex Vitamins (B12, B9, B6):</strong> These vitamins work synergistically. Maintaining all of them is key, as B12 does not work in isolation.</li>
</ul>
`,
      keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B6 (Pyridoxine)']
    },
    {
      id: 404, // Keep original ID
      conditions: [{ field: 'rBCMagnesium', operator: 'lessThan', value: [6.0] }],
      logic: 'AND',
      response: `
<p><strong>Red Blood Cell (RBC) Magnesium</strong> is below the optimal range (6.0-6.8 mg/dL). Unlike <strong>serum magnesium (blood level)</strong>, RBC magnesium more accurately reflects <strong>intracellular stores (inside cells)</strong>. Magnesium is a 'master mineral' impacting over 600 enzymatic reactions, including <strong>ATP (energy) synthesis</strong>, DNA repair, <strong>insulin signaling</strong>, muscle relaxation, and stress management. Deficiency is widespread due to soil depletion and stress.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Magnesium:</strong> Supplementing with a well-absorbed form is key. <strong>Magnesium Glycinate</strong> (often chelated) is excellent for sleep/relaxation. <strong>Magnesium Malate</strong> for energy/muscle soreness. <strong>Magnesium Threonate</strong> best crosses blood-brain barrier for cognition.</li>
</ul>
`,
      keyNutrient: ['Magnesium']
    },
     // Added rule for Optimal RBC Magnesium
    {
      id: 4041,
      conditions: [{ field: 'rBCMagnesium', operator: 'between', value: [6.0, 6.8] }],
      logic: 'AND',
      response: `
<p><strong>Red Blood Cell (RBC) Magnesium</strong> is within the optimal range (6.0-6.8 mg/dL), indicating good intracellular stores of this vital mineral. This supports numerous enzymatic processes, energy production, and nervous system function. Continue consuming magnesium-rich foods like leafy greens, nuts, and seeds.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain optimal levels (as magnesium is depleted daily by stress and sugar):</p>
<ul>
    <li><strong>Magnesium:</strong> A daily maintenance dose (e.g., Magnesium Glycinate) can ensure stores remain full.</li>
</ul>
`,
      keyNutrient: ['Magnesium']
    },
    {
      id: 405, // Keep original ID
      conditions: [{ field: 'homocysteine', operator: 'greaterThan', value: [9] }],
      logic: 'AND',
      response: `
<p>An elevated <strong>homocysteine</strong> level (>9 µmol/L; optimal <7) is an independent risk factor for cardiovascular disease, neurodegeneration, and <strong>endothelial dysfunction (blood vessel lining damage)</strong>. Homocysteine is a normal metabolic byproduct, but high levels act like 'rust' in blood vessels. It signals inefficiency in the <strong>methylation cycle (a key process for detoxification, DNA repair, etc.)</strong> needed to 'recycle' it, often due to insufficient B-vitamin <strong>cofactors (B9, B12, B6)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong> To support the methylation cycle and lower homocysteine:</p>
<ul>
    <li><strong>Vitamin B9 (as L-5-MTHF):</strong> The active form of folate; most critical for recycling homocysteine.</li>
    <li><strong>Vitamin B12 (as Methylcobalamin):</strong> Direct partner with active folate in this recycling pathway.</li>
    <li><strong>Vitamin B6 (as P-5-P):</strong> Active B6 helps convert homocysteine down a different pathway (<strong>transsulfuration</strong>) to produce <strong>glutathione (master antioxidant)</strong>.</li>
</ul>
`,
      keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Vitamin B6 (Pyridoxine)']
    },
    { // Renamed from 406
        id: 406,
        conditions: [{ field: 'homocysteine', operator: 'lessThanOrEqual', value: [9] }], // Ideally <7, but <=9 is acceptable range
        logic: 'AND',
        response: `
<p>The <strong>homocysteine</strong> level is within the acceptable range (≤9 µmol/L, optimally <7), suggesting the <strong>methylation cycle</strong> is functioning adequately for 'recycling' metabolic byproducts. This is excellent and protective for cardiovascular and neurological health. A diet rich in leafy greens and B-vitamins helps maintain this.</p>
<p><strong>Nutraceutical Benefits:</strong> To provide ongoing support for the methylation cycle:</p>
<ul>
    <li><strong>B-Complex Vitamins (B9, B12, B6):</strong> Ensuring a steady supply of these cofactors helps keep the methylation cycle running smoothly.</li>
</ul>
`,
        keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Vitamin B6 (Pyridoxine)']
    },
    {
      id: 407, // Keep original ID
      conditions: [{ field: 'hsCRP', operator: 'greaterThan', value: [1.0] }],
      logic: 'AND',
      response: `
<p>An <strong>hs-CRP (high-sensitivity C-Reactive Protein)</strong> level above 1.0 mg/L indicates chronic, low-grade systemic inflammation - a 'silent', low-level 'fire' that, over time, can damage blood vessels and is a foundational driver of <strong>atherosclerosis (plaque buildup)</strong>, insulin resistance, and neurodegeneration. Identifying and mitigating the source (e.g., <strong>visceral adiposity/belly fat</strong>, <strong>dysbiosis/gut imbalance</strong>, chronic infection) and adopting an anti-inflammatory diet are priorities.</p>
<p><strong>Nutraceutical Benefits:</strong> To help manage systemic inflammation:</p>
<ul>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> High doses of <strong>EPA (Eicosapentaenoic acid)</strong> and DHA from fish oil are highly effective at resolving inflammation, partly by generating <strong>'resolvins' (molecules that clean up inflammation)</strong>.</li>
    <li><strong>Curcumin:</strong> Active compound in turmeric; potent natural anti-inflammatory working on multiple pathways (e.g., <strong>NF-kB</strong>, a master inflammation switch).</li>
    <li><strong>Resveratrol:</strong> Compound from grapes reducing inflammation and protecting the cardiovascular system.</li>
    <li><strong>Boswellia serrata:</strong> Herbal extract specifically inhibiting a key inflammatory enzyme (<strong>5-LOX</strong>).</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Fish oil (EPA)', 'Fish oil (DHA)', 'Curcumin', 'Resveratrol', 'Boswellia serrata'] // Added EPA/DHA breakdown
    },
     // Added rule for Optimal hsCRP
    {
      id: 4071,
      conditions: [{ field: 'hsCRP', operator: 'lessThanOrEqual', value: [1.0] }],
      logic: 'AND',
      response: `
<p>The <strong>hs-CRP (high-sensitivity C-Reactive Protein)</strong> level is optimal (≤1.0 mg/L), indicating low levels of systemic inflammation. This is highly protective against chronic diseases like cardiovascular disease and metabolic syndrome. Maintaining an anti-inflammatory diet and lifestyle supports this healthy state.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain a healthy inflammatory response:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> A foundational supplement to keep inflammation low.</li>
    <li><strong>Curcumin:</strong> A potent antioxidant and anti-inflammatory to manage daily stressors.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Curcumin']
    }
  ],
  "Cardiovascular & Lipid Panel": [
    {
      id: 501, // Keep original ID
      conditions: [{ field: 'apoB', operator: 'greaterThanOrEqual', value: [90] }],
      logic: 'AND',
      response: `
<p>An <strong>Apolipoprotein B (ApoB)</strong> level ≥ 90 mg/dL indicates an elevated number of <strong>atherogenic (plaque-forming)</strong> lipoprotein particles (like LDL, VLDL). Think of cholesterol (LDL-C) as 'cargo' and ApoB as the 'delivery truck'. ApoB measures the number of trucks, which is the primary driver of atherosclerotic plaque and a more accurate risk marker than LDL-C alone. Aggressive management of diet and lifestyle is required.</p>
<p><strong>Nutraceutical Benefits:</strong> To support healthy lipid levels:</p>
<ul>
    <li><strong>Berberine:</strong> Helps the liver's 'LDL receptors' pull more ApoB-containing particles ('trucks') out of the bloodstream.</li>
    <li><strong>Phytosterols (Plant Sterols):</strong> Natural plant compounds blocking cholesterol absorption in the gut.</li>
    <li><strong>Vitamin B3 (Niacin):</strong> Can lower ApoB and triglycerides, but requires medical supervision due to potential side effects (flushing).</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Phytosterols / plant sterols', 'Vitamin B3 (Niacin)']
    },
     // Added rule for Optimal ApoB
    {
      id: 5011,
      conditions: [{ field: 'apoB', operator: 'lessThan', value: [90] }], // Optimal generally <80 or <90
      logic: 'AND',
      response: `
<p>The <strong>Apolipoprotein B (ApoB)</strong> level is within the desirable range (<90 mg/dL), indicating a lower number of potentially plaque-forming lipoprotein particles (the 'delivery trucks'). This suggests a reduced cardiovascular risk. Maintaining a heart-healthy diet and lifestyle supports this level.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain endothelial health and low inflammation:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Support overall cardiovascular and vascular health.</li>
    <li><strong>Garlic extract:</strong> Provides antioxidant support and helps maintain healthy blood pressure.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Garlic extract']
    },
    {
      id: 502, // Keep original ID
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'hdl', operator: 'lessThan', value: [40] }
      ],
      logic: 'AND',
      response: `
<p>Low <strong>HDL-C (High-Density Lipoprotein Cholesterol, the 'good' cholesterol)</strong> (<40 mg/dL for men) indicates impaired <strong>reverse cholesterol transport (the 'garbage truck' function removing excess cholesterol)</strong> and is an independent risk factor for <strong>CVD (Cardiovascular Disease)</strong>. Often associated with <strong>metabolic syndrome (high triglycerides/TGs, insulin resistance)</strong>. Lifestyle (<strong>HIIT/High-Intensity Interval Training</strong>, <strong>MUFAs/Monounsaturated Fats like olive oil</strong>) are primary interventions.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin B3 (Niacin):</strong> One of the most effective agents for raising HDL. Must use with medical guidance.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Help rebalance lipid panel, especially if TGs high (common with low HDL).</li>
</ul>
`,
      keyNutrient: ['Vitamin B3 (Niacin)', 'Omega-3 fatty acids']
    },
     // Added rule for Optimal Male HDL
    {
      id: 5021,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'hdl', operator: 'greaterThanOrEqual', value: [40] } // Or potentially higher optimal cutoff like 50
      ],
      logic: 'AND',
      response: `
<p><strong>HDL-C (High-Density Lipoprotein Cholesterol, 'good' cholesterol)</strong> is at or above the minimum recommended level for males (≥40 mg/dL). Higher levels (ideally >60 mg/dL) are generally more protective. This level suggests reasonable <strong>reverse cholesterol transport ('garbage truck' function)</strong>. Continued healthy lifestyle choices support optimal HDL.</p>
<p><strong>Nutraceutical Benefits:</strong> To support HDL quality (function) and overall lipid health:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Helps improve the quality and function of lipid particles.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids']
    },
    {
      id: 503, // Keep original ID
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'hdl', operator: 'lessThan', value: [50] }
      ],
      logic: 'AND',
      response: `
<p>Low <strong>HDL-C (High-Density Lipoprotein Cholesterol, 'good' cholesterol)</strong> (<50 mg/dL for women) indicates impaired <strong>reverse cholesterol transport (the 'garbage truck' function removing excess cholesterol)</strong> and is an independent risk factor for <strong>CVD (Cardiovascular Disease)</strong>, particularly in women. Often associated with <strong>metabolic syndrome (high triglycerides/TGs, insulin resistance)</strong>. Lifestyle (<strong>HIIT/High-Intensity Interval Training</strong>, <strong>MUFAs/Monounsaturated Fats like olive oil</strong>) are primary interventions.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin B3 (Niacin):</strong> One of most effective agents for raising HDL. Must use with medical guidance.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Help rebalance lipid panel, especially if TGs high (common with low HDL).</li>
</ul>
`,
      keyNutrient: ['Vitamin B3 (Niacin)', 'Omega-3 fatty acids']
    },
     // Added rule for Optimal Female HDL
    {
      id: 5031,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'hdl', operator: 'greaterThanOrEqual', value: [50] } // Or potentially higher optimal cutoff like 60
      ],
      logic: 'AND',
      response: `
<p><strong>HDL-C (High-Density Lipoprotein Cholesterol, 'good' cholesterol)</strong> is at or above the minimum recommended level for females (≥50 mg/dL). Higher levels (ideally >60-70 mg/dL) are generally more protective. This level suggests reasonable <strong>reverse cholesterol transport ('garbage truck' function)</strong>. Continued healthy lifestyle choices support optimal HDL.</p>
<p><strong>Nutraceutical Benefits:</strong> To support HDL quality (function) and overall lipid health:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Helps improve the quality and function of lipid particles.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids']
    },
    {
      id: 504, // Keep original ID
      conditions: [{ field: 'triglycerides', operator: 'greaterThanOrEqual', value: [100] }],
      logic: 'AND',
      response: `
<p><strong>Triglyceride</strong> levels >100 mg/dL (optimal <75) strongly indicate excess refined carbohydrate consumption and potential insulin resistance. Triglycerides are blood fats; high levels often result directly from eating more sugar/refined carbs (white bread, pasta, sweets) than used. This <strong>dyslipidemia (unhealthy blood fats)</strong> is key to metabolic syndrome and highly <strong>atherogenic (plaque-forming)</strong>, especially with low HDL. A lower-carbohydrate diet is most effective.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Fish Oil (High-EPA/DHA):</strong> Prescription-strength Omega-3 doses are clinically proven highly effective at lowering triglycerides.</li>
    <li><strong>Berberine:</strong> Improves insulin sensitivity, helping body process carbs/fats effectively, lowering triglycerides.</li>
</ul>
`,
      keyNutrient: ['Fish oil (EPA)', 'Fish oil (DHA)', 'Omega-3 fatty acids', 'Berberine'] // Added broader Omega-3
    },
     // Added rule for Optimal Triglycerides
    {
      id: 5041,
      conditions: [{ field: 'triglycerides', operator: 'lessThan', value: [100] }], // Optimal <75, acceptable <100-150 range varies
      logic: 'AND',
      response: `
<p><strong>Triglyceride</strong> levels are within the acceptable range (<100 mg/dL, optimally <75), suggesting good management of carbohydrate intake and healthy insulin sensitivity. Maintaining a diet low in refined sugars and carbohydrates supports these levels.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain healthy lipid and metabolic balance:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Provide foundational support for cardiovascular health and lipid management.</li>
    <li><strong>Chromium (chromium picolinate):</strong> Helps maintain good insulin sensitivity.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Chromium (chromium picolinate)']
    },
    {
      id: 505, // Keep original ID
      conditions: [{ field: 'lipoproteinA', operator: 'greaterThanOrEqual', value: [30] }],
      logic: 'AND',
      response: `
<p>An elevated <strong>Lipoprotein(a) [Lp(a)]</strong> (≥30 mg/dL or ~75 nmol/L) is a significant, genetically-influenced, causal risk factor for <strong>atherosclerotic CVD (plaque buildup)</strong> and <strong>aortic stenosis (heart valve narrowing)</strong>. Because it's "sticky," inflammatory, and largely resistant to lifestyle changes, management requires aggressive, lifelong control of all other modifiable risk factors (<strong>ApoB</strong>, inflammation, hypertension).</p>
<p><strong>Nutraceutical Benefits:</strong> While few agents significantly lower Lp(a), these may support associated pathways:</p>
<ul>
    <li><strong>Vitamin B3 (Niacin):</strong> One of few supplements modestly reducing Lp(a) in some; medical supervision required.</li>
    <li><strong>L-Carnitine:</strong> May help associated cardiovascular risks; limited data on lowering Lp(a) itself.</li>
    <li><strong>Vitamin C & Proline:</strong> Theoretically support artery wall integrity potentially damaged by Lp(a).</li>
</ul>
`,
      keyNutrient: ['Vitamin B3 (Niacin)', 'L-carnitine', 'Vitamin C', 'Proline']
    },
    // Added rule for Low/Normal Lp(a)
    {
      id: 5051,
      conditions: [{ field: 'lipoproteinA', operator: 'lessThan', value: [30] }],
      logic: 'AND',
      response: `
<p><strong>Lipoprotein(a) [Lp(a)]</strong> level is within the lower-risk range (<30 mg/dL or ~75 nmol/L). This indicates a lower genetically-influenced risk for specific types of cardiovascular events associated with this particle. Continue focusing on managing other modifiable cardiovascular risk factors.</p>
<p><strong>Nutraceutical Benefits:</strong> To support general cardiovascular and endothelial (blood vessel lining) health:</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Foundational support for heart health and inflammation.</li>
    <li><strong>Garlic extract:</strong> Supports healthy blood pressure and provides antioxidant benefits.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Garlic extract']
    }
  ],
  "Metabolic & Glucose Health": [
    {
      id: 601, // Keep original ID
      conditions: [{ field: 'fastingGlucose', operator: 'between', value: [90, 99] }],
      logic: 'AND',
      response: `
<p>The fasting glucose is in the high-normal range (optimal 75-89 mg/dL). While not pre-diabetic, it's higher than optimal and can be an early sign of declining insulin sensitivity or <strong>hepatic insulin resistance (liver becoming resistant to insulin)</strong>. Important opportunity for proactive intervention (reducing sugar/refined carbs) before progression.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Berberine:</strong> Helps cells respond better to insulin and reduces liver sugar production.</li>
    <li><strong>Chromium:</strong> Essential mineral partnering with insulin to move glucose into cells.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Chromium (chromium picolinate)']
    },
    { // Renamed from 602
        id: 602,
        conditions: [{ field: 'fastingGlucose', operator: 'lessThan', value: [90] }], // Optimal generally 75-89
        logic: 'AND',
        response: `
<p>The fasting glucose level is in the optimal range (<90 mg/dL), indicating good insulin sensitivity and metabolic health. Excellent result showing effective blood sugar handling. Maintenance via whole-foods diet and regular activity appropriate.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain excellent insulin sensitivity:</p>
<ul>
    <li><strong>Magnesium:</strong> A key cofactor for insulin signaling and glucose metabolism.</li>
    <li><strong>Chromium (chromium picolinate):</strong> Helps support the efficiency of insulin.</li>
</ul>
`,
        keyNutrient: ['Magnesium', 'Chromium (chromium picolinate)']
    },
    // Added rule for Prediabetes Glucose
    {
        id: 6021,
        conditions: [{ field: 'fastingGlucose', operator: 'between', value: [100, 125] }],
        logic: 'AND',
        response: `
<p>Fasting glucose is in the <strong>prediabetic range (100-125 mg/dL)</strong>. This indicates impaired glucose tolerance and a high risk of developing type 2 diabetes. Immediate and consistent lifestyle changes focusing on diet (low-glycemic, whole foods) and exercise are crucial for reversing this trend. Consult with your healthcare provider for a comprehensive management plan.</p>
<p><strong>Nutraceutical Benefits:</strong> (In addition to lifestyle changes)</p>
<ul>
    <li><strong>Berberine:</strong> Highly effective at improving insulin sensitivity and lowering blood sugar.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> Supports cellular glucose uptake and antioxidant defense.</li>
    <li><strong>Magnesium:</strong> Important cofactor for insulin signaling.</li>
</ul>
`,
        keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Magnesium']
    },
    // Added rule for Diabetes Glucose Range
    {
        id: 6022,
        conditions: [{ field: 'fastingGlucose', operator: 'greaterThanOrEqual', value: [126] }],
        logic: 'AND',
        response: `
<p>Fasting glucose is in the <strong>diabetic range (≥126 mg/dL)</strong>. This requires immediate medical attention and management under the guidance of a healthcare professional. Lifestyle interventions are essential, often alongside medication, to manage blood sugar and prevent complications.</p>
<p><strong>Nutraceutical Benefits:</strong> (As adjunct support under medical supervision)</p>
<ul>
    <li><strong>Berberine:</strong> Can significantly aid blood sugar control. Must be used cautiously with diabetes medications.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> May help with insulin sensitivity and <strong>diabetic neuropathy (nerve damage)</strong>.</li>
    <li><strong>Chromium:</strong> Supports insulin action.</li>
</ul>
`,
        keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Chromium (chromium picolinate)']
    },
    {
      id: 603, // Keep original ID
      conditions: [{ field: 'hba1c', operator: 'between', value: [5.5, 6.4] }], // Note: 5.7-6.4 is standard prediabetes range
      logic: 'AND',
      response: `
<p>An <strong>HbA1c (average blood sugar over ~3 months)</strong> in this range (5.5-6.4%; standard <strong>prediabetes 5.7-6.4%</strong>) reflects <strong>chronic hyperglycemia (high blood sugar)</strong> and significant insulin resistance. High risk for <strong>T2DM (Type 2 Diabetes)</strong> and <strong>microvascular complications (nerve, eye, kidney damage)</strong>. Serious warning sign, often reversible with dedicated diet changes (reduce sugar/refined carbs) and exercise. A structured plan is essential.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Berberine:</strong> Potent compound improving insulin sensitivity and lowering blood sugar via several pathways.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> Antioxidant helping cells take up glucose, potentially protecting nerves from high sugar damage.</li>
    <li><strong>Vitamin B1 (Thiamine):</strong> High blood sugar depletes thiamine, critical for carb metabolism.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Vitamin B1 (Thiamine)']
    },
    // Added Rule for Optimal HbA1c
    {
      id: 6031,
      conditions: [{ field: 'hba1c', operator: 'lessThan', value: [5.5] }], // Optimal generally <5.5% or <5.7%
      logic: 'AND',
      response: `
<p><strong>HbA1c (average blood sugar over ~3 months)</strong> is in the optimal range (<5.5-5.7%). This indicates excellent long-term blood sugar control and low risk for diabetes-related complications. Maintaining a healthy diet and active lifestyle supports this level.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain excellent insulin sensitivity:</p>
<ul>
    <li><strong>Magnesium:</strong> A key cofactor for insulin signaling and glucose metabolism.</li>
    <li><strong>Chromium (chromium picolinate):</strong> Helps support the efficiency of insulin.</li>
</ul>
`,
      keyNutrient: ['Magnesium', 'Chromium (chromium picolinate)']
    },
     // Added Rule for Diabetes HbA1c Range
    {
      id: 6032,
      conditions: [{ field: 'hba1c', operator: 'greaterThanOrEqual', value: [6.5] }],
      logic: 'AND',
      response: `
<p><strong>HbA1c (average blood sugar over ~3 months)</strong> is in the <strong>diabetic range (≥6.5%)</strong>. This confirms chronic high blood sugar and requires medical diagnosis and management by a healthcare professional to control glucose levels and prevent serious long-term complications affecting nerves, eyes, kidneys, and the cardiovascular system.</p>
<p><strong>Nutraceutical Benefits:</strong> (As adjunct support under medical supervision)</p>
<ul>
    <li><strong>Berberine:</strong> Can significantly aid blood sugar control. Must be used cautiously with diabetes medications.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> May help with insulin sensitivity and <strong>diabetic neuropathy (nerve damage)</strong>.</li>
    <li><strong>Chromium:</strong> Supports insulin action.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Chromium (chromium picolinate)']
    },
    {
      id: 604, // Keep original ID
      conditions: [{ field: 'fastingInsulin', operator: 'greaterThan', value: [7] }],
      logic: 'AND',
      response: `
<p><strong>Fasting insulin</strong> is above the optimal functional range (<7 µIU/mL), a direct, early marker of <strong>hyperinsulinemia (high insulin)</strong> and <strong>insulin resistance</strong>. Insulin is the 'key' unlocking cells for sugar; when cells resist, body produces more insulin ('shouts louder'). This high insulin itself promotes fat storage (esp. belly fat) and inflammation. Very early, important sign of metabolic trouble driving dysfunction, hypertension, dyslipidemia. Improving insulin sensitivity is priority.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Berberine:</strong> Highly effective at 're-sensitizing' cells to insulin, allowing body to produce less.</li>
    <li><strong>Magnesium:</strong> Critical mineral for insulin receptor function; deficiency strongly linked to insulin resistance.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Magnesium']
    },
    // Added rule for Optimal Fasting Insulin
    {
      id: 6041,
      conditions: [{ field: 'fastingInsulin', operator: 'lessThanOrEqual', value: [7] }], // Optimal often cited as <5 or <7
      logic: 'AND',
      response: `
<p><strong>Fasting insulin</strong> is within the optimal functional range (≤7 µIU/mL, ideally <5), indicating good <strong>insulin sensitivity</strong>. This suggests your cells are responding appropriately to insulin's signal to take up glucose, which is protective against metabolic dysfunction. Maintaining a low-glycemic diet supports this healthy state.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain excellent insulin sensitivity:</p>
<ul>
    <li><strong>Magnesium:</strong> A key cofactor for insulin signaling and glucose metabolism.</li>
    <li><strong>Chromium (chromium picolinate):</strong> Helps support the efficiency of insulin.</li>
</ul>
`,
      keyNutrient: ['Magnesium', 'Chromium (chromium picolinate)']
    },
    {
      id: 605, // Keep original ID
      conditions: [{ field: 'homaIR', operator: 'greaterThanOrEqual', value: [1.8] }],
      logic: 'AND',
      response: `
<p>The elevated <strong>HOMA-IR score (Homeostatic Model Assessment for Insulin Resistance; optimal <1.8, ideally <1.0)</strong>, calculated from fasting glucose/insulin, confirms <strong>insulin resistance</strong>. It reflects <strong>compensatory hyperinsulinemia (high insulin)</strong> needed to maintain relatively normal blood sugar. It means body works much harder than it should. Central problem in pre-diabetes/metabolic syndrome; addressing via diet/lifestyle is key.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Berberine:</strong> Highly effective at improving insulin sensitivity, directly improving HOMA-IR.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> Antioxidant helping cells become more sensitive to insulin's signal.</li>
    <li><strong>Magnesium:</strong> Essential for proper insulin signaling at cellular level.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Magnesium']
    },
     // Added rule for Optimal HOMA-IR
    {
      id: 6051,
      conditions: [{ field: 'homaIR', operator: 'lessThan', value: [1.8] }], // Ideally <1.0
      logic: 'AND',
      response: `
<p>The <strong>HOMA-IR score (Homeostatic Model Assessment for Insulin Resistance)</strong> is within the optimal range (<1.8, ideally <1.0). This calculation indicates good <strong>insulin sensitivity</strong>, meaning your body is efficiently using insulin to manage blood sugar. This is a strong indicator of good metabolic health.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain excellent insulin sensitivity:</p>
<ul>
    <li><strong>Magnesium:</strong> A key cofactor for insulin signaling and glucose metabolism.</li>
    <li><strong>Chromium (chromium picolinate):</strong> Helps support the efficiency of insulin.</li>
</ul>
`,
      keyNutrient: ['Magnesium', 'Chromium (chromium picolinate)']
    },
    {
      id: 606, // Keep original ID
      conditions: [{ field: 'uricAcid', operator: 'greaterThan', value: [5.7] }],
      logic: 'AND',
      response: `
<p><strong>Uric acid</strong> is elevated (>5.7 mg/dL). Beyond causing gout, <strong>hyperuricemia (high uric acid)</strong> acts as a 'danger signal' and is an independent risk factor for metabolic syndrome, <strong>hypertension (via inhibiting eNOS - an enzyme crucial for blood vessel relaxation)</strong>, and kidney disease. <strong>Fructose (sugar)</strong> metabolism (esp. from high-fructose corn syrup) and <strong>alcohol (esp. beer)</strong> are key drivers. Limiting fructose, alcohol, <strong>purines (in some meats/seafood)</strong> advised.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Quercetin:</strong> Plant bioflavonoid shown to help body excrete uric acid and reduce production.</li>
    <li><strong>Vitamin C:</strong> Moderate doses may help increase kidney excretion of uric acid.</li>
</ul>
`,
      keyNutrient: ['Quercetin', 'Vitamin C']
    },
     // Added rule for Optimal Uric Acid
    {
      id: 6061,
      conditions: [{ field: 'uricAcid', operator: 'lessThanOrEqual', value: [5.7] }],
      logic: 'AND',
      response: `
<p><strong>Uric acid</strong> level is within the optimal range (≤5.7 mg/dL). Maintaining this level reduces the risk of gout and is associated with better metabolic and cardiovascular health. Continuing to moderate fructose, alcohol, and purine intake helps sustain this healthy level.</p>
<p><strong>Nutraceutical Benefits:</strong> To support healthy uric acid metabolism:</p>
<ul>
    <li><strong>Vitamin C:</strong> Supports healthy kidney function and uric acid excretion.</li>
    <li><strong>Quercetin:</strong> Provides antioxidant support and helps maintain a healthy inflammatory response.</li>
</ul>
`,
      keyNutrient: ['Vitamin C', 'Quercetin']
    }
  ],
  "Liver & Kidney Health": [
    {
        id: 701, // Keep original ID
        conditions: [{ field: 'alt', operator: 'greaterThan', value: [25] }],
        logic: 'AND',
        response: `
<p><strong>Alanine Aminotransferase (ALT)</strong>, a liver enzyme, is above the optimal functional range (<25 U/L). While potentially within 'normal' lab range, levels >25 suggest <strong>hepatocellular inflammation (liver cell stress/damage)</strong>. Sensitive early marker for <strong>Non-Alcoholic Fatty Liver Disease (NAFLD)</strong>, especially with metabolic dysfunction. Liver-supportive strategies warranted.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Milk Thistle (Silymarin):</strong> Most well-known herb for liver health; acts as antioxidant, supports liver cell regeneration.</li>
    <li><strong>Taurine:</strong> Amino acid protecting liver cells from oxidative stress, aids bile formation.</li>
    <li><strong>N-acetylcysteine (NAC):</strong> Boosts <strong>glutathione (master antioxidant)</strong> crucial for liver detox processes.</li>
</ul>
`,
        keyNutrient: ['Milk thistle (silymarin)', 'Taurine', 'N-acetylcysteine (NAC)']
    },
     // Added rule for Optimal ALT
    {
        id: 7011,
        conditions: [{ field: 'alt', operator: 'lessThanOrEqual', value: [25] }],
        logic: 'AND',
        response: `
<p><strong>Alanine Aminotransferase (ALT)</strong> is within the optimal functional range (≤25 U/L), suggesting minimal liver cell inflammation or stress. Maintaining a healthy diet, avoiding excessive alcohol, and managing metabolic health support continued liver wellness.</p>
<p><strong>Nutraceutical Benefits:</strong> For general liver protection and detoxification support:</p>
<ul>
    <li><strong>Milk Thistle (Silymarin):</strong> Provides proactive support for liver cell health against daily toxin exposure.</li>
</ul>
`,
        keyNutrient: ['Milk thistle (silymarin)']
    },
    {
        id: 702, // Keep original ID
        conditions: [{ field: 'ast', operator: 'greaterThan', value: [25] }],
        logic: 'AND',
        response: `
<p><strong>Aspartate Aminotransferase (AST)</strong>, an enzyme, is above optimal functional range (<25 U/L). Less liver-specific than ALT (also in muscle), elevation can indicate liver cell stress. <strong>AST/ALT ratio</strong> analysis helpful. B-vitamin <strong>cofactors (esp. B6)</strong> needed for AST metabolism. Signal to focus on liver/metabolic health.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Milk Thistle (Silymarin):</strong> Supports overall liver protection and function.</li>
    <li><strong>Vitamin B6 (Pyridoxine):</strong> Provides the required 'helper' (cofactor) for the AST enzyme to function correctly.</li>
</ul>
`,
        keyNutrient: ['Milk thistle (silymarin)', 'Vitamin B6 (Pyridoxine)'] // Refined to just B6
    },
     // Added rule for Optimal AST
    {
        id: 7021,
        conditions: [{ field: 'ast', operator: 'lessThanOrEqual', value: [25] }],
        logic: 'AND',
        response: `
<p><strong>Aspartate Aminotransferase (AST)</strong> is within the optimal functional range (≤25 U/L). As this enzyme is also found in muscle, this result, especially if ALT is also optimal, suggests good liver health and absence of significant muscle damage.</p>
<p><strong>Nutraceutical Benefits:</strong> For general liver protection and metabolic support:</p>
<ul>
    <li><strong>Milk Thistle (Silymarin):</strong> Provides proactive support for liver cell health.</li>
    <li><strong>Vitamin B6 (Pyridoxine):</strong> Ensures adequate cofactors for AST and other metabolic enzymes.</li>
</ul>
`,
        keyNutrient: ['Milk thistle (silymarin)', 'Vitamin B6 (Pyridoxine)']
    },
    {
        id: 703, // Keep original ID
        conditions: [{ field: 'ggt', operator: 'greaterThan', value: [30] }],
        logic: 'AND',
        response: `
<p><strong>Gamma-Glutamyl Transferase (GGT)</strong> is elevated (>30 U/L; optimal <20). GGT is sensitive marker for <strong>hepatobiliary stress (liver/bile duct)</strong> and <strong>oxidative stress</strong>. Strongly associated with alcohol, <strong>NAFLD ('fatty liver')</strong>, toxin exposure, and low <strong>glutathione status (body's master antioxidant used up)</strong>. Important warning sign; significant independent predictor of mortality. Reduce liver burdens.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Glutathione:</strong> Directly replenishes antioxidant GGT elevation signals is depleted.</li>
    <li><strong>N-acetylcysteine (NAC):</strong> Provides raw material (cysteine) for body to make its own glutathione.</li>
    <li><strong>Milk Thistle (Silymarin):</strong> Protects liver cells from oxidative stress indicated by high GGT.</li>
</ul>
`,
        keyNutrient: ['Glutathione', 'N-acetylcysteine (NAC)', 'Milk thistle (silymarin)']
    },
     // Added rule for Optimal GGT
    {
        id: 7031,
        conditions: [{ field: 'ggt', operator: 'lessThanOrEqual', value: [30] }], // Optimal <20
        logic: 'AND',
        response: `
<p><strong>Gamma-Glutamyl Transferase (GGT)</strong> is within the acceptable range (≤30 U/L, optimally <20). This suggests lower levels of <strong>oxidative stress</strong> and healthy liver/biliary function. Avoiding excessive alcohol and maintaining antioxidant status helps keep GGT low.</p>
<p><strong>Nutraceutical Benefits:</strong> To support the body's primary antioxidant system:</p>
<ul>
    <li><strong>N-acetylcysteine (NAC):</strong> Provides a precursor to maintain healthy glutathione levels.</li>
    <li><strong>Selenium:</strong> An essential cofactor for the glutathione peroxidase enzyme.</li>
</ul>
`,
        keyNutrient: ['N-acetylcysteine (NAC)', 'Selenium']
    },
    {
        id: 704, // Keep original ID
        conditions: [{ field: 'eGFR', operator: 'lessThan', value: [90] }],
        logic: 'AND',
        response: `
<p>The <strong>eGFR (estimated Glomerular Filtration Rate - measure of kidney filtering)</strong> is below 90 mL/min/1.73m², potentially indicating early <strong>renal dysfunction (Stage 2 Chronic Kidney Disease/CKD if persistent >3 months)</strong>. Crucial to manage primary drivers (hypertension, hyperglycemia), ensure adequate hydration. Medical supervision required.</p>
<p><strong>Nutraceutical Benefits:</strong> To support kidney health (always check with doctor):</p>
<ul>
    <li><strong>Resveratrol:</strong> Antioxidant may help protect kidney structures (glomeruli) from oxidative stress.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> May help reduce inflammation, important for kidney health.</li>
</ul>
`,
      keyNutrient: ['Resveratrol', 'Omega-3 fatty acids']
    },
     // Added rule for Optimal eGFR
    {
        id: 7041,
        conditions: [{ field: 'eGFR', operator: 'greaterThanOrEqual', value: [90] }],
        logic: 'AND',
        response: `
<p>The <strong>eGFR (estimated Glomerular Filtration Rate)</strong> is optimal (≥90 mL/min/1.73m²), indicating healthy kidney filtration function. Maintaining good hydration, managing blood pressure, and controlling blood sugar are key to preserving kidney health long-term.</p>
<p><strong>Nutraceutical Benefits:</strong> For antioxidant protection and cardiovascular support (which benefits kidneys):</p>
<ul>
    <li><strong>Omega-3 fatty acids (EPA/DHA):</strong> Support healthy inflammation levels and blood vessel health.</li>
    <li><strong>Coenzyme Q10:</strong> Provides antioxidant support to energy-intensive kidney cells.</li>
</ul>
`,
        keyNutrient: ['Omega-3 fatty acids', 'Coenzyme Q10']
    }
  ],
  "Hormonal & Thyroid Panel": [
    {
      id: 801, // Keep original ID
      conditions: [{ field: 'tsh', operator: 'greaterThan', value: [2.5] }],
      logic: 'AND',
      response: `
<p><strong>TSH (Thyroid Stimulating Hormone)</strong> is above optimal functional range (0.5-2.5 µIU/mL). TSH is brain's signal ('shout') to thyroid; high TSH means brain shouts loudly, suggesting sluggish thyroid (<strong>subclinical hypothyroidism</strong>). Can impair metabolism, energy, mood (fatigue, weight gain, brain fog, coldness), risk factor for <strong>dyslipidemia (unhealthy cholesterol)</strong>. Full panel (Free T4, Free T3, <strong>TPO/Tg Antibodies</strong>) needed for proper diagnosis.</p>
<p><strong>Nutraceutical Benefits:</strong> To support thyroid hormone production (check with doctor first):</p>
<ul>
    <li><strong>Selenium:</strong> Critical mineral for converting 'storage' T4 into 'active' T3 hormone; protects thyroid from inflammation.</li>
    <li><strong>Zinc:</strong> Key mineral required for synthesizing thyroid hormones.</li>
    <li><strong>Ashwagandha:</strong> Adaptogen shown in some studies to support thyroid by stimulating T4 production.</li>
</ul>
`,
      keyNutrient: ['Selenium', 'Zinc', 'Ashwagandha']
    },
     // Added rule for Optimal TSH
    {
      id: 8011,
      conditions: [{ field: 'tsh', operator: 'between', value: [0.5, 2.5] }],
      logic: 'AND',
      response: `
<p><strong>TSH (Thyroid Stimulating Hormone)</strong> is within the optimal functional range (0.5-2.5 µIU/mL). This suggests the communication between your brain and thyroid gland is working well, supporting healthy metabolism and energy levels. Maintaining adequate intake of iodine, selenium, and zinc helps support continued optimal function.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain optimal thyroid hormone production:</p>
<ul>
    <li><strong>Selenium:</strong> Provides the essential cofactor for converting T4 to active T3.</li>
    <li><strong>Zinc:</strong> A key mineral involved in TSH synthesis and thyroid hormone production.</li>
</ul>
`,
      keyNutrient: ['Selenium', 'Zinc']
    },
     // Added rule for Low TSH (potential hyperthyroidism)
    {
      id: 8012,
      conditions: [{ field: 'tsh', operator: 'lessThan', value: [0.5] }],
      logic: 'AND',
      response: `
<p><strong>TSH (Thyroid Stimulating Hormone)</strong> is below the optimal functional range (<0.5 µIU/mL). This may indicate <strong>hyperthyroidism (overactive thyroid)</strong> or pituitary issues. The brain is 'whispering' because the thyroid might be producing too much hormone on its own. Symptoms can include anxiety, weight loss, rapid heartbeat, and heat intolerance. Further evaluation with Free T4, Free T3, and potentially thyroid antibodies is essential. Nutritional interventions are complex and must be guided by a physician.</p>
`,
      keyNutrient: null // Requires medical diagnosis
    },
    {
      id: 802, // Keep original ID
      conditions: [{ field: 'tpoAb', operator: 'greaterThanOrEqual', value: [9] }],
      logic: 'AND',
      response: `
<p>Elevated <strong>TPO antibodies (Thyroid Peroxidase Antibodies)</strong> confirm <strong>autoimmune thyroiditis (Hashimoto's)</strong>, where body attacks thyroid gland. Most common cause of hypothyroidism (low thyroid). Management requires supporting thyroid function (if hypothyroid) and, critically, modulating autoimmune response. Investigating gut health (intestinal permeability/'leaky gut') and food triggers (e.g., gluten) is primary step to calm attack.</p>
<p><strong>Nutraceutical Benefits:</strong> To support thyroid health in autoimmune context:</p>
<ul>
    <li><strong>Selenium:</strong> Clinically shown to help reduce TPO antibody levels by supporting thyroid's antioxidant systems.</li>
    <li><strong>Vitamin D:</strong> Deficiency strongly linked to autoimmunity; optimizing levels essential for modulating immune system.</li>
</ul>
`,
      keyNutrient: ['Selenium', 'Vitamin D']
    },
     // Added rule for Negative TPO Antibodies
    {
      id: 8021,
      conditions: [{ field: 'tpoAb', operator: 'lessThan', value: [9] }],
      logic: 'AND',
      response: `
<p><strong>TPO antibodies (Thyroid Peroxidase Antibodies)</strong> are within the normal range (<9 IU/mL). This makes Hashimoto's thyroiditis (autoimmune attack on the thyroid) less likely as a cause for any thyroid dysfunction, though other thyroid antibodies (like Thyroglobulin Ab) could still be considered if clinically indicated.</p>
<p><strong>Nutraceutical Benefits:</strong> To support general immune and thyroid health:</p>
<ul>
    <li><strong>Vitamin D:</strong> Foundational support for a balanced immune system.</li>
    <li><strong>Selenium:</strong> Supports normal thyroid enzyme function and antioxidant protection.</li>
</ul>
`,
      keyNutrient: ['Vitamin D', 'Selenium']
    },
    // Added similar rule for Thyroglobulin Antibodies
    {
      id: 8022,
      conditions: [{ field: 'thyroglobulinAb', operator: 'greaterThanOrEqual', value: [4] }], // Reference range <4.0
      logic: 'AND',
      response: `
<p>Elevated <strong>Thyroglobulin antibodies (TgAb)</strong> can also indicate <strong>autoimmune thyroiditis (Hashimoto's)</strong>, sometimes appearing even if TPO antibodies are normal. Similar to TPOAb, management involves supporting thyroid function and modulating the autoimmune response, often focusing on gut health and inflammation reduction.</p>
<p><strong>Nutraceutical Benefits:</strong> Similar to TPOAb elevation, focus on immune modulation:</p>
<ul>
    <li><strong>Selenium:</strong> May help support thyroid antioxidant systems and potentially modulate antibody levels.</li>
    <li><strong>Vitamin D:</strong> Crucial for overall immune system balance.</li>
</ul>
`,
      keyNutrient: ['Selenium', 'Vitamin D']
    },
    {
      id: 8023,
      conditions: [{ field: 'thyroglobulinAb', operator: 'lessThan', value: [4] }],
      logic: 'AND',
      response: `
<p><strong>Thyroglobulin antibodies (TgAb)</strong> are within the normal range (<4.0 IU/mL). This further reduces the likelihood of Hashimoto's thyroiditis being the primary issue if thyroid dysfunction is present.</p>
<p><strong>Nutraceutical Benefits:</strong> To support general immune and thyroid health:</p>
<ul>
    <li><strong>Vitamin D:</strong> Foundational support for a balanced immune system.</li>
    <li><strong>Selenium:</strong> Supports normal thyroid enzyme function and antioxidant protection.</li>
</ul>
`,
      keyNutrient: ['Vitamin D', 'Selenium']
    },
    {
      id: 803, // Keep original ID
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'totalTestosterone', operator: 'lessThan', value: [500] }
      ],
      logic: 'AND',
      response: `
<p>Total testosterone is suboptimal (optimal >500 ng/dL for males). While not necessarily 'low' by all labs, levels <500 impact energy, mood, cognition, libido, body composition (muscle building). Foundational lifestyle (sleep, stress mgmt, resistance training) paramount. Medical evaluation needed to rule out <strong>primary/secondary hypogonadism (testicular or brain signaling issues)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong> To support healthy testosterone production:</p>
<ul>
    <li><strong>Zinc:</strong> Critical mineral for testosterone synthesis; deficiency linked to low levels.</li>
    <li><strong>Vitamin D:</strong> Acts hormone-like; optimal levels essential for healthy testosterone production.</li>
    <li><strong>Boron:</strong> Trace mineral shown to increase free testosterone by reducing binding-partner <strong>SHBG</strong>.</li>
</ul>
`,
      keyNutrient: ['Zinc', 'Vitamin D', 'Boron']
    },
    // Added rule for Optimal Male Testosterone
    {
      id: 8031,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'totalTestosterone', operator: 'greaterThanOrEqual', value: [500] } // Optimal range varies, 500 often cited minimum
      ],
      logic: 'AND',
      response: `
<p>Total testosterone is within or above the optimal functional range (≥500 ng/dL) for males. This level supports healthy energy, mood, libido, cognitive function, and body composition. Maintaining healthy lifestyle factors like sleep, stress management, and resistance exercise helps preserve optimal levels.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain optimal hormone production and bioavailability:</p>
<ul>
    <li><strong>Zinc:</strong> Ensures foundational mineral cofactor for testosterone synthesis is present.</li>
    <li><strong>Boron:</strong> Helps maintain healthy levels of <strong>SHBG</strong>, ensuring testosterone remains free and active.</li>
</ul>
`,
      keyNutrient: ['Zinc', 'Boron']
    },
    {
      id: 804, // Keep original ID
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'shbg', operator: 'greaterThan', value: [50] } // Upper end of typical male range
      ],
      logic: 'AND',
      response: `
<p>Elevated <strong>SHBG (Sex Hormone-Binding Globulin - >50 nmol/L for males)</strong> reduces free, <strong>bioavailable testosterone</strong>. SHBG is a 'carrier' protein ('taxi') binding testosterone; high levels hold too much, so even with normal total T, usable (free) amount is low, causing <strong>hypogonadal symptoms</strong>. Often linked to hyperinsulinemia, inflammation, high estrogen. Addressing metabolic health is key.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Boron:</strong> Trace mineral shown effective at lowering SHBG, 'freeing up' more available testosterone.</li>
</ul>
`,
      keyNutrient: ['Boron']
    },
    // Added rule for Optimal/Low Male SHBG
    {
      id: 8041,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'shbg', operator: 'lessThanOrEqual', value: [50] } // Typical male range approx 15-55
      ],
      logic: 'AND',
      response: `
<p><strong>SHBG (Sex Hormone-Binding Globulin)</strong> is within the typical range for males (≤50 nmol/L). This suggests that a healthy proportion of your total testosterone is likely available in its free, usable form. Very low SHBG (e.g., <15) can sometimes be associated with insulin resistance, but levels within this range are generally favorable for testosterone bioavailability.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain healthy SHBG and metabolic function:</p>
<ul>
    <li><strong>Boron:</strong> Helps maintain SHBG levels in a healthy range.</li>
    <li><strong>Magnesium:</strong> Supports insulin sensitivity, which influences SHBG.</li>
</ul>
`,
      keyNutrient: ['Boron', 'Magnesium']
    },
     // Added rules for Female SHBG (more complex range)
    {
      id: 8042,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'shbg', operator: 'greaterThan', value: [120] } // Upper end of typical female range can vary, using 120 as example
      ],
      logic: 'AND',
      response: `
<p>Elevated <strong>SHBG (Sex Hormone-Binding Globulin - > ~120 nmol/L for females, varies with age/status)</strong> reduces free, bioavailable estrogen and testosterone. High SHBG in women can be linked to factors like oral contraceptive use, hyperthyroidism, or very low body fat/calorie intake. It can sometimes contribute to low libido or other symptoms related to low free hormone levels.</p>
<p><strong>Nutraceutical Benefits:</strong> (Focus on underlying causes, less direct SHBG lowering)</p>
<ul>
    <li><strong>Zinc:</strong> Supports overall hormone production balance.</li>
    <li><strong>Boron:</strong> May help gently modulate high SHBG levels.</li>
</ul>
`,
      keyNutrient: ['Zinc', 'Boron']
    },
    {
      id: 8043,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'shbg', operator: 'lessThan', value: [30] } // Lower end of typical female range varies, using 30 as example
      ],
      logic: 'AND',
      response: `
<p>Low <strong>SHBG (Sex Hormone-Binding Globulin - < ~30 nmol/L for females, varies)</strong> increases free, bioavailable estrogen and testosterone. While sometimes desirable, very low SHBG is often associated with insulin resistance, <strong>PCOS (Polycystic Ovary Syndrome)</strong>, and hypothyroidism. Addressing underlying metabolic or thyroid issues is key.</p>
<p><strong>Nutraceutical Benefits:</strong> Focus on insulin sensitivity if indicated:</p>
<ul>
    <li><strong>Berberine:</strong> Improves insulin sensitivity, which can positively influence SHBG.</li>
    <li><strong>Magnesium:</strong> Supports insulin signaling.</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Magnesium']
    },
     {
      id: 8044,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'shbg', operator: 'between', value: [30, 120] } // Example typical range
      ],
      logic: 'AND',
      response: `
<p><strong>SHBG (Sex Hormone-Binding Globulin)</strong> is within the typical range for females (~30-120 nmol/L, varies with age/status). This suggests a generally healthy balance for the bioavailability of sex hormones like estrogen and testosterone.</p>
<p><strong>Nutraceutical Benefits:</strong> To support continued hormone and metabolic balance:</p>
<ul>
    <li><strong>B-Complex Vitamins:</strong> Essential for liver pathways that metabolize hormones.</li>
    <li><strong>Magnesium:</strong> Supports insulin sensitivity, which is closely linked to SHBG.</li>
</ul>
`,
      keyNutrient: ['Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Magnesium']
    },
    {
      id: 805, // Keep original ID - Note: Estradiol range is highly context-dependent (cycle phase, menopause)
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'estradiol', operator: 'greaterThan', value: [150] } // Example: Potentially high outside mid-cycle peak
      ],
      logic: 'AND',
      response: `
<p><strong>Estradiol (E2, main estrogen)</strong> appears elevated (assuming non-ovulatory phase; >~150 pg/mL). "Estrogen dominance" (absolute high E2 or low relative to progesterone) can cause heavy periods, PMS, mood swings. Often driven by poor <strong>estrogen detoxification (liver Phase I/II pathways)</strong>, <strong>gut dysbiosis (imbalance affecting estrogen clearance)</strong>, or high <strong>aromatase activity (converting testosterone to estrogen)</strong>. Supporting hepatic detox/gut health key.</p>
<p><strong>Nutraceutical Benefits:</strong> To support healthy estrogen metabolism:</p>
<ul>
    <li><em>No key nutrients were pre-assigned, but common support includes DIM (Diindolylmethane - promotes healthier estrogen breakdown), Calcium D-Glucarate (aids liver detox), and Sulforaphane (from broccoli sprouts - supports Phase II detox). Check supplement availability.</em></li>
</ul>
`,
       keyNutrient: [] // Requires specific supplements not in list
    },
     // Added rule for Low Estradiol (Female)
    {
      id: 8051,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'estradiol', operator: 'lessThan', value: [30] } // Example: Potentially low in premenopausal women outside early cycle
      ],
      logic: 'AND',
      response: `
<p><strong>Estradiol (E2, main estrogen)</strong> appears low (<~30 pg/mL, depends on cycle phase/menopausal status). Low estrogen can lead to symptoms like vaginal dryness, hot flashes (if menopausal), low mood, and increased risk of bone loss. Causes vary from natural menopause to excessive exercise/low body fat, or pituitary issues. Medical evaluation is needed.</p>
<p><strong>Nutraceutical Benefits:</strong> (Supportive, not direct hormone replacement)</p>
<ul>
    <li><strong>Maca Root:</strong> <strong>Adaptogen (non-hormonal)</strong> that may help support the endocrine system's balance.</li>
    <li><strong>Vitamin D & Calcium:</strong> Crucial for bone health, especially important if estrogen is low.</li>
</ul>
`,
       keyNutrient: ['Maca root', 'Vitamin D', 'Calcium']
    },
    {
      id: 806, // Keep original ID
      conditions: [{ field: 'cortisolAM', operator: 'greaterThan', value: [18] }], // Upper end of typical AM range ~18-20 ug/dL
      logic: 'AND',
      response: `
<p>Morning <strong>Cortisol (AM Cortisol - 'wake-up' stress hormone)</strong> is high (>18 ug/dL), indicating pronounced stress response or <strong>HPA axis dysregulation (hypercortisolism)</strong>; body starts day in 'alarm' state. Chronically high cortisol drives insulin resistance, <strong>catabolism (tissue breakdown)</strong>, suppresses immune function, causes 'wired but tired' feeling, anxiety, belly fat, sugar cravings. Robust stress management + adaptogenic support priority.</p>
<p><strong>Nutraceutical Benefits:</strong> To help modulate the cortisol response:</p>
<ul>
    <li><strong>Phosphatidylserine:</strong> Phospholipid shown to help blunt cortisol response to stress.</li>
    <li><strong>Ashwagandha:</strong> Adaptogen helping body become resilient to stress, shown to lower cortisol.</li>
    <li><strong>Rhodiola rosea:</strong> Adaptogen buffering against stress, good for stress-related fatigue.</li>
    <li><strong>L-theanine:</strong> Promotes calm focus, counteracting 'on edge' feeling from high cortisol.</li>
</ul>
`,
      keyNutrient: ['Phosphatidylserine', 'Ashwagandha', 'Rhodiola rosea', 'L-theanine']
    },
     // Added rule for Low AM Cortisol
    {
      id: 8061,
      conditions: [{ field: 'cortisolAM', operator: 'lessThan', value: [10] }], // Lower end of typical AM range ~10 ug/dL
      logic: 'AND',
      response: `
<p>Morning <strong>Cortisol (AM Cortisol - 'wake-up' stress hormone)</strong> is low (<10 ug/dL). This can indicate <strong>HPA axis dysfunction</strong>, sometimes referred to as 'adrenal fatigue' or <strong>hypocortisolism</strong>, where the stress response system is potentially burnt out. Symptoms often include severe fatigue (especially morning), difficulty waking up, low blood pressure, and poor stress resilience. Medical evaluation is necessary to rule out underlying conditions like <strong>Addison's disease</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong> To support adrenal function and energy (under medical guidance):</p>
<ul>
    <li><strong>Ginseng (Panax):</strong> Adaptogen that can help improve energy and stress resilience.</li>
    <li><strong>Vitamin C & Vitamin B5 (Pantothenic acid):</strong> Nutrients highly concentrated in and essential for adrenal gland function.</li>
    <li><em>Licorice Root (Glycyrrhiza glabra) can sometimes be used short-term under supervision to help increase cortisol levels, but has potential side effects.</em></li>
</ul>
`,
      keyNutrient: ['Ginseng (Panax ginseng / Panax quinquefolius)', 'Vitamin C', 'Vitamin B5 (Pantothenic acid)']
    },
    // Added rule for Optimal AM Cortisol
    {
      id: 8062,
      conditions: [{ field: 'cortisolAM', operator: 'between', value: [10, 18] }],
      logic: 'AND',
      response: `
<p>Morning <strong>Cortisol (AM Cortisol)</strong> is within the typical physiological range (~10-18 ug/dL). This suggests a healthy <strong>HPA axis (stress response system)</strong> awakening response, which is important for energy, alertness, and regulating inflammation throughout the day.</p>
<p><strong>Nutraceutical Benefits:</strong> To maintain HPA axis resilience:</p>
<ul>
    <li><strong>Ashwagandha:</strong> A low-dose adaptogen can help the body continue to buffer daily stress.</li>
    <li><strong>Vitamin C:</strong> Provides foundational support for the adrenal glands, which use high amounts of Vitamin C.</li>
</ul>
`,
      keyNutrient: ['Ashwagandha', 'Vitamin C']
    },
    {
      id: 807, // Keep original ID
      conditions: [{ field: 'dheas', operator: 'lessThan', value: [150] }], // DHEA-S ranges are very age/sex dependent, 150 is a general low example
      logic: 'AND',
      response: `
<p><strong>DHEA-S (Dehydroepiandrosterone sulfate)</strong> is suboptimal (example <150 µg/dL; consult age/sex ranges). DHEA is an 'anabolic' (building) hormone counter-regulating 'catabolic' (breaking down) cortisol effects; precursor to sex hormones. Low levels associated with <strong>HPA axis dysfunction ('adrenal fatigue')</strong>, reduced resilience, feeling run-down. Supporting adrenal health necessary. DHEA supplementation requires medical supervision/testing.</p>
<p><strong>Nutraceutical Benefits:</strong> To support 'adrenal' glands producing DHEA:</p>
<ul>
    <li><strong>DHEA:</strong> Only take under medical supervision after appropriate testing.</li>
    <li><strong>Vitamin C:</strong> Adrenals have highest body concentration; used to produce hormones.</li>
    <li ><strong>Vitamin B5 (Pantothenic acid):</strong> 'Anti-stress' vitamin, essential for adrenal function.</li>
    <li><strong>Rhodiola rosea:</strong> Adaptogen supporting adrenals, helping stress-related fatigue.</li>
</ul>
`,
      keyNutrient: ['DHEA', 'Vitamin C', 'Vitamin B5 (Pantothenic acid)', 'Rhodiola rosea']
    },
     // Added rule for Optimal DHEA-S (requires complex ranges, placeholder)
    {
      id: 8071,
      // Placeholder condition - real application needs age/sex specific ranges
      conditions: [{ field: 'dheas', operator: 'greaterThanOrEqual', value: [150] }], // Highly simplified example
      logic: 'AND',
      response: `
<p><strong>DHEA-S (Dehydroepiandrosterone sulfate)</strong> appears to be within the typical range for your age and sex (Note: reference ranges vary significantly). Adequate DHEA-S supports energy, mood, stress resilience, and provides precursors for sex hormones. Maintaining healthy stress levels and adrenal support helps preserve optimal DHEA-S.</p>
<p><strong>Nutraceutical Benefits:</strong> To support HPA axis (stress system) resilience and hormone balance:</p>
<ul>
    <li><strong>Ashwagandha:</strong> Helps maintain a healthy cortisol-to-DHEA balance.</li>
    <li><strong>Rhodiola rosea:</strong> Supports energy and stress resilience.</li>
    <li><strong>Vitamin C:</strong> Provides foundational support for the adrenal glands.</li>
</ul>
`,
      keyNutrient: ['Ashwagandha', 'Rhodiola rosea', 'Vitamin C']
    }
  ],
  "Primary Health Goals": [
    {
      id: 901,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Weight Loss'] }],
      logic: 'OR',
      response: `
<p>To strategically support your weight loss goal, the focus is on metabolic health. This involves improving <strong>insulin sensitivity</strong> (how well cells respond to insulin) and supporting <strong>lipolysis (fat breakdown)</strong> and <strong>fat oxidation (fat burning)</strong>, complementing a nutrient-dense diet and regular exercise.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Green Tea Extract (EGCG - Epigallocatechin gallate):</strong> Helps gently increase metabolic rate and promotes fat oxidation, especially with exercise.</li>
    <li><strong>Berberine:</strong> Powerful compound improving insulin sensitivity; better insulin response means less likelihood of storing excess sugar as fat.</li>
    <li><strong>Conjugated Linoleic Acid (CLA):</strong> Type of healthy fat that may help reduce total body fat and preserve lean muscle mass during weight loss.</li>
    <li><strong>5-HTP (5-Hydroxytryptophan):</strong> Precursor to <strong>serotonin (mood neurotransmitter)</strong>, which can help promote <strong>satiety (fullness)</strong> and reduce carbohydrate cravings.</li>
</ul>
`,
      keyNutrient: ['Green tea extract', 'Berberine', 'Conjugated linoleic acid (CLA)', '5-HTP']
    },
     {
      id: 902,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Muscle Gain'] }],
      logic: 'OR',
      response: `
<p>Your goal is to increase muscle mass via <strong>muscle protein synthesis (MPS - the process of building new muscle)</strong>. Non-negotiable foundation: adequate protein (approx. 1.6-2.2g/kg body weight) and consistent resistance training. Following supplements effectively augment this.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Creatine Monohydrate:</strong> Most-studied performance supplement. Helps muscles recycle energy (<strong>ATP - cellular energy currency</strong>) faster for more reps/weight, driving muscle growth.</li>
    <li><strong>Whey Protein:</strong> Fast-digesting, high-quality protein delivering essential amino acids for muscle repair/building, effective post-workout.</li>
    <li><strong>Essential Amino Acids (EAAs):</strong> Specific amino acids directly triggering MPS; beneficial pre- or intra-workout.</li>
    <li><strong>HMB (β-hydroxy-β-methylbutyrate):</strong> Leucine metabolite particularly effective at preventing muscle breakdown (<strong>anti-catabolic</strong>), crucial for net muscle gain.</li>
</ul>
`,
      keyNutrient: ['Creatine monohydrate', 'Whey protein', 'Essential amino acids (EAAs)', 'HMB (β-hydroxy-β-methylbutyrate)']
    },
    {
      id: 903,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Energy Optimization'] }],
      logic: 'OR',
      response: `
<p>Optimizing energy involves supporting 'mitochondria' (cell power plants creating energy/ATP) and ensuring raw materials for the complex energy-production assembly line (<strong>electron transport chain</strong>).</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Coenzyme Q10 (CoQ10):</strong> Critical component of mitochondrial assembly line; 'spark plug' cells need for ATP production.</li>
    <li><strong>PQQ (pyrroloquinoline quinone):</strong> Works with CoQ10; helps create new mitochondria (<strong>mitochondrial biogenesis</strong>), building more power plants.</li>
    <li><strong>NMN (nicotinamide mononucleotide) / NR (Nicotinamide Riboside):</strong> Precursors to <strong>NAD+</strong>, vital coenzyme declining with age, essential for mitochondrial function/energy metabolism.</li>
    <li><strong>Ginseng:</strong> Adaptogenic herb combating fatigue, improving physical/mental energy.</li>
</ul>
`,
      keyNutrient: ['Coenzyme Q10', 'PQQ (pyrroloquinoline quinone)', 'NMN (nicotinamide mononucleotide)', 'Nicotinamide riboside (NR)', 'Ginseng (Panax ginseng / Panax quinquefolius)'] // Added NR
    },
    {
      id: 904,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Immune Support'] }],
      logic: 'OR',
      response: `
<p>Supporting resilient immune system: ensure key 'on-switch' nutrients (Vitamin D), 'front-line' nutrients (Zinc, Vitamin C) used by immune cells, and modulate inflammation for balanced response.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin D:</strong> 'Master-modulator' for immune system; optimal levels essential for balanced, effective response.</li>
    <li><strong>Vitamin C:</strong> Potent antioxidant immune cells (like white blood cells) need in high concentrations to function and protect from oxidative stress.</li>
    <li><strong>Zinc:</strong> Critical mineral for developing/activating immune cells; deficiency quickly impairs response.</li>
    <li><strong>Quercetin:</strong> Plant bioflavonoid; antioxidant, can help 'shuttle' zinc into cells where most effective.</li>
    <li><strong>Echinacea:</strong> Herb traditionally used for immune support, particularly during acute upper respiratory challenges.</li>
</ul>
`,
      keyNutrient: ['Vitamin D', 'Vitamin C', 'Zinc', 'Quercetin', 'Echinacea']
    },
    {
      id: 905,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Brain Health (Cognition)'] }],
      logic: 'OR',
      response: `
<p>Supporting brain health/cognition: ensure right structural fats (DHA), provide raw materials for <strong>neurotransmitters (like acetylcholine for memory)</strong>, promote <strong>'neuroplasticity' (brain's ability to grow/form new connections)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Lion's Mane Mushroom:</strong> Medicinal mushroom supporting <strong>Nerve Growth Factor (NGF)</strong>, essential for growing/repairing nerve cells.</li>
    <li><strong>Bacopa Monnieri:</strong> Ayurvedic herb shown to improve memory formation and processing speed.</li>
    <li><strong>Phosphatidylserine:</strong> Key phospholipid (fat) composing brain cell membranes, crucial for cell communication.</li>
    <li><strong>Alpha-GPC / Citicoline (CDP-Choline):</strong> Highly bioavailable choline forms; raw material brain must have for <strong>acetylcholine (primary memory/learning neurotransmitter)</strong>.</li>
    <li><strong>Omega-3s (especially DHA):</strong> <strong>DHA (Docosahexaenoic Acid)</strong> is primary structural fat in brain; essential for fluid, fast brain cell membranes.</li>
</ul>
`,
      keyNutrient: ['Lion\'s mane (Hericium erinaceus)', 'Bacopa monnieri', 'Phosphatidylserine', 'Alpha-GPC', 'Citicoline (CDP-choline)', 'Omega-3 fatty acids', 'Fish oil (DHA)']
    },
    {
      id: 906,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Longevity & Anti-aging'] }],
      logic: 'OR',
      response: `
<p>Longevity strategy targets 'hallmarks of aging': support <strong>NAD+ (Nicotinamide adenine dinucleotide)</strong> levels (key molecule for cell repair/energy declining with age), activate <strong>'sirtuin' longevity genes</strong>, promote <strong>'autophagy' (cellular cleanup/recycling)</strong>, and clear <strong>senescent ('zombie') cells</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>NMN (Nicotinamide Mononucleotide) / NR (Nicotinamide Riboside):</strong> Precursors body uses to create NAD+, 'refilling the tank'.</li>
    <li><strong>Resveratrol:</strong> Compound (from grapes) known to activate sirtuins (proteins linked to DNA repair/longevity).</li>
    <li><strong>Fisetin / Quercetin:</strong> <strong>'Senolytics'</strong>—compounds helping body clear old, dysfunctional 'zombie' cells creating inflammation with age.</li>
    <li><strong>Spermidine:</strong> Compound; powerful activator of autophagy (cellular cleanup), process slowing with age.</li>
</ul>
`,
      keyNutrient: ['NMN (nicotinamide mononucleotide)', 'Nicotinamide riboside (NR)', 'Resveratrol', 'Fisetin', 'Spermidine', 'Quercetin']
    },
    {
      id: 907,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Cardiovascular Health'] }],
      logic: 'OR',
      response: `
<p>Supporting cardiovascular health: manage inflammation (root cause of plaque), ensure healthy lipid levels, support <strong>endothelial function (blood vessel lining)</strong>, provide heart muscle optimal energy production.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> <strong>EPA (Eicosapentaenoic acid)</strong> highly anti-inflammatory, <strong>DHA (Docosahexaenoic acid)</strong> benefits triglycerides; foundational for heart health.</li>
    <li><strong>Coenzyme Q10 (CoQ10):</strong> Heart has highest <strong>mitochondria (cell powerhouses)</strong>/CoQ1G0 concentration; essential for massive energy heart needs constantly.</li>
    <li><strong>Garlic Extract (Allicin):</strong> Has been shown to support healthy blood pressure and may modestly benefit cholesterol.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Fish oil (EPA)', 'Fish oil (DHA)', 'Coenzyme Q10', 'Garlic extract']
    },
    {
      id: 908,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Bone Health'] }],
      logic: 'OR',
      response: `
<p>Maintaining bone density needs nutrient team: Vitamin D to absorb calcium, Vitamin K2 to direct calcium into bones (not arteries), other minerals (magnesium, boron) form supportive matrix and aid metabolism.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin D:</strong> Essential for absorbing calcium; without it, calcium cannot be utilized effectively.</li>
    <li><strong>Vitamin K2 (Menaquinones, e.g., MK-7):</strong> 'Traffic cop' for calcium; activates proteins placing calcium into bones, preventing soft tissue deposition.</li>
    <li><strong>Calcium:</strong> Primary mineral building block of bones.</li>
    <li><strong>Magnesium:</strong> Key mineral in bone matrix; helps convert Vitamin D to active form.</li>
    <li><strong>Boron:</strong> Trace mineral supporting bone health by reducing calcium loss, extending Vitamin D life.</li>
</ul>
`,
      keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)', 'Calcium', 'Magnesium', 'Boron']
    },
    {
      id: 909,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Digestive Health'] }],
      logic: 'OR',
      response: `
<p>Healthy gut is foundational. Digestive wellness strategy: ensure proper food breakdown (enzymes), maintain healthy <strong>gut microbiome (bacteria balance)</strong> (probiotics), feed good bacteria (prebiotics), support <strong>gut lining integrity</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Probiotic Multi-Strain Blends:</strong> 'Good bacteria' aiding digestion, vitamin creation, immune regulation.</li>
    <li><strong>Psyllium Husk:</strong> Soluble/insoluble fiber; 'prebiotic' (food for good bacteria), promotes regular bowel movements.</li>
    <li><strong>Digestive Enzymes (Lipase, Protease, Amylase):</strong> Help break down fats, proteins, carbs, reducing bloating/gas.</li>
    <li><strong>L-Glutamine:</strong> Amino acid; primary fuel for gut lining cells, helping repair <strong>'leaky gut' (intestinal hyperpermeability)</strong>.</li>
</ul>
`,
      keyNutrient: ['Probiotic multi-strain blends', 'Psyllium husk', 'Gastro/digestive enzyme blends (lipase, protease, amylase)', 'L-glutamine']
    },
    {
      id: 910,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Sleep Improvement'] }],
      logic: 'OR',
      response: `
<p>Improving sleep quality involves supporting nervous system's 'calm-down' pathway (<strong>GABA neurotransmitter</strong>) and regulating natural sleep-wake hormone melatonin, promoting relaxation and healthy <strong>circadian rhythm (body clock)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Magnesium (Glycinate):</strong> Calms nervous system via GABA support, muscle relaxation.</li>
    <li><strong>L-theanine:</strong> Amino acid from green tea promoting 'calm alertness', relaxation, quieting racing mind.</li>
    <li><strong>Melatonin:</strong> Body's natural 'sleep hormone'; low dose helps reset sleep cycle.</li>
    <li><strong>Valerian Root:</strong> Traditional herb promoting tranquility, improving sleep via GABA support.</li>
    <li><strong>Apigenin:</strong> Bioflavonoid (from chamomile) reducing anxiety, initiating sleep.</li>
</ul>
`,
      keyNutrient: ['Magnesium', 'L-theanine', 'Melatonin', 'Valerian root', 'Apigenin']
    },
    {
      id: 911,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Stress Management'] }],
      logic: 'OR',
      response: `
<p>Managing chronic stress uses <strong>'adaptogens' (herbs helping body adapt/become resilient)</strong> alongside nutrients blunting over-production of stress hormones like cortisol, rather than just masking symptoms.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Ashwagandha:</strong> Adaptogen clinically shown reducing cortisol, body's physiological stress response.</li>
    <li><strong>Rhodiola rosea:</strong> Adaptogen good for 'burnout'/stress-fatigue, supporting energy.</li>
    <li><strong>L-theanine:</strong> Promotes calm focus (alpha brain waves), counteracting 'wired' stress feeling.</li>
    <li><strong>Phosphatidylserine:</strong> Phospholipid (fat) helping blunt cortisol production, esp. from physical/mental stress.</li>
</ul>
`,
      keyNutrient: ['Ashwagandha', 'Rhodiola rosea', 'L-theanine', 'Phosphatidylserine']
    },
    {
      id: 912,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Athletic Performance'] }],
      logic: 'OR',
      response: `
<p>Enhancing athletic performance: increase rapid energy supply (<strong>ATP - adenosine triphosphate, cellular energy currency</strong>), buffer muscle acidity (lactic acid) reducing fatigue, improve blood flow/oxygen delivery to muscles.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Creatine Monohydrate:</strong> Most effective legal supplement. Saturates muscles with phosphocreatine, regenerating ATP faster for short, powerful bursts (sprinting, lifting).</li>
    <li><em>Other key nutrients (not in list) include Beta-Alanine (buffers acid) and Citrulline (improves blood flow).</em></li>
</ul>
`,
      keyNutrient: ['Creatine monohydrate']
    },
    {
      id: 913,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Skin Health'] }],
      logic: 'OR',
      response: `
<p>Supporting vibrant skin 'inside-out': provide raw building blocks for skin structure (collagen), ensure cellular hydration, protect from <strong>oxidative damage (sun, pollution)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Collagen Peptides:</strong> Hydrolyzed collagen provides specific amino acids body needs to build new collagen, improving skin elasticity/hydration.</li>
    <li><strong>Hyaluronic Acid:</strong> Molecule holding 1000x weight in water, hydrating skin from within.</li>
    <li><strong>Vitamin C:</strong> Required <strong>cofactor (helper)</strong> for collagen synthesis; potent skin antioxidant.</li>
    <li><strong>Vitamin E:</strong> Fat-soluble antioxidant protecting skin cell membranes from oxidative damage (esp. UV).</li>
</ul>
`,
      keyNutrient: ['Collagen peptides', 'Hyaluronic acid', 'Vitamin C', 'Vitamin E (Tocopherols / Tocotrienols)']
    },
    {
      id: 914,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Fertility & Pregnancy Support'] }],
      logic: 'OR',
      response: `
<p>Nutritional support critical for fertility (cellular energy/<strong>mitochondria</strong> for egg/sperm quality) and healthy pregnancy (key building blocks for fetal development, esp. brain/nervous system). All supplementation requires healthcare provider approval.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin B9 (Folate / Folic acid):</strong> Essential (esp. active methylated form) preventing neural tube defects.</li>
    <li><strong>Coenzyme Q10 (CoQ10):</strong> Crucial for egg quality (provides massive <strong>ATP (energy)</strong> needed).</li>
    <li><strong>Fish Oil (DHA - Docosahexaenoic Acid):</strong> Primary structural fat in baby's brain/eyes; critical for neurodevelopment.</li>
    <li><strong>Iron:</strong> Needed for dramatically expanding blood volume during pregnancy (hemoglobin building).</li>
</ul>
`,
      keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Coenzyme Q10', 'Fish oil (DHA)', 'Iron']
    },
    {
      id: 915,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Women\'s Health (General)'] }],
      logic: 'OR',
      response: `
<p>General women's health focus: common needs like iron (due to <strong>menses/periods</strong>), bone density nutrients (calcium, Vit D - <strong>osteoporosis</strong> risk increases post-menopause), <strong>methylation cycle</strong> support (key for hormonal health).</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Iron:</strong> Supplementation may be needed to replete stores lost monthly, combating fatigue.</li>
    <li><strong>Calcium:</strong> Primary mineral for bone density, key long-term concern.</li>
    <li><strong>Vitamin D:</strong> Essential for calcium absorption, immune/mood support.</li>
    <li><strong>Vitamin B9 (Folate / Folic acid):</strong> Critical childbearing years; important lifelong for methylation/cardiovascular health.</li>
</ul>
`,
      keyNutrient: ['Iron', 'Calcium', 'Vitamin D', 'Vitamin B9 (Folate / Folic acid)']
    },
    {
      id: 916,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Other'] }],
      logic: 'OR',
      response: `
<p>General health/wellness goals: strong nutritional foundation is best start. Ensure adequacy of nutrients commonly deficient in modern diets, foundational to thousands of body processes.</p>
<p><strong>Nutraceutical Benefits:</strong> Foundational support:</p>
<ul>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Essential fats critical for managing inflammation, brain/cardiovascular health; often insufficient in diet.</li>
    <li><strong>Vitamin D:</strong> 'Sunshine vitamin' essential for immune/bone health; deficiency widespread.</li>
    <li><strong>Magnesium:</strong> 'Master mineral' involved in >600 reactions (muscle relaxation, energy, stress); often lacking in diets.</li>
</ul>
`,
      keyNutrient: ['Omega-3 fatty acids', 'Vitamin D', 'Magnesium']
    }
  ],
  "Specific Health Concerns": [
     {
       id: 1001,
       conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Joint Pain'] }],
       logic: 'OR',
       response: `
<p>Supporting joint health: 1) Provide raw 'building blocks' for <strong>cartilage</strong> and <strong>synovial fluid (joint cushion)</strong>, 2) Manage inflammatory processes causing pain, stiffness, tissue breakdown.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Glucosamine & Chondroitin Sulfate:</strong> Natural cartilage components; supplementing may slow degeneration, provide repair materials.</li>
    <li><strong>MSM (Methylsulfonylmethane):</strong> Sulfur source (key joint tissue block); anti-inflammatory properties.</li>
    <li><strong>Boswellia serrata:</strong> Potent herbal anti-inflammatory inhibiting specific pathway (<strong>5-LOX - 5-lipoxygenase</strong>), reducing pain/improving mobility.</li>
    <li><strong>Collagen Peptides:</strong> Provides specific amino acids body needs to build/repair cartilage, connective tissues.</li>
</ul>
`,
       keyNutrient: ['Glucosamine sulfate', 'Chondroitin sulfate', 'Methylsulfonylmethane (MSM)', 'Boswellia serrata', 'Collagen peptides']
    },
       {
       id: 1002,
       conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Autoimmune Conditions'] }],
       logic: 'OR',
       response: `
<p>Nutritional support for autoimmune conditions (e.g., Hashimoto's, Rheumatoid Arthritis) complex, must be medically supervised. Strategy: 'modulate' (balance) immune system, strengthen gut barrier (<strong>'leaky gut'/intestinal hyperpermeability</strong> often trigger), reduce systemic inflammation.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Vitamin D:</strong> Critical immune modulator; optimal levels essential for taming overactive immune system. Deficiency strongly linked to autoimmunity.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Highly anti-inflammatory fats promoting 'immune tolerance'.</li>
    <li><strong>Curcumin:</strong> Potent anti-inflammatory helping quiet systemic inflammation driving autoimmune flares.</li>
    <li><strong>Glutathione:</strong> Body's 'master antioxidant', protecting tissues from autoimmune damage.</li>
</ul>
`,
       keyNutrient: ['Vitamin D', 'Omega-3 fatty acids', 'Curcumin', 'Glutathione']
    },
    {
      id: 1003,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['High Cholesterol'] }],
      logic: 'OR',
      response: `
<p>Addressing high cholesterol (<strong>hyperlipidemia</strong>) with supplements supports healthy lipid metabolism alongside diet/lifestyle. Goals: block gut cholesterol absorption, aid liver blood cholesterol clearance. Coordinate with doctor, esp. if on statins.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Phytosterols (Plant Sterols):</strong> Natural plant compounds structurally similar to cholesterol; 'compete' blocking gut absorption.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Particularly effective lowering high <strong>triglycerides</strong>, often part of high cholesterol picture.</li>
    <li><strong>Berberine:</strong> Helps activate liver <strong>'LDL receptors'</strong>, pulling more 'bad' cholesterol (LDL) particles from blood.</li>
</ul>
`,
      keyNutrient: ['Phytosterols / plant sterols', 'Omega-3 fatty acids', 'Berberine']
    },
    {
      id: 1004,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['High Blood Pressure'] }],
      logic: 'OR',
      response: `
<p>Supporting healthy blood pressure (<strong>hypertension</strong>) involves promoting <strong>'vasodilation' (blood vessel relaxation)</strong> and ensuring optimal <strong>endothelial (vessel lining)</strong> health via increased <strong>nitric oxide (NO)</strong> production or smooth muscle relaxation. Must be part of comprehensive plan supervised by doctor.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Garlic Extract:</strong> Shown in trials modestly reducing BP by increasing nitric oxide (vessel relaxer).</li>
    <li><strong>Coenzyme Q10 (CoQ10):</strong> Essential antioxidant for cellular energy; improves endothelial function key to BP control.</li>
    <li><strong>Magnesium:</strong> 'Nature's calcium channel blocker'; essential for smooth muscle relaxation, directly relaxing/widening vessels.</li>
</ul>
`,
      keyNutrient: ['Garlic extract', 'Coenzyme Q10', 'Magnesium']
    },
    {
      id: 1005,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Diabetes/Pre-diabetes'] }],
      logic: 'OR',
      response: `
<p>For blood sugar regulation (pre-diabetes/diabetes), primary goal is improving <strong>'insulin sensitivity'</strong>—making cells listen to insulin again to effectively take glucose from blood. Must manage alongside doctor's care.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Berberine:</strong> Potent plant compound; highly effective improving insulin sensitivity/lowering blood sugar via multiple mechanisms.</li>
    <li><strong>Chromium:</strong> Essential trace mineral enhancing insulin action, helping 'unlock' cell door for glucose entry.</li>
    <li><strong>Alpha-lipoic acid (ALA):</strong> Antioxidant helping body turn glucose to energy; may protect nerves from high sugar damage (<strong>neuropathy</strong>).</li>
</ul>
`,
      keyNutrient: ['Berberine', 'Chromium (chromium picolinate)', 'Alpha-lipoic acid']
    },
    {
      id: 1006,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Inflammation'] }],
      logic: 'OR',
      response: `
<p>Managing chronic, low-grade inflammation key for long-term health (root driver of most chronic diseases). Strategy uses potent natural compounds modulating (not just blocking) inflammatory pathways and promoting <strong>resolution (active cleanup)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Curcumin:</strong> Active in turmeric; powerful anti-inflammatory working on multiple pathways (e.g., <strong>NF-kB master switch</strong>).</li>
    <li><strong>Omega-3 Fatty Acids (especially EPA - Eicosapentaenoic Acid):</strong> High EPA doses precursor to <strong>'resolvins'</strong>—molecules that actively resolve inflammation.</li>
    <li><strong>Boswellia serrata:</strong> Herbal extract potent inhibitor of specific inflammatory enzyme (<strong>5-LOX - 5-lipoxygenase</strong>), involved in joint/gut inflammation.</li>
</ul>
`,
      keyNutrient: ['Curcumin', 'Omega-3 fatty acids', 'Boswellia serrata', 'Fish oil (EPA)']
    },
    {
      id: 1007,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Digestive Issues (IBS, bloating)'] }],
      logic: 'OR',
      response: `
<p>For digestive issues like <strong>Irritable Bowel Syndrome (IBS)</strong> and bloating: 1) Restore <strong>gut microbial balance (probiotics)</strong>, 2) Support food breakdown (enzymes), 3) Repair gut lining (address <strong>intestinal hyperpermeability/'leaky gut'</strong>).</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Probiotic Multi-Strain Blends:</strong> 'Good bacteria' aiding digestion, reducing gas from 'bad' bacteria, regulating bowels.</li>
    <li><strong>Digestive Enzymes (Lipase, Protease, Amylase):</strong> Help break down fats, proteins, carbs if body's production low, reducing post-meal bloating.</li>
    <li><strong>L-Glutamine:</strong> Amino acid; primary fuel for gut lining cells, essential for repairing 'leaky gut'.</li>
</ul>
`,
      keyNutrient: ['Probiotic multi-strain blends', 'Gastro/digestive enzyme blends (lipase, protease, amylase)', 'L-glutamine']
    },
    {
      id: 1008,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Anxiety/Depression'] }],
      logic: 'OR',
      response: `
<p>Nutritional support for mood: provide building blocks for 'feel-good' <strong>neurotransmitters (brain chemicals like serotonin)</strong> and use <strong>'adaptogens'</strong> modulating stress response (key anxiety driver). Always complements, not replaces, professional mental health care.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>5-HTP (5-Hydroxytryptophan):</strong> Direct precursor body converts into serotonin (involved in mood, sleep, appetite).</li>
    <li><strong>St. John's Wort:</strong> Herb potentially increasing several neurotransmitters. Cannot take with many meds (esp. <strong>SSRIs antidepressants</strong>) - check doctor.</li>
    <li><strong>Omega-3 Fatty Acids (EPA/DHA):</strong> Brain 60% fat; essential for healthy brain cell function, reducing <strong>neuro-inflammation</strong> linked to depression.</li>
    <li><strong>L-theanine:</strong> Amino acid promoting 'calm-focus' (alpha brain waves), easing anxiety.</li>
    <li><strong>Ashwagandha:</strong> Adaptogen reducing stress/anxiety by lowering cortisol.</li>
</ul>
`,
      keyNutrient: ['5-HTP', 'St. John\'s wort', 'Omega-3 fatty acids', 'L-theanine', 'Ashwagandha']
    },
    {
      id: 1009,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Insomnia'] }],
      logic: 'OR',
      response: `
<p>Addressing insomnia: support body's natural 'calm-down' neurotransmitter <strong>GABA (Gamma-aminobutyric acid)</strong>, regulate sleep-wake hormone melatonin, promote healthy <strong>circadian rhythm (body clock)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Melatonin:</strong> Body's natural 'sleep-signal' hormone; low dose helps reset sleep cycle (esp. trouble falling asleep).</li>
    <li><strong>L-theanine:</strong> Promotes relaxation, 'quiet' mind without drowsiness, easing transition to sleep.</li>
    <li><strong>Magnesium (Glycinate):</strong> Calms nervous system via GABA support, muscle relaxation.</li>
    <li><strong>Valerian Root:</strong> Traditional herb binding GABA receptors, promoting tranquility, improving sleep quality.</li>
    <li><strong>Apigenin:</strong> Bioflavonoid (from chamomile) reducing anxiety, initiating sleep.</li>
</ul>
`,
      keyNutrient: ['Melatonin', 'L-theanine', 'Magnesium', 'Valerian root', 'Apigenin']
    },
    {
      id: 1010,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Chronic Fatigue'] }],
      logic: 'OR',
      response: `
<p>Combating chronic fatigue requires focus on cellular energy. Strategy: support <strong>'mitochondria' (cell power plants making ATP energy)</strong> and <strong>'adrenal' glands (managing long-term stress adaptation)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Coenzyme Q10 (CoQ10):</strong> 'Spark plug' for mitochondria; essential for final step of <strong>ATP (cellular energy)</strong> creation.</li>
    <li><strong>NMN (Nicotinamide Mononucleotide) / NR (Nicotinamide Riboside):</strong> Precursors to <strong>NAD+</strong>, key molecule vital for mitochondrial function, energy metabolism.</li>
    <li><strong>Ginseng (Panax):</strong> Classic adaptogen building stress resilience, improving physical/mental energy.</li>
    <li><strong>L-Carnitine:</strong> 'Shuttle' transporting fat into mitochondria for fuel burning.</li>
</ul>
`,
      keyNutrient: ['Coenzyme Q10', 'NMN (nicotinamide mononucleotide)', 'Nicotinamide riboside (NR)', 'Ginseng (Panax ginseng / Panax quinquefolius)', 'L-carnitine'] // Added NR
    },
    {
      id: 1011,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Brain Fog/Memory Issues'] }],
      logic: 'OR',
      response: `
<p>Addressing brain fog/memory: focus on <strong>'nootropics' (compounds supporting brain function)</strong>. Includes providing building blocks for 'memory' neurotransmitter <strong>acetylcholine</strong>, supporting <strong>'neuroplasticity' (growth of new brain connections)</strong>.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Lion's Mane Mushroom:</strong> Medicinal mushroom supporting <strong>Nerve Growth Factor (NGF)</strong> essential for growing/repairing/protecting brain cells.</li>
    <li><strong>Bacopa Monnieri:</strong> Ayurvedic herb shown improving memory formation, mental processing speed.</li>
    <li><strong>Alpha-GPC / Citicoline (CDP-Choline):</strong> Highly bioavailable choline forms; essential raw material for acetylcholine (primary memory/learning neurotransmitter).</li>
    <li><strong>Phosphatidylserine:</strong> Key fat composing brain cell membranes, crucial for fast, clear cell communication.</li>
</ul>
`,
      keyNutrient: ['Lion\'s mane (Hericium erinaceus)', 'Bacopa monnieri', 'Alpha-GPC', 'Citicoline (CDP-choline)', 'Phosphatidylserine']
    },
    {
      id: 1012,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Hormonal Imbalance'] }],
      logic: 'OR',
      response: `
<p>'Hormonal Imbalance' broad term; full medical evaluation needed (thyroid, adrenal, sex hormones). <strong>Adaptogenic herbs</strong>, key minerals help body's <strong>endocrine system</strong> self-regulate, become resilient to stress (often root cause).</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Maca Root:</strong> Peruvian root vegetable; non-hormonal 'adaptogen' helping hormone glands (adrenals, ovaries) function optimally.</li>
    <li><strong>Ashwagandha:</strong> Modulates stress response (lowers cortisol), impacting downstream hormones for balance.</li>
    <li><strong>Zinc:</strong> Critical mineral for producing sex hormones (testosterone) and thyroid hormones.</li>
</ul>
`,
      keyNutrient: ['Maca root', 'Ashwagandha', 'Zinc']
    },
    {
      id: 1013,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Cancer History/Support'] }],
      logic: 'OR',
      response: `
<p>For cancer history, nutritional strategies highly personalized, supervised by oncologist/qualified provider. No supplement without explicit medical approval; some interfere with treatment. General goal: support immune function, reduce systemic inflammation. Nutrient-dense, whole-food diet foundational.</p>
<p><strong>Nutraceutical Benefits:</strong></p>
<ul>
    <li><strong>Green Tea Extract (EGCG - Epigallocatechin gallate):</strong> Studied for potent antioxidant, cell-protective properties. Must be cleared by oncologist.</li>
    <li><em>General note: A nutrient-dense, whole-food diet is the most important foundation.</em></li>
</ul>
`,
      keyNutrient: ['Green tea extract']
    },
    {
      id: 1014,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Rare Genetic Condition', 'Other'] }],
      logic: 'OR',
      response: `
<p>Specific health concern needs specialized approach. Consult healthcare professional/specialist for safe, effective plan tailored to unique needs. Foundational supplements support general wellness but cannot replace targeted medical advice.</p>
<p><strong>Nutraceutical Benefits:</strong> Foundational support:</p>
<ul>
    <li><strong>Vitamin D:</strong> For immune and bone health.</li>
    <li><strong>Magnesium:</strong> For enzymatic reactions and relaxation.</li>
    <li><strong>Omega-3 Fatty Acids:</strong> For managing inflammation.</li>
</ul>
`,
      keyNutrient: ['Vitamin D', 'Magnesium', 'Omega-3 fatty acids']
    }
  ],
  
   // --- Genetic Profile ---
    
  "Genetic Profile": [
  // --- 1. Vitamin and Mineral Metabolism ---

  {
    id: 1101,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['MTHFR'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>MTHFR</strong> (Methylenetetrahydrofolate Reductase, e.g., C677T) indicates a significantly reduced capacity to convert dietary folate and folic acid into the active form, L-5-MTHF. This is the "on-ramp" to the body's methylation cycle, which is crucial for processing homocysteine, creating neurotransmitters, and detoxifying. This variant can lead to high homocysteine (a cardiovascular risk factor) and reduced production of SAMe (your body's universal "methyl donor").</p>
<p><strong>Guidance & Recommendations:</strong> It is crucial to <strong>bypass this genetic bottleneck</strong> by avoiding unmethylated folic acid (found in fortified foods) and supplementing directly with the active forms of B vitamins.</p>
<ul>
    <li><strong>Vitamin B9 (as L-5-MTHF):</strong> Provides the active folate your body needs, completely bypassing the slow MTHFR enzyme.</li>
    <li><strong>Vitamin B12 (as Methylcobalamin):</strong> The direct partner to L-5-MTHF in the methylation cycle.</li>
    <li><strong>Vitamin B2 (Riboflavin):</strong> Acts as a direct "helper" (cofactor) for the MTHFR enzyme, helping it function as well as it can.</li>
</ul>
`,
    keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Vitamin B2 (Riboflavin)']
  },
  {
    id: 1102,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['MTR'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>MTR</strong> (Methionine Synthase, e.g., A2756G) affects the enzyme that uses Vitamin B12 to convert homocysteine back to methionine (a key step in methylation). A variant here can "trap" B12, making the enzyme sluggish. This can increase the body's functional need for Vitamin B12, even if serum levels appear normal, and contribute to elevated homocysteine.</p>
<p><strong>Guidance & Recommendations:</strong> Support this enzyme directly with its key cofactor to "push" the reaction forward.</p>
<ul>
    <li><strong>Vitamin B12 (as Methylcobalamin):</strong> Provides the active B12 needed to run the MTR enzyme efficiently.</li>
    <li><strong>Vitamin B9 (as L-5-MTHF):</strong> Works as the co-substrate with B12 in this specific reaction.</li>
</ul>
`,
    keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)']
  },
  {
    id: 1103,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['MTRR'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>MTRR</strong> (Methionine Synthase Reductase, e.g., A66G) affects the enzyme that "recharges" Vitamin B12 to keep the MTR enzyme (see above) running. Think of MTRR as the "battery charger" for B12. A slow MTRR means B12 isn't "recharged" effectively, which indirectly slows down the entire methylation cycle, similar to an MTR variant.</p>
<p><strong>Guidance & Recommendations:</strong> Ensure a high supply of active B12 to compensate for the slow "recharging" process.</p>
<ul>
    <li><strong>Vitamin B12 (as Methylcobalamin):</strong> Directly provides the "charged" B12 that the MTR enzyme needs.</li>
</ul>
`,
    keyNutrient: ['Vitamin B12 (Cobalamin)']
  },
  {
    id: 1104,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CBS'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CBS</strong> (Cystathionine Beta-Synthase) affects the primary "drain" for homocysteine, converting it down the "transsulfuration" pathway to produce glutathione (your master antioxidant). Some variants increase this enzyme's activity. This may look good (it lowers homocysteine) but can "steal" B6 and other resources from the main methylation cycle. It can also lead to an overproduction of sulfur byproducts, potentially causing sensitivity to sulfur-rich foods (garlic, broccoli) or supplements (MSM, NAC).</p>
<p><strong>Guidance & Recommendations:</strong> Support the cofactors this pathway consumes and assist with sulfur processing.</p>
<ul>
    <li><strong>Vitamin B6 (as P-5-P):</strong> This is the key cofactor for the CBS enzyme and can be depleted by its hyperactivity.</li>
    <li><em>Molybdenum (not in DB):</em> This trace mineral is essential for the SUOX enzyme, which processes sulfur byproducts.</li>
</ul>
`,
    keyNutrient: ['Vitamin B6 (Pyridoxine)']
  },
  {
    id: 1105,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['FUT2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>FUT2</strong> results in a "Non-Secretor" phenotype. This means you do not secrete your blood-group antigens into bodily fluids, including the mucus lining of your gut. This has a profound impact on your gut microbiome, as these antigens are "food" for beneficial bacteria like <em>Bifidobacteria</em>. Non-secretors often have lower levels of <em>Bifidobacteria</em>, are more susceptible to infections like <em>H. pylori</em> or Norovirus, and, critically, have <strong>significantly impaired absorption of Vitamin B12</strong> from food.</p>
<p><strong>Guidance & Recommendations:</strong> Focus on microbiome support and bypass gut-based B12 absorption.</p>
<ul>
    <li><strong>Vitamin B12 (Cobalamin):</strong> Sublingual (under-the-tongue) or injectable forms are strongly recommended to bypass poor gut absorption.</li>
    <li><strong>Probiotic multi-strain blends:</strong> Specifically seek out blends rich in <em>Bifidobacterium</em> strains to help populate the gut.</li>
</ul>
`,
    keyNutrient: ['Vitamin B12 (Cobalamin)', 'Probiotic multi-strain blends']
  },
  {
    id: 1106,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['GC'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>GC</strong> (Group-Specific Component) affects the Vitamin D Binding Protein (VDBP). This protein is the "taxi cab" that transports Vitamin D through your bloodstream and delivers it to your cells. A variant here can mean you have "less efficient taxis." Your blood levels of 25(OH)D (storage D) might be lower, and the delivery to tissues may be less effective. You may need higher-than-average doses of Vitamin D to achieve and maintain optimal serum levels (e.g., 40-60 ng/mL).</p>
<p><strong>Guidance & Recommendations:</strong> Compensate for inefficient transport with higher intake and consistent testing.</p>
<ul>
    <li><strong>Vitamin D:</strong> Supplementation is key. Dosage should be guided by regular blood tests to ensure you reach the optimal range.</li>
</ul>
`,
    keyNutrient: ['Vitamin D']
  },
  {
    id: 1107,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CYP2R1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CYP2R1</strong> affects the primary liver enzyme (25-hydroxylase) that performs the first activation step of Vitamin D. It converts D3 (from sun/supplements) into 25(OH)D (the storage form measured in blood tests). A variant here means this initial conversion is sluggish. You may be a "poor responder" to supplementation, requiring significantly higher doses of Vitamin D3 to achieve optimal blood levels compared to someone without the variant.</p>
<p><strong>Guidance & Recommendations:</strong> This variant strongly increases the need for supplementation and testing.</p>
<ul>
    <li><strong>Vitamin D:</strong> Higher doses may be necessary. Work with a practitioner and use blood tests to find the correct dose.</li>
</ul>
`,
    keyNutrient: ['Vitamin D']
  },
  {
    id: 1108,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CYP27B1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CYP27B1</strong> affects the key kidney enzyme (1-alpha-hydroxylase) that performs the final activation step of Vitamin D. It converts 25(OH)D (storage form) into 1,25(OH)2D (the fully active hormone). A variant here is tricky: your blood test for 25(OH)D might look perfectly normal, but your body struggles to create the final active hormone. This can lead to symptoms of D deficiency (immune, bone issues) despite "good" lab numbers.</p>
<p><strong>Guidance & Recommendations:</strong> Ensure all "helper" nutrients for this enzyme are present.</p>
<ul>
    <li><strong>Magnesium:</strong> This mineral is a critical cofactor for the CYP27B1 enzyme. Ensuring magnesium adequacy is essential to help this enzyme work.</li>
    <li><strong>Vitamin D:</strong> Maintain levels in the optimal range (40-60 ng/mL).</li>
</ul>
`,
    keyNutrient: ['Magnesium', 'Vitamin D']
  },
  {
    id: 1109,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['VDR'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>VDR</strong> (Vitamin D Receptor, e.g., Taq or FokI variants) affects the "keyhole" in your cells that the active Vitamin D hormone "unlocks." A variant can make this receptor less sensitive to the Vitamin D signal. Like CYP27B1, this can mean your blood levels (25(OH)D) look normal, but the message isn't being received properly at the cellular level. This can reduce Vitamin D's effectiveness for immune and bone health.</p>
<p><strong>Guidance & Recommendations:</strong> The goal is to "flood" the "sticky" receptors with an optimal signal. Aim for the higher end of the optimal range.</p>
<ul>
    <li><strong>Vitamin D:</strong> Maintain serum 25(OH)D levels in the high-optimal range (e.g., 50-70 ng/mL) to ensure a strong signal.</li>
    <li><strong>Vitamin K2 (Menaquinones):</strong> Always pair high-dose D with K2 to ensure calcium is directed into bones, not arteries.</li>
</ul>
`,
    keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)']
  },
  {
    id: 1110,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['BCMO1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>BCMO1</strong> (Beta-Carotene Monooxygenase 1) makes you a "poor converter" of plant-based Vitamin A (beta-carotene) into its active animal form (Retinol). Beta-carotene is found in carrots, sweet potatoes, and spinach. Up to 45% of the population has variants that significantly reduce this conversion. Such individuals cannot rely on plants to meet their Vitamin A needs and are at higher risk of deficiency, which affects vision, immune function, and skin health.</p>
<p><strong>Guidance & Recommendations:</strong> Do not rely on plant foods for Vitamin A. Consume pre-formed Retinol.</p>
<ul>
    <li><strong>Vitamin A:</strong> Supplement with pre-formed Vitamin A (like Retinyl Palmitate) or consume animal sources (like cod liver oil, beef liver).</li>
</ul>
`,
    keyNutrient: ['Vitamin A']
  },
  {
    id: 1111,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['SLC23A1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>SLC23A1</strong> (or SLC23A2) affects the primary transporters that absorb Vitamin C from the gut into the bloodstream. A variant here means less efficient absorption. Even with a diet rich in Vitamin C, your plasma levels may be lower than expected, potentially impacting collagen synthesis, immune function, and antioxidant status.</p>
<p><strong>Guidance & Recommendations:</strong> Compensate for poor absorption with higher or more frequent dosing.</p>
<ul>
    <li><strong>Vitamin C:</strong> Higher supplemental doses (e.g., 1000mg+) or splitting doses throughout the day may be needed. Liposomal or buffered forms may enhance absorption.</li>
    <li><strong>Quercetin:</strong> This bioflavonoid works synergistically with Vitamin C and can help stabilize it.</li>
</ul>
`,
    keyNutrient: ['Vitamin C', 'Quercetin']
  },
  {
    id: 1112,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['HFE'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>HFE</strong> (e.g., C282Y or H63D) is the primary cause of <strong>Hereditary Hemochromatosis</strong> (iron overload). This gene normally acts as a "brake" on iron absorption. A pathogenic variant removes the brake, causing your body to absorb too much iron from food. This excess iron is highly pro-oxidant (causes cellular damage) and builds up in organs like the liver, heart, and pancreas, leading to severe disease. This requires strict medical management.</p>
<p><strong>Guidance & Recommendations:</strong> This is a medical condition. Monitor iron/ferritin levels with your doctor. Strictly avoid iron supplements and fortified foods. Therapeutic phlebotomy (blood donation) is the standard treatment.</p>
<ul>
    <li><strong>Curcumin:</strong> A potent anti-inflammatory that also acts as a mild iron chelator (helps bind and remove iron).</li>
    <li><strong>Green tea extract:</strong> The EGCG in green tea can help reduce the absorption of iron from meals.</li>
</ul>
`,
    keyNutrient: ['Curcumin', 'Green tea extract']
  },
  {
    id: 1113,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['TMPRSS6'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>TMPRSS6</strong> can cause <strong>IRIDA</strong> (Iron-Refractory Iron Deficiency Anemia). This gene controls hepcidin, the body's master "iron gatekeeper" hormone. A variant here causes chronically high hepcidin, which shuts down iron absorption from the gut and locks iron away in storage cells. This results in a severe anemia that does not respond to oral iron pills. This is a rare but important condition to identify.</p>
<p><strong>Guidance & Recommendations:</strong> This condition must be managed by a hematologist. Oral iron is ineffective.</p>
<ul>
    <li><em>Medical Intervention:</em> The only effective treatment is typically intravenous (IV) iron to bypass the gut absorption block.</li>
</ul>
`,
    keyNutrient: ['Iron'] // As a flag, but noting oral is ineffective
  },
  {
    id: 1114,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['SLC30A8'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>SLC30A8</strong> affects the ZnT8 zinc transporter, which is highly specific to the pancreas. This transporter is responsible for packing zinc into the pancreatic beta-cells that make insulin. Zinc is essential for the creation, storage, and proper release of insulin. A variant here can impair insulin secretion and is a known risk factor for developing Type 2 Diabetes.</p>
<p><strong>Guidance & Recommendations:</strong> Ensure optimal zinc status to support pancreatic function and insulin release.</p>
<ul>
    <li><strong>Zinc:</strong> Supplementation may be beneficial to ensure the pancreas has an adequate supply for insulin processing.</li>
    <li><strong>Chromium (chromium picolinate):</strong> Works synergistically with zinc and insulin to support glucose metabolism.</li>
</ul>
`,
    keyNutrient: ['Zinc', 'Chromium (chromium picolinate)']
  },

  // --- 2. Energy Metabolism and Macronutrients ---

  {
    id: 1115,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['PPARG'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A common variant in <strong>PPARG</strong> (Peroxisome Proliferator-Activated Receptor Gamma, e.g., Pro12Ala) is a "thrifty" variant. It actually increases insulin sensitivity and makes your fat cells more efficient at storing fat. In a famine, this is a huge advantage. In a modern food environment, it means you may be more prone to weight gain from refined carbohydrates, but you also respond exceptionally well to healthy fats (especially monounsaturated fats like olive oil) for improving metabolic health.</p>
<p><strong>Guidance & Recommendations:</strong> Your body is "thrifty." A lower-carbohydrate, higher-healthy-fat diet is often ideal.</p>
<ul>
    <li><strong>Omega-3 fatty acids:</strong> Helps to balance the inflammatory response and support the healthy fat metabolism this gene prefers.</li>
    <li><strong>Berberine:</strong> Further supports the high insulin sensitivity associated with this gene.</li>
</ul>
`,
    keyNutrient: ['Omega-3 fatty acids', 'Berberine']
  },
  {
    id: 1116,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['FTO'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>FTO</strong> (Fat mass and obesity-associated protein) is one of the strongest genetic predictors of obesity risk. It doesn't directly cause weight gain, but it strongly influences appetite, satiety, and food preference. Individuals with this variant may have a delayed "I'm full" signal (poor satiety), a preference for high-fat/high-sugar foods, and a tendency to eat larger portions. Crucially, studies show regular physical activity can almost completely negate this gene's effect.</p>
<p><strong>Guidance & Recommendations:</strong> Focus on mindful eating, satiety, and exercise. A high-protein/high-fiber diet is essential to help you feel full. Exercise is your most powerful tool to "turn off" this gene's expression.</p>
<ul>
    <li><strong>5-HTP:</strong> A precursor to serotonin, which can help promote feelings of satiety and reduce cravings.</li>
    <li><strong>Green tea extract:</strong> May help support a healthy metabolic rate and fat oxidation.</li>
</ul>
`,
    keyNutrient: ['5-HTP', 'Green tea extract']
  },
  {
    id: 1117,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['MC4R'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>MC4R</strong> (Melanocortin 4 Receptor) strongly affects appetite control. This brain receptor is a key "off-switch" for hunger. A variant can make this "off-switch" less effective, leading to a persistent feeling of hunger (or lack of fullness) even after a meal. This is strongly linked to higher BMI and a tendency to overeat, particularly "snacking" behavior.</p>
<p><strong>Guidance & Recommendations:</strong> Similar to FTO, managing this requires a focus on behavioral strategies and promoting fullness through diet.</p>
<ul>
    <li><strong>Whey protein:</strong> High-quality protein is the most satiating macronutrient and can help you feel full.</li>
    <li><strong>Psyllium husk:</strong> A soluble fiber that expands in the stomach, promoting a physical feeling of fullness.</li>
</ul>
`,
    keyNutrient: ['Whey protein', 'Psyllium husk']
  },
  {
    id: 1118,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['TCF7L2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>TCF7L2</strong> (Transcription Factor 7 Like 2) is the strongest common genetic risk factor for <strong>Type 2 Diabetes</strong>. It primarily works by impairing the pancreas's ability to secrete insulin appropriately in response to a glucose (sugar) load. It doesn't cause insulin resistance directly, but it makes your body less able to compensate for it. This makes you highly sensitive to refined carbohydrates and sugar.</p>
<p><strong>Guidance & Recommendations:</strong> This is a powerful "heads-up" to be extremely proactive about blood sugar control for life. A low-glycemic, low-sugar diet is not optional, it is essential.</p>
<ul>
    <li><strong>Berberine:</strong> A potent compound that improves insulin sensitivity, taking the "stress" off your pancreas.</li>
    <li><strong>Chromium (chromium picolinate):</strong> An essential mineral that helps your existing insulin work more effectively.</li>
    <li><strong>Alpha-lipoic acid:</strong> An antioxidant that supports glucose uptake into cells.</li>
</ul>
`,
    keyNutrient: ['Berberine', 'Chromium (chromium picolinate)', 'Alpha-lipoic acid']
  },
  {
    id: 1119,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['APOE'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] } // e.g., e4 allele
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>APOE</strong> (Apolipoprotein E) affects how your body transports cholesterol. The <strong>'e4' allele</strong> (e.g., genotypes 3/4 or 4/4) is the strongest genetic risk factor for late-onset Alzheimer's Disease. It is also linked to higher LDL ("bad") cholesterol and a poorer response to high-carbohydrate diets. It is not a diagnosis, but a critical "heads-up" to be aggressive about brain and cardiovascular health. These individuals are often very responsive to lowering saturated fat and refined carbs.</p>
<p><strong>Guidance & Recommendations:</strong> A low-glycemic, low-saturated-fat, high-omega-3 (e.g., Mediterranean) diet is paramount. Strict metabolic health (low blood sugar, low inflammation) is your best neuroprotective strategy.</p>
<ul>
    <li><strong>Fish oil (DHA):</strong> DHA is the primary structural fat in the brain; supporting brain structure is vital for APOE4 carriers.</li>
    <li><strong>Phosphatidylserine:</strong> A key phospholipid for brain cell membranes and communication.</li>
    <li><strong>Curcumin / Resveratrol:</strong> Potent antioxidants/anti-inflammatories to protect brain tissue.</li>
</ul>
`,
    keyNutrient: ['Fish oil (DHA)', 'Phosphatidylserine', 'Curcumin', 'Resveratrol']
  },
  {
    id: 1120,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['LPL'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>LPL</strong> (Lipoprotein Lipase) affects the enzyme on your blood vessel walls that "unloads" triglycerides (fats) from your bloodstream into your cells for storage or energy. A "slow" variant means this unloading process is inefficient, which can lead to high circulating triglycerides and low HDL ("good") cholesterol, especially after a high-fat meal. This is a key feature of metabolic syndrome.</p>
<p><strong>Guidance & Recommendations:</strong> You may not handle large, high-fat meals well. A diet lower in total fat and refined carbohydrates (which the liver turns into triglycerides) is beneficial.</p>
<ul>
    <li><strong>Fish oil (EPA/DHA):</strong> High-dose Omega-3s are clinically proven to be highly effective at lowering high triglycerides.</li>
    <li><strong>Vitamin B3 (Niacin):</strong> Can be very effective for lowering triglycerides and raising HDL, but must be used with medical guidance.</li>
</ul>
`,
    keyNutrient: ['Fish oil (EPA)', 'Fish oil (DHA)', 'Vitamin B3 (Niacin)']
  },
  {
    id: 1121,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CETP'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CETP</strong> (Cholesteryl Ester Transfer Protein, e.g., TaqIB) slows down the CETP enzyme. This enzyme normally takes "good" HDL cholesterol and trades it for "bad" LDL cholesterol, which is generally considered unfavorable. A "slow" variant (pathogenic) interferes with this trade. This is often a beneficial variant, leading to higher levels of protective HDL-C (good cholesterol) and larger, "fluffier" LDL particles, which is associated with reduced cardiovascular risk.</p>
<p><strong>Guidance & Recommendations:</strong> You have a genetic tendency towards high HDL. This is protective. Focus on lowering ApoB (total particle count) to maximize this benefit.</p>
<ul>
    <li><strong>Vitamin B3 (Niacin):</strong> Can further support this healthy HDL profile (use with medical guidance).</li>
</ul>
`,
    keyNutrient: ['Vitamin B3 (Niacin)']
  },
  {
    id: 1122,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['PCSK9'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A "gain-of-function" variant in <strong>PCSK9</strong> is a major genetic driver of high LDL ("bad") cholesterol. The PCSK9 protein's job is to destroy the LDL receptors on your liver (the "docks" that pull LDL out of the blood). A "gain-of-function" variant means your PCSK9 is hyperactive, destroying too many receptors. This leaves LDL cholesterol circulating in your blood with nowhere to go, leading to very high levels (Familial Hypercholesterolemia). This requires medical management.</p>
<p><strong>Guidance & Recommendations:</strong> Diet and lifestyle alone are often insufficient to control this. This is the target of modern cholesterol drugs (PCSK9 inhibitors).</p>
<ul>
    <li><strong>Berberine:</strong> Can help the liver create more new LDL receptors, which provides a mild countervailing effect.</li>
    <li><strong>Phytosterols / plant sterols:</strong> Helps block the absorption of dietary cholesterol, reducing the total burden.</li>
</ul>
`,
    keyNutrient: ['Berberine', 'Phytosterols / plant sterols']
  },

  // --- 3. Sensitivity to food substances ---

  {
    id: 1123,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CYP1A2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CYP1A2</strong> (Cytochrome P450 1A2) makes you a <strong>"slow metabolizer" of caffeine</strong>. This liver enzyme is the primary route for clearing caffeine from your system. If it's "slow," caffeine stays in your body much longer. This can lead to anxiety, jitters, and disrupted sleep, even from a single coffee in the morning. For slow metabolizers, high caffeine intake is linked to an increased risk of hypertension and heart attack.</p>
<p><strong>Guidance & Recommendations:</strong> Limit caffeine intake to <100-200mg per day and avoid it entirely after 12:00 PM.</p>
<ul>
    <li><strong>L-theanine:</strong> An amino acid found in green tea that promotes a "calm focus" and can help smooth out the "jitters" from caffeine.</li>
</ul>
`,
    keyNutrient: ['L-theanine']
  },
  {
    id: 1124,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['ALDH2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>ALDH2</strong> (Aldehyde Dehydrogenase 2) is the cause of the <strong>"Asian Flush"</strong> reaction to alcohol. This enzyme is essential for clearing acetaldehyde, a highly toxic and carcinogenic byproduct of alcohol metabolism. A pathogenic variant (common in East Asian populations) makes this enzyme almost completely non-functional. This causes a rapid, severe buildup of the acetaldehyde toxin, leading to facial flushing, nausea, rapid heartbeat, and headaches. This is a toxic reaction, not an "allergy."</p>
<p><strong>Guidance & Recommendations:</strong> Individuals with this variant have a dramatically increased risk of esophageal cancer if they consume alcohol. <strong>Strict avoidance of all alcohol is the only safe medical recommendation.</strong></p>
<ul>
    <li><em>Note: No supplement can fix this broken enzyme or make alcohol safe to consume.</em></li>
</ul>
`,
    keyNutrient: null
  },
  {
    id: 1125,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['MCM6'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>MCM6</strong> (which controls the <strong>LCT</strong> gene) is the standard human blueprint, indicating <strong>Lactose Intolerance</strong>. The "persistence" variant (which is not pathogenic) is a mutation that keeps the lactase enzyme "on" into adulthood. Having the "pathogenic" (original) version means your lactase gene switched off after infancy, as it does for most of the world's population. You cannot properly digest lactose (milk sugar), leading to gas, bloating, and diarrhea.</p>
<p><strong>Guidance & Recommendations:</strong> Avoid lactose-containing dairy products. You can use lactose-free milk or take a lactase enzyme supplement with any dairy-containing meals.</p>
<ul>
    <li><strong>Gastro/digestive enzyme blends (lipase, protease, amylase):</strong> Look for blends that specifically include the lactase enzyme.</li>
</ul>
`,
    keyNutrient: ['Gastro/digestive enzyme blends (lipase, protease, amylase)']
  },
  {
    id: 1126,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['HLA-DQ2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>Having the <strong>HLA-DQ2</strong> (or HLA-DQ8) gene variant means you are <strong>genetically susceptible to Celiac Disease</strong>. About 99% of people with celiac disease have one of these genes. This is NOT a diagnosis - about 30% of the general population carries one of these genes, and most never develop celiac. It simply means it is possible for you to develop it. If you have any unexplained symptoms (digestive issues, fatigue, anemia, brain fog), you should get a formal celiac antibody blood test.</p>
<p><strong>Guidance & Recommendations:</strong> No action is needed based on the gene alone. If you have symptoms, seek medical testing. If you don't have DQ2/DQ8, your risk of celiac is near zero.</p>
<ul>
    <li><em>Note: This is about genetic risk, not supplementation. If diagnosed with celiac, a strict gluten-free diet is required.</em></li>
</ul>
`,
    keyNutrient: null
  },
  {
    id: 1127,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['TAS2R38'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>TAS2R38</strong> makes you a <strong>"Super-Taster"</strong> of bitter compounds, specifically glucosinolates. This means you are extremely sensitive to the bitter taste in cruciferous vegetables (like broccoli, Brussels sprouts, kale) and other substances (like coffee or dark beer). This can lead to a natural avoidance of these healthy, bitter, sulfur-rich foods, which are crucial for detoxification.</p>
<p><strong>Guidance & Recommendations:</strong> Your preference for blander foods is genetic. You must find ways to "hide" or prepare these bitter vegetables to make them palatable (e.g., roasting with healthy fats, mixing into sauces) to avoid missing out on their key nutrients.</p>
<ul>
    <li><strong>Green tea extract:</strong> If you avoid bitter greens, you may be missing key phytonutrients. Supplements like EGCG can help fill this gap.</li>
</ul>
`,
    keyNutrient: ['Green tea extract']
  },
  {
    id: 1128,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['DAO'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>DAO</strong> (Diamine Oxidase, or <strong>AOC1</strong>) leads to <strong>reduced DAO enzyme activity</strong> in your gut. DAO is the primary enzyme responsible for breaking down histamine from food (found in aged cheese, red wine, processed meats, spinach, etc.). Low DAO activity can lead to <strong>Histamine Intolerance</strong>. This causes allergy-like symptoms (headaches, migraines, hives, flushing, nasal congestion, digestive upset) after eating high-histamine foods.</p>
<p><strong>Guidance & Recommendations:</strong> A low-histamine diet is the primary management strategy. You can also take a DAO enzyme supplement right before high-histamine meals. Support the cofactors for your body's own DAO production.</p>
<ul>
    <li><strong>Vitamin C:</strong> Acts as a natural antihistamine and is a cofactor for DAO.</li>
    <li><strong>Vitamin B6 (as P-5-P):</strong> A critical cofactor for the DAO enzyme. Deficiency can mimic DAO variants.</li>
    <li><strong>Zinc:</strong> Another key cofactor for DAO production.</li>
</ul>
`,
    keyNutrient: ['Vitamin C', 'Vitamin B6 (Pyridoxine)', 'Zinc']
  },

  // --- 4. Antioxidant metabolism and detoxification ---

  {
    id: 1129,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['SOD2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>SOD2</strong> (Superoxide Dismutase 2, e.g., Ala16Val) affects your primary mitochondrial antioxidant enzyme. Your mitochondria (cell "power plants") create a toxic byproduct called "superoxide" just by making energy. SOD2's job is to neutralize this. A "slower" variant (like the 'Ala' version) makes this enzyme less efficient, leading to higher oxidative stress inside your mitochondria. This can accelerate cellular aging and inflammation.</p>
<p><strong>Guidance & Recommendations:</strong> You have a weaker "exhaust fan" in your cell's engine. You must boost your mitochondrial-specific antioxidant defenses.</p>
<ul>
    <li><strong>Coenzyme Q10:</strong> The most important antioxidant that is physically inside the mitochondria, protecting it from damage.</li>
    <li><strong>Resveratrol:</strong> Can help activate your body's own antioxidant defense pathways (like NRF2).</li>
    <li><strong>Manganese:</strong> The specific mineral cofactor required for the SOD2 enzyme to function.</li>
</ul>
`,
    keyNutrient: ['Coenzyme Q10', 'Resveratrol', 'Manganese']
  },
  {
    id: 1130,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['GPX1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>GPX1</strong> (Glutathione Peroxidase 1) affects a key enzyme that uses glutathione to neutralize hydrogen peroxide (a damaging free radical). This enzyme is selenium-dependent. A "slow" variant (like Pro198Leu) is less effective, especially when selenium status is low. This reduces your ability to "recharge" your master antioxidant, glutathione, increasing overall oxidative stress.</p>
<p><strong>Guidance & Recommendations:</strong> Ensure an adequate supply of this enzyme's key cofactor and the raw material it uses.</p>
<ul>
    <li><strong>Selenium:</strong> This is the most critical cofactor for GPX1. Consume selenium-rich foods like Brazil nuts or consider supplementation if levels are low.</li>
    <li><strong>Glutathione / N-acetylcysteine (NAC):</strong> Provides the "fuel" (glutathione, or its precursor NAC) that this enzyme uses.</li>
</ul>
`,
    keyNutrient: ['Selenium', 'Glutathione', 'N-acetylcysteine (NAC)'] // Added Selenium based on DB
  },
  {
    id: 1131,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CAT'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CAT</strong> (Catalase) affects the enzyme that neutralizes hydrogen peroxide, a major free radical. Catalase is incredibly fast and efficient. A "slow" variant means you are less able to clear this specific oxidant, which can lead to higher systemic oxidative stress and is sometimes associated with graying hair or skin pigment changes (as peroxide builds up). This variant is particularly sensitive to high iron levels (which create more peroxide).</p>
<p><strong>Guidance & Recommendations:</strong> Support your other antioxidant systems to compensate for this "slow" enzyme.</p>
<ul>
    <li><strong>Coenzyme Q10:</strong> A broad-spectrum antioxidant that helps reduce the creation of free radicals in the first place.</li>
    <li><strong>Resveratrol:</strong> Helps boost the body's overall antioxidant network.</li>
</ul>
`,
    keyNutrient: ['Coenzyme Q10', 'Resveratrol']
  },
  {
    id: 1132,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['GSTM1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] } // e.g., 'null'
    ],
    logic: 'AND',
    response: `
<p>A "null" variant in <strong>GSTM1</strong> (or GSTT1) means you are completely missing this crucial Phase II detoxification enzyme. These enzymes are "conjugators" that "tag" toxins to prepare them for removal. GSTM1 is specialized for clearing polycyclic aromatic hydrocarbons (PAHs) (from char-grilled foods, exhaust fumes) and aflatoxins (from moldy grains). Lacking this enzyme makes you more vulnerable to these specific carcinogens.</p>
<p><strong>Guidance & Recommendations:</strong> You must proactively support your other detox pathways to compensate. Avoid char-grilled foods and minimize exposure to smoke/fumes. Boost your master antioxidant, glutathione, as it is the "fuel" for the GST enzymes you do have.</p>
<ul>
    <li><strong>N-acetylcysteine (NAC) / Glutathione:</strong> Directly provides the glutathione "fuel" for other GST enzymes.</li>
    <li><strong>Green tea extract / Curcumin:</strong> These compounds can help boost the activity of your other Phase II enzymes (like NQO1).</li>
    <li><strong>Milk thistle (silymarin):</strong> Protects the liver, your main detox organ, from damage.</li>
</ul>
`,
    keyNutrient: ['N-acetylcysteine (NAC)', 'Glutathione', 'Green tea extract', 'Curcumin', 'Milk thistle (silymarin)']
  },
  {
    id: 1133,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['NQO1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>NQO1</strong> (e.g., C609T) results in an unstable, non-functional enzyme. This is a critical loss, as NQO1 has two jobs: 1) It detoxifies harmful quinones (found in cigarette smoke, pollution, and some drugs like chemotherapy). 2) It is one of the body's only enzymes that can recycle and regenerate active Coenzyme Q10. This variant makes you vulnerable to quinone toxicity and can lead to chronically low CoQ10 status, impacting cellular energy (especially in the heart and brain).</p>
<p><strong>Guidance & Recommendations:</strong> Compensate for the lack of recycling by providing the active compound directly.</p>
<ul>
    <li><strong>Coenzyme Q10:</strong> Supplementation is highly recommended to bypass the body's inability to recycle it effectively.</li>
    <li><strong>N-acetylcysteine (NAC):</strong> Supports overall glutathione-based detoxification, taking stress off other pathways.</li>
</ul>
`,
    keyNutrient: ['Coenzyme Q10', 'N-acetylcysteine (NAC)']
  },
  {
    id: 1134,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['NFE2L2'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>NFE2L2</strong> affects the <strong>NRF2 "master switch."</strong> NRF2 is the protein that senses oxidative stress and then turns on your body's entire antioxidant defense system (including SOD2, GST, NQO1, GPX1). A "pathogenic" variant can make this "switch" sluggish or less sensitive. It's harder for your body to turn on its defenses when needed. This can lead to a state of chronic, un-managed oxidative stress.</p>
<p><strong>Guidance & Recommendations:</strong> You cannot rely on your body's "automatic" defense system. You must proactively "switch it on" with lifestyle and foods, and supplement with antioxidants directly.</p>
<ul>
    <li><strong>Curcumin:</strong> A potent activator of the NRF2 pathway.</li>
    <li><strong>Green tea extract:</strong> EGCG is also known to activate NRF2.</li>
    <li><strong>Resveratrol:</strong> Another phytonutrient that supports this "master switch."</li>
    <li><strong>Alpha-lipoic acid:</strong> A powerful antioxidant that also helps activate NRF2.</li>
</ul>
`,
    keyNutrient: ['Curcumin', 'Green tea extract', 'Resveratrol', 'Alpha-lipoic acid']
  },

  // --- 5. Physical Performance and Body Composition ---

  {
    id: 1135,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['ACTN3'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>ACTN3</strong> (e.g., R577X) is the <strong>"sprinter vs. endurance"</strong> gene. This protein is only found in fast-twitch (Type II) muscle fibers, which are responsible for power and speed. The "pathogenic" XX genotype means you do not produce this protein at all. This makes you less likely to be an elite power or sprint athlete. However, this "loss" makes your muscles more efficient, which is a distinct advantage in endurance sports. Your muscle fiber type is genetically geared for endurance.</p>
<p><strong>Guidance & Recommendations:</strong> Align your training with your genetics. You are likely to excel and recover better from endurance-based activities (long-distance running, cycling) rather than pure powerlifting or sprinting.</p>
<ul>
    <li><strong>Creatine monohydrate:</strong> While often used for power, it is still a valuable tool for all athletes to support ATP recycling and recovery.</li>
</ul>
`,
    keyNutrient: ['Creatine monohydrate']
  },
  {
    id: 1136,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['ACE'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] } // Assuming 'D' allele is 'pathogenic' for this context
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>ACE</strong> (Angiotensin-Converting Enzyme) relates to the <strong>"D" (Deletion)</strong> allele. This "D" allele is associated with higher ACE enzyme activity, which leads to greater vasoconstriction (tighter blood vessels). This profile is metabolically less efficient for endurance but is associated with superior performance in power and sprint activities, as well as a greater muscle-building response to training. The "I" (Insertion) allele is the opposite, favoring endurance.</p>
<p><strong>Guidance & Recommendations:</strong> Your physiology is genetically geared for power and strength. You are likely to see excellent results from resistance training and short-burst (anaerobic) activities. This allele is also linked to higher blood pressure risk, so monitoring BP is wise.</p>
<ul>
    <li><strong>Whey protein / Essential amino acids (EAAs):</strong> Support the superior muscle-building (hypertrophy) response you are likely to get from training.</li>
</ul>
`,
    keyNutrient: ['Whey protein', 'Essential amino acids (EAAs)']
  },
  {
    id: 1137,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['PPARA'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>PPARA</strong> (Peroxisome Proliferator-Activated Receptor Alpha) affects a key metabolic "switch" that helps your muscles shift from burning sugar to burning fat during exercise. A variant here can make this switch less efficient, meaning you are less "fat-adapted" and may "bonk" or "hit the wall" sooner during long-duration endurance exercise, as you burn through your limited sugar (glycogen) stores more quickly.</p>
<p><strong>Guidance & Recommendations:</strong> This may impact endurance performance. Training in a fasted state or using a "train low, compete high" (carb) strategy may help "force" this pathway to become more efficient. Supporting fat metabolism is key.</p>
<ul>
    <li><strong>L-carnitine:</strong> This nutrient is the "shuttle" that physically transports fats into the mitochondria to be burned for fuel. Supplementing can support this process.</li>
</ul>
`,
    keyNutrient: ['L-carnitine']
  },
  {
    id: 1138,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['COL1A1'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>COL1A1</strong> (Collagen Type I Alpha 1) affects the primary building block of your tendons and ligaments. This gene provides the "rebar" for your connective tissues. A "pathogenic" variant (e.g., G-to-T at Sp1) is linked to weaker collagen structure and a significantly higher risk of soft tissue injuries, such as ACL tears and Achilles tendonitis. This is a critical genetic risk factor for athletes.</p>
<p><strong>Guidance & Recommendations:</strong> You must be extra diligent with proper warm-ups, cool-downs, technique, and avoiding overtraining. Provide your body with the raw materials to build the strongest possible collagen.</p>
<ul>
    <li><strong>Collagen peptides:</strong> Provides the specific amino acids (like glycine and proline) needed to build and repair collagen.</li>
    <li><strong>Vitamin C:</strong> A mandatory cofactor for collagen synthesis. Without it, collagen cannot be formed properly.</li>
    <li><strong>Proline:</strong> A key amino acid building block for collagen.</li>
</ul>
`,
    keyNutrient: ['Collagen peptides', 'Vitamin C', 'Proline']
  },

  // --- 6. Appetite control, eating behavior, and circadian rhythm ---

  {
    id: 1139,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['CLOCK'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>CLOCK</strong> (Circadian Locomotor Output Cycles Kaput) affects a master gene that controls your 24-hour circadian rhythm (body clock). A variant here can disrupt this clock, often leading to a delayed sleep phase ("night owl" tendency). This is strongly linked to poorer metabolic health. Individuals with this variant often lose less weight, have worse insulin sensitivity, and higher blood pressure, especially if they eat late at night or have inconsistent sleep schedules.</p>
<p><strong>Guidance & Recommendations:</strong> A strict sleep schedule (going to bed and waking up at the same time, even on weekends) is critical. You must avoid eating late at night, as your body is metabolically unprepared to handle food at that time.</p>
<ul>
    <li><strong>Melatonin:</strong> Can be used short-term (0.5-3mg) before bed to help "anchor" and reset your sleep-wake cycle.</li>
    <li><strong>Magnesium:</strong> Helps calm the nervous system and promote relaxation before sleep.</li>
</ul>
`,
    keyNutrient: ['Melatonin', 'Magnesium']
  },
  {
    id: 1140,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['LEPR'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>LEPR</strong> (Leptin Receptor) affects the "keyhole" for leptin, your primary satiety hormone. Leptin is released by your fat cells and travels to your brain to say, "We have enough energy, you can stop eating." A variant here can make your brain "deaf" to this signal (leptin resistance). This means that even with high body fat, your brain still thinks it's starving, driving persistent hunger and a slow metabolism.</p>
<p><strong>Guidance & Recommendations:</strong> Managing this is very difficult as it's a powerful, primitive hunger drive. The key is to re-sensitize the brain. This is best done by reducing inflammation (which blocks the leptin signal) and avoiding high-fructose foods (which strongly drive leptin resistance).</p>
<ul>
    <li><strong>Omega-3 fatty acids:</strong> Highly anti-inflammatory, which can help reduce the neuro-inflammation that blocks leptin signals.</li>
    <li><strong>Berberine:</strong> Helps improve the downstream metabolic chaos (like insulin resistance) caused by leptin resistance.</li>
</ul>
`,
    keyNutrient: ['Omega-3 fatty acids', 'Berberine']
  },
  {
    id: 1141,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['COMT'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>COMT</strong> (Catechol-O-Methyltransferase, e.g., Val158Met) makes you a <strong>"slow" clearer of catecholamines</strong> (like dopamine, norepinephrine, estrogen). This can make you a "Worrier" (more prone to anxiety as stress chemicals linger) but also give you great focus. In the context of eating, this "slow" variant is linked to higher dopamine-seeking behavior. This can manifest as emotional eating or strong cravings for "comfort" and "reward" foods (sugar, fat, salt) as a way to get a quick dopamine hit.</p>
<p><strong>Guidance & Recommendations:</strong> You are wired to "self-medicate" with food. Stress management is your #1 tool. Finding non-food rewards (music, hobbies, exercise) is crucial. Support the COMT enzyme with its key cofactor.</p>
<ul>
    <li><strong>Magnesium:</strong> The most important cofactor for the COMT enzyme. Higher magnesium levels can help "speed up" a "slow" COMT.</li>
    <li><strong>L-theanine:</strong> Promotes a "calm focus" and can reduce the anxiety that often triggers reward-seeking eating.</li>
</ul>
`,
    keyNutrient: ['Magnesium', 'L-theanine']
  },
  {
    id: 1142,
    conditions: [
      { field: 'geneticVariants', operator: 'contains', value: ['BDNF'] },
      { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
    ],
    logic: 'AND',
    response: `
<p>A variant in <strong>BDNF</strong> (Brain-Derived Neurotrophic Factor, e.g., Val66Met) affects the "Miracle-Gro for your brain." BDNF is essential for growing new neurons, learning, and mood. The "Met" variant is linked to lower secretion of BDNF. This can increase vulnerability to low mood or depression and is also linked to impaired appetite regulation, often manifesting as emotional eating or eating in the absence of hunger. Your brain may be subconsciously driving you to eat (especially fat/sugar) to try and "feel better."</p>
<p><strong>Guidance & Recommendations:</strong> The most potent way to increase BDNF is aerobic exercise. This is non-negotiable. Support brain health with key nutrients.</p>
<ul>
    <li><strong>Fish oil (DHA):</strong> The primary structural fat of your brain, essential for BDNF signaling.</li>
    <li><strong>Lion's mane (Hericium erinaceus):</strong> A medicinal mushroom shown to support Nerve Growth Factor (NGF) and BDNF pathways.</li>
    <li><strong>Bacopa monnieri:</strong> An herb that may support BDNF levels and cognitive function.</li>
</ul>
`,
    keyNutrient: ['Fish oil (DHA)', 'Lion\'s mane (Hericium erinaceus)', 'Bacopa monnieri']
  },

  // --- Catch-all & Empty Rules ---

  {
    id: 1198,
    conditions: [
      { field: 'geneticVariants', operator: 'notEquals', value: [''] },
      // Add 'notContains' for every single gene handled above
      { field: 'geneticVariants', operator: 'notContains', value: ['MTHFR'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['MTR'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['MTRR'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CBS'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['FUT2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['GC'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CYP2R1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CYP27B1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['VDR'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['BCMO1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['SLC23A1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['HFE'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['TMPRSS6'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['SLC30A8'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['PPARG'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['FTO'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['MC4R'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['TCF7L2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['APOE'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['LPL'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CETP'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['PCSK9'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CYP1A2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['ALDH2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['MCM6'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['HLA-DQ2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['TAS2R38'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['DAO'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['SOD2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['GPX1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CAT'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['GSTM1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['NQO1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['NFE2L2'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['ACTN3'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['ACE'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['PPARA'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['COL1A1'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['CLOCK'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['LEPR'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['COMT'] },
      { field: 'geneticVariants', operator: 'notContains', value: ['BDNF'] }
    ],
    logic: 'AND',
    response: `
<p>Your provided genetic data includes variants (e.g., in genes not listed in our primary panel) that are outside our core analysis. Genetic variants (polymorphisms) offer valuable clues about predispositions but must be contextualized with your full clinical picture and lifestyle, not used as standalone diagnostic tools. We recommend discussing these specific findings with a medical geneticist or a functional genomics practitioner to understand their personal meaning for you.</p>
`,
    keyNutrient: null
  },
  {
    id: 1199,
    conditions: [{ field: 'geneticVariants', operator: 'equals', value: [''] }],
    logic: 'AND',
    response: `
<p>No specific genetic variants were entered for analysis. Genetic testing can offer powerful insights into your unique predispositions related to nutrient metabolism (e.g., MTHFR, BCMO1), detoxification (e.g., GSTM1, SOD2), disease risk (e.g., APOE, TCF7L2), and even food sensitivities (e.g., DAO, LCT). If you have data from a consumer testing service, discussing it with a practitioner can help further personalize your diet, supplement, and lifestyle plan.</p>
`,
    keyNutrient: null
  }
]
 
});