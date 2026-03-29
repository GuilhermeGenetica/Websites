// /src/pages/SharedReportPage.jsx

import React, { useState, useEffect, useCallback } from 'react'; 
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldOff, Dna, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateRecommendations } from '@/utils/recommendationEngine'; 
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';


const ReportView = ({ reportData, recommendations }) => {
    const calculateBMI = (data) => {
        if (data && data.height && data.weight) {
            const heightM = parseFloat(data.height) / 100;
            const weightKg = parseFloat(data.weight);
            if (heightM > 0 && weightKg > 0) {
                return (weightKg / (heightM * heightM)).toFixed(1);
            }
        }
        return null;
    };
    const bmi = calculateBMI(reportData);

    const groupedRecommendations = (recommendations || []).reduce((acc, rec) => { // Add guard for recommendations
        const category = rec.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(rec.recommendation);
        return acc;
    }, {});

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white text-black p-8 sm:p-12 rounded-lg shadow-2xl font-serif max-w-5xl mx-auto print:shadow-none print:p-0 print:bg-transparent"
        >
            {/* Report Header */}
            <header className="text-center mb-12 border-b-4 border-blue-900 pb-6 print:mb-8 print:pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2 tracking-wide print:text-3xl">
                NUTRIGENOMIC ANALYSIS REPORT
              </h1>
              <p className="text-lg text-gray-600 print:text-base">
                Personalized Dietary & Nutritional Recommendations
              </p>
               <p className="text-sm text-gray-500 mt-2 print:text-xs">
                Report Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </header>

            {/* Patient Information Section */}
            <section className="mb-10 print:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 border-b-2 border-blue-900 pb-2 print:text-xl print:mb-3">
                PATIENT INFORMATION
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-base print:text-sm">
                <p><strong>Patient Name:</strong> {reportData.fullName || 'N/A'}</p>
                <p><strong>Age:</strong> {reportData.age ? `${reportData.age} years` : 'N/A'}</p>
                <p><strong>Gender:</strong> {reportData.gender === 'Other' ? reportData.genderOther : reportData.gender || 'N/A'}</p>
                {bmi && <p><strong>Body Mass Index (BMI):</strong> {bmi} kg/m²</p>}
              </div>
            </section>

             {/* Page Break for Printing */}
            <div className="print-page-break" style={{ pageBreakAfter: 'always' }}></div>

            {/* Recommendations Section */}
            <section className="mb-10 print:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-6 border-b-2 border-blue-900 pb-2 print:text-xl print:mb-4">
                CLINICAL INTERPRETATION & RECOMMENDATIONS
              </h2>
              {/* Check if recommendations exist and have content */}
              {recommendations && recommendations.length > 0 && Object.keys(groupedRecommendations).length > 0 ? (
                <div className="space-y-8 print:space-y-6">
                  {Object.entries(groupedRecommendations).map(([category, recs], index) => (
                    <div key={index}>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 print:text-lg print:mb-1">{category}</h3>
                      <div className="space-y-4 print:space-y-3">
                        {recs.map((rec, recIndex) => (
                           <div
                             key={recIndex}
                             className="text-base leading-relaxed border-l-4 border-blue-200 pl-4 report-recommendation-shared print:text-sm print:pl-3"
                             dangerouslySetInnerHTML={{ __html: rec }}
                            />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div
                    className="text-base leading-relaxed report-recommendation-shared print:text-sm"
                    dangerouslySetInnerHTML={{ __html: "<p>No specific recommendations were generated based on the provided data.</p>"}}
                 />
              )}
            </section>

            {/* Report Footer */}
            <footer className="mt-16 pt-8 border-t-2 border-gray-300 text-xs text-gray-600 print:mt-12 print:pt-6 print:text-[10px]">
                <p>This report is for informational purposes only and does not constitute medical advice. Consult with a qualified healthcare professional before making any changes to your health regimen.</p>
                <p className="mt-2">Generated by NutraGenius Platform.</p>
            </footer>
            {/* Global Styles remain the same */}
            <style jsx global>{`
                .report-recommendation-shared p { margin-bottom: 0.75rem; }
                .report-recommendation-shared strong { font-weight: 600; }
                .report-recommendation-shared ul { list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.75rem; }
                .report-recommendation-shared li { margin-bottom: 0.25rem; }
                @media print {
                    .report-recommendation-shared p { margin-bottom: 0.5rem; }
                    .report-recommendation-shared ul { margin-top: 0.25rem; margin-bottom: 0.5rem; margin-left: 1.25rem;}
                    .report-recommendation-shared li { margin-bottom: 0.15rem; }
                    .no-print { display: none; }
                    .print-page-break { page-break-after: always; }
                     body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </motion.div>
    );
};


const SharedReportPage = () => {
  const { token } = useParams();
  const { toast } = useToast();

  const [reportData, setReportData] = useState(null);
  const [recommendations, setRecommendations] = useState([]); // State for text recommendations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Make fetchSharedReport async
  const fetchSharedReport = useCallback(async () => {
    if (!token) {
      setError("No share token provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations([]); // Reset recommendations
    try {
      const response = await axios.post('/api/get_shared_report.php', { token });

      if (response.data) {
        const fetchedData = response.data;
        // Ensure array fields exist
        fetchedData.healthGoals = Array.isArray(fetchedData.healthGoals) ? fetchedData.healthGoals : [];
        fetchedData.healthConcerns = Array.isArray(fetchedData.healthConcerns) ? fetchedData.healthConcerns : [];
        setReportData(fetchedData);

        // *** ASYNC CALL: Await generateRecommendations ***
        const { recommendations: recs } = await generateRecommendations(fetchedData);
        setRecommendations(recs || []); // Update state after await

      } else {
        throw new Error("Received empty data from server for the share token.");
      }
    } catch (err) {
      console.error("Error fetching shared report or generating recommendations:", err); // Log error
      const errorMessage = err.response?.data?.error || "Could not load the report. It may be invalid, expired, or recommendations could not be generated.";
      setError(errorMessage);
      toast({
        title: 'Error Loading Report',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]); // Dependency array includes token and toast

  useEffect(() => {
    fetchSharedReport();
  }, [fetchSharedReport]); // Use the memoized fetch function

  // Handlers remain the same
  const handlePrint = () => { window.print(); };
  const handleClose = () => { window.close(); };

  // --- RENDER LOGIC ---
  return (
    <>
      <Helmet>
        <title>{loading ? 'Loading Report' : reportData ? `Shared Report for ${reportData.fullName}` : 'Invalid Report'} - NutraGenius</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground py-8 px-4 relative print:py-0 print:px-0">
        {/* Action Buttons */}
        {!loading && reportData && (
            <div className="fixed top-4 right-4 z-50 flex gap-2 no-print">
                <Button variant="outline" size="icon" onClick={handlePrint} title="Print Report">
                    <Printer className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleClose} title="Close Window">
                    <X className="h-5 w-5" />
                </Button>
            </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg">Loading Secure Report...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && ( // Only show error if not loading
          <div className="flex flex-col justify-center items-center h-screen text-center">
            <ShieldOff className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied or Error</h1>
            <p className="text-muted-foreground max-w-md mb-6">{error}</p>
            <Link to="/">
              <Button className="gold-bg flex items-center gap-2">
                <Dna className="h-4 w-4"/>
                <span>Return to NutraGenius Home</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Report View - Render only if loaded, no error, and data exists */}
        {!loading && !error && reportData && (
          // Pass the recommendations state to the view
          <ReportView reportData={reportData} recommendations={recommendations} />
        )}
      </div>
    </>
  );
};

export default SharedReportPage;
