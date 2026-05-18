import { ImageResponse } from "next/og";

// Image Open Graph générée dynamiquement (1200×630 PNG) — partagée sur
// les réseaux sociaux / aperçus de lien. Aucun fichier binaire à gérer.
// Prérendue une fois au build (l'image ne change pas) puis mise en cache.
export const dynamic = "force-static";

const BG = "#0c0a08";
const BRONZE = "#b09472";
const BRONZE_LIGHT = "#c9ad88";
const TEXT = "#ece3d0";
const DIM = "#95897a";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          backgroundImage:
            "radial-gradient(900px 500px at 50% 0%, rgba(176,148,114,0.16), rgba(12,10,8,0))",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Cadre bronze */}
        <div
          style={{
            position: "absolute",
            top: "44px",
            left: "44px",
            right: "44px",
            bottom: "44px",
            border: "1px solid rgba(176,148,114,0.30)",
            borderRadius: "10px",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: "20px",
            letterSpacing: "10px",
            textTransform: "uppercase",
            color: DIM,
            marginBottom: "38px",
          }}
        >
          Maison événementielle d&apos;exception
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "104px",
            color: TEXT,
            letterSpacing: "-1px",
          }}
        >
          Maison&nbsp;
          <span style={{ color: BRONZE_LIGHT, fontStyle: "italic" }}>
            Parissim
          </span>
          .
        </div>

        <div
          style={{
            display: "flex",
            width: "120px",
            height: "2px",
            background: BRONZE,
            margin: "40px 0",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: "30px",
            color: DIM,
            letterSpacing: "1px",
          }}
        >
          Événementiel &amp; communication d&apos;exception
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "82px",
            display: "flex",
            fontSize: "18px",
            letterSpacing: "8px",
            textTransform: "uppercase",
            color: BRONZE,
          }}
        >
          Paris · Saint-Tropez · Côte d&apos;Azur
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
