"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createDemoGrove, createEmptyGrove } from "./demo-data";
import {
  clusterSignatures,
  detectFaces,
  loadImageFile,
  signatureDistance,
} from "./faces";
import { uid } from "./id";
import { canAddPeople, canAddPhotos, memoryCount, PLAN_LIMITS } from "./plans";
import { portraitDataUrl } from "./portraits";
import { loadGrove, saveGrove } from "./storage";
import type {
  GroveState,
  Person,
  Photo,
  PhotoSource,
  PlanId,
  Relationship,
  ScanProgress,
  Season,
} from "./types";

type GroveContextValue = {
  state: GroveState;
  ready: boolean;
  selectedId?: string;
  scan?: ScanProgress;
  paywall?: string;
  toast?: string;
  setSelectedId: (id?: string) => void;
  dismissPaywall: () => void;
  dismissToast: () => void;
  setYouName: (name: string) => void;
  setSeason: (season: Season) => void;
  setPlan: (plan: PlanId) => void;
  completeOnboarding: () => void;
  loadDemo: (name?: string) => void;
  reset: () => void;
  renamePerson: (id: string, name: string) => void;
  setRelationship: (id: string, relationship: Relationship) => void;
  mergePeople: (keepId: string, dropId: string) => void;
  hidePerson: (id: string) => void;
  setLiveSync: (on: boolean) => void;
  importFiles: (files: File[], source: PhotoSource) => Promise<void>;
  addRandomMemory: (personId?: string) => void;
  connectSource: (source: GroveState["sources"][number]) => void;
  watchFolder: (handle: FileSystemDirectoryHandle) => void;
};

const GroveContext = createContext<GroveContextValue | undefined>(undefined);

const HUES = [12, 28, 48, 96, 168, 200, 220, 320, 350, 38, 140];

function nextHue(people: Person[]) {
  return HUES[people.length % HUES.length];
}

export function GroveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GroveState>(() => createEmptyGrove());
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [scan, setScan] = useState<ScanProgress>();
  const [paywall, setPaywall] = useState<string>();
  const [toast, setToast] = useState<string>();
  const folderRef = useRef<FileSystemDirectoryHandle | undefined>(undefined);
  const knownFiles = useRef(new Set<string>());
  const stateRef = useRef(state);
  const importFilesRef = useRef<(files: File[], source: PhotoSource) => Promise<void>>(async () => undefined);
  const addRandomMemoryRef = useRef<(personId?: string) => void>(() => undefined);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    loadGrove().then((saved) => {
      if (cancelled) return;
      if (saved) setState(saved);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveGrove(state);
  }, [state, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(undefined), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!state.liveSync || !PLAN_LIMITS[state.plan].liveSync) return;
    const timer = window.setInterval(async () => {
      if (folderRef.current) {
        const { listImagesInFolder } = await import("./google-photos");
        const files = await listImagesInFolder(folderRef.current);
        const fresh = files.filter((file) => !knownFiles.current.has(`${file.name}-${file.size}`));
        if (fresh.length) {
          fresh.forEach((file) => knownFiles.current.add(`${file.name}-${file.size}`));
          await importFilesRef.current(fresh, "folder");
        }
        return;
      }
      if (state.sources.some((source) => source.kind === "demo" && source.watchEnabled)) {
        if (Math.random() > 0.55) addRandomMemoryRef.current();
      }
    }, 18000);
    return () => window.clearInterval(timer);
  }, [state.liveSync, state.plan, state.sources]);

  const setYouName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      you: { ...prev.you, name, avatarUrl: prev.you.avatarUrl ?? portraitDataUrl(name) },
    }));
  }, []);

  const setSeason = useCallback((season: Season) => {
    setState((prev) => {
      if (!PLAN_LIMITS[prev.plan].seasons && season !== prev.season) {
        setPaywall("Seasons are part of Grove Plus — spring blossom, summer fruit, autumn gold, winter lights.");
        return prev;
      }
      return { ...prev, season };
    });
  }, []);

  const setPlan = useCallback((plan: PlanId) => {
    setState((prev) => ({ ...prev, plan, liveSync: plan === "free" ? false : prev.liveSync }));
    setPaywall(undefined);
    setToast(plan === "free" ? "Back on the free seedling plan." : `Welcome to Grove ${plan === "family" ? "Family" : "Plus"}.`);
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, onboardingComplete: true }));
  }, []);

  const loadDemo = useCallback((name?: string) => {
    setState(createDemoGrove(name || "Alex"));
    setToast("A sample grove was grown from a year of photos.");
  }, []);

  const reset = useCallback(() => {
    setState(createEmptyGrove());
    setSelectedId(undefined);
  }, []);

  const renamePerson = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      people: prev.people.map((person) => (person.id === id ? { ...person, name } : person)),
    }));
  }, []);

  const setRelationship = useCallback((id: string, relationship: Relationship) => {
    setState((prev) => ({
      ...prev,
      people: prev.people.map((person) =>
        person.id === id ? { ...person, relationship } : person,
      ),
    }));
  }, []);

  const mergePeople = useCallback((keepId: string, dropId: string) => {
    setState((prev) => ({
      ...prev,
      people: prev.people.filter((person) => person.id !== dropId),
      photos: prev.photos.map((photo) => ({
        ...photo,
        personIds: photo.personIds.map((id) => (id === dropId ? keepId : id)),
      })),
    }));
    setSelectedId(keepId);
  }, []);

  const hidePerson = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      people: prev.people.map((person) =>
        person.id === id ? { ...person, hidden: true } : person,
      ),
    }));
    setSelectedId(undefined);
  }, []);

  const setLiveSync = useCallback((on: boolean) => {
    setState((prev) => {
      if (on && !PLAN_LIMITS[prev.plan].liveSync) {
        setPaywall("Live sync grows the tree whenever a new photo lands in Google Photos or your watched folder.");
        return prev;
      }
      return { ...prev, liveSync: on };
    });
  }, []);

  const connectSource = useCallback((source: GroveState["sources"][number]) => {
    setState((prev) => ({
      ...prev,
      sources: [...prev.sources.filter((item) => item.kind !== source.kind), source],
    }));
  }, []);

  const watchFolder = useCallback((handle: FileSystemDirectoryHandle) => {
    folderRef.current = handle;
  }, []);

  const addRandomMemory = useCallback((personId?: string) => {
    setState((prev) => {
      const people = prev.people.filter((person) => !person.hidden);
      if (!people.length) return prev;
      if (!canAddPhotos(prev, 1)) {
        setPaywall("Your seedling plan holds 120 photos. Upgrade to keep growing.");
        return prev;
      }
      const person =
        people.find((item) => item.id === personId) ??
        people[Math.floor(Math.random() * people.length)];
      const photo: Photo = {
        id: uid("photo"),
        thumbUrl: prev.photos.find((item) => item.personIds.includes(person.id))?.thumbUrl ?? "",
        takenAt: Date.now(),
        personIds: [person.id],
        source: "demo",
      };
      setToast(`New memory with ${person.name} — their branch grew.`);
      return {
        ...prev,
        photos: [photo, ...prev.photos],
        sources: prev.sources.map((source) =>
          source.watchEnabled ? { ...source, lastSyncAt: Date.now() } : source,
        ),
      };
    });
  }, []);

  const importFiles = useCallback(async (files: File[], source: PhotoSource) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    if (!canAddPhotos(stateRef.current, images.length)) {
      setPaywall(
        `Free groves hold ${PLAN_LIMITS.free.maxPhotos} photos. Grove Plus grows without a cap.`,
      );
      return;
    }

    setScan({
      total: images.length,
      done: 0,
      faces: 0,
      people: 0,
      status: "Looking through your photos…",
    });

    type PendingFace = {
      signature: number[];
      thumbUrl: string;
      photoId: string;
    };
    const pendingFaces: PendingFace[] = [];
    const newPhotos: Photo[] = [];

    for (let i = 0; i < images.length; i += 1) {
      const file = images[i];
      knownFiles.current.add(`${file.name}-${file.size}`);
      try {
        const loaded = await loadImageFile(file);
        const photoId = uid("photo");
        const faces = await detectFaces(loaded.canvas);
        newPhotos.push({
          id: photoId,
          thumbUrl: loaded.thumbUrl,
          takenAt: file.lastModified || Date.now(),
          personIds: [],
          source,
          fileName: file.name,
          width: loaded.width,
          height: loaded.height,
        });
        faces.forEach((face) => {
          pendingFaces.push({
            signature: face.signature,
            thumbUrl: face.thumbUrl,
            photoId,
          });
        });
        setScan({
          total: images.length,
          done: i + 1,
          faces: pendingFaces.length,
          people: 0,
          status: `Reading ${file.name}`,
        });
      } catch {
        setScan((prevScan) =>
          prevScan
            ? { ...prevScan, done: i + 1, status: `Skipped ${file.name}` }
            : prevScan,
        );
      }
      await new Promise((r) => setTimeout(r, 0));
    }

    setState((prev) => {
      const photos = [...newPhotos, ...prev.photos];
      const people = [...prev.people];
      const clusters = clusterSignatures(pendingFaces, 0.155);

      clusters.forEach((indexes) => {
        const faces = indexes.map((idx) => pendingFaces[idx]);
        let match: Person | undefined;
        let best = 0.155;
        for (const person of people) {
          if (!person.faceSignature) continue;
          const dist = faces.reduce(
            (sum, face) => sum + signatureDistance(face.signature, person.faceSignature!),
            0,
          ) / faces.length;
          if (dist < best) {
            best = dist;
            match = person;
          }
        }
        if (!match) {
          if (!canAddPeople({ ...prev, people }, 1) && people.filter((p) => !p.hidden).length >= PLAN_LIMITS[prev.plan].maxPeople) {
            return;
          }
          const avg = faces[0].signature.map((_, i) =>
            faces.reduce((sum, face) => sum + face.signature[i], 0) / faces.length,
          );
          match = {
            id: uid("person"),
            name: `Someone ${people.length + 1}`,
            relationship: "friend",
            hue: nextHue(people),
            avatarUrl: faces[0].thumbUrl,
            faceSignature: avg,
            createdAt: Date.now(),
          };
          people.push(match);
        }
        faces.forEach((face) => {
          const photo = photos.find((item) => item.id === face.photoId);
          if (photo && match && !photo.personIds.includes(match.id)) {
            photo.personIds.push(match.id);
          }
        });
      });

      newPhotos.forEach((photo) => {
        if (photo.personIds.length === 0) {
          let unassigned = people.find((person) => person.name === "Unassigned moments");
          if (!unassigned) {
            unassigned = {
              id: uid("person"),
              name: "Unassigned moments",
              relationship: "other",
              hue: 80,
              createdAt: Date.now(),
            };
            people.push(unassigned);
          }
          photo.personIds.push(unassigned.id);
        }
      });

      const addedPeople = people.length - prev.people.length;
      if (addedPeople && !canAddPeople(prev, addedPeople)) {
        setPaywall("The free grove shows 8 people. Plus lets every branch grow.");
      }

      setScan({
        total: images.length,
        done: images.length,
        faces: pendingFaces.length,
        people: people.length,
        status: "Your tree is growing.",
      });
      window.setTimeout(() => setScan(undefined), 1600);
      setToast(
        pendingFaces.length
          ? `Found ${pendingFaces.length} faces across ${images.length} photos.`
          : `Added ${images.length} photos. Name the people on each branch.`,
      );

      return {
        ...prev,
        people,
        photos,
        onboardingComplete: true,
        sources: [
          ...prev.sources.filter((item) => item.kind !== source),
          {
            id: uid("src"),
            kind: source,
            label: source === "google" ? "Google Photos" : source === "camera" ? "Camera" : source === "folder" ? "Photo folder" : "Files",
            connected: true,
            lastSyncAt: Date.now(),
            watchEnabled: source === "folder" || source === "google",
          },
        ],
      };
    });
  }, []);

  useEffect(() => {
    importFilesRef.current = importFiles;
    addRandomMemoryRef.current = addRandomMemory;
  }, [importFiles, addRandomMemory]);

  const value = useMemo<GroveContextValue>(
    () => ({
      state,
      ready,
      selectedId,
      scan,
      paywall,
      toast,
      setSelectedId,
      dismissPaywall: () => setPaywall(undefined),
      dismissToast: () => setToast(undefined),
      setYouName,
      setSeason,
      setPlan,
      completeOnboarding,
      loadDemo,
      reset,
      renamePerson,
      setRelationship,
      mergePeople,
      hidePerson,
      setLiveSync,
      importFiles,
      addRandomMemory,
      connectSource,
      watchFolder,
    }),
    [
      state,
      ready,
      selectedId,
      scan,
      paywall,
      toast,
      setYouName,
      setSeason,
      setPlan,
      completeOnboarding,
      loadDemo,
      reset,
      renamePerson,
      setRelationship,
      mergePeople,
      hidePerson,
      setLiveSync,
      importFiles,
      addRandomMemory,
      connectSource,
      watchFolder,
    ],
  );

  return <GroveContext.Provider value={value}>{children}</GroveContext.Provider>;
}

export function useGrove() {
  const ctx = useContext(GroveContext);
  if (!ctx) throw new Error("useGrove must be used inside GroveProvider");
  return ctx;
}

export function personMemories(state: GroveState, personId: string) {
  return state.photos.filter((photo) => photo.personIds.includes(personId));
}

export { memoryCount };
