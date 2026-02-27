import { Home, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center">
              <img 
                src="https://i.ibb.co/yBVKb9hJ/Logotipo-para-corretora-de-im-veis-preto-e-bege-simples-Website.png" 
                alt="MeuPlace Logo" 
                className="h-14 w-auto object-contain" 
              />
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              O maior marketplace imobiliário de Moçambique. Conectando pessoas aos seus sonhos.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-brand-green tracking-wider uppercase">Navegação</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/" className="text-base text-gray-300 hover:text-white">Início</Link></li>
              <li><Link to="/properties" className="text-base text-gray-300 hover:text-white">Comprar</Link></li>
              <li><Link to="/properties" className="text-base text-gray-300 hover:text-white">Arrendar</Link></li>
              <li><Link to="/add-property" className="text-base text-gray-300 hover:text-white">Vender</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-green tracking-wider uppercase">Suporte</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/help" className="text-base text-gray-300 hover:text-white">Ajuda</Link></li>
              <li><Link to="/terms" className="text-base text-gray-300 hover:text-white">Termos de Uso</Link></li>
              <li><Link to="/privacy" className="text-base text-gray-300 hover:text-white">Privacidade</Link></li>
              <li><Link to="/contact" className="text-base text-gray-300 hover:text-white">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-green tracking-wider uppercase">Contato</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-center text-gray-300">
                <Phone className="h-5 w-5 mr-2 text-brand-green" />
                +258 84 123 4567
              </li>
              <li className="flex items-center text-gray-300">
                <Mail className="h-5 w-5 mr-2 text-brand-green" />
                info@meuplace.co.mz
              </li>
            </ul>
            <div className="mt-6 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 md:flex md:items-center md:justify-between">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} MeuPlace Moçambique. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
