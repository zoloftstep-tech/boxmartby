import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "БОКСМАРТ — производство картонных коробок в Минске";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(145deg, #F3EDE3 0%, #E8DCC8 45%, #C4A574 100%)",
          color: "#1C1917",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6B5344",
          }}
        >
          ООО «БОКСМАРТ»
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            Картонные коробки напрямую от производителя
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#44403C",
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            Гофротара в Минске · точные размеры · расчёт онлайн для бизнеса и селлеров
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 600,
            color: "#6B5344",
          }}
        >
          www.boxmart.by
        </div>
      </div>
    ),
    { ...size },
  );
}
