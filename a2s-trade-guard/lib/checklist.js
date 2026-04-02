// A2s Default Checklist Steps
const A2S_CHECKLIST_STEPS = [
  {
    id: "step1",
    title: "סקירה שבועית",
    description: "בדיקה של איפה אנחנו עומדים בשוק ביחס לסקירה השבועית",
    tf: "Weekly",
  },
  {
    id: "step2",
    title: "נזילות יומית",
    description: "סימון הנזילות הקרובה בגרף היומי",
    tf: "Daily",
  },
  {
    id: "step3",
    title: "נזילות ואזורי עניין",
    description: "נזילות קרובה בגרף ה-4H וזיהוי אזורי עניין",
    tf: "4H",
  },
  {
    id: "step4",
    title: "אורדר פלואו",
    description: "הבנת אורדר פלואו נוכחי בגרף השעתי",
    tf: "1H",
  },
  {
    id: "step5",
    title: "זיהוי תהליך",
    description: "זיהוי התהליך בגרף 15M לפי המודל האישי (MMXM / PO3 / ERL-IRL)",
    tf: "15M",
  },
  {
    id: "step6",
    title: "אישורי כניסה",
    description: "קבלת אישורי כניסה בטווחי הזמן הנמוכים",
    tf: "5-1M",
  },
];

// Unlock duration in minutes (default 30 min)
const A2S_UNLOCK_DURATION_MIN = 30;
