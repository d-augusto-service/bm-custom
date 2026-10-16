/* Métodos de pagamento (versão simples). Edite aqui os dados.
   mostrarDados: true  = o titular, o número e o IBAN aparecem na página da encomenda (e ficam visíveis no código do site público).
   mostrarDados: false = a página só mostra o nome do método e diz ao cliente que os dados seguem por WhatsApp. */
window.PAGAMENTO = {
  "mostrarDados": true,
  "titular": "Belmiro Manuel Pacheco",
  "metodos": {
    "multicaixa": {
      "nome": "Multicaixa Express",
      "descricao": "Pague com a app Multicaixa Express.",
      "campo": "Número",
      "valor": "953387677",
      "passos": [
        "Abra a app Multicaixa Express.",
        "Envie o valor exato da encomenda para o número indicado, em nome do titular.",
        "Se a app permitir uma descrição, escreva o código da encomenda.",
        "Guarde o comprovativo e envie-o pelo WhatsApp da B’M Custom."
      ]
    },
    "paypay": {
      "nome": "PayPay África",
      "descricao": "Pague com a app PayPay África.",
      "campo": "Número",
      "valor": "953387677",
      "passos": [
        "Abra a app PayPay África.",
        "Envie o valor exato da encomenda para o número indicado, em nome do titular.",
        "Se a app permitir uma descrição, escreva o código da encomenda.",
        "Guarde o comprovativo e envie-o pelo WhatsApp da B’M Custom."
      ]
    },
    "iban": {
      "nome": "Transferência bancária",
      "descricao": "Transfira para o nosso IBAN.",
      "campo": "IBAN",
      "valor": "005500000271646410180",
      "passos": [
        "Na app ou no balcão do seu banco, faça uma transferência para o IBAN indicado, em nome do titular.",
        "Transfira o valor exato da encomenda e use o código da encomenda como descrição, se possível.",
        "Guarde o comprovativo e envie-o pelo WhatsApp da B’M Custom."
      ]
    }
  }
};
