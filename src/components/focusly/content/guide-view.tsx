"use client";

import { ArticleBlocks, type Block } from "./article-blocks";
import { Breadcrumb } from "./breadcrumb";

const GUIDE_BLOCKS: Block[] = [
  {
    type: "p",
    text: "La méthode Pomodoro est probablement la technique de gestion du temps la plus connue au monde. Derrière son apparente simplicité — travailler 25 minutes, faire une pause de 5 — se cache un dispositif rigoureux, appuyé par des décennies de recherche en psychologie cognitive.",
  },
  { type: "h2", text: "1. Qu’est-ce que la méthode Pomodoro ?" },
  {
    type: "p",
    text: "Développée par Francesco Cirillo à la fin des années 1980, la méthode repose sur une intuition simple : notre attention n’est pas un réservoir infini. Cirillo utilisait un minuteur de cuisine en forme de tomate (pomodoro en italien) pour fragmenter son travail en sessions courtes et intenses.",
  },
  { type: "h2", text: "2. Les cinq étapes de la méthode originale" },
  {
    type: "list",
    ordered: true,
    items: [
      "**Choisir une tâche** précise et unique.",
      "**Régler un minuteur sur 25 minutes** (un « Pomodoro »).",
      "**Travailler sans interruption** jusqu’à la sonnerie.",
      "**Prendre une pause de 5 minutes.**",
      "**Après quatre Pomodoros**, prendre une pause longue de 15 à 30 minutes.",
    ],
  },
  { type: "h2", text: "3. Pourquoi ça fonctionne : les trois leviers" },
  { type: "h3", text: "Le levier attentionnel" },
  {
    type: "p",
    text: "Notre attention soutenue s’épuise au bout de 20 à 45 minutes selon les individus. En découpant le travail en blocs courts, on évite d’atteindre le seuil de fatigue cognitive où les erreurs se multiplient.",
  },
  { type: "h3", text: "Le levier motivationnel" },
  {
    type: "p",
    text: "Un bloc de 25 minutes est psychologiquement beaucoup plus facile à démarrer qu’une tâche « jusqu’à ce qu’elle soit finie ». En abaissant le coût perçu de l’engagement initial, la méthode contourne la procrastination.",
  },
  { type: "h3", text: "Le levier métacognitif" },
  {
    type: "p",
    text: "Suivre ses sessions permet de prendre conscience de sa productivité réelle. Combien de Pomodoros pour rédiger ce rapport ? Ce retour d’information permet d’estimer plus justement la durée des tâches futures.",
  },
  { type: "h2", text: "4. Adapter les durées à votre profil" },
  {
    type: "list",
    items: [
      "**Travail créatif profond** : 50/10, voire 90/20.",
      "**Travail administratif** : 15/3 peut suffire.",
      "**Étudiants en révision** : 25/5 reste idéal.",
      "**Développeurs** : 45/10 est un bon compromis.",
    ],
  },
  {
    type: "p",
    text: "Dans Focusly, ajustez ces durées via les réglages du minuteur.",
  },
  { type: "h2", text: "5. Les pièges les plus fréquents" },
  {
    type: "list",
    items: [
      "**Multiplier les micro-interruptions** : consulter son téléphone annule presque totalement les bénéfices.",
      "**Zapper les pauses** : travailler « tant qu’on est dedans » sape la structure.",
      "**Vouloir tout mesurer** : le Pomodoro est un outil, pas une religion.",
    ],
  },
  { type: "h2", text: "6. Comment démarrer aujourd’hui" },
  {
    type: "list",
    ordered: true,
    items: [
      "**Jour 1-2** : trois Pomodoros par jour, sans objectif de performance.",
      "**Jour 3-4** : cinq Pomodoros, en notant à chaque fin de session ce que vous avez accompli.",
      "**Jour 5-6** : ajustez vos durées si nécessaire, explorez les pauses longues.",
      "**Jour 7** : faites le bilan.",
    ],
  },
  { type: "h2", text: "En résumé" },
  {
    type: "p",
    text: "La méthode Pomodoro n’est pas une baguette magique. C’est un cadre simple, éprouvé, qui exploite trois leviers pour vous aider à travailler avec plus de régularité et moins de friction.",
  },
  { type: "cta", href: "outils", label: "→ Essayer le minuteur maintenant" },
];

export function GuideView() {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: "Guide" }]}
      />
      <article className="max-w-[720px]">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Le guide complet de la méthode Pomodoro
        </h1>
        <p className="mt-3 text-[13px] text-faint">
          Mis à jour en 2025 · Lecture ~10 minutes
        </p>
        <div className="mt-6">
          <ArticleBlocks blocks={GUIDE_BLOCKS} />
        </div>
      </article>
    </div>
  );
}
