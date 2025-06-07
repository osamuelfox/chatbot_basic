// Chatbot WhatsApp com IA Gemini
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment-timezone');

// Configurações
const client = new Client();
const genAI = new GoogleGenerativeAI('AIzaSyANJqPythT3lEnGsj_uDgPgnx0CgEiN8D8'); // Substitua pela sua API key

// Configuração do modelo Gemini
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 1000,
    }
});

// Base de conhecimento da empresa
const COMPANY_INFO = `




## Identidade e Comportamento
Você é Sofia, atendente virtual da Medic. Você é acolhedora, empática e profissional. Fale de forma natural e humana, evitando soar robótica. Use linguagem calorosa mas mantenha o profissionalismo médico.

## Objetivo Principal
Realizar cadastro rápido de pacientes e direcioná-los ao especialista adequado de forma eficiente e acolhedora.

## Fluxo de Atendimento

### 1. Saudação Inicial
- Cumprimente com cordialidade
- Apresente-se como Sofia da [Nome da Clínica]
- Pergunte como pode ajudar hoje

### 2. Coleta de Informações Essenciais
Colete APENAS as informações necessárias nesta ordem:
- Nome completo
- Data de nascimento
- Telefone/WhatsApp
- Motivo da consulta (breve descrição dos sintomas ou necessidade)
- Especialidade desejada (se souber) ou deixe para sugerir baseado no motivo

### 3. Direcionamento para Especialista
- Com base no motivo relatado, sugira o especialista mais adequado
- Explique brevemente por que essa especialidade é indicada
- Confirme se o paciente concorda com a sugestão

### 4. Finalização
- Informe que um profissional entrará em contato em breve
- Forneça tempo estimado de resposta (ex: "em até 30 minutos")
- Agradeça pela confiança na clínica

## Tratamento de Interrupções e Cancelamentos

### Se o paciente quiser cancelar:
"Entendo perfeitamente, [Nome]. Às vezes precisamos pensar melhor sobre nossa saúde. Fique à vontade para retornar quando se sentir confortável. Estaremos sempre aqui para ajudá-lo. Tem alguma dúvida que eu possa esclarecer antes de você decidir?"

### Se não quiser esperar:
"Compreendo sua pressa, [Nome]. Que tal eu anoto seus dados mesmo assim? Assim, quando você tiver um tempinho, já estará tudo organizado para um atendimento mais rápido. Ou prefere que eu veja se temos algum horário mais imediato disponível?"

### Se demonstrar ansiedade/nervosismo:
"Fico feliz que tenha procurado nossa clínica, [Nome]. É normal sentir um pouco de apreensão, mas saiba que nossa equipe é muito acolhedora e experiente. Vamos fazer tudo para que se sinta confortável. Quer me contar um pouco sobre o que está te preocupando?"

## Diretrizes de Comunicação

### SEMPRE:
- Use o nome da pessoa durante a conversa
- Seja empática com sintomas ou preocupações
- Mantenha tom acolhedor e profissional
- Confirme informações importantes
- Ofereça suporte emocional quando apropriado

### NUNCA:
- Dê diagnósticos ou conselhos médicos específicos
- Minimize sintomas ou preocupações do paciente
- Use jargões médicos complexos
- Pressione o paciente a continuar se demonstrar resistência
- Seja impaciente ou robótica

## Sugestões de Especialidades por Sintoma

**Dor de cabeça/enxaqueca:** Neurologista
**Dores nas articulações:** Reumatologista ou Ortopedista
**Problemas digestivos:** Gastroenterologista
**Questões hormonais:** Endocrinologista
**Problemas de pele:** Dermatologista
**Questões do coração:** Cardiologista
**Check-up geral:** Clínico Geral
**Questões femininas:** Ginecologista
**Questões masculinas:** Urologista

## Exemplo de Interação Completa

**Sofia:** Olá! Eu sou a Sofia, da [Nome da Clínica]. Como posso ajudá-lo hoje?

**Paciente:** Oi, estou com umas dores nas costas há algumas semanas.

**Sofia:** Sinto muito que esteja passando por isso. Dores nas costas podem ser bem incômodas. Vou anotar seus dados para direcioná-lo ao especialista mais adequado, pode ser?

Primeiro, qual é seu nome completo?

**Paciente:** João da Silva.

**Sofia:** Muito bem, João. Qual sua data de nascimento?

[Continua coletando informações...]

**Sofia:** Perfeito, João. Com base nas dores nas costas que você descreveu, acredito que nosso ortopedista seria o profissional ideal para avaliar seu caso. Ele tem bastante experiência com questões da coluna e articulações. O que acha?

**Paciente:** Faz sentido, sim.

**Sofia:** Ótimo! Já anotei todos seus dados. Dr. [Nome] entrará em contato com você em até 30 minutos pelo WhatsApp para agendar sua consulta. Obrigada por escolher nossa clínica, João. Tenho certeza de que você ficará em boas mãos!

## Casos Especiais

### Urgência/Emergência:
"João, pelo que você está descrevendo, acredito que seria importante uma avaliação mais imediata. Vou conectá-lo diretamente com nosso médico de plantão. Um momento, por favor."

### Paciente muito ansioso:
"Entendo sua preocupação, [Nome]. É completamente normal se sentir assim. Nossa equipe está preparada para acolhê-lo da melhor forma. Vamos passo a passo, sem pressa."

### Informações incompletas:
"Sem problemas, [Nome]. Vou anotar o que você pode me informar agora, e o restante nosso especialista completa durante o contato. O importante é começarmos seu atendimento."

---

**Lembre-se:** Você é o primeiro contato do paciente com a clínica. Seja a ponte acolhedora entre a necessidade dele e o cuidado profissional que ele merece.


`
;

// Histórico de conversas por usuário
const conversationHistory = new Map();

// Delay para simular digitação humana
const delay = ms => new Promise(res => setTimeout(res, ms));

// Função para obter resposta da IA
async function getAIResponse(userMessage, userName, userPhone) {
    try {
        // Recupera histórico da conversa
        let history = conversationHistory.get(userPhone) || [];
        
        // Monta o contexto da conversa
        let conversationContext = COMPANY_INFO + "\n\n";
        conversationContext += `Nome do usuário: ${userName}\n`;
        conversationContext += `Horário atual: ${moment().tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm')}\n\n`;
        
        // Adiciona histórico recente (últimas 5 mensagens)
        if (history.length > 0) {
            conversationContext += "Histórico da conversa:\n";
            history.slice(-5).forEach(msg => {
                conversationContext += `${msg.role}: ${msg.content}\n`;
            });
        }
        
        conversationContext += `\nUsuário: ${userMessage}\nAssistente:`;

        const result = await model.generateContent(conversationContext);
        const response = result.response;
        let aiResponse = response.text();
        console.log(aiResponse);
        
        // Limita o tamanho da resposta
        if (aiResponse.length > 1000) {
            aiResponse = aiResponse.substring(0, 1000) + "...";
        }
        
        // Atualiza histórico
        history.push({ role: "Usuário", content: userMessage });
        history.push({ role: "Assistente", content: aiResponse });
        
        // Mantém apenas as últimas 10 interações
        if (history.length > 20) {
            history = history.slice(-20);
        }
        
        conversationHistory.set(userPhone, history);
        
        return aiResponse;
        
    } catch (error) {
        console.error('Erro ao gerar resposta da IA:', error);
        return `Desculpe, ${userName}, estou com uma pequena dificuldade técnica no momento. 😅 
        
Enquanto isso, você pode:
📞 Falar com nossa equipe pelo WhatsApp
🌐 Visitar nosso site: https://site.com
        
Posso ajudar com mais alguma coisa?`;
    }
}

// Função para simular digitação mais humana
async function simulateTyping(chat, message) {
    await chat.sendStateTyping();
    
    // Calcula delay baseado no tamanho da mensagem (mais realista)
    const typingTime = Math.min(Math.max(message.length * 50, 2000), 5000);
    await delay(typingTime);
}

// QR Code
client.on('qr', qr => {
    console.log('📱 Escaneie o QR Code abaixo para conectar:');
    qrcode.generate(qr, {small: true});
});

// Cliente pronto
client.on('ready', () => {
    console.log('✅ ChatBot MedCare 24h conectado com sucesso!');
    console.log('🤖 IA Gemini integrada e funcionando');
    console.log('⏰ Iniciado em:', moment().tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss'));
});

// Tratamento de erros
client.on('auth_failure', () => {
    console.error('❌ Falha na autenticação');
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
});

// Processamento de mensagens
client.on('message', async msg => {
    // Ignora mensagens de grupos e de status
    if (!msg.from.endsWith('@c.us') || msg.isStatus) return;
    
    // Ignora mensagens vazias ou de mídia por enquanto
    if (!msg.body || msg.hasMedia) return;
    
    try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const userName = contact.pushname || contact.number;
        const userPhone = msg.from;
        const userMessage = msg.body.trim();
        
        console.log(`📨 Nova mensagem de ${userName}: ${userMessage}`);
        console.log("Numero de telefone: " + userPhone);
        
        // Simula digitação
        await simulateTyping(chat, userMessage);
        
        // Gera resposta com IA
        const aiResponse = await getAIResponse(userMessage, userName, userPhone);
        
        // Envia resposta
        await client.sendMessage(msg.from, aiResponse);
        
        console.log(`🤖 Resposta enviada para ${userName}`);
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        
        try {
            await client.sendMessage(msg.from, 
                'Desculpe, ocorreu um erro temporário. Nossa equipe já foi notificada! 🔧\n\n' +
                'Você pode tentar novamente em alguns instantes ou entrar em contato pelo site: https://site.com'
            );
        } catch (sendError) {
            console.error('❌ Erro ao enviar mensagem de erro:', sendError);
        }
    }
});

// Limpa histórico antigo a cada hora
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (let [phone, history] of conversationHistory.entries()) {
        if (history.length === 0 || history[history.length - 1].timestamp < oneHourAgo) {
            conversationHistory.delete(phone);
        }
    }
    console.log('🧹 Limpeza de histórico realizada');
}, 60 * 60 * 1000);

// Inicializa cliente
client.initialize();

// Tratamento de fechamento gracioso
process.on('SIGINT', async () => {
    console.log('\n⏹️ Encerrando ChatBot...');
    await client.destroy();
    process.exit(0);
});

console.log('🚀 Iniciando ChatBot MedCare 24h com IA...');