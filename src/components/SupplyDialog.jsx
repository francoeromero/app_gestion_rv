import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const SupplyDialog = ({ open, onOpenChange, supply, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Papelería',
    quantity: 1,
    totalPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    employeeId: ''
  });

  useEffect(() => {
    if (supply) {
      setFormData({
        name: supply.name || '',
        category: supply.category || 'Papelería',
        quantity: supply.quantity || 1,
        totalPrice: supply.totalPrice || 0,
        purchaseDate: supply.purchaseDate || new Date().toISOString().split('T')[0],
        employeeId: supply.employeeId || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Papelería',
        quantity: 1,
        totalPrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        employeeId: ''
      });
    }
  }, [supply]);

  // Eliminamos el useEffect de cálculo automático ya que ahora totalPrice se ingresa directamente

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{supply ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre del Insumo</Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <Label>Categoría</Label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option>Papelería</option>
              <option>Tecnología</option>
              <option>Limpieza</option>
              <option>Impresión</option>
              <option>Catering</option>
              <option>Decoración</option>
              <option>Sonido</option>
              <option>Iluminación</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad</Label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <Label>Precio Total</Label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <Label>Fecha de Compra</Label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <Label>Empleado ID (opcional)</Label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="ej: 12345678-1234-1234-1234-123456789abc"
            />
            <small className="text-gray-500 mt-1 block">
              Deja vacío o introduce un UUID válido del empleado
            </small>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplyDialog;