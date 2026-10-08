"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary" style={{ minHeight: 52, padding: "0 20px" }}>
      🖨️ 列印／存成 PDF
    </button>
  );
}
