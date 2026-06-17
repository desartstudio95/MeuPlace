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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-gray-900">Fale Conosco</h1>
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

          <div className="pt-6 border-t border-gray-200">
            <a 
              href={`https://wa.me/${contactInfo.contactPhone.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar no WhatsApp
            </a>
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
