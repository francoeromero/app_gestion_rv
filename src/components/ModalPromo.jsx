import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ModalPromo = ({ isOpen, onClose, promo }) => {
  if (!promo) return null;

  // Función para descargar la imagen
  const handleDownloadImage = async () => {
    try {
      const response = await fetch(promo.imagen_url);
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promo-${promo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar la URL temporal
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      // Fallback: abrir en nueva pestaña si falla la descarga
      window.open(promo.imagen_url, '_blank');
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50" onClick={onClose} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999}}>
          {/* Modal Container */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Solo imagen con botón flotante */}
            <div className="relative">
              <img
                src={promo.imagen_url}
                alt={`Promoción ${promo.id}`}
                className="w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=800';
                }}
              />
              
              {/* Botón de descarga flotante */}
              <div className="absolute top-4 right-4">
                <Button
                  onClick={handleDownloadImage}
                  size="sm"
                  className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white border-0 shadow-lg backdrop-blur-sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModalPromo;