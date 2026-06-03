import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, Alert} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission, useCameraFormat} from 'react-native-vision-camera';
import {initDB, saveEnrollment} from '../store/attendanceStore';
import {loadModels, getFaceEmbedding} from '../services/inferenceService';
import {snapshotToPixels} from '../utils/imageUtils';

type EnrollState = 'form' | 'camera' | 'capturing' | 'done';

export default function EnrollScreen({onBack}: {onBack: () => void}) {
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [{photoResolution: {width: 480, height: 640}}]);
  const {hasPermission, requestPermission} = useCameraPermission();
  const [state, setState] = useState<EnrollState>('form');
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [modelsReady, setModelsReady] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
    initDB();
    loadModels().then(ok => setModelsReady(ok));
  }, []);

  const startCapture = () => {
    if (!empId.trim() || !empName.trim()) {
      Alert.alert('Required', 'Please enter Employee ID and Name');
      return;
    }
    if (!modelsReady) {
      Alert.alert('Please wait', 'AI models still loading');
      return;
    }
    setState('camera');
  };

  const capture = async () => {
    setState('capturing');
    try {
      const SAMPLES = 5;
      const embeddings: number[][] = [];

      for (let i = 0; i < SAMPLES; i++) {
        await new Promise(r => setTimeout(r, 300));
        const snapshot = await cameraRef.current!.takeSnapshot({quality: 10});
        const pixels = await snapshotToPixels(snapshot.path);
        if (!pixels) continue;
        const emb = getFaceEmbedding(pixels.px112);
        if (emb.length > 0) embeddings.push(emb);
        console.log('[Enroll] sample', i + 1, '/', SAMPLES, 'got embedding len:', emb.length);
      }

      if (embeddings.length === 0) {
        Alert.alert('Error', 'Face capture failed, please try again');
        setState('camera');
        return;
      }

      // Average all embeddings
      const dim = embeddings[0].length;
      const averaged = Array.from({length: dim}, (_, i) =>
        embeddings.reduce((sum, e) => sum + e[i], 0) / embeddings.length
      );

      // Normalise averaged vector
      const mag = Math.sqrt(averaged.reduce((s, v) => s + v * v, 0));
      const normalised = averaged.map(v => v / (mag || 1));

      console.log('[Enroll] averaged', embeddings.length, 'samples, dim:', dim);
      saveEnrollment(empId.trim(), empName.trim(), normalised);
      setState('done');
    } catch (e) {
      console.error('[Enroll] capture failed:', e);
      Alert.alert('Error', 'Face capture failed, please try again');
      setState('camera');
    }
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
        {!modelsReady && <Text style={styles.warn}>⚠ Loading AI models...</Text>}
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
      <Camera
        format={format}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device!}
        isActive={true}
        photo={true}
      />
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
  btn: {backgroundColor: '#00ff88', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12},
  btnText: {color: '#000', fontWeight: '700', fontSize: 15},
  warn: {color: '#f0a500', fontSize: 12, textAlign: 'center', marginBottom: 8},
  successIcon: {fontSize: 64, color: '#00ff88', marginBottom: 16},
  successText: {color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8},
  subText: {color: '#666', fontSize: 14, marginBottom: 32},
  camOverlay: {flex: 1, justifyContent: 'space-between', padding: 24, paddingTop: 60},
  camTitle: {color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center'},
  camSub: {color: '#888', fontSize: 13, textAlign: 'center'},
  frame: {width: 240, height: 300, borderWidth: 2, borderColor: '#00ff88', borderRadius: 120, alignSelf: 'center'},
  instruction: {color: '#ccc', fontSize: 14, textAlign: 'center'},
  captureBtn: {width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff', alignSelf: 'center', marginBottom: 40, alignItems: 'center', justifyContent: 'center'},
  captureInner: {width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff'},
});
