// Multi-language support for Invasion Latina app
// Languages: French (FR), English (EN), Spanish (ES), Dutch (NL)

export type Language = 'fr' | 'en' | 'es' | 'nl';

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
  yes: string;
  no: string;
  ok: string;
  close: string;
  
  // Navigation
  home: string;
  djRequests: string;
  tickets: string;
  vipTables: string;
  profile: string;
  djs: string;
  booking: string;
  requests: string;
  
  // Auth
  login: string;
  logout: string;
  email: string;
  password: string;
  name: string;
  loginButton: string;
  logoutConfirm: string;
  createAccount: string;
  forgotPassword: string;
  noAccount: string;
  haveAccount: string;
  register: string;
  loginWith: string;
  continueWithApple: string;
  continueWithGoogle: string;
  orContinueWith: string;
  
  // Home
  homeTitle: string;
  homeSubtitle: string;
  nextEvent: string;
  buyTickets: string;
  requestSongs: string;
  bookVipTable: string;
  followUs: string;
  listenPlaylist: string;
  vivaLaMusica: string;
  daysLeft: string;
  hoursLeft: string;
  minutesLeft: string;
  secondsLeft: string;
  lineup: string;
  noEventScheduled: string;
  
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
  requestedBy: string;
  sendRequest: string;
  songRequested: string;
  
  // DJs Page
  djsTitle: string;
  djsSubtitle: string;
  ourDjs: string;
  
  // Tickets
  ticketsTitle: string;
  ticketsSubtitle: string;
  buyOnXceed: string;
  comingSoon: string;
  eventDate: string;
  venue: string;
  price: string;
  ticketInfo: string;
  secureYourSpot: string;
  
  // VIP Tables / Booking
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
  sendBookingRequest: string;
  bronze: string;
  silver: string;
  gold: string;
  platinum: string;
  bookingSuccess: string;
  bookingPending: string;
  selectPackage: string;
  numberOfGuests: string;
  phoneNumber: string;
  additionalNotes: string;
  confirmBooking: string;
  
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
  freeGuestEntry: string;
  coinsForFreeGuest: string;
  notEnoughCoins: string;
  viewQrCode: string;
  qrCodeOneTime: string;
  
  // Language
  language: string;
  chooseLanguage: string;
  changingLanguage: string;
  
  // Admin
  admin: string;
  adminSection: string;
  djDashboard: string;
  manageContent: string;
  bookingsManagement: string;
  loyaltyScanner: string;
  djSelection: string;
  freeEntryScanner: string;
  
  // Gallery
  gallery: string;
  galleries: string;
  photos: string;
  videos: string;
  aftermovies: string;
  downloadPhoto: string;
  sharePhoto: string;
  
  // Misc
  seeAll: string;
  more: string;
  less: string;
  search: string;
  filter: string;
  sort: string;
  refresh: string;
  noResults: string;
  tryAgain: string;
  connectionError: string;
  comingSoonFeature: string;
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
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
    close: 'Fermer',
    
    // Navigation
    home: 'Accueil',
    djRequests: 'Requests',
    tickets: 'Tickets',
    vipTables: 'Tables VIP',
    profile: 'Profil',
    djs: 'DJs',
    booking: 'Booking',
    requests: 'Requests',
    
    // Auth
    login: 'Connexion',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    loginButton: 'Se connecter',
    logoutConfirm: 'Veux-tu vraiment te déconnecter?',
    createAccount: 'Créer un compte',
    forgotPassword: 'Mot de passe oublié?',
    noAccount: 'Pas encore de compte?',
    haveAccount: 'Déjà un compte?',
    register: 'S\'inscrire',
    loginWith: 'Se connecter avec',
    continueWithApple: 'Continuer avec Apple',
    continueWithGoogle: 'Continuer avec Google',
    orContinueWith: 'ou continuer avec',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'La plus grande soirée latino de Belgique',
    nextEvent: 'Prochain événement',
    buyTickets: 'Acheter des billets',
    requestSongs: 'Demander des chansons',
    bookVipTable: 'Réserver table VIP',
    followUs: 'Suivez-nous',
    listenPlaylist: 'Écouter la playlist',
    vivaLaMusica: 'Que viva la musica latina',
    daysLeft: 'jours',
    hoursLeft: 'heures',
    minutesLeft: 'min',
    secondsLeft: 'sec',
    lineup: 'Line-up',
    noEventScheduled: 'Aucun événement programmé',
    
    // DJ Requests
    djTitle: 'Requests',
    djSubtitle: 'Demande tes chansons préférées',
    requestSong: 'Demander une chanson',
    songTitle: 'Titre de la chanson',
    artist: 'Artiste',
    vote: 'Voter',
    votes: 'votes',
    requestedTimes: 'fois',
    noRequests: 'Aucune demande pour le moment',
    modeTest: 'Mode Test',
    requestedBy: 'Par',
    sendRequest: 'Envoyer',
    songRequested: 'Chanson demandée!',
    
    // DJs Page
    djsTitle: 'Nos DJs',
    djsSubtitle: 'Les meilleurs DJs de la scène latino',
    ourDjs: 'Nos DJs',
    
    // Tickets
    ticketsTitle: 'Billetterie',
    ticketsSubtitle: 'Réserve ta place maintenant!',
    buyOnXceed: 'Acheter sur XCEED',
    comingSoon: 'Bientôt disponible',
    eventDate: 'Date',
    venue: 'Lieu',
    price: 'Prix',
    ticketInfo: 'Infos tickets',
    secureYourSpot: 'Réserve ta place',
    
    // VIP Tables / Booking
    vipTitle: 'Tables VIP',
    vipSubtitle: 'Réserve ta table pour une soirée inoubliable',
    selectEvent: 'Événement',
    vipZone: 'Zone VIP',
    vipPackage: 'Package VIP',
    guestCount: 'Nombre de personnes',
    bottlePreferences: 'Préférences bouteilles',
    specialRequests: 'Demandes spéciales',
    contactInfo: 'Informations de contact',
    bookingSummary: 'Résumé de votre réservation',
    sendBookingRequest: 'Envoyer la demande',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    bookingSuccess: 'Réservation envoyée!',
    bookingPending: 'En attente de confirmation',
    selectPackage: 'Choisir un package',
    numberOfGuests: 'Nombre de personnes',
    phoneNumber: 'Numéro de téléphone',
    additionalNotes: 'Notes additionnelles',
    confirmBooking: 'Confirmer la réservation',
    
    // Profile & Loyalty
    profileTitle: 'Profil',
    loyaltyTitle: 'Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Visites',
    rewards: 'Récompenses',
    claimReward: 'Réclamer Guest Gratuite (25 Coins)',
    myQrCode: 'Mon QR Code',
    showQrAtEntry: 'Montre ce QR à l\'entrée',
    howItWorks: 'Comment ça marche?',
    loyaltyInfo1: 'Montre ton QR code à l\'entrée = +5 Invasion Coins',
    loyaltyInfo2: '25 Invasion Coins = 1 guest gratuite',
    loyaltyInfo3: '1 scan par événement maximum',
    loyaltyInfo4: 'Récompense valable 90 jours',
    freeGuestEntry: 'Guest Gratuite',
    coinsForFreeGuest: 'Invasion Coins pour une guest gratuite',
    notEnoughCoins: 'Pas encore assez de Coins',
    viewQrCode: 'Voir mon QR Code Guest Gratuite',
    qrCodeOneTime: 'Ce code ne peut être utilisé qu\'une seule fois',
    
    // Language
    language: 'Langue',
    chooseLanguage: 'Choisir la langue',
    changingLanguage: 'Changement de langue...',
    
    // Admin
    admin: 'Admin',
    adminSection: 'Section Admin',
    djDashboard: 'DJ Dashboard',
    manageContent: 'Gestion du Contenu',
    bookingsManagement: 'Réservations Tables',
    loyaltyScanner: 'Scanner Fidélité',
    djSelection: 'Sélection DJs Event',
    freeEntryScanner: 'Scanner Entrée Gratuite',
    
    // Gallery
    gallery: 'Galerie',
    galleries: 'Galeries',
    photos: 'Photos',
    videos: 'Vidéos',
    aftermovies: 'Aftermovies',
    downloadPhoto: 'Télécharger',
    sharePhoto: 'Partager',
    
    // Misc
    seeAll: 'Voir tout',
    more: 'Plus',
    less: 'Moins',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    refresh: 'Actualiser',
    noResults: 'Aucun résultat',
    tryAgain: 'Réessayer',
    connectionError: 'Erreur de connexion',
    comingSoonFeature: 'Fonctionnalité bientôt disponible',
  },
  
  en: {
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    close: 'Close',
    
    // Navigation
    home: 'Home',
    djRequests: 'Requests',
    tickets: 'Tickets',
    vipTables: 'VIP Tables',
    profile: 'Profile',
    djs: 'DJs',
    booking: 'Booking',
    requests: 'Requests',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    loginButton: 'Sign in',
    logoutConfirm: 'Do you really want to log out?',
    createAccount: 'Create account',
    forgotPassword: 'Forgot password?',
    noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?',
    register: 'Sign up',
    loginWith: 'Sign in with',
    continueWithApple: 'Continue with Apple',
    continueWithGoogle: 'Continue with Google',
    orContinueWith: 'or continue with',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'The biggest latino party in Belgium',
    nextEvent: 'Next Event',
    buyTickets: 'Buy tickets',
    requestSongs: 'Request songs',
    bookVipTable: 'Book VIP table',
    followUs: 'Follow us',
    listenPlaylist: 'Listen to playlist',
    vivaLaMusica: 'Long live latin music',
    daysLeft: 'days',
    hoursLeft: 'hours',
    minutesLeft: 'min',
    secondsLeft: 'sec',
    lineup: 'Line-up',
    noEventScheduled: 'No event scheduled',
    
    // DJ Requests
    djTitle: 'Requests',
    djSubtitle: 'Request your favorite songs',
    requestSong: 'Request a song',
    songTitle: 'Song title',
    artist: 'Artist',
    vote: 'Vote',
    votes: 'votes',
    requestedTimes: 'times',
    noRequests: 'No requests yet',
    modeTest: 'Test Mode',
    requestedBy: 'By',
    sendRequest: 'Send',
    songRequested: 'Song requested!',
    
    // DJs Page
    djsTitle: 'Our DJs',
    djsSubtitle: 'The best DJs of the latino scene',
    ourDjs: 'Our DJs',
    
    // Tickets
    ticketsTitle: 'Tickets',
    ticketsSubtitle: 'Book your spot now!',
    buyOnXceed: 'Buy on XCEED',
    comingSoon: 'Coming soon',
    eventDate: 'Date',
    venue: 'Venue',
    price: 'Price',
    ticketInfo: 'Ticket info',
    secureYourSpot: 'Secure your spot',
    
    // VIP Tables / Booking
    vipTitle: 'VIP Tables',
    vipSubtitle: 'Book your table for an unforgettable night',
    selectEvent: 'Event',
    vipZone: 'VIP Zone',
    vipPackage: 'VIP Package',
    guestCount: 'Number of guests',
    bottlePreferences: 'Bottle preferences',
    specialRequests: 'Special requests',
    contactInfo: 'Contact information',
    bookingSummary: 'Booking summary',
    sendBookingRequest: 'Send request',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    bookingSuccess: 'Booking sent!',
    bookingPending: 'Pending confirmation',
    selectPackage: 'Select a package',
    numberOfGuests: 'Number of guests',
    phoneNumber: 'Phone number',
    additionalNotes: 'Additional notes',
    confirmBooking: 'Confirm booking',
    
    // Profile & Loyalty
    profileTitle: 'Profile',
    loyaltyTitle: 'Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Visits',
    rewards: 'Rewards',
    claimReward: 'Claim Free Guest (25 Coins)',
    myQrCode: 'My QR Code',
    showQrAtEntry: 'Show this QR at the entrance',
    howItWorks: 'How it works?',
    loyaltyInfo1: 'Show your QR code at the entrance = +5 Invasion Coins',
    loyaltyInfo2: '25 Invasion Coins = 1 free guest',
    loyaltyInfo3: '1 scan per event maximum',
    loyaltyInfo4: 'Reward valid for 90 days',
    freeGuestEntry: 'Free Guest',
    coinsForFreeGuest: 'Invasion Coins for a free guest',
    notEnoughCoins: 'Not enough Coins yet',
    viewQrCode: 'View my Free Guest QR Code',
    qrCodeOneTime: 'This code can only be used once',
    
    // Language
    language: 'Language',
    chooseLanguage: 'Choose language',
    changingLanguage: 'Changing language...',
    
    // Admin
    admin: 'Admin',
    adminSection: 'Admin Section',
    djDashboard: 'DJ Dashboard',
    manageContent: 'Content Management',
    bookingsManagement: 'Table Reservations',
    loyaltyScanner: 'Loyalty Scanner',
    djSelection: 'DJ Selection Event',
    freeEntryScanner: 'Free Entry Scanner',
    
    // Gallery
    gallery: 'Gallery',
    galleries: 'Galleries',
    photos: 'Photos',
    videos: 'Videos',
    aftermovies: 'Aftermovies',
    downloadPhoto: 'Download',
    sharePhoto: 'Share',
    
    // Misc
    seeAll: 'See all',
    more: 'More',
    less: 'Less',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    noResults: 'No results',
    tryAgain: 'Try again',
    connectionError: 'Connection error',
    comingSoonFeature: 'Feature coming soon',
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
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    close: 'Cerrar',
    
    // Navigation
    home: 'Inicio',
    djRequests: 'Requests',
    tickets: 'Tickets',
    vipTables: 'Mesas VIP',
    profile: 'Perfil',
    djs: 'DJs',
    booking: 'Booking',
    requests: 'Requests',
    
    // Auth
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    loginButton: 'Entrar',
    logoutConfirm: '¿Quieres cerrar sesión?',
    createAccount: 'Crear cuenta',
    forgotPassword: '¿Olvidaste la contraseña?',
    noAccount: '¿No tienes cuenta?',
    haveAccount: '¿Ya tienes cuenta?',
    register: 'Registrarse',
    loginWith: 'Iniciar sesión con',
    continueWithApple: 'Continuar con Apple',
    continueWithGoogle: 'Continuar con Google',
    orContinueWith: 'o continuar con',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'La fiesta latina más grande de Bélgica',
    nextEvent: 'Próximo evento',
    buyTickets: 'Comprar entradas',
    requestSongs: 'Pedir canciones',
    bookVipTable: 'Reservar mesa VIP',
    followUs: 'Síguenos',
    listenPlaylist: 'Escuchar playlist',
    vivaLaMusica: 'Que viva la música latina',
    daysLeft: 'días',
    hoursLeft: 'horas',
    minutesLeft: 'min',
    secondsLeft: 'seg',
    lineup: 'Line-up',
    noEventScheduled: 'Ningún evento programado',
    
    // DJ Requests
    djTitle: 'Requests',
    djSubtitle: 'Pide tus canciones favoritas',
    requestSong: 'Pedir una canción',
    songTitle: 'Título de la canción',
    artist: 'Artista',
    vote: 'Votar',
    votes: 'votos',
    requestedTimes: 'veces',
    noRequests: 'No hay pedidos por ahora',
    modeTest: 'Modo Prueba',
    requestedBy: 'Por',
    sendRequest: 'Enviar',
    songRequested: '¡Canción pedida!',
    
    // DJs Page
    djsTitle: 'Nuestros DJs',
    djsSubtitle: 'Los mejores DJs de la escena latina',
    ourDjs: 'Nuestros DJs',
    
    // Tickets
    ticketsTitle: 'Entradas',
    ticketsSubtitle: '¡Reserva tu lugar ahora!',
    buyOnXceed: 'Comprar en XCEED',
    comingSoon: 'Próximamente',
    eventDate: 'Fecha',
    venue: 'Lugar',
    price: 'Precio',
    ticketInfo: 'Info entradas',
    secureYourSpot: 'Reserva tu lugar',
    
    // VIP Tables / Booking
    vipTitle: 'Mesas VIP',
    vipSubtitle: 'Reserva tu mesa para una noche inolvidable',
    selectEvent: 'Evento',
    vipZone: 'Zona VIP',
    vipPackage: 'Paquete VIP',
    guestCount: 'Número de personas',
    bottlePreferences: 'Preferencias de botellas',
    specialRequests: 'Peticiones especiales',
    contactInfo: 'Información de contacto',
    bookingSummary: 'Resumen de tu reserva',
    sendBookingRequest: 'Enviar solicitud',
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    platinum: 'Platino',
    bookingSuccess: '¡Reserva enviada!',
    bookingPending: 'Pendiente de confirmación',
    selectPackage: 'Seleccionar paquete',
    numberOfGuests: 'Número de personas',
    phoneNumber: 'Número de teléfono',
    additionalNotes: 'Notas adicionales',
    confirmBooking: 'Confirmar reserva',
    
    // Profile & Loyalty
    profileTitle: 'Perfil',
    loyaltyTitle: 'Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Visitas',
    rewards: 'Recompensas',
    claimReward: 'Reclamar Entrada Gratis (25 Coins)',
    myQrCode: 'Mi Código QR',
    showQrAtEntry: 'Muestra este QR en la entrada',
    howItWorks: '¿Cómo funciona?',
    loyaltyInfo1: 'Muestra tu código QR en la entrada = +5 Invasion Coins',
    loyaltyInfo2: '25 Invasion Coins = 1 entrada gratis',
    loyaltyInfo3: '1 escaneo por evento máximo',
    loyaltyInfo4: 'Recompensa válida por 90 días',
    freeGuestEntry: 'Entrada Gratis',
    coinsForFreeGuest: 'Invasion Coins para una entrada gratis',
    notEnoughCoins: 'Aún no tienes suficientes Coins',
    viewQrCode: 'Ver mi QR Code Entrada Gratis',
    qrCodeOneTime: 'Este código solo puede usarse una vez',
    
    // Language
    language: 'Idioma',
    chooseLanguage: 'Elegir idioma',
    changingLanguage: 'Cambiando idioma...',
    
    // Admin
    admin: 'Admin',
    adminSection: 'Sección Admin',
    djDashboard: 'DJ Dashboard',
    manageContent: 'Gestión de Contenido',
    bookingsManagement: 'Reservas de Mesas',
    loyaltyScanner: 'Escáner Fidelidad',
    djSelection: 'Selección DJs Evento',
    freeEntryScanner: 'Escáner Entrada Gratis',
    
    // Gallery
    gallery: 'Galería',
    galleries: 'Galerías',
    photos: 'Fotos',
    videos: 'Videos',
    aftermovies: 'Aftermovies',
    downloadPhoto: 'Descargar',
    sharePhoto: 'Compartir',
    
    // Misc
    seeAll: 'Ver todo',
    more: 'Más',
    less: 'Menos',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    refresh: 'Actualizar',
    noResults: 'Sin resultados',
    tryAgain: 'Intentar de nuevo',
    connectionError: 'Error de conexión',
    comingSoonFeature: 'Función próximamente',
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
    yes: 'Ja',
    no: 'Nee',
    ok: 'OK',
    close: 'Sluiten',
    
    // Navigation
    home: 'Home',
    djRequests: 'Requests',
    tickets: 'Tickets',
    vipTables: 'VIP Tafels',
    profile: 'Profiel',
    djs: 'DJs',
    booking: 'Booking',
    requests: 'Requests',
    
    // Auth
    login: 'Inloggen',
    logout: 'Uitloggen',
    email: 'E-mail',
    password: 'Wachtwoord',
    name: 'Naam',
    loginButton: 'Aanmelden',
    logoutConfirm: 'Wil je uitloggen?',
    createAccount: 'Account aanmaken',
    forgotPassword: 'Wachtwoord vergeten?',
    noAccount: 'Nog geen account?',
    haveAccount: 'Al een account?',
    register: 'Registreren',
    loginWith: 'Inloggen met',
    continueWithApple: 'Doorgaan met Apple',
    continueWithGoogle: 'Doorgaan met Google',
    orContinueWith: 'of doorgaan met',
    
    // Home
    homeTitle: 'Invasion Latina',
    homeSubtitle: 'Het grootste latino feest van België',
    nextEvent: 'Volgend evenement',
    buyTickets: 'Tickets kopen',
    requestSongs: 'Liedjes aanvragen',
    bookVipTable: 'VIP tafel reserveren',
    followUs: 'Volg ons',
    listenPlaylist: 'Luister naar playlist',
    vivaLaMusica: 'Leve de Latijnse muziek',
    daysLeft: 'dagen',
    hoursLeft: 'uren',
    minutesLeft: 'min',
    secondsLeft: 'sec',
    lineup: 'Line-up',
    noEventScheduled: 'Geen evenement gepland',
    
    // DJ Requests
    djTitle: 'Requests',
    djSubtitle: 'Vraag je favoriete nummers aan',
    requestSong: 'Vraag een nummer aan',
    songTitle: 'Titel van het nummer',
    artist: 'Artiest',
    vote: 'Stemmen',
    votes: 'stemmen',
    requestedTimes: 'keer',
    noRequests: 'Geen verzoeken op dit moment',
    modeTest: 'Test Modus',
    requestedBy: 'Door',
    sendRequest: 'Verzenden',
    songRequested: 'Nummer aangevraagd!',
    
    // DJs Page
    djsTitle: 'Onze DJs',
    djsSubtitle: 'De beste DJs van de Latino scene',
    ourDjs: 'Onze DJs',
    
    // Tickets
    ticketsTitle: 'Tickets',
    ticketsSubtitle: 'Reserveer nu je plek!',
    buyOnXceed: 'Koop op XCEED',
    comingSoon: 'Binnenkort beschikbaar',
    eventDate: 'Datum',
    venue: 'Locatie',
    price: 'Prijs',
    ticketInfo: 'Ticket info',
    secureYourSpot: 'Reserveer je plek',
    
    // VIP Tables / Booking
    vipTitle: 'VIP Tafels',
    vipSubtitle: 'Reserveer je tafel voor een onvergetelijke avond',
    selectEvent: 'Evenement',
    vipZone: 'VIP Zone',
    vipPackage: 'VIP Pakket',
    guestCount: 'Aantal personen',
    bottlePreferences: 'Fles voorkeuren',
    specialRequests: 'Speciale verzoeken',
    contactInfo: 'Contactinformatie',
    bookingSummary: 'Samenvatting van je reservering',
    sendBookingRequest: 'Verzoek verzenden',
    bronze: 'Brons',
    silver: 'Zilver',
    gold: 'Goud',
    platinum: 'Platina',
    bookingSuccess: 'Reservering verzonden!',
    bookingPending: 'Wacht op bevestiging',
    selectPackage: 'Selecteer een pakket',
    numberOfGuests: 'Aantal personen',
    phoneNumber: 'Telefoonnummer',
    additionalNotes: 'Extra opmerkingen',
    confirmBooking: 'Reservering bevestigen',
    
    // Profile & Loyalty
    profileTitle: 'Profiel',
    loyaltyTitle: 'Invasion Rewards',
    points: 'Invasion Coins',
    visits: 'Bezoeken',
    rewards: 'Beloningen',
    claimReward: 'Gratis Toegang Claimen (25 Coins)',
    myQrCode: 'Mijn QR Code',
    showQrAtEntry: 'Toon deze QR bij de ingang',
    howItWorks: 'Hoe werkt het?',
    loyaltyInfo1: 'Toon je QR code bij de ingang = +5 Invasion Coins',
    loyaltyInfo2: '25 Invasion Coins = 1 gratis toegang',
    loyaltyInfo3: '1 scan per evenement maximum',
    loyaltyInfo4: 'Beloning geldig voor 90 dagen',
    freeGuestEntry: 'Gratis Toegang',
    coinsForFreeGuest: 'Invasion Coins voor gratis toegang',
    notEnoughCoins: 'Nog niet genoeg Coins',
    viewQrCode: 'Bekijk mijn Gratis Toegang QR Code',
    qrCodeOneTime: 'Deze code kan maar één keer gebruikt worden',
    
    // Language
    language: 'Taal',
    chooseLanguage: 'Kies taal',
    changingLanguage: 'Taal wijzigen...',
    
    // Admin
    admin: 'Admin',
    adminSection: 'Admin Sectie',
    djDashboard: 'DJ Dashboard',
    manageContent: 'Inhoudsbeheer',
    bookingsManagement: 'Tafel Reserveringen',
    loyaltyScanner: 'Loyaliteit Scanner',
    djSelection: 'DJ Selectie Evenement',
    freeEntryScanner: 'Gratis Toegang Scanner',
    
    // Gallery
    gallery: 'Galerij',
    galleries: 'Galerijen',
    photos: 'Foto\'s',
    videos: 'Video\'s',
    aftermovies: 'Aftermovies',
    downloadPhoto: 'Downloaden',
    sharePhoto: 'Delen',
    
    // Misc
    seeAll: 'Alles bekijken',
    more: 'Meer',
    less: 'Minder',
    search: 'Zoeken',
    filter: 'Filteren',
    sort: 'Sorteren',
    refresh: 'Vernieuwen',
    noResults: 'Geen resultaten',
    tryAgain: 'Opnieuw proberen',
    connectionError: 'Verbindingsfout',
    comingSoonFeature: 'Functie binnenkort beschikbaar',
  },
};

export default translations;
