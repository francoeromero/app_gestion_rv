import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Plus, Upload, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ModalPromo from '@/components/ModalPromo';
import ModalUploadImage from '@/components/ModalUploadImage';
import { supabase } from '@/lib/customSupabaseClient';

const Promos = () => {
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();

  // Función para contar promos del mes actual
  const getPromosThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return promos.filter(promo => {
      const promoDate = new Date(promo.fecha_creacion);
      return promoDate.getMonth() === currentMonth && promoDate.getFullYear() === currentYear;
    }).length;
  };

  // Función para contar promos de la última semana
  const getRecentUploads = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás
    
    return promos.filter(promo => {
      const promoDate = new Date(promo.fecha_creacion);
      return promoDate >= oneWeekAgo && promoDate <= now;
    }).length;
  };

  // Cargar datos reales desde Supabase
  useEffect(() => {
    loadPromosFromSupabase();
  }, []);

  // Función para cargar promos desde Supabase
  const loadPromosFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) throw error;
      setPromos(data || []);
    } catch (error) {
      console.error('Error cargando promos:', error);
      // toast({
      //   title: "Error al cargar promociones",
      //   description: "No se pudieron cargar las promociones.",
      //   variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para abrir modal de subir imagen
  const handleUploadImage = () => {
    setIsUploadModalOpen(true);
  };

  // Función para manejar imagen subida exitosamente
  const handleImageUploaded = (newPromo) => {
    // Agregar al estado local y recargar desde Supabase
    setPromos(prevPromos => [newPromo, ...prevPromos]);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };



  // Función para subir imagen a Supabase Storage (preparada)
  const uploadImageToSupabase = async (file) => {
    try {
      // Futuro: Upload a Supabase Storage
      // const fileName = `${Date.now()}_${file.name}`;
      // const { data: uploadData, error: uploadError } = await supabase.storage
      //   .from('promos-images')
      //   .upload(fileName, file);
      //
      // if (uploadError) throw uploadError;
      //
      // const { data: urlData } = supabase.storage
      //   .from('promos-images')
      //   .getPublicUrl(fileName);
      //
      // return {
      //   imagen_url: urlData.publicUrl,
      //   imagen_path: fileName
      // };
      console.log('Upload a Supabase Storage - preparado');
      return null;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  };

  // Función para crear promo en Supabase (preparada)
  const createPromoInSupabase = async (promoData) => {
    try {
      // Futuro: INSERT INTO promos
      // const { data, error } = await supabase
      //   .from('promos')
      //   .insert([promoData])
      //   .select();
      //
      // if (error) throw error;
      // return data[0];
      console.log('Crear promo en Supabase - preparado:', promoData);
      return promoData;
    } catch (error) {
      console.error('Error creando promo:', error);
      throw error;
    }
  };

  // Función para eliminar promo desde Supabase
  const handleDeletePromo = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta promoción?')) {
      try {
        const promoToDelete = promos.find(p => p.id === id);
        
        // Eliminar imagen del storage si existe
        if (promoToDelete?.imagen_path) {
          await supabase.storage
            .from('promos-images')
            .remove([promoToDelete.imagen_path]);
        }
        
        // Eliminar registro de la base de datos
        const { error } = await supabase
          .from('promos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Actualizar estado local
        setPromos(promos.filter(promo => promo.id !== id));
        
        toast({
          title: "Promoción eliminada",
          description: "La promoción se eliminó correctamente.",
          className: 'bg-green-50 border-green-200 text-green-800'
        });
      } catch (error) {
        console.error('Error eliminando promo:', error);
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar la promoción.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewPromo = (promo) => {
    setSelectedPromo(promo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPromo(null);
  };

  return (
    <>
      <Helmet>
        <title>Promociones - Rosse Vita Eventos</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
            <p className="text-gray-600">Gestiona las promociones y ofertas especiales</p>
          </div>
          
          <Button 
            onClick={handleUploadImage}
            className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Subir Imagen
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Promos</p>
                <p className="text-2xl font-bold text-gray-900">{promos.length}</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subidas recientes</p>
                <p className="text-2xl font-bold text-green-600">{getRecentUploads()}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-blue-600">{getPromosThisMonth()}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Galería de 3 columnas */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Galería de Promociones</h2>
            <p className="text-sm text-gray-600 mt-1">Visualiza y gestiona todas las promociones</p>
          </div>
          
          <div className="p-6">
            {promos.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No hay promociones disponibles</p>
                <Button 
                  onClick={handleUploadImage}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Promoción
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                {promos.map((promo, index) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 overflow-hidden hover:shadow-lg transition-shadow w-full"
                  >
                    {/* Imagen */}
                    <div 
                      className="relative aspect-square bg-gray-200 overflow-hidden group cursor-pointer"
                      onClick={() => handleViewPromo(promo)}
                    >
                      <img
                        src={promo.imagen_url}
                        alt={promo.titulo}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=400';
                        }}
                      />
                      
                      {/* Overlay con acciones */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-red-500 hover:text-white bg-black bg-opacity-50 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePromo(promo.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Fecha superpuesta */}
                      <div className="absolute bottom-2 left-2">
                        <p className="text-xs text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded backdrop-blur-sm">
                          {new Date(promo.fecha_creacion).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modales */}
        <ModalPromo
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          promo={selectedPromo}
        />
        
        <ModalUploadImage
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          onImageUploaded={handleImageUploaded}
        />
      </div>
    </>
  );
};

export default Promos;