import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LOCATIONS, CATEGORIES, Property } from '@/types';
import { Upload, CheckCircle, Star, Zap, Crown, Check, X } from 'lucide-react';
import { playNotificationSound } from '@/utils/sound';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from '@/context/NotificationContext';
import { propertyService } from '@/services/propertyService';

export function AddProperty() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const initialStep = parseInt(searchParams.get('step') || '1');
  const [step, setStep] = useState(initialStep);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAutoApprovedMsg, setIsAutoApprovedMsg] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Check approval status
  useEffect(() => {
    if (userProfile && !userProfile.isApproved) {
      addNotification({
        title: 'Acesso Restrito',
        message: 'Seu cadastro está pendente de aprovação. Você não pode adicionar imóveis no momento.',
        type: 'error'
      });
      navigate('/');
    }
  }, [userProfile, navigate, addNotification]);
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Venda',
    category: 'Apartamento',
    price: '',
    currency: 'MZN',
    description: '',
    location: LOCATIONS[0],
    zone: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    features: [] as string[],
    agentName: '',
    agentPhone: ''
  });

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      setStep(parseInt(stepParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        agentName: userProfile.displayName || '',
        agentPhone: ''
      }));
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const features = prev.features.includes(amenity)
        ? prev.features.filter(f => f !== amenity)
        : [...prev.features, amenity];
      return { ...prev, features };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadError('');
    setIsDragging(false);
    
    let files: File[] = [];
    if ('dataTransfer' in e) {
      files = Array.from(e.dataTransfer.files);
    } else if ('target' in e && e.target.files) {
      files = Array.from((e.target as HTMLInputElement).files || []);
    }

    if (files.length > 0) {
      const validFiles: File[] = [];
      const newPreviews: string[] = [];
      let hasError = false;

      files.forEach(file => {
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
          setUploadError('Apenas formatos PNG e JPG são permitidos.');
          hasError = true;
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`O arquivo ${file.name} excede o limite de 10MB.`);
          hasError = true;
          return;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });

      if (!hasError || validFiles.length > 0) {
        setImages(prev => [...prev, ...validFiles]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      addNotification({
        title: 'Erro',
        message: 'Você precisa estar logado para anunciar um imóvel.',
        type: 'error'
      });
      navigate('/login');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload images to Firebase Storage
      const imageUrls = [];
      for (const image of images) {
        const url = await propertyService.uploadImage(image);
        imageUrls.push(url);
      }

      if (imageUrls.length === 0) {
        imageUrls.push('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80');
      }

      const isAutoApproved = 
        userProfile?.role === 'admin' || 
        userProfile?.isApproved === true || 
        (userProfile?.agencyName && imageUrls.length >= 3 && formData.description.length > 50);

      const newProperty = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        location: formData.location,
        type: formData.type,
        category: formData.category,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        area: Number(formData.area) || 0,
        images: imageUrls,
        features: formData.features,
        agentId: currentUser.uid,
        agent: {
          name: formData.agentName || userProfile?.displayName || currentUser.email?.split('@')[0] || 'Agente',
          phone: formData.agentPhone || '',
          whatsapp: formData.agentPhone || '',
          email: currentUser.email || '',
          avatar: userProfile?.photoURL || '',
          agency: userProfile?.agencyName || '',
          bio: userProfile?.bio || '',
          instagram: userProfile?.instagram || '',
          facebook: userProfile?.facebook || '',
          isVerified: true
        },
        createdAt: new Date().toISOString(),
        status: isAutoApproved ? 'Disponível' : 'Pendente',
        isPromoted: false,
        isApproved: isAutoApproved,
        ...(selectedPackage && { requestedPackage: selectedPackage })
      };

      await propertyService.createProperty(newProperty as any);

      setIsSubmitted(true);
      setIsAutoApprovedMsg(isAutoApproved);
      playNotificationSound();
    } catch (error) {
      console.error("Error adding property:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível salvar o imóvel. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const packages = [
    {
      id: 'silver',
      name: 'Pacote Silver',
      price: '500 MZN',
      duration: '7 dias',
      icon: Star,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      features: ['Destaque na lista', 'Suporte básico']
    },
    {
      id: 'gold',
      name: 'Pacote Gold',
      price: '1.200 MZN',
      duration: '15 dias',
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      features: ['Topo da lista', 'Destaque na Home', 'Suporte prioritário']
    },
    {
      id: 'premium',
      name: 'Pacote Premium',
      price: '2.500 MZN',
      duration: '30 dias',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: ['Topo da lista', 'Destaque na Home', 'Redes Sociais', 'Gestor de conta']
    }
  ];

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-brand-green/10 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-brand-green" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {isAutoApprovedMsg ? 'Imóvel Publicado!' : 'Anúncio Recebido!'}
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          {isAutoApprovedMsg 
            ? `O seu imóvel foi aprovado automaticamente e já está visível na plataforma. ${selectedPackage ? `Você escolheu o ${packages.find(p => p.id === selectedPackage)?.name}.` : ''}`
            : `O seu imóvel foi submetido para revisão. ${selectedPackage ? `Você escolheu o ${packages.find(p => p.id === selectedPackage)?.name}.` : ''} Entraremos em contacto em breve para confirmar os detalhes e o pagamento.`
          }
        </p>
        <Button onClick={() => navigate('/dashboard', { state: { activeTab: 'properties' } })} className="bg-brand-green hover:bg-brand-green-hover">
          Ir para Meus Imóveis
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Anunciar Imóvel</h1>
        <p className="text-gray-600 mt-2">Preencha os detalhes do seu imóvel para começar.</p>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
             <span className="text-sm font-medium text-gray-500">Passo {step} de 4</span>
             <span className="text-sm font-medium text-brand-green">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-green h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Anúncio</label>
                  <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Apartamento T3 na Polana" required maxLength={150} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Negócio</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Venda</option>
                    <option>Arrendamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                  <div className="flex gap-2">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="MZN">MZN</option>
                      <option value="USD">USD</option>
                    </select>
                    <Input name="price" value={formData.price} onChange={handleInputChange} type="number" min="0" placeholder="0.00" required className="flex-1" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  maxLength={5000}
                  required
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Descreva os detalhes do imóvel..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-gray-900">Localização e Detalhes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                  <select name="location" value={formData.location} onChange={handleInputChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro / Zona</label>
                  <Input name="zone" value={formData.zone} onChange={handleInputChange} placeholder="Ex: Polana Cimento" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
                  <Input name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} type="number" min="0" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banheiros</label>
                  <Input name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} type="number" min="0" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
                  <Input name="area" value={formData.area} onChange={handleInputChange} type="number" min="0" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">Comodidades do Imóvel</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'Piscina', 'Garagem', 'Jardim', 'Ar Condicionado', 
                    'Segurança 24h', 'Varanda', 'Elevador', 'Mobiliado',
                    'Cozinha Equipada', 'Ginásio', 'Vista para o Mar', 'Churrasqueira'
                  ].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`amenity-${amenity}`} 
                        checked={formData.features.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="text-sm text-gray-600 cursor-pointer">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-gray-900">Fotos e Contacto</h3>
              
              <div>
                <input 
                  type="file" 
                  multiple 
                  accept=".jpg,.jpeg,.png" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-brand-green bg-brand-green/5' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileChange}
                >
                  <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-brand-green' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-600 font-medium">
                    {isDragging ? 'Solte as imagens aqui' : 'Clique ou arraste fotos para cá'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG até 10MB</p>
                </div>
                
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden bg-gray-100 border border-gray-200 aspect-video flex items-center justify-center">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                  <Input name="agentName" value={formData.agentName} onChange={handleInputChange} placeholder="Nome completo" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <Input name="agentPhone" value={formData.agentPhone} onChange={handleInputChange} placeholder="+258 84 000 0000" required />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Promova seu Anúncio</h3>
                <p className="text-gray-600 mt-2">Escolha um pacote para destacar seu imóvel e vender mais rápido.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const Icon = pkg.icon;
                  const isSelected = selectedPackage === pkg.id;
                  
                  return (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                      className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'border-brand-green bg-brand-green/5 ring-2 ring-brand-green ring-offset-2' 
                          : 'border-gray-200 bg-white hover:border-brand-green/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-brand-green">
                          <CheckCircle className="h-6 w-6 fill-brand-green/20" />
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${pkg.bgColor}`}>
                        <Icon className={`h-6 w-6 ${pkg.color}`} />
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                      <div className="mt-2 mb-4">
                        <span className="text-2xl font-bold text-gray-900">{pkg.price}</span>
                        <span className="text-sm text-gray-500 block">{pkg.duration}</span>
                      </div>
                      
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full ${isSelected ? 'bg-brand-green hover:bg-brand-green-hover' : ''}`}
                      >
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center text-sm text-gray-600">
                <p>Não quer promover agora? Você pode continuar com o anúncio gratuito.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-100">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
                Cancelar
              </Button>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Voltar
                </Button>
              )}
            </div>
            
            {step < 4 ? (
              <Button type="button" onClick={() => setStep(step + 1)} className="bg-brand-green hover:bg-brand-green-hover">
                {step === 3 ? 'Continuar para Promoção' : 'Próximo'}
              </Button>
            ) : (
              <Button type="submit" disabled={isUploading} className="bg-brand-green hover:bg-brand-green-hover px-8 py-6 text-lg">
                {isUploading ? 'Publicando...' : (selectedPackage ? 'Pagar e Publicar' : 'Publicar Gratuitamente')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
