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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center">
            <User className="h-6 w-6 text-brand-green" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isForgotPassword ? 'Recuperar senha' : 'Acesse sua conta'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isForgotPassword 
            ? 'Insira o seu email para receber um link de redefinição de senha.' 
            : 'Faça login para gerir os seus imóveis, resorts ou hotéis'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {resetSent ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm font-medium mb-6">
                Email de redefinição enviado com sucesso! Verifique sua caixa de entrada.
              </div>
              <Button 
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSent(false);
                  setAuthError('');
                }} 
                className="w-full bg-brand-green hover:bg-brand-green-hover text-white"
              >
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center font-medium">
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
                    className={emailError ? 'border-red-500' : ''}
                    placeholder="seu@email.com"
                  />
                  {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                </div>
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsForgotPassword(true);
                        setAuthError('');
                        setEmailError('');
                        setPasswordError('');
                      }} 
                      className="text-sm font-medium text-brand-green hover:text-brand-green-hover"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="mt-1 relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      className={`${passwordError ? 'border-red-500' : ''} pr-10`}
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
                    {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
                  </div>
                </div>
              )}

              <div>
                <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
                  {isForgotPassword ? 'Enviar Link' : 'Entrar'}
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
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Voltar ao Login
                  </button>
                </div>
              )}
            </form>
          )}

          {!isForgotPassword && !resetSent && (
            <>
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
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex justify-center py-6 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    Entrar com Google
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Ainda não tem conta?{' '}
                  <Link to="/register" className="font-medium text-brand-green hover:text-brand-green-hover">
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
