import { BRAND } from "@/lib/config";

export const metadata = {
  title: "À propos",
};

export default function AboutPage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-14">
        <h1 className="font-serif text-4xl text-gold-gradient mb-3">À propos</h1>
        <div className="gold-line w-24 mx-auto mt-6" />
      </div>

      <div className="space-y-8 text-cream/75 leading-relaxed">
        <p className="font-serif text-xl text-cream text-center italic">
          L&apos;histoire de {BRAND.name}
        </p>

        <p>
          Née au cœur du Maroc, <strong className="text-gold">{BRAND.name}</strong> incarne
          l&apos;alliance parfaite entre l&apos;art ancestral de la parfumerie orientale et
          l&apos;élégance contemporaine. Chaque création est le fruit d&apos;un savoir-faire
          transmis de génération en génération, sublimé par des matières premières d&apos;exception.
        </p>

        <p>
          Notre maison sélectionne avec exigence les plus nobles essences — oud cambodgien,
          rose de Damas, safran espagnol — pour composer des fragrances qui racontent des
          histoires. Des palais de Fès aux riads de Marrakech, chaque flacon porte en lui
          l&apos;âme d&apos;un patrimoine olfactif millénaire.
        </p>

        <p>
          Chez {BRAND.name}, le luxe n&apos;est pas une ostentation, mais une expérience
          intime et raffinée. Nous croyons que le parfum est un art de vivre, une signature
          invisible qui accompagne les moments les plus précieux de votre existence.
        </p>

        <div className="pt-8 text-center">
          <p className="text-gold-light text-2xl" dir="rtl">
            {BRAND.arabicName} — {BRAND.taglineAr}
          </p>
        </div>
      </div>
    </div>
  );
}
