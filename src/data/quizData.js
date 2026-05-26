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
