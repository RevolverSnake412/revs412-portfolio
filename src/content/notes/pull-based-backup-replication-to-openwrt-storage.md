---
resume: true
title: "Pull-Based Backup Replication to OpenWrt Storage"
slug: "pull-based-backup-replication-to-openwrt-storage"
summary: "Designed and verified a pull-based backup replication path from a VPS-hosted stateful service to an OpenWrt Raspberry Pi with dedicated external storage, separating fast recovery points from an independently retained local archive."
resumeSummary: >-
  Designed and verified a pull-based recovery workflow for a VPS-hosted stateful service, replicating completed backups to an OpenWrt Raspberry Pi with dedicated external storage. Used a restricted SSH identity and rsync so the local system can read only the intended backup artifacts, resume interrupted transfers, and apply retention only after a successful sync. The recovery set includes service state, configuration, and authentication data, creating a practical second storage boundary beyond the VPS.
category: "Infrastructure Operations"
tags:
  - backup-recovery
  - disaster-recovery
  - openwrt
  - raspberry-pi
  - rsync
  - ssh
  - external-storage
  - vps
  - self-managed-infrastructure
date: "2026-08-22"
updated: "2026-08-24"
featured: true
published: true
translations:
  fr:
    title: "Réplication de sauvegardes vers un stockage OpenWrt"
    category: "Opérations d’infrastructure"
    summary: "Conception et vérification d’une réplication de sauvegardes à l’initiative d’un Raspberry Pi OpenWrt vers un disque externe dédié, séparée des points de récupération conservés sur le VPS."
    resumeSummary: >-
      Conçu et vérifié un flux de travail de récupération basé sur la traction pour un service d'état hébergé
      VPS, en reproduisant les sauvegardes terminées à un OpenWrt Raspberry Pi avec stockage externe dédié.
      Utilisez une identité SSH restreinte et rsync afin que le système local puisse lire seulement les
      artefacts de sauvegarde prévus, reprendre les transferts interrompus, et appliquer la rétention
      seulement après une synchronisation réussie. L'ensemble de récupération comprend l'état de service, la
      configuration et les données d'authentification, créant une deuxième limite de stockage pratique au-delà
      du VPS.
    body: |-

      ## Pourquoi cette note existe

      Les sauvegardes stockées uniquement sur le même VPS sont utiles, mais elles ne protègent pas contre la perte du VPS, de son stockage ou de l'accès au compte qui l'accueille.

      Cette note documente une deuxième couche de récupération pour un service d'état : les sauvegardes terminées restent disponibles sur le VPS pour un retour rapide, tandis qu'un OpenWrt Raspberry Pi tire les artefacts de sauvegarde complétés sur un disque externe dédié.

      L'important choix de conception est que l'appareil local tire du VPS. Le réseau domestique n'accepte pas l'accès entrant, et le VPS ne peut pas lancer une connexion au réseau local.

      ## Objectifs de conception

      Le système a été conçu pour fournir:

      - points de récupération rapides sur le VPS
      - une copie locale conservée séparément sur le stockage physique
      - pas de SSH public ou de transfert de port dans le réseau d'origine
      - une identité locale qui ne peut pas modifier le VPS
      - Gestion sûre des transferts interrompus
      - rétention qui ne supprime jamais des copies saines après une synchronisation ratée
      - matériel de récupération au-delà du répertoire de données primaires

      Un lecteur externe local partage toujours le même site physique que le routeur. Il fournit toutefois une limite de stockage et d'accès séparée du VPS.

      ## Architecture

      ```text
      VPS-hosted stateful service
              |
              | creates completed backup archives
              v
      VPS backup repository
              |
              | restricted SSH identity + rsync
              | initiated by the local device
              v
      OpenWrt Raspberry Pi
              |
              v
      Dedicated external ext4 storage
      ```

      Le lecteur externe est monté séparément du stockage du système OpenWrt. Cela évite de traiter le support de démarrage du routeur comme une cible de sauvegarde et donne à l'archive sa propre capacité, système de fichiers et chemin de remplacement.

      ## Ce qui est conservé

      Un ensemble de récupération utile doit inclure plus que le répertoire de données actif.

      Les artefacts de sauvegarde reproduits couvrent les données de service d'état ainsi que le matériel opérationnel nécessaire pour le restaurer de manière cohérente:

      - service primaire ou état mondial
      - configuration du serveur et du service
      - accès-contrôle et données d'identité
      - autoriser les listes, les fichiers d'opérateurs ou les dossiers politiques, le cas échéant
      - configuration d'extension et d'intégration
      - paramètres requis pour reproduire le service en cours d'exécution

      Le point est de récupérer un système de travail, pas seulement un dossier de données partiel qui a encore besoin d'une configuration importante reconstruite à partir de la mémoire.

      ## Modèle d'accès par tirage

      Le périphérique OpenWrt lance chaque transfert.

      Son identité SSH est limitée à la source de sauvegarde. Elle ne peut pas ouvrir un shell interactif, modifier le service, parcourir des fichiers VPS non liés, ou écrire à l'hôte distant. Le côté distant expose un chemin de sauvegarde fixe par une commande d'expéditeur contrôlée.

      Cela crée une limite utile:

      ```text
      OpenWrt can read completed backup artifacts
      OpenWrt cannot administer the VPS
      VPS cannot initiate access to the home network
      ```

      C'est plus sûr et plus simple que d'exposer un service de routeur à Internet seulement pour que le VPS puisse pousser des fichiers vers l'intérieur.

      ## Synchronisation Comportement

      Le Pi vérifie le dépôt de sauvegarde sur un calendrier et ne synchronise que les artefacts complétés.

      `rsync` est utilisé parce qu'il traite les cas opérationnels qui comptent ici:

      - de nouvelles archives sont copiées sans recopier celles existantes
      - les transferts interrompus peuvent reprendre en toute sécurité
      - Les artefacts modifiés peuvent être rafraîchis
      - l'archive locale peut rattraper après la perte temporaire de réseau
      - sortie de transfert peut être enregistré pour l'inspection

      Le travail utilise un verrou de sorte qu'un transfert exceptionnellement lent ne peut pas se chevaucher avec la prochaine exécution prévue.

      ## Conservation indépendante

      La rétention est délibérément indépendante à chaque couche.

      Le VPS garde un jeu de roulis court pour le retour immédiat. Le lecteur externe local conserve sa propre archive roulante, de sorte qu'il ne perd pas les points de récupération plus anciens simplement parce que le VPS tourne sa fenêtre courte.

      Si la connexion, le stockage ou le transfert échoue, le travail s'éteint avant de supprimer les anciennes copies locales. Cette commande empêche une opération de sauvegarde échouée de devenir un événement de nettoyage destructeur.

      Le nombre exact de copies est une décision de capacité et de récupération-fenêtre, pas un numéro magique. Il devrait être examiné lorsque la taille de sauvegarde, le taux de changement, le stockage disponible, ou les changements de point de récupération acceptables.

      ## Décisions de stockage

      La cible locale est un disque dur externe de 2,5 pouces, formaté ext4 et monté sur OpenWrt Raspberry Pi.

      C'était intentionnel :

      - les supports de démarrage de routeur ne sont pas traités comme stockage d'archives
      - un lecteur séparé peut être remplacé sans reconstruire le routeur
      - ext4 donne des autorisations Linux prévisibles et le comportement du système de fichiers
      - le lecteur a une capacité suffisante pour une fenêtre de rétention significative
      - Windows peut être maintenu en lecture seule lors de l'inspection du disque, en évitant l'initialisation accidentelle ou les dommages du système de fichiers

      Le lecteur est monté automatiquement au démarrage, et la tâche de sauvegarde utilise le montage stable plutôt qu'un nom de périphérique supposé.

      ## Vérification

      La conception a été vérifiée avec de vrais artefacts de sauvegarde plutôt qu'un fichier de configuration réussi.

      Vérifications incluses:

      - confirmant le lecteur externe séparément du disque système OpenWrt avant de le formater
      - confirmant le montage du système de fichiers et la capacité disponible
      - prouvant que le compte restreint pouvait accéder uniquement à l'arborescence de sauvegarde prévue
      - compléter un miroir initial sur le disque externe
      - vérifier que l'état de service, les données d'authentification et la configuration ont été inclus
      - tester un chemin de restauration à partir du système de sauvegarde
      - confirmant que les références de conservation étaient présentes après les sauvegardes programmées

      ## Enseignements opérationnels

      Le résultat le plus important est la séparation des responsabilités:

      ```text
      VPS: creates fast recovery points
      OpenWrt Pi: pulls a separate archive without inbound exposure
      External drive: holds the retained local recovery set
      ```

      Une erreur de service peut être repoussée rapidement du VPS. Une perte de niveau VPS laisse encore une copie stockée indépendamment. Un problème de routeur ou de lecteur peut être réparé sans lui accorder un large contrôle sur le serveur de production.

      Le travail est un bon exemple de la fiabilité de l'infrastructure définie par les limites d'accès, l'exhaustivité de la récupération et le comportement testé, pas seulement en ayant un dossier appelé `backups`.
seoTitle: "Pull-Based Backup Replication to OpenWrt Storage"
seoDescription: "A practical backup design that replicates VPS backups to OpenWrt external storage through restricted SSH and rsync, with independent retention and recovery verification."
---

## Why This Note Exists

Backups stored only on the same VPS are useful, but they do not protect against losing the VPS, its storage, or access to the account that hosts it.

This note documents a second recovery layer for a stateful service: completed backups remain available on the VPS for quick rollback, while an OpenWrt Raspberry Pi pulls completed backup artifacts to a dedicated external drive. The two locations have separate retention windows and separate failure modes.

The important design choice is that the local device pulls from the VPS. The home network does not accept inbound access, and the VPS cannot initiate a connection into the local network.

## Design Goals

The system was designed to provide:

- fast recovery points on the VPS
- a separately retained local copy on physical storage
- no public SSH or port forwarding into the home network
- a local identity that cannot modify the VPS
- safe handling of interrupted transfers
- retention that never deletes healthy copies after a failed sync
- recovery material beyond the primary data directory

This is not a claim that one device eliminates every risk. A local external drive still shares the same physical site as the router. It does, however, provide a separate storage and access boundary from the VPS.

## Architecture

```text
VPS-hosted stateful service
        |
        | creates completed backup archives
        v
VPS backup repository
        |
        | restricted SSH identity + rsync
        | initiated by the local device
        v
OpenWrt Raspberry Pi
        |
        v
Dedicated external ext4 storage
```

The external drive is mounted separately from the OpenWrt system storage. That avoids treating the router’s boot media as a backup target and gives the archive its own capacity, filesystem, and replacement path.

## What Is Preserved

A useful recovery set has to include more than the active data directory.

The replicated backup artifacts cover the stateful service data together with the operational material required to restore it coherently:

- primary service or world state
- server and service configuration
- access-control and identity data
- allowlists, operator or policy files where applicable
- extension and integration configuration
- settings required to reproduce the running service

The point is to recover a working system, not only a partial data folder that still needs important configuration reconstructed from memory.

## Pull-Based Access Model

The OpenWrt device initiates every transfer.

Its SSH identity is restricted to the backup source. It cannot open an interactive shell, alter the service, browse unrelated VPS files, or write back to the remote host. The remote side exposes a fixed backup path through a controlled sender command.

That creates a useful boundary:

```text
OpenWrt can read completed backup artifacts
OpenWrt cannot administer the VPS
VPS cannot initiate access to the home network
```

This is safer and simpler than exposing a router service to the internet only so the VPS can push files inward.

## Synchronization Behaviour

The Pi checks the backup repository on a schedule and synchronizes only completed artifacts.

`rsync` is used because it handles the operational cases that matter here:

- new archives are copied without recopying existing ones
- interrupted transfers can resume safely
- changed completed artifacts can be refreshed
- the local archive can catch up after temporary network loss
- transfer output can be logged for inspection

The job uses a lock so an unusually slow transfer cannot overlap with the next scheduled run.

## Independent Retention

Retention is deliberately independent at each layer.

The VPS keeps a short rolling set for immediate rollback. The local external drive keeps its own rolling archive, so it does not lose older recovery points merely because the VPS rotates its short window.

The retention step runs only after a successful synchronization. If the connection, storage, or transfer fails, the job exits before deleting older local copies. That ordering prevents a failed backup run from becoming a destructive cleanup event.

The exact copy count is a capacity and recovery-window decision, not a magic number. It should be reviewed when backup size, change rate, available storage, or the acceptable recovery point changes.

## Storage Decisions

The local target is a dedicated 2.5-inch external hard drive formatted as ext4 and mounted on the OpenWrt Raspberry Pi.

This was intentional:

- router boot media is not treated as archival storage
- a separate drive can be replaced without rebuilding the router
- ext4 gives predictable Linux permissions and filesystem behaviour
- the drive has enough capacity for a meaningful retention window
- Windows can be kept read-only when inspecting the disk, avoiding accidental initialization or filesystem damage

The drive is mounted automatically at boot, and the backup job uses the stable mount rather than an assumed device name.

## Verification

The design was verified with real backup artifacts rather than only a successful-looking configuration file.

Checks included:

- confirming the external drive separately from the OpenWrt system disk before formatting it
- confirming the filesystem mount and available capacity
- proving the restricted account could access only the intended backup tree
- completing an initial mirror to the external drive
- verifying that service state, authentication data, and configuration were included
- testing a restore path from the backup system
- confirming that retention references were present after scheduled backups

## Operational Lessons

The most important result is the separation of responsibilities:

```text
VPS: creates fast recovery points
OpenWrt Pi: pulls a separate archive without inbound exposure
External drive: holds the retained local recovery set
```

That division makes failure handling more deliberate. A service mistake can be rolled back quickly from the VPS. A VPS-level loss still leaves an independently stored copy. A router or drive issue can be repaired without granting it broad control over the production server.

The work is a good example of infrastructure reliability being defined by access boundaries, recovery completeness, and tested behaviour—not merely by having a folder called `backups`.
