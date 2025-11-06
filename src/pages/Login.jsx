
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Login = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (!error) {
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Inicio de sesión exitoso.",
          className: 'bg-green-50 border-green-200 text-green-800'
        });
      }
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Hubo un problema al iniciar sesión.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Lista de emails permitidos
      const adminEmails = ['francoeromero.m@gmail.com','eventosrossevita@gmail.com'];
      const usuarioEmails = [
        'parastream01@gmail.com',
        'romerofranco3474@gmail.com',
        
      ];
      
      const allAllowedEmails = [...adminEmails, ...usuarioEmails];
      const emailLower = email.toLowerCase();
      
      // Verificar si el email está permitido
      if (!allAllowedEmails.includes(emailLower)) {
        toast({
          title: "Email no autorizado",
          description: "Este email no tiene permisos para registrarse.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Determinar rol basado en el email
      const isAdmin = adminEmails.includes(emailLower);
      
      const { error } = await signUp(email, password, {
        data: {
          nombre: name,
          rol: isAdmin ? 'admin' : 'employee'
        }
      });
      
      if (!error) {
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "Revisa tu email para confirmar tu cuenta.",
          className: 'bg-green-50 border-green-200 text-green-800'
        });
        setAuthMode('login'); // Cambiar a modo login después del registro
      }
    } catch (error) {
      toast({
        title: "Error en el registro",
        description: "Hubo un problema al crear la cuenta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <>
      <Helmet>
        <title>{authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'} - Rosse Vita Eventos</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200/50 overflow-hidden">
            <div className="flex justify-center mb-6">
              <img 
                src="https://blogger.googleusercontent.com/img/a/AVvXsEiLjXSEEYTWugcR8F-Nm1FfBTZVY1hjfvRrQUK1sWxCGuxtKHgpsa85Om7uCvcsmZ9LQp9TVzMM7OiE_JjXVbISJuXw6D4EhMIQujIS96qHTADGcbZmx0VkGocywIQtbsci7FOFmr58pSaF8Cnt_9TFUGS6OQSO0lpE8a2sL-uaa8woFOliXjHUuuC4cpVd"
                alt="Rosse Vita Eventos Logo"
                className="h-20 w-auto"
              />
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex justify-center bg-pink-50 rounded-lg p-1 mb-8">
              <button onClick={() => setAuthMode('login')} className={cn("w-1/2 py-2 rounded-md text-sm font-medium transition-colors", authMode === 'login' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:bg-pink-100')}>
                Iniciar sesión
              </button>
              <button onClick={() => setAuthMode('signup')} className={cn("w-1/2 py-2 rounded-md text-sm font-medium transition-colors", authMode === 'signup' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:bg-pink-100')}>
                Registrarse
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.form
                key={authMode}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={authMode === 'login' ? handleLogin : handleSignup}
                className="space-y-6"
              >
                {authMode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" required />
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" required />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                <Button type="submit" className="w-full text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
