// =============================================
// GARDEN STUDIO — Firebase Configuration
// 
// ⚠️  IMPORTANT : Remplacez les valeurs ci-dessous
//    par votre propre configuration Firebase.
//    Créez votre projet sur https://console.firebase.google.com
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔧 Remplacez par votre config Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// =============================================
// DONNÉES DE DÉMO (utilisées si Firebase non configuré)
// Supprimez ce bloc une fois Firebase configuré.
// =============================================
export const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    title: 'Vitrine Architecte',
    description: 'Site vitrine moderne pour un cabinet d\'architecture, avec galerie de projets et formulaire de contact.',
    category: 'Sites Web',
    techs: ['Next.js', 'Tailwind', 'Framer Motion'],
    link: '#',
    image: '',
    status: 'published'
  },
  {
    id: 'demo-2',
    title: 'SaaS Dashboard',
    description: 'Application web SaaS avec tableau de bord analytics, gestion d\'équipes et système d\'abonnement.',
    category: 'Applications Web',
    techs: ['React', 'TypeScript', 'Supabase', 'Stripe'],
    link: '#',
    image: '',
    status: 'published'
  },
  {
    id: 'demo-3',
    title: 'Boutique Mode Bio',
    description: 'E-commerce complet pour une marque de mode éthique, avec paiement sécurisé et gestion des stocks.',
    category: 'E-commerce',
    techs: ['Shopify', 'Liquid', 'Stripe'],
    link: '#',
    image: '',
    status: 'published'
  },
  {
    id: 'demo-4',
    title: 'Brand Identity — TechFlow',
    description: 'Identité visuelle complète pour une startup tech : logo, typographie, charte graphique et site web.',
    category: 'Branding',
    techs: ['Figma', 'Illustrator', 'After Effects'],
    link: '#',
    image: '',
    status: 'published'
  },
  {
    id: 'demo-5',
    title: 'App Gestion RH',
    description: 'Solution métier sur mesure pour la gestion des ressources humaines d\'une PME de 200 employés.',
    category: 'Applications Web',
    techs: ['Vue.js', 'Node.js', 'PostgreSQL'],
    link: '#',
    image: '',
    status: 'published'
  },
  {
    id: 'demo-6',
    title: 'Design System UI',
    description: 'Système de design complet avec composants réutilisables, tokens, documentation et Storybook.',
    category: 'Design',
    techs: ['Figma', 'React', 'Storybook'],
    link: '#',
    image: '',
    status: 'published'
  }
];

export const DEMO_TESTIMONIALS = [
  {
    id: 't1',
    name: 'Sophie Renault',
    role: 'CEO, BioMode Paris',
    text: 'Garden Studio a transformé notre présence en ligne. Le site est magnifique et les ventes ont augmenté de 40% dès le premier mois.',
    rating: 5,
    avatar: ''
  },
  {
    id: 't2',
    name: 'Marc Leblanc',
    role: 'Fondateur, TechFlow',
    text: 'Une équipe ultra-professionnelle qui comprend vraiment les enjeux d\'une startup. Livraison dans les délais et qualité au rendez-vous.',
    rating: 5,
    avatar: ''
  },
  {
    id: 't3',
    name: 'Emma Dubois',
    role: 'DRH, LogisticPro',
    text: 'L\'application RH développée est exactement ce dont nous avions besoin. Ergonomique, rapide et notre équipe a tout de suite adopté l\'outil.',
    rating: 5,
    avatar: ''
  },
  {
    id: 't4',
    name: 'Antoine Martin',
    role: 'Architecte, Studio AM',
    text: 'Mon site vitrine reflète parfaitement mon univers. Garden Studio a su traduire mon identité en une expérience web unique.',
    rating: 5,
    avatar: ''
  }
];

export const DEMO_SETTINGS = {
  email: 'hello@gardenstudio.fr',
  phone: '+33 6 00 00 00 00',
  twitter: 'https://twitter.com/gardenstudio',
  linkedin: 'https://linkedin.com/company/gardenstudio',
  instagram: 'https://instagram.com/gardenstudio',
  github: 'https://github.com/gardenstudio',
  statProjects: 50,
  statClients: 35,
  statYears: 5
};
