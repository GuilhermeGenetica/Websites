// /src/utils/defaultRules.js
// NOTE: This file has been updated to include all rules from defaultRules.php,
// ensuring no duplicates and maintaining the JavaScript coding standard.
// The keyNutrient values have been standardized against the CATEGORIZED_NUTRIENTS list.

export const getDefaultRules = () => ({
  "Lifestyle Factors": [
    {
      id: 101,
      conditions: [{ field: 'activityLevel', operator: 'equals', value: ['Sedentary (Little or no exercise)'] }],
      logic: 'AND',
      response: 'A sedentary lifestyle is a significant modifiable risk factor for cardiometabolic diseases. It is strongly recommended to incorporate a minimum of 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity aerobic exercise per week, plus muscle-strengthening activities on 2 or more days.',
      keyNutrient: ['Coenzyme Q10', 'Alpha-lipoic acid', 'L-carnitine']
    },
    {
      id: 102,
      conditions: [{ field: 'sleepHours', operator: 'lessThan', value: [7] }],
      logic: 'AND',
      response: 'Chronic sleep deprivation (<7 hours) profoundly disrupts circadian rhythms, leading to hormonal dysregulation (elevated cortisol, impaired glucose tolerance). Prioritizing a consistent sleep schedule of 7-9 hours is foundational for health. Consider sleep hygiene practices and targeted nutritional support.',
      keyNutrient: ['Magnesium', 'L-theanine', 'Apigenin', 'Valerian root']
    },
    {
      id: 103,
      conditions: [{ field: 'sleepHours', operator: 'greaterThanOrEqual', value: [7] }],
      logic: 'AND',
      response: 'Excellent! Your sleep duration of 7 or more hours per night is consistent with recommendations for optimal health, recovery, and hormonal balance. Maintaining this habit is a powerful tool for long-term wellness.',
      keyNutrient: null
    },
    {
      id: 104,
      conditions: [{ field: 'stressLevel', operator: 'greaterThanOrEqual', value: [8] }],
      logic: 'AND',
      response: 'A high perceived stress level (≥8/10) indicates chronic activation of the HPA axis, driving systemic inflammation and hormonal imbalances. Implementing daily stress modulation techniques (e.g., mindfulness, breathwork) alongside adaptogenic support is critical.',
      keyNutrient: ['Ashwagandha', 'Rhodiola rosea', 'Phosphatidylserine', 'L-theanine', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
    {
      id: 105,
      conditions: [{ field: 'smokingStatus', operator: 'equals', value: ['Daily smoker'] }],
      logic: 'AND',
      response: 'Daily smoking introduces a massive burden of oxidative stress, depleting endogenous antioxidants like glutathione. Smoking cessation is the most impactful health intervention. Aggressive nutritional support is warranted to mitigate damage, focusing on potent antioxidants and detoxification pathways.',
      keyNutrient: ['Vitamin C', 'N-acetylcysteine (NAC)', 'Glutathione', 'Vitamin E (Tocopherols / Tocotrienols)']
    },
    {
      id: 106,
      conditions: [{ field: 'alcoholConsumption', operator: 'equals', value: ['High (>7 drinks/week)'] }],
      logic: 'AND',
      response: 'High alcohol intake places a significant metabolic burden on the liver, depletes key B-vitamins, and contributes to intestinal hyperpermeability ("leaky gut"). A substantial reduction in alcohol intake is advised to support liver function, gut health, and overall metabolic resilience.',
      keyNutrient: ['Milk thistle (silymarin)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'N-acetylcysteine (NAC)', 'Taurine', 'Zinc']
    },
    {
      id: 107,
      conditions: [{ field: 'alcoholConsumption', operator: 'equals', value: ['Never'] }],
      logic: 'AND',
      response: 'Abstaining from alcohol consumption is an excellent choice for supporting long-term liver health, maintaining a stable gut microbiome, and minimizing systemic inflammation. We commend and support this healthy lifestyle habit.',
      keyNutrient: null
    }
  ],
  "Body Composition & Anthropometrics": [
    {
      id: 201,
      conditions: [{ field: 'bmi', operator: 'lessThan', value: [18.5] }],
      logic: 'AND',
      response: 'A Body Mass Index (BMI) in the underweight category may indicate malnutrition, increasing risks for sarcopenia and compromised immune function. A nutritional assessment is crucial to develop a strategy for achieving a healthy weight through a nutrient-dense diet.',
      keyNutrient: ['Whey protein', 'Essential amino acids (EAAs)', 'Creatine monohydrate']
    },
    {
      id: 202,
      conditions: [{ field: 'bmi', operator: 'between', value: [18.5, 24.9] }],
      logic: 'AND',
      response: 'Congratulations, your Body Mass Index (BMI) is within the optimal healthy weight range. Maintaining this through a balanced diet and consistent physical activity is key to minimizing long-term disease risk.',
      keyNutrient: null
    },
    {
      id: 203,
      conditions: [{ field: 'bmi', operator: 'between', value: [25.0, 29.9] }],
      logic: 'AND',
      response: 'A BMI in the overweight range is associated with an increased risk of insulin resistance and hypertension. This is a critical window for intervention. Focus on a whole-foods, low-glycemic diet and regular physical activity to improve metabolic health.',
      keyNutrient: ['Berberine', 'Green tea extract', 'Chromium (chromium picolinate)', 'Alpha-lipoic acid']
    },
    {
      id: 204,
      conditions: [{ field: 'bmi', operator: 'greaterThanOrEqual', value: [30.0] }],
      logic: 'AND',
      response: 'A BMI in the obese category indicates a state of excess adiposity, which functions as an active endocrine organ producing inflammatory cytokines, significantly elevating chronic disease risk. A comprehensive, medically-supervised program is strongly advised.',
      keyNutrient: ['Berberine', 'Omega-3 fatty acids', 'Conjugated linoleic acid (CLA)']
    }
  ],
  "Hematology & Iron Status": [
    {
      id: 301,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'hemoglobin', operator: 'lessThan', value: [13.5] }
      ],
      logic: 'AND',
      response: 'Hemoglobin below the reference range indicates anemia. In men, this requires immediate medical investigation to rule out causes like chronic blood loss or malabsorption. A complete iron panel, B12, and folate assessment is critical.',
      keyNutrient: ['Iron', 'Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)']
    },
    {
      id: 302,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'hemoglobin', operator: 'lessThan', value: [12.0] }
      ],
      logic: 'AND',
      response: 'Hemoglobin below the reference range indicates anemia. For women, iron deficiency is a common cause, but other deficiencies (B12, folate) must be evaluated. A complete iron panel is necessary to determine the appropriate course of action.',
      keyNutrient: ['Iron', 'Vitamin C', 'Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)']
    },
    {
      id: 303,
      conditions: [{ field: 'ferritin', operator: 'lessThan', value: [50] }],
      logic: 'AND',
      response: 'Ferritin below 50 ng/mL, while often "normal", is functionally suboptimal and indicates depleted iron stores, which can manifest as fatigue and hair loss. Supplementing with a non-constipating form of iron like iron bisglycinate is recommended.',
      keyNutrient: ['Iron', 'Vitamin C']
    },
    {
        id: 304,
        conditions: [{ field: 'ferritin', operator: 'between', value: [50, 150] }],
        logic: 'AND',
        response: 'Your ferritin level is within the optimal functional range, indicating adequate iron stores for energy production and overall health. Maintaining this level through a balanced, iron-rich diet is recommended.',
        keyNutrient: null
    },
    {
      id: 305,
      conditions: [{ field: 'ferritin', operator: 'greaterThan', value: [150] }],
      logic: 'AND',
      response: 'Elevated ferritin can indicate chronic inflammation, iron overload (hemochromatosis), or liver damage. It is a pro-oxidant and should be investigated further. Avoid iron-fortified foods and supplements unless medically advised.',
      keyNutrient: ['Curcumin', 'Quercetin']
    },
    {
      id: 306,
      conditions: [{ field: 'mcv', operator: 'lessThan', value: [85] }],
      logic: 'AND',
      response: 'Mean Corpuscular Volume (MCV) below the optimal range (85-95 fL) suggests microcytic red blood cells, a classic sign of iron deficiency or potentially thalassemia trait. A full iron panel is warranted to differentiate and guide intervention.',
      keyNutrient: ['Iron', 'Vitamin C']
    },
    {
        id: 307,
        conditions: [{ field: 'mcv', operator: 'between', value: [85, 95] }],
        logic: 'AND',
        response: 'Your Mean Corpuscular Volume (MCV) is in the optimal range, indicating healthy red blood cell size and volume, which is crucial for efficient oxygen transport. This suggests adequate status of iron, B12, and folate.',
        keyNutrient: null
    },
    {
      id: 308,
      conditions: [{ field: 'mcv', operator: 'greaterThan', value: [95] }],
      logic: 'AND',
      response: 'MCV above the optimal range (>95 fL) suggests macrocytic red blood cells, classically caused by a deficiency in Vitamin B12 or folate, which are critical for DNA synthesis. Evaluation of these nutrients is essential.',
      keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)']
    }
  ],
  "Micronutrient & Inflammation Status": [
    {
      id: 401,
      conditions: [{ field: 'vitaminD', operator: 'lessThan', value: [40] }],
      logic: 'AND',
      response: 'Your Vitamin D level is suboptimal. The optimal functional range is 40-60 ng/mL for robust immune function and hormone regulation. Supplementation with Vitamin D3, paired with Vitamin K2 (MK-7) to ensure proper calcium deposition, is recommended.',
      keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)']
    },
    {
        id: 402,
        conditions: [{ field: 'vitaminD', operator: 'between', value: [40, 60] }],
        logic: 'AND',
        response: 'Excellent! Your Vitamin D level is in the optimal functional range (40-60 ng/mL), which is supportive of a healthy immune system, bone density, and mood. Continued sensible sun exposure and/or maintenance supplementation is advised.',
        keyNutrient: null
    },
    {
      id: 403,
      conditions: [{ field: 'vitaminB12', operator: 'lessThan', value: [500] }],
      logic: 'AND',
      response: 'Your Vitamin B12 level is below the optimal functional range (>500 pg/mL). Suboptimal B12 can impact neurological health and energy metabolism. Supplementation with an active form like methylcobalamin is advised.',
      keyNutrient: ['Vitamin B12 (Cobalamin)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)']
    },
    {
      id: 404,
      conditions: [{ field: 'rBCMagnesium', operator: 'lessThan', value: [6.0] }],
      logic: 'AND',
      response: 'Red Blood Cell (RBC) Magnesium below 6.0 mg/dL suggests a functional deficiency. Magnesium is a critical cofactor in over 600 enzymatic reactions. Supplementation with a well-absorbed form like magnesium glycinate or malate is recommended.',
      keyNutrient: ['Magnesium']
    },
    {
      id: 405,
      conditions: [{ field: 'homocysteine', operator: 'greaterThan', value: [9] }],
      logic: 'AND',
      response: 'An elevated homocysteine level (>9 µmol/L) is an independent risk factor for cardiovascular disease. It signals inefficiency in the methylation cycle, often due to insufficient B-vitamins. Supplementation with activated forms is a primary strategy.',
      keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Vitamin B6 (Pyridoxine)']
    },
    {
        id: 406,
        conditions: [{ field: 'homocysteine', operator: 'lessThanOrEqual', value: [9] }],
        logic: 'AND',
        response: 'Your homocysteine level is within the optimal range, indicating a healthy and efficient methylation cycle. This is protective for cardiovascular health. A diet rich in leafy greens and B vitamins will help maintain this status.',
        keyNutrient: null
    },
    {
      id: 407,
      conditions: [{ field: 'hsCRP', operator: 'greaterThan', value: [1.0] }],
      logic: 'AND',
      response: 'An hs-CRP level above 1.0 mg/L indicates chronic, low-grade systemic inflammation, a foundational driver of most chronic diseases. An aggressive anti-inflammatory diet, stress management, and targeted botanicals are strongly advised.',
      keyNutrient: ['Omega-3 fatty acids', 'Curcumin', 'Resveratrol', 'Boswellia serrata']
    }
  ],
  "Cardiovascular & Lipid Panel": [
    {
      id: 501,
      conditions: [{ field: 'apoB', operator: 'greaterThanOrEqual', value: [90] }],
      logic: 'AND',
      response: 'An Apolipoprotein B (ApoB) level above 90 mg/dL indicates an elevated number of atherogenic lipoprotein particles, a key driver of atherosclerosis. This is a more accurate risk marker than LDL-C alone. Management should focus on reducing dietary saturated fat and refined carbohydrates.',
      keyNutrient: ['Berberine', 'Phytosterols / plant sterols', 'Vitamin B3 (Niacin)']
    },
    {
      id: 502,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'hdl', operator: 'lessThan', value: [40] }
      ],
      logic: 'AND',
      response: 'Low HDL cholesterol reduces reverse cholesterol transport, increasing cardiovascular risk. Key strategies to raise HDL include high-intensity interval training (HIIT), consumption of monounsaturated fats, and potentially niacin under medical supervision.',
      keyNutrient: ['Vitamin B3 (Niacin)', 'Omega-3 fatty acids']
    },
    {
      id: 503,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'hdl', operator: 'lessThan', value: [50] }
      ],
      logic: 'AND',
      response: 'Low HDL cholesterol reduces reverse cholesterol transport, increasing cardiovascular risk. Key strategies to raise HDL include high-intensity interval training (HIIT), consumption of monounsaturated fats, and potentially niacin under medical supervision.',
      keyNutrient: ['Vitamin B3 (Niacin)', 'Omega-3 fatty acids']
    },
    {
      id: 504,
      conditions: [{ field: 'triglycerides', operator: 'greaterThanOrEqual', value: [100] }],
      logic: 'AND',
      response: 'Triglyceride levels over 100 mg/dL (optimally <75) are a strong indicator of excess carbohydrate consumption and potential insulin resistance. A lower-carbohydrate diet and high-dose Omega-3 fatty acids are highly effective interventions.',
      keyNutrient: ['Fish oil (EPA)', 'Fish oil (DHA)', 'Berberine']
    },
    {
      id: 505,
      conditions: [{ field: 'lipoproteinA', operator: 'greaterThanOrEqual', value: [30] }],
      logic: 'AND',
      response: 'An elevated Lipoprotein(a) is a significant, genetically-influenced risk factor for cardiovascular disease. As it is largely resistant to lifestyle changes, management requires aggressive control of all other modifiable risk factors (e.g., ApoB, inflammation). Medical consultation is essential.',
      keyNutrient: ['Vitamin B3 (Niacin)', 'L-carnitine', 'Vitamin C', 'Proline']
    }
  ],
  "Metabolic & Glucose Health": [
    {
      id: 601,
      conditions: [{ field: 'fastingGlucose', operator: 'between', value: [90, 99] }],
      logic: 'AND',
      response: 'Your fasting glucose is in the high-normal range, an early sign of declining insulin sensitivity. This is an important opportunity for proactive intervention through a low-glycemic diet and exercise to prevent progression to prediabetes.',
      keyNutrient: ['Berberine', 'Chromium (chromium picolinate)']
    },
    {
        id: 602,
        conditions: [{ field: 'fastingGlucose', operator: 'lessThan', value: [90] }],
        logic: 'AND',
        response: 'Your fasting glucose level is in the optimal range, indicating good insulin sensitivity and metabolic health. To maintain this, continue to focus on a diet based on whole foods and regular physical activity.',
        keyNutrient: null
    },
    {
      id: 603,
      conditions: [{ field: 'hba1c', operator: 'between', value: [5.5, 6.4] }],
      logic: 'AND',
      response: 'Your HbA1c is in the prediabetic range, reflecting higher than optimal average blood glucose over the past 3 months. This indicates significant insulin resistance. A structured diet and exercise plan is essential to reverse this trend.',
      keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Vitamin B1 (Thiamine)']
    },
    {
      id: 604,
      conditions: [{ field: 'fastingInsulin', operator: 'greaterThan', value: [7] }],
      logic: 'AND',
      response: 'Your fasting insulin is above the optimal functional range (<7 µIU/mL), a direct marker of insulin resistance. Hyperinsulinemia is a primary driver of metabolic dysfunction. Strategies to improve insulin sensitivity, such as carbohydrate restriction and strength training, are a priority.',
      keyNutrient: ['Berberine', 'Magnesium']
    },
    {
      id: 605,
      conditions: [{ field: 'homaIR', operator: 'greaterThanOrEqual', value: [1.8] }],
      logic: 'AND',
      response: 'Your HOMA-IR score is elevated (optimal <1.8), confirming a state of insulin resistance. This is a crucial indicator of metabolic health. Addressing this with aggressive diet and lifestyle interventions is key to reducing future disease risk.',
      keyNutrient: ['Berberine', 'Alpha-lipoic acid', 'Magnesium']
    },
    {
      id: 606,
      conditions: [{ field: 'uricAcid', operator: 'greaterThan', value: [5.7] }],
      logic: 'AND',
      response: 'Your uric acid is elevated (>5.7 mg/dL). Beyond gout, it is a key player in metabolic syndrome and hypertension. It is advisable to strictly limit fructose (especially from sugary drinks), alcohol, and high-purine foods.',
      keyNutrient: ['Quercetin', 'Vitamin C']
    }
  ],
  "Liver & Kidney Health": [
    {
        id: 701,
        conditions: [{ field: 'alt', operator: 'greaterThan', value: [25] }],
        logic: 'AND',
        response: 'Your Alanine Aminotransferase (ALT) level is above the optimal functional range (<25 U/L), suggesting potential liver cell inflammation, often an early sign of Non-Alcoholic Fatty Liver Disease (NAFLD). Liver-supportive strategies are warranted.',
        keyNutrient: ['Milk thistle (silymarin)', 'Taurine', 'N-acetylcysteine (NAC)']
    },
    {
        id: 702,
        conditions: [{ field: 'ast', operator: 'greaterThan', value: [25] }],
        logic: 'AND',
        response: 'Your Aspartate Aminotransferase (AST) is above the optimal functional range (<25 U/L). While less specific than ALT, its elevation can also indicate liver cell stress. An AST/ALT ratio analysis is helpful for further insight.',
        keyNutrient: ['Milk thistle (silymarin)', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
    {
        id: 703,
        conditions: [{ field: 'ggt', operator: 'greaterThan', value: [30] }],
        logic: 'AND',
        response: 'Gamma-Glutamyl Transferase (GGT) is a sensitive marker for liver and oxidative stress. An elevation >30 U/L can be an early indicator of liver disease and is strongly associated with alcohol consumption and low glutathione status.',
        keyNutrient: ['Glutathione', 'N-acetylcysteine (NAC)', 'Milk thistle (silymarin)']
    },
    {
        id: 704,
        conditions: [{ field: 'eGFR', operator: 'lessThan', value: [90] }],
        logic: 'AND',
        response: 'Your eGFR is below 90, which may indicate early stages of reduced kidney function. It is crucial to manage blood pressure, control blood sugar, and ensure adequate hydration. Medical supervision is required.',
        keyNutrient: ['Resveratrol', 'Omega-3 fatty acids']
    }
  ],
  "Hormonal & Thyroid Panel": [
    {
      id: 801,
      conditions: [{ field: 'tsh', operator: 'greaterThan', value: [2.5] }],
      logic: 'AND',
      response: 'Your TSH is above the optimal functional range (>2.5 µIU/mL), which may indicate subclinical hypothyroidism, impairing metabolism, energy, and mood. A full thyroid panel is necessary. Nutritional support for thyroid hormone production is essential.',
      keyNutrient: ['Selenium', 'Zinc', 'Ashwagandha']
    },
    {
      id: 802,
      conditions: [{ field: 'tpoAb', operator: 'greaterThanOrEqual', value: [9] }],
      logic: 'AND',
      response: 'Elevated TPO antibodies confirm an autoimmune thyroid condition (Hashimoto\'s). Management requires supporting thyroid function and modulating the autoimmune response. Investigating gut health and food triggers like gluten is a critical step.',
      keyNutrient: ['Selenium', 'Vitamin D']
    },
    {
      id: 803,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'totalTestosterone', operator: 'lessThan', value: [500] }
      ],
      logic: 'AND',
      response: 'Your total testosterone is in the suboptimal range. Low levels impact energy, mood, and body composition. Medical evaluation is needed. Foundational lifestyle support (sleep, stress, training) is paramount, alongside targeted nutrients.',
      keyNutrient: ['Zinc', 'Vitamin D', 'Boron']
    },
    {
      id: 804,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Male'] },
        { field: 'shbg', operator: 'greaterThan', value: [50] }
      ],
      logic: 'AND',
      response: 'Elevated SHBG reduces free, bioavailable testosterone, leading to symptoms of low T even with normal total testosterone. High SHBG is often linked to high insulin or inflammation. Addressing metabolic health is a key strategy.',
      keyNutrient: ['Boron']
    },
    {
      id: 805,
      conditions: [
        { field: 'gender', operator: 'equals', value: ['Female'] },
        { field: 'estradiol', operator: 'greaterThan', value: [150] }
      ],
      logic: 'AND',
      response: 'Your estradiol level appears elevated (assuming non-ovulatory phase). This "estrogen dominance" can be driven by poor estrogen detoxification. Supporting liver pathways is key.',
      keyNutrient: []
    },
    {
      id: 806,
      conditions: [{ field: 'cortisolAM', operator: 'greaterThan', value: [18] }],
      logic: 'AND',
      response: 'Your morning cortisol is high, indicating a pronounced stress response or HPA axis dysregulation. Chronically elevated cortisol drives insulin resistance and suppresses immune function. A robust stress management protocol with adaptogenic support is a priority.',
      keyNutrient: ['Phosphatidylserine', 'Ashwagandha', 'Rhodiola rosea', 'L-theanine']
    },
    {
      id: 807,
      conditions: [{ field: 'dheas', operator: 'lessThan', value: [150] }],
      logic: 'AND',
      response: 'Your DHEA-S level is suboptimal. DHEA counter-regulates cortisol and is a precursor to sex hormones. Low levels can be associated with "adrenal fatigue" and reduced resilience. Supporting adrenal health is necessary. DHEA supplementation should be medically supervised.',
      keyNutrient: ['DHEA', 'Vitamin C', 'Vitamin B5 (Pantothenic acid)', 'Rhodiola rosea']
    }
  ],
  "Primary Health Goals": [
    {
      id: 901,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Weight Loss'] }],
      logic: 'OR',
      response: 'To strategically support your weight loss goal, consider nutraceuticals that enhance metabolic rate, improve insulin sensitivity, and promote satiety, complementing a whole-foods diet and regular exercise.',
      keyNutrient: ['Green tea extract', 'Berberine', 'Conjugated linoleic acid (CLA)', '5-HTP']
    },
    {
      id: 902,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Muscle Gain'] }],
      logic: 'OR',
      response: 'For muscle protein synthesis, prioritizing protein intake (1.6-2.2g/kg body weight) is essential. Supplements that enhance performance, ATP recycling, and recovery can significantly augment resistance training effects.',
      keyNutrient: ['Creatine monohydrate', 'Whey protein', 'Essential amino acids (EAAs)', 'HMB (β-hydroxy-β-methylbutyrate)']
    },
    {
      id: 903,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Energy Optimization'] }],
      logic: 'OR',
      response: 'To optimize cellular energy, the focus is on supporting mitochondrial function. Addressing underlying nutrient deficiencies that impair ATP production is also a primary strategy.',
      keyNutrient: ['Coenzyme Q10', 'PQQ (pyrroloquinoline quinone)', 'NMN (nicotinamide mononucleotide)', 'Ginseng (Panax ginseng / Panax quinquefolius)']
    },
    {
      id: 904,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Immune Support'] }],
      logic: 'OR',
      response: 'A resilient immune system relies on a synergistic interplay of key vitamins, minerals, and botanicals. Ensuring foundational nutrient adequacy can enhance preparedness.',
      keyNutrient: ['Vitamin D', 'Vitamin C', 'Zinc', 'Quercetin', 'Echinacea']
    },
    {
      id: 905,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Brain Health (Cognition)'] }],
      logic: 'OR',
      response: 'For cognitive enhancement, consider nootropics that support acetylcholine production, protect against oxidative stress, and promote neuroplasticity via Nerve Growth Factor (NGF) support.',
      keyNutrient: ['Lion\'s mane (Hericium erinaceus)', 'Bacopa monnieri', 'Phosphatidylserine', 'Citicoline (CDP-choline)', 'Omega-3 fatty acids']
    },
    {
      id: 906,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Longevity & Anti-aging'] }],
      logic: 'OR',
      response: 'Supporting longevity involves targeting the hallmarks of aging, such as enhancing NAD+ levels, promoting autophagy (cellular cleanup), and activating sirtuins. A multi-faceted approach is most effective.',
      keyNutrient: ['NMN (nicotinamide mononucleotide)', 'Nicotinamide riboside (NR)', 'Resveratrol', 'Fisetin', 'Spermidine', 'Quercetin']
    },
    {
      id: 907,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Cardiovascular Health'] }],
      logic: 'OR',
      response: 'Supporting cardiovascular health involves managing inflammation, supporting healthy lipid levels, and ensuring optimal mitochondrial function within heart tissue.',
      keyNutrient: ['Omega-3 fatty acids', 'Fish oil (EPA)', 'Fish oil (DHA)', 'Coenzyme Q10', 'Garlic extract']
    },
    {
      id: 908,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Bone Health'] }],
      logic: 'OR',
      response: 'Maintaining bone density requires a synergistic blend of vitamins and minerals that work together to support bone formation and calcium absorption.',
      keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)', 'Calcium', 'Magnesium', 'Boron']
    },
    {
      id: 909,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Digestive Health'] }],
      logic: 'OR',
      response: 'A healthy gut microbiome is foundational to overall wellness. Supporting digestion with probiotics, prebiotics, and enzymes can improve nutrient absorption and reduce discomfort.',
      keyNutrient: ['Probiotic multi-strain blends', 'Psyllium husk', 'Gastro/digestive enzyme blends (lipase, protease, amylase)', 'L-glutamine']
    },
    {
      id: 910,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Sleep Improvement'] }],
      logic: 'OR',
      response: 'Improving sleep quality often involves supporting the nervous system\'s relaxation pathways. Certain minerals and herbal extracts can help promote calmness and regulate the sleep-wake cycle.',
      keyNutrient: ['Magnesium', 'L-theanine', 'Melatonin', 'Valerian root', 'Apigenin']
    },
    {
      id: 911,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Stress Management'] }],
      logic: 'OR',
      response: 'Adaptogenic herbs and specific nutrients can help modulate the body\'s stress response, supporting adrenal health and promoting a sense of calm and resilience.',
      keyNutrient: ['Ashwagandha', 'Rhodiola rosea', 'L-theanine', 'Phosphatidylserine']
    },
    {
      id: 912,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Athletic Performance'] }],
      logic: 'OR',
      response: 'To enhance athletic performance, focus on supplements that increase energy availability, buffer lactic acid, and improve blood flow and nutrient delivery to muscles.',
      keyNutrient: ['Creatine monohydrate']
    },
    {
      id: 913,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Skin Health'] }],
      logic: 'OR',
      response: 'For vibrant skin health, consider nutrients that support collagen production, hydration, and protect against oxidative damage from environmental factors.',
      keyNutrient: ['Collagen peptides', 'Hyaluronic acid', 'Vitamin C', 'Vitamin E (Tocopherols / Tocotrienols)']
    },
    {
      id: 914,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Fertility & Pregnancy Support'] }],
      logic: 'OR',
      response: 'Nutritional support is critical for fertility and a healthy pregnancy. Key nutrients support cellular energy for egg and sperm quality, and proper fetal development. Always consult a healthcare provider.',
      keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Coenzyme Q10', 'Fish oil (DHA)', 'Iron']
    },
    {
      id: 915,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Women\'s Health (General)'] }],
      logic: 'OR',
      response: 'General women\'s health often involves supporting bone density, managing iron levels, and ensuring adequate levels of key vitamins that are commonly deficient.',
      keyNutrient: ['Iron', 'Calcium', 'Vitamin D', 'Vitamin B9 (Folate / Folic acid)']
    },
    {
      id: 916,
      conditions: [{ field: 'healthGoals', operator: 'contains', value: ['Other'] }],
      logic: 'OR',
      response: 'For general health and wellness goals, establishing a strong nutritional foundation is the best starting point. Consider a high-quality multivitamin and other foundational supplements.',
      keyNutrient: ['Omega-3 fatty acids', 'Vitamin D', 'Magnesium']
    }
  ],
  "Specific Health Concerns": [
    {
       id: 1001,
       conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Joint Pain'] }],
       logic: 'OR',
       response: 'Supporting joint health involves providing the building blocks for cartilage (collagen) and managing the inflammatory processes that contribute to pain and stiffness. A combined approach is often most effective.',
       keyNutrient: ['Glucosamine sulfate', 'Chondroitin sulfate', 'Methylsulfonylmethane (MSM)', 'Boswellia serrata', 'Collagen peptides']
    },
    {
       id: 1002,
       conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Autoimmune Conditions'] }],
       logic: 'OR',
       response: 'Nutritional support for autoimmune conditions focuses on modulating the immune system, strengthening the gut barrier, and reducing systemic inflammation. This must always be done under strict medical supervision.',
       keyNutrient: ['Vitamin D', 'Omega-3 fatty acids', 'Curcumin', 'Glutathione']
    },
    {
      id: 1003,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['High Cholesterol'] }],
      logic: 'OR',
      response: 'To address high cholesterol, certain supplements can support healthy lipid metabolism in conjunction with diet and lifestyle changes. Professional medical advice is essential.',
      keyNutrient: ['Phytosterols / plant sterols', 'Omega-3 fatty acids', 'Berberine']
    },
    {
      id: 1004,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['High Blood Pressure'] }],
      logic: 'OR',
      response: 'Supporting healthy blood pressure involves promoting vascular relaxation and health. Certain nutrients and botanical extracts can be beneficial as part of a comprehensive plan.',
      keyNutrient: ['Garlic extract', 'Coenzyme Q10', 'Magnesium']
    },
    {
      id: 1005,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Diabetes/Pre-diabetes'] }],
      logic: 'OR',
      response: 'For concerns related to blood sugar regulation, compounds that improve insulin sensitivity and support glucose metabolism can be highly effective alongside medical guidance.',
      keyNutrient: ['Berberine', 'Chromium (chromium picolinate)', 'Alpha-lipoic acid']
    },
    {
      id: 1006,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Inflammation'] }],
      logic: 'OR',
      response: 'Managing chronic inflammation is key to long-term health. Potent natural anti-inflammatory compounds and fatty acids can help modulate inflammatory pathways.',
      keyNutrient: ['Curcumin', 'Omega-3 fatty acids', 'Boswellia serrata', 'Fish oil (EPA)']
    },
    {
      id: 1007,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Digestive Issues (IBS, bloating)'] }],
      logic: 'OR',
      response: 'For digestive issues like IBS and bloating, restoring gut microbial balance with probiotics and supporting digestion with enzymes can provide significant relief.',
      keyNutrient: ['Probiotic multi-strain blends', 'Gastro/digestive enzyme blends (lipase, protease, amylase)', 'L-glutamine']
    },
    {
      id: 1008,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Anxiety/Depression'] }],
      logic: 'OR',
      response: 'Nutritional support for mood involves providing precursors for neurotransmitters and using adaptogens to modulate the stress response. This should complement, not replace, professional care.',
      keyNutrient: ['5-HTP', 'St. John\'s wort', 'Omega-3 fatty acids', 'L-theanine', 'Ashwagandha']
    },
    {
      id: 1009,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Insomnia'] }],
      logic: 'OR',
      response: 'To address insomnia, focus on supplements that calm the nervous system and support the natural production of melatonin, the sleep hormone.',
      keyNutrient: ['Melatonin', 'L-theanine', 'Magnesium', 'Valerian root', 'Apigenin']
    },
    {
      id: 1010,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Chronic Fatigue'] }],
      logic: 'OR',
      response: 'Combating chronic fatigue often requires supporting cellular energy production (mitochondria) and helping the body adapt to physical and mental stressors.',
      keyNutrient: ['Coenzyme Q10', 'NMN (nicotinamide mononucleotide)', 'Ginseng (Panax ginseng / Panax quinquefolius)', 'L-carnitine']
    },
    {
      id: 1011,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Brain Fog/Memory Issues'] }],
      logic: 'OR',
      response: 'For brain fog and memory, consider nootropics that enhance acetylcholine levels, support neuronal structure, and promote nerve growth factor.',
      keyNutrient: ['Lion\'s mane (Hericium erinaceus)', 'Bacopa monnieri', 'Alpha-GPC', 'Citicoline (CDP-choline)', 'Phosphatidylserine']
    },
    {
      id: 1012,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Hormonal Imbalance'] }],
      logic: 'OR',
      response: 'Adaptogenic herbs and key nutrients can help the body regulate hormonal pathways, supporting balance for both men and women. A full medical evaluation is recommended.',
      keyNutrient: ['Maca root', 'Ashwagandha', 'Zinc']
    },
    {
      id: 1013,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Cancer History/Support'] }],
      logic: 'OR',
      response: 'For individuals with a history of cancer, nutritional strategies must be highly personalized and supervised by an oncologist or a qualified healthcare provider. While certain antioxidants may offer general cellular support, no supplement should be taken without explicit medical approval. Focus on a nutrient-dense diet and professional guidance.',
      keyNutrient: ['Green tea extract']
    },
    {
      id: 1014,
      conditions: [{ field: 'healthConcerns', operator: 'contains', value: ['Rare Genetic Condition', 'Other'] }],
      logic: 'OR',
      response: 'Your health concern requires a highly specialized approach. We strongly recommend consulting with your healthcare professional or a specialist to create a safe and effective plan tailored to your unique needs. A foundational supplement plan can support general wellness but is not a substitute for targeted medical advice.',
      keyNutrient: ['Vitamin D', 'Magnesium', 'Omega-3 fatty acids']
    }
  ],
  "Genetic Profile": [
    {
        id: 1101,
        conditions: [
          { field: 'geneticVariants', operator: 'contains', value: ['MTHFR'] },
          { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'Your genetic profile indicates a pathogenic variant in the MTHFR gene. This can impair methylation, leading to elevated homocysteine. It is crucial to avoid synthetic folic acid and supplement directly with its active forms like L-5-MTHF.',
        keyNutrient: ['Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)', 'Vitamin B2 (Riboflavin)']
    },
    {
        id: 1102,
        conditions: [
          { field: 'geneticVariants', operator: 'contains', value: ['APOE'] },
          { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'Your genetic profile indicates a pathogenic variant in the APOE gene, which is associated with altered lipid metabolism and increased neurodegenerative risk. A proactive neuroprotective strategy is recommended, focusing on strict blood sugar control, a diet rich in omega-3s, and minimizing inflammation.',
        keyNutrient: ['Fish oil (DHA)', 'Phosphatidylserine', 'Curcumin', 'Resveratrol']
    },
    {
        id: 1103,
        conditions: [
          { field: 'geneticVariants', operator: 'contains', value: ['COMT'] },
          { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'Your genetic profile indicates a pathogenic variant related to the COMT enzyme, which can alter the breakdown of catecholamines like dopamine. This may affect your response to stress. Supporting this pathway with key cofactors like magnesium is often beneficial.',
        keyNutrient: ['Magnesium', 'Vitamin B2 (Riboflavin)', 'Vitamin B6 (Pyridoxine)', 'Vitamin B9 (Folate / Folic acid)', 'Vitamin B12 (Cobalamin)']
    },
    {
        id: 1104,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['FADS1'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'A pathogenic variant in the FADS1 gene can impair the conversion of plant-based omega-3s (ALA) to their more active forms (EPA and DHA). Direct supplementation with pre-formed EPA and DHA from fish or algal oil is recommended to ensure adequate levels for managing inflammation.',
        keyNutrient: ['Fish oil (EPA)', 'Fish oil (DHA)']
    },
    {
        id: 1105,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['CYP1A2'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'Your genetic profile suggests a pathogenic variant in CYP1A2, leading to "slow" caffeine metabolism. High caffeine intake may be associated with an increased risk of cardiovascular issues in slow metabolizers. Consider moderating your caffeine consumption.',
        keyNutrient: ['Green tea extract']
    },
    {
        id: 1106,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['GST'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'A pathogenic variant in a Glutathione S-transferase (GST) gene suggests a reduced capacity for Phase II detoxification. This can impair the body\'s ability to neutralize toxins and oxidative stress. Supporting glutathione production and intake of antioxidants is crucial.',
        keyNutrient: ['N-acetylcysteine (NAC)', 'Glutathione', 'Curcumin', 'Alpha-lipoic acid']
    },
    {
        id: 1107,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['VDR'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'You have a pathogenic variant in the Vitamin D Receptor (VDR) gene, which may affect how your body utilizes vitamin D. Ensuring optimal serum levels of Vitamin D through supplementation is particularly important for immune function and bone health.',
        keyNutrient: ['Vitamin D', 'Vitamin K2 (Menaquinones)']
    },
    {
        id: 1108,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['SOD2'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'Your genetic profile shows a pathogenic variant in SOD2, a key mitochondrial antioxidant enzyme. This can lead to increased oxidative stress within the cell\'s powerhouse. Supporting mitochondrial health with targeted antioxidants is recommended.',
        keyNutrient: ['Coenzyme Q10', 'Resveratrol', 'Manganese']
    },
    {
        id: 1109,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['TCF7L2'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'A pathogenic variant in the TCF7L2 gene is strongly associated with an increased risk for type 2 diabetes due to its role in glucose metabolism. A low-glycemic diet, regular exercise, and targeted nutritional support for insulin sensitivity are highly recommended.',
        keyNutrient: ['Berberine', 'Chromium (chromium picolinate)', 'Alpha-lipoic acid']
    },
    {
        id: 1110,
        conditions: [
            { field: 'geneticVariants', operator: 'contains', value: ['FTO'] },
            { field: 'geneticVariants', operator: 'contains', value: ['pathogenic'] }
        ],
        logic: 'AND',
        response: 'Your genetic profile indicates a pathogenic variant in the FTO gene, which is associated with an increased predisposition to obesity and a higher BMI. The influence of this gene can be effectively managed with a diet higher in protein, mindful eating practices, and consistent physical activity.',
        keyNutrient: ['Green tea extract', 'Conjugated linoleic acid (CLA)']
    },
    {
        id: 1198,
        conditions: [
            { field: 'geneticVariants', operator: 'notEquals', value: [''] },
            { field: 'geneticVariants', operator: 'notContains', value: ['MTHFR'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['APOE'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['COMT'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['FADS1'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['CYP1A2'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['GST'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['VDR'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['SOD2'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['TCF7L2'] },
            { field: 'geneticVariants', operator: 'notContains', value: ['FTO'] }
        ],
        logic: 'AND',
        response: 'The provided genetic data should be interpreted by a medical geneticist or a practitioner trained in functional genomics. Genetic variants (polymorphisms) offer valuable insights into predispositions related to nutrient metabolism, detoxification pathways, and disease risk. This information should be used to create a highly personalized health strategy, not as a standalone diagnostic tool. A specialized consultation is recommended.',
        keyNutrient: null
    },
     {
        id: 1199,
        conditions: [{ field: 'geneticVariants', operator: 'equals', value: [''] }],
        logic: 'AND',
        response: 'No specific genetic variants were entered for analysis. Genetic testing can offer valuable insights into predispositions related to nutrient metabolism, detoxification, and disease risk. This information, when available, allows for a more deeply personalized health strategy. If you have genetic data from services like 23andMe, Ancestry, or another Lab you can discuss with a practitioner how to interpret and apply it to your health plan.',
        keyNutrient: null
    }
  ]
});

