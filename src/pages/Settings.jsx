import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Bell, Shield, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Settings = ({ user }) => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  return (
    <>
      <Helmet>
        <title>Configuración - Rosse Vita Eventos</title>
        <meta name="description" content="Ajusta las preferencias del sistema" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Configuración</h2>
          <p className="text-gray-600 mt-1">Ajusta las preferencias del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleClick}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center">
                <User className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Perfil de Usuario</h3>
            </div>
            <p className="text-gray-600 text-sm">Actualiza tu información personal y preferencias</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleClick}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
            </div>
            <p className="text-gray-600 text-sm">Configura alertas y recordatorios</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleClick}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Seguridad</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona contraseñas y permisos</p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Settings;