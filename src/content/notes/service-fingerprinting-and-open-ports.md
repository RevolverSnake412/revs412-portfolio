---
resume: false
title: "Service Fingerprinting and Open Ports"
slug: "service-fingerprinting-and-open-ports"
summary: "Field notes explaining what open ports reveal, how service fingerprinting works, what attackers can infer from SSH/HTTP/HTTPS exposure, and how to reduce unnecessary public information leakage."
resumeSummary: >-
  Produced a practical security reference on what exposed ports disclose before an attacker even authenticates. It distinguishes port scanning from service fingerprinting and examines the clues available through SSH banners, HTTP headers, HTTPS certificates, TLS configuration, version signatures, and default application behaviour. The note connects these observations to defensive choices such as reducing unnecessary exposure, patching, hardening authentication, filtering access, and reviewing public information leakage, helping turn scan results into an actionable security baseline.
category: "Networking"
tags:
  - nmap
  - open-ports
  - service-fingerprinting
  - ssh
  - http
  - https
  - security
  - self-managed-infrastructure
  - hardening
  - networking
date: "2024-07-14"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Identification de services et ports ouverts"
    category: "Réseau"
    summary: "Notes sur l’exposition des ports, l’identification de services, les informations révélées par SSH, HTTP et HTTPS, et le renforcement de base des services auto-hébergés."
    resumeSummary: >-
      Produit une référence de sécurité pratique sur ce que les ports exposés révèlent avant même qu'un
      attaquant authentifie. Il distingue le balayage de port de l'empreinte digitale de service et examine
      les indices disponibles à travers les bannières SSH, les en-têtes HTTP, les certificats HTTPS, la
      configuration TLS, les signatures de version et le comportement d'application par défaut. La note relie
      ces observations à des choix défensifs tels que la réduction de l'exposition inutile, la correction, le
      durcissement de l'authentification, le filtrage de l'accès et l'examen des fuites d'information du
      public, ce qui aide à transformer les résultats de l'analyse en une base de référence de sécurité
      actionnable.
    body: |-

      ## Pourquoi cette note existe

      Cette note explique ce que les étrangers peuvent apprendre des ports ouverts sur une adresse IP publique.

      La question initiale était simple:

      ```txt
      If my public IP shows ports 22, 80, and 443 open, what can people figure out?
      ```

      La réponse est plus nuancée que , ils peuvent pirater vous , ou , c'est bien.

      Les ports ouverts ne sont pas automatiquement une vulnérabilité, mais ils sont des informations. Ils disent aux gens que quelque chose est à l'écoute, et parfois ils révèlent quel logiciel, version, système d'exploitation, pile web, certificat, nom d'hôte, ou surface d'authentification est exposée.

      La présente note traite de la compréhension de l'exposition et de la réduction des risques inutiles.

      ## Ce que signifie un port ouvert

      Un port ouvert signifie qu'un service a répondu aux tentatives de connexion.

      Exemple :

      ```txt
      22/tcp open
      80/tcp open
      443/tcp open
      ```

      Cela suggère généralement:

      ```txt
      22  → SSH
      80  → HTTP
      443 → HTTPS
      ```

      Mais le seul numéro de port n'est qu'un indice.

      Un service peut fonctionner sur un port non standard, et un port peut être filtré, proxié, redirigé ou géré par un pare-feu. La vraie question est ce que le service répond et ce qu'il révèle.

      ## Numérisation de ports vs impression de doigts de service

      Réponses à la numérisation des ports :

      ```txt
      Which ports are open?
      ```

      Les empreintes digitales du service demandent :

      ```txt
      What exactly is running on those ports?
      ```

      Un scan de base peut montrer:

      ```txt
      22/tcp open ssh
      80/tcp open http
      443/tcp open https
      ```

      Une empreinte digitale plus profonde peut révéler:

      ```txt
      OpenSSH version
      nginx or Apache
      TLS certificate names
      HTTP response headers
      server banners
      supported protocols
      redirect behavior
      default pages
      framework hints
      ```

      C'est pourquoi les empreintes digitales sont plus importantes que la seule liste des ports.

      ## Que peut montrer Nmap

      Un simple scan Nmap peut afficher des ports ouverts.

      Une analyse de version peut essayer d'identifier les services:

      ```bash
      nmap -sV <target>
      ```

      Un scan de script peut recueillir plus de détails:

      ```bash
      nmap -sC -sV <target>
      ```

      Une analyse de détection OS peut essayer de deviner le système d'exploitation:

      ```bash
      nmap -O <target>
      ```

      Un scan plus agressif combine plusieurs vérifications :

      ```bash
      nmap -A <target>
      ```

      Ces scans ne pénètrent pas par magie dans le serveur. Ils recueillent des informations visibles de services qui répondent déjà.

      ## Ce que le port 22 révèle

      Port 22 signifie généralement SSH.

      Un service SSH peut révéler:

      - que SSH est disponible publiquement
      - la mise en œuvre de SSH
      - parfois la version OpenSSH
      - méthodes d'authentification supportées
      - algorithmes d'échange de clés pris en charge
      - si le mot de passe apparaît possible
      - si la connexion racine peut être tentée
      - informations sur la bannière du serveur

      Habituellement, **not** révèle directement le nom d'utilisateur correct.

      Les attaquants peuvent encore essayer des noms d'utilisateur communs:

      ```txt
      root
      admin
      ubuntu
      debian
      oracle
      opc
      user
      test
      ```

      Ils n'ont pas besoin de connaître le véritable nom d'utilisateur pour commencer à deviner.

      ## Exposition du nom d'utilisateur SSH

      Un scan SSH normal ne dit pas simplement à quelqu'un:

      ```txt
      the valid username is this
      ```

      Cependant, les noms d'utilisateur peuvent fuir indirectement par:

      - public Git engage
      - applications web exposées
      - messages d'erreur
      - Noms d'utilisateur du cloud par défaut
      - Documentation
      - noms d'hôte réutilisés
      - anciens fichiers de configuration
      - chemins de dépôt publics
      - bannières de connexion
      - génie social

      Donc le port lui-même ne révèle pas le nom d'utilisateur, mais le système plus large peut.

      L'hypothèse la plus sûre est:

      ```txt
      If SSH is public, someone will try common usernames automatically.
      ```

      ## Bases de durcissement SSH

      Bon durcissement de base SSH:

      - utiliser une connexion par clé
      - désactiver l'authentification du mot de passe si possible
      - désactiver la connexion root là où c'est pratique
      - tenir OpenSSH à jour
      - restreindre SSH au VPN ou aux IP de confiance si possible
      - utiliser les règles du pare-feu
      - contrôle des tentatives de connexion
      - éviter la fuite de noms d'utilisateur dans les bannières ou les documents
      - utiliser fail2ban ou l'équivalent le cas échéant
      - ne pas exposer SSH publiquement sauf si nécessaire

      Le passage de SSH à un port non standard peut réduire le bruit aléatoire, mais ce n'est pas en soi une sécurité réelle.

      La solution la plus forte est :

      ```txt
      SSH reachable only over VPN
      ```

      ou:

      ```txt
      SSH reachable only from trusted source IPs
      ```

      ## Ce que le port 80 révèle

      Port 80 signifie généralement HTTP.

      HTTP peut révéler beaucoup parce que le serveur envoie des réponses lisibles.

      Informations exposées possibles:

      - type de serveur web
      - pages par défaut
      - rediriger le comportement
      - application cadre
      - En-têtes HTTP
      - chemins de fichiers
      - Panneaux d'administration
      - répertoires exposés
      - robots.txt contenu
      - pages d'erreur
      - comportement de l'hôte virtuel
      - vieilles pages de test

      Une page par défaut peut révéler la pile même si aucun site réel n'est déployé.

      Exemples:

      ```txt
      Welcome to nginx
      Apache default page
      OpenWrt LuCI login
      Router admin page
      Node/Express error page
      ```

      Le plus grand risque est d'exposer accidentellement une interface administrative ou un service inachevé.

      ## Ce que le port 443 révèle

      Port 443 signifie généralement HTTPS.

      HTTPS chiffre le trafic, mais il révèle encore les métadonnées.

      Informations exposées possibles:

      - Noms de domaine des certificats TLS
      - émetteur de certificat
      - date de validité du certificat
      - versions TLS prises en charge
      - suites de chiffrement supportées
      - comportement du serveur web après la poignée de main TLS
      - En-têtes HTTP après connexion
      - détails de proxy inversés
      - configuration de l'hôte virtuel

      Un certificat peut révéler des noms d'hôte même si le contenu de la page est protégé.

      Par exemple, un certificat peut contenir :

      ```txt
      example.com
      api.example.com
      admin.example.com
      ```

      Cela peut donner des noms de cibles utiles aux attaquants.

      ## En-têtes HTTP

      Les en-têtes HTTP peuvent fuiter les détails d'implémentation.

      Exemples:

      ```txt
      Server: nginx
      Server: Apache
      X-Powered-By: Express
      X-Powered-By: PHP/8.x
      Via: reverse-proxy
      ```

      Enlever ou réduire ces en-têtes peut aider, mais il ne doit pas être traité comme la défense principale.

      Un en-tête caché ne garantit pas un service vulnérable.

      L'ordre de priorité est :

      ```txt
      patch services
      restrict access
      remove exposed admin panels
      use authentication
      then reduce banners/headers
      ```

      ## Renseignements sur le certificat TLS

      Les certificats TLS sont publics par conception.

      Quiconque se connecte à un service HTTPS peut inspecter le certificat.

      Il peut révéler:

      - nom de domaine
      - sous-domaines
      - organisation si inclus
      - émetteur
      - date d'expiration
      - chaîne de certification
      - parfois des erreurs de nommage interne

      Les certificats ne sont pas secrets.

      Si un nom d'hôte ne doit pas être public, ne le placez pas dans un certificat public.

      ## Empreintes digitales Web

      Les services Web peuvent être dactylographiés par :

      - entêtes
      - cookies
      - Structure HTML
      - Fichiers JavaScript
      - Voies CSS
      - haches de favicon
      - pages d'erreur par défaut
      - texte de la page de connexion
      - Réponses de l'API
      - Noms d'actifs statiques
      - fichiers spécifiques au cadre

      Même si les en-têtes sont supprimés, l'application peut toujours se révéler par le biais du comportement et de la structure du fichier.

      Exemple :

      ```txt
      /wp-login.php → WordPress
      /luci/       → OpenWrt LuCI direction
      /api/docs    → API documentation
      ```

      Ne comptez pas seulement sur des bannières cachées.

      ## Exposition du routeur et du panneau d'administration

      L'exposition la plus dangereuse n'est souvent pas un site Web normal.

      C'est un panneau d'administration exposé par erreur.

      Exemples:

      - page de connexion du routeur
      - LuCI ouvert
      - Panneau Proxmox
      - panneau d'administration de base de données
      - UI de Docker
      - Portainer
      - caméra DVR interface
      - panneau d'administration du serveur de jeu
      - tableau de bord du développement

      Ils ne devraient généralement pas être publics.

      Meilleur chemin d'accès :

      ```txt
      Internet
        ↓
      VPN
        ↓
      private admin panel
      ```

      Les panneaux publics d'administration créent des risques inutiles même lorsque le mot de passe est protégé.

      ## Ce que les attaquants peuvent déduire

      À partir des ports ouverts et des empreintes digitales, quelqu'un peut déduire :

      - quels services sont exposés
      - si le serveur est probablement Linux
      - si SSH est disponible
      - si un serveur web est nginx/Apache/Caddy/etc.
      - si un proxy inversé est présent
      - si HTTPS est configuré
      - noms d'hôte possibles à partir de certificats
      - si les pages par défaut existent
      - si les panels administratifs sont publics
      - si le logiciel semble dépassé
      - si des vulnérabilités communes peuvent s'appliquer

      Cela ne signifie pas que le compromis est automatique.

      Cela signifie que les services exposés définissent la surface d'attaque.

      ## Ce que les attaquants ne peuvent habituellement pas déduire directement

      Un scan ne peut généralement pas révéler directement:

      - clés SSH privées valides
      - mots de passe valides
      - disposition exacte du réseau interne
      - contenu de la base de données
      - corriger le nom d'utilisateur SSH avec certitude
      - services privés derrière un pare-feu
      - Dispositifs LAN seulement
      - Services VPN seulement

      Mais si les services publics fuient la configuration, les journaux, les sauvegardes ou les pages d'administration, cela change rapidement.

      L'objectif est d'éviter de donner à Internet des points de départ inutiles.

      ## Ouvrir les ports sous CGNAT

      Lors de la numérisation d'une IP publique sous CGNAT, les résultats peuvent être confus.

      L'IP public ne peut pas appartenir seulement à un routeur client.

      Un résultat Nmap montre :

      ```txt
      what is reachable on that public IP
      ```

      Elle ne prouve pas toujours:

      ```txt
      this service is running on my local router
      ```

      Pour vérifier la propriété, vérifiez :

      - routeur WAN IP
      - IP publique de l'extérieur
      - journaux de service pendant l'analyse
      - règles de port avant
      - si le service cible reçoit la connexion
      - test externe à partir de données mobiles ou VPS

      Cela est important parce que les couches CGNAT et ISP peuvent rendre les tests publics-IP plus difficiles à interpréter.

      ## Liste de contrôle publique de la numérisation IP

      Pour vérifier votre propre IP publique, utilisez un processus :

      ### 1. Identifier la PI publique

      ```bash
      curl -s ifconfig.me
      ```

      ### 2. Scanner depuis l'extérieur

      Utilisez un réseau externe ou un VPS.

      ```bash
      nmap -sV <public-ip>
      ```

      ### 3. Comparer l'IP du routeur WAN

      Vérifiez si le routeur WAN IP correspond à l'IP public.

      Dans le cas contraire, le CGNAT ou le NAT en amont peuvent être impliqués.

      ### 4. Vérifier les journaux de service

      Lors d'un test de numérisation ou de connexion, vérifiez si votre serveur enregistre la tentative.

      Si aucun journal n'apparaît, le trafic peut ne pas atteindre votre appareil.

      ### 5. Confirmer la propriété du port

      Pour chaque port ouvert, confirmez quel service local le possède.

      Sur les systèmes Linux/OpenWrt :

      ```bash
      netstat -tulpn
      ```

      ou:

      ```bash
      ss -tulpn
      ```

      ## L'écoute locale vs l'exposition publique

      Un service peut être écouté localement sans être public.

      Exemples:

      ```txt
      127.0.0.1:3000
      192.168.1.10:8080
      0.0.0.0:22
      ```

      Signification:

      ```txt
      127.0.0.1 → local machine only
      LAN IP    → local network interface
      0.0.0.0   → all interfaces on that device
      ```

      Un port d'écoute local ne devient public que si le pare-feu/NAT/routage l'expose.

      Toujours séparer :

      ```txt
      service is running
      ```

      par:

      ```txt
      service is reachable from the internet
      ```

      ## Réduire la surface de l'attaque

      La meilleure façon de réduire les risques est d'exposer moins de services.

      Meilleure exposition du public:

      ```txt
      80/443 → reverse proxy / website only
      SSH    → VPN-only or trusted IP only
      admin  → VPN-only
      database → never public
      ```

      Une installation publique propre expose généralement:

      - HTTP/HTTPS pour les sites publics prévus
      - peut-être des ports de serveur de jeu si nécessaire
      - rien d'autre sauf justifié

      Tout administratif doit être privé ou protégé par VPN dans la mesure du possible.

      ## Direction du mandataire inverse

      Un proxy inverse peut aider à organiser l'exposition web.

      Il peut parcourir:

      ```txt
      site.example.com → public site
      api.example.com  → backend API
      ```

      Mais il ne devrait pas exposer aveuglément:

      ```txt
      admin.example.com
      proxmox.example.com
      router.example.com
      db.example.com
      ```

      à moins que ceux-ci ne soient fortement protégés et intentionnellement publics.

      Un modèle plus sûr:

      ```txt
      public websites → reverse proxy
      admin tools     → VPN
      databases       → private only
      ```

      ## Étapes pratiques de durcissement

      ### Pour SSH

      - désactiver le mot de passe
      - utiliser les clés
      - désactiver la connexion racine si possible
      - Limiter par le pare-feu
      - préfèrent VPN seulement
      - contrôle des tentatives ratées

      ### Pour HTTP/HTTPS

      - supprimer les pages par défaut
      - serveur web patch
      - masquer les en-têtes inutiles
      - désactiver la liste des répertoires
      - utiliser des TLS appropriés
      - ne pas exposer les panneaux d'administration
      - utiliser l'authentification au besoin

      ### Pour les services Routeur/Administration

      - garder le routeur administrateur LAN/VPN seulement
      - n'exposez pas LuCI / UI administrateur public
      - vérifier le port vers l'avant
      - vérifier les règles UPnP si activé
      - services d'audit

      ### Pour les bases de données

      - ne pas exposer publiquement
      - lier à IP privé ou localhost si possible
      - nécessitent une authentification forte
      - Limiter par le pare-feu
      - accès via un serveur app ou un VPN uniquement

      ## Risque d'UPnP

      UPnP peut automatiquement créer des renvois de port.

      Cela peut être pratique, mais il peut aussi exposer les services de manière inattendue.

      Si l'exposition du public est importante, vérifiez :

      - si UPnP est activé
      - les dispositifs demandés pour l'avant
      - quels ports ont été ouverts
      - si ces avancées sont encore nécessaires

      Sur un réseau contrôlé, désactiver UPnP ou le limiter peut réduire les surprises.

      ## Incompréhension commune

      ### Seul le port 22 est ouvert, donc je suis en sécurité.

      SSH est une surface d'accès sérieuse.

      ### Changing SSH port le rend sécurisé.

      Il réduit les scans aléatoires mais ne remplace pas l'authentification forte.

      ### "HTTPS" signifie que rien n'est visible.

      HTTPS chiffre le contenu mais expose toujours les métadonnées de certificat et de service.

      ### Nmap trouvé nginx, donc je suis piraté.

      L'empreinte digitale n'est pas un compromis.

      ### Aucun site Web n'est déployé, donc le port 80 est inoffensif.

      Les pages par défaut et les panneaux d'administration peuvent encore révéler des informations utiles.

      ### Un scan révèle mon nom d'utilisateur SSH.

      Habituellement pas directement, mais les noms d'utilisateur peuvent être devinés ou divulgués ailleurs.

      ## Liste de vérification

      ### Identifier les ports ouverts

      ```bash
      nmap <public-ip>
      ```

      ### Identifier les services

      ```bash
      nmap -sV <public-ip>
      ```

      ### Vérifier les scripts par défaut

      ```bash
      nmap -sC -sV <public-ip>
      ```

      ### Vérifiez les auditeurs locaux

      ```bash
      ss -tulpn
      ```

      ou:

      ```bash
      netstat -tulpn
      ```

      ### Vérifier les en-têtes HTTP

      ```bash
      curl -I http://<public-ip>
      ```

      ```bash
      curl -I https://<domain>
      ```

      ### Vérifier le certificat

      Utilisez le moniteur de certificat de navigateur ou l'inspection TLS en ligne de commande.

      ### Cochez Routeur vers l'avant

      Révision:

      ```txt
      port forwards
      firewall rules
      UPnP leases
      reverse proxy configs
      running services
      ```

      ## Décisions pratiques

      ### Les services publics devraient être intentionnels

      Chaque port ouvert devrait avoir une raison.

      ### SSH doit généralement être privé

      SSH VPN est plus propre que SSH public pour l'infrastructure personnelle.

      ### Les panneaux administratifs ne devraient pas être publics

      Protégez le routeur, Proxmox, la base de données et les tableaux de bord de service derrière VPN.

      ### Une empreinte digitale est attendue

      Supposons que les gens peuvent identifier les services exposés. La sécurité ne devrait pas dépendre de tout cacher.

      ### En-têtes sont secondaires

      La suppression des en-têtes est utile, mais le patching et le contrôle d'accès sont plus importants.

      ### Les journaux comptent

      Si un scan atteint votre service, les journaux devraient aider à le confirmer.

      ## Ce qu'une note finie devrait montrer

      Une note bien terminée doit montrer :

      - exemple de balayage de port
      - exemple d'empreintes digitales de service
      - explication de l'exposition aux SSH
      - explication des métadonnées HTTP/HTTPS
      - quels noms d'utilisateur peuvent et ne peuvent pas être découverts
      - Mise en garde du CGNAT
      - auditeur local vs exposition publique
      - Liste de contrôle pour le durcissement
      - décision de déplacer l'accès admin derrière VPN
      - différence entre les bannières cachées et la réduction de la surface d'attaque

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - Nmap résultat avec IP public caché
      - routeur port-forward page avec des données sensibles cachées
      - Sortie `ss -tulpn` ou `netstat`
      - En-têtes HTTP avant/après le nettoyage
      - Capture d'écran du certificat TLS avec des domaines privés cachés si nécessaire
      - SSH config durcissement extrait
      - Capture d'écran de la règle de pare-feu
      - Schéma d'accès à l'administration VPN seulement
      - échec du test public de panneau d'administration après le blocage de l'accès

      ## Hypothèses techniques

      Cette note suppose que l'utilisateur scanne son propre IP public ou les systèmes qu'il est autorisé à tester.

      Il suppose que l'objectif est la compréhension défensive et le durcissement, et non la numérisation de cibles tierces.

      Il suppose également que l'environnement peut inclure OpenWrt, les services auto-hosted, SSH, les serveurs Web et l'hébergement de jeux/serveurs.

      ## Principaux risques

      - exposant publiquement SSH avec mot de passe login
      - exposant l'interface utilisateur du routeur admin
      - exposant les services de base de données
      - laissant des pages par défaut en ligne
      - ignorer les métadonnées des certificats TLS
      - en supposant que les ports modifiés sont une sécurité réelle
      - s'appuyant uniquement sur des bannières cachées
      - oubliant les avancées créées par UPnP
      - confusion de l'écoute locale avec l'exposition du public
      - malentendu Résultats de l'analyse CGNAT
      - non-vérification des registres de service pendant les essais

      ## État actuel

      Cette note représente le raisonnement de sécurité autour des ports ouverts et des empreintes digitales de service.

      Il se connecte à l'auto-hébergement, OpenWrt, CGNAT, SSH, l'hébergement web, les procurations inversées et l'accès VPN.

      La principale valeur est de savoir ce que les services exposés révèlent et comment réduire l'exposition sans surréagir.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que chaque port ouvert est dangereux.

      Elle ne prétend pas que l'empreinte digitale soit identique à l'exploitation.

      Il ne fournit pas d'instructions pour attaquer des systèmes tiers.

      Il documente la compréhension défensive pour les systèmes que l'exploitant possède ou est autorisé à tester.

      ## À emporter pratique

      La leçon utile est:

      > Les ports ouverts ne sont pas automatiquement une brèche, mais ce sont des informations publiques.

      Une configuration d'auto-hébergement propre devrait répondre:

      - Pourquoi ce port est-il ouvert ?
      - Quel service répond?
      - Quelle version ou métadonnées révèle-t-elle?
      - doit-il être public?
      - peut-il être déplacé derrière VPN ?
      - Les journaux et l'authentification sont-ils forts ?
      - Les outils d'administration et les bases de données sont-ils privés?

      Cela transforme un scan de port effrayant en une liste de contrôle pratique de durcissement.
seoTitle: "Service Fingerprinting and Open Ports"
seoDescription: "A practical note about open port exposure, Nmap scans, service fingerprinting, SSH/HTTP/HTTPS information leakage, and basic hardening for self-managed services."
---

## Why This Note Exists

This note explains what outsiders can learn from open ports on a public IP address.

The original question was simple:

```txt
If my public IP shows ports 22, 80, and 443 open, what can people figure out?
```

The answer is more nuanced than “they can hack you” or “it is fine.”

Open ports are not automatically a vulnerability, but they are information. They tell people that something is listening, and sometimes they reveal what software, version, operating system, web stack, certificate, hostname, or authentication surface is exposed.

This note is about understanding that exposure and reducing unnecessary risk.

## What An Open Port Means

An open port means a service responded to connection attempts.

Example:

```txt
22/tcp open
80/tcp open
443/tcp open
```

That usually suggests:

```txt
22  → SSH
80  → HTTP
443 → HTTPS
```

But the port number alone is only a hint.

A service can run on a non-standard port, and a port can be filtered, proxied, redirected, or handled by a firewall. The real question is what service responds and what it reveals.

## Port Scanning vs Service Fingerprinting

Port scanning answers:

```txt
Which ports are open?
```

Service fingerprinting asks:

```txt
What exactly is running on those ports?
```

A basic scan may show:

```txt
22/tcp open ssh
80/tcp open http
443/tcp open https
```

A deeper fingerprint may reveal:

```txt
OpenSSH version
nginx or Apache
TLS certificate names
HTTP response headers
server banners
supported protocols
redirect behavior
default pages
framework hints
```

This is why fingerprinting matters more than the port list alone.

## What Nmap Can Show

A simple Nmap scan can show open ports.

A version scan can try to identify services:

```bash
nmap -sV <target>
```

A script scan can collect more details:

```bash
nmap -sC -sV <target>
```

An OS detection scan can try to guess the operating system:

```bash
nmap -O <target>
```

A more aggressive scan combines several checks:

```bash
nmap -A <target>
```

These scans do not magically break into the server. They collect visible information from services that already respond.

## What Port 22 Reveals

Port 22 usually means SSH.

An SSH service may reveal:

- that SSH is available publicly
- the SSH implementation
- sometimes the OpenSSH version
- supported authentication methods
- supported key exchange algorithms
- whether password login appears possible
- whether root login may be attempted
- server banner information

It usually does **not** reveal the correct username directly.

Attackers may still try common usernames:

```txt
root
admin
ubuntu
debian
oracle
opc
user
test
```

They do not need to know the real username to start guessing. That is why public SSH should be hardened.

## SSH Username Exposure

A normal SSH scan does not simply tell someone:

```txt
the valid username is this
```

However, usernames can leak indirectly through:

- public Git commits
- exposed web apps
- error messages
- default cloud usernames
- documentation
- reused hostnames
- old config files
- public repository paths
- login banners
- social engineering

So the port itself does not reveal the username, but the wider system can.

The safer assumption is:

```txt
If SSH is public, someone will try common usernames automatically.
```

## SSH Hardening Basics

Good baseline SSH hardening:

- use key-based login
- disable password authentication if possible
- disable root login where practical
- keep OpenSSH updated
- restrict SSH to VPN or trusted IPs if possible
- use firewall rules
- monitor login attempts
- avoid leaking usernames in banners or docs
- use fail2ban or equivalent where suitable
- do not expose SSH publicly unless needed

Changing SSH to a non-standard port can reduce random noise, but it is not real security by itself.

The stronger fix is:

```txt
SSH reachable only over VPN
```

or:

```txt
SSH reachable only from trusted source IPs
```

## What Port 80 Reveals

Port 80 usually means HTTP.

HTTP can reveal a lot because the server sends readable responses.

Possible exposed information:

- web server type
- default pages
- redirect behavior
- app framework
- HTTP headers
- file paths
- admin panels
- exposed directories
- robots.txt content
- error pages
- virtual host behavior
- old test pages

A default page can reveal the stack even if no real site is deployed.

Examples:

```txt
Welcome to nginx
Apache default page
OpenWrt LuCI login
Router admin page
Node/Express error page
```

The biggest risk is accidentally exposing an admin interface or unfinished service.

## What Port 443 Reveals

Port 443 usually means HTTPS.

HTTPS encrypts traffic, but it still reveals metadata.

Possible exposed information:

- TLS certificate domain names
- certificate issuer
- certificate validity dates
- supported TLS versions
- supported cipher suites
- web server behavior after TLS handshake
- HTTP headers after connection
- reverse proxy details
- virtual host configuration

A certificate can reveal hostnames even if the page content is protected.

For example, a certificate may contain:

```txt
example.com
api.example.com
admin.example.com
```

That can give attackers useful target names.

## HTTP Headers

HTTP headers can leak implementation details.

Examples:

```txt
Server: nginx
Server: Apache
X-Powered-By: Express
X-Powered-By: PHP/8.x
Via: reverse-proxy
```

Removing or reducing these headers can help, but it should not be treated as the main defense.

A hidden header does not secure a vulnerable service.

The priority order is:

```txt
patch services
restrict access
remove exposed admin panels
use authentication
then reduce banners/headers
```

## TLS Certificate Information

TLS certificates are public by design.

Anyone connecting to an HTTPS service can inspect the certificate.

It can reveal:

- domain name
- subdomains
- organization if included
- issuer
- expiration date
- certificate chain
- sometimes internal naming mistakes

Certificates are not secret.

If a hostname should not be public, do not place it in a public certificate.

## Web Fingerprinting

Web services can be fingerprinted through:

- headers
- cookies
- HTML structure
- JavaScript files
- CSS paths
- favicon hashes
- default error pages
- login page text
- API responses
- static asset names
- framework-specific files

Even if headers are removed, the app can still reveal itself through behavior and file structure.

Example:

```txt
/wp-login.php → WordPress
/luci/       → OpenWrt LuCI direction
/api/docs    → API documentation
```

Do not rely only on hiding banners.

## Router and Admin Panel Exposure

The most dangerous exposure is often not a normal website.

It is an admin panel exposed by mistake.

Examples:

- router login page
- OpenWrt LuCI
- Proxmox panel
- database admin panel
- Docker UI
- Portainer
- camera DVR interface
- game server admin panel
- development dashboard

These should usually not be public.

Better access path:

```txt
Internet
  ↓
VPN
  ↓
private admin panel
```

Public admin panels create unnecessary risk even when password protected.

## What Attackers Can Infer

From open ports and fingerprinting, someone may infer:

- which services are exposed
- whether the server is probably Linux
- whether SSH is available
- whether a web server is nginx/Apache/Caddy/etc.
- whether a reverse proxy is present
- whether HTTPS is configured
- possible hostnames from certificates
- whether default pages exist
- whether admin panels are public
- whether software looks outdated
- whether common vulnerabilities may apply

This does not mean compromise is automatic.

It means the exposed services define the attack surface.

## What Attackers Usually Cannot Infer Directly

A scan usually cannot directly reveal:

- valid SSH private keys
- valid passwords
- exact internal network layout
- database contents
- correct SSH username with certainty
- private services behind a firewall
- LAN-only devices
- VPN-only services

But if public services leak configuration, logs, backups, or admin pages, that changes quickly.

The goal is to avoid giving the internet unnecessary starting points.

## Open Ports Under CGNAT

When scanning a public IP under CGNAT, results can be confusing.

The public IP may not belong only to one customer router.

An Nmap result shows:

```txt
what is reachable on that public IP
```

It does not always prove:

```txt
this service is running on my local router
```

To verify ownership, check:

- router WAN IP
- public IP from outside
- service logs during scan
- port forward rules
- whether the target service receives the connection
- external test from mobile data or VPS

This matters because CGNAT and ISP layers can make public-IP tests harder to interpret.

## Public IP Scanning Checklist

When checking your own public IP, use a process:

### 1. Identify Public IP

```bash
curl -s ifconfig.me
```

### 2. Scan From Outside

Use an external network or VPS.

```bash
nmap -sV <public-ip>
```

### 3. Compare Router WAN IP

Check whether the router WAN IP matches the public IP.

If not, CGNAT or upstream NAT may be involved.

### 4. Check Service Logs

During a scan or connection test, check if your server logs show the attempt.

If no log appears, traffic may not be reaching your device.

### 5. Confirm Port Ownership

For each open port, confirm which local service owns it.

On Linux/OpenWrt-style systems:

```bash
netstat -tulpn
```

or:

```bash
ss -tulpn
```

## Local Listening vs Public Exposure

A service can be listening locally without being public.

Examples:

```txt
127.0.0.1:3000
192.168.1.10:8080
0.0.0.0:22
```

Meaning:

```txt
127.0.0.1 → local machine only
LAN IP    → local network interface
0.0.0.0   → all interfaces on that device
```

A local listening port becomes public only if firewall/NAT/routing exposes it.

So always separate:

```txt
service is running
```

from:

```txt
service is reachable from the internet
```

## Reducing Attack Surface

The best way to reduce risk is to expose fewer services.

Better public exposure:

```txt
80/443 → reverse proxy / website only
SSH    → VPN-only or trusted IP only
admin  → VPN-only
database → never public
```

A clean public setup usually exposes:

- HTTP/HTTPS for intended public sites
- maybe game server ports if needed
- nothing else unless justified

Everything administrative should be private or VPN-protected where possible.

## Reverse Proxy Direction

A reverse proxy can help organize web exposure.

It can route:

```txt
site.example.com → public site
api.example.com  → backend API
```

But it should not blindly expose:

```txt
admin.example.com
proxmox.example.com
router.example.com
db.example.com
```

unless those are strongly protected and intentionally public.

A safer pattern:

```txt
public websites → reverse proxy
admin tools     → VPN
databases       → private only
```

## Practical Hardening Steps

### For SSH

- disable password login
- use keys
- disable root login if practical
- restrict by firewall
- prefer VPN-only
- monitor failed attempts

### For HTTP/HTTPS

- remove default pages
- patch web server
- hide unnecessary headers
- disable directory listing
- use proper TLS
- do not expose admin panels
- use authentication where needed

### For Router/Admin Services

- keep router admin LAN/VPN only
- do not expose LuCI/public admin UI
- check port forwards
- check UPnP rules if enabled
- audit running services

### For Databases

- do not expose publicly
- bind to private IP or localhost where possible
- require strong authentication
- restrict by firewall
- access through app server or VPN only

## UPnP Risk

UPnP can automatically create port forwards.

That can be convenient, but it can also expose services unexpectedly.

If public exposure matters, check:

- whether UPnP is enabled
- which devices requested forwards
- which ports were opened
- whether those forwards are still needed

On a controlled network, disabling UPnP or limiting it can reduce surprises.

## Common Misunderstandings

### “Only port 22 is open, so I am safe.”

SSH is a serious access surface. It should be hardened.

### “Changing SSH port makes it secure.”

It reduces random scans but does not replace strong authentication.

### “HTTPS means nothing is visible.”

HTTPS encrypts content but still exposes certificate and service metadata.

### “Nmap found nginx, so I am hacked.”

Fingerprinting is not compromise. It is information gathering.

### “No website is deployed, so port 80 is harmless.”

Default pages and admin panels can still reveal useful information.

### “A scan reveals my SSH username.”

Usually not directly, but usernames can be guessed or leaked elsewhere.

## Testing Checklist

### Identify Open Ports

```bash
nmap <public-ip>
```

### Identify Services

```bash
nmap -sV <public-ip>
```

### Check Default Scripts

```bash
nmap -sC -sV <public-ip>
```

### Check Local Listeners

```bash
ss -tulpn
```

or:

```bash
netstat -tulpn
```

### Check HTTP Headers

```bash
curl -I http://<public-ip>
```

```bash
curl -I https://<domain>
```

### Check Certificate

Use browser certificate viewer or command-line TLS inspection.

### Check Router Forwards

Review:

```txt
port forwards
firewall rules
UPnP leases
reverse proxy configs
running services
```

## Practical Decisions

### Public services should be intentional

Every open port should have a reason.

### SSH should usually be private

VPN-only SSH is cleaner than public SSH for personal infrastructure.

### Admin panels should not be public

Protect router, Proxmox, database, and service dashboards behind VPN.

### Fingerprinting is expected

Assume people can identify exposed services. Security should not depend on hiding everything.

### Headers are secondary

Removing headers is useful, but patching and access control matter more.

### Logs matter

If a scan reaches your service, logs should help confirm it.

## What A Finished Note Should Show

A strong finished note should show:

- port scan example
- service fingerprinting example
- explanation of SSH exposure
- explanation of HTTP/HTTPS metadata
- what usernames can and cannot be discovered
- CGNAT caveat
- local listener vs public exposure
- hardening checklist
- decision to move admin access behind VPN
- difference between hiding banners and reducing attack surface

## Evidence Worth Capturing

Useful evidence for this note would include:

- Nmap result with public IP hidden
- router port-forward page with sensitive data hidden
- `ss -tulpn` or `netstat` output
- HTTP headers before/after cleanup
- TLS certificate screenshot with private domains hidden if needed
- SSH config hardening snippet
- firewall rule screenshot
- VPN-only admin access diagram
- failed public admin panel test after blocking access

## Technical Assumptions

This note assumes the user is scanning their own public IP or systems they are allowed to test.

It assumes the goal is defensive understanding and hardening, not scanning third-party targets.

It also assumes the environment may include OpenWrt, self-hosted services, SSH, web servers, and game/server hosting.

## Key Risks

- exposing SSH publicly with password login
- exposing router admin UI
- exposing database services
- leaving default pages online
- ignoring TLS certificate metadata
- assuming changed ports are real security
- relying only on hidden banners
- forgetting UPnP-created forwards
- confusing local listening with public exposure
- misunderstanding CGNAT scan results
- not checking service logs during tests

## Current State

This note represents the security reasoning around open ports and service fingerprinting.

It connects to self-hosting, OpenWrt, CGNAT, SSH, web hosting, reverse proxies, and VPN access.

The main value is knowing what exposed services reveal and how to reduce exposure without overreacting.

## What This Note Does Not Claim

This note does not claim that every open port is dangerous.

It does not claim that fingerprinting is the same as exploitation.

It does not provide instructions for attacking third-party systems.

It documents defensive understanding for systems the operator owns or is authorized to test.

## Practical Takeaway

The useful lesson is:

> Open ports are not automatically a breach, but they are public information.

A clean self-hosting setup should answer:

- why is this port open?
- what service responds?
- what version or metadata does it reveal?
- does it need to be public?
- can it be moved behind VPN?
- are logs and authentication strong?
- are admin tools and databases private?

That turns a scary port scan into a practical hardening checklist.
