import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Link as LinkIcon, Image as ImageIcon, FileText, File, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';

const getFileIcon = (url) => {
  if (!url) return <File className="h-6 w-6 text-gray-500" />;
  const extension = url.split('.').pop().toLowerCase().split('?')[0];
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return <ImageIcon className="h-6 w-6 text-pink-500" />;
  }
  if (extension === 'pdf') {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  return <File className="h-6 w-6 text-gray-500" />;
};

const getStatusInfo = (status) => {
    switch (status) {
      case 'Completada': return { text: 'Completada', variant: 'success' };
      case 'Cancelada': return { text: 'Cancelada', variant: 'destructive' };
      default: return { text: 'En Progreso', variant: 'default' };
    }
};

const TaskDetailDialog = ({ open, onOpenChange, task, onUpdate, currentUser }) => {
  const [comment, setComment] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { toast } = useToast();

  // Cargar comentarios de Supabase
  const fetchComments = async () => {
    if (!task?.id || !open) return;
    
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('comentarios')
        .select(`
          id,
          mensaje,
          fecha_creacion,
          usuario_id
        `)
        .eq('tarea_id', task.id)
        .order('fecha_creacion', { ascending: true });

      if (error) throw error;

      const formattedComments = data?.map(comment => ({
        id: comment.id,
        text: comment.mensaje,
        author: 'Usuario', // Por ahora usar un nombre genérico, podemos mejorarlo después
        timestamp: comment.fecha_creacion
      })) || [];

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los comentarios: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingComments(false);
    }
  };

  // Cargar archivos de Supabase
  const fetchFiles = async () => {
    if (!task?.id || !open) return;
    
    try {
      setLoadingFiles(true);
      const { data, error } = await supabase
        .from('archivos_tareas')
        .select(`
          id,
          nombre_archivo,
          url_archivo,
          tipo,
          fecha_subida
        `)
        .eq('tarea_id', task.id)
        .order('fecha_subida', { ascending: false });

      if (error) throw error;

      const formattedFiles = data?.map(file => ({
        id: file.id,
        name: file.nombre_archivo,
        url: file.url_archivo,
        type: file.tipo,
        uploadedBy: 'Usuario', // Por ahora usar un nombre genérico
        timestamp: file.fecha_subida
      })) || [];

      setFiles(formattedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los archivos: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchFiles();
  }, [task?.id, open]);

  if (!task) return null;

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      // Guardar en Supabase
      const { data, error } = await supabase
        .from('comentarios')
        .insert([{
          tarea_id: task.id,
          usuario_id: currentUser?.id || null,
          mensaje: comment.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      // Crear comentario para el estado local
      const newComment = {
        id: data.id,
        text: comment,
        author: currentUser?.nombre || currentUser?.name || currentUser?.email || 'Usuario Anónimo',
        timestamp: data.fecha_creacion
      };
      
      // Actualizar estado local de comentarios
      setComments(prev => [...prev, newComment]);
      
      setComment('');
      toast({ title: "Comentario agregado", description: "Tu comentario ha sido publicado." });

    } catch (error) {
      console.error('Error saving comment:', error);
      toast({ 
        title: "Error", 
        description: `No se pudo guardar el comentario: ${error.message}`,
        variant: "destructive" 
      });
    }
  };

  const handleAddFile = async () => {
    if (!fileUrl.trim()) return;
    try {
      new URL(fileUrl);
    } catch (_) {
      toast({ title: "URL Inválida", description: "Por favor ingresa una URL válida.", variant: "destructive" });
      return;
    }
    
    try {
      // Guardar en Supabase
      const fileName = fileUrl.split('/').pop().split('?')[0] || 'Archivo';
      const { data, error } = await supabase
        .from('archivos_tareas')
        .insert([{
          tarea_id: task.id,
          nombre_archivo: fileName,
          url_archivo: fileUrl,
          tipo: 'url' // Indicar que es una URL externa
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      const newFile = {
        id: data.id,
        name: fileName,
        url: fileUrl,
        type: 'url',
        uploadedBy: 'Usuario',
        timestamp: data.fecha_subida
      };
      
      setFiles(prev => [newFile, ...prev]);
      setFileUrl('');
      toast({ title: "Archivo adjuntado", description: "La URL ha sido agregada a la tarea." });

    } catch (error) {
      console.error('Error saving file:', error);
      toast({ 
        title: "Error", 
        description: `No se pudo guardar el archivo: ${error.message}`,
        variant: "destructive" 
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar tamaño del archivo (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "Archivo demasiado grande", 
        description: "El archivo debe ser menor a 5MB.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Subir archivo a Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `tasks/${task.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-files') // Asegúrate de crear este bucket en Supabase
        .upload(filePath, file);

      if (uploadError) {
        // Si el bucket no existe, intentar crear URL temporal y guardar solo metadata
        console.warn('Storage upload failed, saving as metadata only:', uploadError);
        
        // Guardar metadata en la tabla archivos_tareas
        const { data, error } = await supabase
          .from('archivos_tareas')
          .insert([{
            tarea_id: task.id,
            nombre_archivo: file.name,
            url_archivo: `local://${file.name}`, // Indicar que es un archivo local
            tipo: file.type || 'application/octet-stream'
          }])
          .select()
          .single();

        if (error) throw error;

        // Actualizar estado local
        const newFile = {
          id: data.id,
          name: file.name,
          url: URL.createObjectURL(file), // URL temporal para preview
          type: file.type,
          uploadedBy: 'Usuario',
          timestamp: data.fecha_subida,
          isLocal: true // Indicar que es archivo local
        };
        
        setFiles(prev => [newFile, ...prev]);
        toast({ 
          title: "Archivo guardado", 
          description: `${file.name} ha sido guardado (sin storage - solo metadata).` 
        });
        
      } else {
        // 2. Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('task-files')
          .getPublicUrl(filePath);

        // 3. Guardar metadata en tabla archivos_tareas
        const { data, error } = await supabase
          .from('archivos_tareas')
          .insert([{
            tarea_id: task.id,
            nombre_archivo: file.name,
            url_archivo: urlData.publicUrl,
            tipo: file.type || 'application/octet-stream'
          }])
          .select()
          .single();

        if (error) throw error;

        // Actualizar estado local
        const newFile = {
          id: data.id,
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          uploadedBy: 'Usuario',
          timestamp: data.fecha_subida
        };
        
        setFiles(prev => [newFile, ...prev]);
        toast({ 
          title: "Archivo subido", 
          description: `${file.name} ha sido subido exitosamente.` 
        });
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ 
        title: "Error al subir archivo", 
        description: `Hubo un problema al subir el archivo: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const statusInfo = getStatusInfo(task.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">{task.name}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500">
             <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
             <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Vence el {format(parseISO(task.deadline), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-3 overflow-hidden">
            <div className="md:col-span-2 flex flex-col overflow-y-auto">
                {/* Comments Section */}
                <div className="p-6 flex-1">
                    <h3 className="font-semibold text-gray-800 mb-4 text-lg">Actividad y Comentarios</h3>
                    <div className="space-y-4">
                        {loadingComments ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">Cargando comentarios...</p>
                            </div>
                        ) : comments?.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">Sé el primero en comentar.</p>
                            </div>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-pink-100 text-pink-600 font-semibold">
                                            {c.author.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <span className="font-medium text-sm text-gray-900">{c.author}</span>
                                            <span className="text-xs text-gray-400" title={format(parseISO(c.timestamp), "Pp", { locale: es })}>
                                                {formatDistanceToNow(parseISO(c.timestamp), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <div className="bg-gray-100 rounded-lg p-3 mt-1">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                 {/* Comment Input */}
                <div className="bg-gray-50 p-4 border-t mt-auto">
                    <div className="flex gap-3 items-start">
                         <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-pink-600 text-white font-semibold">
                                {currentUser?.nombre?.charAt(0) || currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all min-h-[40px] resize-none"
                            rows="1"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                                }
                            }}
                        />
                        <Button onClick={handleAddComment} className="bg-pink-600 hover:bg-pink-700 h-10 w-10 p-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Files Sidebar */}
            <aside className="md:col-span-1 bg-gray-50/70 border-l overflow-y-auto p-6 flex flex-col">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">Archivos Adjuntos</h3>
                <div className="space-y-3 mb-4 flex-1">
                {loadingFiles ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Cargando archivos...</p>
                    </div>
                ) : (!files || files.length === 0) ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col justify-center items-center hover:border-pink-400 hover:bg-pink-50/30 transition-colors">
                        <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-2">No hay archivos adjuntos.</p>
                        <p className="text-xs text-gray-400">Los archivos que subas aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {files.map(f => (
                            <div key={f.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-pink-300 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">{getFileIcon(f.url || f.name)}</div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-pink-600">
                                                {f.name || f.originalName}
                                            </p>
                                            {f.size && (
                                                <span className="text-xs text-gray-400 ml-2">
                                                    {(f.size / 1024 / 1024).toFixed(1)} MB
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-500">Subido por {f.uploadedBy}</p>
                                            {f.timestamp && (
                                                <p className="text-xs text-gray-400">
                                                    {formatDistanceToNow(parseISO(f.timestamp), { addSuffix: true, locale: es })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {f.url && (
                                        <a 
                                            href={f.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 p-2 text-gray-400 hover:text-pink-600 transition-colors"
                                            title="Abrir archivo"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                                {/* Indicador de archivo temporal/subiendo para Supabase */}
                                {f.id?.toString().startsWith('temp_') && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600"></div>
                                        <span>Procesando archivo...</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                </div>
                <div className="mt-auto pt-4 border-t space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Añadir archivo</h4>
                    
                    {/* Subir archivo desde dispositivo */}
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-600">Desde tu dispositivo:</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept="*/*"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex-1 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Paperclip className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                    {isUploading ? 'Subiendo...' : 'Seleccionar archivo'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Añadir por URL */}
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-600">O pegar URL:</label>
                        <div className="flex gap-2 items-center">
                            <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <Input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="https://ejemplo.com/archivo.pdf"
                                className="flex-1 text-xs"
                                disabled={isUploading}
                            />
                            <Button 
                                onClick={handleAddFile} 
                                size="sm" 
                                variant="secondary"
                                disabled={isUploading || !fileUrl.trim()}
                                className="text-xs px-2"
                            >
                                Adjuntar
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;