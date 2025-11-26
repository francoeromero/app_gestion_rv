import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import SupplyDialog from '@/components/SupplyDialog';

const Supplies = ({ user }) => {
  const [supplies, setSupplies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching supplies:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        // toast({
        //   title: "Error",
        //   description: `No se pudieron cargar los insumos: ${error.message}`,
        //   variant: "destructive",
        // });
        return;
      }

      // Mapear campos de BD a estructura del frontend
      const mappedSupplies = data.map(supply => ({
        id: supply.id,
        name: supply.nombre,
        category: supply.categoria,
        quantity: supply.cantidad,
        totalPrice: supply.precio_total,
        purchaseDate: supply.fecha,
        employee: 'No asignado', // Ya no intentamos hacer JOIN con empleados
        employeeId: supply.empleado_id,
        // Campos calculados/defaults para compatibilidad
        unitPrice: supply.cantidad > 0 ? (supply.precio_total / supply.cantidad) : 0,
        supplier: 'No especificado' // Este campo no existe en BD
      }));

      setSupplies(mappedSupplies);
    } catch (error) {
      console.error('Error in fetchSupplies:', error);
      toast({
        title: "Error", 
        description: "Error inesperado al cargar los insumos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  const handleSave = async (supplyData) => {
    try {
      setLoading(true);

      // Función para validar UUID
      const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Mapear campos del frontend a la BD (solo campos que existen)
      const dbSupplyData = {
        nombre: supplyData.name,
        categoria: supplyData.category,
        cantidad: parseInt(supplyData.quantity),
        precio_total: parseFloat(supplyData.totalPrice),
        fecha: supplyData.purchaseDate,
        empleado_id: (supplyData.employeeId && isValidUUID(supplyData.employeeId)) 
                     ? supplyData.employeeId 
                     : null
      };

      if (editingSupply) {
        const { error } = await supabase
          .from('insumos')
          .update(dbSupplyData)
          .eq('id', editingSupply.id);

        if (error) throw error;

        toast({
          title: "Insumo actualizado",
          description: "El insumo ha sido actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('insumos')
          .insert([dbSupplyData]);

        if (error) throw error;

        toast({
          title: "Insumo creado",
          description: "El insumo ha sido creado correctamente",
        });
      }

      // Recargar datos
      await fetchSupplies();
      setDialogOpen(false);
      setEditingSupply(null);

    } catch (error) {
      console.error('Error saving supply:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el insumo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplyId) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('insumos')
        .delete()
        .eq('id', supplyId);

      if (error) throw error;

      toast({
        title: "Insumo eliminado",
        description: "El insumo ha sido eliminado correctamente",
      });

      // Recargar datos
      await fetchSupplies();

    } catch (error) {
      console.error('Error deleting supply:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el insumo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSupplies = supplies.filter(sup => {
    const matchesSearch = sup.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || sup.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });



  return (
    <>
      <Helmet>
        <title>Insumos - Rosse Vita Eventos</title>
        <meta name="description" content="Registra y gestiona las compras" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Insumos</h2>
            <p className="text-gray-600 mt-1">Registra y gestiona las compras</p>
          </div>
          <Button
            onClick={() => {
              setEditingSupply(null);
              setDialogOpen(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Insumo
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option>Todas</option>
              <option>Papelería</option>
              <option>Tecnología</option>
              <option>Limpieza</option>
              <option>Impresión</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Insumo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Precio Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Empleado</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplies.map((supply, index) => (
                  <motion.tr
                    key={supply.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">{supply.name}</td>
                    <td className="py-3 px-4">{supply.category}</td>
                    <td className="py-3 px-4">{new Date(supply.purchaseDate).toLocaleDateString('es-AR')}</td>
                    <td className="py-3 px-4">{supply.quantity}</td>
                    <td className="py-3 px-4 font-semibold">${(Number(supply.totalPrice) || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{supply.employee}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingSupply(supply);
                            setDialogOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supply.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SupplyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supply={editingSupply}
        onSave={handleSave}
      />
    </>
  );
};

export default Supplies;