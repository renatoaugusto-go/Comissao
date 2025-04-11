// Importações
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ngrok = require("@ngrok/ngrok");
require('dotenv').config();

// Definições
const app = express();
const port = process.env.BACKEND_PORTA; 

// Configuração do CORS para permitir o frontend específico
const corsOptions = {
    origin: 'https://dfmrenato.github.io', // Permite requisições apenas deste site
    methods: 'GET,POST', // Métodos permitidos
    allowedHeaders: 'Content-Type',
};

app.use(cors(corsOptions)); // Middleware principal de CORS

// Permite requisições preflight (importante para o navegador validar permissões antes da requisição real)
app.options('*', cors(corsOptions));

// Middleware para aceitar JSON
app.use(express.json());

// Conectar ao MongoDB usando o link de conexão fornecido
const uri = process.env.MONGODB_URI;

// Conectar ao MongoDB
const client = MongoClient.connect(uri);
client.then((client) => {
    db = client.db('comissao');  // Acessa o banco de dados padrão
    console.log('Conectado ao MongoDB');
}).catch((error) => {
    console.error('Erro ao conectar ao MongoDB:', error);
});
//let db = (await client).db('comissao');

// Rota de exemplo
app.get('/', (req, res) => {
    res.send('Olá, mundo! Conectado ao MongoDB!');
});

// Adicionar estoque de produto
app.post('/adicionar-estoque', async (req, res) => {
    const { nome, quantidade, data_criacao } = req.body;

    try {
        if (!nome || !quantidade || !data_criacao) {
            return res.status(400).json({ error_message: 'Todos os dados são obrigatórios' });
        }

        // Verifica se produto já existe no banco de dados
        if (await db.collection('produtos').findOne({ nome })) {
            
            db.collection('produtos').findOne({ nome }).then(produto_original => {
                let quantia_antiga = produto_original.quantidade;
                db.collection('produtos').deleteOne({ nome }).then(async () => {
                    let result = db.collection('produtos').insertOne({ nome, quantidade: parseInt(quantidade)+parseInt(quantia_antiga) });
                    res.status(201).json({ certo: true });
                    console.log(`${data_criacao} Produto modificado: ${await result._id}`)
                });
            })

        } else {

            let result = db.collection('produtos').insertOne({ nome, quantidade: parseInt(quantidade) });
            res.status(201).json({ certo: true });
            console.log(`${data_criacao} Produto inserido: ${await result._id}`)

        }

    } catch (error) {
        console.error('Erro ao adicionar estoque:', error);
        res.status(500).json({ error_message: error.message });
    }
});

// Ngrok
(async () => {
    // Conectar
    const listener = await ngrok.forward({
        addr: port,
        authtoken: process.env.NGROK_AUTHTOKEN,
        domain: process.env.NGROK_DOMAIN
    });
  
    // Avisar
    console.log(`Ngrok conectado`);
})();

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
process.on('uncaughtException', (error) => {
    return console.error(`Exceção não capturada: `+error);
});