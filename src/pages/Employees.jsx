import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import EmployeeDialog from '@/components/EmployeeDialog';

const Employees = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      // Mapear los campos de BD a los campos del frontend
      const mappedEmployees = data.map(employee => ({
        id: employee.id,
        name: employee.nombre,
        dni: employee.dni,
        position: employee.cargo,
        department: employee.departamento,
        email: employee.email
      }));

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // toast({ 
      //   title: "Error", 
      //   description: "No se pudieron cargar los empleados", 
      //   variant: "destructive" 
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (employeeData) => {
    try {
      // Mapear campos del frontend a la BD
      const dbData = {
        nombre: employeeData.name,
        dni: employeeData.dni,
        cargo: employeeData.position,
        departamento: employeeData.department,
        email: employeeData.email
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('empleados')
          .update(dbData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        toast({ title: "Empleado actualizado exitosamente" });
      } else {
        const { error } = await supabase
          .from('empleados')
          .insert([dbData]);

        if (error) throw error;
        toast({ title: "Empleado agregado exitosamente" });
      }

      // Recargar empleados desde la BD
      await fetchEmployees();
      setDialogOpen(false);
      setEditingEmployee(null);

    } catch (error) {
      console.error('Error saving employee:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo guardar el empleado", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recargar empleados
      await fetchEmployees();
      toast({ title: 'Empleado eliminado', description: 'El empleado ha sido eliminado correctamente.' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar el empleado", 
        variant: "destructive" 
      });
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.dni.includes(searchTerm)
  );

  return (
    <>
      <Helmet>
        <title>Empleados - Rosse Vita Eventos</title>
        <meta name="description" content="Gestiona el personal de la empresa" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Empleados</h2>
            <p className="text-gray-600 mt-1">Gestiona el personal de la empresa</p>
          </div>
          <Button
            onClick={() => {
              setEditingEmployee(null);
              setDialogOpen(true);
            }}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
              <option>Todos</option>
              <option>Ventas</option>
              <option>Administración</option>
              <option>TI</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">DNI</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cargo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Departamento</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">{employee.name}</td>
                    <td className="py-3 px-4">{employee.dni}</td>
                    <td className="py-3 px-4">{employee.position}</td>
                    <td className="py-3 px-4">{employee.department}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(employee);
                            setDialogOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
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

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        onSave={handleSave}
      />
    </>
  );
};

export default Employees;