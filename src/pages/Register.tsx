import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { playNotificationSound } from '@/utils/sound';

export function Register() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'agent' | 'agency'>('agent');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    license: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'O nome é obrigatório.';
        else if (value.trim().length < 3) error = 'O nome deve ter pelo menos 3 caracteres.';
        break;
      case 'email':
        if (!value) error = 'O email é obrigatório.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Por favor, insira um email válido.';
        else {
          const existingEmails = ['admin@meuplace.co.mz', 'teste@teste.com', 'agente@meuplace.co.mz'];
          if (existingEmails.includes(value.toLowerCase())) error = 'Este email já está em uso.';
        }
        break;
      case 'phone':
        if (!value.trim()) error = 'O telefone é obrigatório.';
        break;
      case 'password':
        if (!value) error = 'A senha é obrigatória.';
        else if (value.length < 6) error = 'A senha deve ter pelo menos 6 caracteres.';
        break;
      case 'confirmPassword':
        if (!value) error = 'A confirmação de senha é obrigatória.';
        else if (value !== formData.password) error = 'As senhas não coincidem.';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // If changing password, revalidate confirmPassword if it exists
      if (name === 'password' && newData.confirmPassword) {
        if (value !== newData.confirmPassword) {
          setErrors(prevErrors => ({ ...prevErrors, confirmPassword: 'As senhas não coincidem.' }));
        } else {
          setErrors(prevErrors => ({ ...prevErrors, confirmPassword: '' }));
        }
      }
      return newData;
    });
    
    // Only validate on change if there's already an error (to provide immediate feedback when fixing)
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldsToValidate = ['name', 'email', 'phone', 'password', 'confirmPassword'];
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field as keyof typeof formData])) {
        isValid = false;
      }
    });

    if (!isValid) return;

    // Handle registration logic here
    console.log('Registration attempt:', { ...formData, userType });
    playNotificationSound();
    
    // Simulate successful registration and redirect to pending approval
    navigate('/pending-approval');
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
          
          {/* User Type Toggle */}
          <div className="flex rounded-md bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setUserType('agent')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                userType === 'agent' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Agente
            </button>
            <button
              type="button"
              onClick={() => setUserType('agency')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                userType === 'agency' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Agência
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {userType === 'agent' ? 'Nome Completo' : 'Nome da Agência'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {userType === 'agent' ? (
                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <Building2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={`pl-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder={userType === 'agent' ? 'Seu nome completo' : 'Nome da sua agência'}
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Profissional
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                WhatsApp / Telefone
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={`pl-10 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="+258 84 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                Número de Licença / Registro
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="license"
                  name="license"
                  type="text"
                  className="pl-10"
                  placeholder="Ex: 12345/AMI"
                  value={formData.license}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Endereço (Opcional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  className="pl-10"
                  placeholder="Cidade, Província"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`pl-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Eu concordo com os <a href="#" className="text-brand-green hover:underline">Termos de Serviço</a> e <a href="#" className="text-brand-green hover:underline">Política de Privacidade</a>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
              >
                Criar Conta
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
