import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Vibration} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission, useCameraFormat} from 'react-native-vision-camera';
import {getRandomChallenge, getChallengeInstruction} from '../services/livenessService';
import {initDB, saveAttendance, getEnrollments} from '../store/attendanceStore';
import {startSyncWatcher} from '../services/syncService';
import {translations, LANGUAGE_LABELS, Language} from '../utils/translations';
import {loadModels, getFaceEmbedding, isLive, findBestMatch, RECOGNITION_THRESHOLD} from '../services/inferenceService';
import {snapshotToPixels} from '../utils/imageUtils';

type AuthState = 'idle' | 'detecting' | 'liveness' | 'recognising' | 'success' | 'failed';

const STATE_COLORS: Record<AuthState, string> = {
  idle: '#666',
  detecting: '#f0a500',
  liveness: '#00aaff',
  recognising: '#aa00ff',
  success: '#00ff88',
  failed: '#ff3b3b',
};

const LANGUAGES = Object.keys(LANGUAGE_LABELS) as Language[];

export default function FaceAuthScreen(props: {onBack?: () => void}) {
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [{photoResolution: {width: 480, height: 640}}]);
  const {hasPermission, requestPermission} = useCameraPermission();
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [instruction, setInstruction] = useState('');
  const [timer, setTimer] = useState(0);
  const [speedMs, setSpeedMs] = useState(0);
  const [lang, setLang] = useState<Language>('hi');
  const [matchedName, setMatchedName] = useState('');
  const [modelsReady, setModelsReady] = useState(false);
  const onBack = props.onBack;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<Camera>(null);
  const t = translations[lang];

  useEffect(() => {
    if (!hasPermission) requestPermission();
    initDB();
    startSyncWatcher();
    loadModels().then(ok => setModelsReady(ok));
  }, []);

  useEffect(() => {
    if (authState === 'idle') setInstruction(t.tapToStart);
  }, [lang, authState]);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startAuth = () => {
    if (!modelsReady) {
      setInstruction('Models loading, please wait...');
      return;
    }
    setAuthState('detecting');
    setInstruction(t.positionFace);
    setTimeout(() => runLiveness(), 2000);
  };

  const runLiveness = () => {
    const c = getRandomChallenge();
    setAuthState('liveness');
    setInstruction(getChallengeInstruction(c, t));
    let remaining = 5;
    setTimer(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimer(remaining);
      if (remaining <= 0) {
        clearTimer();
        runRecognition();
      }
    }, 1000);
  };

  const runRecognition = async () => {
    const startTime = Date.now();
    setAuthState('recognising');
    setInstruction(t.verifying);

    try {
      const snapshot = await cameraRef.current!.takeSnapshot({quality: 10});
      console.log('[Auth] snapshot:', snapshot.path);

      const pixels = await snapshotToPixels(snapshot.path);

      if (!pixels) {
        console.warn('[Auth] pixel decode failed');
        setAuthState('failed');
        setInstruction(t.failed);
        setTimeout(() => reset(), 3000);
        return;
      }

      isLive(pixels.px224);

      const embedding = getFaceEmbedding(pixels.px112);
      if (embedding.length === 0) {
        console.warn('[Auth] empty embedding');
        setAuthState('failed');
        setInstruction(t.failed);
        setTimeout(() => reset(), 3000);
        return;
      }

      const enrollments = getEnrollments();
      const match = findBestMatch(embedding, enrollments);
      const elapsed = Date.now() - startTime;
      setSpeedMs(elapsed);

      console.log('[Auth] best match:', match?.employee_id, 'score:', match?.score.toFixed(3));

      if (match && match.score >= RECOGNITION_THRESHOLD) {
        saveAttendance(match.employee_id, embedding, true);
        setMatchedName(match.name);
        setAuthState('success');
        setInstruction(`${t.verified} · ${elapsed}ms`);
        Vibration.vibrate(200);
      } else {
        setAuthState('failed');
        setInstruction(t.failed);
      }
    } catch (e) {
      console.error('[Auth] recognition error:', e);
      setAuthState('failed');
      setInstruction(t.failed);
    }
    setTimeout(() => reset(), 3000);
  };

  const reset = () => {
    clearTimer();
    setAuthState('idle');
    setInstruction(t.tapToStart);
    setTimer(0);
    setMatchedName('');
  };

  const cycleLanguage = () => {
    const idx = LANGUAGES.indexOf(lang);
    setLang(LANGUAGES[(idx + 1) % LANGUAGES.length]);
  };

  if (!hasPermission || !device) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Camera permission required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        format={format}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.overlay}>
        <View style={styles.topRow}>
          {onBack && <TouchableOpacity onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity>}
          <Text style={styles.header}>{t.fieldAuth}</Text>
          <TouchableOpacity style={styles.langBtn} onPress={cycleLanguage}>
            <Text style={styles.langText}>{LANGUAGE_LABELS[lang]}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.frame, {borderColor: STATE_COLORS[authState]}]} />
        {instruction.length > 0 && (
          <View style={styles.instructionPill}>
            <Text style={styles.instruction}>{instruction}</Text>
          </View>
        )}
        {!modelsReady && <Text style={styles.modelWarn}>⚠ Loading AI models...</Text>}
        {authState === 'liveness' && timer > 0 && (
          <Text style={styles.timer}>{timer}s</Text>
        )}
        {authState === 'idle' && (
          <TouchableOpacity style={styles.btn} onPress={startAuth}>
            <Text style={styles.btnText}>{t.start}</Text>
          </TouchableOpacity>
        )}
        {authState === 'success' && (
          <>
            {matchedName.length > 0 && <Text style={styles.nameText}>{matchedName}</Text>}
            {speedMs > 0 && <Text style={styles.speedBadge}>{speedMs}ms</Text>}
          </>
        )}
        {authState === 'failed' && (
          <TouchableOpacity style={[styles.btn, {backgroundColor: '#ff3b3b'}]} onPress={reset}>
            <Text style={styles.btnText}>{t.retry}</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.statusBadge, {borderColor: STATE_COLORS[authState]}]}>
          <Text style={[styles.statusText, {color: STATE_COLORS[authState]}]}>
            {authState.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a'},
  msg: {color: '#fff', fontSize: 15},
  overlay: {flex: 1, justifyContent: 'space-between', padding: 24, paddingTop: 60},
  topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  header: {color: '#fff', fontSize: 18, fontWeight: '600'},
  langBtn: {borderWidth: 1, borderColor: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4},
  langText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  frame: {width: 240, height: 300, borderWidth: 2, borderRadius: 120, alignSelf: 'center', marginTop: 20},
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  instructionPill: {
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginBottom: 8,
  },
  timer: {color: '#00aaff', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 8},
  btn: {backgroundColor: '#00ff88', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 20},
  btnText: {color: '#000', fontWeight: '700', fontSize: 15},
  statusBadge: {alignSelf: 'center', backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 30, borderWidth: 1},
  speedBadge: {color: '#00ff88', fontSize: 13, textAlign: 'center', marginBottom: 8, fontWeight: '700'},
  nameText: {color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 4, fontWeight: '600'},
  modelWarn: {color: '#f0a500', fontSize: 12, textAlign: 'center', marginBottom: 8},
  backText: {color: '#00ff88', fontSize: 13},
  statusText: {fontSize: 11, letterSpacing: 1.5},
});
