import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Market Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Ticker pills row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 40,
          }}
        >
          {["NVDA", "MSFT", "GOOGL", "AMD", "ARM", "AMZN"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                background: "rgba(39,39,42,0.8)",
                border: "1px solid rgba(63,63,70,0.5)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 18,
                fontWeight: 600,
                color: "#a1a1aa",
                letterSpacing: 1,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: -2,
              display: "flex",
            }}
          >
            AI Market Dashboard
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#71717a",
              display: "flex",
            }}
          >
            Real-time AI infrastructure & semiconductor tracking
          </div>
        </div>

        {/* Mock data bar */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 40,
            padding: "16px 32px",
            background: "rgba(39,39,42,0.4)",
            border: "1px solid rgba(63,63,70,0.3)",
            borderRadius: 12,
          }}
        >
          {[
            { label: "S&P 500", color: "#10b981" },
            { label: "Nasdaq", color: "#10b981" },
            { label: "Dow Jones", color: "#10b981" },
            { label: "Bitcoin", color: "#ef4444" },
          ].map((idx) => (
            <div
              key={idx.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: "#a1a1aa" }}>
                {idx.label}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: idx.color,
                }}
              >
                {idx.color === "#10b981" ? "▲" : "▼"}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
