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
    readMinutes: 9,
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
      { type: "h2", text: "Préparer l’environnement : la moitié du travail" },
      {
        type: "p",
        text: "Aucune technique de concentration ne résiste à un environnement hostile. Avant de lancer votre premier Pomodoro, prenez trois minutes pour préparer le terrain : téléphone en mode avion et posé hors de portée de bras, onglets inutiles fermés, eau à portée de main, casque si vous travaillez dans un espace partagé. Ce rituel court a un double effet : il supprime les interruptions les plus fréquentes, et il sert de signal d’envol à votre cerveau, qui apprend que ce moment signifie « on travaille maintenant ».",
      },
      {
        type: "list",
        items: [
          "**Le téléphone** est l’ennemi numéro un : même éteint, posé sur le bureau, il attire le regard. Mettez-le dans une autre pièce.",
          "**Les notifications** : désactivez tout ce qui n’est pas vital pour la durée de la session.",
          "**La tâche unique** : écrivez sur papier ce que vous ferez pendant les 25 minutes. Une seule ligne. Si vous ne pouvez pas la formuler, la tâche est trop vague.",
        ],
      },
      { type: "h2", text: "Gérer une interruption sans perdre son élan" },
      {
        type: "p",
        text: "Le téléphone et les collègues existent, et un Pomodoro sera parfois interrompu. Francesco Cirillo propose une stratégie en quatre temps, redoutablement efficace en contexte professionnel :",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Informer** : « Je suis au milieu d’une session, je finis à 14h30. »",
          "**Négocier** : proposez un moment précis pour revenir vers la personne.",
          "**Reporter** : notez la demande sur papier, elle n’occupera plus votre esprit.",
          "**Rappeler** : à la fin du Pomodoro, honorez l’engagement pris.",
        ],
      },
      {
        type: "p",
        text: "Le fait de noter l’interruption est essentiel : c’est ce qui permet à votre cerveau de lâcher prise immédiatement. Une demande non notée tourne en boucle dans la mémoire de travail ; une demande consignée devient un rendez-vous.",
      },
      { type: "h2", text: "Foire aux questions des premiers Pomodoros" },
      { type: "h3", text: "Vingt-cinq minutes, c’est trop court ou trop long ?" },
      {
        type: "p",
        text: "Les deux, selon les jours et les tâches. Commencez par les 25 minutes classiques pendant deux semaines complètes avant d’ajuster : il faut un point de référence stable pour mesurer l’effet d’un changement. Ensuite, 15 minutes conviennent mieux aux tâches de mémorisation, 45 minutes à la rédaction.",
      },
      { type: "h3", text: "Que faire si une session tourne vraiment bien ?" },
      {
        type: "p",
        text: "Tentez de finir à temps, notez d’où vous repartirez, et prenez quand même la pause. C’est contre-intuitif, mais s’arrêter volontairement au milieu d’un passage fluide rend le redémarrage instantané : vous savez exactement quoi écrire ensuite. C’est le procédé qu’Hemingway utilisait pour ne jamais subir la page blanche.",
      },
      { type: "h3", text: "Compte-t-on les Pomodoros par tâche ou par jour ?" },
      {
        type: "p",
        text: "Les deux se complètent. Estimer une tâche « en Pomodoros » affine progressivement votre sens du temps réel (la plupart des gens sous-estiment d’un facteur deux au départ), tandis que le total journalier sert d’indicateur d’ensemble : six à huit Pomodoros réellement concentrés constituent déjà une excellente journée de travail profond.",
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
    readMinutes: 8,
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
      { type: "h2", text: "Trois échelons de récupération, trois fonctions différentes" },
      { type: "h3", text: "La micro-pause (30 secondes à 2 minutes)" },
      {
        type: "p",
        text: "Fermer les yeux, respirer lentement, rouler les épaules. Trop courte pour activer pleinement le DMN, elle suffit pourtant à relâcher la tension musculaire du cou et des yeux — les deux zones qui saturent en premier devant un écran.",
      },
      { type: "h3", text: "La pause courte (5 minutes)" },
      {
        type: "p",
        text: "C’est le format Pomodoro standard. Elle permet une vraie bascule de réseau : se lever, marcher, regarder au loin. Cinq minutes paraissent peu ; pratiquées toutes les 25 minutes, elles changent la trajectoire d’une journée entière.",
      },
      { type: "h3", text: "La pause longue (15 à 30 minutes)" },
      {
        type: "p",
        text: "Après quatre Pomodoros, le cerveau a accumulé une dette de consolidation que seules les pauses longues remboursent : marche dehors, déjeuner sans écran, ou sieste courte — jamais plus de 20 minutes, pour éviter l’inertie du sommeil profond.",
      },
      { type: "h2", text: "Trois signes que votre cerveau réclame une pause" },
      {
        type: "list",
        items: [
          "**La relecture compulsive** : vous relisez la même phrase trois fois sans la retenir. La mémoire de travail sature.",
          "**Le réflexe de l’onglet** : votre main ouvre un nouvel onglet toutes les deux minutes. Le cerveau cherche une échappatoire à l’effort.",
          "**L’irritabilité** : un message anodin vous agace. La régulation émotionnelle est l’une des premières victimes de la fatigue attentionnelle.",
        ],
      },
      { type: "h2", text: "Marcher, la pause la mieux documentée" },
      {
        type: "p",
        text: "Les travaux de l’université de Stanford sur la marche et la créativité ont montré que quelques minutes de marche augmentent de façon mesurable la production d’idées originales, pendant l’effort mais aussi juste après. La combinaison gagnante tient en une phrase : marcher, sans téléphone, en regardant au loin. La fenêtre fait l’affaire si vous ne pouvez pas sortir : l’œil a besoin de distance, pas de paysage.",
      },
      { type: "h2", text: "Et l’après-déjeuner ?" },
      {
        type: "p",
        text: "La baisse de vigilance du début d’après-midi est physiologique : le rythme circadien descend naturellement entre 13 h et 15 h, indépendamment du repas. Inutile de lutter avec du café : c’est le moment idéal pour placer une tâche mécanique ou administrative, ou une pause longue si votre planning le permet. Réserver les tâches créatives au matin, c’est déjà la moitié du chemin.",
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
    readMinutes: 8,
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
      { type: "h2", text: "La grille de choix en trois questions" },
      {
        type: "p",
        text: "Devant une journée à organiser, trois questions suffisent à choisir l’outil adapté. Quelle est la nature de la tâche — mécanique, créative ou mixte ? Quel est votre état de départ — frais, chargé ou distrait ? Quelle contrainte externe pèse sur vous — réunions, collègues, délais ? Le Pomodoro excelle quand la tâche est résistante au démarrage, le Deep Work quand elle exige de la profondeur, le Time Blocking quand la journée est un emploi du temps négocié avec d’autres.",
      },
      { type: "h2", text: "Les trois erreurs de combinaison" },
      {
        type: "list",
        items: [
          "**Planifier du Deep Work en Pomodoros** : la vérification toutes les 25 minutes casse l’immersion que le Deep Work cherche à construire.",
          "**Empiler du Time Blocking sans tampon** : une journée où chaque heure est occupée explose à la première surprise. Prévoyez un bloc tampon quotidien.",
          "**Confondre méthode et application** : aucune de ces méthodes n’exige un logiciel particulier. Le papier et un minuteur de cuisine fonctionnent parfaitement.",
        ],
      },
      { type: "h2", text: "Une semaine type combinée" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Lundi matin** : 30 minutes de Time Blocking pour la semaine entière.",
          "**Chaque matin** : un bloc de Deep Work de 2 heures sur le projet le plus important, téléphone dans une autre pièce.",
          "**Après-midi** : Pomodoros de 25 minutes pour les emails, la comptabilité, les retours à faire — tout ce qui traîne.",
          "**Vendredi 16 h** : revue de 20 minutes — ce qui est fait, ce qui passe à la semaine suivante.",
        ],
      },
      {
        type: "quote",
        text: "Le but n’est pas de trouver la meilleure méthode, mais la combinaison qui correspond à votre métier, votre énergie et votre calendrier.",
      },
      { type: "h2", text: "Transitions : le vrai sujet que personne n’aborde" },
      {
        type: "p",
        text: "Toutes ces méthodes partagent un coût invisible : la transition. Passer d’un Pomodoro administratif à un bloc de Deep Work ne se fait pas instantanément — les études sur le changement de tâche (« task switching ») montrent qu’une partie de l’attention reste accrochée à la tâche précédente pendant plusieurs minutes. Concrètement : évitez d’enchaîner sans respiration une session fragmentée et un travail profond. Entre les deux, marchez cinq minutes ou prenez un vrai repas — jamais un fil d’actualité.",
      },
      {
        type: "list",
        items: [
          "**Après un Pomodoro administratif** : cinq minutes de marche avant toute tâche exigeante.",
          "**Avant un bloc de Deep Work** : relisez votre ligne d’intention, coupez les notifications, fermez les onglets de la veille.",
          "**En fin de journée** : notez où vous reprendrez demain — c’est la transition la plus rentable de toutes, elle achète le démarrage du lendemain.",
        ],
      },
      {
        type: "quote",
        text: "Une méthode n’est pas une discipline de plus : c’est un choix sur ce que votre attention mérite. Choisissez-la pour un mois, mesurez, puis jugez.",
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
    readMinutes: 8,
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
      { type: "h2", text: "La pause parfaite, minute par minute" },
      {
        type: "list",
        ordered: true,
        items: [
          "**0:00** — Posez le stylet, poussez la chaise, levez-vous. Le simple fait de changer de posture bascule le rythme.",
          "**0:30** — Regardez au loin par la fenêtre pendant 20 secondes : les muscles de l’accommodation oculaire se relâchent.",
          "**1:00** — Buvez deux ou trois gorgées d’eau. La déshydratation légère dégrade l’attention avant même la sensation de soif.",
          "**2:00** — Marchez jusqu’à la fenêtre la plus lointaine, ou faites dix élévations d’épaules.",
          "**3:00** — Respirez en 4-6 : quatre secondes d’inspiration, six d’expiration, trois cycles.",
          "**5:00** — Retour au poste. Relisez votre ligne d’intention avant de relancer le minuteur.",
        ],
      },
      { type: "h2", text: "Adapter la pause à son environnement" },
      { type: "h3", text: "En open-space" },
      {
        type: "p",
        text: "Se lever à chaque pause peut sembler exposé : personne n’en tient rigueur, et la marche jusqu’à la machine à café ou à la fenêtre suffit. Un casque sert de signal visuel universel.",
      },
      { type: "h3", text: "En télétravail" },
      {
        type: "p",
        text: "Le piège du télétravail n’est pas la distraction mais l’absence de transitions. Sortir deux minutes sur le palier ou au balcon crée la rupture que l’open-space offre gratuitement.",
      },
      { type: "h3", text: "En bibliothèque" },
      {
        type: "p",
        text: "Étirez-vous assis, regardez au loin, marchez dans l’allée jusqu’aux rayonnages périphériques. La règle reste identique : quitter la position de travail.",
      },
      { type: "h2", text: "Et si vous n’avez que deux minutes ?" },
      {
        type: "p",
        text: "Fermez les yeux, respirez en 4-6 pendant quatre cycles, puis buvez une gorgée d’eau. C’est le strict minimum qui combine relâchement oculaire, respiration et hydratation. Une micro-pause de deux minutes vaut infiniment mieux qu’une pause parfaite reportée sine die.",
      },
      { type: "h2", text: "Trois pauses à tester cette semaine" },
      {
        type: "list",
        ordered: true,
        items: [
          "**La pause fenêtre** (3 min) : debout, regard au loin, sans téléphone. Comptez silencieusement cinq objets de couleur bleue : ce tri visuel doux éteint le verbal de la mémoire de travail.",
          "**La pause 4-6** (2 min) : inspiration quatre secondes, expiration six. L’expiration allongée active le système parasympathique — c’est le frein physiologique du stress.",
          "**La pause marche** (5 min) : hors du bureau si possible, sans objectif de pas. La créativité monte pendant la marche et redescend lentement : revenez directement à la tâche, pas aux notifications.",
        ],
      },
      { type: "h2", text: "Boire de l’eau : pourquoi c’est plus qu’un conseil générique" },
      {
        type: "p",
        text: "La déshydratation légère — celle qui ne déclenche même pas la soif — dégrade déjà la vigilance et la mémoire de travail. Or pendant une session intense, on oublie de boire. Le rituel qui fonctionne : un verre d’eau à chaque pause courte, rempli à chaque pause longue. L’habitude se greffe sur le minuteur, elle ne dépend plus de la mémoire.",
      },
      { type: "h2", text: "Le journal des pauses" },
      {
        type: "p",
        text: "Pendant une semaine, notez en une ligne ce que vous avez fait pendant chaque pause longue, et cotez de 1 à 5 l’énergie ressentie à la reprise. Trois jours suffisent généralement pour voir émerger votre profil : pour certains c’est la marche, pour d’autres la musique ou le silence les yeux fermés. Votre meilleure pause est une donnée personnelle — elle se mesure, elle ne se devine pas.",
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
    readMinutes: 7,
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
      { type: "h2", text: "Auto-diagnostic : votre pratique est-elle déraillée ?" },
      {
        type: "list",
        items: [
          "Vous comptez des Pomodoros mais votre liste de tâches n’avance pas.",
          "Vos « pauses » durent 20 minutes sur les réseaux sociaux.",
          "Vous interrompez régulièrement des sessions « juste pour une seconde ».",
          "Le minuteur tourne pendant que vous lisez vos emails.",
        ],
      },
      {
        type: "p",
        text: "Deux réponses positives ou plus : votre pratique mérite une remise à plat. La bonne nouvelle, c’est que les cinq erreurs ci-dessus se corrigent en une semaine de discipline bienveillante.",
      },
      { type: "h2", text: "Le plan de remise à niveau en une semaine" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Jour 1-2** : revenez aux 25 minutes strictes et à une seule tâche par session. Réduisez l’ambition pour rétablir la fiabilité.",
          "**Jour 3-4** : pauses debout, sans écran, chronométrées. Le téléphone quitte la pièce pendant toute la session ET la pause.",
          "**Jour 5** : mesurez. Comparez le nombre de tâches réellement terminées à votre moyenne des deux dernières semaines.",
          "**Jour 6-7** : ajustez une seule variable — durée des sessions ou des pauses — jamais les deux en même temps.",
        ],
      },
      { type: "h2", text: "Quand interrompre volontairement une session" },
      {
        type: "p",
        text: "Il existe un cas légitime d’abandon : quand vous réalisez que la tâche choisie n’était pas la bonne — prérequis manquant, information à demander, ou décision de niveau supérieur non prise. Dans ce cas, arrêtez le minuteur, consignez le blocage dans la tâche, et basculez sur une nouvelle session avec un objectif atteignable. Un Pomodoro interrompu en connaissance de cause n’est pas un échec : c’est de la planification.",
      },
      {
        type: "quote",
        text: "Un système fiable vaut mieux qu’une performance héroïque : vingt Pomodoros honnêtes valent mieux que quarante sessions fantaisistes.",
      },
      { type: "h2", text: "Erreur 6 (la plus sournoise) : refuser d’ajuster" },
      {
        type: "p",
        text: "Il existe une erreur que les cinq précédentes n’annoncent pas : coller aux 25 minutes par principe, alors que votre métier ou votre saison de vie a changé. Un développeur en architecture complexe, un parent de jeune enfant, un étudiant en période de concours n’ont pas le même profil d’attention. La méthode est une base de départ, pas un dogme : une fois la pratique stabilisée, ajuster la durée des sessions ou des pauses — une seule variable à la fois — est de la maturité, pas de la triche.",
      },
      {
        type: "list",
        items: [
          "**Sessions interrompues chaque jour** par la même contrainte ? C’est un signal de configuration, pas de volonté.",
          "**Pauses systématiquement dépassées** ? Elles sont trop courtes : passez de 5 à 8 minutes et mesurez.",
          "**Ennui récurrent en fin de session** ? Passez à 35-40 minutes pour les tâches d’immersion.",
        ],
      },
      { type: "h2", text: "La revue hebdomadaire en quatre questions" },
      {
        type: "p",
        text: "Cinq minutes chaque vendredi suffisent pour garder la pratique honnête. Posez-vous ces quatre questions, dans l’ordre :",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Quelle tâche a réellement avancé cette semaine — et combien de Pomodoros lui sont allés ?",
          "Où mes sessions se sont-elles cassées le plus souvent (moment, lieu, type de tâche) ?",
          "Quelle interruption revenir au moins trois fois ? Peut-elle être éliminée à la source ?",
          "Une seule chose à changer la semaine prochaine — laquelle ?",
        ],
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
    readMinutes: 8,
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
      { type: "h2", text: "La méthode des trois passes" },
      {
        type: "p",
        text: "Relire trois fois la même fiche est le meilleur moyen de la trouver familière sans la connaître. Structurez plutôt vos révisions en trois passes de nature différente :",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Passe 1 — la découverte** (Pomodoros de 25-30 min) : lecture active, surlignage minimal, questions en marge. L’objectif est de comprendre, pas de retenir.",
          "**Passe 2 — la récupération** (Pomodoros de 15-20 min) : fiche retournée, feuille blanche. On se teste, on vérifie, on note les trous — c’est la passe qui compte vraiment.",
          "**Passe 3 — la consolidation** (répartie sur les jours suivants) : re-test rapide des chapitres échoués, espacé selon la répétition espacée (J+1, J+3, J+7).",
        ],
      },
      { type: "h2", text: "Réviser à plusieurs : le Pomodoro collectif" },
      {
        type: "p",
        text: "Travailler en groupe détruit la concentration… à moins de partager la structure. Le format qui fonctionne : quatre personnes, un objectif commun, chacun sur son chapitre pendant 25 minutes, puis dix minutes d’explication croisée — chacun explique aux autres ce qu’il vient de réviser. Enseigner est la forme de récupération la plus puissante qui existe, et la structure commune empêche la session de dériver en conversation.",
      },
      { type: "h2", text: "La veille de l’examen" },
      {
        type: "list",
        items: [
          "**Pas de nouveau contenu** : la découverte la veille crée de l’anxiété sans mémorisation durable.",
          "**Révision rapide des fiches de récupération** : passe 2 en version condensée, une heure maximum.",
          "**Préparer le matériel** : papiers, calculatrice, convocation — chaque friction du matin coûte de l’énergie.",
          "**Dormir** : la consolidation mnésique se produit pendant le sommeil profond. Une nuit blanche annule des jours de travail.",
        ],
      },
      { type: "h3", text: "« Je panique en voyant la quantité à réviser »" },
      {
        type: "p",
        text: "Ne planifiez pas la matière : planifiez les Pomodoros. « Aujourd’hui, huit sessions » est apaisant ; « tout le chapitre 4, 5 et 6 » est paralysant. La méthode transforme une montagne en marches d’escalier.",
      },
      { type: "h2", text: "Construire sa feuille de route d’examen" },
      {
        type: "p",
        text: "Avant la première session, prenez 30 minutes pour transformer le programme en feuille de route : un chapitre par ligne, une estimation en Pomodoros, une case de passage 1/2/3 (les trois passes vues plus haut). Cette feuille remplace l’angoisse du « combien il reste » par une donnée visible — et chaque case cochée procure la petite satisfaction qui entretient l’élan. Recalculez vos estimations chaque soir : après trois jours, vos prédictions deviennent redoutablement précises.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Listez** tous les chapitres à couvrir, sans tri préalable.",
          "**Estimez** chaque chapitre en Pomodoros (comptez deux pour tout ce qui est nouveau).",
          "**Ordonnez** : bases d’abord — les chapitres dépendants viennent plus vite une fois les fondations acquises.",
          "**Planifiez** seulement les Pomodoros du jour, jamais toute la semaine d’avance.",
        ],
      },
      { type: "h2", text: "Musique, silence, bruit blanc : que choisir ?" },
      {
        type: "p",
        text: "La réponse dépend de la tâche, pas de votre goût. Pour la mémorisation, le silence gagne : les paroles entrent en compétition avec le matériel verbal à retenir. Pour les exercices mécaniques ou la rédaction, une musique instrumentale familière à volume bas aide à masquer l’environnement. Le bruit blanc ou le bruit rose est un bon compromis en open-space ou en résidence bruyante. Et si vous doutez, testez : une semaine avec, une semaine sans, en comparant vos Pomodoros réellement tenus.",
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
