import React, { useState, useEffect, forwardRef, useRef } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2, ServerCrash, X, ChevronLeft, ChevronRight, Stethoscope, Globe, Languages } from 'lucide-react';
import DoctorResultCard from './DoctorResultCard';

// Componente para um campo de seleção com um botão de limpar
const ClearableSelect = ({ value, onValueChange, onClear, placeholder, icon: Icon, items, itemKey, itemValue, itemName }) => (
  <div className="relative">
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 text-base pr-10">
        <div className="flex items-center truncate">
          <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">{value ? items.find(i => String(i[itemKey]) === value)?.[itemName] : placeholder}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {items.map(item => (
          <SelectItem key={item[itemKey]} value={String(item[itemValue])}>
            {item[itemName]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {value && (
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
        onClick={onClear}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
);

// --- MODIFICATION START ---
// Define quantos médicos mostrar por página (grelha). 
// 8 = 2 linhas de 4 colunas em ecrãs grandes.
const ITEMS_PER_PAGE = 8;
// --- MODIFICATION END ---

const SearchSection = forwardRef(({ onBookNowClick }, ref) => {
  const { toast } = useToast();
  const { API_BASE_URL } = useAuth();

  const [specialty, setSpecialty] = useState('');
  const [countryId, setCountryId] = useState('');
  const [languageId, setLanguageId] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [specialties, setSpecialties] = useState([]);
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  
  // Estado para o carrossel
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/landing_page_search.php?action=get_filters`);
        const data = await response.json();
        if (data.success) {
          setSpecialties(data.filters.specialties);
          setCountries(data.filters.countries);
          setLanguages(data.filters.languages);
        } else {
          throw new Error(data.message || 'Could not load search filters.');
        }
      } catch (err) {
        toast({
          title: "Data Loading Error",
          description: `Could not connect to the server to load filters.`,
          variant: "destructive"
        });
      }
    };
    fetchFilters();
  }, [API_BASE_URL, toast]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setDoctors([]);
    setCurrentPage(0);

    try {
      const queryParams = new URLSearchParams({ action: 'search_doctors' });
      if (specialty) queryParams.append('specialty', specialty);
      if (countryId) queryParams.append('country_id', countryId);
      if (languageId) queryParams.append('language_id', languageId);

      const url = `${API_BASE_URL}/landing_page_search.php?${queryParams.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        setDoctors(data.doctors);
        if (data.doctors.length === 0) {
          toast({ title: "No Results", description: "Your search did not match any doctors. Try different criteria." });
        }
      } else {
        throw new Error(data.message || "An error occurred while searching.");
      }
    } catch (err) {
      setError(err.message);
      toast({ title: "Search Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSpecialty('');
    setCountryId('');
    setLanguageId('');
    setDoctors([]);
    setHasSearched(false);
    setCurrentPage(0);
  };

  // --- MODIFICATION START ---
  // A lógica do carrossel agora baseia-se no ITEMS_PER_PAGE (8)
  const totalPages = Math.ceil(doctors.length / ITEMS_PER_PAGE);

  // Agrupa os médicos em "páginas" (grelhas)
  const paginatedDoctors = Array.from({ length: totalPages }, (_, pageIndex) => {
    return doctors.slice(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE);
  });
  // --- MODIFICATION END ---


  const scrollToPage = (pageIndex) => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: pageIndex * containerWidth,
        behavior: 'smooth',
      });
      setCurrentPage(pageIndex);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, offsetWidth } = scrollRef.current;
      const newPage = Math.round(scrollLeft / offsetWidth);
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    }
  };

  return (
    <section id="search" ref={ref} className="py-20 md:py-28 bg-background section-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card p-6 md:p-8 rounded-2xl shadow-2xl border">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-foreground"> Find the Right Specialist for You</h2>
            <p className="text-center text-muted-foreground mb-8">🔍 Search by specialty, country of practice, and language.</p>
            
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <ClearableSelect value={specialty} onValueChange={setSpecialty} onClear={() => setSpecialty('')} placeholder="Specialty" icon={Stethoscope} items={specialties} itemKey="id" itemValue="specialty_name" itemName="specialty_name" />
                <ClearableSelect value={countryId} onValueChange={setCountryId} onClear={() => setCountryId('')} placeholder="Country" icon={Globe} items={countries} itemKey="country_id" itemValue="country_id" itemName="name" />
                <ClearableSelect value={languageId} onValueChange={setLanguageId} onClear={() => setLanguageId('')} placeholder="Language" icon={Languages} items={languages} itemKey="id" itemValue="id" itemName="name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                 <Button type="button" size="lg" variant="outline" className="w-full h-12 text-base" onClick={handleClearFilters} disabled={!specialty && !countryId && !languageId}>
                    Clear Filters
                 </Button>
                 <Button type="submit" size="lg" className="w-full h-12 text-base bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Search className="h-5 w-5 mr-2" /><span>Search</span></>}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        <div className="mt-12">
          {loading && (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">Finding specialists...</p></div>
          )}
          {error && (
            <div className="text-center py-10 text-destructive bg-destructive/10 rounded-lg"><ServerCrash className="h-10 w-10 mx-auto mb-4" /><p className="font-semibold">Something went wrong.</p><p className="text-sm">{error}</p></div>
          )}
          {!loading && !error && hasSearched && doctors.length === 0 && (
            <div className="text-center py-10"><p className="font-semibold text-lg">No Doctors Found</p><p className="text-muted-foreground">Please try adjusting your search filters.</p></div>
          )}
          
          {/* --- MODIFICATION START --- */}
          {/* O container do carrossel agora renderiza as "páginas" (grelhas) */}
          {!loading && doctors.length > 0 && (
            <div className="relative">
              <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-4 px-4">
                
                {paginatedDoctors.map((pageDoctors, pageIndex) => (
                  <div key={pageIndex} className="flex-shrink-0 w-full snap-center p-3">
                    {/* Esta é a grelha que você pediu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {pageDoctors.map((doctor) => (
                        <DoctorResultCard
                          key={doctor.doctor_id}
                          doctor={doctor}
                          onBookNowClick={onBookNowClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                
              </div>
              {/* --- MODIFICATION END --- */}

              {totalPages > 1 && (
                <>
                  <Button variant="outline" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full hidden md:flex" onClick={() => scrollToPage(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft /></Button>
                  <Button variant="outline" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full hidden md:flex" onClick={() => scrollToPage(currentPage + 1)} disabled={currentPage === totalPages - 1}><ChevronRight /></Button>
                  <div className="flex justify-center gap-2 mt-6">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i} onClick={() => scrollToPage(i)} className={`h-2 w-2 rounded-full transition-all ${currentPage === i ? 'w-4 bg-primary' : 'bg-muted-foreground/50'}`}></button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default SearchSection;