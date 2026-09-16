import type { Block } from "@/components/focusly/content/article-blocks";

/** Blog post shape — filled by task 2-a with the 6 original French articles. */
export interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  /** ISO date */
  date: string;
  readMinutes: number;
  excerpt: string;
  content: Block[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "methode-pomodoro-debutant",
    title: "La méthode Pomodoro expliquée aux débutants",
    tag: "Guide",
    date: "2025-03-12",
    readMinutes: 8,
    excerpt: "Origines, principes, mise en pratique.",
    content: [
      {
        type: "p",
        text: "Vous avez probablement déjà entendu parler de la méthode Pomodoro. Peut-être l’avez-vous essayée sans trop de succès, ou peut-être n’avez-vous jamais osé vous lancer. Cet article vous explique, sans jargon, ce qu’est cette méthode et comment la mettre en pratique dès aujourd’hui.",
      },
      { type: "h2", text: "Une invention estudiantine devenue mondiale" },
      {
        type: "p",
        text: "En 1987, un étudiant italien nommé Francesco Cirillo peine à se concentrer sur ses révisions. Un jour, il attrape le minuteur de cuisine en forme de tomate de sa mère, le règle sur dix minutes, et se lance un défi : « Je vais me concentrer intensément, juste dix minutes. » Le minuteur fonctionne. Il baptise sa découverte « méthode Pomodoro ».",
      },
      { type: "h2", text: "Le principe en une phrase" },
      {
        type: "p",
        text: "Travailler par blocs courts et intenses, séparés par des pauses obligatoires, plutôt que de s’acharner sur une tâche pendant des heures. Ce principe repose sur une réalité physiologique : notre attention n’est pas un réservoir infini.",
      },
      { type: "h2", text: "Les règles fondamentales" },
      {
        type: "list",
        items: [
          "Un Pomodoro dure **25 minutes**.",
          "Il est indivisible.",
          "Après chaque Pomodoro, une **pause de 5 minutes**.",
          "Après quatre Pomodoros, la pause dure **15 à 30 minutes**.",
        ],
      },
      { type: "h2", text: "Pourquoi ça marche vraiment" },
      {
        type: "list",
        ordered: true,
        items: [
          "**La contrainte temporelle** réduit la procrastination.",
          "**La pause planifiée** permet au cerveau de consolider.",
          "**La mesure objective** fournit un retour précieux.",
        ],
      },
      { type: "h2", text: "Comment démarrer concrètement" },
      {
        type: "p",
        text: "Oubliez les applications complexes. Prenez le minuteur Focusly, choisissez **une seule tâche**, et lancez un Pomodoro. Vingt-cinq minutes plus tard, notez ce que vous avez accompli. Puis prenez cinq minutes de pause — vraiment cinq minutes.",
      },
      { type: "h2", text: "Les premiers jours : à quoi s’attendre" },
      {
        type: "p",
        text: "Il est normal de trouver les premières sessions difficiles. Au bout de trois à cinq jours, cette résistance s’atténue. Votre cerveau a compris le rythme.",
      },
      { type: "h2", text: "Et après ?" },
      {
        type: "p",
        text: "Une fois la méthode maîtrisée, vous pourrez ajuster les durées et l’intégrer à d’autres techniques. Commencez par la base.",
      },
      { type: "cta", href: "blog", label: "← Retour au blog" },
    ],
  },
  {
    slug: "pauses-cerveau",
    title: "Pourquoi les pauses sont essentielles à votre cerveau",
    tag: "Neurosciences",
    date: "2025-03-20",
    readMinutes: 6,
    excerpt: "Le réseau du mode par défaut et l’ennui créatif.",
    content: [
      {
        type: "p",
        text: "Dans notre culture du « toujours plus », la pause est souvent perçue comme une faiblesse. Les neurosciences racontent une histoire radicalement différente : sans pauses, le cerveau ne consolide pas, ne récupère pas, et finit par produire un travail de moindre qualité.",
      },
      { type: "h2", text: "Le cerveau n’est pas une machine à effort continu" },
      {
        type: "p",
        text: "Notre attention soutenue repose sur un réseau de régions cérébrales qui consomme énormément d’énergie. Après environ 20 à 45 minutes d’effort cognitif intense, ce réseau commence à montrer des signes de fatigue.",
      },
      { type: "h2", text: "Le réseau du mode par défaut" },
      {
        type: "p",
        text: "L’une des découvertes les plus fascinantes des neurosciences récentes est l’existence du **Default Mode Network** (DMN). Il s’active précisément lorsque nous ne sommes pas engagés dans une tâche cognitive exigeante. Ce réseau joue un rôle central dans :",
      },
      {
        type: "list",
        items: [
          "La **consolidation mnésique**.",
          "La **créativité**.",
          "La **régulation émotionnelle**.",
          "La **planification à long terme**.",
        ],
      },
      { type: "h2", text: "Ce qui empêche le cerveau de récupérer" },
      {
        type: "p",
        text: "Regarder son fil Twitter pendant cinq minutes ne sollicite pas le DMN : cela sur-sollicite au contraire les circuits de l’attention et de la récompense.",
      },
      { type: "h2", text: "La théorie de la restauration de l’attention" },
      {
        type: "p",
        text: "Deux psychologues américains, Rachel et Stephen Kaplan, ont proposé la théorie de la restauration de l’attention. Pour la restaurer, il faut s’exposer à des environnements qui satisfont quatre critères : être ailleurs, être fascinant, être cohérent, être compatible.",
      },
      { type: "h2", text: "Conséquences pratiques pour votre Pomodoro" },
      {
        type: "p",
        text: "La méthode Pomodoro intègre déjà ces principes. Mais l’efficacité dépend entièrement de la qualité des pauses. Une pause de cinq minutes passée sur les réseaux sociaux annule presque totalement les bénéfices.",
      },
      { type: "cta", href: "blog", label: "← Retour au blog" },
    ],
  },
  {
    slug: "comparaison-methodes",
    title: "Pomodoro vs Deep Work vs Time Blocking",
    tag: "Comparatif",
    date: "2025-03-28",
    readMinutes: 7,
    excerpt: "Trois approches, trois contextes.",
    content: [
      {
        type: "p",
        text: "Trois méthodes dominent aujourd’hui le discours sur la productivité. Elles sont souvent présentées comme concurrentes. En réalité, elles répondent à des problèmes différents et se combinent remarquablement bien.",
      },
      { type: "h2", text: "La méthode Pomodoro : structurer l’effort" },
      {
        type: "p",
        text: "**Principe :** alterner des blocs de travail courts et des pauses fixes. **Point fort :** s’attaque à la procrastination. **Limite :** fragmente le travail.",
      },
      { type: "h2", text: "Deep Work : protéger l’immersion" },
      {
        type: "p",
        text: "**Principe :** réserver des plages de plusieurs heures à un travail cognitif intense. **Point fort :** atteindre le « flow ». **Limite :** difficile sans maîtrise préalable.",
      },
      { type: "h2", text: "Time Blocking : planifier chaque heure" },
      {
        type: "p",
        text: "**Principe :** attribuer à chaque tâche une plage horaire précise. **Point fort :** vision réaliste de la journée. **Limite :** demande de la discipline.",
      },
      { type: "h2", text: "Comment les combiner" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Time Blocking** pour structurer la journée.",
          "**Deep Work** dans les plages créatives.",
          "**Pomodoro** pour les tâches administratives.",
        ],
      },
      { type: "h2", text: "Quelle méthode pour quel profil ?" },
      {
        type: "list",
        items: [
          "**Étudiants** : Pomodoro en priorité.",
          "**Développeurs / créatifs** : Deep Work comme méthode principale.",
          "**Entrepreneurs** : Time Blocking indispensable.",
          "**Personnes distraites** : commencez par le Pomodoro.",
        ],
      },
      { type: "cta", href: "blog", label: "← Retour au blog" },
    ],
  },
  {
    slug: "activites-pauses",
    title: "10 activités pour des pauses vraiment réparatrices",
    tag: "Pratique",
    date: "2025-04-04",
    readMinutes: 6,
    excerpt: "Ce qu’il faut faire — et éviter — pendant vos 5 minutes.",
    content: [
      {
        type: "p",
        text: "Une pause n’est pas un vide : c’est un moment où le cerveau bascule dans un autre mode de fonctionnement.",
      },
      { type: "h2", text: "Ce qu’il faut éviter" },
      {
        type: "list",
        items: [
          "**Consulter les réseaux sociaux**.",
          "**Lire ses emails**.",
          "**Regarder une vidéo courte**.",
        ],
      },
      { type: "h2", text: "Les 10 activités" },
      {
        type: "list",
        ordered: true,
        items: [
          "Se lever et s’étirer (1 min).",
          "Marcher quelques minutes (3-5 min).",
          "Regarder par la fenêtre (2-3 min).",
          "Boire un verre d’eau (1 min).",
          "Respirer consciemment (2 min).",
          "Écrire trois lignes dans un carnet (2 min).",
          "Faire une micro-tâche ménagère (3 min).",
          "Discuter brièvement avec quelqu’un (5 min).",
          "Écouter un morceau de musique (3-4 min).",
          "Fermer les yeux (5 min).",
        ],
      },
      { type: "h2", text: "Le rituel de la pause longue" },
      {
        type: "p",
        text: "La pause longue (15-30 minutes) mérite un traitement particulier : marche, déjeuner sans écran, sieste de 20 minutes maximum.",
      },
      { type: "h2", text: "Une règle simple" },
      {
        type: "p",
        text: "Pendant vos pauses, éloignez-vous de l’écran. Tout le reste découle naturellement.",
      },
      { type: "cta", href: "blog", label: "← Retour au blog" },
    ],
  },
  {
    slug: "erreurs-pomodoro",
    title: "Les 5 erreurs qui ruinent votre méthode Pomodoro",
    tag: "Pratique",
    date: "2025-04-11",
    readMinutes: 6,
    excerpt: "Repérer les pièges classiques.",
    content: [
      {
        type: "p",
        text: "La méthode Pomodoro est simple. Trop simple, peut-être : c’est précisément parce qu’on croit l’avoir comprise en cinq minutes qu’on la pratique mal pendant des mois.",
      },
      { type: "h2", text: "Erreur 1 : interrompre un Pomodoro en cours" },
      {
        type: "p",
        text: "Un Pomodoro interrompu n’est plus un Pomodoro. Si une interruption survient, la règle est de considérer la session comme perdue.",
      },
      { type: "h2", text: "Erreur 2 : zapper les pauses" },
      {
        type: "p",
        text: "La pause n’est pas un luxe, c’est ce qui rend les sessions suivantes possibles.",
      },
      { type: "h2", text: "Erreur 3 : utiliser son téléphone pendant les pauses" },
      {
        type: "p",
        text: "Consulter son téléphone pendant cinq minutes ne repose pas le cerveau, cela l’épuise davantage.",
      },
      { type: "h2", text: "Erreur 4 : utiliser le Pomodoro pour tout" },
      {
        type: "p",
        text: "Le Pomodoro est moins adapté aux réunions, au travail créatif profond et à la réflexion diffuse.",
      },
      { type: "h2", text: "Erreur 5 : ne pas mesurer ses progrès" },
      {
        type: "p",
        text: "Suivez vos sessions (Focusly le fait automatiquement) et prenez cinq minutes chaque semaine pour analyser.",
      },
      { type: "h2", text: "Bonus : croire qu’il faut être motivé" },
      {
        type: "p",
        text: "La méthode a précisément été conçue pour fonctionner sans motivation préalable.",
      },
      { type: "cta", href: "blog", label: "← Retour au blog" },
    ],
  },
  {
    slug: "etudiants-revisions",
    title: "Réviser efficacement avec la méthode Pomodoro",
    tag: "Étudiants",
    date: "2025-04-18",
    readMinutes: 7,
    excerpt: "Adapter la méthode aux examens.",
    content: [
      {
        type: "p",
        text: "La période des examens est un moment de tension. La méthode Pomodoro est particulièrement adaptée aux révisions, à condition d’être adaptée aux spécificités de la mémorisation.",
      },
      { type: "h2", text: "Pourquoi le Pomodoro est idéal pour les révisions" },
      {
        type: "list",
        items: [
          "Il rend le démarrage plus facile.",
          "Il impose une limite.",
          "Il fragmente naturellement le travail.",
        ],
      },
      { type: "h2", text: "Adapter les durées" },
      {
        type: "list",
        items: [
          "**Mémorisation brute** : 15-20 min.",
          "**Compréhension de concepts** : 30-45 min.",
          "**Rédaction** : 45-50 min.",
          "**Révision générale** : 25 min.",
        ],
      },
      { type: "h2", text: "La structure idéale d’une journée" },
      {
        type: "list",
        ordered: true,
        items: [
          "**8h30 - 9h00 :** révision des fiches de la veille.",
          "**9h00 - 10h30 :** apprentissage de nouveaux contenus.",
          "**10h30 - 11h00 :** pause longue.",
          "**11h00 - 12h30 :** exercices d’application.",
          "**14h00 - 16h00 :** révision active.",
          "**16h30 - 18h00 :** auto-évaluation.",
        ],
      },
      { type: "h2", text: "La règle d’or : la récupération active" },
      {
        type: "p",
        text: "Le piège classique est de confondre relire et réviser. Pour vraiment mémoriser, il faut se tester.",
      },
      { type: "h2", text: "Le sommeil" },
      {
        type: "p",
        text: "Aucune méthode de productivité ne remplace le sommeil. Visez au minimum 7 heures.",
      },
      { type: "cta", href: "blog", label: "← Retour au blog" },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
