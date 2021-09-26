const roteador = require("express").Router();
const TabelaFornecedor = require("./TabelaFornecedor");
const Fornecedor = require("./Fornecedor");
const SerializadorFornecedor =
  require("../../Serializador").SerializadorFornecedor;

// o '/' diz ao options quais os métodos disponíveis para a rota api/fornecedores (essas rotas abaixo), basicamente sendo uma auto-documentação da nossa API
// O método HTTP OPTIONS é para documentação e verificação de rotas
// definindo Options para resolver o problema de CORS para funcionar com /
roteador.options("/", (requisicao, resposta) => {
  resposta.set("Access-Allow-Methods", "GET, POST");
  resposta.set("Access-Allow-Headers", "Content-Type");
  resposta.status(204);
  resposta.end();
});

roteador.get("/", async (requisicao, resposta) => {
  const resultados = await TabelaFornecedor.listar();
  resposta.status(200);
  const serializador = new SerializadorFornecedor(
    resposta.getHeader("Content-Type"),
    ["empresa"]
  );
  resposta.send(serializador.serializar(resultados));
});

roteador.post("/", async (requisicao, resposta, proximo) => {
  try {
    const dadosRecebidos = requisicao.body;
    const fornecedor = new Fornecedor(dadosRecebidos);
    await fornecedor.criar();
    resposta.status(201);
    const serializador = new SerializadorFornecedor(
      resposta.getHeader("Content-Type"),
      ["empresa"]
    );
    resposta.send(serializador.serializar(fornecedor));
  } catch (erro) {
    proximo(erro);
  }
});

// definindo Options para resolver o problema de CORS para funcionar com /:idFornecedor
roteador.options("/:idFornecedor", (requisicao, resposta) => {
  resposta.set("Access-Allow-Methods", "GET, PUT, DELETE");
  resposta.set("Access-Allow-Headers", "Content-Type"); // para permitir o acesso ao content-type
  resposta.status(204);
  resposta.end();
});

roteador.get("/:idFornecedor", async (requisicao, resposta, proximo) => {
  try {
    const id = requisicao.params.idFornecedor;
    const fornecedor = new Fornecedor({ id: id });
    await fornecedor.carregar();
    resposta.status(200);
    const serializador = new SerializadorFornecedor(
      resposta.getHeader("Content-Type"),
      ["email", "empres", "dataCriacao", "dataAtualizacao", "versao"]
    );
    resposta.send(serializador.serializar(fornecedor));
  } catch (erro) {
    proximo(erro);
  }
});

roteador.put("/:idFornecedor", async (requisicao, resposta, proximo) => {
  try {
    const id = requisicao.params.idFornecedor;
    const dadosRecebidos = requisicao.body;
    // Objects.assign() é uma função JS para juntar vários objetos em um só
    const dados = Object.assign({}, dadosRecebidos, { id: id });
    const fornecedor = new Fornecedor(dados);
    await fornecedor.atualizar();
    resposta.status(204);
    resposta.end();
  } catch (erro) {
    proximo(erro);
  }
});

roteador.delete("/:idFornecedor", async (requisicao, resposta, proximo) => {
  try {
    const id = requisicao.params.idFornecedor;
    const fornecedor = new Fornecedor({ id: id });
    await fornecedor.carregar();
    await fornecedor.remover();
    resposta.status(204);
    resposta.end();
  } catch (erro) {
    proximo(erro);
  }
});

const roteadorProdutos = require("./produtos");

const verificarFornecedor = async (requisicao, resposta, proximo) => {
  try {
    const id = requisicao.params.idFornecedor;
    const fornecedor = new Fornecedor({ id: id });
    await fornecedor.carregar();
    requisicao.fornecedor = fornecedor; // pegando todos os fornecedores já verificados e injetando na nossa requisicao
    // para que todas as rotas que estão consumindo a nossa requisicao consigam acessar a instancia de fornecedor
    // sem precisar ficar pegando do parâmetro da requisição
    // essa é uma prática comum do express onde conseguimos pegar qualquer coisa  e injetar dentro da requisicao pra ficarem disponíveis para todas as rotas
    proximo();
  } catch (erro) {
    proximo(erro);
  }
};
roteador.use("/:idFornecedor/produtos", verificarFornecedor, roteadorProdutos);

module.exports = roteador;
