import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Camera, Save, Trash2, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { resizeImage } from '@/utils/imageUtils';
import { LoadingScreen } from '@/components/LoadingScreen';

export function Profile() {
  const { userProfile, updateUserProfile, deleteUserAccount } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({
        title: 'Formato inválido',
        message: 'Por favor, selecione uma imagem.',
        type: 'error'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        title: 'Ficheiro muito grande',
        message: 'A imagem deve ter no máximo 5MB.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      const resizedImage = await resizeImage(file, 400, 400); // Resize to 400x400
      setUploadProgress(50);
      
      // Update local state
      setPhotoURL(resizedImage);
      
      // Update Firestore and Auth profile immediately
      await updateUserProfile({
        displayName: name,
        photoURL: resizedImage
      });
      
      setUploadProgress(100);
      addNotification({
        title: 'Upload concluído',
        message: 'A imagem de perfil foi atualizada com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error('Upload error:', error);
      addNotification({
        title: 'Erro no upload',
        message: 'Não foi possível carregar a imagem.',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        displayName: name,
        photoURL: photoURL
      });
      setIsEditing(false);
      addNotification({
        title: 'Perfil atualizado',
        message: 'As suas informações foram atualizadas com sucesso.',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        title: 'Erro',
        message: 'Não foi possível atualizar o perfil.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteUserAccount();
      addNotification({
        title: 'Conta eliminada',
        message: 'A sua conta foi eliminada com sucesso.',
        type: 'success'
      });
      navigate('/');
    } catch (error: any) {
      // Firebase requires recent authentication for sensitive operations like delete
      if (error.code === 'auth/requires-recent-login') {
        addNotification({
          title: 'Autenticação necessária',
          message: 'Por favor, inicie sessão novamente para eliminar a sua conta.',
          type: 'error'
        });
        navigate('/login');
      } else {
        addNotification({
          title: 'Erro',
          message: 'Não foi possível eliminar a conta.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  if (!userProfile) {
    return <LoadingScreen />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-brand-green/10 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md flex items-center justify-center">
              {photoURL || userProfile.photoURL ? (
                <img 
                  src={isEditing ? photoURL : userProfile.photoURL} 
                  alt={userProfile.displayName} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userProfile.displayName || 'Sem Nome'}</h1>
              <p className="text-gray-500 flex items-center mt-1">
                <Mail className="h-4 w-4 mr-2" />
                {userProfile.email}
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green capitalize">
                {userProfile.role}
              </div>
            </div>
            
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar Perfil
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Editar Informações</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Seu nome"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {loading && uploadProgress > 0 && uploadProgress < 100 
                          ? `A carregar... ${Math.round(uploadProgress)}%` 
                          : 'Escolher Imagem'}
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    {photoURL && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setPhotoURL('')}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Formatos suportados: JPG, PNG, GIF. Tamanho máximo: 5MB.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={() => {
                  setIsEditing(false);
                  setName(userProfile.displayName);
                  setPhotoURL(userProfile.photoURL);
                }} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-brand-green hover:bg-brand-green-hover text-white" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'A guardar...' : 'Guardar Alterações'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-medium text-red-600 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Zona de Perigo
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Ao eliminar a sua conta, todos os seus dados, propriedades e informações serão permanentemente removidos do nosso sistema. Esta ação não pode ser desfeita.
              </p>
              
              {isDeleting ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-medium mb-4">
                    Tem a certeza absoluta? Esta ação é irreversível.
                  </p>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setIsDeleting(false)} disabled={loading}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
                      Sim, eliminar a minha conta
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => setIsDeleting(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Conta
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
