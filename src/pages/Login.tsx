import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Building2, Info, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [userType, setUserType] = useState<'agent' | 'agency'>('agent');
  const { login, loginWithEmail, resetPassword } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('O email é obrigatório.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Por favor, insira um email válido.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('A senha é obrigatória.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
    if (authError) setAuthError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) validatePassword(value);
    if (authError) setAuthError('');
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
      addNotification({
        title: 'Login bem-sucedido',
        message: 'Bem-vindo de volta ao MeuPlace!',
        type: 'success'
      });
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'Não foi possível iniciar sessão com o Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'O login foi cancelado. Por favor, tente novamente.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups para este site.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Este domínio não está autorizado no Firebase. Contate o suporte.';
      }
      
      addNotification({
        title: 'Erro no login',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    
    if (isForgotPassword) {
      if (!isEmailValid) return;
      try {
        await resetPassword(email);
        setResetSent(true);
        addNotification({
          title: 'Email enviado',
          message: 'Verifique a sua caixa de entrada para redefinir a senha.',
          type: 'success'
        });
      } catch (error: any) {
        setAuthError('Não foi possível enviar o email de redefinição. Verifique se o email está correto.');
      }
      return;
    }

    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    try {
      await loginWithEmail(email, password);
      addNotification({
        title: 'Login bem-sucedido',
        message: 'Bem-vindo de volta ao MeuPlace!',
        type: 'success'
      });
      navigate('/');
    } catch (error: any) {
      if (error.message === 'email-not-verified') {
        navigate('/verify-email', { state: { email } });
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        if (email.toLowerCase().endsWith('@gmail.com')) {
          setAuthError('Email ou Senha Incorretos. Se você criou sua conta com o Google, use o botão "Entrar com Google" abaixo.');
        } else {
          setAuthError('Email ou Senha Incorretos. Verifique suas credenciais ou use o link "Esqueceu a senha?".');
        }
      } else {
        setAuthError('Ocorreu um erro ao entrar. Por favor, tente novamente mais tarde.');
        console.error("Login error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" 
          alt="Luxury Real Estate" 
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays to ensure text readability and add a premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-brand-purple/90" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl rotate-3 transition-transform hover:rotate-6 shadow-brand-green/20">
            <User className="h-8 w-8 text-brand-green" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          {isForgotPassword ? 'Recuperar senha' : 'Acesso Exclusivo'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300 drop-shadow-md">
          {isForgotPassword 
            ? 'Insira o seu email para receber um link de redefinição.' 
            : 'Faça login para aceder à sua área de gestão imobiliária.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-2xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white">
          
          {resetSent ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium mb-6">
                Email de redefinição enviado com sucesso! Verifique sua caixa de entrada.
              </div>
              <Button 
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSent(false);
                  setAuthError('');
                }} 
                className="w-full bg-brand-green hover:bg-brand-green-hover text-white rounded-xl h-12 font-medium"
              >
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center font-medium">
                  {authError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">
                  <Input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`${emailError ? 'border-red-500' : 'border-gray-200 focus:border-brand-green'} rounded-xl h-11 bg-white/50 backdrop-blur-sm transition-all duration-200`}
                    placeholder="seu@email.com"
                  />
                  {emailError && <p className="mt-1 text-sm text-red-600 font-medium">{emailError}</p>}
                </div>
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Palavra-passe</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsForgotPassword(true);
                        setAuthError('');
                        setEmailError('');
                        setPasswordError('');
                      }} 
                      className="text-sm font-semibold text-brand-green hover:text-brand-green-hover transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      className={`${passwordError ? 'border-red-500' : 'border-gray-200 focus:border-brand-green'} pr-10 rounded-xl h-11 bg-white/50 backdrop-blur-sm transition-all duration-200`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-purple transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                    {passwordError && <p className="mt-1 text-sm text-red-600 font-medium">{passwordError}</p>}
                  </div>
                </div>
              )}

              <div>
                <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white rounded-xl h-12 font-medium text-base shadow-lg shadow-brand-green/25 transition-all hover:-translate-y-0.5">
                  {isForgotPassword ? 'Enviar Link de Recuperação' : 'Entrar'}
                </Button>
              </div>
              
              {isForgotPassword && (
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setAuthError('');
                      setEmailError('');
                    }} 
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Voltar ao Login
                  </button>
                </div>
              )}
            </form>
          )}

          {!isForgotPassword && !resetSent && (
            <>
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/95 text-gray-500 font-medium">Ou aceda com</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex justify-center py-6 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all focus:ring-2 focus:ring-brand-green/20"
                  >
                    <svg className="w-5 h-5 mr-3" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continuar com Google
                  </Button>
                </div>
              </div>
              
              <div className="mt-8 text-center bg-gray-50/50 py-4 rounded-xl -mx-4 -mb-4 mt-8 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Ainda não tem conta?{' '}
                  <Link to="/register" className="font-semibold text-brand-green hover:text-brand-green-hover transition-colors">
                    Criar conta
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
