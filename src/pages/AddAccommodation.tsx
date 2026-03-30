import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, Check, X } from 'lucide-react';
import { playNotificationSound } from '@/utils/sound';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { propertyService } from '@/services/propertyService';

export function AddAccommodation() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Check approval status
  useEffect(() => {
    if (userProfile && !userProfile.isApproved) {
      addNotification({
        title: 'Acesso Restrito',
        message: 'Seu cadastro está pendente de aprovação. Você não pode adicionar acomodações no momento.',
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
    type: 'Quarto',
    price: '',
    currency: 'MZN',
    description: '',
    guests: '2',
    beds: '1',
    bathrooms: '1',
    features: [] as string[],
  });

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
    } else if (e.target instanceof HTMLInputElement && e.target.files) {
      files = Array.from(e.target.files);
    }

    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setUploadError('Apenas arquivos de imagem são permitidos.');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Cada imagem deve ter no máximo 5MB.');
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > 10) {
      setUploadError('Você pode enviar no máximo 10 imagens.');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userProfile) {
      addNotification({ title: 'Erro', message: 'Você precisa estar logado para adicionar uma acomodação.', type: 'error' });
      return;
    }

    if (images.length === 0) {
      setUploadError('Por favor, adicione pelo menos uma imagem.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload images to Firebase Storage
      const imageUrls = [];
      for (const image of images) {
        const url = await propertyService.uploadImage(image);
        imageUrls.push(url);
      }

      // Format property data
      const propertyData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency,
        location: userProfile.resortLocation || '',
        type: 'Acomodação', // Special type for resorts
        category: formData.type,
        bedrooms: Number(formData.beds) || 1,
        bathrooms: Number(formData.bathrooms) || 1,
        area: Number(formData.guests) || 2,
        images: imageUrls,
        features: formData.features,
        agentId: currentUser.uid,
        agent: {
          name: userProfile.resortName || userProfile.displayName || currentUser.email?.split('@')[0] || 'Resort',
          phone: userProfile.phone || '',
          whatsapp: userProfile.whatsapp || '',
          email: currentUser.email || '',
          avatar: userProfile.photoURL || '',
          agency: userProfile.resortName || '',
          bio: userProfile.resortDescription || '',
          isVerified: true
        },
        createdAt: new Date().toISOString(),
        status: 'Disponível',
        isPromoted: false,
        isApproved: true // Auto-approve for resorts
      };

      await propertyService.createProperty(propertyData as any);
      
      setIsSubmitted(true);
      playNotificationSound();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting accommodation:", error);
      addNotification({ title: 'Erro', message: 'Erro ao publicar acomodação.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acomodação Publicada!</h2>
          <p className="text-gray-600 mb-8">
            Sua acomodação foi adicionada com sucesso e já está visível para os clientes.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
            Ir para o Painel
          </Button>
        </div>
      </div>
    );
  }

  const ACCOMMODATION_TYPES = ['Quarto', 'Suíte', 'Vila', 'Bangalô', 'Chalé', 'Apartamento'];
  const AMENITIES = [
    'Ar Condicionado', 'Wi-Fi Grátis', 'TV de Tela Plana', 'Frigobar', 
    'Cofre', 'Varanda', 'Vista para o Mar', 'Vista para o Jardim', 
    'Banheira', 'Secador de Cabelo', 'Máquina de Café', 'Serviço de Quarto'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Adicionar Acomodação</h1>
          <p className="text-gray-600 mt-2">Preencha os detalhes do quarto ou vila do seu resort.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Acomodação *</label>
                    <Input 
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Ex: Suíte Presidencial com Vista Mar" 
                      required 
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acomodação *</label>
                    <select 
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      {ACCOMMODATION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço por Noite *</label>
                    <div className="flex gap-2">
                      <Input 
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Ex: 15000" 
                        required 
                        className="flex-1"
                      />
                      <select 
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-24 h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="MZN">MZN</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Detalhes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade (Hóspedes) *</label>
                    <Input 
                      name="guests"
                      type="number"
                      value={formData.guests}
                      onChange={handleInputChange}
                      placeholder="Ex: 2" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Camas *</label>
                    <Input 
                      name="beds"
                      type="number"
                      value={formData.beds}
                      onChange={handleInputChange}
                      placeholder="Ex: 1" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Casas de Banho *</label>
                    <Input 
                      name="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      placeholder="Ex: 1" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Descrição</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada *</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Descreva a acomodação em detalhes..."
                    required
                  ></textarea>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Comodidades</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AMENITIES.map(amenity => (
                    <label 
                      key={amenity} 
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.features.includes(amenity) 
                          ? 'border-brand-green bg-brand-green/5' 
                          : 'border-gray-200 hover:border-brand-green/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                        formData.features.includes(amenity)
                          ? 'bg-brand-green border-brand-green'
                          : 'border-gray-300'
                      }`}>
                        {formData.features.includes(amenity) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{amenity}</span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={formData.features.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Fotos da Acomodação</h3>
                
                {imagePreviews.length === 0 ? (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                      isDragging ? 'border-brand-green bg-brand-green/5 scale-[1.01]' : 'border-gray-300 hover:border-brand-green/50 bg-gray-50/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileChange}
                    onClick={triggerFileInput}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                      <Upload className="h-8 w-8 text-brand-green" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Arraste suas fotos para cá</h4>
                    <p className="text-gray-500 mb-4 max-w-xs mx-auto text-sm">Clique para selecionar do seu computador ou arraste e solte os arquivos aqui.</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                      <span>Máximo 10 fotos</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>Até 5MB cada</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>JPG, PNG, WEBP</span>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      multiple 
                      accept="image/jpeg, image/png, image/webp"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          
                          {/* Overlay with remove button */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              className="p-1.5 bg-white/90 text-red-600 rounded-lg shadow-lg hover:bg-white hover:scale-110 transition-all"
                              title="Remover imagem"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Mobile-friendly remove button (always visible but smaller) */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="lg:hidden absolute top-1 right-1 p-1 bg-white/80 text-red-600 rounded-md shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-brand-green/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
                              Capa
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {imagePreviews.length < 10 && (
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-brand-green hover:bg-brand-green/5 transition-all text-gray-400 hover:text-brand-green group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                            <Plus className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-medium">Adicionar</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{imagePreviews.length} de 10 fotos selecionadas</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={triggerFileInput}
                        className="text-brand-green font-semibold hover:underline"
                      >
                        Enviar mais fotos
                      </button>
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      multiple 
                      accept="image/jpeg, image/png, image/webp"
                    />
                  </div>
                )}

                {uploadError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-top-1">
                    <X className="h-4 w-4" />
                    <p>{uploadError}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-brand-green hover:bg-brand-green-hover text-white min-w-[150px]"
                disabled={isUploading}
              >
                {isUploading ? 'Publicando...' : 'Publicar Acomodação'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
