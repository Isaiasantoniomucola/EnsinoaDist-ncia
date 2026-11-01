const bcrypt = require('bcryptjs');

// Custo 12: mais lento para quem tenta adivinhar palavras-passe, imperceptível ao entrar.
const CUSTO = 12;
// Hash "falso" usado quando o e-mail não existe, para que o tempo de resposta seja igual
// (impede descobrir que e-mails estão registados).
const HASH_FALSO = bcrypt.hashSync('palavra-passe-inexistente', CUSTO);

module.exports = {
  gerar: (senha) => bcrypt.hash(senha, CUSTO),
  verificar: (senha, hash) => bcrypt.compare(senha, hash || HASH_FALSO).then((ok) => !!hash && ok),
};
