---
resume: false
title: "Raspberry Pi and Banana Pi Infrastructure Planning"
slug: "raspberry-pi-and-banana-pi-infrastructure-planning"
summary: "Field notes from comparing Raspberry Pi and Banana Pi options for OpenWrt routing, VLAN-based networks, VPN access, self-hosted infrastructure separation, and small infrastructure deployments."
resumeSummary: >-
  Evaluated Raspberry Pi and Banana Pi hardware as practical components in a small network and self-hosted infrastructure architecture. The planning compares routing capacity, Ethernet layout, storage, power, OpenWrt support, VLAN and router-on-a-stick use, WireGuard access, managed-switch integration, and isolation requirements rather than selecting boards on specifications alone. It establishes a decision framework for matching hardware to workload and topology, including when a low-power single-board device is sufficient and when better network interfaces or expansion options justify a different platform.
category: "Infrastructure"
tags:
  - raspberry-pi
  - banana-pi
  - openwrt
  - router
  - vlan
  - vpn
  - self-managed-infrastructure
  - networking
  - hardware-planning
  - infrastructure
date: "2025-09-10"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Planification d’infrastructure avec Raspberry Pi et Banana Pi"
    category: "Infrastructure"
    summary: "Notes pour choisir entre Raspberry Pi et Banana Pi pour le routage OpenWrt, les VLAN, l’accès VPN, la segmentation d’infrastructure et les petits déploiements."
    resumeSummary: >-
      La planification compare la capacité de routage, la disposition Ethernet, le stockage, l'alimentation,
      le support OpenWrt, l'utilisation de VLAN et de routeur-on-a-stick, l'accès WireGuard, l'intégration de
      commutateurs gérés et les exigences d'isolement plutôt que de sélectionner des planches sur les seules
      spécifications. Il établit un cadre de décision pour l'adéquation du matériel à la charge de travail et
      à la topologie, y compris lorsqu'un appareil à carte unique de faible puissance suffit et lorsque de
      meilleures interfaces réseau ou options d'expansion justifient une plateforme différente.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente le processus de prise de décision derrière le choix du petit matériel ARM pour l'infrastructure réseau.

      L'objectif n'était pas seulement de comparer les planches par CPU, RAM, ou prix.

      ```txt
      Which device makes sense as a reliable router, VPN endpoint, VLAN gateway, or small infrastructure controller?
      ```

      Les options matérielles comprenaient les appareils Raspberry Pi et Banana Pi, en particulier dans le contexte de:

      - Routage ouvert
      - Séparation VLAN
      - configurations de commutateurs gérées
      - Accès VPN
      - isolement de la labo
      - petites entreprises/infrastructures de services
      - fonctionnement de faible puissance
      - Éviter les choix trop compliqués de matériel

      Cette note porte sur la planification des infrastructures et non sur la collecte de gadgets.

      ## Contexte du projet

      L'environnement comprenait un réseau de maisons et de petits laboratoires où le routeur était plus qu'une boîte ISP de base.

      La direction du réseau comprenait:

      - OpenWrt comme couche de contrôle principale
      - Séparation fondée sur le VLAN
      - Accès VPN
      - Filtre DNS
      - expériences d'auto-hébergement
      - Services Proxmox/homelab
      - expérience d'hébergement de serveur de jeu
      - planification future de l'infrastructure des petites entreprises

      Les principaux dispositifs considérés étaient les suivants:

      - Framboise Pi 5
      - Famille Banana Pi BPI-R4
      - Banana Pi BPI-R4 Lite direction
      - commutateurs gérés
      - mini PC pour une charge de travail plus lourde

      L'importante décision de conception était de savoir si la planche devait agir principalement comme routeur, hôte de service ou dispositif de soutien.

      ## Ce que cette planification veut prouver

      - Le choix du matériel devrait suivre la conception du réseau
      - une carte avec un port Ethernet peut toujours router les VLAN avec le bon commutateur
      - routeur-on-a-stick fonctionne, mais il a des compromis
      - les cartes routeur-native sont plus propres pour le routage multiports
      - VPN, VLAN, DNS et pare-feu doivent être planifiés ensemble
      - le stockage et la fiabilité de l'infrastructure
      - support/communauté peut compter plus que les spécifications brutes
      - chaque charge de travail n'appartient pas au routeur

      ## Pile et outils considérés

      ### Couche réseau

      - Ouvrir
      - VLAN
      - commutateur géré
      - Zones pare-feu
      - DHCP
      - Filtre DNS
      - Garde-fils
      - DDNS
      - transport de port
      - topologie routeur-on-a-stick

      ### Couche matérielle

      - Raspberry Pi
      - Banane Pi
      - Tableaux ARM
      - commutateurs gérés
      - Cartes SD
      - Direction eMMC/NVMe
      - qualité de l'alimentation électrique
      - refroidissement
      - Interfaces Ethernet/SFP

      ### Couche de service

      - Accueil AdGuard
      - Garde-fils
      - Mise à jour DDNS
      - petits bots/scripts
      - direction de la surveillance
      - contrôle d'accès à homelab
      - gestion du serveur

      ## Construction prévue

      La direction prévue de l'infrastructure est une petite pile de réseau de faible puissance qui peut supporter:

      - routage Internet
      - Séparation VLAN
      - Accès VPN
      - Filtre DNS
      - réseau isolé homelab/serveur
      - une administration à distance sûre
      - expansion future
      - séparation claire entre les fonctions de routeur et les fonctions de serveur plus lourdes

      Une conception finie devrait répondre:

      ```txt
      What device routes traffic?
      What device switches VLANs?
      Where does VPN terminate?
      Where do services run?
      Where are sensitive systems placed?
      What happens if one device fails?
      ```

      ## Raspberry Pi comme routeur ouvert

      Un Raspberry Pi peut fonctionner comme un routeur OpenWrt, surtout lorsqu'il est associé à un commutateur géré.

      La limitation typique est Ethernet.

      Un Raspberry Pi avec un port Ethernet peut utiliser une conception routeur-on-a-stick:

      ```txt
      ISP/ONT
        ↓
      managed switch
        ↓ tagged VLAN trunk
      Raspberry Pi running OpenWrt
        ↓ tagged VLAN trunk
      managed switch
        ↓
      LAN / homelab / server VLANs
      ```

      Cela peut bien fonctionner lorsque les VLAN sont configurés correctement.

      Le commutateur géré devient essentiel parce que le trafic pour les zones WAN et LAN est séparé en utilisant des balises VLAN sur la même interface physique.

      ## Routeur-sur-un-Stick Direction

      Routeur-on-a-stick signifie qu'une interface réseau physique transporte plusieurs VLAN.

      Exemple de direction:

      ```txt
      eth0.10 → Home LAN
      eth0.20 → Homelab LAN
      eth0.1141 → WAN / ISP VLAN direction
      ```

      Cette conception peut être pratique, mais elle dépend:

      - corriger le marquage VLAN
      - prise en charge des commutateurs gérés
      - profils de port clairs
      - Configuration de l'interface OpenWrt
      - séparation de la zone pare-feu
      - éviter les erreurs accidentelles de circulation non marquées

      L'avantage est d'utiliser efficacement le matériel d'un seul tableau.

      L'inconvénient est que le commutateur et la configuration VLAN deviennent critiques.

      ## Rôle de commutateur géré

      Un commutateur géré n'est pas optionnel dans une configuration de routeur-on-a-stick basée sur VLAN.

      Les poignées du commutateur:

      - marqué port du tronc au routeur
      - ports d'accès non étiquetés pour les appareils normaux
      - Séparation VLAN entre les réseaux
      - Dédouanement WAN si nécessaire
      - isolement de la labo/serveur

      Exemple de direction du commutateur:

      ```txt
      Port 1 → router trunk
      Port 2 → ISP/ONT WAN VLAN
      Port 3 → home LAN untagged
      Port 4 → homelab VLAN untagged
      Port 5 → server/proxmox VLAN untagged
      ```

      La disposition exacte du port dépend du réseau, mais le principe est le même.

      ## Banana Pi en tant que matériel de routeur

      Banana Pi routeur-planches peut être plus naturel pour le routage OpenWrt parce qu'ils ciblent souvent les cas d'utilisation de réseau plus directement qu'un Raspberry Pi général.

      Le recours est formé comme suit:

      - direction matérielle plus routeur-comme
      - plusieurs interfaces Ethernet selon le modèle
      - Direction SFP/SFP+ sur certaines planches
      - mieux adapté pour la séparation WAN/LAN
      - moins de dépendance à l'égard des astuces de routeur-on-a-stick
      - possibilité d'expansion selon le modèle

      Cela peut rendre Banana Pi nettoyant pour un rôle de routeur sérieux.

      Mais ils doivent aussi être prudents:

      - vérifier l'état du support OpenWrt
      - vérifier la maturité du conducteur
      - vérifier la documentation communautaire
      - contrôle de la puissance/refroidissement
      - vérifier la disponibilité et le prix
      - vérifier la révision exacte du tableau
      - vérifier si le modèle spécifique correspond aux ports nécessaires

      Un tableau solide sur papier n'est pas utile si le support est instable ou si la documentation est faible.

      ## Banana Pi BPI-R4 Direction

      La direction BPI-R4 était sensée comme un choix plus routeur-natif.

      Il est plus aligné avec:

      - Utilisation du routeur OpenWrt
      - réseau multiports
      - Direction SFP
      - rôle de passerelle de homelab
      - contrôle centralisé du réseau
      - expansion future

      Pour une configuration qui peut éventuellement gérer VLANs, VPN, services internes et routage plus structuré, une carte Banana Pi orientée routeur peut être plus facile à justifier que de forcer tout à travers un seul port Ethernet.

      La principale règle de planification:

      ```txt
      Use Raspberry Pi when flexibility and availability matter.
      Use Banana Pi router boards when network interfaces and router role matter more.
      ```

      ## Banana Pi BPI-R4 Lite Direction

      La direction Lite peut avoir un sens lorsque le tableau complet est indisponible ou trop cher.

      Mais "Lite" ne doit pas seulement être jugé par le prix.

      Les questions sont les suivantes:

      - a-t-il les ports nécessaires?
      - supporte-t-il la version OpenWrt prévue?
      - est-ce qu'il soutient la remise du WAN nécessaire?
      - supporte-t-il le stockage prévu?
      - soutient-elle le débit requis?
      - Il a assez de RAM ?
      - La communauté l'utilise-t-elle avec succès?
      - Y a-t-il des problèmes de conducteur connus?

      Pour un démarrage ou une construction précoce, l'utilisation du panneau Lite peut être raisonnable si les exigences sont claires et que les fonctionnalités manquantes ne sont pas nécessaires.

      ## Décision Raspberry Pi vs Banana Pi

      Une comparaison simple:

      Zone de Raspberry Pi Direction de Banana Pi Routeur Direction de Banana Pi---------------Le meilleur rôle de Banana Flexible petit serveur / routeur de routeur d'une passerelle centrée sur le routeur d'Ethernet souvent limité d'une manière générale plus concentrée sur le réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'information d'un réseau d'un réseau d'information d'un réseau d'information d'un réseau d'un réseau d'information d'un réseau d'un réseau d'information d'un réseau d'un réseau d'information d'un réseau d'un réseau d'un réseau d'information d'un réseau d'un réseau d'information d'un réseau d'un réseau d'un réseau d'information d'un réseau d'un réseau d'un réseau d'un réseau L'utilisation d'OpenWrt dépend du modèle/HAT/adaptateurs.

      Le meilleur choix dépend du rôle.

      ## Routeur vs séparation du serveur

      Une décision importante est de ne pas surcharger le routeur.

      Un routeur devrait prioriser :

      - routage
      - pare-feu
      - VLAN
      - DHCP
      - DNS
      - VPN
      - DDNS
      - surveillance de la lumière

      Les charges de travail plus lourdes devraient passer à :

      - mini PC
      - Serveur Proxmox
      - VPS
      - hôte de service dédié

      Exemples de charges de travail qui peuvent ne pas appartenir au routeur à long terme:

      - bases de données lourdes
      - grandes piles Docker
      - Serveurs de jeux
      - serveurs multimédias
      - CI/processus de construction
      - stockage de fichiers importants
      - applications web publiques avec un trafic lourd

      Un routeur peut exécuter de petits scripts, mais il devrait rester stable en premier.

      ## Mini Rôle PC

      Un mini PC peut compléter le routeur.

      Mieux vaut diviser :

      ```txt
      OpenWrt router:
        routing, firewall, VLAN, VPN, DNS

      Mini PC / Proxmox:
        applications, databases, dashboards, containers, automation
      ```

      Cela maintient la couche réseau fiable tout en permettant aux services de croître séparément.

      Pour l'infrastructure des petites entreprises, cette répartition est plus propre que l'utilisation d'une seule planche pour tout.

      ## VLAN Planification

      La conception de l'infrastructure devrait séparer le trafic par objectif.

      Exemple de direction VLAN:

      ```txt
      Home VLAN
      Admin VLAN
      Homelab/Server VLAN
      Guest/IoT VLAN
      DMZ if public-facing services exist
      ```

      La conception exacte devrait rester simple au début.

      Trop de VLAN créent des frais généraux de gestion.

      Une première structure pratique:

      ```txt
      Home
      Homelab/Servers
      Guest/IoT
      Admin/VPN
      ```

      L'objectif est d'empêcher tout ce qui vit dans un réseau plat.

      ## Placement VPN

      WireGuard peut fonctionner sur le routeur ou un hôte séparé.

      ### VPN sur Router

      Avantages:

      - contrôle d'accès direct au bord du réseau
      - simple routage vers les VLAN
      - moins d'appareils
      - bon pour l'accès admin

      Risques:

      - augmentation de la charge de travail du routeur
      - erreurs peuvent affecter l'accès au réseau
      - les questions de sauvegarde/récupération

      ### VPN sur un hôte séparé

      Avantages:

      - services séparés du routeur
      - plus facile à reconstruire ou containerize
      - peut s'asseoir dans la couche DMZ/accès

      Risques:

      - Les règles de routage/pare-feu nécessitent plus de soins
      - pièces plus mobiles
      - port transiting peut être nécessaire

      Pour les petites infrastructures/home, VPN sur OpenWrt est souvent pratique.

      Pour les configurations plus grandes, une passerelle VPN/accès dédiée peut être plus propre.

      ## Direction DMZ

      Un DMZ peut être utile pour héberger des services publics ou semi-publics.

      Un modèle propre:

      ```txt
      Internet
        ↓
      Router/firewall
        ↓
      DMZ / access layer
        ↓
      Private internal services
      ```

      Les services publics ou les passerelles contrôlées peuvent se trouver à proximité.

      Les services sensibles, les bases de données et les panneaux administratifs devraient demeurer dans les réseaux privés.

      La décision matérielle devrait soutenir cette conception au moyen de VLANs et de règles de pare-feu.

      ## Considérations relatives au stockage

      Les cartes routeurs toujours sur les cartes SD, eMMC ou NVMe sont souvent utilisées selon le modèle.

      Le stockage est important parce que :

      - logs écrire dans le temps
      - les paquets ont besoin d'espace
      - Docker peut consommer de l'espace
      - bases de données écrire constamment
      - une perte soudaine de puissance peut corrompre le stockage
      - La qualité de la carte SD varie

      Pour un routeur:

      ```txt
      stable storage > large storage
      ```

      Pour les serveurs :

      ```txt
      SSD/NVMe preferred
      ```

      N'exécutez pas les services d'écriture lourde sur des cartes SD faibles si la fiabilité compte.

      ## Puissance et refroidissement

      Les petites planches sont sensibles à la mauvaise puissance et à la chaleur.

      La planification devrait comprendre :

      - alimentation de qualité
      - tension stable
      - Refroidissement/réservoir
      - débit d'air
      - boîtier sûr
      - UPS direction si important
      - éviter les câbles/adaptateurs bon marché

      La puissance instable peut ressembler à une défaillance du logiciel.

      Les pannes aléatoires, la corruption du système de fichiers et les chutes de réseau peuvent toutes provenir de problèmes d'alimentation/refroidissement.

      ## Considérations relatives au débit

      Le matériel de routeur devrait être choisi en fonction du trafic attendu.

      Questions :

      - vitesse internet
      - WireGuard vitesse nécessaire
      - charge de routage inter-VLAN
      - SQM/QoS besoin
      - Nombre de clients
      - nombre de règles de pare-feu
      - SDI/plans de surveillance
      - services publics ou accès privé uniquement

      Une carte qui est bonne pour le routage de base peut être en difficulté avec un cryptage VPN lourd, SQM, ou un trafic inter-VLAN élevé.

      ## Disponibilité et réparabilité

      Un tableau techniquement parfait est moins utile s'il est impossible de le remplacer.

      Questions pratiques d'achat:

      - Le conseil peut-il être acheté localement ou régionalement?
      - peut-on remplacer facilement l'alimentation électrique?
      - les caisses/puits sont-elles disponibles?
      - Les options de rechange SD/eMMC/stockage sont-elles disponibles?
      - La documentation est-elle disponible?
      - Les autres utilisateurs l'exécutent-ils avec succès ?
      - peut-on restaurer l'installation sur un autre appareil?

      Pour les infrastructures destinées aux clients ou aux entreprises, la disponibilité est importante.

      ## Direction de la documentation

      Les décisions relatives au matériel d'infrastructure devraient être clairement documentées.

      Documentation utile:

      ```txt
      network diagram
      VLAN table
      port map
      device role list
      IP plan
      firewall zone summary
      VPN access notes
      backup/recovery note
      hardware list
      why this board was chosen
      what this board should not do
      ```

      Cela rend l'installation réglable plus tard.

      ## Arbre de décision pratique

      ```txt
      Need simple OpenWrt router and already have managed switch?
        → Raspberry Pi can work with router-on-a-stick.

      Need cleaner router hardware with more network interfaces?
        → Banana Pi router-focused board is stronger.

      Need to run heavier services?
        → Use mini PC/Proxmox, not the router board.

      Need public/self-hosted services?
        → Consider DMZ/VLAN design and maybe VPS.

      Need only VPN + DNS + firewall?
        → Keep router simple and stable.
      ```

      ## Décisions pratiques

      ### Ne choisissez pas le matériel uniquement par spécifications

      Le soutien, la documentation et la disponibilité de remplacement comptent.

      ### Le routeur devrait rester ennuyeux

      Le routeur devrait être stable avant qu'il ne soit intelligent.

      ### Services lourds distincts

      Utilisez le routeur pour le contrôle réseau et un mini PC/serveur pour les applications.

      ### Utiliser délibérément les VLAN

      Les VLAN devraient résoudre les besoins réels de séparation, et non créer de la confusion.

      ### Plan de redressement

      Si la carte routeur meurt, le réseau devrait être récupérable à partir de la documentation et des sauvegardes.

      ### Vérifier le support avant d'acheter

      Surtout pour les panneaux Banana Pi/router, vérifier la révision exacte du tableau et la direction de support OpenWrt avant de s'engager.

      ## Ce qu'un plan achevé devrait montrer

      Un plan d'infrastructure solide devrait montrer:

      - périphérique de routeur sélectionné
      - raison de le choisir
      - Conception WAN/LAN/VLAN
      - carte des ports de commutation gérés
      - Placement VPN
      - Position de filtrage DNS
      - séparation serveur/homelab
      - choix de stockage
      - Choix de refroidissement/puissance
      - sens de sauvegarde/de récupération
      - quels services fonctionnent où
      - ce qui n'est intentionnellement pas exposé

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - photos matérielles
      - Capture d'écran du tableau de bord ouvert
      - Liste des interfaces VLAN
      - Changer la capture d'écran de configuration VLAN
      - diagramme de réseau
      - Statut de WireGuard
      - État du filtrage DNS
      - utilisation du stockage
      - tableau de carte du port
      - mini jeu de rôle PC/routeur
      - Comparaison avant/après topologie

      ## Hypothèses techniques

      Cette note suppose que l'infrastructure est pour un laboratoire à domicile, un petit réseau ou un environnement de style de petite entreprise.

      Il suppose qu'OpenWrt est utilisé comme couche de routage/firewall.

      Il suppose que le choix du matériel doit équilibrer le coût, la disponibilité, le soutien, les ports et l'expansion future.

      Il suppose également que tous les services ne doivent pas fonctionner sur le routeur lui-même.

      ## Principaux risques

      - en s'appuyant sur le routeur-on-a-stick sans comprendre le marquage VLAN
      - choisir une planche avec un faible support OpenWrt
      - surcharger le routeur avec des services lourds
      - utilisation de mauvaises alimentations
      - en exécutant des services d'écriture lourde sur des cartes SD faibles
      - achat de matériel basé uniquement sur des spécifications théoriques
      - créer trop de VLAN trop tôt
      - pas de documentation de carte de port
      - aucune sauvegarde de configuration OpenWrt
      - exposer les services administratifs au lieu d'utiliser VPN
      - choisir le matériel non disponible pour une configuration orientée client

      ## État actuel

      Cette note représente la direction de planification du matériel et de l'infrastructure derrière le choix des appareils Raspberry Pi ou Banana Pi pour les déploiements OpenWrt et petits réseaux.

      La valeur la plus élevée est le cadre de décision:

      ```txt
      router role
      switch role
      server role
      VPN role
      VLAN design
      storage/reliability
      support/availability
      ```

      C'est plus utile qu'un simple tableau de comparaison.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas qu'une seule planche est toujours meilleure.

      Il ne prétend pas que Raspberry Pi est un routeur parfait.

      Il ne prétend pas que Banana Pi est automatiquement prêt à la production sans vérifier le support.

      Il documente la planification pratique de l'infrastructure autour de petites cartes ARM, OpenWrt, VLANs, accès VPN, et la conception de réseau homelab / petites entreprises.

      ## À emporter pratique

      La leçon utile est:

      > Choisissez le matériel en fonction du rôle du réseau, et non le nom du produit.

      Une configuration propre sépare les responsabilités :

      ```txt
      router → routing, firewall, VPN, DNS
      switch → VLAN access/trunks
      server/mini PC → applications and heavy services
      DMZ/private networks → exposure boundaries
      ```

      Cela facilite la compréhension, l'expansion et la récupération de l'infrastructure.
seoTitle: "Raspberry Pi and Banana Pi Infrastructure Planning"
seoDescription: "A practical note about choosing between Raspberry Pi and Banana Pi hardware for OpenWrt routing, VLANs, VPN access, self-hosted infrastructure segmentation, and small infrastructure planning."
---

## Why This Note Exists

This note documents the decision-making process behind choosing small ARM hardware for network infrastructure.

The goal was not only to compare boards by CPU, RAM, or price. The real question was:

```txt
Which device makes sense as a reliable router, VPN endpoint, VLAN gateway, or small infrastructure controller?
```

The hardware options included Raspberry Pi and Banana Pi devices, especially in the context of:

- OpenWrt routing
- VLAN separation
- managed switch setups
- VPN access
- homelab isolation
- small business/server infrastructure
- low-power always-on operation
- avoiding overcomplicated hardware choices

This note is about infrastructure planning, not gadget collecting.

## Project Context

The environment involved a home and small-lab network where the router was more than a basic ISP box.

The network direction included:

- OpenWrt as the main control layer
- VLAN-based separation
- VPN access
- DNS filtering
- self-hosting experiments
- Proxmox/homelab services
- game server hosting experience
- future small-business infrastructure planning

The key devices considered were:

- Raspberry Pi 5
- Banana Pi BPI-R4 family
- Banana Pi BPI-R4 Lite direction
- managed switches
- mini PCs for heavier server workloads

The important design decision was whether the board should act mainly as a router, a service host, or a support device.

## What This Planning Is Meant To Prove

- hardware choice should follow network design
- a board with one Ethernet port can still route VLANs with the right switch
- router-on-a-stick works, but it has tradeoffs
- router-native boards are cleaner for multi-port routing
- VPN, VLANs, DNS, and firewalling should be planned together
- storage and reliability matter for always-on infrastructure
- support/community can matter more than raw specs
- not every workload belongs on the router

## Stack and Tools Considered

### Network Layer

- OpenWrt
- VLANs
- managed switch
- firewall zones
- DHCP
- DNS filtering
- WireGuard
- DDNS
- port forwarding
- router-on-a-stick topology

### Hardware Layer

- Raspberry Pi
- Banana Pi
- ARM boards
- managed switches
- SD cards
- eMMC/NVMe direction
- power supply quality
- cooling
- Ethernet/SFP interfaces

### Service Layer

- AdGuard Home
- WireGuard
- DDNS updater
- small bots/scripts
- monitoring direction
- homelab access control
- server management

## Intended Build

The intended infrastructure direction is a small, low-power network stack that can support:

- internet routing
- VLAN separation
- VPN access
- DNS filtering
- isolated homelab/server network
- safe remote administration
- future expansion
- clear separation between router duties and heavier server duties

A finished design should answer:

```txt
What device routes traffic?
What device switches VLANs?
Where does VPN terminate?
Where do services run?
Where are sensitive systems placed?
What happens if one device fails?
```

## Raspberry Pi as OpenWrt Router

A Raspberry Pi can work as an OpenWrt router, especially when paired with a managed switch.

The typical limitation is Ethernet.

A Raspberry Pi with one Ethernet port can use a router-on-a-stick design:

```txt
ISP/ONT
  ↓
managed switch
  ↓ tagged VLAN trunk
Raspberry Pi running OpenWrt
  ↓ tagged VLAN trunk
managed switch
  ↓
LAN / homelab / server VLANs
```

This can work well when VLANs are configured correctly.

The managed switch becomes essential because traffic for WAN and LAN zones is separated using VLAN tags over the same physical interface.

## Router-on-a-Stick Direction

Router-on-a-stick means one physical network interface carries multiple VLANs.

Example direction:

```txt
eth0.10 → Home LAN
eth0.20 → Homelab LAN
eth0.1141 → WAN / ISP VLAN direction
```

This design can be practical, but it depends on:

- correct VLAN tagging
- managed switch support
- clear port profiles
- OpenWrt interface setup
- firewall zone separation
- avoiding accidental untagged traffic mistakes

The advantage is using one-board hardware effectively.

The disadvantage is that the switch and VLAN config become critical.

## Managed Switch Role

A managed switch is not optional in a VLAN-based router-on-a-stick setup.

The switch handles:

- tagged trunk port to router
- untagged access ports for normal devices
- VLAN separation between networks
- WAN handoff if needed
- homelab/server isolation

Example switch direction:

```txt
Port 1 → router trunk
Port 2 → ISP/ONT WAN VLAN
Port 3 → home LAN untagged
Port 4 → homelab VLAN untagged
Port 5 → server/proxmox VLAN untagged
```

The exact port layout depends on the network, but the principle is the same.

## Banana Pi as Router Hardware

Banana Pi router-focused boards can be more natural for OpenWrt routing because they often target networking use cases more directly than a general Raspberry Pi.

The appeal is:

- more router-like hardware direction
- multiple Ethernet interfaces depending on model
- SFP/SFP+ direction on some boards
- better fit for WAN/LAN separation
- less dependence on router-on-a-stick tricks
- room for expansion depending on model

This can make Banana Pi boards cleaner for a serious router role.

But they also require caution:

- check OpenWrt support status
- check driver maturity
- check community documentation
- check power/cooling
- check availability and price
- check exact board revision
- check whether the specific model matches the needed ports

A strong board on paper is not useful if support is unstable or documentation is weak.

## Banana Pi BPI-R4 Direction

The BPI-R4 direction made sense as a more router-native choice.

It is more aligned with:

- OpenWrt router use
- multi-port networking
- SFP direction
- homelab gateway role
- centralized network control
- future expansion

For a setup that may eventually handle VLANs, VPN, internal services, and more structured routing, a router-focused Banana Pi board can be easier to justify than forcing everything through a single Ethernet port.

The main planning rule:

```txt
Use Raspberry Pi when flexibility and availability matter.
Use Banana Pi router boards when network interfaces and router role matter more.
```

## Banana Pi BPI-R4 Lite Direction

The Lite direction can make sense when the full board is unavailable or too expensive.

But “Lite” should not only be judged by price.

The questions are:

- does it have the ports needed?
- does it support the intended OpenWrt version?
- does it support the needed WAN handoff?
- does it support the planned storage?
- does it support the required throughput?
- does it have enough RAM?
- does the community use it successfully?
- are there known driver issues?

For a startup or early build, using the Lite board can be reasonable if the requirements are clear and the missing features are not needed.

## Raspberry Pi vs Banana Pi Decision

A simple comparison:

| Area | Raspberry Pi Direction | Banana Pi Router Direction |
|---|---|---|
| Best role | flexible small server/router | router-focused gateway |
| Ethernet | often limited | usually stronger networking focus |
| VLAN routing | possible with managed switch | often cleaner with more interfaces |
| Community | very strong general community | more specialized |
| OpenWrt use | workable | often targeted, but check support |
| Availability | often easier depending on market | can be harder locally |
| Expansion | depends on model/HATs/adapters | depends on board design |
| Risk | USB/Ethernet/workaround complexity | support/documentation maturity |
| Best use | lab, VPN, DNS, small services | central router/gateway |

The best choice depends on the role.

## Router vs Server Separation

One important decision is not to overload the router.

A router should prioritize:

- routing
- firewall
- VLANs
- DHCP
- DNS
- VPN
- DDNS
- light monitoring

Heavier workloads should move to:

- mini PC
- Proxmox server
- VPS
- dedicated service host

Examples of workloads that may not belong on the router long-term:

- heavy databases
- large Docker stacks
- game servers
- media servers
- CI/build processes
- large file storage
- public web apps with heavy traffic

A router can run small scripts, but it should remain stable first.

## Mini PC Role

A mini PC can complement the router.

Better split:

```txt
OpenWrt router:
  routing, firewall, VLAN, VPN, DNS

Mini PC / Proxmox:
  applications, databases, dashboards, containers, automation
```

This keeps the network layer reliable while allowing services to grow separately.

For small-business infrastructure, this split is cleaner than using one board for everything.

## VLAN Planning

The infrastructure design should separate traffic by purpose.

Example VLAN direction:

```txt
Home VLAN
Admin VLAN
Homelab/Server VLAN
Guest/IoT VLAN
DMZ if public-facing services exist
```

The exact design should stay simple at first.

Too many VLANs create management overhead.

A practical early structure:

```txt
Home
Homelab/Servers
Guest/IoT
Admin/VPN
```

The goal is to prevent everything from living in one flat network.

## VPN Placement

WireGuard can run on the router or a separate host.

### VPN on Router

Advantages:

- direct access control at network edge
- simple routing to VLANs
- fewer devices
- good for admin access

Risks:

- router workload increases
- mistakes can affect network access
- backup/recovery matters

### VPN on Separate Host

Advantages:

- services separated from router
- easier to rebuild or containerize
- can sit in DMZ/access layer

Risks:

- routing/firewall rules need more care
- more moving parts
- port forwarding may be needed

For small/home infrastructure, VPN on OpenWrt is often practical.

For bigger setups, a dedicated VPN/access gateway can be cleaner.

## DMZ Direction

A DMZ can be useful when hosting public-facing or semi-public entry services.

A clean model:

```txt
Internet
  ↓
Router/firewall
  ↓
DMZ / access layer
  ↓
Private internal services
```

Public-facing services or controlled gateways can sit closer to the edge.

Sensitive services, databases, and admin panels should remain in private networks.

The hardware decision should support this design through VLANs and firewall rules.

## Storage Considerations

Always-on router boards often use SD cards, eMMC, or NVMe depending on model.

Storage matters because:

- logs write over time
- packages need space
- Docker can consume space
- databases write constantly
- sudden power loss can corrupt storage
- SD card quality varies

For a router:

```txt
stable storage > large storage
```

For servers:

```txt
SSD/NVMe preferred
```

Do not run write-heavy services on weak SD cards if reliability matters.

## Power and Cooling

Small boards are sensitive to bad power and heat.

Planning should include:

- quality power supply
- stable voltage
- cooling/heatsink
- airflow
- safe enclosure
- UPS direction if important
- avoiding cheap cables/adapters

Unstable power can look like software failure.

Random crashes, filesystem corruption, and network drops can all come from power/cooling problems.

## Throughput Considerations

Router hardware should be chosen based on expected traffic.

Questions:

- internet speed
- WireGuard speed needed
- inter-VLAN routing load
- SQM/QoS need
- number of clients
- number of firewall rules
- IDS/monitoring plans
- public services or only private access

A board that is fine for basic routing may struggle with heavy VPN encryption, SQM, or high inter-VLAN traffic.

## Availability and Repairability

A technically perfect board is less useful if it is impossible to replace.

Practical buying questions:

- can the board be bought locally or regionally?
- can the power supply be replaced easily?
- are cases/heatsinks available?
- are spare SD/eMMC/storage options available?
- is documentation available?
- do other users run OpenWrt on it successfully?
- can the setup be restored onto another device?

For client or business-facing infrastructure, availability matters.

## Documentation Direction

Infrastructure hardware decisions should be documented clearly.

Useful documentation:

```txt
network diagram
VLAN table
port map
device role list
IP plan
firewall zone summary
VPN access notes
backup/recovery note
hardware list
why this board was chosen
what this board should not do
```

This makes the setup maintainable later.

## Practical Decision Tree

```txt
Need simple OpenWrt router and already have managed switch?
  → Raspberry Pi can work with router-on-a-stick.

Need cleaner router hardware with more network interfaces?
  → Banana Pi router-focused board is stronger.

Need to run heavier services?
  → Use mini PC/Proxmox, not the router board.

Need public/self-hosted services?
  → Consider DMZ/VLAN design and maybe VPS.

Need only VPN + DNS + firewall?
  → Keep router simple and stable.
```

## Practical Decisions

### Do not choose hardware only by specs

Support, documentation, and replacement availability matter.

### Router should stay boring

The router should be stable before it is clever.

### Separate heavy services

Use the router for network control and a mini PC/server for applications.

### Use VLANs deliberately

VLANs should solve real separation needs, not create confusion.

### Plan for recovery

If the router board dies, the network should be recoverable from documentation and backups.

### Check support before buying

Especially for Banana Pi/router-focused boards, verify the exact board revision and OpenWrt support direction before committing.

## What A Finished Plan Should Show

A strong infrastructure plan should show:

- selected router device
- reason for choosing it
- WAN/LAN/VLAN design
- managed switch port map
- VPN placement
- DNS filtering placement
- server/homelab separation
- storage choice
- cooling/power choice
- backup/recovery direction
- what services run where
- what is intentionally not exposed

## Evidence Worth Capturing

Useful evidence for this note would include:

- hardware photos
- OpenWrt dashboard screenshot
- VLAN interface list
- switch VLAN configuration screenshot
- network diagram
- WireGuard status
- DNS filtering status
- storage usage
- port map table
- mini PC/router role split
- before/after topology comparison

## Technical Assumptions

This note assumes the infrastructure is for a home lab, small network, or small-business style environment.

It assumes OpenWrt is used as the routing/firewall layer.

It assumes the hardware choice must balance cost, availability, support, ports, and future expansion.

It also assumes that not every service should run on the router itself.

## Key Risks

- relying on router-on-a-stick without understanding VLAN tagging
- choosing a board with weak OpenWrt support
- overloading the router with heavy services
- using bad power supplies
- running write-heavy services on weak SD cards
- buying hardware based only on theoretical specs
- creating too many VLANs too early
- no port map documentation
- no backup of OpenWrt config
- exposing admin services instead of using VPN
- choosing unavailable hardware for a client-facing setup

## Current State

This note represents the hardware and infrastructure planning direction behind choosing Raspberry Pi or Banana Pi devices for OpenWrt and small-network deployments.

The strongest value is the decision framework:

```txt
router role
switch role
server role
VPN role
VLAN design
storage/reliability
support/availability
```

That is more useful than a simple “which board is better” comparison.

## What This Note Does Not Claim

This note does not claim one board is always better.

It does not claim Raspberry Pi is a perfect router.

It does not claim Banana Pi is automatically production-ready without checking support.

It documents practical infrastructure planning around small ARM boards, OpenWrt, VLANs, VPN access, and homelab/small-business network design.

## Practical Takeaway

The useful lesson is:

> Choose the hardware based on the network role, not the product name.

A clean setup separates responsibilities:

```txt
router → routing, firewall, VPN, DNS
switch → VLAN access/trunks
server/mini PC → applications and heavy services
DMZ/private networks → exposure boundaries
```

That makes the infrastructure easier to understand, expand, and recover.
