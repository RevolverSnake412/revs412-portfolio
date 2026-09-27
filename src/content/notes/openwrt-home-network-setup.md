---
resume: false
title: "OpenWrt Home Network Setup"
slug: "openwrt-home-network-setup"
summary: "Field notes from building a practical OpenWrt-based home network with custom routing, DNS filtering, VPN access, VLAN direction, and service troubleshooting."
resumeSummary: >-
  Built and documented an OpenWrt-based home network that combines routing, DHCP and DNS responsibilities, filtering, remote VPN access, VLAN planning, and service troubleshooting. The design makes the role of each network component explicit, then verifies client addressing, resolver paths, firewall policy, and service reachability layer by layer. It is intended as a maintainable small-infrastructure baseline: custom enough to support separated services and remote administration, but documented well enough to recover from a broken route, DNS path, or configuration change.
category: "Networking"
tags:
  - openwrt
  - networking
  - router
  - dns
  - firewall
  - vlan
  - vpn
  - self-managed-infrastructure
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Mise en place d’un réseau domestique OpenWrt"
    category: "Réseau"
    summary: "Notes de terrain sur la construction et le dépannage d’un réseau OpenWrt avec routage, DNS, VPN, planification VLAN et hébergement de petits services."
    resumeSummary: >-
      Construit et documenté un réseau d'accueil basé sur OpenWrt qui combine routage, responsabilités DHCP et
      DNS, filtrage, accès VPN à distance, planification VLAN, et dépannage de service. La conception rend le
      rôle de chaque composant réseau explicite, puis vérifie l'adressage client, les chemins de résolution,
      la politique de pare-feu, et la portée du service couche par couche. Il s'agit d'une base
      d'infrastructure de petite taille qui peut être maintenue : suffisamment personnalisée pour supporter
      les services séparés et l'administration à distance, mais suffisamment documentée pour récupérer à
      partir d'une route cassée, d'un chemin DNS ou d'un changement de configuration.
    body: |-

      ## Pourquoi cette note existe

      Un réseau domestique peut rester simple lorsqu'il n'a besoin que d'un accès Wi-Fi et Internet.

      Il devient plus intéressant lorsque le routeur devient aussi le point de contrôle pour le filtrage DNS, l'accès VPN, les services locaux, la séparation du trafic, le transfert de port et la maintenance à distance.

      Cette note documente la direction d'une configuration de réseau domiciliaire basée sur OpenWrt. L'objectif n'est pas de montrer qu'OpenWrt a été installé. L'objectif est d'expliquer comment le réseau a été traité comme un petit système avec routage, services, accès, points de défaillance et chemins de récupération.

      ## Contexte du réseau

      La configuration est basée sur un routeur OpenWrt utilisé comme principal périphérique réseau contrôlable.

      L'environnement comprend:

      - connexion internet fibre
      - Situation du routeur/ONT du FSI
      - Routeur ouvert
      - direction du commutateur gérée
      - services locaux
      - Filtre DNS
      - Accès à distance VPN
      - transfert de port au besoin
      - expansion du stockage pour les services locaux
      - dépannage à travers les couches DNS, firewall et service

      La configuration a changé avec le temps, ce qui est normal pour un réseau home/lab. La partie importante est de garder le réseau compréhensible tout en ajoutant des capacités.

      ## Ce que cette configuration veut prouver

      - un réseau domestique peut être traité comme un petit système d'infrastructure
      - OpenWrt donne plus de contrôle qu'un routeur ISP normal
      - DNS, pare-feu, VPN et services locaux devraient être planifiés ensemble
      - dépannage doit suivre les calques: périphérique, lien, IP, DNS, pare-feu, service
      - ajouter des services au routeur augmente la responsabilité et l'impact de défaillance
      - de petits changements de réseau devraient être documentés parce qu'ils affectent le débogage futur
      - un routeur peut être utile comme plate-forme d'apprentissage sans transformer le réseau en chaos

      ## Matériel et outils utilisés

      Le matériel exact peut changer, mais cette configuration a impliqué ou considéré:

      ### Matériel réseau

      - Appareil de routeur OpenWrt
      - Routeur de fibres ISP/chemin ONT
      - commutateur Ethernet géré
      - appareils clients locaux
      - appareils de service optionnels ou mini serveurs

      ### Fonctions OpenWrt

      - configuration de l'interface
      - Zones pare-feu
      - DHCP
      - Transmission DNS
      - transport de port
      - gestion des paquets
      - gestion des services
      - stockage/extension de recouvrement
      - Interface web LuCI
      - Administration de SSH

      ### Services locaux

      - Filtrage DNS chez AdGuard
      - Serveur VPN WireGuard
      - Direction du DDNS
      - petits services autonomes
      - scripts de maintenance

      ### Outils de dépannage

      - SSH
      - LuCI
      - `ip`
      - `logread`
      - `netstat` / `ss`
      - `nslookup`
      - `ping`
      - `traceroute`
      - `nmap`
      - registres des services

      ## Construction prévue

      La construction prévue est un réseau domestique où le routeur ne passe pas seulement le trafic Internet.

      Il devrait prévoir:

      - routage Internet fiable
      - comportement local DHCP/DNS
      - Filtre DNS
      - accès à distance contrôlé via VPN
      - règles de pare-feu compréhensibles
      - accès au service seulement lorsque nécessaire
      - direction de séparation pour les dispositifs à lame/à la maison
      - chemin de récupération propre lorsque le DNS ou les services échouent
      - assez de documentation pour déboguer les problèmes plus tard

      La configuration devrait rester pratique. Elle ne devrait pas devenir compliquée seulement parce qu'OpenWrt permet la complexité.

      ## Rôles des réseaux de base

      ### 1. Rôle du routeur principal

      OpenWrt agit comme la couche de routeur contrôlable.

      Cela signifie qu'il gère ou peut gérer:

      - Connexion WAN
      - Adresse du réseau local
      - DHCP
      - Transmission DNS
      - règles du pare-feu
      - transport de port
      - Accès VPN
      - exposition au service local
      - débogage du réseau

      Le routeur devient l'endroit où les décisions du réseau sont prises.

      ### 2. Rôle du DNS

      DNS est l'une des parties les plus importantes de la configuration parce que quand DNS casse, beaucoup de choses ressemblent à Internet est cassé même lorsque le routage fonctionne encore.

      La configuration comprend le filtrage DNS via AdGuard Home, avec l'attention de:

      - ce qui écoute sur le port 53
      - si les clients utilisent le routeur comme DNS
      - OpenWrt ou AdGuard possède une résolution DNS
      - comportement de repli lorsque AdGuard échoue
      - éviter les conflits entre `dnsmasq` et AdGuard Home

      ### 3. Rôle du VPN

      WireGuard fournit un accès à distance au réseau.

      L'objectif est d'éviter d'exposer les services administratifs sensibles directement à Internet.

      L'accès VPN est utile pour :

      - gestion à distance du routeur
      - atteindre les services locaux
      - accès aux appareils de laboratoire
      - réduire la nécessité d'une exposition directe du public
      - test des services internes de l'extérieur

      ### 4. Rôle de l'hôte de service

      Le routeur peut gérer de petits services, mais cela crée un compromis.

      L'exécution des services directement sur le routeur est pratique, mais cela signifie également que les problèmes de service peuvent affecter le périphérique de contrôle réseau.

      La configuration doit garder ceci à l'esprit:

      - fonctions du routeur critique d'abord
      - services facultatifs
      - journaux et chemins de redémarrage documentés
      - espace de stockage vérifié
      - pannes de service isolées si possible

      ### 5. Direction de segmentation

      Un commutateur géré et une planification VLAN peuvent séparer différents groupes d'appareils.

      Les orientations possibles sont les suivantes :

      - principaux/appareils domestiques
      - dispositifs de laboratoire ou de service
      - appareils invités ou isolés
      - chemins d'accès administrateur seulement

      La segmentation devrait être introduite lorsqu'elle résout un vrai problème, pas seulement parce que les VLAN sont disponibles.

      ## Portée de la prestation

      ### 1. Installation ouverte et accès de base

      La première couche de travail est l'accès de base à OpenWrt:

      - LuCI accessible
      - SSH accessible
      - Interface réseau
      - clients recevant des adresses
      - fonctionnement du routage Internet
      - configuration du routeur sauvegardée si possible

      Sans cette base stable, les services supplémentaires rendent le débogage plus difficile.

      ### 2. Intégration WAN et ISP

      Le côté WAN dépend de la configuration du FAI.

      Les vérifications importantes comprennent :

      - comment le périphérique ISP est connecté
      - qu'OpenWrt soit derrière le routeur ISP ou qu'il manipule directement WAN
      - si le PPPoE est impliqué
      - si le marquage VLAN est nécessaire
      - si la PI publique est accessible ou derrière CGNAT
      - si le transfert de port est possible

      Ces détails affectent tout le reste : VPN, accès à distance, transfert de port et services auto-organisés.

      ### 3. LAN et DHCP

      Le côté local devrait être prévisible.

      Décisions importantes :

      - Sous-réseau LAN
      - Plage DHCP
      - baux statiques pour appareils importants
      - adresse IP du routeur
      - Serveur DNS annoncé aux clients
      - Nommer clairement les dispositifs

      Les baux statiques sont utiles pour les appareils qui nécessitent des règles de pare-feu, des noms DNS ou un accès au service.

      ### 4. Filtre DNS avec la maison AdGuard

      AdGuard Home ajoute le filtrage et la visibilité, mais il devient aussi une dépendance.

      Décisions importantes :

      - AdGuard devrait-il écouter directement sur le port 53?
      - Est-ce qu'OpenWrt `dnsmasq` devrait garder uniquement le DHCP?
      - Comment configurer le DNS en amont?
      - Et si AdGuard s'arrête ?
      - Les clients utilisent-ils AdGuard ?

      Un point d'échec commun est un conflit de port 53 entre AdGuard et le service OpenWrt DNS par défaut.

      ### 5. Accès à distance WireGuard

      WireGuard doit être configuré avec des règles claires :

      - interface serveur
      - client pair
      - IP autorisées
      - port d'écoute
      - règle du pare-feu
      - port avant si derrière un autre routeur
      - Export de code QR pour la configuration du téléphone
      - règles d'accès au réseau local ou à certains services

      Le VPN doit être testé depuis l'extérieur du réseau local.

      ### 6. Exposition au pare-feu et au port

      Les règles de pare-feu doivent rester intentionnelles.

      Questions à poser avant de tout exposer :

      - Ce service doit-il être public?
      - peut-on y accéder via VPN à la place ?
      - L'appareil/service est-il mis à jour?
      - L'authentification est-elle forte ?
      - L'enregistrement est-il disponible?
      - La règle peut-elle être supprimée plus tard?

      Pour la plupart des services internes, l'accès VPN est meilleur que l'exposition publique.

      ### 7. Gestion du stockage et des colis

      Si le périphérique OpenWrt exécute des services supplémentaires, le stockage est important.

      L'extension de recouvrement peut rendre le routeur plus utile, mais cela signifie aussi que l'appareil n'est plus un routeur minimal.

      Contrôles importants:

      - stockage gratuit
      - sources de colis
      - chemins de données de service
      - stratégie de sauvegarde
      - Carte SD ou fiabilité de stockage
      - ce qui se brise si le stockage échoue

      ### 8. Surveillance et rétablissement

      Une configuration utile devrait inclure des façons de récupérer des erreurs.

      Méthodes de récupération importantes:

      - Accès SSH
      - Accès LuCI
      - sauvegarde de configuration
      - accès série si nécessaire
      - paramètres réseau connus
      - changements de pare-feu documentés
      - commandes de redémarrage/redémarrage du routeur
      - commandes de redémarrage de service
      - Registres pour les problèmes DNS/VPN/firewall

      ## Décisions pratiques

      ### Gardez le routeur compréhensible

      OpenWrt peut faire beaucoup de choses, mais le routeur ne devrait pas devenir une pile de services sans papiers.

      Chaque nouveau service devrait avoir une raison, un port, une méthode de redémarrage et un impact de défaillance.

      ### Traiter le DNS comme une infrastructure essentielle

      Le filtrage DNS est utile, mais si DNS échoue, les utilisateurs penseront que tout le réseau est cassé.

      Le chemin DNS devrait être assez simple pour expliquer et déboguer.

      ### Préférez VPN sur exposition publique

      Si un service n'est que pour l'administration personnelle, il devrait généralement être atteint par le biais du VPN.

      L'acheminement du port public devrait être intentionnel et limité.

      ### Ajouter des VLAN uniquement lorsqu'ils résolvent un vrai problème

      Les VLAN sont utiles pour la séparation, mais ils ajoutent aussi la complexité du débogage.

      La conception devrait commencer par la raison de la séparation : niveau de confiance, type d'appareil, rôle de service ou isolement des invités.

      ### Détails spécifiques au FSI

      Les détails des FAI sont importants parce qu'ils affectent WAN, PPPoE, VLAN, CGNAT, le comportement IP public, et le transfert de port.

      Ces détails doivent être enregistrés car ils sont faciles à oublier et douloureux à redécouvrir.

      ## Notes de dépannage

      ### Défaut DNS

      Symptômes:

      - les sites Web ne sont pas chargés
      - `ping 1.1.1.1` fonctionne mais les noms de domaine échouent
      - `nslookup` fois dehors
      - les clients montrent connecté mais ne peuvent pas naviguer normalement

      À vérifier :

      ```bash
      nslookup example.com
      nslookup example.com 1.1.1.1
      netstat -lnup | grep ':53'
      logread | grep -i dns
      ```

      Causes probables:

      - AdGuard ne pas écouter
      - Conflit `dnsmasq`
      - mauvais DNS en amont
      - bloquant le pare-feu DNS
      - clients n'utilisant pas le routeur DNS
      - service local lié à la mauvaise interface

      ### WireGuard non accessible

      Symptômes:

      - pair ne montre aucune poignée de main
      - VPN fonctionne localement mais pas en dehors
      - l'analyse de port ne montre pas l'accès UDP attendu
      - téléphone ne peut pas se connecter sur les données mobiles

      À vérifier :

      ```bash
      wg show
      logread | grep -i wireguard
      ```

      Causes probables:

      - règles de pare-feu manquantes
      - port avant manquant sur routeur en amont
      - mauvais paramètre
      - CGNAT
      - IP mal autorisées
      - inadéquation de la route client

      ### Le transfert de port ne fonctionne pas

      À vérifier :

      - Le service écoute-t-il localement?
      - Le port est-il transmis à l'IP interne correcte ?
      - Est-ce que le routeur de l'ISP se déplace aussi?
      - La PI publique est-elle vraiment publique?
      - Le service est-il TCP ou UDP?
      - Un pare-feu local le bloque ?
      - Vous testez depuis l'extérieur du réseau ?

      Un port apparaissant fermé ne signifie pas toujours qu'OpenWrt est mal. Le chemin ISP/routeur en amont peut être le problème.

      ### Service en cours mais non accessible

      À vérifier :

      ```bash
      service <name> status
      logread -e <name>
      netstat -lntup
      ```

      Causes possibles:

      - service lié à localhost seulement
      - décalage de la zone pare-feu
      - mauvais port
      - mauvaise interface
      - service écrasé
      - fichier environnement/config manquant
      - DNS indique la mauvaise adresse

      ## Ce qu'une configuration terminée devrait montrer

      Une solide version terminée de ce réseau devrait montrer:

      - OpenWrt fonctionne de manière fiable en tant que routeur principal/couche de contrôle
      - clients recevant des paramètres corrects DHCP
      - Le filtrage DNS fonctionne intentionnellement
      - WireGuard accès à distance testé externe
      - règles de pare-feu documentées
      - exposition du public minimisée
      - dispositifs importants utilisant des baux statiques
      - ports de service connus et documentés
      - chemin de sauvegarde/récupération disponible
      - VLANs optionnels conçus autour des besoins réels de séparation
      - Détails WAN spécifiques au FAI enregistrés

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - diagramme de réseau
      - Captures d'écran de l'interface OpenWrt
      - Captures d'écran de la zone pare-feu
      - Captures d'écran DHCP / location statique
      - Capture d'écran du tableau de bord d'AdGuard Home
      - Capture d'écran par les pairs de WireGuard
      - Capture d'écran de la génération QR VPN
      - transfert de port screenshots
      - Sortie `wg show` avec suppression de données sensibles
      - Résultats des essais DNS
      - capture d'écran de stockage/overlay
      - notes sur le comportement du routeur ISP/ONT/WAN

      ## Hypothèses techniques

      Cette configuration suppose que le périphérique OpenWrt est assez puissant et stable pour les services ajoutés.

      Il suppose également que le propriétaire du réseau comprend que l'ajout de filtrage DNS, VPN et services locaux au routeur augmente l'importance du routeur.

      La configuration suppose que certains services sont mieux accessibles via VPN au lieu d'être exposés publiquement.

      ## Principaux risques

      - Mauvaise configuration DNS brisant la navigation normale
      - exposer les services administratifs à Internet
      - perdre l'accès après les changements de pare-feu
      - Le comportement WAN change après les mises à jour du routeur ISP
      - CGNAT bloquer l'accès entrant
      - panne de stockage si les services dépendent d'une superposition étendue
      - Changements en VLAN/pare-feu sans papiers causant une confusion future
      - trop de services sur le routeur
      - s'appuyant sur un seul appareil pour le routage, DNS, VPN et services
      - oubliant de sauvegarder la configuration avant les modifications majeures

      ## État actuel

      La configuration du réseau OpenWrt est une infrastructure en évolution.

      La valeur actuelle n'est pas une architecture finale parfaite. La valeur est dans la construction d'un réseau contrôlable où DNS, VPN, pare-feu, services et dépannage sont compris comme des pièces connectées.

      Cette configuration crée également une base pour les futures notes sur AdGuard Home, WireGuard, DDNS, le transfert de port, le déploiement Docker/service et la segmentation réseau.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas que chaque réseau domestique devrait être construit de cette façon.

      Elle ne prétend pas qu'OpenWrt devrait exécuter tous les services possibles.

      Il ne prétend pas que les filtres VLAN, VPN ou DNS sont toujours nécessaires.

      C'est une note de terrain sur la construction d'un réseau pratique contrôlable et l'apprentissage des problèmes qui apparaissent lorsqu'un routeur domestique devient un petit dispositif d'infrastructure.

      ## À emporter pratique

      Une bonne configuration OpenWrt ne consiste pas à activer toutes les fonctionnalités avancées.

      La partie utile est d'avoir le contrôle et la compréhension:

      - comment les clients obtiennent des adresses
      - où le DNS est manipulé
      - quel trafic est autorisé
      - ce qui est exposé publiquement
      - comment fonctionne l'accès à distance
      - où les services fonctionnent
      - comment récupérer quand quelque chose casse

      C'est ce qui rend le réseau durable au lieu de simplement personnalisé.
seoTitle: "OpenWrt Home Network Setup"
seoDescription: "A practical field note about building and troubleshooting an OpenWrt home network with routing, DNS, VPN, VLAN planning, and small service hosting."
---

## Why This Note Exists

A home network can stay simple when it only needs Wi-Fi and internet access.

It becomes more interesting when the router also becomes the control point for DNS filtering, VPN access, local services, traffic separation, port forwarding, and remote maintenance.

This note documents the direction of an OpenWrt-based home network setup. The focus is not to show that OpenWrt was installed. The focus is to explain how the network was treated as a small system with routing, services, access, failure points, and recovery paths.

## Network Context

The setup is based around an OpenWrt router used as the main controllable network device.

The environment includes:

- fiber internet connection
- ISP router/ONT situation
- OpenWrt router
- managed switch direction
- local services
- DNS filtering
- VPN remote access
- port forwarding where needed
- storage expansion for local services
- troubleshooting across DNS, firewall, and service layers

The setup changed over time, which is normal for a home/lab network. The important part is keeping the network understandable while adding capabilities.

## What This Setup Is Meant To Prove

- a home network can be treated like a small infrastructure system
- OpenWrt gives more control than a normal ISP router
- DNS, firewall, VPN, and local services should be planned together
- troubleshooting should follow layers: device, link, IP, DNS, firewall, service
- adding services to the router increases responsibility and failure impact
- small network changes should be documented because they affect future debugging
- a router can be useful as a learning platform without turning the network into chaos

## Hardware and Tools Used

The exact hardware may change, but this setup involved or considered:

### Network Hardware

- OpenWrt router device
- ISP fiber router/ONT path
- managed Ethernet switch
- local client devices
- optional service devices or mini servers

### OpenWrt Features

- interface configuration
- firewall zones
- DHCP
- DNS forwarding
- port forwarding
- package management
- service management
- storage/overlay expansion
- LuCI web interface
- SSH administration

### Local Services

- AdGuard Home DNS filtering
- WireGuard VPN server
- DDNS direction
- small self-hosted services
- maintenance scripts

### Troubleshooting Tools

- SSH
- LuCI
- `ip`
- `logread`
- `netstat` / `ss`
- `nslookup`
- `ping`
- `traceroute`
- `nmap`
- service logs

## Intended Build

The intended build is a home network where the router is not just passing internet traffic.

It should provide:

- reliable internet routing
- local DHCP/DNS behavior
- DNS filtering
- controlled remote access through VPN
- firewall rules that are understandable
- service access only where needed
- separation direction for home/lab devices
- clean recovery path when DNS or services fail
- enough documentation to debug issues later

The setup should stay practical. It should not become complicated only because OpenWrt allows complexity.

## Core Network Roles

### 1. Main Router Role

OpenWrt acts as the controllable router layer.

This means it handles or can handle:

- WAN connection
- LAN addressing
- DHCP
- DNS forwarding
- firewall rules
- port forwarding
- VPN access
- local service exposure
- network debugging

The router becomes the place where network decisions are made.

### 2. DNS Role

DNS is one of the most important parts of the setup because when DNS breaks, many things look like the internet is broken even when routing still works.

The setup includes DNS filtering through AdGuard Home, with attention to:

- what listens on port 53
- whether clients use the router as DNS
- whether OpenWrt or AdGuard owns DNS resolution
- fallback behavior when AdGuard fails
- avoiding conflicts between `dnsmasq` and AdGuard Home

### 3. VPN Role

WireGuard provides remote access back into the network.

The goal is to avoid exposing sensitive admin services directly to the internet.

VPN access is useful for:

- managing the router remotely
- reaching local services
- accessing lab devices
- reducing the need for direct public exposure
- testing internal services from outside

### 4. Service Host Role

The router can run small services, but this creates a trade-off.

Running services directly on the router is convenient, but it also means service problems can affect the network control device.

The setup should keep this in mind:

- critical router functions first
- optional services second
- logs and restart paths documented
- storage space checked
- service failures isolated where possible

### 5. Segmentation Direction

A managed switch and VLAN planning can separate different groups of devices.

Possible directions include:

- main/home devices
- lab or service devices
- guest or isolated devices
- admin-only access paths

Segmentation should be introduced when it solves a real problem, not just because VLANs are available.

## Delivery Scope

### 1. OpenWrt Installation and Base Access

The first working layer is basic access to OpenWrt:

- LuCI reachable
- SSH reachable
- LAN interface working
- clients receiving addresses
- internet routing working
- router configuration backed up where possible

Without this stable base, extra services only make debugging harder.

### 2. WAN and ISP Integration

The WAN side depends on the ISP setup.

Important checks include:

- how the ISP device is connected
- whether OpenWrt is behind the ISP router or directly handling WAN
- whether PPPoE is involved
- whether VLAN tagging is required
- whether the public IP is reachable or behind CGNAT
- whether port forwarding is possible

These details affect everything else: VPN, remote access, port forwarding, and self-hosted services.

### 3. LAN and DHCP

The LAN side should be predictable.

Important decisions:

- LAN subnet
- DHCP range
- static leases for important devices
- router IP address
- DNS server advertised to clients
- naming devices clearly

Static leases are useful for devices that need firewall rules, DNS names, or service access.

### 4. DNS Filtering with AdGuard Home

AdGuard Home adds filtering and visibility, but it also becomes a dependency.

Important decisions:

- should AdGuard listen directly on port 53?
- should OpenWrt `dnsmasq` keep DHCP only?
- how should upstream DNS be configured?
- what happens if AdGuard stops?
- are clients actually using AdGuard?

A common failure point is a port 53 conflict between AdGuard and the default OpenWrt DNS service.

### 5. WireGuard Remote Access

WireGuard should be configured with clear rules:

- server interface
- client peer
- allowed IPs
- listening port
- firewall rule
- port forwarding if behind another router
- QR code export for phone setup
- access rules to LAN or selected services

The VPN should be tested from outside the local network.

### 6. Firewall and Port Exposure

Firewall rules should stay intentional.

Questions to ask before exposing anything:

- does this service need to be public?
- can it be accessed through VPN instead?
- is the device/service updated?
- is authentication strong?
- is logging available?
- can the rule be removed later?

For most internal services, VPN access is better than public exposure.

### 7. Storage and Package Management

If the OpenWrt device runs extra services, storage matters.

Overlay expansion can make the router more useful, but it also means the device is no longer a minimal router.

Important checks:

- free storage
- package sources
- service data paths
- backup strategy
- SD card or storage reliability
- what breaks if storage fails

### 8. Monitoring and Recovery

A useful setup should include ways to recover from mistakes.

Important recovery methods:

- SSH access
- LuCI access
- configuration backup
- serial access if needed
- known-good network settings
- documented firewall changes
- router reboot/restart commands
- service restart commands
- logs for DNS/VPN/firewall issues

## Practical Decisions

### Keep the router understandable

OpenWrt can do many things, but the router should not become a pile of undocumented services.

Every new service should have a reason, a port, a restart method, and a failure impact.

### Treat DNS as critical infrastructure

DNS filtering is useful, but if DNS fails, users will think the whole network is broken.

The DNS path should be simple enough to explain and debug.

### Prefer VPN over public exposure

If a service is only for personal administration, it should usually be reached through VPN.

Public port forwarding should be intentional and limited.

### Add VLANs only when they solve a real problem

VLANs are useful for separation, but they also add debugging complexity.

The design should start from the reason for separation: trust level, device type, service role, or guest isolation.

### Document ISP-specific details

ISP details matter because they affect WAN, PPPoE, VLANs, CGNAT, public IP behavior, and port forwarding.

These details should be recorded because they are easy to forget and painful to rediscover.

## Troubleshooting Notes

### DNS Failure

Symptoms:

- websites do not load
- `ping 1.1.1.1` works but domain names fail
- `nslookup` times out
- clients show connected but cannot browse normally

Things to check:

```bash
nslookup example.com
nslookup example.com 1.1.1.1
netstat -lnup | grep ':53'
logread | grep -i dns
```

Likely causes:

- AdGuard not listening
- `dnsmasq` conflict
- wrong upstream DNS
- firewall blocking DNS
- clients not using router DNS
- local service bound to the wrong interface

### WireGuard Not Reachable

Symptoms:

- peer shows no handshake
- VPN works locally but not outside
- port scan does not show expected UDP access
- phone cannot connect on mobile data

Things to check:

```bash
wg show
logread | grep -i wireguard
```

Likely causes:

- firewall rule missing
- port forwarding missing on upstream router
- wrong endpoint
- CGNAT
- wrong allowed IPs
- client route mismatch

### Port Forwarding Not Working

Things to check:

- is the service listening locally?
- is the port forwarded to the correct internal IP?
- is the ISP router also forwarding?
- is the public IP really public?
- is the service TCP or UDP?
- is a local firewall blocking it?
- are you testing from outside the network?

A port appearing closed does not always mean OpenWrt is wrong. The upstream ISP/router path may be the problem.

### Service Running but Not Accessible

Things to check:

```bash
service <name> status
logread -e <name>
netstat -lntup
```

Possible causes:

- service bound to localhost only
- firewall zone mismatch
- wrong port
- wrong interface
- service crashed
- missing environment/config file
- DNS points to the wrong address

## What A Finished Setup Should Show

A strong finished version of this network should show:

- OpenWrt running reliably as the main router/control layer
- clients receiving correct DHCP settings
- DNS filtering working intentionally
- WireGuard remote access tested externally
- firewall rules documented
- public exposure minimized
- important devices using static leases
- service ports known and documented
- backup/recovery path available
- optional VLANs designed around real separation needs
- ISP-specific WAN details recorded

## Evidence Worth Capturing

Useful evidence for this note would include:

- network diagram
- OpenWrt interface screenshots
- firewall zone screenshots
- DHCP/static lease screenshots
- AdGuard Home dashboard screenshot
- WireGuard peer screenshot
- VPN QR generation screenshot
- port forwarding screenshots
- `wg show` output with sensitive data removed
- DNS test results
- storage/overlay screenshot
- notes about ISP router/ONT/WAN behavior

## Technical Assumptions

This setup assumes the OpenWrt device is powerful and stable enough for the services being added.

It also assumes that the network owner understands that adding DNS filtering, VPN, and local services to the router increases the router’s importance.

The setup assumes that some services are better reached through VPN instead of being exposed publicly.

## Key Risks

- DNS misconfiguration breaking normal browsing
- exposing admin services to the internet
- losing access after firewall changes
- WAN behavior changing after ISP router updates
- CGNAT blocking inbound access
- storage failure if services depend on expanded overlay
- undocumented VLAN/firewall changes causing future confusion
- running too many services on the router
- relying on a single device for routing, DNS, VPN, and services
- forgetting to back up configuration before major changes

## Current State

The OpenWrt network setup is an evolving home/lab infrastructure.

The current value is not a perfect final architecture. The value is in building a controllable network where DNS, VPN, firewall, services, and troubleshooting are understood as connected parts.

This setup also creates a base for future notes about AdGuard Home, WireGuard, DDNS, port forwarding, Docker/service deployment, and network segmentation.

## What This Note Does Not Claim

This note does not claim that every home network should be built this way.

It does not claim that OpenWrt should run every possible service.

It does not claim that VLANs, VPNs, or DNS filters are always needed.

It is a field note about building a practical controllable network and learning from the problems that appear when a home router becomes a small infrastructure device.

## Practical Takeaway

A good OpenWrt setup is not about enabling every advanced feature.

The useful part is having control and understanding:

- how clients get addresses
- where DNS is handled
- what traffic is allowed
- what is exposed publicly
- how remote access works
- where services run
- how to recover when something breaks

That is what makes the network maintainable instead of just customized.
