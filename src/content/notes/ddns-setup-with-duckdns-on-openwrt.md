---
resume: false
title: "DDNS for Remote Access on OpenWrt"
slug: "ddns-setup-with-duckdns-on-openwrt"
summary: "Field notes from setting up DuckDNS on OpenWrt for dynamic DNS, remote access, WireGuard endpoints, and self-managed infrastructure workflows."
resumeSummary: >-
  Documented a DuckDNS dynamic-DNS setup on OpenWrt for remote administration and self-managed services whose public address can change. The configuration covers update URLs and credentials, the router DDNS client, verification of the published record, and how the hostname fits into WireGuard and externally reachable services. It also establishes the correct boundary: DDNS provides stable naming for a changing public address, but it does not create public reachability where carrier NAT or firewall policy prevents it.
category: "Networking"
tags:
  - openwrt
  - duckdns
  - ddns
  - dynamic-dns
  - wireguard
  - self-managed-infrastructure
  - remote-access
  - firewall
  - cgnat
  - home-network
date: "2025-02-06"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Configuration DDNS avec DuckDNS sur OpenWrt"
    category: "Réseau"
    summary: "Notes sur DuckDNS dans OpenWrt pour le DNS dynamique, l’accès distant, les points d’entrée WireGuard et les services auto-hébergés."
    resumeSummary: >-
      Documenté une configuration DuckDNS dynamique-DNS sur OpenWrt pour l'administration à distance et les
      services autogérés dont l'adresse publique peut changer. La configuration couvre la mise à jour des URL
      et des identifiants, le client de routeur DDNS, la vérification de l'enregistrement publié, et comment
      le nom d'hôte s'intègre dans WireGuard et les services accessibles à l'extérieur. Il établit également
      la limite correcte : le DDNS fournit un nom stable pour une adresse publique changeante, mais il ne crée
      pas une accessibilité publique lorsque le transporteur NAT ou la politique de pare-feu l'empêche.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente la direction pratique de configuration pour utiliser DuckDNS avec OpenWrt.

      L'objectif était de rendre un réseau privé accessible par un nom de domaine stable même lorsque la propriété intellectuelle publique change.

      Au lieu de se souvenir ou de vérifier manuellement l'IP public actuel, un nom d'hôte DDNS peut pointer vers la dernière adresse:

      ```txt
      revs412.duckdns.org → current public IP
      ```

      Ceci est utile pour:

      - Accès à distance WireGuard
      - Accès au laboratoire à domicile
      - test des services auto-portés
      - Administration à distance temporaire
      - éviter les mises à jour manuelles de l'IP
      - faciliter la gestion des profils de connexion

      DDNS est simple, mais il est souvent mal compris. Il résout la modification des adresses IP. Il ne résout pas tous les problèmes d'accessibilité.

      ## Contexte du projet

      L'environnement était un routeur OpenWrt utilisé comme principal point de contrôle du réseau domestique.

      La configuration en question:

      - OpenWrt sur un périphérique routeur
      - connexion Internet résidentielle dynamique
      - Nom d'hôte DuckDNS
      - WireGuard direction d'accès à distance
      - règles de bâbord/pare-feu
      - Services auto-accueillés
      - Limites possibles du CGNAT

      Un domaine DuckDNS a été utilisé comme nom d'extrémité stable.

      Exemple :

      ```txt
      revs412.duckdns.org
      ```

      Le nom d'hôte est plus facile à utiliser dans les configurations VPN/client qu'une adresse IP publique changeante.

      ## Ce que cette configuration veut prouver

      - les IP publiques dynamiques peuvent être traitées de manière propre
      - OpenWrt peut mettre à jour DDNS automatiquement
      - les profils d'accès à distance devraient utiliser des noms d'hôte plutôt que des IP brutes
      - Le DDNS et le transfert de port sont des problèmes distincts
      - DDNS ne contourne pas CGNAT
      - vérification doit vérifier les mises à jour DNS et la connectivité réelle
      - une petite fonctionnalité de réseau peut améliorer la fiabilité de l'accès autonome

      ## Pioche et outils utilisés

      ### Couche réseau

      - Ouvrir
      - Interface WAN
      - IP publique dynamique
      - règles du pare-feu
      - transport de port
      - Direction du terminal WireGuard

      ### Couche DDNS

      - DuckDNS
      - Jeton DuckDNS
      - URL de mise à jour DDNS
      - Client DNS dynamique OpenWrt
      - mises à jour programmées
      - détection publique de la propriété intellectuelle

      ### Couche de vérification

      - Recherche DNS
      - contrôle externe de la propriété intellectuelle
      - carnets de routeurs
      - test de données mobiles
      - test WireGuard à distance
      - contrôle d'accessibilité du port

      ## Construction prévue

      La construction prévue est une configuration OpenWrt DDNS qui met automatiquement à jour un nom d'hôte DuckDNS chaque fois que l'IP public change.

      Une configuration terminée devrait :

      - Mettre à jour DuckDNS automatiquement
      - survivre au redémarrage du routeur
      - utiliser la bonne IP de WAN/public
      - afficher l'état de mise à jour dans les journaux
      - travailler avec un paramètre WireGuard
      - éviter d'exposer publiquement le jeton DuckDNS
      - faciliter l'entretien des configurations à distance
      - identifier clairement quand CGNAT empêche l'accès entrant

      ## Comment DDNS s'adapte à l'accès à distance

      Sans DDNS, un client distant peut avoir besoin:

      ```txt
      Endpoint = current.public.ip.address:51820
      ```

      Si le FAI change la PI publique, le client rompt.

      Avec DDNS:

      ```txt
      Endpoint = revs412.duckdns.org:51820
      ```

      Le nom d'hôte reste le même pendant que DuckDNS met à jour l'IP derrière.

      Ceci est utile pour WireGuard car la configuration téléphone/ordinateur portable n'a pas besoin d'être modifiée chaque fois que le FAI change l'IP.

      ## Ce que DuckDNS fait réellement

      DuckDNS cartographie un nom d'hôte à une adresse IP.

      Exemple :

      ```txt
      revs412.duckdns.org
        ↓
      102.x.x.x
      ```

      Lorsque l'IP public change, OpenWrt envoie une demande de mise à jour à DuckDNS.

      DuckDNS change ensuite l'enregistrement DNS.

      C'est tout ce que fait le DDNS.

      Elle ne:

      - ports ouverts
      - configurer les règles du pare-feu
      - de contournement CGNAT
      - sécuriser le service
      - Démarrer WireGuard
      - exposer les appareils LAN privés par lui-même

      Il maintient seulement le nom d'hôte pointant vers l'IP actuel.

      ## Modèle mental correct

      Un modèle correct:

      ```txt
      DDNS = name points to current public IP
      Firewall = decides what traffic is allowed
      Port forward = sends traffic to an internal host
      WireGuard = secure tunnel endpoint
      CGNAT = possible ISP-level blocker
      ```

      Ce sont des couches séparées.

      Si le nom d'hôte est correctement mis à jour mais que WireGuard ne se connecte toujours pas, le problème peut être pare-feu, transfert de port, configuration de WireGuard, CGNAT ou état du serveur.

      ## Direction DDNS OpenWrt de base

      Sur OpenWrt, DDNS peut être géré par le service DNS dynamique.

      Une configuration typique nécessite:

      ```txt
      DDNS package
      DuckDNS service config
      DuckDNS token
      domain name
      WAN/public IP detection
      update interval
      ```

      Les noms exacts des paquets peuvent varier selon OpenWrt build, mais la direction habituelle est:

      ```txt
      install ddns client
      configure DuckDNS service
      enable service
      start service
      check logs
      ```

      La configuration doit être persistante à travers le redémarrage.

      ## DuckDNS Mise à jour URL Direction

      Les mises à jour DuckDNS utilisent normalement un jeton et un domaine.

      La demande de mise à jour ressemble à :

      ```txt
      https://www.duckdns.org/update?domains=<domain>&token=<token>&ip=
      ```

      Lorsque `ip` est vide, DuckDNS peut détecter l'IP public source.

      Pour OpenWrt, il est généralement préférable de laisser le client DDNS gérer cela au lieu d'exécuter manuellement l'URL pour toujours.

      Le jeton doit rester privé.

      ## Configurer les valeurs pour suivre

      Valeurs importantes:

      ```txt
      DuckDNS domain
      DuckDNS token
      WAN interface
      update interval
      public IP source
      enabled/disabled state
      last update status
      ```

      Exemple de documentation sans exposer de secrets :

      ```txt
      Domain: revs412.duckdns.org
      Token: stored privately
      Interface: wan
      Update mode: automatic
      Use case: WireGuard endpoint
      ```

      Ne pas commettre de vrais jetons à GitHub.

      ## Utilisation de DDNS avec WireGuard

      Un client WireGuard peut utiliser le nom d'hôte DuckDNS comme point de départ.

      Exemple de direction:

      ```txt
      Endpoint = revs412.duckdns.org:51820
      ```

      ou avec un port UDP externe personnalisé:

      ```txt
      Endpoint = revs412.duckdns.org:45777
      ```

      Cela dépend du port public effectivement exposé par le routeur.

      Le point important:

      ```txt
      WireGuard client uses domain
      DuckDNS updates domain
      OpenWrt/firewall handles UDP traffic
      WireGuard server handles tunnel
      ```

      Toutes les parties doivent être correctes.

      ## Relations avec les pare-feu

      DDNS n'ouvre pas le port WireGuard.

      Le pare-feu doit encore permettre le port UDP entrant.

      Pour un serveur WireGuard sur OpenWrt, cela signifie généralement autoriser le trafic UDP vers le routeur lui-même.

      Pour un serveur WireGuard derrière OpenWrt, il peut nécessiter un port vers l'hôte interne.

      La distinction est importante:

      ```txt
      WireGuard server on router
        → allow input to router

      WireGuard server behind router
        → port forward to internal host
      ```

      L'utilisation de DDNS ne change rien à cela.

      ## CGNAT Limitation

      Le DDNS ne contourne pas CGNAT.

      Si le routeur d'origine est derrière CGNAT, DuckDNS peut pointer vers l'IP public partagé ISP, mais le trafic entrant non sollicité peut toujours ne jamais atteindre le routeur d'origine.

      Dans ce cas:

      ```txt
      DuckDNS updates correctly
      domain resolves correctly
      port still appears closed
      WireGuard still cannot connect from outside
      ```

      Ça ne veut pas dire que DuckDNS est cassé.

      Cela signifie que la route publique n'atteint pas le routeur.

      Corrections possibles:

      - demander à ISP pour une PI publique réelle
      - utiliser IPv6 si disponible
      - utiliser un VPS comme paramètre WireGuard
      - utiliser un tunnel inversé
      - utiliser mesh VPN / réseau de superposition
      - garder l'accès local seulement

      ## Mise à jour DNS

      Testez d'abord si le nom d'hôte résout.

      Exemple :

      ```bash
      nslookup revs412.duckdns.org
      ```

      ou:

      ```bash
      dig revs412.duckdns.org
      ```

      Le résultat devrait correspondre à l'IP public actuel, pas nécessairement le routeur WAN IP si CGNAT existe.

      Vérifier la PI publique :

      ```bash
      curl -s ifconfig.me
      ```

      Alors comparez:

      ```txt
      DuckDNS result
      external public IP
      router WAN IP
      ```

      Cette comparaison vous indique quelle couche fonctionne.

      ## Test de la connectivité réelle

      La résolution DNS ne suffit pas.

      Après que le DDNS ait résolu correctement, tester le service réel.

      Pour WireGuard :

      ```txt
      turn off Wi-Fi on phone
      use mobile data
      connect WireGuard
      check handshake
      ping VPN router IP
      access internal service
      ```

      Pour un service web:

      ```txt
      open domain from mobile data
      check reverse proxy logs
      check router logs
      check service logs
      ```

      Le meilleur test est de l'extérieur du réseau domestique.

      Les essais effectués à l'intérieur du même LAN peuvent être affectés par le comportement de la réflexion et de l'épiderme NAT.

      ## Cas courants de défaillance

      ### Nom d'hôte ne met pas à jour

      Causes possibles:

      - Service DDNS non activé
      - Mauvais jeton DuckDNS
      - mauvais domaine
      - pas d'internet depuis le routeur
      - Question DNS/package sur OpenWrt
      - script/service non exécuté
      - l'intervalle de mise à jour non encore déclenché

      ### Mises à jour du nom d'hôte mais le service est inaccessible

      Causes possibles:

      - règles de pare-feu manquantes
      - mauvais port
      - mauvais protocole TCP vs UDP
      - WireGuard n'écoute pas
      - service non opérationnel
      - mauvaise PI interne
      - CGNAT
      - Blocs des FSI pour le trafic entrant

      ### WireGuard fonctionne localement mais pas à l'extérieur

      Causes possibles:

      - client terminal utilise IP locale au lieu de DDNS
      - Port UDP non ouvert
      - le trafic de blocs de routeurs en amont
      - CGNAT
      - mauvais port extérieur
      - serveur écoute sur un port différent
      - IP/routes mal autorisées

      ### DDNS Points vers l'IP du FAI partagé

      Cause probable:

      - CGNAT ou NAT en amont

      DDNS peut encore faire son travail, mais l'hébergement entrant peut ne pas fonctionner.

      ## Journaux à vérifier

      Sur OpenWrt, les endroits utiles à vérifier comprennent:

      ```txt
      DDNS service status
      system log
      service logs
      firewall logs if enabled
      WireGuard status
      ```

      Direction de commande utile :

      ```bash
      logread | grep -i ddns
      ```

      ou:

      ```bash
      logread | grep -i duck
      ```

      Pour WireGuard :

      ```bash
      wg show
      ```

      Cherchez :

      ```txt
      latest handshake
      transfer rx/tx
      peer endpoint
      ```

      Si DNS fonctionne mais qu'aucune poignée de main n'apparaît, le trafic n'atteindra peut-être pas le serveur WireGuard.

      ## Mettre à jour les intervalles

      DDNS devrait mettre à jour assez souvent pour récupérer des modifications IP, mais pas si souvent qu'il spam le fournisseur.

      Un intervalle pratique est généralement:

      ```txt
      check periodically
      update only when IP changes
      ```

      Le client DDNS devrait éviter les mises à jour inutiles lorsque l'IP est inchangé.

      Après le redémarrage d'un routeur ou la reconnexion de WAN, une mise à jour doit se produire automatiquement.

      ## Sécurité des jetons

      Le jeton DuckDNS est un secret.

      N'importe qui avec le jeton peut mettre à jour l'enregistrement DuckDNS.

      Ne le placez pas dans:

      - Repos public GitHub
      - captures d'écran
      - LIRE les fichiers
      - exemples de configuration partagés
      - chat logs
      - Rapports d ' émission publique

      Pour la documentation, voir:

      ```txt
      DUCKDNS_TOKEN=replace_me
      ```

      Pas la valeur réelle.

      ## Dossiers/Config Hygiène

      Un projet ou une note propre doit séparer:

      ```txt
      real config
      example config
      documentation
      ```

      Exemple :

      ```txt
      ddns.example.conf
      README.md
      .env.example
      ```

      Évitez de commettre de véritables exportations de configuration OpenWrt si elles comprennent des jetons, des identifiants PPPoE, des mots de passe Wi-Fi, des clés privées VPN ou des informations IP internes qui devraient rester privées.

      ## Services publics vs Accès privé

      Le DDNS peut être utilisé pour les services publics, mais cela ne signifie pas que tout devrait être public.

      Meilleur modèle d'exposition:

      ```txt
      Public:
        - website
        - reverse proxy if needed
        - selected game server ports if intended

      Private:
        - router admin
        - Proxmox
        - databases
        - dashboards
        - SSH
        - internal apps
      ```

      Pour un accès privé, utilisez DDNS comme paramètre WireGuard, puis accédez aux systèmes internes via VPN.

      C'est plus propre que d'exposer les panneaux d'administration directement.

      ## Comportement de redémarrage du routeur ouvert

      Une configuration finie devrait survivre au redémarrage.

      Vérification :

      ```txt
      DDNS service enabled
      WAN reconnect triggers update
      DuckDNS hostname still correct
      WireGuard still uses same endpoint
      firewall rule still active
      ```

      Un test de redémarrage est utile car de nombreuses configurations semblent fonctionner jusqu'au redémarrage du routeur.

      ## Arbre de décision pratique

      ```txt
      Need stable name for home IP?
        → Use DDNS.

      Need WireGuard access to home?
        → Use DDNS as endpoint + open correct UDP port.

      Domain resolves but connection fails?
        → Check firewall, service, protocol, CGNAT.

      Behind CGNAT?
        → DDNS is not enough; use public IP, IPv6, VPS tunnel, or mesh VPN.

      Need public reliable hosting?
        → Consider VPS or public IP instead of residential DDNS only.
      ```

      ## Décisions pratiques

      ### Utiliser le nom d'hôte dans les clients

      Les clients distants devraient utiliser le nom d'hôte DuckDNS, et non une IP brute.

      ### Vérifier le DNS séparément de la connectivité

      Un enregistrement DNS correct ne prouve pas que le service est accessible.

      ### Garder secrets

      Les jetons DuckDNS devraient être traités comme des références.

      ### Vérifiez CGNAT tôt

      Ne perdez pas de temps à régler le DDNS si le FAI bloque le trafic entrant.

      ### Préférez VPN pour les services d'administration

      DDNS doit pointer vers le terminal VPN, pas directement vers les panneaux d'administration.

      ### Essai de l ' extérieur

      Données mobiles ou VPS donne un test plus honnête que l'accès LAN.

      ## Liste de vérification

      ### Configuration du DDNS

      - DuckDNS existe
      - jeton est correct
      - Service DDNS OpenWrt installé/configuré
      - service activé
      - Mise à jour réussie
      - les journaux montrent la mise à jour réussie

      ### Vérification DNS

      - résolution du nom d'hôte
      - IP résolue correspond à IP publique externe
      - mise à jour survit à la connexion WAN
      - update survit au redémarrage du routeur

      ### Vérification par WireGuard

      - le paramètre utilise le nom d'hôte DuckDNS
      - le port UDP correct est utilisé
      - pare-feu permet l'entrée UDP
      - poignée de main apparaît de l'extérieur
      - Le client VPN peut atteindre le routeur IP VPN
      - services internes itinéraire correctement si prévu

      ### CGNAT Vérification

      - comparer le routeur IP WAN avec IP publique externe
      - vérifier si WAN IP est privé ou `100.64.0.0/10`
      - essai à partir du réseau extérieur
      - vérifier si les journaux de service montrent des tentatives

      ### Vérification de la sécurité

      - jeton non engagé
      - screenshots masquent des valeurs sensibles
      - Panneaux administratifs non publics
      - seulement les ports visés exposés
      - Révision des règles relatives aux pare-feu

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - Nom d'hôte DuckDNS configuré
      - Service DDNS OpenWrt activé
      - des journaux de mise à jour réussis
      - résolution du nom d'hôte à la PI publique actuelle
      - Findpoint WireGuard utilisant hostname
      - test de connexion externe au réseau
      - règle de pare-feu documentée
      - Limitation du CGNAT documentée si présente
      - Aucun secret exposé
      - test de redémarrage terminé

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - DuckDNS page de domaine avec jeton caché
      - OpenWrt DDNS config screenshot avec des secrets cachés
      - mettre à jour le journal des succès
      - Résultats `nslookup` ou `dig`
      - comparaison externe de la PI publique
      - Référence client WireGuard utilisant le nom d'hôte
      - `wg show` poignée de main après connexion extérieure
      - Capture d'écran de la règle de pare-feu
      - diagramme de topologie simple
      - CGNAT vérifier si nécessaire

      ## Hypothèses techniques

      Cette note suppose qu'OpenWrt est le routeur ou la passerelle réseau principale.

      Elle suppose que la PI publique peut changer au fil du temps.

      Il suppose que DuckDNS est utilisé comme fournisseur de DDNS.

      Il suppose également que l'utilisateur veut un accès à distance ou une commodité d'hébergement, pas seulement un nom de domaine décoratif.

      ## Principaux risques

      - en supposant que DDNS ouvre des ports
      - ignorer CGNAT
      - utilisant le mauvais protocole pour les règles de pare-feu
      - pointer WireGuard vers le mauvais port
      - test uniquement depuis l'intérieur du réseau local
      - exposant publiquement les panneaux de routeur/admin
      - jeton DuckDNS qui fuit
      - routeur redémarrer désactivation service DDNS
      - mise à jour du nom d'hôte à la PI publique de FAI partagée
      - cache DNS statique pendant les essais
      - la confusion DNS succès avec l'accessibilité du service

      ## État actuel

      Cette note représente la couche DDNS d'une configuration maison/auto-hébergement.

      Il se connecte directement à :

      - Routage ouvert
      - Accès à distance WireGuard
      - PI publiques dynamiques
      - Résolution des problèmes CGNAT
      - règles du pare-feu
      - accès administrateur sûr

      La principale valeur est de rendre le paramètre public stable tout en maintenant le reste de la conception du réseau compréhensible.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas que DuckDNS contourne CGNAT.

      Il ne prétend pas que DDNS est une fonction de sécurité.

      Il ne prétend pas qu'un nom d'hôte rend un service accessible par lui-même.

      Il documente comment le DDNS s'intègre dans une configuration d'accès à distance plus grande et où sont ses limites.

      ## À emporter pratique

      La leçon utile est:

      > Le DDNS résout le problème de changement de nom, et non le problème d'accessibilité.

      Une configuration correcte nécessite que toutes ces couches fonctionnent :

      ```txt
      DuckDNS hostname
      current public IP
      firewall rule
      correct protocol/port
      running service
      no upstream CGNAT block
      outside-network test
      ```

      Une fois que ceux-ci sont vérifiés séparément, le DDNS devient une partie simple et fiable du workflow d'accès à distance.
seoTitle: "DDNS for Remote Access on OpenWrt"
seoDescription: "A practical note about configuring DuckDNS dynamic DNS on OpenWrt, verifying updates, using it with WireGuard, and understanding its limits under CGNAT."
---

## Why This Note Exists

This note documents the practical setup direction for using DuckDNS with OpenWrt.

The goal was to make a private network reachable through a stable domain name even when the public IP changes.

Instead of remembering or manually checking the current public IP, a DDNS hostname can point to the latest address:

```txt
revs412.duckdns.org → current public IP
```

This is useful for:

- WireGuard remote access
- home lab access
- testing self-hosted services
- temporary remote administration
- avoiding manual IP updates
- making connection profiles easier to manage

DDNS is simple, but it is often misunderstood. It solves changing IP addresses. It does not solve every reachability problem.

## Project Context

The environment was an OpenWrt router used as the main home network control point.

The setup involved:

- OpenWrt on a router device
- dynamic residential internet connection
- DuckDNS hostname
- WireGuard remote access direction
- port forwarding/firewall rules
- self-hosted services
- possible CGNAT limitations

A DuckDNS domain was used as the stable endpoint name.

Example:

```txt
revs412.duckdns.org
```

The hostname is easier to use in VPN/client configs than a changing public IP address.

## What This Setup Is Meant To Prove

- dynamic public IPs can be handled cleanly
- OpenWrt can update DDNS automatically
- remote access profiles should use hostnames instead of raw IPs
- DDNS and port forwarding are separate problems
- DDNS does not bypass CGNAT
- verification should check both DNS updates and real connectivity
- a small network feature can improve reliability of self-hosted access

## Stack and Tools Used

### Network Layer

- OpenWrt
- WAN interface
- dynamic public IP
- firewall rules
- port forwarding
- WireGuard endpoint direction

### DDNS Layer

- DuckDNS
- DuckDNS token
- DDNS update URL
- OpenWrt dynamic DNS client
- scheduled updates
- public IP detection

### Verification Layer

- DNS lookup
- external IP check
- router logs
- mobile data testing
- remote WireGuard test
- port reachability checks

## Intended Build

The intended build is an OpenWrt DDNS setup that automatically updates a DuckDNS hostname whenever the public IP changes.

A finished setup should:

- update DuckDNS automatically
- survive router reboot
- use the correct WAN/public IP
- show update status in logs
- work with a WireGuard endpoint
- avoid exposing the DuckDNS token publicly
- make remote configs easier to maintain
- clearly identify when CGNAT prevents inbound access

## How DDNS Fits Into Remote Access

Without DDNS, a remote client may need:

```txt
Endpoint = current.public.ip.address:51820
```

If the ISP changes the public IP, the client breaks.

With DDNS:

```txt
Endpoint = revs412.duckdns.org:51820
```

The hostname stays the same while DuckDNS updates the IP behind it.

This is useful for WireGuard because the phone/laptop config does not need to be edited every time the ISP changes the IP.

## What DuckDNS Actually Does

DuckDNS maps a hostname to an IP address.

Example:

```txt
revs412.duckdns.org
  ↓
102.x.x.x
```

When the public IP changes, OpenWrt sends an update request to DuckDNS.

DuckDNS then changes the DNS record.

That is all DDNS does.

It does not:

- open ports
- configure firewall rules
- bypass CGNAT
- secure the service
- start WireGuard
- expose private LAN devices by itself

It only keeps the hostname pointing to the current IP.

## Correct Mental Model

A correct model:

```txt
DDNS = name points to current public IP
Firewall = decides what traffic is allowed
Port forward = sends traffic to an internal host
WireGuard = secure tunnel endpoint
CGNAT = possible ISP-level blocker
```

These are separate layers.

If the hostname updates correctly but WireGuard still does not connect, the problem may be firewall, port forwarding, WireGuard config, CGNAT, or server status.

## Basic OpenWrt DDNS Direction

On OpenWrt, DDNS can be handled by the dynamic DNS service.

A typical setup needs:

```txt
DDNS package
DuckDNS service config
DuckDNS token
domain name
WAN/public IP detection
update interval
```

The exact package names can vary by OpenWrt build, but the usual direction is:

```txt
install ddns client
configure DuckDNS service
enable service
start service
check logs
```

The setup should be persistent across reboot.

## DuckDNS Update URL Direction

DuckDNS updates normally use a token and domain.

The update request conceptually looks like:

```txt
https://www.duckdns.org/update?domains=<domain>&token=<token>&ip=
```

When `ip` is empty, DuckDNS can detect the source public IP.

For OpenWrt, it is usually better to let the DDNS client handle this instead of manually running the URL forever.

The token must stay private.

## Config Values To Track

Important values:

```txt
DuckDNS domain
DuckDNS token
WAN interface
update interval
public IP source
enabled/disabled state
last update status
```

Example documentation without exposing secrets:

```txt
Domain: revs412.duckdns.org
Token: stored privately
Interface: wan
Update mode: automatic
Use case: WireGuard endpoint
```

Do not commit real tokens to GitHub.

## Using DDNS With WireGuard

A WireGuard client can use the DuckDNS hostname as its endpoint.

Example direction:

```txt
Endpoint = revs412.duckdns.org:51820
```

or with a custom external UDP port:

```txt
Endpoint = revs412.duckdns.org:45777
```

This depends on the actual public port exposed by the router.

The important point:

```txt
WireGuard client uses domain
DuckDNS updates domain
OpenWrt/firewall handles UDP traffic
WireGuard server handles tunnel
```

All parts must be correct.

## Firewall Relationship

DDNS does not open the WireGuard port.

The firewall still needs to allow the inbound UDP port.

For a WireGuard server on OpenWrt, that usually means allowing UDP traffic to the router itself.

For a WireGuard server behind OpenWrt, it may require a port forward to the internal host.

The distinction matters:

```txt
WireGuard server on router
  → allow input to router

WireGuard server behind router
  → port forward to internal host
```

Using DDNS does not change this.

## CGNAT Limitation

DDNS does not bypass CGNAT.

If the home router is behind CGNAT, DuckDNS may point to the ISP’s shared public IP, but unsolicited inbound traffic may still never reach the home router.

In that case:

```txt
DuckDNS updates correctly
domain resolves correctly
port still appears closed
WireGuard still cannot connect from outside
```

That does not mean DuckDNS is broken.

It means the public route does not reach the router.

Possible fixes:

- ask ISP for real public IP
- use IPv6 if available
- use a VPS as a WireGuard endpoint
- use a reverse tunnel
- use mesh VPN / overlay network
- keep access local-only

## Testing DNS Update

First test whether the hostname resolves.

Example:

```bash
nslookup revs412.duckdns.org
```

or:

```bash
dig revs412.duckdns.org
```

The result should match the current public IP, not necessarily the router WAN IP if CGNAT exists.

Check public IP:

```bash
curl -s ifconfig.me
```

Then compare:

```txt
DuckDNS result
external public IP
router WAN IP
```

This comparison tells you which layer is working.

## Testing Real Connectivity

DNS resolution is not enough.

After DDNS resolves correctly, test the actual service.

For WireGuard:

```txt
turn off Wi-Fi on phone
use mobile data
connect WireGuard
check handshake
ping VPN router IP
access internal service
```

For a web service:

```txt
open domain from mobile data
check reverse proxy logs
check router logs
check service logs
```

The best test is from outside the home network.

Testing from inside the same LAN may be affected by NAT reflection/hairpin behavior.

## Common Failure Cases

### Hostname Does Not Update

Possible causes:

- DDNS service not enabled
- wrong DuckDNS token
- wrong domain
- no internet from router
- DNS/package issue on OpenWrt
- script/service not running
- update interval not triggered yet

### Hostname Updates But Service Is Unreachable

Possible causes:

- firewall rule missing
- wrong port
- wrong protocol TCP vs UDP
- WireGuard not listening
- service not running
- wrong internal IP
- CGNAT
- ISP blocks inbound traffic

### WireGuard Works Locally But Not Outside

Possible causes:

- client endpoint uses local IP instead of DDNS
- UDP port not open
- upstream router blocks traffic
- CGNAT
- wrong external port
- server listens on different port
- allowed IPs/routes wrong

### DDNS Points To Shared ISP IP

Likely cause:

- CGNAT or upstream NAT

DDNS may still be doing its job, but inbound hosting may not work.

## Logs To Check

On OpenWrt, useful places to check include:

```txt
DDNS service status
system log
service logs
firewall logs if enabled
WireGuard status
```

Useful command direction:

```bash
logread | grep -i ddns
```

or:

```bash
logread | grep -i duck
```

For WireGuard:

```bash
wg show
```

Look for:

```txt
latest handshake
transfer rx/tx
peer endpoint
```

If DNS works but no handshake appears, traffic may not be reaching the WireGuard server.

## Update Intervals

DDNS should update often enough to recover from IP changes, but not so often that it spams the provider.

A practical interval is usually:

```txt
check periodically
update only when IP changes
```

The DDNS client should avoid unnecessary updates when the IP is unchanged.

After a router reboot or WAN reconnect, an update should happen automatically.

## Token Safety

The DuckDNS token is a secret.

Anyone with the token can update the DuckDNS record.

Do not place it in:

- public GitHub repos
- screenshots
- README files
- shared config examples
- chat logs
- public issue reports

For documentation, show:

```txt
DUCKDNS_TOKEN=replace_me
```

not the real value.

## File/Config Hygiene

A clean project or note should separate:

```txt
real config
example config
documentation
```

Example:

```txt
ddns.example.conf
README.md
.env.example
```

Avoid committing real OpenWrt config exports if they include tokens, PPPoE credentials, Wi-Fi passwords, VPN private keys, or internal IP details that should stay private.

## Public Services vs Private Access

DDNS can be used for public services, but it does not mean everything should be public.

Better exposure model:

```txt
Public:
  - website
  - reverse proxy if needed
  - selected game server ports if intended

Private:
  - router admin
  - Proxmox
  - databases
  - dashboards
  - SSH
  - internal apps
```

For private access, use DDNS as the WireGuard endpoint, then access internal systems through VPN.

That is cleaner than exposing admin panels directly.

## OpenWrt Router Reboot Behavior

A finished setup should survive reboot.

Check:

```txt
DDNS service enabled
WAN reconnect triggers update
DuckDNS hostname still correct
WireGuard still uses same endpoint
firewall rule still active
```

A reboot test is useful because many configs appear to work until the router restarts.

## Practical Decision Tree

```txt
Need stable name for home IP?
  → Use DDNS.

Need WireGuard access to home?
  → Use DDNS as endpoint + open correct UDP port.

Domain resolves but connection fails?
  → Check firewall, service, protocol, CGNAT.

Behind CGNAT?
  → DDNS is not enough; use public IP, IPv6, VPS tunnel, or mesh VPN.

Need public reliable hosting?
  → Consider VPS or public IP instead of residential DDNS only.
```

## Practical Decisions

### Use hostname in clients

Remote clients should use the DuckDNS hostname, not a raw IP.

### Verify DNS separately from connectivity

A correct DNS record does not prove the service is reachable.

### Keep secrets private

DuckDNS tokens should be treated like credentials.

### Check CGNAT early

Do not waste time tuning DDNS if the ISP blocks inbound traffic.

### Prefer VPN for admin services

DDNS should point to the VPN endpoint, not directly to admin panels.

### Test from outside

Mobile data or a VPS gives a more honest test than LAN access.

## Testing Checklist

### DDNS Setup

- DuckDNS domain exists
- token is correct
- OpenWrt DDNS service installed/configured
- service enabled
- update succeeds
- logs show successful update

### DNS Verification

- hostname resolves
- resolved IP matches external public IP
- update survives WAN reconnect
- update survives router reboot

### WireGuard Verification

- endpoint uses DuckDNS hostname
- correct UDP port is used
- firewall allows inbound UDP
- handshake appears from outside
- VPN client can reach router VPN IP
- internal services route correctly if intended

### CGNAT Verification

- compare router WAN IP with external public IP
- check if WAN IP is private or `100.64.0.0/10`
- test from outside network
- check whether service logs show attempts

### Security Verification

- token not committed
- screenshots hide sensitive values
- admin panels not public
- only intended ports exposed
- firewall rules reviewed

## What A Finished Setup Should Show

A strong finished setup should show:

- DuckDNS hostname configured
- OpenWrt DDNS service enabled
- successful update logs
- hostname resolving to current public IP
- WireGuard endpoint using hostname
- outside-network connection test
- firewall rule documented
- CGNAT limitation documented if present
- no exposed secrets
- reboot test completed

## Evidence Worth Capturing

Useful evidence for this note would include:

- DuckDNS domain page with token hidden
- OpenWrt DDNS config screenshot with secrets hidden
- update success log
- `nslookup` or `dig` result
- external public IP comparison
- WireGuard client endpoint using hostname
- `wg show` handshake after outside connection
- firewall rule screenshot
- simple topology diagram
- CGNAT check if relevant

## Technical Assumptions

This note assumes OpenWrt is the router or main network gateway.

It assumes the public IP may change over time.

It assumes DuckDNS is used as the DDNS provider.

It also assumes the user wants remote access or self-hosting convenience, not only a decorative domain name.

## Key Risks

- assuming DDNS opens ports
- ignoring CGNAT
- using the wrong protocol for firewall rules
- pointing WireGuard to the wrong port
- testing only from inside LAN
- exposing router/admin panels publicly
- leaking DuckDNS token
- router reboot disabling DDNS service
- hostname updating to shared ISP public IP
- stale DNS cache during testing
- confusing DNS success with service reachability

## Current State

This note represents the DDNS layer of a home/self-hosting setup.

It connects directly to:

- OpenWrt routing
- WireGuard remote access
- dynamic public IPs
- CGNAT troubleshooting
- firewall rules
- safe admin access

The main value is making the public endpoint stable while keeping the rest of the network design understandable.

## What This Note Does Not Claim

This note does not claim DuckDNS bypasses CGNAT.

It does not claim DDNS is a security feature.

It does not claim a hostname makes a service reachable by itself.

It documents how DDNS fits into a larger remote-access setup and where its limits are.

## Practical Takeaway

The useful lesson is:

> DDNS solves the changing-name problem, not the reachability problem.

A correct setup needs all of these layers to work:

```txt
DuckDNS hostname
current public IP
firewall rule
correct protocol/port
running service
no upstream CGNAT block
outside-network test
```

Once those are checked separately, DDNS becomes a simple and reliable part of the remote-access workflow.
