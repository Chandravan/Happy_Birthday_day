import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, firebaseApp, isFirebaseConfigured, storage } from "../lib/firebase";

const FALLBACK_ORDER = Number.MAX_SAFE_INTEGER;

function getNumericOrder(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : FALLBACK_ORDER;
}

function normalizeOrder(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapWithOrdering(snapshot, mapper) {
  return snapshot.docs
    .map((docSnap) => mapper(docSnap.id, docSnap.data() || {}))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt - b.createdAt;
    });
}

function normalizeBucketName(rawBucket = "") {
  return rawBucket.replace(/^gs:\/\//, "").replace(/\/+$/, "").trim();
}

function getBucketCandidates() {
  const configuredBucket = normalizeBucketName(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || ""
  );
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim();
  const candidates = [];

  if (configuredBucket) candidates.push(configuredBucket);

  if (projectId) {
    candidates.push(`${projectId}.firebasestorage.app`);
    candidates.push(`${projectId}.appspot.com`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function isNetworkLikeStorageError(error) {
  const code = error?.code || "";
  const message = String(error?.message || "");

  if (code === "storage/unknown") return true;

  return /cors|preflight|failed to fetch|network|xmlhttprequest|err_failed/i.test(
    message
  );
}

function getFriendlyStorageError(error, bucketCandidates) {
  const code = error?.code || "";
  const message = String(error?.message || "");
  const bucketHint =
    bucketCandidates.length > 0
      ? `Bucket check karo: ${bucketCandidates.join(" ya ")}`
      : "Storage bucket value check karo.";

  if (code === "storage/unauthorized") {
    return "Storage rules upload allow nahi kar rahi. Firebase Console > Storage > Rules me authenticated write allow karo.";
  }

  if (code === "storage/quota-exceeded") {
    return "Storage quota exceed ho gaya. Firebase billing/usage check karo.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "Upload retry limit exceed ho gaya. Internet stable karke dobara try karo.";
  }

  if (isNetworkLikeStorageError(error)) {
    return `Upload request fail hua (CORS/network). ${bucketHint} Firebase Console me Storage bucket create/enable hona chahiye aur project Blaze plan pe hona chahiye.`;
  }

  return message || "File upload nahi ho paya. Firebase Storage config check karo.";
}

function getGridClass(total) {
  if (total >= 3) return "xl:grid-cols-3";
  if (total === 2) return "lg:grid-cols-2";
  return "";
}

function giftPersonLabel(givenBy) {
  return givenBy === "him" ? "Given By Him" : "Given By Her";
}

async function uploadFile(file, folderPath, uid) {
  if (!firebaseApp) {
    throw new Error("Firebase app initialize nahi hua.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folderPath}/${uid || "unknown-user"}/${Date.now()}-${safeName}`;
  const bucketCandidates = getBucketCandidates();
  const storageTargets = [];
  const seenBuckets = new Set();

  if (storage) {
    const currentBucket = normalizeBucketName(storage.app.options.storageBucket || "");
    const key = currentBucket || "__default__";
    seenBuckets.add(key);
    storageTargets.push({ instance: storage, bucket: currentBucket });
  }

  bucketCandidates.forEach((bucketName) => {
    if (seenBuckets.has(bucketName)) return;
    seenBuckets.add(bucketName);
    storageTargets.push({
      instance: getStorage(firebaseApp, `gs://${bucketName}`),
      bucket: bucketName,
    });
  });

  if (!storageTargets.length) {
    throw new Error("Storage bucket configured nahi hai. `.env` me VITE_FIREBASE_STORAGE_BUCKET set karo.");
  }

  let lastError = null;

  for (const target of storageTargets) {
    try {
      const fileRef = ref(target.instance, filePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      return { url, filePath, bucket: target.bucket };
    } catch (error) {
      lastError = error;

      if (!isNetworkLikeStorageError(error)) {
        break;
      }
    }
  }

  throw new Error(getFriendlyStorageError(lastError, bucketCandidates));
}

export default function AdminPanelPage({ user, mode = "all" }) {
  const showSongs = mode === "all" || mode === "songs";
  const showPhotos = mode === "all" || mode === "photos";
  const showGifts = mode === "all" || mode === "gifts";
  const isSongsOnly = mode === "songs";

  const [songs, setSongs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingGifts, setLoadingGifts] = useState(true);

  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [songOrder, setSongOrder] = useState("");
  const [songPlacement, setSongPlacement] = useState("both");
  const [songFile, setSongFile] = useState(null);
  const [savingSong, setSavingSong] = useState(false);
  const [editingSongId, setEditingSongId] = useState("");
  const [editingSongOrder, setEditingSongOrder] = useState("");
  const [editingSongPlacement, setEditingSongPlacement] = useState("both");
  const [savingSongSettingsId, setSavingSongSettingsId] = useState("");

  const [photoTitle, setPhotoTitle] = useState("");
  const [photoVibe, setPhotoVibe] = useState("");
  const [photoHint, setPhotoHint] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoOrder, setPhotoOrder] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState("");
  const [editingPhotoTitle, setEditingPhotoTitle] = useState("");
  const [editingPhotoVibe, setEditingPhotoVibe] = useState("");
  const [editingPhotoHint, setEditingPhotoHint] = useState("");
  const [editingPhotoCaption, setEditingPhotoCaption] = useState("");
  const [editingPhotoUrl, setEditingPhotoUrl] = useState("");
  const [editingPhotoOrder, setEditingPhotoOrder] = useState("");
  const [replacePhotoFile, setReplacePhotoFile] = useState(null);
  const [savingPhotoSettingsId, setSavingPhotoSettingsId] = useState("");

  const [giftTitle, setGiftTitle] = useState("");
  const [giftDetail, setGiftDetail] = useState("");
  const [giftGivenBy, setGiftGivenBy] = useState("her");
  const [giftOrder, setGiftOrder] = useState("");
  const [giftUrl, setGiftUrl] = useState("");
  const [giftFile, setGiftFile] = useState(null);
  const [savingGift, setSavingGift] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState("");
  const [editingGiftTitle, setEditingGiftTitle] = useState("");
  const [editingGiftDetail, setEditingGiftDetail] = useState("");
  const [editingGiftGivenBy, setEditingGiftGivenBy] = useState("her");
  const [editingGiftOrder, setEditingGiftOrder] = useState("");
  const [editingGiftUrl, setEditingGiftUrl] = useState("");
  const [replaceGiftFile, setReplaceGiftFile] = useState(null);
  const [savingGiftSettingsId, setSavingGiftSettingsId] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const formColumnsClass = useMemo(() => {
    const total = [showSongs, showPhotos, showGifts].filter(Boolean).length;
    return getGridClass(total);
  }, [showGifts, showPhotos, showSongs]);

  const managerColumnsClass = useMemo(() => {
    const total = [showSongs, showPhotos, showGifts].filter(Boolean).length;
    return getGridClass(total);
  }, [showGifts, showPhotos, showSongs]);

  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      setLoadingSongs(false);
      setLoadingPhotos(false);
      setLoadingGifts(false);
      return undefined;
    }

    let songsUnsubscribe = () => {};
    let photosUnsubscribe = () => {};
    let giftsUnsubscribe = () => {};

    if (showSongs) {
      songsUnsubscribe = onSnapshot(
        collection(db, "songs"),
        (snapshot) => {
          const mappedSongs = mapWithOrdering(snapshot, (id, data) => ({
            id,
            title: data.title || "Untitled Song",
            artist: data.artist || "",
            src: data.src || "",
            storagePath: data.storagePath || "",
            order: getNumericOrder(data.order),
            playInJourney: data.playInJourney !== false,
            createdAt: data.createdAt?.toMillis?.() || 0,
          })).filter((song) => Boolean(song.src));

          setSongs(mappedSongs);
          setLoadingSongs(false);
        },
        () => {
          setLoadingSongs(false);
          setSongs([]);
        }
      );
    } else {
      setLoadingSongs(false);
    }

    if (showPhotos) {
      photosUnsubscribe = onSnapshot(
        collection(db, "photos"),
        (snapshot) => {
          const mappedPhotos = mapWithOrdering(snapshot, (id, data) => ({
            id,
            title: data.title || "Memory Frame",
            vibe: data.vibe || "Pure us energy",
            hint: data.hint || "Add a special click here",
            caption: data.caption || "",
            imageUrl: data.imageUrl || "",
            storagePath: data.storagePath || "",
            order: getNumericOrder(data.order),
            createdAt: data.createdAt?.toMillis?.() || 0,
          }));

          setPhotos(mappedPhotos);
          setLoadingPhotos(false);
        },
        () => {
          setLoadingPhotos(false);
          setPhotos([]);
        }
      );
    } else {
      setLoadingPhotos(false);
    }

    if (showGifts) {
      giftsUnsubscribe = onSnapshot(
        collection(db, "gifts"),
        (snapshot) => {
          const mappedGifts = mapWithOrdering(snapshot, (id, data) => ({
            id,
            title: data.title || "Untitled Gift",
            detail: data.detail || "",
            givenBy: data.givenBy === "him" ? "him" : "her",
            imageUrl: data.imageUrl || "",
            storagePath: data.storagePath || "",
            order: getNumericOrder(data.order),
            createdAt: data.createdAt?.toMillis?.() || 0,
          }));

          setGifts(mappedGifts);
          setLoadingGifts(false);
        },
        () => {
          setLoadingGifts(false);
          setGifts([]);
        }
      );
    } else {
      setLoadingGifts(false);
    }

    return () => {
      songsUnsubscribe();
      photosUnsubscribe();
      giftsUnsubscribe();
    };
  }, [showGifts, showPhotos, showSongs]);

  const clearSongForm = () => {
    setSongTitle("");
    setSongArtist("");
    setSongUrl("");
    setSongOrder("");
    setSongPlacement("both");
    setSongFile(null);
  };

  const clearPhotoForm = () => {
    setPhotoTitle("");
    setPhotoVibe("");
    setPhotoHint("");
    setPhotoCaption("");
    setPhotoUrl("");
    setPhotoOrder("");
    setPhotoFile(null);
  };

  const clearGiftForm = () => {
    setGiftTitle("");
    setGiftDetail("");
    setGiftGivenBy("her");
    setGiftOrder("");
    setGiftUrl("");
    setGiftFile(null);
  };

  const saveSong = async (event) => {
    event.preventDefault();

    if (!db || !isFirebaseConfigured) {
      setErrorMessage("Firebase setup missing hai. Pehle .env values set karo.");
      return;
    }

    if (!songTitle.trim()) {
      setErrorMessage("Song title required hai.");
      return;
    }

    if (!songFile && !songUrl.trim()) {
      setErrorMessage("Song URL ya audio file me se ek dena zaroori hai.");
      return;
    }

    setSavingSong(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      let finalSource = songUrl.trim();
      let storagePath = "";

      if (songFile) {
        const uploadResult = await uploadFile(songFile, "songs", user?.uid);
        finalSource = uploadResult.url;
        storagePath = uploadResult.filePath;
      }

      await addDoc(collection(db, "songs"), {
        title: songTitle.trim(),
        artist: songArtist.trim(),
        src: finalSource,
        order: normalizeOrder(songOrder),
        playInJourney: songPlacement !== "songs_only",
        storagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearSongForm();
      setStatusMessage("Song successfully add ho gaya.");
    } catch (error) {
      setErrorMessage(error?.message || "Song save nahi ho paya.");
    } finally {
      setSavingSong(false);
    }
  };

  const savePhoto = async (event) => {
    event.preventDefault();

    if (!db || !isFirebaseConfigured) {
      setErrorMessage("Firebase setup missing hai. Pehle .env values set karo.");
      return;
    }

    if (!photoTitle.trim()) {
      setErrorMessage("Photo title required hai.");
      return;
    }

    if (!photoFile && !photoUrl.trim()) {
      setErrorMessage("Photo URL ya image file me se ek dena zaroori hai.");
      return;
    }

    setSavingPhoto(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      let finalImageUrl = photoUrl.trim();
      let storagePath = "";

      if (photoFile) {
        const uploadResult = await uploadFile(photoFile, "photos", user?.uid);
        finalImageUrl = uploadResult.url;
        storagePath = uploadResult.filePath;
      }

      await addDoc(collection(db, "photos"), {
        title: photoTitle.trim(),
        vibe: photoVibe.trim(),
        hint: photoHint.trim(),
        caption: photoCaption.trim(),
        imageUrl: finalImageUrl,
        order: normalizeOrder(photoOrder),
        storagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearPhotoForm();
      setStatusMessage("Photo successfully add ho gayi.");
    } catch (error) {
      setErrorMessage(error?.message || "Photo save nahi ho payi.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const saveGift = async (event) => {
    event.preventDefault();

    if (!db || !isFirebaseConfigured) {
      setErrorMessage("Firebase setup missing hai. Pehle .env values set karo.");
      return;
    }

    if (!giftTitle.trim()) {
      setErrorMessage("Gift title required hai.");
      return;
    }

    if (!giftDetail.trim()) {
      setErrorMessage("Gift detail required hai.");
      return;
    }

    setSavingGift(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      let finalImageUrl = giftUrl.trim();
      let storagePath = "";

      if (giftFile) {
        const uploadResult = await uploadFile(giftFile, "gifts", user?.uid);
        finalImageUrl = uploadResult.url;
        storagePath = uploadResult.filePath;
      }

      await addDoc(collection(db, "gifts"), {
        title: giftTitle.trim(),
        detail: giftDetail.trim(),
        givenBy: giftGivenBy === "him" ? "him" : "her",
        imageUrl: finalImageUrl,
        storagePath,
        order: normalizeOrder(giftOrder),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearGiftForm();
      setStatusMessage("Gift successfully add ho gaya.");
    } catch (error) {
      setErrorMessage(error?.message || "Gift save nahi ho paya.");
    } finally {
      setSavingGift(false);
    }
  };

  const deleteSong = async (song) => {
    if (!db) return;
    if (!window.confirm(`Delete song "${song.title}"?`)) return;

    setDeletingId(song.id);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await deleteDoc(doc(db, "songs", song.id));

      if (song.storagePath && storage) {
        await deleteObject(ref(storage, song.storagePath)).catch(() => undefined);
      }

      setStatusMessage("Song delete ho gaya.");
    } catch (error) {
      setErrorMessage(error?.message || "Song delete nahi ho paya.");
    } finally {
      setDeletingId("");
    }
  };

  const startEditSongSettings = (song) => {
    setEditingSongId(song.id);
    setEditingSongOrder(
      song.order === FALLBACK_ORDER ? "" : String(song.order)
    );
    setEditingSongPlacement(song.playInJourney === false ? "songs_only" : "both");
    setErrorMessage("");
    setStatusMessage("");
  };

  const cancelEditSongSettings = () => {
    setEditingSongId("");
    setEditingSongOrder("");
    setEditingSongPlacement("both");
  };

  const cancelEditPhotoSettings = () => {
    setEditingPhotoId("");
    setEditingPhotoTitle("");
    setEditingPhotoVibe("");
    setEditingPhotoHint("");
    setEditingPhotoCaption("");
    setEditingPhotoUrl("");
    setEditingPhotoOrder("");
    setReplacePhotoFile(null);
  };

  const cancelEditGiftSettings = () => {
    setEditingGiftId("");
    setEditingGiftTitle("");
    setEditingGiftDetail("");
    setEditingGiftGivenBy("her");
    setEditingGiftOrder("");
    setEditingGiftUrl("");
    setReplaceGiftFile(null);
  };

  const saveSongSettings = async (songId) => {
    if (!db) return;

    setSavingSongSettingsId(songId);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await updateDoc(doc(db, "songs", songId), {
        order: normalizeOrder(editingSongOrder),
        playInJourney: editingSongPlacement !== "songs_only",
        updatedAt: serverTimestamp(),
      });

      cancelEditSongSettings();
      setStatusMessage("Song settings update ho gayi.");
    } catch (error) {
      setErrorMessage(error?.message || "Song settings save nahi ho payi.");
    } finally {
      setSavingSongSettingsId("");
    }
  };

  const startEditPhotoSettings = (photo) => {
    setEditingPhotoId(photo.id);
    setEditingPhotoTitle(photo.title || "");
    setEditingPhotoVibe(photo.vibe || "");
    setEditingPhotoHint(photo.hint || "");
    setEditingPhotoCaption(photo.caption || "");
    setEditingPhotoUrl(photo.imageUrl || "");
    setEditingPhotoOrder(photo.order === FALLBACK_ORDER ? "" : String(photo.order));
    setReplacePhotoFile(null);
    setErrorMessage("");
    setStatusMessage("");
  };

  const savePhotoSettings = async (photo) => {
    if (!db) return;

    if (!editingPhotoTitle.trim()) {
      setErrorMessage("Photo title required hai.");
      return;
    }

    setSavingPhotoSettingsId(photo.id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      let finalImageUrl = editingPhotoUrl.trim() || photo.imageUrl || "";
      let nextStoragePath = photo.storagePath || "";

      if (replacePhotoFile) {
        const uploadResult = await uploadFile(replacePhotoFile, "photos", user?.uid);
        finalImageUrl = uploadResult.url;
        nextStoragePath = uploadResult.filePath;
      } else if (editingPhotoUrl.trim() && editingPhotoUrl.trim() !== photo.imageUrl) {
        nextStoragePath = "";
      }

      if (!finalImageUrl) {
        setErrorMessage("Photo URL ya image file dena zaroori hai.");
        setSavingPhotoSettingsId("");
        return;
      }

      await updateDoc(doc(db, "photos", photo.id), {
        title: editingPhotoTitle.trim(),
        vibe: editingPhotoVibe.trim(),
        hint: editingPhotoHint.trim(),
        caption: editingPhotoCaption.trim(),
        imageUrl: finalImageUrl,
        order: normalizeOrder(editingPhotoOrder),
        storagePath: nextStoragePath,
        updatedAt: serverTimestamp(),
      });

      if (
        replacePhotoFile &&
        photo.storagePath &&
        nextStoragePath &&
        photo.storagePath !== nextStoragePath &&
        storage
      ) {
        await deleteObject(ref(storage, photo.storagePath)).catch(() => undefined);
      }

      cancelEditPhotoSettings();
      setStatusMessage("Photo settings update ho gayi.");
    } catch (error) {
      setErrorMessage(error?.message || "Photo settings save nahi ho payi.");
    } finally {
      setSavingPhotoSettingsId("");
    }
  };

  const startEditGiftSettings = (gift) => {
    setEditingGiftId(gift.id);
    setEditingGiftTitle(gift.title || "");
    setEditingGiftDetail(gift.detail || "");
    setEditingGiftGivenBy(gift.givenBy === "him" ? "him" : "her");
    setEditingGiftOrder(gift.order === FALLBACK_ORDER ? "" : String(gift.order));
    setEditingGiftUrl(gift.imageUrl || "");
    setReplaceGiftFile(null);
    setErrorMessage("");
    setStatusMessage("");
  };

  const saveGiftSettings = async (gift) => {
    if (!db) return;

    if (!editingGiftTitle.trim()) {
      setErrorMessage("Gift title required hai.");
      return;
    }

    if (!editingGiftDetail.trim()) {
      setErrorMessage("Gift detail required hai.");
      return;
    }

    setSavingGiftSettingsId(gift.id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      let finalImageUrl = editingGiftUrl.trim() || gift.imageUrl || "";
      let nextStoragePath = gift.storagePath || "";

      if (replaceGiftFile) {
        const uploadResult = await uploadFile(replaceGiftFile, "gifts", user?.uid);
        finalImageUrl = uploadResult.url;
        nextStoragePath = uploadResult.filePath;
      } else if (editingGiftUrl.trim() && editingGiftUrl.trim() !== gift.imageUrl) {
        nextStoragePath = "";
      }

      await updateDoc(doc(db, "gifts", gift.id), {
        title: editingGiftTitle.trim(),
        detail: editingGiftDetail.trim(),
        givenBy: editingGiftGivenBy === "him" ? "him" : "her",
        imageUrl: finalImageUrl,
        storagePath: nextStoragePath,
        order: normalizeOrder(editingGiftOrder),
        updatedAt: serverTimestamp(),
      });

      if (
        replaceGiftFile &&
        gift.storagePath &&
        nextStoragePath &&
        gift.storagePath !== nextStoragePath &&
        storage
      ) {
        await deleteObject(ref(storage, gift.storagePath)).catch(() => undefined);
      }

      cancelEditGiftSettings();
      setStatusMessage("Gift settings update ho gayi.");
    } catch (error) {
      setErrorMessage(error?.message || "Gift settings save nahi ho payi.");
    } finally {
      setSavingGiftSettingsId("");
    }
  };

  const deletePhoto = async (photo) => {
    if (!db) return;
    if (!window.confirm(`Delete photo "${photo.title}"?`)) return;

    setDeletingId(photo.id);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await deleteDoc(doc(db, "photos", photo.id));

      if (photo.storagePath && storage) {
        await deleteObject(ref(storage, photo.storagePath)).catch(() => undefined);
      }

      setStatusMessage("Photo delete ho gayi.");
    } catch (error) {
      setErrorMessage(error?.message || "Photo delete nahi ho payi.");
    } finally {
      setDeletingId("");
    }
  };

  const deleteGift = async (gift) => {
    if (!db) return;
    if (!window.confirm(`Delete gift "${gift.title}"?`)) return;

    setDeletingId(gift.id);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await deleteDoc(doc(db, "gifts", gift.id));

      if (gift.storagePath && storage) {
        await deleteObject(ref(storage, gift.storagePath)).catch(() => undefined);
      }

      setStatusMessage("Gift delete ho gaya.");
    } catch (error) {
      setErrorMessage(error?.message || "Gift delete nahi ho paya.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="countdown-lock-card relative overflow-hidden rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-10">
        <header>
          <p className="tracking-love text-xs uppercase text-[#93452a]">
            Content Control Room
          </p>
          <h2 className="font-script mt-3 text-[2.65rem] leading-[0.9] text-[#672415] sm:text-7xl">
            {isSongsOnly ? "Admin Songs" : "Admin Panel"}
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-[#6d3d30] sm:text-base">
            {isSongsOnly
              ? "Is page se tum direct songs add/edit/delete kar sakte ho."
              : "Yahan se songs, memory photos aur gifts sab add/edit/delete kar sakte ho. File upload karoge to Firebase Storage me save hoga, aur URL doge to direct use hoga."}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9b5238]">
            Logged in as: {user?.email || "Unknown user"}
          </p>

          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
            {mode !== "all" && (
              <Link
                to="/admin"
                className="rounded-full border border-[#d28667] bg-white px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3f26] transition hover:bg-[#ffe7db] sm:w-auto"
              >
                Back To Admin
              </Link>
            )}
            {mode !== "songs" && (
              <Link
                to="/admin/songs"
                className="rounded-full border border-[#d28667] bg-white px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3f26] transition hover:bg-[#ffe7db] sm:w-auto"
              >
                Open Songs Manager
              </Link>
            )}
          </div>
        </header>

        {!isFirebaseConfigured && (
          <div className="mt-5 rounded-xl border border-[#da7e5f] bg-[#fff2ea] px-4 py-3 text-sm text-[#8f351e]">
            Firebase config missing hai. `.env` me VITE_FIREBASE_* values set karke app restart karo.
          </div>
        )}

        {statusMessage && (
          <div className="mt-5 rounded-xl border border-[#a8d0b0] bg-[#f3fff5] px-4 py-3 text-sm text-[#206b35]">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-[#da7e5f] bg-[#fff2ea] px-4 py-3 text-sm text-[#8f351e]">
            {errorMessage}
          </div>
        )}

        <div className={`mt-6 grid gap-5 ${formColumnsClass}`}>
          {showSongs && (
            <form
              onSubmit={saveSong}
              className="rounded-2xl border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-5"
            >
              <h3 className="text-lg font-semibold text-[#6f2d1d]">Add Song</h3>
              <p className="mt-1 text-xs text-[#90503b]">URL ya audio file dono support hain.</p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Song Title
                <input
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Chapter 01 Track"
                  required
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Artist (Optional)
                <input
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="KK"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Song URL (Optional if file selected)
                <input
                  value={songUrl}
                  onChange={(e) => setSongUrl(e.target.value)}
                  type="url"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="https://.../song.mp3"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Display Order (Optional)
                <input
                  value={songOrder}
                  onChange={(e) => setSongOrder(e.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="1"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Play Location
                <select
                  value={songPlacement}
                  onChange={(e) => setSongPlacement(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm font-medium text-[#5f2616] outline-none focus:border-[#ca6642]"
                >
                  <option value="both">Journey + Songs Page</option>
                  <option value="songs_only">Songs Page Only</option>
                </select>
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Upload Audio File (Optional)
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setSongFile(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] file:mr-3 file:rounded-full file:border-0 file:bg-[#ffe3d6] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#8f4027]"
                />
              </label>

              <button
                type="submit"
                disabled={savingSong}
                className="mt-5 w-full rounded-full bg-[#bb4e2d] px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#a84325] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {savingSong ? "Saving Song..." : "Save Song"}
              </button>
            </form>
          )}

          {showPhotos && (
            <form
              onSubmit={savePhoto}
              className="rounded-2xl border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-5"
            >
              <h3 className="text-lg font-semibold text-[#6f2d1d]">Add Photo</h3>
              <p className="mt-1 text-xs text-[#90503b]">URL ya image upload se gallery update ho jayegi.</p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Photo Title
                <input
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Temple Day Smile"
                  required
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Vibe (Optional)
                <input
                  value={photoVibe}
                  onChange={(e) => setPhotoVibe(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Golden Hour"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Hint / Description (Optional)
                <input
                  value={photoHint}
                  onChange={(e) => setPhotoHint(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Our best movie date click"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Frame Caption (Optional)
                <input
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Hold this moment forever"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Photo URL (Optional if file selected)
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  type="url"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="https://.../photo.jpg"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Display Order (Optional)
                <input
                  value={photoOrder}
                  onChange={(e) => setPhotoOrder(e.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="1"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Upload Image File (Optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] file:mr-3 file:rounded-full file:border-0 file:bg-[#ffe3d6] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#8f4027]"
                />
              </label>

              <button
                type="submit"
                disabled={savingPhoto}
                className="mt-5 w-full rounded-full bg-[#bb4e2d] px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#a84325] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {savingPhoto ? "Saving Photo..." : "Save Photo"}
              </button>
            </form>
          )}

          {showGifts && (
            <form
              onSubmit={saveGift}
              className="rounded-2xl border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-5"
            >
              <h3 className="text-lg font-semibold text-[#6f2d1d]">Add Gift</h3>
              <p className="mt-1 text-xs text-[#90503b]">Gift vault ke liye new item yahin se add karo.</p>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Gift Title
                <input
                  value={giftTitle}
                  onChange={(e) => setGiftTitle(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Custom Bracelet"
                  required
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Gift Detail
                <textarea
                  value={giftDetail}
                  onChange={(e) => setGiftDetail(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="Small detail about this gift"
                  required
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Gift Given By
                <select
                  value={giftGivenBy}
                  onChange={(e) => setGiftGivenBy(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm font-medium text-[#5f2616] outline-none focus:border-[#ca6642]"
                >
                  <option value="her">Her</option>
                  <option value="him">Him</option>
                </select>
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Gift Photo URL (Optional)
                <input
                  value={giftUrl}
                  onChange={(e) => setGiftUrl(e.target.value)}
                  type="url"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="https://.../gift.jpg"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Upload Gift Photo (Optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGiftFile(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] file:mr-3 file:rounded-full file:border-0 file:bg-[#ffe3d6] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#8f4027]"
                />
              </label>

              <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4d33]">
                Display Order (Optional)
                <input
                  value={giftOrder}
                  onChange={(e) => setGiftOrder(e.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-xl border border-[#e8c2b0] bg-white px-3 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                  placeholder="1"
                />
              </label>

              <button
                type="submit"
                disabled={savingGift}
                className="mt-5 w-full rounded-full bg-[#bb4e2d] px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#a84325] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {savingGift ? "Saving Gift..." : "Save Gift"}
              </button>
            </form>
          )}
        </div>

        <div className={`mt-8 grid gap-5 ${managerColumnsClass}`}>
          {showSongs && (
            <article className="rounded-2xl border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-[#6f2d1d]">Manage Songs</h3>
              {loadingSongs ? (
                <p className="mt-3 text-sm text-[#85503d]">Loading songs...</p>
              ) : songs.length === 0 ? (
                <p className="mt-3 text-sm text-[#85503d]">Abhi tak koi song add nahi hua.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="rounded-xl border border-[#edd0c4] bg-white p-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#6f2d1d]">
                            {song.title}
                          </p>
                          <p className="text-xs text-[#8d5441]">
                            {song.artist || "Unknown Artist"}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a5a45]">
                            Order: {song.order === FALLBACK_ORDER ? "Auto" : song.order} |{" "}
                            {song.playInJourney === false ? "Songs Only" : "Journey + Songs"}
                          </p>
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                          <button
                            type="button"
                            onClick={() =>
                              editingSongId === song.id
                                ? cancelEditSongSettings()
                                : startEditSongSettings(song)
                            }
                            className="rounded-full border border-[#d17c5d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2] sm:w-auto"
                          >
                            {editingSongId === song.id ? "Cancel Edit" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSong(song)}
                            disabled={deletingId === song.id}
                            className="rounded-full border border-[#d17c5d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                          >
                            {deletingId === song.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {editingSongId === song.id && (
                        <div className="mt-3 rounded-xl border border-[#efcfbf] bg-[#fff7f2] p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                              Display Order
                              <input
                                type="number"
                                value={editingSongOrder}
                                onChange={(e) => setEditingSongOrder(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                                placeholder="1"
                              />
                            </label>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                              Play Location
                              <select
                                value={editingSongPlacement}
                                onChange={(e) => setEditingSongPlacement(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                              >
                                <option value="both">Journey + Songs Page</option>
                                <option value="songs_only">Songs Page Only</option>
                              </select>
                            </label>
                          </div>

                          <div className="mt-3 grid gap-2 sm:flex sm:items-center">
                            <button
                              type="button"
                              onClick={() => saveSongSettings(song.id)}
                              disabled={savingSongSettingsId === song.id}
                              className="w-full rounded-full bg-[#bb4e2d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a84325] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                            >
                              {savingSongSettingsId === song.id ? "Saving..." : "Save Settings"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditSongSettings}
                              className="w-full rounded-full border border-[#d17c5d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2] sm:w-auto"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <audio controls src={song.src} className="mt-3 w-full" preload="none" />
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}

          {showPhotos && (
            <article className="rounded-2xl border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-[#6f2d1d]">Manage Photos</h3>
              {loadingPhotos ? (
                <p className="mt-3 text-sm text-[#85503d]">Loading photos...</p>
              ) : photos.length === 0 ? (
                <p className="mt-3 text-sm text-[#85503d]">Abhi tak koi photo add nahi hui.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-[#edd0c4] bg-white p-3"
                    >
                      <div className="h-28 overflow-hidden rounded-lg bg-[#ffe8db]">
                        {photo.imageUrl ? (
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.16em] text-[#9a5c45]">
                            No Preview
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#6f2d1d]">{photo.title}</p>
                      <p className="mt-1 text-xs text-[#8d5441]">{photo.vibe || "Memory Vibe"}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a5a45]">
                        Order: {photo.order === FALLBACK_ORDER ? "Auto" : photo.order}
                      </p>

                      <div className="mt-2 grid w-full grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editingPhotoId === photo.id
                              ? cancelEditPhotoSettings()
                              : startEditPhotoSettings(photo)
                          }
                          className="rounded-full border border-[#d17c5d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2]"
                        >
                          {editingPhotoId === photo.id ? "Cancel Edit" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo)}
                          disabled={deletingId === photo.id}
                          className="rounded-full border border-[#d17c5d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === photo.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                      {editingPhotoId === photo.id && (
                        <div className="mt-3 rounded-xl border border-[#efcfbf] bg-[#fff7f2] p-3">
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Title
                            <input
                              type="text"
                              value={editingPhotoTitle}
                              onChange={(e) => setEditingPhotoTitle(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Vibe
                            <input
                              type="text"
                              value={editingPhotoVibe}
                              onChange={(e) => setEditingPhotoVibe(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Hint
                            <input
                              type="text"
                              value={editingPhotoHint}
                              onChange={(e) => setEditingPhotoHint(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Caption
                            <input
                              type="text"
                              value={editingPhotoCaption}
                              onChange={(e) => setEditingPhotoCaption(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Photo URL
                            <input
                              type="url"
                              value={editingPhotoUrl}
                              onChange={(e) => setEditingPhotoUrl(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Replace Image File (Optional)
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setReplacePhotoFile(e.target.files?.[0] || null)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] file:mr-2 file:rounded-full file:border-0 file:bg-[#ffe3d6] file:px-3 file:py-1 file:text-[11px] file:font-semibold file:text-[#8f4027]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Display Order
                            <input
                              type="number"
                              value={editingPhotoOrder}
                              onChange={(e) => setEditingPhotoOrder(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                              placeholder="1"
                            />
                          </label>

                          <div className="mt-3 grid gap-2">
                            <button
                              type="button"
                              onClick={() => savePhotoSettings(photo)}
                              disabled={savingPhotoSettingsId === photo.id}
                              className="w-full rounded-full bg-[#bb4e2d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a84325] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {savingPhotoSettingsId === photo.id ? "Saving..." : "Save Settings"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditPhotoSettings}
                              className="w-full rounded-full border border-[#d17c5d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}

          {showGifts && (
            <article className="rounded-2xl border border-[#f0cdbf] bg-[#fff9f5] p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-[#6f2d1d]">Manage Gifts</h3>
              {loadingGifts ? (
                <p className="mt-3 text-sm text-[#85503d]">Loading gifts...</p>
              ) : gifts.length === 0 ? (
                <p className="mt-3 text-sm text-[#85503d]">Abhi tak koi gift add nahi hua.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {gifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="rounded-xl border border-[#edd0c4] bg-white p-3"
                    >
                      <div className="h-28 overflow-hidden rounded-lg bg-[#ffe8db]">
                        {gift.imageUrl ? (
                          <img
                            src={gift.imageUrl}
                            alt={gift.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.16em] text-[#9a5c45]">
                            No Gift Photo
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[#6f2d1d]">{gift.title}</p>
                      <p className="mt-1 text-xs text-[#8d5441]">{gift.detail || "No details"}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a5a45]">
                        {giftPersonLabel(gift.givenBy)} | Order: {gift.order === FALLBACK_ORDER ? "Auto" : gift.order}
                      </p>

                      <div className="mt-2 grid w-full grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editingGiftId === gift.id
                              ? cancelEditGiftSettings()
                              : startEditGiftSettings(gift)
                          }
                          className="rounded-full border border-[#d17c5d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2]"
                        >
                          {editingGiftId === gift.id ? "Cancel Edit" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGift(gift)}
                          disabled={deletingId === gift.id}
                          className="rounded-full border border-[#d17c5d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === gift.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                      {editingGiftId === gift.id && (
                        <div className="mt-3 rounded-xl border border-[#efcfbf] bg-[#fff7f2] p-3">
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Gift Title
                            <input
                              type="text"
                              value={editingGiftTitle}
                              onChange={(e) => setEditingGiftTitle(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Gift Detail
                            <textarea
                              rows={3}
                              value={editingGiftDetail}
                              onChange={(e) => setEditingGiftDetail(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Gift Photo URL
                            <input
                              type="url"
                              value={editingGiftUrl}
                              onChange={(e) => setEditingGiftUrl(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                            />
                          </label>
                          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                            Replace Gift Photo (Optional)
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setReplaceGiftFile(e.target.files?.[0] || null)}
                              className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] file:mr-2 file:rounded-full file:border-0 file:bg-[#ffe3d6] file:px-3 file:py-1 file:text-[11px] file:font-semibold file:text-[#8f4027]"
                            />
                          </label>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                              Given By
                              <select
                                value={editingGiftGivenBy}
                                onChange={(e) => setEditingGiftGivenBy(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                              >
                                <option value="her">Her</option>
                                <option value="him">Him</option>
                              </select>
                            </label>
                            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#935039]">
                              Display Order
                              <input
                                type="number"
                                value={editingGiftOrder}
                                onChange={(e) => setEditingGiftOrder(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-[#e6c1af] bg-white px-2 py-2 text-sm text-[#5f2616] outline-none focus:border-[#ca6642]"
                                placeholder="1"
                              />
                            </label>
                          </div>

                          <div className="mt-3 grid gap-2">
                            <button
                              type="button"
                              onClick={() => saveGiftSettings(gift)}
                              disabled={savingGiftSettingsId === gift.id}
                              className="w-full rounded-full bg-[#bb4e2d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a84325] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {savingGiftSettingsId === gift.id ? "Saving..." : "Save Settings"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditGiftSettings}
                              className="w-full rounded-full border border-[#d17c5d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f3d24] transition hover:bg-[#ffe0d2]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
