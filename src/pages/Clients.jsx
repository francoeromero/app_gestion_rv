import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, RefreshCw, ExternalLink, MessageSquare, Phone, Calendar, CheckSquare, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleSheet } from '@/hooks/useGoogleSheet';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1EW6bxqVGnJVMrNSkzhKBI3vjEHCNoUOU0GW8uVVEmYA/export?format=csv&gid=153235482';

const Clients = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedCards, setCheckedCards] = useState({});
  const [deletedCards, setDeletedCards] = useState(new Set());
  const { data: clients, loading, error, refetch } = useGoogleSheet(GOOGLE_SHEET_CSV_URL);

  // Agrupar mensajes por teléfono
  const groupedClients = clients.reduce((acc, client) => {
    let phone = client.telefono;
    if (!phone) return acc;
    
    // Limpieza extra del teléfono
    phone = phone.trim();
    if (!phone) return acc;
    
    if (!acc[phone]) {
      acc[phone] = {
        telefono: phone,
        mensajes: []
      };
    }
    
    acc[phone].mensajes.push({
      fecha: client.timestamp_ar || client.fecha,
      texto: client.mensaje
    });
    
    return acc;
  }, {});

  // Helper para parsear fechas de forma segura y flexible
  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const str = dateStr.toString().trim();
    
    // Intento 1: Parseo directo (funciona para la mayoría de formatos ISO y locales en Chrome/V8)
    let timestamp = new Date(str).getTime();
    if (!isNaN(timestamp)) return timestamp;

    // Intento 2: Reemplazar primer espacio por T (para compatibilidad estricta ISO-8601 en Safari/Firefox)
    // Convierte "2025-11-29 10:00:00" -> "2025-11-29T10:00:00"
    const isoStr = str.replace(' ', 'T');
    timestamp = new Date(isoStr).getTime();
    if (!isNaN(timestamp)) return timestamp;

    return 0;
  };

  // Obtener el timestamp más reciente de un grupo de mensajes
  const getGroupLatestTimestamp = (group) => {
    if (!group.mensajes || group.mensajes.length === 0) return 0;
    return Math.max(...group.mensajes.map(m => parseDate(m.fecha)));
  };

  const handleToggleCheck = (phone) => {
    setCheckedCards(prev => ({
      ...prev,
      [phone]: !prev[phone]
    }));
  };

  const handleDeleteCard = (phone) => {
    setDeletedCards(prev => new Set([...prev, phone]));
  };

  const filteredGroups = Object.values(groupedClients)
    .map(group => {
      // 1. Ordenar los mensajes DENTRO de cada card (más reciente arriba)
      group.mensajes.sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha));
      return group;
    })
    .filter(group => {
      // Filtrar las cards eliminadas
      if (deletedCards.has(group.telefono)) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const phoneMatch = group.telefono.toLowerCase().includes(searchLower);
      const messageMatch = group.mensajes.some(m => 
        m.texto && m.texto.toLowerCase().includes(searchLower)
      );
      return phoneMatch || messageMatch;
    })
    .sort((a, b) => {
      // 2. Ordenar las CARDS entre sí usando la misma lógica unificada
      const timeA = getGroupLatestTimestamp(a);
      const timeB = getGroupLatestTimestamp(b);
      return timeB - timeA;
    });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Helmet>
        <title>Clientes (Google Sheets) | Rosse Vita</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes / Mensajes</h1>
          <p className="text-gray-500 mt-1">
            Datos sincronizados desde Google Sheets en tiempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/1EW6bxqVGnJVMrNSkzhKBI3vjEHCNoUOU0GW8uVVEmYA/edit?gid=153235482#gid=153235482', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Hoja
          </Button>
          <Button 
            onClick={refetch} 
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por teléfono, mensaje..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && clients.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-200">
            Cargando datos...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-200">
            No se encontraron registros
          </div>
        ) : (
          filteredGroups.map((group, index) => {
            // Usar la misma lógica de timestamp unificada para determinar si es reciente
            const latestTimestamp = getGroupLatestTimestamp(group);
            
            const isRecent = (() => {
              if (!latestTimestamp) return false;
              
              const msgDate = new Date(latestTimestamp);
              const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
              
              return msgDate >= fifteenMinutesAgo;
            })();

            return (
            <div key={index} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col h-full hover:shadow-md transition-shadow ${isRecent ? 'border-green-400 ring-1 ring-green-400 relative mt-2' : 'border-gray-200'}`}>
              {isRecent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide z-10">
                  RECIEN AGREGADO
                </div>
              )}
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 text-gray-900 mb-1">
                    <div className="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="font-semibold">{group.telefono}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${group.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Hola, ¿cómo estás? Te escribo desde el equipo de Rosse Vita Eventos. Recibimos tu solicitud y estamos acá para ayudarte con tu evento")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-700 font-medium ml-10 flex items-center gap-1 hover:underline"
                  >
                    Comunicarse con el cliente
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2044px-WhatsApp.svg.png" alt="WhatsApp" className="h-4 w-4" />
                  </a>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {group.mensajes.length}
                    </div>
                    <button 
                      onClick={() => handleDeleteCard(group.telefono)}
                      className="text-gray-600 hover:text-red-600 transition-colors"
                      title="Eliminar card"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleToggleCheck(group.telefono)}
                    className="text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1"
                    title={checkedCards[group.telefono] ? "Marcar como no completado" : "Marcar como completado"}
                  >
                    {checkedCards[group.telefono] ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    <span className="text-[10px] text-gray-600">
                      {checkedCards[group.telefono] ? "Completado" : "A espera del cliente"}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {group.mensajes.map((msg, msgIndex) => (
                  <div key={msgIndex} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>{msg.fecha}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                        {msg.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};

export default Clients;
