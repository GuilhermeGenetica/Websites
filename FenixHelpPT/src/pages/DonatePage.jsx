import React, { useState } from 'react';
// O import do 'react-helmet' foi removido para resolver um erro de compilação no ambiente atual.
// Pode adicioná-lo de volta no seu projeto se o pacote estiver instalado.
// import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, CreditCard, Droplets, Info, MessageSquare } from 'lucide-react';
// Os caminhos de importação foram ajustados para relativos para resolver erros de compilação.
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea'; // Importar o Textarea
import { useToast } from '../components/ui/use-toast';
import { loadStripe } from '@stripe/stripe-js';

const DonatePage = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  // Novo estado para a mensagem da doação
  const [donationMessage, setDonationMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const donationAmounts = [5, 10, 20, 50];

  const handleDonate = async () => {
    setLoading(true);
    toast({
      title: "A preparar a sua doação...",
      description: "Por favor, siga os passos para completar a integração do Stripe.",
    });

    // A mensagem é capturada e pode ser enviada para o Stripe.
    // No checkout do Stripe, esta mensagem seria enviada no campo 'metadata'.
    // Ex: stripe.redirectToCheckout({ ..., metadata: { donation_message: donationMessage } })
    const capturedDataInfo = donationMessage 
      ? `\n\nMensagem da doação capturada:\n"${donationMessage}"`
      : "\n\nNenhuma mensagem foi deixada.";

    alert(`Para prosseguir com a doação, por favor, siga estes passos cruciais:

1. **Crie uma conta Stripe (se ainda não tiver):** [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. **Ative o modo de checkout apenas no cliente:** No final desta página, ative a opção: [https://dashboard.stripe.com/settings/checkout](https://dashboard.stripe.com/settings/checkout)
3. **Crie um produto e defina um preço:** Siga este guia: [https://support.stripe.com/questions/how-to-create-products-and-prices](https://support.stripe.com/questions/how-to-create-products-and-prices) e copie o ID do Preço.
4. **Obtenha a sua Chave Publicável:** Copie a sua chave API publicável desta página: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
5. **Liberte o seu domínio (para modo live):** Nas configurações do Checkout, adicione o seu domínio para produção.
6. **Forneça as chaves:** Por favor, partilhe comigo a sua **Chave Publicável** e o **ID do Preço** para eu poder finalizar a integração.
${capturedDataInfo}

Assim que me fornecer estas informações, a funcionalidade de doação ficará totalmente operacional! 🚀`);

    setLoading(false);
  };
  
  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  return (
    <>
      {/* <Helmet>
        <title>Faça uma Doação - Projeto Fénix</title>
        <meta name="description" content="A sua contribuição é vital para mantermos a plataforma a funcionar e para apoiarmos as nossas equipas de validação no terreno. Ajude-nos a continuar esta missão!" />
        <meta property="og:title" content="Faça uma Doação - Projeto Fénix" />
        <meta property="og:description" content="Apoie o Projeto Fénix. Cada doação ajuda a reconstruir Portugal." />
      </Helmet> */}

      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Heart className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              A sua ajuda faz a diferença
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Cada contribuição, por mais pequena que seja, ajuda-nos a manter a plataforma operacional e a apoiar as nossas equipas no terreno.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground">1. Escolha um valor</h2>
                <div className="grid grid-cols-2 gap-4">
                  {donationAmounts.map(val => (
                    <Button key={val} variant={amount === val && !customAmount ? 'default' : 'outline'} onClick={() => { setAmount(val); setCustomAmount(''); }} className="py-6 text-lg">
                      {val} €
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="custom-amount" className="text-foreground">Ou insira um valor</Label>
                  <Input 
                    id="custom-amount" 
                    type="number" 
                    placeholder="Outro valor" 
                    className="mt-2"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) setAmount(0);
                    }}
                  />
                </div>
                
                {/* Novo campo para a mensagem */}
                <div>
                  <Label htmlFor="donation-message" className="text-foreground">2. Deixar uma mensagem (opcional)</Label>
                  <Textarea
                    id="donation-message"
                    placeholder="Ex: Para compra de alimentos para a família Silva."
                    className="mt-2"
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    rows={4}
                  />
                   <p className="text-xs text-muted-foreground mt-1">
                    Indique aqui se pretende direcionar a sua doação.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center space-x-3">
                  <Droplets className="w-8 h-8 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    O seu donativo de <strong>{finalAmount > 0 ? `${finalAmount}€` : '...'}</strong> ajuda a reerguer comunidades.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-1">Como será usada a sua doação?</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Os fundos destinam-se à manutenção da infraestrutura e ao apoio logístico das equipas no terreno. Se deixar uma mensagem, faremos o nosso melhor para direcionar a sua ajuda.
                            </p>
                        </div>
                    </div>
                </div>
                 <Button 
                   onClick={handleDonate} 
                   size="lg" 
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg"
                   disabled={loading || finalAmount <= 0}
                 >
                  <CreditCard className="w-5 h-5 mr-3" />
                  {loading ? 'A processar...' : 'Doar Agora'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    Pagamento seguro processado via Stripe.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DonatePage;
