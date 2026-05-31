import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import FaceAuthScreen from './src/screens/FaceAuthScreen';
import EnrollScreen from './src/screens/EnrollScreen';

type Screen = 'home' | 'auth' | 'enroll';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  if (screen === 'auth') return <FaceAuthScreen onBack={() => setScreen('home')} />;
  if (screen === 'enroll') return <EnrollScreen onBack={() => setScreen('home')} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DataLake Face Auth</Text>
      <Text style={styles.sub}>NHAI Field Authentication System</Text>
      <TouchableOpacity style={styles.btn} onPress={() => setScreen('auth')}>
        <Text style={styles.btnText}>🔐  Authenticate</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setScreen('enroll')}>
        <Text style={[styles.btnText, {color: '#00ff88'}]}>👤  Enroll New Employee</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a0a',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  title: {color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8},
  sub: {color: '#555', fontSize: 13, marginBottom: 48, textAlign: 'center'},
  btn: {
    backgroundColor: '#00ff88', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', width: '100%', marginBottom: 16,
  },
  btnSecondary: {backgroundColor: '#111', borderWidth: 1, borderColor: '#00ff88'},
  btnText: {color: '#000', fontWeight: '700', fontSize: 16},
});
