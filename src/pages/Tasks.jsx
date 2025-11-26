import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Building2, Plus, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskList from '@/components/TaskList';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const VENUES = [
  { id: 'constituyentes', name: 'Rosse Constituyentes', dbName: 'Rosse Constituyentes' },
  { id: 'illia', name: 'Rosse Illia', dbName: 'Rosse Illia' }
];

const Tasks = ({ user }) => {
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        // toast({
        //   title: "Error",
        //   description: `No se pudieron cargar las tareas: ${error.message}`,
        //   variant: "destructive",
        // });
        return;
      }

      console.log('Tasks data received:', data);

      // Obtener conteo de comentarios para cada tarea
      const { data: commentsData } = await supabase
        .from('comentarios')
        .select('tarea_id');

      const commentsCountByTask = {};
      if (commentsData) {
        commentsData.forEach(comment => {
          commentsCountByTask[comment.tarea_id] = (commentsCountByTask[comment.tarea_id] || 0) + 1;
        });
      }

      // Obtener conteo de archivos para cada tarea
      const { data: filesData } = await supabase
        .from('archivos_tareas')
        .select('tarea_id');

      const filesCountByTask = {};
      if (filesData) {
        filesData.forEach(file => {
          filesCountByTask[file.tarea_id] = (filesCountByTask[file.tarea_id] || 0) + 1;
        });
      }

      // Mapear campos de BD a estructura del frontend y agrupar por sede
      const mappedTasks = data.map(task => ({
        id: task.id,
        name: task.titulo,
        description: task.descripcion || '',
        deadline: task.vencimiento,
        status: task.estado,
        venue: task.sede,
        userId: task.usuario_id,
        comments: Array(commentsCountByTask[task.id] || 0).fill(null), // Array con la cantidad correcta
        files: Array(filesCountByTask[task.id] || 0).fill(null) // Array con la cantidad correcta
      }));

      console.log('Mapped tasks:', mappedTasks);
      console.log('VENUES:', VENUES);

      // Agrupar por sede
      const tasksByVenue = {};
      VENUES.forEach(venue => {
        tasksByVenue[venue.id] = mappedTasks.filter(task => task.venue === venue.dbName);
        console.log(`Tasks for ${venue.id} (${venue.dbName}):`, tasksByVenue[venue.id]);
      });

      console.log('Final tasks by venue:', tasksByVenue);
      setTasks(tasksByVenue);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      toast({
        title: "Error", 
        description: "Error inesperado al cargar las tareas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskUpdate = (venueId, updatedTasks) => {
    console.log('handleTaskUpdate called:', { venueId, updatedTasks });
    // Solo actualizar el estado local por ahora
    const newTasks = { ...tasks, [venueId]: updatedTasks };
    console.log('New tasks state:', newTasks);
    setTasks(newTasks);
  };

  return (
    <>
      <Helmet>
        <title>Tareas por Sede - Rosse Vita Eventos</title>
        <meta name="description" content="Gestiona las tareas de cada sede" />
      </Helmet>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Tareas</h2>
          <p className="text-gray-600 mt-1">Organiza, colabora y finaliza tareas por sede.</p>
        </div>

        <Tabs defaultValue="constituyentes" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            {VENUES.map(venue => (
              <TabsTrigger 
                key={venue.id} 
                value={venue.id}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {venue.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {VENUES.map(venue => (
            <TabsContent key={venue.id} value={venue.id}>
              <TaskList
                venueName={venue.name}
                tasks={tasks[venue.id] || []}
                onUpdate={(updatedTasks) => handleTaskUpdate(venue.id, updatedTasks)}
                currentUser={user}
              />
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </>
  );
};

export default Tasks;