import { Platform } from 'react-native';

// Defina EXPO_PUBLIC_API_URL (ficheiro .env) com o IP do computador onde corre a API,
// por exemplo http://192.168.1.10:4000. No emulador Android o computador é 10.0.2.2.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');
