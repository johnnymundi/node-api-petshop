const roteador = require("express").Router({ mergeParams: true });
const Tabela = require("./TabelaProduto");
const Produto = require("./Produto");
const Serializador = require("../../../Serializador").SerializadorProduto;

// definindo Options para resolver o problema de CORS para funcionar com /
roteador.options("/", (requisicao, resposta) => {
  resposta.set("Access-Allow-Methods", "GET, POST");
  resposta.set("Access-Allow-Headers", "Content-Type"); // para permitir o acesso ao content-type
  resposta.status(204);
  resposta.end();
});

roteador.get("/", async (requisicao, resposta) => {
  const produtos = await Tabela.listar(requisicao.fornecedor.id);
  const serializador = new Serializador(resposta.getHeader("Content-Type"));
  resposta.send(serializador.serializar(produtos));
});

roteador.post("/", async (requisicao, resposta, proximo) => {
  try {
    const idFornecedor = requisicao.fornecedor.id;
    const corpo = requisicao.body;
    const dados = Object.assign({}, corpo, { fornecedor: idFornecedor });
    const produto = new Produto(dados);
    await produto.criar();
    const serializador = new Serializador(resposta.getHeader("Content-Type"));
    // abaixo são os sets q são cabeçalhos para enriquecer as respostas deixando com a api com uma comunicação melhorada e mais fácil de compreender
    resposta.set("ETag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp); // segundo parâmetro é o timestamp
    resposta.set(
      "Location",
      `api/fornecedores/${produto.fornecedor}/produtos/${produto.id}`
    ); // aqui indica onde a pessoa pode acessar pra conseguir mais infos do produto
    resposta.status(201);
    resposta.send(serializador.serializar(produto));
  } catch (erro) {
    proximo(erro);
  }
});

// definindo Options para resolver o problema de CORS para funcionar com /:id
roteador.options("/:id", (requisicao, resposta) => {
  resposta.set("Access-Allow-Methods", "DELETE, GET, HEAD, PUT");
  resposta.set("Access-Allow-Headers", "Content-Type"); // para permitir o acesso ao content-type
  resposta.status(204);
  resposta.end();
});

roteador.delete("/:id", async (requisicao, resposta) => {
  const dados = {
    id: requisicao.params.id,
    fornecedor: requisicao.fornecedor.id,
  };

  const produto = new Produto(dados);
  await produto.apagar();
  resposta.status(204);
  resposta.end();
});
// pesquisa um produto somente
roteador.get("/:id", async (requisicao, resposta, proximo) => {
  try {
    const dados = {
      id: requisicao.params.id,
      fornecedor: requisicao.fornecedor.id,
    };

    const produto = new Produto(dados); // instanciia a partir da requisicao pelo id e fornecedor
    await produto.carregar(); // chama o carregar q vai chamar o pegarPorId() que vai chamar o findOne()
    const serializador = new Serializador(resposta.getHeader("Content-Type"), [
      "preco",
      "estoque",
      "fornecedor",
      "dataCriacao",
      "dataAtualizacao",
      "versao",
    ]);
    resposta.set("ETag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp); // segundo parâmetro é o timestamp
    resposta.send(serializador.serializar(produto));
  } catch (erro) {
    proximo(erro);
  }
});

roteador.head("/:d", async (requisicao, resposta, proximo) => {
  try {
    const dados = {
      id: requisicao.params.id,
      fornecedor: requisicao.fornecedor.id,
    };

    const produto = new Produto(dados); // instanciia a partir da requisicao pelo id e fornecedor
    await produto.carregar(); // chama o carregar q vai chamar o pegarPorId() que vai chamar o findOne()
    resposta.set("ETag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp); // segundo parâmetro é o timestamp
    resposta.status(200);
    resposta.end();
  } catch (erro) {
    proximo(erro);
  }
});

roteador.put("/:id", async (requisicao, resposta, proximo) => {
  try {
    const dados = Object.assign({}, requisicao.body, {
      id: requisicao.params.id,
      fornecedor: requisicao.fornecedor.id,
    });

    const produto = new Produto(dados);
    await produto.atualizar();
    await produto.carregar();
    resposta.set("ETag", produto.versao);
    const timestamp = new Date(produto.dataAtualizacao).getTime();
    resposta.set("Last-Modified", timestamp); // segundo parâmetro é o timestamp
    resposta.status(204);
    resposta.end();
  } catch (erro) {
    proximo(erro);
  }
});

// definindo Options para resolver o problema de CORS para funcionar com o controller /:id/diminuir-estoque
roteador.options("/:id/diminuir-estoque", (requisicao, resposta) => {
  resposta.set("Access-Allow-Methods", "POST");
  resposta.set("Access-Allow-Headers", "Content-Type"); // para permitir o acesso ao content-type
  resposta.status(204);
  resposta.end();
});

roteador.post(
  // para atualizações de quantidades, utilizamos o post como um controller em vez do put
  "/:id/diminuir-estoque",
  async (requisicao, resposta, proximo) => {
    try {
      const produto = new Produto({
        id: requisicao.params.id,
        fornecedor: requisicao.fornecedor.id,
      });

      await produto.carregar();
      produto.estoque = produto.estoque - requisicao.body.quantidade; // vamos atualizar o estoque ao diminuir o estoque de acordo com a quantidade indicada no body
      await produto.diminuirEstoque();
      await produto.carregar();
      resposta.set("ETag", produto.versao);
      const timestamp = new Date(produto.dataAtualizacao).getTime();
      resposta.set("Last-Modified", timestamp); // segundo parâmetro é o timestamp
      resposta.status(204);
      resposta.end();
    } catch (erro) {
      proximo(erro);
    }
  }
);

module.exports = roteador;
