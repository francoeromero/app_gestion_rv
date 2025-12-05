
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, CalendarDays, List, Tag, DollarSign, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const eventTypes = ["Casamiento", "Cumpleaños", "Corporativo", "Aniversario", "Otro"];

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [tempEventData, setTempEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && (editingId === 'new' || editingId !== null)) {
        handleCancel();
      }
    };

    const handleClickOutside = (e) => {
      if (editingId !== null) {
        // Verificar si el clic fue dentro de la fila de edición
        const editingRow = e.target.closest('tr');
        const isEditingRow = editingRow?.classList.contains('bg-pink-50') || editingRow?.classList.contains('bg-blue-50');
        
        if (!isEditingRow) {
          handleCancel();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingId]);

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
        // Parsear fecha asegurando que sea mediodía local para evitar desfases de zona horaria
        date: new Date(event.fecha + 'T12:00:00'),
        type: event.tipo,
        price: event.precio,
        description: event.descripcion,
        createdBy: event.creado_por,
        createdAt: event.creado_en
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ 
        title: "Error", 
        description: "No se pudieron cargar los eventos", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInline = async () => {
    if (!tempEventData.name || !tempEventData.price) {
        toast({ title: "Error", description: "Nombre y precio son requeridos", variant: "destructive" });
        return;
    }

    try {
      const dbData = {
        nombre: tempEventData.name,
        tipo: tempEventData.type,
        fecha: format(tempEventData.date, 'yyyy-MM-dd'),
        precio: parseFloat(tempEventData.price),
        descripcion: tempEventData.description || '',
        creado_por: user?.id || user?.email
      };

      if (editingId === 'new') {
         const { error } = await supabase.from('eventos').insert([dbData]);
         if (error) throw error;
         toast({ title: 'Evento creado', description: `El evento "${tempEventData.name}" ha sido agendado.` });
      } else {
         const { error } = await supabase.from('eventos').update(dbData).eq('id', editingId);
         if (error) throw error;
         toast({ title: 'Evento actualizado', description: `El evento "${tempEventData.name}" ha sido actualizado.` });
      }

      await fetchEvents();
      setEditingId(null);
      setTempEventData(null);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: "Error", description: "No se pudo guardar el evento", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempEventData(null);
  };

  const handleDayClick = (day) => {
      setEditingId('new');
      setTempEventData({
          name: '',
          type: eventTypes[0],
          date: day,
          price: '3000000',
          description: ''
      });
  };

  const handleEditClick = (event) => {
      setEditingId(event.id);
      setTempEventData({
          name: event.name,
          type: event.type,
          date: event.date,
          price: event.price,
          description: event.description
      });
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
  const pendingDay = editingId === 'new' && tempEventData ? [tempEventData.date] : [];

  return (
    <>
      <Helmet>
        <title>Eventos - Rosse Vita Eventos</title>
        <meta name="description" content="Gestiona y visualiza los eventos agendados." />
      </Helmet>

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-lg border h-[400px] flex flex-col"
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
                onDayClick={handleDayClick}
                locale={es}
                showOutsideDays
                fixedWeeks
                className="flex justify-center"
                modifiers={{ pending: pendingDay }}
                modifiersClassNames={{
                  pending: "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }}
                classNames={{
                  day_selected: "bg-pink-600 text-white hover:bg-pink-700 focus:bg-pink-700",
                  day_today: "font-bold text-pink-600"
                }}
             />
          </motion.div>

          <motion.div 
            className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border h-[400px] flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <List className="h-5 w-5 text-pink-600" />
                Próximos Eventos
            </h3>
             <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader>

                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead><Tag className="inline h-4 w-4 mr-1" />Tipo</TableHead>
                      <TableHead><CalendarDays className="inline h-4 w-4 mr-1" />Fecha</TableHead>
                      <TableHead><DollarSign className="inline h-4 w-4 mr-1" />Precio</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {editingId === 'new' && (
                      <TableRow className="bg-pink-50">
                        <TableCell>
                          <Input 
                            value={tempEventData.name} 
                            onChange={(e) => setTempEventData({...tempEventData, name: e.target.value})} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                            placeholder="Nombre"
                            className="h-8"
                          />
                          <Input 
                            value={tempEventData.description} 
                            onChange={(e) => setTempEventData({...tempEventData, description: e.target.value})} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                            placeholder="Descripción"
                            className="h-8 mt-1 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={tempEventData.type} 
                            onValueChange={(val) => setTempEventData({...tempEventData, type: val})}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {format(tempEventData.date, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            value={tempEventData.price} 
                            onChange={(e) => setTempEventData({...tempEventData, price: e.target.value})} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                            placeholder="Precio"
                            className="h-8 w-24"
                          />
                          <div className="flex gap-1 mt-1">
                            <Button variant="ghost" size="icon" onClick={handleSaveInline} className="text-green-600 hover:text-green-700 h-6 w-6">
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancel} className="text-red-500 hover:text-red-600 h-6 w-6">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {events.length > 0 ? (
                      events
                        .sort((a,b) => a.date - b.date)
                        .map(event => (
                          editingId === event.id ? (
                            <TableRow key={event.id} className="bg-blue-50">
                              <TableCell>
                                <Input 
                                  value={tempEventData.name} 
                                  onChange={(e) => setTempEventData({...tempEventData, name: e.target.value})} 
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                                  className="h-8"
                                />
                                <Input 
                                  value={tempEventData.description} 
                                  onChange={(e) => setTempEventData({...tempEventData, description: e.target.value})} 
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                                  placeholder="Descripción"
                                  className="h-8 mt-1 text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={tempEventData.type} 
                                  onValueChange={(val) => setTempEventData({...tempEventData, type: val})}
                                >
                                  <SelectTrigger className="h-8 w-[110px]">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="date"
                                  value={tempEventData.date ? format(tempEventData.date, 'yyyy-MM-dd') : ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const newDate = new Date(e.target.value + 'T12:00:00');
                                      if (!isNaN(newDate.getTime())) {
                                        setTempEventData({...tempEventData, date: newDate});
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                                  className="h-8 w-[125px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number"
                                  value={tempEventData.price} 
                                  onChange={(e) => setTempEventData({...tempEventData, price: e.target.value})} 
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                                  className="h-8 w-20"
                                />
                              </TableCell>
                            </TableRow>
                          ) : (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">
                                {event.name}
                                {event.description && <div className="text-xs text-gray-500 mt-1">{event.description}</div>}
                              </TableCell>
                              <TableCell>{event.type}</TableCell>
                              <TableCell>{format(event.date, 'dd/MM/yyyy')}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-between">
                                  <span>${event.price.toLocaleString('es-AR')}</span>
                                  <div className="flex gap-1 ml-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)} className="h-6 w-6">
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-6 w-6" onClick={() => handleDelete(event.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        ))
                    ) : (
                      !editingId && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No hay eventos agendados.
                          </TableCell>
                        </TableRow>
                      )
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
