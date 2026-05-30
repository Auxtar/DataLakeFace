export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';

interface Strings {
  tapToStart: string;
  positionFace: string;
  blink: string;
  smile: string;
  turnLeft: string;
  verifying: string;
  verified: string;
  failed: string;
  retry: string;
  start: string;
  fieldAuth: string;
}

export const translations: Record<Language, Strings> = {
  en: {
    tapToStart: 'Tap Start to authenticate',
    positionFace: 'Position your face in the frame',
    blink: 'Blink your eyes slowly',
    smile: 'Give a natural smile',
    turnLeft: 'Slowly turn your head left',
    verifying: 'Verifying identity...',
    verified: 'Identity verified',
    failed: 'Verification failed. Try again.',
    retry: 'Retry',
    start: 'Start',
    fieldAuth: 'Field Authentication',
  },
  hi: {
    tapToStart: 'प्रमाणीकरण शुरू करने के लिए क्लिक करें',
    positionFace: 'अपना चेहरा फ्रेम में रखें',
    blink: 'धीरे-धीरे पलकें झपकाएं',
    smile: 'स्वाभाविक मुस्कान दें',
    turnLeft: 'धीरे-धीरे सिर बाईं ओर घुमाएं',
    verifying: 'पहचान सत्यापित हो रही है...',
    verified: 'पहचान सत्यापित हुई',
    failed: 'सत्यापन विफल। पुनः प्रयास करें।',
    retry: 'पुनः प्रयास',
    start: 'शुरू करें',
    fieldAuth: 'फील्ड प्रमाणीकरण',
  },
  ta: {
    tapToStart: 'உறுதிப்படுத்த Start அழுத்தவும்',
    positionFace: 'உங்கள் முகத்தை சட்டகத்தில் வையுங்கள்',
    blink: 'மெதுவாக கண்களை மூடி திறக்கவும்',
    smile: 'இயற்கையான புன்னகை கொடுங்கள்',
    turnLeft: 'தலையை மெதுவாக இடதுபுறம் திருப்பவும்',
    verifying: 'அடையாளம் சரிபார்க்கப்படுகிறது...',
    verified: 'அடையாளம் உறுதிப்படுத்தப்பட்டது',
    failed: 'சரிபார்ப்பு தோல்வி. மீண்டும் முயற்சிக்கவும்.',
    retry: 'மீண்டும் முயற்சி',
    start: 'தொடங்கு',
    fieldAuth: 'கள அங்கீகாரம்',
  },
  te: {
    tapToStart: 'ధృవీకరించడానికి Start నొక్కండి',
    positionFace: 'మీ ముఖాన్ని ఫ్రేమ్‌లో ఉంచండి',
    blink: 'మెల్లగా కళ్ళు మూసి తెరవండి',
    smile: 'సహజంగా నవ్వండి',
    turnLeft: 'తల మెల్లగా ఎడమవైపు తిప్పండి',
    verifying: 'గుర్తింపు ధృవీకరించబడుతోంది...',
    verified: 'గుర్తింపు ధృవీకరించబడింది',
    failed: 'ధృవీకరణ విఫలమైంది. మళ్ళీ ప్రయత్నించండి.',
    retry: 'మళ్ళీ ప్రయత్నించు',
    start: 'ప్రారంభించు',
    fieldAuth: 'ఫీల్డ్ ప్రమాణీకరణ',
  },
  bn: {
    tapToStart: 'প্রমাণীকরণের জন্য Start চাপুন',
    positionFace: 'আপনার মুখ ফ্রেমে রাখুন',
    blink: 'ধীরে ধীরে চোখ পিটপিট করুন',
    smile: 'স্বাভাবিক হাসি দিন',
    turnLeft: 'আস্তে আস্তে মাথা বাঁদিকে ঘোরান',
    verifying: 'পরিচয় যাচাই হচ্ছে...',
    verified: 'পরিচয় যাচাই হয়েছে',
    failed: 'যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন',
    start: 'শুরু করুন',
    fieldAuth: 'ফিল্ড প্রমাণীকরণ',
  },
  mr: {
    tapToStart: 'प्रमाणीकरणासाठी Start दाबा',
    positionFace: 'आपला चेहरा फ्रेममध्ये ठेवा',
    blink: 'हळूहळू डोळे मिचकावा',
    smile: 'नैसर्गिक हास्य द्या',
    turnLeft: 'हळूहळू डोके डावीकडे वळवा',
    verifying: 'ओळख सत्यापित होत आहे...',
    verified: 'ओळख सत्यापित झाली',
    failed: 'सत्यापन अयशस्वी. पुन्हा प्रयत्न करा.',
    retry: 'पुन्हा प्रयत्न करा',
    start: 'सुरू करा',
    fieldAuth: 'फील्ड प्रमाणीकरण',
  },
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  hi: 'हि',
  ta: 'த',
  te: 'తె',
  bn: 'বা',
  mr: 'म',
};
