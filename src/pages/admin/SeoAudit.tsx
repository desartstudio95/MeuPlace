import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';

interface SeoIssue {
  id: string;
  title: string;
  type: 'error' | 'warning' | 'success';
  message: string;
}

export function SeoAudit() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    success: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const propertiesSnapshot = await getDocs(collection(db, 'properties'));
      const propsData = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(propsData);
      
      analyzeSeo(propsData);
    } catch (error) {
      console.error("Error fetching data for SEO audit:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSeo = (props: Property[]) => {
    const newIssues: SeoIssue[] = [];
    let errors = 0;
    let warnings = 0;
    let success = 0;

    props.forEach(prop => {
      // Check Title Length (Ideal: 50-60 chars)
      if (!prop.title || prop.title.length < 30) {
        newIssues.push({ id: prop.id, title: prop.title || 'Sem Título', type: 'warning', message: 'Título muito curto (menos de 30 caracteres). Ideal: 50-60.' });
        warnings++;
      } else if (prop.title.length > 60) {
        newIssues.push({ id: prop.id, title: prop.title, type: 'warning', message: 'Título muito longo (mais de 60 caracteres). Pode ser cortado no Google.' });
        warnings++;
      } else {
        success++;
      }

      // Check Description Length (Ideal: 150-160 chars)
      if (!prop.description || prop.description.length < 100) {
        newIssues.push({ id: prop.id, title: prop.title || 'Sem Título', type: 'error', message: 'Descrição muito curta ou ausente. Ideal: 150-160 caracteres para o snippet do Google.' });
        errors++;
      } else if (prop.description.length > 160) {
        // Not necessarily an error, just a warning
        newIssues.push({ id: prop.id, title: prop.title || 'Sem Título', type: 'warning', message: 'Descrição excede 160 caracteres. Apenas os primeiros ~155 caracteres aparecerão nos resultados de busca.' });
        warnings++;
      } else {
        success++;
      }

      // Check Images
      if (!prop.images || prop.images.length === 0) {
        newIssues.push({ id: prop.id, title: prop.title || 'Sem Título', type: 'error', message: 'Imóvel sem imagens. Imagens são cruciais para engajamento e SEO de imagens.' });
        errors++;
      }
    });

    setIssues(newIssues);
    setStats({
      total: props.length,
      errors,
      warnings,
      success
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SEO Audit & Sitemap</h1>
        <p className="text-gray-600 mt-1">Analise a saúde de SEO dos seus imóveis e gere o sitemap do site.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sitemap Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sitemap XML</h2>
          <p className="text-sm text-gray-600 mb-6">
            O sitemap ajuda os motores de busca (como o Google) a descobrir e indexar as páginas do seu site mais rapidamente.
            O sitemap é gerado dinamicamente e inclui todos os imóveis aprovados.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => window.open('/sitemap.xml', '_blank')}
              className="bg-brand-green hover:bg-brand-green-hover text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Sitemap
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const a = document.createElement('a');
                a.href = '/sitemap.xml';
                a.download = 'sitemap.xml';
                a.click();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Sitemap
            </Button>
          </div>
        </div>

        {/* SEO Stats Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Auditoria SEO</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Total de Imóveis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-600 font-medium">Erros Críticos</p>
              <p className="text-2xl font-bold text-red-700">{stats.errors}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-sm text-yellow-600 font-medium">Avisos</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.warnings}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-600 font-medium">Boas Práticas</p>
              <p className="text-2xl font-bold text-green-700">{stats.success}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Problemas Encontrados</h2>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Reavaliar
          </Button>
        </div>
        
        {issues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Tudo perfeito!</h3>
            <p className="text-gray-500">Não foram encontrados problemas de SEO nos seus imóveis.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {issues.map((issue, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                <div className="mt-1">
                  {issue.type === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{issue.message}</p>
                  <a 
                    href={`/property/${issue.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-brand-green hover:underline mt-2 inline-block"
                  >
                    Ver Imóvel
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
