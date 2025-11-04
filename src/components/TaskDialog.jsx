import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Tag, Text, MapPin } from 'lucide-react';

const TaskDialog = ({ open, onOpenChange, task, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    deadline: new Date().toISOString().split('T')[0],
    status: 'Pendiente',
    venue: 'Rosse Constituyentes'
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        deadline: task.deadline,
        status: task.status,
        venue: task.venue || 'Rosse Constituyentes'
      });
    } else {
      setFormData({
        name: '',
        deadline: new Date().toISOString().split('T')[0],
        status: 'Pendiente',
        venue: 'Rosse Constituyentes'
      });
    }
  }, [task, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-2xl border-t-4 border-pink-500">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800">{task ? 'Editar Tarea' : 'Crear Nueva Tarea'}</DialogTitle>
          <DialogDescription className="text-gray-600">Completa los detalles de la tarea.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">Nombre de la Tarea</Label>
            <div className="relative">
              <Text className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                placeholder="Ej: Preparar decoración..."
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-gray-700 font-medium">Fecha Límite</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sede" className="text-gray-700 font-medium">Sede</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="sede"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full pl-10 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none"
                required
              >
                <option value="Rosse Constituyentes">Rosse Constituyentes</option>
                <option value="Rosse Illia">Rosse Illia</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-700 font-medium">Estado</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full pl-10 h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none"
              >
                <option value="En Progreso">En Progreso</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white font-semibold transition-all shadow-md hover:shadow-lg">
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;