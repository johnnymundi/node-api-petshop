const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const config = require("config");
const NaoEncontrado = require("./erros/NaoEncontrado");
const CampoInvalido = require("./erros/CampoInvalido");
const DadosNaoFornecidos = require("./erros/DadosNaoFornecidos");
const ValorNaoSuportado = require("./erros/ValorNaoSuportado");
const formatosAceitos = require("./Serializador").formatosAceitos;
const SerializadorErro = require("./Serializador").SerializadorErro;

app.use(bodyParser.json());

app.use((requisicao, resposta, proximo) => {
  let formatoRequisitado = requisicao.header("Accept");

  if (formatoRequisitado === "*/*") {
    formatoRequisitado = "application/json";
  }

  if (formatosAceitos.indexOf(formatoRequisitado) === -1) {
    resposta.status(406);
    resposta.end();
    return;
  }

  resposta.setHeader("Content-Type", formatoRequisitado);
  proximo();
});

// definindo o CORS para que o site aceite o domínio da API. Conseguimos definir o mecanismo de segurança (CORS) e conseguimos que qualquer pessoa pode acessar a API de qualquer lugar do site pelo navegador botando * (se quisermos que não seja qualquer pessoa, botando a url em vez de *, tipo https://developer.mozilla.org)
// não é boa prática usar * e sim o domínio de quem pode acessar nossa API
app.use((requisicao, resposta, proximo) => {
  resposta.set("Access-Control-Allow-Origin", "*");
  proximo();
});

app.use((requisicao, resposta, proximo) => {
  resposta.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'"
  );
  proximo();
});

const roteador = require("./rotas/fornecedores");
app.use("/api/fornecedores", roteador);

// declarando a versao 2 da rota de fornecedores (v2):
const roteadorV2 = require("./rotas/fornecedores/rotas.v2");
app.use("/api/v2/fornecedores", roteadorV2);

//middleware para tratar catch's (exceções)
app.use((erro, requisicao, resposta, proximo) => {
  let status = 500;

  if (erro instanceof NaoEncontrado) {
    status = 404;
  }

  if (erro instanceof CampoInvalido || erro instanceof DadosNaoFornecidos) {
    status = 400;
  }

  if (erro instanceof ValorNaoSuportado) {
    status = 406;
  }

  const serializador = new SerializadorErro(resposta.getHeader("Content-Type"));
  resposta.status(status);
  resposta.send(
    serializador.serializar({
      mensagem: erro.message,
      id: erro.idErro,
    })
  );
});

app.listen(config.get("api.porta"), () =>
  console.log("A API está funcionando!")
);

/*
OBS: pra verificar como consumir essa API pelo navegador, digito https://developer.mozilla.org e no site abro o console e daí posso testar as rotas, que são todas acessadas utilizando o fetch(), que sempre retorna uma promessa. Daí, precisa ser seguida de um .then()
ex:
# tentando atualizar um fornecedor pelo console do navegador:
const corpo = JSON.stringify({ empresa: 'Loja de Brinquedos' })
const cabecalhos = { 'Content-Type': 'application/json' }
fetch(http://localhost:3000/api/fornecedor/2', { method: 'PUT', body: corpo, headers: cabecalhos }).then(console.log)

Isso tudo sempre vai chamar uma requisição OPTIONS antes do PUT (ou POST ou DELETE), que precisa ser configurado antes para não dar erro de CORS

*/
