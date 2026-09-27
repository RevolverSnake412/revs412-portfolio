---
resume: false
title: "OpenWrt Storage Expansion on Raspberry Pi"
slug: "openwrt-storage-expansion-on-raspberry-pi"
summary: "Field notes from expanding OpenWrt storage on a Raspberry Pi so the router can safely support extra packages, logs, and small services without running into overlay space limits."
resumeSummary: >-
  Documented storage expansion for an OpenWrt installation on Raspberry Pi hardware so the router can support additional packages, logs, and small services without exhausting its writable overlay. The work covers storage checks, overlay-space constraints, what changes after expansion, what remains limited by hardware or memory, and how package and service placement should be planned. It turns a common hidden constraint into an operational decision, helping prevent upgrades and installs from failing because the device was treated like a full server.
category: "Networking"
tags:
  - openwrt
  - raspberry-pi
  - storage
  - overlay
  - sd-card
  - router
  - self-managed-infrastructure
date: "2026-07-06"
updated: "2026-07-25"
featured: false
published: true
translations:
  fr:
    title: "Extension du stockage OpenWrt sur Raspberry Pi"
    category: "Réseau"
    summary: "Notes sur l’extension du stockage OpenWrt sur Raspberry Pi, l’espace overlay, la capacité SD et les risques liés à l’exécution de services supplémentaires sur un routeur."
    resumeSummary: >-
      Extension de stockage documentée pour une installation OpenWrt sur matériel Raspberry Pi afin que le
      routeur puisse prendre en charge des paquets supplémentaires, des journaux et de petits services sans
      épuiser sa superposition en écriture. Le travail couvre les contrôles de stockage, les contraintes
      d'espace en superposition, ce qui change après l'expansion, ce qui reste limité par le matériel ou la
      mémoire, et comment le placement de paquet et de service devrait être planifié. Il transforme une
      contrainte cachée commune en une décision opérationnelle, aidant à empêcher les mises à niveau et
      installes d'échouer parce que le périphérique a été traité comme un serveur complet.
    body: |-

      ## Pourquoi cette note existe

      OpenWrt est généralement conçu pour fonctionner à partir d'un stockage limité.

      C'est bien quand le routeur ne gère que le routage, DHCP, DNS, les règles de pare-feu, et quelques paquets. Il devient limité lorsque l'appareil commence à exécuter des outils supplémentaires et de petits services.

      Sur un Raspberry Pi, la carte SD donne beaucoup plus de stockage physique que OpenWrt peut utiliser par défaut. Élargir la superposition utilisable rend l'appareil plus pratique pour les paquets, les journaux, les expériences liées à Docker, les scripts et les fichiers de service local.

      Cette note documente le raisonnement pratique derrière l'expansion du stockage OpenWrt sur un Raspberry Pi.

      L'objectif n'est pas de transformer le routeur en un serveur complet. L'objectif est de supprimer la limitation minuscule tout en respectant que le périphérique est le point de contrôle réseau.

      ## Contexte du périphérique

      La configuration est basée sur un Raspberry Pi en cours d'exécution OpenWrt.

      Le routeur a été utilisé pour plus que le routage de base, y compris:

      - Contrôle réseau OpenWrt
      - Direction de filtrage DNS
      - Accès à distance WireGuard
      - scripts locaux
      - installation du paquet
      - petites expériences de service
      - stockage de recouvrement élargi

      Après l'expansion, l'appareil avait une zone de stockage utilisable beaucoup plus grande, avec environ des dizaines de gigaoctets disponibles au lieu de la petite superposition par défaut.

      Le point important est que l'expansion du stockage a facilité le fonctionnement de l'appareil, mais a également accru le besoin de discipline autour des sauvegardes et le placement de service.

      ## Ce que cette configuration veut prouver

      - L'espace d'écriture par défaut d'OpenWrts peut être trop petit pour un routeur Raspberry Pi
      - La capacité de la carte SD devrait être utilisée intentionnellement, et non supposée être disponible automatiquement.
      - L'expansion du stockage en superposition facilite la gestion des paquets et des services
      - plus de stockage ne signifie pas que le routeur doit tout exécuter
      - sauvegardes comptent plus après que le routeur devient plus personnalisé
      - les contrôles de stockage devraient faire partie du dépannage
      - la stabilité du routeur est encore plus importante que la commodité

      ## Outils et domaines utilisés

      ### Couche ouverte

      - Administration de SSH
      - LuCI où utile
      - gestion des paquets
      - superposition du système de fichiers
      - points de montage
      - fichiers de service
      - journaux
      - sauvegardes de configuration

      ### Couche Pi framboise

      - Stockage de la carte SD
      - mise en page du système de fichiers de démarrage/root
      - direction de redimensionnement de la partition
      - Considérations relatives à la fiabilité du stockage
      - considérations de stabilité de la puissance

      ### Dépannage du calque

      - `df -h`
      - `mount`
      - `block info`
      - `logread`
      - contrôle de l'installation du paquet
      - contrôle de la trajectoire des données de service

      ## Construction prévue

      Le résultat prévu est un routeur OpenWrt où la superposition en écriture a assez d'espace pour la maintenance pratique et l'hébergement de petit service.

      Une configuration terminée devrait permettre :

      - paquet installe sans pression d'espace immédiate
      - journaux et scripts stockés en toute sécurité
      - fichiers de service placés dans des chemins prévisibles
      - assez d'espace de superposition libre après les mises à jour
      - configuration du routeur sauvegardée
      - utilisation de stockage vérifiée avant l'ajout de services
      - chemin de récupération compris si la carte SD ou la superposition échoue

      ## Pourquoi superposer l'espace

      OpenWrt sépare le contenu du firmware en lecture seule des modifications en écriture.

      La partie à écrire est habituellement la superposition.

      Les superpositions stockent des choses comme:

      - paquets installés
      - modification de la configuration
      - scripts
      - fichiers de service
      - certains journaux ou fichiers d'état
      - données d'application s'il y est placé

      Si l'espace de recouvrement se remplit, les problèmes peuvent devenir étranges:

      - les paquets échouent à installer
      - les modifications de configuration échouent
      - les services échouent à écrire des fichiers
      - échec des mises à jour
      - les journaux ne peuvent pas être écrits
      - le routeur devient plus difficile à récupérer proprement

      L'entreposage doit être vérifié avant de supposer qu'un service ou un colis est cassé.

      ## Vérifications de stockage de base

      Contrôles utiles:

      ```bash
      df -h
      ```

      ```bash
      mount
      ```

      ```bash
      block info
      ```

      Les principales choses à rechercher:

      - Taille totale des recouvrements
      - espace de superposition libre
      - cloisons montées
      - si l'espace de carte SD attendu est effectivement utilisé
      - si des chemins importants sont sur le stockage élargi

      Un résultat sain devrait montrer la zone enregistrable en utilisant le stockage élargi prévu, non seulement la minuscule superposition par défaut.

      ## Résultat pratique

      Après l'expansion, l'appareil OpenWrt disposait d'une zone enregistrable beaucoup plus grande.

      Le résultat utile a été:

      ```txt
      overlay expanded to SD card capacity
      roughly 50+ GB free after setup
      enough room for packages, scripts, logs, and small service files
      ```

      Cela a transformé le routeur d'un firmware limité seulement en une plate-forme d'infrastructure autogérée plus utilisable.

      Cela dit, le routeur est resté un routeur en premier.

      ## Ce qui devient plus facile après l'expansion

      Le stockage élargi permet :

      - installer des paquets OpenWrt supplémentaires
      - garder les scripts d'aide
      - stockage des fichiers de service
      - utilisation d'outils légers
      - tenir des registres pendant le débogage
      - expérimentation sans frapper immédiatement les limites d'espace
      - la gestion des fichiers de déploiement de bot/service locaux
      - stockage de la sortie de dépannage temporaire

      Il réduit également les chances de casser quelque chose simplement parce qu'OpenWrt a épuisé l'espace en écriture pendant l'installation du paquet.

      ## Ce qui ne change pas

      Le stockage élargi ne corrige pas automatiquement :

      - Limites du processeur
      - Limites de RAM
      - Fiabilité de la carte SD
      - stabilité de la puissance
      - mauvaise configuration du service
      - règles de pare-feu cassées
      - Défaut de DNS
      - accidents de service
      - problèmes de conception du réseau

      Il ne résout que le problème de pression de stockage.

      Un routeur Raspberry Pi avec plus de stockage est toujours un routeur, pas un remplacement complet pour un serveur dédié.

      ## Stockage et service

      Lors de l'exécution de petits services ou scripts sur le routeur, les chemins doivent être délibérés.

      Direction du sentier utile:

      ```txt
      /opt/
        discord-bots/
        scripts/
        services/
      ```

      ou un autre chemin de service clairement documenté.

      Évitez de diffuser des fichiers au hasard dans le système de fichiers.

      Pour tout ce qui est important, notez :

      ```txt
      service name
      path
      config file
      data path
      log path
      restart command
      backup target
      ```

      Cela facilite le dépannage ultérieur.

      ## Direction de l'installation du colis

      Avant d'installer des paquets, vérifiez l'espace disponible.

      ```bash
      df -h
      ```

      Ensuite, installer normalement en utilisant le gestionnaire de paquets disponible pour la compilation OpenWrt.

      Après avoir installé de plus grands paquets, vérifiez à nouveau.

      ```bash
      df -h
      ```

      Cela empêche le fluage de stockage lent de passer inaperçu.

      ## Direction de sauvegarde

      Après avoir élargi le stockage et personnalisé le routeur, les sauvegardes deviennent plus importantes.

      Cibles minimales de sauvegarde & #160;:

      ```txt
      OpenWrt configuration backup
      network/firewall/DHCP settings
      WireGuard config
      DNS/AdGuard direction
      custom scripts
      service files
      important environment examples without secrets
      notes about partition/overlay setup
      ```

      Une sauvegarde de configuration normale OpenWrt ne peut pas inclure tous les fichiers personnalisés placés dans `/opt` ou d'autres répertoires personnalisés.

      Cela signifie que les chemins de service personnalisés devraient avoir leur propre plan de sauvegarde.

      ## Risque de carte SD

      Utilisation de stockage de cartes SD est pratique, mais les cartes SD peuvent échouer.

      Facteurs de risque:

      - constante écrit
      - journaux écrits trop fréquemment
      - Couches Docker/container
      - base de données écrit
      - faible alimentation électrique
      - carte SD bon marché ou faible
      - perte de puissance soudaine

      Si le routeur dépend fortement du stockage de la carte SD, une défaillance peut affecter la disponibilité du réseau.

      Atténuation pratique:

      - utiliser une carte SD décente
      - réduire les écritures inutiles
      - garder les sauvegardes
      - éviter les bases de données lourdes sur le routeur
      - déplacer les services lourds vers Proxmox/VPS/mini PC
      - simplifiez les fonctions critiques du routeur

      ## Règle de stabilité du routeur

      Une règle utile :

      > Le routeur peut exécuter des services supplémentaires, mais ces services ne devraient pas rendre le routeur peu fiable.

      Le stockage élargi le rend tentant d'installer plus d'outils et d'exécuter plus de services.

      Cela devrait être limité.

      Bons candidats pour les outils côté routeur:

      - petits scripts
      - Filtre DNS
      - VPN
      - surveillance légère
      - petits services d'aide

      Mauvaises candidates :

      - bases de données lourdes
      - grandes piles Docker
      - services de haute écriture
      - services expérimentaux qui s'écrasent souvent
      - tout ce qui peut remplir l'espace disque rapidement
      - tout ce qui rend le routeur difficile à redémarrer en toute sécurité

      ## Notes de dépannage

      ### Paquet Installer les Fails

      Vérifiez d'abord le stockage:

      ```bash
      df -h
      ```

      Causes possibles:

      - recouvrement complet
      - numéro du dossier
      - Numéro DNS
      - problème de réseau
      - inadéquation de l'architecture du paquet
      - dépendances manquantes

      Ne présumez pas que ce n'est qu'un problème de paquet.

      ### Service ne peut pas écrire des fichiers

      Vérification :

      ```bash
      df -h
      ```

      ```bash
      mount
      ```

      Causes possibles:

      - pas d'espace libre
      - mauvais chemin
      - système de fichiers en lecture seule
      - problème d'autorisation
      - inadéquation avec l'utilisateur du service
      - Problème de carte SD

      ### Le routeur est étrange après l'ajout de services

      Causes possibles:

      - remplissage de stockage
      - Pression RAM
      - Charge du processeur
      - boucle de redémarrage du service
      - les grumes croissent trop
      - mauvais paquet/interaction service
      - Numéro de carte SD E/S

      Vérification :

      ```bash
      df -h
      ```

      ```bash
      free
      ```

      ```bash
      top
      ```

      ```bash
      logread
      ```

      ### Extension de recouvrement non réfléchie

      Causes possibles:

      - mauvaise partition redimensionnée
      - recouvrement non monté lorsque prévu
      - configuration fstab/mount non appliquée
      - redémarrage nécessaire
      - la disposition du stockage diffère de l'image attendue
      - L'image de carte SD n'a pas utilisé l'espace complet automatiquement

      Vérifiez les chemins montés et la visibilité de la partition avant d'apporter plus de changements.

      ## Décisions pratiques

      ### Étendre le stockage avant d'ajouter de nombreux paquets

      Il est préférable de résoudre les limites de stockage tôt au lieu de combattre les échecs plus tard.

      ### Gardez les services de routeur léger

      Plus d'espace ne devrait pas transformer le routeur en serveur général pour tout.

      ### Chemins personnalisés du document

      Les fichiers en dehors des chemins de configuration standard OpenWrt peuvent être oubliés lors de la sauvegarde ou de la migration.

      ### Vérifiez l'espace libre pendant le débogage

      Les problèmes de stockage ressemblent souvent à des problèmes de paquet, de service ou de configuration.

      ### Garder les sauvegardes en dehors du routeur

      Une sauvegarde stockée uniquement sur la même carte SD ne protège pas contre une défaillance SD.

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - extension de la superposition en écriture
      - assez de stockage libre visible dans `df -h`
      - disposition claire montage / partition
      - chemins de service personnalisés documentés
      - Sauvegarde de configuration OpenWrt enregistrée
      - fichiers personnalisés importants sauvegardés séparément
      - aucune écriture lourde non contrôlée
      - contrôles de stockage inclus dans le flux de travail de dépannage
      - routeur encore stable après expansion
      - les services optionnels n'interférant pas avec le routage/DNS/VPN

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - Sortie `df -h` après expansion
      - Sortie `mount` montrant le chemin de recouvrement
      - Stockage OpenWrt / Capture d'écran LuCI
      - partition mise en page capture d'écran ou sortie de commande
      - Comparaison avant/après stockage
      - liste des chemins personnalisés sous `/opt`
      - notes sur la taille/modèle de la carte SD
      - notes de localisation de sauvegarde
      - essai d'installation du paquet après expansion

      ## Hypothèses techniques

      Cette configuration suppose que le périphérique OpenWrt est un Raspberry Pi ou une carte similaire utilisant le stockage de cartes SD.

      Il suppose que l'utilisateur veut plus d'espace en écriture pour les paquets, les scripts, les journaux et les petits services.

      Il suppose également que la stabilité du routeur est plus importante que l'utilisation de chaque gigaoctet disponible.

      ## Principaux risques

      - Défaut de carte SD affectant la disponibilité du routeur
      - trop de services ajoutés après l'expansion
      - logs remplissage stockage dans le temps
      - fichiers personnalisés non inclus dans les sauvegardes
      - en supposant que `df -h` espace libre signifie que tous les chemins sont sûrs
      - élargir le stockage sans documenter ce qui a changé
      - exécuter de lourdes charges de travail Docker sur le routeur
      - perte d'énergie corrompant stockage
      - confusion des problèmes de stockage avec les problèmes de réseau

      ## État actuel

      Cette note représente la direction d'expansion de stockage du routeur Raspberry Pi OpenWrt.

      La valeur principale est que le routeur a gagné assez d'espace en écriture pour la maintenance pratique, les paquets supplémentaires, les scripts, et les petits services sans constamment combattre la limite de superposition par défaut.

      Cela se connecte directement aux notes sur la configuration d'OpenWrt, AdGuard Home, WireGuard, l'hébergement de messagerie-service et les scripts d'aide Docker.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que chaque routeur OpenWrt a besoin d'un stockage élargi.

      Elle ne prétend pas qu'un routeur Raspberry Pi devrait remplacer un serveur Proxmox ou un VPS.

      Il ne prétend pas que le stockage de cartes SD est idéal pour les services lourds.

      C'est une note pratique sur le terrain de faire un routeur OpenWrt Raspberry Pi moins encombré de stockage tout en gardant la stabilité du routeur à l'esprit.

      ## À emporter pratique

      Élargir le stockage OpenWrt est utile, mais il devrait être traité comme un entretien de l'infrastructure, pas seulement un espace supplémentaire.

      Les parties utiles sont:

      - vérifier la taille réelle des recouvrements
      - utilisant intentionnellement la capacité de la carte SD
      - garder suffisamment d'espace libre
      - documenter les chemins personnalisés
      - sauvegarde des configurations et des fichiers de service
      - éviter les lourdes charges de travail en écriture
      - la protection de l'emploi principal du routeur

      Cela rend l'appareil plus facile à entretenir sans le transformer en serveur non contrôlé.
seoTitle: "OpenWrt Storage Expansion on Raspberry Pi"
seoDescription: "A practical note about expanding OpenWrt storage on Raspberry Pi, checking overlay space, using SD card capacity, and managing the risks of running extra services on a router."
---

## Why This Note Exists

OpenWrt is usually designed to run from limited storage.

That is fine when the router only handles routing, DHCP, DNS, firewall rules, and a few packages. It becomes limiting when the device starts running extra tools and small services.

On a Raspberry Pi, the SD card gives much more physical storage than OpenWrt may use by default. Expanding the usable overlay makes the device more practical for packages, logs, Docker-related experiments, scripts, and local service files.

This note documents the practical reasoning behind expanding OpenWrt storage on a Raspberry Pi.

The goal is not to turn the router into a full server. The goal is to remove the tiny-overlay limitation while still respecting that the device is the network control point.

## Device Context

The setup is based on a Raspberry Pi running OpenWrt.

The router was used for more than basic routing, including:

- OpenWrt network control
- DNS filtering direction
- WireGuard remote access
- local scripts
- package installation
- small service experiments
- expanded overlay storage

After expansion, the device had a much larger usable storage area, with roughly tens of gigabytes available instead of the small default overlay.

The important point is that storage expansion made the device easier to work with, but also increased the need for discipline around backups and service placement.

## What This Setup Is Meant To Prove

- OpenWrt’s default writable space can be too small for a Raspberry Pi-based router
- SD card capacity should be used intentionally, not assumed to be available automatically
- expanding overlay storage makes package and service management easier
- more storage does not mean the router should run everything
- backups matter more after the router becomes more customized
- storage checks should be part of troubleshooting
- router stability is still more important than convenience

## Tools and Areas Used

### OpenWrt Layer

- SSH administration
- LuCI where useful
- package management
- overlay filesystem
- mount points
- service files
- logs
- configuration backups

### Raspberry Pi Layer

- SD card storage
- boot/root filesystem layout
- partition resizing direction
- storage reliability considerations
- power stability considerations

### Troubleshooting Layer

- `df -h`
- `mount`
- `block info`
- `logread`
- package installation checks
- service data path checks

## Intended Build

The intended result is an OpenWrt router where the writable overlay has enough space for practical maintenance and small service hosting.

A finished setup should allow:

- package installs without immediate space pressure
- logs and scripts stored safely
- service files placed in predictable paths
- enough free overlay space after updates
- router configuration backed up
- storage usage checked before adding services
- recovery path understood if the SD card or overlay fails

## Why Overlay Space Matters

OpenWrt separates read-only firmware content from writable changes.

The writable part is usually the overlay.

The overlay stores things like:

- installed packages
- changed configuration
- scripts
- service files
- some logs or state files
- application data if placed there

If overlay space fills up, problems can become strange:

- packages fail to install
- config changes fail
- services fail to write files
- updates fail
- logs cannot be written
- the router becomes harder to recover cleanly

Storage should be checked before assuming a service or package is broken.

## Basic Storage Checks

Useful checks:

```bash
df -h
```

```bash
mount
```

```bash
block info
```

The main things to look for:

- total overlay size
- free overlay space
- mounted partitions
- whether the expected SD card space is actually in use
- whether important paths are on the expanded storage

A healthy result should show the writable area using the intended expanded storage, not only the tiny default overlay.

## Practical Result

After expansion, the OpenWrt device had a much larger writable area available.

The useful result was:

```txt
overlay expanded to SD card capacity
roughly 50+ GB free after setup
enough room for packages, scripts, logs, and small service files
```

This changed the router from a constrained firmware-only device into a more usable self-managed infrastructure platform.

That said, the router still remained a router first.

## What Gets Easier After Expansion

Expanded storage helps with:

- installing extra OpenWrt packages
- keeping helper scripts
- storing service files
- running lightweight tools
- keeping logs during debugging
- experimenting without immediately hitting space limits
- maintaining local bot/service deployment files
- storing temporary troubleshooting output

It also reduces the chance of breaking something simply because OpenWrt ran out of writable space during package installation.

## What Does Not Change

Expanded storage does not automatically fix:

- CPU limits
- RAM limits
- SD card reliability
- power stability
- bad service configuration
- broken firewall rules
- DNS failure
- service crashes
- network design issues

It only solves the storage pressure problem.

A Raspberry Pi router with more storage is still a router, not a full replacement for a dedicated server.

## Storage and Service Placement

When running small services or scripts on the router, paths should be deliberate.

Useful path direction:

```txt
/opt/
  discord-bots/
  scripts/
  services/
```

or another clearly documented service path.

Avoid scattering files randomly across the filesystem.

For anything important, record:

```txt
service name
path
config file
data path
log path
restart command
backup target
```

This makes later troubleshooting easier.

## Package Installation Direction

Before installing packages, check available space.

```bash
df -h
```

Then install normally using the available package manager for the OpenWrt build.

After installing larger packages, check again.

```bash
df -h
```

This prevents slow storage creep from going unnoticed.

## Backup Direction

After expanding storage and customizing the router, backups become more important.

Minimum backup targets:

```txt
OpenWrt configuration backup
network/firewall/DHCP settings
WireGuard config
DNS/AdGuard direction
custom scripts
service files
important environment examples without secrets
notes about partition/overlay setup
```

A normal OpenWrt configuration backup may not include every custom file placed in `/opt` or other custom directories.

That means custom service paths should have their own backup plan.

## SD Card Risk

Using SD card storage is convenient, but SD cards can fail.

Risk factors:

- constant writes
- logs written too frequently
- Docker/container layers
- database writes
- poor power supply
- cheap or weak SD card
- sudden power loss

If the router depends heavily on SD card storage, failure can affect network availability.

Practical mitigation:

- use a decent SD card
- reduce unnecessary writes
- keep backups
- avoid heavy databases on the router
- move heavy services to Proxmox/VPS/mini PC
- keep the router’s critical functions simple

## Router Stability Rule

A useful rule:

> The router can run extra services, but those services should not make the router unreliable.

Expanded storage makes it tempting to install more tools and run more services.

That should be limited.

Good candidates for router-side tools:

- small scripts
- DNS filtering
- VPN
- lightweight monitoring
- small helper services

Bad candidates:

- heavy databases
- large Docker stacks
- high-write services
- experimental services that crash often
- anything that can fill disk space quickly
- anything that makes the router hard to reboot safely

## Troubleshooting Notes

### Package Install Fails

Check storage first:

```bash
df -h
```

Possible causes:

- overlay full
- package repo issue
- DNS issue
- network issue
- package architecture mismatch
- missing dependencies

Do not assume it is only a package problem.

### Service Cannot Write Files

Check:

```bash
df -h
```

```bash
mount
```

Possible causes:

- no free space
- wrong path
- read-only filesystem
- permission issue
- service user mismatch
- SD card problem

### Router Behaves Strangely After Adding Services

Possible causes:

- storage filling up
- RAM pressure
- CPU load
- service restart loop
- logs growing too much
- bad package/service interaction
- SD card I/O issue

Check:

```bash
df -h
```

```bash
free
```

```bash
top
```

```bash
logread
```

### Overlay Expansion Not Reflected

Possible causes:

- wrong partition resized
- overlay not mounted where expected
- fstab/mount config not applied
- reboot needed
- storage layout differs from expected image
- SD card image did not use full space automatically

Check mounted paths and partition visibility before making more changes.

## Practical Decisions

### Expand storage before adding many packages

It is better to solve storage limits early instead of fighting failures later.

### Keep router services light

More space should not turn the router into a general-purpose server for everything.

### Document custom paths

Files outside standard OpenWrt config paths can be forgotten during backup or migration.

### Check free space during debugging

Storage issues often look like package, service, or config problems.

### Keep backup outside the router

A backup stored only on the same SD card does not protect against SD failure.

## What A Finished Setup Should Show

A strong finished setup should show:

- expanded writable overlay
- enough free storage visible in `df -h`
- clear mount/partition layout
- custom service paths documented
- OpenWrt config backup saved
- important custom files backed up separately
- no heavy uncontrolled writes
- storage checks included in troubleshooting workflow
- router still stable after expansion
- optional services not interfering with routing/DNS/VPN

## Evidence Worth Capturing

Useful evidence for this note would include:

- `df -h` output after expansion
- `mount` output showing overlay path
- OpenWrt storage/LuCI screenshot
- partition layout screenshot or command output
- before/after storage comparison
- list of custom paths under `/opt`
- notes about SD card size/model
- backup location notes
- package install test after expansion

## Technical Assumptions

This setup assumes the OpenWrt device is a Raspberry Pi or similar board using SD card storage.

It assumes the user wants more writable space for packages, scripts, logs, and small services.

It also assumes router stability is more important than using every available gigabyte.

## Key Risks

- SD card failure affecting router availability
- too many services added after expansion
- logs filling storage over time
- custom files not included in backups
- assuming `df -h` free space means all paths are safe
- expanding storage without documenting what changed
- running heavy Docker workloads on the router
- power loss corrupting storage
- confusing storage problems with network problems

## Current State

This note represents the storage expansion direction for the Raspberry Pi OpenWrt router.

The main value is that the router gained enough writable space for practical maintenance, extra packages, scripts, and small services without constantly fighting the default overlay limit.

This connects directly to the notes about OpenWrt setup, AdGuard Home, WireGuard, messaging-service hosting, and Docker helper scripts.

## What This Note Does Not Claim

This note does not claim that every OpenWrt router needs expanded storage.

It does not claim that a Raspberry Pi router should replace a Proxmox server or VPS.

It does not claim that SD card storage is ideal for heavy services.

It is a practical field note about making an OpenWrt Raspberry Pi router less storage-constrained while keeping router stability in mind.

## Practical Takeaway

Expanding OpenWrt storage is useful, but it should be treated as infrastructure maintenance, not just extra space.

The useful parts are:

- checking actual overlay size
- using SD card capacity intentionally
- keeping enough free space
- documenting custom paths
- backing up configs and service files
- avoiding heavy write workloads
- keeping the router’s main job protected

That makes the device easier to maintain without turning it into an uncontrolled server.
