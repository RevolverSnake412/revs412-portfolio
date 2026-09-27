---
resume: false
title: "Docker Deployment Scripts for Small Services"
slug: "docker-deployment-scripts-for-small-services"
summary: "Field notes from creating small deployment helper scripts for Docker-based services so build, run, restart, logs, cleanup, and updates are repeatable."
resumeSummary: >-
  Designed small deployment helper scripts for Docker services to turn repetitive build and recovery steps into explicit, reusable commands. The workflow covers environment-file handling, stable container naming, build and run options, stop and restart behaviour, logs, cleanup, and update routines, while keeping the project shape understandable for small deployments. It reduces deployment mistakes by making the normal operational path visible and repeatable, without introducing a heavyweight platform where a clear shell-level workflow is sufficient.
category: "Deployment"
tags:
  - docker
  - deployment
  - scripts
  - maintenance
  - automation
  - services
  - self-managed-infrastructure
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Scripts de déploiement Docker pour petits services"
    category: "Déploiement"
    summary: "Notes sur des scripts d’aide pour gérer des services Docker avec des flux reproductibles de build, lancement, arrêt, redémarrage, journaux et nettoyage."
    resumeSummary: >-
      Le flux de travail couvre la gestion du fichier d'environnement, le nom de conteneur stable, les options
      de compilation et d'exécution, le comportement d'arrêt et de redémarrage, les journaux, le nettoyage et
      les routines de mise à jour, tout en gardant la forme du projet compréhensible pour les petits
      déploiements. Il réduit les erreurs de déploiement en rendant visible et répétable la trajectoire
      opérationnelle normale, sans introduire une plate-forme lourde où un flux de travail clair au niveau du
      shell est suffisant.
    body: |-

      ## Pourquoi cette note existe

      Exécuter un service avec Docker est simple la première fois.

      Le maintenir devient agaçant lorsque chaque mise à jour nécessite de se souvenir de la commande build exacte, nom du conteneur, fichier d'environnement, mode réseau, politique de redémarrage, commande logs et étapes de nettoyage.

      Cette note documente l'orientation pratique de la création de petits scripts d'aide autour des services Docker.

      Le but n'est pas de cacher complètement Docker. L'objectif est de rendre les opérations communes répétables de sorte que le déploiement devient moins sujet aux erreurs.

      ## Contexte

      Ce type de script est utile pour les petits services tels que:

      - Boots
      - API légères
      - outils internes
      - des services autogérés
      - petits travailleurs de l'automatisation
      - utilitaires personnels
      - services déployés sur un VPS ou un périphérique compatible OpenWrt

      Le service peut être simple, mais les étapes opérationnelles sont toujours importantes.

      Un mauvais processus de mise à jour peut créer des problèmes comme :

      - vieux conteneurs toujours en cours d'exécution
      - nouvelle image construite mais non utilisée
      - variables d'environnement manquantes
      - mauvais nom du conteneur
      - contenants en double
      - journaux difficiles à trouver
      - Aucun chemin de redémarrage propre
      - commandes oubliées de nettoyage

      Les scripts d'aide réduisent cette friction.

      ## Ce que cette configuration veut prouver

      - le déploiement doit être répétable, non basé sur la mémoire
      - les petits services ont encore besoin de démarrage, d'arrêt, de redémarrage, de registres et de flux de nettoyage
      - scripts peuvent réduire les erreurs sans introduire une plate-forme CI/CD complète
      - les fichiers environnementaux doivent être traités de manière cohérente
      - Les commandes Docker ne doivent être enveloppées que lorsqu'elles améliorent la fiabilité
      - Les mises à jour de service devraient être faciles à tester et à retourner mentalement
      - de bons outils locaux même pour les petits projets personnels ou indépendants

      ## Outils et domaines utilisés

      ### Calque Docker

      - Dockerfile
      - Construction de l'image Docker
      - fonctionnement du conteneur
      - arrêt/suppression du récipient
      - politique de redémarrage
      - chargement du fichier environnement
      - journaux
      - État du conteneur
      - nettoyage de l'image

      ### Calque Script

      - scripts shell
      - commande d'aide
      - traitement des arguments
      - État du produit
      - écoulement d'arrêt/de redémarrage sûr
      - nommage cohérent
      - Actions de déploiement d'un commandement

      ### Couche de service

      - petit service Node.js
      - bot ou processus ouvrier
      - variables environnementales
      - configuration persistante
      - journaux et sortie d'erreur
      - vérification du service après redémarrage

      ## Construction prévue

      Le résultat prévu est un petit script d'aide au déploiement ou un dossier de script qui fournit des opérations de service commun.

      Une configuration terminée devrait permettre :

      - construire l'image
      - exécuter le service
      - arrêter le service
      - redémarrer le service
      - afficher les journaux
      - afficher l' état
      - nettoyer les vieux contenants/images le cas échéant
      - imprimer l'aide
      - éviter de taper de longues commandes Docker manuellement
      - continuer à nommer les mises à jour de façon cohérente

      L'aide devrait faciliter l'entretien du service sans devenir un cadre de déploiement important.

      ## Commandes de script recommandées

      Un script pratique devrait supporter des commandes comme:

      ```txt
      help
      build
      run
      stop
      restart
      logs
      status
      clean
      rebuild
      ```

      Les noms exacts des commandes peuvent changer, mais le but doit rester clair.

      ## Exemple de forme de projet

      Un simple dossier de service peut ressembler à ceci :

      ```txt
      service-name/
        Dockerfile
        package.json
        src/
        .env.local
        .env.example
        scripts/
          service.sh
      ```

      Ou, pour un projet plus petit:

      ```txt
      service-name/
        Dockerfile
        .env.local
        deploy.sh
      ```

      La partie importante est que le script vit près du service et documente le flux de travail prévu.

      ## Gestion des fichiers d'environnement

      Un script helper devrait utiliser un fichier d'environnement prévisible.

      Exemple :

      ```txt
      .env.local
      ```

      Le script doit vérifier qu'il existe avant d'exécuter le conteneur.

      Exemple de comportement :

      ```txt
      if .env.local is missing:
        print a clear error
        stop before running the service
      ```

      C'est mieux que de démarrer un conteneur cassé qui sort immédiatement parce que le jeton, la clé API ou la valeur de configuration est manquante.

      ## Désignation des conteneurs

      Le script devrait définir un nom de conteneur clair.

      Exemple :

      ```txt
      CONTAINER_NAME="service-name"
      IMAGE_NAME="service-name:latest"
      ```

      Cela évite les noms générés au hasard par Docker et rend les commandes logs/status/restart prévisibles.

      Sans noms cohérents, la maintenance devient plus difficile.

      ## Construisez la commande

      La commande build devrait créer ou mettre à jour l'image Docker.

      Exemple de direction:

      ```bash
      docker build -t service-name:latest .
      ```

      Un script d'aide devrait imprimer ce qu'il fait:

      ```txt
      [+] Building service-name:latest
      ```

      Cela facilite la lecture des scripts.

      ## Exécuter la commande

      La commande d'exécution doit démarrer un nouveau conteneur avec la configuration correcte.

      Options communes:

      ```txt
      --name
      --env-file
      --restart unless-stopped
      --network
      -d
      ```

      Dans le cas d'un petit robot ou d'un travailleur à l'étranger, les ports publics peuvent ne pas être nécessaires.

      Exemple de direction:

      ```bash
      docker run -d --name service-name --env-file .env.local --restart unless-stopped service-name:latest
      ```

      Si le service nécessite un réseau hôte, le script devrait le rendre explicite.

      ## Commande d'arrêt

      La commande stop doit s'arrêter et enlever le conteneur en cours d'exécution proprement.

      Exemple de direction:

      ```bash
      docker stop service-name
      docker rm service-name
      ```

      Le script ne doit pas échouer bruyamment si le conteneur n'existe pas. Il peut imprimer un message clair à la place.

      ## Redémarrer la commande

      La commande de redémarrage doit être prévisible.

      Deux significations communes existent:

      ### Redémarrer le conteneur existant

      ```bash
      docker restart service-name
      ```

      C'est rapide, mais il ne reconstruit pas ou n'utilise pas de nouveau code.

      ### Recréer le conteneur à partir de l'image actuelle

      ```txt
      stop → run
      ```

      Ceci est utile après la reconstruction de l'image.

      Le script devrait clarifier le comportement.

      Pour les mises à jour de code, le flux plus sûr est généralement:

      ```txt
      build → stop → run → logs/status
      ```

      ## Reconstruire la commande

      Une commande utile est :

      ```txt
      rebuild
      ```

      Signification:

      ```txt
      build image
      stop old container
      run new container
      show logs/status
      ```

      C'est la commande utilisée après avoir changé de code.

      Il évite l'erreur courante de construire une image mais oublie de recréer le conteneur.

      ## Commande des journaux

      Les journaux devraient être facilement accessibles.

      Exemple de direction:

      ```bash
      docker logs -f service-name
      ```

      Une commande helper comme celle-ci est utile :

      ```bash
      ./deploy.sh logs
      ```

      Les journaux sont le premier endroit à vérifier après un redémarrage.

      ## Commande d'état

      L'état doit indiquer si le conteneur fonctionne.

      Exemple de direction:

      ```bash
      docker ps -a --filter name=service-name
      ```

      Un bon script peut aussi montrer:

      - Nom du conteneur
      - Nom de l'image
      - État de fonctionnement/sortie
      - redémarrer le nombre si disponible
      - journaux récents si utile

      ## Commande propre

      Le nettoyage devrait être prudent.

      Une commande propre peut supprimer les anciens conteneurs arrêtés ou les images inutilisées, mais elle ne devrait pas supprimer les ressources Docker non liées sans avertissement.

      Bon comportement de nettoyage:

      - enlever ce service
      - supprimer ce service l'ancienne image si prévu
      - éviter le nettoyage destructif mondial par défaut

      Évitez de faire tourner `clean` quelque chose de dangereux comme:

      ```bash
      docker system prune -a
      ```

      à moins que le script ne demande clairement une confirmation.

      ## Exemple Script Direction

      Il s'agit d'un exemple simplifié:

      ```sh
      #!/bin/sh

      APP_NAME="service-name"
      IMAGE_NAME="$APP_NAME:latest"
      CONTAINER_NAME="$APP_NAME"
      ENV_FILE=".env.local"

      case "$1" in
        build)
          docker build -t "$IMAGE_NAME" .
          ;;

        run)
          if [ ! -f "$ENV_FILE" ]; then
            echo "Missing $ENV_FILE"
            exit 1
          fi

          docker run -d       --name "$CONTAINER_NAME"       --env-file "$ENV_FILE"       --restart unless-stopped       "$IMAGE_NAME"
          ;;

        stop)
          docker stop "$CONTAINER_NAME" 2>/dev/null || true
          docker rm "$CONTAINER_NAME" 2>/dev/null || true
          ;;

        restart)
          "$0" stop
          "$0" run
          ;;

        rebuild)
          "$0" build
          "$0" stop
          "$0" run
          "$0" logs
          ;;

        logs)
          docker logs -f "$CONTAINER_NAME"
          ;;

        status)
          docker ps -a --filter "name=$CONTAINER_NAME"
          ;;

        help|*)
          echo "Usage: $0 {build|run|stop|restart|rebuild|logs|status|help}"
          ;;
      esac
      ```

      Ceci n'est pas censé être universel, c'est un modèle de départ qui devrait être adapté à chaque service.

      ## Décisions pratiques

      ### Gardez les commandes petites et évidentes

      Un script de déploiement devrait être ennuyeux.

      Si le script devient trop intelligent, il devient une autre chose à déboguer.

      ### Reconstruction différente du redémarrage

      Le redémarrage d'un conteneur n'applique pas de nouveau code si l'image a été reconstruite, mais le conteneur n'a pas été recréé.

      Une commande `rebuild` séparée rend cela plus clair.

      ### Vérifier le fichier env avant d'exécuter

      Échec tôt si la configuration requise est manquante.

      Cela évite la sortie de conteneurs avec des erreurs peu claires.

      ### Éviter le nettoyage global par défaut

      Le nettoyage devrait cibler le service à moins que l'utilisateur ne demande explicitement un nettoyage complet Docker.

      Ceci protège les autres contenants sur la même machine.

      ### Imprimer des messages d'état lisibles

      Quelques messages simples rendent la sortie du script beaucoup plus facile à comprendre.

      Exemple :

      ```txt
      [+] Building image
      [+] Stopping old container
      [+] Starting new container
      [+] Showing logs
      ```

      ### Garder une seule voie de déploiement principale

      Évitez d'avoir plusieurs façons contradictoires pour exécuter le même service.

      Si Docker est le chemin de déploiement, le script devrait être la manière normale de le gérer.

      ## Points communs de défaillance

      ### Image construite mais ancien code fonctionne toujours

      Cause:

      ```txt
      docker build was run, but the old container was not recreated
      ```

      Correction :

      ```txt
      build → stop → run
      ```

      ou:

      ```txt
      rebuild
      ```

      ### Nom du conteneur existe déjà

      Cause:

      ```txt
      old stopped container still exists
      ```

      Correction :

      ```bash
      docker rm service-name
      ```

      Une bonne commande `stop` devrait gérer cela.

      ### Variables d'environnement manquantes

      Symptômes:

      - sortie immédiate du service
      - Erreurs de jeton/API
      - config non défini
      - bot ne se connecte pas
      - Le serveur API échoue au démarrage

      Correction :

      - vérifier `.env.local`
      - vérifier `--env-file`
      - vérifier les noms des variables
      - vérifier la configuration de l'application

      ### Les journaux ne montrent rien d'utile

      Causes:

      - app ne enregistre pas les erreurs de démarrage
      - sortie du processus avant l'enregistrement
      - logs vérifiés pour mauvais conteneur
      - Inadéquation du nom du conteneur
      - service redirige les journaux ailleurs

      Correction :

      - utiliser des noms de contenants cohérents
      - log configuration du démarrage sans secrets
      - vérifier `docker ps -a`
      - vérifier `docker logs`

      ### Problèmes d'architecture Docker

      Sur les appareils ARM, l'architecture d'image compte.

      Symptômes:

      - Erreur de format exec
      - sortie immédiate du conteneur
      - binaire ne peut pas courir

      Fixez la direction & #160;:

      - construire pour l'architecture cible
      - utiliser des images de base qui supportent le périphérique
      - éviter de forcer la mauvaise plate-forme à moins d'imiter intentionnellement

      ### Remplissage de stockage

      Les images et les conteneurs Docker peuvent prendre de l'espace avec le temps.

      Contrôles utiles:

      ```bash
      docker images
      docker ps -a
      docker system df
      ```

      Le nettoyage doit être fait avec soin.

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - Dockerfile présent
      - `.env.example` documenté
      - `.env.local` utilisé localement mais non engagé
      - script helper avec sortie d'aide
      - build command fonctionne
      - Exécuter la commande fonctionne
      - le comportement de redémarrage/reconstruction est clair
      - La commande log fonctionne
      - La commande état fonctionne
      - La commande de nettoyage est sûre
      - README explique le flux normal
      - service survit au redémarrage si la politique de redémarrage est utilisée
      - aucune commande manuelle longue requise pour les actions communes

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - fichier script
      - aide à la sortie
      - Dockerfile
      - `.env.example`
      - construire la sortie
      - Sortie `docker ps`
      - sortie des journaux
      - Reconstruction de la capture d'écran de flux
      - exemple de conteneur défaillant et correction
      - Section de déploiement README
      - notes sur l'architecture/plateforme en cours d'exécution sur ARM

      ## Hypothèses techniques

      Cette configuration suppose que le service est suffisamment petit pour fonctionner confortablement sur la machine cible.

      Il suppose également que Docker est déjà installé et fonctionne.

      Le script ne remplace pas la compréhension Docker. Il rend seulement les opérations répétées cohérentes.

      ## Principaux risques

      - cacher trop de comportement Docker derrière un script
      - script supprimant des conteneurs ou des images non liés
      - fichier environnement accidentellement engagé
      - ancien conteneur utilisant un ancien code
      - Inadéquation du nom du conteneur
      - manquant de journaux
      - Pas de plan de renversement
      - inadéquation de l'architecture sur les appareils ARM
      - L'utilisation du disque augmente avec le temps
      - script devenant plus compliqué que le service

      ## État actuel

      La présente note représente le plan de maintenance du déploiement utilisé pour les petits services.

      La valeur est de créer une simple boucle opérationnelle:

      ```txt
      edit → build → stop old container → run new container → check logs
      ```

      Cette boucle est suffisante pour de nombreux petits services sans avoir besoin d'un système complet d'IC/DC.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que les scripts helper remplacent les plates-formes de déploiement appropriées.

      Elle ne prétend pas que Docker soit requis pour chaque petit service.

      Elle ne prétend pas qu'il s'agit d'un système d'orchestration de qualité de production.

      C'est un modèle pratique pour maintenir les petits services Docker à jour.

      ## À emporter pratique

      Un script de déploiement Docker est utile lorsqu'il empêche les erreurs répétées.

      Les parties utiles sont:

      - nom de l'image cohérent
      - nom du conteneur cohérent
      - fichier env prévisible
      - une commande pour reconstruire
      - des journaux faciles
      - écoulement d'arrêt/d'arrêt sûr
      - sortie d'aide claire
      - pas de magie inutile

      Cela suffit pour rendre le déploiement de petits services beaucoup moins ennuyeux.
seoTitle: "Docker Deployment Scripts for Small Services"
seoDescription: "A practical note about using helper scripts to manage small Docker services with repeatable build, run, stop, restart, logs, and cleanup workflows."
---

## Why This Note Exists

Running a service with Docker is simple the first time.

Maintaining it becomes annoying when every update requires remembering the exact build command, container name, environment file, network mode, restart policy, logs command, and cleanup steps.

This note documents the practical direction for creating small helper scripts around Docker services.

The goal is not to hide Docker completely. The goal is to make common operations repeatable so deployment becomes less error-prone.

## Context

This kind of scripting is useful for small services such as:

- bots
- lightweight APIs
- internal tools
- self-managed services
- small automation workers
- personal utilities
- services deployed on a VPS or OpenWrt-capable device

The service may be simple, but the operational steps still matter.

A bad update process can create issues like:

- old containers still running
- new image built but not used
- missing environment variables
- wrong container name
- duplicate containers
- logs hard to find
- no clean restart path
- forgotten cleanup commands

Helper scripts reduce that friction.

## What This Setup Is Meant To Prove

- deployment should be repeatable, not based on memory
- small services still need start, stop, restart, logs, and cleanup flows
- scripts can reduce mistakes without introducing a full CI/CD platform
- environment files should be handled consistently
- Docker commands should be wrapped only where it improves reliability
- service updates should be easy to test and roll back mentally
- good local tooling matters even for small personal or freelance projects

## Tools and Areas Used

### Docker Layer

- Dockerfile
- Docker image build
- container run
- container stop/remove
- restart policy
- environment file loading
- logs
- container status
- image cleanup

### Script Layer

- shell scripts
- help command
- argument handling
- status output
- safe stop/restart flow
- consistent naming
- one-command deployment actions

### Service Layer

- small Node.js service
- bot or worker process
- environment variables
- persistent configuration
- logs and error output
- service verification after restart

## Intended Build

The intended result is a small deployment helper script or script folder that provides common service operations.

A finished setup should allow:

- build the image
- run the service
- stop the service
- restart the service
- view logs
- show status
- clean old containers/images where appropriate
- print help
- avoid typing long Docker commands manually
- keep naming consistent across updates

The helper should make the service easier to maintain without becoming a large deployment framework.

## Recommended Script Commands

A practical script should support commands like:

```txt
help
build
run
stop
restart
logs
status
clean
rebuild
```

The exact command names can change, but the purpose should stay clear.

## Example Project Shape

A simple service folder can look like this:

```txt
service-name/
  Dockerfile
  package.json
  src/
  .env.local
  .env.example
  scripts/
    service.sh
```

Or, for a smaller project:

```txt
service-name/
  Dockerfile
  .env.local
  deploy.sh
```

The important part is that the script lives near the service and documents the expected workflow.

## Environment File Handling

A helper script should use one predictable environment file.

Example:

```txt
.env.local
```

The script should check that it exists before running the container.

Example behavior:

```txt
if .env.local is missing:
  print a clear error
  stop before running the service
```

This is better than starting a broken container that exits immediately because the token, API key, or config value is missing.

## Container Naming

The script should define a clear container name.

Example:

```txt
CONTAINER_NAME="service-name"
IMAGE_NAME="service-name:latest"
```

This avoids random Docker-generated names and makes logs/status/restart commands predictable.

Without consistent names, maintenance becomes harder.

## Build Command

The build command should create or update the Docker image.

Example direction:

```bash
docker build -t service-name:latest .
```

A helper script should print what it is doing:

```txt
[+] Building service-name:latest
```

This makes script output easier to read.

## Run Command

The run command should start a new container with the correct configuration.

Common options:

```txt
--name
--env-file
--restart unless-stopped
--network
-d
```

For a small outbound-only bot or worker, public ports may not be needed.

Example direction:

```bash
docker run -d --name service-name --env-file .env.local --restart unless-stopped service-name:latest
```

If the service requires host networking, the script should make that explicit.

## Stop Command

The stop command should stop and remove the running container cleanly.

Example direction:

```bash
docker stop service-name
docker rm service-name
```

The script should not fail noisily if the container does not exist. It can print a clear message instead.

## Restart Command

The restart command should be predictable.

Two common meanings exist:

### Restart existing container

```bash
docker restart service-name
```

This is fast, but it does not rebuild or use new code.

### Recreate container from current image

```txt
stop → run
```

This is useful after rebuilding the image.

The script should make the behavior clear.

For code updates, the safer flow is usually:

```txt
build → stop → run → logs/status
```

## Rebuild Command

A useful command is:

```txt
rebuild
```

Meaning:

```txt
build image
stop old container
run new container
show logs/status
```

This is the command used after changing code.

It avoids the common mistake of building an image but forgetting to recreate the container.

## Logs Command

Logs should be easy to reach.

Example direction:

```bash
docker logs -f service-name
```

A helper command like this is useful:

```bash
./deploy.sh logs
```

Logs are the first place to check after a restart.

## Status Command

Status should show whether the container is running.

Example direction:

```bash
docker ps -a --filter name=service-name
```

A good script can also show:

- container name
- image name
- running/exited state
- restart count if available
- recent logs if useful

## Clean Command

Cleanup should be careful.

A clean command can remove old stopped containers or unused images, but it should not delete unrelated Docker resources without warning.

Good cleanup behavior:

- remove this service’s stopped container
- remove this service’s old image if intended
- avoid global destructive cleanup by default

Avoid making `clean` run something dangerous like:

```bash
docker system prune -a
```

unless the script clearly asks for confirmation.

## Example Script Direction

This is a simplified example shape:

```sh
#!/bin/sh

APP_NAME="service-name"
IMAGE_NAME="$APP_NAME:latest"
CONTAINER_NAME="$APP_NAME"
ENV_FILE=".env.local"

case "$1" in
  build)
    docker build -t "$IMAGE_NAME" .
    ;;

  run)
    if [ ! -f "$ENV_FILE" ]; then
      echo "Missing $ENV_FILE"
      exit 1
    fi

    docker run -d       --name "$CONTAINER_NAME"       --env-file "$ENV_FILE"       --restart unless-stopped       "$IMAGE_NAME"
    ;;

  stop)
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    ;;

  restart)
    "$0" stop
    "$0" run
    ;;

  rebuild)
    "$0" build
    "$0" stop
    "$0" run
    "$0" logs
    ;;

  logs)
    docker logs -f "$CONTAINER_NAME"
    ;;

  status)
    docker ps -a --filter "name=$CONTAINER_NAME"
    ;;

  help|*)
    echo "Usage: $0 {build|run|stop|restart|rebuild|logs|status|help}"
    ;;
esac
```

This is not meant to be universal. It is a starting pattern that should be adapted to each service.

## Practical Decisions

### Keep commands small and obvious

A deployment script should be boring.

If the script becomes too clever, it becomes another thing to debug.

### Make rebuild different from restart

Restarting a container does not apply new code if the image was rebuilt but the container was not recreated.

A separate `rebuild` command makes this clearer.

### Check for env file before running

Fail early if required configuration is missing.

This avoids containers exiting with unclear errors.

### Avoid global cleanup by default

Cleanup should target the service unless the user explicitly asks for a full Docker cleanup.

This protects other containers on the same machine.

### Print readable status messages

A few simple messages make script output much easier to understand.

Example:

```txt
[+] Building image
[+] Stopping old container
[+] Starting new container
[+] Showing logs
```

### Keep one main deployment path

Avoid having multiple conflicting ways to run the same service.

If Docker is the deployment path, the script should be the normal way to manage it.

## Common Failure Points

### Image Built but Old Code Still Runs

Cause:

```txt
docker build was run, but the old container was not recreated
```

Fix:

```txt
build → stop → run
```

or:

```txt
rebuild
```

### Container Name Already Exists

Cause:

```txt
old stopped container still exists
```

Fix:

```bash
docker rm service-name
```

A good `stop` command should handle this.

### Missing Environment Variables

Symptoms:

- service exits immediately
- token/API errors
- config undefined
- bot does not login
- API server fails on startup

Fix:

- check `.env.local`
- check `--env-file`
- check variable names
- check application config loading

### Logs Show Nothing Useful

Causes:

- app does not log startup errors
- process exits before logging
- logs checked for wrong container
- container name mismatch
- service redirects logs somewhere else

Fix:

- use consistent container names
- log startup config without secrets
- check `docker ps -a`
- check `docker logs`

### Docker Architecture Issues

On ARM devices, the image architecture matters.

Symptoms:

- exec format error
- container exits immediately
- binary cannot run

Fix direction:

- build for the target architecture
- use base images that support the device
- avoid forcing the wrong platform unless intentionally emulating

### Storage Filling Up

Docker images and containers can take space over time.

Useful checks:

```bash
docker images
docker ps -a
docker system df
```

Cleanup should be done carefully.

## What A Finished Setup Should Show

A strong finished setup should show:

- Dockerfile present
- `.env.example` documented
- `.env.local` used locally but not committed
- helper script with help output
- build command works
- run command works
- restart/rebuild behavior clear
- logs command works
- status command works
- cleanup command is safe
- README explains normal workflow
- service survives reboot if restart policy is used
- no manual long command required for common actions

## Evidence Worth Capturing

Useful evidence for this note would include:

- script file
- help output
- Dockerfile
- `.env.example`
- build output
- `docker ps` output
- logs output
- rebuild flow screenshot
- failed container example and fix
- README deployment section
- notes about architecture/platform if running on ARM

## Technical Assumptions

This setup assumes the service is small enough to run comfortably on the target machine.

It also assumes that Docker is already installed and working.

The script does not replace understanding Docker. It only makes repeated operations consistent.

## Key Risks

- hiding too much Docker behavior behind a script
- script deleting unrelated containers or images
- environment file accidentally committed
- old container using old code
- container name mismatch
- missing logs
- no rollback plan
- architecture mismatch on ARM devices
- disk usage growing over time
- script becoming more complicated than the service

## Current State

This note represents the deployment maintenance pattern used for small services.

The value is in creating a simple operational loop:

```txt
edit → build → stop old container → run new container → check logs
```

That loop is enough for many small services without needing a full CI/CD system.

## What This Note Does Not Claim

This note does not claim that helper scripts replace proper deployment platforms.

It does not claim that Docker is required for every small service.

It does not claim that this is a production-grade orchestration system.

It is a practical pattern for keeping small Docker services maintainable.

## Practical Takeaway

A Docker deployment script is useful when it prevents repeated mistakes.

The useful parts are:

- consistent image name
- consistent container name
- predictable env file
- one command for rebuilds
- easy logs
- safe stop/remove flow
- clear help output
- no unnecessary magic

That is enough to make small service deployment much less annoying.
