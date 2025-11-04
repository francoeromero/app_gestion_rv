import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar, Users, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';

const monthlyData = [
  { month: 'Ene', gasto: 0 },
  { month: 'Feb', gasto: 0 },
  { month: 'Mar', gasto: 0 },
  { month: 'Abr', gasto: 0 },
  { month: 'May', gasto: 0 },
  { month: 'Jun', gasto: 0 },
  { month: 'Jul', gasto: 25 },
  { month: 'Ago', gasto: 115 },
  { month: 'Sep', gasto: 145 },
  { month: 'Oct', gasto: 135 },
  { month: 'Nov', gasto: 0 },
  { month: 'Dic', gasto: 0 }
];

const categoryData = [
  { name: 'Papelería', value: 121, color: '#ec4899' },
  { name: 'Tecnología', value: 130, color: '#3b82f6' },
  { name: 'Limpieza', value: 50, color: '#8b5cf6' },
  { name: 'Impresión', value: 120, color: '#06b6d4' }
];

const recentActivity = [
  { name: 'Resma de Papel A4', date: '14/10/2025', amount: 86 },
  { name: 'Mouse Inalámbrico', date: '9/10/2025', amount: 50 },
  { name: 'Detergente Limpiador', date: '27/9/2025', amount: 25 },
  { name: 'Toner para Impresora', date: '14/9/2025', amount: 120 },
  { name: 'Caja de Bolígrafos', date: '19/8/2025', amount: 36 }
];

const Dashboard = ({ user }) => {
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [yearlyExpense, setYearlyExpense] = useState(0);
  const [nextEvent, setNextEvent] = useState({ name: 'No hay eventos', date: 'próximos' });
  const [constituyentesTasksInProgress, setConstituyentesTasksInProgress] = useState(0);
  const [illiaTasksInProgress, setIlliaTasksInProgress] = useState(0);
  const [monthlyChartData, setMonthlyChartData] = useState([
    { month: 'Ene', gasto: 0 },
    { month: 'Feb', gasto: 0 },
    { month: 'Mar', gasto: 0 },
    { month: 'Abr', gasto: 0 },
    { month: 'May', gasto: 0 },
    { month: 'Jun', gasto: 0 },
    { month: 'Jul', gasto: 0 },
    { month: 'Ago', gasto: 0 },
    { month: 'Sep', gasto: 0 },
    { month: 'Oct', gasto: 0 },
    { month: 'Nov', gasto: 0 },
    { month: 'Dic', gasto: 0 }
  ]);
  const [recentActivityData, setRecentActivityData] = useState([]);

  useEffect(() => {
    // Calcular gasto mensual actual desde Supabase
    const calculateMonthlyExpense = async () => {
      try {
        const { data: supplies, error } = await supabase
          .from('insumos')
          .select('precio_total, fecha');

        if (error) {
          console.error('Error fetching supplies for dashboard:', error);
          return;
        }

        const currentMonth = new Date().getMonth(); // 0-11 (noviembre = 10)
        const currentYear = new Date().getFullYear(); // 2025

        const monthlyTotal = supplies
          .filter(supply => {
            if (!supply.fecha) return false;
            const purchaseDate = new Date(supply.fecha);
            return purchaseDate.getMonth() === currentMonth && 
                   purchaseDate.getFullYear() === currentYear;
          })
          .reduce((total, supply) => total + (supply.precio_total || 0), 0);

        // Calcular gasto anual (todo el año 2025)
        const yearlyTotal = supplies
          .filter(supply => {
            if (!supply.fecha) return false;
            const purchaseDate = new Date(supply.fecha);
            return purchaseDate.getFullYear() === currentYear;
          })
          .reduce((total, supply) => total + (supply.precio_total || 0), 0);

        console.log('Monthly calculation:', {
          currentMonth: currentMonth + 1, // +1 para mostrar 1-12
          currentYear,
          totalSupplies: supplies.length,
          monthlySupplies: supplies.filter(s => {
            if (!s.fecha) return false;
            const d = new Date(s.fecha);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          }).length,
          yearlySupplies: supplies.filter(s => {
            if (!s.fecha) return false;
            const d = new Date(s.fecha);
            return d.getFullYear() === currentYear;
          }).length,
          monthlyTotal,
          yearlyTotal
        });

        setMonthlyExpense(monthlyTotal);
        setYearlyExpense(yearlyTotal);

        // Calcular gastos por mes para el gráfico
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const chartData = monthNames.map((monthName, monthIndex) => {
          const monthlyExpense = supplies
            .filter(supply => {
              if (!supply.fecha) return false;
              const purchaseDate = new Date(supply.fecha);
              return purchaseDate.getMonth() === monthIndex && 
                     purchaseDate.getFullYear() === currentYear;
            })
            .reduce((total, supply) => total + (supply.precio_total || 0), 0);
          
          return {
            month: monthName,
            gasto: monthlyExpense
          };
        });

        setMonthlyChartData(chartData);

        console.log('Chart data updated:', chartData);
        console.log('Total by months:', chartData.map(m => `${m.month}: $${m.gasto}`));

      } catch (error) {
        console.error('Error calculating monthly expense:', error);
      }
    };

    // Buscar el evento más próximo
    const findNextEvent = async () => {
      try {
        const { data: events, error } = await supabase
          .from('eventos')
          .select('nombre, fecha')
          .gte('fecha', new Date().toISOString().split('T')[0]) // Solo eventos futuros
          .order('fecha', { ascending: true })
          .limit(1);

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        if (events && events.length > 0) {
          const event = events[0];
          const eventDate = new Date(event.fecha);
          const today = new Date();
          const diffTime = eventDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setNextEvent({
            name: event.nombre,
            date: diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Mañana' : `En ${diffDays} días`
          });

          console.log('Next event:', {
            name: event.nombre,
            date: event.fecha,
            daysFromNow: diffDays
          });
        } else {
          setNextEvent({ name: 'No hay eventos', date: 'próximos' });
        }
      } catch (error) {
        console.error('Error finding next event:', error);
      }
    };

    // Contar tareas pendientes de Constituyentes
    const countConstituyentesTasks = async () => {
      try {
        // Primero obtener todas las tareas para debug
        const { data: allTasks, error: allError } = await supabase
          .from('tareas')
          .select('id, titulo, estado, sede');

        if (allError) {
          console.error('Error fetching all tasks:', allError);
        } else {
          console.log('All tasks in database:', allTasks);
        }

        // Ahora filtrar específicamente
        const { data: tasks, error } = await supabase
          .from('tareas')
          .select('id, titulo, estado, sede')
          .eq('sede', 'Rosse Constituyentes')
          .eq('estado', 'Pendiente');

        if (error) {
          console.error('Error fetching Constituyentes tasks:', error);
          return;
        }

        const count = tasks ? tasks.length : 0;
        setConstituyentesTasksInProgress(count);

        console.log('Filtered Constituyentes tasks:', {
          count,
          filterCriteria: { sede: 'Rosse Constituyentes', estado: 'Pendiente' },
          tasks: tasks?.map(t => ({ 
            id: t.id, 
            titulo: t.titulo, 
            estado: t.estado, 
            sede: t.sede 
          }))
        });
      } catch (error) {
        console.error('Error counting Constituyentes tasks:', error);
      }
    };

    // Contar tareas pendientes de Illia
    const countIlliaTasks = async () => {
      try {
        const { data: tasks, error } = await supabase
          .from('tareas')
          .select('id, titulo, estado, sede')
          .eq('sede', 'Rosse Illia')
          .eq('estado', 'Pendiente');

        if (error) {
          console.error('Error fetching Illia tasks:', error);
          return;
        }

        const count = tasks ? tasks.length : 0;
        setIlliaTasksInProgress(count);

        console.log('Filtered Illia tasks:', {
          count,
          filterCriteria: { sede: 'Rosse Illia', estado: 'Pendiente' },
          tasks: tasks?.map(t => ({ 
            id: t.id, 
            titulo: t.titulo, 
            estado: t.estado, 
            sede: t.sede 
          }))
        });
      } catch (error) {
        console.error('Error counting Illia tasks:', error);
      }
    };

    // Obtener actividad reciente (últimos 5 elementos de eventos, insumos y tareas)
    const fetchRecentActivity = async () => {
      try {
        const activities = [];

        // Obtener últimos eventos
        const { data: eventos, error: eventosError } = await supabase
          .from('eventos')
          .select('id, nombre, fecha, creado_en')
          .order('creado_en', { ascending: false })
          .limit(5);

        if (!eventosError && eventos) {
          eventos.forEach(evento => {
            activities.push({
              id: `evento-${evento.id}`,
              name: evento.nombre,
              type: 'Evento',
              date: new Date(evento.creado_en).toLocaleDateString('es-AR'),
              amount: new Date(evento.fecha).toLocaleDateString('es-AR'),
              icon: 'calendar',
              createdAt: new Date(evento.creado_en)
            });
          });
        }

        // Obtener últimos insumos
        const { data: insumos, error: insumosError } = await supabase
          .from('insumos')
          .select('id, nombre, precio_total, creado_en')
          .order('creado_en', { ascending: false })
          .limit(5);

        if (!insumosError && insumos) {
          insumos.forEach(insumo => {
            activities.push({
              id: `insumo-${insumo.id}`,
              name: insumo.nombre,
              type: 'Insumo',
              date: new Date(insumo.creado_en).toLocaleDateString('es-AR'),
              amount: `$${insumo.precio_total || 0}`,
              icon: 'package',
              createdAt: new Date(insumo.creado_en)
            });
          });
        }

        // Obtener últimas tareas
        const { data: tareas, error: tareasError } = await supabase
          .from('tareas')
          .select('id, titulo, sede, creado_en')
          .order('creado_en', { ascending: false })
          .limit(5);

        if (!tareasError && tareas) {
          tareas.forEach(tarea => {
            activities.push({
              id: `tarea-${tarea.id}`,
              name: tarea.titulo,
              type: `Tarea ${tarea.sede === 'Rosse Constituyentes' ? 'Constituyentes' : 'Illia'}`,
              date: new Date(tarea.creado_en).toLocaleDateString('es-AR'),
              amount: tarea.sede === 'Rosse Constituyentes' ? 'Const.' : 'Illia',
              icon: 'task',
              createdAt: new Date(tarea.creado_en)
            });
          });
        }

        // Ordenar por fecha de creación (más recientes primero) y tomar solo los últimos 5
        const sortedActivities = activities
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);

        setRecentActivityData(sortedActivities);

        console.log('Recent activity updated:', {
          total: sortedActivities.length,
          events: sortedActivities.filter(a => a.type === 'Evento').length,
          supplies: sortedActivities.filter(a => a.type === 'Insumo').length,
          tasks: sortedActivities.filter(a => a.type.includes('Tarea')).length,
          activities: sortedActivities
        });

      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };

    calculateMonthlyExpense();
    findNextEvent();
    countConstituyentesTasks();
    countIlliaTasks();
    fetchRecentActivity();

    // Configurar listener en tiempo real para tareas
    const taskChannel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tareas'
        },
        (payload) => {
          console.log('Task change detected:', payload);
          // Recontar tareas cuando haya cambios
          countConstituyentesTasks();
          countIlliaTasks();
          fetchRecentActivity();
        }
      )
      .subscribe();

    // Configurar listener en tiempo real para insumos
    const suppliesChannel = supabase
      .channel('supplies-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'insumos'
        },
        (payload) => {
          console.log('Supplies change detected:', payload);
          // Recalcular gastos cuando haya cambios en insumos
          calculateMonthlyExpense();
          fetchRecentActivity();
        }
      )
      .subscribe();

    // Configurar listener en tiempo real para eventos
    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'eventos'
        },
        (payload) => {
          console.log('Events change detected:', payload);
          // Actualizar actividad reciente y próximo evento
          fetchRecentActivity();
          findNextEvent();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(suppliesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const stats = [
    { 
      title: 'Gasto Mensual', 
      value: `$${monthlyExpense.toFixed(2)}`, 
      subtitle: 'Mes actual',
      icon: DollarSign,
      color: 'bg-blue-500'
    },
    { 
      title: 'Gasto Anual', 
      value: `$${yearlyExpense.toFixed(2)}`, 
      subtitle: 'Año en curso',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    { 
      title: 'Evento Próximo', 
      value: nextEvent.name, 
      subtitle: nextEvent.date,
      icon: Calendar,
      color: 'bg-purple-500'
    },
    { 
      title: 'Tareas Constituyentes', 
      value: constituyentesTasksInProgress.toString(), 
      subtitle: 'Pendientes',
      icon: Users,
      color: 'bg-blue-500'
    },
    { 
      title: 'Tareas Illia', 
      value: illiaTasksInProgress.toString(), 
      subtitle: 'Pendientes',
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - Rosse Vita Eventos</title>
        <meta name="description" content="Panel de control de gestión de eventos" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-600 mt-1">Resumen de la actividad</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Expenses Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos Mensuales (2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `$${value}`}
                />
                <Bar dataKey="gasto" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
            <div className="space-y-3">
              {recentActivityData.length > 0 ? recentActivityData.map((item, index) => {
                const getIcon = (iconType) => {
                  switch(iconType) {
                    case 'calendar': return <Calendar className="h-5 w-5 text-purple-600" />;
                    case 'package': return <DollarSign className="h-5 w-5 text-blue-600" />;
                    case 'task': return <Users className="h-5 w-5 text-green-600" />;
                    default: return <FileText className="h-5 w-5 text-gray-600" />;
                  }
                };

                const getBgColor = (iconType) => {
                  switch(iconType) {
                    case 'calendar': return 'bg-purple-100';
                    case 'package': return 'bg-blue-100';
                    case 'task': return 'bg-green-100';
                    default: return 'bg-gray-100';
                  }
                };

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${getBgColor(item.icon)} flex items-center justify-center`}>
                        {getIcon(item.icon)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.type} • {item.date}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{item.amount}</span>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay actividad reciente</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;