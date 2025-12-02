
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarPlus as CalendarIcon, Text, Tag, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const eventTypes = ["Casamiento", "Cumpleaños", "Corporativo", "Aniversario", "Otro"];

const EventDialog = ({ open, onOpenChange, onSave, event }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(null);
  const [type, setType] = useState(eventTypes[0]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (event) {
      setName(event.name);
      
      // Asegurar que la fecha se interprete correctamente
      let parsedDate = null;
      if (event.date) {
        if (event.date instanceof Date) {
          parsedDate = event.date;
        } else if (typeof event.date === 'string') {
          // Solución robusta para problemas de zona horaria
          // Si el formato es YYYY-MM-DD, construimos la fecha localmente componente por componente
          if (/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
            const [year, month, day] = event.date.split('-').map(Number);
            // Crear fecha a las 12:00 del mediodía para evitar problemas de cambio de día por pocas horas
            parsedDate = new Date(year, month - 1, day, 12, 0, 0);
          } else {
            // Para otros formatos (ISO completo), parseamos normal
            parsedDate = new Date(event.date);
            
            // Si es una fecha UTC a medianoche (común en bases de datos), ajustamos para que se vea el mismo día
            // Verificamos si al pasar a local cambia el día respecto al string original
            const dayInString = parseInt(event.date.substring(8, 10));
            if (!isNaN(dayInString) && parsedDate.getDate() !== dayInString) {
               // Si hay discrepancia de día, asumimos problema de timezone y sumamos el offset
               parsedDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
            }
          }
        }
      }
      setDate(parsedDate);
      
      setType(event.type);
      setPrice(event.price);
      setDescription(event.description || '');
    } else {
      setName('');
      setDate(null);
      setType(eventTypes[0]);
      setPrice('');
      setDescription('');
    }
  }, [event, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !date || !price) return;
    onSave({ name, date, type, price: parseFloat(price), description });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onOpenChange(false);
      else onOpenChange(true);
    }}>
      <DialogContent className="sm:max-w-[425px] p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
            {event ? 'Editar Evento' : 'Agendar Nuevo Evento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Evento</Label>
            <div className="relative">
              <Text className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Fecha del Evento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Evento</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full pl-9 h-10 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background"
              >
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Precio (AR$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-9" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe los detalles del evento, requisitos especiales, etc."
                className="w-full pl-9 pr-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[80px] resize-none"
                rows="3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">
              {event ? 'Guardar Cambios' : 'Agendar Evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
