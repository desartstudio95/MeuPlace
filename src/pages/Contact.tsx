import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Contact() {
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
              <p className="mt-1 text-gray-600">+258 84 123 4567</p>
              <p className="text-gray-600">Segunda a Sexta, 8h às 18h</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Mail className="h-6 w-6 text-brand-green" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Email</h3>
              <p className="mt-1 text-gray-600">info@meuplace.co.mz</p>
              <p className="text-gray-600">suporte@meuplace.co.mz</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <MapPin className="h-6 w-6 text-brand-green" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Escritório</h3>
              <p className="mt-1 text-gray-600">
                Av. Julius Nyerere, 1234<br />
                Polana Cimento, Maputo<br />
                Moçambique
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="mt-1">
                <Input type="text" name="name" id="name" required placeholder="Seu nome" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <Input type="email" name="email" id="email" required placeholder="seu@email.com" />
              </div>
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
                  className="shadow-sm focus:ring-brand-green focus:border-brand-green block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="Como podemos ajudar?"
                ></textarea>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
                Enviar Mensagem
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
