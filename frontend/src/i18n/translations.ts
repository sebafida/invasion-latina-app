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
  loginSubtitle: string;
  enterPassword: string;
  or: string;
  
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
  
  // Quick Actions
  voteForSongs: string;
  eventGalleries: string;
  watchRecap: string;
  tables: string;
  socialNetworks: string;
  spotifyPlaylist: string;
  
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
  djsDescription: string;
  askForSong: string;
  playYourFavorite: string;
  ourDjs: string;
  ourResidentDjs: string;
  djsInfoText: string;
  followOnInstagram: string;
  masterOfCeremonies: string;
  whatSongWant: string;
  residentDj: string;
  partyLover: string;
  testModeActive: string;
  readyToRequest: string;
  bypassGeofencing: string;
  sendTheRequest: string;
  requestSentSuccess: string;
  recentHistory: string;
  coins: string;
  songAddedToList: string;
  
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
  informations: string;
  ticketsSoldViaXceed: string;
  confirmationByEmail: string;
  qrCodeSent: string;
  refundConditions: string;
  
  // Galleries
  galleriesTitle: string;
  galleriesSubtitle: string;
  loadingGalleries: string;
  noGalleryAvailable: string;
  photosPublishedAfterEvent: string;
  viewPhotos: string;
  features: string;
  hdDownload: string;
  downloadHdPhotos: string;
  available: string;
  socialShare: string;
  shareOnInstagram: string;
  reliveTheBestMoments: string;
  
  // Aftermovies
  aftermoviesTitle: string;
  aftermoviesSubtitle: string;
  latestVideo: string;
  allVideos: string;
  loadingVideos: string;
  noVideoAvailable: string;
  aftermoviesComingSoon: string;
  stayConnected: string;
  followUsForAftermovies: string;
  views: string;
  rewatchBestParties: string;
  
  // VIP Tables / Booking
  vipTitle: string;
  vipSubtitle: string;
  selectEvent: string;
  vipZone: string;
  vipPackage: string;
  guestCount: string;
  specialRequests: string;
  sendBookingRequest: string;
  bronze: string;
  silver: string;
  gold: string;
  platinum: string;
  bookingSuccess: string;
  bookingPending: string;
  selectPackage: string;
  numberOfGuests: string;
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
  eventSettings: string;
  
  // Gallery
  gallery: string;
  galleries: string;
  videos: string;
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
  
  // Success/Error messages
  voteRegistered: string;
  fillAllFields: string;
  
  // Register/Forms
  joinInvasionLatina: string;
  createAccountSubtitle: string;
  fullName: string;
  confirmPassword: string;
  minCharacters: string;
  repeatPassword: string;
  acceptTerms: string;
  termsAndConditions: string;
  privacyPolicy: string;
  marketingConsent: string;
  requiredFields: string;
  appLanguage: string;
  createMyAccount: string;
  alreadyAccount: string;
  passwordsDontMatch: string;
  passwordTooShort: string;
  mustAcceptTerms: string;
  registrationFailed: string;
  
  // Admin Bookings
  tableReservations: string;
  pending: string;
  confirmed: string;
  cancelled: string;
  all: string;
  revenue: string;
  clearAllBookings: string;
  deleteBooking: string;
  cancelBooking: string;
  bookingOf: string;
  irreversibleAction: string;
  clearAll: string;
  people: string;
  reservedOn: string;
  
  // Admin DJ Dashboard
  manageRequestsRealtime: string;
  total: string;
  played: string;
  rejected: string;
  requestsSortedByVotes: string;
  autoRefresh10s: string;
  clearAllRequests: string;
  allRequests: string;
  pendingRequests: string;
  playedSongs: string;
  rejectedRequests: string;
  noRequestsInCategory: string;
  whyReject: string;
  markAsPlayed: string;
  rejectRequest: string;
  deleteRequest: string;
  legend: string;
  markAsPlayedLegend: string;
  rejectRequestLegend: string;
  deleteForeverLegend: string;
  
  // Reject reasons
  notAppropriate: string;
  alreadyPlayedTonight: string;
  nextTime: string;
  notInLibrary: string;
  wrongStyle: string;
  tooSlow: string;
  explicitContent: string;
  technicalIssue: string;
  
  // Scanner
  loyaltyScannerTitle: string;
  scanClientQR: string;
  cameraAccessRequired: string;
  cameraAccessDescription: string;
  allowCamera: string;
  placeQRInFrame: string;
  verifying: string;
  clientShowsQR: string;
  autoCredited: string;
  checkinSuccess: string;
  checkinError: string;
  checkinFailed: string;
  continueScanning: string;
  totalPoints: string;
  
  // Booking/VIP Tables
  bookingTitle: string;
  mainRoom: string;
  mainRoomDesc: string;
  classyRoom: string;
  classyRoomDesc: string;
  vipRoom: string;
  vipRoomDesc: string;
  tableHaute: string;
  tableAssise: string;
  tablePremium: string;
  tablePresidentielle: string;
  standingTable: string;
  danceFloorView: string;
  seatedTable: string;
  dedicatedService: string;
  bestLocation: string;
  privatifSpace: string;
  exclusiveService: string;
  vipLounge: string;
  vipSpaceAccess: string;
  largerSpace: string;
  priorityEntry: string;
  luxuryTable: string;
  vipDedicatedService: string;
  privateExclusive: string;
  butlerService: string;
  numberOfPeople: string;
  bottlePreferences: string;
  bottlePreferencesOptional: string;
  bottlePreferencesPlaceholder: string;
  specialRequestsOptional: string;
  specialRequestsPlaceholder: string;
  contactInfo: string;
  bookingSummary: string;
  room: string;
  table: string;
  capacity: string;
  price: string;
  paymentNote: string;
  sendRequest: string;
  sending: string;
  requestSent: string;
  requestSuccessMessage: string;
  contactWithin24h: string;
  great: string;
  noEventAvailable: string;
  
  // Welcome page
  getStarted: string;
  nextEventBadge: string;
  alreadyHaveAccount: string;
  sinceYears: string;
  
  // Notification Preferences
  notificationPreferences: string;
  chooseWhatToReceive: string;
  systemNotificationSettings: string;
  tapToOpenSystemSettings: string;
  enableAll: string;
  disableAll: string;
  disable: string;
  disableAllNotifications: string;
  disableAllNotificationsConfirm: string;
  allNotificationsEnabled: string;
  pushNotifications: string;
  enablePushNotifications: string;
  enablePushNotificationsDesc: string;
  newEvents: string;
  newEventsDesc: string;
  eventReminders: string;
  eventRemindersDesc: string;
  promotionsAndOffers: string;
  promotions: string;
  promotionsDesc: string;
  invasionCoinsNotif: string;
  invasionCoinsNotifDesc: string;
  djUpdates: string;
  djUpdatesDesc: string;
  newsletterEmail: string;
  newsletterEmailDesc: string;
  notificationPrivacyNotice: string;
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
    voteRegistered: 'Vote enregistré! 👍',
    fillAllFields: 'Veuillez remplir tous les champs',
    
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
    loginSubtitle: 'Connecte-toi pour continuer la fiesta',
    enterPassword: 'Entre ton mot de passe',
    or: 'ou',
    
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
    
    // Quick Actions
    djRequests: 'Requests DJ',
    voteForSongs: 'Votez pour les chansons',
    photos: 'Photos',
    eventGalleries: 'Galeries événements',
    aftermovies: 'Aftermovies',
    watchRecap: 'Voir les récaps',
    booking: 'Réservation',
    tables: 'Tables VIP',
    socialNetworks: 'Réseaux Sociaux',
    spotifyPlaylist: 'Playlist Spotify',
    
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
    djsDescription: 'Reggaeton • Dembow • Latin House',
    askForSong: 'Demander une chanson',
    playYourFavorite: 'Faites jouer votre titre préféré!',
    ourResidentDjs: 'Nos DJs Résidents',
    djsInfoText: 'Découvrez nos DJs résidents qui enflamment la piste chaque événement',
    followOnInstagram: 'Suivre sur Instagram',
    masterOfCeremonies: 'Maître de Cérémonie',
    whatSongWant: 'Quelle chanson veux-tu entendre?',
    residentDj: 'DJ Résident',
    partyLover: 'Fêtard',
    testModeActive: '🔧 Mode Test Activé',
    readyToRequest: '✅ Prêt à demander',
    bypassGeofencing: 'Bypass geofencing & horaires',
    sendTheRequest: 'Envoyer la demande',
    requestSentSuccess: 'Demande envoyée!',
    songAddedToList: 'Ta chanson a été ajoutée à la liste. Le DJ la jouera si possible!',
    recentHistory: 'Historique récent',
    coins: 'Coins',
    residentDj: 'DJ Résident',
    partyLover: 'Fêtard',
    testModeActive: 'Mode Test Actif',
    readyToRequest: 'Prêt à demander',
    bypassGeofencing: 'Contourner la géolocalisation',
    sendTheRequest: 'Envoyer la demande',
    requestSentSuccess: 'Demande envoyée avec succès',
    recentHistory: 'Historique récent',
    coins: 'Coins',
    
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
    informations: 'Informations',
    ticketsSoldViaXceed: 'Billets vendus via XCEED (plateforme sécurisée)',
    confirmationByEmail: 'Confirmation par email après achat',
    qrCodeSent: 'QR Code d\'entrée envoyé directement',
    refundConditions: 'Remboursement selon conditions XCEED',
    
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
    eventSettings: 'Paramètres Événement',
    
    // Gallery
    gallery: 'Galerie',
    galleries: 'Galeries',
    galleriesTitle: 'Galeries Photos',
    galleriesSubtitle: 'Revivez les meilleurs moments',
    loadingGalleries: 'Chargement des galeries...',
    noGalleryAvailable: 'Aucune galerie disponible',
    photosPublishedAfterEvent: 'Les photos seront publiées après le prochain événement',
    viewPhotos: 'Voir les photos',
    features: 'Fonctionnalités',
    hdDownload: 'Téléchargement HD',
    downloadHdPhotos: 'Télécharge tes photos en haute qualité',
    available: 'Disponible',
    socialShare: 'Partage Social',
    shareOnInstagram: 'Partage directement sur Instagram, etc.',
    reliveTheBestMoments: 'Revivez les meilleurs moments',
    photos: 'Photos',
    videos: 'Vidéos',
    aftermovies: 'Aftermovies',
    aftermoviesTitle: 'Aftermovies',
    aftermoviesSubtitle: 'Revois les meilleures soirées',
    latestVideo: 'Dernière vidéo',
    allVideos: 'Toutes les vidéos',
    loadingVideos: 'Chargement des vidéos...',
    noVideoAvailable: 'Aucune vidéo disponible',
    aftermoviesComingSoon: 'Les aftermovies seront publiés bientôt!',
    stayConnected: 'Reste connecté!',
    followUsForAftermovies: 'Suis-nous sur les réseaux pour ne rater aucun aftermovie',
    views: 'vues',
    rewatchBestParties: 'Revois les meilleures soirées',
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
    
    // Success/Error messages
    voteRegistered: 'Vote enregistré!',
    fillAllFields: 'Veuillez remplir tous les champs obligatoires',
    
    // Register/Forms
    joinInvasionLatina: 'Rejoins Invasion Latina',
    createAccountSubtitle: 'Crée ton compte et prépare-toi à faire la fête',
    fullName: 'Nom complet',
    phoneNumber: 'Numéro de téléphone',
    confirmPassword: 'Confirmer le mot de passe',
    minCharacters: 'Min. 6 caractères',
    repeatPassword: 'Répète ton mot de passe',
    acceptTerms: 'J\'accepte les',
    termsAndConditions: 'conditions générales d\'utilisation',
    privacyPolicy: 'politique de confidentialité',
    marketingConsent: 'J\'accepte de recevoir des informations sur les événements, promotions et actualités d\'Invasion Latina par email et/ou SMS',
    requiredFields: 'Champs obligatoires',
    appLanguage: 'Langue de l\'application',
    createMyAccount: 'Créer mon compte',
    alreadyAccount: 'Déjà un compte ?',
    passwordsDontMatch: 'Les mots de passe ne correspondent pas',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    mustAcceptTerms: 'Vous devez accepter les conditions générales',
    registrationFailed: 'Inscription échouée',
    
    // Admin Bookings
    tableReservations: 'Réservations Tables',
    pending: 'En attente',
    confirmed: 'Confirmées',
    cancelled: 'Annulées',
    all: 'Toutes',
    revenue: 'Revenus',
    clearAllBookings: 'Effacer toutes les réservations',
    deleteBooking: 'Supprimer cette réservation?',
    cancelBooking: 'Annuler cette réservation?',
    bookingOf: 'Réservation de',
    irreversibleAction: 'Cette action est irréversible!',
    clearAll: 'Tout effacer',
    people: 'personnes',
    reservedOn: 'Réservé le',
    
    // Admin DJ Dashboard
    manageRequestsRealtime: 'Gérez les demandes en temps réel',
    total: 'Total',
    played: 'Joués',
    rejected: 'Rejetés',
    requestsSortedByVotes: 'Les requêtes sont triées par votes.',
    autoRefresh10s: 'Rafraîchissement automatique toutes les 10s.',
    clearAllRequests: 'Effacer toutes les demandes',
    allRequests: 'Toutes les requêtes',
    pendingRequests: 'Requêtes en attente',
    playedSongs: 'Chansons jouées',
    rejectedRequests: 'Requêtes rejetées',
    noRequestsInCategory: 'Aucune requête dans cette catégorie',
    whyReject: 'Pourquoi rejeter?',
    markAsPlayed: 'Marquer comme joué',
    rejectRequest: 'Rejeter la demande',
    deleteRequest: 'Supprimer définitivement',
    legend: 'Légende',
    markAsPlayedLegend: 'Marquer comme joué',
    rejectRequestLegend: 'Rejeter la demande',
    deleteForeverLegend: 'Supprimer définitivement',
    
    // Reject reasons
    notAppropriate: 'Pas approprié pour la soirée',
    alreadyPlayedTonight: 'Déjà passé ce soir',
    nextTime: 'Ça sera pour la prochaine!',
    notInLibrary: 'Pas dans notre bibliothèque',
    wrongStyle: 'Ne correspond pas au style',
    tooSlow: 'Trop lent pour le moment',
    explicitContent: 'Contenu trop explicite',
    technicalIssue: 'Problème technique',
    
    // Scanner
    loyaltyScannerTitle: 'Scanner Fidélité',
    scanClientQR: 'Scannez le QR code du client',
    cameraAccessRequired: 'Accès Caméra Requis',
    cameraAccessDescription: 'Pour scanner les QR codes de fidélité, l\'accès à la caméra est nécessaire.',
    allowCamera: 'Autoriser la Caméra',
    placeQRInFrame: 'Placez le QR code dans le cadre',
    verifying: 'Vérification...',
    clientShowsQR: 'Le client montre son QR code depuis l\'app',
    autoCredited: '+5 Invasion Coins automatiquement crédités',
    checkinSuccess: 'Check-in Réussi!',
    checkinError: 'Erreur',
    checkinFailed: 'Échec du check-in',
    continueScanning: 'Continuer à Scanner',
    totalPoints: 'Total',
    
    // Booking/VIP Tables - Room descriptions
    bookingTitle: 'Réservation Tables',
    mainRoom: 'Main Room',
    mainRoomDesc: 'Au cœur de l\'action, ambiance garantie!',
    classyRoom: 'Classy Room',
    classyRoomDesc: 'L\'élégance dans une ambiance plus intimiste',
    vipRoom: 'VIP',
    vipRoomDesc: 'Le summum du luxe et de l\'exclusivité',
    tableHaute: 'Table Haute',
    tableAssise: 'Table Assise',
    tablePremium: 'Table Premium',
    tablePresidentielle: 'Table Présidentielle',
    standingTable: 'Table debout',
    danceFloorView: 'Vue sur la piste',
    seatedTable: 'Table assise',
    dedicatedService: 'Service dédié',
    bestLocation: 'Meilleur emplacement',
    privatifSpace: 'Espace privatif',
    exclusiveService: 'Service exclusif',
    vipLounge: 'Accès VIP lounge',
    vipSpaceAccess: 'Accès espace VIP',
    largerSpace: 'Plus grand espace',
    priorityEntry: 'Entrée prioritaire',
    luxuryTable: 'Table luxe avec banquette',
    vipDedicatedService: 'Service VIP dédié',
    privateExclusive: 'Espace privé exclusif',
    butlerService: 'Service VIP dédié',
    numberOfPeople: 'Nombre de personnes',
    bottlePreferencesOptional: 'Préférences bouteilles (optionnel)',
    bottlePreferencesPlaceholder: 'Ex: Vodka Grey Goose, Champagne Moët...',
    specialRequestsOptional: 'Demandes spéciales (optionnel)',
    specialRequestsPlaceholder: 'Anniversaire, demande particulière...',
    room: 'Salle',
    table: 'Table',
    capacity: 'Capacité',
    price: 'Prix',
    paymentNote: 'La confirmation et le paiement se feront après validation de votre demande',
    sending: 'Envoi en cours...',
    requestSent: 'Demande envoyée!',
    requestSuccessMessage: 'Votre demande de réservation a été reçue avec succès!',
    contactWithin24h: 'Notre équipe vous contactera sous 24h pour confirmer votre réservation.',
    great: 'Super!',
    noEventAvailable: 'Aucun événement disponible. Veuillez réessayer.',
    fillContactFields: 'Veuillez remplir tous les champs de contact',
    selectTable: 'Veuillez sélectionner une table',
    bookingError: 'Erreur lors de la réservation. Veuillez réessayer.',
    
    // Welcome page
    getStarted: 'Commencer',
    nextEventBadge: 'Prochain Event',
    alreadyHaveAccount: 'Déjà un compte?',
    sinceYears: 'Depuis 2009 • 16 Ans de Passion Latine',
    
    // Notification Preferences
    notificationPreferences: 'Préférences de Notifications',
    chooseWhatToReceive: 'Choisissez ce que vous souhaitez recevoir',
    systemNotificationSettings: 'Paramètres système des notifications',
    tapToOpenSystemSettings: 'Appuyez pour ouvrir les réglages',
    enableAll: 'Tout activer',
    disableAll: 'Tout désactiver',
    disable: 'Désactiver',
    disableAllNotifications: 'Désactiver toutes les notifications ?',
    disableAllNotificationsConfirm: 'Vous ne recevrez plus aucune notification de notre part.',
    allNotificationsEnabled: 'Toutes les notifications sont activées !',
    pushNotifications: 'Notifications Push',
    enablePushNotifications: 'Activer les notifications',
    enablePushNotificationsDesc: 'Recevez des alertes sur votre téléphone',
    newEvents: 'Nouveaux événements',
    newEventsDesc: 'Soyez informé des prochaines soirées',
    eventReminders: 'Rappels d\'événements',
    eventRemindersDesc: 'Rappel 24h avant chaque événement',
    promotionsAndOffers: 'Promotions & Offres',
    promotions: 'Promotions',
    promotionsDesc: 'Offres exclusives et codes promo',
    invasionCoinsNotif: 'Alertes Invasion Coins',
    invasionCoinsNotifDesc: 'Quand vous gagnez des points',
    djUpdates: 'Actualités DJs',
    djUpdatesDesc: 'Nouveaux DJs et line-ups',
    newsletterEmail: 'Newsletter par email',
    newsletterEmailDesc: 'Actualités mensuelles par email',
    notificationPrivacyNotice: 'Vos préférences sont sauvegardées et respectées. Vous pouvez les modifier à tout moment. Consultez notre politique de confidentialité pour plus d\'informations.',
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
    voteRegistered: 'Vote registered! 👍',
    fillAllFields: 'Please fill in all fields',
    
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
    loginSubtitle: 'Sign in to continue the party',
    enterPassword: 'Enter your password',
    or: 'or',
    
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
    
    // Quick Actions
    djRequests: 'DJ Requests',
    voteForSongs: 'Vote for songs',
    photos: 'Photos',
    eventGalleries: 'Event galleries',
    aftermovies: 'Aftermovies',
    watchRecap: 'Watch recap',
    booking: 'Booking',
    tables: 'VIP Tables',
    socialNetworks: 'Social Networks',
    spotifyPlaylist: 'Spotify Playlist',
    
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
    djsDescription: 'Reggaeton • Dembow • Latin House',
    askForSong: 'Request a song',
    playYourFavorite: 'Play your favorite track!',
    ourResidentDjs: 'Our Resident DJs',
    djsInfoText: 'Discover our resident DJs who ignite the dance floor at every event',
    followOnInstagram: 'Follow on Instagram',
    masterOfCeremonies: 'Master of Ceremonies',
    whatSongWant: 'What song do you want to hear?',
    residentDj: 'Resident DJ',
    partyLover: 'Party Lover',
    testModeActive: '🔧 Test Mode Active',
    readyToRequest: '✅ Ready to request',
    bypassGeofencing: 'Bypass geofencing & schedules',
    sendTheRequest: 'Send request',
    requestSentSuccess: 'Request sent!',
    songAddedToList: 'Your song was added to the list. The DJ will play it if possible!',
    recentHistory: 'Recent history',
    coins: 'Coins',
    residentDj: 'Resident DJ',
    partyLover: 'Party Lover',
    testModeActive: 'Test Mode Active',
    readyToRequest: 'Ready to Request',
    bypassGeofencing: 'Bypass Geofencing',
    sendTheRequest: 'Send the Request',
    requestSentSuccess: 'Request Sent Successfully',
    recentHistory: 'Recent History',
    coins: 'Coins',
    
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
    informations: 'Information',
    ticketsSoldViaXceed: 'Tickets sold via XCEED (secure platform)',
    confirmationByEmail: 'Confirmation by email after purchase',
    qrCodeSent: 'Entry QR Code sent directly',
    refundConditions: 'Refund according to XCEED conditions',
    
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
    eventSettings: 'Event Settings',
    
    // Gallery
    gallery: 'Gallery',
    galleries: 'Galleries',
    galleriesTitle: 'Photo Galleries',
    galleriesSubtitle: 'Relive the best moments',
    loadingGalleries: 'Loading galleries...',
    noGalleryAvailable: 'No gallery available',
    photosPublishedAfterEvent: 'Photos will be published after the next event',
    viewPhotos: 'View photos',
    features: 'Features',
    hdDownload: 'HD Download',
    downloadHdPhotos: 'Download your photos in high quality',
    available: 'Available',
    socialShare: 'Social Share',
    shareOnInstagram: 'Share directly on Instagram, etc.',
    reliveTheBestMoments: 'Relive the best moments',
    photos: 'Photos',
    videos: 'Videos',
    aftermovies: 'Aftermovies',
    aftermoviesTitle: 'Aftermovies',
    aftermoviesSubtitle: 'Rewatch the best parties',
    latestVideo: 'Latest video',
    allVideos: 'All videos',
    loadingVideos: 'Loading videos...',
    noVideoAvailable: 'No video available',
    aftermoviesComingSoon: 'Aftermovies coming soon!',
    stayConnected: 'Stay connected!',
    followUsForAftermovies: 'Follow us on social media to never miss an aftermovie',
    views: 'views',
    rewatchBestParties: 'Rewatch the best parties',
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
    
    // Success/Error messages
    voteRegistered: 'Vote registered!',
    fillAllFields: 'Please fill in all required fields',
    
    // Register/Forms
    joinInvasionLatina: 'Join Invasion Latina',
    createAccountSubtitle: 'Create your account and get ready to party',
    fullName: 'Full name',
    phoneNumber: 'Phone number',
    confirmPassword: 'Confirm password',
    minCharacters: 'Min. 6 characters',
    repeatPassword: 'Repeat your password',
    acceptTerms: 'I accept the',
    termsAndConditions: 'terms and conditions',
    privacyPolicy: 'privacy policy',
    marketingConsent: 'I agree to receive information about events, promotions and news from Invasion Latina by email and/or SMS',
    requiredFields: 'Required fields',
    appLanguage: 'App language',
    createMyAccount: 'Create my account',
    alreadyAccount: 'Already have an account?',
    passwordsDontMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    mustAcceptTerms: 'You must accept the terms and conditions',
    registrationFailed: 'Registration failed',
    
    // Admin Bookings
    tableReservations: 'Table Reservations',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    all: 'All',
    revenue: 'Revenue',
    clearAllBookings: 'Clear all reservations',
    deleteBooking: 'Delete this reservation?',
    cancelBooking: 'Cancel this reservation?',
    bookingOf: 'Reservation of',
    irreversibleAction: 'This action is irreversible!',
    clearAll: 'Clear all',
    people: 'people',
    reservedOn: 'Reserved on',
    
    // Admin DJ Dashboard
    manageRequestsRealtime: 'Manage requests in real time',
    total: 'Total',
    played: 'Played',
    rejected: 'Rejected',
    requestsSortedByVotes: 'Requests are sorted by votes.',
    autoRefresh10s: 'Auto-refresh every 10s.',
    clearAllRequests: 'Clear all requests',
    allRequests: 'All requests',
    pendingRequests: 'Pending requests',
    playedSongs: 'Played songs',
    rejectedRequests: 'Rejected requests',
    noRequestsInCategory: 'No requests in this category',
    whyReject: 'Why reject?',
    markAsPlayed: 'Mark as played',
    rejectRequest: 'Reject request',
    deleteRequest: 'Delete permanently',
    legend: 'Legend',
    markAsPlayedLegend: 'Mark as played',
    rejectRequestLegend: 'Reject request',
    deleteForeverLegend: 'Delete permanently',
    
    // Reject reasons
    notAppropriate: 'Not appropriate for the party',
    alreadyPlayedTonight: 'Already played tonight',
    nextTime: 'It will be for next time!',
    notInLibrary: 'Not in our library',
    wrongStyle: 'Does not match the style',
    tooSlow: 'Too slow for now',
    explicitContent: 'Content too explicit',
    technicalIssue: 'Technical issue',
    
    // Scanner
    loyaltyScannerTitle: 'Loyalty Scanner',
    scanClientQR: 'Scan the client\'s QR code',
    cameraAccessRequired: 'Camera Access Required',
    cameraAccessDescription: 'To scan loyalty QR codes, camera access is required.',
    allowCamera: 'Allow Camera',
    placeQRInFrame: 'Place the QR code in the frame',
    verifying: 'Verifying...',
    clientShowsQR: 'Client shows their QR code from the app',
    autoCredited: '+5 Invasion Coins automatically credited',
    checkinSuccess: 'Check-in Successful!',
    checkinError: 'Error',
    checkinFailed: 'Check-in failed',
    continueScanning: 'Continue Scanning',
    totalPoints: 'Total',
    
    // Booking/VIP Tables - Room descriptions
    bookingTitle: 'Table Booking',
    mainRoom: 'Main Room',
    mainRoomDesc: 'In the heart of the action, guaranteed atmosphere!',
    classyRoom: 'Classy Room',
    classyRoomDesc: 'Elegance in a more intimate atmosphere',
    vipRoom: 'VIP',
    vipRoomDesc: 'The ultimate in luxury and exclusivity',
    tableHaute: 'Standing Table',
    tableAssise: 'Seated Table',
    tablePremium: 'Premium Table',
    tablePresidentielle: 'Presidential Table',
    standingTable: 'Standing table',
    danceFloorView: 'Dance floor view',
    seatedTable: 'Seated table',
    dedicatedService: 'Dedicated service',
    bestLocation: 'Best location',
    privatifSpace: 'Private space',
    exclusiveService: 'Exclusive service',
    vipLounge: 'VIP lounge access',
    vipSpaceAccess: 'VIP space access',
    largerSpace: 'Larger space',
    priorityEntry: 'Priority entry',
    luxuryTable: 'Luxury table with booth',
    vipDedicatedService: 'Dedicated VIP service',
    privateExclusive: 'Exclusive private space',
    butlerService: 'Dedicated VIP service',
    numberOfPeople: 'Number of people',
    bottlePreferencesOptional: 'Bottle preferences (optional)',
    bottlePreferencesPlaceholder: 'Ex: Vodka Grey Goose, Moët Champagne...',
    specialRequestsOptional: 'Special requests (optional)',
    specialRequestsPlaceholder: 'Birthday, special request...',
    room: 'Room',
    table: 'Table',
    capacity: 'Capacity',
    price: 'Price',
    paymentNote: 'Confirmation and payment will be made after validation of your request',
    sending: 'Sending...',
    requestSent: 'Request sent!',
    requestSuccessMessage: 'Your booking request has been successfully received!',
    contactWithin24h: 'Our team will contact you within 24 hours to confirm your reservation.',
    great: 'Great!',
    noEventAvailable: 'No event available. Please try again.',
    fillContactFields: 'Please fill in all contact fields',
    selectTable: 'Please select a table',
    bookingError: 'Error during booking. Please try again.',
    
    // Welcome page
    getStarted: 'Get Started',
    nextEventBadge: 'Next Event',
    alreadyHaveAccount: 'Already have an account?',
    sinceYears: 'Since 2009 • 16 Years of Latin Passion',
    
    // Notification Preferences
    notificationPreferences: 'Notification Preferences',
    chooseWhatToReceive: 'Choose what you want to receive',
    systemNotificationSettings: 'System notification settings',
    tapToOpenSystemSettings: 'Tap to open settings',
    enableAll: 'Enable all',
    disableAll: 'Disable all',
    disable: 'Disable',
    disableAllNotifications: 'Disable all notifications?',
    disableAllNotificationsConfirm: 'You will no longer receive any notifications from us.',
    allNotificationsEnabled: 'All notifications are enabled!',
    pushNotifications: 'Push Notifications',
    enablePushNotifications: 'Enable notifications',
    enablePushNotificationsDesc: 'Receive alerts on your phone',
    newEvents: 'New events',
    newEventsDesc: 'Be informed about upcoming parties',
    eventReminders: 'Event reminders',
    eventRemindersDesc: 'Reminder 24h before each event',
    promotionsAndOffers: 'Promotions & Offers',
    promotions: 'Promotions',
    promotionsDesc: 'Exclusive offers and promo codes',
    invasionCoinsNotif: 'Invasion Coins alerts',
    invasionCoinsNotifDesc: 'When you earn points',
    djUpdates: 'DJ news',
    djUpdatesDesc: 'New DJs and line-ups',
    newsletterEmail: 'Email newsletter',
    newsletterEmailDesc: 'Monthly news by email',
    notificationPrivacyNotice: 'Your preferences are saved and respected. You can change them at any time. See our privacy policy for more information.',
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
    voteRegistered: '¡Voto registrado! 👍',
    fillAllFields: 'Por favor rellena todos los campos',
    
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
    loginSubtitle: 'Inicia sesión para continuar la fiesta',
    enterPassword: 'Ingresa tu contraseña',
    or: 'o',
    
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
    
    // Quick Actions
    djRequests: 'Peticiones DJ',
    voteForSongs: 'Vota por canciones',
    photos: 'Fotos',
    eventGalleries: 'Galerías de eventos',
    aftermovies: 'Aftermovies',
    watchRecap: 'Ver resúmenes',
    booking: 'Reservas',
    tables: 'Mesas VIP',
    socialNetworks: 'Redes Sociales',
    spotifyPlaylist: 'Playlist Spotify',
    
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
    djsDescription: 'Reggaeton • Dembow • Latin House',
    askForSong: 'Pedir una canción',
    playYourFavorite: '¡Haz sonar tu tema favorito!',
    ourResidentDjs: 'Nuestros DJs Residentes',
    djsInfoText: 'Descubre nuestros DJs residentes que encienden la pista en cada evento',
    followOnInstagram: 'Seguir en Instagram',
    masterOfCeremonies: 'Maestro de Ceremonias',
    whatSongWant: '¿Qué canción quieres escuchar?',
    residentDj: 'DJ Residente',
    partyLover: 'Amante de la Fiesta',
    testModeActive: '🔧 Modo Prueba Activo',
    readyToRequest: '✅ Listo para pedir',
    bypassGeofencing: 'Bypass geofencing y horarios',
    sendTheRequest: 'Enviar solicitud',
    requestSentSuccess: '¡Solicitud enviada!',
    songAddedToList: '¡Tu canción fue añadida a la lista. El DJ la pondrá si es posible!',
    recentHistory: 'Historial reciente',
    coins: 'Monedas',
    residentDj: 'DJ Residente',
    partyLover: 'Amante de la Fiesta',
    testModeActive: 'Modo Prueba Activo',
    readyToRequest: 'Listo para Pedir',
    bypassGeofencing: 'Omitir Geolocalización',
    sendTheRequest: 'Enviar la Solicitud',
    requestSentSuccess: 'Solicitud Enviada con Éxito',
    recentHistory: 'Historial Reciente',
    coins: 'Monedas',
    
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
    informations: 'Información',
    ticketsSoldViaXceed: 'Entradas vendidas a través de XCEED (plataforma segura)',
    confirmationByEmail: 'Confirmación por email después de la compra',
    qrCodeSent: 'Código QR de entrada enviado directamente',
    refundConditions: 'Reembolso según condiciones de XCEED',
    
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
    eventSettings: 'Configuración Evento',
    
    // Gallery
    gallery: 'Galería',
    galleries: 'Galerías',
    galleriesTitle: 'Galerías de Fotos',
    galleriesSubtitle: 'Revive los mejores momentos',
    loadingGalleries: 'Cargando galerías...',
    noGalleryAvailable: 'No hay galería disponible',
    photosPublishedAfterEvent: 'Las fotos se publicarán después del próximo evento',
    viewPhotos: 'Ver fotos',
    features: 'Características',
    hdDownload: 'Descarga HD',
    downloadHdPhotos: 'Descarga tus fotos en alta calidad',
    available: 'Disponible',
    socialShare: 'Compartir Social',
    shareOnInstagram: 'Comparte directamente en Instagram, etc.',
    reliveTheBestMoments: 'Revive los mejores momentos',
    photos: 'Fotos',
    videos: 'Videos',
    aftermovies: 'Aftermovies',
    aftermoviesTitle: 'Aftermovies',
    aftermoviesSubtitle: 'Revive las mejores fiestas',
    latestVideo: 'Último video',
    allVideos: 'Todos los videos',
    loadingVideos: 'Cargando videos...',
    noVideoAvailable: 'No hay video disponible',
    aftermoviesComingSoon: '¡Los aftermovies se publicarán pronto!',
    stayConnected: '¡Mantente conectado!',
    followUsForAftermovies: 'Síguenos en redes para no perderte ningún aftermovie',
    views: 'vistas',
    rewatchBestParties: 'Revive las mejores fiestas',
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
    
    // Success/Error messages
    voteRegistered: '¡Voto registrado!',
    fillAllFields: 'Por favor completa todos los campos obligatorios',
    
    // Register/Forms
    joinInvasionLatina: 'Únete a Invasion Latina',
    createAccountSubtitle: 'Crea tu cuenta y prepárate para la fiesta',
    fullName: 'Nombre completo',
    phoneNumber: 'Número de teléfono',
    confirmPassword: 'Confirmar contraseña',
    minCharacters: 'Mín. 6 caracteres',
    repeatPassword: 'Repite tu contraseña',
    acceptTerms: 'Acepto los',
    termsAndConditions: 'términos y condiciones',
    privacyPolicy: 'política de privacidad',
    marketingConsent: 'Acepto recibir información sobre eventos, promociones y novedades de Invasion Latina por email y/o SMS',
    requiredFields: 'Campos obligatorios',
    appLanguage: 'Idioma de la app',
    createMyAccount: 'Crear mi cuenta',
    alreadyAccount: '¿Ya tienes cuenta?',
    passwordsDontMatch: 'Las contraseñas no coinciden',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    mustAcceptTerms: 'Debes aceptar los términos y condiciones',
    registrationFailed: 'Registro fallido',
    
    // Admin Bookings
    tableReservations: 'Reservas de Mesas',
    pending: 'Pendientes',
    confirmed: 'Confirmadas',
    cancelled: 'Canceladas',
    all: 'Todas',
    revenue: 'Ingresos',
    clearAllBookings: 'Borrar todas las reservas',
    deleteBooking: '¿Eliminar esta reserva?',
    cancelBooking: '¿Cancelar esta reserva?',
    bookingOf: 'Reserva de',
    irreversibleAction: '¡Esta acción es irreversible!',
    clearAll: 'Borrar todo',
    people: 'personas',
    reservedOn: 'Reservado el',
    
    // Admin DJ Dashboard
    manageRequestsRealtime: 'Gestiona las solicitudes en tiempo real',
    total: 'Total',
    played: 'Tocados',
    rejected: 'Rechazados',
    requestsSortedByVotes: 'Las solicitudes están ordenadas por votos.',
    autoRefresh10s: 'Actualización automática cada 10s.',
    clearAllRequests: 'Borrar todas las solicitudes',
    allRequests: 'Todas las solicitudes',
    pendingRequests: 'Solicitudes pendientes',
    playedSongs: 'Canciones tocadas',
    rejectedRequests: 'Solicitudes rechazadas',
    noRequestsInCategory: 'No hay solicitudes en esta categoría',
    whyReject: '¿Por qué rechazar?',
    markAsPlayed: 'Marcar como tocada',
    rejectRequest: 'Rechazar solicitud',
    deleteRequest: 'Eliminar permanentemente',
    legend: 'Leyenda',
    markAsPlayedLegend: 'Marcar como tocada',
    rejectRequestLegend: 'Rechazar solicitud',
    deleteForeverLegend: 'Eliminar permanentemente',
    
    // Reject reasons
    notAppropriate: 'No apropiado para la fiesta',
    alreadyPlayedTonight: 'Ya tocada esta noche',
    nextTime: '¡Será para la próxima!',
    notInLibrary: 'No está en nuestra biblioteca',
    wrongStyle: 'No corresponde al estilo',
    tooSlow: 'Muy lenta para el momento',
    explicitContent: 'Contenido muy explícito',
    technicalIssue: 'Problema técnico',
    
    // Scanner
    loyaltyScannerTitle: 'Escáner de Fidelidad',
    scanClientQR: 'Escanea el código QR del cliente',
    cameraAccessRequired: 'Acceso a Cámara Requerido',
    cameraAccessDescription: 'Para escanear códigos QR de fidelidad, se necesita acceso a la cámara.',
    allowCamera: 'Permitir Cámara',
    placeQRInFrame: 'Coloca el código QR en el marco',
    verifying: 'Verificando...',
    clientShowsQR: 'El cliente muestra su código QR desde la app',
    autoCredited: '+5 Invasion Coins acreditados automáticamente',
    checkinSuccess: '¡Check-in Exitoso!',
    checkinError: 'Error',
    checkinFailed: 'Check-in fallido',
    continueScanning: 'Continuar Escaneando',
    totalPoints: 'Total',
    
    // Booking/VIP Tables - Room descriptions
    bookingTitle: 'Reserva de Mesas',
    mainRoom: 'Main Room',
    mainRoomDesc: '¡En el corazón de la acción, ambiente garantizado!',
    classyRoom: 'Classy Room',
    classyRoomDesc: 'Elegancia en un ambiente más íntimo',
    vipRoom: 'VIP',
    vipRoomDesc: 'Lo máximo en lujo y exclusividad',
    tableHaute: 'Mesa Alta',
    tableAssise: 'Mesa con Asientos',
    tablePremium: 'Mesa Premium',
    tablePresidentielle: 'Mesa Presidencial',
    standingTable: 'Mesa de pie',
    danceFloorView: 'Vista a la pista',
    seatedTable: 'Mesa con asientos',
    dedicatedService: 'Servicio dedicado',
    bestLocation: 'Mejor ubicación',
    privatifSpace: 'Espacio privado',
    exclusiveService: 'Servicio exclusivo',
    vipLounge: 'Acceso al lounge VIP',
    vipSpaceAccess: 'Acceso espacio VIP',
    largerSpace: 'Espacio más grande',
    priorityEntry: 'Entrada prioritaria',
    luxuryTable: 'Mesa de lujo con banqueta',
    vipDedicatedService: 'Servicio VIP dedicado',
    privateExclusive: 'Espacio privado exclusivo',
    butlerService: 'Servicio VIP dedicado',
    numberOfPeople: 'Número de personas',
    bottlePreferencesOptional: 'Preferencias de botellas (opcional)',
    bottlePreferencesPlaceholder: 'Ej: Vodka Grey Goose, Champagne Moët...',
    specialRequestsOptional: 'Solicitudes especiales (opcional)',
    specialRequestsPlaceholder: 'Cumpleaños, solicitud especial...',
    room: 'Sala',
    table: 'Mesa',
    capacity: 'Capacidad',
    price: 'Precio',
    paymentNote: 'La confirmación y el pago se realizarán después de validar su solicitud',
    sending: 'Enviando...',
    requestSent: '¡Solicitud enviada!',
    requestSuccessMessage: '¡Su solicitud de reserva ha sido recibida con éxito!',
    contactWithin24h: 'Nuestro equipo le contactará en un plazo de 24 horas para confirmar su reserva.',
    great: '¡Genial!',
    noEventAvailable: 'No hay evento disponible. Por favor, inténtelo de nuevo.',
    fillContactFields: 'Por favor complete todos los campos de contacto',
    selectTable: 'Por favor seleccione una mesa',
    bookingError: 'Error durante la reserva. Por favor, inténtelo de nuevo.',
    
    // Welcome page
    getStarted: 'Empezar',
    nextEventBadge: 'Próximo Evento',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    sinceYears: 'Desde 2009 • 16 Años de Pasión Latina',
    
    // Notification Preferences
    notificationPreferences: 'Preferencias de Notificaciones',
    chooseWhatToReceive: 'Elige lo que quieres recibir',
    systemNotificationSettings: 'Configuración del sistema',
    tapToOpenSystemSettings: 'Toca para abrir los ajustes',
    enableAll: 'Activar todo',
    disableAll: 'Desactivar todo',
    disable: 'Desactivar',
    disableAllNotifications: '¿Desactivar todas las notificaciones?',
    disableAllNotificationsConfirm: 'Ya no recibirás ninguna notificación nuestra.',
    allNotificationsEnabled: '¡Todas las notificaciones están activadas!',
    pushNotifications: 'Notificaciones Push',
    enablePushNotifications: 'Activar notificaciones',
    enablePushNotificationsDesc: 'Recibe alertas en tu teléfono',
    newEvents: 'Nuevos eventos',
    newEventsDesc: 'Sé informado de las próximas fiestas',
    eventReminders: 'Recordatorios de eventos',
    eventRemindersDesc: 'Recordatorio 24h antes de cada evento',
    promotionsAndOffers: 'Promociones y Ofertas',
    promotions: 'Promociones',
    promotionsDesc: 'Ofertas exclusivas y códigos promocionales',
    invasionCoinsNotif: 'Alertas Invasion Coins',
    invasionCoinsNotifDesc: 'Cuando ganas puntos',
    djUpdates: 'Noticias de DJs',
    djUpdatesDesc: 'Nuevos DJs y line-ups',
    newsletterEmail: 'Newsletter por email',
    newsletterEmailDesc: 'Noticias mensuales por email',
    notificationPrivacyNotice: 'Tus preferencias se guardan y respetan. Puedes cambiarlas en cualquier momento. Consulta nuestra política de privacidad para más información.',
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
    voteRegistered: 'Stem geregistreerd! 👍',
    fillAllFields: 'Vul alle velden in',
    
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
    loginSubtitle: 'Log in om het feest voort te zetten',
    enterPassword: 'Voer je wachtwoord in',
    or: 'of',
    
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
    
    // Quick Actions
    djRequests: 'DJ Verzoeken',
    voteForSongs: 'Stem op nummers',
    photos: 'Foto\'s',
    eventGalleries: 'Evenement galerijen',
    aftermovies: 'Aftermovies',
    watchRecap: 'Bekijk samenvattingen',
    booking: 'Reservering',
    tables: 'VIP Tafels',
    socialNetworks: 'Sociale Netwerken',
    spotifyPlaylist: 'Spotify Playlist',
    
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
    djsDescription: 'Reggaeton • Dembow • Latin House',
    askForSong: 'Vraag een nummer aan',
    playYourFavorite: 'Laat je favoriete nummer draaien!',
    ourResidentDjs: 'Onze Resident DJs',
    djsInfoText: 'Ontdek onze resident DJs die de dansvloer doen ontbranden bij elk evenement',
    followOnInstagram: 'Volgen op Instagram',
    masterOfCeremonies: 'Ceremoniemeester',
    whatSongWant: 'Welk nummer wil je horen?',
    residentDj: 'Resident DJ',
    partyLover: 'Feestliefhebber',
    testModeActive: '🔧 Testmodus Actief',
    readyToRequest: '✅ Klaar om aan te vragen',
    bypassGeofencing: 'Bypass geofencing & schema\'s',
    sendTheRequest: 'Verzoek verzenden',
    requestSentSuccess: 'Verzoek verzonden!',
    songAddedToList: 'Je nummer is toegevoegd aan de lijst. De DJ zal het draaien indien mogelijk!',
    recentHistory: 'Recente geschiedenis',
    coins: 'Munten',
    residentDj: 'Resident DJ',
    partyLover: 'Feestliefhebber',
    testModeActive: 'Testmodus Actief',
    readyToRequest: 'Klaar om te Verzoeken',
    bypassGeofencing: 'Geolocatie Omzeilen',
    sendTheRequest: 'Het Verzoek Verzenden',
    requestSentSuccess: 'Verzoek Succesvol Verzonden',
    recentHistory: 'Recente Geschiedenis',
    coins: 'Munten',
    
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
    informations: 'Informatie',
    ticketsSoldViaXceed: 'Tickets verkocht via XCEED (beveiligd platform)',
    confirmationByEmail: 'Bevestiging per e-mail na aankoop',
    qrCodeSent: 'Toegangs-QR-code direct verzonden',
    refundConditions: 'Terugbetaling volgens XCEED voorwaarden',
    
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
    eventSettings: 'Evenement Instellingen',
    
    // Gallery
    gallery: 'Galerij',
    galleries: 'Galerijen',
    galleriesTitle: 'Fotogalerijen',
    galleriesSubtitle: 'Herbeleef de beste momenten',
    loadingGalleries: 'Galerijen laden...',
    noGalleryAvailable: 'Geen galerij beschikbaar',
    photosPublishedAfterEvent: 'Foto\'s worden gepubliceerd na het volgende evenement',
    viewPhotos: 'Foto\'s bekijken',
    features: 'Functies',
    hdDownload: 'HD Download',
    downloadHdPhotos: 'Download je foto\'s in hoge kwaliteit',
    available: 'Beschikbaar',
    socialShare: 'Sociaal Delen',
    shareOnInstagram: 'Deel direct op Instagram, enz.',
    reliveTheBestMoments: 'Herbeleef de beste momenten',
    photos: 'Foto\'s',
    videos: 'Video\'s',
    aftermovies: 'Aftermovies',
    aftermoviesTitle: 'Aftermovies',
    aftermoviesSubtitle: 'Herbekijk de beste feesten',
    latestVideo: 'Laatste video',
    allVideos: 'Alle video\'s',
    loadingVideos: 'Video\'s laden...',
    noVideoAvailable: 'Geen video beschikbaar',
    aftermoviesComingSoon: 'Aftermovies komen binnenkort!',
    stayConnected: 'Blijf verbonden!',
    followUsForAftermovies: 'Volg ons op social media om geen aftermovie te missen',
    views: 'weergaven',
    rewatchBestParties: 'Herbekijk de beste feesten',
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
    
    // Success/Error messages
    voteRegistered: 'Stem geregistreerd!',
    fillAllFields: 'Vul alle verplichte velden in',
    
    // Register/Forms
    joinInvasionLatina: 'Word lid van Invasion Latina',
    createAccountSubtitle: 'Maak je account aan en bereid je voor op feesten',
    fullName: 'Volledige naam',
    phoneNumber: 'Telefoonnummer',
    confirmPassword: 'Bevestig wachtwoord',
    minCharacters: 'Min. 6 tekens',
    repeatPassword: 'Herhaal je wachtwoord',
    acceptTerms: 'Ik accepteer de',
    termsAndConditions: 'algemene voorwaarden',
    privacyPolicy: 'privacybeleid',
    marketingConsent: 'Ik ga akkoord met het ontvangen van informatie over evenementen, promoties en nieuws van Invasion Latina via e-mail en/of SMS',
    requiredFields: 'Verplichte velden',
    appLanguage: 'App-taal',
    createMyAccount: 'Mijn account aanmaken',
    alreadyAccount: 'Al een account?',
    passwordsDontMatch: 'Wachtwoorden komen niet overeen',
    passwordTooShort: 'Wachtwoord moet minimaal 6 tekens bevatten',
    mustAcceptTerms: 'Je moet de voorwaarden accepteren',
    registrationFailed: 'Registratie mislukt',
    
    // Admin Bookings
    tableReservations: 'Tafelreserveringen',
    pending: 'In afwachting',
    confirmed: 'Bevestigd',
    cancelled: 'Geannuleerd',
    all: 'Alle',
    revenue: 'Omzet',
    clearAllBookings: 'Alle reserveringen verwijderen',
    deleteBooking: 'Deze reservering verwijderen?',
    cancelBooking: 'Deze reservering annuleren?',
    bookingOf: 'Reservering van',
    irreversibleAction: 'Deze actie is onomkeerbaar!',
    clearAll: 'Alles wissen',
    people: 'personen',
    reservedOn: 'Gereserveerd op',
    
    // Admin DJ Dashboard
    manageRequestsRealtime: 'Beheer verzoeken in realtime',
    total: 'Totaal',
    played: 'Gespeeld',
    rejected: 'Afgewezen',
    requestsSortedByVotes: 'Verzoeken worden gesorteerd op stemmen.',
    autoRefresh10s: 'Auto-refresh elke 10s.',
    clearAllRequests: 'Alle verzoeken verwijderen',
    allRequests: 'Alle verzoeken',
    pendingRequests: 'Verzoeken in afwachting',
    playedSongs: 'Gespeelde nummers',
    rejectedRequests: 'Afgewezen verzoeken',
    noRequestsInCategory: 'Geen verzoeken in deze categorie',
    whyReject: 'Waarom afwijzen?',
    markAsPlayed: 'Markeren als gespeeld',
    rejectRequest: 'Verzoek afwijzen',
    deleteRequest: 'Permanent verwijderen',
    legend: 'Legenda',
    markAsPlayedLegend: 'Markeren als gespeeld',
    rejectRequestLegend: 'Verzoek afwijzen',
    deleteForeverLegend: 'Permanent verwijderen',
    
    // Reject reasons
    notAppropriate: 'Niet geschikt voor het feest',
    alreadyPlayedTonight: 'Vanavond al gespeeld',
    nextTime: 'Dat wordt voor de volgende keer!',
    notInLibrary: 'Niet in onze bibliotheek',
    wrongStyle: 'Past niet bij de stijl',
    tooSlow: 'Te langzaam op dit moment',
    explicitContent: 'Inhoud te expliciet',
    technicalIssue: 'Technisch probleem',
    
    // Scanner
    loyaltyScannerTitle: 'Loyaliteitsscanner',
    scanClientQR: 'Scan de QR-code van de klant',
    cameraAccessRequired: 'Cameratoegang Vereist',
    cameraAccessDescription: 'Om loyaliteits-QR-codes te scannen, is cameratoegang nodig.',
    allowCamera: 'Camera Toestaan',
    placeQRInFrame: 'Plaats de QR-code in het kader',
    verifying: 'Verifiëren...',
    clientShowsQR: 'Klant toont zijn QR-code vanuit de app',
    autoCredited: '+5 Invasion Coins automatisch bijgeschreven',
    checkinSuccess: 'Check-in Succesvol!',
    checkinError: 'Fout',
    checkinFailed: 'Check-in mislukt',
    continueScanning: 'Doorgaan met Scannen',
    totalPoints: 'Totaal',
    
    // Booking/VIP Tables - Room descriptions
    bookingTitle: 'Tafelreservering',
    mainRoom: 'Main Room',
    mainRoomDesc: 'In het hart van de actie, gegarandeerde sfeer!',
    classyRoom: 'Classy Room',
    classyRoomDesc: 'Elegantie in een meer intieme sfeer',
    vipRoom: 'VIP',
    vipRoomDesc: 'Het ultieme in luxe en exclusiviteit',
    tableHaute: 'Staantafel',
    tableAssise: 'Zittafel',
    tablePremium: 'Premium Tafel',
    tablePresidentielle: 'Presidentiële Tafel',
    standingTable: 'Staantafel',
    danceFloorView: 'Uitzicht op de dansvloer',
    seatedTable: 'Zittafel',
    dedicatedService: 'Toegewijde service',
    bestLocation: 'Beste locatie',
    privatifSpace: 'Privéruimte',
    exclusiveService: 'Exclusieve service',
    vipLounge: 'Toegang tot VIP lounge',
    vipSpaceAccess: 'Toegang tot VIP ruimte',
    largerSpace: 'Grotere ruimte',
    priorityEntry: 'Prioritaire toegang',
    luxuryTable: 'Luxe tafel met bank',
    vipDedicatedService: 'Toegewijde VIP service',
    privateExclusive: 'Exclusieve privéruimte',
    butlerService: 'Toegewijde VIP service',
    numberOfPeople: 'Aantal personen',
    bottlePreferencesOptional: 'Flesvoorkeuren (optioneel)',
    bottlePreferencesPlaceholder: 'Bijv: Vodka Grey Goose, Moët Champagne...',
    specialRequestsOptional: 'Speciale verzoeken (optioneel)',
    specialRequestsPlaceholder: 'Verjaardag, speciaal verzoek...',
    room: 'Zaal',
    table: 'Tafel',
    capacity: 'Capaciteit',
    price: 'Prijs',
    paymentNote: 'Bevestiging en betaling worden gedaan na validatie van uw aanvraag',
    sending: 'Verzenden...',
    requestSent: 'Aanvraag verzonden!',
    requestSuccessMessage: 'Uw boekingsaanvraag is succesvol ontvangen!',
    contactWithin24h: 'Ons team neemt binnen 24 uur contact met u op om uw reservering te bevestigen.',
    great: 'Geweldig!',
    noEventAvailable: 'Geen evenement beschikbaar. Probeer het opnieuw.',
    fillContactFields: 'Vul alle contactvelden in',
    selectTable: 'Selecteer een tafel',
    bookingError: 'Fout bij reservering. Probeer het opnieuw.',
    
    // Welcome page
    getStarted: 'Beginnen',
    nextEventBadge: 'Volgend Evenement',
    alreadyHaveAccount: 'Heb je al een account?',
    sinceYears: 'Sinds 2009 • 16 Jaar Latijnse Passie',
    
    // Notification Preferences
    notificationPreferences: 'Notificatievoorkeuren',
    chooseWhatToReceive: 'Kies wat je wilt ontvangen',
    systemNotificationSettings: 'Systeemmeldingsinstellingen',
    tapToOpenSystemSettings: 'Tik om instellingen te openen',
    enableAll: 'Alles activeren',
    disableAll: 'Alles uitschakelen',
    disable: 'Uitschakelen',
    disableAllNotifications: 'Alle meldingen uitschakelen?',
    disableAllNotificationsConfirm: 'Je ontvangt geen meldingen meer van ons.',
    allNotificationsEnabled: 'Alle meldingen zijn geactiveerd!',
    pushNotifications: 'Pushmeldingen',
    enablePushNotifications: 'Meldingen activeren',
    enablePushNotificationsDesc: 'Ontvang meldingen op je telefoon',
    newEvents: 'Nieuwe evenementen',
    newEventsDesc: 'Word geïnformeerd over komende feesten',
    eventReminders: 'Evenementherinneringen',
    eventRemindersDesc: 'Herinnering 24u voor elk evenement',
    promotionsAndOffers: 'Promoties & Aanbiedingen',
    promotions: 'Promoties',
    promotionsDesc: 'Exclusieve aanbiedingen en promocodes',
    invasionCoinsNotif: 'Invasion Coins meldingen',
    invasionCoinsNotifDesc: 'Wanneer je punten verdient',
    djUpdates: 'DJ nieuws',
    djUpdatesDesc: 'Nieuwe DJs en line-ups',
    newsletterEmail: 'E-mail nieuwsbrief',
    newsletterEmailDesc: 'Maandelijks nieuws per e-mail',
    notificationPrivacyNotice: 'Je voorkeuren worden opgeslagen en gerespecteerd. Je kunt ze op elk moment wijzigen. Zie ons privacybeleid voor meer informatie.',
  },
};

export default translations;
