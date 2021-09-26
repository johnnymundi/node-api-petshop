// esse arquivo cria uma nova rota para aqueles que precisam usar o GET, mas sem a informação do nome da empresa
const roteador = require("express").Router();
const TabelaFornecedor = require("./TabelaFornecedor");
const Fornecedor = require("./Fornecedor");
const SerializadorFornecedor =
  require("../../Serializador").SerializadorFornecedor;

// definindo Options para resolver o problema de CORS para funcionar com /
roteador.options("/", (requisicao, resposta) => {
  resposta.set("Access-Allow-Methods", "GET");
  resposta.set("Access-Allow-Headers", "Content-Type");
  resposta.status(204);
  resposta.end();
});

roteador.get("/", async (requisicao, resposta) => {
  const resultados = await TabelaFornecedor.listar();
  resposta.status(200);
  const serializador = new SerializadorFornecedor(
    resposta.getHeader("Content-Type")
  );
  resposta.send(serializador.serializar(resultados));
});

// essa rota é do 'faça vc mesmo' para criar uma rota que retorna somente o id e categoria, diferente da rota v1 que retorna a empresa tb
roteador.post("/", async (requisicao, resposta, proximo) => {
  try {
    const fornecedor = new Fornecedor(requisicao.body);
    await fornecedor.criar();
    const serializador = new SerializadorFornecedor(
      resposta.getHeader("Content-Type")
    );
    resposta.status(201);
    resposta.send(serializador.serializar(fornecedor));
  } catch (error) {
    proximo(erro);
  }
});

module.exports = roteador;
