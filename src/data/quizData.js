// Structure : Catégorie → Thème → Quiz → Questions
// Chaque question : { t: texte, o: options[], a: index_bonne_réponse, e: explication }
// Difficulté : easy (+5 XP), medium (+10 XP), hard (+20 XP)

export const CATEGORIES = {
  culture: {
    id: 'culture',
    label: 'Culture générale',
    icon: '🧠',
    color: '#9B6DFF',
    gradient: 'linear-gradient(135deg, #2a1f4e, #3d2a6e)',
    themes: {
      classique: {
        id: 'classique',
        label: 'Culture classique',
        icon: '📚',
        quizzes: [
          {
            id: 'cul-cl-1',
            name: 'Quiz #1 — Capitales du monde',
            diff: 'easy',
            category: 'culture',
            theme: 'classique',
            questions: [
              { t: "Quelle est la capitale de l'Australie ?", o: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], a: 2, e: "Canberra est la capitale fédérale depuis 1913, choisie comme compromis entre Sydney et Melbourne." },
              { t: "Quelle est la capitale du Canada ?", o: ['Toronto', 'Vancouver', 'Montréal', 'Ottawa'], a: 3, e: "Ottawa est la capitale fédérale du Canada depuis 1857." },
              { t: "Quelle est la capitale du Brésil ?", o: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], a: 2, e: "Brasília est la capitale depuis 1960, construite de toutes pièces au centre du pays." },
              { t: "Quelle est la capitale de la Nouvelle-Zélande ?", o: ['Auckland', 'Christchurch', 'Wellington', 'Hamilton'], a: 2, e: "Wellington est la capitale depuis 1865 ; Auckland est la plus grande ville." },
              { t: "Quelle est la capitale de l'Argentine ?", o: ['Córdoba', 'Buenos Aires', 'Mendoza', 'Rosario'], a: 1, e: "Buenos Aires est la capitale et la ville la plus peuplée d'Argentine." },
            ],
          },
          {
            id: 'cul-cl-2',
            name: 'Quiz #2 — Arts & Littérature',
            diff: 'medium',
            category: 'culture',
            theme: 'classique',
            questions: [
              { t: "Qui a peint la Joconde ?", o: ["Michel-Ange", "Raphaël", "Léonard de Vinci", "Botticelli"], a: 2, e: "La Joconde a été peinte par Léonard de Vinci entre 1503 et 1519. Elle est exposée au Louvre." },
              { t: "Qui a écrit 'Les Misérables' ?", o: ["Balzac", "Flaubert", "Victor Hugo", "Zola"], a: 2, e: "Victor Hugo publie Les Misérables en 1862, roman social majeur du XIXe siècle." },
              { t: "Dans quel musée se trouve la Joconde ?", o: ['British Museum', 'Prado', 'Louvre', 'Uffizi'], a: 2, e: "La Joconde est exposée au musée du Louvre à Paris depuis 1797." },
              { t: "Qui a composé la 5e symphonie ?", o: ['Mozart', 'Schubert', 'Beethoven', 'Chopin'], a: 2, e: "La 5e symphonie de Beethoven fut composée entre 1804 et 1808. Son motif initial est l'un des plus célèbres de l'histoire." },
              { t: "Quel peintre a coupé son oreille ?", o: ['Gauguin', 'Monet', 'Van Gogh', 'Cézanne'], a: 2, e: "Vincent van Gogh s'est coupé une partie de l'oreille en 1888, après une dispute avec Gauguin." },
            ],
          },
        ],
      },
      geographie: {
        id: 'geographie',
        label: 'Géographie',
        icon: '🌍',
        quizzes: [
          {
            id: 'cul-ge-1',
            name: 'Quiz #1 — Relief & Océans',
            diff: 'easy',
            category: 'culture',
            theme: 'geographie',
            questions: [
              { t: "Quel est le plus long fleuve du monde ?", o: ['Amazone', 'Nil', 'Yangtsé', 'Mississippi'], a: 1, e: "Le Nil mesure environ 6 650 km, traversant l'Afrique du nord jusqu'à la Méditerranée." },
              { t: "Quel est le plus haut sommet du monde ?", o: ['K2', 'Mont Blanc', 'Everest', 'Aconcagua'], a: 2, e: "L'Everest culmine à 8 849 m dans l'Himalaya, à la frontière Népal/Chine." },
              { t: "Quel est le plus grand océan ?", o: ['Atlantique', 'Indien', 'Arctique', 'Pacifique'], a: 3, e: "Le Pacifique couvre environ 165 millions de km², soit plus que tous les continents réunis." },
              { t: "Quel est le plus grand désert du monde ?", o: ['Sahara', 'Gobi', 'Antarctique', 'Arabie'], a: 2, e: "L'Antarctique est le plus grand désert (froid) du monde avec 14 millions de km²." },
              { t: "Sur combien de continents s'étend la Russie ?", o: ['1', '2', '3', '4'], a: 1, e: "La Russie s'étend sur l'Europe et l'Asie, séparés par les monts Oural." },
            ],
          },
        ],
      },
      histoire_gen: {
        id: 'histoire_gen',
        label: 'Histoire générale',
        icon: '📜',
        quizzes: [
          {
            id: 'cul-hi-1',
            name: 'Quiz #1 — Dates clés',
            diff: 'medium',
            category: 'culture',
            theme: 'histoire_gen',
            questions: [
              { t: "En quelle année la Révolution française a-t-elle débuté ?", o: ['1776', '1789', '1799', '1815'], a: 1, e: "La Révolution française commence avec la prise de la Bastille le 14 juillet 1789." },
              { t: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?", o: ['1488', '1490', '1492', '1498'], a: 2, e: "Christophe Colomb arrive aux Amériques le 12 octobre 1492." },
              { t: "En quelle année s'est terminée la Seconde Guerre mondiale ?", o: ['1943', '1944', '1945', '1946'], a: 2, e: "La Seconde Guerre mondiale se termine en 1945 avec la capitulation du Japon le 2 septembre." },
              { t: "Qui était le premier président des États-Unis ?", o: ['Lincoln', 'Jefferson', 'Franklin', 'Washington'], a: 3, e: "George Washington fut le premier président américain, de 1789 à 1797." },
              { t: "En quelle année est tombé le mur de Berlin ?", o: ['1987', '1988', '1989', '1990'], a: 2, e: "Le mur de Berlin est tombé le 9 novembre 1989, marquant la fin de la Guerre froide." },
            ],
          },
          {
            id: 'cul-hi-2',
            name: 'Quiz #2 — Personnages historiques',
            diff: 'hard',
            category: 'culture',
            theme: 'histoire_gen',
            questions: [
              { t: "Qui a dirigé l'URSS pendant la Seconde Guerre mondiale ?", o: ['Lénine', 'Khrouchtchev', 'Staline', 'Brejnev'], a: 2, e: "Joseph Staline dirige l'URSS de 1924 à 1953." },
              { t: "Qui a écrit 'Le Prince' ?", o: ['Voltaire', 'Machiavel', 'Rousseau', 'Montesquieu'], a: 1, e: "Nicolas Machiavel publie Le Prince vers 1513, traité politique fondateur." },
              { t: "Quel pharaon a fait construire la grande pyramide de Gizeh ?", o: ['Ramsès II', 'Toutânkhamon', 'Khéops', 'Khéphren'], a: 2, e: "La grande pyramide a été construite pour Khéops vers 2560 av. J.-C." },
              { t: "Qui a fondé l'empire mongol ?", o: ['Tamerlan', 'Gengis Khan', 'Kubilai Khan', 'Attila'], a: 1, e: "Gengis Khan fonde l'empire mongol au début du XIIIe siècle." },
              { t: "Quel scientifique a formulé la théorie de la gravitation universelle ?", o: ['Galilée', 'Kepler', 'Newton', 'Leibniz'], a: 2, e: "Isaac Newton formule la loi de la gravitation universelle en 1687 dans les Principia." },
            ],
          },
        ],
      },
    },
  },

  cinema: {
    id: 'cinema',
    label: 'Cinéma & Pop culture',
    icon: '🎬',
    color: '#FF5FA0',
    gradient: 'linear-gradient(135deg, #3a1f2a, #5a1f35)',
    themes: {
      classiques: {
        id: 'classiques',
        label: 'Films classiques',
        icon: '🎞️',
        quizzes: [
          {
            id: 'cin-cl-1',
            name: 'Quiz #1 — Les incontournables',
            diff: 'medium',
            category: 'cinema',
            theme: 'classiques',
            questions: [
              { t: "Qui a réalisé 'Inception' (2010) ?", o: ['Spielberg', 'Christopher Nolan', 'Cameron', 'Scott'], a: 1, e: "Inception est réalisé par Christopher Nolan, sorti en 2010." },
              { t: "Quel film a gagné l'Oscar du meilleur film en 2020 ?", o: ['1917', 'Joker', 'Parasite', 'The Irishman'], a: 2, e: "Parasite de Bong Joon-ho — première pour un film non-anglophone." },
              { t: "Qui joue Iron Man dans le MCU ?", o: ['Chris Evans', 'Robert Downey Jr.', 'Mark Ruffalo', 'Chris Hemsworth'], a: 1, e: "Robert Downey Jr. incarne Tony Stark de 2008 à 2019 dans le MCU." },
              { t: "Qui a composé la musique de Star Wars ?", o: ['Hans Zimmer', 'Morricone', 'John Williams', 'Danny Elfman'], a: 2, e: "John Williams a composé toutes les musiques principales de la saga Star Wars." },
              { t: "Dans quel film apparaît la réplique 'Je suis ton père' ?", o: ['Star Wars IV', 'Star Wars V', 'Star Wars VI', 'Star Wars III'], a: 1, e: "Cette réplique iconique est dans L'Empire contre-attaque (Star Wars V, 1980)." },
            ],
          },
          {
            id: 'cin-cl-2',
            name: 'Quiz #2 — Réalisateurs légendaires',
            diff: 'hard',
            category: 'cinema',
            theme: 'classiques',
            questions: [
              { t: "Qui a réalisé 'Psychose' (1960) ?", o: ['Orson Welles', 'Stanley Kubrick', 'Alfred Hitchcock', 'Billy Wilder'], a: 2, e: "Psychose est un chef-d'œuvre d'Alfred Hitchcock, maître du suspense." },
              { t: "Quel film de Kubrick se passe dans l'espace ?", o: ['Shining', 'Full Metal Jacket', '2001 : A Space Odyssey', 'Eyes Wide Shut'], a: 2, e: "2001 : L'Odyssée de l'espace, sorti en 1968, est une œuvre visionnaire." },
              { t: "Qui a réalisé 'La Dolce Vita' ?", o: ['Visconti', 'Antonioni', 'Fellini', 'Pasolini'], a: 2, e: "Federico Fellini réalise La Dolce Vita en 1960, Palme d'or à Cannes." },
              { t: "Quel réalisateur est connu pour 'Pulp Fiction' ?", o: ['Coen Brothers', 'David Lynch', 'Tarantino', 'Fincher'], a: 2, e: "Quentin Tarantino réalise Pulp Fiction en 1994, Palme d'or à Cannes." },
              { t: "Qui est le réalisateur de 'Parasite' ?", o: ['Park Chan-wook', 'Kim Ki-duk', 'Bong Joon-ho', 'Lee Chang-dong'], a: 2, e: "Bong Joon-ho réalise Parasite, Palme d'or à Cannes 2019 et Oscar du meilleur film 2020." },
            ],
          },
        ],
      },
      animation: {
        id: 'animation',
        label: "Cinéma d'animation",
        icon: '🎨',
        quizzes: [
          {
            id: 'cin-an-1',
            name: 'Quiz #1 — Disney & Pixar',
            diff: 'easy',
            category: 'cinema',
            theme: 'animation',
            questions: [
              { t: "Quel film Pixar met en scène des jouets qui prennent vie ?", o: ["Monstres & Cie", "Toy Story", "Cars", "Ratatouille"], a: 1, e: "Toy Story (1995) est le premier long métrage entièrement en images de synthèse." },
              { t: "Dans quel pays se déroule 'Ratatouille' ?", o: ['Italie', 'Espagne', 'France', 'Royaume-Uni'], a: 2, e: "Ratatouille se déroule à Paris, dans un grand restaurant gastronomique français." },
              { t: "Quel film Pixar traite de la mort et de l'au-delà ?", o: ['Up', 'Soul', 'Coco', 'Inside Out'], a: 2, e: "Coco (2017) explore la fête des morts mexicaine (Día de los Muertos)." },
              { t: "Quel est le premier film Disney à avoir une princesse noire ?", o: ['Mulan', 'Pocahontas', 'La Princesse et la Grenouille', 'Vaiana'], a: 2, e: "Tiana dans La Princesse et la Grenouille (2009) est la première princesse noire Disney." },
              { t: "Dans quel studio a été produit 'Le Voyage de Chihiro' ?", o: ['Disney', 'Pixar', 'DreamWorks', 'Studio Ghibli'], a: 3, e: "Le Voyage de Chihiro (2001) est produit par le Studio Ghibli de Hayao Miyazaki." },
            ],
          },
        ],
      },
      musique: {
        id: 'musique',
        label: 'Musique & Pop culture',
        icon: '🎵',
        quizzes: [
          {
            id: 'cin-mu-1',
            name: 'Quiz #1 — Pop & Rock',
            diff: 'easy',
            category: 'cinema',
            theme: 'musique',
            questions: [
              { t: "Quel groupe a chanté 'Bohemian Rhapsody' ?", o: ['The Beatles', 'Led Zeppelin', 'Queen', 'Rolling Stones'], a: 2, e: "Bohemian Rhapsody est une chanson de Queen sortie en 1975, écrite par Freddie Mercury." },
              { t: "Quel artiste est surnommé 'The King of Pop' ?", o: ['Elvis', 'Prince', 'Michael Jackson', 'David Bowie'], a: 2, e: "Michael Jackson a reçu ce surnom dans les années 1980 grâce à des albums comme Thriller." },
              { t: "De quel pays viennent les Beatles ?", o: ['États-Unis', 'Australie', 'Angleterre', 'Canada'], a: 2, e: "Les Beatles sont originaires de Liverpool, Angleterre. Ils se forment en 1960." },
              { t: "Quel instrument joue Jimi Hendrix ?", o: ['Batterie', 'Basse', 'Guitare', 'Piano'], a: 2, e: "Jimi Hendrix est considéré comme l'un des plus grands guitaristes de tous les temps." },
              { t: "Quelle chanteuse est connue sous le nom 'Lady Gaga' ?", o: ['Stefani Germanotta', 'Christina Aguilera', 'Katy Perry', 'Ariana Grande'], a: 0, e: "Lady Gaga est le pseudonyme de Stefani Joanne Angelina Germanotta." },
            ],
          },
        ],
      },
    },
  },

  sciences: {
    id: 'sciences',
    label: 'Sciences & Tech',
    icon: '🔬',
    color: '#3DFFD0',
    gradient: 'linear-gradient(135deg, #1f3a2e, #1a4d3a)',
    themes: {
      physique: {
        id: 'physique',
        label: 'Physique',
        icon: '⚛️',
        quizzes: [
          {
            id: 'sci-ph-1',
            name: 'Quiz #1 — Lois fondamentales',
            diff: 'medium',
            category: 'sciences',
            theme: 'physique',
            questions: [
              { t: "Quelle est la vitesse de la lumière ?", o: ['200 000 km/s', '300 000 km/s', '400 000 km/s', '150 000 km/s'], a: 1, e: "La vitesse de la lumière dans le vide est d'environ 299 792 km/s." },
              { t: "Quelle est la loi d'Einstein la plus célèbre ?", o: ['F=ma', 'E=hv', 'E=mc²', 'PV=nRT'], a: 2, e: "E=mc² exprime l'équivalence entre masse et énergie, publiée en 1905." },
              { t: "Quel physicien a formulé les lois du mouvement ?", o: ['Galilée', 'Kepler', 'Einstein', 'Newton'], a: 3, e: "Isaac Newton formule ses 3 lois du mouvement en 1687 dans les Principia Mathematica." },
              { t: "Quelle est l'unité de mesure de la force ?", o: ['Joule', 'Watt', 'Newton', 'Pascal'], a: 2, e: "Le Newton (N) est l'unité SI de force, nommée en l'honneur d'Isaac Newton." },
              { t: "Qu'est-ce qu'un trou noir ?", o: ['Une étoile froide', 'Un vide interstellaire', "Un objet dont la gravité empêche la lumière de s'échapper", 'Un nuage de gaz'], a: 2, e: "Un trou noir est une région de l'espace-temps où la gravité est si intense que rien ne peut s'en échapper, pas même la lumière." },
            ],
          },
        ],
      },
      informatique: {
        id: 'informatique',
        label: 'Informatique & Tech',
        icon: '💻',
        quizzes: [
          {
            id: 'sci-it-1',
            name: "Quiz #1 — Bases de l'info",
            diff: 'easy',
            category: 'sciences',
            theme: 'informatique',
            questions: [
              { t: "Que signifie 'CPU' ?", o: ['Central Processing Unit', 'Computer Power Unit', 'Core Processing Update', 'Central Power Unit'], a: 0, e: "CPU = Central Processing Unit, le processeur central d'un ordinateur." },
              { t: "Quel langage est natif du web côté navigateur ?", o: ['Python', 'Java', 'JavaScript', 'C++'], a: 2, e: "JavaScript est le seul langage natif des navigateurs web, créé par Brendan Eich en 1995." },
              { t: "Qui a fondé Apple ?", o: ['Bill Gates', 'Steve Jobs et Steve Wozniak', 'Elon Musk', 'Jeff Bezos'], a: 1, e: "Apple est fondée en 1976 par Steve Jobs, Steve Wozniak et Ronald Wayne." },
              { t: "Combien de bits dans un octet ?", o: ['4', '6', '8', '16'], a: 2, e: "Un octet (byte) est composé de 8 bits. C'est l'unité de base du stockage numérique." },
              { t: "Qui a inventé le World Wide Web ?", o: ['Bill Gates', 'Tim Berners-Lee', 'Vint Cerf', 'Larry Page'], a: 1, e: "Tim Berners-Lee invente le Web en 1989 au CERN, à Genève." },
            ],
          },
          {
            id: 'sci-it-2',
            name: 'Quiz #2 — Tech avancée',
            diff: 'hard',
            category: 'sciences',
            theme: 'informatique',
            questions: [
              { t: "En quelle année le premier iPhone est-il sorti ?", o: ['2005', '2006', '2007', '2008'], a: 2, e: "Steve Jobs présente le premier iPhone le 9 janvier 2007 à la MacWorld Conference." },
              { t: "Qu'est-ce que le 'machine learning' ?", o: ['Programmation manuelle', 'Apprentissage automatique', 'Maintenance des machines', 'Réseau électrique'], a: 1, e: "Le machine learning est une branche de l'IA permettant aux systèmes d'apprendre à partir de données." },
              { t: "Quel est le protocole de base d'Internet ?", o: ['FTP', 'HTTP', 'TCP/IP', 'SMTP'], a: 2, e: "TCP/IP est la suite de protocoles fondamentale d'Internet, standardisée en 1983." },
              { t: "Que signifie 'API' ?", o: ['Application Programming Interface', 'Automated Process Integration', 'Advanced Program Input', 'Application Protocol Index'], a: 0, e: "API = Application Programming Interface, interface permettant à des logiciels de communiquer entre eux." },
              { t: "Quel langage est utilisé pour les bases de données relationnelles ?", o: ['Python', 'Java', 'SQL', 'PHP'], a: 2, e: "SQL (Structured Query Language) est le langage standard pour interagir avec les bases de données relationnelles." },
            ],
          },
        ],
      },
      biologie: {
        id: 'biologie',
        label: 'Biologie',
        icon: '🧬',
        quizzes: [
          {
            id: 'sci-bi-1',
            name: 'Quiz #1 — Corps humain',
            diff: 'easy',
            category: 'sciences',
            theme: 'biologie',
            questions: [
              { t: "Combien de chromosomes a une cellule humaine normale ?", o: ['23', '44', '46', '48'], a: 2, e: "Les cellules humaines contiennent 46 chromosomes, soit 23 paires." },
              { t: "Quel organe produit l'insuline ?", o: ['Foie', 'Rein', 'Pancréas', 'Rate'], a: 2, e: "Le pancréas produit l'insuline, hormone régulant le taux de glucose dans le sang." },
              { t: "Combien d'os compte le corps humain adulte ?", o: ['186', '206', '226', '246'], a: 1, e: "Le corps humain adulte compte 206 os. Un nouveau-né en a environ 270, qui fusionnent en grandissant." },
              { t: "Quel est le groupe sanguin universel donneur ?", o: ['A+', 'B-', 'AB+', 'O-'], a: 3, e: "Le groupe O- est donneur universel car il est compatible avec tous les autres groupes sanguins." },
              { t: "Quel gaz inspire-t-on principalement lors de la respiration ?", o: ['CO2', 'Azote', 'Oxygène', 'Argon'], a: 2, e: "On inspire de l'air contenant ~21% d'oxygène, utilisé par les cellules pour produire de l'énergie." },
            ],
          },
        ],
      },
    },
  },

  sport: {
    id: 'sport',
    label: 'Sport',
    icon: '⚽',
    color: '#FFE14D',
    gradient: 'linear-gradient(135deg, #2a2a1f, #3d3a18)',
    themes: {
      football: {
        id: 'football',
        label: 'Football',
        icon: '⚽',
        quizzes: [
          {
            id: 'spo-fo-1',
            name: 'Quiz #1 — Compétitions & Records',
            diff: 'easy',
            category: 'sport',
            theme: 'football',
            questions: [
              { t: "Combien de joueurs dans une équipe de foot sur le terrain ?", o: ['9', '10', '11', '12'], a: 2, e: "11 joueurs par équipe, soit 22 au total sur le terrain." },
              { t: "Quel pays a gagné la Coupe du monde 2018 ?", o: ['Brésil', 'Argentine', 'France', 'Allemagne'], a: 2, e: "La France bat la Croatie 4-2 en finale à Moscou le 15 juillet 2018." },
              { t: "Quel club a gagné le plus de Ligues des Champions ?", o: ['Barcelone', 'Bayern Munich', 'Real Madrid', 'Liverpool'], a: 2, e: "Le Real Madrid est le club le plus titré avec 15 victoires en Ligue des Champions." },
              { t: "Qui est le meilleur buteur de l'histoire de la Coupe du monde ?", o: ['Pelé', 'Ronaldo', 'Miroslav Klose', 'Gerd Müller'], a: 2, e: "Miroslav Klose détient le record avec 16 buts en Coupe du monde (2002-2014)." },
              { t: "En quelle année la France a-t-elle gagné sa première Coupe du monde ?", o: ['1994', '1996', '1998', '2000'], a: 2, e: "La France remporte le Mondial 1998 à domicile, battant le Brésil 3-0 en finale." },
            ],
          },
        ],
      },
      athletisme: {
        id: 'athletisme',
        label: 'Athlétisme',
        icon: '🏃',
        quizzes: [
          {
            id: 'spo-at-1',
            name: 'Quiz #1 — Sprints & Records',
            diff: 'medium',
            category: 'sport',
            theme: 'athletisme',
            questions: [
              { t: "Qui détient le record du monde du 100m ?", o: ['Justin Gatlin', 'Tyson Gay', 'Usain Bolt', 'Yohan Blake'], a: 2, e: "Usain Bolt détient le record avec 9,58s aux Championnats du monde 2009 à Berlin." },
              { t: "Sur quelle distance court-on un marathon ?", o: ['40 km', '42,195 km', '44 km', '45 km'], a: 1, e: "Le marathon mesure exactement 42,195 km, distance fixée aux JO de Londres en 1908." },
              { t: "Qui détient le record de médailles d'or olympiques ?", o: ['Carl Lewis', 'Jesse Owens', 'Usain Bolt', 'Michael Phelps'], a: 3, e: "Michael Phelps détient le record avec 23 médailles d'or olympiques en natation." },
              { t: "En quelle ville se sont tenus les JO d'été 2024 ?", o: ['Los Angeles', 'Tokyo', 'Brisbane', 'Paris'], a: 3, e: "Les Jeux Olympiques d'été 2024 se sont tenus à Paris, en France." },
              { t: "Quel pays a remporté le plus de médailles aux JO 2024 ?", o: ['Chine', 'Australie', 'États-Unis', 'France'], a: 2, e: "Les États-Unis ont dominé le tableau des médailles aux JO de Paris 2024." },
            ],
          },
        ],
      },
      tennis: {
        id: 'tennis',
        label: 'Tennis',
        icon: '🎾',
        quizzes: [
          {
            id: 'spo-te-1',
            name: 'Quiz #1 — Grand Chelem',
            diff: 'medium',
            category: 'sport',
            theme: 'tennis',
            questions: [
              { t: "Combien de tournois du Grand Chelem existe-t-il ?", o: ['3', '4', '5', '6'], a: 1, e: "4 tournois : Australian Open, Roland-Garros, Wimbledon, US Open." },
              { t: "Sur quelle surface se joue Roland-Garros ?", o: ['Gazon', 'Dur', 'Terre battue', 'Moquette'], a: 2, e: "Roland-Garros se joue sur terre battue rouge, à Paris." },
              { t: "Qui détient le record de titres en Grand Chelem (hommes) ?", o: ['Federer', 'Djokovic', 'Nadal', 'Agassi'], a: 1, e: "Novak Djokovic détient le record avec 24 titres du Grand Chelem." },
              { t: "Quel pays accueille l'Australian Open ?", o: ['Nouvelle-Zélande', 'Australie', 'Afrique du Sud', 'Argentine'], a: 1, e: "L'Australian Open se tient à Melbourne Park, en Australie." },
              { t: "Sur quelle surface se joue Wimbledon ?", o: ['Terre battue', 'Dur', 'Gazon', 'Synthétique'], a: 2, e: "Wimbledon est le seul Grand Chelem encore joué sur gazon naturel, à Londres." },
            ],
          },
        ],
      },
    },
  },

  histoire: {
    id: 'histoire',
    label: 'Histoire & Géo',
    icon: '🗺️',
    color: '#378ADD',
    gradient: 'linear-gradient(135deg, #1f2a3a, #1a3050)',
    themes: {
      antiquite: {
        id: 'antiquite',
        label: 'Antiquité',
        icon: '🏛️',
        quizzes: [
          {
            id: 'his-an-1',
            name: "Quiz #1 — Grèce & Rome antiques",
            diff: 'medium',
            category: 'histoire',
            theme: 'antiquite',
            questions: [
              { t: "Qui était le dieu principal de la mythologie grecque ?", o: ['Poséidon', 'Apollon', 'Zeus', 'Arès'], a: 2, e: "Zeus est le roi des dieux de l'Olympe dans la mythologie grecque." },
              { t: "Quelle civilisation a construit le Colisée ?", o: ['Grecque', 'Égyptienne', 'Romaine', 'Perse'], a: 2, e: "Le Colisée a été construit par les Romains entre 70 et 80 ap. J.-C." },
              { t: "Qui a fondé l'empire macédonien ?", o: ['César', 'Alexandre le Grand', 'Périclès', 'Hannibal'], a: 1, e: "Alexandre le Grand fonde un empire s'étendant de la Grèce à l'Inde au IVe s. av. J.-C." },
              { t: "Quel philosophe est le maître d'Aristote ?", o: ['Socrate', 'Platon', 'Héraclite', 'Pythagore'], a: 1, e: "Platon fut le maître d'Aristote à l'Académie d'Athènes." },
              { t: "Quel empire a été fondé par Jules César ?", o: ["L'empire grec", "L'empire romain", "L'empire perse", "L'empire ottoman"], a: 1, e: "Jules César a joué un rôle majeur dans la transformation de la République romaine en Empire romain." },
            ],
          },
        ],
      },
      modernite: {
        id: 'modernite',
        label: 'Époque moderne',
        icon: '⚔️',
        quizzes: [
          {
            id: 'his-mo-1',
            name: 'Quiz #1 — XVe–XVIIIe siècle',
            diff: 'hard',
            category: 'histoire',
            theme: 'modernite',
            questions: [
              { t: "Qui était Louis XIV ?", o: ['Le roi de la Révolution', 'Le Roi-Soleil', 'Le Premier consul', "L'Empereur"], a: 1, e: "Louis XIV, dit le Roi-Soleil, règne de 1643 à 1715 — le règne le plus long de l'histoire de France." },
              { t: "Qu'est-ce que la Renaissance ?", o: ['Une révolution politique', 'Un mouvement artistique et culturel', 'Une guerre européenne', 'Une réforme religieuse'], a: 1, e: "La Renaissance est un mouvement culturel qui commence en Italie au XIVe siècle, redécouvrant l'Antiquité." },
              { t: "En quelle année Christophe Colomb arrive-t-il en Amérique ?", o: ['1488', '1490', '1492', '1498'], a: 2, e: "Christophe Colomb arrive le 12 octobre 1492 aux Bahamas." },
              { t: "Qui était Napoléon Bonaparte ?", o: ['Un roi français', 'Un général et empereur français', 'Un révolutionnaire jacobin', 'Un philosophe des Lumières'], a: 1, e: "Napoléon Bonaparte est Consul puis Empereur des Français de 1804 à 1814." },
              { t: "Quelle révolution a précédé la Révolution française dans le monde occidental ?", o: ['Révolution industrielle', 'Révolution américaine', 'Révolution russe', 'Révolution anglaise'], a: 1, e: "La Révolution américaine (1775-1783) a précédé et inspiré la Révolution française de 1789." },
            ],
          },
        ],
      },
      geo_monde: {
        id: 'geo_monde',
        label: 'Géopolitique',
        icon: '🌐',
        quizzes: [
          {
            id: 'his-ge-1',
            name: 'Quiz #1 — Pays & Frontières',
            diff: 'medium',
            category: 'histoire',
            theme: 'geo_monde',
            questions: [
              { t: "Quel pays a la plus grande superficie du monde ?", o: ['Canada', 'Chine', 'USA', 'Russie'], a: 3, e: "La Russie couvre 17,1 millions de km², soit environ 11% des terres émergées." },
              { t: "Combien de pays membres compte l'ONU ?", o: ['165', '180', '193', '210'], a: 2, e: "193 pays sont membres de l'Organisation des Nations Unies." },
              { t: "Quel est le plus petit pays du monde ?", o: ['Monaco', 'Liechtenstein', 'Vatican', 'Andorre'], a: 2, e: "Le Vatican (0,44 km²) est le plus petit État reconnu du monde." },
              { t: "Quel pays possède le plus grand nombre de voisins ?", o: ['Russie', 'Brésil', 'Chine', 'France'], a: 0, e: "La Russie et la Chine partagent le record avec 14 pays voisins chacun." },
              { t: "Quelle organisation regroupe les pays d'Europe ?", o: ["L'OTAN", "L'ONU", "L'UE", "Le G20"], a: 2, e: "L'Union Européenne (UE) regroupe 27 pays membres partageant des politiques communes." },
            ],
          },
        ],
      },
    },
  },

  langues: {
    id: 'langues',
    label: 'Langues',
    icon: '🌍',
    color: '#FF7A3D',
    gradient: 'linear-gradient(135deg, #2a1f1f, #4a2a1a)',
    themes: {
      langues_monde: {
        id: 'langues_monde',
        label: 'Langues du monde',
        icon: '💬',
        quizzes: [
          {
            id: 'lan-lm-1',
            name: 'Quiz #1 — Langues & Origines',
            diff: 'easy',
            category: 'langues',
            theme: 'langues_monde',
            questions: [
              { t: "Quelle langue est la plus parlée au monde ?", o: ['Espagnol', 'Anglais', 'Mandarin', 'Hindi'], a: 2, e: "Le mandarin est parlé par environ 1,1 milliard de locuteurs natifs." },
              { t: "Combien de langues officielles a la Suisse ?", o: ['2', '3', '4', '5'], a: 2, e: "4 langues : allemand, français, italien et romanche." },
              { t: "Dans quelle famille de langues est le français ?", o: ['Germanique', 'Slave', 'Romane', 'Celtique'], a: 2, e: "Le français est une langue romane, descendante du latin vulgaire." },
              { t: "Quel est l'alphabet le plus utilisé au monde ?", o: ['Cyrillique', 'Latin', 'Arabe', 'Devanagari'], a: 1, e: "L'alphabet latin est utilisé par plus d'un tiers de la population mondiale." },
              { t: "Quelle langue s'écrit de droite à gauche ?", o: ['Chinois', 'Hindi', 'Arabe', 'Japonais'], a: 2, e: "L'arabe (comme l'hébreu) s'écrit de droite à gauche." },
            ],
          },
        ],
      },
      vocabulaire: {
        id: 'vocabulaire',
        label: 'Vocabulaire & Traduction',
        icon: '📖',
        quizzes: [
          {
            id: 'lan-vo-1',
            name: 'Quiz #1 — Bonjour dans le monde',
            diff: 'easy',
            category: 'langues',
            theme: 'vocabulaire',
            questions: [
              { t: "Comment dit-on 'merci' en japonais ?", o: ['Arigatou', 'Konnichiwa', 'Sayonara', 'Ohayo'], a: 0, e: "Arigatou (ありがとう) signifie merci en japonais." },
              { t: "Comment dit-on 'bonjour' en arabe ?", o: ['Shukran', 'Marhaba', 'Inshallah', 'Salam'], a: 1, e: "Marhaba (مرحبا) est une salutation courante en arabe." },
              { t: "Que signifie 'Grazie' en italien ?", o: ['Bonjour', 'Au revoir', 'Merci', "S'il vous plaît"], a: 2, e: "Grazie signifie merci en italien." },
              { t: "Comment dit-on 'oui' en allemand ?", o: ['Nein', 'Ja', 'Bitte', 'Danke'], a: 1, e: "Ja signifie oui en allemand. Nein signifie non." },
              { t: "'Obrigado' signifie merci dans quelle langue ?", o: ['Espagnol', 'Roumain', 'Portugais', 'Catalan'], a: 2, e: "Obrigado est le mot pour merci en portugais (obrigada au féminin)." },
            ],
          },
          {
            id: 'lan-vo-2',
            name: 'Quiz #2 — Faux amis',
            diff: 'hard',
            category: 'langues',
            theme: 'vocabulaire',
            questions: [
              { t: "En anglais, 'library' signifie :", o: ['Librairie (livres à vendre)', 'Bibliothèque', 'Libraire', 'Libre'], a: 1, e: "Library = bibliothèque. Librairie se dit 'bookshop' ou 'bookstore' en anglais." },
              { t: "En espagnol, 'embarazada' signifie :", o: ['Embarrassée', 'Confuse', 'Enceinte', 'Fâchée'], a: 2, e: "Embarazada signifie enceinte — un célèbre faux-ami avec 'embarrassed' (gêné)." },
              { t: "En anglais, 'actually' signifie :", o: ['Actuellement', 'En fait / vraiment', 'Heureusement', 'Rarement'], a: 1, e: "Actually = en fait, vraiment. Actuellement se dit 'currently' ou 'nowadays'." },
              { t: "En italien, 'burro' signifie :", o: ['Âne', 'Beurre', 'Brûler', 'Brume'], a: 1, e: "Burro signifie beurre en italien — pas de rapport avec l'animal (que les Italiens appellent 'asino') !" },
              { t: "En anglais, 'sensible' signifie :", o: ['Sensible (émotif)', 'Raisonnable / sensé', 'Sensitif', 'Sentimental'], a: 1, e: "Sensible en anglais = raisonnable, sensé. Sensible (émotif) se dit 'sensitive'." },
            ],
          },
        ],
      },
      etymologie: {
        id: 'etymologie',
        label: 'Étymologie',
        icon: '🔤',
        quizzes: [
          {
            id: 'lan-et-1',
            name: 'Quiz #1 — Origines des mots',
            diff: 'hard',
            category: 'langues',
            theme: 'etymologie',
            questions: [
              { t: "D'où vient le mot 'robot' ?", o: ['Latin', 'Anglais', 'Tchèque', 'Allemand'], a: 2, e: "Robot vient du tchèque 'robota' (travail forcé), utilisé pour la 1ère fois par Karel Čapek en 1920." },
              { t: "Quel mot vient du grec 'demokratia' ?", o: ['Diplomatie', 'Démocratie', 'Démographie', 'Dématérialiser'], a: 1, e: "Démocratie vient du grec demos (peuple) + kratos (pouvoir)." },
              { t: "D'où vient le mot 'chocolat' ?", o: ['Espagnol', 'Aztèque (nahuatl)', 'Arabe', 'Portugais'], a: 1, e: "Chocolat vient du nahuatl 'xocolatl' des Aztèques." },
              { t: "D'où vient le mot 'alcool' ?", o: ['Latin', 'Persan', 'Arabe', 'Grec'], a: 2, e: "Alcool vient de l'arabe 'al-kuhul', un antimoine pulvérisé utilisé pour le maquillage." },
              { t: "Quel est le sens originel du mot 'catastrophe' en grec ?", o: ['Tremblement de terre', 'Renversement / bouleversement', 'Fin du monde', 'Chaos'], a: 1, e: "Katastrophe en grec = renversement (kata = en bas, strephein = tourner)." },
            ],
          },
        ],
      },
    },
  },
  gastronomie: {
    id: 'gastronomie',
    label: 'Gastronomie & Cuisine',
    icon: '🍕',
    color: '#FF7A3D',
    gradient: 'linear-gradient(135deg, #3a2010, #5a3015)',
    themes: {
      cuisine_monde: {
        id: 'cuisine_monde',
        label: 'Cuisines du monde',
        icon: '🌍',
        quizzes: [
          {
            id: 'gas-cm-1',
            name: 'Quiz #1 — Plats emblématiques',
            diff: 'easy',
            category: 'gastronomie',
            theme: 'cuisine_monde',
            questions: [
              { t: "De quel pays est originaire la pizza ?", o: ['Espagne', 'Grèce', 'Italie', 'France'], a: 2, e: "La pizza est originaire de Naples, en Italie. La pizza Margherita date de 1889." },
              { t: "Qu'est-ce que le 'sushi' ?", o: ['Un plat chinois', 'Un plat japonais', 'Un plat coréen', 'Un plat thaïlandais'], a: 1, e: "Le sushi est un plat japonais à base de riz vinaigré accompagné de poisson cru ou d'autres ingrédients." },
              { t: "De quel pays vient le croissant ?", o: ['France', 'Autriche', 'Belgique', 'Suisse'], a: 1, e: "Le croissant est originaire d'Autriche (kipferl), popularisé en France au XIXe siècle." },
              { t: "Qu'est-ce que la paella ?", o: ['Un plat mexicain', 'Un plat portugais', 'Un plat espagnol', 'Un plat argentin'], a: 2, e: "La paella est un plat espagnol originaire de Valence, à base de riz safrané et de viande ou fruits de mer." },
              { t: "De quel pays vient le couscous ?", o: ['Maroc', 'Tunisie', 'Algérie', 'Afrique du Nord (partagé)'], a: 3, e: "Le couscous est partagé entre plusieurs pays d'Afrique du Nord — Maroc, Algérie, Tunisie. Il est inscrit au patrimoine de l'UNESCO." },
            ],
          },
          {
            id: 'gas-cm-2',
            name: 'Quiz #2 — Ingrédients & Épices',
            diff: 'medium',
            category: 'gastronomie',
            theme: 'cuisine_monde',
            questions: [
              { t: "Quelle épice est la plus chère au monde ?", o: ['Vanille', 'Safran', 'Cardamome', 'Poivre long'], a: 1, e: "Le safran est l'épice la plus chère au monde, issu des stigmates du crocus sativus." },
              { t: "De quelle plante vient le chocolat ?", o: ['Caféier', 'Cacaoyer', 'Vanillier', 'Cannelier'], a: 1, e: "Le chocolat est fabriqué à partir des fèves du cacaoyer (Theobroma cacao)." },
              { t: "Qu'est-ce que le wasabi ?", o: ['Une sauce soja', 'Un poisson séché', 'Une plante japonaise au goût piquant', 'Un vinaigre de riz'], a: 2, e: "Le wasabi est une plante japonaise dont la racine râpée produit une pâte verte au goût très piquant." },
              { t: "De quel fruit est extrait l'huile d'olive ?", o: ['Avocat', 'Olive', 'Noix', 'Amande'], a: 1, e: "L'huile d'olive est extraite par pression des olives, fruit de l'olivier." },
              { t: "Qu'est-ce que le miso ?", o: ['Un vin de riz japonais', 'Une pâte fermentée de soja japonaise', 'Un fromage japonais', 'Une sauce pimentée'], a: 1, e: "Le miso est une pâte fermentée japonaise à base de soja, utilisée notamment pour la soupe miso." },
            ],
          },
        ],
      },
      cuisine_francaise: {
        id: 'cuisine_francaise',
        label: 'Cuisine française',
        icon: '🥐',
        quizzes: [
          {
            id: 'gas-cf-1',
            name: 'Quiz #1 — Classiques français',
            diff: 'easy',
            category: 'gastronomie',
            theme: 'cuisine_francaise',
            questions: [
              { t: "Quelle est la principale région productrice de champagne ?", o: ['Bourgogne', 'Bordeaux', 'Champagne', 'Alsace'], a: 2, e: "La région Champagne, autour de Reims et Épernay, est le berceau du champagne." },
              { t: "Qu'est-ce que la bouillabaisse ?", o: ['Un dessert provençal', 'Une soupe de poisson marseillaise', 'Un fromage du Sud', 'Une tarte aux légumes'], a: 1, e: "La bouillabaisse est une soupe de poisson traditionnelle de Marseille, à base de plusieurs espèces de poissons." },
              { t: "De quelle région vient le camembert ?", o: ['Bretagne', 'Normandie', 'Alsace', 'Auvergne'], a: 1, e: "Le camembert est originaire de Normandie, créé à Camembert vers la fin du XVIIIe siècle." },
              { t: "Qu'est-ce qu'un macaron ?", o: ['Un gâteau breton', 'Une pâtisserie à base de meringue et ganache', 'Un biscuit alsacien', 'Un pain sucré normand'], a: 1, e: "Le macaron parisien est une pâtisserie composée de deux coques de meringue aux amandes et d'une ganache." },
              { t: "Quel est le fromage français le plus consommé ?", o: ['Brie', 'Camembert', 'Comté', 'Emmental'], a: 3, e: "L'emmental est le fromage le plus consommé en France, suivi du comté." },
            ],
          },
        ],
      },
      gastronomie_pro: {
        id: 'gastronomie_pro',
        label: 'Gastronomie & Chefs',
        icon: '👨‍🍳',
        quizzes: [
          {
            id: 'gas-gp-1',
            name: 'Quiz #1 — Grands chefs & Étoiles',
            diff: 'hard',
            category: 'gastronomie',
            theme: 'gastronomie_pro',
            questions: [
              { t: "Qui est le guide gastronomique de référence en France ?", o: ['Gault & Millau', 'Guide Michelin', 'Zagat', 'Le Fooding'], a: 1, e: "Le Guide Michelin, créé en 1900 par les frères Michelin, est la référence mondiale de la gastronomie." },
              { t: "Combien d'étoiles Michelin peut obtenir un restaurant au maximum ?", o: ['1', '2', '3', '5'], a: 2, e: "Le maximum est 3 étoiles Michelin, synonyme de 'cuisine exceptionnelle, qui vaut le voyage'." },
              { t: "Quel chef français a été le premier à obtenir 3 étoiles Michelin ?", o: ['Paul Bocuse', 'Eugénie Brazier', 'Fernand Point', 'Auguste Escoffier'], a: 1, e: "Eugénie Brazier fut la première personne à obtenir 3 étoiles Michelin en 1933, pour deux restaurants simultanément." },
              { t: "Qu'est-ce que la 'cuisine moléculaire' ?", o: ['Une cuisine basse calorie', 'Une cuisine qui applique la science aux techniques culinaires', 'Une cuisine végane', 'Une cuisine rapide'], a: 1, e: "La cuisine moléculaire utilise les sciences pour transformer les textures et saveurs — popularisée par Ferran Adrià et Heston Blumenthal." },
              { t: "Quel est le plat signature de Paul Bocuse ?", o: ['La bouillabaisse', 'La soupe aux truffes VGE', 'Le bœuf bourguignon', 'Le foie gras poêlé'], a: 1, e: "La soupe aux truffes VGE (Valéry Giscard d'Estaing) fut créée par Paul Bocuse en 1975 pour l'Élysée." },
            ],
          },
        ],
      },
    },
  },

  jeux_video: {
    id: 'jeux_video',
    label: 'Jeux vidéo',
    icon: '🎮',
    color: '#9B6DFF',
    gradient: 'linear-gradient(135deg, #1a0f3a, #2d1a5e)',
    themes: {
      classiques_jv: {
        id: 'classiques_jv',
        label: 'Classiques & Histoire',
        icon: '👾',
        quizzes: [
          {
            id: 'jv-cl-1',
            name: 'Quiz #1 — Origines du jeu vidéo',
            diff: 'medium',
            category: 'jeux_video',
            theme: 'classiques_jv',
            questions: [
              { t: "Quel est considéré comme le premier jeu vidéo commercial ?", o: ['Pac-Man', 'Pong', 'Space Invaders', 'Tetris'], a: 1, e: "Pong, sorti par Atari en 1972, est le premier jeu vidéo commercial grand public." },
              { t: "Qui est le créateur de Mario ?", o: ['Hideo Kojima', 'Shigeru Miyamoto', 'Yuji Naka', 'Masahiro Sakurai'], a: 1, e: "Shigeru Miyamoto crée Mario (appelé Jumpman) en 1981 pour Donkey Kong." },
              { t: "Sur quelle console est sorti le premier Zelda ?", o: ['Super Nintendo', 'Game Boy', 'NES (Famicom)', 'Atari'], a: 2, e: "The Legend of Zelda sort en 1986 sur NES (Famicom) au Japon." },
              { t: "Qui a créé Tetris ?", o: ['Shigeru Miyamoto', 'Alexeï Pajitnov', 'Sid Meier', 'Will Wright'], a: 1, e: "Tetris est créé par le programmeur soviétique Alexeï Pajitnov en 1984." },
              { t: "Quelle entreprise a créé PlayStation ?", o: ['Microsoft', 'Nintendo', 'Sega', 'Sony'], a: 3, e: "Sony lance la première PlayStation en 1994 au Japon." },
            ],
          },
          {
            id: 'jv-cl-2',
            name: 'Quiz #2 — Jeux modernes',
            diff: 'easy',
            category: 'jeux_video',
            theme: 'classiques_jv',
            questions: [
              { t: "Dans quel jeu incarne-t-on Master Chief ?", o: ['Call of Duty', 'Halo', 'Destiny', 'Gears of War'], a: 1, e: "Master Chief est le protagoniste principal de la saga Halo de Bungie/343 Industries." },
              { t: "Quel jeu se passe dans la ville fictive de 'Los Santos' ?", o: ['Red Dead Redemption', 'GTA V', 'Saints Row', 'Watch Dogs'], a: 1, e: "Los Santos est la ville fictive de GTA V, inspirée de Los Angeles." },
              { t: "Qu'est-ce que Minecraft ?", o: ['Un jeu de tir', 'Un jeu de construction en monde ouvert', 'Un jeu de course', 'Un RPG japonais'], a: 1, e: "Minecraft est un jeu de construction et de survie en monde ouvert créé par Markus Persson en 2011." },
              { t: "Quel est le jeu le plus vendu de tous les temps ?", o: ['GTA V', 'Tetris', 'Minecraft', 'Wii Sports'], a: 2, e: "Minecraft est le jeu le plus vendu avec plus de 300 millions de copies." },
              { t: "Dans quel jeu joue-t-on Geralt de Riv ?", o: ['Dragon Age', 'Dark Souls', 'The Witcher', 'Skyrim'], a: 2, e: "Geralt de Riv est le protagoniste de la saga The Witcher de CD Projekt Red." },
            ],
          },
        ],
      },
      esport: {
        id: 'esport',
        label: 'Esport & Compétition',
        icon: '🏆',
        quizzes: [
          {
            id: 'jv-es-1',
            name: 'Quiz #1 — Jeux compétitifs',
            diff: 'medium',
            category: 'jeux_video',
            theme: 'esport',
            questions: [
              { t: "Quel jeu a popularisé le genre 'Battle Royale' ?", o: ['Fortnite', 'PUBG', 'Apex Legends', 'Warzone'], a: 1, e: "PlayerUnknown's Battlegrounds (PUBG) sort en 2017 et popularise le genre Battle Royale." },
              { t: "Quel jeu de stratégie en temps réel a dominé l'esport coréen dans les années 2000 ?", o: ['Warcraft III', 'Age of Empires', 'StarCraft', 'Command & Conquer'], a: 2, e: "StarCraft de Blizzard a engendré une scène professionnelle massive en Corée du Sud." },
              { t: "Combien de joueurs composent une équipe dans League of Legends ?", o: ['3', '4', '5', '6'], a: 2, e: "Une équipe de League of Legends est composée de 5 joueurs." },
              { t: "Quel est le tournoi mondial de League of Legends ?", o: ['The International', 'World Championship', 'ESL One', 'DreamHack'], a: 1, e: "Le World Championship (Worlds) est le tournoi annuel mondial de League of Legends organisé par Riot Games." },
              { t: "Quel jeu Valve organise 'The International' ?", o: ['CS:GO', 'Team Fortress 2', 'Dota 2', 'Half-Life'], a: 2, e: "The International est le tournoi mondial annuel de Dota 2, avec l'un des plus grands prize pools de l'esport." },
            ],
          },
        ],
      },
      jv_culture: {
        id: 'jv_culture',
        label: 'Culture & Univers',
        icon: '🌐',
        quizzes: [
          {
            id: 'jv-cu-1',
            name: 'Quiz #1 — Univers & Personnages',
            diff: 'easy',
            category: 'jeux_video',
            theme: 'jv_culture',
            questions: [
              { t: "Quel est l'ennemi principal de Mario ?", o: ['Bowser', 'Wario', 'Donkey Kong', 'Waluigi'], a: 0, e: "Bowser (Koopa) est le grand antagoniste de la saga Mario, qui kidnappe la Princesse Peach." },
              { t: "Comment s'appelle le héros de The Legend of Zelda ?", o: ['Zelda', 'Link', 'Ganon', 'Navi'], a: 1, e: "Link est le héros jouable de la saga Zelda. Zelda est en réalité la princesse qu'il doit sauver." },
              { t: "Quel animal est Sonic ?", o: ['Lapin', 'Renard', 'Hérisson', 'Raton laveur'], a: 2, e: "Sonic est un hérisson bleu créé par Sega en 1991, connu pour sa vitesse." },
              { t: "Dans Pokémon, quel est le Pokémon numéro 1 du Pokédex ?", o: ['Pikachu', 'Bulbizarre', 'Salamèche', 'Mew'], a: 1, e: "Bulbizarre (Bulbasaur) est le Pokémon numéro 001 du Pokédex national." },
              { t: "Quel studio a créé The Last of Us ?", o: ['Rockstar Games', 'Naughty Dog', 'Insomniac Games', 'Santa Monica Studio'], a: 1, e: "The Last of Us est développé par Naughty Dog, studio de Sony." },
            ],
          },
        ],
      },
    },
  },

  nature: {
    id: 'nature',
    label: 'Nature & Animaux',
    icon: '🌿',
    color: '#3DFFD0',
    gradient: 'linear-gradient(135deg, #0f2d1f, #1a4a2e)',
    themes: {
      animaux: {
        id: 'animaux',
        label: 'Animaux',
        icon: '🦁',
        quizzes: [
          {
            id: 'nat-an-1',
            name: 'Quiz #1 — Règne animal',
            diff: 'easy',
            category: 'nature',
            theme: 'animaux',
            questions: [
              { t: "Quel est le plus grand animal terrestre ?", o: ['Girafe', 'Hippopotame', 'Éléphant d\'Afrique', 'Rhinocéros'], a: 2, e: "L'éléphant d'Afrique est le plus grand animal terrestre, pesant jusqu'à 7 tonnes." },
              { t: "Quel animal a la gestation la plus longue ?", o: ['Baleine bleue', 'Éléphant', 'Girafe', 'Rhinocéros'], a: 1, e: "L'éléphant a la gestation la plus longue chez les mammifères : environ 22 mois." },
              { t: "Combien de cœurs a une pieuvre ?", o: ['1', '2', '3', '4'], a: 2, e: "La pieuvre possède 3 cœurs : un principal qui pompe le sang dans le corps et deux branchiaux." },
              { t: "Quel est le seul mammifère capable de voler vraiment ?", o: ['L\'écureuil volant', 'La chauve-souris', 'Le sucre planeur', 'Le colugos'], a: 1, e: "La chauve-souris est le seul mammifère capable de vol actif soutenu." },
              { t: "Quel animal produit de la soie ?", o: ['Araignée uniquement', 'Ver à soie uniquement', 'Les deux', 'Aucun des deux'], a: 2, e: "Les araignées et les vers à soie (larves du bombyx du mûrier) produisent tous deux de la soie." },
            ],
          },
          {
            id: 'nat-an-2',
            name: 'Quiz #2 — Animaux & Records',
            diff: 'medium',
            category: 'nature',
            theme: 'animaux',
            questions: [
              { t: "Quel est l'animal le plus rapide du monde ?", o: ['Guépard', 'Faucon pèlerin', 'Espadon', 'Antilope'], a: 1, e: "Le faucon pèlerin peut atteindre 390 km/h en piqué, ce qui en fait l'animal le plus rapide." },
              { t: "Quelle est la durée de vie d'un perroquet gris du Gabon ?", o: ['10-20 ans', '20-30 ans', '40-60 ans', '80-100 ans'], a: 2, e: "Le perroquet gris du Gabon peut vivre 40 à 60 ans en captivité." },
              { t: "Quel animal a le plus grand cerveau par rapport à son corps ?", o: ['Dauphin', 'Chimpanzé', 'Corbeau', 'Humain'], a: 3, e: "Les humains ont le ratio cerveau/corps le plus élevé parmi les animaux." },
              { t: "Combien de pattes a une araignée ?", o: ['6', '8', '10', '12'], a: 1, e: "Les araignées ont 8 pattes — c'est ce qui les distingue des insectes (6 pattes)." },
              { t: "Quel est le plus grand oiseau du monde ?", o: ['Condor des Andes', 'Albatros', 'Autruche', 'Manchot empereur'], a: 2, e: "L'autruche est le plus grand oiseau vivant, pouvant mesurer 2,7 m et peser 156 kg." },
            ],
          },
        ],
      },
      plantes: {
        id: 'plantes',
        label: 'Plantes & Écologie',
        icon: '🌱',
        quizzes: [
          {
            id: 'nat-pl-1',
            name: 'Quiz #1 — Végétal & Nature',
            diff: 'easy',
            category: 'nature',
            theme: 'plantes',
            questions: [
              { t: "Quel est le plus grand arbre du monde (en volume) ?", o: ['Séquoia géant', 'Baobab', 'Eucalyptus', 'Chêne'], a: 0, e: "Le séquoia géant General Sherman en Californie est le plus grand arbre par volume (1487 m³)." },
              { t: "Quelle plante carnivore est la plus connue ?", o: ['Sarracénie', 'Drosera', 'Dionée attrape-mouche', 'Népenthès'], a: 2, e: "La dionée attrape-mouche (Venus flytrap) est la plante carnivore la plus célèbre." },
              { t: "Quel gaz les plantes absorbent-elles lors de la photosynthèse ?", o: ['Oxygène', 'Azote', 'CO2', 'Hydrogène'], a: 2, e: "Les plantes absorbent le CO2 et rejettent de l'oxygène lors de la photosynthèse." },
              { t: "Quelle est la fleur nationale du Japon ?", o: ['Rose', 'Chrysanthème', 'Cerisier (Sakura)', 'Lotus'], a: 2, e: "Le cerisier (Sakura) est le symbole floral du Japon, célébré chaque printemps." },
              { t: "Combien de temps peut vivre un baobab ?", o: ['100 ans', '500 ans', '1000 ans', 'Plus de 2000 ans'], a: 3, e: "Certains baobabs vivent plus de 2000 ans. Ce sont parmi les arbres les plus anciens du monde." },
            ],
          },
        ],
      },
      environnement: {
        id: 'environnement',
        label: 'Environnement & Climat',
        icon: '🌍',
        quizzes: [
          {
            id: 'nat-en-1',
            name: 'Quiz #1 — Climat & Écologie',
            diff: 'medium',
            category: 'nature',
            theme: 'environnement',
            questions: [
              { t: "Quel accord international porte sur le climat ?", o: ['Accord de Tokyo', 'Accord de Paris', 'Protocole de Montréal', 'Accord de Kyoto'], a: 1, e: "L'Accord de Paris (2015) vise à limiter le réchauffement climatique à moins de 2°C." },
              { t: "Quel pays émet le plus de CO2 dans le monde ?", o: ['États-Unis', 'Inde', 'Chine', 'Russie'], a: 2, e: "La Chine est le premier émetteur mondial de CO2, représentant environ 30% des émissions mondiales." },
              { t: "Qu'est-ce que la biodiversité ?", o: ["L'étude des bio-carburants", "La variété des espèces vivantes sur Terre", 'La production biologique', 'La diversité culturelle'], a: 1, e: "La biodiversité désigne la variété du vivant sur Terre : espèces, écosystèmes et diversité génétique." },
              { t: "Quelle couche de l'atmosphère nous protège des UV ?", o: ['Troposphère', 'Stratosphère (couche d\'ozone)', 'Mésosphère', 'Thermosphère'], a: 1, e: "La couche d'ozone dans la stratosphère absorbe 97 à 99% des UV nocifs du soleil." },
              { t: "Quel est le plus grand récif corallien du monde ?", o: ['Récif de Belize', 'Grand Récif de Nouvelle-Calédonie', 'Grande Barrière de Corail', 'Récif de la mer Rouge'], a: 2, e: "La Grande Barrière de Corail en Australie est le plus grand récif corallien (2300 km)." },
            ],
          },
        ],
      },
    },
  },

  politique: {
    id: 'politique',
    label: 'Politique & Institutions',
    icon: '🏛️',
    color: '#378ADD',
    gradient: 'linear-gradient(135deg, #0f1f3a, #1a2d5e)',
    themes: {
      institutions: {
        id: 'institutions',
        label: 'Institutions françaises',
        icon: '🇫🇷',
        quizzes: [
          {
            id: 'pol-if-1',
            name: 'Quiz #1 — République française',
            diff: 'medium',
            category: 'politique',
            theme: 'institutions',
            questions: [
              { t: "Sous quelle République sommes-nous en France ?", o: ['4e', '5e', '6e', '3e'], a: 1, e: "La France est sous la 5e République depuis la Constitution de 1958, sous De Gaulle." },
              { t: "Combien de chambres compose le Parlement français ?", o: ['1', '2', '3', '4'], a: 1, e: "Le Parlement français est bicaméral : l'Assemblée nationale et le Sénat." },
              { t: "Quelle est la durée du mandat présidentiel en France ?", o: ['4 ans', '5 ans', '6 ans', '7 ans'], a: 1, e: "Le mandat présidentiel est de 5 ans depuis la réforme de 2000 (quinquennat)." },
              { t: "Qui nomme le Premier ministre en France ?", o: ['L\'Assemblée nationale', 'Le Sénat', 'Le Président de la République', 'Le Conseil d\'État'], a: 2, e: "Le Premier ministre est nommé par le Président de la République (article 8 de la Constitution)." },
              { t: "Où siège le Sénat français ?", o: ['Palais Bourbon', 'Palais de l\'Élysée', 'Palais du Luxembourg', 'Hôtel Matignon'], a: 2, e: "Le Sénat siège au Palais du Luxembourg à Paris. L'Assemblée nationale siège au Palais Bourbon." },
            ],
          },
        ],
      },
      international: {
        id: 'international',
        label: 'Politique internationale',
        icon: '🌐',
        quizzes: [
          {
            id: 'pol-pi-1',
            name: 'Quiz #1 — Organisations mondiales',
            diff: 'medium',
            category: 'politique',
            theme: 'international',
            questions: [
              { t: "Combien de membres permanents compte le Conseil de sécurité de l'ONU ?", o: ['3', '5', '7', '10'], a: 1, e: "5 membres permanents : États-Unis, Russie, Chine, France et Royaume-Uni, chacun avec droit de veto." },
              { t: "Où se trouve le siège de l'Union européenne ?", o: ['Paris', 'Berlin', 'Bruxelles', 'Strasbourg'], a: 2, e: "Bruxelles est le principal siège des institutions européennes. Le Parlement siège aussi à Strasbourg." },
              { t: "Combien de pays composent l'Union européenne ?", o: ['25', '27', '28', '30'], a: 1, e: "L'UE compte 27 membres depuis le Brexit du Royaume-Uni en 2020." },
              { t: "Quelle organisation internationale gère le commerce mondial ?", o: ['FMI', 'Banque mondiale', 'OMC', 'OCDE'], a: 2, e: "L'OMC (Organisation mondiale du commerce) régule le commerce international depuis 1995." },
              { t: "Qu'est-ce que le G7 ?", o: ['7 pays les plus peuplés', '7 grandes démocraties industrialisées', '7 pays membres de l\'OTAN', '7 pays producteurs de pétrole'], a: 1, e: "Le G7 regroupe les 7 grandes démocraties industrialisées : USA, Canada, France, Allemagne, Italie, Japon, Royaume-Uni." },
            ],
          },
        ],
      },
      democratie: {
        id: 'democratie',
        label: 'Démocratie & Droits',
        icon: '⚖️',
        quizzes: [
          {
            id: 'pol-dd-1',
            name: 'Quiz #1 — Droits & Libertés',
            diff: 'hard',
            category: 'politique',
            theme: 'democratie',
            questions: [
              { t: "En quelle année la Déclaration universelle des droits de l'homme a-t-elle été adoptée ?", o: ['1945', '1948', '1950', '1955'], a: 1, e: "La DUDH est adoptée le 10 décembre 1948 par l'Assemblée générale de l'ONU." },
              { t: "Quel pays a été le premier à accorder le droit de vote aux femmes ?", o: ['France', 'Nouvelle-Zélande', 'États-Unis', 'Suède'], a: 1, e: "La Nouvelle-Zélande est le premier pays à accorder le droit de vote aux femmes en 1893." },
              { t: "En quelle année les femmes ont-elles obtenu le droit de vote en France ?", o: ['1936', '1944', '1958', '1962'], a: 1, e: "Les femmes ont obtenu le droit de vote en France par ordonnance du 21 avril 1944, sous De Gaulle." },
              { t: "Qu'est-ce que l'habeas corpus ?", o: ['Un droit fiscal', 'Le droit de ne pas être détenu arbitrairement', 'Un traité international', 'Une loi sur la presse'], a: 1, e: "L'habeas corpus est un principe fondamental garantissant qu'une personne ne peut être détenue sans raison légale." },
              { t: "Quel est le rôle du Conseil constitutionnel en France ?", o: ['Voter les lois', 'Vérifier la conformité des lois à la Constitution', 'Juger les crimes', 'Nommer les ministres'], a: 1, e: "Le Conseil constitutionnel contrôle la conformité des lois à la Constitution française." },
            ],
          },
        ],
      },
    },
  },

  economie: {
    id: 'economie',
    label: 'Économie & Finance',
    icon: '💰',
    color: '#FFE14D',
    gradient: 'linear-gradient(135deg, #2a2500, #3d3800)',
    themes: {
      bases_eco: {
        id: 'bases_eco',
        label: 'Bases de l\'économie',
        icon: '📊',
        quizzes: [
          {
            id: 'eco-be-1',
            name: 'Quiz #1 — Concepts fondamentaux',
            diff: 'medium',
            category: 'economie',
            theme: 'bases_eco',
            questions: [
              { t: "Qu'est-ce que le PIB ?", o: ['Produit Intérieur Brut', 'Prix d\'Indice de Base', 'Plan d\'Investissement Bancaire', 'Profit Industriel Brut'], a: 0, e: "Le PIB (Produit Intérieur Brut) mesure la valeur totale des biens et services produits dans un pays." },
              { t: "Qu'est-ce que l'inflation ?", o: ['Baisse générale des prix', 'Hausse générale des prix', 'Stagnation des prix', 'Dévaluation d\'une monnaie'], a: 1, e: "L'inflation est la hausse générale et durable des prix, réduisant le pouvoir d'achat de la monnaie." },
              { t: "Quel est le rôle d'une banque centrale ?", o: ['Prêter aux particuliers', 'Réguler la politique monétaire', 'Financer les entreprises', 'Gérer les impôts'], a: 1, e: "La banque centrale (ex: BCE) régule la politique monétaire, contrôle l'inflation et émet la monnaie." },
              { t: "Qu'est-ce qu'une action en bourse ?", o: ['Un prêt à une entreprise', 'Une part de propriété d\'une entreprise', 'Une obligation d\'État', 'Un dépôt bancaire'], a: 1, e: "Une action représente une part de propriété dans une entreprise cotée en bourse." },
              { t: "Qu'est-ce que le chômage frictionnel ?", o: ['Chômage dû à une crise', "Chômage entre deux emplois lors d'une transition", 'Chômage structurel long terme', 'Chômage saisonnier'], a: 1, e: "Le chômage frictionnel est temporaire, lié au temps de transition entre deux emplois — il existe même en plein emploi." },
            ],
          },
        ],
      },
      finance: {
        id: 'finance',
        label: 'Finance & Marchés',
        icon: '📈',
        quizzes: [
          {
            id: 'eco-fi-1',
            name: 'Quiz #1 — Bourse & Investissement',
            diff: 'medium',
            category: 'economie',
            theme: 'finance',
            questions: [
              { t: "Où se trouve la bourse de New York ?", o: ['Manhattan', 'Wall Street', 'Broadway', 'Times Square'], a: 1, e: "La NYSE (New York Stock Exchange) est située sur Wall Street à Manhattan." },
              { t: "Qu'est-ce qu'un ETF ?", o: ['Un fonds indiciel coté en bourse', 'Un prêt immobilier', 'Un compte d\'épargne', 'Une assurance-vie'], a: 0, e: "Un ETF (Exchange-Traded Fund) est un fonds indiciel coté en bourse qui réplique un indice comme le CAC 40." },
              { t: "Qu'est-ce que le CAC 40 ?", o: ['L\'indice des 40 plus grandes entreprises françaises cotées', 'Un impôt sur les sociétés', 'Un fonds d\'investissement public', 'Un taux d\'intérêt bancaire'], a: 0, e: "Le CAC 40 est l'indice boursier de référence français, composé des 40 plus grandes capitalisations de la bourse de Paris." },
              { t: "Qui est Warren Buffett ?", o: ['Fondateur d\'Amazon', 'Légendaire investisseur américain', 'Président de la Fed', 'PDG de Goldman Sachs'], a: 1, e: "Warren Buffett est l'un des investisseurs les plus célèbres au monde, PDG de Berkshire Hathaway." },
              { t: "Qu'est-ce qu'une obligation ?", o: ['Une action prioritaire', 'Un titre de dette émis par une entreprise ou l\'État', 'Un contrat d\'assurance', 'Un dépôt à terme'], a: 1, e: "Une obligation est un titre de dette — l'émetteur s'engage à rembourser le capital avec des intérêts." },
            ],
          },
        ],
      },
      grands_economistes: {
        id: 'grands_economistes',
        label: 'Grands économistes',
        icon: '🎓',
        quizzes: [
          {
            id: 'eco-ge-1',
            name: 'Quiz #1 — Théories économiques',
            diff: 'hard',
            category: 'economie',
            theme: 'grands_economistes',
            questions: [
              { t: "Qui a écrit 'La Richesse des Nations' ?", o: ['Karl Marx', 'John Maynard Keynes', 'Adam Smith', 'Milton Friedman'], a: 2, e: "Adam Smith publie La Richesse des Nations en 1776, posant les bases du libéralisme économique." },
              { t: "Quelle théorie est associée à John Maynard Keynes ?", o: ['Le monétarisme', 'L\'interventionnisme de l\'État en période de crise', 'Le libre-échange absolu', 'La théorie des jeux'], a: 1, e: "Keynes prône l'intervention de l'État pour relancer l'économie en période de récession (stimulus)." },
              { t: "Qui a écrit 'Le Capital' ?", o: ['Friedrich Engels', 'Karl Marx', 'Lénine', 'Max Weber'], a: 1, e: "Karl Marx publie Le Capital (Das Kapital) en 1867, critique fondamentale du capitalisme." },
              { t: "Qu'est-ce que la 'main invisible' d'Adam Smith ?", o: ['Une politique protectionniste', 'Le mécanisme du marché qui régule l\'économie naturellement', 'L\'intervention de l\'État', 'Un monopole naturel'], a: 1, e: "La main invisible décrit comment les intérêts individuels conduisent, sans coordination, à un équilibre bénéfique pour tous." },
              { t: "Qui a développé la théorie monétariste ?", o: ['Paul Krugman', 'Milton Friedman', 'Joseph Stiglitz', 'Thomas Piketty'], a: 1, e: "Milton Friedman est le chef de file de l'école monétariste de Chicago, défenseur du libre marché." },
            ],
          },
        ],
      },
    },
  },

  astronomie: {
    id: 'astronomie',
    label: 'Astronomie & Espace',
    icon: '🔭',
    color: '#9B6DFF',
    gradient: 'linear-gradient(135deg, #0a0520, #150a35)',
    themes: {
      systeme_solaire: {
        id: 'systeme_solaire',
        label: 'Système solaire',
        icon: '☀️',
        quizzes: [
          {
            id: 'ast-ss-1',
            name: 'Quiz #1 — Planètes & Étoiles',
            diff: 'easy',
            category: 'astronomie',
            theme: 'systeme_solaire',
            questions: [
              { t: "Combien de planètes compte le système solaire ?", o: ['7', '8', '9', '10'], a: 1, e: "8 planètes depuis la reclassification de Pluton en planète naine en 2006." },
              { t: "Quelle est la planète la plus grande du système solaire ?", o: ['Saturne', 'Neptune', 'Jupiter', 'Uranus'], a: 2, e: "Jupiter est la plus grande planète, avec un diamètre 11 fois supérieur à celui de la Terre." },
              { t: "Quelle planète est entourée d'anneaux visibles ?", o: ['Jupiter', 'Uranus', 'Saturne', 'Neptune'], a: 2, e: "Saturne est célèbre pour ses anneaux composés de glace et de roches. Jupiter, Uranus et Neptune en ont aussi, mais moins visibles." },
              { t: "Quelle est la planète la plus proche du Soleil ?", o: ['Vénus', 'Mars', 'Mercure', 'Terre'], a: 2, e: "Mercure est la planète la plus proche du Soleil, à environ 58 millions de km." },
              { t: "Qu'est-ce qu'une année-lumière ?", o: ['La durée que met la lumière à faire le tour de la Terre', 'La distance parcourue par la lumière en un an', 'L\'âge de notre Soleil', 'La période de rotation de la Terre'], a: 1, e: "Une année-lumière est la distance que parcourt la lumière en un an, soit environ 9 461 milliards de km." },
            ],
          },
          {
            id: 'ast-ss-2',
            name: 'Quiz #2 — Lune & Exploration',
            diff: 'medium',
            category: 'astronomie',
            theme: 'systeme_solaire',
            questions: [
              { t: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?", o: ['1965', '1967', '1969', '1972'], a: 2, e: "Neil Armstrong et Buzz Aldrin marchent sur la Lune le 21 juillet 1969 (mission Apollo 11)." },
              { t: "Quel est le nom de la première sonde à quitter le système solaire ?", o: ['Pioneer 10', 'Voyager 1', 'New Horizons', 'Cassini'], a: 1, e: "Voyager 1, lancée en 1977, a quitté le système solaire en 2012 — c'est l'objet humain le plus éloigné." },
              { t: "Sur quelle planète a atterri le rover Perseverance en 2021 ?", o: ['Lune', 'Mars', 'Vénus', 'Titan'], a: 1, e: "Perseverance atterrit sur Mars le 18 février 2021 dans le cratère Jezero pour chercher des traces de vie." },
              { t: "Qu'est-ce qu'une supernova ?", o: ['Une très grande étoile', 'L\'explosion d\'une étoile en fin de vie', 'Un type de galaxie', 'Un astéroïde géant'], a: 1, e: "Une supernova est l'explosion cataclysmique d'une étoile massive en fin de vie, l'un des événements les plus énergétiques de l'univers." },
              { t: "Quel télescope spatial a révolutionné notre vision de l'univers depuis 1990 ?", o: ['James Webb', 'Hubble', 'Spitzer', 'Chandra'], a: 1, e: "Le télescope Hubble, lancé en 1990, a fourni des images révolutionnaires de l'univers profond." },
            ],
          },
        ],
      },
      univers: {
        id: 'univers',
        label: 'Univers & Cosmologie',
        icon: '🌌',
        quizzes: [
          {
            id: 'ast-un-1',
            name: 'Quiz #1 — Big Bang & Galaxies',
            diff: 'hard',
            category: 'astronomie',
            theme: 'univers',
            questions: [
              { t: "Quel est l'âge estimé de l'univers ?", o: ['4,5 milliards d\'années', '10 milliards d\'années', '13,8 milliards d\'années', '20 milliards d\'années'], a: 2, e: "L'univers est âgé d'environ 13,8 milliards d'années depuis le Big Bang." },
              { t: "Quelle est la galaxie la plus proche de la Voie Lactée ?", o: ['Galaxie de Bode', 'Grande Nébuleuse de Magellan', 'Galaxie d\'Andromède', 'Galaxie du Triangle'], a: 2, e: "La galaxie d'Andromède (M31) est la grande galaxie spirale la plus proche, à 2,5 millions d'années-lumière." },
              { t: "Qu'est-ce que la matière noire ?", o: ['Des trous noirs', 'Une matière invisible qui représente 27% de l\'univers', 'Des étoiles éteintes', 'Du gaz froid'], a: 1, e: "La matière noire est une forme de matière non détectée directement, inférée par ses effets gravitationnels." },
              { t: "Qu'est-ce que l'énergie sombre ?", o: ['L\'énergie des trous noirs', "L'énergie mystérieuse accélérant l'expansion de l'univers", 'L\'énergie des supernovas', 'La radiation cosmique'], a: 1, e: "L'énergie sombre représente ~68% de l'univers et serait responsable de son expansion accélérée." },
              { t: "Comment s'appelle notre galaxie ?", o: ['Andromède', 'La Voie Lactée', 'Triangulum', 'Magellan'], a: 1, e: "Notre galaxie s'appelle la Voie Lactée. Elle contient entre 200 et 400 milliards d'étoiles." },
            ],
          },
        ],
      },
      conquete_spatiale: {
        id: 'conquete_spatiale',
        label: 'Conquête spatiale',
        icon: '🚀',
        quizzes: [
          {
            id: 'ast-cs-1',
            name: 'Quiz #1 — Histoire spatiale',
            diff: 'medium',
            category: 'astronomie',
            theme: 'conquete_spatiale',
            questions: [
              { t: "Qui fut le premier humain à aller dans l'espace ?", o: ['Neil Armstrong', 'Alan Shepard', 'Youri Gagarine', 'John Glenn'], a: 2, e: "Youri Gagarine est le premier humain dans l'espace le 12 avril 1961 (mission Vostok 1)." },
              { t: "Quel est le nom de la station spatiale internationale ?", o: ['Mir', 'ISS', 'Skylab', 'Tiangong'], a: 1, e: "L'ISS (International Space Station) est en orbite depuis 1998." },
              { t: "Quel était le nom du programme spatial américain qui envoya l'homme sur la Lune ?", o: ['Gemini', 'Mercury', 'Apollo', 'Artemis'], a: 2, e: "Le programme Apollo de la NASA (1961-1972) a permis 6 alunissages habités." },
              { t: "Qui est Elon Musk dans le domaine spatial ?", o: ['Directeur de la NASA', 'Fondateur de SpaceX', 'Astronaute', 'Ingénieur ESA'], a: 1, e: "Elon Musk fonde SpaceX en 2002, qui révolutionne l'accès à l'espace avec des fusées réutilisables." },
              { t: "Quel animal a été le premier à aller dans l'espace ?", o: ['Singe', 'Souris', 'Chienne (Laïka)', 'Chat'], a: 2, e: "Laïka, une chienne soviétique, fut le premier animal à orbiter la Terre en novembre 1957 (Spoutnik 2)." },
            ],
          },
        ],
      },
    },
  },

  theatre_culture: {
    id: 'theatre_culture',
    label: 'Théâtre & Culture française',
    icon: '🎭',
    color: '#FF5FA0',
    gradient: 'linear-gradient(135deg, #2d0f20, #4a1535)',
    themes: {
      theatre: {
        id: 'theatre',
        label: 'Théâtre & Dramaturgie',
        icon: '🎭',
        quizzes: [
          {
            id: 'the-th-1',
            name: 'Quiz #1 — Grands auteurs',
            diff: 'medium',
            category: 'theatre_culture',
            theme: 'theatre',
            questions: [
              { t: "Qui a écrit 'Roméo et Juliette' ?", o: ['Molière', 'Victor Hugo', 'William Shakespeare', 'Jean Racine'], a: 2, e: "Roméo et Juliette est une pièce de William Shakespeare écrite vers 1595." },
              { t: "Qui a écrit 'Le Misanthrope' ?", o: ['Racine', 'Molière', 'Corneille', 'La Fontaine'], a: 1, e: "Le Misanthrope est une comédie de Molière créée en 1666." },
              { t: "Quel est le nom de la célèbre salle de théâtre nationale à Paris ?", o: ['L\'Odéon', 'La Comédie-Française', 'Le Châtelet', 'L\'Opéra Garnier'], a: 1, e: "La Comédie-Française (fondée en 1680) est le théâtre national le plus ancien du monde." },
              { t: "Qui a écrit 'En attendant Godot' ?", o: ['Ionesco', 'Camus', 'Beckett', 'Sartre'], a: 2, e: "Samuel Beckett écrit En attendant Godot en 1949, pièce emblématique du théâtre de l'absurde." },
              { t: "Qu'est-ce que la 'catharsis' au théâtre ?", o: ['Un décor de scène', 'La purification des émotions par le spectacle', 'Un type de comédie', 'Le dénouement d\'une pièce'], a: 1, e: "La catharsis (Aristote) désigne la purification émotionnelle que ressent le spectateur face à la tragédie." },
            ],
          },
        ],
      },
      litterature_fr: {
        id: 'litterature_fr',
        label: 'Littérature française',
        icon: '📚',
        quizzes: [
          {
            id: 'the-lf-1',
            name: 'Quiz #1 — Grands auteurs français',
            diff: 'medium',
            category: 'theatre_culture',
            theme: 'litterature_fr',
            questions: [
              { t: "Qui a écrit 'À la recherche du temps perdu' ?", o: ['Flaubert', 'Proust', 'Zola', 'Balzac'], a: 1, e: "Marcel Proust écrit cette œuvre monumentale en 7 volumes entre 1913 et 1927." },
              { t: "Quel auteur français a refusé le Prix Nobel de littérature ?", o: ['Albert Camus', 'Jean-Paul Sartre', 'Simone de Beauvoir', 'André Gide'], a: 1, e: "Jean-Paul Sartre refuse le Nobel de littérature en 1964, estimant qu'un écrivain ne doit pas se laisser institutionnaliser." },
              { t: "Qui a écrit 'Madame Bovary' ?", o: ['Zola', 'Hugo', 'Flaubert', 'Stendhal'], a: 2, e: "Gustave Flaubert publie Madame Bovary en 1857, chef-d'œuvre du réalisme." },
              { t: "Quel mouvement littéraire est associé à Zola ?", o: ['Romantisme', 'Surréalisme', 'Naturalisme', 'Symbolisme'], a: 2, e: "Émile Zola est le chef de file du naturalisme, courant qui applique les méthodes scientifiques à la littérature." },
              { t: "Qui a écrit 'Le Petit Prince' ?", o: ['Jules Verne', 'Antoine de Saint-Exupéry', 'Jean de La Fontaine', 'Guy de Maupassant'], a: 1, e: "Le Petit Prince est écrit par Antoine de Saint-Exupéry en 1943, l'une des œuvres les plus traduites au monde." },
            ],
          },
          {
            id: 'the-lf-2',
            name: 'Quiz #2 — Poésie & Mouvements',
            diff: 'hard',
            category: 'theatre_culture',
            theme: 'litterature_fr',
            questions: [
              { t: "Quel poète a écrit 'Les Fleurs du Mal' ?", o: ['Verlaine', 'Rimbaud', 'Baudelaire', 'Mallarmé'], a: 2, e: "Charles Baudelaire publie Les Fleurs du Mal en 1857, recueil fondateur de la poésie moderne." },
              { t: "Quel mouvement littéraire a précédé le réalisme ?", o: ['Classicisme', 'Romantisme', 'Symbolisme', 'Baroque'], a: 1, e: "Le romantisme (début XIXe) précède le réalisme et se caractérise par l'expression des sentiments et la nature." },
              { t: "Qui était Molière dans la vie réelle ?", o: ['Louis Molière', 'Jean-Baptiste Poquelin', 'Pierre Corneille', 'Jean Molière'], a: 1, e: "Molière est le nom de plume de Jean-Baptiste Poquelin (1622-1673), dramaturge et comédien français." },
              { t: "Qu'est-ce que le 'Nouveau Roman' ?", o: ['Un mouvement de BD française', 'Un mouvement littéraire des années 50-60 cassant les codes du roman traditionnel', 'Une collection de romans policiers', 'Le premier roman français'], a: 1, e: "Le Nouveau Roman (Robbe-Grillet, Sarraute, Butor) remet en question la narration traditionnelle dans les années 1950-60." },
              { t: "Quel auteur français a écrit 'L\'Étranger' ?", o: ['Sartre', 'Camus', 'Malraux', 'Gide'], a: 1, e: "Albert Camus publie L'Étranger en 1942, œuvre emblématique de l'absurde et de l'existentialisme." },
            ],
          },
        ],
      },
      culture_generale_fr: {
        id: 'culture_generale_fr',
        label: 'Culture française',
        icon: '🥖',
        quizzes: [
          {
            id: 'the-cf-1',
            name: 'Quiz #1 — La France & ses symboles',
            diff: 'easy',
            category: 'theatre_culture',
            theme: 'culture_generale_fr',
            questions: [
              { t: "Quelle est la devise de la France ?", o: ['Liberté, Égalité, Fraternité', 'Dieu, Honneur, Patrie', 'Unité, Force, Justice', 'Liberté, Démocratie, Progrès'], a: 0, e: "La devise républicaine est 'Liberté, Égalité, Fraternité', issue de la Révolution française." },
              { t: "Quel est le symbole féminin de la République française ?", o: ['Vénus', 'Marianne', 'La Liberté', 'Cérès'], a: 1, e: "Marianne est le symbole officiel de la République française depuis 1792." },
              { t: "Combien de régions compte la France métropolitaine ?", o: ['13', '15', '18', '22'], a: 0, e: "La France métropolitaine compte 13 régions depuis la réforme territoriale de 2016." },
              { t: "Quel est le fleuve le plus long de France ?", o: ['Seine', 'Rhône', 'Loire', 'Garonne'], a: 2, e: "La Loire est le plus long fleuve de France avec 1006 km. Elle est aussi classée au patrimoine de l'UNESCO." },
              { t: "Quel jour est la fête nationale française ?", o: ['1er mai', '8 mai', '14 juillet', '11 novembre'], a: 2, e: "Le 14 juillet commémore la prise de la Bastille (1789) et la Fête de la Fédération (1790)." },
            ],
          },
        ],
      },
    },
  },

  mathematiques: {
    id: 'mathematiques',
    label: 'Logique & Mathématiques',
    icon: '🧩',
    color: '#3DFFD0',
    gradient: 'linear-gradient(135deg, #0a1f2a, #0f3040)',
    themes: {
      logique: {
        id: 'logique',
        label: 'Logique & Raisonnement',
        icon: '🧠',
        quizzes: [
          {
            id: 'mat-lo-1',
            name: 'Quiz #1 — Énigmes logiques',
            diff: 'medium',
            category: 'mathematiques',
            theme: 'logique',
            questions: [
              { t: "Si tous les chats sont des animaux, et Félix est un chat, alors :", o: ['Félix est peut-être un animal', 'Félix est forcément un animal', 'Félix n\'est pas un animal', 'On ne peut pas conclure'], a: 1, e: "C'est un syllogisme logique : si A⊂B et Félix∈A, alors Félix∈B. Félix est forcément un animal." },
              { t: "Quelle est la prochaine lettre dans la suite : A, C, E, G, ... ?", o: ['H', 'I', 'J', 'K'], a: 1, e: "La suite saute une lettre à chaque fois : A, C, E, G, I (lettres impaires de l'alphabet)." },
              { t: "Un père a 3 fils. L'aîné a le double de l'âge du cadet. Le cadet a 4 ans de plus que le benjamin qui a 6 ans. Quel âge a l'aîné ?", o: ['16 ans', '18 ans', '20 ans', '24 ans'], a: 2, e: "Benjamin = 6 ans, cadet = 6+4 = 10 ans, aîné = 10×2 = 20 ans." },
              { t: "Si 5 machines produisent 5 pièces en 5 minutes, combien de temps faut-il à 100 machines pour produire 100 pièces ?", o: ['100 minutes', '20 minutes', '5 minutes', '50 minutes'], a: 2, e: "Chaque machine produit 1 pièce en 5 minutes. 100 machines produisent 100 pièces en 5 minutes." },
              { t: "Quelle figure géométrique a un nombre infini de côtés ?", o: ['Polygone', 'Cercle', 'Ellipse', 'Parabole'], a: 1, e: "Un cercle peut être vu comme un polygone avec un nombre infini de côtés infiniment petits." },
            ],
          },
        ],
      },
      maths_fondamentaux: {
        id: 'maths_fondamentaux',
        label: 'Mathématiques',
        icon: '📐',
        quizzes: [
          {
            id: 'mat-mf-1',
            name: 'Quiz #1 — Concepts & Théorèmes',
            diff: 'medium',
            category: 'mathematiques',
            theme: 'maths_fondamentaux',
            questions: [
              { t: "Qu'est-ce que Pi (π) ?", o: ['La racine carrée de 2', 'Le rapport circonférence/diamètre d\'un cercle', 'La base des logarithmes naturels', 'Un nombre entier spécial'], a: 1, e: "Pi est le rapport constant entre la circonférence et le diamètre de tout cercle, environ 3,14159..." },
              { t: "Quel est le théorème de Pythagore ?", o: ['a+b=c', 'a²+b²=c²', 'a²-b²=c²', 'a×b=c²'], a: 1, e: "Dans un triangle rectangle, le carré de l'hypoténuse (c) égale la somme des carrés des deux autres côtés : a²+b²=c²." },
              { t: "Qu'est-ce qu'un nombre premier ?", o: ['Un nombre pair', 'Un nombre divisible uniquement par 1 et lui-même', 'Un nombre impair', 'Un nombre entier positif'], a: 1, e: "Un nombre premier n'est divisible que par 1 et lui-même (ex: 2, 3, 5, 7, 11...)." },
              { t: "Quelle est la valeur de 0! (factorielle 0) ?", o: ['0', '1', 'Indéfinie', '∞'], a: 1, e: "Par convention mathématique, 0! = 1. Cela rend cohérentes de nombreuses formules combinatoires." },
              { t: "Qu'est-ce que la suite de Fibonacci ?", o: ['1,2,4,8,16...', '1,1,2,3,5,8,13...', '1,3,9,27,81...', '2,4,6,8,10...'], a: 1, e: "La suite de Fibonacci : chaque nombre est la somme des deux précédents (1,1,2,3,5,8,13,21...)." },
            ],
          },
          {
            id: 'mat-mf-2',
            name: 'Quiz #2 — Grands mathématiciens',
            diff: 'hard',
            category: 'mathematiques',
            theme: 'maths_fondamentaux',
            questions: [
              { t: "Qui a formulé le dernier théorème de Fermat ?", o: ['Euler', 'Fermat', 'Gauss', 'Newton'], a: 1, e: "Pierre de Fermat énonce son théorème en 1637. Il ne fut prouvé qu'en 1995 par Andrew Wiles." },
              { t: "Qui est considéré comme le 'prince des mathématiques' ?", o: ['Euler', 'Gauss', 'Riemann', 'Leibniz'], a: 1, e: "Carl Friedrich Gauss est surnommé le 'prince des mathématiques' pour ses contributions extraordinaires." },
              { t: "Qui a inventé le calcul infinitésimal ?", o: ['Newton seul', 'Leibniz seul', 'Newton et Leibniz indépendamment', 'Euler'], a: 2, e: "Newton et Leibniz ont développé le calcul infinitésimal indépendamment au XVIIe siècle, ce qui créa une controverse de priorité." },
              { t: "Qu'est-ce que l'hypothèse de Riemann ?", o: ['Un théorème prouvé', 'Une conjecture non résolue sur les zéros de la fonction zêta', 'Une théorie sur les nombres premiers', 'Une formule géométrique'], a: 1, e: "L'hypothèse de Riemann (1859) est l'un des problèmes du millénaire non résolus, valant 1 million de dollars à qui le résoudra." },
              { t: "Qu'est-ce qu'un nombre d'or (φ) ?", o: ['π/2', '(1+√5)/2 ≈ 1,618', '√2 ≈ 1,414', 'e ≈ 2,718'], a: 1, e: "Le nombre d'or φ = (1+√5)/2 ≈ 1,618, présent dans la nature, l'art et l'architecture depuis l'Antiquité." },
            ],
          },
        ],
      },
      enigmes: {
        id: 'enigmes',
        label: 'Énigmes & Puzzles',
        icon: '🔮',
        quizzes: [
          {
            id: 'mat-en-1',
            name: 'Quiz #1 — Casse-têtes',
            diff: 'hard',
            category: 'mathematiques',
            theme: 'enigmes',
            questions: [
              { t: "J'ai des têtes et des pattes. J'ai 5 têtes et 14 pattes. Je suis composé de poulets et de lapins. Combien de lapins ?", o: ['1', '2', '3', '4'], a: 2, e: "x poulets + y lapins = 5 têtes, 2x + 4y = 14 pattes. Donc x=2, y=3. Il y a 3 lapins." },
              { t: "Quel est le prochain nombre : 2, 6, 12, 20, 30, ... ?", o: ['36', '40', '42', '44'], a: 2, e: "La suite est n(n+1) : 1×2, 2×3, 3×4, 4×5, 5×6, 6×7 = 42." },
              { t: "Un escargot est au fond d'un puits de 10m. Il monte 3m par jour et redescend 2m la nuit. En combien de jours sort-il ?", o: ['8 jours', '9 jours', '10 jours', '7 jours'], a: 0, e: "Il gagne 1m net/jour. Après 7 jours il est à 7m. Le 8e jour il monte 3m jusqu'à 10m et sort. Réponse : 8 jours." },
              { t: "Combien de carrés voit-on dans un damier 4×4 ?", o: ['16', '20', '24', '30'], a: 3, e: "1×1: 16, 2×2: 9, 3×3: 4, 4×4: 1. Total = 30 carrés." },
              { t: "Si vous avez 3 pommes et que vous en prenez 2, combien en avez-vous ?", o: ['1', '2', '3', '5'], a: 1, e: "Vous avez pris 2 pommes, donc vous en avez 2 !" },
            ],
          },
        ],
      },
    },
  },
};

// Helpers
export function getCategoryList() {
  return Object.values(CATEGORIES);
}

export function getThemeList(catId) {
  return Object.values(CATEGORIES[catId]?.themes || {});
}

export function getQuizList(catId, themeId) {
  return CATEGORIES[catId]?.themes[themeId]?.quizzes || [];
}

export function getQuiz(catId, themeId, quizId) {
  return getQuizList(catId, themeId).find((q) => q.id === quizId) || null;
}

export function getAllQuestions() {
  const all = [];
  Object.values(CATEGORIES).forEach((cat) => {
    Object.values(cat.themes).forEach((theme) => {
      theme.quizzes.forEach((quiz) => {
        quiz.questions.forEach((q) => {
          all.push({ ...q, catId: cat.id, themeId: theme.id, quizId: quiz.id, diff: quiz.diff });
        });
      });
    });
  });
  return all;
}

export const XP_MAP = { easy: 5, medium: 10, hard: 20 };
export const XP_TIMER_BONUS = { easy: 10, medium: 20, hard: 30 };
export const DIFF_LABELS = { easy: 'Facile', medium: 'Moyen', hard: 'Expert' };
export const DIFF_COLORS = { easy: '#3DFFD0', medium: '#FFE14D', hard: '#FF5FA0' };
export const XP_PER_LEVEL = 200;
export const FREE_DAILY_LIMIT = 3;
