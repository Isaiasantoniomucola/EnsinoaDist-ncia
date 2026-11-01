import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { cores } from '../theme';
import { Cartao, Erro, Etiqueta, centrado } from '../ui';

export default function Exercicios({ navigation }) {
  const [aulas, setAulas] = useState([]);
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);

  const carregar = useCallback(async () => {
    setA(true); setErro('');
    try { setAulas((await api('/aulas')).filter((x) => x.total_exercicios > 0)); } catch (e) { setErro(e.message); }
    setA(false);
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <FlatList
      data={aulas}
      keyExtractor={(x) => String(x.id)}
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={centrado}
      refreshControl={<RefreshControl refreshing={a} onRefresh={carregar} />}
      ListHeaderComponent={<Erro texto={erro} />}
      ListEmptyComponent={!a && !erro ? <Text style={{ color: cores.suave }}>Ainda não há exercícios.</Text> : null}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => navigation.navigate('Quiz', { id: item.id })}>
          <Cartao estilo={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: cores.suave, fontSize: 12 }}>{item.capitulo}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: cores.texto }}>{item.titulo}</Text>
              <Text style={{ color: cores.suave }}>{item.total_exercicios} pergunta(s)</Text>
            </View>
            {item.pontuacao != null ? <Etiqueta tipo="ok" texto={`${item.pontuacao}/${item.total_resultado}`} /> : <Etiqueta tipo="aviso" texto="Por fazer" />}
          </Cartao>
        </Pressable>
      )}
    />
  );
}
