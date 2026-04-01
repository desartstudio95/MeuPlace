import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNotifications } from '@/context/NotificationContext';
import { Trash2, CheckCircle, XCircle, Star, Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface AgentReview {
  id: string;
  agentName: string;
  clientName: string;
  clientEmail: string;
  suggestedRating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export function AgentReviewsAdmin() {
  const { addNotification } = useNotifications();
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, 'agent_reviews'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedReviews: AgentReview[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() } as AgentReview);
      });
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Fallback without order by
      try {
        const q2 = query(collection(db, 'agent_reviews'));
        const qs2 = await getDocs(q2);
        const fetched2: AgentReview[] = [];
        qs2.forEach((doc) => {
          fetched2.push({ id: doc.id, ...doc.data() } as AgentReview);
        });
        setReviews(fetched2);
      } catch (e) {
        console.error("Fallback fetch failed", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'agent_reviews', id), { status: newStatus });
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
      addNotification({ 
        title: 'Sucesso', 
        message: `Avaliação ${newStatus === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.`, 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error updating review status:", error);
      addNotification({ title: 'Erro', message: 'Falha ao atualizar status.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteDoc(doc(db, 'agent_reviews', reviewToDelete));
      setReviews(reviews.filter(r => r.id !== reviewToDelete));
      addNotification({ title: 'Sucesso', message: 'Avaliação excluída com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error deleting review:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível excluir a avaliação.', type: 'error' });
    } finally {
      setReviewToDelete(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Avaliações de Clientes</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma avaliação recebida ainda.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <li key={review.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{review.clientName}</h4>
                      <span className="text-sm text-gray-500">avaliou</span>
                      <span className="text-sm font-bold text-brand-green">{review.agentName}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-amber-500 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= review.suggestedRating ? 'fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(review.createdAt?.seconds * 1000).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                      "{review.comment}"
                    </p>
                    
                    {review.clientEmail && (
                      <p className="text-xs text-gray-500 mt-2">Email do cliente: {review.clientEmail}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      review.status === 'approved' ? 'bg-green-100 text-green-800' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {review.status === 'approved' ? 'Aprovada' :
                       review.status === 'rejected' ? 'Rejeitada' :
                       'Pendente'}
                    </span>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {review.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleStatusChange(review.id, 'approved')}
                            title="Aprovar Avaliação"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleStatusChange(review.id, 'rejected')}
                            title="Rejeitar Avaliação"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => setReviewToDelete(review.id)}
                        title="Excluir Avaliação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReviewToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
