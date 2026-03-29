import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Import useRef
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, Copy, Search, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import RuleCondition from '@/components/RuleCondition';
// Removed: import { getDefaultRules } from '@/utils/defaultRules'; - No longer needed
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
// Import cache clearing function
import { clearRulesCache } from '@/utils/recommendationEngine';

const AdminRulesEditor = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Assuming admin status is checked via AuthContext/backend
  const { toast } = useToast();
  const [rulesByCategory, setRulesByCategory] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAccordionItems, setActiveAccordionItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isSaving, setIsSaving] =useState(false); // For save operations

  // --- NEW: Ref to hold the cache clearing timer ---
  const cacheClearTimerRef = useRef(null);
  const DELAY_MS = 60000; // 1 minute

  // --- NEW: Function to trigger a delayed cache clear ---
  // This will debounce multiple admin changes.
  const triggerDelayedCacheClear = () => {
    // 1. Clear any existing timer that hasn't fired yet
    if (cacheClearTimerRef.current) {
      clearTimeout(cacheClearTimerRef.current);
    }

    // 2. Set a new timer for 1 minute
    cacheClearTimerRef.current = setTimeout(() => {
      console.log(`[Admin Change] Clearing frontend rules cache after ${DELAY_MS}ms delay.`);
      clearRulesCache();
      // Optional: Notify admin that cache was cleared in background
      // toast({ title: "Cache Synced", description: "Frontend rules cache has been refreshed." });
    }, DELAY_MS); // 60000ms = 1 minute
  };

  // --- NEW: Cleanup timer on unmount ---
  useEffect(() => {
    // This runs when the component is unmounted
    return () => {
      if (cacheClearTimerRef.current) {
        clearTimeout(cacheClearTimerRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount


  // Function to fetch rules from the backend
  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use GET request to fetch all rules
      const response = await axios.get('/api/rules.php');
      // The backend should return rules already grouped by category
      setRulesByCategory(response.data || {});
       // We clear cache on fetch to ensure admin editor has latest data
       // This is separate from the *delayed* clear after a *save*
       clearRulesCache();
    } catch (error) {
      console.error("Failed to fetch rules:", error);
      toast({
        title: "Error Loading Rules",
        description: error.response?.data?.error || "Could not connect to the server to load rules.",
        variant: "destructive",
      });
      setRulesByCategory({}); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch rules on component mount
  useEffect(() => {
    // Simple check if user object exists, backend verifies admin role
    if (!user) {
        navigate('/admin/login'); // Redirect if not logged in
        return;
    }
    fetchRules();
  }, [fetchRules, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // --- CRUD Operations ---

  const handleAddRule = async (category) => {
    const newRuleTemplate = {
      // id will be assigned by DB
      category: category, // Pass category when creating
      conditions: [
        { field: 'age', operator: 'greaterThan', value: [0] } // Default condition
      ],
      logic: 'AND',
      response: '',
      keyNutrient: null, // Default
      is_active: true
    };

    try {
       // Use POST to create a new rule
      const response = await axios.post('/api/rules.php', newRuleTemplate);
      const addedRule = response.data; // Backend should return the created rule with its ID

      // Update local state
      setRulesByCategory(prev => {
        const updatedCategory = [...(prev[category] || []), addedRule];
        return { ...prev, [category]: updatedCategory };
      });
       triggerDelayedCacheClear(); // <-- Use delayed clear
      toast({ title: "Rule Added", description: `New rule added to ${category}.`});
    } catch (error) {
      console.error("Failed to add rule:", error);
      toast({
        title: "Error Adding Rule",
        description: error.response?.data?.error || "Could not save the new rule to the database.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateRule = async (category, ruleToDuplicate) => {
     // Create a new object excluding the id
     const { id, ...newRuleData } = ruleToDuplicate;
     newRuleData.category = category; // Ensure category is set

    try {
        // POST the duplicated data as a new rule
        const response = await axios.post('/api/rules.php', newRuleData);
        const addedRule = response.data;

        // Update local state by inserting the new rule after the original
        setRulesByCategory(prev => {
            const categoryRules = prev[category] || [];
            const index = categoryRules.findIndex(r => r.id === ruleToDuplicate.id);
            const newCategoryRules = [
                ...categoryRules.slice(0, index + 1),
                addedRule, // Insert the newly created rule from DB response
                ...categoryRules.slice(index + 1),
            ];
            return { ...prev, [category]: newCategoryRules };
        });
        triggerDelayedCacheClear(); // <-- Use delayed clear
        toast({ title: "Rule Duplicated", description: `Rule duplicated successfully in ${category}.`});
    } catch (error) {
        console.error("Failed to duplicate rule:", error);
        toast({
            title: "Error Duplicating Rule",
            description: error.response?.data?.error || "Could not save the duplicated rule.",
            variant: "destructive",
        });
    }
  };

  const handleDeleteRule = async (category, ruleId) => {
    // Optimistic UI update (optional but good UX)
    const originalRules = { ...rulesByCategory };
    setRulesByCategory(prev => ({
        ...prev,
        [category]: prev[category].filter(rule => rule.id !== ruleId)
    }));

    try {
      // Use DELETE request with rule ID in URL query parameter
      await axios.delete(`/api/rules.php?id=${ruleId}`);
      triggerDelayedCacheClear(); // <-- Use delayed clear
      toast({ title: "Rule Deleted", description: `Rule successfully deleted from ${category}.`});
    } catch (error) {
      console.error("Failed to delete rule:", error);
       // Rollback UI on error
       setRulesByCategory(originalRules);
      toast({
        title: "Error Deleting Rule",
        description: error.response?.data?.error || "Could not delete the rule from the database.",
        variant: "destructive",
      });
    }
  };

  // This handles local state changes for input fields, textareas, conditions etc.
  // The actual save to DB happens via handleSaveRule (triggered explicitly or implicitly).
  const handleRuleChange = (category, ruleId, field, value) => {
     setRulesByCategory(prev => ({
       ...prev,
       [category]: prev[category].map(rule =>
         rule.id === ruleId ? { ...rule, [field]: value } : rule
       )
     }));
     // Debounce or add a save button per rule? For simplicity, we use a global save button.
  };

  // Function to save a specific rule (e.g., triggered by a dedicated save button per rule, or implicitly)
  const handleSaveRule = async (category, ruleId) => {
      const ruleToSave = rulesByCategory[category]?.find(rule => rule.id === ruleId);
      if (!ruleToSave) return;

      setIsSaving(true); // Indicate saving specific rule
      try {
          // Use PUT request with rule ID in URL and data in body
          await axios.put(`/api/rules.php?id=${ruleId}`, ruleToSave);
          triggerDelayedCacheClear(); // <-- Use delayed clear
          toast({ title: "Rule Saved", description: `Changes to Rule #${ruleToSave.id} saved.` });
      } catch (error)
 {
          console.error("Failed to save rule:", error);
          toast({
              title: "Error Saving Rule",
              description: error.response?.data?.error || `Could not save changes for Rule #${ruleId}.`,
              variant: "destructive",
          });
          // Optionally refetch rules to revert changes on error
          // fetchRules();
      } finally {
          setIsSaving(false);
      }
  };


   // NOTE: Global Save is less common with DB persistence but kept if desired.
   // Consider removing if you add per-rule saving.
   /*
   const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      // This approach is complex: you'd need to compare current state with fetched state
      // and send multiple PUT/POST/DELETE requests.
      // Simpler to rely on per-rule saves or a dedicated "Publish Changes" button
      // that sends the entire rules object (backend would need logic to diff and update).
      // For now, let's assume per-rule saving or implicit saves are preferred.
      // This function might just become a placeholder or trigger individual saves.
      await Promise.all(
         Object.entries(rulesByCategory).flatMap(([cat, rules]) =>
             rules.map(rule => handleSaveRule(cat, rule.id)) // Example: Trigger save for all
         )
      );

      toast({
        title: "Success!",
        description: "All pending changes have been saved.",
      });
    } catch (error) {
      console.error("Failed to save all rules:", error);
      toast({
        title: "Error Saving All",
        description: "Some rules might not have saved correctly. Check console.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  */

  // Reset function might need to fetch defaults from a separate endpoint or be removed
  const handleReset = () => {
     // Option 1: Refetch from DB (reverts unsaved changes)
     fetchRules();
     toast({ title: "Reset", description: "Editor reset to last saved state." });

     // Option 2: Implement a backend endpoint to reset to hardcoded defaults (more complex)
     // alert("Reset to default functionality needs backend implementation.");

     // Option 3: Remove reset button if not desired with DB persistence.
  };

  // Filtering logic remains the same
  const filteredCategories = useMemo(() =>
    Object.keys(rulesByCategory).filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [rulesByCategory, searchTerm]);

  // Accordion expansion logic remains the same
  useEffect(() => {
    if (searchTerm) {
      setActiveAccordionItems(filteredCategories);
    } else {
        // Keep accordion items open if they were manually opened
        // setActiveAccordionItems([]); // Uncomment this to collapse all on search clear
    }
  }, [searchTerm, filteredCategories]);


  return (
    <>
      <Helmet>
        <title>Rules Editor - NutraGenius Admin</title>
        <meta name="description" content="Configure and customize recommendation rules for the nutrigenomic analysis platform" />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4">
         {/* Admin Header */}
        <header className="fixed top-0 left-0 right-0 z-10 bg-card/80 backdrop-blur-sm no-print shadow-sm">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold">Admin: Rules Editor</h1>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin')} size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Admin Dashboard</Button>
                    <Button variant="ghost" onClick={handleLogout} size="sm"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
                    <ThemeToggle />
                </div>
            </div>
        </header>

        <div className="max-w-6xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-2xl p-8 border-2 gold-border"
          >
            {/* Top Action Bar */}
            <div className="flex justify-between items-center mb-6 border-b-2 gold-border pb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-1">Recommendation Rules</h1>
                <p className="text-muted-foreground">Manage rules fetched from the database.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                 {/* Replaced global Save with Refresh */}
                 <Button
                  variant="outline"
                  onClick={fetchRules}
                  disabled={isLoading}
                  className="border-primary text-primary"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Rules
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-destructive text-destructive"
                   title="Revert unsaved changes by refetching from DB"
                >
                  Reset Changes
                </Button>

              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>

             {/* Loading Indicator */}
             {isLoading && (
                 <div className="text-center py-12">
                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                     <p className="mt-2 text-muted-foreground">Loading rules from database...</p>
                 </div>
             )}

            {/* Rules Accordion */}
            {!isLoading && (
                <Accordion
                type="multiple"
                className="w-full space-y-4"
                value={activeAccordionItems}
                onValueChange={setActiveAccordionItems}
                >
                {filteredCategories.length > 0 ? filteredCategories.map(category => (
                    <AccordionItem value={category} key={category} className="bg-muted/30 rounded-lg border-border border">
                    <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                        {category}
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                        <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
                        {rulesByCategory[category] && rulesByCategory[category].map((rule, ruleIndex) => (
                            <motion.div
                            key={rule.id} // Use database ID as key
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-background rounded-lg p-6 border border-border"
                            >
                             {/* Rule Header with ID and actions */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-md font-semibold text-muted-foreground">Rule ID: {rule.id}</h3>
                                <div className="flex items-center gap-1">
                                 {/* Save Button Per Rule */}
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleSaveRule(category, rule.id)}
                                      disabled={isSaving}
                                      className="h-8 w-8 text-primary hover:text-primary"
                                      title="Save this rule"
                                  >
                                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDuplicateRule(category, rule)}
                                    className="h-8 w-8"
                                     title="Duplicate this rule"
                                  >
                                    <Copy className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRule(category, rule.id)}
                                    className="text-destructive hover:text-destructive h-8 w-8"
                                     title="Delete this rule"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                            </div>

                             {/* Rule Conditions */}
                            <div className="space-y-4">
                                <div>
                                <Label>Conditions</Label>
                                <div className="mt-2 p-4 border rounded-md space-y-4 bg-muted/20">
                                    {rule.conditions && rule.conditions.map((cond, condIndex) => (
                                    <RuleCondition
                                        key={condIndex} // Consider a more stable key if conditions can be reordered
                                        condition={cond}
                                        onChange={(newCond) => {
                                        const newConditions = [...rule.conditions];
                                        newConditions[condIndex] = newCond;
                                        handleRuleChange(category, rule.id, 'conditions', newConditions);
                                        }}
                                        onDelete={() => {
                                        const newConditions = rule.conditions.filter((_, i) => i !== condIndex);
                                        handleRuleChange(category, rule.id, 'conditions', newConditions);
                                        }}
                                    />
                                    ))}
                                    <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Ensure conditions is an array before spreading
                                        const currentConditions = Array.isArray(rule.conditions) ? rule.conditions : [];
                                        const newConditions = [...currentConditions, { field: 'age', operator: 'greaterThan', value: [0] }];
                                        handleRuleChange(category, rule.id, 'conditions', newConditions);
                                    }}
                                    >
                                    <Plus className="mr-2 h-4 w-4" /> AND
                                    </Button>
                                </div>
                                </div>

                                 {/* Rule Logic (AND/OR) - Optional Simplification */}
                                 {/* If always AND, you might hide this */}
                                 {/*
                                 <div>
                                     <Label>Logic</Label>
                                     <Select value={rule.logic} onValueChange={(value) => handleRuleChange(category, rule.id, 'logic', value)}>
                                        <SelectTrigger className="w-[100px] mt-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AND">AND</SelectItem>
                                            <SelectItem value="OR">OR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                 </div>
                                 */}

                                 {/* Rule Response */}
                                <div>
                                <Label htmlFor={`response-${rule.id}`}>Response (HTML allowed)</Label>
                                <Textarea
                                    id={`response-${rule.id}`}
                                    value={rule.response || ''}
                                    onChange={(e) => handleRuleChange(category, rule.id, 'response', e.target.value)}
                                    placeholder="Enter the recommendation text (HTML tags like <p>, <strong>, <ul>, <li> are supported)..."
                                    className="mt-2 font-mono" // Font choice for better HTML editing
                                    rows={6}
                                />
                                </div>

                                 {/* Key Nutrients */}
                                <div>
                                    <Label htmlFor={`keyNutrient-${rule.id}`}>Key Nutrients (JSON Array or String)</Label>
                                    <Input
                                        id={`keyNutrient-${rule.id}`}
                                        value={
                                            // Handle null/undefined, array, or string for display
                                            rule.keyNutrient === null || rule.keyNutrient === undefined ? '' :
                                            Array.isArray(rule.keyNutrient) ? JSON.stringify(rule.keyNutrient) :
                                            String(rule.keyNutrient)
                                         }
                                         onChange={(e) => {
                                            let newValue = e.target.value;
                                            try {
                                                // Try parsing as JSON array/string
                                                newValue = JSON.parse(newValue);
                                            } catch (err) {
                                                 // If parsing fails, treat as a single string (or keep as is if empty)
                                                 newValue = newValue.trim() === '' ? null : newValue.trim();
                                             }
                                            handleRuleChange(category, rule.id, 'keyNutrient', newValue);
                                         }}
                                        placeholder='e.g., ["Vitamin D", "Magnesium"] or "Iron"'
                                        className="mt-2 font-mono"
                                    />
                                     <p className="text-xs text-muted-foreground mt-1">Enter as a valid JSON array like ["Nutrient1", "Nutrient2"] or a single nutrient name like "Vitamin C". Leave blank for none.</p>
                                </div>

                            </div>
                            </motion.div>
                        ))}
                         {/* Add New Rule Button */}
                        <div className="mt-6">
                            <Button
                            onClick={() => handleAddRule(category)}
                            className="gold-bg"
                            >
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Rule to {category}
                            </Button>
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                )) : (
                     <div className="text-center py-12 text-muted-foreground">
                        <p>No categories match your search, or no rules found in the database.</p>
                     </div>
                )}
                </Accordion>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminRulesEditor;
