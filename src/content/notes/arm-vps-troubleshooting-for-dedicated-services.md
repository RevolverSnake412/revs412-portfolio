---
resume: false
title: "ARM VPS Troubleshooting for Dedicated Services"
slug: "arm-vps-troubleshooting-for-dedicated-services"
summary: "Field notes from troubleshooting ARM-based VPS hosting for dedicated services, covering instance availability, boot issues, Docker architecture mismatches, runtime problems, and recovery checks."
resumeSummary: >-
  Created a structured troubleshooting reference for ARM-based VPS deployments hosting dedicated services. It separates provider availability, boot-volume state, SSH reachability, public-IP and security-group configuration, local listening ports, Docker image architecture, runtime logs, and application health so a failed service is not treated as one vague outage. The workflow supports evidence-led recovery: confirm the instance and network layers first, then validate the operating system, container compatibility, process state, and external reachability.
category: "Server Hosting"
tags:
  - arm
  - vps
  - oracle-cloud
  - ampere
  - dedicated-services
  - server-hosting
  - docker
  - linux
  - troubleshooting
  - infrastructure
date: "2026-07-18"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Dépannage d’un VPS ARM pour des services dédiés"
    category: "Hébergement de services"
    summary: "Notes de dépannage pour l’hébergement de services sur VPS ARM : disponibilité d’instance, démarrage, incompatibilités Docker, problèmes d’exécution et récupération."
    resumeSummary: >-
      Crée une référence de dépannage structurée pour les déploiements VPS basés sur ARM qui héberge des
      services dédiés. Il sépare la disponibilité du fournisseur, l'état de démarrage-volume, l'accessibilité
      SSH, la configuration public-IP et de groupe de sécurité, les ports d'écoute locaux, l'architecture
      d'image Docker, les journaux d'exécution et la santé des applications. Le workflow prend en charge la
      récupération de données probantes: confirmer l'instance et les couches réseau d'abord, puis valider le
      système d'exploitation, la compatibilité du conteneur, l'état du processus et l'accessibilité externe.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente le processus de dépannage autour de l'hébergement de services dédiés sur un VPS basé sur ARM.

      L'environnement a utilisé un exemple de cloud ARM/Ampere pour l'hébergement de serveurs légers. L'objectif était d'exécuter des services dédiés, y compris des déploiements compatibles avec l'extension sans payer pour un plus grand x86 VPS traditionnel.

      La partie utile du projet n'était pas seulement l'obtention d'un service dédié en ligne. C'était apprendre à déboguer la pile complète quand quelque chose casse:

      - État de l' instance du nuage
      - volume de démarrage
      - Accès SSH
      - Limites des fournisseurs
      - pare-feu/règles de sécurité
      - Compatibilité ARM contre x86
      - Architecture d'image Docker
      - bibliothèques natives d'exécution
      - registres des processus de service dédiés
      - comportement de redémarrage du service

      Cela fait de la note une pièce de dépannage d'infrastructure, pas seulement une note de configuration de service dédié.

      ## Contexte du projet

      L'environnement serveur était un VPS ARM utilisé pour l'hébergement et l'expérimentation de services.

      Les principales charges de travail étaient les suivantes :

      - Hébergement de serveur de service hébergé
      - Hébergement de serveur de service hébergé
      - ExtensionDéploiement rapide
      - Essais de Docker
      - débogage d'exécution spécifique à l'architecture
      - Gestion des services Linux
      - administration SSH à distance

      Le VPS a été attrayant parce que les instances de cloud ARM peuvent fournir des ressources solides pour une utilisation à bas coût ou de style de niveau libre, mais ARM ajoute également des problèmes de compatibilité lorsque le logiciel suppose x86.

      ## Ce que cette note veut prouver

      - les serveurs cloud peuvent échouer à différentes couches
      - L'échec de SSH ne signifie pas toujours que le serveur est supprimé
      - l'état de l'instance, le volume de démarrage et les règles du réseau doivent être vérifiés séparément
      - Les serveurs ARM sont utiles mais nécessitent une sensibilisation à l'architecture
      - Les images Docker doivent correspondre à l'architecture du CPU sauf si l'émulation est utilisée
      - Les services dédiés dépendent souvent des bibliothèques natives et des hypothèses d'exécution
      - les journaux comptent plus que de deviner
      - une liste de contrôle de récupération prévient la panique lorsqu'un serveur disparaît ou cesse de répondre

      ## Pioche et outils utilisés

      ### Calque Cloud

      - ARM/Ampère VPS
      - tableau de bord de l'instance cloud
      - volume de démarrage
      - interface réseau virtuel
      - IP publique
      - Règles de sécurité/pare-feu
      - direction d'accès série/console
      - instance stop/start/reboot checks

      ### Couche système d'exploitation

      - Linux
      - SSH
      - accès shell
      - registres du système
      - contrôle des processus
      - Contrôles de stockage
      - Contrôle des pare-feu
      - commandes de démarrage de service

      ### Calque de service dédiée

      - serveur de service hébergé
      - Extension Direction du serveur Loader
      - serveur de service hébergé
      - ExtensionRuntime
      - `.NET` temps d'exécution
      - fichiers de configuration du serveur
      - sortie des journaux et consoles

      ### Couche du contenant

      - Coq
      - sélection de plate-forme/architecture
      - compatibilité avec l'image
      - comportement ARM vs amd64
      - container logs
      - montures de volume

      ## Construction prévue

      La construction prévue était un VPS ARM stable utilisé pour accueillir de petits services dédiés.

      Un environnement fini devrait soutenir:

      - Accès SSH
      - fichiers de service dédiés persistants
      - commandes de démarrage prévisibles
      - ports publics accessibles
      - sauvegardes
      - journaux
      - processus de redémarrage
      - binaires/images compatibles avec l'architecture
      - étapes de récupération claires lorsque l'instance échoue

      La configuration n'a pas besoin d'être de niveau entreprise. Elle doit être compréhensible et récupérable.

      ## Les principales catégories de problèmes

      La plupart des questions relèvent de l'un de ces groupes :

      ```txt
      1. Cloud/provider issue
      2. Instance boot issue
      3. Network/security rule issue
      4. SSH/authentication issue
      5. OS/runtime issue
      6. Architecture compatibility issue
      7. Dedicated service config issue
      8. Docker/container issue
      ```

      Traiter chaque défaillance comme le serveur est cassé.

      La bonne question est la suivante :

      ```txt
      Which layer is failing?
      ```

      ## Contrôles par l'État de l'instance

      La première étape consiste à vérifier l'état de l'instance dans le tableau de bord du cloud.

      États importants:

      ```txt
      running
      stopped
      stopping
      starting
      terminated
      unavailable
      ```

      Si l'instance est arrêtée, SSH échouera même si les fichiers existent encore.

      Si l'instance est en cours mais inaccessible, le problème peut être :

      - problème de démarrage
      - règle du pare-feu
      - problème de propriété intellectuelle publique
      - Problème de service SSH
      - Défaut de niveau OS
      - problème d'interface réseau

      Si l'instance est terminée, la question suivante est de savoir si le volume de démarrage existe encore.

      ## Contrôles du volume de démarrage

      Une instance arrêtée ou non disponible ne signifie pas toujours que les données ont disparu.

      Le volume de démarrage peut encore exister.

      Le chemin de récupération peut être:

      ```txt
      check boot volume
      attach boot volume to another instance if needed
      mount it
      recover service data files/configs
      copy backups
      rebuild server
      ```

      Pour les services spécialisés, les données les plus importantes sont généralement:

      - fichiers de données de service
      - fichiers de configuration
      - fichiers d'extension
      - fichiers whitelist/ops/admin
      - scripts de service
      - archives de sauvegarde

      L'instance de calcul est remplaçable. Les données de service sont l'actif.

      ## L'échec de la SSH ne signifie pas une seule chose

      SSH peut échouer pour de nombreuses raisons.

      Causes possibles:

      - instance est désactivée
      - changement de propriété intellectuelle publique
      - règles de sécurité bloque port 22
      - OS pare-feu bloque SSH
      - Démon SSH ne fonctionne pas
      - le disque est plein
      - CPU/RAM épuisé
      - mauvais nom d'utilisateur
      - Mauvaise clé
      - problème d'itinéraire réseau
      - problème du côté du fournisseur
      - défaillance du démarrage

      Un bon ordre de contrôle est:

      ```txt
      instance state
      public IP
      security rules
      ping/reachability if allowed
      SSH port test
      serial/console output
      boot logs
      ```

      Ne présumez pas que la clé SSH est incorrecte tant que la couche d'infrastructure n'est pas cochée.

      ## Règles de propriété intellectuelle et de sécurité publiques

      Pour les services dédiés, deux types de ports comptent:

      ```txt
      management port
      dedicated service ports
      ```

      Gestion :

      ```txt
      22/tcp → SSH
      ```

      exemples de services:

      ```txt
      hosted service → TCP port depending on server config
      hosted service  → TCP port depending on server config
      ```

      La liste de sécurité du cloud/firewall doit permettre le trafic entrant prévu.

      Le pare-feu Linux doit également l'autoriser si configuré.

      Un port peut être ouvert dans le panneau cloud mais bloqué dans le système d'exploitation, ou ouvert dans le système d'exploitation, mais bloqué par les règles du réseau cloud.

      Les deux couches de matière.

      ## Vérification des services locaux d'écoute

      Avant de blâmer le pare-feu cloud, vérifiez si le service écoute localement.

      Exemple :

      ```bash
      ss -tulpn
      ```

      ou:

      ```bash
      netstat -tulpn
      ```

      Cela vous indique si le service dédié ou le démon SSH est réellement à l'écoute.

      Si le service n'écoute pas localement, les règles du pare-feu public n'aideront pas.

      ## Vérification des journaux

      Les journaux sont le moyen le plus rapide pour arrêter de deviner.

      Contrôles utiles:

      ```bash
      journalctl -xe
      ```

      ```bash
      dmesg | tail -100
      ```

      ```bash
      df -h
      ```

      ```bash
      free -h
      ```

      ```bash
      ps aux | grep java
      ```

      ```bash
      ps aux | grep ExtensionRuntime
      ```

      Pour Docker:

      ```bash
      docker ps -a
      ```

      ```bash
      docker logs --tail 100 <container-name>
      ```

      Pour un service dédié, vérifiez également le propre dossier journal du serveur.

      ## Compatibilité ARM contre x86

      L'hébergement VPS ARM présente une différence majeure par rapport à l'hébergement normal x86:

      ```txt
      not every binary or Docker image supports ARM
      ```

      Un échec commun ressemble à:

      ```txt
      exec format error
      ```

      Cela signifie généralement que le binaire à l'intérieur du conteneur ou de l'outil téléchargé est pour la mauvaise architecture CPU.

      Exemple :

      ```txt
      amd64 binary running on arm64 server
      ```

      La correction doit être utilisée:

      - binaire compatible ARM
      - image Docker multi-arch
      - sélection correcte de la plateforme
      - émulation si acceptable
      - méthode d'installation différente
      - paquet serveur natif si possible

      ## Problèmes d'architecture Docker

      Docker ne fait pas disparaître les problèmes d'architecture par magie.

      Si une image Docker contient des binaires x86 et que l'hôte est ARM, elle peut échouer.

      Erreur typique & #160;:

      ```txt
      exec /entrypoint.sh: exec format error
      ```

      ou:

      ```txt
      cannot execute binary file
      ```

      Contrôles utiles:

      ```bash
      uname -m
      ```

      ```bash
      docker image inspect <image-name>
      ```

      ```bash
      docker run --rm <image-name> uname -m
      ```

      Si l'hôte affiche :

      ```txt
      aarch64
      ```

      alors c'est ARM64.

      Le conteneur/image doit supporter ARM64 sauf si l'émulation est configurée.

      ## Utilisation des images amd64 sur ARM

      Parfois, une image amd64 peut être forcée avec :

      ```bash
      docker run --platform linux/amd64 ...
      ```

      Mais cela nécessite généralement un support d'émulation et peut être plus lent ou moins fiable.

      Il peut être utile pour les tests, mais il n'est pas toujours la solution la plus propre à long terme.

      Pour les services dédiés, la performance et la stabilité.

      Préférez une configuration compatible ARM native lorsque c'est possible.

      ## Questions relatives à la gestion des risques et à la gestion des risques

      Certains workflows de service dédiés dépendent de SteamCMD.

      SteamCMD et quelques binaires de serveur dédiés peuvent supposer x86/x86_64.

      Sur les serveurs ARM, cela peut créer des problèmes :

      - Mauvaise adéquation de l'architecture binaire de SteamCMD
      - service dédié binaire non disponible pour ARM
      - L'image Docker utilise uniquement amd64
      - émulation nécessaire
      - bibliothèques manquantes
      - Le script de démarrage échoue avant l'exécution du service

      La leçon importante:

      ```txt
      The VPS can be strong enough, but the software must support its CPU architecture.
      ```

      ## Prolongation Problèmes de durée d'exécution

      Les services hébergés avec une configuration ExtensionRuntime avaient ses propres problèmes d'exécution.

      Catégories de problèmes possibles:

      - Désaccord d'exécution de `.NET`
      - bibliothèque native manquante
      - hypothèses du script de lancement
      - inadéquation de l'architecture
      - problème de chemin de configuration du serveur
      - erreur de construction d'extension
      - dépendance manquante
      - mauvais répertoire de travail

      Une erreur d'exécution/de bibliothèque native est différente d'une erreur de code d'extension.

      Par exemple:

      ```txt
      FNA3D.so missing
      ```

      n'est pas le même type de problème que:

      ```txt
      C# override method signature is wrong
      ```

      Séparer les erreurs d'environnement/d'exécution des erreurs de compilation d'extension.

      ## ExtensionRuntime Build Direction

      Une commande de construction d'extension personnalisée avait une forme comme:

      ```bash
      dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
      ```

      Les problèmes peuvent venir de:

      - mauvais répertoire
      - mauvaise exécution de `.NET`
      - bibliothèque native manquante
      - mauvaise version ExtensionRuntime
      - source d'extension cassée
      - Inadéquation de l'API
      - mauvaise signature de l'option

      Une erreur de construction doit être lue littéralement en premier. Le compilateur pointe souvent directement sur le fichier et la ligne défaillants.

      ## Direction du serveur hébergé

      Le service hébergé sur ARM est souvent plus facile que d'autres services dédiés parce que Java prend bien en charge ARM lorsque l'exécution Java correcte est installée.

      Principaux contrôles:

      - corriger la version Java
      - serveur jar existe
      - assez de RAM
      - corriger le port
      - EULA accepté
      - extensions correspondent à la version du serveur
      - ExtensionLes versions Loader/loader correspondent
      - service commence dans un répertoire correct
      - pare-feu permet le port de service
      - des sauvegardes existent

      Les problèmes de service hébergés sont plus souvent des problèmes de configuration/extension/version que des problèmes d'architecture CPU, même si les extensions natives ou les wrappers peuvent encore compter.

      ## Service dédié Conservation des données

      Pour l'hébergement de services, les annuaires importants doivent être faciles à identifier.

      Exemples:

      ```txt
      /srv/dedicated-service/
      ```

      ```txt
      /home/opc/tml-arm/ExtensionRuntime/
      ```

      ou quel que soit le répertoire:

      - données persistantes
      - extensions
      - configs
      - journaux
      - sauvegardes
      - scripts du serveur

      Une bonne mise en page du serveur facilite la récupération.

      Si le VPS devient indisponible, vous devez savoir exactement ce qui doit être copié à partir du volume de démarrage.

      ## Direction de sauvegarde

      Les sauvegardes comptent plus que la taille de l'instance.

      Un plan de sauvegarde de base devrait comprendre:

      ```txt
      service data files
      config files
      extension list
      service scripts
      environment files without public sharing
      important logs if needed
      ```

      Les sauvegardes doivent être stockées en dehors de l'instance si les données du service sont importantes.

      Au minimum:

      ```txt
      local copy
      separate volume
      object storage
      another server
      ```

      Un VPS gratuit ou bon marché peut disparaître, échouer ou être arrêté. Les données ne devraient pas exister en un seul endroit.

      ## Limites pour les fournisseurs et risque plus élevé

      L'hébergement en nuage gratuit ou peu coûteux peut être utile, mais il comporte des risques :

      - pénuries de capacités
      - remise en état des ressources
      - restrictions de compte
      - messages de facturation/de type gratuit non clairs
      - instances arrêtées
      - volume de démarrage encore présent mais calcul indisponible
      - changements dans la disponibilité des régions
      - création accidentelle de ressources rémunérées

      Pour une note de portefeuille, le cadre important ne se plaint pas du fournisseur.

      Le cadre utile est:

      ```txt
      designing recovery and verification steps for a low-cost ARM VPS environment
      ```

      Cela montre la maturité de l'infrastructure.

      ## Éviter les ressources payées par accident

      Lors de l'utilisation des ressources de style libre de cloud, consultez :

      - forme de l'instance
      - OCPU/RAM
      - Taille du volume de démarrage
      - volumes de blocs
      - type de propriété intellectuelle publique
      - balanceurs de charge
      - instantanés / sauvegardes
      - stockage des objets
      - bande passante sortante
      - limites régionales

      La règle pratique:

      ```txt
      Know which resources cost money before creating them.
      ```

      Pour les petits services spécialisés, évitez d'ajouter des services gérés aléatoirement, sauf si nécessaire.

      ## Console série / Console de récupération Direction

      Si SSH échoue mais que l'instance est toujours en cours d'exécution, l'accès à la console peut aider.

      Une console série/récupération peut révéler:

      - Erreurs de démarrage
      - problèmes de disque complet
      - services défaillants
      - erreurs de configuration du réseau
      - invites de connexion
      - messages du noyau
      - processus de démarrage bloqué

      Ceci est utile car SSH dépend du démarrage de l'OS assez loin et le travail en réseau.

      L'accès à la console vérifie le serveur plus près du niveau de la machine.

      ## Problèmes de disque complet

      Un disque complet peut casser beaucoup de choses:

      - Connexion SSH
      - le paquet installe
      - service dédié économise
      - journaux
      - Coq
      - constructions d'extension
      - sauvegardes de données de service

      Vérification :

      ```bash
      df -h
      ```

      Docker peut consommer de l'espace avec de vieilles images/conteneurs.

      Vérification :

      ```bash
      docker system df
      ```

      Pour les services dédiés, les sauvegardes de données de service et les journaux peuvent croître au fil du temps.

      ## Pression RAM et processeur

      Les services dédiés peuvent geler ou s'écraser si les ressources sont épuisées.

      Vérification :

      ```bash
      free -h
      ```

      ```bash
      top
      ```

      ```bash
      uptime
      ```

      Pour le service Java / hôte, les drapeaux de mémoire comptent.

      Pour ExtensionRuntime / service hébergé, le compte de prolongation et l'activité de données de service comptent.

      Pour Docker, les limites de contenants peuvent aider à empêcher un service de tout consommer.

      ## Pare-feu et essais portuaires

      Un service nécessite trois choses :

      ```txt
      process listening
      OS firewall allows it
      cloud firewall allows it
      ```

      Séquence d'essai:

      ```txt
      check local listening
      check OS firewall
      check cloud security rules
      test from outside
      check server logs during test
      ```

      Un contrôle de port seul n'est pas suffisant. Les journaux du serveur confirment si le trafic a atteint l'application.

      ## Gestion des services

      Les services dédiés ne devraient pas reposer uniquement sur une session SSH interactive.

      Meilleures options:

      - service systémique
      - écran/tmux pour les essais manuels
      - Docker conteneur avec politique de redémarrage
      - script de démarrage avec journaux
      - commandes de démarrage/arrêt documentées

      Pour les serveurs à long terme, un gestionnaire de services est plus propre que le démarrage manuel du processus après chaque redémarrage.

      ## Erreurs fréquentes

      ### En supposant que plus de ressources signifie moins de problèmes

      Les instances ARM peuvent avoir un bon CPU/RAM, mais la compatibilité reste importante.

      ### Traiter Docker comme Architecture-Neutral

      Les images Docker contiennent toujours des binaires spécifiques à l'architecture.

      ### Service de débogage Config avant de vérifier le pare-feu

      Si aucune connexion n'arrive au serveur, vérifiez d'abord le chemin réseau.

      ### Penser que l'échec de SSH signifie que les données sont perdues

      Le volume de démarrage peut encore être récupérable.

      ### Tout tourner manuellement

      Les commandes manuelles sont bonnes pour la configuration. L'hébergement stable nécessite des flux de travail répétables start/restart/log.

      ### Pas de sauvegarde des données persistantes

      les fichiers de données de service sont la partie la plus précieuse du service dédié.

      ## Flux de dépannage pratique

      Un flux utile:

      ```txt
      1. Is the cloud instance running?
      2. Does it still have the expected public IP?
      3. Are cloud security rules correct?
      4. Does SSH port respond?
      5. If SSH fails, check console/boot logs.
      6. If SSH works, check disk/RAM/CPU.
      7. Check whether the service endpoint is listening.
      8. Check service logs.
      9. Check architecture compatibility.
      10. Test from outside.
      11. Backup important data before risky changes.
      ```

      Cela évite de sauter au hasard entre des correctifs indépendants.

      ## Vérifications pratiques en une seule ligne

      Architecture :

      ```bash
      uname -m
      ```

      Disque & #160;:

      ```bash
      df -h
      ```

      Mémoire :

      ```bash
      free -h
      ```

      Ports d'écoute :

      ```bash
      ss -tulpn
      ```

      Récipients Docker:

      ```bash
      docker ps -a
      ```

      Registres récents du système:

      ```bash
      journalctl -xe --no-pager | tail -100
      ```

      Registres Docker :

      ```bash
      docker logs --tail 100 <container-name>
      ```

      Trouver de grands fichiers & #160;:

      ```bash
      du -h /home /srv /var 2>/dev/null | sort -h | tail -50
      ```

      Vérifiez Java & #160;:

      ```bash
      java -version
      ```

      Vérifier le processus fil / service:

      ```bash
      ps aux | grep -E 'java|hosted service|ExtensionRuntime'
      ```

      ## Décisions pratiques

      ### Préférez l'ARM natif si possible

      Les constructions ARM autochtones sont plus propres que de forcer l'émulation amd64.

      ### Conserver les données persistantes sauvegardées

      Le VPS peut être reconstruit. Les données de service ne doivent pas être jetables.

      ### Séparer les problèmes du fournisseur des problèmes du serveur

      L'état de l'instance Cloud, le volume de démarrage et les règles réseau sont différents calques.

      ### Vérifier les journaux avant de changer beaucoup de choses

      Les journaux réduisent généralement le problème plus rapidement que de deviner.

      ### Commandes de démarrage de document

      Si le serveur a besoin d'une commande spéciale, écrivez-la.

      ### Utiliser les gestionnaires de services

      Un redémarrage ne devrait pas nécessiter de se souvenir d'une longue commande manuelle.

      ## Ce qu'une configuration terminée devrait montrer

      Une configuration de service dédié ARM VPS solide devrait montrer:

      - forme et architecture de l'instance documentées
      - mise en page du répertoire du serveur
      - commande de démarrage de service dédiée
      - gestionnaire de services ou commande Docker run
      - pare-feu/liste des règles de sécurité
      - chemin de sauvegarde
      - Plan de redressement
      - notes de compatibilité architecture
      - emplacement des journaux
      - instructions de redémarrage
      - emplacement des fichiers de données de service
      - limitations connues

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - Sortie `uname -m`
      - Erreur d'architecture Docker
      - Conteneur compatible avec ARM ou fonctionnement natif réussi
      - capture d'écran d'état d'une instance de nuage avec des données sensibles cachées
      - screenshot de la règle de sécurité
      - `ss -tulpn` montrant le port de service
      - console de service dédiée en ligne
      - connexion externe réussie
      - ExtensionRuntime build sortie
      - liste des répertoires de sauvegarde
      - liste de contrôle pour le recouvrement

      ## Hypothèses techniques

      Cette note suppose que le serveur est un VPS ARM64 utilisé pour un petit hébergement dédié.

      Il suppose que l'opérateur a accès à SSH lorsque l'instance est saine.

      Il suppose que le serveur peut être utilisé pour des services dédiés, ExtensionRuntime, ou des petits services similaires.

      Il suppose également que le comportement du fournisseur de cloud, les limites de free-tier et la disponibilité d'instances devraient être traités comme des risques opérationnels plutôt que ignorés.

      ## Principaux risques

      - Mauvaise architecture CPU pour l'image Docker
      - bibliothèques d'exécution natives manquantes
      - Pas de sauvegarde
      - volume de démarrage existe mais l'instance n'est pas disponible
      - règles de sécurité en nuage bloquer les ports de service
      - OS pare-feu bloquant le trafic
      - SSH non disponible car l'instance n'a pas démarré
      - disque plein de logs/backups/Docker images
      - service démarré manuellement et perdu après le redémarrage
      - Erreurs d'extension/de construction confondues avec les erreurs d'infrastructure
      - ports publics ouverts sans comprendre ce qui les écoute

      ## État actuel

      Cette note représente le dépannage et les leçons d'exploitation de l'utilisation d'un VPS ARM pour l'hébergement de service dédié.

      La valeur la plus forte est l'approche de débogage en couches:

      ```txt
      cloud layer
      network layer
      OS layer
      runtime layer
      container layer
      dedicated service layer
      extension/plugin layer
      ```

      Chaque couche peut échouer indépendamment.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que l'hébergement ARM VPS est toujours meilleur que l'hébergement x86.

      Il ne prétend pas que chaque service dédié fonctionne bien sur ARM.

      Il ne prétend pas que les ressources de niveau libre du cloud sont suffisamment fiables pour chaque charge de production.

      Il documente le dépannage pratique pour l'hébergement de service dédié ARM à faible coût où la compatibilité, la récupération et les sauvegardes comptent.

      ## À emporter pratique

      La leçon utile est:

      > Sur un VPS ARM, le serveur ne fonctionne pas.

      Cela pourrait être :

      ```txt
      provider state
      boot failure
      SSH/network issue
      firewall rule
      wrong architecture
      missing runtime
      Docker mismatch
      service config error
      extension build error
      resource exhaustion
      ```

      La correction est de déboguer par couche, de préserver les fichiers de données de service, et de garder le déploiement récupérable.
seoTitle: "ARM VPS Troubleshooting for Dedicated Services"
seoDescription: "A practical note about troubleshooting ARM VPS hosting for dedicated services, including instance state, SSH access, console checks, Docker architecture issues, runtime errors, and recovery workflow."
---

## Why This Note Exists

This note documents the troubleshooting process around hosting dedicated services on an ARM-based VPS.

The environment used an ARM/Ampere cloud instance for lightweight server hosting. The goal was to run dedicated services, including extension-enabled deployments without paying for a larger traditional x86 VPS.

The useful part of the project was not only getting a dedicated service online. It was learning how to debug the full stack when something breaks:

- cloud instance state
- boot volume
- SSH access
- provider limits
- firewall/security rules
- ARM vs x86 compatibility
- Docker image architecture
- native runtime libraries
- dedicated service process logs
- service restart behavior

This makes the note an infrastructure troubleshooting piece, not just a dedicated-service setup note.

## Project Context

The server environment was an ARM VPS used for service hosting and experimentation.

The main workloads included:

- hosted service server hosting
- hosted service server hosting
- ExtensionRuntime deployment
- Docker attempts
- architecture-specific runtime debugging
- Linux service management
- remote SSH administration

The VPS was attractive because ARM cloud instances can provide strong resources for low cost or free-tier style usage, but ARM also adds compatibility issues when software assumes x86.

## What This Note Is Meant To Prove

- cloud servers can fail at different layers
- SSH failure does not always mean the server is deleted
- instance state, boot volume, and network rules should be checked separately
- ARM servers are useful but require architecture awareness
- Docker images must match the CPU architecture unless emulation is used
- dedicated services often depend on native libraries and runtime assumptions
- logs matter more than guessing
- a recovery checklist prevents panic when a server disappears or stops responding

## Stack and Tools Used

### Cloud Layer

- ARM/Ampere VPS
- cloud instance dashboard
- boot volume
- virtual network interface
- public IP
- security rules/firewall
- serial/console access direction
- instance stop/start/reboot checks

### Operating System Layer

- Linux
- SSH
- shell access
- system logs
- process checks
- storage checks
- firewall checks
- service startup commands

### Dedicated Service Layer

- hosted service server
- ExtensionLoader server direction
- hosted service server
- ExtensionRuntime
- `.NET` runtime
- server config files
- logs and console output

### Container Layer

- Docker
- platform/architecture selection
- image compatibility
- ARM vs amd64 behavior
- container logs
- volume mounts

## Intended Build

The intended build was a stable ARM VPS used to host small dedicated services.

A finished environment should support:

- SSH access
- persistent dedicated service files
- predictable startup commands
- reachable public ports
- backups
- logs
- restart process
- architecture-compatible binaries/images
- clear recovery steps when the instance fails

The setup does not need to be enterprise-grade. It needs to be understandable and recoverable.

## The Main Problem Categories

Most issues fall into one of these groups:

```txt
1. Cloud/provider issue
2. Instance boot issue
3. Network/security rule issue
4. SSH/authentication issue
5. OS/runtime issue
6. Architecture compatibility issue
7. Dedicated service config issue
8. Docker/container issue
```

Treating every failure as “the server is broken” wastes time.

The right question is:

```txt
Which layer is failing?
```

## Instance State Checks

The first step is checking the instance state in the cloud dashboard.

Important states:

```txt
running
stopped
stopping
starting
terminated
unavailable
```

If the instance is stopped, SSH will fail even if the files still exist.

If the instance is running but unreachable, the issue may be:

- boot problem
- firewall rule
- public IP problem
- SSH service problem
- OS-level failure
- network interface issue

If the instance is terminated, the next question is whether the boot volume still exists.

## Boot Volume Checks

A stopped or unavailable instance does not always mean the data is gone.

The boot volume may still exist.

The recovery path can be:

```txt
check boot volume
attach boot volume to another instance if needed
mount it
recover service data files/configs
copy backups
rebuild server
```

For dedicated services, the most important data is usually:

- service data files
- config files
- extension files
- whitelist/ops/admin files
- service scripts
- backup archives

The compute instance is replaceable. The service data is the asset.

## SSH Failure Does Not Mean One Thing

SSH can fail for many reasons.

Possible causes:

- instance is off
- public IP changed
- security rule blocks port 22
- OS firewall blocks SSH
- SSH daemon not running
- disk is full
- CPU/RAM exhausted
- wrong username
- wrong key
- network route problem
- provider-side issue
- boot failure

A good check order is:

```txt
instance state
public IP
security rules
ping/reachability if allowed
SSH port test
serial/console output
boot logs
```

Do not assume the SSH key is wrong until the infrastructure layer is checked.

## Public IP and Security Rules

For dedicated services, two kinds of ports matter:

```txt
management port
dedicated service ports
```

Management:

```txt
22/tcp → SSH
```

service examples:

```txt
hosted service → TCP port depending on server config
hosted service  → TCP port depending on server config
```

The cloud security list/firewall must allow the intended inbound traffic.

The Linux firewall must also allow it if configured.

A port can be open in the cloud panel but blocked in the OS, or open in the OS but blocked by the cloud network rules.

Both layers matter.

## Checking Local Listening Services

Before blaming the cloud firewall, check whether the service is listening locally.

Example:

```bash
ss -tulpn
```

or:

```bash
netstat -tulpn
```

This tells you whether the dedicated service or SSH daemon is actually listening.

If the service is not listening locally, public firewall rules will not help.

## Checking Logs

Logs are the fastest way to stop guessing.

Useful checks:

```bash
journalctl -xe
```

```bash
dmesg | tail -100
```

```bash
df -h
```

```bash
free -h
```

```bash
ps aux | grep java
```

```bash
ps aux | grep ExtensionRuntime
```

For Docker:

```bash
docker ps -a
```

```bash
docker logs --tail 100 <container-name>
```

For a dedicated service, also check the server’s own log folder.

## ARM vs x86 Compatibility

ARM VPS hosting has one major difference from normal x86 hosting:

```txt
not every binary or Docker image supports ARM
```

A common failure looks like:

```txt
exec format error
```

That usually means the binary inside the container or downloaded tool is for the wrong CPU architecture.

Example:

```txt
amd64 binary running on arm64 server
```

The fix is to use:

- ARM-compatible binary
- multi-arch Docker image
- correct platform selection
- emulation if acceptable
- different install method
- native server package where possible

## Docker Architecture Problems

Docker does not magically make architecture problems disappear.

If a Docker image contains x86 binaries and the host is ARM, it may fail.

Typical error:

```txt
exec /entrypoint.sh: exec format error
```

or:

```txt
cannot execute binary file
```

Useful checks:

```bash
uname -m
```

```bash
docker image inspect <image-name>
```

```bash
docker run --rm <image-name> uname -m
```

If the host shows:

```txt
aarch64
```

then it is ARM64.

The container/image must support ARM64 unless emulation is configured.

## Using amd64 Images on ARM

Sometimes an amd64 image can be forced with:

```bash
docker run --platform linux/amd64 ...
```

But this usually requires emulation support and can be slower or less reliable.

It can be useful for testing, but it is not always the cleanest long-term solution.

For dedicated services, performance and stability matter.

Prefer native ARM-compatible setup when possible.

## SteamCMD and ARM Issues

Some dedicated service workflows depend on SteamCMD.

SteamCMD and some dedicated server binaries may assume x86/x86_64.

On ARM servers, this can create problems:

- SteamCMD binary architecture mismatch
- dedicated service binary not available for ARM
- Docker image uses amd64 only
- emulation needed
- libraries missing
- startup script fails before the service runs

The important lesson:

```txt
The VPS can be strong enough, but the software must support its CPU architecture.
```

## Extension Runtime Issues

The hosted services with an ExtensionRuntime setup had its own runtime problems.

Possible issue categories:

- `.NET` runtime mismatch
- native library missing
- launch script assumptions
- architecture mismatch
- server config path issue
- extension build error
- missing dependency
- wrong working directory

A runtime/native library error is different from a extension code error.

For example:

```txt
FNA3D.so missing
```

is not the same kind of problem as:

```txt
C# override method signature is wrong
```

Separate environment/runtime errors from extension compilation errors.

## ExtensionRuntime Build Direction

A custom extension build command had a shape like:

```bash
dotnet ExtensionRuntime.dll -build SurfaceProtection -tmlsavedirectory /home/opc/tml-arm/ExtensionRuntime
```

Problems here can come from:

- wrong directory
- wrong `.NET` runtime
- missing native library
- wrong ExtensionRuntime version
- broken extension source
- API mismatch
- bad override signature

A build error should be read literally first. The compiler often points directly at the failing file and line.

## hosted service Server Direction

hosted service on ARM is often easier than some other dedicated services because Java supports ARM well when the correct Java runtime is installed.

Main checks:

- correct Java version
- server jar exists
- enough RAM
- correct port
- EULA accepted
- extensions match server version
- ExtensionLoader/loader versions match
- service starts in correct directory
- firewall allows the service port
- backups exist

hosted service issues are more often config/extension/version problems than CPU architecture problems, though native extensions or wrappers can still matter.

## Dedicated Service Data Preservation

For service hosting, the important directories should be easy to identify.

Examples:

```txt
/srv/dedicated-service/
```

```txt
/home/opc/tml-arm/ExtensionRuntime/
```

or whichever directory holds:

- persistent data
- extensions
- configs
- logs
- backups
- server scripts

A good server layout makes recovery easier.

If the VPS becomes unavailable, you should know exactly what needs to be copied from the boot volume.

## Backup Direction

Backups matter more than instance size.

A basic backup plan should include:

```txt
service data files
config files
extension list
service scripts
environment files without public sharing
important logs if needed
```

Backups should be stored outside the instance if the service data matters.

At minimum:

```txt
local copy
separate volume
object storage
another server
```

A free or cheap VPS can disappear, fail, or be stopped. The data should not exist in only one place.

## Provider Limits and Free-Tier Risk

Free-tier or low-cost cloud hosting can be useful, but it has risks:

- capacity shortages
- resource reclamation
- account restrictions
- unclear billing/free-tier messages
- stopped instances
- boot volume still present but compute unavailable
- region availability changes
- accidental paid resource creation

For a portfolio note, the important framing is not complaining about the provider.

The useful framing is:

```txt
designing recovery and verification steps for a low-cost ARM VPS environment
```

That shows infrastructure maturity.

## Avoiding Accidental Paid Resources

When using cloud free-tier style resources, review:

- instance shape
- OCPU/RAM
- boot volume size
- block volumes
- public IP type
- load balancers
- snapshots/backups
- object storage
- outbound bandwidth
- region limits

The practical rule:

```txt
Know which resources cost money before creating them.
```

For small dedicated services, avoid adding random managed services unless required.

## Serial Console / Recovery Console Direction

If SSH fails but the instance is still running, console access can help.

A serial/recovery console may reveal:

- boot errors
- disk full problems
- failed services
- network config errors
- login prompts
- kernel messages
- stuck boot process

This is useful because SSH depends on the OS booting far enough and networking working.

Console access checks the server closer to the machine level.

## Disk Full Problems

A full disk can break many things:

- SSH login
- package installs
- dedicated service saves
- logs
- Docker
- extension builds
- service data backups

Check:

```bash
df -h
```

Docker can consume space with old images/containers.

Check:

```bash
docker system df
```

For dedicated services, service data backups and logs can grow over time.

## RAM and CPU Pressure

Dedicated services can freeze or crash if resources are exhausted.

Check:

```bash
free -h
```

```bash
top
```

```bash
uptime
```

For Java/hosted service, memory flags matter.

For ExtensionRuntime/hosted service, extension count and service data activity matter.

For Docker, container limits may help prevent one service from consuming everything.

## Firewall and Port Testing

A service needs three things:

```txt
process listening
OS firewall allows it
cloud firewall allows it
```

Testing sequence:

```txt
check local listening
check OS firewall
check cloud security rules
test from outside
check server logs during test
```

A port checker alone is not enough. The server logs confirm whether traffic reached the application.

## Service Management

Dedicated services should not rely only on an interactive SSH session.

Better options:

- systemd service
- screen/tmux for manual testing
- Docker container with restart policy
- startup script with logs
- documented start/stop commands

For long-running servers, a service manager is cleaner than manually starting the process after every reboot.

## Common Mistakes

### Assuming More Resources Means Fewer Problems

ARM instances can have good CPU/RAM, but compatibility still matters.

### Treating Docker As Architecture-Neutral

Docker images still contain architecture-specific binaries.

### Debugging service Config Before Checking Firewall

If no connection reaches the server, check network path first.

### Thinking SSH Failure Means Data Is Lost

The boot volume may still be recoverable.

### Running Everything Manually

Manual commands are fine for setup. Stable hosting needs repeatable start/restart/log workflows.

### Not Backing Up persistent data

service data files are the most valuable part of the dedicated service.

## Practical Troubleshooting Flow

A useful flow:

```txt
1. Is the cloud instance running?
2. Does it still have the expected public IP?
3. Are cloud security rules correct?
4. Does SSH port respond?
5. If SSH fails, check console/boot logs.
6. If SSH works, check disk/RAM/CPU.
7. Check whether the service endpoint is listening.
8. Check service logs.
9. Check architecture compatibility.
10. Test from outside.
11. Backup important data before risky changes.
```

This avoids jumping randomly between unrelated fixes.

## Practical One-Line Checks

Architecture:

```bash
uname -m
```

Disk:

```bash
df -h
```

Memory:

```bash
free -h
```

Listening ports:

```bash
ss -tulpn
```

Docker containers:

```bash
docker ps -a
```

Recent system logs:

```bash
journalctl -xe --no-pager | tail -100
```

Docker logs:

```bash
docker logs --tail 100 <container-name>
```

Find large files:

```bash
du -h /home /srv /var 2>/dev/null | sort -h | tail -50
```

Check Java:

```bash
java -version
```

Check Wire/service process:

```bash
ps aux | grep -E 'java|hosted service|ExtensionRuntime'
```

## Practical Decisions

### Prefer native ARM when possible

Native ARM builds are cleaner than forcing amd64 emulation.

### Keep persistent data backed up

The VPS can be rebuilt. The service data should not be disposable.

### Separate provider problems from server problems

Cloud instance state, boot volume, and network rules are different layers.

### Check logs before changing many things

Logs usually narrow the issue faster than guessing.

### Document start commands

If the server needs a special command, write it down.

### Use service managers

A reboot should not require remembering a long manual command.

## What A Finished Setup Should Show

A strong finished ARM VPS dedicated-service setup should show:

- instance shape and architecture documented
- server directory layout
- dedicated service start command
- service manager or Docker run command
- firewall/security rule list
- backup path
- recovery plan
- architecture compatibility notes
- logs location
- restart instructions
- service data files location
- known limitations

## Evidence Worth Capturing

Useful evidence for this note would include:

- `uname -m` output
- Docker architecture error
- successful ARM-compatible container or native run
- cloud instance state screenshot with sensitive data hidden
- security rule screenshot
- `ss -tulpn` showing service port
- dedicated service console online
- successful external connection
- ExtensionRuntime build output
- backup directory listing
- recovery checklist

## Technical Assumptions

This note assumes the server is an ARM64 VPS used for small dedicated-service hosting.

It assumes the operator has SSH access when the instance is healthy.

It assumes the server may be used for dedicated services, ExtensionRuntime, or similar small services.

It also assumes cloud provider behavior, free-tier limits, and instance availability should be treated as operational risks rather than ignored.

## Key Risks

- wrong CPU architecture for Docker image
- missing native runtime libraries
- no backups
- boot volume exists but instance is unavailable
- cloud security rules blocking service ports
- OS firewall blocking traffic
- SSH unavailable because the instance failed to boot
- disk full from logs/backups/Docker images
- service started manually and lost after reboot
- extension/build errors confused with infrastructure errors
- public ports open without understanding what listens behind them

## Current State

This note represents the troubleshooting and operating lessons from using an ARM VPS for dedicated-service hosting.

The strongest value is the layered debugging approach:

```txt
cloud layer
network layer
OS layer
runtime layer
container layer
dedicated service layer
extension/plugin layer
```

Each layer can fail independently.

## What This Note Does Not Claim

This note does not claim ARM VPS hosting is always better than x86 hosting.

It does not claim every dedicated service runs well on ARM.

It does not claim cloud free-tier resources are reliable enough for every production workload.

It documents practical troubleshooting for low-cost ARM dedicated-service hosting where compatibility, recovery, and backups matter.

## Practical Takeaway

The useful lesson is:

> On an ARM VPS, “the server does not work” is not one problem.

It could be:

```txt
provider state
boot failure
SSH/network issue
firewall rule
wrong architecture
missing runtime
Docker mismatch
service config error
extension build error
resource exhaustion
```

The fix is to debug by layer, preserve the service data files, and keep the deployment recoverable.
