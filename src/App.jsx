
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Supplies from '@/pages/Supplies';
import Suppliers from '@/pages/Suppliers';
import Promos from '@/pages/Promos';
import Reports from '@/pages/Reports';
import Tasks from '@/pages/Tasks';
import Settings from '@/pages/Settings';
import Events from '@/pages/Events';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, loading, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setUserData(null);
    navigate('/login');
  };

  // Función para recargar datos del usuario
  const reloadUserData = async () => {
    if (session?.user) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, rol')
        .eq('id', session.user.id)
        .single();

      if (data) {
        console.log('Datos recargados:', data);
        setUserData({ ...session.user, ...data });
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        // Intentar con diferentes métodos
        let data, error;
        
        try {
          const result = await supabase
            .from('usuarios')
            .select('nombre, rol')
            .eq('id', session.user.id)
            .single();
          data = result.data;
          error = result.error;
        } catch (e) {
          console.log('Error con Supabase client, intentando fetch directo', e);
          // Fallback: usar fetch directo
          try {
            const response = await fetch(`https://srkkhadypryfcselzfhr.supabase.co/rest/v1/usuarios?id=eq.${session.user.id}&select=nombre,rol`, {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNya2toYWR5cHJ5ZmNzZWx6ZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTg5MjMsImV4cCI6MjA3NzgzNDkyM30.i7n0rv7c9cMZZDKyKif0CLuedA-YhrNSSxBWlWVnGDc',
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            const fetchData = await response.json();
            if (fetchData && fetchData.length > 0) {
              data = fetchData[0];
            }
          } catch (fetchError) {
            console.log('Error con fetch directo también', fetchError);
          }
        }

        if (data) {
          console.log('Datos de usuario cargados desde BD:', data);
          setUserData({ ...session.user, ...data });
        } else {
          // Si no hay datos en la tabla, usar datos básicos de la sesión
          console.log('No se encontraron datos en tabla usuarios, usando fallback', error);
          const fallbackUserData = {
            ...session.user,
            nombre: session.user?.user_metadata?.nombre || session.user?.email?.split('@')[0] || 'Usuario',
            rol: session.user?.user_metadata?.rol || 'employee'
          };
          setUserData(fallbackUserData);
        }
      } else {
        setUserData(null);
      }
      setAppLoading(false);
    };

    if (!loading) {
      fetchUserData();
    }
  }, [session, loading]);

  if (loading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <Loader2 className="h-12 w-12 text-pink-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Helmet>
          <title>Login - Rosse Vita Eventos</title>
          <meta name="description" content="Sistema de gestión de eventos Rosse Vita" />
        </Helmet>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </>
    );
  }

  // Crear datos de usuario con fallback
  const currentUser = userData || {
    ...session.user,
    nombre: session.user?.user_metadata?.nombre || session.user?.email?.split('@')[0] || 'Usuario',
    rol: session.user?.user_metadata?.rol || 'employee'
  };

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
        <Route path="/empleados" element={<Employees user={currentUser} />} />
        <Route path="/insumos" element={<Supplies user={currentUser} />} />
        <Route path="/proveedores" element={<Suppliers user={currentUser} />} />
        <Route path="/promos" element={<Promos user={currentUser} />} />
        <Route path="/eventos" element={<Events user={currentUser} />} />
        <Route path="/tareas" element={<Tasks user={currentUser} />} />
        <Route path="/reportes" element={<Reports user={currentUser} />} />
        <Route path="/configuracion" element={<Settings user={currentUser} />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
