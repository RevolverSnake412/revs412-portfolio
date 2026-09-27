---
resume: false
title: "Deploying a Stateful Linux Service"
slug: "dedicated-server-deployment-on-linux"
summary: "Field notes from deploying and maintaining an extension-enabled stateful service on Linux, including service management, extension compatibility, ports, console access, updates, backups, and relay planning."
resumeSummary: >-
  Built an operations reference for deploying and maintaining an extension-enabled dedicated service on Linux. It covers directory layout, configuration, port and firewall exposure, systemd lifecycle management, console access, update and backup practices, log-based debugging, compatibility checks, and planning for event relays. The note treats hosting as an operational system rather than a single launch command: the process must start predictably, survive restarts, expose only intended services, preserve data, and remain diagnosable when extensions or updates fail.
category: "Server Hosting"
tags:
  - stateful-service
  - linux
  - vps
  - systemd
  - server-hosting
  - extensions
  - hosting
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Déploiement d’un service dédié sous Linux"
    category: "Hébergement de services"
    summary: "Notes sur le déploiement et la maintenance d’un service dédié sous Linux, avec systemd, ports, extensions, sauvegardes, accès console et dépannage."
    resumeSummary: >-
      Il couvre la mise en page des répertoires, la configuration, l'exposition au port et au pare-feu, la
      gestion du cycle de vie systémique, l'accès à la console, les pratiques de mise à jour et de sauvegarde,
      le débogage en ligne, les vérifications de compatibilité et la planification des relais d'événements. La
      note traite l'hébergement comme un système opérationnel plutôt qu'une seule commande de lancement : le
      processus doit démarrer de façon prévisible, survivre aux redémarrages, exposer uniquement les services
      prévus, préserver les données et rester diagnostique lorsque les extensions ou les mises à jour
      échouent.
    body: |-

      ## Pourquoi cette note existe

      Un service hébergé d'état semble simple de l'extérieur: déployer l'application, ouvrir le port requis, et le démarrer.

      Dans la pratique, un serveur que les gens utilisent réellement a besoin de plus de structure que cela.

      Il nécessite un temps d'exécution stable, une mise en page claire du répertoire, la gestion des services, la configuration du port, les sauvegardes, la gestion des mises à jour, les vérifications de compatibilité des extensions, les journaux, l'accès à la console, et un moyen de récupérer lorsque le serveur s'écrase ou une extension casse le démarrage.

      Cette note documente le côté pratique de l'hébergement d'un service dédié sur Linux. L'objectif n'est pas de le présenter comme un flex d'hébergement de service. L'objectif est de le traiter comme un petit service hébergé avec les utilisateurs, l'état, la configuration, et les besoins de maintenance.

      ## Contexte du serveur

      La configuration est basée sur un VPS Linux exécutant un service dédié compatible avec l'extension.

      La direction du serveur comprenait :

      - ExtensionInstallation de la pile d'application basée sur Loader
      - Gestion de la prolongation
      - gestion de service avec `systemd`
      - direction d'accès à la console du serveur
      - Exposition au port
      - logs et crash dépannage
      - sens du relais de communication externe
      - persistance des données sur les services
      - mise à jour et réflexion en retour

      La version exacte de la pile d'application et la liste d'extensions peuvent changer avec le temps, mais la structure opérationnelle reste utile.

      ## Ce que cette configuration veut prouver

      - des services dédiés sont des services d'État et doivent être traités avec soin
      - la gestion du service compte plus que l'utilisation manuelle d'un pot dans un terminal
      - compatibilité d'extension peut casser le démarrage et nécessite des tests contrôlés
      - les ports et les règles du pare-feu doivent être documentés
      - les données de service ont besoin de sauvegardes avant les mises à jour ou les modifications d'extension
      - l'accès à la console est important pour l'administration
      - les relais de communication externes ajoutent une valeur opérationnelle mais aussi un risque de configuration
      - un petit serveur hébergé bénéficie encore des journaux, du comportement de redémarrage et des étapes de mise à jour claires

      ## Pioche et outils utilisés

      ### Calque du serveur

      - Linux VPS
      - Administration de SSH
      - Durée d'exécution Java
      - fichiers de service dédiés
      - Répertoire des données persistantes
      - fichiers de configuration du serveur
      - Configuration du pare-feu/port

      ### pile d'application calque

      - service dédié
      - Extension Direction Loader
      - ExtensionLoader extensions
      - propriétés du serveur
      - liste blanche/gestion des opérations
      - données persistantes
      - Rapports d'accident et registres

      ### Couche de gestion des services

      - `systemd`
      - unité de service
      - Comportement de redémarrage
      - journaux des serveurs
      - direction d'entrée de la console
      - FIFO/direction de la poche si utile

      ### Direction de l'intégration

      - planification de relais de communication externe
      - direction du relais application-message
      - direction de l'événement/relais d'exécution
      - direction de confidentialité commande-sortie

      ## Construction prévue

      La construction prévue est un service dédié qui peut fonctionner en continu sur un hôte Linux sans dépendre d'une session SSH ouverte.

      Une configuration terminée devrait permettre :

      - le serveur démarre automatiquement ou via une commande de service
      - le serveur redémarre proprement au besoin
      - les journaux sont faciles à inspecter
      - les données de service persistent
      - les extensions sont installées intentionnellement
      - les extensions cassées peuvent être enlevées ou retournées
      - les ports sont documentés
      - les commandes console peuvent être envoyées en toute sécurité
      - sauvegardes sont prises avant les changements risqués
      - L'intégration de discord peut être ajoutée sans exposer la sortie inutile du serveur

      ## Présentation du répertoire

      Une mise en page de répertoire propre facilite la maintenance.

      Exemple de direction:

      ```txt
      /srv/dedicated-service/
        server.jar
        server.properties
        eula.txt
        service-data/
        extensions/
        config/
        logs/
        crash-reports/
      ```

      Un chemin dédié évite de mélanger des fichiers serveur avec des téléchargements aléatoires de répertoires.

      Les données importantes sont généralement:

      - `service-data/`
      - `extensions/`
      - `config/`
      - `server.properties`
      - fichiers liste blanche/op
      - journaux et rapports d'écrasement lors du débogage

      ## Propriétés du serveur

      `server.properties` contrôle les comportements importants tels que:

      - port serveur
      - utilisateurs max
      - mode en ligne
      - liste blanche
      - distance de vue
      - distance de simulation
      - paramètres des messages
      - difficulté
      - comportement des ressources

      Tout changement ici devrait être intentionnel parce que certains paramètres affectent les performances, la sécurité et le comportement de service.

      Le port serveur doit être enregistré clairement.

      Exemple :

      ```txt
      server-port=27767
      ```

      Utilisez le port configuré réel pour le serveur réel.

      ## Direction du port et du pare-feu

      Un service dédié a besoin d'un port TCP ouvert pour les utilisateurs de se connecter.

      Le chemin d'accès dépend de l'endroit où le serveur est hébergé :

      - Pare-feu VPS
      - Groupe de sécurité cloud
      - pare-feu local
      - pare-feu hôte
      - Docker/couche réseau si utilisé

      Les vérifications devraient comprendre :

      ```bash
      ss -lntp | grep java
      ```

      et test de connexion externe depuis un autre réseau.

      Si le port est ouvert localement mais qu'il n'est pas accessible à l'extérieur, le problème peut être un pare-feu, des règles réseau du fournisseur ou une mauvaise configuration du port.

      ## Gestion des services avec systèmed

      Un serveur approprié devrait fonctionner sous un gestionnaire de service.

      Une exécution manuelle comme celle-ci est utile pour les tests :

      ```bash
      java -Xms2G -Xmx4G -jar server.jar nogui
      ```

      Mais l'hébergement de style production devrait utiliser `systemd`.

      Un service donne:

      - Commandes de démarrage/arrêt/redémarrage
      - Journaux
      - direction de redémarrage automatique
      - démarrage après redémarrage si activé
      - répertoire de travail cohérent

      Commandes utiles :

      ```bash
      systemctl status dedicated-service
      journalctl -u dedicated-service -f
      systemctl restart dedicated-service
      ```

      Le nom du service peut être spécifique au projet.

      ## Direction d'accès à la console

      L'administration de la pile d'applications nécessite souvent des commandes console.

      Exemples:

      ```txt
      say Server restarting soon
      whitelist add <user>
      op <user>
      save-all
      stop
      ```

      Si le serveur fonctionne sous `systemd`, l'entrée directe de console n'est pas toujours simple.

      Une approche est l'utilisation d'un chemin d'entrée FIFO ou basé sur socket afin que les commandes puissent être envoyées au serveur en cours d'exécution.

      Exemple :

      ```txt
      /srv/dedicated-service.stdin
      ```

      Une commande peut alors être envoyée dans le processus serveur si le service est construit pour lire à partir de ce FIFO.

      Ceci doit être configuré avec soin car l'accès à la console peut affecter le serveur en direct.

      ## sens du serveur étendu

      Un serveur compatible avec l'extension a besoin de plus de soin qu'un serveur de base.

      Contrôles importants:

      - version de pile d'application
      - ExtensionVersion Loader
      - versions d'extension
      - extensions côté serveur ou côté client
      - extensions de dépendance
      - fichiers de configuration
      - Rapports d'accident
      - compatibilité avec le client

      Une extension peut échouer parce que :

      - mauvaise version de pile d'application
      - mauvaise version du chargeur
      - dépendance manquante
      - extension client uniquement installée sur le serveur
      - combinaison de prolongation incompatible
      - config problème de migration
      - problème d'architecture/d'exécution

      ## Exemple d'extension Direction

      Une petite configuration ExtensionLoader peut inclure des extensions d'utilité et d'expérience client, mais la liste finale doit être testée.

      Voici des exemples de cette orientation :

      - Jade
      - Addons de jade
      - direction de l'extension de la surveillance et de la visualisation cartographique
      - Pas de discussion Signaler direction
      - sens du relais de communication externe

      Certaines extensions peuvent devoir être supprimées si elles rompent le démarrage ou entrent en conflit avec la version du serveur.

      L'important est de tester les changements d'extension une étape à la fois.

      ## Mettre à jour le flux de travail

      La mise à jour d'un service dédié à l'extension ne devrait pas être aléatoire.

      Une mise à jour plus sûre :

      1. Arrêtez le serveur
      2. données de service de sauvegarde et configuration
      3. mettre à jour un groupe de fichiers
      4. Démarrer le serveur
      5. vérifier les journaux
      6. joindre et tester
      7. garder les fichiers de retour temporaire

      Ne mettez pas à jour la pile d'application, le chargeur et toutes les extensions en même temps, sauf si vous êtes prêt à déboguer plusieurs sources de défaillance.

      ## Direction de sauvegarde

      Les sauvegardes comptent parce que les données de service sont l'état réel du serveur.

      Cibles minimales de sauvegarde & #160;:

      ```txt
      service-data/
      server.properties
      extensions/
      config/
      whitelist.json
      ops.json
      banned-users.json
      banned-ips.json
      ```

      Une simple sauvegarde peut être :

      ```bash
      tar -czf dedicated-service-backup-$(date +%F).tar.gz service-data server.properties extensions config
      ```

      Avant les modifications d'extension ou les mises à jour de version, prenez une sauvegarde.

      ## Rapports sur les journaux et les accidents

      Les journaux sont le premier endroit à vérifier lorsque le serveur échoue.

      Voies importantes:

      ```txt
      logs/latest.log
      crash-reports/
      ```

      Contrôles utiles:

      ```bash
      tail -n 100 logs/latest.log
      journalctl -u dedicated-service -n 100
      ```

      Cherchez :

      - dépendance manquante de l'extension
      - inadéquation de la version
      - défaillance de la liaison du port
      - Erreurs de mémoire Java
      - erreurs d'autorisation
      - configuration corrompue
      - chemin du fichier de rapport de plantage

      ## Direction du relais de communication externe

      Un relais de communication externe peut connecter des messages et événements d'application à un canal de communication configuré.

      Objectifs utiles du pont :

      - relais en application chat à Discord
      - relayez les messages de discord à la discussion en application
      - afficher les messages de jointure/leave si désiré
      - afficher les réalisations/événements si configuré
      - masque la sortie de commande ou les messages d'administration sensibles
      - éviter la fuite des commandes de modération/admin

      Le pont doit être traité comme une intégration, pas seulement un jouet de chat.

      Décisions importantes :

      - quel canal reçoit les messages
      - si les commandes sont relayées
      - si les réalisations sont relayées
      - si la sortie d'administration est cachée
      - ce qui se passe si Discord est hors ligne
      - comment les jetons et les jetons Web sont stockés

      Les secrets ne devraient jamais être stockés directement dans la config publique.

      ## Direction des performances

      La performance du service dédié dépend:

      - Performances CPU simple fil
      - Allocation de la RAM
      - distance de vue
      - distance de simulation
      - Nombre d ' utilisateurs
      - extensions
      - production de données sur les services
      - Vitesse de stockage
      - Version Java et drapeaux

      Plus de RAM ne corrige pas chaque problème.

      Un petit serveur doit régler :

      ```txt
      view-distance
      simulation-distance
      max-users
      autosave expectations
      extension list
      ```

      Le serveur doit être dimensionné pour une utilisation réelle attendue, et non une charge maximale imaginaire.

      ## Décisions pratiques

      ### Utiliser systemd au lieu de sessions de terminal manuel

      Le serveur ne devrait pas dépendre d'une session SSH restant ouverte.

      `systemd` donne un cycle de vie de service prévisible.

      ### Conserver les sauvegardes avant les changements risqués

      les serveurs étendus peuvent se casser de façon inattendue.

      sauvegardes de données de service sont moins chers que d'essayer de réparer l'état corrompu plus tard.

      ### Extensions d'essai progressives

      Si cinq extensions sont modifiées en même temps et que le serveur échoue, le débogage devient plus lent.

      Changez moins, testez plus.

      ### Hypothèses distinctes côté serveur et côté client

      Certaines extensions ne sont utiles que sur le client. L'installation du mauvais type sur le serveur peut causer des problèmes de démarrage.

      ### Masquer la sortie de commande des ponts lorsque nécessaire

      Un relais de communication externe ne doit pas fuir les commandes administratives, la sortie de console sensible ou les erreurs internes dans les canaux publics.

      ### Documenter le port et la méthode de connexion

      Un serveur est plus facile à prendre en charge lorsque le port, l'adresse et le chemin du pare-feu sont connus.

      ## Points communs de défaillance

      ### Le serveur ne démarre pas

      Causes probables:

      - mauvaise version Java
      - Voie de jarre cassée
      - non accepté par l'ALUE
      - mauvais répertoire de travail
      - version d'extension inadéquation
      - dépendance manquante
      - configuration corrompue
      - pas assez de mémoire
      - problème de permission de fichier

      ### utilisateurs ne peuvent pas se connecter

      Causes probables:

      - mauvais port
      - pare-feu fermé
      - serveur lié à une mauvaise adresse
      - règle de sécurité cloud manquante
      - serveur ne fonctionne pas réellement
      - DNS/domaine pointant mal
      - client utilisant une mauvaise version de pile d'application
      - l'inadéquation de l'extension

      ### Le serveur démarre puis crashe

      Causes probables:

      - incompatibilité de l'extension
      - corruption de données de service
      - config problème de migration
      - pression de mémoire
      - datapack/resource pack cassé
      - crash déclenché par une partie ou une entité chargée

      ### Le relais de communication externe ne fonctionne pas

      Causes probables:

      - faux jeton/webhook
      - bot permissions manquantes
      - ID du canal faux
      - bridge extension/plugin version inadéquation
      - serveur ne charge pas le pont
      - relais de commande désactivé
      - Problème de discorde API/réseau

      ### Les commandes Console sont difficiles à envoyer

      Causes probables:

      - serveur sous système sans stdin
      - pas de chemin d'entrée FIFO/Socket
      - utilisant la mauvaise conception du service
      - essayer de s'attacher à un processus non interactif

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - fichiers serveur dans un répertoire dédié
      - Version Java documentée
      - version du serveur documentée
      - ExtensionLoader/loader version documentée si utilisée
      - extensions et configs organisées
      - service systémique
      - chemin port/pare-feu documenté
      - Registres accessibles
      - sauvegardes disponibles
      - mise à jour du flux de travail
      - méthode d'accès à la console documentée
      - comportement de relais de communication externe défini
      - jetons/configs sensibles protégés

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - arborescence des répertoires
      - Sortie `systemctl status`
      - Échantillon de sortie `journalctl`
      - journal de démarrage du serveur
      - liste des extensions
      - extrait des propriétés du serveur
      - pare-feu ou règle de port fournisseur screenshot
      - Capture d'écran de connexion client réussie
      - sauvegarde de la liste des archives
      - capture d'écran du relais de communication externe
      - test de commande console
      - Exemple de rapport d'accident et correction

      ## Hypothèses techniques

      Cette configuration suppose que le serveur est assez petit pour le VPS ou l'hôte choisi.

      Il suppose également que le propriétaire du serveur peut accéder à l'hôte via SSH et gérer les fichiers de service.

      Pour les serveurs étendus, il suppose que les versions client et serveur sont alignées.

      La configuration suppose également que le serveur n'est pas un remplacement de l'infrastructure d'hébergement professionnelle. C'est un service pratique auto-organisé avec responsabilité de maintenance.

      ## Principaux risques

      - perte de données de service sans sauvegardes
      - mises à jour d'extension interrompues
      - mauvaise version Java
      - inadéquation du port pare-feu/fournisseur
      - allocation de mémoire trop élevée ou trop faible
      - commande bridge fuite de sortie sensible
      - boucle de redémarrage de service cachant le vrai crash
      - pas de plan de recul après les mises à jour
      - stockage remplissage avec des journaux / sauvegardes
      - exposition du serveur public sans contrôle de modération
      - en s'appuyant sur des sessions SSH manuelles au lieu d'un service

      ## État actuel

      Cette note représente la direction opérationnelle d'un service dédié à l'extension sur Linux.

      La principale valeur est la structure d'hébergement: gestion des services, contrôle des extensions, sauvegardes, journaux, documentation du port et planification de l'intégration.

      Le serveur peut évoluer avec de nouvelles extensions ou intégrations, mais le modèle de maintenance doit rester stable.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas être un guide d'hébergement universel de pile d'applications.

      Elle ne prétend pas que chaque serveur ait besoin d'extensions ou d'un relais de communication externe.

      Il ne prétend pas qu'un VPS bon marché est toujours suffisant pour chaque serveur compatible avec l'extension.

      C'est une note de champ sur la transformation d'un service dédié en un petit service Linux durable.

      ## À emporter pratique

      Un service dédié n'est pas seulement un fichier jar.

      La configuration utile comprend:

      - disposition claire du répertoire
      - gestion des services
      - port documenté
      - modifications de l'extension contrôlée
      - sauvegardes
      - journaux
      - accès à la console
      - Mettre à jour le flux de travail
      - frontières de l'intégration

      C'est ce qui le rend durable après le premier lancement réussi.
seoTitle: "Deploying a Stateful Linux Service"
seoDescription: "A practical note about deploying an extension-enabled stateful service on Linux with systemd service management, ports, extensions, backups, console access, and troubleshooting."
---

## Why This Note Exists

A stateful hosted service looks simple from the outside: deploy the application, open the required port, and start it.

In practice, a server that people actually use needs more structure than that.

It needs a stable runtime, clear directory layout, service management, port configuration, backups, update handling, extension compatibility checks, logs, console access, and a way to recover when the server crashes or an extension breaks startup.

This note documents the practical side of hosting a dedicated service on Linux. The goal is not to present it as a service-hosting flex. The goal is to treat it like a small hosted service with users, state, configuration, and maintenance needs.

## Server Context

The setup is based on a Linux VPS running an extension-enabled dedicated service.

The server direction included:

- ExtensionLoader-based application stack setup
- extension management
- service management with `systemd`
- server console access direction
- port exposure
- logs and crash troubleshooting
- external communication relay direction
- service-data persistence
- update and rollback thinking

The exact application stack version and extension list can change over time, but the operational structure remains useful.

## What This Setup Is Meant To Prove

- dedicated services are stateful services and should be treated carefully
- service management matters more than manually running a jar in a terminal
- extension compatibility can break startup and needs controlled testing
- ports and firewall rules should be documented
- service data needs backups before updates or extension changes
- console access is important for administration
- external communication relays add operational value but also add configuration risk
- a small hosted server still benefits from logs, restart behavior, and clear update steps

## Stack and Tools Used

### Server Layer

- Linux VPS
- SSH administration
- Java runtime
- dedicated service files
- persistent-data directory
- server configuration files
- firewall/port configuration

### application stack Layer

- dedicated service
- ExtensionLoader direction
- ExtensionLoader extensions
- server properties
- whitelist/op management
- persistent data
- crash reports and logs

### Service Management Layer

- `systemd`
- service unit
- restart behavior
- server logs
- console input direction
- FIFO/socket direction where useful

### Integration Direction

- external communication relay planning
- application-message relay direction
- event/achievement relay direction
- command-output privacy direction

## Intended Build

The intended build is a dedicated service that can run continuously on a Linux host without depending on an open SSH session.

A finished setup should allow:

- server starts automatically or through a service command
- server restarts cleanly when needed
- logs are easy to inspect
- service data persists
- extensions are installed intentionally
- broken extensions can be removed or rolled back
- ports are documented
- console commands can be sent safely
- backups are taken before risky changes
- Discord integration can be added without exposing unnecessary server output

## Directory Layout

A clean directory layout makes maintenance easier.

Example direction:

```txt
/srv/dedicated-service/
  server.jar
  server.properties
  eula.txt
  service-data/
  extensions/
  config/
  logs/
  crash-reports/
```

A dedicated path avoids mixing server files with random home-directory downloads.

The important data is usually:

- `service-data/`
- `extensions/`
- `config/`
- `server.properties`
- whitelist/op files
- logs and crash reports when debugging

## Server Properties

`server.properties` controls important behavior such as:

- server port
- max users
- online mode
- whitelist
- view distance
- simulation distance
- message settings
- difficulty
- resource behavior

Any change here should be intentional because some settings affect performance, security, and service behavior.

The server port should be recorded clearly.

Example:

```txt
server-port=27767
```

Use the actual configured port for the real server.

## Port and Firewall Direction

A dedicated service needs an open TCP port for users to connect.

The access path depends on where the server is hosted:

- VPS firewall
- cloud security group
- local firewall
- host firewall
- Docker/network layer if used

Checks should include:

```bash
ss -lntp | grep java
```

and external connection testing from another network.

If the port is open locally but not reachable externally, the issue may be firewall, provider network rules, or wrong port configuration.

## Service Management With systemd

A proper server should run under a service manager.

Manual execution like this is useful for testing:

```bash
java -Xms2G -Xmx4G -jar server.jar nogui
```

But production-style hosting should use `systemd`.

A service gives:

- start/stop/restart commands
- logs through journal
- automatic restart direction
- startup after reboot if enabled
- consistent working directory

Useful commands:

```bash
systemctl status dedicated-service
journalctl -u dedicated-service -f
systemctl restart dedicated-service
```

The service name can be project-specific.

## Console Access Direction

application stack administration often needs console commands.

Examples:

```txt
say Server restarting soon
whitelist add <user>
op <user>
save-all
stop
```

If the server runs under `systemd`, direct console input is not always simple.

One approach is using a FIFO or socket-based input path so commands can be sent to the running server.

Example concept:

```txt
/srv/dedicated-service.stdin
```

A command can then be sent into the server process if the service is built to read from that FIFO.

This should be set up carefully because console access can affect the live server.

## extended Server Direction

An extension-enabled server needs more care than a baseline server.

Important checks:

- application stack version
- ExtensionLoader version
- extension versions
- server-side vs client-side extensions
- dependency extensions
- config files
- crash reports
- client compatibility

A extension can fail because:

- wrong application stack version
- wrong loader version
- missing dependency
- client-only extension installed on server
- incompatible extension combination
- config migration issue
- architecture/runtime problem

## Example extension Direction

A small ExtensionLoader setup can include utility and client-experience extensions, but the final list should be tested.

Examples from this direction included:

- Jade
- Jade Addons
- monitoring and map-visualization extension direction
- No Chat Reports direction
- external communication relay direction

Some extensions may need to be removed if they break startup or conflict with the server version.

The important practice is to test extension changes one step at a time.

## Update Workflow

Updating an extension-enabled dedicated service should not be random.

A safer update workflow:

1. stop the server
2. backup service data and config
3. update one group of files
4. start server
5. check logs
6. join and test
7. keep rollback files temporarily

Do not update application stack, loader, and all extensions at once unless you are ready to debug multiple failure sources.

## Backup Direction

Backups matter because service data is the real state of the server.

Minimum backup targets:

```txt
service-data/
server.properties
extensions/
config/
whitelist.json
ops.json
banned-users.json
banned-ips.json
```

A simple backup can be:

```bash
tar -czf dedicated-service-backup-$(date +%F).tar.gz service-data server.properties extensions config
```

Before extension changes or version upgrades, take a backup.

## Logs and Crash Reports

Logs are the first place to check when the server fails.

Important paths:

```txt
logs/latest.log
crash-reports/
```

Useful checks:

```bash
tail -n 100 logs/latest.log
journalctl -u dedicated-service -n 100
```

Look for:

- missing extension dependency
- version mismatch
- port bind failure
- Java memory errors
- permission errors
- corrupted config
- crash report file path

## External Communication Relay Direction

An external communication relay can connect application messages and events with a configured communication channel.

Useful bridge goals:

- relay in-application chat to Discord
- relay Discord messages to in-application chat
- show join/leave messages if desired
- show achievements/events if configured
- hide command output or sensitive admin messages
- avoid leaking moderation/admin commands

The bridge should be treated as an integration, not just a chat toy.

Important decisions:

- which channel receives messages
- whether commands are relayed
- whether achievements are relayed
- whether admin output is hidden
- what happens if Discord is offline
- how tokens/webhooks are stored

Secrets should never be stored directly in public config.

## Performance Direction

dedicated service performance depends on:

- CPU single-thread performance
- RAM allocation
- view distance
- simulation distance
- number of users
- extensions
- service data generation
- storage speed
- Java version and flags

More RAM does not fix every problem.

A small server should tune:

```txt
view-distance
simulation-distance
max-users
autosave expectations
extension list
```

The server should be sized for real expected use, not imaginary maximum load.

## Practical Decisions

### Use systemd instead of manual terminal sessions

The server should not depend on an SSH session staying open.

`systemd` gives a predictable service lifecycle.

### Keep backups before risky changes

extended servers can break unexpectedly.

service data backups are cheaper than trying to repair corrupted state later.

### Test extensions incrementally

If five extensions are changed at once and the server fails, debugging becomes slower.

Change less, test more.

### Separate server-side and client-side assumptions

Some extensions are only useful on the client. Installing the wrong type on the server can cause startup problems.

### Hide command output from bridges where needed

An external communication relay should not leak admin commands, sensitive console output, or internal errors into public channels.

### Document the port and connection method

A server is easier to support when the port, address, and firewall path are known.

## Common Failure Points

### Server Does Not Start

Likely causes:

- wrong Java version
- broken jar path
- missing EULA acceptance
- bad working directory
- extension version mismatch
- missing dependency
- corrupted config
- not enough memory
- file permission issue

### users Cannot Connect

Likely causes:

- wrong port
- firewall closed
- server bound to wrong address
- cloud security rule missing
- server not actually running
- DNS/domain pointing wrong
- client using wrong application stack version
- extension mismatch

### Server Starts Then Crashes

Likely causes:

- extension incompatibility
- service data corruption
- config migration issue
- memory pressure
- broken datapack/resource pack
- crash triggered by a loaded chunk or entity

### External Communication Relay Does Not Work

Likely causes:

- wrong token/webhook
- bot missing permissions
- channel ID wrong
- bridge extension/plugin version mismatch
- server not loading the bridge
- command relay disabled
- Discord API/network issue

### Console Commands Are Hard to Send

Likely causes:

- server running under systemd without stdin
- no FIFO/socket input path
- using the wrong service design
- trying to attach to a non-interactive process

## What A Finished Setup Should Show

A strong finished setup should show:

- server files in a dedicated directory
- Java version documented
- server version documented
- ExtensionLoader/loader version documented if used
- extensions and configs organized
- systemd service working
- port/firewall path documented
- logs accessible
- backups available
- update workflow written down
- console access method documented
- external communication relay behavior defined
- sensitive tokens/configs protected

## Evidence Worth Capturing

Useful evidence for this note would include:

- directory tree
- `systemctl status` output
- `journalctl` output sample
- server startup log
- extension list
- server properties excerpt
- firewall or provider port rule screenshot
- successful client connection screenshot
- backup archive list
- external communication relay test screenshot
- console command test
- crash report example and fix

## Technical Assumptions

This setup assumes the server is small enough for the chosen VPS or host.

It also assumes the server owner can access the host through SSH and manage service files.

For extended servers, it assumes the client and server versions are aligned.

The setup also assumes that the server is not a replacement for professional hosting infrastructure. It is a practical self-hosted service with maintenance responsibility.

## Key Risks

- service data loss without backups
- broken extension updates
- wrong Java version
- firewall/provider port mismatch
- memory allocation too high or too low
- command bridge leaking sensitive output
- service restart loop hiding the real crash
- no rollback plan after updates
- storage filling up with logs/backups
- public server exposure without moderation controls
- relying on manual SSH sessions instead of a service

## Current State

This note represents the operational direction for running an extension-enabled dedicated service on Linux.

The main value is the hosting structure: service management, extension control, backups, logs, port documentation, and integration planning.

The server can evolve with new extensions or integrations, but the maintenance model should stay stable.

## What This Note Does Not Claim

This note does not claim to be a universal application stack hosting guide.

It does not claim that every server needs extensions or an external communication relay.

It does not claim that a cheap VPS is always enough for every extension-enabled server.

It is a field note about turning a dedicated service into a maintainable small Linux service.

## Practical Takeaway

A dedicated service is not just a jar file.

The useful setup includes:

- clear directory layout
- service management
- documented port
- controlled extension changes
- backups
- logs
- console access
- update workflow
- integration boundaries

That is what makes it maintainable after the first successful launch.
