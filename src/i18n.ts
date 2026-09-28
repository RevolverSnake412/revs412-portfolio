export const defaultLocale = 'en' as const;
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale => locales.includes(value as Locale);
export const alternateLocale = (locale: Locale): Locale => locale === 'en' ? 'fr' : 'en';

export const localizedPath = (locale: Locale, path = '') => {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const segments = locale === defaultLocale ? [cleanPath] : [locale, cleanPath];
  return `/${segments.filter(Boolean).join('/')}${cleanPath ? '/' : ''}`;
};

export const withBase = (base: string, path: string) => `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\//, '')}`;

const localizedSections: Record<Locale, readonly string[]> = {
  en: ['', 'services', 'work', 'notes', 'principles', 'resume', 'contact'],
  fr: ['', 'services', 'work', 'notes', 'principles', 'resume', 'contact'],
};

export const hasLocalizedSection = (locale: Locale, section: string) => localizedSections[locale].includes(section);

const ui = {
  en: { services: 'Services', work: 'Work', notes: 'Notes', principles: 'Principles', resume: 'Resume', contact: 'Contact', menu: 'Menu', translatedWork: 'Translated work', translatedNotes: 'Translated notes', translationPending: 'French translations are being prepared.' },
  fr: { services: 'Services', work: 'Projets', notes: 'Notes', principles: 'Principes', resume: 'CV', contact: 'Contact', menu: 'Menu', translatedWork: 'Projets traduits', translatedNotes: 'Notes traduites', translationPending: 'Les traductions françaises sont en préparation.' },
} as const;

export const uiCopy = (locale: Locale) => ui[locale];

export const frenchPrinciples = [
  'Partir du problème réel, pas de l’outil.',
  'Rendre les modes de défaillance visibles avant le déploiement.',
  'Préférer des systèmes simples jusqu’à ce que la complexité soit justifiée.',
  'Déboguer à partir des faits, pas des suppositions.',
  'Écrire des notes qui expliquent les décisions, pas seulement les étapes.',
  'Garder les systèmes suffisamment compréhensibles pour pouvoir les maintenir plus tard.',
] as const;

export const terminalCopy = {
  en: {
    dialog: 'Terminal mode', minimize: 'Minimize terminal mode', maximize: 'Maximize terminal mode', close: 'Close and reset terminal mode', input: 'Terminal command',
    commands: 'commands', help: 'show available commands', intro: 'read the introduction', workList: 'list or open case studies', notesList: 'list or open notes', principles: 'list working principles', contact: 'contact details', parrot: 'start the local parrot', cmatrix: 'run the CMatrix terminal simulation', clear: 'clear this screen', noWork: 'No published work items yet.', noNotes: 'No published notes yet.', problem: 'problem', constraints: 'constraints', approach: 'approach', outcome: 'outcome', openWork: 'open full case study →', openNote: 'open note →', noWorkFound: 'No work item found for', noNoteFound: 'No note found for', notFound: 'Command not found:', typeHelp: 'Type',
  },
  fr: {
    dialog: 'Mode terminal', minimize: 'Réduire le mode terminal', maximize: 'Agrandir le mode terminal', close: 'Fermer et réinitialiser le mode terminal', input: 'Commande du terminal',
    commands: 'commandes', help: 'afficher les commandes disponibles', intro: 'lire la présentation', workList: 'lister ou ouvrir les études de cas', notesList: 'lister ou ouvrir les notes', principles: 'lister les principes de travail', contact: 'coordonnées', parrot: 'lancer le perroquet local', cmatrix: 'lancer la simulation de terminal CMatrix', clear: 'effacer cet écran', noWork: 'Aucun projet publié pour le moment.', noNotes: 'Aucune note publiée pour le moment.', problem: 'problème', constraints: 'contraintes', approach: 'approche', outcome: 'résultat', openWork: 'ouvrir l’étude de cas complète →', openNote: 'ouvrir la note →', noWorkFound: 'Aucun projet trouvé pour', noNoteFound: 'Aucune note trouvée pour', notFound: 'Commande introuvable :', typeHelp: 'Tapez',
  },
} as const;
