---
resume: false
title: "Rsync and SCP Alternatives for OpenWrt Deployment"
slug: "rsync-and-scp-alternatives-for-openwrt-deployment"
summary: "Field notes from deploying small services to OpenWrt when rsync is unreliable, using SCP, tar over SSH, Git pull, and simple deployment scripts instead."
resumeSummary: >-
  Documented lightweight deployment methods for OpenWrt devices when rsync is unavailable, unreliable, or too heavy for the target. The alternatives include SCP with compatibility mode, streamed tar archives over SSH, upload-and-extract flows, Git pull on the device, and copying only runtime artifacts built elsewhere. Each method is framed around constrained router storage, CPU, package availability, and recovery needs, giving small services a repeatable deployment path without assuming a full Linux-server toolchain.
category: "Deployment"
tags:
  - openwrt
  - deployment
  - rsync
  - scp
  - ssh
  - tar
  - git
  - docker
  - procd
  - automation
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Alternatives à rsync et SCP pour déployer sur OpenWrt"
    category: "Déploiement"
    summary: "Notes sur le déploiement de petits services OpenWrt avec SCP, tar via SSH, Git pull et scripts simples lorsque rsync est indisponible ou peu fiable."
    resumeSummary: >-
      Méthodes de déploiement légères documentées pour les périphériques OpenWrt lorsque rsync est
      indisponible, peu fiable ou trop lourd pour la cible. Les alternatives incluent SCP avec mode de
      compatibilité, archives de tar en streaming sur SSH, flux de téléchargement et d'extraction, Git tirer
      sur l'appareil, et copier seulement des artefacts d'exécution construits ailleurs. Chaque méthode est
      encadrée autour du stockage de routeur limité, CPU, disponibilité de paquets, et les besoins de
      récupération, donnant aux petits services un chemin de déploiement répétable sans supposer une chaîne
      d'outils Linux-serveur complète.
    body: |-

      ## Pourquoi cette note existe

      Déployer du code vers OpenWrt est différent du déploiement vers un serveur Linux normal.

      OpenWrt est petit, axé sur le routeur, et parfois des outils manquants qui sont standard sur les grandes distributions. Même lorsqu'un outil existe, l'implémentation, le comportement SSH, la mise en page du système de fichiers, ou l'environnement peut se comporter différemment.

      Cette note documente des alternatives de déploiement pratiques pour les petits services hébergés par OpenWrt lorsque `rsync` n'est pas fiable ou ne vaut pas la peine de se battre.

      L'objectif est simple :

      ```txt
      edit code locally
      send it to OpenWrt
      restart the service cleanly
      verify it is running
      ```

      Ce flux de travail compte plus qu'un outil de synchronisation spécifique.

      ## Contexte du projet

      La cible de déploiement était un dispositif OpenWrt utilisé pour les petits services et scripts.

      L'environnement comprenait:

      - Raspberry Pi fonctionne OpenWrt
      - Accès SSH depuis un poste de travail
        - Services d'automatisation Node.js
      - Direction du service basée sur Docker
      - direction de service de procd
      - fichiers placés sous `/opt`
      - Fichiers d'environnement de style `.env.local`
      - besoin de scripts répétables build/run/restart

      Un chemin cible typique ressemblait à :

      ```txt
      /opt/discord-bots/<service-name>
      ```

      Le principal problème était que `rsync` n'était pas toujours fiable dans la pratique, même lorsqu'il était installé sur les deux machines.

      Cela a rendu utile d'avoir des méthodes de déploiement de repli.

      ## Ce que cette note veut prouver

      - le déploiement doit être répétable même en cas de panne d'un outil
      - OpenWrt nécessite des flux de travail plus simples et plus explicites
      - SCP peut suffire pour les petits services
      - tar over SSH est un fort recul pour les dossiers entiers
      - Git pull peut fonctionner lorsque le routeur a accès et des identifiants
      - les scripts de déploiement réduisent les erreurs manuelles
      - redémarrage et vérification du service font partie du déploiement
      - synchroniser les fichiers n'est pas le même que déployer un service

      ## Outils et méthodes utilisés

      ### Accès à distance

      - SSH
      - Client OpenSSH
      - Serveur/dropbear OpenWrt SSH ou direction OpenSSH
      - commandes shell distantes

      ### Transfert de fichiers

      - `scp`
      - mode SCP historique au besoin
      - `tar` sur SSH
      - téléchargement manuel retour
      - option `sftp` si disponible

      ### Synchronisation/déploiement

      - `rsync` lors du travail
      - Git tirer le flux de travail
      - Reconstruction/redémarrage de Docker
      - redémarrage procd
      - scripts shell simples

      ### Voies de service

      - `/opt/discord-bots/`
      - `/etc/init.d/`
      - `.env.local`
      - `package.json`
      - `src/`
      - scripts de déploiement

      ## Construction prévue

      Le flux de travail de déploiement prévu est :

      ```txt
      local project folder
        ↓
      copy/sync files to OpenWrt
        ↓
      install/update dependencies if needed
        ↓
      restart service
        ↓
      check logs/status
      ```

      Un workflow terminé devrait permettre :

      - une commande pour télécharger le projet
      - une commande à redémarrer
      - une commande pour afficher les journaux
      - chute nette lorsque rsync échoue
      - pas de copier-coller manuel de nombreux fichiers
      - pas d'écrasement accidentel des secrets
      - pas de confusion entre construire, exécuter et redémarrer

      ## Pourquoi Rsync peut échouer sur OpenWrt

      `rsync` est normalement excellent, mais OpenWrt peut créer des frictions.

      Problèmes éventuels:

      - `rsync` manquant de chaque côté
      - différentes constructions/options `rsync`
      - Différences entre les sous-systèmes SSH
      - chemin citant les problèmes de Windows
      - questions d'autorisation
      - différences d'environnement de la coque distante
      - différences entre la boîte occupée/coreutils
      - sous-système SFTP cassé ou non disponible
      - anciens fichiers appartenant à un mauvais utilisateur
      - problèmes de stockage ou de superposition du routeur
      - connexion instable

      Une erreur comme :

      ```txt
      rsync error: unexplained error (code 12)
      ```

      peut venir d'une défaillance de démarrage distante-shell/protocole, pas nécessairement un conflit de fichiers normal.

      Lorsque l'outil lui-même devient le problème, la méthode de commutation est souvent plus rapide.

      ## Méthode 1: Téléchargement du dossier SCP

      Pour les petits projets, le SCP suffit souvent.

      Exemple de direction:

      ```bash
      scp -r ./project root@192.168.1.1:/opt/discord-bots/project
      ```

      Si la destination existe déjà, elle peut fusionner ou écraser les fichiers selon la structure.

      Pour un déploiement plus propre, téléchargez d'abord dans un dossier temporaire :

      ```bash
      scp -r ./project root@192.168.1.1:/tmp/project-upload
      ```

      Puis le déplacer sur le routeur après l'avoir vérifié.

      SCP n'est pas aussi intelligent que rsync, mais c'est simple.

      ## Mode SCP hérité

      Certaines configurations OpenWrt se comportent mieux avec le mode SCP.

      Sur les nouveaux clients OpenSSH, SCP peut utiliser le comportement SFTP par défaut. Si le serveur distant ne supporte pas le comportement SFTP attendu, le transfert peut échouer.

      Un retour utile est:

      ```bash
      scp -O -r ./project root@192.168.1.1:/opt/discord-bots/project
      ```

      Le drapeau `-O` force le comportement du protocole SCP.

      Cela peut aider lorsque SSH fonctionne mais le transfert de fichiers échoue en raison des problèmes de sous-système SFTP.

      ## Méthode 2: Tar sur SSH

      Pour le déploiement d'un dossier entier, le goudron sur SSH est un recul important.

      Au lieu de copier des milliers de fichiers un par un, créez un flux de goudron localement et extraitz-le à distance.

      Exemple de direction:

      ```bash
      tar -czf - ./project | ssh root@192.168.1.1 "mkdir -p /opt/discord-bots && tar -xzf - -C /opt/discord-bots"
      ```

      Cette méthode est utile car:

      - il utilise SSH
      - il ne nécessite pas rsync
      - il préserve la structure du dossier
      - il est efficace pour de nombreux petits fichiers
      - il évite la dépendance SFTP

      Une version plus propre peut tarir le contenu au lieu du dossier parent en fonction du résultat souhaité.

      ## Méthode 3: Télécharger des archives, puis extraire

      Une autre méthode sûre est:

      ```bash
      tar -czf project.tar.gz ./project
      scp project.tar.gz root@192.168.1.1:/tmp/project.tar.gz
      ssh root@192.168.1.1 "mkdir -p /opt/discord-bots && tar -xzf /tmp/project.tar.gz -C /opt/discord-bots && rm /tmp/project.tar.gz"
      ```

      C'est un peu plus lent mais plus facile à inspecter.

      Il donne également un artefact temporaire que vous pouvez réessayer ou vérifier.

      ## Méthode 4: Tir sur routeur

      Si Git est installé et que la repo est accessible depuis le routeur, le déploiement peut être :

      ```bash
      ssh root@192.168.1.1 "cd /opt/discord-bots/project && git pull"
      ```

      C'est propre quand:

      - le service est déjà cloné
      - les références sont traitées en toute sécurité
      - le routeur peut atteindre GitHub
      - la repo ne contient pas de secrets
      - la branche est contrôlée

      Mais Git sur un routeur a des compromis :

      - besoins de stockage
      - besoin de travail réseau/DNS
      - Besoins de justificatifs ou de clé de déploiement
      - peut accidentellement tirer des modifications non testées
      - pas idéal pour les repos privés sans mise en place de clé prudente

      Git pull est bon pour les workflows personnels contrôlés, mais pas toujours la meilleure méthode de premier déploiement.

      ## Méthode 5 : Construire localement, copier uniquement les fichiers d'exécution

      Pour les services Node.js, copier la repo complète à chaque fois peut être inutile.

      Un déploiement ne peut copier que :

      ```txt
      package.json
      package-lock.json
      src/
      .env.example
      Dockerfile
      scripts/
      ```

      Mais évitez de copier :

      ```txt
      node_modules/
      .git/
      logs/
      temporary files
      real secrets
      ```

      Si Docker est utilisé sur OpenWrt, le routeur peut construire l'image localement, ou l'image peut être construite ailleurs selon l'architecture et le flux de travail.

      Pour les petits appareils OpenWrt, les constructions locales peuvent être plus lentes.

      ## Méthode 6 : Envoi manuel d'urgence

      Un mauvais retour, mais parfois utile:

      ```txt
      copy one changed file with scp
      restart service
      test
      ```

      Exemple :

      ```bash
      scp ./src/index.js root@192.168.1.1:/opt/discord-bots/project/src/index.js
      ```

      Ce n'est pas un processus de déploiement propre, mais il est utile lors du débogage d'urgence.

      Il ne devrait pas devenir le flux normal de travail.

      ## Direction du script de déploiement

      Un meilleur workflow est d'envelopper les commandes dans les scripts.

      Exemple de commandes de script :

      ```txt
      deploy
      restart
      logs
      status
      stop
      start
      rebuild
      clean
      help
      ```

      Pour un service basé sur Docker:

      ```txt
      deploy → upload files
      rebuild → docker build
      restart → stop/remove old container, run new one
      logs → docker logs
      status → docker ps
      ```

      Pour un service de procd:

      ```txt
      deploy → upload files
      restart → /etc/init.d/service restart
      logs → logread
      status → /etc/init.d/service status
      ```

      L'implémentation exacte peut changer, mais le workflow orienté vers l'utilisateur doit rester simple.

      ## Débit de déploiement de Docker

      Un service OpenWrt basé sur Docker pourrait utiliser:

      ```txt
      Dockerfile
      .env.local
      package.json
      src/
      ```

      Un flux pratique:

      ```txt
      upload project
      docker build image
      stop old container
      remove old container
      run new container with --env-file
      check logs
      ```

      La distinction importante:

      ```txt
      building an image does not automatically restart the running container
      ```

      Une erreur courante est de construire une nouvelle image mais de laisser l'ancien conteneur tourner.

      Le script de déploiement devrait rendre cela explicite.

      ## débit de déploiement

      Pour les services OpenWrt natifs, procd est le gestionnaire de service.

      Un débit peut être:

      ```txt
      upload project files
      upload /etc/init.d/service file if needed
      chmod +x service file
      enable service
      restart service
      check logread
      ```

      Commandes utiles :

      ```bash
      /etc/init.d/service restart
      /etc/init.d/service status
      logread -f
      ```

      procd est plus OpenWrt-native que Docker et peut être plus léger pour les petits scripts Node si les dépendances sont déjà disponibles.

      ## Fichiers Environnement

      Les secrets et les variables d'environnement doivent être traités avec soin.

      Un schéma commun:

      ```txt
      .env.example committed
      .env.local kept private
      ```

      Déployer `.env.local` uniquement au routeur si le service en a besoin.

      Ne pas commettre de vrais jetons.

      Ne pas écraser `.env.local` accidentellement pendant le déploiement, sauf si cela est prévu.

      Les scripts de déploiement doivent :

      - sauter `.env.local`
      - télécharger depuis un chemin privé connu
      - vérifier qu'il existe avant le redémarrage

      ## Hors fichiers

      Même sans rsync, le déploiement devrait éviter de copier des fichiers inutiles.

      Exclusions courantes:

      ```txt
      .git/
      node_modules/
      dist/
      logs/
      *.log
      .env
      .env.local if handled separately
      .DS_Store
      ```

      Avec le tar, les exclusions peuvent être passées à la commande tar.

      Exemple de direction:

      ```bash
      tar --exclude='.git' --exclude='node_modules' --exclude='*.log' -czf - .
      ```

      Cela garde le déploiement plus petit et évite les fuites de déchets locaux.

      ## Vérification après déploiement

      Le déploiement n'est pas effectué lorsque les fichiers sont copiés.

      Vérifier :

      ```txt
      service is running
      logs look clean
      service is online
      expected command/feature works
      old code is not still running
      environment file loaded
      network access works
      ```

      Contrôles utiles:

      ```bash
      ssh root@192.168.1.1 "ps | grep node"
      ```

      ```bash
      ssh root@192.168.1.1 "docker ps"
      ```

      ```bash
      ssh root@192.168.1.1 "logread | tail -50"
      ```

      ```bash
      ssh root@192.168.1.1 "docker logs --tail 50 service-name"
      ```

      ## Commandes pratiques unilignes

      Pour copier/coller les workflows, les commandes en une ligne sont plus faciles.

      Exemple de déploiement tar-over-SSH :

      ```bash
      tar --exclude='.git' --exclude='node_modules' --exclude='*.log' -czf - . | ssh root@192.168.1.1 "mkdir -p /opt/discord-bots/project && tar -xzf - -C /opt/discord-bots/project"
      ```

      Exemple de PCD hérité :

      ```bash
      scp -O -r ./src ./package.json ./Dockerfile root@192.168.1.1:/opt/discord-bots/project/
      ```

      Exemple de redémarrage à distance :

      ```bash
      ssh root@192.168.1.1 "/etc/init.d/project restart && logread | tail -50"
      ```

      Exemple de redémarrage Docker :

      ```bash
      ssh root@192.168.1.1 "cd /opt/discord-bots/project && docker build -t project:latest . && docker rm -f project 2>/dev/null || true && docker run -d --name project --env-file .env.local --restart unless-stopped project:latest && docker logs --tail 50 project"
      ```

      Le nom exact du service doit être remplacé par le nom réel du projet.

      ## Points communs de défaillance

      ### Fichiers téléchargés mais le service fonctionne toujours Ancien code

      Causes probables:

      - service non redémarré
      - Image Docker reconstruite mais conteneur non recréé
      - fichiers copiés sur un mauvais chemin
      - plusieurs dossiers de projets existent
      - points de service vers un autre répertoire
      - ancien processus toujours en cours

      ### SCP fonctionne mais rsync fails

      Causes probables:

      - problème de démarrage du protocole rsync
      - Inadéquation SFTP/sous-système
      - problème de chemin rsync distant
      - problème de coquillage
      - délivrance des autorisations
      - Inadéquation du paquet/outil OpenWrt

      Utiliser le SCP ou le tar-over-SSH au lieu de perdre du temps.

      ### Le déploiement écrase les secrets

      Causes probables:

      - copie locale `.env.local`
      - suppression complète du dossier distant
      - archive comprend des fichiers secrets
      - Pas de liste d'exclusion
      - aucune sauvegarde avant le déploiement propre

      Gérez les secrets séparément.

      ### Docker construire fonctionne mais Bot ne commence pas

      Causes probables:

      - fichier env manquant
      - mauvaise commande
      - mauvais répertoire de travail
      - conflit ancien nom de conteneur
      - problème de mode réseau
      - inadéquation de l'architecture
      - jeton invalide
      - temps du système/question de certificat

      Vérifier les journaux, pas seulement construire la sortie.

      ### Confusion de chemins éloignés

      Causes probables:

      - déploie `/tmp` mais le service lit `/opt`
      - le fichier de service pointe vers l'ancien dossier
      - copier le dossier imbriqué créé accidentellement
      - chemins relatifs changés

      Vérifiez toujours avec:

      ```bash
      ssh root@192.168.1.1 "pwd; ls -la /opt/discord-bots/project"
      ```

      ## Modèle de déploiement plus sûr

      Un modèle plus sûr est :

      ```txt
      upload to temporary folder
      backup current folder
      replace folder
      restart service
      check logs
      rollback if broken
      ```

      Exemple de direction:

      ```txt
      /opt/discord-bots/project
      /opt/discord-bots/project.prev
      /tmp/project-upload
      ```

      Cela donne un chemin basique de recul.

      Pour les petits services, cela peut suffire.

      ## Quand Rsync vaut toujours la peine d'utiliser

      `rsync` est toujours utile lorsque:

      - Les deux côtés le soutiennent proprement
      - le projet a de nombreux fichiers
      - Seuls les petits changements doivent être copiés
      - Les exclusions sont importantes
      - la bande passante est limitée
      - le déploiement a besoin de supprimer-sync comportement

      Mais il ne doit pas être traité comme obligatoire.

      Si `scp` ou tar-over-SSH résout le problème de façon fiable, c'est un choix de déploiement valide.

      ## Décisions pratiques

      ### Préférez la fiabilité plutôt que la préférence de l'outil

      Le but est le déploiement, sans prouver que `rsync` fonctionne.

      ### Gardez les commandes scriptables

      Les commandes manuelles de copie sont correctes une fois.

      ### Téléchargement séparé du redémarrage

      Il devrait être clair si une commande copie uniquement des fichiers ou redémarre réellement le service.

      ### Vérifier après chaque déploiement

      Les journaux et les vérifications d'état devraient faire partie du flux de travail.

      ### Protéger les secrets

      N'archivez pas aveuglément et téléchargez tout.

      ### Garder la lumière ouverte

      Si le routeur est le point de contrôle du réseau, évitez de transformer le déploiement en infrastructure de construction lourde.

      ## Ce qu'un flux de travail fini devrait montrer

      Un fort flux de travail de déploiement devrait montrer :

      - chemin choisi pour le projet sous `/opt`
      - une commande pour déployer des fichiers
      - une commande pour redémarrer le service
      - une commande pour afficher les journaux
      - clairement exclus
      - `.env.local` manipulé en toute sécurité
      - Comportement Docker/procd documenté
      - recul si rsync échoue
      - étape de vérification
      - direction inverse pour les petits services

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - sortie d'erreur rsync échouée
      - commande SCP de travail
      - commande tar-over-SSH de travail
      - script de déploiement
      - avant/après la liste des fichiers
      - sortie de redémarrage de service
      - `docker ps` ou statut procd
      - journaux après déploiement
      - mise en page du répertoire sous `/opt`
      - Instructions d'utilisation README

      ## Hypothèses techniques

      Cette note suppose que le périphérique cible est OpenWrt et accessible sur SSH.

      Il suppose que le service est suffisamment petit pour que le SCP ou le Tar-over-SSH soit pratique.

      Il suppose également que la cible de déploiement est contrôlée par l'opérateur, comme un routeur autogéré ou un appareil interne.

      ## Principaux risques

      - copier des fichiers sur le mauvais chemin
      - écraser les secrets
      - redémarrer le mauvais service
      - construire une image Docker mais ne pas recréer le conteneur
      - laissant tourner les anciens processus
      - utilisant `/tmp` pour les fichiers de service persistants
      - en supposant que le téléchargement de SCP égale le déploiement
      - Pas de recul
      - aucun journal vérifié après le redémarrage
      - constructions lourdes affectant la stabilité du routeur

      ## État actuel

      Cette note représente un flux de travail pratique pour les services hébergés par OpenWrt.

      La valeur principale est d'avoir plusieurs façons fiables de déplacer le code lorsque `rsync` ne se comporte pas:

      - SCP
      - L'héritage du SCP
      - goudron sur SSH
      - télécharger l'archive puis extraire
      - Tirer
      - scripted deploy/restart/logs

      Il en résulte un flux de travail plus résistant pour les petits services.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que `rsync` est mauvais.

      Il ne prétend pas qu'OpenWrt devrait être utilisé comme un serveur d'application lourde.

      Il ne prétend pas que ces méthodes remplacent le CI/CD approprié pour les systèmes plus grands.

      Il documente des alternatives pratiques pour les petits déploiements OpenWrt où des commandes simples, fiables, répétables comptent plus qu'une plateforme de déploiement parfaite.

      ## À emporter pratique

      La leçon utile est:

      > Le flux de travail de déploiement devrait survivre à l'échec de l'outil.

      Si `rsync` échoue, le travail peut continuer avec :

      ```txt
      scp
      scp -O
      tar over SSH
      archive upload
      git pull
      scripted restart
      ```

      Pour les petits services OpenWrt, un flux de déploiement fiable ennuyeux est meilleur qu'un flux fragile.
seoTitle: "Rsync and SCP Alternatives for OpenWrt Deployment"
seoDescription: "A practical note about deploying small services to OpenWrt using SCP, tar over SSH, Git pull, and simple scripts when rsync is unreliable or unavailable."
---

## Why This Note Exists

Deploying code to OpenWrt is different from deploying to a normal Linux server.

OpenWrt is small, router-focused, and sometimes missing tools that are standard on bigger distributions. Even when a tool exists, the implementation, SSH behavior, filesystem layout, or environment can behave differently.

This note documents practical deployment alternatives for small OpenWrt-hosted services when `rsync` is not reliable or not worth fighting.

The goal is simple:

```txt
edit code locally
send it to OpenWrt
restart the service cleanly
verify it is running
```

That workflow matters more than using one specific sync tool.

## Project Context

The deployment target was an OpenWrt device used for small services and scripts.

The environment included:

- Raspberry Pi running OpenWrt
- SSH access from a workstation
  - Node.js automation services
- Docker-based service direction
- procd service direction
- files placed under `/opt`
- `.env.local` style environment files
- need for repeatable build/run/restart scripts

A typical target path looked like:

```txt
/opt/discord-bots/<service-name>
```

The main issue was that `rsync` was not always reliable in practice, even when installed on both machines.

That made it useful to have fallback deployment methods.

## What This Note Is Meant To Prove

- deployment should be repeatable even when one tool fails
- OpenWrt requires simpler, more explicit workflows
- SCP can be enough for small services
- tar over SSH is a strong fallback for whole folders
- Git pull can work when the router has access and credentials
- deployment scripts reduce manual mistakes
- service restart and verification are part of deployment
- syncing files is not the same as deploying a service

## Tools and Methods Used

### Remote Access

- SSH
- OpenSSH client
- OpenWrt SSH server/dropbear or OpenSSH direction
- remote shell commands

### File Transfer

- `scp`
- legacy SCP mode when needed
- `tar` over SSH
- manual upload fallback
- optional `sftp` if available

### Sync/Deployment

- `rsync` when working
- Git pull workflow
- Docker rebuild/restart
- procd restart
- simple shell scripts

### Service Paths

- `/opt/discord-bots/`
- `/etc/init.d/`
- `.env.local`
- `package.json`
- `src/`
- deployment scripts

## Intended Build

The intended deployment workflow is:

```txt
local project folder
  ↓
copy/sync files to OpenWrt
  ↓
install/update dependencies if needed
  ↓
restart service
  ↓
check logs/status
```

A finished workflow should allow:

- one command to upload the project
- one command to restart
- one command to view logs
- clear fallback when rsync fails
- no manual copy-paste of many files
- no accidental overwrite of secrets
- no confusion between build, run, and restart

## Why Rsync Can Fail on OpenWrt

`rsync` is normally excellent, but OpenWrt can create friction.

Possible issues:

- `rsync` missing on either side
- different `rsync` builds/options
- SSH subsystem differences
- path quoting issues from Windows
- permission issues
- remote shell environment differences
- busybox/coreutils differences
- broken or unavailable SFTP subsystem
- old files owned by wrong user
- router storage or overlay issues
- unstable connection

An error like:

```txt
rsync error: unexplained error (code 12)
```

can come from remote-shell/protocol startup failure, not necessarily a normal file conflict.

When the tool itself becomes the problem, switching method is often faster.

## Method 1: SCP Folder Upload

For small projects, SCP is often enough.

Example direction:

```bash
scp -r ./project root@192.168.1.1:/opt/discord-bots/project
```

If the destination already exists, it may merge or overwrite files depending on structure.

For cleaner deployment, upload into a temporary folder first:

```bash
scp -r ./project root@192.168.1.1:/tmp/project-upload
```

Then move it into place on the router after checking it.

SCP is not as smart as rsync, but it is simple.

## Legacy SCP Mode

Some OpenWrt setups behave better with legacy SCP mode.

On newer OpenSSH clients, SCP may use SFTP behavior by default. If the remote server does not support the expected SFTP behavior, transfer can fail.

A useful fallback is:

```bash
scp -O -r ./project root@192.168.1.1:/opt/discord-bots/project
```

The `-O` flag forces legacy SCP protocol behavior.

This can help when SSH works but file transfer fails because of SFTP subsystem issues.

## Method 2: Tar Over SSH

For whole-folder deployment, tar over SSH is a strong fallback.

Instead of copying thousands of files one by one, create a tar stream locally and extract it remotely.

Example direction:

```bash
tar -czf - ./project | ssh root@192.168.1.1 "mkdir -p /opt/discord-bots && tar -xzf - -C /opt/discord-bots"
```

This method is useful because:

- it uses SSH
- it does not require rsync
- it preserves folder structure
- it is efficient for many small files
- it avoids SFTP dependency

A cleaner version can tar the contents instead of the parent folder depending on the desired result.

## Method 3: Upload Archive, Then Extract

Another safe method is:

```bash
tar -czf project.tar.gz ./project
scp project.tar.gz root@192.168.1.1:/tmp/project.tar.gz
ssh root@192.168.1.1 "mkdir -p /opt/discord-bots && tar -xzf /tmp/project.tar.gz -C /opt/discord-bots && rm /tmp/project.tar.gz"
```

This is slightly slower but easier to inspect.

It also gives a temporary artifact you can retry or verify.

## Method 4: Git Pull on Router

If Git is installed and the repo is accessible from the router, deployment can be:

```bash
ssh root@192.168.1.1 "cd /opt/discord-bots/project && git pull"
```

This is clean when:

- the service is already cloned
- credentials are handled safely
- the router can reach GitHub
- the repo does not contain secrets
- the branch is controlled

But Git on a router has tradeoffs:

- needs storage
- needs network/DNS working
- needs credentials or deploy key
- can accidentally pull untested changes
- not ideal for private repos without careful key setup

Git pull is good for controlled personal workflows, but not always the best first deployment method.

## Method 5: Build Locally, Copy Only Runtime Files

For Node.js services, copying the full repo every time may be unnecessary.

A deployment can copy only:

```txt
package.json
package-lock.json
src/
.env.example
Dockerfile
scripts/
```

But avoid copying:

```txt
node_modules/
.git/
logs/
temporary files
real secrets
```

If Docker is used on OpenWrt, the router can build the image locally, or the image can be built elsewhere depending on architecture and workflow.

For small OpenWrt devices, local builds may be slower.

## Method 6: Manual Emergency Upload

A bad but sometimes useful fallback:

```txt
copy one changed file with scp
restart service
test
```

Example:

```bash
scp ./src/index.js root@192.168.1.1:/opt/discord-bots/project/src/index.js
```

This is not a clean deployment process, but it is useful during emergency debugging.

It should not become the normal workflow.

## Deployment Script Direction

A better workflow is to wrap commands into scripts.

Example script commands:

```txt
deploy
restart
logs
status
stop
start
rebuild
clean
help
```

For a Docker-based service:

```txt
deploy → upload files
rebuild → docker build
restart → stop/remove old container, run new one
logs → docker logs
status → docker ps
```

For a procd service:

```txt
deploy → upload files
restart → /etc/init.d/service restart
logs → logread
status → /etc/init.d/service status
```

The exact implementation can change, but the user-facing workflow should stay simple.

## Docker Deployment Flow

A Docker-based OpenWrt service might use:

```txt
Dockerfile
.env.local
package.json
src/
```

A practical flow:

```txt
upload project
docker build image
stop old container
remove old container
run new container with --env-file
check logs
```

The important distinction:

```txt
building an image does not automatically restart the running container
```

A common mistake is building a new image but leaving the old container running.

The deployment script should make that explicit.

## procd Deployment Flow

For native OpenWrt services, procd is the service manager.

A flow might be:

```txt
upload project files
upload /etc/init.d/service file if needed
chmod +x service file
enable service
restart service
check logread
```

Useful commands:

```bash
/etc/init.d/service restart
/etc/init.d/service status
logread -f
```

procd is more OpenWrt-native than Docker and can be lighter for small Node scripts if dependencies are already available.

## Environment Files

Secrets and environment variables should be handled carefully.

A common pattern:

```txt
.env.example committed
.env.local kept private
```

Deploy `.env.local` only to the router if the service needs it.

Do not commit real tokens.

Do not overwrite `.env.local` accidentally during deployment unless that is intended.

Deployment scripts should either:

- skip `.env.local`
- upload it from a known private path
- check that it exists before restart

## Excluding Files

Even without rsync, deployment should avoid copying unnecessary files.

Common exclusions:

```txt
.git/
node_modules/
dist/
logs/
*.log
.env
.env.local if handled separately
.DS_Store
```

With tar, exclusions can be passed to the tar command.

Example direction:

```bash
tar --exclude='.git' --exclude='node_modules' --exclude='*.log' -czf - .
```

This keeps deployment smaller and avoids leaking local junk.

## Verification After Deploy

Deployment is not done when files are copied.

Verify:

```txt
service is running
logs look clean
service is online
expected command/feature works
old code is not still running
environment file loaded
network access works
```

Useful checks:

```bash
ssh root@192.168.1.1 "ps | grep node"
```

```bash
ssh root@192.168.1.1 "docker ps"
```

```bash
ssh root@192.168.1.1 "logread | tail -50"
```

```bash
ssh root@192.168.1.1 "docker logs --tail 50 service-name"
```

## Practical One-Line Commands

For copy/paste workflows, one-line commands are easier.

Example tar-over-SSH deploy:

```bash
tar --exclude='.git' --exclude='node_modules' --exclude='*.log' -czf - . | ssh root@192.168.1.1 "mkdir -p /opt/discord-bots/project && tar -xzf - -C /opt/discord-bots/project"
```

Example legacy SCP:

```bash
scp -O -r ./src ./package.json ./Dockerfile root@192.168.1.1:/opt/discord-bots/project/
```

Example remote restart:

```bash
ssh root@192.168.1.1 "/etc/init.d/project restart && logread | tail -50"
```

Example Docker restart:

```bash
ssh root@192.168.1.1 "cd /opt/discord-bots/project && docker build -t project:latest . && docker rm -f project 2>/dev/null || true && docker run -d --name project --env-file .env.local --restart unless-stopped project:latest && docker logs --tail 50 project"
```

The exact service name should be replaced with the real project name.

## Common Failure Points

### Files Uploaded but Service Still Runs Old Code

Likely causes:

- service not restarted
- Docker image rebuilt but container not recreated
- files copied to wrong path
- multiple project folders exist
- service points to another directory
- old process still running

### SCP Works but rsync Fails

Likely causes:

- rsync protocol startup problem
- SFTP/subsystem mismatch
- remote rsync path problem
- shell quoting issue
- permissions issue
- OpenWrt package/tool mismatch

Use SCP or tar-over-SSH instead of losing time.

### Deployment Overwrites Secrets

Likely causes:

- copying local `.env.local`
- deleting remote folder completely
- archive includes secret files
- no exclude list
- no backup before clean deploy

Handle secrets separately.

### Docker Build Works but Bot Does Not Start

Likely causes:

- missing env file
- wrong command
- wrong working directory
- old container name conflict
- network mode issue
- architecture mismatch
- token invalid
- system time/certificate issue

Check logs, not only build output.

### Remote Path Confusion

Likely causes:

- deploys to `/tmp` but service reads `/opt`
- service file points to old folder
- copy created nested folder accidentally
- relative paths changed

Always verify with:

```bash
ssh root@192.168.1.1 "pwd; ls -la /opt/discord-bots/project"
```

## Safer Deployment Pattern

A safer pattern is:

```txt
upload to temporary folder
backup current folder
replace folder
restart service
check logs
rollback if broken
```

Example direction:

```txt
/opt/discord-bots/project
/opt/discord-bots/project.prev
/tmp/project-upload
```

This gives a basic rollback path.

For tiny services, this may be enough.

## When Rsync Is Still Worth Using

`rsync` is still useful when:

- both sides support it cleanly
- the project has many files
- only small changes should be copied
- exclusions are important
- bandwidth is limited
- deployment needs delete-sync behavior

But it should not be treated as mandatory.

If `scp` or tar-over-SSH solves the problem reliably, that is a valid deployment choice.

## Practical Decisions

### Prefer reliability over tool preference

The goal is deployment, not proving `rsync` works.

### Keep commands scriptable

Manual copy commands are okay once. Repeated deployments need scripts.

### Separate upload from restart

It should be clear whether a command only copies files or actually restarts the service.

### Verify after every deploy

Logs and status checks should be part of the workflow.

### Protect secrets

Do not blindly archive and upload everything.

### Keep OpenWrt light

If the router is the network control point, avoid turning deployment into heavy build infrastructure.

## What A Finished Workflow Should Show

A strong finished deployment workflow should show:

- chosen project path under `/opt`
- one command to deploy files
- one command to restart service
- one command to view logs
- clear excludes
- `.env.local` handled safely
- Docker/procd behavior documented
- fallback if rsync fails
- verification step
- rollback direction for small services

## Evidence Worth Capturing

Useful evidence for this note would include:

- failed rsync error output
- working SCP command
- working tar-over-SSH command
- deployment script
- before/after file listing
- service restart output
- `docker ps` or procd status
- logs after deployment
- directory layout under `/opt`
- README usage instructions

## Technical Assumptions

This note assumes the target device is OpenWrt and reachable over SSH.

It assumes the service is small enough that SCP or tar-over-SSH is practical.

It also assumes the deployment target is controlled by the operator, such as a self-managed router or internal device.

## Key Risks

- copying files to the wrong path
- overwriting secrets
- restarting the wrong service
- building a Docker image but not recreating the container
- leaving old processes running
- using `/tmp` for persistent service files
- assuming SCP upload equals deployment
- no rollback
- no logs checked after restart
- heavy builds affecting router stability

## Current State

This note represents a practical deployment workflow for OpenWrt-hosted services.

The main value is having multiple reliable ways to move code when `rsync` is not behaving:

- SCP
- legacy SCP
- tar over SSH
- upload archive then extract
- Git pull
- scripted deploy/restart/logs

The result is a more resilient workflow for small services.

## What This Note Does Not Claim

This note does not claim `rsync` is bad.

It does not claim OpenWrt should be used as a heavy application server.

It does not claim these methods replace proper CI/CD for larger systems.

It documents practical alternatives for small OpenWrt deployments where simple, reliable, repeatable commands matter more than a perfect deployment platform.

## Practical Takeaway

The useful lesson is:

> The deployment workflow should survive tool failure.

If `rsync` fails, the work can still continue with:

```txt
scp
scp -O
tar over SSH
archive upload
git pull
scripted restart
```

For small OpenWrt services, a boring reliable deployment flow is better than a fragile “proper” one.
