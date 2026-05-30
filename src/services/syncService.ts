import NetInfo from '@react-native-community/netinfo';
import { getUnsynced, markSynced, purgeSynced } from '../store/attendanceStore';

// replace with your actual presigned URL endpoint
const SYNC_ENDPOINT = 'https://your-lambda-endpoint.amazonaws.com/sync';

export function startSyncWatcher() {
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncPendingRecords();
    }
  });
}

async function syncPendingRecords() {
  const records = getUnsynced();
  if (records.length === 0) return;

  for (const record of records) {
    try {
      const res = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(record),
      });
      if (res.ok) {
        markSynced(record.id);
      }
    } catch (e) {
      // no network — will retry on next connectivity event
    }
  }

  purgeSynced();
}
