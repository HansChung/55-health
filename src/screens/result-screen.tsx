"use client";

import { useState } from "react";
import { FoodResult, FoodItem } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Mascot } from "@/components/mascot";
import { SpeechBubble } from "@/components/speech-bubble";
import { MacroBar } from "@/components/macro-bar";

interface ResultScreenProps {
  result: FoodResult;
  photoDataUrl?: string | null;
  onClose: () => void;
  onSave: (adjusted: {
    cal: number;
    protein: number;
    carb: number;
    fat: number;
    items: FoodItem[]; // 編輯後的食物清單
  }) => void;
}

export function ResultScreen({ result, photoDataUrl, onClose, onSave }: ResultScreenProps) {
  const [portion, setPortion] = useState(1);
  const [items, setItems] = useState<FoodItem[]>(result.items);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // 重新計算總熱量（根據編輯後的項目）
  const itemsTotalCal = items.reduce((s, it) => s + (it.cal || 0), 0);
  // 等比例調整營養素（用 AI 給的原始比例）
  const ratio = result.cal > 0 ? itemsTotalCal / result.cal : 1;
  const adjusted = {
    cal: Math.round(itemsTotalCal * portion),
    protein: Math.round(result.protein * ratio * portion),
    carb: Math.round(result.carb * ratio * portion),
    fat: Math.round(result.fat * ratio * portion),
  };

  const updateItem = (idx: number, patch: Partial<FoodItem>) => {
    setItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const removeItem = (idx: number) => {
    setItems((arr) => arr.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      {/* 頂部照片區 */}
      <div style={{
        height: 240, position: "relative", overflow: "hidden",
        background: "#0E0905",
      }}>
        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt="您的食物"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 70% 60% at 50% 55%, #D67340 0%, #8C4521 60%, #4A2510 100%)",
          }}>
            <div style={{
              position: "absolute", left: "50%", top: "52%",
              transform: "translate(-50%, -50%)",
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #FBE8C6 0%, #E0BC85 60%, #B8924C 100%)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 24,
            }}>
              <div style={{ borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #F5F0E0, #D4C8A4)" }} />
              <div style={{ borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #C95E36, #8C3A1C)" }} />
              <div style={{ borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #7AA779, #4F7A4E)" }} />
              <div style={{ borderRadius: 10, background: "repeating-linear-gradient(0deg, #E8C97A 0 5px, #D0AC55 5px 10px)" }} />
            </div>
          </div>
        )}
        <button onClick={onClose} aria-label="返回" style={{
          position: "absolute", top: 16, left: 16,
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="chevronL" size={26} color="#fff" stroke={2.5} />
        </button>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 140px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 24 }}>
          <Mascot size={56} mood="happy" />
          <SpeechBubble tone="orange">
            <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 4 }}>
              我看到了 {items.length} 樣食物
            </div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
              如果認錯了，點下面「修改」可以改名稱、卡路里
            </div>
          </SpeechBubble>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {items.map((it, i) => (
            <div key={i} style={{
              background: "var(--surface)",
              borderRadius: 16, padding: "14px 16px",
              border: "1px solid var(--line)",
            }}>
              {editingIdx === i ? (
                <ItemEditor
                  item={it}
                  onChange={(patch) => updateItem(i, patch)}
                  onDone={() => setEditingIdx(null)}
                  onRemove={() => removeItem(i)}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: it.color, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>{it.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>{it.name}</div>
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)" }}>
                      {it.amount}　·　{it.cal} 大卡
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingIdx(i)}
                    style={{
                      color: "var(--primary-deep)", fontSize: "var(--fs-sm)", fontWeight: 600,
                      padding: "8px 14px", borderRadius: 999,
                      background: "var(--primary-soft)",
                      border: "none", cursor: "pointer",
                    }}
                  >修改</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: 700, marginBottom: 14 }}>您吃了多少？</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { v: 0.5, label: "半份" },
              { v: 1, label: "一份" },
              { v: 1.5, label: "一份半" },
              { v: 2, label: "兩份" },
            ].map(opt => (
              <button key={opt.v} onClick={() => setPortion(opt.v)} style={{
                flex: 1, padding: "14px 8px",
                borderRadius: 14,
                background: portion === opt.v ? "var(--primary)" : "var(--surface)",
                color: portion === opt.v ? "#fff" : "var(--ink-1)",
                border: portion === opt.v ? "none" : "2px solid var(--line-strong)",
                fontSize: "var(--fs-sm)", fontWeight: 700,
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}>這餐營養</span>
            <span style={{ fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--primary-deep)" }}>
              {adjusted.cal} <span style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--ink-2)" }}>大卡</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <MacroBar label="蛋白質" value={adjusted.protein} max={65} color="linear-gradient(90deg, #E8845A, #F4B58E)" />
            <MacroBar label="醣類" value={adjusted.carb} max={220} color="linear-gradient(90deg, #D9A441, #F0CB72)" />
            <MacroBar label="脂肪" value={adjusted.fat} max={55} color="linear-gradient(90deg, #7AA779, #A3C4A0)" />
          </div>
        </div>

        {result.tip && (
          <div style={{
            background: "var(--sage-soft)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            border: "1px solid #B5D2B0",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "var(--sage)", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="leaf" size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-sm)", color: "#4F7A4E", fontWeight: 700, marginBottom: 4 }}>健康提醒</div>
              <div style={{ fontSize: "var(--fs-base)", color: "var(--ink-1)", lineHeight: 1.5 }}>
                {result.tip}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "16px 24px 32px",
        background: "linear-gradient(180deg, transparent, var(--bg) 30%)",
        display: "flex", gap: 12,
      }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>取消</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={() => onSave({ ...adjusted, items })}>
          <Icon name="check" size={26} color="#fff" stroke={3} />
          確認儲存
        </button>
      </div>
    </div>
  );
}

/** 食物項目編輯 inline 表單 */
function ItemEditor({ item, onChange, onDone, onRemove }: {
  item: FoodItem;
  onChange: (patch: Partial<FoodItem>) => void;
  onDone: () => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: item.color, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>{item.emoji}</div>
        <input
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="食物名稱"
          style={{
            flex: 1, padding: "10px 12px",
            border: "2px solid var(--line-strong)", borderRadius: 10,
            fontSize: "var(--fs-base)", fontWeight: 600,
            outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", display: "block", marginBottom: 4 }}>
            份量
          </label>
          <input
            value={item.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            placeholder="一份"
            style={{
              width: "100%", padding: "10px 12px",
              border: "1px solid var(--line-strong)", borderRadius: 10,
              fontSize: "var(--fs-sm)",
              outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "var(--fs-xs)", color: "var(--ink-2)", display: "block", marginBottom: 4 }}>
            熱量（卡）
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={item.cal}
            onChange={(e) => onChange({ cal: Number(e.target.value) || 0 })}
            style={{
              width: "100%", padding: "10px 12px",
              border: "1px solid var(--line-strong)", borderRadius: 10,
              fontSize: "var(--fs-sm)",
              outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={onRemove}
          style={{
            padding: "10px 14px", background: "transparent",
            color: "var(--berry)", border: "1px solid var(--berry-soft)",
            borderRadius: 999, fontSize: "var(--fs-sm)", fontWeight: 600,
          }}
        >🗑 刪除</button>
        <button
          onClick={onDone}
          style={{
            flex: 1, padding: "10px 14px",
            background: "var(--primary)", color: "#fff",
            border: "none", borderRadius: 999,
            fontSize: "var(--fs-sm)", fontWeight: 700,
          }}
        >完成</button>
      </div>
    </div>
  );
}
