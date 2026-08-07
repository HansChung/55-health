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
  buildDecisionSeatPrompt,
  buildSixHatsPrompt,
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
        ChapterDecisionMemoDraft
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
                  reflectLayout === "decision-memo"
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
