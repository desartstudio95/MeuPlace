import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { playNotificationSound } from '@/utils/sound';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingScreen } from '@/components/LoadingScreen';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [contactInfo, setContactInfo] = useState({
    contactPhone: '+258 84 123 4567',
    contactEmail: 'contacto@meuplace.co.mz',
    contactAddress: 'Maputo, Moçambique',
    contactHours: 'Segunda a Sexta, 8h às 18h'
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'pages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactInfo(prev => ({
            ...prev,
            contactPhone: data.contactPhone || prev.contactPhone,
            contactEmail: data.contactEmail || prev.contactEmail,
            contactAddress: data.contactAddress || prev.contactAddress,
            contactHours: data.contactHours || prev.contactHours
          }));
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    // Only allows numbers and an optional '+' at the beginning
    const re = /^\+?[0-9\s]+$/;
    return re.test(phone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (name === 'email') {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    if (name === 'phone') {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasErrors = false;
    const newErrors = { email: '', phone: '' };

    // Validate email
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor, insira um endereço de email válido.';
      hasErrors = true;
    }

    // Validate phone (if provided, as it might be optional or we can make it required)
    // Assuming we added a phone field to the form data
    if ((formData as any).phone && !validatePhone((formData as any).phone)) {
      newErrors.phone = 'O telefone deve conter apenas números e o código do país (+).';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Simulate API call
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    playNotificationSound();
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Fale Conosco</h1>
        <p className="mt-4 text-lg text-gray-600">
          Tem alguma dúvida ou sugestão? Estamos aqui para ajudar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Phone className="h-6 w-6 text-brand-green" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Telefone</h3>
              <p className="mt-1 text-gray-600">{contactInfo.contactPhone}</p>
              <p className="text-gray-600">{contactInfo.contactHours}</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Mail className="h-6 w-6 text-brand-green" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Email</h3>
              <p className="mt-1 text-gray-600">{contactInfo.contactEmail}</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <MapPin className="h-6 w-6 text-brand-green" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                {contactInfo.contactAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
          {isSubmitted ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 animate-in fade-in duration-300">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Mensagem Enviada!</h3>
              <p className="text-gray-600 mt-2 text-center px-6">
                Obrigado pelo contato. Responderemos o mais breve possível.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <div className="mt-1">
                  <Input 
                    type="text" 
                    name="name" 
                    id="name" 
                    required 
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <Input 
                    type="email" 
                    name="email" 
                    id="email" 
                    required 
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <div className="mt-1 relative">
                  <Input 
                    type="tel" 
                    name="phone" 
                    id="phone" 
                    required 
                    placeholder="+258 84 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.phone && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600" id="phone-error">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Mensagem
                </label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="shadow-sm focus:ring-brand-green focus:border-brand-green block w-full sm:text-sm border-gray-300 rounded-md p-2 border focus:outline-none focus:ring-2 focus:ring-offset-2"
                    placeholder="Como podemos ajudar?"
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
                  Enviar Mensagem
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
