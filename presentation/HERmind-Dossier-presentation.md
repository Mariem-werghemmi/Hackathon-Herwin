# HERmind — dossier produit et IA

> Dossier de référence à transmettre à un agent IA chargé de créer une présentation.
> Les captures se trouvent dans `presentation/screenshots/`. Elles montrent l’interface web du prototype sur une fenêtre de 720 × 1000 px, avec des données de démonstration et l’assistant connecté désactivé. Ce ne sont pas des captures d’un téléphone physique.

## 1. HERmind en bref

**HERmind** est un prototype mobile Expo / React Native d’accompagnement destiné principalement aux étudiantes et jeunes diplômées en Tunisie. L’application réunit un espace de soutien émotionnel, des outils simples pour les études et une communauté illustrative. L’expérience privilégie l’autonomie, la confidentialité et les petites étapes, sans noter ni comparer les utilisatrices.

**Promesse produit :** offrir un espace bienveillant où une étudiante peut faire le point, parler de ce qui la préoccupe et obtenir un accompagnement adapté à son besoin — émotionnel ou lié aux études.

**Phrase de présentation possible :** « HERmind accompagne les étudiantes tunisiennes dans les hauts, les bas et les défis des études, avec des outils de soutien et un compagnon IA facultatif. »

## 2. Parcours principal

1. L’utilisatrice découvre HERmind et complète un accueil en cinq étapes : présentation, langue, sujets qui l’amènent, style de soutien préféré et pseudonyme.
2. Sur l’accueil, elle peut faire un check-in d’humeur, ouvrir son espace Compagnon, A7kili, Réussite ou son planning.
3. Elle choisit de garder ses notes et préférences sur son appareil, ou d’activer séparément l’assistant connecté.
4. Si le chat connecté est activé et que le serveur est configuré, son message passe par le serveur HERmind vers le modèle Groq sélectionné.
5. Elle garde le contrôle de l’historique serveur : il est désactivé par défaut, nécessite un consentement séparé et peut être effacé.

## 3. Fonctionnalités visibles

| Espace | Fonction | Ce qui fonctionne dans le prototype | À ne pas présenter comme déjà disponible |
|---|---|---|---|
| Accueil | Check-in d’humeur, accès rapide au Compagnon, A7kili, Réussite, planning et parcours | Enregistrement local de l’humeur et navigation | Les graphiques ou événements explicitement marqués « démo » ne sont pas des prédictions |
| Ton moment à toi | Écrire ce qui préoccupe l’utilisatrice, identifier une émotion et enregistrer une note après confirmation | Le « reflet » est calculé localement par des règles/mots-clés et l’utilisatrice peut le corriger | Ce n’est pas une analyse Groq, une lecture clinique ou une analyse fiable des émotions ; le bouton micro de cet écran est une maquette |
| Compagnon | Chat de soutien avec modes « Je t’écoute », « On avance », « On respire » | Réponses Groq quand le service est configuré et l’assistant connecté activé ; aucun message pré-écrit n’est utilisé pour simuler une réponse Groq | Le mode respiration n’est pas un soin médical ; les messages ne constituent pas une thérapie |
| A7kili | Écoute d’un problème et recommandations de recherche de podcast et de musique | Groq génère les sections d’écoute, podcast et musique ; les deux dernières ouvrent une recherche YouTube | L’application ne vérifie pas une vidéo, ne garantit pas la pertinence des résultats et ne fournit pas de playlist médicale |
| Réussite | Plan d’étude, tuteur, quiz interactif, coach de motivation | Quatre modes Groq spécialisés ; le quiz fonctionne dans l’échange conversationnel, une question à la fois | Pas de base de cours, de recherche documentaire/RAG, d’import de fichier de cours, de rappels automatiques ni d’ajout au calendrier |
| Avatar face à face | Robot animé, réponse parlée, dictée vocale et aperçu caméra facultatif | La voix entrante est enregistrée puis transcrite par le backend Groq Whisper ; le texte va ensuite au chat Groq ; la synthèse vocale est effectuée dans l’application | La caméra fournit un aperçu local ; elle ne transmet pas une vidéo au modèle et HERmind ne « voit » pas l’utilisatrice |
| Mon planning | Calendrier à 7 ou 14 jours, ajout/modification/suppression d’événements académiques | Événements ajoutés par l’utilisatrice enregistrés localement ; exemples visuellement signalés | La courbe de charge est illustrative, pas une prévision IA |
| Ton parcours | Historique local des humeurs, notes et petites actions | Données personnelles locales, possibilité de suppression | Les exemples de parcours sont du contenu de démonstration |
| HerCircle | Cercles thématiques pour étudiantes | Cartes, rejoindre/quitter un cercle dans la démo | Les cercles et nombres de membres sont simulés ; pas de messagerie ni de communauté réellement connectée |
| Profil, Réglages, Confidentialité | Langue, préférences, assistant, consentement de l’historique, informations de confidentialité | Préférences locales ; consentements distants disponibles lorsque le backend fonctionne | Le verrouillage par code et certains réglages sont des prototypes visuels, pas des fonctions de sécurité ou de notification réelles |

## 4. Intégration IA — architecture réelle

```mermaid
flowchart LR
    A["Application Expo / React Native"] -->|"POST /users · compte anonyme"| B["API HERmind · FastAPI"]
    A -->|"POST /chat · mode, langue, message, contexte"| B
    B -->|"Prompt système dédié + derniers échanges"| C["Groq Chat Completions"]
    C -->|"Réponse générée"| B
    B -->|"Réponse du modèle"| A
    A -->|"POST /transcribe · audio authentifié"| B
    B -->|"Audio · transcription"| D["Groq Whisper"]
    D -->|"Texte transcrit"| B
    B -->|"Transcription"| A
    A -->|"Expo Speech · synthèse vocale"| E["Voix de l’appareil"]
    F["SQLite local ou PostgreSQL configuré"] -. "Historique de chat, uniquement après consentement" .-> B
```

### Chat texte

- **Application :** `services/api.ts` envoie les messages au backend avec le mode, la langue, le contexte récent et le consentement. L’app crée un compte anonyme pour authentifier les appels. Le jeton est conservé avec SecureStore sur mobile ; dans le navigateur, le stockage local n’est pas chiffré.
- **API :** `backend/app/main.py` authentifie les requêtes, construit le contexte et appelle le fournisseur de chat. La clé Groq reste côté serveur ; elle ne doit pas être placée dans l’application Expo.
- **Modèle configuré par défaut :** `qwen/qwen3.8-27b`, via l’API compatible OpenAI de Groq. Le modèle peut être remplacé par configuration serveur.
- **Prompts :** `backend/app/prompts.py` délimite HERmind aux sujets de bien-être et de vie étudiante, impose une réponse bienveillante, non clinique, et fournit les règles adaptées au mode sélectionné.
- **Modes backend :** `talk`, `act`, `relax`, `a7kili`, `study_plan`, `study_tutor`, `study_quiz`, `success_coach`.
- **Contexte :** jusqu’à 12 messages récents selon la configuration. L’historique serveur n’est utilisé et conservé que si l’utilisatrice l’active séparément ; sans ce consentement, le contexte est transmis pour la requête mais la conversation n’est pas enregistrée dans la base.

### Voix et avatar

1. L’utilisatrice autorise le micro et enregistre sa voix avec `expo-audio`.
2. L’application envoie le fichier à `POST /transcribe`, authentifié et limité à 25 Mo.
3. Le backend le transmet au modèle `whisper-large-v3-turbo`. Le fichier audio n’est pas persisté par HERmind.
4. Le texte transcrit est envoyé au chat standard Groq et la réponse peut être lue par la synthèse vocale de l’appareil (`expo-speech`).
5. La caméra est facultative. Son aperçu est destiné à l’écran de l’utilisatrice et n’est pas envoyé à Groq.

### Français, arabe et derja tunisienne

L’interface et les réglages proposent le français, la derja tunisienne et l’arabe. Pour la derja, le prompt demande de suivre l’écriture utilisée dans le dernier message : Arabizi en caractères latins, ou derja en caractères arabes. Il recommande un vocabulaire tunisien simple et déconseille les dialectes voisins et les traductions littérales. **C’est un guidage de prompt d’un modèle multilingue, pas un modèle entraîné ou certifié en derja.**

## 5. Confidentialité, sécurité et limites à annoncer

- Le chat IA connecté est **facultatif et désactivé par défaut** dans la configuration initiale montrée par les captures.
- Activer le chat envoie les messages, le pseudonyme, la langue et les thèmes au serveur HERmind puis au fournisseur Groq. Les check-ins et journaux personnels ne sont pas envoyés par le flux de chat.
- La conservation de l’historique côté serveur est un consentement distinct. Le retirer supprime l’historique enregistré ; l’utilisatrice peut aussi demander l’effacement du compte anonyme.
- Les comptes API sont anonymes : le serveur ne conserve que le hachage du jeton d’accès. Cela ne signifie pas que toute donnée est chiffrée de bout en bout.
- Les messages stockés en base sont actuellement en texte clair au niveau applicatif ; le chiffrement de transport dépend du déploiement. Utiliser uniquement des données de test tant que la protection production n’est pas en place.
- HERmind n’est ni un professionnel de santé ni un service d’urgence. L’IA ne pose pas de diagnostic. En cas de danger immédiat, la réponse doit encourager une aide humaine et des ressources locales vérifiées.
- Les réponses Groq peuvent être inexactes. Les contenus pédagogiques doivent être revérifiés par rapport aux cours officiels.
- Une clé Groq et un serveur fonctionnel sont requis pour les modes IA. Le tunnel Expo public partage **l’application de développement**, pas automatiquement le backend HERmind.
- Le backend de développement ne doit pas être exposé publiquement tel quel. Avant une diffusion réelle, prévoir déploiement HTTPS, contrôle d’accès, limites de requêtes, surveillance des coûts, migrations, sauvegardes, règles de rétention et revue sécurité/confidentialité.
- L’application Expo Go en tunnel est une démo de développement, pas une application publiée sur l’App Store ou Google Play.

## 6. Captures des écrans

Chaque image montre le haut de l’écran correspondant dans le prototype web, avec contenu de démonstration lorsqu’indiqué.

### 00 — Bienvenue

![Écran de bienvenue HERmind](screenshots/00-bienvenue.png)

### 01 — Accueil

![Accueil et raccourcis vers le soutien et la réussite](screenshots/01-accueil.png)

### 02 — Ton moment à toi

![Écriture personnelle et reflet de démonstration](screenshots/02-moment.png)

### 03 — Compagnon

![Chat de soutien et sélection des modes](screenshots/03-compagnon.png)

### 04 — Mon planning

![Planning académique et indicateurs de démonstration](screenshots/04-planning.png)

### 05 — Mon espace / profil

![Profil, langue, préférences et accès aux données](screenshots/05-profil.png)

### 06 — A7kili

![Écoute empathique et suggestions média via Groq](screenshots/06-a7kili.png)

### 07 — Réussite

![Modes IA de plan d’étude, tuteur, quiz et motivation](screenshots/07-reussite.png)

### 08 — Avatar face à face

![Robot animé, voix, micro et aperçu caméra facultatif](screenshots/08-avatar.png)

### 09 — Ton prochain pas

![Actions de soutien et exercices de démonstration](screenshots/09-petit-pas.png)

### 10 — Mon parcours

![Humeurs, notes personnelles et exemples de parcours](screenshots/10-parcours.png)

### 11 — HerCircle

![Cercles étudiants illustratifs](screenshots/11-hercircle.png)

### 12 — Réglages

![Assistant connecté, consentement de l’historique et préférences](screenshots/12-reglages.png)

### 13 — Confidentialité et aide

![Limites, traitement des données et aide](screenshots/13-confidentialite.png)

### 14 — Onboarding

![Première étape du parcours d’accueil de cinq étapes](screenshots/14-onboarding.png)

### 15 — Détail d’un cercle HerCircle

![Fil illustratif d’un cercle étudiant](screenshots/15-detail-cercle.png)

## 7. Plan de présentation conseillé

Un agent IA peut structurer une présentation de 8 à 10 diapositives ainsi :

1. **Titre et promesse** — HERmind, un espace bienveillant pour les études et le bien-être.
2. **Besoin utilisateur** — surcharge, stress des examens, soutenance, besoin d’écoute ; parler en termes de besoins, sans inventer de statistiques.
3. **Public et parcours** — étudiantes et jeunes diplômées en Tunisie, onboarding facultatif et réglages de langue.
4. **Expérience produit** — check-in, Compagnon, A7kili, planning et parcours ; montrer l’accueil.
5. **Accompagnement par IA** — expliquer les quatre modes Réussite et A7kili, sur les captures dédiées.
6. **Comment fonctionne l’IA** — mobile → API HERmind → prompt par mode → Groq → réponse ; Whisper séparé pour la transcription vocale.
7. **Langues et voix** — français, arabe et derja/Arabizi guidés par prompt ; voix et caméra facultative ; expliquer clairement que l’avatar ne voit pas l’utilisatrice.
8. **Contrôle et confidentialité** — assistant désactivable, historique serveur sur consentement séparé, données locales et limites.
9. **Prototype et transparence** — cercles et certains indicateurs sont simulés ; Ton moment utilise des mots-clés ; pas de diagnostic, pas de RAG, pas de rappels automatiques.
10. **Suite envisageable** — héberger l’API de façon sécurisée, tester l’IA avec des utilisatrices, évaluer la derja, ajouter une base de cours avec consentement et citations, construire de vrais rappels, et modérer une communauté avant toute ouverture.

## 8. Prompt prêt à transmettre à un agent IA de présentation

> Crée une présentation claire et professionnelle en français à partir de ce dossier et des captures incluses. Présente HERmind comme un prototype Expo mobile destiné aux étudiantes et jeunes diplômées en Tunisie. Utilise les captures réelles du dossier, en particulier l’accueil, Compagnon, A7kili, Réussite, Avatar, planning et confidentialité. Explique précisément le flux IA : application Expo → backend FastAPI authentifié → prompts adaptés au mode → Groq Qwen pour le chat ; Groq Whisper séparé pour transcrire l’audio ; synthèse vocale côté application. Explique que la derja est améliorée par guidage de prompt, mais qu’il ne s’agit pas d’un modèle spécialisé. Distingue toujours les fonctions connectées, les fonctions locales et les contenus de démonstration. Ne prétends pas que HERmind diagnostique, connaît les cours, utilise du RAG, garantit les résultats, vérifie les vidéos YouTube, crée des rappels automatiques, analyse la caméra ou héberge une communauté réelle. N’invente aucune statistique, aucun témoignage, aucun résultat d’étude et aucun niveau de performance. Indique les limites de confidentialité et de déploiement comme exposées dans le dossier. Propose une fin axée sur les prochaines étapes produit et sécurité, sans présenter ces idées comme déjà implémentées.

## 9. Repères techniques pour l’agent

- Frontend : Expo SDK 57, React Native, Expo Router, TypeScript.
- Routes d’écrans : `app/`, navigation par fichiers.
- État de démonstration et préférences locales : `hooks/useAppData.tsx`.
- Client API : `services/api.ts`.
- Backend : FastAPI dans `backend/app/`.
- Intégration fournisseur, modèles et erreurs : `backend/app/ai.py` et `backend/app/config.py`.
- Prompts et modes de soutien : `backend/app/prompts.py`, schéma API dans `backend/app/schemas.py`.
- Tests API et prompts : `backend/tests/test_api.py`.
- Documentation backend : `backend/README.md`.
- Les captures sont dans `presentation/screenshots/`. Le présent dossier et ces images doivent être transmis ensemble, ou emballés dans l’archive `HERmind-presentation.zip`.
