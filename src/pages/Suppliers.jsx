import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import SupplierDialog from '@/components/SupplierDialog';

const Suppliers = ({ user }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching suppliers:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast({
          title: "Error",
          description: `No se pudieron cargar los proveedores: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Mapear campos de BD a estructura del frontend
      const mappedSuppliers = data.map(supplier => ({
        id: supplier.id,
        name: supplier.nombre,
        cuit: supplier.cuit || 'No especificado',
        phone: supplier.telefono || 'No especificado', 
        email: supplier.email || 'No especificado',
        category: supplier.rubro || 'Sin categoría'
      }));

      setSuppliers(mappedSuppliers);
    } catch (error) {
      console.error('Error in fetchSuppliers:', error);
      toast({
        title: "Error", 
        description: "Error inesperado al cargar los proveedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async (supplierData) => {
    try {
      setLoading(true);

      // Mapear campos del frontend a la BD
      const dbSupplierData = {
        nombre: supplierData.name,
        cuit: supplierData.cuit,
        telefono: supplierData.phone,
        email: supplierData.email,
        rubro: supplierData.category
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from('proveedores')
          .update(dbSupplierData)
          .eq('id', editingSupplier.id);

        if (error) throw error;

        toast({
          title: "Proveedor actualizado",
          description: "El proveedor ha sido actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('proveedores')
          .insert([dbSupplierData]);

        if (error) throw error;

        toast({
          title: "Proveedor creado",
          description: "El proveedor ha sido creado correctamente",
        });
      }

      // Recargar datos
      await fetchSuppliers();
      setDialogOpen(false);
      setEditingSupplier(null);

    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el proveedor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;

      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado correctamente",
      });

      // Recargar datos
      await fetchSuppliers();

    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proveedor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || supplier.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });



  return (
    <>
      <Helmet>
        <title>Proveedores - Rosse Vita Eventos</title>
        <meta name="description" content="Gestiona tus proveedores de servicios" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Proveedores</h2>
            <p className="text-gray-600 mt-1">Gestiona tus proveedores de servicios</p>
          </div>
          <Button
            onClick={() => {
              setEditingSupplier(null);
              setDialogOpen(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar proveedor..."
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
              <option>Catering</option>
              <option>Decoración</option>
              <option>Sonido</option>
              <option>Iluminación</option>
              <option>Florería</option>
              <option>Fotografía</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">CUIT</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Teléfono</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rubro</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier, index) => (
                  <motion.tr
                    key={supplier.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold">{supplier.name}</td>
                    <td className="py-3 px-4">{supplier.cuit}</td>
                    <td className="py-3 px-4">{supplier.phone}</td>
                    <td className="py-3 px-4 text-blue-600">{supplier.email}</td>
                    <td className="py-3 px-4">{supplier.category}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingSupplier(supplier);
                            setDialogOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
        onSave={handleSave}
      />
    </>
  );
};

export default Suppliers;