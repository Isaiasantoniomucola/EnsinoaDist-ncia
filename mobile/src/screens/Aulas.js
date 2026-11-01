import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { cores } from '../theme';
import { Cartao, Erro, Etiqueta, centrado } from '../ui';

const filtros = [['todas', 'Todas'], ['documento', 'PDF'], ['video', 'Vídeos']];

export default function Aulas({ navigation }) {
  const { width } = useWindowDimensions();
  const colunas = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const [aulas, setAulas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);

  const carregar = useCallback(async () => {
    setA(true); setErro('');
    try { setAulas(await api('/aulas')); } catch (e) { setErro(e.message); }
    setA(false);
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const lista = aulas.filter((x) => filtro === 'todas' || x.categoria === filtro);

  return (
    <FlatList
      key={`c${colunas}`}
      numColumns={colunas}
      data={lista}
      keyExtractor={(x) => String(x.id)}
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={{ ...centrado, maxWidth: 1100 }}
      refreshControl={<RefreshControl refreshing={a} onRefresh={carregar} />}
      ListHeaderComponent={(
        <View style={{ marginBottom: 10 }}>
          <Erro texto={erro} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {filtros.map(([k, t]) => (
              <Pressable key={k} onPress={() => setFiltro(k)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: filtro === k ? cores.cor : '#fff', borderWidth: 1, borderColor: filtro === k ? cores.cor : cores.borda }}>
                <Text style={{ color: filtro === k ? '#fff' : cores.texto, fontWeight: '600' }}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      ListEmptyComponent={!a && !erro ? <Text style={{ color: cores.suave }}>Ainda não há aulas.</Text> : null}
      renderItem={({ item }) => (
        <Pressable style={{ flex: 1 / colunas, padding: 6 }} onPress={() => navigation.navigate('Aula', { id: item.id })}>
          <Cartao estilo={{ gap: 6, minHeight: 110 }}>
            <Etiqueta texto={`${item.categoria === 'video' ? '🎬' : '📄'} ${item.capitulo}`} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: cores.texto }}>{item.titulo}</Text>
            {!!item.descricao && <Text numberOfLines={2} style={{ color: cores.suave }}>{item.descricao}</Text>}
          </Cartao>
        </Pressable>
      )}
    />
  );
}
