import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ─── Constants ───────────────────────────────────────────────────────────────

const LS = (key) => 'ic-v1-' + key;
const UID_KEY = 'ic-v1-last-uid';

const COLLECTIONS = [
  'morningAnchors', 'sundayWitnesses', 'monthlySolos', 'smallCourages',
  'ritualEntries', 'relationships', 'depthGauges', 'groundFriends',
  'groundFriendCheckIns', 'openMarks', 'identificationAssessments',
  'loweringProtocols', 'aiCompanionSessions', 'quarterlyReviews', 'yearlyReviews',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(LS(key)) || '[]'); } catch { return []; }
}

function loadLocalTheme() {
  const s = localStorage.getItem(LS('theme'));
  return (s && (s === 'ritual-warm' || s === 'ritual-light')) ? s : 'ritual-warm';
}

function fsPath(uid, colKey) {
  return doc(db, 'users', uid, 'ic', colKey);
}

// ─── Main hook ───────────────────────────────────────────────────────────────

export function useSync(user) {
  // ── State ────────────────────────────────────────────────────────────────
  const [morningAnchors,          setMA]  = useState(() => loadLocal('morningAnchors'));
  const [sundayWitnesses,         setSW]  = useState(() => loadLocal('sundayWitnesses'));
  const [monthlySolos,            setMS]  = useState(() => loadLocal('monthlySolos'));
  const [smallCourages,           setSC]  = useState(() => loadLocal('smallCourages'));
  const [ritualEntries,           setRE]  = useState(() => loadLocal('ritualEntries'));
  const [relationships,           setRL]  = useState(() => loadLocal('relationships'));
  const [depthGauges,             setDG]  = useState(() => loadLocal('depthGauges'));
  const [groundFriends,           setGF]  = useState(() => loadLocal('groundFriends'));
  const [groundFriendCheckIns,    setGC]  = useState(() => loadLocal('groundFriendCheckIns'));
  const [openMarks,               setOM]  = useState(() => loadLocal('openMarks'));
  const [identificationAssessments, setIA] = useState(() => loadLocal('identificationAssessments'));
  const [loweringProtocols,       setLP]  = useState(() => loadLocal('loweringProtocols'));
  const [aiCompanionSessions,     setAI]  = useState(() => loadLocal('aiCompanionSessions'));
  const [quarterlyReviews,        setQR]  = useState(() => loadLocal('quarterlyReviews'));
  const [yearlyReviews,           setYR]  = useState(() => loadLocal('yearlyReviews'));
  const [themeKey,                setTK]  = useState(loadLocalTheme);

  const [syncStatus, setSyncStatus]   = useState('signedOut');
  const [lastSyncAt, setLastSyncAt]   = useState(null);
  const [mergeModal, setMergeModal]   = useState(null); // { cloudData } or null

  // Keep user in a ref so write callbacks don't need to re-create on user change
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const stateMap = {
    morningAnchors:           [morningAnchors,           setMA],
    sundayWitnesses:          [sundayWitnesses,          setSW],
    monthlySolos:             [monthlySolos,             setMS],
    smallCourages:            [smallCourages,            setSC],
    ritualEntries:            [ritualEntries,            setRE],
    relationships:            [relationships,            setRL],
    depthGauges:              [depthGauges,              setDG],
    groundFriends:            [groundFriends,            setGF],
    groundFriendCheckIns:     [groundFriendCheckIns,     setGC],
    openMarks:                [openMarks,                setOM],
    identificationAssessments:[identificationAssessments,setIA],
    loweringProtocols:        [loweringProtocols,        setLP],
    aiCompanionSessions:      [aiCompanionSessions,      setAI],
    quarterlyReviews:         [quarterlyReviews,         setQR],
    yearlyReviews:            [yearlyReviews,            setYR],
  };

  // ── Firestore write (single collection) ──────────────────────────────────
  const writeCol = useCallback(async (uid, colKey, data) => {
    try {
      await setDoc(fsPath(uid, colKey), { items: data, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('writeCol failed', colKey, e);
      setSyncStatus('failed');
    }
  }, []);

  const writeSettings = useCallback(async (uid, key) => {
    try {
      await setDoc(fsPath(uid, '_settings'), { themeKey: key, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('writeSettings failed', e);
    }
  }, []);

  // ── Generic synced setter (localStorage + Firestore) ─────────────────────
  // Used by the per-collection setters exported below
  const makeSetter = useCallback((colKey, setter) => (v) => {
    setter(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      localStorage.setItem(LS(colKey), JSON.stringify(next));
      const u = userRef.current;
      if (u) writeCol(u.uid, colKey, next);
      return next;
    });
  }, [writeCol]);

  // ── Public setters ────────────────────────────────────────────────────────
  const setMorningAnchors          = useCallback((v) => makeSetter('morningAnchors',           setMA)(v), [makeSetter]);
  const setSundayWitnesses         = useCallback((v) => makeSetter('sundayWitnesses',          setSW)(v), [makeSetter]);
  const setMonthlySolos            = useCallback((v) => makeSetter('monthlySolos',             setMS)(v), [makeSetter]);
  const setSmallCourages           = useCallback((v) => makeSetter('smallCourages',            setSC)(v), [makeSetter]);
  const setRitualEntries           = useCallback((v) => makeSetter('ritualEntries',            setRE)(v), [makeSetter]);
  const setRelationships           = useCallback((v) => makeSetter('relationships',            setRL)(v), [makeSetter]);
  const setDepthGauges             = useCallback((v) => makeSetter('depthGauges',              setDG)(v), [makeSetter]);
  const setGroundFriends           = useCallback((v) => makeSetter('groundFriends',            setGF)(v), [makeSetter]);
  const setGroundFriendCheckIns    = useCallback((v) => makeSetter('groundFriendCheckIns',     setGC)(v), [makeSetter]);
  const setOpenMarks               = useCallback((v) => makeSetter('openMarks',                setOM)(v), [makeSetter]);
  const setIdentificationAssessments = useCallback((v) => makeSetter('identificationAssessments', setIA)(v), [makeSetter]);
  const setLoweringProtocols       = useCallback((v) => makeSetter('loweringProtocols',        setLP)(v), [makeSetter]);
  const setAiCompanionSessions     = useCallback((v) => makeSetter('aiCompanionSessions',      setAI)(v), [makeSetter]);
  const setQuarterlyReviews        = useCallback((v) => makeSetter('quarterlyReviews',         setQR)(v), [makeSetter]);
  const setYearlyReviews           = useCallback((v) => makeSetter('yearlyReviews',            setYR)(v), [makeSetter]);

  const setThemeKey = useCallback((v) => {
    const next = typeof v === 'function' ? v(themeKey) : v;
    setTK(next);
    localStorage.setItem(LS('theme'), next);
    const u = userRef.current;
    if (u) writeSettings(u.uid, next);
  }, [themeKey, writeSettings]);

  // ── Load all data from Firestore ──────────────────────────────────────────
  const loadCloud = useCallback(async (uid) => {
    const results = {};
    await Promise.all([
      ...COLLECTIONS.map(async (col) => {
        const snap = await getDoc(fsPath(uid, col));
        results[col] = snap.exists() ? (snap.data().items || []) : null;
      }),
      (async () => {
        const snap = await getDoc(fsPath(uid, '_settings'));
        results._settings = snap.exists() ? snap.data() : null;
      })(),
    ]);
    return results;
  }, []);

  // Apply cloud data to state + localStorage
  const applyCloudData = useCallback((cloudData) => {
    COLLECTIONS.forEach(col => {
      if (cloudData[col] !== null && cloudData[col] !== undefined) {
        const setter = stateMap[col][1];
        setter(cloudData[col]);
        localStorage.setItem(LS(col), JSON.stringify(cloudData[col]));
      }
    });
    if (cloudData._settings?.themeKey) {
      setTK(cloudData._settings.themeKey);
      localStorage.setItem(LS('theme'), cloudData._settings.themeKey);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Push all local data to Firestore
  const pushLocalToCloud = useCallback(async (uid) => {
    setSyncStatus('syncing');
    try {
      await Promise.all([
        ...COLLECTIONS.map(col => writeCol(uid, col, loadLocal(col))),
        writeSettings(uid, loadLocalTheme()),
      ]);
      setLastSyncAt(Date.now());
      setSyncStatus('synced');
    } catch {
      setSyncStatus('failed');
    }
  }, [writeCol, writeSettings]);

  // ── Handle login / account switch ─────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSyncStatus('signedOut');
      return;
    }

    // Detect account switch → clear local data
    const lastUid = localStorage.getItem(UID_KEY);
    if (lastUid && lastUid !== user.uid) {
      COLLECTIONS.forEach(col => localStorage.removeItem(LS(col)));
      localStorage.removeItem(LS('theme'));
    }
    localStorage.setItem(UID_KEY, user.uid);

    const uid = user.uid;
    setSyncStatus('syncing');

    loadCloud(uid).then(cloudData => {
      const hasCloud = COLLECTIONS.some(col => cloudData[col] !== null && cloudData[col].length > 0);
      const hasLocal = COLLECTIONS.some(col => loadLocal(col).length > 0);

      if (hasCloud && hasLocal) {
        // Both exist: ask user
        setMergeModal({ cloudData });
        setSyncStatus('synced');
      } else if (hasCloud) {
        // Cloud only: load cloud
        applyCloudData(cloudData);
        setLastSyncAt(Date.now());
        setSyncStatus('synced');
      } else {
        // Local only or fresh: push local to cloud
        pushLocalToCloud(uid);
      }
    }).catch(() => {
      setSyncStatus('offline');
    });
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle merge modal decision ───────────────────────────────────────────
  const resolveUseCloud = useCallback(() => {
    if (!mergeModal) return;
    applyCloudData(mergeModal.cloudData);
    setLastSyncAt(Date.now());
    setMergeModal(null);
  }, [mergeModal, applyCloudData]);

  const resolveUseLocal = useCallback(() => {
    if (!user || !mergeModal) return;
    setMergeModal(null);
    pushLocalToCloud(user.uid);
  }, [user, mergeModal, pushLocalToCloud]);

  // ── Manual sync (push local → cloud) ──────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await Promise.all([
        ...COLLECTIONS.map(col => writeCol(user.uid, col, stateMap[col][0])),
        writeSettings(user.uid, themeKey),
      ]);
      setLastSyncAt(Date.now());
      setSyncStatus('synced');
    } catch {
      setSyncStatus('failed');
    }
  }, [user, themeKey, writeCol, writeSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online/offline detection ───────────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => { if (syncStatus !== 'signedOut') setSyncStatus('synced'); };
    const onOffline = () => { if (syncStatus !== 'signedOut') setSyncStatus('offline'); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [syncStatus]);

  return {
    // Data
    morningAnchors, sundayWitnesses, monthlySolos, smallCourages, ritualEntries,
    relationships, depthGauges, groundFriends, groundFriendCheckIns, openMarks,
    identificationAssessments, loweringProtocols, aiCompanionSessions,
    quarterlyReviews, yearlyReviews, themeKey,
    // Setters
    setMorningAnchors, setSundayWitnesses, setMonthlySolos, setSmallCourages, setRitualEntries,
    setRelationships, setDepthGauges, setGroundFriends, setGroundFriendCheckIns, setOpenMarks,
    setIdentificationAssessments, setLoweringProtocols, setAiCompanionSessions,
    setQuarterlyReviews, setYearlyReviews, setThemeKey,
    // Sync
    syncStatus, lastSyncAt, syncNow,
    // Merge modal
    mergeModal, resolveUseCloud, resolveUseLocal,
  };
}
