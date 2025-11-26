import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Paperclip, Edit2, Trash2, Calendar, AlertTriangle, CheckCircle, XCircle, CheckSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import TaskDialog from '@/components/TaskDialog';
import TaskDetailDialog from '@/components/TaskDetailDialog';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const TaskList = ({ venueName, tasks, onUpdate, currentUser }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleSave = async (taskData) => {
    try {
      console.log('TaskData received in handleSave:', taskData);
      
      // Mapear datos del frontend a la BD
      const dbTaskData = {
        titulo: taskData.name,
        descripcion: taskData.description || null,
        estado: taskData.status,
        sede: taskData.venue, // Debe ser 'Rosse Constituyentes' o 'Rosse Illia'
        vencimiento: taskData.deadline || null,
        usuario_id: null
      };

      console.log('Mapped dbTaskData for Supabase:', dbTaskData);
      console.log('Specifically, sede value:', dbTaskData.sede);

      if (editingTask) {
        const { error } = await supabase
          .from('tareas')
          .update(dbTaskData)
          .eq('id', editingTask.id);

        if (error) throw error;
        
        toast({ title: "Tarea actualizada exitosamente" });
      } else {
        const { data, error } = await supabase
          .from('tareas')
          .insert([dbTaskData])
          .select()
          .single();

        if (error) throw error;
        
        console.log('Task saved successfully:', data);
        toast({ title: "Tarea agregada exitosamente" });
        
        // Guardar la tarea nueva con su ID real de la base de datos
        taskData.id = data.id;
      }

      // Actualizar lista local
      let updated;
      if (editingTask) {
        updated = tasks.map(t => t.id === editingTask.id ? { ...taskData, comments: t.comments, files: t.files, id: t.id } : t);
      } else {
        // Usar el ID real de Supabase, no uno temporal
        const newTask = { ...taskData, id: taskData.id, comments: [], files: [] };
        updated = [...tasks, newTask];
      }
      
      onUpdate(updated);
      setDialogOpen(false);
      setEditingTask(null);

    } catch (error) {
      console.error('Error saving task:', error);
      toast({ 
        title: "Error", 
        description: `No se pudo guardar la tarea: ${error.message}`,
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log('Deleting task:', id);
      
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updated = tasks.filter(t => t.id !== id);
      onUpdate(updated);
      toast({ title: "Tarea eliminada", variant: 'destructive' });

    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ 
        title: "Error", 
        description: `No se pudo eliminar la tarea: ${error.message}`,
        variant: "destructive" 
      });
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    onUpdate(updated);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Completada': return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' };
      case 'Cancelada': return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
      default: return { icon: AlertTriangle, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    }
  };
  
  // Filtrar tareas por búsqueda 
  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedTasks = [...filteredTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-semibold text-gray-800">{venueName}</h3>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
            <Button
              onClick={() => {
                setEditingTask(null);
                setDialogOpen(true);
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {sortedTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 bg-gray-50 rounded-lg"
            >
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h4 className="mt-4 text-lg font-semibold text-gray-700">
                {searchQuery ? 'No se encontraron tareas' : '¡Todo en orden!'}
              </h4>
              <p className="mt-1 text-gray-500">
                {searchQuery ? 'Intenta con otra búsqueda' : 'No hay tareas pendientes en esta sede.'}
              </p>
            </motion.div>
          ) : (
            <motion.div className="space-y-4">
              {sortedTasks.map((task) => {
                const daysLeft = differenceInDays(parseISO(task.deadline), new Date());
                const StatusIcon = getStatusInfo(task.status).icon;
                const statusColor = getStatusInfo(task.status).color;
                const statusBgColor = getStatusInfo(task.status).bgColor;
                
                let urgencyColor = 'border-gray-200';
                if (daysLeft < 3 && task.status === 'En Progreso') urgencyColor = 'border-red-400';
                else if (daysLeft < 7 && task.status === 'En Progreso') urgencyColor = 'border-yellow-400';

                return (
                  <motion.div
                    layout
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-lg p-4 transition-all shadow-sm hover:shadow-lg border-l-4 ${urgencyColor}`}
                    onClick={() => {
                      setSelectedTask(task);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${statusBgColor}`}>
                            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                          </div>
                          <h4 className="font-semibold text-gray-800 text-lg">{task.name}</h4>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2 pl-10">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>Vence: {format(parseISO(task.deadline), "d MMM, yyyy", { locale: es })}</span>
                            {task.status === 'En Progreso' && (
                              <span className={`font-medium ${daysLeft < 3 ? 'text-red-600' : daysLeft < 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                ({daysLeft >= 0 ? `${daysLeft} días restantes` : 'Vencida'})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            <span>{task.comments?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Paperclip className="h-4 w-4" />
                            <span>{task.files?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setDialogOpen(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSave}
      />

      <TaskDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
        currentUser={currentUser}
      />
    </>
  );
};

export default TaskList;