import type { Metadata } from "next";
import MusterPageClient from "./MusterPageClient";

const TRADE_META: Record<string, { title: string; description: string }> = {
  dachdecker: {
    title: "Dachdecker Hattingen | Miet-Website zum Anmieten – DEMO",
    description:
      "Miet-Website (Demo): Dachdecker Hattingen – Dachsanierung, Reparatur, Notdienst & Neubau. Kostenlose Besichtigung & Festpreis-Angebot. Diese Stadt-Website ist noch frei und kann sofort angemietet werden.",
  },
  elektriker: {
    title: "Elektriker Hattingen | Miet-Website zum Anmieten – DEMO",
    description:
      "Miet-Website (Demo): Elektriker Hattingen – Installation, E-Check, Wallbox & Smart Home. Kostenlose Besichtigung & Festpreis-Angebot. Diese Stadt-Website ist noch frei und kann sofort angemietet werden.",
  },
  klempner: {
    title: "Klempner Hattingen | Miet-Website zum Anmieten – DEMO",
    description:
      "Miet-Website (Demo): Klempner Hattingen – Heizung, Rohrreinigung, Badsanierung & Wärmepumpe. Kostenlose Besichtigung & Festpreis-Angebot. Diese Stadt-Website ist noch frei und kann sofort angemietet werden.",
  },
  maler: {
    title: "Maler Hattingen | Miet-Website zum Anmieten – DEMO",
    description:
      "Miet-Website (Demo): Maler Hattingen – Innenanstrich, Außenanstrich, Tapezierarbeit & Fassadensanierung. Kostenlose Besichtigung & Festpreis-Angebot. Diese Stadt-Website ist noch frei und kann sofort angemietet werden.",
  },
  zimmerer: {
    title: "Zimmerer Hattingen | Miet-Website zum Anmieten – DEMO",
    description:
      "Miet-Website (Demo): Zimmerer Hattingen – Dachstuhl, Carport, Holzrahmenbau & Terrassenüberdachung. Kostenlose Besichtigung & Festpreis-Angebot. Diese Stadt-Website ist noch frei und kann sofort angemietet werden.",
  },
};

export function generateStaticParams() {
  return [
    { trade: "dachdecker" },
    { trade: "elektriker" },
    { trade: "klempner" },
    { trade: "maler" },
    { trade: "zimmerer" },
  ];
}

export function generateMetadata({
  params,
}: {
  params: { trade: string };
}): Metadata {
  const meta = TRADE_META[params.trade] || TRADE_META.elektriker;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false },
  };
}

export default function MusterPage({
  params,
}: {
  params: { trade: string };
}) {
  return <MusterPageClient tradeKey={params.trade} />;
}
