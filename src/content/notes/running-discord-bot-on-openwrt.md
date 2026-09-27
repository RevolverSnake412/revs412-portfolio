---
resume: false
title: "Operating a Lightweight Messaging Service on OpenWrt"
slug: "running-discord-bot-on-openwrt"
summary: "Field notes from deploying and maintaining a lightweight messaging automation service on an OpenWrt device, including Node.js, environment files, Docker/procd service direction, logs, restarts, and update workflow."
resumeSummary: >-
  Documented deployment and maintenance of a lightweight messaging automation service on OpenWrt hardware, where resources and service-management options differ from a conventional server. The setup covers Node.js runtime direction, secrets in environment files, application layout, direct execution, procd supervision, Docker alternatives, logs, restart behaviour, and update workflow. It focuses on choosing the lightest reliable operating model for the device and making failures observable, so the service can survive restarts and be updated without manual guesswork.
category: "Deployment"
tags:
  - openwrt
  - messaging-automation
  - nodejs
  - docker
  - deployment
  - service-management
  - self-managed-infrastructure
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Exécution d’un bot de messagerie sur OpenWrt"
    category: "Déploiement"
    summary: "Notes sur le déploiement et la maintenance d’un petit bot Node.js sur OpenWrt, avec fichiers d’environnement, gestion de service, journaux et mises à jour."
    resumeSummary: >-
      Déploiement documenté et maintenance d'un service d'automatisation de messagerie léger sur le matériel
      OpenWrt, où les ressources et les options de gestion de service diffèrent d'un serveur conventionnel. La
      configuration couvre la direction d'exécution Node.js, les secrets dans les fichiers d'environnement, la
      mise en page de l'application, l'exécution directe, la supervision procd, les alternatives Docker, les
      journaux, le comportement de redémarrage et le flux de travail de mise à jour. Il se concentre sur le
      choix du modèle d'exploitation le plus léger et fiable pour l'appareil et rend les défaillances
      observables, de sorte que le service peut survivre redémarrer et être mis à jour sans devinette
      manuelle.
    body: |-

      ## Pourquoi cette note existe

      OpenWrt est généralement traité comme un firmware routeur, pas comme un serveur d'applications général.

      Un service d'automatisation de messagerie est un bon exemple d'une charge de travail qui peut fonctionner en continu sans avoir besoin d'un VPS complet.

      Cette note documente le côté pratique de l'exécution d'un petit service de messagerie Node.js sur OpenWrt: où placer les fichiers, comment gérer les variables d'environnement, comment le faire fonctionner comme un service, comment le redémarrer, et comment déboguer les problèmes de déploiement communs.

      Le point n'est pas que le bot fonctionne sur OpenWrt parce que c'est impressionnant. Le point est d'apprendre à exploiter un petit service sur une infrastructure limitée sans perdre la trace des journaux, secrets, mises à jour et redémarrages.

      ## Contexte du périphérique

      La configuration est basée sur un appareil OpenWrt utilisé à la fois comme infrastructure réseau et comme hôte de service léger.

      Dans ce type de configuration, le routeur est déjà important. Ajouter des services d'application signifie un soin supplémentaire est nécessaire.

      Le service ne devrait pas rendre le routeur plus difficile à maintenir, et les défaillances de bot ne devraient pas affecter le routage, le DNS, le VPN ou le comportement du pare-feu.

      ## Ce que cette configuration veut prouver

      - petits services peuvent fonctionner sur OpenWrt lorsque l'appareil a suffisamment de ressources
      - les services hébergés par le routeur ont besoin d'un redémarrage et d'une gestion du journal propres
      - Les variables d'environnement ne doivent pas être codées en code source
      - Docker peut faire des mises à jour plus propres, mais il ajoute sa propre couche opérationnelle
      - OpenWrt `procd` peut exécuter les services directement lorsque Docker n'est pas nécessaire
      - les scripts de déploiement réduisent les commandes manuelles répétées
      - les journaux sont essentiels parce que les pannes de robots silencieuses sont fréquentes
      - l'hébergement de service sur un routeur doit rester délibéré et limité

      ## Pioche et outils utilisés

      ### Couche d'application

      - Numéro.js
      - discord.js
      - JavaScript
      - variables environnementales
      - configuration du jeton bot
      - Gestion des commandes/événements

      ### Couche ouverte

      - SSH
      - LuCI où utile
      - gestion des paquets
      - chemins du système de fichiers sous `/opt`
      - gestion des services
      - logs via l'outil OpenWrt
      - sensibilisation au stockage/au recouvrement

      ### Couche de déploiement

      - Docker, facultatif
      - `procd`, en option
      - `.env.local` ou un fichier d'environnement équivalent
      - scripts build/run/stop/restart
      - Processus de mise à jour basé sur Git ou sur copie
      - SCP/rsync ou autre méthode de synchronisation

      ### Dépannage du calque

      - container logs
      - registres des services
      - contrôle des processus
      - contrôle des fichiers environnementaux
      - Contrôles d'enregistrement de la commande Discord
      - validation du temps réseau/DNS

      ## Construction prévue

      La construction prévue est un petit service de bot qui peut fonctionner en continu sur OpenWrt et être maintenu sans répéter manuellement un long ensemble de commandes à chaque fois.

      Une configuration terminée devrait permettre :

      - code source stocké dans un répertoire clair
      - secrets stockés en dehors du code
      - démarrage/arrêt/redémarrage prévisible
      - journaux disponibles lorsque le bot échoue
      - facile à reconstruire ou à redéployer
      - mise à jour claire flux de travail de la machine de développement à OpenWrt
      - récupération de service après redémarrage
      - impact minimal sur les fonctions du routeur central

      ## Présentation du répertoire

      Un aménagement propre est important.

      Exemple de direction:

      ```txt
      /opt/discord-bots/
        bot-name/
          package.json
          src/
          .env.local
          scripts/
      ```

      Le nom exact du robot peut changer, mais le principe reste le même :

      - les fichiers d'application vivent dans un répertoire connu
      - secrets ne sont pas commis publiquement
      - scripts en direct près du projet
      - les journaux sont faciles à atteindre
      - le chemin de déploiement est documenté

      ## Variables d'environnement

      Les secrets ne devraient pas être codés en dur.

      Un fichier d'environnement local peut stocker des valeurs comme :

      ```txt
      DISCORD_TOKEN=
      CLIENT_ID=
      GUILD_ID=
      NODE_ENV=production
      ```

      Le bot doit charger le fichier d'environnement au démarrage.

      Contrôles importants:

      - le fichier existe sur OpenWrt
      - le service/conteneur peut le lire
      - les noms de variables correspondent au code
      - le jeton n'est pas imprimé dans les journaux
      - le fichier n'est pas engagé dans un dépôt public

      Un fichier env manquant ou illisible est l'une des façons les plus faciles pour un bot de échouer après le déploiement.

      ## Courir directement avec Node.js

      Une direction est d'exécuter le robot directement avec Node.js installé sur OpenWrt.

      Cela maintient la configuration simple, mais dépend de l'environnement du paquet OpenWrt et de la version Node.js installée.

      Forme manuelle de base:

      ```bash
      node src/index.js
      ```

      Pour la production, l'exécution manuelle ne suffit pas. Le robot doit fonctionner comme un service géré.

      ## Courir avec OpenWrt procd

      Les services OpenWrt utilisent normalement `procd`.

      Un service `procd` peut :

      - Démarrer le robot au démarrage
      - redémarrer si elle s'écrase
      - capture stdout/stderr
      - faciliter le démarrage/arrêt/redémarrage
      - intégrer avec les commandes de service OpenWrt

      Exemple de forme de service :

      ```sh
      #!/bin/sh /etc/rc.common

      START=99
      STOP=10
      USE_PROCD=1

      APP_DIR="/opt/discord-bots/bot-name"

      start_service() {
        procd_open_instance
        procd_set_param command /usr/bin/node "$APP_DIR/src/index.js"
        procd_set_param env NODE_ENV=production
        procd_set_param respawn 3600 5 5
        procd_set_param stdout 1
        procd_set_param stderr 1
        procd_close_instance
      }
      ```

      Ceci devrait être adapté à la méthode réelle de chargement du projet et de l'environnement.

      ## Courir avec Docker

      Docker est utile lorsque vous voulez un temps d'exécution plus cohérent.

      Une configuration Docker peut définir la version Node.js, les dépendances, l'utilisation des fichiers d'environnement et le comportement de redémarrer plus proprement.

      Exemple de direction:

      ```txt
      Dockerfile
      .env.local
      docker build
      docker run --env-file .env.local
      ```

      Pour OpenWrt, le support Docker dépend des ressources du périphérique, du stockage, du support du noyau et de la disponibilité du paquet.

      Docker rend l'emballage d'application plus propre, mais il ajoute également:

      - image reconstruite
      - nettoyage du contenant
      - Manipulation du volume/env
      - container logs
      - décisions de mise en réseau
      - utilisation du stockage

      ## Choix de réseau Docker

      Pour un petit robot, le réseau hôte peut être simple :

      ```txt
      --network host
      ```

      Cela évite une certaine complexité du réseau de conteneurs, mais il devrait être utilisé intentionnellement.

      Le robot n'a généralement besoin que d'un accès sortant à Discord, donc il n'a pas besoin de ports publics entrants.

      ## Gestion des services et des conteneurs

      Un déploiement utile devrait inclure des scripts pour des actions communes.

      Exemples:

      ```txt
      build
      run
      stop
      restart
      logs
      status
      clean
      help
      ```

      Le but est d'éviter de se souvenir de longues commandes Docker ou service manuellement.

      Un script d'aide devrait être suffisamment clair pour que les mises à jour futures ne soient pas douloureuses.

      ## Déploiement

      Un workflow pratique ressemble à ceci :

      1. modifier le code sur la machine de développement
      2. essai local si possible
      3. synchroniser les fichiers vers OpenWrt
      4. installer des dépendances ou reconstruire un conteneur
      5. redémarrer le service/conteneur
      6. vérifier les journaux
      7. vérifier que le robot est en ligne
      8. tester une commande/action réelle

      La synchronisation de fichier peut utiliser :

      - `scp`
      - `rsync`
      - Git pull si disponible
      - téléchargement manuel pour les petits changements

      La méthode exacte importe moins que la cohérence.

      ## Points communs de défaillance

      ### Le service démarre localement mais pas sur OpenWrt

      Causes probables:

      - mauvaise version Node.js
      - dépendances manquantes
      - mauvais répertoire de travail
      - `.env.local` manquant
      - permissions de fichier
      - Différences de chemin ouvertes
      - service ne charge pas les variables d'environnement

      ### Conteneur construit mais ne fonctionne pas

      Causes probables:

      - Mauvaise architecture d'image
      - commande manquante
      - fichier env manquant
      - mauvais nom du conteneur
      - vieux conteneur existe déjà
      - défaillance de l'installation de la dépendance
      - l'application sort immédiatement

      Contrôles utiles:

      ```bash
      docker ps -a
      docker logs <container-name>
      ```

      ### Le service est actif mais les commandes sont erronées

      Causes probables:

      - Enregistrement de commandement non redéployé
      - des noms de commande dupliqués
      - commandes enregistrées globalement mais attendues instantanément
      - anciennes commandes encore mises en cache
      - Mauvaise application/identifiant client
      - mauvaise identification de la guilde
      - bot manque de permissions

      ### Le service fonctionne mais les journaux manquent

      Causes probables:

      - stdout/stderr non capturé
      - fichier de service ne permet pas l'enregistrement
      - Registres des conteneurs non vérifiés
      - application capture les erreurs silencieusement
      - sortie du processus avant l'enregistrement

      ### Erreurs de temps ou de certificat

      Un appareil avec un temps de système incorrect peut causer des problèmes TLS/certificat.

      Les symptômes peuvent sembler sans rapport, comme les demandes de réseau qui échouent même si le DNS et l'accès à Internet fonctionnent.

      Contrôles utiles:

      ```bash
      date
      logread | grep -i cert
      ```

      Si le temps est faux, corrigez d'abord la synchronisation NTP/time.

      ## Décisions pratiques

      ### Protéger l'emploi principal du routeur

      Le routeur devrait être un routeur d'abord.

      Si le bot devient lourd, instable ou compliqué, il peut être préférable de le déplacer vers un petit serveur ou un VPS.

      ### Ne pas coder les secrets

      Les jetons et les identifiants devraient vivre dans des fichiers d'environnement ou une manipulation secrète, et non dans le code.

      ### Utiliser des scripts pour des actions répétées

      Si une commande est répétée souvent, faites-en un script.

      Cela réduit les erreurs pendant la reconstruction, le redémarrage et le nettoyage.

      ### Préférez effacer les journaux sur les redémarrages silencieux

      Un service qui redémarre automatiquement mais ne donne pas de journaux utiles est difficile à maintenir.

      Les journaux devraient rendre les échecs évidents.

      ### Évitez d'exposer inutilement les ports

      La plupart des services d'automatisation de messagerie ont seulement besoin d'un accès sortant.

      N'ouvrez pas les ports publics à moins que le bot n'exécute un serveur web ou un auditeur webhook qui a réellement besoin de trafic entrant.

      ### Gardez une source propre de vérité de déploiement

      Évitez d'avoir plusieurs méthodes de déploiement en même temps.

      Si Docker est utilisé, faites Docker le chemin principal. Si `procd` direct Node.js est utilisé, faites que le chemin principal.

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - fichiers source bot dans un répertoire clair
      - fichier environnement présent et protégé
      - service/conteneur démarre de manière fiable
      - redémarrer le workflow documenté
      - journaux disponibles
      - bot vient en ligne après redémarrage ou redémarrage
      - script de déploiement/mise à jour disponible
      - enregistrement des commandes compris
      - aucun port public inutile exposé
      - fonctions du cœur du routeur non affectées
      - processus de nettoyage pour les vieux contenants/images en utilisant Docker

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - screenshot ou arborescence du répertoire
      - exemple de fichier de service
      - Dockerfile
      - script helper
      - `.env.example` sans véritables secrets
      - Sortie `docker ps`
      - État de service
      - exemples de journaux
      - capture d'écran en ligne bot
      - commande test screenshot
      - Essai de redémarrage
      - notes sur les échecs et les corrections

      ## Hypothèses techniques

      Cette configuration suppose que le périphérique OpenWrt a assez de processeur, de RAM et de stockage pour le bot et l'exécution.

      Il suppose également que le robot est petit et principalement basé sur l'événement/commande, pas une application lourde.

      La configuration suppose que l'accès Internet, DNS et le temps du système sont stables, car l'accès à l'API Discord dépend de tous les trois.

      ## Principaux risques

      - routeur surchargé par les services d'application
      - secrets commis accidentellement ou imprimés
      - bot échoue silencieusement après le redémarrage
      - anciens conteneurs en conflit avec de nouveaux conteneurs
      - Mauvaise image d'architecture
      - variables d'environnement manquantes
      - stockage remplissage avec images/logs
      - DNS / problèmes de temps causant des pannes d'API
      - confusion dans l'enregistrement des commandes
      - pas de retour net après une mise à jour cassée

      ## État actuel

      Cette note représente la direction de déploiement et de maintenance d'un service d'automatisation de messagerie léger sur OpenWrt.

      La leçon importante est que même un petit service d'automatisation a besoin d'une structure opérationnelle lorsqu'il fonctionne en continu : fichiers d'environnement, gestion de service, comportement de redémarrage, journaux et étapes de déploiement répétables.

      Ceci se connecte directement à d'autres notes sur OpenWrt, Docker scripts, DNS, et le dépannage de service.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas qu'OpenWrt est toujours le meilleur endroit pour accueillir des robots.

      Elle ne prétend pas que les services hébergés par les routeurs conviennent à chaque charge de production.

      Elle ne prétend pas que Docker est obligatoire.

      Le projet est mieux compris comme une note de déploiement pratique pour les petits services sur les infrastructures limitées.

      ## À emporter pratique

      L'exécution d'un bot sur OpenWrt ne concerne pas principalement le démarrage de `node index.js`.

      La partie utile est la structure opérationnelle qui la entoure :

      - où les fichiers vivent
      - comment les secrets sont chargés
      - comment ça commence après le redémarrage
      - comment il redémarre après l'échec
      - où les journaux sont lus
      - comment les mises à jour sont déployées
      - Comment nettoyer les contenants cassés
      - comment éviter d'affecter l'emploi principal du routeur

      C'est ce qui rend l'installation durable.
seoTitle: "Operating a Lightweight Messaging Service on OpenWrt"
seoDescription: "A practical note about deploying and maintaining a lightweight Node.js messaging service on OpenWrt with environment files, Docker or procd service management, logs, and update workflow."
---

## Why This Note Exists

OpenWrt is usually treated as router firmware, not as a general application server.

But on capable hardware, it can run small internal services if the setup is kept simple and maintainable. A messaging automation service is a good example of a workload that can run continuously without needing a full VPS.

This note documents the practical side of running a small Node.js messaging service on OpenWrt: where to place the files, how to handle environment variables, how to run it as a service, how to restart it, and how to debug common deployment issues.

The point is not that the bot runs on OpenWrt because that is impressive. The point is learning how to operate a small service on constrained infrastructure without losing track of logs, secrets, updates, and restarts.

## Device Context

The setup is based on an OpenWrt device used as both network infrastructure and a lightweight service host.

In this kind of setup, the router is already important. Adding application services means extra care is needed.

The service should not make the router harder to maintain, and bot failures should not affect routing, DNS, VPN, or firewall behavior.

## What This Setup Is Meant To Prove

- small services can run on OpenWrt when the device has enough resources
- router-hosted services need clean restart and log handling
- environment variables should not be hardcoded in source code
- Docker can make updates cleaner, but it adds its own operational layer
- OpenWrt `procd` can run services directly when Docker is not needed
- deployment scripts reduce repeated manual commands
- logs are essential because silent bot failures are common
- service hosting on a router should stay deliberate and limited

## Stack and Tools Used

### Application Layer

- Node.js
- discord.js
- JavaScript
- environment variables
- bot token configuration
- command/event handling

### OpenWrt Layer

- SSH
- LuCI where useful
- package management
- filesystem paths under `/opt`
- service management
- logs through OpenWrt tooling
- storage/overlay awareness

### Deployment Layer

- Docker, optional
- `procd`, optional
- `.env.local` or equivalent environment file
- build/run/stop/restart scripts
- Git-based or copy-based update workflow
- SCP/rsync or other sync method

### Troubleshooting Layer

- container logs
- service logs
- process checks
- environment file checks
- Discord command registration checks
- network/DNS time validation

## Intended Build

The intended build is a small bot service that can run continuously on OpenWrt and be maintained without manually repeating a long set of commands every time.

A finished setup should allow:

- source code stored in a clear directory
- secrets stored outside the code
- predictable start/stop/restart
- logs available when the bot fails
- easy rebuild or redeploy
- clear update workflow from development machine to OpenWrt
- service recovery after reboot
- minimal impact on core router functions

## Directory Layout

A clean layout is important.

Example direction:

```txt
/opt/discord-bots/
  bot-name/
    package.json
    src/
    .env.local
    scripts/
```

The exact bot name can change, but the principle stays the same:

- application files live in one known directory
- secrets are not committed publicly
- scripts live near the project
- logs are easy to reach
- deployment path is documented

## Environment Variables

Secrets should not be hardcoded.

A local environment file can store values like:

```txt
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
NODE_ENV=production
```

The bot should load the environment file at startup.

Important checks:

- the file exists on OpenWrt
- the service/container can read it
- the variable names match the code
- the token is not printed in logs
- the file is not committed to a public repository

A missing or unreadable env file is one of the easiest ways for a bot to fail after deployment.

## Running Directly With Node.js

One direction is to run the bot directly with Node.js installed on OpenWrt.

This keeps the setup simple, but it depends on the OpenWrt package environment and installed Node.js version.

Basic manual shape:

```bash
node src/index.js
```

For production, manual execution is not enough. The bot needs to run as a managed service.

## Running With OpenWrt procd

OpenWrt services normally use `procd`.

A `procd` service can:

- start the bot at boot
- restart it if it crashes
- capture stdout/stderr
- make start/stop/restart easier
- integrate with OpenWrt service commands

Example service shape:

```sh
#!/bin/sh /etc/rc.common

START=99
STOP=10
USE_PROCD=1

APP_DIR="/opt/discord-bots/bot-name"

start_service() {
  procd_open_instance
  procd_set_param command /usr/bin/node "$APP_DIR/src/index.js"
  procd_set_param env NODE_ENV=production
  procd_set_param respawn 3600 5 5
  procd_set_param stdout 1
  procd_set_param stderr 1
  procd_close_instance
}
```

This should be adjusted to the real project path and environment loading method.

## Running With Docker

Docker is useful when you want a more consistent runtime.

A Docker setup can define the Node.js version, dependencies, environment file usage, and restart behavior more cleanly.

Example direction:

```txt
Dockerfile
.env.local
docker build
docker run --env-file .env.local
```

For OpenWrt, Docker support depends on device resources, storage, kernel support, and package availability.

Docker makes application packaging cleaner, but it also adds:

- image rebuilds
- container cleanup
- volume/env handling
- container logs
- networking decisions
- storage usage

## Docker Network Choice

For a small bot, host networking may be simple:

```txt
--network host
```

This avoids some container network complexity, but it should be used intentionally.

The bot usually only needs outbound access to Discord, so it does not need public inbound ports.

## Service and Container Management

A useful deployment should include scripts for common actions.

Examples:

```txt
build
run
stop
restart
logs
status
clean
help
```

The goal is to avoid remembering long Docker or service commands manually.

A helper script should be clear enough that future updates are not painful.

## Deployment Workflow

A practical workflow looks like this:

1. edit code on the development machine
2. test locally where possible
3. sync files to OpenWrt
4. install dependencies or rebuild container
5. restart the service/container
6. check logs
7. verify the bot is online
8. test one real command/action

File syncing can use:

- `scp`
- `rsync`
- Git pull if available
- manual upload for small changes

The exact method matters less than consistency.

## Common Failure Points

### Service Starts Locally but Not on OpenWrt

Likely causes:

- wrong Node.js version
- missing dependencies
- wrong working directory
- missing `.env.local`
- file permissions
- OpenWrt path differences
- service not loading environment variables

### Container Builds but Does Not Run

Likely causes:

- wrong image architecture
- missing command
- missing env file
- wrong container name
- old container already exists
- dependency install failure
- application exits immediately

Useful checks:

```bash
docker ps -a
docker logs <container-name>
```

### Service Is Active but Commands Are Wrong

Likely causes:

- command registration not redeployed
- duplicate command names
- commands registered globally but expected instantly
- old commands still cached
- wrong application/client ID
- wrong guild ID
- bot lacks permissions

### Service Runs but Logs Are Missing

Likely causes:

- stdout/stderr not captured
- service file does not enable logging
- container logs not checked
- application catches errors silently
- process exits before logging

### Time or Certificate Errors

A device with wrong system time can cause TLS/certificate problems.

Symptoms may look unrelated, such as network requests failing even though DNS and internet access work.

Useful checks:

```bash
date
logread | grep -i cert
```

If time is wrong, fix NTP/time sync first.

## Practical Decisions

### Keep the router’s main job protected

The router should still be a router first.

If the bot becomes heavy, unstable, or complicated, it may be better to move it to a small server or VPS.

### Do not hardcode secrets

Tokens and IDs should live in environment files or secret handling, not inside code.

### Use scripts for repeated actions

If a command is repeated often, make it a script.

This reduces mistakes during rebuilds, restarts, and cleanup.

### Prefer clear logs over silent restarts

A service that restarts automatically but gives no useful logs is hard to maintain.

Logs should make failures obvious.

### Avoid exposing ports unnecessarily

Most messaging automation services only need outbound access.

Do not open public ports unless the bot runs a web server or webhook listener that actually needs inbound traffic.

### Keep one clean source of deployment truth

Avoid having multiple half-working deployment methods at the same time.

If Docker is used, make Docker the main path. If `procd` direct Node.js is used, make that the main path.

## What A Finished Setup Should Show

A strong finished setup should show:

- bot source files in a clear directory
- environment file present and protected
- service/container starts reliably
- restart workflow documented
- logs available
- bot comes online after reboot or restart
- deployment/update script available
- command registration understood
- no unnecessary public ports exposed
- router core functions unaffected
- cleanup process for old containers/images if using Docker

## Evidence Worth Capturing

Useful evidence for this note would include:

- directory layout screenshot or tree
- service file example
- Dockerfile
- helper script
- `.env.example` without real secrets
- `docker ps` output
- service status output
- log examples
- bot online screenshot
- command test screenshot
- restart test
- notes about failures and fixes

## Technical Assumptions

This setup assumes the OpenWrt device has enough CPU, RAM, and storage for the bot and runtime.

It also assumes that the bot is small and mostly event/command based, not a heavy application.

The setup assumes that internet access, DNS, and system time are stable, because Discord API access depends on all three.

## Key Risks

- router overloaded by application services
- secrets accidentally committed or printed
- bot failing silently after restart
- old containers conflicting with new ones
- wrong architecture image
- missing environment variables
- storage filling up with images/logs
- DNS/time issues causing API failures
- command registration confusion
- no clean rollback after a broken update

## Current State

This note represents the deployment and maintenance direction for running a lightweight messaging automation service on OpenWrt.

The important lesson is that even a small automation service needs operational structure when it runs continuously: environment files, service management, restart behavior, logs, and repeatable deployment steps.

This connects directly to other notes about OpenWrt, Docker scripts, DNS, and service troubleshooting.

## What This Note Does Not Claim

This note does not claim that OpenWrt is always the best place to host bots.

It does not claim that router-hosted services are suitable for every production workload.

It does not claim that Docker is mandatory.

The project is best understood as a practical deployment note for small services on constrained infrastructure.

## Practical Takeaway

Running a bot on OpenWrt is not mainly about starting `node index.js`.

The useful part is the operational structure around it:

- where the files live
- how secrets are loaded
- how it starts after reboot
- how it restarts after failure
- where logs are read
- how updates are deployed
- how to clean up broken containers
- how to avoid affecting the router’s main job

That is what makes the setup maintainable.
