"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubPage } from "@/components/sub-page";
import { Icon } from "@/components/icons";
import {
  type ChapterEntry,
  type ChapterOpening,
  type ChapterOrganizeDraft,
  type ChapterRewriteDraft,
  type PhoneEntryPath,
  type QuestionRewriteDemo,
  type OrganizeDecideDemo,
  type VisionIdentifyDemo,
  type VisionTrustLevel,
  type PhotoSearchDemo,
  type NoteCaptureDemo,
  type SmartFlowDemo,
  buildOrganizeAskPrompt,
  buildSmartFlowAskPrompt,
  buildVisionAskPrompt,
  buildPlantAskPrompt,
  buildMenuTranslatePrompt,
  buildProductComparePrompt,
  buildCuriosityPrompt,
  buildFoodObservePrompt,
  chapterCameraTryHref,
  chapterDraftKey,
  chapterEntryHref,
  chapterPhotoTryHref,
  chapterPickKey,
  chapterSparkHref,
  chapterSparkSource,
  chapterVoiceTryHref,
  practiceWhereLabel,
  saveChapterSparkSeed,
  type ChapterVisionDraft,
  type ChapterPhotoSearchDraft,
  type ChapterNoteCaptureDraft,
  type ChapterSmartFlowDraft,
  type MenuTranslateDemo,
  type ProductCompareDemo,
  type CuriosityAskDemo,
  type RecipeCardDemo,
  type PhotoEditSafeDemo,
  type PhotoCurateDemo,
  type HabitSceneOption,
  type SensoryHabitDemo,
  type ChapterMenuDraft,
  type ChapterProductCompareDraft,
  type ChapterCuriosityDraft,
  type ChapterRecipeDraft,
  type ChapterPhotoEditDraft,
  type ChapterPhotoCurateDraft,
  type ChapterSensoryHabitDraft,
  type CityRadiusDemo,
  type DayRehearsalDemo,
  type MomentPlaceDemo,
  type PassPrepDemo,
  type SafeCornerDemo,
  type ActivityGuideDemo,
  type ElegantReplanDemo,
  type ThreeSightDemo,
  type CityLightsDemo,
  type ChapterCityRadiusDraft,
  type ChapterDayRehearsalDraft,
  type ChapterMomentPlaceDraft,
  type ChapterPassPrepDraft,
  type ChapterSafeCornerDraft,
  type ChapterActivityGuideDraft,
  type ChapterElegantReplanDraft,
  type ChapterThreeSightDraft,
  type ChapterCityLightsDraft,
  buildDayRehearsalPrompt,
  buildUrbanDayCirclePrompt,
} from "@/lib/chapter-opening";
import { trackEvent } from "@/lib/telemetry";
import { useToast } from "@/hooks/use-toast";

interface ChapterOpeningScreenProps {
  chapter: ChapterOpening;
}

export function ChapterOpeningScreen({ chapter }: ChapterOpeningScreenProps) {
  const router = useRouter();
  const toast = useToast();
  const layout = chapter.layout ?? "routes";
  const pickKey = chapterPickKey(chapter.id);
  const draftKey = chapterDraftKey(chapter.id);

  const [picked, setPicked] = useState<string | null>(null);
  const [reflectNote, setReflectNote] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [keywords, setKeywords] = useState<[string, string, string]>(["", "", ""]);
  const [naturalQuestion, setNaturalQuestion] = useState("");
  const [backgrounds, setBackgrounds] = useState<string[]>([]);
  const [messyTask, setMessyTask] = useState("");
  const [threePoints, setThreePoints] = useState<[string, string, string]>(["", "", ""]);
  const [nextStep, setNextStep] = useState("");
  const [userDecision, setUserDecision] = useState("");
  const [itemLabel, setItemLabel] = useState("");
  const [aiAnswerNote, setAiAnswerNote] = useState("");
  const [trustLevel, setTrustLevel] = useState<VisionTrustLevel | "">("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [memoryNote, setMemoryNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTagId, setNoteTagId] = useState("");
  const [snapNote, setSnapNote] = useState("");
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [savedLine, setSavedLine] = useState("");
  const [menuSnippet, setMenuSnippet] = useState("");
  const [dietaryNeed, setDietaryNeed] = useState("");
  const [translationSummary, setTranslationSummary] = useState("");
  const [confirmWithStaff, setConfirmWithStaff] = useState("");
  const [productA, setProductA] = useState("");
  const [productB, setProductB] = useState("");
  const [threeDiffs, setThreeDiffs] = useState<[string, string, string]>(["", "", ""]);
  const [verifyItem, setVerifyItem] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [insight, setInsight] = useState("");
  const [dishName, setDishName] = useState("");
  const [colors, setColors] = useState("");
  const [fiberSource, setFiberSource] = useState("");
  const [feeling, setFeeling] = useState("");
  const [backupDone, setBackupDone] = useState(false);
  const [editAction, setEditAction] = useState("");
  const [compareNote, setCompareNote] = useState("");
  const [theme, setTheme] = useState("");
  const [captions, setCaptions] = useState<[string, string, string]>(["", "", ""]);
  const [pickedScenes, setPickedScenes] = useState<string[]>([]);
  const [planNote, setPlanNote] = useState("");
  const [cityPlace, setCityPlace] = useState("");
  const [cityMeaning, setCityMeaning] = useState("");
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [restPoint, setRestPoint] = useState("");
  const [rehearsalBackup, setRehearsalBackup] = useState("");
  const [officialCheck, setOfficialCheck] = useState("");
  const [momentActivity, setMomentActivity] = useState("");
  const [departAt, setDepartAt] = useState("");
  const [arriveAt, setArriveAt] = useState("");
  const [restAt, setRestAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [ticketWhere, setTicketWhere] = useState("");
  const [openHow, setOpenHow] = useState("");
  const [officialSource, setOfficialSource] = useState("");
  const [passBackup, setPassBackup] = useState("");
  const [safeDestination, setSafeDestination] = useState("");
  const [routeNote, setRouteNote] = useState("");
  const [restSpot, setRestSpot] = useState("");
  const [cornerBackup, setCornerBackup] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityDuration, setActivityDuration] = useState("");
  const [restStyle, setRestStyle] = useState("");
  const [transitPref, setTransitPref] = useState("");
  const [companion, setCompanion] = useState("");
  const [replanTrigger, setReplanTrigger] = useState("");
  const [planA, setPlanA] = useState("");
  const [planB, setPlanB] = useState("");
  const [softReminder, setSoftReminder] = useState("");
  const [sawNote, setSawNote] = useState("");
  const [feltNote, setFeltNote] = useState("");
  const [bringHome, setBringHome] = useState("");
  const [lightArrange, setLightArrange] = useState("");
  const [lightVerify, setLightVerify] = useState("");
  const [lightReplan, setLightReplan] = useState("");
  const [lightKeep, setLightKeep] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(pickKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { id?: string; note?: string };
        if (parsed.id) setPicked(parsed.id);
        if (parsed.note) setReflectNote(parsed.note);
      }
      if (layout === "question-rewrite") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterRewriteDraft;
          if (d.keywords) setKeywords(d.keywords);
          if (d.naturalQuestion) setNaturalQuestion(d.naturalQuestion);
          if (d.reflectNote) setReflectNote(d.reflectNote);
          if (d.backgrounds) setBackgrounds(d.backgrounds);
        }
      }
      if (layout === "organize-decide") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterOrganizeDraft;
          if (d.messyTask) setMessyTask(d.messyTask);
          if (d.threePoints) setThreePoints(d.threePoints);
          if (d.nextStep) setNextStep(d.nextStep);
          if (d.userDecision) setUserDecision(d.userDecision);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "vision-identify") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterVisionDraft;
          if (d.itemLabel) setItemLabel(d.itemLabel);
          if (d.aiAnswerNote) setAiAnswerNote(d.aiAnswerNote);
          if (d.trustLevel) setTrustLevel(d.trustLevel);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "photo-search") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPhotoSearchDraft;
          if (d.searchKeyword) setSearchKeyword(d.searchKeyword);
          if (d.memoryNote) setMemoryNote(d.memoryNote);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "note-capture") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterNoteCaptureDraft;
          if (d.noteTitle) setNoteTitle(d.noteTitle);
          if (d.noteContent) setNoteContent(d.noteContent);
          if (d.tagId) setNoteTagId(d.tagId);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        } else if (chapter.defaultNoteTitle) {
          setNoteTitle(chapter.defaultNoteTitle);
        }
      }
      if (layout === "smart-flow") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSmartFlowDraft;
          if (d.snapNote) setSnapNote(d.snapNote);
          if (d.askQuestion) setAskQuestion(d.askQuestion);
          if (d.askAnswer) setAskAnswer(d.askAnswer);
          if (d.savedLine) setSavedLine(d.savedLine);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "menu-translate") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterMenuDraft;
          if (d.menuSnippet) setMenuSnippet(d.menuSnippet);
          if (d.dietaryNeed) setDietaryNeed(d.dietaryNeed);
          if (d.translationSummary) setTranslationSummary(d.translationSummary);
          if (d.confirmWithStaff) setConfirmWithStaff(d.confirmWithStaff);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "product-compare") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterProductCompareDraft;
          if (d.productA) setProductA(d.productA);
          if (d.productB) setProductB(d.productB);
          if (d.threeDiffs) setThreeDiffs(d.threeDiffs);
          if (d.verifyItem) setVerifyItem(d.verifyItem);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "curiosity-ask") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterCuriosityDraft;
          if (d.question) setQuestion(d.question);
          if (d.aiAnswer) setAiAnswer(d.aiAnswer);
          if (d.insight) setInsight(d.insight);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "recipe-card") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterRecipeDraft;
          if (d.dishName) setDishName(d.dishName);
          if (d.colors) setColors(d.colors);
          if (d.fiberSource) setFiberSource(d.fiberSource);
          if (d.feeling) setFeeling(d.feeling);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "photo-edit-safe") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPhotoEditDraft;
          if (d.backupDone) setBackupDone(d.backupDone);
          if (d.editAction) setEditAction(d.editAction);
          if (d.compareNote) setCompareNote(d.compareNote);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "photo-curate") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPhotoCurateDraft;
          if (d.theme) setTheme(d.theme);
          if (d.captions) setCaptions(d.captions);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
            if (layout === "sensory-habit") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSensoryHabitDraft;
          if (d.pickedScenes) setPickedScenes(d.pickedScenes);
          if (d.planNote) setPlanNote(d.planNote);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      const layoutKeyLoad: string = layout;
      if (layoutKeyLoad === "city-radius") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterCityRadiusDraft;
          if (d.place) setCityPlace(d.place);
          if (d.meaning) setCityMeaning(d.meaning);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "day-rehearsal") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterDayRehearsalDraft;
          if (d.fromPlace) setFromPlace(d.fromPlace);
          if (d.toPlace) setToPlace(d.toPlace);
          if (d.restPoint) setRestPoint(d.restPoint);
          if (d.backup) setRehearsalBackup(d.backup);
          if (d.officialCheck) setOfficialCheck(d.officialCheck);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "moment-place") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterMomentPlaceDraft;
          if (d.activity) setMomentActivity(d.activity);
          if (d.departAt) setDepartAt(d.departAt);
          if (d.arriveAt) setArriveAt(d.arriveAt);
          if (d.restAt) setRestAt(d.restAt);
          if (d.returnAt) setReturnAt(d.returnAt);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "pass-prep") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPassPrepDraft;
          if (d.ticketWhere) setTicketWhere(d.ticketWhere);
          if (d.openHow) setOpenHow(d.openHow);
          if (d.officialSource) setOfficialSource(d.officialSource);
          if (d.backup) setPassBackup(d.backup);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "safe-corner") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSafeCornerDraft;
          if (d.destination) setSafeDestination(d.destination);
          if (d.routeNote) setRouteNote(d.routeNote);
          if (d.restSpot) setRestSpot(d.restSpot);
          if (d.backup) setCornerBackup(d.backup);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "activity-guide") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterActivityGuideDraft;
          if (d.activityType) setActivityType(d.activityType);
          if (d.duration) setActivityDuration(d.duration);
          if (d.restStyle) setRestStyle(d.restStyle);
          if (d.transitPref) setTransitPref(d.transitPref);
          if (d.companion) setCompanion(d.companion);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "elegant-replan") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterElegantReplanDraft;
          if (d.trigger) setReplanTrigger(d.trigger);
          if (d.planA) setPlanA(d.planA);
          if (d.planB) setPlanB(d.planB);
          if (d.softReminder) setSoftReminder(d.softReminder);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "three-sight") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThreeSightDraft;
          if (d.saw) setSawNote(d.saw);
          if (d.felt) setFeltNote(d.felt);
          if (d.bringHome) setBringHome(d.bringHome);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "city-lights") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterCityLightsDraft;
          if (d.arrange) setLightArrange(d.arrange);
          if (d.verify) setLightVerify(d.verify);
          if (d.replan) setLightReplan(d.replan);
          if (d.keep) setLightKeep(d.keep);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "curiosity-ask" && chapter.samplePrompt) {
        const draftRaw = localStorage.getItem(draftKey);
        if (!draftRaw) {
          setQuestion(chapter.samplePrompt);
        } else {
          const d = JSON.parse(draftRaw) as ChapterCuriosityDraft;
          if (!d.question) setQuestion(chapter.samplePrompt);
        }
      }
    } catch {

      /* ignore */
    }
  }, [pickKey, draftKey, layout, chapter.defaultNoteTitle, chapter.samplePrompt]);

  const saveDraft = (
    patch: Partial<
      ChapterRewriteDraft &
        ChapterOrganizeDraft &
        ChapterVisionDraft &
        ChapterPhotoSearchDraft &
        ChapterNoteCaptureDraft &
        ChapterSmartFlowDraft &
        ChapterMenuDraft &
        ChapterProductCompareDraft &
        ChapterCuriosityDraft &
        ChapterRecipeDraft &
        ChapterPhotoEditDraft &
        ChapterPhotoCurateDraft &
        ChapterSensoryHabitDraft &
        ChapterCityRadiusDraft &
        ChapterDayRehearsalDraft &
        ChapterMomentPlaceDraft &
        ChapterPassPrepDraft &
        ChapterSafeCornerDraft &
        ChapterActivityGuideDraft &
        ChapterElegantReplanDraft &
        ChapterThreeSightDraft &
        ChapterCityLightsDraft
    >
  ) => {
    if (typeof window === "undefined") return;
    if (layout === "question-rewrite") {
      const next: ChapterRewriteDraft = {
        keywords: patch.keywords ?? keywords,
        naturalQuestion: patch.naturalQuestion ?? naturalQuestion,
        reflectNote: patch.reflectNote ?? reflectNote,
        backgrounds: patch.backgrounds ?? backgrounds,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "organize-decide") {
      const next: ChapterOrganizeDraft = {
        messyTask: patch.messyTask ?? messyTask,
        threePoints: patch.threePoints ?? threePoints,
        nextStep: patch.nextStep ?? nextStep,
        userDecision: patch.userDecision ?? userDecision,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "vision-identify") {
      const next: ChapterVisionDraft = {
        itemLabel: patch.itemLabel ?? itemLabel,
        aiAnswerNote: patch.aiAnswerNote ?? aiAnswerNote,
        trustLevel: patch.trustLevel ?? trustLevel,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "photo-search") {
      const next: ChapterPhotoSearchDraft = {
        searchKeyword: patch.searchKeyword ?? searchKeyword,
        memoryNote: patch.memoryNote ?? memoryNote,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "note-capture") {
      const next: ChapterNoteCaptureDraft = {
        noteTitle: patch.noteTitle ?? noteTitle,
        noteContent: patch.noteContent ?? noteContent,
        tagId: patch.tagId ?? noteTagId,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "smart-flow") {
      const next: ChapterSmartFlowDraft = {
        snapNote: patch.snapNote ?? snapNote,
        askQuestion: patch.askQuestion ?? askQuestion,
        askAnswer: patch.askAnswer ?? askAnswer,
        savedLine: patch.savedLine ?? savedLine,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "menu-translate") {
      const next: ChapterMenuDraft = {
        menuSnippet: patch.menuSnippet ?? menuSnippet,
        dietaryNeed: patch.dietaryNeed ?? dietaryNeed,
        translationSummary: patch.translationSummary ?? translationSummary,
        confirmWithStaff: patch.confirmWithStaff ?? confirmWithStaff,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "product-compare") {
      const next: ChapterProductCompareDraft = {
        productA: patch.productA ?? productA,
        productB: patch.productB ?? productB,
        threeDiffs: patch.threeDiffs ?? threeDiffs,
        verifyItem: patch.verifyItem ?? verifyItem,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "curiosity-ask") {
      const next: ChapterCuriosityDraft = {
        question: patch.question ?? question,
        aiAnswer: patch.aiAnswer ?? aiAnswer,
        insight: patch.insight ?? insight,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "recipe-card") {
      const next: ChapterRecipeDraft = {
        dishName: patch.dishName ?? dishName,
        colors: patch.colors ?? colors,
        fiberSource: patch.fiberSource ?? fiberSource,
        feeling: patch.feeling ?? feeling,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "photo-edit-safe") {
      const next: ChapterPhotoEditDraft = {
        backupDone: patch.backupDone ?? backupDone,
        editAction: patch.editAction ?? editAction,
        compareNote: patch.compareNote ?? compareNote,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "photo-curate") {
      const next: ChapterPhotoCurateDraft = {
        theme: patch.theme ?? theme,
        captions: patch.captions ?? captions,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
        if (layout === "sensory-habit") {
      const next: ChapterSensoryHabitDraft = {
        pickedScenes: patch.pickedScenes ?? pickedScenes,
        planNote: patch.planNote ?? planNote,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    const layoutKey: string = layout;
    if (layoutKey === "city-radius") {
      const next: ChapterCityRadiusDraft = {
        place: patch.place ?? cityPlace,
        meaning: patch.meaning ?? cityMeaning,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "day-rehearsal") {
      const next: ChapterDayRehearsalDraft = {
        fromPlace: patch.fromPlace ?? fromPlace,
        toPlace: patch.toPlace ?? toPlace,
        restPoint: patch.restPoint ?? restPoint,
        backup: patch.backup ?? rehearsalBackup,
        officialCheck: patch.officialCheck ?? officialCheck,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "moment-place") {
      const next: ChapterMomentPlaceDraft = {
        activity: patch.activity ?? momentActivity,
        departAt: patch.departAt ?? departAt,
        arriveAt: patch.arriveAt ?? arriveAt,
        restAt: patch.restAt ?? restAt,
        returnAt: patch.returnAt ?? returnAt,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "pass-prep") {
      const next: ChapterPassPrepDraft = {
        ticketWhere: patch.ticketWhere ?? ticketWhere,
        openHow: patch.openHow ?? openHow,
        officialSource: patch.officialSource ?? officialSource,
        backup: patch.backup ?? passBackup,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "safe-corner") {
      const next: ChapterSafeCornerDraft = {
        destination: patch.destination ?? safeDestination,
        routeNote: patch.routeNote ?? routeNote,
        restSpot: patch.restSpot ?? restSpot,
        backup: patch.backup ?? cornerBackup,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "activity-guide") {
      const next: ChapterActivityGuideDraft = {
        activityType: patch.activityType ?? activityType,
        duration: patch.duration ?? activityDuration,
        restStyle: patch.restStyle ?? restStyle,
        transitPref: patch.transitPref ?? transitPref,
        companion: patch.companion ?? companion,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "elegant-replan") {
      const next: ChapterElegantReplanDraft = {
        trigger: patch.trigger ?? replanTrigger,
        planA: patch.planA ?? planA,
        planB: patch.planB ?? planB,
        softReminder: patch.softReminder ?? softReminder,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "three-sight") {
      const next: ChapterThreeSightDraft = {
        saw: patch.saw ?? sawNote,
        felt: patch.felt ?? feltNote,
        bringHome: patch.bringHome ?? bringHome,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "city-lights") {
      const next: ChapterCityLightsDraft = {
        arrange: patch.arrange ?? lightArrange,
        verify: patch.verify ?? lightVerify,
        replan: patch.replan ?? lightReplan,
        keep: patch.keep ?? lightKeep,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
  };


  const savePick = (id: string, note?: string) => {
    setPicked(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        pickKey,
        JSON.stringify({ id, note: note ?? reflectNote })
      );
    }
  };

  const goEntry = (entry: ChapterEntry) => {
    savePick(entry.id);
    trackEvent("chapter_entry", { chapter: chapter.id, entry: entry.id });
    router.push(chapterEntryHref(chapter.id, entry));
  };

  const tryInNuannuan = () => {
    trackEvent("chapter_voice_try", { chapter: chapter.id });
    router.push(chapterVoiceTryHref(chapter.id));
  };

  const tryCameraInNuannuan = () => {
    trackEvent("chapter_camera_try", { chapter: chapter.id });
    router.push(chapterCameraTryHref(chapter.id));
  };

  const tryPhotoInNuannuan = () => {
    trackEvent("chapter_photo_try", { chapter: chapter.id });
    router.push(chapterPhotoTryHref(chapter.id));
  };

  /** 從當前練習草稿抽出最適合點成光點的一句話 */
  const buildSparkSeedTexts = (): { action: string; feeling: string } => {
    const feeling =
      (layout === "organize-decide" ? userDecision : reflectNote).trim() ||
      "這是我從書本練習留下的一句話。";

    let action = "";
    switch (layout) {
      case "question-rewrite":
        action = naturalQuestion.trim() || keywords.filter(Boolean).join(" · ");
        break;
      case "organize-decide":
        action = nextStep.trim() || threePoints.filter(Boolean).join("；") || messyTask.trim();
        break;
      case "vision-identify":
        action = aiAnswerNote.trim() || itemLabel.trim();
        break;
      case "photo-search":
        action = memoryNote.trim() || (searchKeyword.trim() ? `搜尋「${searchKeyword.trim()}」找回的回憶` : "");
        break;
      case "note-capture":
        action = noteContent.trim() || noteTitle.trim();
        break;
      case "smart-flow":
        action = savedLine.trim() || askAnswer.trim() || snapNote.trim();
        break;
      case "menu-translate":
        action = translationSummary.trim() || menuSnippet.trim();
        break;
      case "product-compare":
        action =
          threeDiffs.filter(Boolean).join("；") ||
          (productA.trim() && productB.trim() ? `${productA} vs ${productB}` : "");
        break;
      case "curiosity-ask":
        action = insight.trim() || aiAnswer.trim() || question.trim();
        break;
      case "recipe-card":
        action =
          [dishName, colors, fiberSource, feeling].filter(Boolean).join("｜") ||
          dishName.trim();
        break;
      case "photo-edit-safe":
        action = compareNote.trim() || editAction.trim();
        break;
      case "photo-curate":
        action =
          (theme.trim() ? `主題：${theme.trim()}。` : "") +
          captions.filter(Boolean).join("／");
        break;
      case "sensory-habit":
        action = planNote.trim() || pickedScenes.join("、");
        break;
      case "city-radius":
        action = cityPlace.trim() || cityMeaning.trim();
        break;
      case "day-rehearsal":
        action =
          (fromPlace.trim() || toPlace.trim()
            ? `從${fromPlace.trim() || "＿＿"}到${toPlace.trim() || "＿＿"}`
            : "") ||
          restPoint.trim();
        break;
      case "moment-place":
        action = momentActivity.trim() || [departAt, returnAt].filter(Boolean).join("｜");
        break;
      case "pass-prep":
        action = ticketWhere.trim() || openHow.trim();
        break;
      case "safe-corner":
        action = safeDestination.trim() || restSpot.trim();
        break;
      case "activity-guide":
        action = [activityType, activityDuration, restStyle].filter(Boolean).join("｜");
        break;
      case "elegant-replan":
        action =
          (replanTrigger.trim() ? `如果${replanTrigger.trim()}` : "") ||
          softReminder.trim();
        break;
      case "three-sight":
        action = [sawNote, feltNote, bringHome].filter(Boolean).join("｜");
        break;
      case "city-lights":
        action = [lightArrange, lightVerify, lightReplan, lightKeep].filter(Boolean).join("｜");
        break;
      case "routes":
      case "ai-entry":
      default:
        action = reflectNote.trim() || (picked ? `今天想先試：${picked}` : "");
        break;
    }

    if (!action.trim()) {
      action = chapter.quote?.trim() || chapter.tryPrompt.trim();
    }
    return { action: action.trim().slice(0, 200), feeling: feeling.slice(0, 200) };
  };

  const saveAsSpark = () => {
    const { action, feeling } = buildSparkSeedTexts();
    if (!action) {
      toast.info("請先完成一小步練習，再點成光點。");
      return;
    }
    saveChapterSparkSeed({
      source: chapterSparkSource(chapter.id),
      action_text: action,
      feeling_text: feeling,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
    });
    trackEvent("chapter_spark_save", { chapter: chapter.id });
    router.push(chapterSparkHref(chapter.id));
  };

  const copyNaturalQuestion = async () => {
    const text = naturalQuestion.trim();
    if (!text) {
      toast.info("請先寫好您的自然提問。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製自然提問，可以貼到 AI 對話或說出來。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyDemo = (demo: QuestionRewriteDemo) => {
    setKeywords(demo.keywords);
    setNaturalQuestion(demo.naturalQuestion);
    saveDraft({
      keywords: demo.keywords,
      naturalQuestion: demo.naturalQuestion,
    });
    toast.success(`已帶入${demo.label}，您可以再改成自己的問題。`);
  };

  const applyOrganizeDemo = (demo: OrganizeDecideDemo) => {
    setMessyTask(demo.messyTask);
    setThreePoints(demo.threePoints);
    setNextStep(demo.nextStep);
    setUserDecision(demo.userDecision);
    saveDraft({
      messyTask: demo.messyTask,
      threePoints: demo.threePoints,
      nextStep: demo.nextStep,
      userDecision: demo.userDecision,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的狀況。`);
  };

  const copyOrganizeAsk = async () => {
    const text = buildOrganizeAskPrompt(messyTask);
    if (!messyTask.trim()) {
      toast.info("請先寫下繁雜的事（請勿含敏感資料）。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製整理提問，可以貼給 AI。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const copyVisionAsk = async () => {
    const text =
      chapter.id === "0202"
        ? buildPlantAskPrompt()
        : chapter.id === "0206"
          ? buildFoodObservePrompt()
          : buildVisionAskPrompt(itemLabel);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製拍照提問句，拍完可貼給 AI。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyVisionDemo = (demo: VisionIdentifyDemo) => {
    setItemLabel(demo.itemLabel);
    setAiAnswerNote(demo.aiAnswerSummary);
    setTrustLevel(demo.trustLevel);
    setReflectNote(demo.verifyNote);
    saveDraft({
      itemLabel: demo.itemLabel,
      aiAnswerNote: demo.aiAnswerSummary,
      trustLevel: demo.trustLevel,
      reflectNote: demo.verifyNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的物品。`);
  };

  const setVisionTrust = (level: VisionTrustLevel) => {
    setTrustLevel(level);
    saveDraft({ trustLevel: level });
  };

  const applyPhotoSearchDemo = (demo: PhotoSearchDemo) => {
    setSearchKeyword(demo.searchKeyword);
    setMemoryNote(demo.memoryNote);
    setReflectNote(demo.reflectNote);
    saveDraft({
      searchKeyword: demo.searchKeyword,
      memoryNote: demo.memoryNote,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的搜尋詞。`);
  };

  const applyNoteDemo = (demo: NoteCaptureDemo) => {
    setNoteTitle(demo.noteTitle);
    setNoteContent(demo.noteContent);
    setNoteTagId(demo.tagId);
    setReflectNote(demo.reflectNote);
    saveDraft({
      noteTitle: demo.noteTitle,
      noteContent: demo.noteContent,
      tagId: demo.tagId,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的便條。`);
  };

  const applySmartFlowDemo = (demo: SmartFlowDemo) => {
    setSnapNote(demo.snapNote);
    setAskQuestion(demo.askQuestion);
    setAskAnswer(demo.askAnswer);
    setSavedLine(demo.savedLine);
    setReflectNote(demo.reflectNote);
    saveDraft({
      snapNote: demo.snapNote,
      askQuestion: demo.askQuestion,
      askAnswer: demo.askAnswer,
      savedLine: demo.savedLine,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的流程。`);
  };

  const copySmartFlowAsk = async () => {
    const text = buildSmartFlowAskPrompt(snapNote);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製二問提問句，可以貼給 AI 或說出來。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyMenuDemo = (demo: MenuTranslateDemo) => {
    setMenuSnippet(demo.menuSnippet);
    setDietaryNeed(demo.dietaryNeed);
    setTranslationSummary(demo.translationSummary);
    setConfirmWithStaff(demo.confirmWithStaff);
    saveDraft({
      menuSnippet: demo.menuSnippet,
      dietaryNeed: demo.dietaryNeed,
      translationSummary: demo.translationSummary,
      confirmWithStaff: demo.confirmWithStaff,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的菜單。`);
  };

  const copyMenuAsk = async () => {
    const text = buildMenuTranslatePrompt(dietaryNeed);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製菜單翻譯提問句，拍完可貼給 AI。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyProductDemo = (demo: ProductCompareDemo) => {
    setProductA(demo.productA);
    setProductB(demo.productB);
    setThreeDiffs(demo.threeDiffs);
    setVerifyItem(demo.verifyItem);
    setReflectNote(demo.decisionFactor);
    saveDraft({
      productA: demo.productA,
      productB: demo.productB,
      threeDiffs: demo.threeDiffs,
      verifyItem: demo.verifyItem,
      reflectNote: demo.decisionFactor,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的商品。`);
  };

  const copyProductAsk = async () => {
    const text = buildProductComparePrompt(productA, productB);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製商品比較提問句，拍完可貼給 AI。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyCuriosityDemo = (demo: CuriosityAskDemo) => {
    setQuestion(demo.question);
    setAiAnswer(demo.aiAnswer);
    setInsight(demo.insight);
    saveDraft({
      question: demo.question,
      aiAnswer: demo.aiAnswer,
      insight: demo.insight,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的問題。`);
  };

  const copyCuriosityAsk = async () => {
    const text =
      chapter.id === "0707"
        ? (question.trim() || chapter.samplePrompt || buildUrbanDayCirclePrompt())
        : chapter.samplePrompt && (!question.trim() || question.trim() === chapter.samplePrompt.trim())
          ? (question.trim() || chapter.samplePrompt)
          : buildCuriosityPrompt(question);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        chapter.id === "0707"
          ? "已複製一日生活圈提問句，可以貼給 AI 或說出來。"
          : "已複製好奇心提問句，可以貼給 AI 或說出來。"
      );
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const copyDayRehearsalAsk = async () => {
    const text =
      chapter.samplePrompt?.trim() ||
      buildDayRehearsalPrompt(fromPlace, toPlace);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製一日彩排提問句，可以貼給 AI。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyCityRadiusDemo = (demo: CityRadiusDemo) => {
    setCityPlace(demo.place);
    setCityMeaning(demo.meaning);
    setReflectNote(demo.reflectNote);
    saveDraft({ place: demo.place, meaning: demo.meaning, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}，您可以改成自己的起點。`);
  };

  const applyDayRehearsalDemo = (demo: DayRehearsalDemo) => {
    setFromPlace(demo.fromPlace);
    setToPlace(demo.toPlace);
    setRestPoint(demo.restPoint);
    setRehearsalBackup(demo.backup);
    setOfficialCheck(demo.officialCheck);
    setReflectNote(demo.reflectNote);
    saveDraft({
      fromPlace: demo.fromPlace,
      toPlace: demo.toPlace,
      restPoint: demo.restPoint,
      backup: demo.backup,
      officialCheck: demo.officialCheck,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的彩排。`);
  };

  const applyMomentPlaceDemo = (demo: MomentPlaceDemo) => {
    setMomentActivity(demo.activity);
    setDepartAt(demo.departAt);
    setArriveAt(demo.arriveAt);
    setRestAt(demo.restAt);
    setReturnAt(demo.returnAt);
    setReflectNote(demo.reflectNote);
    saveDraft({
      activity: demo.activity,
      departAt: demo.departAt,
      arriveAt: demo.arriveAt,
      restAt: demo.restAt,
      returnAt: demo.returnAt,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的時刻。`);
  };

  const applyPassPrepDemo = (demo: PassPrepDemo) => {
    setTicketWhere(demo.ticketWhere);
    setOpenHow(demo.openHow);
    setOfficialSource(demo.officialSource);
    setPassBackup(demo.backup);
    setReflectNote(demo.reflectNote);
    saveDraft({
      ticketWhere: demo.ticketWhere,
      openHow: demo.openHow,
      officialSource: demo.officialSource,
      backup: demo.backup,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的通行準備。`);
  };

  const applySafeCornerDemo = (demo: SafeCornerDemo) => {
    setSafeDestination(demo.destination);
    setRouteNote(demo.routeNote);
    setRestSpot(demo.restSpot);
    setCornerBackup(demo.backup);
    setReflectNote(demo.reflectNote);
    saveDraft({
      destination: demo.destination,
      routeNote: demo.routeNote,
      restSpot: demo.restSpot,
      backup: demo.backup,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的安心角落。`);
  };

  const applyActivityGuideDemo = (demo: ActivityGuideDemo) => {
    setActivityType(demo.activityType);
    setActivityDuration(demo.duration);
    setRestStyle(demo.restStyle);
    setTransitPref(demo.transitPref);
    setCompanion(demo.companion);
    setReflectNote(demo.reflectNote);
    saveDraft({
      activityType: demo.activityType,
      duration: demo.duration,
      restStyle: demo.restStyle,
      transitPref: demo.transitPref,
      companion: demo.companion,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的指南。`);
  };

  const applyElegantReplanDemo = (demo: ElegantReplanDemo) => {
    setReplanTrigger(demo.trigger);
    setPlanA(demo.planA);
    setPlanB(demo.planB);
    setSoftReminder(demo.softReminder);
    setReflectNote(demo.reflectNote);
    saveDraft({
      trigger: demo.trigger,
      planA: demo.planA,
      planB: demo.planB,
      softReminder: demo.softReminder,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的重排。`);
  };

  const applyThreeSightDemo = (demo: ThreeSightDemo) => {
    setSawNote(demo.saw);
    setFeltNote(demo.felt);
    setBringHome(demo.bringHome);
    setReflectNote(demo.reflectNote);
    saveDraft({
      saw: demo.saw,
      felt: demo.felt,
      bringHome: demo.bringHome,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的見聞。`);
  };

  const applyCityLightsDemo = (demo: CityLightsDemo) => {
    setLightArrange(demo.arrange);
    setLightVerify(demo.verify);
    setLightReplan(demo.replan);
    setLightKeep(demo.keep);
    setReflectNote(demo.reflectNote);
    saveDraft({
      arrange: demo.arrange,
      verify: demo.verify,
      replan: demo.replan,
      keep: demo.keep,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的光點。`);
  };

  const applyRecipeDemo = (demo: RecipeCardDemo) => {
    setDishName(demo.dishName);
    setColors(demo.colors);
    setFiberSource(demo.fiberSource);
    setFeeling(demo.feeling);
    saveDraft({
      dishName: demo.dishName,
      colors: demo.colors,
      fiberSource: demo.fiberSource,
      feeling: demo.feeling,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的料理。`);
  };

  const applyPhotoEditDemo = (demo: PhotoEditSafeDemo) => {
    setBackupDone(true);
    setEditAction(demo.editAction);
    setCompareNote(demo.compareNote);
    saveDraft({
      backupDone: true,
      editAction: demo.editAction,
      compareNote: demo.compareNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的修圖計畫。`);
  };

  const applyPhotoCurateDemo = (demo: PhotoCurateDemo) => {
    setTheme(demo.theme);
    setCaptions(demo.captions);
    setReflectNote(demo.reflectNote);
    saveDraft({
      theme: demo.theme,
      captions: demo.captions,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的策展。`);
  };

  const applyHabitDemo = (demo: SensoryHabitDemo) => {
    setPickedScenes(demo.pickedScenes);
    setPlanNote(demo.planNote);
    setReflectNote(demo.reflectNote);
    saveDraft({
      pickedScenes: demo.pickedScenes,
      planNote: demo.planNote,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的計畫。`);
  };

  const toggleHabitScene = (id: string) => {
    setPickedScenes((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveDraft({ pickedScenes: next });
      return next;
    });
  };

  const copyNoteTemplate = async () => {
    const tagLabel =
      chapter.noteTagOptions?.find((t) => t.id === noteTagId)?.label ?? "";
    const text = [noteTitle.trim(), noteContent.trim(), tagLabel ? `#${tagLabel}` : ""]
      .filter(Boolean)
      .join("\n");
    if (!noteContent.trim()) {
      toast.info("請先寫下一句想留下的話。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製便條內容，可以貼到您的筆記 App。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const toggleBackground = (id: string) => {
    setBackgrounds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveDraft({ backgrounds: next });
      return next;
    });
  };

  const copySamplePrompt = async () => {
    if (!chapter.samplePrompt) return;
    try {
      await navigator.clipboard.writeText(chapter.samplePrompt);
      toast.success("已複製試用語句，可以貼到 AI 對話裡。");
    } catch {
      toast.info("請長按下方文字框，手動複製。");
    }
  };

  const printCard = () => {
    trackEvent("chapter_print_card", { chapter: chapter.id });
    window.print();
  };

  const guideBtnLabel = chapter.footerGuideLabel
    ?? (chapter.guideDuration
      ? `聽／讀 ${chapter.guideDuration}章首導讀`
      : "章首導讀");

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #chapter-print-card, #chapter-print-card * { visibility: visible; }
          #chapter-print-card {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 24px; background: #fff; color: #3D2E20;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{
        minHeight: "100dvh", maxWidth: 480, margin: "0 auto",
        background: "var(--bg, #FAF5EC)", position: "relative",
      }}>
        <SubPage
          title={chapter.subtitle}
          onBack={() => router.push("/")}
          accent={chapter.accentGradient ?? "linear-gradient(180deg, #E8F4FA 0%, transparent 55%)"}
          footer={
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={() => setGuideOpen((v) => !v)}
            >
              {guideOpen ? "收合示範" : guideBtnLabel}
            </button>
          }
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              {chapter.headerEmoji ?? "⛵"}
            </div>
            <div style={{
              fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
              letterSpacing: "0.08em", marginBottom: 6,
            }}>
              {chapter.subtitle}｜QR {chapter.qrCode}
            </div>
            <h1 style={{
              fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 12px",
              lineHeight: 1.25,
            }}>
              {chapter.title}
            </h1>
          </div>

          {chapter.quote && (
            <blockquote style={{
              margin: "0 0 24px", padding: "18px 20px",
              background: "linear-gradient(135deg, #E8F4FA 0%, #FFF8EE 100%)",
              borderRadius: "var(--r-lg)",
              borderLeft: "4px solid #5BA0C9",
              fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.65,
              color: "var(--ink-1)",
            }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "#5BA0C9",
                marginBottom: 8,
              }}>
                先帶走這一句
              </div>
              {chapter.quote}
            </blockquote>
          )}

          {chapter.atAGlance && (
            <>
              <SectionLabel>一眼看懂</SectionLabel>
              <p style={{
                fontSize: "var(--fs-base)", color: "var(--ink-2)",
                lineHeight: 1.65, margin: "0 0 24px",
              }}>
                {chapter.atAGlance}
              </p>
            </>
          )}

          <SectionLabel>今天的一小步</SectionLabel>

          <StepCard title="試一試" body={chapter.tryPrompt} />

          {layout === "ai-entry" && chapter.samplePrompt && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                padding: "16px 18px", borderRadius: "var(--r-lg)",
                background: "var(--surface)", border: "2px solid var(--line-strong)",
                fontSize: "var(--fs-base)", fontWeight: 700, lineHeight: 1.6,
                marginBottom: 10,
              }}>
                「{chapter.samplePrompt}」
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={copySamplePrompt}
                  style={{
                    width: "100%", padding: "14px",
                    background: "var(--surface)", border: "2px solid var(--line-strong)",
                    borderRadius: "var(--r-pill)", fontWeight: 700,
                    fontSize: "var(--fs-sm)", cursor: "pointer",
                  }}
                >
                  複製這句話
                </button>
                <button
                  type="button"
                  onClick={tryInNuannuan}
                  style={{
                    width: "100%", padding: "14px",
                    background: "var(--primary-soft)", border: "2px solid var(--primary)",
                    borderRadius: "var(--r-pill)", fontWeight: 700,
                    fontSize: "var(--fs-sm)", color: "var(--primary-deep)",
                    cursor: "pointer",
                  }}
                >
                  在暖暖試這句話 →
                </button>
              </div>
            </div>
          )}

          {layout === "question-rewrite" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                先寫三個關鍵字
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
                marginBottom: 12,
              }}>
                {(["一", "二", "三"] as const).map((label, i) => (
                  <input
                    key={label}
                    value={keywords[i]}
                    onChange={(e) => {
                      const next = [...keywords] as [string, string, string];
                      next[i] = e.target.value;
                      setKeywords(next);
                      saveDraft({ keywords: next });
                    }}
                    placeholder={`關鍵字${label}`}
                    style={{
                      padding: "12px 10px", borderRadius: 10,
                      border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      textAlign: "center", fontFamily: "inherit",
                    }}
                  />
                ))}
              </div>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                改寫成一段完整的生活提問
              </div>
              <textarea
                value={naturalQuestion}
                onChange={(e) => {
                  setNaturalQuestion(e.target.value);
                  saveDraft({ naturalQuestion: e.target.value });
                }}
                placeholder="例如：我有在吃血壓藥，最近量起來偏高，請用簡單中文告訴我飲食要注意什麼？"
                rows={4}
                style={{
                  width: "100%", padding: "14px 16px", marginBottom: 10,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={copyNaturalQuestion}
                  style={{
                    width: "100%", padding: "14px",
                    background: "var(--surface)", border: "2px solid var(--line-strong)",
                    borderRadius: "var(--r-pill)", fontWeight: 700,
                    fontSize: "var(--fs-sm)", cursor: "pointer",
                  }}
                >
                  複製我的自然提問
                </button>
                <button
                  type="button"
                  onClick={tryInNuannuan}
                  style={{
                    width: "100%", padding: "14px",
                    background: "var(--primary-soft)", border: "2px solid var(--primary)",
                    borderRadius: "var(--r-pill)", fontWeight: 700,
                    fontSize: "var(--fs-sm)", color: "var(--primary-deep)",
                    cursor: "pointer",
                  }}
                >
                  在暖暖試問這句話 →
                </button>
              </div>
            </div>
          )}

          {layout === "organize-decide" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                繁雜的事（請勿含身分證、密碼、完整病歷等敏感資料）
              </div>
              <textarea
                value={messyTask}
                onChange={(e) => {
                  setMessyTask(e.target.value);
                  saveDraft({ messyTask: e.target.value });
                }}
                placeholder="例如：回診拿回家一疊衛教單，不知道先看什麼…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px", marginBottom: 10,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={copyOrganizeAsk} style={secondaryBtnStyle}>
                  複製「請 AI 整理」提問句
                </button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖試問這件事 →
                </button>
              </div>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                AI 整理後，填入三個重點與下一步
              </div>
              {(["一", "二", "三"] as const).map((label, i) => (
                <input
                  key={label}
                  value={threePoints[i]}
                  onChange={(e) => {
                    const next = [...threePoints] as [string, string, string];
                    next[i] = e.target.value;
                    setThreePoints(next);
                    saveDraft({ threePoints: next });
                  }}
                  placeholder={`重點${label}`}
                  style={{
                    width: "100%", padding: "12px 14px", marginBottom: 8,
                    borderRadius: 10, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              ))}
              <input
                value={nextStep}
                onChange={(e) => {
                  setNextStep(e.target.value);
                  saveDraft({ nextStep: e.target.value });
                }}
                placeholder="可先做的小步驟"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {layout === "vision-identify" && (
            <div style={{ marginBottom: 16 }}>
              {chapter.visionSafetyTips && (
                <div style={{
                  display: "flex", flexDirection: "column", gap: 8, marginBottom: 14,
                }}>
                  {chapter.visionSafetyTips.map((tip) => (
                    <div
                      key={tip.id}
                      style={{
                        padding: "12px 14px", borderRadius: 12,
                        background: tip.id === "avoid" ? "#FFF5F0" : "var(--surface)",
                        border: `2px solid ${tip.id === "avoid" ? "#E8845A" : "var(--line)"}`,
                      }}
                    >
                      <div style={{
                        fontSize: "var(--fs-xs)", fontWeight: 800,
                        color: tip.id === "avoid" ? "#C45A2A" : "var(--ink-2)",
                        marginBottom: 6,
                      }}>
                        {tip.label}
                      </div>
                      <ul style={{
                        margin: 0, paddingLeft: 18,
                        fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
                      }}>
                        {tip.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                我拍的是（低風險物品，可選填）
              </div>
              <input
                value={itemLabel}
                onChange={(e) => {
                  setItemLabel(e.target.value);
                  saveDraft({ itemLabel: e.target.value });
                }}
                placeholder="例如：公園長椅旁的小白花…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={copyVisionAsk} style={secondaryBtnStyle}>
                  複製「拍照後請 AI 說明」提問句
                </button>
                <button type="button" onClick={tryCameraInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖拍一下 →
                </button>
                <button
                  type="button"
                  onClick={tryPhotoInNuannuan}
                  style={{
                    ...secondaryBtnStyle,
                    border: "2px solid var(--primary)",
                    color: "var(--primary-deep)",
                  }}
                >
                  從相簿選照片 →
                </button>
              </div>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                AI 回答摘要（自己記下重點）
              </div>
              <textarea
                value={aiAnswerNote}
                onChange={(e) => {
                  setAiAnswerNote(e.target.value);
                  saveDraft({ aiAnswerNote: e.target.value });
                }}
                placeholder="例如：可能是某種野花，春天常見…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px", marginBottom: 12,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                這個回答比較像？
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => setVisionTrust("enjoy")}
                  style={{
                    padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${trustLevel === "enjoy" ? "#5BA0C9" : "var(--line-strong)"}`,
                    background: trustLevel === "enjoy" ? "#E8F4FA" : "var(--surface)",
                    fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--ink-1)",
                  }}
                >
                  🌸 可直接欣賞
                </button>
                <button
                  type="button"
                  onClick={() => setVisionTrust("verify")}
                  style={{
                    padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${trustLevel === "verify" ? "#E8845A" : "var(--line-strong)"}`,
                    background: trustLevel === "verify" ? "#FFF0E8" : "var(--surface)",
                    fontWeight: 800, fontSize: "var(--fs-sm)", color: "var(--ink-1)",
                  }}
                >
                  🔍 需要查證
                </button>
              </div>
            </div>
          )}

          {layout === "photo-search" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                在相簿搜尋一個有溫度的詞
              </div>
              <input
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  saveDraft({ searchKeyword: e.target.value });
                }}
                placeholder="例如：海邊、生日、台南、咖啡、朋友…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              {chapter.warmKeywordSuggestions && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14,
                }}>
                  {chapter.warmKeywordSuggestions.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        setSearchKeyword(word);
                        saveDraft({ searchKeyword: word });
                      }}
                      style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: `2px solid ${searchKeyword === word ? "#9B7AD4" : "var(--line-strong)"}`,
                        background: searchKeyword === word ? "#F5EEF8" : "var(--surface)",
                        fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        color: searchKeyword === word ? "#7B5BB8" : "var(--ink-2)",
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                最觸動的一張，寫下一句回憶
              </div>
              <textarea
                value={memoryNote}
                onChange={(e) => {
                  setMemoryNote(e.target.value);
                  saveDraft({ memoryNote: e.target.value });
                }}
                placeholder="例如：和老朋友在巷口小店，第一次用新手機拍的那杯咖啡…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <p style={{
                fontSize: "var(--fs-xs)", color: "var(--ink-3)", margin: "10px 0 0",
                lineHeight: 1.5,
              }}>
                提示：搜尋請在手機「照片／相簿」App 完成（暖暖尚無相簿搜尋）；結果可能受備份設定與辨識準確度影響。回本頁寫下回憶即可。
              </p>
            </div>
          )}

          {layout === "note-capture" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                標題
              </div>
              <input
                value={noteTitle}
                onChange={(e) => {
                  setNoteTitle(e.target.value);
                  saveDraft({ noteTitle: e.target.value });
                }}
                placeholder={chapter.defaultNoteTitle ?? "今天的小發現"}
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 12,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                只寫一句真正想留下的話
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => {
                  setNoteContent(e.target.value);
                  saveDraft({ noteContent: e.target.value });
                }}
                placeholder="例如：路邊那朵小白花可能叫「阿拉伯婆婆納」…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px", marginBottom: 12,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              {chapter.noteTagOptions && (
                <>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                    marginBottom: 8,
                  }}>
                    加一個簡單標籤
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {chapter.noteTagOptions.map((tag) => {
                      const on = noteTagId === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setNoteTagId(tag.id);
                            saveDraft({ tagId: tag.id });
                          }}
                          style={{
                            textAlign: "left", padding: "12px 14px", borderRadius: 12,
                            border: `2px solid ${on ? "var(--primary)" : "var(--line-strong)"}`,
                            background: on ? "var(--primary-soft)" : "var(--surface)",
                            fontWeight: 700, fontSize: "var(--fs-sm)", cursor: "pointer",
                          }}
                        >
                          {on ? "✓ " : ""}{tag.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <button type="button" onClick={copyNoteTemplate} style={secondaryBtnStyle}>
                複製便條內容（可貼到筆記 App）
              </button>
            </div>
          )}

          {layout === "smart-flow" && (
            <div style={{ marginBottom: 16 }}>
              {(["一拍", "二問", "三記下"] as const).map((stepLabel, idx) => (
                <div
                  key={stepLabel}
                  style={{
                    marginBottom: 14, padding: 14, borderRadius: 14,
                    background: "var(--surface)", border: "2px solid var(--line)",
                  }}
                >
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--primary-deep)",
                    marginBottom: 8,
                  }}>
                    {idx + 1}｜{stepLabel}
                  </div>
                  {idx === 0 && (
                    <>
                      <input
                        value={snapNote}
                        onChange={(e) => {
                          setSnapNote(e.target.value);
                          saveDraft({ snapNote: e.target.value });
                        }}
                        placeholder="拍下什麼？例如：公園長椅旁的小白花…"
                        style={{
                          width: "100%", padding: "12px 14px", marginBottom: 8,
                          borderRadius: 10, border: "2px solid var(--line-strong)",
                          background: "var(--surface-warm)", fontSize: "var(--fs-sm)",
                          fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                      <button type="button" onClick={tryCameraInNuannuan} style={primaryOutlineBtnStyle}>
                        在暖暖拍一下 →
                      </button>
                    </>
                  )}
                  {idx === 1 && (
                    <>
                      <input
                        value={askQuestion}
                        onChange={(e) => {
                          setAskQuestion(e.target.value);
                          saveDraft({ askQuestion: e.target.value });
                        }}
                        placeholder="這是什麼？請用簡單中文說明。"
                        style={{
                          width: "100%", padding: "12px 14px", marginBottom: 8,
                          borderRadius: 10, border: "2px solid var(--line-strong)",
                          background: "var(--surface-warm)", fontSize: "var(--fs-sm)",
                          fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                      <textarea
                        value={askAnswer}
                        onChange={(e) => {
                          setAskAnswer(e.target.value);
                          saveDraft({ askAnswer: e.target.value });
                        }}
                        placeholder="AI 回答摘要…"
                        rows={2}
                        style={{
                          width: "100%", padding: "12px 14px", marginBottom: 8,
                          borderRadius: 10, border: "2px solid var(--line-strong)",
                          background: "var(--surface-warm)", fontSize: "var(--fs-sm)",
                          fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button type="button" onClick={copySmartFlowAsk} style={secondaryBtnStyle}>
                          複製二問提問句
                        </button>
                        <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>
                          在暖暖問一句 →
                        </button>
                      </div>
                    </>
                  )}
                  {idx === 2 && (
                    <textarea
                      value={savedLine}
                      onChange={(e) => {
                        setSavedLine(e.target.value);
                        saveDraft({ savedLine: e.target.value });
                      }}
                      placeholder="從回答裡選最有用的一句，存進便條…"
                      rows={3}
                      style={{
                        width: "100%", padding: "12px 14px",
                        borderRadius: 10, border: "2px solid var(--line-strong)",
                        background: "var(--surface-warm)", fontSize: "var(--fs-sm)",
                        fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {layout === "menu-translate" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                菜單片段（可選填）
              </div>
              <input
                value={menuSnippet}
                onChange={(e) => {
                  setMenuSnippet(e.target.value);
                  saveDraft({ menuSnippet: e.target.value });
                }}
                placeholder="例如：焼き鳥定食、野菜サラダ…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                我的飲食需要
              </div>
              <input
                value={dietaryNeed}
                onChange={(e) => {
                  setDietaryNeed(e.target.value);
                  saveDraft({ dietaryNeed: e.target.value });
                }}
                placeholder="例如：少油、不要太辣、不含堅果…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={copyMenuAsk} style={secondaryBtnStyle}>
                  複製「請 AI 翻譯菜單」提問句
                </button>
                <button type="button" onClick={tryCameraInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖拍一下 →
                </button>
                <button
                  type="button"
                  onClick={tryPhotoInNuannuan}
                  style={{
                    ...secondaryBtnStyle,
                    border: "2px solid var(--primary)",
                    color: "var(--primary-deep)",
                  }}
                >
                  從相簿選照片 →
                </button>
              </div>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                AI 翻譯摘要（自己記下重點）
              </div>
              <textarea
                value={translationSummary}
                onChange={(e) => {
                  setTranslationSummary(e.target.value);
                  saveDraft({ translationSummary: e.target.value });
                }}
                placeholder="例如：烤雞定食、蔬菜沙拉；醬料可能含醬油與糖…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px", marginBottom: 10,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                需向店家確認
              </div>
              <input
                value={confirmWithStaff}
                onChange={(e) => {
                  setConfirmWithStaff(e.target.value);
                  saveDraft({ confirmWithStaff: e.target.value });
                }}
                placeholder="例如：定食是否含白飯、醬料能否另放…"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {layout === "product-compare" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                商品 A（請勿含收據個資）
              </div>
              <input
                value={productA}
                onChange={(e) => {
                  setProductA(e.target.value);
                  saveDraft({ productA: e.target.value });
                }}
                placeholder="例如：A 牌 1.7L 快煮壺…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                商品 B
              </div>
              <input
                value={productB}
                onChange={(e) => {
                  setProductB(e.target.value);
                  saveDraft({ productB: e.target.value });
                }}
                placeholder="例如：B 牌 1.5L 保溫壺…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={copyProductAsk} style={secondaryBtnStyle}>
                  複製「請 AI 比較商品」提問句
                </button>
                <button type="button" onClick={tryCameraInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖拍一下 →
                </button>
              </div>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                三項差異
              </div>
              {(["一", "二", "三"] as const).map((label, i) => (
                <input
                  key={label}
                  value={threeDiffs[i]}
                  onChange={(e) => {
                    const next = [...threeDiffs] as [string, string, string];
                    next[i] = e.target.value;
                    setThreeDiffs(next);
                    saveDraft({ threeDiffs: next });
                  }}
                  placeholder={`差異${label}`}
                  style={{
                    width: "100%", padding: "12px 14px", marginBottom: 8,
                    borderRadius: 10, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              ))}
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                待向標示或店員確認
              </div>
              <input
                value={verifyItem}
                onChange={(e) => {
                  setVerifyItem(e.target.value);
                  saveDraft({ verifyItem: e.target.value });
                }}
                placeholder="例如：實際耗電量與退換貨條件需看盒裝標示…"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {layout === "curiosity-ask" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                今天想問的問題
              </div>
              <input
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  saveDraft({ question: e.target.value });
                }}
                placeholder="例如：傍晚的雲為什麼有時特別紅？"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={copyCuriosityAsk} style={secondaryBtnStyle}>
                  {chapter.id === "0707" ? "複製一日生活圈提問句" : "複製好奇心提問句"}
                </button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖問一句 →
                </button>
              </div>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                AI 回答摘要
              </div>
              <textarea
                value={aiAnswer}
                onChange={(e) => {
                  setAiAnswer(e.target.value);
                  saveDraft({ aiAnswer: e.target.value });
                }}
                placeholder="例如：光線穿過大氣時，較長波長的紅光更容易被看見…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px", marginBottom: 10,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                與生活的連結
              </div>
              <input
                value={insight}
                onChange={(e) => {
                  setInsight(e.target.value);
                  saveDraft({ insight: e.target.value });
                }}
                placeholder="例如：以後看夕陽時，可以留意雲層厚薄與顏色變化…"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {layout === "recipe-card" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                料理名稱
              </div>
              <input
                value={dishName}
                onChange={(e) => {
                  setDishName(e.target.value);
                  saveDraft({ dishName: e.target.value });
                }}
                placeholder="例如：綜合蔬菜沙拉…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                主要顏色
              </div>
              <input
                value={colors}
                onChange={(e) => {
                  setColors(e.target.value);
                  saveDraft({ colors: e.target.value });
                }}
                placeholder="例如：綠、紅、黃…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                可能的蔬菜或全穀來源
              </div>
              <input
                value={fiberSource}
                onChange={(e) => {
                  setFiberSource(e.target.value);
                  saveDraft({ fiberSource: e.target.value });
                }}
                placeholder="例如：葉菜、番茄、玉米…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                一句感受
              </div>
              <input
                value={feeling}
                onChange={(e) => {
                  setFeeling(e.target.value);
                  saveDraft({ feeling: e.target.value });
                }}
                placeholder="例如：清爽，但醬料可以少一點…"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {layout === "photo-edit-safe" && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: 12, marginBottom: 14,
                  background: backupDone ? "var(--primary-soft)" : "var(--surface)",
                  borderRadius: 12,
                  border: `2px solid ${backupDone ? "var(--primary)" : "var(--line-strong)"}`,
                  cursor: "pointer", fontSize: "var(--fs-sm)",
                }}
              >
                <input
                  type="checkbox"
                  checked={backupDone}
                  onChange={(e) => {
                    setBackupDone(e.target.checked);
                    saveDraft({ backupDone: e.target.checked });
                  }}
                  style={{ width: 22, height: 22, marginTop: 2, flexShrink: 0 }}
                />
                <span>
                  <strong>已備份原檔</strong>
                  <span style={{ color: "var(--ink-3)", display: "block", marginTop: 2 }}>
                    開始修圖前，先複製一份或確認原檔仍在
                  </span>
                </span>
              </label>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                移除或調整項目
              </div>
              <input
                value={editAction}
                onChange={(e) => {
                  setEditAction(e.target.value);
                  saveDraft({ editAction: e.target.value });
                }}
                placeholder="例如：移除右側一半的路人剪影…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 10,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                修改前後感受比較
              </div>
              <textarea
                value={compareNote}
                onChange={(e) => {
                  setCompareNote(e.target.value);
                  saveDraft({ compareNote: e.target.value });
                }}
                placeholder="例如：焦點回到孫子與海浪，邊緣略需放大檢查…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {layout === "photo-curate" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                策展主題
              </div>
              <input
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  saveDraft({ theme: e.target.value });
                }}
                placeholder="例如：我走過的海邊…"
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 12,
                  borderRadius: 10, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              {(["一", "二", "三"] as const).map((label, i) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                    marginBottom: 8,
                  }}>
                    照片{label}說明
                  </div>
                  <input
                    value={captions[i]}
                    onChange={(e) => {
                      const next = [...captions] as [string, string, string];
                      next[i] = e.target.value;
                      setCaptions(next);
                      saveDraft({ captions: next });
                    }}
                    placeholder={`第${label}張照片想說的話…`}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 10, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "sensory-habit" && (
            <div style={{ marginBottom: 16 }}>
              {chapter.habitSceneOptions && (
                <>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                    marginBottom: 8,
                  }}>
                    選三個生活場景（任選三天各完成一次）
                  </div>
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 8, marginBottom: 14,
                  }}>
                    {chapter.habitSceneOptions.map((opt) => {
                      const on = pickedScenes.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          style={{
                            display: "flex", gap: 12, alignItems: "flex-start",
                            padding: 12,
                            background: on ? "var(--primary-soft)" : "var(--surface)",
                            borderRadius: 12,
                            border: `2px solid ${on ? "var(--primary)" : "var(--line)"}`,
                            cursor: "pointer", fontSize: "var(--fs-sm)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleHabitScene(opt.id)}
                            style={{ width: 22, height: 22, marginTop: 2, flexShrink: 0 }}
                          />
                          <span>
                            <strong>{opt.label}</strong>
                            <span style={{ color: "var(--ink-3)", display: "block", marginTop: 2 }}>
                              {opt.hint}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 8,
              }}>
                三天溫和計畫
              </div>
              <textarea
                value={planNote}
                onChange={(e) => {
                  setPlanNote(e.target.value);
                  saveDraft({ planNote: e.target.value });
                }}
                placeholder="例如：週二散步識花、週四午餐觀察、週日搜尋「朋友」…"
                rows={3}
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>
          )}


          {layout === "city-radius" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我想重新打開的城市角落</div>
                <textarea value={cityPlace} onChange={(e) => { setCityPlace(e.target.value); saveDraft({ place: e.target.value }); }}
                  placeholder="例如：巷口那間好久沒去的書店…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>它對我的生活意義</div>
                <textarea value={cityMeaning} onChange={(e) => { setCityMeaning(e.target.value); saveDraft({ meaning: e.target.value }); }}
                  placeholder="例如：想慢慢翻書，重新感覺城市還能連上線…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "day-rehearsal" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>從哪裡出發</div>
                <input value={fromPlace} onChange={(e) => { setFromPlace(e.target.value); saveDraft({ fromPlace: e.target.value }); }}
                  placeholder="例如：住家附近…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>想到哪裡</div>
                <input value={toPlace} onChange={(e) => { setToPlace(e.target.value); saveDraft({ toPlace: e.target.value }); }}
                  placeholder="例如：市中心展覽館（大範圍即可）…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>休息點</div>
                <input value={restPoint} onChange={(e) => { setRestPoint(e.target.value); saveDraft({ restPoint: e.target.value }); }}
                  placeholder="例如：館內咖啡座或附近公園長椅…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>備案</div>
                <input value={rehearsalBackup} onChange={(e) => { setRehearsalBackup(e.target.value); saveDraft({ backup: e.target.value }); }}
                  placeholder="例如：人太多就改去附近書店…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>需向官方確認</div>
                <input value={officialCheck} onChange={(e) => { setOfficialCheck(e.target.value); saveDraft({ officialCheck: e.target.value }); }}
                  placeholder="例如：開館時間、是否需預約…"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" onClick={copyDayRehearsalAsk} style={secondaryBtnStyle}>複製一日彩排提問句</button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>在暖暖問一句 →</button>
              </div>
            </div>
          )}

          {layout === "moment-place" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "我想安放的活動", value: momentActivity, set: setMomentActivity, key: "activity", ph: "例如：市立美術館特展…" },
                { label: "出門時間", value: departAt, set: setDepartAt, key: "departAt", ph: "例如：13:00 出門…" },
                { label: "抵達時間（含緩衝）", value: arriveAt, set: setArriveAt, key: "arriveAt", ph: "例如：14:00 前抵達…" },
                { label: "休息時刻", value: restAt, set: setRestAt, key: "restAt", ph: "例如：15:30 坐一下喝茶…" },
                { label: "回程時間", value: returnAt, set: setReturnAt, key: "returnAt", ph: "例如：17:00 前從容回家…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <input value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "pass-prep" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "票券或通行資訊在", value: ticketWhere, set: setTicketWhere, key: "ticketWhere", ph: "例如：主辦 App／Email 票券頁…" },
                { label: "開啟方式", value: openHow, set: setOpenHow, key: "openHow", ph: "例如：入場前先開啟並確認可離線顯示…" },
                { label: "官方來源", value: officialSource, set: setOfficialSource, key: "officialSource", ph: "例如：主辦單位官網與票務信…" },
                { label: "備案（勿寫完整 QR）", value: passBackup, set: setPassBackup, key: "backup", ph: "例如：預先截圖或紙本備援…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <input value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "safe-corner" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "我想去的地方", value: safeDestination, set: setSafeDestination, key: "destination", ph: "例如：市中心展覽館（大範圍即可）…" },
                { label: "路線／出口提醒", value: routeNote, set: setRouteNote, key: "routeNote", ph: "例如：捷運出口較近的那一側…" },
                { label: "安心休息點", value: restSpot, set: setRestSpot, key: "restSpot", ph: "例如：館外公園長椅／附近咖啡館…" },
                { label: "備案", value: cornerBackup, set: setCornerBackup, key: "backup", ph: "例如：下雨就改去書店…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <input value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "activity-guide" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "我喜歡的活動類型", value: activityType, set: setActivityType, key: "activityType", ph: "例如：展覽、書店、小型講座…" },
                { label: "可接受的時間長度", value: activityDuration, set: setActivityDuration, key: "duration", ph: "例如：單場 1.5–2 小時…" },
                { label: "休息方式", value: restStyle, set: setRestStyle, key: "restStyle", ph: "例如：中途一定要有座位休息…" },
                { label: "交通偏好", value: transitPref, set: setTransitPref, key: "transitPref", ph: "例如：少轉乘、可慢慢走…" },
                { label: "同行偏好", value: companion, set: setCompanion, key: "companion", ph: "例如：可一人或一位朋友…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <textarea value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph} rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "elegant-replan" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>如果這個變數發生</div>
                <textarea value={replanTrigger} onChange={(e) => { setReplanTrigger(e.target.value); saveDraft({ trigger: e.target.value }); }}
                  placeholder="例如：忽然下雨或展覽人太多…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>備案 A</div>
                <textarea value={planA} onChange={(e) => { setPlanA(e.target.value); saveDraft({ planA: e.target.value }); }}
                  placeholder="例如：縮短停留，改去附近咖啡館…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>備案 B</div>
                <textarea value={planB} onChange={(e) => { setPlanB(e.target.value); saveDraft({ planB: e.target.value }); }}
                  placeholder="例如：把活動優雅改到下一週…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>一句不硬撐提醒</div>
                <textarea value={softReminder} onChange={(e) => { setSoftReminder(e.target.value); saveDraft({ softReminder: e.target.value }); }}
                  placeholder="例如：今天不適合再硬撐，從容回來也很好…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "three-sight" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>今天我看見的是</div>
                <textarea value={sawNote} onChange={(e) => { setSawNote(e.target.value); saveDraft({ saw: e.target.value }); }}
                  placeholder="例如：書店窗邊那一小片午後光…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>今天的感受</div>
                <textarea value={feltNote} onChange={(e) => { setFeltNote(e.target.value); saveDraft({ felt: e.target.value }); }}
                  placeholder="例如：原來城市還可以這樣慢慢靠近…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>想帶回生活裡的一件小事</div>
                <textarea value={bringHome} onChange={(e) => { setBringHome(e.target.value); saveDraft({ bringHome: e.target.value }); }}
                  placeholder="例如：下次出門前，先安放一個休息點…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "city-lights" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "安排光點", value: lightArrange, set: setLightArrange, key: "arrange", ph: "例如：出門前先彩排一天…" },
                { label: "查證光點", value: lightVerify, set: setLightVerify, key: "verify", ph: "例如：票券與開放時間向官方確認…" },
                { label: "重排光點", value: lightReplan, set: setLightReplan, key: "replan", ph: "例如：變數來了可以縮短或改天…" },
                { label: "留下光點", value: lightKeep, set: setLightKeep, key: "keep", ph: "例如：用三格見聞溫柔保存…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <textarea value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph} rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "routes" && chapter.entries && chapter.entries.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 10, marginBottom: 16,
            }}>
              {chapter.entries.map((entry) => (
                <EntryButton
                  key={entry.id}
                  entry={entry}
                  selected={picked === entry.id}
                  onSelect={() => savePick(entry.id)}
                  onGo={() => goEntry(entry)}
                />
              ))}
            </div>
          )}

          {layout === "ai-entry" && chapter.phonePaths && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)",
                marginBottom: 10,
              }}>
                常見入口（點一下標記您的手機）
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {chapter.phonePaths.map((path) => (
                  <PhonePathCard
                    key={path.id}
                    path={path}
                    selected={picked === path.id}
                    onSelect={() => savePick(path.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <StepCard title="回望一下" body={chapter.reflectPrompt} />

          {layout === "question-rewrite" && chapter.backgroundOptions && (
            <div style={{
              display: "flex", flexDirection: "column", gap: 8, marginBottom: 12,
            }}>
              {chapter.backgroundOptions.map((opt) => {
                const on = backgrounds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      padding: 12, background: on ? "var(--primary-soft)" : "var(--surface)",
                      borderRadius: 12,
                      border: `2px solid ${on ? "var(--primary)" : "var(--line)"}`,
                      cursor: "pointer", fontSize: "var(--fs-sm)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleBackground(opt.id)}
                      style={{ width: 22, height: 22, marginTop: 2, flexShrink: 0 }}
                    />
                    <span>
                      <strong>{opt.label}</strong>
                      <span style={{ color: "var(--ink-3)", display: "block", marginTop: 2 }}>
                        {opt.hint}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <textarea
            value={layout === "organize-decide" ? userDecision : reflectNote}
            onChange={(e) => {
              if (layout === "organize-decide") {
                setUserDecision(e.target.value);
                saveDraft({ userDecision: e.target.value });
              } else {
                setReflectNote(e.target.value);
                const reflectLayout: string = layout;
                if (
                  reflectLayout === "question-rewrite" ||
                  reflectLayout === "vision-identify" ||
                  reflectLayout === "photo-search" ||
                  reflectLayout === "note-capture" ||
                  reflectLayout === "smart-flow" ||
                  reflectLayout === "menu-translate" ||
                  reflectLayout === "product-compare" ||
                  reflectLayout === "curiosity-ask" ||
                  reflectLayout === "recipe-card" ||
                  reflectLayout === "photo-edit-safe" ||
                  reflectLayout === "photo-curate" ||
                  reflectLayout === "sensory-habit" ||
                  reflectLayout === "city-radius" ||
                  reflectLayout === "day-rehearsal" ||
                  reflectLayout === "moment-place" ||
                  reflectLayout === "pass-prep" ||
                  reflectLayout === "safe-corner" ||
                  reflectLayout === "activity-guide" ||
                  reflectLayout === "elegant-replan" ||
                  reflectLayout === "three-sight" ||
                  reflectLayout === "city-lights"
                ) {
                  saveDraft({ reflectNote: e.target.value });
                } else if (picked) {
                  savePick(picked, e.target.value);
                }
              }
            }}
            placeholder={
              layout === "organize-decide"
                ? chapter.reflectPlaceholder ?? "寫下仍需您自己決定的事…"
                : chapter.reflectPlaceholder ?? "寫下您的想法…"
            }
            rows={3}
            style={{
              width: "100%", padding: "14px 16px", marginBottom: 24,
              borderRadius: 12, border: "2px solid var(--line-strong)",
              background: "var(--surface)", fontSize: "var(--fs-sm)",
              fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
            }}
          />

          {guideOpen && (
            <div style={{
              marginBottom: 24, padding: 18,
              background: "var(--surface)", borderRadius: "var(--r-lg)",
              border: "1px solid var(--line)",
            }}>
              <div style={{
                fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 12,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Icon name="book" size={20} color="var(--primary-deep)" />
                {chapter.guideTitle}
                {chapter.guideDuration && (
                  <span style={{ fontWeight: 600, color: "var(--ink-3)" }}>
                    （{chapter.guideDuration}）
                  </span>
                )}
              </div>
              {chapter.guideParagraphs.map((p, i) => (
                <p key={i} style={{
                  fontSize: "var(--fs-sm)", color: "var(--ink-2)",
                  lineHeight: 1.65, margin: i === 0 ? 0 : "12px 0 0",
                }}>
                  {p}
                </p>
              ))}
              {layout === "ai-entry" && chapter.phonePaths && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {chapter.phonePaths.map((path) => (
                    <div key={path.id} style={{
                      padding: 12, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 6 }}>
                        {path.emoji} {path.label}
                      </div>
                      <ol style={{
                        margin: 0, paddingLeft: 20,
                        fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
                      }}>
                        {path.steps.map((s, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
              {layout === "question-rewrite" && chapter.rewriteDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.rewriteDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8,
                        color: "var(--primary-deep)",
                      }}>
                        {demo.label}
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginBottom: 6 }}>
                        關鍵字：{demo.keywords.join(" · ")}
                      </div>
                      <div style={{
                        fontSize: "var(--fs-sm)", color: "var(--ink-2)",
                        lineHeight: 1.55, marginBottom: 10,
                      }}>
                        → {demo.naturalQuestion}
                      </div>
                      <button
                        type="button"
                        onClick={() => applyDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--primary)", background: "var(--surface)",
                          color: "var(--primary-deep)", fontWeight: 700,
                          fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這組示範
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "organize-decide" && chapter.organizeDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.organizeDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8,
                        color: "var(--sage)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 8px" }}>
                        繁雜：{demo.messyTask}
                      </p>
                      <ol style={{
                        margin: "0 0 8px", paddingLeft: 20,
                        fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
                      }}>
                        {demo.threePoints.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>可先做：</strong>{demo.nextStep}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--primary-deep)" }}>
                        <strong>仍由我決定：</strong>{demo.userDecision}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyOrganizeDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--sage)", background: "var(--surface)",
                          color: "var(--sage)", fontWeight: 700,
                          fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "vision-identify" && chapter.visionDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.visionDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8,
                        color: "#5BA0C9",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>物品：</strong>{demo.itemLabel}
                      </p>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 8px" }}>
                        AI 摘要：{demo.aiAnswerSummary}
                      </p>
                      <p style={{
                        fontSize: "var(--fs-xs)", margin: "0 0 6px",
                        color: demo.trustLevel === "enjoy" ? "#5BA0C9" : "#C45A2A",
                        fontWeight: 700,
                      }}>
                        {demo.trustLevel === "enjoy" ? "🌸 可直接欣賞" : "🔍 需要查證"}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.verifyNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyVisionDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid #5BA0C9", background: "var(--surface)",
                          color: "#5BA0C9", fontWeight: 700,
                          fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "menu-translate" && chapter.menuDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.menuDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#E8845A",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>菜單：</strong>{demo.menuSnippet}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>飲食需要：</strong>{demo.dietaryNeed}
                      </p>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 8px" }}>
                        {demo.translationSummary}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--primary-deep)" }}>
                        <strong>向店家確認：</strong>{demo.confirmWithStaff}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyMenuDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid #E8845A", background: "var(--surface)",
                          color: "#C45A2A", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "product-compare" && chapter.productCompareDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.productCompareDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--sage)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>A：</strong>{demo.productA}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 8px" }}>
                        <strong>B：</strong>{demo.productB}
                      </p>
                      <ol style={{
                        margin: "0 0 8px", paddingLeft: 20,
                        fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
                      }}>
                        {demo.threeDiffs.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>待確認：</strong>{demo.verifyItem}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--primary-deep)" }}>
                        <strong>最影響決定：</strong>{demo.decisionFactor}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyProductDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--sage)", background: "var(--surface)",
                          color: "var(--sage)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "curiosity-ask" && chapter.curiosityDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.curiosityDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#5BA0C9",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 8px" }}>
                        <strong>問：</strong>{demo.question}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>答：</strong>{demo.aiAnswer}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.insight}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyCuriosityDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid #5BA0C9", background: "var(--surface)",
                          color: "#5BA0C9", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "recipe-card" && chapter.recipeCardDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.recipeCardDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--sage)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>料理：</strong>{demo.dishName}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>顏色：</strong>{demo.colors}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>纖維來源：</strong>{demo.fiberSource}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.feeling}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyRecipeDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--sage)", background: "var(--surface)",
                          color: "var(--sage)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "photo-edit-safe" && chapter.photoEditDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.photoEditDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>備份：</strong>{demo.backupNote}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>調整：</strong>{demo.editAction}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.compareNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyPhotoEditDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--primary)", background: "var(--surface)",
                          color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "photo-curate" && chapter.photoCurateDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.photoCurateDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#5BA0C9",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 8px" }}>
                        <strong>主題：</strong>{demo.theme}
                      </p>
                      <ol style={{
                        margin: "0 0 8px", paddingLeft: 20,
                        fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
                      }}>
                        {demo.captions.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ol>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.reflectNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyPhotoCurateDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid #5BA0C9", background: "var(--surface)",
                          color: "#5BA0C9", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "sensory-habit" && chapter.habitDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.habitDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>場景：</strong>
                        {demo.pickedScenes.map((id) =>
                          chapter.habitSceneOptions?.find((o) => o.id === id)?.label ?? id
                        ).join("、")}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>計畫：</strong>{demo.planNote}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.reflectNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyHabitDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--primary)", background: "var(--surface)",
                          color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "photo-search" && chapter.photoSearchDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.photoSearchDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#9B7AD4",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>搜尋詞：</strong>{demo.searchKeyword}
                      </p>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 8px" }}>
                        {demo.memoryNote}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.reflectNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyPhotoSearchDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid #9B7AD4", background: "var(--surface)",
                          color: "#7B5BB8", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "note-capture" && chapter.noteCaptureDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.noteCaptureDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}>
                        <strong>{demo.noteTitle}</strong>
                      </p>
                      <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 8px" }}>
                        {demo.noteContent}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.reflectNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applyNoteDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid var(--primary)", background: "var(--surface)",
                          color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "smart-flow" && chapter.smartFlowDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.smartFlowDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#5BA0C9",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>一拍：</strong>{demo.snapNote}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>二問：</strong>{demo.askQuestion}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>回答：</strong>{demo.askAnswer}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 8px" }}>
                        <strong>三記下：</strong>{demo.savedLine}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>
                        {demo.reflectNote}
                      </p>
                      <button
                        type="button"
                        onClick={() => applySmartFlowDemo(demo)}
                        style={{
                          padding: "8px 14px", borderRadius: "var(--r-pill)",
                          border: "1px solid #5BA0C9", background: "var(--surface)",
                          color: "#5BA0C9", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                        }}
                      >
                        帶入這則案例
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {layout === "city-radius" && chapter.cityRadiusDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.cityRadiusDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}><strong>角落：</strong>{demo.place}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>意義：</strong>{demo.meaning}</p>
                      <button type="button" onClick={() => applyCityRadiusDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "day-rehearsal" && chapter.dayRehearsalDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.dayRehearsalDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>從→到：</strong>{demo.fromPlace} → {demo.toPlace}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>休息：</strong>{demo.restPoint}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>備案：</strong>{demo.backup}</p>
                      <button type="button" onClick={() => applyDayRehearsalDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "moment-place" && chapter.momentPlaceDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.momentPlaceDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>活動：</strong>{demo.activity}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>節奏：</strong>{demo.departAt} → {demo.returnAt}</p>
                      <button type="button" onClick={() => applyMomentPlaceDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "pass-prep" && chapter.passPrepDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.passPrepDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>票在：</strong>{demo.ticketWhere}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>備案：</strong>{demo.backup}</p>
                      <button type="button" onClick={() => applyPassPrepDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "safe-corner" && chapter.safeCornerDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.safeCornerDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>目的地：</strong>{demo.destination}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>休息點：</strong>{demo.restSpot}</p>
                      <button type="button" onClick={() => applySafeCornerDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "activity-guide" && chapter.activityGuideDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.activityGuideDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>類型：</strong>{demo.activityType}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>時長：</strong>{demo.duration}</p>
                      <button type="button" onClick={() => applyActivityGuideDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "elegant-replan" && chapter.elegantReplanDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.elegantReplanDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>變數：</strong>{demo.trigger}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>提醒：</strong>{demo.softReminder}</p>
                      <button type="button" onClick={() => applyElegantReplanDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "three-sight" && chapter.threeSightDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.threeSightDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>看見：</strong>{demo.saw}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>帶回：</strong>{demo.bringHome}</p>
                      <button type="button" onClick={() => applyThreeSightDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "city-lights" && chapter.cityLightsDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.cityLightsDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>安排：</strong>{demo.arrange}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>留下：</strong>{demo.keep}</p>
                      <button type="button" onClick={() => applyCityLightsDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
{chapter.guideFooterNote && (
                <p style={{
                  fontSize: "var(--fs-xs)", color: "var(--ink-3)",
                  marginTop: 14, marginBottom: 0,
                }}>
                  {chapter.guideFooterNote}
                </p>
              )}
            </div>
          )}

          <SectionLabel>{chapter.continueTitle}</SectionLabel>
          {chapter.capabilityNote && (
            <div style={{
              marginBottom: 12, padding: "12px 14px", borderRadius: 12,
              background:
                chapter.practiceWhere === "phone"
                  ? "#F5EEF8"
                  : chapter.practiceWhere === "paper"
                    ? "var(--surface-warm)"
                    : "var(--primary-soft)",
              border: "1px solid var(--line)",
            }}>
              {chapter.practiceWhere && (
                <div style={{
                  fontSize: "var(--fs-xs)", fontWeight: 800,
                  color: "var(--primary-deep)", marginBottom: 4,
                }}>
                  {practiceWhereLabel(chapter.practiceWhere)}
                </div>
              )}
              <p style={{
                fontSize: "var(--fs-xs)", color: "var(--ink-2)",
                lineHeight: 1.55, margin: 0,
              }}>
                {chapter.capabilityNote}
              </p>
            </div>
          )}
          <p style={{
            fontSize: "var(--fs-sm)", color: "var(--ink-2)",
            lineHeight: 1.6, margin: "0 0 16px",
          }}>
            {chapter.continueBody}
          </p>

          {chapter.appDeepLink && (
            <button
              type="button"
              onClick={() => {
                trackEvent("chapter_app_deep_link", {
                  chapter: chapter.id,
                  href: chapter.appDeepLink!.href,
                });
                router.push(chapter.appDeepLink!.href);
              }}
              style={{
                width: "100%", padding: "14px", marginBottom: 16,
                background: "var(--surface)", border: "2px solid var(--primary)",
                borderRadius: "var(--r-pill)", fontWeight: 800,
                fontSize: "var(--fs-sm)", color: "var(--primary-deep)", cursor: "pointer",
              }}
            >
              {chapter.appDeepLink.label}
            </button>
          )}

          <div style={{
            padding: 16, borderRadius: "var(--r-lg)",
            background: "linear-gradient(135deg, #FBE6D4 0%, #FFF8EE 100%)",
            border: "2px solid var(--primary)",
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 6,
              color: "var(--primary-deep)",
            }}>
              把這句話點成光點
            </div>
            <p style={{
              fontSize: "var(--fs-xs)", color: "var(--ink-2)",
              lineHeight: 1.5, margin: "0 0 12px",
            }}>
              書教節奏；暖暖幫您留下痕跡。一拍、二問、三記下之後，可把最有用的一句話存進圓夢藍圖（需登入）。
            </p>
            <button
              type="button"
              onClick={saveAsSpark}
              style={{
                width: "100%", padding: "14px",
                background: "var(--primary)", border: "none",
                borderRadius: "var(--r-pill)", fontWeight: 800,
                fontSize: "var(--fs-sm)", color: "#fff", cursor: "pointer",
              }}
            >
              把這句話點成光點 →
            </button>
          </div>

          <div style={{
            padding: 16, borderRadius: "var(--r-lg)",
            background: "var(--surface-warm)", border: "1px dashed var(--line-strong)",
            marginBottom: 12,
          }}>
            <div style={{
              fontSize: "var(--fs-sm)", fontWeight: 800, marginBottom: 8,
            }}>
              {chapter.printCardTitle}
            </div>
            <p style={{
              fontSize: "var(--fs-xs)", color: "var(--ink-2)",
              lineHeight: 1.5, margin: "0 0 12px",
            }}>
              {chapter.printCardDescription ?? "可列印下方卡片留存。"}
            </p>
            <button
              type="button"
              onClick={printCard}
              style={{
                width: "100%", padding: "14px",
                background: "var(--surface)", border: "2px solid var(--line-strong)",
                borderRadius: "var(--r-pill)", fontWeight: 700,
                fontSize: "var(--fs-sm)", cursor: "pointer",
              }}
            >
              {chapter.printButtonLabel ?? "列印卡片"}
            </button>
          </div>

          <div style={{
            textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--ink-3)",
            padding: "8px 0 16px",
          }}>
            QR {chapter.qrCode}
            {" · "}
            {typeof window !== "undefined" ? window.location.pathname : `/smart/chapter/${chapter.id}`}
          </div>
        </SubPage>
      </div>

      <div id="chapter-print-card" style={{
        position: "absolute", left: "-9999px", top: 0,
        fontFamily: "Noto Sans TC, sans-serif",
      }}>
        <PrintCard
          chapter={chapter}
          picked={picked}
          reflectNote={reflectNote}
          layout={layout}
          keywords={keywords}
          naturalQuestion={naturalQuestion}
          backgrounds={backgrounds}
          messyTask={messyTask}
          threePoints={threePoints}
          nextStep={nextStep}
          userDecision={userDecision}
          itemLabel={itemLabel}
          aiAnswerNote={aiAnswerNote}
          trustLevel={trustLevel}
          searchKeyword={searchKeyword}
          memoryNote={memoryNote}
          noteTitle={noteTitle}
          noteContent={noteContent}
          noteTagId={noteTagId}
          snapNote={snapNote}
          askQuestion={askQuestion}
          askAnswer={askAnswer}
          savedLine={savedLine}
          menuSnippet={menuSnippet}
          dietaryNeed={dietaryNeed}
          translationSummary={translationSummary}
          confirmWithStaff={confirmWithStaff}
          productA={productA}
          productB={productB}
          threeDiffs={threeDiffs}
          verifyItem={verifyItem}
          question={question}
          aiAnswer={aiAnswer}
          insight={insight}
          dishName={dishName}
          colors={colors}
          fiberSource={fiberSource}
          feeling={feeling}
          backupDone={backupDone}
          editAction={editAction}
          compareNote={compareNote}
          theme={theme}
          captions={captions}
          pickedScenes={pickedScenes}
          planNote={planNote}
          cityPlace={cityPlace}
          cityMeaning={cityMeaning}
          fromPlace={fromPlace}
          toPlace={toPlace}
          restPoint={restPoint}
          rehearsalBackup={rehearsalBackup}
          officialCheck={officialCheck}
          momentActivity={momentActivity}
          departAt={departAt}
          arriveAt={arriveAt}
          restAt={restAt}
          returnAt={returnAt}
          ticketWhere={ticketWhere}
          openHow={openHow}
          officialSource={officialSource}
          passBackup={passBackup}
          safeDestination={safeDestination}
          routeNote={routeNote}
          restSpot={restSpot}
          cornerBackup={cornerBackup}
          activityType={activityType}
          activityDuration={activityDuration}
          restStyle={restStyle}
          transitPref={transitPref}
          companion={companion}
          replanTrigger={replanTrigger}
          planA={planA}
          planB={planB}
          softReminder={softReminder}
          sawNote={sawNote}
          feltNote={feltNote}
          bringHome={bringHome}
          lightArrange={lightArrange}
          lightVerify={lightVerify}
          lightReplan={lightReplan}
          lightKeep={lightKeep}
        />
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)",
      marginBottom: 10, letterSpacing: "0.04em",
    }}>
      {children}
    </div>
  );
}

function StepCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{
      padding: "14px 16px", marginBottom: 14,
      background: "var(--surface)", borderRadius: 12,
      border: "1px solid var(--line)",
    }}>
      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  );
}

function EntryButton({
  entry,
  selected,
  onSelect,
  onGo,
}: {
  entry: ChapterEntry;
  selected: boolean;
  onSelect: () => void;
  onGo: () => void;
}) {
  return (
    <div style={{
      borderRadius: 14,
      border: `2px solid ${selected ? "var(--primary)" : "var(--line-strong)"}`,
      background: selected ? "var(--primary-soft)" : "var(--surface)",
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: "100%", padding: "12px 10px 6px",
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28 }}>{entry.emoji}</div>
        <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginTop: 4 }}>
          {entry.label}
        </div>
        <div style={{
          fontSize: 12, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.3,
        }}>
          {selected ? "✓ 已圈選" : "點一下圈選"}
        </div>
      </button>
      <button
        type="button"
        onClick={onGo}
        style={{
          width: "100%", padding: "8px 10px 12px",
          background: "transparent", border: "none",
          borderTop: "1px solid var(--line)",
          color: "var(--primary-deep)", fontWeight: 700,
          fontSize: 14, cursor: "pointer",
        }}
      >
        開始 →
      </button>
    </div>
  );
}

function PhonePathCard({
  path,
  selected,
  onSelect,
}: {
  path: PhoneEntryPath;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left", padding: "14px 16px",
        borderRadius: 12,
        border: `2px solid ${selected ? "var(--primary)" : "var(--line-strong)"}`,
        background: selected ? "var(--primary-soft)" : "var(--surface)",
        cursor: "pointer", width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{path.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)" }}>{path.label}</div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>
            {selected ? "✓ 這是我的手機" : path.steps[0]}
          </div>
        </div>
      </div>
    </button>
  );
}

function PrintCard({
  chapter,
  picked,
  reflectNote,
  layout,
  keywords = ["", "", ""],
  naturalQuestion = "",
  backgrounds = [],
  messyTask = "",
  threePoints = ["", "", ""],
  nextStep = "",
  userDecision = "",
  itemLabel = "",
  aiAnswerNote = "",
  trustLevel = "",
  searchKeyword = "",
  memoryNote = "",
  noteTitle = "",
  noteContent = "",
  noteTagId = "",
  snapNote = "",
  askQuestion = "",
  askAnswer = "",
  savedLine = "",
  menuSnippet = "",
  dietaryNeed = "",
  translationSummary = "",
  confirmWithStaff = "",
  productA = "",
  productB = "",
  threeDiffs = ["", "", ""],
  verifyItem = "",
  question = "",
  aiAnswer = "",
  insight = "",
  dishName = "",
  colors = "",
  fiberSource = "",
  feeling = "",
  backupDone = false,
  editAction = "",
  compareNote = "",
  theme = "",
  captions = ["", "", ""],
  pickedScenes = [],
  planNote = "",
  cityPlace = "",
  cityMeaning = "",
  fromPlace = "",
  toPlace = "",
  restPoint = "",
  rehearsalBackup = "",
  officialCheck = "",
  momentActivity = "",
  departAt = "",
  arriveAt = "",
  restAt = "",
  returnAt = "",
  ticketWhere = "",
  openHow = "",
  officialSource = "",
  passBackup = "",
  safeDestination = "",
  routeNote = "",
  restSpot = "",
  cornerBackup = "",
  activityType = "",
  activityDuration = "",
  restStyle = "",
  transitPref = "",
  companion = "",
  replanTrigger = "",
  planA = "",
  planB = "",
  softReminder = "",
  sawNote = "",
  feltNote = "",
  bringHome = "",
  lightArrange = "",
  lightVerify = "",
  lightReplan = "",
  lightKeep = "",
}: {
  chapter: ChapterOpening;
  picked: string | null;
  reflectNote: string;
  layout: ChapterOpening["layout"];
  keywords?: [string, string, string];
  naturalQuestion?: string;
  backgrounds?: string[];
  messyTask?: string;
  threePoints?: [string, string, string];
  nextStep?: string;
  userDecision?: string;
  itemLabel?: string;
  aiAnswerNote?: string;
  trustLevel?: VisionTrustLevel | "";
  searchKeyword?: string;
  memoryNote?: string;
  noteTitle?: string;
  noteContent?: string;
  noteTagId?: string;
  snapNote?: string;
  askQuestion?: string;
  askAnswer?: string;
  savedLine?: string;
  menuSnippet?: string;
  dietaryNeed?: string;
  translationSummary?: string;
  confirmWithStaff?: string;
  productA?: string;
  productB?: string;
  threeDiffs?: [string, string, string];
  verifyItem?: string;
  question?: string;
  aiAnswer?: string;
  insight?: string;
  dishName?: string;
  colors?: string;
  fiberSource?: string;
  feeling?: string;
  backupDone?: boolean;
  editAction?: string;
  compareNote?: string;
  theme?: string;
  captions?: [string, string, string];
  pickedScenes?: string[];
  planNote?: string;
  cityPlace?: string;
  cityMeaning?: string;
  fromPlace?: string;
  toPlace?: string;
  restPoint?: string;
  rehearsalBackup?: string;
  officialCheck?: string;
  momentActivity?: string;
  departAt?: string;
  arriveAt?: string;
  restAt?: string;
  returnAt?: string;
  ticketWhere?: string;
  openHow?: string;
  officialSource?: string;
  passBackup?: string;
  safeDestination?: string;
  routeNote?: string;
  restSpot?: string;
  cornerBackup?: string;
  activityType?: string;
  activityDuration?: string;
  restStyle?: string;
  transitPref?: string;
  companion?: string;
  replanTrigger?: string;
  planA?: string;
  planB?: string;
  softReminder?: string;
  sawNote?: string;
  feltNote?: string;
  bringHome?: string;
  lightArrange?: string;
  lightVerify?: string;
  lightReplan?: string;
  lightKeep?: string;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bgLabels = chapter.backgroundOptions
    ?.filter((o) => backgrounds.includes(o.id))
    .map((o) => o.label)
    .join("、");

  const trustLabel =
    trustLevel === "enjoy"
      ? "可直接欣賞"
      : trustLevel === "verify"
        ? "需要查證"
        : "";

  const noteTagLabel =
    chapter.noteTagOptions?.find((t) => t.id === noteTagId)?.label ?? "";

  const habitSceneLabels = chapter.habitSceneOptions
    ?.filter((o) => pickedScenes.includes(o.id))
    .map((o) => o.label)
    .join("、");

  if (layout === "menu-translate") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="菜單摘要" minHeight={48}>
          {menuSnippet || translationSummary || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="飲食需要" minHeight={48}>
            {dietaryNeed || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="需向店家確認" minHeight={64}>
          {confirmWithStaff || reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "product-compare") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12,
        }}>
          <PrintGridCell title="商品 A" minHeight={48}>
            {productA || "＿＿＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="商品 B" minHeight={48}>
            {productB || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="三項差異" minHeight={72}>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {(threeDiffs.some(Boolean) ? threeDiffs : ["＿＿＿", "＿＿＿", "＿＿＿"]).map((p, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{p || "＿＿＿"}</li>
            ))}
          </ol>
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="待確認" minHeight={48}>
            {verifyItem || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="最影響決定的一項" minHeight={64}>
          {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "curiosity-ask") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="今天的問題" minHeight={48}>
          {question || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="新理解" minHeight={64}>
            {aiAnswer || insight || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="想繼續探索的一點" minHeight={64}>
          {reflectNote || insight || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "recipe-card") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="料理名稱" minHeight={40}>
          {dishName || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "12px 0",
        }}>
          <PrintGridCell title="主要顏色" minHeight={48}>
            {colors || "＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="纖維來源" minHeight={48}>
            {fiberSource || "＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="一句感受" minHeight={48}>
          {feeling || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="一週後想保留的小變化" minHeight={64}>
            {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "photo-edit-safe") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="已備份原檔" minHeight={40}>
          {backupDone ? "✓ 已備份" : "＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="移除項目" minHeight={48}>
            {editAction || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="前後感受比較" minHeight={64}>
          {compareNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="修改後更接近想留下的感受嗎" minHeight={64}>
            {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "photo-curate") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="策展主題" minHeight={48}>
          {theme || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="三張照片各一句說明" minHeight={96}>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(captions.some(Boolean) ? captions : ["＿＿＿", "＿＿＿", "＿＿＿"]).map((c, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{c || "＿＿＿"}</li>
              ))}
            </ol>
          </PrintGridCell>
        </div>
        <PrintGridCell title="最想保留的意義" minHeight={64}>
          {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "sensory-habit") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="選三天場景" minHeight={64}>
          {habitSceneLabels || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="溫和計畫" minHeight={64}>
            {planNote || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="最容易重新開始的場景" minHeight={64}>
          {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if ((layout as string) === "city-radius") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="城市角落" minHeight={56}>{cityPlace || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="生活意義" minHeight={56}>{cityMeaning || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "day-rehearsal") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="從 → 到" minHeight={48}>{(fromPlace || "＿＿") + " → " + (toPlace || "＿＿")}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="休息點" minHeight={40}>{restPoint || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="備案" minHeight={40}>{rehearsalBackup || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="官方確認" minHeight={40}>{officialCheck || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "moment-place") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="活動" minHeight={40}>{momentActivity || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="出門／抵達" minHeight={40}>{(departAt || "＿＿") + "／" + (arriveAt || "＿＿")}</PrintGridCell></div>
        <PrintGridCell title="休息／回程" minHeight={40}>{(restAt || "＿＿") + "／" + (returnAt || "＿＿")}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "pass-prep") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="票券位置" minHeight={40}>{ticketWhere || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="開啟方式" minHeight={40}>{openHow || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="官方來源／備案" minHeight={48}>{(officialSource || "＿＿") + "／" + (passBackup || "＿＿")}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "safe-corner") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="目的地" minHeight={40}>{safeDestination || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="路線／休息點" minHeight={48}>{(routeNote || "＿＿") + "／" + (restSpot || "＿＿")}</PrintGridCell></div>
        <PrintGridCell title="備案" minHeight={40}>{cornerBackup || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "activity-guide") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="活動類型" minHeight={40}>{activityType || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="時長／休息" minHeight={48}>{(activityDuration || "＿＿") + "／" + (restStyle || "＿＿")}</PrintGridCell></div>
        <PrintGridCell title="交通／同行" minHeight={48}>{(transitPref || "＿＿") + "／" + (companion || "＿＿")}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "elegant-replan") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="變數" minHeight={48}>{replanTrigger || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="備案 A／B" minHeight={56}>{(planA || "＿＿") + "／" + (planB || "＿＿")}</PrintGridCell></div>
        <PrintGridCell title="不硬撐提醒" minHeight={48}>{softReminder || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "three-sight") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="今天看見" minHeight={48}>{sawNote || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="今天感受" minHeight={48}>{feltNote || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="帶回生活" minHeight={48}>{bringHome || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "city-lights") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="安排" minHeight={40}>{lightArrange || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="查證" minHeight={40}>{lightVerify || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="重排" minHeight={40}>{lightReplan || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="留下" minHeight={40}>{lightKeep || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "photo-search") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="搜尋詞（有溫度的詞）" minHeight={48}>
          {searchKeyword || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="一句回憶" minHeight={72}>
            {memoryNote || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="這張照片讓我想起…" minHeight={72}>
          {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "note-capture") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="標題" minHeight={40}>
          {noteTitle || chapter.defaultNoteTitle || "＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="一句話" minHeight={64}>
            {noteContent || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
        }}>
          <PrintGridCell title="標籤" minHeight={48}>
            {noteTagLabel || "＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="送給未來的自己" minHeight={48}>
            {reflectNote || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "smart-flow") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="① 一拍" minHeight={48}>
          {snapNote || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="② 二問" minHeight={48}>
            {askQuestion || "這是什麼？請用簡單中文說明。"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="AI 回答摘要" minHeight={48}>
          {askAnswer || "＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="③ 三記下" minHeight={48}>
            {savedLine || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <PrintGridCell title="這一次我帶走了什麼" minHeight={64}>
          {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "vision-identify") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="我拍的物品" minHeight={48}>
          {itemLabel || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="AI 回答摘要" minHeight={72}>
            {aiAnswerNote || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
        }}>
          <PrintGridCell title="可直接欣賞／需要查證" minHeight={48}>
            {trustLabel || "＿＿＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="值得再查證的一點" minHeight={48}>
            {reflectNote || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        {chapter.visionSafetyTips && (
          <div style={{ marginBottom: 16, fontSize: 12, lineHeight: 1.5 }}>
            {chapter.visionSafetyTips.map((tip) => (
              <p key={tip.id} style={{ margin: "0 0 8px" }}>
                <strong>{tip.label}：</strong>{tip.items.join("、")}
              </p>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: "#666" }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "organize-decide") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="繁雜的事" minHeight={48}>
          {messyTask || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="三個重點" minHeight={72}>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(threePoints.some(Boolean) ? threePoints : ["＿＿＿", "＿＿＿", "＿＿＿"]).map((p, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{p || "＿＿＿"}</li>
              ))}
            </ol>
          </PrintGridCell>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
        }}>
          <PrintGridCell title="可先做的下一步" minHeight={64}>
            {nextStep || "＿＿＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="我真正要決定的" minHeight={64}>
            {userDecision || "＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  if (layout === "question-rewrite") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          marginBottom: 16,
        }}>
          <PrintGridCell title="① 三個關鍵字" minHeight={56}>
            {keywords.filter(Boolean).join(" · ") || "＿＿ · ＿＿ · ＿＿"}
          </PrintGridCell>
          <PrintGridCell title="② 補上的背景" minHeight={56}>
            {bgLabels || "＿＿＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="③ 自然提問（改寫後）" minHeight={80}>
            {naturalQuestion || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
          <PrintGridCell title="④ 回望" minHeight={80}>
            {reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
          </PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>
          掃碼網址：{origin}/smart/chapter/{chapter.id}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
        {chapter.printCardTitle} · QR {chapter.qrCode}
      </h1>
      {chapter.quote && (
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
      )}
      <p style={{ fontSize: 14, margin: "0 0 12px" }}>{chapter.tryPrompt}</p>
      {chapter.samplePrompt && (
        <p style={{
          fontSize: 15, fontWeight: 700, padding: 12,
          background: "#f5f5f5", borderRadius: 8, margin: "0 0 16px",
        }}>
          「{chapter.samplePrompt}」
        </p>
      )}

      {layout === "routes" && chapter.entries && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
          {chapter.entries.map((e) => (
            <li key={e.id} style={{
              fontSize: 16, marginBottom: 10,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{
                width: 22, height: 22, border: "2px solid #333",
                borderRadius: 4, display: "inline-flex",
                alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>
                {picked === e.id ? "✓" : ""}
              </span>
              {e.emoji} {e.label} — {e.hint}
            </li>
          ))}
        </ul>
      )}

      {layout === "ai-entry" && chapter.phonePaths && (
        <div style={{ marginBottom: 20 }}>
          {chapter.phonePaths.map((path) => (
            <div key={path.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                {picked === path.id ? "✓ " : ""}{path.emoji} {path.label}
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                {path.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 14, fontWeight: 700 }}>{chapter.reflectPrompt}</p>
      <p style={{
        fontSize: 14, minHeight: 48, borderBottom: "1px solid #999",
        margin: "8px 0 20px", whiteSpace: "pre-wrap",
      }}>
        {reflectNote || " "}
      </p>
      <p style={{ fontSize: 12, color: "#666" }}>
        掃碼網址：{origin}/smart/chapter/{chapter.id}
      </p>
    </div>
  );
}

function PrintGridCell({
  title,
  children,
  minHeight,
}: {
  title: string;
  children: React.ReactNode;
  minHeight: number;
}) {
  return (
    <div style={{
      border: "2px solid #333", borderRadius: 8, padding: 10,
      minHeight,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{children}</div>
    </div>
  );
}

const secondaryBtnStyle: React.CSSProperties = {
  width: "100%", padding: "14px",
  background: "var(--surface)", border: "2px solid var(--line-strong)",
  borderRadius: "var(--r-pill)", fontWeight: 700,
  fontSize: "var(--fs-sm)", cursor: "pointer",
};

const primaryOutlineBtnStyle: React.CSSProperties = {
  width: "100%", padding: "14px",
  background: "var(--primary-soft)", border: "2px solid var(--primary)",
  borderRadius: "var(--r-pill)", fontWeight: 700,
  fontSize: "var(--fs-sm)", color: "var(--primary-deep)",
  cursor: "pointer",
};
