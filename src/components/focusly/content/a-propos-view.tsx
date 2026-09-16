"use client";

import Link from "next/link";

import { Breadcrumb } from "./breadcrumb";

const H2_CLASS = "mt-9 mb-3 text-2xl font-semibold tracking-tight";
const P_CLASS = "mb-4 leading-relaxed text-soft";
const LINK_CLASS = "font-medium text-brand hover:underline";

export function AProposView() {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: "À propos" }]}
      />
      <article className="max-w-[720px]">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          À propos de Focusly
        </h1>
        <p className="mt-3 text-[17px] text-muted-foreground">
          Un projet indépendant dédié à la concentration et à la productivité.
        </p>

        <div className="mt-2">
          <h2 className={H2_CLASS}>Notre mission</h2>
          <p className={P_CLASS}>
            Focusly est un projet indépendant dont l’objectif est simple :
            offrir un outil de concentration minimaliste, gratuit et respectueux
            de la vie privée, accompagné de ressources éditoriales de qualité.
          </p>

          <h2 className={H2_CLASS}>Notre approche</h2>
          <ul className="mb-4 list-disc space-y-1.5 pl-6 text-soft">
            <li className="leading-relaxed">
              <strong className="font-semibold text-foreground">
                Minimalisme
              </strong>{" "}
              : chaque fonctionnalité doit justifier sa présence.
            </li>
            <li className="leading-relaxed">
              <strong className="font-semibold text-foreground">
                Respect de la vie privée
              </strong>{" "}
              : vos données restent sur votre appareil.
            </li>
            <li className="leading-relaxed">
              <strong className="font-semibold text-foreground">
                Transparence
              </strong>{" "}
              : nous expliquons clairement quelles données sont utilisées.
            </li>
          </ul>

          <h2 className={H2_CLASS}>Qui sommes-nous ?</h2>
          <p className={P_CLASS}>
            Focusly est développé par une petite équipe indépendante passionnée
            par les questions de cognition, d’attention et d’organisation du
            travail. Ce site est financé par la publicité, ce qui nous permet de
            le maintenir gratuit.
          </p>

          <h2 className={H2_CLASS}>Nous contacter</h2>
          <p className={P_CLASS}>
            N’hésitez pas à nous écrire via la{" "}
            <Link href="#contact" className={LINK_CLASS}>
              page de contact
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
