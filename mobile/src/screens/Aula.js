import React, { useEffect, useState } from 'react';
import { Linking, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { api, urlFicheiro } from '../api';
import { cores } from '../theme';
import { Botao, Ecra, Erro, Etiqueta, Titulo } from '../ui';

function Video({ uri }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#000', marginVertical: 12 }} allowsFullscreen />;
}

export default function Aula({ route, navigation }) {
  const { id } = route.params;
  const [aula, setAula] = useState(null);
  const [erro, setErro] = useState('');
  const [uri, setUri] = useState('');

  useEffect(() => {
    api(`/aulas/${id}`).then((a) => { setAula(a); navigation.setOptions({ title: a.titulo }); }).catch((e) => setErro(e.message));
  }, [id, navigation]);

  // Bilhete do vídeo (curto e só para esta aula).
  useEffect(() => {
    if (aula?.tem_ficheiro && aula.categoria === 'video') urlFicheiro(aula.id).then(setUri).catch((e) => setErro(e.message));
  }, [aula]);

  const abrir = async (descarregar) => {
    try { await Linking.openURL(await urlFicheiro(aula.id, descarregar)); } catch (e) { setErro(e.message); }
  };

  if (!aula) return <Ecra><Erro texto={erro} />{!erro && <Text style={{ color: cores.suave }}>A carregar…</Text>}</Ecra>;

  return (
    <Ecra>
      <Etiqueta texto={aula.capitulo} />
      <Titulo>{aula.titulo}</Titulo>
      <Erro texto={erro} />
      {!!aula.descricao && <Text style={{ color: cores.texto, marginBottom: 8 }}>{aula.descricao}</Text>}

      {aula.tem_ficheiro ? (
        <>
          {aula.categoria === 'video' && (uri ? <Video uri={uri} /> : <Text style={{ color: cores.suave, marginVertical: 12 }}>A preparar o vídeo…</Text>)}
          {aula.categoria !== 'video' && <Botao texto="📄 Abrir PDF" onPress={() => abrir(false)} estilo={{ marginVertical: 8 }} />}
          <Botao texto="⬇ Descarregar" tipo="sec" onPress={() => abrir(true)} estilo={{ marginBottom: 8 }} />
        </>
      ) : <Text style={{ color: cores.suave, marginVertical: 8 }}>Esta aula ainda não tem ficheiro anexado.</Text>}

      <Botao texto="📝 Fazer exercícios" onPress={() => navigation.navigate('Quiz', { id: aula.id })} />
    </Ecra>
  );
}
