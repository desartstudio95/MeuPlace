import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/context/NotificationContext';
import { FileText, Upload, Trash2, Download, File as FileIcon, Loader2, Edit3, Save, X } from 'lucide-react';

interface FileRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: any;
  notes: string;
  aiSummary: string;
}

export function MyFiles() {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const filesRef = collection(db, 'users', currentUser.uid, 'files');
    const q = query(filesRef, orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fileData: FileRecord[] = [];
      snapshot.forEach((doc) => {
        fileData.push({ id: doc.id, ...doc.data() } as FileRecord);
      });
      setFiles(fileData);
    }, (error) => {
      console.error('Error fetching files:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    setProgress(0);

    const fileId = crypto.randomUUID();
    const storageRef = ref(storage, `user_uploads/${currentUser.uid}/${fileId}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progressValue);
      },
      (error) => {
        console.error('Upload error:', error);
        addNotification({ title: 'Erro', message: 'Falha ao enviar arquivo.', type: 'error' });
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save to Firestore
          const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
          await setDoc(fileDocRef, {
            name: file.name,
            url: downloadURL,
            size: file.size,
            type: file.type,
            uploadedAt: serverTimestamp(),
            notes: '',
            aiSummary: 'Resumo gerado por IA (pendente)' // Placeholder for AI summary
          });

          addNotification({ title: 'Sucesso', message: 'Arquivo enviado com sucesso.', type: 'success' });
        } catch (error) {
          console.error('Error saving file metadata:', error);
          addNotification({ title: 'Erro', message: 'Falha ao salvar informações do arquivo.', type: 'error' });
        } finally {
          setUploading(false);
          setProgress(0);
          if (e.target) e.target.value = ''; // Reset input
        }
      }
    );
  };

  const handleDelete = async (fileRecord: FileRecord) => {
    if (!currentUser) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, `user_uploads/${currentUser.uid}/${fileRecord.id}_${fileRecord.name}`);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid, 'files', fileRecord.id));

      addNotification({ title: 'Sucesso', message: 'Arquivo excluído com sucesso.', type: 'success' });
    } catch (error) {
      console.error('Error deleting file:', error);
      addNotification({ title: 'Erro', message: 'Falha ao excluir arquivo.', type: 'error' });
    }
  };

  const handleSaveNotes = async (fileId: string) => {
    if (!currentUser) return;

    try {
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
      await setDoc(fileDocRef, { notes: editNotes }, { merge: true });
      setEditingId(null);
      addNotification({ title: 'Sucesso', message: 'Notas atualizadas.', type: 'success' });
    } catch (error) {
      console.error('Error updating notes:', error);
      addNotification({ title: 'Erro', message: 'Falha ao atualizar notas.', type: 'error' });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Arquivos</h1>
          <p className="text-gray-500 mt-2">Gerencie seus uploads e histórico de arquivos</p>
        </div>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading} className="cursor-pointer bg-brand-green hover:bg-brand-green-hover text-white">
              <span>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? `Enviando... ${Math.round(progress)}%` : 'Enviar Arquivo'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {files.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
            <p className="text-sm mt-1">Faça o upload de um arquivo para começar.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {files.map((file) => (
              <li key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-brand-green/10 rounded-lg text-brand-green">
                      <FileIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Notes Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-gray-700">Notas</h4>
                            {editingId !== file.id && (
                              <button onClick={() => { setEditingId(file.id); setEditNotes(file.notes || ''); }} className="text-gray-400 hover:text-brand-green">
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {editingId === file.id ? (
                            <div className="space-y-2">
                              <Input 
                                value={editNotes} 
                                onChange={(e) => setEditNotes(e.target.value)} 
                                placeholder="Adicione uma nota..."
                                className="text-sm"
                              />
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleSaveNotes(file.id)} className="bg-brand-green hover:bg-brand-green-hover text-white h-8">
                                  <Save className="h-3 w-3 mr-1" /> Salvar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8">
                                  <X className="h-3 w-3 mr-1" /> Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {file.notes || <span className="text-gray-400 italic">Sem notas adicionadas.</span>}
                            </p>
                          )}
                        </div>

                        {/* AI Summary Section */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h4 className="text-sm font-semibold text-blue-800 mb-2">Resumo IA</h4>
                          <p className="text-sm text-blue-700">
                            {file.aiSummary || 'Nenhum resumo disponível.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex items-center space-x-2">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                      <Button variant="outline" size="icon" title="Baixar">
                        <Download className="h-4 w-4 text-gray-600" />
                      </Button>
                    </a>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(file)} title="Excluir" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
