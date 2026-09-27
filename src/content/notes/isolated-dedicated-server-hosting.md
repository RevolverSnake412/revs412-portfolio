---
resume: false
title: "Isolated Dedicated-Server Hosting"
slug: "isolated-dedicated-server-hosting"
summary: "Field notes from hosting a dedicated service at home behind an isolated VLAN, using an OpenWrt router, managed-switch tagging, and a Proxmox server."
resumeSummary: >-
  Designed a home-hosted dedicated-service environment that keeps externally exposed workloads separate from the primary LAN. The architecture uses OpenWrt routing, managed-switch VLAN tagging, router-on-a-stick configuration, firewall zones, and a Proxmox host to define physical and logical boundaries between services, administration, and trusted devices. The note covers addressing, port exposure, traffic rules, and host placement, demonstrating how segmentation limits the effect of a compromised or unstable public-facing workload without making the environment impossible to operate.
category: "Server Hosting"
tags:
  - dedicated-server
  - proxmox
  - openwrt
  - vlan
  - tplink
  - tl-sg105e
  - home-server
  - server-hosting
  - networking
  - backups
date: "2026-07-08"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Hébergement d’un service dédié sur réseau isolé"
    category: "Hébergement de services"
    summary: "Notes sur l’hébergement à domicile d’un service dédié derrière un VLAN isolé, avec OpenWrt, commutateur administrable, Proxmox, redirection de port et sauvegardes."
    resumeSummary: >-
      L'architecture utilise le routage OpenWrt, le marquage VLAN géré, la configuration routeur-on-a-stick,
      les zones pare-feu et un hôte Proxmox pour définir les limites physiques et logiques entre les services,
      l'administration et les appareils de confiance. La note traite de l'exposition au port, des règles de
      circulation et du placement de l'hôte, montrant comment la segmentation limite l'effet d'une charge de
      travail compromise ou instable du public sans rendre l'environnement impossible à exploiter.
    body: |-

      ## Pourquoi cette note existe

      C'était le seul service dédié que j'ai hébergé de chez moi au lieu d'un VPS.

      La partie importante n'était pas seulement qu'un service dédié était en cours d'exécution. La partie utile était la conception du réseau autour de lui: le serveur vivait derrière un VLAN isolé homelab/serveur, hébergé du côté Proxmox, tandis que le réseau domestique normal restait séparé.

      La configuration a utilisé un Raspberry Pi 5 en cours d'exécution OpenWrt comme routeur, avec un interrupteur TP-Link TL-SG105E géré étiquetant VLAN.

      Cela a rendu le projet plus qu'un service dédié. Il est devenu une configuration pratique d'infrastructure domiciliaire impliquant le réseau routeur-on-a-stick, la séparation VLAN, l'hébergement Proxmox, les règles de pare-feu, l'acheminement de port, et la persistance des données.

      ## Contexte du serveur

      Le service dédié a été hébergé à la maison.

      L'environnement comprenait:

      - connexion internet à domicile
      - Raspberry Pi 5 fonctionne OpenWrt comme routeur principal
      - Routeur mono-Ethernet-on-a-stick
      - Commutateur géré TP-Link TL-SG105E
      - Signalisation VLAN sur l'interrupteur
      - Accueil VLAN 10
      - Homelab/Serveur VLAN 20
      - Serveur Proxmox connecté au serveur isolé VLAN
      - service dédié à partir de l'environnement Proxmox
      - Transfert de port UDP pour la pile d'application
      - séparation du pare-feu entre les appareils domestiques et les appareils serveurs
      - persistance des données et sauvegardes

      Cette configuration est distincte des derniers services hébergés par VPS. Elle fait partie de l'infrastructure domestique et du côté homelab du travail.

      ## Ce que cette configuration veut prouver

      - un réseau domestique peut accueillir un service public sans rester à l'appartement
      - Le marquage VLAN sur un petit commutateur géré est utile même dans une configuration à domicile
      - un Raspberry Pi 5 avec OpenWrt peut agir comme le point de contrôle routeur/firewall
      - Proxmox peut fournir la couche de calcul pour les petits services auto-organisés
      - un serveur VLAN réduit l'exposition aux appareils domestiques normaux
      - port transiting devrait exposer seulement les ports de service requis
      - les règles de pare-feu devraient définir ce que le serveur VLAN peut et ne peut pas atteindre
      - les fichiers de données de service ont besoin de sauvegardes parce que le service dédié est état
      - l'hébergement à domicile nécessite plus de réflexion réseau que l'hébergement VPS

      ## Pioche et outils utilisés

      ### Routeur et calque réseau

      - Framboise Pi 5
      - Ouvrir
      - réseau routeur-on-a-stick
      - Interfaces VLAN
      - Zones pare-feu
      - DHCP
      - transport de port
      - Pays
      - Commutateur géré TP-Link TL-SG105E
      - Signalisation VLAN et ports d'accès non étiquetés

      ### Mise en page du VLAN

      - Accueil VLAN 10
      - Homelab/Serveur VLAN 20
      - Page d'accueil direction du sous-réseau: `192.168.10.0/24`
      - Sous-réseau serveur/homelab direction: `192.168.20.0/24`
      - malle étiqueté entre routeur OpenWrt et commutateur TP-Link
      - port d'accès non étiqueté pour la maison / côté PA
      - port d'accès non étiqueté pour Proxmox / côté serveur

      ### Couche de virtualisation

      - Serveur Proxmox
      - VM / direction d'accueil du conteneur
      - serveur attaché au VLAN homelab/serveur
      - stockage persistant des données de service
      - gestion de console ou SSH

      ### pile d'application calque

      - service dédié
      - Environnement du serveur Linux
      - direction du script de démarrage
      - fichiers de données de service
      - nom de service, ensemble de données et configuration de contrôle d'accès
      - Ports UDP `2456-2458`

      ### Couche de maintenance

      - journaux
      - sauvegardes
      - redémarrer le workflow
      - Mettre à jour le flux de travail
      - test de connexion externe

      ## Construction prévue

      La construction prévue était un service dédié hébergé à domicile qui restait isolé du réseau local principal.

      Une configuration terminée devrait permettre :

      - Appareils domestiques normaux pour rester sur VLAN 10
      - appareils homelab/serveur pour rester sur VLAN 20
      - Proxmox hébergera le service dédié depuis le serveur VLAN
      - OpenWrt sur route et pare-feu entre VLANs
      - le changement TP-Link pour le trafic VLAN tag/untag correctement
      - Uniquement les ports UDP à transférer depuis WAN
      - le serveur VLAN à bloquer d'accéder librement au VLAN d'origine
      - accès admin au serveur pour rester contrôlé
      - fichiers de données de service à persister et être sauvegardé

      ## Topologie physique et logique

      La topologie pratique ressemblait à ceci :

      ```txt
      Internet
        ↓
      ISP device / bridge path
        ↓
      Raspberry Pi 5 running OpenWrt
        ↓ tagged trunk
      TP-Link TL-SG105E managed switch
        ├─ Home VLAN 10 → AP / normal home devices
        └─ Server VLAN 20 → Proxmox server → dedicated service
      ```

      Le Raspberry Pi a géré les décisions de routage et de pare-feu.

      Le TP-Link TL-SG105E a géré le marquage VLAN et la séparation d'accès-port.

      Le serveur Proxmox vivait du côté du serveur/homelab isolé.

      ## Conception VLAN

      La séparation clé était :

      ```txt
      VLAN 10 → Home network
      VLAN 20 → Homelab / server network
      ```

      Exemple de direction du sous-réseau :

      ```txt
      VLAN 10 Home:          192.168.10.0/24
      VLAN 20 Homelab/Server: 192.168.20.0/24
      ```

      Le service dédié appartenait à VLAN 20, et non à la maison normale VLAN.

      Cela importe parce qu'un service public ne devrait pas s'asseoir occasionnellement à côté d'appareils personnels sur le même réseau plat.

      ## Signalisation VLAN TP-Link TL-SG105E

      Le TP-Link TL-SG105E est le petit commutateur géré qui a rendu possible la division VLAN.

      Le rôle de changement général:

      - un port fonctionne comme un coffre étiqueté vers le routeur OpenWrt
      - un ou plusieurs ports agissent comme des ports d'accès VLAN 10
      - un ou plusieurs ports agissent comme des ports d'accès Homelab/Server VLAN 20 non identifiés
      - Les PVID décident à quel trafic non identifié VLAN appartient

      Exemple de direction:

      ```txt
      Port to OpenWrt/Raspberry Pi: tagged VLAN 10 + VLAN 20
      Port to AP/Home side:         untagged VLAN 10, PVID 10
      Port to Proxmox/server side:  untagged VLAN 20, PVID 20
      ```

      Les numéros de port exacts peuvent changer, mais le rôle de chaque port doit être clair.

      L'interrupteur n'est pas seulement un diviseur Ethernet stupide ici. Il fait partie de la conception du réseau.

      ## Rôle du routeur ouvert sur un emplacement

      Le Raspberry Pi 5 utilisait OpenWrt comme point de contrôle routeur/firewall.

      Parce que le Pi a une interface Ethernet unique, la configuration suit une conception de style routeur-on-a-stick:

      ```txt
      eth0 tagged trunk
        ├─ VLAN 10 interface
        └─ VLAN 20 interface
      ```

      OpenWrt crée ensuite des interfaces logiques distinctes pour chaque VLAN.

      Exemple de direction:

      ```txt
      Home interface:    br-lan.10 or eth0.10 → 192.168.10.1/24
      Homelab interface: br-lan.20 or eth0.20 → 192.168.20.1/24
      ```

      Le nom exact du périphérique dépend de la version OpenWrt et de la configuration du pont, mais le concept est le même.

      OpenWrt possède :

      - routage entre VLANs
      - DHCP par VLAN
      - Direction DNS
      - Zones pare-feu
      - NAT vers WAN
      - transfert de port de WAN vers le serveur VLAN

      ## Conception du pare-feu

      Le pare-feu rend la séparation VLAN significative.

      Une politique pratique:

      ### Accueil VLAN 10

      Les appareils domestiques peuvent accéder à Internet.

      Les appareils Home/Admin peuvent être autorisés à accéder aux services VLAN du serveur sélectionné pour la gestion.

      ### Serveur VLAN 20

      Les serveurs peuvent accéder à Internet pour des mises à jour.

      Les périphériques serveur ne devraient pas lancer librement des connexions dans le VLAN Home.

      ### WAN vers le serveur VLAN

      WAN ne devrait atteindre le service dédié que par l'intermédiaire des ports UDP requis.

      Pour la pile d'application:

      ```txt
      UDP 2456-2458 → dedicated service IP on VLAN 20
      ```

      ### WAN aux services administratifs

      Ne pas exposer:

      - Interface web Proxmox
      - LuCI ouvert
      - SSH
      - tableaux de bord internes
      - autres services de labo

      Les ports de service dédiés sont la seule exposition publique prévue.

      ## Rôle de Proxmox

      Proxmox a fourni la couche de calcul.

      Le service dédié s'est déroulé à partir de l'environnement Proxmox, soit comme une direction de service de type VM ou conteneur.

      Les principales responsabilités de Proxmox étaient les suivantes :

      - attacher le serveur invité au réseau VLAN/serveur correct
      - fournir CPU/RAM/stockage
      - garder les fichiers de données de service persistante
      - permettre l'accès console/SSH pour la gestion
      - séparer le service des appareils personnels
      - faciliter la reconstruction ou le déplacement du service plus tard

      L'hôte Proxmox lui-même ne devrait pas être exposé à Internet.

      ## applications empiler Ports serveurs

      pile d'application utilise des ports UDP.

      La direction du port exposé:

      ```txt
      2456-2458 UDP
      ```

      La voie à suivre devrait être:

      ```txt
      WAN UDP 2456-2458
        → OpenWrt firewall/NAT
        → dedicated service IP on VLAN 20
      ```

      Si les utilisateurs ne peuvent pas se connecter, les premiers contrôles doivent être :

      - Le service dédié fonctionne-t-il?
      - Le serveur écoute-t-il le port attendu ?
      - OpenWrt achemine UDP, pas TCP ?
      - est-ce que le point vers le serveur VLAN 20 actuel ?
      - Le pare-feu permet-il le WAN à cette destination?
      - Le chemin IP public/FAI est-il accessible?

      ## Pourquoi l'isolement VLAN compte ici

      Le service dédié est public. Même si le service dédié lui-même est normal, il reçoit du trafic de l'extérieur du réseau domestique.

      Cela lui donne un niveau de confiance différent de:

      - PC personnels
      - téléphones
      - Dispositifs AP/home
      - pages d'administration du routeur
      - tableaux de bord privés

      Le serveur VLAN limite ce qui se passe si le service, l'invité ou la configuration a un problème.

      Il ne rend pas la configuration magiquement sécurisée, mais il réduit la confiance inutile entre les appareils.

      ## Configuration du serveur

      Un service dédié nécessite normalement:

      ```txt
      server name
      data set name
      password
      port
      public/private listing setting
      data path
      ```

      Le mot de passe ne doit pas être affiché dans les captures d'écran publiques ou engagé dans un dépôt.

      La commande de démarrage doit être enveloppée dans un script, par exemple :

      ```txt
      start_dedicated-service.sh
      ```

      Le script rend le redémarrage/mise à jour plus cohérent.

      ## Données persistantes

      Les fichiers de données de service sont la partie la plus importante du service.

      L'installation du serveur peut être recréée. Les données de service ne doivent pas être perdues occasionnellement.

      Pratiques importantes:

      - savoir où les fichiers de données de service sont stockés
      - garder le chemin de sauvegarde persistant à l'intérieur de l'invité Proxmox
      - éviter les chemins de conteneurs temporaires pour les données de service
      - sauvegarder les données de service avant les mises à jour
      - sauvegarder avant de modifier le stockage VM/conteneur
      - conserver au moins une sauvegarde en dehors du répertoire du serveur actif

      ## Direction de sauvegarde

      Cibles minimales de sauvegarde & #160;:

      ```txt
      application stack service data files
      startup script
      service file if used
      configuration notes
      ```

      Exemple de direction de sauvegarde :

      ```bash
      tar -czf dedicated-service-backup-$(date +%F).tar.gz /path/to/dedicated-service/service-data
      ```

      Pour une configuration Proxmox hébergée à domicile, les sauvegardes ne devraient pas exister seulement à l'intérieur du même client. Une copie à l'extérieur du VM/container est plus sûre.

      ## Mettre à jour le flux de travail

      Un flux de mise à jour sûr:

      1. informer les utilisateurs si nécessaire
      2. arrêter le service dédié
      3. sauvegarder les fichiers de données de service
      4. mettre à jour les fichiers du serveur
      5. Démarrer le serveur
      6. vérifier les journaux
      7. test de l'extérieur du réseau domestique
      8. garder la sauvegarde

      Pour cette configuration, vérifiez également :

      - L'IP invité de Proxmox n'a pas changé
      - L'affectation de VLAN n'a pas changé
      - OpenWrt port vers l'avant indique toujours l'IP correcte
      - L'adhésion au port de commutation de TP-Link correspond toujours au VLAN prévu

      ## Essais externes d'accès

      Les tests effectués à l'intérieur du réseau domestique ne suffisent pas.

      Bons tests :

      - essai à partir de données mobiles
      - demander à un utilisateur distant de se connecter
      - vérifier l'emplacement des points IP/domaine public
      - confirmer l'acheminement du port OpenWrt
      - vérifier les journaux de la pile d'application après la tentative de connexion

      Les tests LAN peuvent masquer des problèmes NAT, pare-feu, CGNAT ou de renvoi.

      ## Décisions pratiques

      ### Gardez le service dédié hors de la maison VLAN

      Le serveur a été exposé au trafic extérieur, donc il appartenait à la maison/serveur VLAN, pas à la maison VLAN.

      ### Utiliser le TL-SG105E pour les ports d'accès VLAN

      Le commutateur géré a rendu un seul coffre OpenWrt utilisable pour plusieurs réseaux séparés.

      ### Laissez OpenWrt appliquer les règles

      Le commutateur sépare le trafic à la couche 2, mais OpenWrt décide du routage et du comportement du pare-feu entre les VLAN.

      ### Exposez seulement les ports UDP

      Aucun Proxmox, SSH, LuCI, tableaux de bord ou panneaux de gestion ne devraient être publics.

      ### Conserver les sauvegardes de données de service séparément du serveur install

      Les données de service sont l'état réel. L'installation peut être reconstruite.

      ### Documenter les rôles des ports

      Avec un petit commutateur géré, il est facile d'oublier quel port physique est le tronc, la maison ou le serveur.

      Les rôles portuaires devraient être notés.

      ## Points communs de défaillance

      ### VLAN Marquage incorrect sur le commutateur

      Symptômes:

      - Proxmox/serveur n'a pas d'IP
      - Les appareils domestiques atterrissent sur le mauvais sous-net
      - serveur ne peut pas atteindre routeur
      - points de port vers l'avant correctement mais le trafic n'arrive jamais au serveur

      Causes probables:

      - mauvaise inscription/adhésion non autorisée
      - mauvaise PVID
      - Port du coffre OpenWrt non étiqueté pour VLAN 20
      - Port Proxmox/serveur non démarqué VLAN 20
      - AP/home port accidentellement placé dans le serveur VLAN

      ### Interface VLAN ouverte incorrecte

      Symptômes:

      - VLAN existe sur interrupteur mais pas routé
      - DHCP manquant sur un VLAN
      - zone de pare-feu manquante
      - serveur VLAN n'a pas d'internet
      - les règles inter-VLAN se comportent mal

      Causes probables:

      - mauvais périphérique d'interface
      - mauvaise configuration de filtrage VLAN de pont
      - DHCP non activé pour VLAN 20
      - zone de pare-feu non assignée
      - NAT/transfert non autorisé au besoin

      ### utilisateurs ne peuvent pas se connecter de l'extérieur

      Causes probables:

      - ports UDP non transmis
      - TCP transmis par erreur au lieu de UDP
      - transmettre les points à l'ancienne IP du serveur
      - serveur est sur le mauvais VLAN
      - blocs de pare-feu WAN vers VLAN 20
      - ISP/question de propriété intellectuelle publique
      - CGNAT
      - service dédié non opérationnel
      - IP/domaine public modifié

      ### Serveur fonctionne localement mais pas à distance

      Causes probables:

      - LAN test contourne le chemin WAN
      - confusion de réflexion NAT
      - pare-feu permet LAN mais pas WAN
      - ISP/routeur en amont
      - mauvaise méthode d'essai externe
      - UDP bloqué

      ### Réseau invité Proxmox mal configuré

      Causes probables:

      - invité attaché au mauvais pont
      - Inadéquation de la balise VLAN
      - IP invité sur le mauvais sous-net
      - conflits IP statiques
      - Pont hôte Proxmox non connecté au port de commutation correct
      - Interrupteur du port PVID

      ### Données de service semble réinitialiser

      Causes probables:

      - mauvais nom du jeu de données
      - mauvais chemin de sauvegarde
      - Stockage non persistant
      - changement du chemin invité/conteneur
      - serveur commencé avec une nouvelle donnée de service vide
      - sauvegarde restaurée à un mauvais emplacement

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - Raspberry Pi 5 fonctionne OpenWrt comme routeur/pare-feu
      - TL-SG105E pour la manipulation du marquage VLAN
      - étiqueté coffre d'OpenWrt au commutateur
      - Accueil VLAN 10 séparé du serveur VLAN 20
      - Proxmox connecté au serveur/homelab VLAN
      - service dédié fonctionnant du côté Proxmox
      - UDP `2456-2458` transmis uniquement au service dédié
      - serveur VLAN bloqué d'accéder librement à la maison VLAN
      - accès administrateur contrôlé à partir de périphériques de confiance
      - chemin de données de service documenté
      - sauvegardes disponibles
      - connection externe testée
      - aucune exposition publique aux services Proxmox/OpenWrt/admin

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - diagramme de réseau
      - Capture d'écran de l'interface VLAN OpenWrt
      - Capture d'écran de la zone de pare-feu OpenWrt
      - Capture d'écran de transfert de port OpenWrt
      - TP-Link TL-SG105E 802.1Q Tableau VLAN
      - TP-Link TL-SG105E Tableau PVID
      - Capture d'écran du pont réseau Proxmox
      - IP invité sur VLAN 20
      - script de démarrage de la pile d'application
      - journaux de pile d'application
      - liste des dossiers de données de service
      - liste des archives de sauvegarde
      - Essai de raccordement externe

      ## Hypothèses techniques

      Cette configuration suppose que la connexion à la maison supporte l'accès à l'entrée ou a un chemin de transfert de port utilisable.

      Il suppose que le TP-Link TL-SG105E est configuré avec un abonnement VLAN correctement étiqueté et non étiqueté.

      Il suppose qu'OpenWrt possède le routage et le pare-feu entre VLANs.

      Il suppose que la pile d'applications Proxmox est placée sur VLAN 20 ou le réseau de serveurs prévu.

      Il suppose également que les fichiers de données de service sont stockés de façon persistante et sauvegardés avant les changements risqués.

      ## Principaux risques

      - mauvais commutateur PVID dispositifs de placement dans le mauvais VLAN
      - Système ouvert malle manquant VLAN 20 marquage
      - exposer la gestion de Proxmox par erreur
      - transitant trop de ports
      - permettant le serveur VLAN dans le VLAN d'origine trop largement
      - IP du serveur interne changer et casser l'avant
      - perte de données de service à partir d'un chemin de sauvegarde peu clair
      - pas de sauvegarde avant les mises à jour
      - Comportement CGNAT ou ISP empêchant l'hébergement entrant
      - test uniquement à partir de LAN et en supposant que les travaux de WAN
      - perdre la trace des rôles de port de commutation physique

      ## État actuel

      Cette note représente la direction de configuration de la pile d'application hébergée.

      Contrairement aux services hébergés par VPS, cette configuration appartient au côté infrastructure domestique : routage Raspberry Pi 5 OpenWrt, marquage VLAN TL-SG105E, hébergement Proxmox, serveur isolé VLAN, renvoi de port et conception de pare-feu.

      La valeur principale est que le serveur n'a pas été traité comme un processus aléatoire sur le réseau d'accueil. Il a été hébergé derrière un chemin réseau séparé avec une exposition contrôlée.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas que chaque service dédié devrait être hébergé à domicile.

      Elle ne prétend pas que les VLAN soient nécessaires pour chaque petit serveur.

      Il ne prétend pas qu'une configuration à domicile est automatiquement plus sûre qu'un VPS.

      Il documente une configuration pratique spécifique: un service dédié hébergé à la maison derrière un réseau Proxmox isolé VLAN utilisant OpenWrt et un commutateur géré TP-Link TL-SG105E.

      ## À emporter pratique

      Ce projet a été utile parce qu'il a combiné l'hébergement de service avec la conception de réseau réel.

      Les éléments importants étaient les suivants:

      - Raspberry Pi 5 en cours d'exécution OpenWrt
      - routeur-on-a-stick itinéraire VLAN
      - Marquage VLAN TP-Link TL-SG105E
      - Accueil VLAN 10
      - Homelab/Serveur VLAN 20
      - Proxmox comme hôte serveur
      - pile d'application UDP `2456-2458`
      - Séparation du pare-feu
      - stockage persistant des données
      - sauvegardes
      - test d'accès externe

      Cela en fait une note d'infrastructure de homelab, pas seulement une note de service dédiée.
seoTitle: "Isolated Dedicated-Server Hosting Behind a VLAN"
seoDescription: "A practical note about hosting a dedicated service at home through a VLAN-isolated Proxmox setup using OpenWrt, router-on-a-stick networking, managed-switch tagging, port forwarding, and backups."
---

## Why This Note Exists

This was the only dedicated service I hosted from home instead of on a VPS.

The important part was not only that a dedicated service was running. The useful part was the network design around it: the server lived behind an isolated homelab/server VLAN, hosted from the Proxmox side, while the normal home network stayed separated.

The setup used a Raspberry Pi 5 running OpenWrt as the router, with a TP-Link TL-SG105E managed switch handling VLAN tagging.

That made the project more than a dedicated service. It became a practical home infrastructure setup involving router-on-a-stick networking, VLAN separation, Proxmox hosting, firewall rules, port forwarding, and data persistence.

## Server Context

The dedicated service was hosted at home.

The environment included:

- home internet connection
- Raspberry Pi 5 running OpenWrt as the main router
- single-Ethernet router-on-a-stick style routing
- TP-Link TL-SG105E managed switch
- VLAN tagging on the switch
- Home VLAN 10
- Homelab/Server VLAN 20
- Proxmox server connected to the isolated server VLAN
- dedicated service running from the Proxmox environment
- UDP port forwarding for application stack
- firewall separation between home devices and server devices
- data persistence and backups

This setup is distinct from the later VPS-hosted services. It belongs to the home-infrastructure and homelab side of the work.

## What This Setup Is Meant To Prove

- a home network can host a public-facing service without staying flat
- VLAN tagging on a small managed switch is useful even in a home setup
- a Raspberry Pi 5 with OpenWrt can act as the router/firewall control point
- Proxmox can provide the compute layer for small self-hosted services
- a server VLAN reduces exposure to normal home devices
- port forwarding should expose only the required service ports
- firewall rules should define what the server VLAN can and cannot reach
- service data files need backups because the dedicated service is stateful
- home hosting requires more network thinking than VPS hosting

## Stack and Tools Used

### Router and Network Layer

- Raspberry Pi 5
- OpenWrt
- router-on-a-stick networking
- VLAN interfaces
- firewall zones
- DHCP
- port forwarding
- NAT
- TP-Link TL-SG105E managed switch
- VLAN tagging and untagged access ports

### VLAN Layout

- Home VLAN 10
- Homelab/Server VLAN 20
- Home subnet direction: `192.168.10.0/24`
- Server/Homelab subnet direction: `192.168.20.0/24`
- tagged trunk between OpenWrt router and TP-Link switch
- untagged access port for home/AP side
- untagged access port for Proxmox/server side

### Virtualization Layer

- Proxmox server
- VM/container hosting direction
- server attached to the homelab/server VLAN
- persistent storage for service data
- console or SSH management

### application stack Layer

- dedicated service
- Linux server environment
- startup script direction
- service data files
- service name, data set, and access-control configuration
- UDP ports `2456-2458`

### Maintenance Layer

- logs
- backups
- restart workflow
- update workflow
- external connection testing

## Intended Build

The intended build was a home-hosted dedicated service that stayed isolated from the main home LAN.

A finished setup should allow:

- normal home devices to stay on VLAN 10
- homelab/server devices to stay on VLAN 20
- Proxmox to host the dedicated service from the server VLAN
- OpenWrt to route and firewall between VLANs
- the TP-Link switch to tag/untag VLAN traffic correctly
- only application stack UDP ports to be forwarded from WAN
- the server VLAN to be blocked from freely accessing the home VLAN
- admin access to the server to remain controlled
- service data files to persist and be backed up

## Physical and Logical Topology

The practical topology looked like this:

```txt
Internet
  ↓
ISP device / bridge path
  ↓
Raspberry Pi 5 running OpenWrt
  ↓ tagged trunk
TP-Link TL-SG105E managed switch
  ├─ Home VLAN 10 → AP / normal home devices
  └─ Server VLAN 20 → Proxmox server → dedicated service
```

The Raspberry Pi handled routing and firewall decisions.

The TP-Link TL-SG105E handled VLAN tagging and access-port separation.

The Proxmox server lived on the isolated server/homelab side.

## VLAN Design

The key separation was:

```txt
VLAN 10 → Home network
VLAN 20 → Homelab / server network
```

Example subnet direction:

```txt
VLAN 10 Home:          192.168.10.0/24
VLAN 20 Homelab/Server: 192.168.20.0/24
```

The dedicated service belonged to VLAN 20, not the normal home VLAN.

That matters because a public-facing service should not casually sit beside personal devices on the same flat network.

## TP-Link TL-SG105E VLAN Tagging

The TP-Link TL-SG105E was the small managed switch that made the VLAN split possible.

The general switch role:

- one port works as a tagged trunk to the OpenWrt router
- one or more ports act as untagged Home VLAN 10 access ports
- one or more ports act as untagged Homelab/Server VLAN 20 access ports
- PVIDs decide which VLAN untagged traffic belongs to

Example direction:

```txt
Port to OpenWrt/Raspberry Pi: tagged VLAN 10 + VLAN 20
Port to AP/Home side:         untagged VLAN 10, PVID 10
Port to Proxmox/server side:  untagged VLAN 20, PVID 20
```

The exact port numbers can change, but the role of each port must be clear.

The switch is not just a dumb Ethernet splitter here. It is part of the network design.

## OpenWrt Router-on-a-Stick Role

The Raspberry Pi 5 used OpenWrt as the router/firewall control point.

Because the Pi has a single Ethernet interface, the setup follows a router-on-a-stick style design:

```txt
eth0 tagged trunk
  ├─ VLAN 10 interface
  └─ VLAN 20 interface
```

OpenWrt then creates separate logical interfaces for each VLAN.

Example direction:

```txt
Home interface:    br-lan.10 or eth0.10 → 192.168.10.1/24
Homelab interface: br-lan.20 or eth0.20 → 192.168.20.1/24
```

The exact device naming depends on the OpenWrt version and bridge configuration, but the concept is the same.

OpenWrt owns:

- routing between VLANs
- DHCP per VLAN
- DNS direction
- firewall zones
- NAT to WAN
- port forwarding from WAN to server VLAN

## Firewall Design

The firewall is what makes VLAN separation meaningful.

A practical policy:

### Home VLAN 10

Home devices can access the internet.

Home/admin devices may be allowed to access selected server VLAN services for management.

### Server VLAN 20

Server devices can access the internet for updates.

Server devices should not freely initiate connections into the Home VLAN.

### WAN to Server VLAN

WAN should only reach the dedicated service through the required UDP ports.

For application stack:

```txt
UDP 2456-2458 → dedicated service IP on VLAN 20
```

### WAN to Admin Services

Do not expose:

- Proxmox web interface
- OpenWrt LuCI
- SSH
- internal dashboards
- other homelab services

The dedicated service ports are the only intended public exposure.

## Proxmox Role

Proxmox provided the compute layer.

The dedicated service ran from the Proxmox environment, either as a VM or container-style service direction.

The important Proxmox responsibilities were:

- attach the server guest to the correct VLAN/server network
- provide CPU/RAM/storage
- keep service data files persistent
- allow console/SSH access for management
- separate the service from personal devices
- make rebuilding or moving the service easier later

The Proxmox host itself should not be exposed to the internet.

## application stack Server Ports

application stack uses UDP ports.

The exposed port direction:

```txt
2456-2458 UDP
```

The forwarding path should be:

```txt
WAN UDP 2456-2458
  → OpenWrt firewall/NAT
  → dedicated service IP on VLAN 20
```

If users cannot connect, the first checks should be:

- is the dedicated service running?
- is the server listening on the expected port?
- does OpenWrt forward UDP, not TCP?
- does the forward point to the current VLAN 20 server IP?
- does the firewall allow WAN to that destination?
- is the ISP/public IP path reachable?

## Why VLAN Isolation Matters Here

The dedicated service is public-facing. Even if the dedicated service itself is normal, it receives traffic from outside the home network.

That gives it a different trust level than:

- personal PCs
- phones
- AP/home devices
- router admin pages
- private dashboards

The server VLAN limits what happens if the service, guest, or configuration has a problem.

It does not make the setup magically secure, but it reduces unnecessary trust between devices.

## Server Configuration

A dedicated service normally needs:

```txt
server name
data set name
password
port
public/private listing setting
data path
```

The password should not be shown in public screenshots or committed to a repository.

The startup command should be wrapped in a script, for example:

```txt
start_dedicated-service.sh
```

The script makes restart/update work more consistent.

## Persistent Data

The service data files are the most important part of the service.

The server install can be recreated. The service data should not be casually lost.

Important practices:

- know where the service data files are stored
- keep the save path persistent inside the Proxmox guest
- avoid temporary container paths for service data
- back up the service data before updates
- back up before changing VM/container storage
- keep at least one backup outside the active server directory

## Backup Direction

Minimum backup targets:

```txt
application stack service data files
startup script
service file if used
configuration notes
```

Example backup direction:

```bash
tar -czf dedicated-service-backup-$(date +%F).tar.gz /path/to/dedicated-service/service-data
```

For a home-hosted Proxmox setup, backups should not exist only inside the same guest. A copy outside the VM/container is safer.

## Update Workflow

A safe update flow:

1. notify users if needed
2. stop the dedicated service
3. back up the service data files
4. update the server files
5. start the server
6. check logs
7. test from outside the home network
8. keep the backup

For this setup, also verify:

- Proxmox guest IP did not change
- VLAN assignment did not change
- OpenWrt port forward still points to the correct IP
- TP-Link switch port membership still matches the intended VLAN

## External Access Testing

Testing from inside the home network is not enough.

Good tests:

- test from mobile data
- ask a remote user to connect
- verify the public IP/domain points home
- confirm OpenWrt port forwarding
- check application stack logs after connection attempt

LAN testing can hide NAT, firewall, CGNAT, or forwarding problems.

## Practical Decisions

### Keep the dedicated service off the home VLAN

The server was exposed to outside traffic, so it belonged in the homelab/server VLAN, not the home VLAN.

### Use the TL-SG105E for VLAN access ports

The managed switch made a single OpenWrt trunk usable for multiple separated networks.

### Let OpenWrt enforce the rules

The switch separates traffic at Layer 2, but OpenWrt decides routing and firewall behavior between VLANs.

### Expose only application stack UDP ports

No Proxmox, SSH, LuCI, dashboards, or management panels should be public.

### Keep service data backups separate from server install

The service data is the real state. The install can be rebuilt.

### Document port roles

With a small managed switch, it is easy to forget which physical port is trunk, home, or server.

Port roles should be written down.

## Common Failure Points

### VLAN Tagging Wrong on the Switch

Symptoms:

- Proxmox/server gets no IP
- home devices land on wrong subnet
- server cannot reach router
- port forward points correctly but traffic never reaches server

Likely causes:

- wrong tagged/untagged membership
- wrong PVID
- OpenWrt trunk port not tagged for VLAN 20
- Proxmox/server port not untagged VLAN 20
- AP/home port accidentally placed in server VLAN

### OpenWrt VLAN Interface Wrong

Symptoms:

- VLAN exists on switch but not routed
- DHCP missing on one VLAN
- firewall zone missing
- server VLAN has no internet
- inter-VLAN rules behave incorrectly

Likely causes:

- wrong interface device
- wrong bridge VLAN filtering setup
- DHCP not enabled for VLAN 20
- firewall zone not assigned
- NAT/forwarding not allowed where needed

### users Cannot Connect From Outside

Likely causes:

- UDP ports not forwarded
- TCP forwarded by mistake instead of UDP
- forward points to old server IP
- server is on wrong VLAN
- firewall blocks WAN to VLAN 20
- ISP/public IP issue
- CGNAT
- dedicated service not running
- public IP/domain changed

### Server Works Locally but Not Remotely

Likely causes:

- LAN test bypasses WAN path
- NAT reflection confusion
- firewall allows LAN but not WAN
- upstream ISP/router issue
- wrong external test method
- UDP blocked

### Proxmox Guest Network Misconfigured

Likely causes:

- guest attached to wrong bridge
- VLAN tag mismatch
- guest IP on wrong subnet
- static IP conflicts
- Proxmox host bridge not connected to correct switch port
- switch port PVID mismatch

### Service Data Appears Reset

Likely causes:

- wrong data set name
- wrong save path
- storage not persistent
- guest/container path changed
- server started with a new empty service data
- backup restored to wrong location

## What A Finished Setup Should Show

A strong finished setup should show:

- Raspberry Pi 5 running OpenWrt as router/firewall
- TP-Link TL-SG105E handling VLAN tagging
- tagged trunk from OpenWrt to switch
- Home VLAN 10 separated from Server VLAN 20
- Proxmox connected to the server/homelab VLAN
- dedicated service running from the Proxmox side
- UDP `2456-2458` forwarded only to the dedicated service
- server VLAN blocked from freely accessing home VLAN
- admin access controlled from trusted devices
- service data path documented
- backups available
- external connection tested
- no public exposure of Proxmox/OpenWrt/admin services

## Evidence Worth Capturing

Useful evidence for this note would include:

- network diagram
- OpenWrt VLAN interface screenshot
- OpenWrt firewall zone screenshot
- OpenWrt port forwarding screenshot
- TP-Link TL-SG105E 802.1Q VLAN table
- TP-Link TL-SG105E PVID table
- Proxmox network bridge screenshot
- guest IP on VLAN 20
- application stack startup script
- application stack logs
- service data folder listing
- backup archive listing
- external connection test

## Technical Assumptions

This setup assumes the home connection supports inbound access or has a workable port-forwarding path.

It assumes the TP-Link TL-SG105E is configured with correct tagged and untagged VLAN membership.

It assumes OpenWrt owns routing and firewalling between VLANs.

It assumes the Proxmox guest running application stack is placed on VLAN 20 or the intended server network.

It also assumes service data files are stored persistently and backed up before risky changes.

## Key Risks

- wrong switch PVID placing devices in the wrong VLAN
- OpenWrt trunk missing VLAN 20 tagging
- exposing Proxmox management by mistake
- forwarding too many ports
- allowing server VLAN into home VLAN too broadly
- internal server IP changing and breaking the forward
- service data loss from unclear save path
- no backup before updates
- CGNAT or ISP behavior preventing inbound hosting
- testing only from LAN and assuming WAN works
- losing track of physical switch port roles

## Current State

This note represents the home-hosted application stack setup direction.

Unlike the VPS-hosted services, this setup belongs to the home-infrastructure side: Raspberry Pi 5 OpenWrt routing, TL-SG105E VLAN tagging, Proxmox hosting, an isolated server VLAN, port forwarding, and firewall design.

The main value is that the server was not treated as a random process on the home network. It was hosted behind a separated network path with controlled exposure.

## What This Note Does Not Claim

This note does not claim that every dedicated service should be home-hosted.

It does not claim that VLANs are required for every small server.

It does not claim that a home setup is automatically safer than a VPS.

It documents a specific practical setup: a dedicated service hosted at home behind a VLAN-isolated Proxmox network using OpenWrt and a TP-Link TL-SG105E managed switch.

## Practical Takeaway

This project was useful because it combined service hosting with real network design.

The important parts were:

- Raspberry Pi 5 running OpenWrt
- router-on-a-stick VLAN routing
- TP-Link TL-SG105E VLAN tagging
- Home VLAN 10
- Homelab/Server VLAN 20
- Proxmox as the server host
- application stack UDP `2456-2458` forwarding
- firewall separation
- persistent data storage
- backups
- external access testing

That makes it a homelab infrastructure note, not just a dedicated service note.
