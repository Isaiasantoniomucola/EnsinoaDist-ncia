import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores } from './theme';

// Conteúdo centrado com largura máxima: fica bem em telemóveis e tablets.
export const centrado = { padding: 16, width: '100%', maxWidth: 900, alignSelf: 'center' };

export function Ecra({ children, seguro = false }) {
  const Raiz = seguro ? SafeAreaView : View;
  return (
    <Raiz style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={centrado} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </Raiz>
  );
}

export function Botao({ texto, onPress, tipo = 'primario', desativado, carregando, estilo }) {
  const sec = tipo === 'sec';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desativado || carregando}
      onPress={onPress}
      style={({ pressed }) => [e.botao, sec && e.botaoSec, pressed && { opacity: 0.85 }, (desativado || carregando) && { opacity: 0.5 }, estilo]}
    >
      {carregando ? <ActivityIndicator color={sec ? cores.cor : '#fff'} /> : <Text style={[e.botaoTxt, sec && { color: cores.cor }]}>{texto}</Text>}
    </Pressable>
  );
}

export function Campo({ rotulo, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={e.rotulo}>{rotulo}</Text>
      <TextInput placeholderTextColor={cores.suave} autoCapitalize="none" style={e.input} {...props} />
    </View>
  );
}

export const Cartao = ({ children, estilo }) => <View style={[e.cartao, estilo]}>{children}</View>;

export function Etiqueta({ texto, tipo }) {
  const ok = tipo === 'ok';
  return (
    <View style={[e.etiqueta, ok && { backgroundColor: cores.okFundo }, tipo === 'aviso' && { backgroundColor: cores.ouroClaro }]}>
      <Text style={[e.etiquetaTxt, ok && { color: cores.ok }, tipo === 'aviso' && { color: cores.ouroEsc }]}>{texto}</Text>
    </View>
  );
}

export const Barra = ({ valor }) => (
  <View style={e.barra}><View style={[e.barraIn, { width: `${valor}%` }]} /></View>
);

export const Erro = ({ texto }) => (texto ? <View style={e.erro}><Text style={{ color: cores.erro }}>{texto}</Text></View> : null);

export function Marca({ pequena }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: pequena ? 34 : 44, height: pequena ? 34 : 44, borderRadius: 12, backgroundColor: cores.ouro, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: pequena ? 18 : 24 }}>🎓</Text>
      </View>
      <View>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: pequena ? 18 : 24, letterSpacing: 0.5 }}>EaD</Text>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' }}>Ensino a Distância</Text>
      </View>
    </View>
  );
}

export const Titulo = ({ children }) => <Text style={e.titulo}>{children}</Text>;

const e = StyleSheet.create({
  botao: { minHeight: 48, borderRadius: 12, backgroundColor: cores.cor, borderWidth: 1, borderColor: cores.cor, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 10 },
  botaoSec: { backgroundColor: '#fff' },
  botaoTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rotulo: { fontWeight: '600', marginBottom: 6, color: cores.texto },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff', color: cores.texto },
  cartao: { backgroundColor: '#fff', borderWidth: 1, borderColor: cores.borda, borderRadius: 14, padding: 14 },
  etiqueta: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99, backgroundColor: cores.corClara },
  etiquetaTxt: { fontSize: 12, fontWeight: '700', color: cores.cor },
  barra: { height: 8, borderRadius: 99, backgroundColor: '#e2e8f0', overflow: 'hidden', marginTop: 8 },
  barraIn: { height: '100%', backgroundColor: cores.cor },
  erro: { backgroundColor: cores.erroFundo, borderColor: '#f6c5ce', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  titulo: { fontSize: 24, fontWeight: '800', color: cores.texto, marginBottom: 6 },
});
