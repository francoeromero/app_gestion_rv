import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  { name: 'Papelería', value: 29, color: '#ec4899' },
  { name: 'Tecnología', value: 31, color: '#3b82f6' },
  { name: 'Limpieza', value: 12, color: '#8b5cf6' },
  { name: 'Impresión', value: 29, color: '#06b6d4' }
];

const employeeData = [
  { name: 'Sede Constituyentes', gasto: 170 },
  { name: 'Sede Illia', gasto: 146 },

];

const monthlyDetails = {
  'Octubre': [
    { name: 'Resma de Papel A4', date: '15/10/2025', quantity: 10, total: 85 },
    { name: 'Mouse Inalámbrico', date: '10/10/2025', quantity: 2, total: 50 }
  ]
};

const Reports = ({ user }) => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('Noviembre');
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
  const [categoryChartData, setCategoryChartData] = useState([]);
  const [tasksChartData, setTasksChartData] = useState([
    { name: 'Sede Constituyentes', gasto: 0 },
    { name: 'Sede Illia', gasto: 0 }
  ]);
  const [monthlyDetailsData, setMonthlyDetailsData] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ total: 0, items: 0 });
  const { toast } = useToast();

  useEffect(() => {
    // Calcular gastos mensuales reales desde Supabase
    const calculateMonthlyExpenses = async () => {
      try {
        const { data: supplies, error } = await supabase
          .from('insumos')
          .select('nombre, precio_total, fecha, categoria');

        if (error) {
          console.error('Error fetching supplies for reports:', error);
          return;
        }

        const currentYear = parseInt(selectedYear);
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

        setMonthlyChartData(chartData);

        // Calcular distribución por categorías
        const categoryTotals = {};
        let totalExpense = 0;

        const filteredSupplies = supplies.filter(supply => {
          if (!supply.fecha) return false;
          const purchaseDate = new Date(supply.fecha);
          return purchaseDate.getFullYear() === currentYear;
        });

        console.log('All supplies data:', supplies);
        console.log('Filtered supplies for categories:', filteredSupplies);

        filteredSupplies.forEach(supply => {
          const category = supply.categoria || 'Sin categoría';
          const price = parseFloat(supply.precio_total) || 0;
          
          console.log(`Processing: ${supply.nombre}, categoria: "${category}", precio: ${price}`);
          
          if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
          }
          categoryTotals[category] += price;
          totalExpense += price;
        });

        console.log('Category totals before processing:', categoryTotals);
        console.log('Total expense:', totalExpense);

        // Convertir a formato de gráfico con porcentajes y colores
        const colors = ['#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        const categoryData = Object.entries(categoryTotals)
          .filter(([name, value]) => value > 0) // Solo categorías con valores
          .map(([name, value], index) => {
            // Usar más decimales para el cálculo y redondear con al menos 1 decimal
            const exactPercentage = totalExpense > 0 ? (value / totalExpense) * 100 : 0;
            let percentage;
            
            if (exactPercentage >= 1) {
              percentage = Math.round(exactPercentage);
            } else if (exactPercentage >= 0.1) {
              percentage = Math.round(exactPercentage * 10) / 10; // 1 decimal
            } else {
              percentage = Math.round(exactPercentage * 100) / 100; // 2 decimales
            }
            
            console.log(`Category ${name}: amount=${value}, exactPercentage=${exactPercentage}, finalPercentage=${percentage}`);
            
            return {
              name,
              value: percentage,
              amount: value,
              color: colors[index % colors.length]
            };
          })
          .sort((a, b) => b.amount - a.amount); // Ordenar por monto desc

        setCategoryChartData(categoryData);

        console.log('Reports - Category totals raw:', categoryTotals);
        console.log('Reports - Total expense:', totalExpense);
        console.log('Reports - Monthly chart data updated:', chartData);
        console.log('Reports - Category data updated:', categoryData);
        console.log('Reports - Total by months:', chartData.map(m => `${m.month}: $${m.gasto}`));

      } catch (error) {
        console.error('Error calculating monthly expenses for reports:', error);
      }
    };

    // Calcular tareas pendientes por sede
    const calculatePendingTasks = async () => {
      try {
        // Obtener tareas de Constituyentes
        const { data: constituyentesTasks, error: constError } = await supabase
          .from('tareas')
          .select('id')
          .eq('sede', 'Rosse Constituyentes')
          .eq('estado', 'Pendiente');

        // Obtener tareas de Illia
        const { data: illiaTasks, error: illiaError } = await supabase
          .from('tareas')
          .select('id')
          .eq('sede', 'Rosse Illia')
          .eq('estado', 'Pendiente');

        if (constError) {
          console.error('Error fetching Constituyentes tasks for reports:', constError);
        }
        if (illiaError) {
          console.error('Error fetching Illia tasks for reports:', illiaError);
        }

        const constituyentesCount = constituyentesTasks ? constituyentesTasks.length : 0;
        const illiaCount = illiaTasks ? illiaTasks.length : 0;

        const tasksData = [
          { name: 'Sede Constituyentes', gasto: constituyentesCount },
          { name: 'Sede Illia', gasto: illiaCount }
        ];

        setTasksChartData(tasksData);

        console.log('Reports - Tasks data updated:', {
          constituyentes: constituyentesCount,
          illia: illiaCount,
          data: tasksData
        });

      } catch (error) {
        console.error('Error calculating pending tasks for reports:', error);
      }
    };

    // Calcular detalles mensuales de gastos
    const calculateMonthlyDetails = async () => {
      try {
        const { data: supplies, error } = await supabase
          .from('insumos')
          .select('nombre, fecha, cantidad, precio_total, categoria')
          .order('fecha', { ascending: false });

        if (error) {
          console.error('Error fetching supplies for monthly details:', error);
          return;
        }

        // Convertir el mes seleccionado a número (0-11)
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const selectedMonthIndex = monthNames.indexOf(selectedMonth);
        const currentYear = parseInt(selectedYear);

        // Filtrar insumos del mes seleccionado
        const monthlySupplies = supplies.filter(supply => {
          if (!supply.fecha) return false;
          const supplyDate = new Date(supply.fecha);
          return supplyDate.getMonth() === selectedMonthIndex && 
                 supplyDate.getFullYear() === currentYear;
        });

        // Mapear a formato de tabla
        const monthlyDetails = monthlySupplies.map(supply => ({
          name: supply.nombre,
          date: new Date(supply.fecha).toLocaleDateString('es-AR'),
          quantity: supply.cantidad || 1,
          total: supply.precio_total || 0,
          category: supply.categoria || 'Sin categoría'
        }));

        // Calcular totales
        const totalAmount = monthlySupplies.reduce((sum, supply) => sum + (supply.precio_total || 0), 0);
        const totalItems = monthlySupplies.length;

        setMonthlyDetailsData(monthlyDetails);
        setMonthlyTotals({ 
          total: totalAmount, 
          items: totalItems 
        });

        console.log('Reports - Monthly details updated:', {
          month: selectedMonth,
          year: selectedYear,
          supplies: monthlyDetails.length,
          total: totalAmount,
          items: totalItems,
          details: monthlyDetails
        });

      } catch (error) {
        console.error('Error calculating monthly details for reports:', error);
      }
    };

    calculateMonthlyExpenses();
    calculatePendingTasks();
    calculateMonthlyDetails();

    // Configurar listener en tiempo real para insumos
    const suppliesChannel = supabase
      .channel('reports-supplies-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'insumos'
        },
        (payload) => {
          console.log('Reports - Supplies change detected:', payload);
          // Recalcular gastos cuando haya cambios en insumos
          calculateMonthlyExpenses();
          calculateMonthlyDetails();
        }
      )
      .subscribe();

    // Configurar listener en tiempo real para tareas
    const tasksChannel = supabase
      .channel('reports-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tareas'
        },
        (payload) => {
          console.log('Reports - Tasks change detected:', payload);
          // Recalcular tareas pendientes cuando haya cambios
          calculatePendingTasks();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(suppliesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [selectedYear, selectedMonth]); // Recalcular cuando cambie el año o mes seleccionado

  const handleExportPDF = () => {
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  const handleExportCSV = () => {
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  return (
    <>
      <Helmet>
        <title>Reportes - Rosse Vita Eventos</title>
        <meta name="description" content="Análisis de gastos por año" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Reportes</h2>
            <p className="text-gray-600 mt-1">Análisis de gastos por año</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option>2025</option>
              <option>2024</option>
            </select>
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Gastos Mensuales {selectedYear}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `$${value}`}
                />
                <Legend />
                <Line type="monotone" dataKey="gasto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Categoría ({selectedYear})</h3>
            {categoryChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value >= 1 ? value : value.toFixed(2)}% ($${props.payload.amount.toFixed(2)})`,
                        'Distribución'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryChartData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="font-medium">{entry.name}</span>
                      </div>
                      <span className="text-gray-600">
                        {entry.value >= 1 ? entry.value : entry.value.toFixed(2)}% (${entry.amount.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de categorías para mostrar</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Employee Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tareas Pendientes por Sede</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasksChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [`${value} tareas`, 'Pendientes']}
              />
              <Bar dataKey="gasto" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {tasksChartData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {tasksChartData.map((sede, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600 font-medium">{sede.name}</p>
                  <p className="text-2xl font-bold text-green-600">{sede.gasto}</p>
                  <p className="text-xs text-gray-500">tareas pendientes</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Monthly Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Detalle de Gastos Mensuales</h3>
            <div className="flex gap-2">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option>Enero</option>
                <option>Febrero</option>
                <option>Marzo</option>
                <option>Abril</option>
                <option>Mayo</option>
                <option>Junio</option>
                <option>Julio</option>
                <option>Agosto</option>
                <option>Septiembre</option>
                <option>Octubre</option>
                <option>Noviembre</option>
                <option>Diciembre</option>
              </select>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">Insumos comprados en el mes seleccionado.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 font-medium mb-1">GASTO TOTAL</p>
              <p className="text-3xl font-bold text-blue-700">${monthlyTotals.total.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 font-medium mb-1">ÍTEMS COMPRADOS</p>
              <p className="text-3xl font-bold text-gray-700">{monthlyTotals.items}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Insumo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyDetailsData.length > 0 ? monthlyDetailsData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{item.date}</td>
                    <td className="py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4 font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No hay insumos registrados en {selectedMonth} {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Reports;