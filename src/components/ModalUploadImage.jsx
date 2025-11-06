import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ModalUploadImage = ({ isOpen, onClose, onImageUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Función para manejar la selección y subida de archivo
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, JPEG y PNG.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (opcional - máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Subir imagen a Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('promos-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage
        .from('promos-images')
        .getPublicUrl(fileName);

      // 3. Crear registro en la tabla promos
      const { data: promoData, error: promoError } = await supabase
        .from('promos')
        .insert([{
          imagen_url: urlData.publicUrl,
          imagen_path: fileName,
          usuario_id: user?.id || null,
        }])
        .select();

      if (promoError) throw promoError;

      // Notificar al componente padre
      onImageUploaded(promoData[0]);

      toast({
        title: "¡Imagen subida exitosamente!",
        description: `${file.name} se ha agregado a las promociones.`,
        className: 'bg-green-50 border-green-200 text-green-800'
      });

      // Cerrar modal
      onClose();

    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast({
        title: "Error al subir imagen",
        description: "Hubo un problema al procesar la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Función para activar el selector de archivos
  const triggerFileInput = () => {
    document.getElementById('file-input').click();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999}}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={!isUploading ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Subir Promoción</h2>
                  <p className="text-sm text-gray-500">Agrega una nueva imagen promocional</p>
                </div>
              </div>
              
              {!isUploading && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Área de subida */}
            <div className="space-y-4">
              {/* Input de archivo (oculto) */}
              <input
                id="file-input"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />

              {/* Botón principal de subida */}
              <div 
                onClick={!isUploading ? triggerFileInput : undefined}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isUploading 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : 'border-pink-300 hover:border-pink-400 hover:bg-pink-50'
                  }
                `}
              >
                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 text-pink-600 mx-auto animate-spin" />
                    <p className="text-sm font-medium text-gray-600">Subiendo imagen...</p>
                    <p className="text-xs text-gray-500">Por favor espera</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-pink-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      Haz clic para seleccionar imagen
                    </p>
                    <p className="text-xs text-gray-500">
                      Formatos: JPG, JPEG, PNG (máx. 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Botón alternativo */}
              {!isUploading && (
                <Button
                  onClick={triggerFileInput}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Imagen
                </Button>
              )}
            </div>

            {/* Footer con información */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> Las imágenes se optimizarán automáticamente para web.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ModalUploadImage;