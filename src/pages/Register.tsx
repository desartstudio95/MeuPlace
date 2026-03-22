import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Upload, Eye, EyeOff } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { login, registerWithEmail } = useAuth();
  const { addNotification } = useNotifications();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, photo: 'Por favor, selecione uma imagem.' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, photo: 'A imagem deve ter no máximo 5MB.' });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors({ ...errors, photo: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = 'O nome é obrigatório.';
    if (!email) newErrors.email = 'O email é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email inválido.';
    
    if (!password) newErrors.password = 'A senha é obrigatória.';
    else if (password.length < 6) newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    
    if (password !== repeatPassword) newErrors.repeatPassword = 'As senhas não coincidem.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleRegister = async () => {
    try {
      await login(role);
      addNotification({
        title: 'Registro bem-sucedido',
        message: 'A sua conta foi criada. Aguarde a aprovação de um administrador para ter acesso completo.',
        type: 'success'
      });
      navigate('/');
    } catch (error) {
      addNotification({
        title: 'Erro no registro',
        message: 'Não foi possível criar a conta com o Google.',
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setUserExists(false);

    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      await registerWithEmail(email, password, name, role, photoFile);
      navigate('/verify-email', { state: { email } });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setUserExists(true);
      } else {
        setAuthError('Ocorreu um erro ao criar a conta. Tente novamente.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center">
            <User className="h-6 w-6 text-brand-green" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-brand-green hover:text-brand-green-hover">
            Entrar
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {userExists && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm text-center font-medium">
                User already exists.{' '}
                <Link to="/login" className="underline font-bold hover:text-yellow-900">
                  Sign in?
                </Link>
              </div>
            )}

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center font-medium">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
              <div className="mt-1">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="user">Usuário (Comprador/Inquilino)</option>
                  <option value="agent">Agente Imobiliário / Agência</option>
                  <option value="resort">Resort / Hotel</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Foto de Perfil (Opcional)</label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-full w-full text-gray-300 p-2" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20"
                  />
                  {errors.photo && <p className="mt-1 text-sm text-red-600">{errors.photo}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <div className="mt-1">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors({...errors, name: ''}); }}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Seu nome"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: ''}); setUserExists(false); }}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({...errors, password: ''}); }}
                  className={`${errors.password ? 'border-red-500' : ''} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Repetir Password</label>
              <div className="mt-1 relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={repeatPassword}
                  onChange={(e) => { setRepeatPassword(e.target.value); setErrors({...errors, repeatPassword: ''}); }}
                  className={`${errors.repeatPassword ? 'border-red-500' : ''} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                {errors.repeatPassword && <p className="mt-1 text-sm text-red-600">{errors.repeatPassword}</p>}
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white" disabled={isRegistering}>
                {isRegistering ? 'A criar conta...' : 'Criar Conta'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={handleGoogleRegister}
                type="button"
                className="w-full flex justify-center py-6 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Criar conta com Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
