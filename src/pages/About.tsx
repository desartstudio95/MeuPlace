import { motion } from 'motion/react';
import { Home as HomeIcon, Users, MapPin, CheckCircle2, ShieldCheck, Globe, User, TrendingUp, Award, Target, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export function About() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO 
        title="Sobre Nós" 
        description="Conheça a história e a missão do MeuPlace, o maior portal imobiliário de Moçambique." 
      />

      {/* Who We Are Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-sm font-semibold mb-6">
                <Target className="h-4 w-4" />
                <span>Nossa Missão</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Liderando a Transformação Imobiliária em Moçambique</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                O MeuPlace nasceu da necessidade de modernizar a forma como os moçambicanos interagem com o mercado imobiliário. Percebemos que encontrar o "place" ideal era um processo muitas vezes lento e incerto.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Hoje, somos a plataforma líder que une tecnologia de ponta a um profundo conhecimento local, oferecendo uma experiência digital completa para proprietários, agentes e compradores em todas as províncias do país.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-brand-purple">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Excelência</h4>
                    <p className="text-sm text-gray-500">Compromisso com a qualidade em cada detalhe.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-brand-green">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Paixão</h4>
                    <p className="text-sm text-gray-500">Amamos ajudar as pessoas a encontrar seu lar.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-green to-brand-purple rounded-3xl blur-2xl opacity-10" />
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Our Office" 
                className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 glass p-6 rounded-2xl shadow-xl hidden sm:block">
                <p className="text-3xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-500 font-medium">Foco no Cliente</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Imóveis Ativos', value: '5,000+', icon: HomeIcon, color: 'text-brand-green' },
              { label: 'Agentes Parceiros', value: '200+', icon: Users, color: 'text-brand-purple' },
              { label: 'Cidades Cobertas', value: '11', icon: MapPin, color: 'text-amber-500' },
              { label: 'Usuários Felizes', value: '50k+', icon: CheckCircle2, color: 'text-blue-500' },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className={`mx-auto h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <h4 className="text-3xl font-bold text-gray-900">{stat.value}</h4>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Por que escolher o nosso portal?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Oferecemos a melhor experiência para quem busca o imóvel dos sonhos em Moçambique.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Segurança Total', desc: 'Verificamos todos os anúncios e agentes para garantir a sua segurança.', icon: ShieldCheck, color: 'bg-green-50 text-green-600' },
              { title: 'Ampla Variedade', desc: 'Milhares de imóveis em todas as províncias, de apartamentos a resorts de luxo.', icon: Globe, color: 'bg-blue-50 text-blue-600' },
              { title: 'Suporte Especializado', desc: 'Nossa equipe está pronta para ajudar você em cada etapa do processo.', icon: User, color: 'bg-purple-50 text-purple-600' },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl border border-gray-100 hover:border-brand-green/30 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className={`h-14 w-14 rounded-2xl ${item.color} flex items-center justify-center mb-6`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-brand-purple/20"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 text-center relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Pronto para encontrar o seu lugar?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Comece sua jornada hoje mesmo com o portal imobiliário mais confiável de Moçambique.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-brand-green text-white hover:bg-brand-green-hover font-bold px-8 rounded-xl" onClick={() => navigate('/properties')}>
              Ver Imóveis
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 rounded-xl" onClick={() => navigate('/contact')}>
              Fale Conosco
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
