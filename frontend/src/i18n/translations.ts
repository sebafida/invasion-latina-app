// Multi-language support for Invasion Latina app
// Languages: French (FR), Spanish (ES), Dutch (NL)

export type Language = 'fr' | 'es' | 'nl';

export interface Translations {
  // Common
  welcome: string;
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  back: string;
  next: string;
  submit: string;
  
  // Navigation
  home: string;
  djRequests: string;
  tickets: string;
  vipTables: string;
  profile: string;
  
  // Auth
  login: string;
  logout: string;
  email: string;
  password: string;
  name: string;
  loginButton: string;
  logoutConfirm: string;
  
  // Home
  homeTitle: string;
  homeSubtitle: string;
  nextEvent: string;
  buyTickets: string;
  requestSongs: string;
  bookVipTable: string;
  
  // DJ Requests
  djTitle: string;
  djSubtitle: string;
  requestSong: string;
  songTitle: string;
  artist: string;
  vote: string;
  votes: string;
  requestedTimes: string;
  noRequests: string;
  modeTest: string;
  
  // Tickets
  ticketsTitle: string;
  ticketsSubtitle: string;
  buyOnXceed: string;
  comingSoon: string;
  eventDate: string;
  venue: string;
  price: string;
  
  // VIP Tables
  vipTitle: string;
  vipSubtitle: string;
  selectEvent: string;
  vipZone: string;
  vipPackage: string;
  guestCount: string;
  bottlePreferences: string;
  specialRequests: string;
  contactInfo: string;
  bookingSummary: string;
  sendRequest: string;
  bronze: string;
  silver: string;
  gold: string;
  
  // Profile & Loyalty
  profileTitle: string;
  loyaltyTitle: string;
  points: string;
  visits: string;
  rewards: string;
  claimReward: string;
  myQrCode: string;
  showQrAtEntry: string;
  howItWorks: string;
  loyaltyInfo1: string;
  loyaltyInfo2: string;
  loyaltyInfo3: string;
  loyaltyInfo4: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    // Common
    welcome: 'Bienvenue',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    edit: 'Modifier',
    back: 'Retour',
    next: 'Suivant',
    submit: 'Envoyer',
    
    // Navigation
    home: 'Accueil',
    djRequests: 'DJ Requests',
    tickets: 'Billetterie',
    vipTables: 'Tables VIP',
    profile: 'Profil',
    
    // Auth
    login: 'Connexion',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    loginButton: 'Se connecter',
    logoutConfirm: 'Veux-tu vraiment te déconnecter?',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'La plus grande soirée latino-reggaeton de Belgique',
    nextEvent: 'Prochain événement',
    buyTickets: 'Acheter des billets',
    requestSongs: 'Demander des chansons',
    bookVipTable: 'Réserver table VIP',
    
    // DJ Requests
    djTitle: '🎵 DJ Requests',
    djSubtitle: 'Vote pour tes sons préférés',
    requestSong: 'Demander une chanson',
    songTitle: 'Titre de la chanson',
    artist: 'Artiste',
    vote: 'Voter',
    votes: 'votes',
    requestedTimes: 'Demandée',
    noRequests: 'Aucune requête pour le moment',
    modeTest: 'Mode Test',
    
    // Tickets
    ticketsTitle: '🎫 Billetterie',
    ticketsSubtitle: 'Réserve ta place maintenant!',
    buyOnXceed: 'Acheter sur XCEED',
    comingSoon: 'Bientôt disponible',
    eventDate: 'Date',
    venue: 'Lieu',
    price: 'Prix',
    
    // VIP Tables
    vipTitle: '🍾 Tables VIP',
    vipSubtitle: 'Réserve ta table pour une soirée inoubliable',
    selectEvent: 'Événement',
    vipZone: 'Zone VIP',
    vipPackage: 'Package VIP',
    guestCount: 'Nombre de personnes',
    bottlePreferences: 'Préférences bouteilles',
    specialRequests: 'Demandes spéciales',
    contactInfo: 'Informations de contact',
    bookingSummary: 'Résumé de votre réservation',
    sendRequest: 'Envoyer la demande',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    
    // Profile & Loyalty
    profileTitle: 'Profil',
    loyaltyTitle: '🎁 Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Visites',
    rewards: 'Récompenses',
    claimReward: 'Réclamer Guest Gratuit',
    myQrCode: 'Mon QR Code',
    showQrAtEntry: 'Montre ce QR à l\'entrée',
    howItWorks: '💡 Comment ça marche?',
    loyaltyInfo1: '• Montre ton QR code à l\'entrée = +5 Invasion Coins',
    loyaltyInfo2: '• 25 Invasion Coins = 1 guest gratuit',
    loyaltyInfo3: '• 1 scan par événement maximum',
    loyaltyInfo4: '• Récompense valable 90 jours',
  },
  
  es: {
    // Common
    welcome: 'Bienvenido',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Volver',
    next: 'Siguiente',
    submit: 'Enviar',
    
    // Navigation
    home: 'Inicio',
    djRequests: 'Pedidos DJ',
    tickets: 'Entradas',
    vipTables: 'Mesas VIP',
    profile: 'Perfil',
    
    // Auth
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    loginButton: 'Entrar',
    logoutConfirm: '¿Quieres cerrar sesión?',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'La fiesta latino-reggaeton más grande de Bélgica',
    nextEvent: 'Próximo evento',
    buyTickets: 'Comprar entradas',
    requestSongs: 'Pedir canciones',
    bookVipTable: 'Reservar mesa VIP',
    
    // DJ Requests
    djTitle: '🎵 Pedidos DJ',
    djSubtitle: 'Vota por tus canciones favoritas',
    requestSong: 'Pedir una canción',
    songTitle: 'Título de la canción',
    artist: 'Artista',
    vote: 'Votar',
    votes: 'votos',
    requestedTimes: 'Pedida',
    noRequests: 'No hay pedidos por ahora',
    modeTest: 'Modo Prueba',
    
    // Tickets
    ticketsTitle: '🎫 Entradas',
    ticketsSubtitle: '¡Reserva tu lugar ahora!',
    buyOnXceed: 'Comprar en XCEED',
    comingSoon: 'Próximamente',
    eventDate: 'Fecha',
    venue: 'Lugar',
    price: 'Precio',
    
    // VIP Tables
    vipTitle: '🍾 Mesas VIP',
    vipSubtitle: 'Reserva tu mesa para una noche inolvidable',
    selectEvent: 'Evento',
    vipZone: 'Zona VIP',
    vipPackage: 'Paquete VIP',
    guestCount: 'Número de personas',
    bottlePreferences: 'Preferencias de botellas',
    specialRequests: 'Peticiones especiales',
    contactInfo: 'Información de contacto',
    bookingSummary: 'Resumen de tu reserva',
    sendRequest: 'Enviar solicitud',
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    
    // Profile & Loyalty
    profileTitle: 'Perfil',
    loyaltyTitle: '🎁 Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Visitas',
    rewards: 'Recompensas',
    claimReward: 'Reclamar Entrada Gratis',
    myQrCode: 'Mi Código QR',
    showQrAtEntry: 'Muestra este QR en la entrada',
    howItWorks: '💡 ¿Cómo funciona?',
    loyaltyInfo1: '• Muestra tu código QR en la entrada = +5 Invasion Coins',
    loyaltyInfo2: '• 25 Invasion Coins = 1 entrada gratis',
    loyaltyInfo3: '• 1 escaneo por evento máximo',
    loyaltyInfo4: '• Recompensa válida por 90 días',
  },
  
  nl: {
    // Common
    welcome: 'Welkom',
    loading: 'Laden...',
    error: 'Fout',
    success: 'Succes',
    cancel: 'Annuleren',
    confirm: 'Bevestigen',
    save: 'Opslaan',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    back: 'Terug',
    next: 'Volgende',
    submit: 'Verzenden',
    
    // Navigation
    home: 'Home',
    djRequests: 'DJ Verzoeken',
    tickets: 'Tickets',
    vipTables: 'VIP Tafels',
    profile: 'Profiel',
    
    // Auth
    login: 'Inloggen',
    logout: 'Uitloggen',
    email: 'E-mail',
    password: 'Wachtwoord',
    name: 'Naam',
    loginButton: 'Aanmelden',
    logoutConfirm: 'Wil je uitloggen?',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'Het grootste latino-reggaeton feest van België',
    nextEvent: 'Volgend evenement',
    buyTickets: 'Tickets kopen',
    requestSongs: 'Liedjes aanvragen',
    bookVipTable: 'VIP tafel reserveren',
    
    // DJ Requests
    djTitle: '🎵 DJ Verzoeken',
    djSubtitle: 'Stem op je favoriete nummers',
    requestSong: 'Vraag een nummer aan',
    songTitle: 'Titel van het nummer',
    artist: 'Artiest',
    vote: 'Stemmen',
    votes: 'stemmen',
    requestedTimes: 'Aangevraagd',
    noRequests: 'Geen verzoeken op dit moment',
    modeTest: 'Test Modus',
    
    // Tickets
    ticketsTitle: '🎫 Tickets',
    ticketsSubtitle: 'Reserveer nu je plek!',
    buyOnXceed: 'Koop op XCEED',
    comingSoon: 'Binnenkort beschikbaar',
    eventDate: 'Datum',
    venue: 'Locatie',
    price: 'Prijs',
    
    // VIP Tables
    vipTitle: '🍾 VIP Tafels',
    vipSubtitle: 'Reserveer je tafel voor een onvergetelijke avond',
    selectEvent: 'Evenement',
    vipZone: 'VIP Zone',
    vipPackage: 'VIP Pakket',
    guestCount: 'Aantal personen',
    bottlePreferences: 'Fles voorkeuren',
    specialRequests: 'Speciale verzoeken',
    contactInfo: 'Contactinformatie',
    bookingSummary: 'Samenvatting van je reservering',
    sendRequest: 'Verzoek verzenden',
    bronze: 'Brons',
    silver: 'Zilver',
    gold: 'Goud',
    
    // Profile & Loyalty
    profileTitle: 'Profiel',
    loyaltyTitle: '🎁 Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Bezoeken',
    rewards: 'Beloningen',
    claimReward: 'Gratis Toegang Claimen',
    myQrCode: 'Mijn QR Code',
    showQrAtEntry: 'Toon deze QR bij de ingang',
    howItWorks: '💡 Hoe werkt het?',
    loyaltyInfo1: '• Toon je QR code bij de ingang = +5 Invasion Coins',
    loyaltyInfo2: '• 25 Invasion Coins = 1 gratis toegang',
    loyaltyInfo3: '• 1 scan per evenement maximum',
    loyaltyInfo4: '• Beloning geldig voor 90 dagen',
  },
};

export default translations;
