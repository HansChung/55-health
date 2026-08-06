"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubPage } from "@/components/sub-page";
import {
  FRAUD_PAUSE_RULES,
  FRAUD_SENSITIVE_REMINDER,
  buildFraudRockAskPrompt,
  createFraudListItem,
  loadFraudGuardState,
  saveFraudGuardState,
  type FraudGuardState,
  type FraudListItem,
} from "@/lib/fraud-guard";
import { saveChapterSparkSeed } from "@/lib/chapter-opening";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/telemetry";

export function FraudGuardScreen() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<FraudGuardState>({ blacklist: [], whitelist: [] });
  const [scenario, setScenario] = useState("");
  const [flags, setFlags] = useState<[string, string, string]>(["", "", ""]);
  const [safeAction, setSafeAction] = useState("");
  const [blackForm, setBlackForm] = useState({ title: "", features: "", safeAction: "" });
  const [whiteForm, setWhiteForm] = useState({ title: "", features: "", safeAction: "" });

  useEffect(() => {
    const loaded = loadFraudGuardState();
    setState(loaded);
    if (loaded.rock) {
      setScenario(loaded.rock.scenario);
      setFlags(loaded.rock.flags);
      setSafeAction(loaded.rock.safeAction);
    }
  }, []);

  const persist = (next: FraudGuardState) => {
    setState(next);
    saveFraudGuardState(next);
  };

  const saveRock = () => {
    const next = {
      ...state,
      rock: { scenario, flags, safeAction },
    };
    persist(next);
    toast.success("已在本機保存 ROCK 查證練習。");
    trackEvent("fraud_rock_save", {});
  };

  const addItem = (kind: "blacklist" | "whitelist") => {
    const form = kind === "blacklist" ? blackForm : whiteForm;
    if (!form.title.trim()) {
      toast.info("請先寫下類型或對象名稱。");
      return;
    }
    const item = createFraudListItem(kind, form.title, form.features, form.safeAction);
    const next: FraudGuardState = {
      ...state,
      [kind]: [item, ...state[kind]].slice(0, 50),
    };
    persist(next);
    if (kind === "blacklist") setBlackForm({ title: "", features: "", safeAction: "" });
    else setWhiteForm({ title: "", features: "", safeAction: "" });
    toast.success(kind === "blacklist" ? "已新增黑名單（本機）" : "已新增白名單（本機）");
    trackEvent("fraud_list_add", { kind });
  };

  const removeItem = (kind: "blacklist" | "whitelist", id: string) => {
    const next = {
      ...state,
      [kind]: state[kind].filter((x) => x.id !== id),
    };
    persist(next);
  };

  const copyRockPrompt = async () => {
    const text = buildFraudRockAskPrompt(scenario || "模擬：保證獲利、限時加入");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製安全提問句，可貼到語音或 AI。");
    } catch {
      toast.info("請長按文字手動複製。");
    }
  };

  const lightSafetySpark = () => {
    const action =
      safeAction.trim() ||
      flags.filter(Boolean).join("；") ||
      "遇到可疑訊息時先暫停、後查證";
    saveChapterSparkSeed({
      source: "chapter0500",
      action_text: action.slice(0, 200),
      feeling_text: "我把主導權拿回來了。",
      chapterId: "0500",
      chapterTitle: "安心保鑣",
    });
    trackEvent("fraud_spark", {});
    router.push("/smart/spark?source=chapter0500");
  };

  return (
    <div style={{ minHeight: "100dvh", maxWidth: 480, margin: "0 auto", background: "var(--bg, #FAF5EC)" }}>
      <SubPage
        title="安心保鑣"
        onBack={() => router.push("/smart/guide")}
        accent="linear-gradient(180deg, #E8F0FA 0%, transparent 100%)"
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛡</div>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, margin: "0 0 6px" }}>
            數位叢林的安心保鑣
          </h1>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>
            先暫停，後查證；先驗證，再信任。
          </p>
        </div>

        <div style={{
          padding: "12px 14px", marginBottom: 18, borderRadius: 12,
          background: "#F5EEF8", border: "1px solid var(--line)",
          fontSize: "var(--fs-xs)", color: "var(--ink-2)", lineHeight: 1.55,
        }}>
          這是<strong>練習與私密筆記</strong>，不是自動偵測詐騙、不是官方身分驗證，也不是投資顧問。
          資料預設只存在您的裝置瀏覽器。{FRAUD_SENSITIVE_REMINDER}
        </div>

        <Section title="① 先暫停">
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 12px" }}>
            可疑訊息出現時，先慢一秒：
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FRAUD_PAUSE_RULES.map((r) => (
              <div key={r.id} style={{
                padding: "12px 14px", borderRadius: 12,
                background: "var(--surface)", border: "1px solid var(--line)",
              }}>
                <strong style={{ fontSize: "var(--fs-sm)" }}>{r.label}</strong>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", marginTop: 2 }}>{r.hint}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="② ROCK 查證練習">
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", margin: "0 0 10px" }}>
            請用<strong>模擬訊息</strong>練習。可請 AI「只列疑點、不給投資建議」。
          </p>
          <FieldLabel>模擬訊息</FieldLabel>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="例如：模擬「保證獲利、今晚最後名額」…"
            rows={2}
            style={taStyle}
          />
          {(["疑點一", "疑點二", "疑點三"] as const).map((label, i) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <input
                value={flags[i]}
                onChange={(e) => {
                  const next: [string, string, string] = [...flags] as [string, string, string];
                  next[i] = e.target.value;
                  setFlags(next);
                }}
                placeholder={`${label}…`}
                style={inputStyle}
              />
            </div>
          ))}
          <FieldLabel>安全確認方式</FieldLabel>
          <textarea
            value={safeAction}
            onChange={(e) => setSafeAction(e.target.value)}
            placeholder="例如：不加入、打原本電話確認…"
            rows={2}
            style={taStyle}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={saveRock} style={primaryBtn}>保存 ROCK 練習（本機）</button>
            <button type="button" onClick={copyRockPrompt} style={secondaryBtn}>複製安全提問句</button>
            <button type="button" onClick={() => router.push("/?open=voice&from=chapter0503")} style={secondaryBtn}>
              在暖暖語音試問 →
            </button>
          </div>
        </Section>

        <Section title="③ 防詐黑名單">
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", margin: "0 0 10px" }}>
            記劇本類型與特徵，不記危險連結或個資。
          </p>
          <ListForm form={blackForm} setForm={setBlackForm} onAdd={() => addItem("blacklist")} addLabel="新增黑名單" />
          <ItemList items={state.blacklist} onRemove={(id) => removeItem("blacklist", id)} empty="尚未新增黑名單" />
        </Section>

        <Section title="④ 信任白名單">
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", margin: "0 0 10px" }}>
            只記親自確認過的路；不要回撥對方提供的號碼。
          </p>
          <ListForm form={whiteForm} setForm={setWhiteForm} onAdd={() => addItem("whitelist")} addLabel="新增白名單" />
          <ItemList items={state.whitelist} onRemove={(id) => removeItem("whitelist", id)} empty="尚未新增白名單" />
        </Section>

        <Section title="⑤ 留下痕跡">
          <button type="button" onClick={lightSafetySpark} style={primaryBtn}>
            把這次查證點成 R＝安全光點 →
          </button>
          <button
            type="button"
            onClick={() => router.push("/smart/chapter/0500")}
            style={{ ...secondaryBtn, marginTop: 8 }}
          >
            回到第五章書本練習 →
          </button>
          <button
            type="button"
            onClick={() => router.push("/smart/radar")}
            style={{ ...secondaryBtn, marginTop: 8 }}
          >
            打開圓夢藍圖 →
          </button>
        </Section>
      </SubPage>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: "var(--fs-sm)", fontWeight: 800, color: "var(--primary-deep)",
        marginBottom: 10, letterSpacing: "0.04em",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "var(--fs-xs)", fontWeight: 800, color: "var(--ink-3)", margin: "8px 0 4px" }}>
      {children}
    </div>
  );
}

function ListForm({
  form,
  setForm,
  onAdd,
  addLabel,
}: {
  form: { title: string; features: string; safeAction: string };
  setForm: (v: { title: string; features: string; safeAction: string }) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="類型／對象（低敏感）"
        style={inputStyle}
      />
      <textarea
        value={form.features}
        onChange={(e) => setForm({ ...form, features: e.target.value })}
        placeholder="特徵或確認方式…"
        rows={2}
        style={{ ...taStyle, marginTop: 8 }}
      />
      <textarea
        value={form.safeAction}
        onChange={(e) => setForm({ ...form, safeAction: e.target.value })}
        placeholder="安全動作…"
        rows={2}
        style={{ ...taStyle, marginTop: 8 }}
      />
      <button type="button" onClick={onAdd} style={{ ...secondaryBtn, marginTop: 8 }}>{addLabel}</button>
    </div>
  );
}

function ItemList({
  items,
  onRemove,
  empty,
}: {
  items: FraudListItem[];
  onRemove: (id: string) => void;
  empty: string;
}) {
  if (items.length === 0) {
    return <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", margin: 0 }}>{empty}</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <div key={item.id} style={{
          padding: 12, borderRadius: 12,
          background: "var(--surface)", border: "1px solid var(--line)",
        }}>
          <div style={{ fontWeight: 800, fontSize: "var(--fs-sm)" }}>{item.title}</div>
          {item.features && (
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", margin: "4px 0" }}>{item.features}</p>
          )}
          {item.safeAction && (
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--ink-3)", margin: "0 0 8px" }}>
              安全動作：{item.safeAction}
            </p>
          )}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            style={{
              padding: "6px 12px", borderRadius: "var(--r-pill)",
              border: "1px solid var(--line)", background: "var(--surface-warm)",
              fontSize: "var(--fs-xs)", cursor: "pointer",
            }}
          >
            刪除
          </button>
        </div>
      ))}
    </div>
  );
}

const taStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  borderRadius: 12, border: "2px solid var(--line-strong)",
  background: "var(--surface)", fontSize: "var(--fs-sm)",
  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  borderRadius: 12, border: "2px solid var(--line-strong)",
  background: "var(--surface)", fontSize: "var(--fs-sm)",
  fontFamily: "inherit", boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "14px",
  background: "var(--primary)", border: "none",
  borderRadius: "var(--r-pill)", fontWeight: 800,
  fontSize: "var(--fs-sm)", color: "#fff", cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  width: "100%", padding: "14px",
  background: "var(--surface)", border: "2px solid var(--line-strong)",
  borderRadius: "var(--r-pill)", fontWeight: 700,
  fontSize: "var(--fs-sm)", cursor: "pointer", color: "var(--primary-deep)",
};
