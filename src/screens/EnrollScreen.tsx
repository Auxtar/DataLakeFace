import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, Alert} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {initDB, saveEnrollment} from '../store/attendanceStore';

type EnrollState = 'form' | 'camera' | 'capturing' | 'done';

export default function EnrollScreen({onBack}: {onBack: () => void}) {
  const device = useCameraDevice('front');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [state, setState] = useState<EnrollState>('form');
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');

  useEffect(() => {
    if (!hasPermission) requestPermission();
    initDB();
  }, []);

  const startCapture = () => {
    if (!empId.trim() || !empName.trim()) {
      Alert.alert('Required', 'Please enter Employee ID and Name');
      return;
    }
    setState('camera');
  };

  const capture = () => {
    setState('capturing');
    setTimeout(() => {
      // mock face vector — TFLite embedding will replace this
      const mockVector = Array.from({length: 128}, () => Math.random() * 2 - 1);
      saveEnrollment(empId.trim(), empName.trim(), mockVector);
      setState('done');
    }, 1500);
  };

  if (state === 'form') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Register Employee</Text>
        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          style={styles.input}
          value={empId}
          onChangeText={setEmpId}
          placeholder="e.g. EMP_001"
          placeholderTextColor="#555"
          autoCapitalize="characters"
        />
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={empName}
          onChangeText={setEmpName}
          placeholder="e.g. Rajesh Kumar"
          placeholderTextColor="#555"
        />
        <TouchableOpacity style={styles.btn} onPress={startCapture}>
          <Text style={styles.btnText}>Proceed to Face Capture</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'done') {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>{empName} enrolled</Text>
        <Text style={styles.subText}>{empId}</Text>
        <TouchableOpacity style={styles.btn} onPress={onBack}>
          <Text style={styles.btnText}>Go to Authentication</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device!} isActive={true} />
      <View style={styles.camOverlay}>
        <Text style={styles.camTitle}>Face Capture</Text>
        <Text style={styles.camSub}>{empName} · {empId}</Text>
        <View style={styles.frame} />
        <Text style={styles.instruction}>
          {state === 'capturing' ? 'Capturing...' : 'Position face in frame'}
        </Text>
        {state === 'camera' && (
          <TouchableOpacity style={styles.captureBtn} onPress={capture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 60},
  center: {flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 24},
  back: {marginBottom: 24},
  backText: {color: '#00ff88', fontSize: 14},
  title: {color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 32},
  label: {color: '#888', fontSize: 12, marginBottom: 6, letterSpacing: 1},
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 8,
    padding: 14, fontSize: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333',
  },
  btn: {
    backgroundColor: '#00ff88', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 12,
  },
  btnText: {color: '#000', fontWeight: '700', fontSize: 15},
  successIcon: {fontSize: 64, color: '#00ff88', marginBottom: 16},
  successText: {color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8},
  subText: {color: '#666', fontSize: 14, marginBottom: 32},
  camOverlay: {flex: 1, justifyContent: 'space-between', padding: 24, paddingTop: 60},
  camTitle: {color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center'},
  camSub: {color: '#888', fontSize: 13, textAlign: 'center'},
  frame: {
    width: 240, height: 300, borderWidth: 2, borderColor: '#00ff88',
    borderRadius: 120, alignSelf: 'center',
  },
  instruction: {color: '#ccc', fontSize: 14, textAlign: 'center'},
  captureBtn: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 3,
    borderColor: '#fff', alignSelf: 'center', marginBottom: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: {width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff'},
});
