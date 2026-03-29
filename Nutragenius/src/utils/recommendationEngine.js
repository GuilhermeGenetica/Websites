// /src/utils/recommendationEngine.js
// Updated to fetch rules from the backend API

import axios from 'axios';

// --- Cache for rules ---
let cachedRules = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // Cache rules for 5 minutes

/**
 * Fetches rules from the API, using a cache to avoid redundant requests.
 * @returns {Promise<Object>} A promise that resolves to the rules object grouped by category.
 */
const fetchRules = async () => {
    const now = Date.now();
    if (cachedRules && (now - lastFetchTime < CACHE_DURATION)) {
        console.log("Using cached rules");
        return cachedRules;
    }

    console.log("Fetching rules from API...");
    try {
        const response = await axios.get('/api/rules.php'); // Assumes API endpoint exists
        if (response.data && typeof response.data === 'object') {
            cachedRules = response.data;
            lastFetchTime = now;
            console.log("Rules fetched and cached successfully.");
            return cachedRules;
        } else {
            console.error("Invalid data structure received from rules API:", response.data);
            // Fallback to empty rules if API response is invalid, prevent using old cache
            cachedRules = {};
            lastFetchTime = 0; // Invalidate cache time
            return {};
        }
    } catch (error) {
        console.error("Error fetching rules from API:", error);
        // If fetch fails, return the last known cached rules (if any) or empty object
        // This prevents the app from breaking completely if the API is temporarily down
        return cachedRules || {};
    }
};

/**
 * Generates recommendations based on user data and rules fetched from the API.
 * @param {Object} data - The user's questionnaire data.
 * @returns {Promise<Object>} A promise that resolves to an object containing { recommendations: Array, keyNutrients: Array }.
 */
export const generateRecommendations = async (data) => {
  // Fetch the latest rules (uses cache)
  const rulesByCategory = await fetchRules();

  if (Object.keys(rulesByCategory).length === 0) {
      console.warn("No rules loaded, cannot generate recommendations.");
      return { recommendations: [], keyNutrients: [] }; // Return empty results if no rules
  }

  const recommendations = [];
  const appliedRuleIds = new Set();
  const uniqueKeyNutrients = new Set(); // Use a Set to avoid duplicate nutrients

  // Create a mutable copy of data to add calculated fields like BMI
  const formData = { ...data };

  // Calculate BMI and add it to the data object for the engine to use
  if (data && data.height && data.weight) {
    const heightM = parseFloat(data.height) / 100;
    const weightKg = parseFloat(data.weight);
    if (heightM > 0 && weightKg > 0) {
      formData.bmi = (weightKg / (heightM * heightM)).toFixed(1);
    }
  }

  // --- Condition Checking Logic (remains the same) ---
  const checkCondition = (condition, currentFormData) => {
    const { field, operator, value } = condition;
    const formValue = currentFormData[field];

    if ((formValue === null || formValue === undefined) && operator !== 'equals' && operator !== 'notEquals') {
        // Allow equals/notEquals checks even for null/undefined, e.g., geneticVariants equals ''
        if (operator === 'equals' && (value[0] === null || value[0] === undefined || value[0] === '')) {
             return formValue === null || formValue === undefined || formValue === '';
        }
        if (operator === 'notEquals' && (value[0] === null || value[0] === undefined || value[0] === '')) {
             return !(formValue === null || formValue === undefined || formValue === '');
        }
        // Otherwise, if the field doesn't exist for other operators, the condition is false.
        return false;
    }

    const val1 = value[0];
    const val2 = value.length > 1 ? value[1] : null; // Handle single value arrays for non-between operators

    // Ensure numeric comparisons are done with numbers
    const numFormValue = parseFloat(formValue);
    const numVal1 = parseFloat(val1);
    const numVal2 = val2 !== null ? parseFloat(val2) : null;

    switch (operator) {
      case 'equals':
          // Handle empty string comparison correctly
          const formString = (formValue === null || formValue === undefined) ? '' : String(formValue);
          const val1String = (val1 === null || val1 === undefined) ? '' : String(val1);
          return formString.toLowerCase() === val1String.toLowerCase();
      case 'notEquals':
          const formStringNE = (formValue === null || formValue === undefined) ? '' : String(formValue);
          const val1StringNE = (val1 === null || val1 === undefined) ? '' : String(val1);
          return formStringNE.toLowerCase() !== val1StringNE.toLowerCase();
      case 'greaterThan':
        return !isNaN(numFormValue) && !isNaN(numVal1) && numFormValue > numVal1;
      case 'lessThan':
        return !isNaN(numFormValue) && !isNaN(numVal1) && numFormValue < numVal1;
      case 'greaterThanOrEqual':
        return !isNaN(numFormValue) && !isNaN(numVal1) && numFormValue >= numVal1;
      case 'lessThanOrEqual':
        return !isNaN(numFormValue) && !isNaN(numVal1) && numFormValue <= numVal1;
      case 'between':
        return !isNaN(numFormValue) && !isNaN(numVal1) && !isNaN(numVal2) && numFormValue >= numVal1 && numFormValue <= numVal2;
      case 'contains':
          // Handles text fields, array fields (like healthGoals), and checks against null/undefined
          const formStringContains = (formValue === null || formValue === undefined) ? '' : String(formValue);
          const val1StringContains = (val1 === null || val1 === undefined) ? '' : String(val1);
          if (Array.isArray(formValue)) {
              return formValue.map(v => String(v).toLowerCase()).includes(val1StringContains.toLowerCase());
          }
          return formStringContains.toLowerCase().includes(val1StringContains.toLowerCase());
      case 'notContains':
          const formStringNotContains = (formValue === null || formValue === undefined) ? '' : String(formValue);
          const val1StringNotContains = (val1 === null || val1 === undefined) ? '' : String(val1);
          if (Array.isArray(formValue)) {
              return !formValue.map(v => String(v).toLowerCase()).includes(val1StringNotContains.toLowerCase());
          }
           return !formStringNotContains.toLowerCase().includes(val1StringNotContains.toLowerCase());
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  };

  // --- Rule Evaluation Logic (remains the same) ---
  const evaluateRule = (rule, currentFormData) => {
    // Rules fetched from DB should already have 'conditions' as an array
    if (!rule.conditions || rule.conditions.length === 0) {
      return false; // A rule must have conditions
    }
    if (rule.logic === 'AND') {
      return rule.conditions.every(cond => checkCondition(cond, currentFormData));
    }
    // Default to OR logic if not specified or invalid
    return rule.conditions.some(cond => checkCondition(cond, currentFormData));
  };

  // --- Iterate through fetched rules ---
  for (const category in rulesByCategory) {
    // Ensure the category contains an array of rules
    if (Array.isArray(rulesByCategory[category])) {
      for (const rule of rulesByCategory[category]) {
         // Rule structure from DB: id, category, conditions (array), logic, response, keyNutrient (array/string/null)
        if (rule.is_active !== false && !appliedRuleIds.has(rule.id) && evaluateRule(rule, formData)) {
          // Add text recommendation
          recommendations.push({
            category: category,
            recommendation: rule.response
          });
          appliedRuleIds.add(rule.id);

          // Add key nutrient(s) to the set
          if (rule.keyNutrient) {
            if (Array.isArray(rule.keyNutrient)) {
              rule.keyNutrient.forEach(nutrient => {
                  if (nutrient && typeof nutrient === 'string') { // Basic check
                      uniqueKeyNutrients.add(nutrient.trim());
                  }
              });
            } else if (typeof rule.keyNutrient === 'string') {
                uniqueKeyNutrients.add(rule.keyNutrient.trim());
            }
          }
        }
      }
    } else {
        console.warn(`Expected an array of rules for category "${category}", but got:`, rulesByCategory[category]);
    }
  }

  // Return an object containing both the text recommendations and the unique key nutrients
  return {
    recommendations,
    keyNutrients: Array.from(uniqueKeyNutrients) // Convert Set back to Array
  };
};

// Optional: Function to clear the cache if needed (e.g., after admin saves changes)
export const clearRulesCache = () => {
    cachedRules = null;
    lastFetchTime = 0;
    console.log("Rules cache cleared.");
};
