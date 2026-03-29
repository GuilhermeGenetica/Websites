import { allSixMinuteEnglishLinks } from './sixMinuteEnglishLinks.js';

// Função para embaralhar um array (algoritmo Fisher-Yates)
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;

  // Enquanto houver elementos para embaralhar.
  while (currentIndex !== 0) {
    // Escolhe um elemento restante.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // E troca com o elemento atual.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Faz uma cópia embaralhada dos links de 6-Minute English no início
// Isso garante que a ordem seja aleatória e que possamos pegar links únicos
const shuffledSixMinuteEnglishLinks = shuffleArray([...allSixMinuteEnglishLinks]);
let sixMinuteEnglishLinkIndex = 0; // Para rastrear qual link já foi usado

export const scheduleData = {
  A1: {
    title: "Iniciante",
    description: "Construindo os fundamentos do inglês.",
    days: Array.from({ length: 30 }, (_, i) => {
      // Garante que o link de 6-Minute English seja único e do array embaralhado
      const currentSixMinuteEnglishLink = shuffledSixMinuteEnglishLinks[sixMinuteEnglishLinkIndex % shuffledSixMinuteEnglishLinks.length];
      sixMinuteEnglishLinkIndex++; // Avança para o próximo link

      return {
        day: i + 1,
        theme: `Fundamentos Essenciais - Dia ${i + 1}`,
        activities: [
          {
            id: `a1d${i + 1}a1`,
            type: "grammar",
            title: `Curso Regular: Unidade ${i + 1}`,
            duration: "15 min",
            source: "Lower-Intermediate",
            link: `https://www.bbc.co.uk/learningenglish/english/course/lower-intermediate/unit-${i + 1}/session-1`,
          },
          {
            id: `a1d${i + 1}a2`,
            type: "listening",
            title: "6-Minute English",
            duration: "6 min",
            source: "6-Minute English",
            link: currentSixMinuteEnglishLink, // Link aleatório e único
          },
          {
            id: `a1d${i + 1}a3`,
            type: "speaking",
            title: "Frases Diárias",
            duration: "10 min",
            source: "Perfect English",
            link: "/sentences",
          },
        ],
      };
    }),
  },
  A2: {
    title: "Básico",
    description: "Expandindo seus conhecimentos.",
    days: Array.from({ length: 30 }, (_, i) => {
      const currentSixMinuteEnglishLink = shuffledSixMinuteEnglishLinks[sixMinuteEnglishLinkIndex % shuffledSixMinuteEnglishLinks.length];
      sixMinuteEnglishLinkIndex++;

      return {
        day: i + 1,
        theme: `Expandindo Conhecimentos - Dia ${i + 1}`,
        activities: [
          {
            id: `a2d${i + 1}a1`,
            type: "grammar",
            title: `Curso Regular: Unidade ${i + 1}`,
            duration: "15 min",
            source: "Intermediate",
            link: `https://www.bbc.co.uk/learningenglish/english/course/intermediate/unit-${i + 1}/session-1`,
          },
          {
            id: `a2d${i + 1}a2`,
            type: "listening",
            title: "6-Minute English",
            duration: "6 min",
            source: "6-Minute English",
            link: currentSixMinuteEnglishLink,
          },
          {
            id: `a2d${i + 1}a3`,
            type: "speaking",
            title: "Frases Diárias",
            duration: "10 min",
            source: "Perfect English",
            link: "/sentences",
          },
        ],
      };
    }),
  },
  B1: {
    title: "Intermediário",
    description: "Desenvolvendo sua fluência.",
    days: Array.from({ length: 30 }, (_, i) => {
      const currentSixMinuteEnglishLink = shuffledSixMinuteEnglishLinks[sixMinuteEnglishLinkIndex % shuffledSixMinuteEnglishLinks.length];
      sixMinuteEnglishLinkIndex++;

      return {
        day: i + 1,
        theme: `Desenvolvendo Fluência - Dia ${i + 1}`,
        activities: [
          {
            id: `b1d${i + 1}a1`,
            type: "reading",
            title: `Curso Regular: Unidade ${i + 1}`,
            duration: "20 min",
            source: "Upper-Intermediate",
            link: `https://www.bbc.co.uk/learningenglish/english/course/upper-intermediate/unit-${i + 1}/session-1`,
          },
          {
            id: `b1d${i + 1}a2`,
            type: "listening",
            title: "6-Minute English",
            duration: "6 min",
            source: "6-Minute English",
            link: currentSixMinuteEnglishLink,
          },
          {
            id: `b1d${i + 1}a3`,
            type: "speaking",
            title: "Frases Diárias",
            duration: "10 min",
            source: "Perfect English",
            link: "/sentences",
          },
        ],
      };
    }),
  },
  B2: {
    title: "Intermediário Superior",
    description: "Refinando suas habilidades.",
    days: Array.from({ length: 30 }, (_, i) => {
      const currentSixMinuteEnglishLink = shuffledSixMinuteEnglishLinks[sixMinuteEnglishLinkIndex % shuffledSixMinuteEnglishLinks.length];
      sixMinuteEnglishLinkIndex++;

      return {
        day: i + 1,
        theme: `Refinando Habilidades - Dia ${i + 1}`,
        activities: [
          {
            id: `b2d${i + 1}a1`,
            type: "grammar",
            title: `Curso Regular: Unidade ${i + 1}`,
            duration: "20 min",
            source: "Towards-Advanced",
            link: `https://www.bbc.co.uk/learningenglish/english/course/towards-advanced/unit-${i + 1}/session-1`,
          },
          {
            id: `b2d${i + 1}a2`,
            type: "listening",
            title: "6-Minute English",
            duration: "6 min",
            source: "6-Minute English",
            link: currentSixMinuteEnglishLink,
          },
          {
            id: `b2d${i + 1}a3`,
            type: "speaking",
            title: "Frases Diárias",
            duration: "10 min",
            source: "Perfect English",
            link: "/sentences",
          },
        ],
      };
    }),
  },
  C1: {
    title: "Avançado",
    description: "Rumo à maestria do inglês.",
    days: Array.from({ length: 30 }, (_, i) => {
      const currentSixMinuteEnglishLink = shuffledSixMinuteEnglishLinks[sixMinuteEnglishLinkIndex % shuffledSixMinuteEnglishLinks.length];
      sixMinuteEnglishLinkIndex++;

      return {
        day: i + 1,
        theme: `Rumo à Maestria - Dia ${i + 1}`,
        activities: [
          {
            id: `c1d${i + 1}a1`,
            type: "writing",
            title: `Curso Regular: Unidade ${i + 1}`,
            duration: "25 min",
            source: "English-You-Need",
            link: `https://www.bbc.co.uk/learningenglish/english/course/english-you-need/unit-${i + 1}/session-1`,
          },
          {
            id: `c1d${i + 1}a2`,
            type: "listening",
            title: "6-Minute English",
            duration: "6 min",
            source: "6-Minute English",
            link: currentSixMinuteEnglishLink,
          },
          {
            id: `c1d${i + 1}a3`,
            type: "speaking",
            title: "Frases Diárias",
            duration: "10 min",
            source: "Perfect English",
            link: "/sentences",
          },
        ],
      };
    }),
  },
};