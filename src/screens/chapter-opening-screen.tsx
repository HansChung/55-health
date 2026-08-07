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
  type DecisionStartDemo,
  type DecisionSeatDemo,
  type SourceLadderDemo,
  type ClauseTranslateDemo,
  type LifeBaselinesDemo,
  type SixHatsDemo,
  type SameScaleDemo,
  type StressTestDemo,
  type ThirdPathDemo,
  type ProConfirmDemo,
  type DecisionMemoDemo,
  type Part4StartDemo,
  type StoryStartDemo,
  type ThemeBoundaryDemo,
  type ThreeCluesDemo,
  type ThreeColorCheckDemo,
  type StoryCoreDemo,
  type VoiceDraftDemo,
  type FormBlueprintDemo,
  type CoeditTruthDemo,
  type SharedMemoryDemo,
  type HeirloomKitDemo,
  type SharePassportDemo,
  type ChapterDecisionStartDraft,
  type ChapterDecisionSeatDraft,
  type ChapterSourceLadderDraft,
  type ChapterClauseTranslateDraft,
  type ChapterLifeBaselinesDraft,
  type ChapterSixHatsDraft,
  type ChapterSameScaleDraft,
  type ChapterStressTestDraft,
  type ChapterThirdPathDraft,
  type ChapterProConfirmDraft,
  type ChapterDecisionMemoDraft,
  type ChapterPart4StartDraft,
  type ChapterStoryStartDraft,
  type ChapterThemeBoundaryDraft,
  type ChapterThreeCluesDraft,
  type ChapterThreeColorCheckDraft,
  type ChapterStoryCoreDraft,
  type ChapterVoiceDraftDraft,
  type ChapterFormBlueprintDraft,
  type ChapterCoeditTruthDraft,
  type ChapterSharedMemoryDraft,
  type ChapterHeirloomKitDraft,
  type ChapterSharePassportDraft,
  buildDecisionSeatPrompt,
  buildSixHatsPrompt,
  buildStoryCorePrompt,
  type ElevatorWishDemo,
  type LifeMatchDemo,
  type FiveReflectDemo,
  type ThreeStepsDemo,
  type MeaningSeedDemo,
  type ShareIntentDemo,
  type EmbarkDemo,
  type ChapterElevatorWishDraft,
  type ChapterLifeMatchDraft,
  type ChapterFiveReflectDraft,
  type ChapterThreeStepsDraft,
  type ChapterMeaningSeedDraft,
  type ChapterShareIntentDraft,
  type ChapterEmbarkDraft,
  type BoundaryChooseDemo,
  type PlanBDemo,
  type DualTrackDemo,
  type TasteJournalDemo,
  type ArLightDemo,
  type ChapterBoundaryChooseDraft,
  type ChapterPlanBDraft,
  type ChapterDualTrackDraft,
  type ChapterTasteJournalDraft,
  type ChapterArLightDraft,
  type VerifyFirstDemo,
  type PauseReflexDemo,
  type RockCheckDemo,
  type MuscleRecordDemo,
  type TrustListsDemo,
  type ListEntryDemo,
  type FamilyWeeklyDemo,
  type TrLightDemo,
  type ChapterVerifyFirstDraft,
  type ChapterPauseReflexDraft,
  type ChapterRockCheckDraft,
  type ChapterMuscleRecordDraft,
  type ChapterTrustListsDraft,
  type ChapterListEntryDraft,
  type ChapterFamilyWeeklyDraft,
  type ChapterTrLightDraft,
  type MindsetShiftDemo,
  type DualSignalDemo,
  type GroundSnapDemo,
  type WeekRhythmDemo,
  type KineticGuideDemo,
  type AtrLightDemo,
  type ChapterMindsetShiftDraft,
  type ChapterDualSignalDraft,
  type ChapterGroundSnapDraft,
  type ChapterWeekRhythmDraft,
  type ChapterKineticGuideDraft,
  type ChapterAtrLightDraft,
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
} from "@/lib/chapter-opening";
import {
  type ExternalAiProvider,
  externalAiSuccessMessage,
  openExternalAiPractice,
} from "@/lib/external-ai";
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
  const [dsChoice, setDsChoice] = useState("");
  const [dsLifeImpact, setDsLifeImpact] = useState("");
  const [dsWantClear, setDsWantClear] = useState("");
  const [seatSurfaceQ, setSeatSurfaceQ] = useState("");
  const [seatKnown, setSeatKnown] = useState("");
  const [seatExpect, setSeatExpect] = useState("");
  const [seatRealQ, setSeatRealQ] = useState("");
  const [seatMustKeep, setSeatMustKeep] = useState("");
  const [srcMeta, setSrcMeta] = useState("");
  const [srcLayer, setSrcLayer] = useState("");
  const [srcConfirms, setSrcConfirms] = useState("");
  const [srcCannot, setSrcCannot] = useState("");
  const [srcToCheck, setSrcToCheck] = useState("");
  const [clauseSummary, setClauseSummary] = useState("");
  const [clausePayLimit, setClausePayLimit] = useState("");
  const [clauseLifeUnknown, setClauseLifeUnknown] = useState("");
  const [baseSafety, setBaseSafety] = useState("");
  const [baseLife, setBaseLife] = useState("");
  const [baseRel, setBaseRel] = useState("");
  const [hatsToCheck, setHatsToCheck] = useState("");
  const [hatsNext, setHatsNext] = useState("");
  const [hatsReview, setHatsReview] = useState("");
  const [scaleOptions, setScaleOptions] = useState("");
  const [scaleNotes, setScaleNotes] = useState("");
  const [scaleIgnored, setScaleIgnored] = useState("");
  const [stressWorst, setStressWorst] = useState("");
  const [stressStop, setStressStop] = useState("");
  const [stressPro, setStressPro] = useState("");
  const [thirdStalemate, setThirdStalemate] = useState("");
  const [thirdKnob, setThirdKnob] = useState("");
  const [thirdPlan, setThirdPlan] = useState("");
  const [proQ1, setProQ1] = useState("");
  const [proQ2, setProQ2] = useState("");
  const [proQ3, setProQ3] = useState("");
  const [memoStatus, setMemoStatus] = useState("");
  const [memoReason, setMemoReason] = useState("");
  const [memoPending, setMemoPending] = useState("");
  const [p4Want, setP4Want] = useState("");
  const [p4Meaning, setP4Meaning] = useState("");
  const [p4Who, setP4Who] = useState("");
  const [p4Distance, setP4Distance] = useState("");
  const [ssLeave, setSsLeave] = useState("");
  const [ssHope, setSsHope] = useState("");
  const [ssStatus, setSsStatus] = useState("");
  const [tbKeep, setTbKeep] = useState("");
  const [tbPrivate, setTbPrivate] = useState("");
  const [tbNotTouch, setTbNotTouch] = useState("");
  const [tbStart, setTbStart] = useState("");
  const [tc1, setTc1] = useState("");
  const [tc2, setTc2] = useState("");
  const [tc3, setTc3] = useState("");
  const [tcolRed, setTcolRed] = useState("");
  const [tcolYellow, setTcolYellow] = useState("");
  const [tcolGreen, setTcolGreen] = useState("");
  const [scFaced, setScFaced] = useState("");
  const [scChose, setScChose] = useState("");
  const [scLeave, setScLeave] = useState("");
  const [vdStart, setVdStart] = useState("");
  const [vdChange, setVdChange] = useState("");
  const [vdWords, setVdWords] = useState("");
  const [fbForm, setFbForm] = useState("");
  const [fbMaterials, setFbMaterials] = useState("");
  const [fbMin, setFbMin] = useState("");
  const [ceRed, setCeRed] = useState("");
  const [ceYellow, setCeYellow] = useState("");
  const [ceGreen, setCeGreen] = useState("");
  const [smWho, setSmWho] = useState("");
  const [smPresent, setSmPresent] = useState("");
  const [smAdjust, setSmAdjust] = useState("");
  const [hkCheck, setHkCheck] = useState("");
  const [hkOpen, setHkOpen] = useState("");
  const [hkCheer, setHkCheer] = useState("");
  const [spStatus, setSpStatus] = useState("");
  const [spIntent, setSpIntent] = useState("");
  const [spWithdraw, setSpWithdraw] = useState("");
  const [wishWant, setWishWant] = useState("");
  const [wishStuck, setWishStuck] = useState("");
  const [wishAiHelp, setWishAiHelp] = useState("");
  const [lifePainPoint, setLifePainPoint] = useState("");
  const [lifeRoleId, setLifeRoleId] = useState("");
  const [fiveStatuses, setFiveStatuses] = useState<Record<string, string>>({});
  const [fiveNextStep, setFiveNextStep] = useState("");
  const [lifeTask, setLifeTask] = useState("");
  const [lifeSteps, setLifeSteps] = useState<[string, string, string]>(["", "", ""]);
  const [seedMaterial, setSeedMaterial] = useState("");
  const [seedForm, setSeedForm] = useState("");
  const [seedBecause, setSeedBecause] = useState("");
  const [shareWhat, setShareWhat] = useState("");
  const [shareForWhom, setShareForWhom] = useState("");
  const [sharePrivacy, setSharePrivacy] = useState("");
  const [embarkDirection, setEmbarkDirection] = useState("");
  const [embarkFirstStep, setEmbarkFirstStep] = useState("");
  const [embarkAiHelp, setEmbarkAiHelp] = useState("");
  const [cannotLine, setCannotLine] = useState("");
  const [canChooseLine, setCanChooseLine] = useState("");
  const [planScene, setPlanScene] = useState("");
  const [planBoundary, setPlanBoundary] = useState("");
  const [planReturn, setPlanReturn] = useState("");
  const [bodyTrack, setBodyTrack] = useState("");
  const [soulTrack, setSoulTrack] = useState("");
  const [journalLines, setJournalLines] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [keepPractice, setKeepPractice] = useState("");
  const [agencyAction, setAgencyAction] = useState("");
  const [resilienceAction, setResilienceAction] = useState("");
  const [firstAction, setFirstAction] = useState("");
  const [thenAction, setThenAction] = useState("");
  const [rockScenario, setRockScenario] = useState("");
  const [rockFlags, setRockFlags] = useState<[string, string, string]>(["", "", ""]);
  const [rockSafeAction, setRockSafeAction] = useState("");
  const [scamPattern, setScamPattern] = useState("");
  const [muscleSafeAction, setMuscleSafeAction] = useState("");
  const [blackSummary, setBlackSummary] = useState("");
  const [whiteSummary, setWhiteSummary] = useState("");
  const [entryType, setEntryType] = useState("");
  const [entryFeatures, setEntryFeatures] = useState("");
  const [entrySafeAction, setEntrySafeAction] = useState("");
  const [familyLines, setFamilyLines] = useState<[string, string, string]>(["", "", ""]);
  const [trustAction, setTrustAction] = useState("");
  const [trResilienceAction, setTrResilienceAction] = useState("");
  const [pressurePhrase, setPressurePhrase] = useState("");
  const [carePhrase, setCarePhrase] = useState("");
  const [feelingSignal, setFeelingSignal] = useState("");
  const [dataSignal, setDataSignal] = useState("");
  const [snapSource, setSnapSource] = useState("");
  const [softReminder, setSoftReminder] = useState("");
  const [rhythmLines, setRhythmLines] = useState<[string, string, string]>(["", "", ""]);
  const [guideGoal, setGuideGoal] = useState("");
  const [guidePrefer, setGuidePrefer] = useState("");
  const [guideAvoid, setGuideAvoid] = useState("");
  const [guideBoundary, setGuideBoundary] = useState("");
  const [autonomyAction, setAutonomyAction] = useState("");
  const [atrTrustAction, setAtrTrustAction] = useState("");
  const [atrResilienceAction, setAtrResilienceAction] = useState("");
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
  const [replanSoftReminder, setReplanSoftReminder] = useState("");
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
      if (layoutKeyLoad === "decision-start") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterDecisionStartDraft;
          if (d.choice) setDsChoice(d.choice);
          if (d.lifeImpact) setDsLifeImpact(d.lifeImpact);
          if (d.wantClear) setDsWantClear(d.wantClear);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "decision-seat") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterDecisionSeatDraft;
          if (d.surfaceQ) setSeatSurfaceQ(d.surfaceQ);
          if (d.knownUnknown) setSeatKnown(d.knownUnknown);
          if (d.expectWorry) setSeatExpect(d.expectWorry);
          if (d.realQ) setSeatRealQ(d.realQ);
          if (d.mustKeep) setSeatMustKeep(d.mustKeep);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "source-ladder") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSourceLadderDraft;
          if (d.sourceMeta) setSrcMeta(d.sourceMeta);
          if (d.layer) setSrcLayer(d.layer);
          if (d.confirms) setSrcConfirms(d.confirms);
          if (d.cannotProve) setSrcCannot(d.cannotProve);
          if (d.toCheck) setSrcToCheck(d.toCheck);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "clause-translate") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterClauseTranslateDraft;
          if (d.clauseSummary) setClauseSummary(d.clauseSummary);
          if (d.payLimit) setClausePayLimit(d.payLimit);
          if (d.lifeUnknown) setClauseLifeUnknown(d.lifeUnknown);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "life-baselines") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterLifeBaselinesDraft;
          if (d.safety) setBaseSafety(d.safety);
          if (d.life) setBaseLife(d.life);
          if (d.relationship) setBaseRel(d.relationship);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "six-hats") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSixHatsDraft;
          if (d.toCheck) setHatsToCheck(d.toCheck);
          if (d.nextStep) setHatsNext(d.nextStep);
          if (d.reviewDate) setHatsReview(d.reviewDate);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "same-scale") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSameScaleDraft;
          if (d.optionsNote) setScaleOptions(d.optionsNote);
          if (d.scalesNote) setScaleNotes(d.scalesNote);
          if (d.ignoredCost) setScaleIgnored(d.ignoredCost);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "stress-test") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterStressTestDraft;
          if (d.worstCase) setStressWorst(d.worstCase);
          if (d.stopSignal) setStressStop(d.stopSignal);
          if (d.proCheck) setStressPro(d.proCheck);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "third-path") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThirdPathDraft;
          if (d.stalemate) setThirdStalemate(d.stalemate);
          if (d.knob) setThirdKnob(d.knob);
          if (d.newPlan) setThirdPlan(d.newPlan);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "pro-confirm") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterProConfirmDraft;
          if (d.q1) setProQ1(d.q1);
          if (d.q2) setProQ2(d.q2);
          if (d.q3) setProQ3(d.q3);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "decision-memo") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterDecisionMemoDraft;
          if (d.status) setMemoStatus(d.status);
          if (d.reasonBaseline) setMemoReason(d.reasonBaseline);
          if (d.pendingReview) setMemoPending(d.pendingReview);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "part4-start") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPart4StartDraft;
          if (d.wantComplete) setP4Want(d.wantComplete);
          if (d.lifeMeaning) setP4Meaning(d.lifeMeaning);
          if (d.shareWho) setP4Who(d.shareWho);
          if (d.shareDistance) setP4Distance(d.shareDistance);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "story-start") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterStoryStartDraft;
          if (d.leaveWhat) setSsLeave(d.leaveWhat);
          if (d.hopeFeel) setSsHope(d.hopeFeel);
          if (d.saveStatus) setSsStatus(d.saveStatus);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "theme-boundary") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThemeBoundaryDraft;
          if (d.wantKeep) setTbKeep(d.wantKeep);
          if (d.privateOnly) setTbPrivate(d.privateOnly);
          if (d.notTouch) setTbNotTouch(d.notTouch);
          if (d.startToday) setTbStart(d.startToday);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "three-clues") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThreeCluesDraft;
          if (d.clue1) setTc1(d.clue1);
          if (d.clue2) setTc2(d.clue2);
          if (d.clue3) setTc3(d.clue3);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "three-color-check") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThreeColorCheckDraft;
          if (d.redMark) setTcolRed(d.redMark);
          if (d.yellowMark) setTcolYellow(d.yellowMark);
          if (d.greenMark) setTcolGreen(d.greenMark);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "story-core") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterStoryCoreDraft;
          if (d.faced) setScFaced(d.faced);
          if (d.chose) setScChose(d.chose);
          if (d.leaveToday) setScLeave(d.leaveToday);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "voice-draft") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterVoiceDraftDraft;
          if (d.startHow) setVdStart(d.startHow);
          if (d.changeMoment) setVdChange(d.changeMoment);
          if (d.voiceWords) setVdWords(d.voiceWords);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "form-blueprint") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterFormBlueprintDraft;
          if (d.formAudience) setFbForm(d.formAudience);
          if (d.materials) setFbMaterials(d.materials);
          if (d.minDone) setFbMin(d.minDone);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "coedit-truth") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterCoeditTruthDraft;
          if (d.checkRed) setCeRed(d.checkRed);
          if (d.askYellow) setCeYellow(d.askYellow);
          if (d.keepGreen) setCeGreen(d.keepGreen);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "shared-memory") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSharedMemoryDraft;
          if (d.whoSee) setSmWho(d.whoSee);
          if (d.presentHow) setSmPresent(d.presentHow);
          if (d.adjustHow) setSmAdjust(d.adjustHow);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "heirloom-kit") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterHeirloomKitDraft;
          if (d.kitCheck) setHkCheck(d.kitCheck);
          if (d.openTest) setHkOpen(d.openTest);
          if (d.cheer) setHkCheer(d.cheer);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layoutKeyLoad === "share-passport") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterSharePassportDraft;
          if (d.status) setSpStatus(d.status);
          if (d.intent) setSpIntent(d.intent);
          if (d.withdraw) setSpWithdraw(d.withdraw);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "elevator-wish") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterElevatorWishDraft;
          if (d.want) setWishWant(d.want);
          if (d.stuck) setWishStuck(d.stuck);
          if (d.aiHelp) setWishAiHelp(d.aiHelp);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "life-match") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterLifeMatchDraft;
          if (d.painPoint) setLifePainPoint(d.painPoint);
          if (d.roleId) setLifeRoleId(d.roleId);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "five-reflect") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterFiveReflectDraft;
          if (d.focusId) setPicked(d.focusId);
          if (d.statuses) setFiveStatuses(d.statuses);
          if (d.nextStep) setFiveNextStep(d.nextStep);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "three-steps") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThreeStepsDraft;
          if (d.task) setLifeTask(d.task);
          if (d.steps) setLifeSteps(d.steps);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "meaning-seed") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterMeaningSeedDraft;
          if (d.material) setSeedMaterial(d.material);
          if (d.formHint) setSeedForm(d.formHint);
          if (d.because) setSeedBecause(d.because);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "share-intent") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterShareIntentDraft;
          if (d.shareWhat) setShareWhat(d.shareWhat);
          if (d.forWhom) setShareForWhom(d.forWhom);
          if (d.privacyNote) setSharePrivacy(d.privacyNote);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "embark-card") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterEmbarkDraft;
          if (d.direction) setEmbarkDirection(d.direction);
          if (d.firstStep) setEmbarkFirstStep(d.firstStep);
          if (d.aiHelp) setEmbarkAiHelp(d.aiHelp);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "boundary-choose") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterBoundaryChooseDraft;
          if (d.cannotLine) setCannotLine(d.cannotLine);
          if (d.canChooseLine) setCanChooseLine(d.canChooseLine);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "plan-b") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPlanBDraft;
          if (d.scene) setPlanScene(d.scene);
          if (d.boundary) setPlanBoundary(d.boundary);
          if (d.returnAction) setPlanReturn(d.returnAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "dual-track") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterDualTrackDraft;
          if (d.bodyTrack) setBodyTrack(d.bodyTrack);
          if (d.soulTrack) setSoulTrack(d.soulTrack);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "taste-journal") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterTasteJournalDraft;
          if (d.lines) setJournalLines(d.lines);
          if (d.keepPractice) setKeepPractice(d.keepPractice);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "ar-light") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterArLightDraft;
          if (d.agencyAction) setAgencyAction(d.agencyAction);
          if (d.resilienceAction) setResilienceAction(d.resilienceAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "verify-first") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterVerifyFirstDraft;
          if (d.firstAction) setFirstAction(d.firstAction);
          if (d.thenAction) setThenAction(d.thenAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "pause-reflex") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterPauseReflexDraft;
          if (d.focusId) setPicked(d.focusId);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "rock-check") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterRockCheckDraft;
          if (d.scenario) setRockScenario(d.scenario);
          if (d.flags) setRockFlags(d.flags);
          if (d.safeAction) setRockSafeAction(d.safeAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "muscle-record") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterMuscleRecordDraft;
          if (d.scamPattern) setScamPattern(d.scamPattern);
          if (d.safeAction) setMuscleSafeAction(d.safeAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "trust-lists") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterTrustListsDraft;
          if (d.blackSummary) setBlackSummary(d.blackSummary);
          if (d.whiteSummary) setWhiteSummary(d.whiteSummary);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "list-entry") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterListEntryDraft;
          if (d.entryType) setEntryType(d.entryType);
          if (d.features) setEntryFeatures(d.features);
          if (d.safeAction) setEntrySafeAction(d.safeAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "family-weekly") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterFamilyWeeklyDraft;
          if (d.lines) setFamilyLines(d.lines);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "tr-light") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterTrLightDraft;
          if (d.trustAction) setTrustAction(d.trustAction);
          if (d.resilienceAction) setTrResilienceAction(d.resilienceAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "mindset-shift") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterMindsetShiftDraft;
          if (d.pressurePhrase) setPressurePhrase(d.pressurePhrase);
          if (d.carePhrase) setCarePhrase(d.carePhrase);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "dual-signal") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterDualSignalDraft;
          if (d.feelingSignal) setFeelingSignal(d.feelingSignal);
          if (d.dataSignal) setDataSignal(d.dataSignal);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "ground-snap") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterGroundSnapDraft;
          if (d.snapSource) setSnapSource(d.snapSource);
          if (d.softReminder) setSoftReminder(d.softReminder);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "week-rhythm") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterWeekRhythmDraft;
          if (d.lines) setRhythmLines(d.lines);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "kinetic-guide") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterKineticGuideDraft;
          if (d.goal) setGuideGoal(d.goal);
          if (d.prefer) setGuidePrefer(d.prefer);
          if (d.avoid) setGuideAvoid(d.avoid);
          if (d.boundary) setGuideBoundary(d.boundary);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "atr-light") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterAtrLightDraft;
          if (d.autonomyAction) setAutonomyAction(d.autonomyAction);
          if (d.trustAction) setAtrTrustAction(d.trustAction);
          if (d.resilienceAction) setAtrResilienceAction(d.resilienceAction);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "city-radius") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterCityRadiusDraft;
          if (d.place) setCityPlace(d.place);
          if (d.meaning) setCityMeaning(d.meaning);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "day-rehearsal") {
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
      if (layout === "moment-place") {
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
      if (layout === "pass-prep") {
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
      if (layout === "safe-corner") {
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
      if (layout === "activity-guide") {
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
      if (layout === "elegant-replan") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterElegantReplanDraft;
          if (d.trigger) setReplanTrigger(d.trigger);
          if (d.planA) setPlanA(d.planA);
          if (d.planB) setPlanB(d.planB);
          if (d.softReminder) setReplanSoftReminder(d.softReminder);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "three-sight") {
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const d = JSON.parse(draftRaw) as ChapterThreeSightDraft;
          if (d.saw) setSawNote(d.saw);
          if (d.felt) setFeltNote(d.felt);
          if (d.bringHome) setBringHome(d.bringHome);
          if (d.reflectNote) setReflectNote(d.reflectNote);
        }
      }
      if (layout === "city-lights") {
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
    } catch {

      /* ignore */
    }
  }, [pickKey, draftKey, layout, chapter.defaultNoteTitle]);

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
        ChapterDecisionStartDraft &
        ChapterDecisionSeatDraft &
        ChapterSourceLadderDraft &
        ChapterClauseTranslateDraft &
        ChapterLifeBaselinesDraft &
        ChapterSixHatsDraft &
        ChapterSameScaleDraft &
        ChapterStressTestDraft &
        ChapterThirdPathDraft &
        ChapterProConfirmDraft &
        ChapterDecisionMemoDraft &
        ChapterPart4StartDraft &
        ChapterStoryStartDraft &
        ChapterThemeBoundaryDraft &
        ChapterThreeCluesDraft &
        ChapterThreeColorCheckDraft &
        ChapterStoryCoreDraft &
        ChapterVoiceDraftDraft &
        ChapterFormBlueprintDraft &
        ChapterCoeditTruthDraft &
        ChapterSharedMemoryDraft &
        ChapterHeirloomKitDraft &
        ChapterSharePassportDraft &
        ChapterElevatorWishDraft &
        ChapterLifeMatchDraft &
        ChapterFiveReflectDraft &
        ChapterThreeStepsDraft &
        ChapterMeaningSeedDraft &
        ChapterShareIntentDraft &
        ChapterEmbarkDraft &
        ChapterBoundaryChooseDraft &
        ChapterPlanBDraft &
        ChapterDualTrackDraft &
        ChapterTasteJournalDraft &
        ChapterArLightDraft &
        ChapterVerifyFirstDraft &
        ChapterPauseReflexDraft &
        ChapterRockCheckDraft &
        ChapterMuscleRecordDraft &
        ChapterTrustListsDraft &
        ChapterListEntryDraft &
        ChapterFamilyWeeklyDraft &
        ChapterTrLightDraft &
        ChapterMindsetShiftDraft &
        ChapterDualSignalDraft &
        ChapterGroundSnapDraft &
        ChapterWeekRhythmDraft &
        ChapterKineticGuideDraft &
        ChapterAtrLightDraft &
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
    if (layoutKey === "decision-start") {
      const next: ChapterDecisionStartDraft = {
        choice: patch.choice ?? dsChoice,
        lifeImpact: patch.lifeImpact ?? dsLifeImpact,
        wantClear: patch.wantClear ?? dsWantClear,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "decision-seat") {
      const next: ChapterDecisionSeatDraft = {
        surfaceQ: patch.surfaceQ ?? seatSurfaceQ,
        knownUnknown: patch.knownUnknown ?? seatKnown,
        expectWorry: patch.expectWorry ?? seatExpect,
        realQ: patch.realQ ?? seatRealQ,
        mustKeep: patch.mustKeep ?? seatMustKeep,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "source-ladder") {
      const next: ChapterSourceLadderDraft = {
        sourceMeta: patch.sourceMeta ?? srcMeta,
        layer: patch.layer ?? srcLayer,
        confirms: patch.confirms ?? srcConfirms,
        cannotProve: patch.cannotProve ?? srcCannot,
        toCheck: patch.toCheck ?? srcToCheck,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "clause-translate") {
      const next: ChapterClauseTranslateDraft = {
        clauseSummary: patch.clauseSummary ?? clauseSummary,
        payLimit: patch.payLimit ?? clausePayLimit,
        lifeUnknown: patch.lifeUnknown ?? clauseLifeUnknown,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "life-baselines") {
      const next: ChapterLifeBaselinesDraft = {
        safety: patch.safety ?? baseSafety,
        life: patch.life ?? baseLife,
        relationship: patch.relationship ?? baseRel,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "six-hats") {
      const next: ChapterSixHatsDraft = {
        toCheck: patch.toCheck ?? hatsToCheck,
        nextStep: patch.nextStep ?? hatsNext,
        reviewDate: patch.reviewDate ?? hatsReview,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "same-scale") {
      const next: ChapterSameScaleDraft = {
        optionsNote: patch.optionsNote ?? scaleOptions,
        scalesNote: patch.scalesNote ?? scaleNotes,
        ignoredCost: patch.ignoredCost ?? scaleIgnored,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "stress-test") {
      const next: ChapterStressTestDraft = {
        worstCase: patch.worstCase ?? stressWorst,
        stopSignal: patch.stopSignal ?? stressStop,
        proCheck: patch.proCheck ?? stressPro,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "third-path") {
      const next: ChapterThirdPathDraft = {
        stalemate: patch.stalemate ?? thirdStalemate,
        knob: patch.knob ?? thirdKnob,
        newPlan: patch.newPlan ?? thirdPlan,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "pro-confirm") {
      const next: ChapterProConfirmDraft = {
        q1: patch.q1 ?? proQ1,
        q2: patch.q2 ?? proQ2,
        q3: patch.q3 ?? proQ3,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "decision-memo") {
      const next: ChapterDecisionMemoDraft = {
        status: patch.status ?? memoStatus,
        reasonBaseline: patch.reasonBaseline ?? memoReason,
        pendingReview: patch.pendingReview ?? memoPending,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "part4-start") {
      const next: ChapterPart4StartDraft = {
        wantComplete: patch.wantComplete ?? p4Want,
        lifeMeaning: patch.lifeMeaning ?? p4Meaning,
        shareWho: patch.shareWho ?? p4Who,
        shareDistance: patch.shareDistance ?? p4Distance,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "story-start") {
      const next: ChapterStoryStartDraft = {
        leaveWhat: patch.leaveWhat ?? ssLeave,
        hopeFeel: patch.hopeFeel ?? ssHope,
        saveStatus: patch.saveStatus ?? ssStatus,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "theme-boundary") {
      const next: ChapterThemeBoundaryDraft = {
        wantKeep: patch.wantKeep ?? tbKeep,
        privateOnly: patch.privateOnly ?? tbPrivate,
        notTouch: patch.notTouch ?? tbNotTouch,
        startToday: patch.startToday ?? tbStart,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "three-clues") {
      const next: ChapterThreeCluesDraft = {
        clue1: patch.clue1 ?? tc1,
        clue2: patch.clue2 ?? tc2,
        clue3: patch.clue3 ?? tc3,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "three-color-check") {
      const next: ChapterThreeColorCheckDraft = {
        redMark: patch.redMark ?? tcolRed,
        yellowMark: patch.yellowMark ?? tcolYellow,
        greenMark: patch.greenMark ?? tcolGreen,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "story-core") {
      const next: ChapterStoryCoreDraft = {
        faced: patch.faced ?? scFaced,
        chose: patch.chose ?? scChose,
        leaveToday: patch.leaveToday ?? scLeave,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "voice-draft") {
      const next: ChapterVoiceDraftDraft = {
        startHow: patch.startHow ?? vdStart,
        changeMoment: patch.changeMoment ?? vdChange,
        voiceWords: patch.voiceWords ?? vdWords,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "form-blueprint") {
      const next: ChapterFormBlueprintDraft = {
        formAudience: patch.formAudience ?? fbForm,
        materials: patch.materials ?? fbMaterials,
        minDone: patch.minDone ?? fbMin,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "coedit-truth") {
      const next: ChapterCoeditTruthDraft = {
        checkRed: patch.checkRed ?? ceRed,
        askYellow: patch.askYellow ?? ceYellow,
        keepGreen: patch.keepGreen ?? ceGreen,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "shared-memory") {
      const next: ChapterSharedMemoryDraft = {
        whoSee: patch.whoSee ?? smWho,
        presentHow: patch.presentHow ?? smPresent,
        adjustHow: patch.adjustHow ?? smAdjust,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "heirloom-kit") {
      const next: ChapterHeirloomKitDraft = {
        kitCheck: patch.kitCheck ?? hkCheck,
        openTest: patch.openTest ?? hkOpen,
        cheer: patch.cheer ?? hkCheer,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layoutKey === "share-passport") {
      const next: ChapterSharePassportDraft = {
        status: patch.status ?? spStatus,
        intent: patch.intent ?? spIntent,
        withdraw: patch.withdraw ?? spWithdraw,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "elevator-wish") {
      const next: ChapterElevatorWishDraft = {
        want: patch.want ?? wishWant,
        stuck: patch.stuck ?? wishStuck,
        aiHelp: patch.aiHelp ?? wishAiHelp,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "life-match") {
      const next: ChapterLifeMatchDraft = {
        painPoint: patch.painPoint ?? lifePainPoint,
        roleId: patch.roleId ?? lifeRoleId,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "five-reflect") {
      const next: ChapterFiveReflectDraft = {
        focusId: patch.focusId ?? picked ?? "",
        statuses: patch.statuses ?? fiveStatuses,
        nextStep: patch.nextStep ?? fiveNextStep,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "three-steps") {
      const next: ChapterThreeStepsDraft = {
        task: patch.task ?? lifeTask,
        steps: patch.steps ?? lifeSteps,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "meaning-seed") {
      const next: ChapterMeaningSeedDraft = {
        material: patch.material ?? seedMaterial,
        formHint: patch.formHint ?? seedForm,
        because: patch.because ?? seedBecause,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "share-intent") {
      const next: ChapterShareIntentDraft = {
        shareWhat: patch.shareWhat ?? shareWhat,
        forWhom: patch.forWhom ?? shareForWhom,
        privacyNote: patch.privacyNote ?? sharePrivacy,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "embark-card") {
      const next: ChapterEmbarkDraft = {
        direction: patch.direction ?? embarkDirection,
        firstStep: patch.firstStep ?? embarkFirstStep,
        aiHelp: patch.aiHelp ?? embarkAiHelp,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "boundary-choose") {
      const next: ChapterBoundaryChooseDraft = {
        cannotLine: patch.cannotLine ?? cannotLine,
        canChooseLine: patch.canChooseLine ?? canChooseLine,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "plan-b") {
      const next: ChapterPlanBDraft = {
        scene: patch.scene ?? planScene,
        boundary: patch.boundary ?? planBoundary,
        returnAction: patch.returnAction ?? planReturn,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "dual-track") {
      const next: ChapterDualTrackDraft = {
        bodyTrack: patch.bodyTrack ?? bodyTrack,
        soulTrack: patch.soulTrack ?? soulTrack,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "taste-journal") {
      const next: ChapterTasteJournalDraft = {
        lines: patch.lines ?? journalLines,
        keepPractice: patch.keepPractice ?? keepPractice,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "ar-light") {
      const next: ChapterArLightDraft = {
        agencyAction: patch.agencyAction ?? agencyAction,
        resilienceAction: patch.resilienceAction ?? resilienceAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "verify-first") {
      const next: ChapterVerifyFirstDraft = {
        firstAction: patch.firstAction ?? firstAction,
        thenAction: patch.thenAction ?? thenAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "pause-reflex") {
      const next: ChapterPauseReflexDraft = {
        focusId: patch.focusId ?? picked ?? "",
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "rock-check") {
      const next: ChapterRockCheckDraft = {
        scenario: patch.scenario ?? rockScenario,
        flags: patch.flags ?? rockFlags,
        safeAction: patch.safeAction ?? rockSafeAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "muscle-record") {
      const next: ChapterMuscleRecordDraft = {
        scamPattern: patch.scamPattern ?? scamPattern,
        safeAction: patch.safeAction ?? muscleSafeAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "trust-lists") {
      const next: ChapterTrustListsDraft = {
        blackSummary: patch.blackSummary ?? blackSummary,
        whiteSummary: patch.whiteSummary ?? whiteSummary,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "list-entry") {
      const next: ChapterListEntryDraft = {
        entryType: patch.entryType ?? entryType,
        features: patch.features ?? entryFeatures,
        safeAction: patch.safeAction ?? entrySafeAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "family-weekly") {
      const next: ChapterFamilyWeeklyDraft = {
        lines: patch.lines ?? familyLines,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "tr-light") {
      const next: ChapterTrLightDraft = {
        trustAction: patch.trustAction ?? trustAction,
        resilienceAction: patch.resilienceAction ?? trResilienceAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "mindset-shift") {
      const next: ChapterMindsetShiftDraft = {
        pressurePhrase: patch.pressurePhrase ?? pressurePhrase,
        carePhrase: patch.carePhrase ?? carePhrase,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "dual-signal") {
      const next: ChapterDualSignalDraft = {
        feelingSignal: patch.feelingSignal ?? feelingSignal,
        dataSignal: patch.dataSignal ?? dataSignal,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "ground-snap") {
      const next: ChapterGroundSnapDraft = {
        snapSource: patch.snapSource ?? snapSource,
        softReminder: patch.softReminder ?? softReminder,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "week-rhythm") {
      const next: ChapterWeekRhythmDraft = {
        lines: patch.lines ?? rhythmLines,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "kinetic-guide") {
      const next: ChapterKineticGuideDraft = {
        goal: patch.goal ?? guideGoal,
        prefer: patch.prefer ?? guidePrefer,
        avoid: patch.avoid ?? guideAvoid,
        boundary: patch.boundary ?? guideBoundary,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "atr-light") {
      const next: ChapterAtrLightDraft = {
        autonomyAction: patch.autonomyAction ?? autonomyAction,
        trustAction: patch.trustAction ?? atrTrustAction,
        resilienceAction: patch.resilienceAction ?? atrResilienceAction,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "city-radius") {
      const next: ChapterCityRadiusDraft = {
        place: patch.place ?? cityPlace,
        meaning: patch.meaning ?? cityMeaning,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "day-rehearsal") {
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
    if (layout === "moment-place") {
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
    if (layout === "pass-prep") {
      const next: ChapterPassPrepDraft = {
        ticketWhere: patch.ticketWhere ?? ticketWhere,
        openHow: patch.openHow ?? openHow,
        officialSource: patch.officialSource ?? officialSource,
        backup: patch.backup ?? passBackup,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "safe-corner") {
      const next: ChapterSafeCornerDraft = {
        destination: patch.destination ?? safeDestination,
        routeNote: patch.routeNote ?? routeNote,
        restSpot: patch.restSpot ?? restSpot,
        backup: patch.backup ?? cornerBackup,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "activity-guide") {
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
    if (layout === "elegant-replan") {
      const next: ChapterElegantReplanDraft = {
        trigger: patch.trigger ?? replanTrigger,
        planA: patch.planA ?? planA,
        planB: patch.planB ?? planB,
        softReminder: patch.softReminder ?? replanSoftReminder,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "three-sight") {
      const next: ChapterThreeSightDraft = {
        saw: patch.saw ?? sawNote,
        felt: patch.felt ?? feltNote,
        bringHome: patch.bringHome ?? bringHome,
        reflectNote: patch.reflectNote ?? reflectNote,
      };
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    if (layout === "city-lights") {
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

  const tryExternalAi = async (provider: ExternalAiProvider, prompt: string, emptyHint: string) => {
    const result = await openExternalAiPractice(provider, prompt);
    if (!result.ok) {
      if (result.reason === "empty") {
        toast.info(emptyHint);
        return;
      }
      toast.info("無法自動開啟分頁，範例已盡量複製——請手動開啟 Gemini 或 ChatGPT 後貼上。");
      return;
    }
    trackEvent("chapter_external_ai_try", {
      chapter: chapter.id,
      provider,
      copied: result.copied,
    });
    toast.success(externalAiSuccessMessage(provider, result.copied));
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
      case "decision-start":
        action = dsChoice.trim() || dsWantClear.trim();
        break;
      case "decision-seat":
        action = seatRealQ.trim() || seatMustKeep.trim() || seatSurfaceQ.trim();
        break;
      case "source-ladder":
        action = srcMeta.trim() || srcToCheck.trim();
        break;
      case "clause-translate":
        action = clauseSummary.trim() || clausePayLimit.trim();
        break;
      case "life-baselines":
        action = [baseSafety, baseLife, baseRel].filter(Boolean).join("｜");
        break;
      case "six-hats":
        action = [hatsToCheck, hatsNext, hatsReview].filter(Boolean).join("｜");
        break;
      case "same-scale":
        action = scaleIgnored.trim() || scaleOptions.trim();
        break;
      case "stress-test":
        action = stressStop.trim() || stressWorst.trim();
        break;
      case "third-path":
        action = thirdPlan.trim() || thirdKnob.trim();
        break;
      case "pro-confirm":
        action = [proQ1, proQ2, proQ3].filter(Boolean).join("；");
        break;
      case "decision-memo":
        action = [memoStatus, memoReason, memoPending].filter(Boolean).join("｜");
        break;
      case "part4-start":
        action = [p4Want, p4Meaning, p4Who, p4Distance].filter(Boolean).join("｜");
        break;
      case "story-start":
        action = [ssLeave, ssHope, ssStatus].filter(Boolean).join("｜");
        break;
      case "theme-boundary":
        action = [tbKeep, tbPrivate, tbNotTouch, tbStart].filter(Boolean).join("｜");
        break;
      case "three-clues":
        action = [tc1, tc2, tc3].filter(Boolean).join("｜");
        break;
      case "three-color-check":
        action = [tcolRed, tcolYellow, tcolGreen].filter(Boolean).join("｜");
        break;
      case "story-core":
        action = [scFaced, scChose, scLeave].filter(Boolean).join("｜");
        break;
      case "voice-draft":
        action = [vdStart, vdChange, vdWords].filter(Boolean).join("｜");
        break;
      case "form-blueprint":
        action = [fbForm, fbMaterials, fbMin].filter(Boolean).join("｜");
        break;
      case "coedit-truth":
        action = [ceRed, ceYellow, ceGreen].filter(Boolean).join("｜");
        break;
      case "shared-memory":
        action = [smWho, smPresent, smAdjust].filter(Boolean).join("｜");
        break;
      case "heirloom-kit":
        action = [hkCheck, hkOpen, hkCheer].filter(Boolean).join("｜");
        break;
      case "share-passport":
        action = [spStatus, spIntent, spWithdraw].filter(Boolean).join("｜");
        break;
      case "elevator-wish":
        action =
          [wishWant, wishStuck, wishAiHelp].filter(Boolean).join("｜") ||
          wishWant.trim();
        break;
      case "life-match":
        action =
          lifePainPoint.trim() ||
          (lifeRoleId
            ? `需要：${chapter.lifeRoleOptions?.find((r) => r.id === lifeRoleId)?.label ?? lifeRoleId}`
            : "");
        break;
      case "five-reflect": {
        const focusLabel =
          chapter.smartDirections?.find((d) => d.id === picked)?.label ?? picked ?? "";
        action =
          fiveNextStep.trim() ||
          (focusLabel ? `先支持：${focusLabel}` : "") ||
          Object.entries(fiveStatuses)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}:${v}`)
            .join("；");
        break;
      }
      case "three-steps":
        action = lifeTask.trim() || lifeSteps.filter(Boolean).join("；");
        break;
      case "meaning-seed":
        action =
          (seedBecause.trim() ? `我想留下它，因為${seedBecause.trim()}` : "") ||
          [seedMaterial, seedForm].filter(Boolean).join("｜");
        break;
      case "share-intent":
        action =
          shareWhat.trim() ||
          [shareForWhom, sharePrivacy].filter(Boolean).join("｜");
        break;
      case "embark-card":
        action =
          [embarkDirection, embarkFirstStep, embarkAiHelp].filter(Boolean).join("｜") ||
          embarkFirstStep.trim();
        break;
      case "boundary-choose":
        action = canChooseLine.trim() || cannotLine.trim();
        break;
      case "plan-b":
        action =
          [planBoundary, planReturn].filter(Boolean).join("｜") ||
          planScene.trim();
        break;
      case "dual-track":
        action =
          [bodyTrack && `身體：${bodyTrack}`, soulTrack && `靈魂：${soulTrack}`]
            .filter(Boolean)
            .join("；") || bodyTrack.trim();
        break;
      case "taste-journal":
        action =
          keepPractice.trim() || journalLines.filter(Boolean).join("／");
        break;
      case "ar-light":
        action =
          [agencyAction && `A：${agencyAction}`, resilienceAction && `R：${resilienceAction}`]
            .filter(Boolean)
            .join("；") || agencyAction.trim();
        break;
      case "verify-first":
        action =
          (firstAction.trim() || thenAction.trim())
            ? `我願意先${firstAction.trim()}，再${thenAction.trim()}`
            : "";
        break;
      case "pause-reflex":
        action =
          (chapter.pauseReflexOptions?.find((o) => o.id === picked)?.label
            ? `最需要練習：${chapter.pauseReflexOptions.find((o) => o.id === picked)!.label}`
            : "") || reflectNote.trim();
        break;
      case "rock-check":
        action =
          rockSafeAction.trim() ||
          rockFlags.filter(Boolean).join("；") ||
          rockScenario.trim();
        break;
      case "muscle-record":
        action =
          [scamPattern, muscleSafeAction].filter(Boolean).join("｜") ||
          scamPattern.trim();
        break;
      case "trust-lists":
        action =
          [blackSummary && `黑：${blackSummary}`, whiteSummary && `白：${whiteSummary}`]
            .filter(Boolean)
            .join("；");
        break;
      case "list-entry":
        action =
          [entryType, entryFeatures, entrySafeAction].filter(Boolean).join("｜") ||
          entryType.trim();
        break;
      case "family-weekly":
        action = familyLines.filter(Boolean).join("／");
        break;
      case "tr-light":
        action =
          [trustAction && `T：${trustAction}`, trResilienceAction && `R：${trResilienceAction}`]
            .filter(Boolean)
            .join("；");
        break;
      case "mindset-shift":
        action =
          (carePhrase.trim() ? `我想改成「${carePhrase.trim()}」` : "") ||
          pressurePhrase.trim();
        break;
      case "dual-signal":
        action =
          [feelingSignal, dataSignal].filter(Boolean).join(" × ") ||
          dataSignal.trim();
        break;
      case "ground-snap":
        action =
          (snapSource.trim() ? `今天拍下：${snapSource.trim()}` : "") ||
          softReminder.trim();
        break;
      case "week-rhythm":
        action = rhythmLines.filter(Boolean).join("；");
        break;
      case "kinetic-guide":
        action =
          [guideGoal, guidePrefer, guideAvoid, guideBoundary]
            .filter(Boolean)
            .join("｜");
        break;
      case "atr-light":
        action =
          [autonomyAction, atrTrustAction, atrResilienceAction]
            .filter(Boolean)
            .join("｜");
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
          replanSoftReminder.trim();
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
    const text = buildCuriosityPrompt(question);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製好奇心提問句，可以貼給 AI 或說出來。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const copyDecisionSeatAsk = async () => {
    const text = chapter.samplePrompt?.trim() || buildDecisionSeatPrompt();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製問題改寫提問句。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const copySixHatsAsk = async () => {
    const text = chapter.samplePrompt?.trim() || buildSixHatsPrompt();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製一人董事會提問句。");
    } catch {
      toast.info("請長按文字框手動複製。");
    }
  };

  const applyDecisionStartDemo = (demo: DecisionStartDemo) => {
    setDsChoice(demo.choice); setDsLifeImpact(demo.lifeImpact); setDsWantClear(demo.wantClear); setReflectNote(demo.reflectNote);
    saveDraft({ choice: demo.choice, lifeImpact: demo.lifeImpact, wantClear: demo.wantClear, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyDecisionSeatDemo = (demo: DecisionSeatDemo) => {
    setSeatSurfaceQ(demo.surfaceQ); setSeatKnown(demo.knownUnknown); setSeatExpect(demo.expectWorry);
    setSeatRealQ(demo.realQ); setSeatMustKeep(demo.mustKeep); setReflectNote(demo.reflectNote);
    saveDraft({ surfaceQ: demo.surfaceQ, knownUnknown: demo.knownUnknown, expectWorry: demo.expectWorry, realQ: demo.realQ, mustKeep: demo.mustKeep, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applySourceLadderDemo = (demo: SourceLadderDemo) => {
    setSrcMeta(demo.sourceMeta); setSrcLayer(demo.layer); setSrcConfirms(demo.confirms); setSrcCannot(demo.cannotProve); setSrcToCheck(demo.toCheck); setReflectNote(demo.reflectNote);
    saveDraft({ sourceMeta: demo.sourceMeta, layer: demo.layer, confirms: demo.confirms, cannotProve: demo.cannotProve, toCheck: demo.toCheck, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyClauseTranslateDemo = (demo: ClauseTranslateDemo) => {
    setClauseSummary(demo.clauseSummary); setClausePayLimit(demo.payLimit); setClauseLifeUnknown(demo.lifeUnknown); setReflectNote(demo.reflectNote);
    saveDraft({ clauseSummary: demo.clauseSummary, payLimit: demo.payLimit, lifeUnknown: demo.lifeUnknown, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyLifeBaselinesDemo = (demo: LifeBaselinesDemo) => {
    setBaseSafety(demo.safety); setBaseLife(demo.life); setBaseRel(demo.relationship); setReflectNote(demo.reflectNote);
    saveDraft({ safety: demo.safety, life: demo.life, relationship: demo.relationship, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applySixHatsDemo = (demo: SixHatsDemo) => {
    setHatsToCheck(demo.toCheck); setHatsNext(demo.nextStep); setHatsReview(demo.reviewDate); setReflectNote(demo.reflectNote);
    saveDraft({ toCheck: demo.toCheck, nextStep: demo.nextStep, reviewDate: demo.reviewDate, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applySameScaleDemo = (demo: SameScaleDemo) => {
    setScaleOptions(demo.optionsNote); setScaleNotes(demo.scalesNote); setScaleIgnored(demo.ignoredCost); setReflectNote(demo.reflectNote);
    saveDraft({ optionsNote: demo.optionsNote, scalesNote: demo.scalesNote, ignoredCost: demo.ignoredCost, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyStressTestDemo = (demo: StressTestDemo) => {
    setStressWorst(demo.worstCase); setStressStop(demo.stopSignal); setStressPro(demo.proCheck); setReflectNote(demo.reflectNote);
    saveDraft({ worstCase: demo.worstCase, stopSignal: demo.stopSignal, proCheck: demo.proCheck, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyThirdPathDemo = (demo: ThirdPathDemo) => {
    setThirdStalemate(demo.stalemate); setThirdKnob(demo.knob); setThirdPlan(demo.newPlan); setReflectNote(demo.reflectNote);
    saveDraft({ stalemate: demo.stalemate, knob: demo.knob, newPlan: demo.newPlan, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyProConfirmDemo = (demo: ProConfirmDemo) => {
    setProQ1(demo.q1); setProQ2(demo.q2); setProQ3(demo.q3); setReflectNote(demo.reflectNote);
    saveDraft({ q1: demo.q1, q2: demo.q2, q3: demo.q3, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyDecisionMemoDemo = (demo: DecisionMemoDemo) => {
    setMemoStatus(demo.status); setMemoReason(demo.reasonBaseline); setMemoPending(demo.pendingReview); setReflectNote(demo.reflectNote);
    saveDraft({ status: demo.status, reasonBaseline: demo.reasonBaseline, pendingReview: demo.pendingReview, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };

  const copyStoryCoreAsk = async () => {
    const textAsk = chapter.samplePrompt?.trim() || buildStoryCorePrompt();
    try { await navigator.clipboard.writeText(textAsk); toast.success("已複製故事核心提問句。"); }
    catch { toast.info("請長按文字框手動複製。"); }
  };

  const applyPart4StartDemo = (demo: Part4StartDemo) => {
    setP4Want(demo.wantComplete); setP4Meaning(demo.lifeMeaning); setP4Who(demo.shareWho); setP4Distance(demo.shareDistance); setReflectNote(demo.reflectNote);
    saveDraft({ wantComplete: demo.wantComplete, lifeMeaning: demo.lifeMeaning, shareWho: demo.shareWho, shareDistance: demo.shareDistance, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyStoryStartDemo = (demo: StoryStartDemo) => {
    setSsLeave(demo.leaveWhat); setSsHope(demo.hopeFeel); setSsStatus(demo.saveStatus); setReflectNote(demo.reflectNote);
    saveDraft({ leaveWhat: demo.leaveWhat, hopeFeel: demo.hopeFeel, saveStatus: demo.saveStatus, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyThemeBoundaryDemo = (demo: ThemeBoundaryDemo) => {
    setTbKeep(demo.wantKeep); setTbPrivate(demo.privateOnly); setTbNotTouch(demo.notTouch); setTbStart(demo.startToday); setReflectNote(demo.reflectNote);
    saveDraft({ wantKeep: demo.wantKeep, privateOnly: demo.privateOnly, notTouch: demo.notTouch, startToday: demo.startToday, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyThreeCluesDemo = (demo: ThreeCluesDemo) => {
    setTc1(demo.clue1); setTc2(demo.clue2); setTc3(demo.clue3); setReflectNote(demo.reflectNote);
    saveDraft({ clue1: demo.clue1, clue2: demo.clue2, clue3: demo.clue3, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyThreeColorCheckDemo = (demo: ThreeColorCheckDemo) => {
    setTcolRed(demo.redMark); setTcolYellow(demo.yellowMark); setTcolGreen(demo.greenMark); setReflectNote(demo.reflectNote);
    saveDraft({ redMark: demo.redMark, yellowMark: demo.yellowMark, greenMark: demo.greenMark, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyStoryCoreDemo = (demo: StoryCoreDemo) => {
    setScFaced(demo.faced); setScChose(demo.chose); setScLeave(demo.leaveToday); setReflectNote(demo.reflectNote);
    saveDraft({ faced: demo.faced, chose: demo.chose, leaveToday: demo.leaveToday, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyVoiceDraftDemo = (demo: VoiceDraftDemo) => {
    setVdStart(demo.startHow); setVdChange(demo.changeMoment); setVdWords(demo.voiceWords); setReflectNote(demo.reflectNote);
    saveDraft({ startHow: demo.startHow, changeMoment: demo.changeMoment, voiceWords: demo.voiceWords, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyFormBlueprintDemo = (demo: FormBlueprintDemo) => {
    setFbForm(demo.formAudience); setFbMaterials(demo.materials); setFbMin(demo.minDone); setReflectNote(demo.reflectNote);
    saveDraft({ formAudience: demo.formAudience, materials: demo.materials, minDone: demo.minDone, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyCoeditTruthDemo = (demo: CoeditTruthDemo) => {
    setCeRed(demo.checkRed); setCeYellow(demo.askYellow); setCeGreen(demo.keepGreen); setReflectNote(demo.reflectNote);
    saveDraft({ checkRed: demo.checkRed, askYellow: demo.askYellow, keepGreen: demo.keepGreen, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applySharedMemoryDemo = (demo: SharedMemoryDemo) => {
    setSmWho(demo.whoSee); setSmPresent(demo.presentHow); setSmAdjust(demo.adjustHow); setReflectNote(demo.reflectNote);
    saveDraft({ whoSee: demo.whoSee, presentHow: demo.presentHow, adjustHow: demo.adjustHow, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applyHeirloomKitDemo = (demo: HeirloomKitDemo) => {
    setHkCheck(demo.kitCheck); setHkOpen(demo.openTest); setHkCheer(demo.cheer); setReflectNote(demo.reflectNote);
    saveDraft({ kitCheck: demo.kitCheck, openTest: demo.openTest, cheer: demo.cheer, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
  };
  const applySharePassportDemo = (demo: SharePassportDemo) => {
    setSpStatus(demo.status); setSpIntent(demo.intent); setSpWithdraw(demo.withdraw); setReflectNote(demo.reflectNote);
    saveDraft({ status: demo.status, intent: demo.intent, withdraw: demo.withdraw, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}。`);
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

  const applyElevatorDemo = (demo: ElevatorWishDemo) => {
    setWishWant(demo.want);
    setWishStuck(demo.stuck);
    setWishAiHelp(demo.aiHelp);
    setReflectNote(demo.reflectNote);
    saveDraft({
      want: demo.want,
      stuck: demo.stuck,
      aiHelp: demo.aiHelp,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的三句話。`);
  };

  const applyLifeMatchDemo = (demo: LifeMatchDemo) => {
    setLifePainPoint(demo.painPoint);
    setLifeRoleId(demo.roleId);
    setReflectNote(demo.reflectNote);
    saveDraft({
      painPoint: demo.painPoint,
      roleId: demo.roleId,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的卡點。`);
  };

  const applyFiveReflectDemo = (demo: FiveReflectDemo) => {
    setPicked(demo.focusId);
    setFiveStatuses(demo.statuses);
    setFiveNextStep(demo.nextStep);
    setReflectNote(demo.reflectNote);
    saveDraft({
      focusId: demo.focusId,
      statuses: demo.statuses,
      nextStep: demo.nextStep,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的回看。`);
  };

  const applyThreeStepsDemo = (demo: ThreeStepsDemo) => {
    const steps: [string, string, string] = [
      demo.steps[0] ?? "",
      demo.steps[1] ?? "",
      demo.steps[2] ?? "",
    ];
    setLifeTask(demo.task);
    setLifeSteps(steps);
    setReflectNote(demo.reflectNote);
    saveDraft({ task: demo.task, steps, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}，您可以改成自己的三步。`);
  };

  const applyMeaningSeedDemo = (demo: MeaningSeedDemo) => {
    setSeedMaterial(demo.material);
    setSeedForm(demo.formHint);
    setSeedBecause(demo.because);
    setReflectNote(demo.reflectNote);
    saveDraft({
      material: demo.material,
      formHint: demo.formHint,
      because: demo.because,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的種子。`);
  };

  const applyShareIntentDemo = (demo: ShareIntentDemo) => {
    setShareWhat(demo.shareWhat);
    setShareForWhom(demo.forWhom);
    setSharePrivacy(demo.privacyNote);
    setReflectNote(demo.reflectNote);
    saveDraft({
      shareWhat: demo.shareWhat,
      forWhom: demo.forWhom,
      privacyNote: demo.privacyNote,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的分享意向。`);
  };

  const applyEmbarkDemo = (demo: EmbarkDemo) => {
    setEmbarkDirection(demo.direction);
    setEmbarkFirstStep(demo.firstStep);
    setEmbarkAiHelp(demo.aiHelp);
    setReflectNote(demo.reflectNote);
    saveDraft({
      direction: demo.direction,
      firstStep: demo.firstStep,
      aiHelp: demo.aiHelp,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的啟程卡。`);
  };

  const applyBoundaryChooseDemo = (demo: BoundaryChooseDemo) => {
    setCannotLine(demo.cannotLine);
    setCanChooseLine(demo.canChooseLine);
    setReflectNote(demo.reflectNote);
    saveDraft({
      cannotLine: demo.cannotLine,
      canChooseLine: demo.canChooseLine,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的句子。`);
  };

  const applyPlanBDemo = (demo: PlanBDemo) => {
    setPlanScene(demo.scene);
    setPlanBoundary(demo.boundary);
    setPlanReturn(demo.returnAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      scene: demo.scene,
      boundary: demo.boundary,
      returnAction: demo.returnAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的 Plan B。`);
  };

  const applyDualTrackDemo = (demo: DualTrackDemo) => {
    setBodyTrack(demo.bodyTrack);
    setSoulTrack(demo.soulTrack);
    setReflectNote(demo.reflectNote);
    saveDraft({
      bodyTrack: demo.bodyTrack,
      soulTrack: demo.soulTrack,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的指南。`);
  };

  const applyTasteJournalDemo = (demo: TasteJournalDemo) => {
    setJournalLines(demo.lines);
    setKeepPractice(demo.keepPractice);
    setReflectNote(demo.reflectNote);
    saveDraft({
      lines: demo.lines,
      keepPractice: demo.keepPractice,
      reflectNote: demo.reflectNote,
    } as unknown as Parameters<typeof saveDraft>[0]);
    toast.success(`已帶入${demo.label}，您可以改成自己的週記。`);
  };

  const applyArLightDemo = (demo: ArLightDemo) => {
    setAgencyAction(demo.agencyAction);
    setResilienceAction(demo.resilienceAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      agencyAction: demo.agencyAction,
      resilienceAction: demo.resilienceAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的點燈。`);
  };

  const applyVerifyFirstDemo = (demo: VerifyFirstDemo) => {
    setFirstAction(demo.firstAction);
    setThenAction(demo.thenAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      firstAction: demo.firstAction,
      thenAction: demo.thenAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}`);
  };

  const applyPauseReflexDemo = (demo: PauseReflexDemo) => {
    setPicked(demo.focusId);
    setReflectNote(demo.reflectNote);
    saveDraft({ focusId: demo.focusId, reflectNote: demo.reflectNote });
    toast.success(`已帶入${demo.label}`);
  };

  const applyRockCheckDemo = (demo: RockCheckDemo) => {
    const flags: [string, string, string] = [
      demo.flags[0] ?? "",
      demo.flags[1] ?? "",
      demo.flags[2] ?? "",
    ];
    setRockScenario(demo.scenario);
    setRockFlags(flags);
    setRockSafeAction(demo.safeAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      scenario: demo.scenario,
      flags,
      safeAction: demo.safeAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}`);
  };

  const applyMuscleRecordDemo = (demo: MuscleRecordDemo) => {
    setScamPattern(demo.scamPattern);
    setMuscleSafeAction(demo.safeAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      scamPattern: demo.scamPattern,
      safeAction: demo.safeAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}`);
  };

  const applyTrustListsDemo = (demo: TrustListsDemo) => {
    setBlackSummary(demo.blackSummary);
    setWhiteSummary(demo.whiteSummary);
    setReflectNote(demo.reflectNote);
    saveDraft({
      blackSummary: demo.blackSummary,
      whiteSummary: demo.whiteSummary,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}`);
  };

  const applyListEntryDemo = (demo: ListEntryDemo) => {
    setEntryType(demo.entryType);
    setEntryFeatures(demo.features);
    setEntrySafeAction(demo.safeAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      entryType: demo.entryType,
      features: demo.features,
      safeAction: demo.safeAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}`);
  };

  const applyFamilyWeeklyDemo = (demo: FamilyWeeklyDemo) => {
    setFamilyLines(demo.lines);
    setReflectNote(demo.reflectNote);
    saveDraft({ lines: demo.lines, reflectNote: demo.reflectNote } as unknown as Parameters<typeof saveDraft>[0]);
    toast.success(`已帶入${demo.label}`);
  };

  const applyTrLightDemo = (demo: TrLightDemo) => {
    setTrustAction(demo.trustAction);
    setTrResilienceAction(demo.resilienceAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      trustAction: demo.trustAction,
      resilienceAction: demo.resilienceAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}`);
  };

  const applyMindsetShiftDemo = (demo: MindsetShiftDemo) => {
    setPressurePhrase(demo.pressurePhrase);
    setCarePhrase(demo.carePhrase);
    setReflectNote(demo.reflectNote);
    saveDraft({
      pressurePhrase: demo.pressurePhrase,
      carePhrase: demo.carePhrase,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的轉念。`);
  };

  const applyDualSignalDemo = (demo: DualSignalDemo) => {
    setFeelingSignal(demo.feelingSignal);
    setDataSignal(demo.dataSignal);
    setReflectNote(demo.reflectNote);
    saveDraft({
      feelingSignal: demo.feelingSignal,
      dataSignal: demo.dataSignal,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的雙軌判斷。`);
  };

  const applyGroundSnapDemo = (demo: GroundSnapDemo) => {
    setSnapSource(demo.snapSource);
    setSoftReminder(demo.softReminder);
    setReflectNote(demo.reflectNote);
    saveDraft({
      snapSource: demo.snapSource,
      softReminder: demo.softReminder,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的第一拍。`);
  };

  const applyWeekRhythmDemo = (demo: WeekRhythmDemo) => {
    setRhythmLines(demo.lines);
    setReflectNote(demo.reflectNote);
    saveDraft({ lines: demo.lines, reflectNote: demo.reflectNote } as unknown as Parameters<typeof saveDraft>[0]);
    toast.success(`已帶入${demo.label}，您可以改成自己的節奏。`);
  };

  const applyKineticGuideDemo = (demo: KineticGuideDemo) => {
    setGuideGoal(demo.goal);
    setGuidePrefer(demo.prefer);
    setGuideAvoid(demo.avoid);
    setGuideBoundary(demo.boundary);
    setReflectNote(demo.reflectNote);
    saveDraft({
      goal: demo.goal,
      prefer: demo.prefer,
      avoid: demo.avoid,
      boundary: demo.boundary,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的節奏。`);
  };

  const applyAtrLightDemo = (demo: AtrLightDemo) => {
    setAutonomyAction(demo.autonomyAction);
    setAtrTrustAction(demo.trustAction);
    setAtrResilienceAction(demo.resilienceAction);
    setReflectNote(demo.reflectNote);
    saveDraft({
      autonomyAction: demo.autonomyAction,
      trustAction: demo.trustAction,
      resilienceAction: demo.resilienceAction,
      reflectNote: demo.reflectNote,
    });
    toast.success(`已帶入${demo.label}，您可以改成自己的光點。`);
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
    setReplanSoftReminder(demo.softReminder);
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
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      chapter.samplePrompt ?? "",
                      "找不到試用語句。"
                    )
                  }
                />
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
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      naturalQuestion,
                      "請先寫好您的自然提問。"
                    )
                  }
                />
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
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      messyTask.trim() ? buildOrganizeAskPrompt(messyTask) : "",
                      "請先寫下繁雜的事（請勿含敏感資料）。"
                    )
                  }
                />
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
                <ExternalAiPracticeRow
                  onTry={(provider) => {
                    const text =
                      chapter.id === "0202"
                        ? buildPlantAskPrompt()
                        : chapter.id === "0206"
                          ? buildFoodObservePrompt()
                          : buildVisionAskPrompt(itemLabel);
                    return tryExternalAi(provider, text, "找不到提問句。");
                  }}
                />
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
                        <ExternalAiPracticeRow
                          onTry={(provider) =>
                            tryExternalAi(
                              provider,
                              buildSmartFlowAskPrompt(snapNote),
                              "找不到二問提問句。"
                            )
                          }
                        />
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
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      buildMenuTranslatePrompt(dietaryNeed),
                      "找不到菜單翻譯提問句。"
                    )
                  }
                />
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
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      buildProductComparePrompt(productA, productB),
                      "請先填寫要比較的商品。"
                    )
                  }
                />
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
                  複製好奇心提問句
                </button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖問一句 →
                </button>
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      buildCuriosityPrompt(question),
                      "請先寫下今天想問的問題。"
                    )
                  }
                />
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


          {layout === "decision-start" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我最近反覆思考的一個重要選擇</div>
                <textarea value={dsChoice} onChange={(e) => { setDsChoice(e.target.value); saveDraft({ choice: e.target.value }); }}
                  placeholder="例如：是否接受一項期限緊、看起來機會難得的安排…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>它真正影響的生活（除了金錢）</div>
                <textarea value={dsLifeImpact} onChange={(e) => { setDsLifeImpact(e.target.value); saveDraft({ lifeImpact: e.target.value }); }}
                  placeholder="例如：陪家人旅行的餘裕、臨時支援家人的從容…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>今天最想先看清楚的是</div>
                <textarea value={dsWantClear} onChange={(e) => { setDsWantClear(e.target.value); saveDraft({ wantClear: e.target.value }); }}
                  placeholder="例如：退出與重新選擇的空間到底有多大…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              {chapter.entries && chapter.entries.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  {chapter.entries.map((entry) => (
                    <EntryButton key={entry.id} entry={entry} selected={picked === entry.id}
                      onSelect={() => savePick(entry.id)} onGo={() => goEntry(entry)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {layout === "decision-seat" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "我表面上在問", value: seatSurfaceQ, set: setSeatSurfaceQ, key: "surfaceQ", ph: "例如：這個安排好不好…" },
                { label: "目前已知／仍未知", value: seatKnown, set: setSeatKnown, key: "knownUnknown", ph: "例如：已知費用；未知退出條件…" },
                { label: "真正期待／最擔心", value: seatExpect, set: setSeatExpect, key: "expectWorry", ph: "例如：期待抓住機會；擔心失去餘裕…" },
                { label: "我真正想解決的是", value: seatRealQ, set: setSeatRealQ, key: "realQ", ph: "例如：能否守住未來的從容…" },
                { label: "最不能犧牲的是", value: seatMustKeep, set: setSeatMustKeep, key: "mustKeep", ph: "例如：照顧家人時仍有餘裕…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <textarea value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph} rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" onClick={copyDecisionSeatAsk} style={secondaryBtnStyle}>複製問題改寫提問句</button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>在暖暖一次一題 →</button>
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      chapter.samplePrompt?.trim() || buildDecisionSeatPrompt(),
                      "找不到問題改寫提問句。"
                    )
                  }
                />
              </div>
            </div>
          )}

          {layout === "source-ladder" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "資料名稱／發布者／更新日期", value: srcMeta, set: setSrcMeta, key: "sourceMeta", ph: "例如：官方說明／○○／2026-03…" },
                { label: "它位於第幾層", value: srcLayer, set: setSrcLayer, key: "layer", ph: "例如：第 1 層｜官方或原始文件…" },
                { label: "目前可以幫我確認", value: srcConfirms, set: setSrcConfirms, key: "confirms", ph: "例如：費用項目名稱…" },
                { label: "它不能單獨證明", value: srcCannot, set: setSrcCannot, key: "cannotProve", ph: "例如：是否適合我的生活底線…" },
                { label: "還要補查", value: srcToCheck, set: setSrcToCheck, key: "toCheck", ph: "例如：提前終止例外條件…" },
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

          {layout === "clause-translate" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "這段在說什麼（含頁碼／段落）", value: clauseSummary, set: setClauseSummary, key: "clauseSummary", ph: "例如：可提前終止（第 12 頁第 3 段）…" },
                { label: "我要付什麼、何時受限制", value: clausePayLimit, set: setClausePayLimit, key: "payLimit", ph: "例如：可能需手續費；特定期間限制取回…" },
                { label: "生活後果／仍待確認", value: clauseLifeUnknown, set: setClauseLifeUnknown, key: "lifeUnknown", ph: "例如：臨時需要用錢時可能無法立即取回…" },
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

          {layout === "life-baselines" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "安全底線｜如果＿＿發生，我就暫停或重新評估", value: baseSafety, set: setBaseSafety, key: "safety", ph: "例如：臨時需要支援卻無法取用…" },
                { label: "生活底線｜這個選擇不能讓我失去", value: baseLife, set: setBaseLife, key: "life", ph: "例如：每年與家人短旅行的餘裕…" },
                { label: "關係底線｜決定前要先和誰說清楚什麼", value: baseRel, set: setBaseRel, key: "relationship", ph: "例如：先和配偶說清楚退出條件…" },
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

          {layout === "six-hats" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>
                先說問題與三項底線，再依序：白帽事實、紅帽感受、黃帽價值、黑帽風險、綠帽替代、藍帽下一步。一次一題。
              </p>
              {[
                { label: "待查事項", value: hatsToCheck, set: setHatsToCheck, key: "toCheck", ph: "例如：提前終止費用的正式頁碼…" },
                { label: "下一小步", value: hatsNext, set: setHatsNext, key: "nextStep", ph: "例如：先完成條款白話摘要…" },
                { label: "重看日", value: hatsReview, set: setHatsReview, key: "reviewDate", ph: "例如：兩週後重看文件是否補齊…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <textarea value={f.value} onChange={(e) => { f.set(e.target.value); saveDraft({ [f.key]: e.target.value }); }}
                    placeholder={f.ph} rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" onClick={copySixHatsAsk} style={secondaryBtnStyle}>複製一人董事會提問句</button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>在暖暖召開會議 →</button>
                <ExternalAiPracticeRow
                  onTry={(provider) =>
                    tryExternalAi(
                      provider,
                      chapter.samplePrompt?.trim() || buildSixHatsPrompt(),
                      "找不到一人董事會提問句。"
                    )
                  }
                />
              </div>
            </div>
          )}

          {layout === "same-scale" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "方案 A／方案 B／維持現況", value: scaleOptions, set: setScaleOptions, key: "optionsNote", ph: "例如：方案 A／方案 B／維持現況…" },
                { label: "四項尺度筆記（費用、彈性、最不利影響、未知）", value: scaleNotes, set: setScaleNotes, key: "scalesNote", ph: "例如：費用清楚；彈性不足；未知退出時程…" },
                { label: "原先忽略的代價", value: scaleIgnored, set: setScaleIgnored, key: "ignoredCost", ph: "例如：退出時間可能打亂臨時支援家人…" },
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

          {layout === "stress-test" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "最不利情況／可能持續多久", value: stressWorst, set: setStressWorst, key: "worstCase", ph: "例如：資金暫時不能取用超過三個月…" },
                { label: "出現＿＿時，我就暫停、退出或重新評估", value: stressStop, set: setStressStop, key: "stopSignal", ph: "例如：無法在約定時間取用…" },
                { label: "仍需向合格專業人士確認", value: stressPro, set: setStressPro, key: "proCheck", ph: "例如：退出程序時程與費用計算…" },
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

          {layout === "third-path" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "目前的僵局", value: thirdStalemate, set: setThirdStalemate, key: "stalemate", ph: "例如：現在立刻做 vs 完全放棄…" },
                { label: "我先調整的旋鈕（時間／範圍／條件／資料／目標）", value: thirdKnob, set: setThirdKnob, key: "knob", ph: "例如：時間…" },
                { label: "新的小方案／重看條件", value: thirdPlan, set: setThirdPlan, key: "newPlan", ph: "例如：先補齊文件，兩週後重看…" },
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

          {layout === "pro-confirm" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "問題 1｜正式文件或依據在哪", value: proQ1, set: setProQ1, key: "q1", ph: "例如：依據在哪一頁、哪一條？" },
                { label: "問題 2｜限制與例外", value: proQ2, set: setProQ2, key: "q2", ph: "例如：適用情況、限制與例外？" },
                { label: "問題 3｜事實／判斷／假設與利益關係", value: proQ3, set: setProQ3, key: "q3", ph: "例如：是否有佣酬或轉介利益？" },
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

          {layout === "decision-memo" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>目前狀態</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {["繼續查證", "暫停", "停止", "設定重看日", "條件清楚後執行"].map((s) => (
                    <button key={s} type="button" onClick={() => { setMemoStatus(s); saveDraft({ status: s }); }}
                      style={{ padding: "8px 12px", borderRadius: "var(--r-pill)", border: `2px solid ${memoStatus === s ? "var(--primary)" : "var(--line-strong)"}`, background: memoStatus === s ? "var(--primary-soft)" : "var(--surface)", fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我的理由／不能犧牲的底線</div>
                <textarea value={memoReason} onChange={(e) => { setMemoReason(e.target.value); saveDraft({ reasonBaseline: e.target.value }); }}
                  placeholder="例如：在退出條件未確認前不執行…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>仍待確認／重看日期與條件</div>
                <textarea value={memoPending} onChange={(e) => { setMemoPending(e.target.value); saveDraft({ pendingReview: e.target.value }); }}
                  placeholder="例如：兩週後重看正式文件是否補齊…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}


          {layout === "part4-start" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我想完成的作品</div>
                <textarea value={p4Want} onChange={(e) => { setP4Want(e.target.value); saveDraft({ wantComplete: e.target.value }); }}
                  placeholder="例如：為母親做一張三張照片的故事卡…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>它對生命代表什麼</div>
                <textarea value={p4Meaning} onChange={(e) => { setP4Meaning(e.target.value); saveDraft({ lifeMeaning: e.target.value }); }}
                  placeholder="例如：把她常說的那句話留下來…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>目前想先讓誰看見</div>
                <textarea value={p4Who} onChange={(e) => { setP4Who(e.target.value); saveDraft({ shareWho: e.target.value }); }}
                  placeholder="例如：先給手足看…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>分享距離</div>
                <textarea value={p4Distance} onChange={(e) => { setP4Distance(e.target.value); saveDraft({ shareDistance: e.target.value }); }}
                  placeholder="例如：指定分享／只給自己…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              {chapter.entries && chapter.entries.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  {chapter.entries.map((entry) => (
                    <EntryButton key={entry.id} entry={entry} selected={picked === entry.id}
                      onSelect={() => savePick(entry.id)} onGo={() => goEntry(entry)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {layout === "story-start" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>一件想留下的事</div>
                <textarea value={ssLeave} onChange={(e) => { setSsLeave(e.target.value); saveDraft({ leaveWhat: e.target.value }); }}
                  placeholder="例如：外婆的滷肉飯做法與那句「慢慢燉」…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>希望後來的人感受到什麼</div>
                <textarea value={ssHope} onChange={(e) => { setSsHope(e.target.value); saveDraft({ hopeFeel: e.target.value }); }}
                  placeholder="例如：家的味道與不趕的節奏…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>今天先標記的保存狀態</div>
                <textarea value={ssStatus} onChange={(e) => { setSsStatus(e.target.value); saveDraft({ saveStatus: e.target.value }); }}
                  placeholder="例如：只給自己／可與特定人共編／待確認…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              {chapter.entries && chapter.entries.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                  {chapter.entries.map((entry) => (
                    <EntryButton key={entry.id} entry={entry} selected={picked === entry.id}
                      onSelect={() => savePick(entry.id)} onGo={() => goEntry(entry)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {layout === "theme-boundary" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>想留下</div>
                <textarea value={tbKeep} onChange={(e) => { setTbKeep(e.target.value); saveDraft({ wantKeep: e.target.value }); }}
                  placeholder="例如：第一次搬家那天的選擇…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>只供自己珍藏</div>
                <textarea value={tbPrivate} onChange={(e) => { setTbPrivate(e.target.value); saveDraft({ privateOnly: e.target.value }); }}
                  placeholder="例如：與某段關係有關的信件…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>暫時不碰</div>
                <textarea value={tbNotTouch} onChange={(e) => { setTbNotTouch(e.target.value); saveDraft({ notTouch: e.target.value }); }}
                  placeholder="例如：仍會刺痛的爭執…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>今天最願意開始的一項</div>
                <textarea value={tbStart} onChange={(e) => { setTbStart(e.target.value); saveDraft({ startToday: e.target.value }); }}
                  placeholder="例如：第一次搬家那天的選擇…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "three-clues" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>線索一｜位置／意義／待詢問</div>
                <textarea value={tc1} onChange={(e) => { setTc1(e.target.value); saveDraft({ clue1: e.target.value }); }}
                  placeholder="例如：舊相簿第 3 頁合照｜抽屜｜想起搬家前的最後一頓飯…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>線索二｜位置／意義／待詢問</div>
                <textarea value={tc2} onChange={(e) => { setTc2(e.target.value); saveDraft({ clue2: e.target.value }); }}
                  placeholder="例如：錄音裡的笑聲｜手機語音備忘｜想起母親勸我慢慢來…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>線索三｜位置／意義／待詢問</div>
                <textarea value={tc3} onChange={(e) => { setTc3(e.target.value); saveDraft({ clue3: e.target.value }); }}
                  placeholder="例如：手寫食譜｜廚房抽屜｜還想問妹妹當時的細節…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "three-color-check" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                {[
                  { t: "1 查紅", c: "#C95B5B" },
                  { t: "2 問黃", c: "#C9A15B" },
                  { t: "3 留綠", c: "#5BA86B" },
                ].map((s) => (
                  <div key={s.t} style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: s.c + "22", border: `1px solid ${s.c}`, color: s.c, fontSize: "var(--fs-xs)", fontWeight: 800 }}>
                    {s.t}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>紅標｜查證或不確定</div>
                <textarea value={tcolRed} onChange={(e) => { setTcolRed(e.target.value); saveDraft({ redMark: e.target.value }); }}
                  placeholder="例如：搬家年份仍待確認（大約是那一年）…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>黃標｜共同記憶是否尊重</div>
                <textarea value={tcolYellow} onChange={(e) => { setTcolYellow(e.target.value); saveDraft({ yellowMark: e.target.value }); }}
                  placeholder="例如：合照中妹妹是否同意被寫進故事…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>綠標｜保留原話與語調</div>
                <textarea value={tcolGreen} onChange={(e) => { setTcolGreen(e.target.value); saveDraft({ greenMark: e.target.value }); }}
                  placeholder="例如：「那時候我選了留下，而不是趕著證明自己。」…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "story-core" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>那時我面對……</div>
                <textarea value={scFaced} onChange={(e) => { setScFaced(e.target.value); saveDraft({ faced: e.target.value }); }}
                  placeholder="例如：要不要離開熟悉的城市…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我選擇……</div>
                <textarea value={scChose} onChange={(e) => { setScChose(e.target.value); saveDraft({ chose: e.target.value }); }}
                  placeholder="例如：先安頓家人，再慢慢找下一步…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>今天我想留下的是……</div>
                <textarea value={scLeave} onChange={(e) => { setScLeave(e.target.value); saveDraft({ leaveToday: e.target.value }); }}
                  placeholder="例如：緩慢也是一種負責任的選擇…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" onClick={copyStoryCoreAsk} style={secondaryBtnStyle}>複製故事核心提問句</button>
                <button type="button" onClick={tryInNuannuan} style={primaryOutlineBtnStyle}>在暖暖一次一題 →</button>
              </div>
            </div>
          )}

          {layout === "voice-draft" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>事情怎麼開始</div>
                <textarea value={vdStart} onChange={(e) => { setVdStart(e.target.value); saveDraft({ startHow: e.target.value }); }}
                  placeholder="例如：先說搬家前那頓飯怎麼開始…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>哪一刻改變了</div>
                <textarea value={vdChange} onChange={(e) => { setVdChange(e.target.value); saveDraft({ changeMoment: e.target.value }); }}
                  placeholder="例如：母親說「慢慢來」的那一刻…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>三個原聲詞語</div>
                <textarea value={vdWords} onChange={(e) => { setVdWords(e.target.value); saveDraft({ voiceWords: e.target.value }); }}
                  placeholder="例如：慢慢來｜先安頓｜不必證明…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "form-blueprint" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>形式與受眾</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {["故事卡", "圖文小冊", "聲音故事", "微影音"].map((s) => (
                    <button key={s} type="button" onClick={() => { const next = fbForm.includes(s) ? fbForm : (fbForm ? `${fbForm}｜${s}` : s); setFbForm(next); saveDraft({ formAudience: next }); }}
                      style={{ padding: "8px 12px", borderRadius: "var(--r-pill)", border: `2px solid ${fbForm.includes(s) ? "var(--primary)" : "var(--line-strong)"}`, background: fbForm.includes(s) ? "var(--primary-soft)" : "var(--surface)", fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
                <textarea value={fbForm} onChange={(e) => { setFbForm(e.target.value); saveDraft({ formAudience: e.target.value }); }}
                  placeholder="例如：故事卡｜給手足…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>已有材料／還缺一項</div>
                <textarea value={fbMaterials} onChange={(e) => { setFbMaterials(e.target.value); saveDraft({ materials: e.target.value }); }}
                  placeholder="例如：三張照片、一句核心句；還缺圖說一句…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>最小完成版與今天第一步</div>
                <textarea value={fbMin} onChange={(e) => { setFbMin(e.target.value); saveDraft({ minDone: e.target.value }); }}
                  placeholder="例如：一張完成；今天先選三張照片…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "coedit-truth" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                {[
                  { t: "1 查紅", c: "#C95B5B" },
                  { t: "2 問黃", c: "#C9A15B" },
                  { t: "3 留綠", c: "#5BA86B" },
                ].map((s) => (
                  <div key={s.t} style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: s.c + "22", border: `1px solid ${s.c}`, color: s.c, fontSize: "var(--fs-xs)", fontWeight: 800 }}>
                    {s.t}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>查紅</div>
                <textarea value={ceRed} onChange={(e) => { setCeRed(e.target.value); saveDraft({ checkRed: e.target.value }); }}
                  placeholder="例如：刪掉 AI 補上的正確日期，改回「大約那年夏天」…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>問黃</div>
                <textarea value={ceYellow} onChange={(e) => { setCeYellow(e.target.value); saveDraft({ askYellow: e.target.value }); }}
                  placeholder="例如：合照說明先改為「家人」，待妹妹確認…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>留綠</div>
                <textarea value={ceGreen} onChange={(e) => { setCeGreen(e.target.value); saveDraft({ keepGreen: e.target.value }); }}
                  placeholder="例如：保留原句「我選了留下」…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "shared-memory" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>故事裡有誰／給誰看</div>
                <textarea value={smWho} onChange={(e) => { setSmWho(e.target.value); saveDraft({ whoSee: e.target.value }); }}
                  placeholder="例如：故事裡有妹妹；想給手足看…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>希望如何呈現</div>
                <textarea value={smPresent} onChange={(e) => { setSmPresent(e.target.value); saveDraft({ presentHow: e.target.value }); }}
                  placeholder="例如：可用合照，姓名改稱「妹妹」…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>調整或撤回方式</div>
                <textarea value={smAdjust} onChange={(e) => { setSmAdjust(e.target.value); saveDraft({ adjustHow: e.target.value }); }}
                  placeholder="例如：若她改心意，改匿名或移除照片…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "heirloom-kit" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>五件套核對</div>
                <textarea value={hkCheck} onChange={(e) => { setHkCheck(e.target.value); saveDraft({ kitCheck: e.target.value }); }}
                  placeholder="例如：主作品 PDF／來源註記／分享說明／圖說／雲端＋外接備份…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>另一台裝置開啟測試</div>
                <textarea value={hkOpen} onChange={(e) => { setHkOpen(e.target.value); saveDraft({ openTest: e.target.value }); }}
                  placeholder="例如：已用平板開啟並可閱讀…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>一句喝采</div>
                <textarea value={hkCheer} onChange={(e) => { setHkCheer(e.target.value); saveDraft({ cheer: e.target.value }); }}
                  placeholder="例如：我完成了母親的故事卡…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "share-passport" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>目前狀態</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {["只給自己", "指定分享", "受邀社群", "公開"].map((s) => (
                    <button key={s} type="button" onClick={() => { setSpStatus(s); saveDraft({ status: s }); }}
                      style={{ padding: "8px 12px", borderRadius: "var(--r-pill)", border: `2px solid ${spStatus === s ? "var(--primary)" : "var(--line-strong)"}`, background: spStatus === s ? "var(--primary-soft)" : "var(--surface)", fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>分享心意與期限</div>
                <textarea value={spIntent} onChange={(e) => { setSpIntent(e.target.value); saveDraft({ intent: e.target.value }); }}
                  placeholder="例如：先自己珍藏一季；之後再給手足…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>調整或撤回方式</div>
                <textarea value={spWithdraw} onChange={(e) => { setSpWithdraw(e.target.value); saveDraft({ withdraw: e.target.value }); }}
                  placeholder="例如：若要分享，改為指定連結並可隨時關閉…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "elevator-wish" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "want", label: "我想要", value: wishWant, set: setWishWant, ph: "例如：整理家族照片…" },
                { key: "stuck", label: "我卡在", value: wishStuck, set: setWishStuck, ph: "例如：不知道從哪裡開始…" },
                { key: "aiHelp", label: "希望 AI 先幫我", value: wishAiHelp, set: setWishAiHelp, ph: "例如：先訂一個只選 10 張的步驟…" },
              ].map((row) => (
                <div key={row.key}>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6,
                  }}>
                    {row.label}
                  </div>
                  <textarea
                    value={row.value}
                    onChange={(e) => {
                      row.set(e.target.value);
                      saveDraft({ [row.key]: e.target.value } as Partial<ChapterElevatorWishDraft>);
                    }}
                    placeholder={row.ph}
                    rows={2}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "life-match" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 8,
              }}>
                生活卡點
              </div>
              <textarea
                value={lifePainPoint}
                onChange={(e) => {
                  setLifePainPoint(e.target.value);
                  saveDraft({ painPoint: e.target.value });
                }}
                placeholder="例如：下週回診，怕搞錯時間又怕找不到路…"
                rows={2}
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 12,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              {chapter.lifeRoleOptions && (
                <>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 8,
                  }}>
                    需要的角色（選一位）
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {chapter.lifeRoleOptions.map((opt) => {
                      const on = lifeRoleId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setLifeRoleId(opt.id);
                            saveDraft({ roleId: opt.id });
                          }}
                          style={{
                            textAlign: "left", padding: "12px 14px",
                            borderRadius: 12,
                            border: `2px solid ${on ? "var(--primary)" : "var(--line-strong)"}`,
                            background: on ? "var(--primary-soft)" : "var(--surface)",
                            cursor: "pointer",
                          }}
                        >
                          <strong style={{ fontSize: "var(--fs-sm)" }}>{opt.label}</strong>
                          <span style={{
                            display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2,
                          }}>
                            {opt.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {layout === "five-reflect" && chapter.smartDirections && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 8,
              }}>
                {chapter.fiveReflectMode === "pick"
                  ? "選一個最接近現在需要的方向"
                  : chapter.fiveReflectMode === "weekly"
                    ? "用低／中／高或一句話回看五方向"
                    : "為五方向各寫一句現況，再圈出最想先支持的一個"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                {chapter.smartDirections.map((dir) => {
                  const on = picked === dir.id;
                  const status = fiveStatuses[dir.id] ?? "";
                  return (
                    <div
                      key={dir.id}
                      style={{
                        padding: 12, borderRadius: 12,
                        border: `2px solid ${on ? "var(--primary)" : "var(--line-strong)"}`,
                        background: on ? "var(--primary-soft)" : "var(--surface)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPicked(dir.id);
                          saveDraft({ focusId: dir.id });
                        }}
                        style={{
                          width: "100%", textAlign: "left", background: "transparent",
                          border: "none", cursor: "pointer", padding: 0,
                        }}
                      >
                        <strong style={{ fontSize: "var(--fs-sm)" }}>
                          {dir.letter}｜{dir.label}
                          {on ? " · 先支持這裡" : ""}
                        </strong>
                        <span style={{
                          display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2,
                        }}>
                          {dir.hint}
                        </span>
                      </button>
                      {chapter.fiveReflectMode !== "pick" && (
                        <div style={{ marginTop: 10 }}>
                          {chapter.statusChoices && (
                            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                              {chapter.statusChoices.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    const next = { ...fiveStatuses, [dir.id]: c };
                                    setFiveStatuses(next);
                                    saveDraft({ statuses: next });
                                  }}
                                  style={{
                                    padding: "6px 12px", borderRadius: "var(--r-pill)",
                                    border: `1px solid ${status === c ? "var(--primary)" : "var(--line)"}`,
                                    background: status === c ? "var(--primary)" : "var(--surface)",
                                    color: status === c ? "#fff" : "var(--ink-2)",
                                    fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                                  }}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          )}
                          <input
                            value={status}
                            onChange={(e) => {
                              const next = { ...fiveStatuses, [dir.id]: e.target.value };
                              setFiveStatuses(next);
                              saveDraft({ statuses: next });
                            }}
                            placeholder="或寫一句現況…"
                            style={{
                              width: "100%", padding: "10px 12px",
                              borderRadius: 10, border: "1px solid var(--line)",
                              background: "var(--surface)", fontSize: "var(--fs-xs)",
                              fontFamily: "inherit", boxSizing: "border-box",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {chapter.fiveReflectMode !== "pick" && (
                <>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6,
                  }}>
                    最小下一步
                  </div>
                  <textarea
                    value={fiveNextStep}
                    onChange={(e) => {
                      setFiveNextStep(e.target.value);
                      saveDraft({ nextStep: e.target.value });
                    }}
                    placeholder="例如：這週傳一張近況照片給家人…"
                    rows={2}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </>
              )}
            </div>
          )}

          {layout === "three-steps" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6,
              }}>
                本週想過順的小事
              </div>
              <textarea
                value={lifeTask}
                onChange={(e) => {
                  setLifeTask(e.target.value);
                  saveDraft({ task: e.target.value });
                }}
                placeholder="例如：這週想讓晚餐準備不那麼亂…"
                rows={2}
                style={{
                  width: "100%", padding: "12px 14px", marginBottom: 12,
                  borderRadius: 12, border: "2px solid var(--line-strong)",
                  background: "var(--surface)", fontSize: "var(--fs-sm)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
              {(["第一步", "第二步", "第三步"] as const).map((label, i) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 4,
                  }}>
                    {label}
                  </div>
                  <input
                    value={lifeSteps[i]}
                    onChange={(e) => {
                      const next: [string, string, string] = [...lifeSteps];
                      next[i] = e.target.value;
                      setLifeSteps(next);
                      saveDraft({ steps: next });
                    }}
                    placeholder={`不費力的${label}…`}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "meaning-seed" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "material", label: "生命素材", value: seedMaterial, set: setSeedMaterial, ph: "例如：一張旅行照片／一段口述…" },
                { key: "formHint", label: "可能的作品形式", value: seedForm, set: setSeedForm, ph: "例如：10 頁小冊、食譜卡、口述文字…" },
                { key: "because", label: "我想留下它，因為", value: seedBecause, set: setSeedBecause, ph: "例如：想讓孫子知道我們走過哪些地方…" },
              ].map((row) => (
                <div key={row.key}>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6,
                  }}>
                    {row.label}
                  </div>
                  <textarea
                    value={row.value}
                    onChange={(e) => {
                      row.set(e.target.value);
                      const patch =
                        row.key === "material"
                          ? { material: e.target.value }
                          : row.key === "formHint"
                            ? { formHint: e.target.value }
                            : { because: e.target.value };
                      saveDraft(patch);
                    }}
                    placeholder={row.ph}
                    rows={2}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "share-intent" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "shareWhat", label: "願意分享的小經驗或方法", value: shareWhat, set: setShareWhat, ph: "例如：如何用相簿搜尋找到生日照片…" },
                { key: "forWhom", label: "希望幫助誰", value: shareForWhom, set: setShareForWhom, ph: "例如：剛開始學手機的朋友…" },
                { key: "privacyNote", label: "我仍想保留的隱私", value: sharePrivacy, set: setSharePrivacy, ph: "例如：不公開家人照片，只分享步驟…" },
              ].map((row) => (
                <div key={row.key}>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6,
                  }}>
                    {row.label}
                  </div>
                  <textarea
                    value={row.value}
                    onChange={(e) => {
                      row.set(e.target.value);
                      const patch =
                        row.key === "shareWhat"
                          ? { shareWhat: e.target.value }
                          : row.key === "forWhom"
                            ? { forWhom: e.target.value }
                            : { privacyNote: e.target.value };
                      saveDraft(patch);
                    }}
                    placeholder={row.ph}
                    rows={2}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "embark-card" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "direction", label: "我的方向", value: embarkDirection, set: setEmbarkDirection, ph: "例如：S｜分享與連結…" },
                { key: "firstStep", label: "第一小步", value: embarkFirstStep, set: setEmbarkFirstStep, ph: "例如：這週傳一張近況照片…" },
                { key: "aiHelp", label: "希望 AI 協助的方式", value: embarkAiHelp, set: setEmbarkAiHelp, ph: "例如：幫我想一句溫暖的傳訊開頭…" },
              ].map((row) => (
                <div key={row.key}>
                  <div style={{
                    fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6,
                  }}>
                    {row.label}
                  </div>
                  <textarea
                    value={row.value}
                    onChange={(e) => {
                      row.set(e.target.value);
                      const patch =
                        row.key === "direction"
                          ? { direction: e.target.value }
                          : row.key === "firstStep"
                            ? { firstStep: e.target.value }
                            : { aiHelp: e.target.value };
                      saveDraft(patch);
                    }}
                    placeholder={row.ph}
                    rows={2}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "boundary-choose" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  原本的「不能吃」
                </div>
                <textarea
                  value={cannotLine}
                  onChange={(e) => {
                    setCannotLine(e.target.value);
                    saveDraft({ cannotLine: e.target.value });
                  }}
                  placeholder="例如：我不能吃甜的…"
                  rows={2}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  我可以有底線地選擇
                </div>
                <textarea
                  value={canChooseLine}
                  onChange={(e) => {
                    setCanChooseLine(e.target.value);
                    saveDraft({ canChooseLine: e.target.value });
                  }}
                  placeholder="例如：一小塊甜點，吃完後散步十分鐘…"
                  rows={2}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {layout === "plan-b" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "scene", label: "聚餐／享受場景", value: planScene, set: setPlanScene, ph: "例如：週末家族聚餐…" },
                { key: "boundary", label: "我的一條底線", value: planBoundary, set: setPlanBoundary, ph: "例如：甜點只吃一小塊…" },
                { key: "returnAction", label: "回歸小動作", value: planReturn, set: setPlanReturn, ph: "例如：隔天恢復平常散步…" },
              ].map((row) => (
                <div key={row.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                    {row.label}
                  </div>
                  <textarea
                    value={row.value}
                    onChange={(e) => {
                      row.set(e.target.value);
                      const patch =
                        row.key === "scene"
                          ? { scene: e.target.value }
                          : row.key === "boundary"
                            ? { boundary: e.target.value }
                            : { returnAction: e.target.value };
                      saveDraft(patch);
                    }}
                    placeholder={row.ph}
                    rows={2}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "dual-track" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  身體軌（底線／禁忌／需再確認）
                </div>
                <textarea
                  value={bodyTrack}
                  onChange={(e) => {
                    setBodyTrack(e.target.value);
                    saveDraft({ bodyTrack: e.target.value });
                  }}
                  placeholder="例如：花生過敏；醫生提醒少油炸…"
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  靈魂軌（味道／記憶／想保留的享受）
                </div>
                <textarea
                  value={soulTrack}
                  onChange={(e) => {
                    setSoulTrack(e.target.value);
                    saveDraft({ soulTrack: e.target.value });
                  }}
                  placeholder="例如：喜歡家常湯品；想和孫子分享下午點心…"
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {layout === "taste-journal" && (
            <div style={{ marginBottom: 16 }}>
              {(["看懂了什麼", "享受了什麼", "守住哪一條底線", "偏離後如何回來"] as const).map((label, i) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 4 }}>
                    {i + 1}. {label}
                  </div>
                  <input
                    value={journalLines[i]}
                    onChange={(e) => {
                      const next: [string, string, string, string] = [...journalLines] as [string, string, string, string];
                      next[i] = e.target.value;
                      setJournalLines(next);
                      saveDraft({ lines: next } as unknown as Parameters<typeof saveDraft>[0]);
                    }}
                    placeholder={`寫一句關於「${label}」…`}
                    style={{
                      width: "100%", padding: "12px 14px",
                      borderRadius: 12, border: "2px solid var(--line-strong)",
                      background: "var(--surface)", fontSize: "var(--fs-sm)",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  下週想保留的小做法
                </div>
                <textarea
                  value={keepPractice}
                  onChange={(e) => {
                    setKeepPractice(e.target.value);
                    saveDraft({ keepPractice: e.target.value });
                  }}
                  placeholder="例如：下週繼續「先吃菜再享用」…"
                  rows={2}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {layout === "ar-light" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  A｜自主小動作
                </div>
                <textarea
                  value={agencyAction}
                  onChange={(e) => {
                    setAgencyAction(e.target.value);
                    saveDraft({ agencyAction: e.target.value });
                  }}
                  placeholder="例如：點菜前先問自己想要的滋味…"
                  rows={2}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  R｜韌性小動作
                </div>
                <textarea
                  value={resilienceAction}
                  onChange={(e) => {
                    setResilienceAction(e.target.value);
                    saveDraft({ resilienceAction: e.target.value });
                  }}
                  placeholder="例如：偏離後隔天恢復平常散步…"
                  rows={2}
                  style={{
                    width: "100%", padding: "12px 14px",
                    borderRadius: 12, border: "2px solid var(--line-strong)",
                    background: "var(--surface)", fontSize: "var(--fs-sm)",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {layout === "verify-first" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我願意先</div>
                <textarea value={firstAction} onChange={(e) => { setFirstAction(e.target.value); saveDraft({ firstAction: e.target.value }); }}
                  placeholder="例如：暫停、不點連結…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>再</div>
                <textarea value={thenAction} onChange={(e) => { setThenAction(e.target.value); saveDraft({ thenAction: e.target.value }); }}
                  placeholder="例如：用自己保存的官方電話查證…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "pause-reflex" && chapter.pauseReflexOptions && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {chapter.pauseReflexOptions.map((opt) => {
                const on = picked === opt.id;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => { setPicked(opt.id); saveDraft({ focusId: opt.id }); }}
                    style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, border: `2px solid ${on ? "var(--primary)" : "var(--line-strong)"}`, background: on ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer" }}>
                    <strong style={{ fontSize: "var(--fs-sm)" }}>{opt.label}{on ? " · 我最需要練習" : ""}</strong>
                    <span style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          )}

          {layout === "rock-check" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>模擬訊息（請勿當真）</div>
              <textarea value={rockScenario} onChange={(e) => { setRockScenario(e.target.value); saveDraft({ scenario: e.target.value }); }}
                placeholder="貼上或改寫一則模擬邀約／假親友訊息…" rows={2}
                style={{ width: "100%", padding: "12px 14px", marginBottom: 10, borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              {(["疑點一", "疑點二", "疑點三"] as const).map((label, i) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 4 }}>{label}</div>
                  <input value={rockFlags[i]} onChange={(e) => {
                    const next: [string, string, string] = [...rockFlags] as [string, string, string];
                    next[i] = e.target.value; setRockFlags(next); saveDraft({ flags: next });
                  }} placeholder={`${label}…`} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>安全確認方式</div>
              <textarea value={rockSafeAction} onChange={(e) => { setRockSafeAction(e.target.value); saveDraft({ safeAction: e.target.value }); }}
                placeholder="例如：不加入、打原本電話確認…" rows={2}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              {chapter.samplePrompt && (
                <button type="button" onClick={async () => {
                  try { await navigator.clipboard.writeText(chapter.samplePrompt!); toast.success("已複製安全提問句"); }
                  catch { toast.info("請手動複製下方提問句"); }
                }} style={{ marginTop: 10, width: "100%", padding: "12px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>
                  複製「只列疑點」提問句
                </button>
              )}
            </div>
          )}

          {layout === "muscle-record" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>已能辨識的話術</div>
                <textarea value={scamPattern} onChange={(e) => { setScamPattern(e.target.value); saveDraft({ scamPattern: e.target.value }); }}
                  placeholder="例如：保證獲利／老師帶單…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>我的安全動作</div>
                <textarea value={muscleSafeAction} onChange={(e) => { setMuscleSafeAction(e.target.value); saveDraft({ safeAction: e.target.value }); }}
                  placeholder="例如：不加入群組、先跟家人討論…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "trust-lists" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>黑名單摘要（低敏感）</div>
                <textarea value={blackSummary} onChange={(e) => { setBlackSummary(e.target.value); saveDraft({ blackSummary: e.target.value }); }}
                  placeholder="例如：保證獲利群組、假銀行凍結簡訊…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>白名單摘要（親自確認過）</div>
                <textarea value={whiteSummary} onChange={(e) => { setWhiteSummary(e.target.value); saveDraft({ whiteSummary: e.target.value }); }}
                  placeholder="例如：子女原電話、銀行官網客服…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "list-entry" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)" }}>
                {chapter.listEntryMode === "whitelist" ? "新增一筆白名單（親自確認過）" : "新增一筆黑名單（低敏感模式）"}
              </div>
              {[
                { key: "entryType", label: chapter.listEntryMode === "whitelist" ? "可信對象" : "騙術類型", value: entryType, set: setEntryType, ph: "例如：假客服／A 銀行官方客服…" },
                { key: "features", label: chapter.listEntryMode === "whitelist" ? "確認方式" : "可疑特徵", value: entryFeatures, set: setEntryFeatures, ph: "例如：從官網查到的電話／保證獲利…" },
                { key: "safeAction", label: "安全動作", value: entrySafeAction, set: setEntrySafeAction, ph: "例如：掛斷後用白名單回撥…" },
              ].map((row) => (
                <div key={row.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{row.label}</div>
                  <textarea value={row.value} onChange={(e) => {
                    row.set(e.target.value);
                    const patch = row.key === "entryType" ? { entryType: e.target.value } : row.key === "features" ? { features: e.target.value } : { safeAction: e.target.value };
                    saveDraft(patch);
                  }} placeholder={row.ph} rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "family-weekly" && (
            <div style={{ marginBottom: 16 }}>
              {(["看見了哪種新騙術", "更新了哪筆安全紀錄", "想提醒家人的一句話"] as const).map((label, i) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 4 }}>{i + 1}. {label}</div>
                  <input value={familyLines[i]} onChange={(e) => {
                    const next: [string, string, string] = [...familyLines] as [string, string, string];
                    next[i] = e.target.value; setFamilyLines(next); saveDraft({ lines: next } as unknown as Parameters<typeof saveDraft>[0]);
                  }} placeholder={`${label}（不含個資）…`}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          )}

          {layout === "tr-light" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>T｜信賴光點</div>
                <textarea value={trustAction} onChange={(e) => { setTrustAction(e.target.value); saveDraft({ trustAction: e.target.value }); }}
                  placeholder="例如：重要通知只走白名單管道…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>R｜韌性／安全光點</div>
                <textarea value={trResilienceAction} onChange={(e) => { setTrResilienceAction(e.target.value); saveDraft({ resilienceAction: e.target.value }); }}
                  placeholder="例如：心跳加快時先暫停…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {layout === "mindset-shift" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  我不想再只用這句判斷運動有效
                </div>
                <textarea
                  value={pressurePhrase}
                  onChange={(e) => {
                    setPressurePhrase(e.target.value);
                    saveDraft({ pressurePhrase: e.target.value });
                  }}
                  placeholder="例如：一定要流很多汗、很喘，才算有運動…"
                  rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  我想改成
                </div>
                <textarea
                  value={carePhrase}
                  onChange={(e) => {
                    setCarePhrase(e.target.value);
                    saveDraft({ carePhrase: e.target.value });
                  }}
                  placeholder="例如：身體是否更穩、更舒服、更能持續…"
                  rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
          )}

          {layout === "dual-signal" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  我平常最常用的感覺判斷
                </div>
                <textarea
                  value={feelingSignal}
                  onChange={(e) => {
                    setFeelingSignal(e.target.value);
                    saveDraft({ feelingSignal: e.target.value });
                  }}
                  placeholder="例如：今天有沒有流很多汗…"
                  rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                  我願意多看的一個身體訊號
                </div>
                <textarea
                  value={dataSignal}
                  onChange={(e) => {
                    setDataSignal(e.target.value);
                    saveDraft({ dataSignal: e.target.value });
                  }}
                  placeholder="例如：昨晚睡眠與運動後的疲勞感…"
                  rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
          )}

          {layout === "ground-snap" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 8 }}>
                今天我拍下的是
              </div>
              <input
                value={snapSource}
                onChange={(e) => {
                  setSnapSource(e.target.value);
                  saveDraft({ snapSource: e.target.value });
                }}
                placeholder="例如：健走後的步數與時間…"
                style={{ width: "100%", padding: "12px 14px", marginBottom: 10, borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={tryCameraInNuannuan} style={primaryOutlineBtnStyle}>
                  在暖暖拍一下 →
                </button>
                <button type="button" onClick={tryPhotoInNuannuan} style={secondaryBtnStyle}>
                  從相簿選畫面 →
                </button>
              </div>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 8 }}>
                一句低敏感提醒
              </div>
              <input
                value={softReminder}
                onChange={(e) => {
                  setSoftReminder(e.target.value);
                  saveDraft({ softReminder: e.target.value });
                }}
                placeholder="例如：這只是提醒，不是分數…"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          )}

          {layout === "week-rhythm" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {(chapter.weekRhythmLabels ?? ["第一句", "第二句", "第三句"]).map((label, i) => (
                <div key={i}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>
                    {label}
                  </div>
                  <textarea
                    value={rhythmLines[i]}
                    onChange={(e) => {
                      const next: [string, string, string] = [...rhythmLines];
                      next[i] = e.target.value;
                      setRhythmLines(next);
                      saveDraft({ lines: next } as unknown as Parameters<typeof saveDraft>[0]);
                    }}
                    placeholder={chapter.weekRhythmPlaceholders?.[i] ?? "寫下一句…"}
                    rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "kinetic-guide" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "我的運動目標是", value: guideGoal, key: "goal" as const, set: setGuideGoal, ph: "例如：穩定活動、舒服續航…" },
                { label: "我希望 AI 提醒我", value: guidePrefer, key: "prefer" as const, set: setGuidePrefer, ph: "例如：簡單、溫和、可執行…" },
                { label: "我希望 AI 避免", value: guideAvoid, key: "avoid" as const, set: setGuideAvoid, ph: "例如：命令式語氣、分數評價…" },
                { label: "我的安全邊界是", value: guideBoundary, key: "boundary" as const, set: setGuideBoundary, ph: "例如：不診斷；不適時停止並尋求專業建議…" },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>{f.label}</div>
                  <textarea
                    value={f.value}
                    onChange={(e) => {
                      f.set(e.target.value);
                      saveDraft({ [f.key]: e.target.value });
                    }}
                    placeholder={f.ph}
                    rows={2}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          )}

          {layout === "atr-light" && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>A｜自主光點</div>
                <textarea value={autonomyAction} onChange={(e) => { setAutonomyAction(e.target.value); saveDraft({ autonomyAction: e.target.value }); }}
                  placeholder="例如：節奏由我決定，不跟別人比流汗…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>T｜信賴光點</div>
                <textarea value={atrTrustAction} onChange={(e) => { setAtrTrustAction(e.target.value); saveDraft({ trustAction: e.target.value }); }}
                  placeholder="例如：願意看數據，但不把數字當成分數…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", marginBottom: 6 }}>R｜韌性光點</div>
                <textarea value={atrResilienceAction} onChange={(e) => { setAtrResilienceAction(e.target.value); saveDraft({ resilienceAction: e.target.value }); }}
                  placeholder="例如：不靠一天硬撐，用一週節奏穩定回來…" rows={2}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid var(--line-strong)", background: "var(--surface)", fontSize: "var(--fs-sm)", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              </div>
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
                <textarea value={replanSoftReminder} onChange={(e) => { setReplanSoftReminder(e.target.value); saveDraft({ softReminder: e.target.value }); }}
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
                  reflectLayout === "decision-start" ||
                  reflectLayout === "decision-seat" ||
                  reflectLayout === "source-ladder" ||
                  reflectLayout === "clause-translate" ||
                  reflectLayout === "life-baselines" ||
                  reflectLayout === "six-hats" ||
                  reflectLayout === "same-scale" ||
                  reflectLayout === "stress-test" ||
                  reflectLayout === "third-path" ||
                  reflectLayout === "pro-confirm" ||
                  reflectLayout === "decision-memo" ||
                  reflectLayout === "part4-start" ||
                  reflectLayout === "story-start" ||
                  reflectLayout === "theme-boundary" ||
                  reflectLayout === "three-clues" ||
                  reflectLayout === "three-color-check" ||
                  reflectLayout === "story-core" ||
                  reflectLayout === "voice-draft" ||
                  reflectLayout === "form-blueprint" ||
                  reflectLayout === "coedit-truth" ||
                  reflectLayout === "shared-memory" ||
                  reflectLayout === "heirloom-kit" ||
                  reflectLayout === "share-passport" ||
                  reflectLayout === "elevator-wish" ||
                  reflectLayout === "life-match" ||
                  reflectLayout === "five-reflect" ||
                  reflectLayout === "three-steps" ||
                  reflectLayout === "meaning-seed" ||
                  reflectLayout === "share-intent" ||
                  reflectLayout === "embark-card" ||
                  reflectLayout === "boundary-choose" ||
                  reflectLayout === "plan-b" ||
                  reflectLayout === "dual-track" ||
                  reflectLayout === "taste-journal" ||
                  reflectLayout === "ar-light" ||
                  reflectLayout === "verify-first" ||
                  reflectLayout === "pause-reflex" ||
                  reflectLayout === "rock-check" ||
                  reflectLayout === "muscle-record" ||
                  reflectLayout === "trust-lists" ||
                  reflectLayout === "list-entry" ||
                  reflectLayout === "family-weekly" ||
                  reflectLayout === "tr-light" ||
                  reflectLayout === "mindset-shift" ||
                  reflectLayout === "dual-signal" ||
                  reflectLayout === "ground-snap" ||
                  reflectLayout === "week-rhythm" ||
                  reflectLayout === "kinetic-guide" ||
                  reflectLayout === "atr-light" ||
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
              
              {layout === "decision-start" && chapter.decisionStartDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.decisionStartDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}><strong>選擇：</strong>{demo.choice}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>想看清：</strong>{demo.wantClear}</p>
                      <button type="button" onClick={() => applyDecisionStartDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "decision-seat" && chapter.decisionSeatDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.decisionSeatDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}><strong>真正問題：</strong>{demo.realQ}</p>
                      <button type="button" onClick={() => applyDecisionSeatDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "source-ladder" && chapter.sourceLadderDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.sourceLadderDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.sourceMeta}｜{demo.layer}</p>
                      <button type="button" onClick={() => applySourceLadderDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "clause-translate" && chapter.clauseTranslateDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.clauseTranslateDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.clauseSummary}</p>
                      <button type="button" onClick={() => applyClauseTranslateDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "life-baselines" && chapter.lifeBaselinesDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.lifeBaselinesDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>生活：</strong>{demo.life}</p>
                      <button type="button" onClick={() => applyLifeBaselinesDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "six-hats" && chapter.sixHatsDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.sixHatsDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>下一步：</strong>{demo.nextStep}</p>
                      <button type="button" onClick={() => applySixHatsDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "same-scale" && chapter.sameScaleDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.sameScaleDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>忽略的代價：</strong>{demo.ignoredCost}</p>
                      <button type="button" onClick={() => applySameScaleDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "stress-test" && chapter.stressTestDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.stressTestDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>出口：</strong>{demo.stopSignal}</p>
                      <button type="button" onClick={() => applyStressTestDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "third-path" && chapter.thirdPathDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.thirdPathDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>旋鈕：</strong>{demo.knob}｜{demo.newPlan}</p>
                      <button type="button" onClick={() => applyThirdPathDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "pro-confirm" && chapter.proConfirmDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.proConfirmDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.q1}</p>
                      <button type="button" onClick={() => applyProConfirmDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "decision-memo" && chapter.decisionMemoDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.decisionMemoDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>狀態：</strong>{demo.status}</p>
                      <button type="button" onClick={() => applyDecisionMemoDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              
              {layout === "part4-start" && chapter.part4StartDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.part4StartDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.wantComplete}</p>
                      <button type="button" onClick={() => applyPart4StartDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "story-start" && chapter.storyStartDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.storyStartDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.leaveWhat}</p>
                      <button type="button" onClick={() => applyStoryStartDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "theme-boundary" && chapter.themeBoundaryDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.themeBoundaryDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.wantKeep}</p>
                      <button type="button" onClick={() => applyThemeBoundaryDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "three-clues" && chapter.threeCluesDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.threeCluesDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.clue1}</p>
                      <button type="button" onClick={() => applyThreeCluesDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "three-color-check" && chapter.threeColorCheckDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.threeColorCheckDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.greenMark}</p>
                      <button type="button" onClick={() => applyThreeColorCheckDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "story-core" && chapter.storyCoreDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.storyCoreDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.leaveToday}</p>
                      <button type="button" onClick={() => applyStoryCoreDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "voice-draft" && chapter.voiceDraftDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.voiceDraftDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.voiceWords}</p>
                      <button type="button" onClick={() => applyVoiceDraftDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "form-blueprint" && chapter.formBlueprintDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.formBlueprintDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.formAudience}</p>
                      <button type="button" onClick={() => applyFormBlueprintDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "coedit-truth" && chapter.coeditTruthDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.coeditTruthDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.keepGreen}</p>
                      <button type="button" onClick={() => applyCoeditTruthDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "shared-memory" && chapter.sharedMemoryDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.sharedMemoryDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.whoSee}</p>
                      <button type="button" onClick={() => applySharedMemoryDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "heirloom-kit" && chapter.heirloomKitDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.heirloomKitDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}>{demo.cheer}</p>
                      <button type="button" onClick={() => applyHeirloomKitDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "share-passport" && chapter.sharePassportDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.sharePassportDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>狀態：</strong>{demo.status}</p>
                      <button type="button" onClick={() => applySharePassportDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}

              {layout === "elevator-wish" && chapter.elevatorDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.elevatorDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>我想要：</strong>{demo.want}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>我卡在：</strong>{demo.stuck}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>希望 AI：</strong>{demo.aiHelp}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyElevatorDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--primary)", background: "var(--surface)",
                        color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "life-match" && chapter.lifeMatchDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.lifeMatchDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#5BA0C9",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>卡點：</strong>{demo.painPoint}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>角色：</strong>
                        {chapter.lifeRoleOptions?.find((r) => r.id === demo.roleId)?.label ?? demo.roleId}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyLifeMatchDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid #5BA0C9", background: "var(--surface)",
                        color: "#5BA0C9", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "five-reflect" && chapter.fiveReflectDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.fiveReflectDemos.map((demo) => (
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
                        <strong>先支持：</strong>
                        {chapter.smartDirections?.find((d) => d.id === demo.focusId)?.label ?? demo.focusId}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}>
                        <strong>現況：</strong>
                        {Object.entries(demo.statuses).map(([k, v]) => `${k}:${v}`).join("；")}
                      </p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>下一步：</strong>{demo.nextStep}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyFiveReflectDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--primary)", background: "var(--surface)",
                        color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "three-steps" && chapter.threeStepsDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.threeStepsDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--sage)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>小事：</strong>{demo.task}</p>
                      <ol style={{ margin: "0 0 8px", paddingLeft: 20, fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>
                        {demo.steps.map((s, i) => (<li key={i}>{s}</li>))}
                      </ol>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyThreeStepsDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--sage)", background: "var(--surface)",
                        color: "var(--sage)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "meaning-seed" && chapter.meaningSeedDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.meaningSeedDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#E8845A",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>素材：</strong>{demo.material}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>形式：</strong>{demo.formHint}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>因為：</strong>{demo.because}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyMeaningSeedDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid #E8845A", background: "var(--surface)",
                        color: "#E8845A", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "share-intent" && chapter.shareIntentDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.shareIntentDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#5BA0C9",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>分享：</strong>{demo.shareWhat}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>幫助：</strong>{demo.forWhom}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>隱私：</strong>{demo.privacyNote}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyShareIntentDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid #5BA0C9", background: "var(--surface)",
                        color: "#5BA0C9", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "embark-card" && chapter.embarkDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.embarkDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)",
                      }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>方向：</strong>{demo.direction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>第一小步：</strong>{demo.firstStep}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>AI：</strong>{demo.aiHelp}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyEmbarkDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--primary)", background: "var(--surface)",
                        color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "boundary-choose" && chapter.boundaryChooseDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.boundaryChooseDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>不能：</strong>{demo.cannotLine}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>可選擇：</strong>{demo.canChooseLine}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyBoundaryChooseDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--primary)", background: "var(--surface)",
                        color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "plan-b" && chapter.planBDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.planBDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#E8845A" }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>場景：</strong>{demo.scene}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>底線：</strong>{demo.boundary}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>回歸：</strong>{demo.returnAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyPlanBDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid #E8845A", background: "var(--surface)",
                        color: "#E8845A", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "dual-track" && chapter.dualTrackDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.dualTrackDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--sage)" }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>身體軌：</strong>{demo.bodyTrack}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>靈魂軌：</strong>{demo.soulTrack}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyDualTrackDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--sage)", background: "var(--surface)",
                        color: "var(--sage)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "taste-journal" && chapter.tasteJournalDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.tasteJournalDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#5BA0C9" }}>
                        {demo.label}
                      </div>
                      <ol style={{ margin: "0 0 8px", paddingLeft: 20, fontSize: "var(--fs-xs)", color: "var(--ink-2)" }}>
                        {demo.lines.map((line, i) => (<li key={i}>{line}</li>))}
                      </ol>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>保留：</strong>{demo.keepPractice}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyTasteJournalDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid #5BA0C9", background: "var(--surface)",
                        color: "#5BA0C9", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "ar-light" && chapter.arLightDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.arLightDemos.map((demo) => (
                    <div key={demo.id} style={{
                      padding: 14, borderRadius: 12,
                      background: "var(--surface-warm)", border: "1px solid var(--line)",
                    }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>
                        {demo.label}
                      </div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>A：</strong>{demo.agencyAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>R：</strong>{demo.resilienceAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyArLightDemo(demo)} style={{
                        padding: "8px 14px", borderRadius: "var(--r-pill)",
                        border: "1px solid var(--primary)", background: "var(--surface)",
                        color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer",
                      }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "verify-first" && chapter.verifyFirstDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.verifyFirstDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>先：</strong>{demo.firstAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>再：</strong>{demo.thenAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyVerifyFirstDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "pause-reflex" && chapter.pauseReflexDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.pauseReflexDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8 }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>練習：</strong>{chapter.pauseReflexOptions?.find((o) => o.id === demo.focusId)?.label ?? demo.focusId}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyPauseReflexDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "rock-check" && chapter.rockCheckDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.rockCheckDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "#E8845A" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>模擬：</strong>{demo.scenario}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>疑點：</strong>{demo.flags.join("；")}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>安全：</strong>{demo.safeAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyRockCheckDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid #E8845A", background: "var(--surface)", color: "#E8845A", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "muscle-record" && chapter.muscleRecordDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.muscleRecordDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8 }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>話術：</strong>{demo.scamPattern}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>動作：</strong>{demo.safeAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyMuscleRecordDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "trust-lists" && chapter.trustListsDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.trustListsDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8 }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>黑：</strong>{demo.blackSummary}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>白：</strong>{demo.whiteSummary}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyTrustListsDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "list-entry" && chapter.listEntryDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.listEntryDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8 }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>類型：</strong>{demo.entryType}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>特徵：</strong>{demo.features}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>安全：</strong>{demo.safeAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyListEntryDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "family-weekly" && chapter.familyWeeklyDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.familyWeeklyDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8 }}>{demo.label}</div>
                      <ol style={{ margin: "0 0 8px", paddingLeft: 20, fontSize: "var(--fs-xs)" }}>{demo.lines.map((l, i) => (<li key={i}>{l}</li>))}</ol>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyFamilyWeeklyDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "tr-light" && chapter.trLightDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.trLightDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8 }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>T：</strong>{demo.trustAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>R：</strong>{demo.resilienceAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px", color: "var(--ink-2)" }}>{demo.reflectNote}</p>
                      <button type="button" onClick={() => applyTrLightDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "mindset-shift" && chapter.mindsetShiftDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.mindsetShiftDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}><strong>壓力句：</strong>{demo.pressurePhrase}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>保養句：</strong>{demo.carePhrase}</p>
                      <button type="button" onClick={() => applyMindsetShiftDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "dual-signal" && chapter.dualSignalDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.dualSignalDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}><strong>感覺：</strong>{demo.feelingSignal}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>多看：</strong>{demo.dataSignal}</p>
                      <button type="button" onClick={() => applyDualSignalDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "ground-snap" && chapter.groundSnapDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.groundSnapDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 6px" }}><strong>拍下：</strong>{demo.snapSource}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>提醒：</strong>{demo.softReminder}</p>
                      <button type="button" onClick={() => applyGroundSnapDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "week-rhythm" && chapter.weekRhythmDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.weekRhythmDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <ol style={{ margin: "0 0 10px", paddingLeft: 20, fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55 }}>
                        {demo.lines.map((line, i) => (<li key={i}>{line}</li>))}
                      </ol>
                      <button type="button" onClick={() => applyWeekRhythmDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "kinetic-guide" && chapter.kineticGuideDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.kineticGuideDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>目標：</strong>{demo.goal}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>提醒：</strong>{demo.prefer}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>避免：</strong>{demo.avoid}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>邊界：</strong>{demo.boundary}</p>
                      <button type="button" onClick={() => applyKineticGuideDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
                    </div>
                  ))}
                </div>
              )}
              {layout === "atr-light" && chapter.atrLightDemos && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {chapter.atrLightDemos.map((demo) => (
                    <div key={demo.id} style={{ padding: 14, borderRadius: 12, background: "var(--surface-warm)", border: "1px solid var(--line)" }}>
                      <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)", marginBottom: 8, color: "var(--primary-deep)" }}>{demo.label}</div>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>A：</strong>{demo.autonomyAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 4px" }}><strong>T：</strong>{demo.trustAction}</p>
                      <p style={{ fontSize: "var(--fs-xs)", margin: "0 0 10px" }}><strong>R：</strong>{demo.resilienceAction}</p>
                      <button type="button" onClick={() => applyAtrLightDemo(demo)} style={{ padding: "8px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-deep)", fontWeight: 700, fontSize: "var(--fs-xs)", cursor: "pointer" }}>帶入這則案例</button>
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
          dsChoice={dsChoice}
          dsLifeImpact={dsLifeImpact}
          dsWantClear={dsWantClear}
          seatSurfaceQ={seatSurfaceQ}
          seatKnown={seatKnown}
          seatExpect={seatExpect}
          seatRealQ={seatRealQ}
          seatMustKeep={seatMustKeep}
          srcMeta={srcMeta}
          srcLayer={srcLayer}
          srcConfirms={srcConfirms}
          srcCannot={srcCannot}
          srcToCheck={srcToCheck}
          clauseSummary={clauseSummary}
          clausePayLimit={clausePayLimit}
          clauseLifeUnknown={clauseLifeUnknown}
          baseSafety={baseSafety}
          baseLife={baseLife}
          baseRel={baseRel}
          hatsToCheck={hatsToCheck}
          hatsNext={hatsNext}
          hatsReview={hatsReview}
          scaleOptions={scaleOptions}
          scaleNotes={scaleNotes}
          scaleIgnored={scaleIgnored}
          stressWorst={stressWorst}
          stressStop={stressStop}
          stressPro={stressPro}
          thirdStalemate={thirdStalemate}
          thirdKnob={thirdKnob}
          thirdPlan={thirdPlan}
          proQ1={proQ1}
          proQ2={proQ2}
          proQ3={proQ3}
          memoStatus={memoStatus}
          memoReason={memoReason}
          memoPending={memoPending}
          p4Want={p4Want}
          p4Meaning={p4Meaning}
          p4Who={p4Who}
          p4Distance={p4Distance}
          ssLeave={ssLeave}
          ssHope={ssHope}
          ssStatus={ssStatus}
          tbKeep={tbKeep}
          tbPrivate={tbPrivate}
          tbNotTouch={tbNotTouch}
          tbStart={tbStart}
          tc1={tc1}
          tc2={tc2}
          tc3={tc3}
          tcolRed={tcolRed}
          tcolYellow={tcolYellow}
          tcolGreen={tcolGreen}
          scFaced={scFaced}
          scChose={scChose}
          scLeave={scLeave}
          vdStart={vdStart}
          vdChange={vdChange}
          vdWords={vdWords}
          fbForm={fbForm}
          fbMaterials={fbMaterials}
          fbMin={fbMin}
          ceRed={ceRed}
          ceYellow={ceYellow}
          ceGreen={ceGreen}
          smWho={smWho}
          smPresent={smPresent}
          smAdjust={smAdjust}
          hkCheck={hkCheck}
          hkOpen={hkOpen}
          hkCheer={hkCheer}
          spStatus={spStatus}
          spIntent={spIntent}
          spWithdraw={spWithdraw}
          wishWant={wishWant}
          wishStuck={wishStuck}
          wishAiHelp={wishAiHelp}
          lifePainPoint={lifePainPoint}
          lifeRoleId={lifeRoleId}
          fiveStatuses={fiveStatuses}
          fiveNextStep={fiveNextStep}
          lifeTask={lifeTask}
          lifeSteps={lifeSteps}
          seedMaterial={seedMaterial}
          seedForm={seedForm}
          seedBecause={seedBecause}
          shareWhat={shareWhat}
          shareForWhom={shareForWhom}
          sharePrivacy={sharePrivacy}
          embarkDirection={embarkDirection}
          embarkFirstStep={embarkFirstStep}
          embarkAiHelp={embarkAiHelp}
          cannotLine={cannotLine}
          canChooseLine={canChooseLine}
          planScene={planScene}
          planBoundary={planBoundary}
          planReturn={planReturn}
          bodyTrack={bodyTrack}
          soulTrack={soulTrack}
          journalLines={journalLines}
          keepPractice={keepPractice}
          agencyAction={agencyAction}
          resilienceAction={resilienceAction}
          firstAction={firstAction}
          thenAction={thenAction}
          rockScenario={rockScenario}
          rockFlags={rockFlags}
          rockSafeAction={rockSafeAction}
          scamPattern={scamPattern}
          muscleSafeAction={muscleSafeAction}
          blackSummary={blackSummary}
          whiteSummary={whiteSummary}
          entryType={entryType}
          entryFeatures={entryFeatures}
          entrySafeAction={entrySafeAction}
          familyLines={familyLines}
          trustAction={trustAction}
          trResilienceAction={trResilienceAction}
          pressurePhrase={pressurePhrase}
          carePhrase={carePhrase}
          feelingSignal={feelingSignal}
          dataSignal={dataSignal}
          snapSource={snapSource}
          softReminder={softReminder}
          rhythmLines={rhythmLines}
          guideGoal={guideGoal}
          guidePrefer={guidePrefer}
          guideAvoid={guideAvoid}
          guideBoundary={guideBoundary}
          autonomyAction={autonomyAction}
          atrTrustAction={atrTrustAction}
          atrResilienceAction={atrResilienceAction}
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
          replanSoftReminder={replanSoftReminder}
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
  dsChoice = "",
  dsLifeImpact = "",
  dsWantClear = "",
  seatSurfaceQ = "",
  seatKnown = "",
  seatExpect = "",
  seatRealQ = "",
  seatMustKeep = "",
  srcMeta = "",
  srcLayer = "",
  srcConfirms = "",
  srcCannot = "",
  srcToCheck = "",
  clauseSummary = "",
  clausePayLimit = "",
  clauseLifeUnknown = "",
  baseSafety = "",
  baseLife = "",
  baseRel = "",
  hatsToCheck = "",
  hatsNext = "",
  hatsReview = "",
  scaleOptions = "",
  scaleNotes = "",
  scaleIgnored = "",
  stressWorst = "",
  stressStop = "",
  stressPro = "",
  thirdStalemate = "",
  thirdKnob = "",
  thirdPlan = "",
  proQ1 = "",
  proQ2 = "",
  proQ3 = "",
  memoStatus = "",
  memoReason = "",
  memoPending = "",
  p4Want = "",
  p4Meaning = "",
  p4Who = "",
  p4Distance = "",
  ssLeave = "",
  ssHope = "",
  ssStatus = "",
  tbKeep = "",
  tbPrivate = "",
  tbNotTouch = "",
  tbStart = "",
  tc1 = "",
  tc2 = "",
  tc3 = "",
  tcolRed = "",
  tcolYellow = "",
  tcolGreen = "",
  scFaced = "",
  scChose = "",
  scLeave = "",
  vdStart = "",
  vdChange = "",
  vdWords = "",
  fbForm = "",
  fbMaterials = "",
  fbMin = "",
  ceRed = "",
  ceYellow = "",
  ceGreen = "",
  smWho = "",
  smPresent = "",
  smAdjust = "",
  hkCheck = "",
  hkOpen = "",
  hkCheer = "",
  spStatus = "",
  spIntent = "",
  spWithdraw = "",
  wishWant = "",
  wishStuck = "",
  wishAiHelp = "",
  lifePainPoint = "",
  lifeRoleId = "",
  fiveStatuses = {},
  fiveNextStep = "",
  lifeTask = "",
  lifeSteps = ["", "", ""],
  seedMaterial = "",
  seedForm = "",
  seedBecause = "",
  shareWhat = "",
  shareForWhom = "",
  sharePrivacy = "",
  embarkDirection = "",
  embarkFirstStep = "",
  embarkAiHelp = "",
  cannotLine = "",
  canChooseLine = "",
  planScene = "",
  planBoundary = "",
  planReturn = "",
  bodyTrack = "",
  soulTrack = "",
  journalLines = ["", "", "", ""],
  keepPractice = "",
  agencyAction = "",
  resilienceAction = "",
  firstAction = "",
  thenAction = "",
  rockScenario = "",
  rockFlags = ["", "", ""],
  rockSafeAction = "",
  scamPattern = "",
  muscleSafeAction = "",
  blackSummary = "",
  whiteSummary = "",
  entryType = "",
  entryFeatures = "",
  entrySafeAction = "",
  familyLines = ["", "", ""],
  trustAction = "",
  trResilienceAction = "",
  pressurePhrase = "",
  carePhrase = "",
  feelingSignal = "",
  dataSignal = "",
  snapSource = "",
  softReminder = "",
  rhythmLines = ["", "", ""],
  guideGoal = "",
  guidePrefer = "",
  guideAvoid = "",
  guideBoundary = "",
  autonomyAction = "",
  atrTrustAction = "",
  atrResilienceAction = "",
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
  replanSoftReminder = "",
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
  dsChoice?: string;
  dsLifeImpact?: string;
  dsWantClear?: string;
  seatSurfaceQ?: string;
  seatKnown?: string;
  seatExpect?: string;
  seatRealQ?: string;
  seatMustKeep?: string;
  srcMeta?: string;
  srcLayer?: string;
  srcConfirms?: string;
  srcCannot?: string;
  srcToCheck?: string;
  clauseSummary?: string;
  clausePayLimit?: string;
  clauseLifeUnknown?: string;
  baseSafety?: string;
  baseLife?: string;
  baseRel?: string;
  hatsToCheck?: string;
  hatsNext?: string;
  hatsReview?: string;
  scaleOptions?: string;
  scaleNotes?: string;
  scaleIgnored?: string;
  stressWorst?: string;
  stressStop?: string;
  stressPro?: string;
  thirdStalemate?: string;
  thirdKnob?: string;
  thirdPlan?: string;
  proQ1?: string;
  proQ2?: string;
  proQ3?: string;
  memoStatus?: string;
  memoReason?: string;
  memoPending?: string;
  p4Want?: string;
  p4Meaning?: string;
  p4Who?: string;
  p4Distance?: string;
  ssLeave?: string;
  ssHope?: string;
  ssStatus?: string;
  tbKeep?: string;
  tbPrivate?: string;
  tbNotTouch?: string;
  tbStart?: string;
  tc1?: string;
  tc2?: string;
  tc3?: string;
  tcolRed?: string;
  tcolYellow?: string;
  tcolGreen?: string;
  scFaced?: string;
  scChose?: string;
  scLeave?: string;
  vdStart?: string;
  vdChange?: string;
  vdWords?: string;
  fbForm?: string;
  fbMaterials?: string;
  fbMin?: string;
  ceRed?: string;
  ceYellow?: string;
  ceGreen?: string;
  smWho?: string;
  smPresent?: string;
  smAdjust?: string;
  hkCheck?: string;
  hkOpen?: string;
  hkCheer?: string;
  spStatus?: string;
  spIntent?: string;
  spWithdraw?: string;
  wishWant?: string;
  wishStuck?: string;
  wishAiHelp?: string;
  lifePainPoint?: string;
  lifeRoleId?: string;
  fiveStatuses?: Record<string, string>;
  fiveNextStep?: string;
  lifeTask?: string;
  lifeSteps?: [string, string, string];
  seedMaterial?: string;
  seedForm?: string;
  seedBecause?: string;
  shareWhat?: string;
  shareForWhom?: string;
  sharePrivacy?: string;
  embarkDirection?: string;
  embarkFirstStep?: string;
  embarkAiHelp?: string;
  cannotLine?: string;
  canChooseLine?: string;
  planScene?: string;
  planBoundary?: string;
  planReturn?: string;
  bodyTrack?: string;
  soulTrack?: string;
  journalLines?: [string, string, string, string];
  keepPractice?: string;
  agencyAction?: string;
  resilienceAction?: string;
  firstAction?: string;
  thenAction?: string;
  rockScenario?: string;
  rockFlags?: [string, string, string];
  rockSafeAction?: string;
  scamPattern?: string;
  muscleSafeAction?: string;
  blackSummary?: string;
  whiteSummary?: string;
  entryType?: string;
  entryFeatures?: string;
  entrySafeAction?: string;
  familyLines?: [string, string, string];
  trustAction?: string;
  trResilienceAction?: string;
  pressurePhrase?: string;
  carePhrase?: string;
  feelingSignal?: string;
  dataSignal?: string;
  snapSource?: string;
  softReminder?: string;
  rhythmLines?: [string, string, string];
  guideGoal?: string;
  guidePrefer?: string;
  guideAvoid?: string;
  guideBoundary?: string;
  autonomyAction?: string;
  atrTrustAction?: string;
  atrResilienceAction?: string;
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
  replanSoftReminder?: string;
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

  if ((layout as string) === "decision-start") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="重要選擇" minHeight={48}>{dsChoice || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="真正影響的生活" minHeight={48}>{dsLifeImpact || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="今天最想看清楚" minHeight={48}>{dsWantClear || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "decision-seat") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="表面問題／已知未知" minHeight={48}>{(seatSurfaceQ || "＿＿") + "／" + (seatKnown || "＿＿")}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="真正問題" minHeight={48}>{seatRealQ || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="最不能犧牲" minHeight={48}>{seatMustKeep || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "source-ladder") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="資料／層級" minHeight={48}>{(srcMeta || "＿＿") + "／" + (srcLayer || "＿＿")}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="可確認／不能證明" minHeight={48}>{(srcConfirms || "＿＿") + "／" + (srcCannot || "＿＿")}</PrintGridCell></div>
        <PrintGridCell title="待補查" minHeight={40}>{srcToCheck || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "clause-translate") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="條款要旨" minHeight={48}>{clauseSummary || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="費用／限制" minHeight={48}>{clausePayLimit || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="生活後果／待確認" minHeight={48}>{clauseLifeUnknown || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "life-baselines") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="安全底線" minHeight={48}>{baseSafety || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="生活底線" minHeight={48}>{baseLife || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="關係底線" minHeight={48}>{baseRel || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "six-hats") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="待查事項" minHeight={48}>{hatsToCheck || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="下一小步" minHeight={40}>{hatsNext || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="重看日" minHeight={40}>{hatsReview || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "same-scale") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="三條路" minHeight={40}>{scaleOptions || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="四項尺度" minHeight={48}>{scaleNotes || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="忽略的代價" minHeight={48}>{scaleIgnored || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "stress-test") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="最不利情況" minHeight={48}>{stressWorst || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="停止條件" minHeight={48}>{stressStop || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="專業確認" minHeight={40}>{stressPro || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "third-path") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="僵局" minHeight={48}>{thirdStalemate || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="旋鈕" minHeight={40}>{thirdKnob || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="新方案／重看條件" minHeight={48}>{thirdPlan || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "pro-confirm") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="問題 1" minHeight={40}>{proQ1 || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="問題 2" minHeight={40}>{proQ2 || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="問題 3" minHeight={40}>{proQ3 || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "decision-memo") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="目前狀態" minHeight={40}>{memoStatus || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="理由／底線" minHeight={48}>{memoReason || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="待確認／重看" minHeight={48}>{memoPending || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }


  if ((layout as string) === "part4-start") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="想完成的作品" minHeight={48}>{p4Want || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="生命意義" minHeight={48}>{p4Meaning || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="分享對象／距離" minHeight={48}>{(p4Who || "＿＿") + "／" + (p4Distance || "＿＿")}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "story-start") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="想留下的事" minHeight={48}>{ssLeave || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="希望感受到" minHeight={48}>{ssHope || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="保存狀態" minHeight={40}>{ssStatus || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "theme-boundary") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="想留下" minHeight={40}>{tbKeep || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="只供珍藏" minHeight={40}>{tbPrivate || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="暫時不碰" minHeight={40}>{tbNotTouch || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="今天開始" minHeight={40}>{tbStart || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "three-clues") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="線索一" minHeight={48}>{tc1 || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="線索二" minHeight={48}>{tc2 || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="線索三" minHeight={48}>{tc3 || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "three-color-check") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="紅標" minHeight={48}>{tcolRed || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="黃標" minHeight={48}>{tcolYellow || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="綠標" minHeight={48}>{tcolGreen || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "story-core") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="面對" minHeight={48}>{scFaced || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="選擇" minHeight={48}>{scChose || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="今天留下" minHeight={48}>{scLeave || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "voice-draft") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="怎麼開始" minHeight={48}>{vdStart || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="改變時刻" minHeight={48}>{vdChange || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="原聲詞語" minHeight={40}>{vdWords || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "form-blueprint") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="形式／受眾" minHeight={48}>{fbForm || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="材料" minHeight={48}>{fbMaterials || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="最小完成版" minHeight={48}>{fbMin || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "coedit-truth") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="查紅" minHeight={48}>{ceRed || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="問黃" minHeight={48}>{ceYellow || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="留綠" minHeight={48}>{ceGreen || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "shared-memory") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="誰／給誰看" minHeight={48}>{smWho || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="如何呈現" minHeight={48}>{smPresent || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="調整／撤回" minHeight={48}>{smAdjust || "＿＿＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "heirloom-kit") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="五件套" minHeight={48}>{hkCheck || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="開啟測試" minHeight={40}>{hkOpen || "＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="喝采" minHeight={40}>{hkCheer || "＿＿＿＿"}</PrintGridCell>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "share-passport") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="目前狀態" minHeight={40}>{spStatus || "＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="心意／期限" minHeight={48}>{spIntent || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="撤回方式" minHeight={48}>{spWithdraw || "＿＿＿＿＿＿"}</PrintGridCell>
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

  if (layout === "elevator-wish") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="我想要" minHeight={48}>{wishWant || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="我卡在" minHeight={48}>{wishStuck || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="希望 AI 先幫我" minHeight={48}>{wishAiHelp || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="我想前往的方向" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "life-match") {
    const roleLabel = chapter.lifeRoleOptions?.find((r) => r.id === lifeRoleId)?.label ?? lifeRoleId;
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="生活卡點" minHeight={64}>{lifePainPoint || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="需要的角色" minHeight={48}>{roleLabel || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="希望先安頓的事" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "five-reflect") {
    const focusLabel = chapter.smartDirections?.find((d) => d.id === picked)?.label ?? picked ?? "";
    const statusLines = (chapter.smartDirections ?? [])
      .map((d) => `${d.letter} ${d.label}：${fiveStatuses[d.id] || "＿＿＿"}`)
      .join("\n");
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="五方向現況／選擇" minHeight={120}>
          <pre style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap" }}>
            {statusLines || focusLabel || "＿＿＿＿＿＿＿＿＿＿"}
          </pre>
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="最想先支持" minHeight={48}>{focusLabel || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="最小步驟／溫柔下一步" minHeight={64}>
          {fiveNextStep || reflectNote || "＿＿＿＿＿＿＿＿＿＿"}
        </PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "three-steps") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="想過順的小事" minHeight={48}>{lifeTask || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="三個步驟" minHeight={96}>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(lifeSteps.some(Boolean) ? lifeSteps : ["＿＿＿", "＿＿＿", "＿＿＿"]).map((s, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{s || "＿＿＿"}</li>
              ))}
            </ol>
          </PrintGridCell>
        </div>
        <PrintGridCell title="最有餘裕的一步" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "meaning-seed") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="生命素材" minHeight={48}>{seedMaterial || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="作品形式" minHeight={48}>{seedForm || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="我想留下它，因為" minHeight={64}>{seedBecause || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="想留給誰／回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "share-intent") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="願意分享" minHeight={64}>{shareWhat || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="希望幫助誰" minHeight={48}>{shareForWhom || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="仍想保留的隱私" minHeight={48}>{sharePrivacy || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="希望帶來的幫助" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "embark-card") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="我的方向" minHeight={48}>{embarkDirection || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="第一小步" minHeight={48}>{embarkFirstStep || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="希望 AI 協助的方式" minHeight={48}>{embarkAiHelp || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="出發的小事" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "boundary-choose") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="原本的「不能吃」" minHeight={48}>{cannotLine || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="我可以有底線地選擇" minHeight={64}>{canChooseLine || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="我的重要底線" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "plan-b") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="場景" minHeight={48}>{planScene || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="底線" minHeight={48}>{planBoundary || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="回歸小動作" minHeight={48}>{planReturn || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="享受後仍自在的做法" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "dual-track") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="身體軌" minHeight={72}>{bodyTrack || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="靈魂軌" minHeight={72}>{soulTrack || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="最能幫助 AI 不越界的資訊" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "taste-journal") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="四句回顧" minHeight={120}>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {(journalLines.some(Boolean) ? journalLines : ["＿＿＿", "＿＿＿", "＿＿＿", "＿＿＿"]).map((line, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{line || "＿＿＿"}</li>
            ))}
          </ol>
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="下週想保留" minHeight={48}>{keepPractice || "＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="最能代表自主或韌性的一刻" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "ar-light") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
          {chapter.printCardTitle} · QR {chapter.qrCode}
        </h1>
        {chapter.quote && (
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>
        )}
        <PrintGridCell title="A｜自主小動作" minHeight={64}>{agencyAction || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="R｜韌性小動作" minHeight={64}>{resilienceAction || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="哪一盞已亮／下一步" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "verify-first") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="我願意先" minHeight={48}>{firstAction || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="再" minHeight={48}>{thenAction || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="容易忘記查證的情境" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "pause-reflex") {
    const focusLabel = chapter.pauseReflexOptions?.find((o) => o.id === picked)?.label ?? picked ?? "";
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="不點／不回／不輸入" minHeight={64}>先截圖，後提問；沒確認前，絕不點擊。</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="我最需要練習" minHeight={48}>{focusLabel || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "rock-check") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="模擬訊息" minHeight={64}>{rockScenario || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="三個疑點" minHeight={72}>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {(rockFlags.some(Boolean) ? rockFlags : ["＿＿＿", "＿＿＿", "＿＿＿"]).map((f, i) => (
                <li key={i}>{f || "＿＿＿"}</li>
              ))}
            </ol>
          </PrintGridCell>
        </div>
        <PrintGridCell title="安全確認方式" minHeight={64}>{rockSafeAction || reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "muscle-record") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="已能辨識的話術" minHeight={48}>{scamPattern || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="安全動作" minHeight={48}>{muscleSafeAction || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="一眼認出的警訊" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "trust-lists") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="黑名單摘要" minHeight={64}>{blackSummary || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="白名單摘要" minHeight={64}>{whiteSummary || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="可記／絕不可記" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "list-entry") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="類型／對象" minHeight={48}>{entryType || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="特徵／確認方式" minHeight={64}>{entryFeatures || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="安全動作" minHeight={48}>{entrySafeAction || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "family-weekly") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="三句低風險週報" minHeight={96}>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {(familyLines.some(Boolean) ? familyLines : ["＿＿＿", "＿＿＿", "＿＿＿"]).map((l, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{l || "＿＿＿"}</li>
            ))}
          </ol>
        </PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="溫和提醒方式" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if (layout === "tr-light") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="T｜信賴光點" minHeight={64}>{trustAction || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="R｜韌性／安全光點" minHeight={64}>{trResilienceAction || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="想帶進日常的心法" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "mindset-shift") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="我不想再只用這句判斷" minHeight={64}>{pressurePhrase || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="我想改成" minHeight={64}>{carePhrase || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "dual-signal") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="最常用的感覺判斷" minHeight={64}>{feelingSignal || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="願意多看的訊號" minHeight={64}>{dataSignal || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        </div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "ground-snap") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="今天拍下的是" minHeight={48}>{snapSource || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}>
          <PrintGridCell title="低敏感提醒" minHeight={48}>{softReminder || "這只是提醒，不是分數"}</PrintGridCell>
        </div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "week-rhythm") {
    const labels = chapter.weekRhythmLabels ?? ["第一句", "第二句", "第三句"];
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        {labels.map((label, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <PrintGridCell title={label} minHeight={56}>{rhythmLines[i] || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
          </div>
        ))}
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "kinetic-guide") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="運動目標" minHeight={48}>{guideGoal || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="希望 AI 提醒" minHeight={48}>{guidePrefer || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="希望 AI 避免" minHeight={48}>{guideAvoid || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="安全邊界" minHeight={48}>{guideBoundary || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "atr-light") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="A｜自主光點" minHeight={48}>{autonomyAction || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="T｜信賴光點" minHeight={48}>{atrTrustAction || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="R｜韌性光點" minHeight={48}>{atrResilienceAction || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="想帶進日常" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
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

  if ((layout as string) === "city-radius") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="我想重新打開的城市角落" minHeight={48}>{cityPlace || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="它對我的生活意義" minHeight={48}>{cityMeaning || "＿＿＿＿＿＿"}</PrintGridCell></div>
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
        <PrintGridCell title="從哪裡出發" minHeight={40}>{fromPlace || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="想到哪裡" minHeight={40}>{toPlace || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="休息點" minHeight={40}>{restPoint || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="備案" minHeight={40}>{rehearsalBackup || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="需向官方確認" minHeight={40}>{officialCheck || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "moment-place") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="我想安放的活動" minHeight={40}>{momentActivity || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="出門時間" minHeight={32}>{departAt || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="抵達時間（含緩衝）" minHeight={32}>{arriveAt || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="休息時刻" minHeight={32}>{restAt || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回程時間" minHeight={32}>{returnAt || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "pass-prep") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="票券或通行資訊在" minHeight={40}>{ticketWhere || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="開啟方式" minHeight={40}>{openHow || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="官方來源" minHeight={40}>{officialSource || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="備案" minHeight={40}>{passBackup || "＿＿＿＿＿＿"}</PrintGridCell></div>
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
        <PrintGridCell title="我想去的地方" minHeight={40}>{safeDestination || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="路線／出口提醒" minHeight={40}>{routeNote || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="安心休息點" minHeight={40}>{restSpot || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="備案" minHeight={40}>{cornerBackup || "＿＿＿＿＿＿"}</PrintGridCell></div>
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
        <PrintGridCell title="我喜歡的活動類型" minHeight={40}>{activityType || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="可接受的時間長度" minHeight={40}>{activityDuration || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="休息方式" minHeight={40}>{restStyle || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="交通偏好" minHeight={40}>{transitPref || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="同行偏好" minHeight={40}>{companion || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell></div>
        <p style={{ fontSize: 12, color: "#666" }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "elegant-replan") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="如果這個變數發生" minHeight={40}>{replanTrigger || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="備案 A" minHeight={40}>{planA || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="備案 B" minHeight={40}>{planB || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="一句不硬撐提醒" minHeight={40}>{replanSoftReminder || "＿＿＿＿＿＿"}</PrintGridCell></div>
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
        <PrintGridCell title="今天我看見的是" minHeight={48}>{sawNote || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="今天的感受" minHeight={48}>{feltNote || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="想帶回生活裡的一件小事" minHeight={48}>{bringHome || "＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
      </div>
    );
  }

  if ((layout as string) === "city-lights") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>{chapter.printCardTitle} · QR {chapter.qrCode}</h1>
        {chapter.quote && (<p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{chapter.quote}</p>)}
        <PrintGridCell title="安排光點" minHeight={40}>{lightArrange || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="查證光點" minHeight={40}>{lightVerify || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="重排光點" minHeight={40}>{lightReplan || "＿＿＿＿＿＿"}</PrintGridCell>
        <div style={{ margin: "12px 0" }}><PrintGridCell title="留下光點" minHeight={40}>{lightKeep || "＿＿＿＿＿＿"}</PrintGridCell></div>
        <PrintGridCell title="回望" minHeight={64}>{reflectNote || "＿＿＿＿＿＿＿＿＿＿"}</PrintGridCell>
        <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>掃碼網址：{origin}/smart/chapter/{chapter.id}</p>
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

/** 一點開 Gemini／ChatGPT，方便用書本範例在外部 AI 練習 */
function ExternalAiPracticeRow({
  onTry,
}: {
  onTry: (provider: ExternalAiProvider) => void;
}) {
  return (
    <div style={{
      marginTop: 4,
      padding: "12px 14px",
      borderRadius: 12,
      background: "linear-gradient(135deg, #EEF6FF 0%, #FFF8F0 100%)",
      border: "1px solid var(--line)",
    }}>
      <div style={{
        fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-2)",
        marginBottom: 8, lineHeight: 1.45,
      }}>
        一點開外部 AI 練習同一句
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          type="button"
          onClick={() => onTry("gemini")}
          style={{
            padding: "12px 10px",
            background: "var(--surface)",
            border: "2px solid #5B8DEF",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "var(--fs-sm)",
            color: "#3D6BC7",
            cursor: "pointer",
          }}
        >
          用 Gemini 試
        </button>
        <button
          type="button"
          onClick={() => onTry("chatgpt")}
          style={{
            padding: "12px 10px",
            background: "var(--surface)",
            border: "2px solid #10A37F",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "var(--fs-sm)",
            color: "#0D8A6A",
            cursor: "pointer",
          }}
        >
          用 ChatGPT 試
        </button>
      </div>
      <p style={{
        margin: "8px 0 0",
        fontSize: "var(--fs-xs)",
        color: "var(--ink-3)",
        lineHeight: 1.45,
      }}>
        ChatGPT 通常會帶入文字；Gemini 請貼上後送出。兩者都會先幫您複製範例。
      </p>
    </div>
  );
}
