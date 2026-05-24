"use client";

import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { Icon } from "@/components/icons";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface LoginScreenProps {
  onDone: () => void;
}

export function LoginScreen({ onDone }: LoginScreenProps) {
  const supabase = createSupabaseBrowser();
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) setError("傳送失敗：" + error.message);
    else setStep("otp");
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError("驗證碼錯誤，請再試一次");
      return;
    }
    setStep("success");
    setTimeout(onDone, 1500);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 70,
      background: "linear-gradient(180deg, #FFF3DF 0%, var(--bg) 70%)",
      display: "flex", flexDirection: "column", paddingTop: 16,
    }}>
      {step === "email" && (
        <>
          <div style={{ padding: "24px 24px 0" }}>
            <Mascot size={100} mood="happy" />
            <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "20px 0 8px" }}>
              歡迎使用暖暖
            </h1>
            <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>
              請輸入電子郵件，我們會傳一組驗證碼給您
            </p>
          </div>

          <div style={{ padding: "32px 24px 0", flex: 1 }}>
            <label style={{ display: "block", fontSize: "var(--fs-sm)", color: "var(--ink-2)", fontWeight: 600, marginBottom: 10 }}>
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              style={{
                width: "100%",
                background: "var(--surface)",
                borderRadius: "var(--r-lg)",
                padding: "20px 22px",
                border: "2px solid var(--line-strong)",
                fontSize: "var(--fs-lg)", fontWeight: 700,
                color: "var(--ink-1)", outline: "none",
                fontFamily: "inherit",
              }}
            />

            {error && (
              <div style={{
                marginTop: 16, padding: "12px 16px",
                background: "var(--berry-soft)", borderRadius: 12,
                color: "var(--berry)", fontSize: "var(--fs-sm)",
              }}>{error}</div>
            )}

            <div style={{
              marginTop: 24, padding: "16px 18px",
              background: "var(--surface-warm)", borderRadius: "var(--r-md)",
              border: "1px solid var(--line)",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>💡</div>
              <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
                第一次使用會自動建立帳號，不用另外註冊
              </div>
            </div>
          </div>

          <div style={{ padding: "0 24px 32px" }}>
            <button
              className="btn-primary"
              style={{ width: "100%", opacity: loading || !email ? 0.5 : 1 }}
              disabled={loading || !email}
              onClick={sendOtp}
            >
              {loading ? "傳送中..." : "傳送驗證碼"}
            </button>
          </div>
        </>
      )}

      {step === "otp" && (
        <>
          <div style={{ padding: "8px 16px" }}>
            <button onClick={() => setStep("email")} style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--surface)", border: "1px solid var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="chevronL" size={26} color="var(--ink-1)" stroke={2.5} />
            </button>
          </div>

          <div style={{ padding: "12px 24px 0", flex: 1 }}>
            <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 8px" }}>
              輸入驗證碼
            </h1>
            <p style={{ fontSize: "var(--fs-base)", color: "var(--ink-2)", margin: 0 }}>
              剛剛傳到 <strong style={{ color: "var(--ink-1)" }}>{email}</strong> 的驗證碼
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="輸入驗證碼"
              autoFocus
              style={{
                width: "100%",
                marginTop: 36, marginBottom: 28,
                padding: "20px",
                background: "var(--surface)",
                border: "2px solid var(--line-strong)",
                borderRadius: "var(--r-md)",
                textAlign: "center",
                fontSize: "var(--fs-3xl)", fontWeight: 800,
                color: "var(--primary-deep)",
                letterSpacing: "8px",
                outline: "none",
                fontFamily: "ui-monospace, monospace",
              }}
            />

            {error && (
              <div style={{
                padding: "12px 16px", background: "var(--berry-soft)",
                borderRadius: 12, color: "var(--berry)", fontSize: "var(--fs-sm)",
                marginBottom: 16,
              }}>{error}</div>
            )}

            <button
              className="btn-primary"
              style={{ width: "100%", opacity: loading || otp.length < 6 ? 0.5 : 1 }}
              disabled={loading || otp.length < 6}
              onClick={verifyOtp}
            >
              {loading ? "驗證中..." : "確認"}
            </button>

            <div style={{
              marginTop: 20, display: "flex", justifyContent: "center", gap: 6,
              fontSize: "var(--fs-sm)", color: "var(--ink-2)",
            }}>
              沒收到？<button onClick={sendOtp} style={{ color: "var(--primary-deep)", fontWeight: 700 }}>重新傳送</button>
            </div>
          </div>
        </>
      )}

      {step === "success" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 24,
          padding: 32, textAlign: "center",
        }}>
          <div className="pop"><Mascot size={180} mood="excited" /></div>
          <div className="fade-up">
            <h1 style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, margin: "0 0 12px" }}>
              登入成功！
            </h1>
            <p style={{ fontSize: "var(--fs-lg)", color: "var(--ink-2)", margin: 0 }}>
              很高興認識您
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
