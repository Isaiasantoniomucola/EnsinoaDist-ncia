import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, percentagem } from '../api';
import { useSessao } from '../auth';
import { cores } from '../theme';
import { Barra, Botao, Campo, Cartao, Ecra, Erro, Titulo } from '../ui';

export default function Perfil() {
  const { sessao, sair, entrar } = useSessao();
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState('');
  const [s, setS] = useState({ atual: '', nova: '', confirmar: '' });
  const [msg, setMsg] = useState({ ok: false, texto: '' });
  const [a, setA] = useState(false);

  useFocusEffect(useCallback(() => { api('/aulas').then(setAulas).catch((e) => setErro(e.message)); }, []));

  const feitas = aulas.filter((x) => x.pontuacao != null);
  const media = percentagem(feitas.reduce((t, x) => t + x.pontuacao, 0), feitas.reduce((t, x) => t + x.total_resultado, 0));

  async function alterarSenha() {
    if (s.nova !== s.confirmar) return setMsg({ ok: false, texto: 'A confirmação não coincide com a nova palavra-passe.' });
    setA(true); setMsg({ ok: false, texto: '' });
    try {
      const r = await api('/auth/senha', { metodo: 'PUT', corpo: { senha_atual: s.atual, nova_senha: s.nova }, semExpirar: true });
      await entrar({ token: r.token, utilizador: sessao.utilizador }); // as sessões antigas deixam de valer
      setS({ atual: '', nova: '', confirmar: '' });
      setMsg({ ok: true, texto: 'Palavra-passe alterada com sucesso.' });
    } catch (e) { setMsg({ ok: false, texto: e.message }); }
    setA(false);
  }

  return (
    <Ecra>
      <Titulo>{sessao.utilizador.nome}</Titulo>
      <Text style={{ color: cores.suave, marginBottom: 16 }}>{sessao.utilizador.email}</Text>
      <Erro texto={erro} />
      <Cartao estilo={{ marginBottom: 16 }}>
        <Text style={{ color: cores.suave }}>Média geral</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: cores.corEsc }}>{feitas.length ? `${media}%` : '—'}</Text>
        {feitas.length > 0 && <Barra valor={media} />}
        <Text style={{ color: cores.suave, marginTop: 8 }}>{feitas.length} exercício(s) concluído(s)</Text>
      </Cartao>

      {feitas.map((x) => (
        <View key={x.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: cores.borda }}>
          <Text style={{ flex: 1, color: cores.texto }}>{x.titulo}</Text>
          <Text style={{ fontWeight: '700', color: cores.corEsc }}>{x.pontuacao}/{x.total_resultado}</Text>
        </View>
      ))}

      <Cartao estilo={{ marginTop: 24 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12, color: cores.texto }}>Alterar palavra-passe</Text>
        {!!msg.texto && <Text style={{ color: msg.ok ? cores.ok : cores.erro, marginBottom: 10 }}>{msg.texto}</Text>}
        <Campo rotulo="Palavra-passe atual" value={s.atual} onChangeText={(v) => setS({ ...s, atual: v })} secureTextEntry />
        <Campo rotulo="Nova palavra-passe (mín. 8, letras e números)" value={s.nova} onChangeText={(v) => setS({ ...s, nova: v })} secureTextEntry />
        <Campo rotulo="Confirmar nova palavra-passe" value={s.confirmar} onChangeText={(v) => setS({ ...s, confirmar: v })} secureTextEntry />
        <Botao texto="Guardar palavra-passe" onPress={alterarSenha} carregando={a} desativado={!s.atual || s.nova.length < 8} />
      </Cartao>

      <Botao texto="Terminar sessão" tipo="sec" onPress={sair} estilo={{ marginTop: 20 }} />
    </Ecra>
  );
}
