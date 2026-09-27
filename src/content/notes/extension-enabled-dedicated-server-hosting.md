---
resume: false
title: "Operating an Extension-Enabled Linux Service"
slug: "extension-enabled-dedicated-server-hosting"
summary: "Field notes from hosting and operating an extension-enabled stateful service on Linux, including ARM compatibility, service launch, extension handling, configuration, logs, and troubleshooting."
resumeSummary: >-
  Documented the deployment of an extension-enabled dedicated service on Linux, including launch configuration, filesystem layout, service management, logs, update routines, and extension installation. The troubleshooting work pays particular attention to ARM architecture and runtime compatibility, Docker experiments, configuration errors, and the difference between a successfully started process and a healthy usable service. It provides an operational baseline for running a constrained server reliably, with clear checks for architecture, ports, process state, and extension failures.
category: "Server Hosting"
tags:
  - stateful-service
  - server-hosting
  - linux
  - vps
  - extensions
  - arm
  - hosting
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Hébergement d’un service dédié avec extensions"
    category: "Hébergement de services"
    summary: "Notes sur l’hébergement d’un service dédié extensible sous Linux, couvrant la compatibilité ARM, la configuration des extensions, les journaux et le dépannage."
    resumeSummary: >-
      Documenté le déploiement d'un service dédié à l'extension sur Linux, y compris la configuration de
      lancement, la disposition du système de fichiers, la gestion du service, les journaux, les routines de
      mise à jour et l'installation d'extension. Le travail de dépannage porte une attention particulière à
      l'architecture ARM et à la compatibilité avec le temps d'exécution, aux expériences de Docker, aux
      erreurs de configuration et à la différence entre un processus démarré avec succès et un service
      utilisable sain.
    body: |-

      ## Pourquoi cette note existe

      Un service d'état peut être simple quand il fonctionne de base et ne nécessite qu'un petit groupe d'utilisateurs.

      Il devient plus complexe lorsque le serveur utilise ExtensionRuntime, extensions personnalisées, hébergement Linux, matériel ARM, expériences Docker, et idées d'intégration Discord.

      Cette note documente le côté pratique de l'hébergement d'un service dédié avec ExtensionRuntime sur un VPS Linux. L'accent n'est pas seulement démarrer le serveur une fois. L'accent est sur la compréhension des parties mobiles: compatibilité d'architecture, exigences d'exécution, installation d'extension, configuration du serveur, logs, construction d'erreurs, et récupération lorsque le serveur échoue.

      ## Contexte du serveur

      La configuration est basée sur une pile d'applications Linux VPS en cours d'exécution avec ExtensionRuntime.

      L'environnement comprenait:

      - Oracle Cloud ARM / direction VPS de style ampère
      - Administration du serveur Linux
      - ExtensionRuntime fichiers
      - Exigences relatives au temps d'exécution .NET
      - Bâtiment d'extension/essais
      - fichier de configuration du serveur
      - aucune direction de démarrage de l'équipe/serveur
      - Planification des ponts discordants
      - direction de développement d'extension personnalisée
      - dépannage à travers les couches d'architecture, d'exécution et d'extension

      Cette note est écrite comme une note de champ, pas comme un guide universel.

      ## Ce que cette configuration veut prouver

      - Les services dédiés à l'extension nécessitent plus de structure que les serveurs de base
      - L'architecture CPU est importante lors de l'utilisation d'outils préconstruits ou d'images Docker
      - ExtensionRuntime ajoute des contraintes de compatibilité d'exécution et d'extension
      - les fichiers de configuration du serveur doivent être traités comme faisant partie du déploiement
      - les journaux et les erreurs de construction sont la source réelle de l'information de débogage
      - les extensions personnalisées devraient être construites et testées dans un chemin contrôlé
      - le démarrage du service doit être répétable au lieu de se baser sur des commandes mémorisées
      - les relais de communication externe et les extensions service-comportement ne devraient être ajoutés qu'après la stabilité du service de base

      ## Pioche et outils utilisés

      ### Calque du serveur

      - Linux VPS
      - Administration de SSH
      - Environnement serveur ARM/Ampère
      - gestion du serveur basée sur le système de fichiers
      - fichiers de configuration du serveur
      - logs et sortie de crash

      ### pile d'application calque

      - direction du serveur dédié de pile d'application
      - ExtensionRuntime
      - fichiers de données de service
      - configuration du serveur
      - fichiers d'extension
      - sources d'extension
      - construire la sortie
      - drapeaux de lancement du serveur

      ### Couche d'exécution

      - .NET temps d'exécution
      - dépendances indigènes
      - contrôle de compatibilité de l'architecture
      - Expérimentations Docker là où elles sont utiles
      - dépannage spécifique à la plate-forme

      ### couche de développement

      - ExtensionArbre de source de runtime
      - processus de construction d'extension personnalisé
      - règles de comportement du service côté serveur
      - direction de dépendance à l'extension
      - compiler les erreurs et le débogage de l'API

      ### Direction de l'intégration

      - Discord chat bridge planification
      - direction du relais de réalisation/événement
      - amélioration de la visibilité de la console
      - direction de sortie du chat et de l'événement serveur dans l'application

      ## Construction prévue

      La construction prévue est un service dédié qui peut fonctionner de manière fiable avec ExtensionRuntime et des extensions sélectionnées.

      Une configuration terminée devrait permettre :

      - serveur commence par une commande ou un script connu
      - serveur lit le fichier de configuration prévu
      - les fichiers de données de service sont stockés dans un endroit connu
      - les extensions sont installées intentionnellement
      - des extensions personnalisées peuvent être construites et copiées au bon endroit
      - les journaux sont disponibles lorsque le démarrage échoue
      - les problèmes d'architecture/d'exécution sont rapidement identifiés
      - intégration de relais de communication externe peut être ajouté après la stabilité du service
      - sauvegardes existent avant les changements de données d'extension ou de service

      ## Présentation du répertoire

      Une mise en page propre facilite la maintenance du serveur.

      Exemple de direction:

      ```txt
      /home/opc/tml-arm/
        ExtensionRuntime/
          ExtensionRuntime.dll
          serverconfig.txt
          persistent data/
          extensions/
          ExtensionSources/
            SurfaceProtection/
      ```

      Le chemin exact peut changer, mais l'idée importante est de garder :

      - ExtensionRuntime fichiers
      - fichiers de données de service
      - fichiers d'extension
      - sources d'extension
      - fichiers de configuration
      - construire la sortie

      dans des endroits prévisibles.

      ## Configuration du serveur

      Un fichier de configuration de serveur est mieux qu'une longue commande pleine d'options répétées.

      Exemple de direction:

      ```txt
      /work/serverconfig.txt
      ```

      ou:

      ```txt
      /home/opc/tml-arm/ExtensionRuntime/serverconfig.txt
      ```

      Un fichier de configuration peut définir :

      - chemin de données de service
      - utilisateurs max
      - port
      - mot de passe
      - difficulté
      - motd
      - banliste
      - réglage sécurisé
      - langue
      - auto-créer la direction des données de service si nécessaire

      Le fichier de configuration doit être suivi dans le cadre de la configuration du serveur.

      ## Direction de lancement

      Le service ExtensionRuntime est généralement lancé via sa DLL avec l'exécution correcte.

      Exemple de forme:

      ```bash
      dotnet ExtensionRuntime.dll -server -config /path/to/serverconfig.txt
      ```

      Des drapeaux supplémentaires peuvent être nécessaires selon la configuration.

      Pour la construction d'extension ou la configuration hors ligne, `-nosteam` peut être utile là où l'intégration Steam n'est pas requise.

      La commande de lancement devrait éventuellement être enveloppée dans un script afin que le serveur puisse être lancé de manière cohérente.

      ## Questions liées à la GAR / Architecture

      L'hébergement ARM VPS peut être attrayant en raison de ressources gratuites ou peu coûteuses, mais la compatibilité architecture crée des problèmes réels.

      Types de problèmes courants:

      - `Exec format error`
      - amd64 Image Docker sur l'hôte ARM
      - inadéquation de la dépendance native
      - Problèmes de compatibilité SteamCMD
      - erreurs de bibliothèque d'exécution
      - outil attendant x86_64 environnement
      - l'émulation fonctionne mais est plus lente ou fragile

      Si une image ou un binaire est construit pour amd64 et que l'hôte est ARM, il peut ne pas s'exécuter nativement.

      Ce n'est pas un problème spécifique à la pile d'applications. C'est un problème général d'hébergement/plateforme.

      ## Expériences de Docker

      Docker peut rendre la configuration du serveur plus propre, mais seulement si l'image supporte l'architecture cible.

      Dans ce type de configuration, Docker peut échouer parce que:

      - image est amd64-seulement
      - hôte est ARM
      - script d'entrée est le mauvais format
      - La dépendance de SteamCMD ne correspond pas
      - la bibliothèque native échoue à l'exécution
      - les chemins montés sont mauvais
      - le chemin de configuration du serveur dans le conteneur est incorrect

      Lorsque Docker devient la source du problème, exécuter ExtensionRuntime directement sur l'hôte peut être plus facile pour le dépannage.

      ## Prolongation Problèmes de durée d'exécution

      ExtensionRuntime dépend des composants d'exécution et des bibliothèques natives.

      Types de problèmes courants:

      - manquant .NET runtime
      - mauvaise version .NET
      - bibliothèque native manquante
      - Démarrage du noyau du dump
      - problème de trajectoire de dépendance
      - problème d'autorisation
      - problème de moteur graphique/natif même sur le serveur
      - drapeaux de lancement manquants ou erronés

      L'habitude importante de débogage est de lire la sortie d'erreur réelle au lieu de changer à plusieurs reprises des parties aléatoires de la configuration.

      ## extension Direction d'installation

      les extensions doivent être ajoutées après que le serveur de base fonctionne.

      Un débit plus sûr:

      1. démarrer le service de base sans extension
      2. confirmer les charges de données de service
      3. confirmer le port/connectivité
      4. ajouter une extension ou un groupe d'extensions connexes
      5. redémarrer
      6. lire les journaux
      7. joindre et tester
      8. sauvegarde avant les modifications majeures

      L'ajout de nombreuses extensions à la fois rend les échecs plus difficiles à isoler.

      ## Direction du développement de l'extension personnalisée

      Le travail d'extension personnalisé devrait vivre sous `ExtensionSources`.

      Exemple :

      ```txt
      ExtensionRuntime/ExtensionSources/SurfaceProtection/
      ```

      La commande build doit pointer vers le bon répertoire ExtensionRuntime et savedirectory.

      Exemple de forme:

      ```bash
      dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
      ```

      La commande exacte dépend de la disposition finale du dossier.

      La partie importante est que les commandes de build doivent être documentées, car les chemins ExtensionRuntime peuvent devenir déroutants rapidement.

      ## Créer des erreurs

      Les erreurs d'extension personnalisée sont des signaux utiles.

      Exemples de catégories d'erreurs:

      - erreur de signature de la méthode
      - utilisation obsolète de l'API ExtensionRuntime
      - mauvais type de retour
      - espace de noms manquant ou classe
      - confusion API côté serveur/client
      - mauvaise logique de carrelage ou d'élément
      - dépendance manquante
      - construire le chemin mal

      Un type d'exemple réel :

      ```txt
      return type must be 'void' to match overridden member
      ```

      Cela signifie que le code d'extension utilise la signature de la mauvaise méthode pour la version ExtensionRuntime.

      La correction n'est pas une édition aléatoire. La correction vérifie la signature de l'API actuelle et la correspond exactement.

      ## Règles à l'aide du serveur

      Une des orientations du projet consistait à établir des règles de comportement côté serveur, comme la protection des zones partagées contre les changements non autorisés tout en préservant les actions autorisées ailleurs.

      Il s'agit d'un cas de développement d'extension utile car il montre qu'un service dédié peut appliquer les règles par le biais du code plutôt que de dépendre uniquement de la modération manuelle.

      Considérations importantes:

      - quels objets devraient être protégés
      - comment la limite protégée est définie
      - Quelles actions devraient être autorisées
      - ce qui devrait se passer quand une action bloquée se produit
      - comment les messages sont montrés aux utilisateurs
      - si la règle crée des chemins de duplication
      - si les objets dépendants et les objets multicellules se comportent correctement

      ## Direction du relais de communication externe

      Un relais de communication externe peut connecter le service à un canal de communication configuré.

      Objectifs possibles:

      - relais en application chat à Discord
      - relais Discord messages au service chat
      - afficher les événements de jointure/leave
      - indiquer le statut ou l'activité de l'événement
      - améliorer la visibilité à distance dans l'activité du serveur
      - éviter d'exposer la sortie de console admin

      Cela devrait être ajouté après que le serveur de base et la configuration de l'extension soient stables.

      Un pont qui fuit la sortie de commande ou des erreurs internes peuvent créer des problèmes de bruit ou de confidentialité.

      ## Console et direction du logging

      Un serveur compatible avec l'extension a besoin de bons journaux.

      Zones de log utiles:

      - ExtensionRuntime sortie de démarrage
      - sortie de construction d'extension
      - sortie du crash
      - les messages de chargement de données de service
      - extension des messages de chargement
      - sortie d'exception d'exécution
      - journaux de relais de communication externe s'ils sont utilisés

      La console doit être plus qu'une boîte noire. Si une extension échoue, les journaux doivent indiquer clairement quelle extension ou quel fichier a causé la défaillance.

      ## Direction de sauvegarde

      Les sauvegardes sont importantes parce que les données persistantes et les configurations d'extension sont stateful.

      Cibles minimales de sauvegarde & #160;:

      ```txt
      persistent data/
      extensions/
      ExtensionSources/
      serverconfig.txt
      ```

      Avant de modifier les extensions, la logique d'extension personnalisée ou la version ExtensionRuntime, sauvegardez les données de service et config.

      Une simple sauvegarde peut être :

      ```bash
      tar -czf service-backup-$(date +%F).tar.gz persistent-data extensions serverconfig.txt
      ```

      Pour le développement personnalisé, sauvegardez ou contrôlez la version de la source d'extension.

      ## Scénarios de déploiement

      Un script start/build est utile car les commandes deviennent longues.

      Actions utiles du script :

      ```txt
      start
      stop
      restart
      build-extension
      logs
      backup
      update-extensions
      ```

      Le premier script n'a pas besoin d'être parfait. Il doit seulement réduire les étapes manuelles répétées et empêcher d'oublier des chemins importants.

      ## Décisions pratiques

      ### Stabiliser le serveur de base avant d'ajouter des extensions

      Si le serveur de base ne démarre pas de façon fiable, le débogage de l'extension devient plus difficile.

      ### Traiter l'architecture comme une contrainte de première classe

      Sur les hôtes ARM VPS, chaque image ou outil Docker ne fonctionnera pas.

      Vérifiez l'architecture tôt au lieu de supposer que chaque commande Linux fonctionne de la même façon.

      ### Gardez la logique d'extension personnalisée petite et testable

      De petites règles sont plus faciles à déboguer qu'une large extension qui change de nombreux systèmes à la fois.

      ### Utiliser les journaux avant de deviner

      Les erreurs ExtensionRuntime pointent habituellement vers l'appel, la dépendance ou l'extension de l'API défaillant.

      ### Sauvegarder avant de modifier les extensions

      Les modifications d'extension peuvent casser les données persistantes, les configurations ou le démarrage du serveur.

      ### Ajouter le relais de communication après stabilité du noyau

      Les intégrations ne doivent pas être mélangées à la première phase de débogage.

      ## Points communs de défaillance

      ### Erreur de format Exec

      Cause probable:

      ```txt
      amd64 binary or container on ARM host
      ```

      Fixez la direction & #160;:

      - utiliser une image/binaire compatible ARM
      - construire pour la plate-forme correcte
      - utiliser l'émulation seulement si elle est acceptable
      - éviter le chemin Docker jusqu'à ce que le serveur de base fonctionne directement

      ### ExtensionRuntime commence alors Crashes

      Causes probables:

      - temps d'exécution manquant
      - problème de dépendance native
      - mauvais drapeaux de lancement
      - environnement incompatible
      - extension cassée
      - mauvais chemin de configuration
      - problème de charge des données de service

      ### Extension Build Fails

      Causes probables:

      - Inadéquation de l'API
      - signature de préséance erronée
      - dépendance manquante
      - mauvais espace de noms
      - Code de l'échantillon dépassé
      - mauvais répertoire de sauvegarde
      - build des points de commande vers le mauvais dossier

      ### Serveur Exécute mais les utilisateurs ne peuvent pas se connecter

      Causes probables:

      - port fermé
      - pare-feu fournisseur
      - pare-feu local
      - mauvais port en configuration
      - serveur n'écoutant pas l'adresse prévue
      - inadéquation de la version
      - l'inadéquation de l'extension

      ### Protection de surface Logic Creates Exploits

      Causes probables:

      - bloquer l'interaction d'un objet mais pas les gouttes associées
      - permettant à un changement d'objet de base d'affecter des objets dépendants
      - ne pas gérer les relations d'attachement
      - ne pas distinguer les objets exemptés des objets protégés
      - inadéquation des prévisions serveur/client

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - ExtensionRuntime démarre de manière fiable
      - le chemin de fichier de configuration est documenté
      - les fichiers de données de service sont stockés de façon prévisible
      - les extensions sont installées intentionnellement
      - extension personnalisée construit avec succès
      - port serveur est documenté et accessible
      - les journaux de démarrage et de crash sont accessibles
      - processus de sauvegarde existe
      - la direction du relais de communication externe est claire
      - les limitations de l'architecture sont enregistrées
      - les commandes update/build/start sont documentées

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - arborescence du répertoire du serveur
      - commande de démarrage
      - extrait de fichier serveurconfig
      - journal de démarrage d'ExtensionRuntime réussi
      - liste des extensions
      - arbre source d'extension personnalisé
      - build commande output
      - construire des erreurs et corriger des exemples
      - configuration port/pare-feu
      - test de connexion utilisateur
      - essai de relais de communication externe s'il est ajouté
      - sauvegarde de la liste des archives
      - l'architecture vérifie les sorties telles que `uname -m`

      ## Hypothèses techniques

      Cette configuration suppose que l'hôte est un VPS Linux et peut être basé sur ARM.

      Il suppose qu'ExtensionRuntime et ses dépendances peuvent fonctionner dans l'environnement choisi après la résolution des problèmes de compatibilité.

      Il suppose également que le serveur est destiné à une petite communauté ou à un groupe contrôlé, et non à un vaste environnement de production publique.

      ## Principaux risques

      - inadéquation de l'architecture entre hôte et binaires
      - en s'appuyant sur des images Docker qui ne prennent pas en charge ARM
      - Dépendances de runtime
      - incompatibilité de l'extension
      - corruption de données de service après les changements d'extension
      - sauvegardes manquantes
      - bogues d'extension personnalisés créant des exploits
      - chemins de configuration peu clairs
      - relais de communication externe fuite sortie indésirable
      - règles port/firewall ne correspondant pas à la configuration du serveur
      - commandes manuelles oubliées ou modifiées au fil du temps

      ## État actuel

      Cette note représente la direction pratique d'hébergement et de dépannage pour un service dédié avec ExtensionRuntime sur Linux.

      La valeur principale est le modèle opérationnel : stabiliser le serveur de base, comprendre les contraintes d'architecture, gérer soigneusement les extensions, construire une logique personnalisée dans un chemin connu, capturer des journaux et documenter des commandes répétables.

      La configuration crée également une base pour une note séparée sur la construction d'une extension de protection de surface de pile d'application personnalisée.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas être un guide complet universel ExtensionRuntime.

      Il ne prétend pas que l'hébergement ARM VPS est toujours le choix le plus facile.

      Elle ne prétend pas que chaque prolongement ou pont fonctionnera sans vérification de compatibilité.

      C'est une note de champ sur l'hébergement, le débogage et le maintien d'un service dédié à l'extension dans un environnement Linux réel.

      ## À emporter pratique

      Un service dédié ExtensionRuntime n'est pas seulement l'exécutable serveur.

      La configuration utile comprend:

      - temps d'exécution correct
      - l'architecture correcte
      - chemins de configuration connus
      - changements prudents dans l'extension
      - processus de construction d'extension personnalisé
      - journaux
      - sauvegardes
      - lancer des scripts
      - essai au port
      - frontières de l'intégration

      C'est ce qui rend le serveur durable après le premier lancement réussi.
seoTitle: "Operating an Extension-Enabled Linux Service"
seoDescription: "A practical note about hosting an extension-enabled stateful service on Linux, covering ARM VPS compatibility, extension setup, configuration, logs, and troubleshooting."
---

## Why This Note Exists

A stateful service can be simple when it runs baseline and only needs a small group of users.

It becomes more complex when the server uses ExtensionRuntime, custom extensions, Linux hosting, ARM hardware, Docker experiments, and Discord integration ideas.

This note documents the practical side of hosting a dedicated service with ExtensionRuntime on a Linux VPS. The focus is not only starting the server once. The focus is understanding the moving parts: architecture compatibility, runtime requirements, extension installation, server configuration, logs, build errors, and recovery when the server fails.

## Server Context

The setup is based on a Linux VPS running application stack with ExtensionRuntime.

The environment included:

- Oracle Cloud ARM / Ampere-style VPS direction
- Linux server administration
- ExtensionRuntime files
- .NET runtime requirements
- extension building/testing
- server configuration file
- no-Steam/server startup direction
- Discord bridge planning
- custom extension development direction
- troubleshooting across architecture, runtime, and extension layers

This note is written as a field note, not as a universal guide.

## What This Setup Is Meant To Prove

- extension-enabled dedicated services need more structure than baseline servers
- CPU architecture matters when using prebuilt tools or Docker images
- ExtensionRuntime adds runtime and extension compatibility constraints
- server config files should be treated as part of deployment
- logs and build errors are the real source of debugging information
- custom extensions should be built and tested in a controlled path
- service startup should be repeatable instead of based on remembered commands
- external communication relays and service-behaviour extensions should be added only after the base service is stable

## Stack and Tools Used

### Server Layer

- Linux VPS
- SSH administration
- ARM/Ampere server environment
- filesystem-based server management
- server configuration files
- logs and crash output

### application stack Layer

- application stack dedicated server direction
- ExtensionRuntime
- service data files
- server config
- extension files
- extension sources
- build output
- server launch flags

### Runtime Layer

- .NET runtime
- native dependencies
- architecture compatibility checks
- Docker experiments where useful
- platform-specific troubleshooting

### extension development Layer

- ExtensionRuntime source tree
- custom extension build process
- server-side service behavior rules
- extension dependency direction
- compile errors and API mismatch debugging

### Integration Direction

- Discord chat bridge planning
- achievement/event relay direction
- console visibility improvements
- in-application chat and server event output direction

## Intended Build

The intended build is a dedicated service that can run reliably with ExtensionRuntime and selected extensions.

A finished setup should allow:

- server starts from a known command or script
- server reads the intended configuration file
- service data files are stored in a known location
- extensions are installed intentionally
- custom extensions can be built and copied into the right place
- logs are available when startup fails
- architecture/runtime problems are identified quickly
- external communication relay integration can be added after service stability
- backups exist before extension or service data changes

## Directory Layout

A clean layout makes the server easier to maintain.

Example direction:

```txt
/home/opc/tml-arm/
  ExtensionRuntime/
    ExtensionRuntime.dll
    serverconfig.txt
    persistent data/
    extensions/
    ExtensionSources/
      SurfaceProtection/
```

The exact path can change, but the important idea is to keep:

- ExtensionRuntime files
- service data files
- extension files
- extension sources
- config files
- build output

in predictable places.

## Server Configuration

A server config file is better than a long command full of repeated options.

Example direction:

```txt
/work/serverconfig.txt
```

or:

```txt
/home/opc/tml-arm/ExtensionRuntime/serverconfig.txt
```

A config file can define:

- service data path
- max users
- port
- password
- difficulty
- motd
- banlist
- secure setting
- language
- auto-create service data direction if needed

The config file should be tracked as part of the server setup.

## Launch Direction

The ExtensionRuntime service is usually launched through its DLL with the correct runtime.

Example shape:

```bash
dotnet ExtensionRuntime.dll -server -config /path/to/serverconfig.txt
```

Additional flags may be needed depending on the setup.

For extension building or offline setup, `-nosteam` can be useful where Steam integration is not required.

The launch command should eventually be wrapped in a script so the server can be started consistently.

## ARM / Architecture Issues

ARM VPS hosting can be attractive because of free or low-cost resources, but architecture compatibility creates real problems.

Common issue types:

- `Exec format error`
- amd64 Docker image on ARM host
- native dependency mismatch
- SteamCMD compatibility problems
- runtime library errors
- tool expecting x86_64 environment
- emulation working but being slower or fragile

If an image or binary is built for amd64 and the host is ARM, it may not execute natively.

This is not a application stack-specific problem. It is a general hosting/platform issue.

## Docker Experiments

Docker can make server setup cleaner, but only if the image supports the target architecture.

In this kind of setup, Docker can fail because:

- image is amd64-only
- host is ARM
- entrypoint script is the wrong format
- SteamCMD dependency does not match
- native library fails at runtime
- mounted paths are wrong
- server config path inside container is wrong

When Docker becomes the source of the problem, running ExtensionRuntime directly on the host can be easier for troubleshooting.

## Extension Runtime Issues

ExtensionRuntime depends on runtime components and native libraries.

Common issue types:

- missing .NET runtime
- wrong .NET version
- native library missing
- startup core dump
- dependency path issue
- permission issue
- graphical/native backend issue even on server
- launch flags missing or wrong

The important debugging habit is to read the actual error output instead of repeatedly changing random parts of the setup.

## extension Installation Direction

extensions should be added after the base server works.

A safer flow:

1. start the baseline service with no extensions
2. confirm service data loads
3. confirm port/connectivity
4. add one extension or one group of related extensions
5. restart
6. read logs
7. join and test
8. backup before major changes

Adding many extensions at once makes failures harder to isolate.

## Custom extension Development Direction

Custom extension work should live under `ExtensionSources`.

Example:

```txt
ExtensionRuntime/ExtensionSources/SurfaceProtection/
```

The build command should point to the correct ExtensionRuntime directory and savedirectory.

Example shape:

```bash
dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
```

The exact command depends on the final folder layout.

The important part is that build commands should be documented, because ExtensionRuntime paths can become confusing quickly.

## Build Errors

Custom extension build errors are useful signals.

Examples of error categories:

- method signature mismatch
- outdated ExtensionRuntime API usage
- wrong override return type
- missing namespace or class
- server/client-side API confusion
- incorrect tile or item logic
- dependency missing
- build path wrong

A real example type:

```txt
return type must be 'void' to match overridden member
```

This means the extension code is using the wrong method signature for the ExtensionRuntime version.

The fix is not random editing. The fix is checking the current API signature and matching it exactly.

## Server-Side Rules

One project direction involved making server-side behavior rules, such as protecting shared areas from unauthorised changes while preserving permitted actions elsewhere.

This is a useful extension development case because it shows that a dedicated service can enforce rules through code rather than depending only on manual moderation.

Important considerations:

- which objects should be protected
- how the protected boundary is defined
- what actions should be allowed
- what should happen when a blocked action occurs
- how messages are shown to users
- whether the rule creates duplication paths
- whether dependent objects and multi-cell objects behave correctly

## External Communication Relay Direction

An external communication relay can connect the service with a configured communication channel.

Possible goals:

- relay in-application chat to Discord
- relay Discord messages to service chat
- show join/leave events
- show relevant status or event activity
- improve remote visibility into server activity
- avoid exposing admin console output

This should be added after the base server and extension setup are stable.

A bridge that leaks command output or internal errors can create noise or privacy issues.

## Console and Logging Direction

An extension-enabled server needs good logs.

Useful log areas:

- ExtensionRuntime startup output
- extension build output
- crash output
- service data loading messages
- extension loading messages
- runtime exception output
- external communication relay logs if used

The console should be more than a black box. If a extension fails, the logs should make it clear which extension or file caused the failure.

## Backup Direction

Backups are important because persistent data and extension configs are stateful.

Minimum backup targets:

```txt
persistent data/
extensions/
ExtensionSources/
serverconfig.txt
```

Before changing extensions, custom extension logic, or ExtensionRuntime version, back up the service data and config.

A simple backup can be:

```bash
tar -czf service-backup-$(date +%F).tar.gz persistent-data extensions serverconfig.txt
```

For custom development, also back up or version-control the extension source.

## Deployment Scripts

A start/build script is useful because commands become long.

Useful script actions:

```txt
start
stop
restart
build-extension
logs
backup
update-extensions
```

The first script does not need to be perfect. It only needs to reduce repeated manual steps and prevent forgetting important paths.

## Practical Decisions

### Stabilize the base server before adding extensions

If the base server does not start reliably, extension debugging becomes harder.

### Treat architecture as a first-class constraint

On ARM VPS hosts, not every Docker image or tool will work.

Check architecture early instead of assuming every Linux command works the same.

### Keep custom extension logic small and testable

Small rules are easier to debug than a large extension that changes many systems at once.

### Use logs before guessing

ExtensionRuntime errors usually point toward the failing API call, dependency, or extension.

### Back up before changing extensions

extension changes can break persistent data, configs, or server startup.

### Add the communication relay after core stability

Integrations should not be mixed into the first debugging phase.

## Common Failure Points

### Exec Format Error

Likely cause:

```txt
amd64 binary or container on ARM host
```

Fix direction:

- use ARM-compatible image/binary
- build for the correct platform
- use emulation only if acceptable
- avoid Docker path until base server works directly

### ExtensionRuntime Starts Then Crashes

Likely causes:

- missing runtime
- native dependency issue
- wrong launch flags
- incompatible environment
- broken extension
- bad config path
- service data load problem

### extension Build Fails

Likely causes:

- API mismatch
- wrong override signature
- missing dependency
- wrong namespace
- outdated sample code
- wrong savedirectory
- build command points to the wrong folder

### Server Runs but users Cannot Connect

Likely causes:

- port closed
- provider firewall
- local firewall
- wrong port in config
- server not listening on expected address
- version mismatch
- extension mismatch

### Surface Protection Logic Creates Exploits

Likely causes:

- blocking one object interaction but not related drops
- allowing a base-object change to affect dependent objects
- not handling attachment relationships
- not distinguishing exempt objects from protected objects
- server/client prediction mismatch

## What A Finished Setup Should Show

A strong finished setup should show:

- ExtensionRuntime starts reliably
- config file path is documented
- service data files are stored predictably
- extensions are installed intentionally
- custom extension builds successfully
- server port is documented and reachable
- startup and crash logs are accessible
- backup process exists
- external communication relay direction is clear
- architecture limitations are recorded
- update/build/start commands are documented

## Evidence Worth Capturing

Useful evidence for this note would include:

- server directory tree
- startup command
- serverconfig file excerpt
- successful ExtensionRuntime startup log
- extension list
- custom extension source tree
- build command output
- build error and fix examples
- port/firewall configuration
- user connection test
- external communication relay test if added
- backup archive list
- architecture check output such as `uname -m`

## Technical Assumptions

This setup assumes the host is a Linux VPS and may be ARM-based.

It assumes ExtensionRuntime and its dependencies can run in the chosen environment after compatibility issues are solved.

It also assumes the server is intended for a small community or controlled group, not a large public production environment.

## Key Risks

- architecture mismatch between host and binaries
- relying on Docker images that do not support ARM
- broken ExtensionRuntime dependencies
- extension incompatibility
- service data corruption after extension changes
- missing backups
- custom extension bugs creating exploits
- unclear config paths
- external communication relay leaking unwanted output
- port/firewall rules not matching the server config
- manual commands being forgotten or changed over time

## Current State

This note represents the practical hosting and troubleshooting direction for a dedicated service with ExtensionRuntime on Linux.

The main value is the operational model: stabilize the base server, understand architecture constraints, manage extensions carefully, build custom logic in a known path, capture logs, and document repeatable commands.

The setup also creates a base for a separate note about building a custom application stack surface protection extension.

## What This Note Does Not Claim

This note does not claim to be a full universal ExtensionRuntime guide.

It does not claim that ARM VPS hosting is always the easiest choice.

It does not claim that every extension or bridge will work without compatibility checks.

It is a field note about hosting, debugging, and maintaining an extension-enabled dedicated service in a real Linux environment.

## Practical Takeaway

A ExtensionRuntime dedicated service is not only the server executable.

The useful setup includes:

- correct runtime
- correct architecture
- known config paths
- careful extension changes
- custom extension build process
- logs
- backups
- start scripts
- port testing
- integration boundaries

That is what makes the server maintainable after the first successful launch.
