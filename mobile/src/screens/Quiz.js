import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { api, percentagem } from '../api';
import { cores } from '../theme';
import { Barra, Botao, Cartao, Ecra, Erro } from '../ui';

export default function Quiz({ route, navigation }) {
  const { id } = route.params;
  const [dados, setDados] = useState(null);
  const [resp, setResp] = useState({});
  const [erro, setErro] = useState('');
  const [env, setEnv] = useState(false);

  const carregar = useCallback(() => api(`/aulas/${id}/exercicios`)
    .then((d) => { setDados(d); navigation.setOptions({ title: d.aula.titulo }); })
    .catch((e) => setErro(e.message)), [id, navigation]);
  useEffect(() => { carregar(); }, [carregar]);

  async function enviar() {
    setEnv(true); setErro('');
    try { await api(`/aulas/${id}/submeter`, { metodo: 'POST', corpo: { respostas: resp } }); await carregar(); }
    catch (e) { setErro(e.message); }
    setEnv(false);
  }

  function confirmar() {
    const falta = dados.exercicios.length - Object.keys(resp).length;
    Alert.alert('Submeter respostas', `${falta > 0 ? `Tem ${falta} pergunta(s) sem resposta. ` : ''}Só pode submeter uma vez.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Submeter', onPress: enviar },
    ]);
  }

  if (!dados) return <Ecra><Erro texto={erro} />{!erro && <Text style={{ color: cores.suave }}>A carregar…</Text>}</Ecra>;
  const { exercicios, resultado } = dados;

  return (
    <Ecra>
      <Erro texto={erro} />
      {resultado && (
        <Cartao estilo={{ marginBottom: 16 }}>
          <Text style={{ color: cores.suave }}>A sua pontuação</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: cores.corEsc }}>
            {resultado.pontuacao} / {resultado.total} ({percentagem(resultado.pontuacao, resultado.total)}%)
          </Text>
          <Barra valor={percentagem(resultado.pontuacao, resultado.total)} />
        </Cartao>
      )}
      {exercicios.length === 0 && <Text style={{ color: cores.suave }}>Esta aula ainda não tem exercícios.</Text>}

      {exercicios.map((q, i) => (
        <View key={q.id} style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, color: cores.texto }}>{i + 1}. {q.pergunta}</Text>
          {['A', 'B', 'C', 'D'].map((l) => {
            const sel = resultado ? q.escolha === l : resp[q.id] === l;
            const certa = resultado && l === q.resposta_correta;
            const errada = resultado && sel && !certa;
            return (
              <Pressable
                key={l}
                disabled={!!resultado}
                onPress={() => setResp({ ...resp, [q.id]: l })}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                style={{ flexDirection: 'row', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8, backgroundColor: certa ? cores.okFundo : errada ? cores.erroFundo : sel ? cores.corClara : '#fff', borderColor: certa ? '#86efac' : errada ? '#fca5a5' : sel ? cores.cor : cores.borda }}
              >
                <Text style={{ fontWeight: '700' }}>{l}.</Text>
                <Text style={{ flex: 1, color: cores.texto }}>{q.opcoes[l]}</Text>
              </Pressable>
            );
          })}
          {resultado && <Text style={{ color: cores.suave }}>{q.correta ? '✅ Correto' : q.escolha ? `❌ Incorreto — resposta certa: ${q.resposta_correta}` : `⚠ Sem resposta — resposta certa: ${q.resposta_correta}`}</Text>}
        </View>
      ))}

      {!resultado && exercicios.length > 0 && <Botao texto="Submeter respostas" onPress={confirmar} carregando={env} />}
    </Ecra>
  );
}
