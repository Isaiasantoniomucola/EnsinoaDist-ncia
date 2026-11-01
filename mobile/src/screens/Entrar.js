import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api';
import { useSessao } from '../auth';
import { cores } from '../theme';
import { Botao, Campo, Erro, Marca } from '../ui';

export default function Entrar({ navigation }) {
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [a, setA] = useState(false);

  async function submeter() {
    setErro(''); setA(true);
    try { await entrar(await api('/auth/login', { metodo: 'POST', corpo: { email, senha }, semExpirar: true })); }
    catch (e) { setErro(e.message); setA(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.corEsc }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ padding: 28, paddingTop: 36, paddingBottom: 40 }}>
            <Marca />
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 28 }}>Bem-vindo de volta</Text>
            <Text style={{ color: 'rgba(255,255,255,.75)', marginTop: 4 }}>Entre para continuar os seus estudos.</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: cores.fundo, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 28 }}>
            <Erro texto={erro} />
            <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="nome@exemplo.com" />
            <Campo rotulo="Palavra-passe" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" onSubmitEditing={submeter} />
            <Botao texto="Entrar" onPress={submeter} carregando={a} desativado={!email || !senha} />
            <Pressable onPress={() => navigation.navigate('Registo')} style={{ padding: 18 }}>
              <Text style={{ textAlign: 'center', color: cores.suave }}>Ainda não tem conta? <Text style={{ color: cores.cor, fontWeight: '700' }}>Criar conta</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
