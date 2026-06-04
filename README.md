# DataLakeFace

Offline facial recognition and liveness detection for NHAI field personnel attendance. Built for NHAI Hackathon 7.0 as a drop-in module for the existing Datalake 3.0 React Native app.

Authenticates the right person, on a mid-range Android, entirely offline — and syncs to AWS when connectivity returns.

---

## What it does

- Detects and recognises a field worker's face in under 1.2 seconds on a mid-range device
- Works with zero internet connection at authentication time
- Runs a liveness challenge (blink / smile / turn head) to reject photo and screen spoofing
- Logs attendance to local SQLite and auto-syncs to AWS S3 when connectivity is restored
- Purges local records after confirmed sync
- Supports 6 Indian languages: Hindi, Marathi, Tamil, Telugu, Kannada, Bengali

---

## Architecture

```
Camera Snapshot (takeSnapshot)
        ↓
Native Resize → 320×320 JPEG (ImageResizer, cover mode)
        ↓
JPEG Decode → raw RGB pixels (jpeg-js)
        ↓
Letterbox Square → full-frame square canvas (JS, no distortion)
        ↓
BlazeFace Detection → face bbox + confidence (TFLite, 128×128 input)
        ↓
Square Crop → padded face region (10% margin, square-normalised)
        ↓
MobileFaceNet Embedding → 192-dim float vector (TFLite, 112×112 input)
        ↓
Cosine Match → compare against enrolled templates (threshold 0.72)
        ↓
Attendance Logged → SQLite (offline) → AWS S3 sync on reconnect → purge
```

---

## Models

| Model | File | Size | Input | Output |
|---|---|---|---|---|
| BlazeFace | blazeface.tflite | 225 KB | 128×128×3 | 896 anchors, 16 coords + scores |
| MobileFaceNet | mobilefacenet.tflite | 5 MB | 112×112×3 | 192-dim embedding |
| Liveness | liveness.tflite | 1.9 MB | 224×224×3 | live / spoof score |
| **Total** | | **~7 MB** | | |

BlazeFace uses the stock MediaPipe front-camera model (facedetector_front_blaze_2019_10_17_v0) with full SSD anchor decode: 896 anchors, strides [8,16,16,16], scale 128, reverse_output_order.

MobileFaceNet embeddings are L2-normalised before cosine comparison. Enrollment averages 5 captures per user.

---

## Performance

Tested on OnePlus Nord (2020) and Motorola G35. CPU only, no GPU.

| Stage | Time |
|---|---|
| Camera Snapshot | 141 ms |
| Native Resize | 57 ms |
| JPEG Decode | 478 ms |
| Letterbox + Align | 36 ms |
| BlazeFace Detection | 40 ms |
| Face Crop | 38 ms |
| MobileFaceNet Embed | 37 ms |
| Cosine Match | 3 ms |
| **Total Auth Round-trip** | **862 ms – 1121 ms** |

| Metric | Value |
|---|---|
| Genuine cosine score | 0.781 |
| Impostor max score | < 0.19 |
| Detection confidence | 0.93 – 0.96 |
| Model bundle size | ~7 MB |

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | React Native 0.76 (New Architecture) |
| TFLite inference | react-native-nitro-tflite 0.1.1 |
| Camera | react-native-vision-camera 4.6.4 |
| Image resize | @bam.tech/react-native-image-resizer |
| JPEG decode | jpeg-js |
| Local storage | @op-engineering/op-sqlite + react-native-mmkv |
| Offline detection | @react-native-community/netinfo |
| File system | react-native-fs |

All dependencies are open-source. No paid licences required.

---

## Running the project

### Prerequisites

- Node.js 18+
- JDK 17 (Microsoft build recommended)
- Android SDK with platform-tools
- React Native 0.76 CLI

### Setup

```bash
git clone https://github.com/Auxtar/DataLakeFace.git
cd DataLakeFace
npm install
```

### Android

```bash
# Terminal 1 — Metro
npx react-native start --reset-cache

# Terminal 2 — Build
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### ADB reverse (dev only)

```bash
adb kill-server
adb start-server
adb reverse tcp:8081 tcp:8081
```

---

## Enrollment

1. Open the app and navigate to Enroll.
2. Enter the employee ID.
3. Capture 5 face samples — the app averages and L2-normalises the embeddings automatically.
4. Re-enroll if the recognition pipeline is updated (any change to crop, resize, or normalisation invalidates stored templates).

---

## Sync & Purge

- Attendance records are stored locally in SQLite with AES-256 encrypted faceprints.
- The app monitors connectivity via NetInfo.
- On reconnect, records are uploaded to AWS S3 via presigned URL — no AWS credentials are stored on the device.
- Local records are purged only after the sync is confirmed.

---

## Liveness Detection

Active gesture challenge: the user is prompted to blink, smile, or turn their head before recognition runs. The challenge is randomised per session. A passive TFLite liveness model (liveness.tflite) runs in parallel and logs its score for future use.

---

## Integration with Datalake 3.0

The recognition module exposes three functions:

```typescript
// Enroll a new user (call once per employee)
enrollUser(employeeId: string, name: string): Promise<void>

// Authenticate (call on each attendance check)
authenticateUser(): Promise<{ employeeId: string; score: number } | null>

// Sync pending records to AWS
syncAttendance(): Promise<void>
```

Drop these into the existing Datalake 3.0 navigation flow. The module has no external dependencies beyond what is listed above and adds ~7 MB to the app bundle.

---

## Constraints met

| Requirement | Target | Result |
|---|---|---|
| Model footprint | ~20 MB | ~7 MB |
| Auth speed | < 1 second | 862 ms – 1121 ms |
| Framework | React Native Android + iOS | RN 0.76 New Arch |
| Hardware | Mid-range, no GPU, 3 GB RAM | CPU only, tested on two devices |
| Offline liveness | Blink / smile / turn | Active gesture challenge |
| Sync & purge | AWS on reconnect | S3 + local purge |
| Open source only | No paid licences | MIT / Apache stack |

---

## NHAI Hackathon 7.0

Submission by Auxtar · 05 June 2026
