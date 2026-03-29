import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, AlertTriangle, Heart, Filter, Loader2, ServerCrash, User, XCircle, 
  Mail, Phone, Users, Link as LinkIcon, Home, Globe, ClipboardList 
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const createIcon = (type) => {
  const color = type === 'help' ? '#f97316' : '#10b981'; 
  const iconHtml = `<div style="background-color: ${color}; width: 2.25rem; height: 2.25rem; display: flex; justify-content: center; align-items: center; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); font-size: 1.25rem;">${type === 'help' ? '🚨' : '❤️'}</div>`;
  
  return new L.DivIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const MapPage = () => {
  const { getActiveRecords, loading, error } = useData();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState('all');
  const [recordsWithCoords, setRecordsWithCoords] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapCenter, setMapCenter] = useState([39.5, -8.0]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const geocodeCache = useMemo(() => new Map(), []);

  const geocodeRecords = useCallback(async (recordsToGeocode) => {
    setIsGeocoding(true);
    let failedGeocodes = 0;

    const promises = recordsToGeocode.map(async (record) => {
      const addressPart = record.location || record.address || '';
      const postalPart = record.postalCode || '';
      const query = `${addressPart} ${postalPart}, Portugal`.trim().replace(/,$/, '');

      if (!query || query === 'Portugal') return { ...record, coordinates: null };

      if (geocodeCache.has(query)) {
        return { ...record, coordinates: geocodeCache.get(query) };
      }

      try {
        const searchParams = new URLSearchParams({ q: query, countrycodes: 'PT', format: 'json', limit: 1 });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data && data.length > 0) {
          const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          geocodeCache.set(query, coords);
          return { ...record, coordinates: coords };
        } else {
          failedGeocodes++;
        }
      } catch (err) {
        console.error("Geocoding error for query:", query, err);
        failedGeocodes++;
      }
      
      geocodeCache.set(query, null);
      return { ...record, coordinates: null };
    });

    const results = await Promise.all(promises);
    setRecordsWithCoords(results.filter(r => r.coordinates));
    setIsGeocoding(false);

    if (failedGeocodes > 0) {
      toast({
        title: "Aviso de Geolocalização",
        description: `${failedGeocodes} registo(s) não puderam ser localizados e não estão visíveis no mapa.`,
        variant: "destructive"
      });
    }
  }, [geocodeCache, toast]);

  useEffect(() => {
    const activeRecords = getActiveRecords();
    if (!loading && !error && activeRecords.length > 0) {
      geocodeRecords(activeRecords);
    }
  }, [getActiveRecords, loading, error, geocodeRecords]);

  const filteredRecords = recordsWithCoords.filter(record => {
    if (filter === 'all') return true;
    return record.type === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPhasesList = (phases) => {
    if (!phases) return [];
    return [
      ...(phases.shortTerm || []).map(p => ({ phase: 'Curto Prazo', label: p })),
      ...(phases.mediumTerm || []).map(p => ({ phase: 'Médio Prazo', label: p })),
      ...(phases.longTerm || []).map(p => ({ phase: 'Longo Prazo', label: p }))
    ];
  };

  const DetailItem = ({ icon: Icon, label, value, isLink = false }) => (
    value ? (
      <div>
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 mt-1 text-blue-500 hover:underline">
            <Icon className="w-4 h-4" />
            <span className="font-semibold truncate">{value}</span>
          </a>
        ) : (
          <div className="flex items-center space-x-2 mt-1">
            <Icon className="w-4 h-4 text-primary" />
            <p className="font-semibold text-foreground">{value}</p>
          </div>
        )}
      </div>
    ) : null
  );

  const renderMapContent = () => {
    if (loading || isGeocoding) {
      return (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-[1000]">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-lg font-semibold text-foreground">{loading ? 'A carregar dados...' : 'A processar localizações...'}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="absolute inset-0 bg-destructive/10 flex flex-col items-center justify-center z-[1000]">
          <ServerCrash className="w-12 h-12 text-destructive mb-4" />
          <p className="text-lg font-semibold text-destructive">{error}</p>
        </div>
      );
    }

    return filteredRecords.map((record) => (
      <Marker key={record.id} position={[record.coordinates.lat, record.coordinates.lng]} icon={createIcon(record.type)}>
        <Popup>
          <div className="p-1 w-64">
            <h3 className="font-bold text-md mb-2 flex items-center">
              {record.type === 'help' ? <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> : <Heart className="w-4 h-4 mr-2 text-green-500" />}
              {record.name}
            </h3>
            <p className="text-sm text-muted-foreground flex items-start mb-1">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" /> <span>{record.location || record.address}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-3 ml-6">Cód. Postal: {record.postalCode || 'N/A'}</p>
            <p className="text-sm line-clamp-3">{record.description}</p>
            <Button size="sm" className="w-full mt-3" onClick={() => setSelectedRecord(record)}>
              Ver Detalhes
            </Button>
          </div>
        </Popup>
      </Marker>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Mapa de Ajuda - Projeto Fénix</title>
        <meta name="description" content="Visualize no mapa a localização de pedidos e ofertas de ajuda em Portugal." />
      </Helmet>

      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-background shadow-sm z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Mapa de Ajuda</h1>
                <p className="text-muted-foreground text-sm">Visualize pedidos e ofertas de ajuda por localização</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Pedidos: {getActiveRecords().filter(r => r.type === 'help').length}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Heart className="w-5 h-5 text-green-500" />
                  <span>Ofertas: {getActiveRecords().filter(r => r.type === 'offer').length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="help">🚨 Pedidos</SelectItem>
                      <SelectItem value="offer">❤️ Ofertas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex-1 relative">
          <MapContainer center={mapCenter} zoom={7} scrollWheelZoom={true} className="leaflet-container">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {renderMapContent()}
          </MapContainer>
        </div>
      </div>

      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[1200] backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border dark:border-gray-700">
              <div className="flex justify-between items-start mb-6 pb-4 border-b dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedRecord.type === 'help' ? 'Pedido de Ajuda' : 'Oferta de Ajuda'}</h2>
                  <p className="text-muted-foreground text-sm">Publicado em {formatDate(selectedRecord.createdAt)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedRecord(null)} className="rounded-full"><XCircle className="w-5 h-5" /></Button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={User} label="Nome" value={selectedRecord.name} />
                  {selectedRecord.type === 'help' && <DetailItem icon={Users} label="Nº de Pessoas" value={selectedRecord.people} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Phone} label="Contacto Telefónico" value={selectedRecord.phone} />
                  <DetailItem icon={Mail} label="Email" value={selectedRecord.email} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Home} label="Localidade/Freguesia" value={selectedRecord.location || selectedRecord.address} />
                  <DetailItem icon={MapPin} label="Código Postal" value={selectedRecord.postalCode} />
                </div>
                <DetailItem icon={Globe} label="País" value={selectedRecord.country} />
                <DetailItem icon={LinkIcon} label="Link para Fotos" value={selectedRecord.photoLink} isLink={true} />
                <div>
                  <Label className="text-sm text-muted-foreground">Descrição Detalhada</Label>
                  <p className="mt-1 p-3 bg-muted/50 dark:bg-muted/20 rounded-md text-foreground">{selectedRecord.description || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tipo de Ajuda Necessária / Oferecida</Label>
                  <div className="mt-2 space-y-2">
                    {getPhasesList(selectedRecord.phases).length > 0 ? getPhasesList(selectedRecord.phases).map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span className={`font-semibold w-24 ${item.phase === 'Curto Prazo' ? 'text-orange-500' : item.phase === 'Médio Prazo' ? 'text-blue-500' : 'text-green-500'}`}>{item.phase}:</span>
                        <span className="text-foreground capitalize">{item.label.replace(/-/g, ' ')}</span>
                      </div>
                    )) : <p className="text-foreground">Não especificado.</p>}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t dark:border-gray-700 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>Fechar</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MapPage;
