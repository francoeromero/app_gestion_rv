
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  CheckSquare,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/eventos', icon: CalendarDays, label: 'Eventos' },
    { path: '/empleados', icon: Users, label: 'Empleados' },
    { path: '/insumos', icon: Package, label: 'Insumos' },
    { path: '/proveedores', icon: Truck, label: 'Proveedores' },
    { path: '/tareas', icon: CheckSquare, label: 'Tareas' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between">
        <img 
          src="https://blogger.googleusercontent.com/img/a/AVvXsEiLjXSEEYTWugcR8F-Nm1FfBTZVY1hjfvRrQUK1sWxCGuxtKHgpsa85Om7uCvcsmZ9LQp9TVzMM7OiE_JjXVbISJuXw6D4EhMIQujIS96qHTADGcbZmx0VkGocywIQtbsci7FOFmr58pSaF8Cnt_9TFUGS6OQSO0lpE8a2sL-uaa8woFOliXjHUuuC4cpVd"
          alt="Rosse Vita Logo"
          className="h-10"
        />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <img 
            src="https://blogger.googleusercontent.com/img/a/AVvXsEiLjXSEEYTWugcR8F-Nm1FfBTZVY1hjfvRrQUK1sWxCGuxtKHgpsa85Om7uCvcsmZ9LQp9TVzMM7OiE_JjXVbISJuXw6D4EhMIQujIS96qHTADGcbZmx0VkGocywIQtbsci7FOFmr58pSaF8Cnt_9TFUGS6OQSO0lpE8a2sL-uaa8woFOliXjHUuuC4cpVd"
            alt="Rosse Vita Logo"
            className="h-16 mx-auto"
          />
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-pink-100 text-pink-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <Link
            to="/configuracion"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all mb-2 ${
              location.pathname === '/configuracion' ? 'bg-pink-100 text-pink-700 font-medium' : ''
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Configuración</span>
          </Link>
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-[60] pt-16 flex flex-col"
          >
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-pink-100 text-pink-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <Link
                to="/configuracion"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all mb-2 ${
                  location.pathname === '/configuracion' ? 'bg-pink-100 text-pink-700 font-medium' : ''
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </Link>
              <Button
                onClick={onLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Cerrar Sesión
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 hidden lg:block">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => location.pathname.startsWith(item.path))?.label || 'Rosse Vita Eventos'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.nombre || user.name || user.email || 'Usuario'}</p>
                <p className="text-xs text-gray-500 capitalize">{user.rol === 'admin' || user.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-semibold">
                {(user.nombre || user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
