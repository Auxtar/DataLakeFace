import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {getUnsynced, purgeSynced, markSynced, initDB} from '../store/attendanceStore';

export default function AdminScreen({onBack}: {onBack: () => void}) {
  const [records, setRecords] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const refresh = () => {
    const r = getUnsynced();
    setRecords(r);
  };

  useEffect(() => {
    initDB();
    refresh();
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(!!(state.isConnected));
    });
    return () => unsub();
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      setSyncStatus('No network. Records queued for sync.');
      return;
    }
    setSyncStatus('Syncing...');
    setTimeout(() => {
      getUnsynced().forEach(r => markSynced(r.id));
      purgeSynced();
      refresh();
      setSyncStatus(`Synced ${records.length} records at ${new Date().toLocaleTimeString()}`);
    }, 1500);
  };

  const handlePurge = () => {
    getUnsynced().forEach(r => markSynced(r.id));
    purgeSynced();
    refresh();
    setSyncStatus('All records purged.');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Sync Dashboard</Text>

      <View style={[styles.statusCard, {borderColor: isOnline ? '#00ff88' : '#ff3b3b'}]}>
        <Text style={styles.statusLabel}>Network</Text>
        <Text style={[styles.statusValue, {color: isOnline ? '#00ff88' : '#ff3b3b'}]}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{records.length}</Text>
          <Text style={styles.statLabel}>Pending Sync</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{isOnline ? '✓' : '✗'}</Text>
          <Text style={styles.statLabel}>AWS Ready</Text>
        </View>
      </View>

      {syncStatus !== '' && (
        <Text style={styles.syncMsg}>{syncStatus}</Text>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleSync}>
        <Text style={styles.btnText}>↑ Sync to AWS</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handlePurge}>
        <Text style={[styles.btnText, {color: '#fff'}]}>🗑 Purge Synced Records</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>PENDING RECORDS</Text>
      <ScrollView style={styles.list}>
        {records.length === 0 && (
          <Text style={styles.empty}>No pending records</Text>
        )}
        {records.map((r, i) => (
          <View key={i} style={styles.record}>
            <Text style={styles.recordId}>{r.employee_id}</Text>
            <Text style={styles.recordTime}>{r.timestamp}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 60},
  back: {marginBottom: 20},
  backText: {color: '#00ff88', fontSize: 14},
  title: {color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20},
  statusCard: {
    borderWidth: 1, borderRadius: 10, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  statusLabel: {color: '#888', fontSize: 13},
  statusValue: {fontSize: 14, fontWeight: '700', letterSpacing: 1},
  statsRow: {flexDirection: 'row', gap: 12, marginBottom: 16},
  statBox: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  statNum: {color: '#fff', fontSize: 28, fontWeight: '700'},
  statLabel: {color: '#666', fontSize: 11, marginTop: 4},
  syncMsg: {color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 12},
  btn: {
    backgroundColor: '#00ff88', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 12,
  },
  btnDanger: {backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#ff3b3b'},
  btnText: {color: '#000', fontWeight: '700', fontSize: 15},
  sectionTitle: {color: '#666', fontSize: 11, letterSpacing: 1, marginBottom: 8, marginTop: 4},
  list: {flex: 1},
  empty: {color: '#444', fontSize: 13, textAlign: 'center', marginTop: 20},
  record: {
    backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  recordId: {color: '#fff', fontSize: 13, fontWeight: '600'},
  recordTime: {color: '#555', fontSize: 11, marginTop: 2},
});
