export function Help() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Central de Ajuda</h1>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">Como anunciar um imóvel?</h2>
          <p className="text-gray-600">
            Para anunciar, crie uma conta como Agente ou Agência, faça login e clique em "Anunciar Imóvel" no menu superior.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">É grátis usar o MeuPlace?</h2>
          <p className="text-gray-600">
            Sim, a pesquisa de imóveis é totalmente gratuita. Para anunciar, oferecemos planos gratuitos e premium.
          </p>
        </div>
      </div>
    </div>
  );
}
