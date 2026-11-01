import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useSessao } from './src/auth';
import { cores } from './src/theme';
import Entrar from './src/screens/Entrar';
import Registo from './src/screens/Registo';
import Aulas from './src/screens/Aulas';
import Aula from './src/screens/Aula';
import Exercicios from './src/screens/Exercicios';
import Quiz from './src/screens/Quiz';
import Perfil from './src/screens/Perfil';

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const icone = (emoji) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;
const cabecalho = { headerStyle: { backgroundColor: cores.corEsc }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false };

function Principal() {
  return (
    <Abas.Navigator screenOptions={{ ...cabecalho, tabBarActiveTintColor: cores.cor, tabBarLabelStyle: { fontWeight: '600' } }}>
      <Abas.Screen name="Aulas" component={Aulas} options={{ tabBarIcon: icone('📚') }} />
      <Abas.Screen name="Exercicios" component={Exercicios} options={{ title: 'Exercícios', tabBarIcon: icone('📝') }} />
      <Abas.Screen name="Perfil" component={Perfil} options={{ tabBarIcon: icone('👤') }} />
    </Abas.Navigator>
  );
}

function Rotas() {
  const { sessao, pronto } = useSessao();
  if (!pronto) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={cores.cor} /></View>;
  return (
    <Pilha.Navigator screenOptions={cabecalho}>
      {sessao ? (
        <>
          <Pilha.Screen name="Principal" component={Principal} options={{ headerShown: false }} />
          <Pilha.Screen name="Aula" component={Aula} options={{ title: 'Aula' }} />
          <Pilha.Screen name="Quiz" component={Quiz} options={{ title: 'Exercícios' }} />
        </>
      ) : (
        <>
          <Pilha.Screen name="Entrar" component={Entrar} options={{ headerShown: false }} />
          <Pilha.Screen name="Registo" component={Registo} options={{ title: 'Criar conta' }} />
        </>
      )}
    </Pilha.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Rotas />
      </NavigationContainer>
    </AuthProvider>
  );
}
