
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, CalendarDays, List, Tag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import EventDialog from '@/components/EventDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Mapear los campos de BD a los campos del frontend
      const mappedEvents = data.map(event => ({
        id: event.id,
        name: event.nombre,
        date: new Date(event.fecha),
        type: event.tipo,
        price: event.precio,
        description: event.descripcion,
        createdBy: event.creado_por,
        createdAt: event.creado_en
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      // toast({ 
      //   title: "Error", 
      //   description: "No se pudieron cargar los eventos", 
      //   variant: "destructive" 
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      // Mapear campos del frontend a la BD
      const dbData = {
        nombre: eventData.name,
        tipo: eventData.type,
        fecha: eventData.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
        precio: eventData.price,
        descripcion: eventData.description || '',
        creado_por: user?.id || user?.email
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('eventos')
          .update(dbData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({ title: 'Evento actualizado', description: `El evento "${eventData.name}" ha sido actualizado.` });
      } else {
        const { error } = await supabase
          .from('eventos')
          .insert([dbData]);

        if (error) throw error;
        toast({ title: 'Evento creado', description: `El evento "${eventData.name}" ha sido agendado.` });
      }

      // Recargar eventos desde la BD
      await fetchEvents();
      setDialogOpen(false);
      setEditingEvent(null);

    } catch (error) {
      console.error('Error saving event:', error);
      // toast({ 
      //   title: "Error", 
      //   description: "No se pudo guardar el evento", 
      //   variant: "destructive" 
      // });
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recargar eventos
      await fetchEvents();
      toast({ title: 'Evento eliminado', description: 'El evento ha sido eliminado correctamente.' });
    } catch (error) {
      console.error('Error deleting event:', error);
      // toast({ 
      //   title: "Error", 
      //   description: "No se pudo eliminar el evento", 
      //   variant: "destructive" 
      // });
    }
  };

  const bookedDays = events.map(e => e.date);

  return (
    <>
      <Helmet>
        <title>Eventos - Rosse Vita Eventos</title>
        <meta name="description" content="Gestiona y visualiza los eventos agendados." />
      </Helmet>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveEvent}
        event={editingEvent}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Agenda de Eventos</h2>
            <p className="text-gray-600 mt-1">Organiza, visualiza y gestiona todos tus eventos.</p>
          </div>
          <Button onClick={() => { setEditingEvent(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Agendar Evento
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-lg border"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
             <h3 className="font-bold text-lg text-center mb-2 flex items-center justify-center gap-2">
                <CalendarDays className="h-5 w-5 text-pink-600" />
                Calendario de Eventos
             </h3>
             <DayPicker
                mode="multiple"
                min={1}
                selected={bookedDays}
                locale={es}
                showOutsideDays
                fixedWeeks
                className="flex justify-center"
                classNames={{
                  day_selected: "bg-pink-600 text-white hover:bg-pink-700 focus:bg-pink-700",
                  day_today: "font-bold text-pink-600"
                }}
             />
          </motion.div>

          <motion.div 
            className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <List className="h-5 w-5 text-pink-600" />
                Próximos Eventos
            </h3>
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead><Tag className="inline h-4 w-4 mr-1" />Tipo</TableHead>
                      <TableHead><CalendarDays className="inline h-4 w-4 mr-1" />Fecha</TableHead>
                      <TableHead><DollarSign className="inline h-4 w-4 mr-1" />Precio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length > 0 ? (
                      events
                        .sort((a,b) => a.date - b.date)
                        .map(event => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.name}</TableCell>
                            <TableCell>{event.type}</TableCell>
                            <TableCell>{format(event.date, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>${event.price.toLocaleString('es-AR')}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay eventos agendados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
             </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Events;
