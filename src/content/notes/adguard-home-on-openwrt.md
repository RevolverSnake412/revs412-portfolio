---
resume: false
title: "AdGuard Home on OpenWrt"
slug: "adguard-home-on-openwrt"
summary: "Field notes from running AdGuard Home on OpenWrt, including DNS ownership, port 53 conflicts, resolver failures, and practical troubleshooting."
resumeSummary: >-
  Documented the design and troubleshooting of running AdGuard Home on an OpenWrt router as the network DNS filtering layer. The note maps DNS ownership between AdGuard Home, dnsmasq, DHCP advertisements, local names, upstream resolvers, firewall rules, and LAN clients, with emphasis on port 53 conflicts and failure isolation. It provides a repeatable way to verify the full resolver path, recover from broken local resolution, and preserve a clear division of responsibility between routing, DHCP, and DNS filtering.
category: "Networking"
tags:
  - adguard-home
  - openwrt
  - dns
  - dnsmasq
  - resolver
  - networking
  - troubleshooting
date: "2026-07-06"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "AdGuard Home sur OpenWrt"
    category: "Réseau"
    summary: "Notes pratiques sur AdGuard Home dans OpenWrt, la responsabilité DNS, les conflits sur le port 53, les échecs de résolution et le dépannage."
    resumeSummary: >-
      Documenté la conception et le dépannage de l'exécution d'AdGuard Home sur un routeur OpenWrt comme la
      couche de filtrage DNS réseau. La note cartographie la propriété DNS entre AdGuard Home, dnsmasq,
      annonces DHCP, noms locaux, résolveurs en amont, règles de pare-feu, et clients LAN, en mettant l'accent
      sur les conflits de port 53 et l'isolement des défaillances. Il fournit un moyen répétable de vérifier
      le chemin du résolveur complet, récupérer de la résolution locale cassée, et préserver une répartition
      claire des responsabilités entre le routage, DHCP, et le filtrage DNS.
    body: |-

      ## Pourquoi cette note existe

      Le filtrage DNS est utile jusqu'à ce que DNS devienne la chose qui casse.

      AdGuard Home peut transformer un routeur OpenWrt en un dispositif de filtrage DNS à l'échelle du réseau. Cela rend la navigation plus propre, bloque les domaines indésirables, et donne une visibilité dans ce que les appareils résolvent.

      Mais lorsque AdGuard Home fonctionne sur le même routeur qui gère également DHCP, routage, règles de pare-feu et services locaux, la propriété DNS doit être claire.

      Cette note documente le côté pratique de l'exécution d'AdGuard Home sur OpenWrt: ce qui devrait écouter sur le port 53, comment les clients devraient atteindre DNS, ce qui arrive quand la résolution locale échoue, et comment déboguer le problème sans deviner.

      ## Contexte du réseau

      La configuration est un routeur OpenWrt exécutant des services réseau locaux.

      AdGuard Home est utilisé comme couche de filtrage DNS pour les clients du réseau local.

      Dans ce type de configuration, plusieurs composants peuvent toucher DNS:

      - Accueil AdGuard
      - OpenWrt `dnsmasq`
      - Options DHCP
      - `/etc/resolv.conf`
      - Résolveurs DNS en amont
      - clients locaux
      - règles du pare-feu
      - interfaces d'écoute et ports

      La question principale est simple:

      > Qui possède le DNS sur le routeur, et où les clients envoient-ils les demandes DNS?

      Si cela n'est pas clair, les échecs deviennent confus.

      ## Ce que cette configuration veut prouver

      - Le filtrage DNS doit être traité comme une infrastructure, pas seulement une application supplémentaire
      - la propriété du port 53 doit être intentionnelle
      - `dnsmasq` et AdGuard Home ont besoin de rôles clairs
      - les défaillances du résolveur doivent être débogées couche par couche
      - les clients peuvent être connectés mais incapables de naviguer si le DNS est cassé
      - les tests DNS locaux et en amont racontent différentes histoires
      - un routeur exécutant le filtrage DNS a besoin d'un chemin de récupération

      ## Outils et domaines utilisés

      ### Couche DNS

      - Accueil AdGuard
      - OpenWrt `dnsmasq`
      - DHCP DNS publicité
      - Résolveurs DNS en amont
      - direction de résolution de domaine local
      - Règles de filtrage DNS

      ### Couche ouverte

      - LuCI
      - SSH
      - gestion des services
      - journaux
      - configuration du réseau
      - Zones pare-feu
      - liaison de l'interface

      ### Outils de dépannage

      - `nslookup`
      - `ping`
      - `netstat`
      - `ss`
      - `logread`
      - commandes de redémarrage de service
      - Paramètres du réseau OpenWrt et du DHCP

      ## Construction prévue

      La configuration prévue est un réseau où les clients LAN utilisent AdGuard Home comme résolveur DNS.

      AdGuard Home devrait :

      - écouter sur la bonne adresse du routeur
      - recevoir les demandes DNS de clients LAN
      - transmettre les requêtes autorisées au DNS en amont
      - block/filter domaines indésirables
      - Afficher les journaux des requêtes
      - éviter les conflits avec les services DNS OpenWrt
      - continuer à travailler de façon prévisible après le redémarrage

      OpenWrt doit toujours gérer le routage, le pare-feu et le DHCP. Selon la conception choisie, `dnsmasq` peut gérer uniquement le DHCP, ou le renvoi DNS peut être ajusté de sorte qu'AdGuard Home possède le chemin DNS.

      ## Rôles essentiels du DNS

      ### Rôle de la maison AdGuard

      AdGuard Home est le résolveur DNS filtrant.

      Il devrait recevoir les requêtes DNS client, appliquer des règles de filtrage, et transmettre les requêtes autorisées aux résolveurs en amont.

      Paramètres importants & #160;:

      - adresse d'écoute
      - port d'écoute
      - DNS en amont
      - bootstrap DNS si nécessaire
      - visibilité du client
      - règles de filtrage
      - journaux de requêtes
      - comportement de cache

      ### Rôle `dnsmasq`

      OpenWrt utilise normalement `dnsmasq` pour DHCP et DNS.

      Lorsque AdGuard Home est ajouté, `dnsmasq` peut toujours être utile pour DHCP, mais la propriété du service DNS doit être planifiée.

      Approches possibles:

      1. AdGuard Home écoute sur le port 53 et `dnsmasq` DNS est déplacé / désactivé.
      2. `dnsmasq` écoute un autre port et l'envoie à AdGuard.
      3. Les clients utilisent AdGuard directement via les options DHCP.

      La conception exacte importe moins que la cohérence.

      ### Rôle du DHCP

      DHCP indique aux clients quel serveur DNS utiliser.

      Si les clients sont censés utiliser AdGuard Home, DHCP devrait annoncer la bonne adresse routeur/DNS.

      Si DHCP pointe toujours les clients ailleurs, AdGuard peut être en cours d'exécution, mais pas réellement utilisé.

      ## Portée de la prestation

      ### 1. Installer et exécuter AdGuard Home

      Installez AdGuard Home et confirmez le démarrage du service.

      Le service devrait être accessible par l'intermédiaire de son interface Web et devrait survivre aux remises en question.

      ### 2. Décider de la propriété du DNS

      Décider si AdGuard Home ou `dnsmasq` écoute sur le port 53.

      C'est la décision la plus importante parce que les deux services ne peuvent pas posséder la même adresse et le même port en même temps.

      Un conflit de port peut faire échouer le DNS silencieusement ou incohérentement.

      ### 3. Configurer l'adresse d'écoute

      AdGuard Home devrait écouter où les clients peuvent l'atteindre.

      Pour une configuration de routeur LAN, cela peut être :

      ```txt
      192.168.1.1:53
      ```

      ou une autre adresse du routeur LAN selon le réseau.

      Si AdGuard n'écoute que sur localhost, les clients LAN peuvent ne pas l'atteindre.

      Si AdGuard écoute sur la mauvaise interface, le routeur lui-même peut résoudre mais les clients peuvent échouer, ou le contraire.

      ### 4. Configurer DNS en amont

      AdGuard a besoin de résolveurs en amont pour répondre aux requêtes autorisées.

      Par exemple, les fournisseurs publics de DNS ou de DNS des fournisseurs de services Internet, selon les préférences.

      La partie importante est que DNS en amont fonctionne indépendamment du chemin de filtrage local.

      ### 5. Configurer la publicité DHCP DNS

      Les clients devraient recevoir le bon serveur DNS via DHCP.

      Si l'IP du routeur est le serveur DNS, les clients doivent interroger le routeur. Si un autre chemin DNS est utilisé, DHCP devrait le refléter.

      Après avoir modifié les paramètres DNS DHCP, les clients peuvent avoir besoin de se reconnecter ou de renouveler leur bail.

      ### 6. Tester la résolution locale et cliente

      Tester à la fois à partir du routeur et d'un appareil client.

      Essai du routeur:

      ```bash
      nslookup example.com 127.0.0.1
      nslookup example.com 192.168.1.1
      nslookup example.com 1.1.1.1
      ```

      Test client :

      ```bash
      nslookup example.com
      nslookup example.com 192.168.1.1
      ```

      Le but est de savoir exactement où DNS fonctionne et où il échoue.

      ## Décisions pratiques

      ### Ne quittez pas le port 53 ambigu

      Le port 53 devrait avoir un propriétaire clair sur l'adresse pertinente.

      Vérifiez ce qui vous écoute :

      ```bash
      netstat -lnup | grep ':53'
      ```

      ou:

      ```bash
      ss -lnup | grep ':53'
      ```

      Si AdGuard Home écoute sur `192.168.1.1:53`, alors tester `127.0.0.1:53` peut échouer sauf si AdGuard est également lié à localhost.

      Cette différence est importante.

      ### Séparer le DHCP du DNS mentalement

      DHCP et DNS sont souvent traités par le même service, mais ils ne sont pas le même travail.

      Il est possible de garder `dnsmasq` pour DHCP tout en changeant la façon dont DNS est géré.

      ### Essai en amont DNS séparément

      Si le DNS en amont échoue, AdGuard ne peut pas résoudre les domaines autorisés.

      Si le DNS en amont fonctionne mais que le DNS local échoue, le problème est probablement lié au local, à la propriété du port, au pare-feu ou au chemin client DHCP.

      ### Gardez un chemin de recul

      Si AdGuard Home casse, tout le réseau peut sembler cassé.

      Il aide à savoir comment restaurer temporairement DNS via `dnsmasq` ou DNS public jusqu'à ce que le chemin de filtrage soit corrigé.

      ## Notes de dépannage

      ### DNS fait complètement faillite

      Symptômes:

      - les sites Web ne sont pas chargés
      - les clients montrent Internet connecté mais les pages échouent
      - `nslookup` fois dehors
      - les mises à jour du paquetage router échouent parce que les noms de domaine ne peuvent pas résoudre

      Objets à tester :

      ```bash
      ping 1.1.1.1
      nslookup downloads.openwrt.org
      nslookup downloads.openwrt.org 1.1.1.1
      netstat -lnup | grep ':53'
      logread | grep -i dns
      ```

      Si `ping 1.1.1.1` fonctionne mais que `nslookup` échoue, le chemin Internet peut être bien et DNS est la couche cassée.

      ### `nslookup 127.0.0.1` Fails

      Exemple de symptôme :

      ```txt
      nslookup: write to '127.0.0.1': Connection refused
      ```

      Cela peut arriver si aucun service DNS n'écoute sur `127.0.0.1:53`.

      Si AdGuard Home écoute uniquement sur l'adresse LAN, comme :

      ```txt
      192.168.1.1:53
      ```

      alors les requêtes localhost peuvent échouer pendant que les requêtes d'adresse LAN fonctionnent.

      Essai:

      ```bash
      nslookup example.com 192.168.1.1
      ```

      Ne présumez pas que localhost et LAN IP se comportent de la même façon.

      ### Port 53 Conflit

      Symptômes:

      - AdGuard Home ne démarre pas DNS
      - Les journaux `dnsmasq` ou AdGuard montrent des erreurs de liaison
      - DNS fonctionne parfois mais pas toujours
      - service redémarrer change le comportement

      Vérification :

      ```bash
      netstat -lnup | grep ':53'
      ```

      Un seul service devrait lier la même adresse et le même port.

      Conflits fréquents:

      ```txt
      dnsmasq wants :53
      AdGuard Home wants :53
      ```

      Décider quel service possède le DNS et configurer l'autre en conséquence.

      ### Clients ne utilisant pas AdGuard

      AdGuard Home peut fonctionner, mais les clients peuvent encore utiliser un autre serveur DNS.

      Signes :

      - Le journal des requêtes AdGuard est vide
      - les règles de blocage ne s'appliquent pas
      - client serveur DNS pointe vers ISP/routeur/autre adresse
      - DHCP annonce toujours un autre serveur DNS

      Vérifiez un client :

      ```bash
      nslookup example.com
      ```

      Ensuite, vérifiez quel serveur DNS le client utilise.

      ### Routeur ne peut pas résoudre les sources de paquets

      Exemple :

      ```txt
      apk update
      wget failed
      nslookup downloads.openwrt.org fails
      ```

      Cela signifie que le routeur lui-même ne peut pas résoudre les noms.

      Causes possibles:

      - `/etc/resolv.conf` pointe quelque part inaccessible
      - service local DNS ne pas écouter où les requêtes du routeur
      - AdGuard en amont DNS cassé
      - problème de pare-feu
      - Mauvaise liaison DNS

      Tester avec un résolveur explicite:

      ```bash
      nslookup downloads.openwrt.org 1.1.1.1
      ```

      Si le DNS public explicite fonctionne, le chemin du résolveur par défaut du routeur est le problème.

      ## Exemple de direction de travail

      Une direction propre est:

      ```txt
      AdGuard Home listens on: 192.168.1.1:53
      Clients receive DNS:     192.168.1.1
      AdGuard upstream DNS:    public or chosen upstream resolvers
      dnsmasq handles:         DHCP, not conflicting DNS
      ```

      Ce n'est qu'un exemple. La configuration exacte dépend de la façon dont OpenWrt et AdGuard sont configurés.

      L'important est que le chemin DNS soit intentionnel.

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration solide devrait montrer:

      - AdGuard Home fonctionne après le redémarrage
      - AdGuard écoute sur l'adresse et le port prévus
      - pas de conflit au port 53
      - clients recevant le bon serveur DNS
      - requêtes visibles dans les journaux AdGuard
      - travail DNS en amont
      - domaines bloqués en fait bloqués
      - travail du paquet routeur/mise à jour de résolution
      - Méthode de récupération des retombées documentée
      - Tests DNS du routeur et du client

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - Capture d'écran du tableau de bord d'AdGuard Home
      - Capture d'écran des paramètres DNS
      - Capture d'écran du résolveur en amont
      - Capture d'écran des paramètres DHCP/DNS OpenWrt
      - Sortie `netstat -lnup | grep ':53'`
      - Essais `nslookup` à partir du routeur
      - Tests `nslookup` du client
      - capture d'écran du journal des requêtes
      - test de domaine bloqué
      - État de service
      - notes montrant le modèle de propriété DNS choisi

      ## Hypothèses techniques

      Cette configuration suppose que le routeur est destiné à être le point DNS pour les clients LAN.

      Il suppose que AdGuard Home est suffisamment stable pour agir comme un résolveur DNS à l'échelle du réseau.

      Il suppose également que la personne qui maintient le réseau comprend comment restaurer le DNS de base si AdGuard Home s'arrête ou est mal configurée.

      ## Principaux risques

      - AdGuard et `dnsmasq` luttent pour le port 53
      - clients n'utilisant pas réellement AdGuard
      - routeur lui-même ne résolvant pas les noms
      - erreurs de configuration DNS en amont
      - Reliure AdGuard uniquement sur une interface inattendue
      - perte d'utilisation d'Internet parce que le service de filtrage DNS est en baisse
      - bloquer les domaines nécessaires pour les mises à jour ou les applications
      - modifier les paramètres DHCP DNS sans renouveler les clients
      - oubliant comment récupérer DNS après un mauvais changement de configuration

      ## État actuel

      AdGuard Home fait partie du réseau DNSs et de la direction de filtrage.

      La valeur principale est le contrôle et la visibilité sur les requêtes DNS, mais il devient également une dépendance. Quand il échoue, le réseau peut sembler cassé même lorsque le routage est bon.

      Cette note est connectée à la configuration d'OpenWrt parce que DNS est au centre du routeur.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas qu'AdGuard Home est nécessaire pour chaque réseau domestique.

      Il ne prétend pas que le filtrage DNS est un remplacement pour les mises à jour de sécurité, les règles de pare-feu, ou la navigation en toute sécurité.

      Il ne prétend pas qu'une mise en page DNS corresponde à chaque configuration OpenWrt.

      Il s'agit d'une note de champ sur rendre le filtrage DNS compréhensible et débogable.

      ## À emporter pratique

      Une configuration AdGuard Home en service n'est pas seulement :

      > installez AdGuard et activez le blocage.

      La partie utile est de connaître le chemin DNS:

      - qui écoute sur le port 53
      - les adresses utilisées par les clients
      - ce que DNS utilise le routeur lui-même
      - où les requêtes en amont vont
      - comment tester à partir du routeur et du client
      - comment récupérer lorsque DNS casse

      C'est ce qui rend l'installation durable.
seoTitle: "AdGuard Home on OpenWrt"
seoDescription: "A practical note about running AdGuard Home on OpenWrt, debugging DNS failures, port 53 conflicts, resolver behavior, and client DNS paths."
---

## Why This Note Exists

DNS filtering is useful until DNS itself becomes the thing that breaks.

AdGuard Home can turn an OpenWrt router into a network-wide DNS filtering device. That makes browsing cleaner, blocks unwanted domains, and gives visibility into what devices are resolving.

But when AdGuard Home runs on the same router that also handles DHCP, routing, firewall rules, and local services, DNS ownership needs to be clear.

This note documents the practical side of running AdGuard Home on OpenWrt: what should listen on port 53, how clients should reach DNS, what happens when local resolution fails, and how to debug the problem without guessing.

## Network Context

The setup is an OpenWrt router running local network services.

AdGuard Home is used as the DNS filtering layer for clients on the LAN.

In this kind of setup, several components can touch DNS:

- AdGuard Home
- OpenWrt `dnsmasq`
- DHCP options
- `/etc/resolv.conf`
- upstream DNS resolvers
- local clients
- firewall rules
- listening interfaces and ports

The main question is simple:

> Who owns DNS on the router, and where do clients send DNS requests?

If that is unclear, failures become confusing.

## What This Setup Is Meant To Prove

- DNS filtering should be treated as infrastructure, not just an extra app
- port 53 ownership must be intentional
- `dnsmasq` and AdGuard Home need clear roles
- resolver failures should be debugged layer by layer
- clients may be connected but unable to browse if DNS is broken
- local and upstream DNS tests tell different stories
- a router running DNS filtering needs a recovery path

## Tools and Areas Used

### DNS Layer

- AdGuard Home
- OpenWrt `dnsmasq`
- DHCP DNS advertisement
- upstream DNS resolvers
- local domain resolution direction
- DNS filtering rules

### OpenWrt Layer

- LuCI
- SSH
- service management
- logs
- network configuration
- firewall zones
- interface binding

### Troubleshooting Tools

- `nslookup`
- `ping`
- `netstat`
- `ss`
- `logread`
- service restart commands
- OpenWrt network and DHCP settings

## Intended Build

The intended setup is a network where LAN clients use AdGuard Home as their DNS resolver.

AdGuard Home should:

- listen on the correct router address
- receive DNS queries from LAN clients
- forward allowed queries to upstream DNS
- block/filter unwanted domains
- show query logs
- avoid conflict with OpenWrt DNS services
- continue working predictably after reboot

OpenWrt should still handle routing, firewall, and DHCP. Depending on the chosen design, `dnsmasq` may handle DHCP only, or DNS forwarding may be adjusted so AdGuard Home owns the DNS path.

## Core DNS Roles

### AdGuard Home Role

AdGuard Home is the filtering DNS resolver.

It should receive client DNS queries, apply filtering rules, and forward allowed queries to upstream resolvers.

Important settings:

- listening address
- listening port
- upstream DNS
- bootstrap DNS if needed
- client visibility
- filtering rules
- query logs
- cache behavior

### `dnsmasq` Role

OpenWrt normally uses `dnsmasq` for DHCP and DNS.

When AdGuard Home is added, `dnsmasq` can still be useful for DHCP, but DNS service ownership must be planned.

Possible approaches:

1. AdGuard Home listens on port 53 and `dnsmasq` DNS is moved/disabled.
2. `dnsmasq` listens on another port and forwards to AdGuard.
3. Clients use AdGuard directly through DHCP options.

The exact design matters less than consistency.

### DHCP Role

DHCP tells clients which DNS server to use.

If clients are supposed to use AdGuard Home, DHCP should advertise the correct router/DNS address.

If DHCP still points clients somewhere else, AdGuard may be running but not actually used.

## Delivery Scope

### 1. Install and Run AdGuard Home

Install AdGuard Home and confirm the service starts.

The service should be reachable through its web interface and should survive reboots.

### 2. Decide DNS Ownership

Decide whether AdGuard Home or `dnsmasq` listens on port 53.

This is the most important decision because both services cannot own the same address and port at the same time.

A port conflict can make DNS fail silently or inconsistently.

### 3. Configure Listening Address

AdGuard Home should listen where clients can reach it.

For a LAN router setup, that may be:

```txt
192.168.1.1:53
```

or another LAN router address depending on the network.

If AdGuard listens only on localhost, LAN clients may not reach it.

If AdGuard listens on the wrong interface, the router itself may resolve but clients may fail, or the opposite.

### 4. Configure Upstream DNS

AdGuard needs upstream resolvers to answer allowed queries.

Examples could include public DNS providers or ISP DNS, depending on preference.

The important part is that upstream DNS works independently of the local filtering path.

### 5. Configure DHCP DNS Advertisement

Clients should receive the correct DNS server through DHCP.

If the router IP is the DNS server, clients should query the router. If another DNS path is used, DHCP should reflect that.

After changing DHCP DNS settings, clients may need to reconnect or renew their lease.

### 6. Test Local and Client Resolution

Test both from the router and from a client device.

Router test:

```bash
nslookup example.com 127.0.0.1
nslookup example.com 192.168.1.1
nslookup example.com 1.1.1.1
```

Client test:

```bash
nslookup example.com
nslookup example.com 192.168.1.1
```

The goal is to know exactly where DNS works and where it fails.

## Practical Decisions

### Do not leave port 53 ambiguous

Port 53 should have one clear owner on the relevant address.

Check what is listening:

```bash
netstat -lnup | grep ':53'
```

or:

```bash
ss -lnup | grep ':53'
```

If AdGuard Home is listening on `192.168.1.1:53`, then testing `127.0.0.1:53` may fail unless AdGuard is also bound to localhost.

That difference matters.

### Separate DHCP from DNS mentally

DHCP and DNS are often handled by the same service, but they are not the same job.

It is possible to keep `dnsmasq` for DHCP while changing how DNS is handled.

### Test upstream DNS separately

If upstream DNS fails, AdGuard cannot resolve allowed domains.

If upstream DNS works but local DNS fails, the issue is likely local binding, port ownership, firewall, or DHCP client path.

### Keep a fallback path

If AdGuard Home breaks, the whole network may look broken.

It helps to know how to temporarily restore DNS through `dnsmasq` or public DNS until the filtering path is fixed.

## Troubleshooting Notes

### DNS Completely Fails

Symptoms:

- websites do not load
- clients show internet connected but pages fail
- `nslookup` times out
- router package updates fail because domain names cannot resolve

Things to test:

```bash
ping 1.1.1.1
nslookup downloads.openwrt.org
nslookup downloads.openwrt.org 1.1.1.1
netstat -lnup | grep ':53'
logread | grep -i dns
```

If `ping 1.1.1.1` works but `nslookup` fails, the internet path may be fine and DNS is the broken layer.

### `nslookup 127.0.0.1` Fails

Example symptom:

```txt
nslookup: write to '127.0.0.1': Connection refused
```

This can happen if no DNS service is listening on `127.0.0.1:53`.

If AdGuard Home is listening on the LAN address only, such as:

```txt
192.168.1.1:53
```

then localhost queries may fail while LAN-address queries work.

Test:

```bash
nslookup example.com 192.168.1.1
```

Do not assume localhost and LAN IP behave the same.

### Port 53 Conflict

Symptoms:

- AdGuard Home fails to start DNS
- `dnsmasq` or AdGuard logs show bind errors
- DNS works sometimes but not consistently
- service restart changes behavior

Check:

```bash
netstat -lnup | grep ':53'
```

Only one service should bind the same address and port.

Common conflict:

```txt
dnsmasq wants :53
AdGuard Home wants :53
```

Decide which service owns DNS and configure the other accordingly.

### Clients Not Using AdGuard

AdGuard Home may be running, but clients may still use another DNS server.

Signs:

- AdGuard query log is empty
- blocking rules do not apply
- client DNS server points to ISP/router/other address
- DHCP still advertises another DNS server

Check on a client:

```bash
nslookup example.com
```

Then check which DNS server the client is using.

### Router Cannot Resolve Package Sources

Example issue:

```txt
apk update
wget failed
nslookup downloads.openwrt.org fails
```

This means the router itself cannot resolve names.

Possible causes:

- `/etc/resolv.conf` points somewhere unreachable
- local DNS service not listening where the router queries
- AdGuard upstream DNS broken
- firewall issue
- wrong DNS binding

Test with an explicit resolver:

```bash
nslookup downloads.openwrt.org 1.1.1.1
```

If explicit public DNS works, the router’s default resolver path is the issue.

## Example Working Direction

One clean direction is:

```txt
AdGuard Home listens on: 192.168.1.1:53
Clients receive DNS:     192.168.1.1
AdGuard upstream DNS:    public or chosen upstream resolvers
dnsmasq handles:         DHCP, not conflicting DNS
```

This is only an example. The exact configuration depends on how OpenWrt and AdGuard are set up.

The important thing is that the DNS path is intentional.

## What A Finished Setup Should Show

A strong finished setup should show:

- AdGuard Home running after reboot
- AdGuard listening on the intended address and port
- no port 53 conflict
- clients receiving the correct DNS server
- queries visible in AdGuard logs
- upstream DNS working
- blocked domains actually blocked
- router package/update resolution working
- fallback recovery method documented
- DNS tests from both router and client working

## Evidence Worth Capturing

Useful evidence for this note would include:

- AdGuard Home dashboard screenshot
- DNS settings screenshot
- upstream resolver screenshot
- OpenWrt DHCP/DNS settings screenshot
- `netstat -lnup | grep ':53'` output
- `nslookup` tests from router
- `nslookup` tests from client
- query log screenshot
- blocked domain test
- service status output
- notes showing the chosen DNS ownership model

## Technical Assumptions

This setup assumes the router is intended to be the DNS point for LAN clients.

It assumes that AdGuard Home is stable enough to act as a network-wide DNS resolver.

It also assumes that the person maintaining the network understands how to restore basic DNS if AdGuard Home stops or is misconfigured.

## Key Risks

- AdGuard and `dnsmasq` fighting over port 53
- clients not actually using AdGuard
- router itself failing to resolve names
- upstream DNS misconfiguration
- AdGuard binding only to an unexpected interface
- losing internet usability because DNS filtering service is down
- blocking domains needed for updates or apps
- changing DHCP DNS settings without renewing clients
- forgetting how to recover DNS after a bad config change

## Current State

AdGuard Home is part of the network’s DNS and filtering direction.

The main value is control and visibility over DNS requests, but it also becomes a dependency. When it fails, the network can look broken even when routing is fine.

This note is connected to the OpenWrt setup because DNS sits at the center of the router’s practical usability.

## What This Note Does Not Claim

This note does not claim that AdGuard Home is required for every home network.

It does not claim that DNS filtering is a replacement for security updates, firewall rules, or safe browsing.

It does not claim that one DNS layout fits every OpenWrt setup.

It is a field note about making DNS filtering understandable and debuggable.

## Practical Takeaway

A working AdGuard Home setup is not only:

> install AdGuard and turn on blocking.

The useful part is knowing the DNS path:

- who listens on port 53
- what address clients use
- what DNS the router itself uses
- where upstream queries go
- how to test from router and client
- how to recover when DNS breaks

That is what makes the setup maintainable.
