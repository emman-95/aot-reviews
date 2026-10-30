\# AOT Reviews



AOT Reviews est une application web dédiée à l'univers de \*Attack on Titan\* (\*Shingeki no Kyojin\*). Les utilisateurs peuvent parcourir les épisodes de la série, publier leurs avis et réagir à ceux des autres membres.



J'ai réalisé ce projet dans le cadre de ma formation en développement web, avec une attention particulière portée à la sécurité de l'application, car c'est le domaine dans lequel je me spécialise.



\## Fonctionnalités



\- Consulter la liste des épisodes de la série.

\- Créer un compte et se connecter.

\- Rester connecté grâce à un système de sessions.

\- Accéder à des fonctionnalités réservées aux utilisateurs connectés.

\- Publier un avis sur un épisode.

\- Liker ou disliker les avis des autres utilisateurs.



\## Technologies utilisées



| Partie | Outils |

|---|---|

| Backend | Node.js, Express.js, Prisma, SQLite |

| Frontend | HTML, CSS, JavaScript (sans framework) |

| Sécurité | Helmet, Bcrypt, Express Rate Limit, Express Session, Content Security Policy (CSP) |



J'ai choisi SQLite avec Prisma parce que cette combinaison est simple à installer et suffisante pour un projet de cette taille. Prisma facilite la gestion des données et l'utilisation de requêtes paramétrées, ce qui contribue à limiter les risques d'injection SQL.



\## Installation et lancement



\### Prérequis



\- \[Node.js](https://nodejs.org/)

\- npm (installé avec Node.js)



\### Installation



Récupérer le projet :



```bash

git clone URL\_DU\_DEPOT

cd aot-reviews

```



Installer les dépendances :



```bash

npm install

```



\### Configuration



Créer un fichier `.env` à la racine du projet. Il contient les valeurs sensibles et ne doit jamais être envoyé sur le dépôt Git. Vérifier qu'il est bien listé dans `.gitignore`.



Exemple de configuration :



```env

PORT=3000

DATABASE\_URL="file:./dev.db"

SESSION\_SECRET="une\_longue\_chaine\_aleatoire\_et\_unique"

```



\### Initialisation de la base de données



Générer le client Prisma :



```bash

npx prisma generate

```



Appliquer les migrations existantes :



```bash

npx prisma migrate deploy

```



\### Lancement



Démarrer le serveur :



```bash

npm start

```



L'application est ensuite disponible à l'adresse suivante :



http://localhost:3000



\## Structure du projet



```text

aot-reviews/

├── generated/

│   └── prisma/          # Client Prisma généré

├── public/              # Fichiers du frontend (HTML, CSS, JavaScript)

├── src/

│   ├── routes/          # Routes de l'application

│   ├── middleware/      # Middlewares et protections

│   └── app.js           # Point d'entrée du serveur

├── prisma/

│   ├── migrations/      # Historique des migrations

│   └── schema.prisma    # Schéma de la base de données

├── package.json

├── package-lock.json

├── prisma7.config.ts

├── .env.example

└── README.md

```



\## Sécurité



Dès le début du projet, j'ai cherché à appliquer les bonnes pratiques de base plutôt qu'à les ajouter à la fin. Voici les principaux mécanismes mis en place et leur utilité.



\*\*Hachage des mots de passe (Bcrypt)\*\*



Les mots de passe ne sont pas stockés en clair. Bcrypt les transforme en empreintes avec un sel et un coût de calcul volontairement élevé, ce qui renforce leur protection en cas de fuite de la base de données.



\*\*En-têtes HTTP sécurisés (Helmet)\*\*



Ce middleware active plusieurs protections au niveau des en-têtes HTTP, notamment contre le clickjacking et le MIME sniffing.



\*\*Content Security Policy (CSP)\*\*



Cette politique indique au navigateur quelles sources de scripts, de styles, d'images et de polices sont autorisées. Elle contribue à limiter les risques liés aux attaques XSS en restreignant les ressources pouvant être chargées.



\*\*Limitation des requêtes (Express Rate Limit)\*\*



Le nombre de requêtes est limité sur certaines routes sensibles, notamment celles liées à l'authentification. Cette mesure contribue à ralentir les tentatives de connexion automatisées et les attaques par force brute.



\*\*Gestion des sessions (Express Session)\*\*



Après la connexion, l'utilisateur est identifié grâce à une session. Les cookies de session utilisent notamment les options `httpOnly`, `secure` en environnement HTTPS et `sameSite`, afin de renforcer la protection des sessions.



\### Analyse avec OWASP ZAP



J'ai réalisé des tests de sécurité avec OWASP ZAP afin d'identifier les vulnérabilités potentielles et les mauvaises configurations de l'application.



Les analyses ont notamment permis de relever plusieurs alertes concernant la politique CSP, l'authentification et certaines informations présentes dans les URL. Ces résultats constituent une base de travail pour les corrections et les améliorations de sécurité.



\### Limites et pistes d'amélioration



Ce projet reste un projet d'apprentissage et plusieurs améliorations peuvent encore être apportées :



\- Ajouter une protection CSRF dédiée, par exemple avec des jetons, sur les formulaires.

\- Renforcer les règles de choix des mots de passe.

\- Mettre en place une journalisation des tentatives de connexion échouées.

\- Approfondir les corrections issues des analyses OWASP ZAP.



\## Auteur



\*\*Emmanuel MAKOSSO\*\*



Projet de développement web : AOT Reviews.

