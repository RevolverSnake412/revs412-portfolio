---
resume: true
title: "Router Firmware Recovery Through Serial and Flash Access"
slug: "router-firmware-recovery-through-serial-and-flash-access"
summary: "Field notes from troubleshooting and recovering router firmware/storage failures, including EdgeRouter X serial console recovery, NAND/MTD corruption symptoms, bootloader access, and external flash recovery direction."
resumeSummary: >-
  Created a recovery reference for router failures involving corrupted firmware or storage, unstable configuration persistence, and incomplete boot behaviour. The procedure covers observing early symptoms, distinguishing reset behaviour from flash failure, accessing an EdgeRouter X through USB-TTL serial, using bootloader or failsafe paths, interpreting NAND and MTD bad-block signs, and deciding when external flash recovery is warranted. It prioritizes evidence before destructive recovery steps, preserving a path back to the device when ordinary web or SSH administration is no longer available.
category: "Hardware Recovery"
tags:
  - router
  - firmware
  - edgerouter-x
  - ubiquiti
  - openwrt
  - edgeos
  - usb-ttl
  - serial-console
  - nand
  - spi-flash
  - u-boot
  - hardware-recovery
date: "2026-07-23"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Récupération de firmware de routeur par accès série et flash"
    category: "Récupération matérielle"
    summary: "Notes sur le diagnostic et la récupération de pannes de firmware ou stockage de routeur : console série, bootloader, NAND/MTD et récupération de mémoire flash externe."
    resumeSummary: >-
      Création d'une référence de récupération pour les défaillances du routeur impliquant un firmware ou un
      stockage corrompu, une persistance de configuration instable et un comportement de démarrage incomplet.
      La procédure couvre l'observation des symptômes précoces, la distinction entre le comportement de
      réinitialisation et la défaillance du flash, l'accès à une série EdgeRouter X par USB-TTL, l'utilisation
      de bootloader ou de chemins de sécurité, l'interprétation des signes de mauvais blocs NAND et MTD, et la
      décision lorsque la récupération externe du flash est justifiée. Il priorise les preuves avant les
      étapes de récupération destructrice, en préservant un chemin de retour à l'appareil lorsque
      l'administration Web ordinaire ou SSH n'est plus disponible.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente un véritable chemin de récupération de routeur où l'accès normal à l'administration n'était pas suffisant.

      L'appareil était un EdgeRouter X qui montrait des signes de corruption de firmware / stockage avant de devenir dur-briqué. Le processus de récupération a déplacé à travers plusieurs couches:

      ```txt
      web UI / SSH
        ↓
      firmware reinstall
        ↓
      TFTP / recovery image
        ↓
      USB-TTL serial console
        ↓
      bootloader / U-Boot recovery
        ↓
      external flash recovery direction
      ```

      La partie utile de cette note n'est pas seulement le firmware Flash.

      Il s'agit d'une note de dépannage matérielle et firmware de bas niveau.

      ## Contexte du projet

      Le routeur était un Ubiquiti EdgeRouter X.

      Les premiers symptômes n'étaient pas une erreur de configuration normale. Le routeur pouvait démarrer, mais les changements de configuration ne survivaient pas au redémarrage.

      Direction observée:

      ```txt
      /config/config.boot resets to default after reboot
      EdgeOS/OpenWrt changes do not persist properly
      multiple firmware versions were tried
      TFTP and SSH recovery were attempted
      /config appeared mounted read-only in some context
      ```

      Un détail de montage observé a montré:

      ```txt
      /opt/vyatta/config/active
      ```

      en lecture seule par une direction du système de fichiers syndical.

      Plus tard, la console série a montré les informations NAND/MTD et les mauvais messages de bloc. Après une tentative de flash erroné, le routeur est passé dans un état bien pire où l'accès normal à la console s'est arrêté.

      ## Ce que cette récupération signifie prouver

      - les défaillances du routeur sont superposées
      - configuration réinitialiser après le redémarrage peut indiquer des problèmes de stockage ou de superposition
      - firmware réinstaller n'est pas toujours suffisant
      - USB-TTL accès série donne une visibilité sous SSH/web UI
      - accès bootloader peut permettre une récupération de niveau inférieur
      - Les mauvais blocs NAND/MTD peuvent expliquer la persistance instable
      - clignotant la mauvaise image peut transformer une brique douce en brique dure
      - lorsque la sortie série disparaît, la récupération peut nécessiter un accès flash externe
      - La récupération du firmware doit être lente, vérifiée et documentée

      ## Pioche et outils utilisés

      ### Couche du périphérique

      - Ubiquiti EdgeRouter X
      - NAND/MTD direction de stockage
      - bootloader / U-Boot direction
      - EdgeOS
      - Essais de récupération OpenWrt

      ### Couche d'accès

      - SSH
      - TFTP sens de récupération
      - Adaptateur série USB-TTL
      - Console série PuTTY
      - 3.3V câblage série TTL
      - console de démarrage / direction de sécurité

      ### Couche de récupération

      - images firmware
      - environnement du chargeur de démarrage
      - Serveur TFTP
      - messages de démarrage série
      - direction externe possible de récupération SPI/NAND flash
      - CH341A/flashrom-style direction de récupération si serial/bootloader est parti

      ## Objectif de relèvement prévu

      L'objectif de rétablissement visé était :

      ```txt
      restore a bootable router
      restore writable persistent configuration
      recover or reflash valid firmware
      avoid losing bootloader access
      understand whether the issue is firmware, config partition, NAND, or bootloader
      ```

      Un bon processus de récupération devrait préserver autant d'informations diagnostiques que possible avant de faire des écrits destructeurs.

      ## Symptômes précoces : Reconfiguration après le redémarrage

      Le premier symptôme important est la configuration qui ne persiste pas.

      Exemple de comportement :

      ```txt
      change router config
      reboot
      config returns to default
      ```

      Cela suggère que le problème peut ne pas être l'interface utilisateur ou la commande utilisée.

      Causes possibles:

      - partition `/config` mal montée
      - problème de système de fichiers de recouvrement/union
      - firmware en mode récupération temporaire
      - NAND/MTD corruption
      - échec de la persistance de l'écriture
      - stockage de configuration endommagé ou en lecture seule
      - firmware inadéquation ou état de mise à niveau cassé

      Ce symptôme est plus fort que "J'ai oublié d'enregistrer la configuration".

      ## EdgeOS/OpenWrt Reset Behavior

      Le comportement du routeur a affecté les deux directions EdgeOS/OpenWrt.

      Lorsque des chemins de firmware différents présentent encore des problèmes de persistance, la question probable est plus faible:

      ```txt
      not just one config file
      not just one web UI
      not just one firmware version
      possibly storage layout / NAND / boot state
      ```

      C'est pourquoi la récupération nécessaire pour passer en dessous de la résolution de problèmes de niveau logiciel normal.

      ## Accès en série USB-TTL

      L'accès série USB-TTL est utile car il donne accès aux messages de démarrage et parfois à l'invite de démarrage.

      Une direction de câblage typique sûre:

      ```txt
      USB-TTL TX → router RX
      USB-TTL RX → router TX
      USB-TTL GND → router GND
      VCC       → do not connect unless specifically required
      ```

      Important:

      ```txt
      use 3.3V TTL
      do not connect 5V power to the router serial header
      ```

      Direction des réglages de console série:

      ```txt
      baud rate: 115200
      data bits: 8
      parity: none
      stop bits: 1
      flow control: none
      ```

      PuTTY ou un autre terminal série peut être utilisé sur Windows.

      ## Pourquoi la Console Serial compte

      SSH dépend du démarrage de l'OS et du travail en réseau.

      La console série peut afficher les étapes de démarrage antérieures:

      - sortie bootloader
      - chargement du noyau
      - Messages NAND/MTD
      - Erreurs du système de fichiers
      - prompts de sécurité
      - Messages du chargeur OpenWrt
      - arguments de démarrage
      - direction du menu de récupération

      C'est pourquoi l'accès série est l'un des outils de récupération de routeur les plus précieux.

      Il donne des informations même quand Ethernet, interface utilisateur web ou SSH ne sont pas disponibles.

      ## Chargeur OpenWrt / Direction de sécurité

      À un moment, la console a montré un contexte de chargeur de noyau OpenWrt/failsafe.

      Le genre de message était:

      ```txt
      OpenWrt kernel loader for MIPS based SoC...
      Press the [f] key...
      ```

      Cela indique que le routeur atteignait toujours un chemin de démarrage bas.

      Ceci est utile car il signifie:

      ```txt
      bootloader/early boot was still alive
      serial console was useful
      firmware recovery was still possible
      ```

      À ce stade, la récupération devrait se concentrer sur la manipulation prudente bootloader/failsafe plutôt que le firmware aléatoire écrit.

      ## NAND / MTD Bad Blocks

      La console série a montré plus tard les informations de mise en page NAND/MTD et les mauvais messages de blocs.

      La mauvaise direction observée du bloc comprenait des décalages comme :

      ```txt
      0x1ef80
      0x1f380
      ```

      Les mauvais blocs dans NAND ne sont pas automatiquement mortels parce que les systèmes NAND peuvent tolérer certains mauvais blocs.

      Mais dans un routeur avec des défaillances persistantes de configuration, les messages NAND/MTD deviennent des preuves importantes.

      Ils peuvent aider à expliquer:

      - instabilité de la partition de configuration
      - firmware écrire des échecs
      - défaillance du démarrage
      - comportement de récupération incohérent
      - corruption après des tentatives éclair

      Le libellé devrait être prudent :

      ```txt
      firmware/NAND contents corruption
      ```

      est plus sûr que de prétendre:

      ```txt
      physically dead NAND chip
      ```

      à moins que la puce elle-même ait été confirmée défectueuse.

      ## Libellé correct

      Une mauvaise formulation serait :

      ```txt
      I flashed the NAND chip using USB-TTL.
      ```

      Ce n'est généralement pas exact.

      USB-TTL fournit un accès à la console série. Il ne programme pas directement la puce NAND comme un programmeur flash.

      Meilleure formulation:

      ```txt
      I used a USB-TTL adapter to access the router's serial console and perform lower-level firmware recovery through the bootloader/recovery environment.
      ```

      ou:

      ```txt
      The router showed firmware/NAND contents corruption, and recovery required serial-assisted bootloader access before the failure became hard-bricked.
      ```

      Si la programmation externe est plus tard utilisée, c'est une étape distincte:

      ```txt
      external flash programmer / SPI or NAND recovery
      ```

      ## Direction de la récupération TFTP

      La récupération au niveau du bootloader utilise souvent TFTP.

      Un flux conceptuel typique:

      ```txt
      set router recovery IP
      set TFTP server IP
      load firmware image over TFTP
      boot or flash the image
      verify result
      ```

      Exemple de direction d'environnement du chargeur de démarrage:

      ```txt
      setenv ipaddr 192.168.1.1
      setenv serverip 192.168.1.100
      saveenv
      tftpboot 0x81000000 <firmware-or-recovery-image>
      ```

      Les commandes exactes dépendent du périphérique, du chargeur de démarrage, du type d'image et de la méthode de récupération.

      La règle importante :

      ```txt
      do not flash random images to bootloader or firmware partitions without verifying what partition they belong to
      ```

      ## Risques clignotants

      Cliquer sur le mauvais fichier peut aggraver le problème.

      Cela s'est produit dans le chemin de récupération : après qu'un mauvais fichier ait été clignoté, le routeur a atteint un état plus dur.

      Plus tard, les symptômes ont été les suivants :

      ```txt
      no useful console output
      no reset reaction
      only power LED visible
      other LEDs not flashing normally
      USB-TTL showing no output
      ```

      C'est une classe d'échec différente.

      Avant cela, le routeur produisait au moins des informations de sortie série et de récupération.

      Après cela, la chaîne de démarrage peut ne pas avoir commencé correctement.

      ## Brick doux vs Brick dur

      Une distinction utile:

      ### Brique molle

      Le routeur ne démarre pas normalement, mais un chemin de récupération fonctionne encore.

      Exemples:

      ```txt
      serial console output exists
      bootloader prompt reachable
      failsafe mode reachable
      TFTP recovery reachable
      LEDs show boot activity
      ```

      ### Brique dure

      Le routeur semble mort à un niveau inférieur.

      Exemples:

      ```txt
      no serial output
      no bootloader prompt
      no useful LED sequence
      reset does nothing
      Ethernet recovery unavailable
      ```

      Une brique souple peut souvent être récupérée par le biais de la série/TFTP.

      Une brique dure peut nécessiter un clignotement externe ou une récupération de niveau matériel.

      ## Quand la sortie série disparaît

      Si USB-TTL a montré précédemment la sortie mais plus tard ne montre rien, vérifiez d'abord les problèmes simples:

      - port COM correct
      - taux de baud
      - TX/RX s'échange correctement
      - GND connecté
      - adaptateur est 3.3V TTL
      - routeur alimenté séparément
      - pins d'en-tête faisant contact
      - Les paramètres de la série PuTTY sont corrects
      - adaptateur détecté par OS

      Si tout cela est correct et qu'il n'y a toujours pas de sortie, le chargeur de démarrage peut ne pas fonctionner.

      C'est à ce moment que la direction du rétablissement se dirige vers :

      ```txt
      external flash programmer
      JTAG if available
      replacing/reprogramming bootloader/flash contents
      ```

      ## Direction externe de récupération Flash

      Lorsque le chargeur de démarrage est endommagé ou que le routeur ne produit pas de sortie série, USB-TTL seul peut ne pas suffire.

      Le recouvrement externe peut nécessiter:

      - identification de la puce flash ou de la disposition de stockage
      - utilisant un programmeur externe
      - lire la puce avant d'écrire
      - Enregistrer plusieurs sauvegardes
      - comparant les décharges
      - obtenir une image connue de bootloader/firmware
      - écrire attentivement
      - vérifier l'écriture
      - réassemblage et essai de la sortie série

      C'est plus envahissant et plus risqué que la récupération TFTP bootloader.

      Il doit être traité comme une récupération de dernier recours.

      ## SPI vs NAND Clarification

      Les routeurs peuvent utiliser différentes technologies de stockage.

      Certains guides de récupération comportent un flash SPI NOR, tandis que d'autres comportent des schémas NAND/MTD.

      La discussion sur la récupération d'EdgeRouter X a impliqué des messages de style NAND/MTD et des symptômes de corruption de stockage.

      Le titre de la note inclut l'accès Flash de manière générale parce que le concept de récupération est sur le stockage de firmware de bas niveau.

      Une note technique correcte devrait éviter de prétendre que chaque routeur a la même disposition flash.

      Le processus devrait commencer par identifier:

      ```txt
      device model
      SoC
      bootloader
      flash type
      partition layout
      firmware image format
      recovery method
      ```

      ## Liste de contrôle diagnostique

      Avant de crier quelque chose de destructeur:

      ### Confirmer l'échec

      - Est-ce que le routeur démarre ?
      - Est-ce que SSH travaille ?
      - Est-ce que l'interface utilisateur Web fonctionne?
      - La config persiste - t - elle?
      - La sortie de console série apparaît-t-elle ?
      - les LED montrent l'activité de démarrage?
      - fonctionne-t-il avec réinitialisation ou sécurité?

      ### Vérifier les symptômes d'entreposage

      - `/config/config.boot` est-il réinitialisé?
      - La configuration est-elle en lecture seule?
      - les changements de firmware persistent-ils?
      - Les journaux montrent-ils les erreurs NAND/MTD?
      - Les mauvais blocs sont-ils signalés ?
      - Le routeur fonctionne-t-il depuis l'image RAM/Recovery ?

      ### Vérifier l'accès en série

      - adaptateur USB-TTL correct
      - 3.3V TTL
      - TX/RX croisé
      - GND connecté
      - pas de connexion VCC
      - 115200 8N1
      - port COM correct
      - messages de démarrage capturés

      ### Vérifier le chemin de récupération

      - corriger l'image du firmware
      - type d'image de récupération correcte
      - correcte IP du serveur TFTP
      - IP du routeur correct
      - correcte les commandes de bootloader
      - sauvegarde avant d'écrire si possible

      ## Les preuves de rétablissement méritent d'être sauvées

      Pendant la récupération du routeur, les preuves utiles comprennent:

      - journal de démarrage depuis la console série
      - Messages de mise en page NAND/MTD
      - mauvais messages de blocs
      - nom exact de l'image du firmware
      - commandes tapées dans bootloader
      - Sortie de transfert TFTP
      - sortie de montage
      - test de persistance de configuration
      - Comportement à DEL
      - captures d'écran/photos de câblage
      - comportement avant/après le démarrage
      - résultat final de récupération

      Ceci est important car une fois le dispositif clignoté, l'état précédent peut être perdu.

      ## Flux de récupération pratique

      Un débit plus sûr:

      ```txt
      1. Document symptoms.
      2. Try normal config save/reboot test.
      3. Check if firmware actually persists.
      4. Access serial console through USB-TTL.
      5. Capture full boot log.
      6. Identify bootloader, partitions, and storage errors.
      7. Try non-destructive boot/recovery first.
      8. Use TFTP recovery only with correct image.
      9. Avoid flashing bootloader partitions unless necessary.
      10. If serial disappears, move to external flash recovery direction.
      ```

      La règle la plus importante est :

      ```txt
      do not rush destructive writes
      ```

      ## EdgeRouter X Histoire de récupération

      Le cas EdgeRouter X peut être résumé comme ceci:

      ```txt
      The router first showed persistence problems: configuration changes and firmware state did not survive reboot reliably. Normal firmware recovery did not solve the issue. Serial console access through USB-TTL exposed lower-level boot behavior and NAND/MTD information, including bad block messages. This suggested the issue was below normal configuration management and likely involved firmware/storage corruption. After an incorrect flashing attempt, the device became hard-bricked: normal console output disappeared and only the power LED remained active. At that point, recovery moved beyond USB-TTL serial access toward external flash/JTAG-style recovery direction.
      ```

      Cela vaut la peine d'inclure parce qu'il montre dépannage en couches et la différence entre la corruption du firmware récupérable et une brique plus profonde.

      ## Erreurs fréquentes

      ### Dire USB-TTL Flashs NAND Directement

      USB-TTL donne accès à la console série.

      Il ne programme pas directement la puce flash.

      ### Cliquer sur la mauvaise image

      Les images firmware, les images de récupération, les fichiers d'amorçage et les images de partition ne sont pas interchangeables.

      ### Ignorer les mauvais messages de bloc

      Certains blocs mauvais NAND peuvent être normaux, mais dans le contexte ils comptent.

      ### Supposons que le bouton réinitialise tout

      Si le chargeur de démarrage ou le firmware de stockage est endommagé, réinitialiser peut ne rien faire d'utile.

      ### Pas d'enregistrement des journaux de démarrage

      Les journaux de démarrage sont des preuves diagnostiques.

      ### Connecter VCC sur Serial Header

      Sur de nombreux en-têtes série routeurs, connectez TX/RX/GND seulement. Ne pas alimenter la carte depuis l'adaptateur USB-TTL à moins que la documentation de l'appareil ne l'exige explicitement.

      ## Décisions pratiques

      ### Utiliser une formulation précise

      Disons que le contenu du logiciel/NAND est corrompu sauf si l'échec de la puce physique est confirmé.

      ### Garder les flashs USB-TTL et externe séparés

      La récupération de consoles série et la programmation de puces sont différents niveaux de récupération.

      ### Capturer les journaux de démarrage avant de clignoter

      Les journaux peuvent expliquer l'échec et guider l'étape suivante.

      ### Traiter bootloader écrit comme dangereux

      Un mauvais flash firmware peut être récupérable. Un mauvais flash bootloader peut supprimer la récupération série/TFTP.

      ### Préserver les sauvegardes

      Si un accès flash externe est utilisé, lisez et enregistrez le contenu actuel de la puce avant d'écrire quoi que ce soit.

      ### Trajectoires spécifiques au périphérique de document

      La récupération du routeur est spécifique au modèle. Ne pas assumer les commandes d'un appareil s'appliquent à un autre.

      ## Ce qu'une note de récupération terminée devrait montrer

      Une note bien terminée doit montrer :

      - modèle d'appareil
      - symptômes avant la brique
      - tentatives normales de récupération
      - direction du câblage série
      - paramètres série
      - Preuves du journal de démarrage
      - NAND/MTD mauvaise preuve de bloc
      - commandes de récupération ou direction
      - risque clignotant
      - symptômes durs
      - lorsque la récupération flash externe devient nécessaire
      - Enseignements définitifs et corrections de formulation

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - photo du câblage d'en-tête série EdgeRouter X
      - Photo de l'adaptateur USB-TTL
      - Paramètres de la série PuTTY
      - sortie bootloader
      - Lignes de mauvais blocs NAND/MTD
      - Essai de persistance de `/config/config.boot`
      - Monter la sortie montrant la direction de configuration en lecture seule
      - Écran/sortie de récupération TFTP
      - Le comportement LED après un flash raté
      - configuration externe de récupération flash si tenté
      - État définitif de récupération

      ## Hypothèses techniques

      Cette note suppose que le routeur appartient à l'exploitant et que la récupération est autorisée.

      Il suppose que l'opérateur travaille sur du matériel local, ne contournant pas les contrôles d'accès sur un autre appareil.

      Il suppose également que les commandes de récupération de firmware sont spécifiques aux appareils et doivent être vérifiées par rapport au modèle exact et au type d'image avant d'écrire.

      ## Principaux risques

      - mauvais adaptateur série tension
      - connexion incorrecte VCC
      - Erreurs de câblage TX/RX
      - clignotant la mauvaise image
      - écraser bootloader
      - en supposant que les mauvais blocs NAND signifient toujours une défaillance physique des puces
      - pas de sauvegarde avant l'écriture externe
      - utilisant des commandes d'un autre modèle de routeur
      - traiter OpenWrt, EdgeOS, images de récupération et images de chargeur de démarrage comme interchangeables
      - perdre des journaux de diagnostic avant la récupération destructrice

      ## État actuel

      Cette note représente l'expérience de récupération du firmware routeur autour du flux de travail EdgeRouter X et de récupération série/flash.

      Il transforme le problème original de la brique de route en une solide histoire de récupération matérielle:

      ```txt
      normal software troubleshooting
      persistent config failure
      serial console diagnostics
      NAND/MTD evidence
      bootloader recovery direction
      hard-brick boundary
      external flash recovery direction
      ```

      Cela rend la note plus forte qu'un firmware générique clignotant.

      ## Ce que la présente note ne prétend pas

      Cette note ne prétend pas que la puce physique NAND était définitivement morte.

      Il ne prétend pas USB-TTL clignote directement NAND.

      Il ne fournit pas une méthode de récupération universelle pour chaque routeur.

      Il documente un chemin de récupération pratique et le raisonnement utilisé lorsqu'un routeur passe de l'échec de configuration à la corruption de firmware/stockage, puis au territoire de brique dure.

      ## À emporter pratique

      La leçon utile est:

      > Un routeur en briques n'est pas un état d'échec.

      Il peut être:

      ```txt
      bad config
      broken firmware
      read-only config storage
      corrupted NAND/MTD contents
      wrong recovery image
      damaged bootloader
      hard brick requiring external flash access
      ```

      La méthode de récupération dépend de la couche qui fonctionne encore.

      Si la console série fonctionne, utilisez-la soigneusement et capturez les preuves.

      Si la console série cesse de fonctionner après un mauvais flash, le chemin de récupération se déplace au-delà d'USB-TTL vers un flash externe ou une réparation au niveau de la carte.

      ## État définitif du matériel

      La conclusion de travail actuelle est que la puce flash du NOR est défectueuse et aura probablement besoin d'être remplacée.

      À ce stade, le routeur devrait être traité comme un cas de réparation au niveau de la carte plutôt qu'un cas normal de récupération du firmware. L'accès série USB-TTL et la récupération du chargeur de démarrage ne sont plus suffisants si la puce flash elle-même ne peut pas stocker ou fournir le contenu de démarrage de manière fiable.

      La prochaine tâche pratique, si ce routeur est revu plus tard, est :

      ```txt
      replace the faulty NOR flash chip
      flash known-good boot/firmware contents
      verify serial output returns
      confirm the router boots consistently
      test whether configuration persistence is restored
      ```

      En attendant, la récupération est considérée comme interrompue au stade du remplacement du matériel.
seoTitle: "Router Firmware Recovery Through Serial and Flash Access"
seoDescription: "A practical note about router firmware recovery using USB-TTL serial access, bootloader recovery, NAND/MTD troubleshooting, EdgeRouter X recovery symptoms, and external flash recovery direction."
---

## Why This Note Exists

This note documents a real router recovery path where normal admin access was not enough.

The device was an EdgeRouter X that showed signs of firmware/storage corruption before becoming hard-bricked. The recovery process moved through several layers:

```txt
web UI / SSH
  ↓
firmware reinstall
  ↓
TFTP / recovery image
  ↓
USB-TTL serial console
  ↓
bootloader / U-Boot recovery
  ↓
external flash recovery direction
```

The useful part of this note is not just “flash firmware.” It is understanding how to diagnose a router when normal configuration changes do not persist and the device may have corrupted firmware, bad NAND blocks, broken bootloader state, or failed recovery attempts.

This is a low-level hardware and firmware troubleshooting note.

## Project Context

The router was an Ubiquiti EdgeRouter X.

The early symptoms were not a normal configuration mistake. The router could boot, but configuration changes did not survive reboot. Firmware and configuration behavior suggested a storage or firmware persistence problem.

Observed direction:

```txt
/config/config.boot resets to default after reboot
EdgeOS/OpenWrt changes do not persist properly
multiple firmware versions were tried
TFTP and SSH recovery were attempted
/config appeared mounted read-only in some context
```

One observed mount detail showed:

```txt
/opt/vyatta/config/active
```

as read-only through a union filesystem direction.

Later, the serial console showed NAND/MTD information and bad block messages. After a wrong flashing attempt, the router moved into a much worse state where normal console access stopped.

## What This Recovery Is Meant To Prove

- router failures are layered
- configuration reset after reboot can indicate storage or overlay problems
- firmware reinstall is not always enough
- USB-TTL serial access gives visibility below SSH/web UI
- bootloader access can allow lower-level recovery
- NAND/MTD bad blocks can explain unstable persistence
- flashing the wrong image can turn a soft brick into a hard brick
- when serial output disappears, recovery may require external flash access
- firmware recovery should be slow, verified, and documented

## Stack and Tools Used

### Device Layer

- Ubiquiti EdgeRouter X
- NAND/MTD storage direction
- bootloader / U-Boot direction
- EdgeOS
- OpenWrt recovery attempts

### Access Layer

- SSH
- TFTP recovery direction
- USB-TTL serial adapter
- PuTTY serial console
- 3.3V TTL serial wiring
- boot console / failsafe direction

### Recovery Layer

- firmware images
- bootloader environment
- TFTP server
- serial boot messages
- possible external SPI/NAND flash recovery direction
- CH341A/flashrom-style recovery direction if serial/bootloader is gone

## Intended Recovery Goal

The intended recovery goal was:

```txt
restore a bootable router
restore writable persistent configuration
recover or reflash valid firmware
avoid losing bootloader access
understand whether the issue is firmware, config partition, NAND, or bootloader
```

A good recovery process should preserve as much diagnostic information as possible before doing destructive writes.

## Early Symptom: Config Reverting After Reboot

The first important symptom was configuration not persisting.

Example behavior:

```txt
change router config
reboot
config returns to default
```

That suggests the problem may not be the UI or command being used.

Possible causes:

- `/config` partition not mounted correctly
- overlay/union filesystem issue
- firmware running from temporary recovery mode
- NAND/MTD corruption
- failed write persistence
- damaged or read-only configuration storage
- firmware mismatch or broken upgrade state

This symptom is stronger than “I forgot to save config.” It points to the storage/persistence layer.

## EdgeOS / OpenWrt Reset Behavior

The router behavior affected both EdgeOS/OpenWrt directions.

When different firmware paths still show persistence problems, the likely issue moves lower:

```txt
not just one config file
not just one web UI
not just one firmware version
possibly storage layout / NAND / boot state
```

That is why recovery needed to move below normal software-level troubleshooting.

## USB-TTL Serial Access

USB-TTL serial access is useful because it gives access to boot messages and sometimes the bootloader prompt.

A typical safe wiring direction:

```txt
USB-TTL TX → router RX
USB-TTL RX → router TX
USB-TTL GND → router GND
VCC       → do not connect unless specifically required
```

Important:

```txt
use 3.3V TTL
do not connect 5V power to the router serial header
```

Serial console settings direction:

```txt
baud rate: 115200
data bits: 8
parity: none
stop bits: 1
flow control: none
```

PuTTY or another serial terminal can be used on Windows.

## Why Serial Console Matters

SSH depends on the OS booting and networking working.

The serial console can show earlier boot stages:

- bootloader output
- kernel loading
- NAND/MTD messages
- filesystem errors
- failsafe prompts
- OpenWrt loader messages
- boot arguments
- recovery menu direction

This is why serial access is one of the most valuable router recovery tools.

It gives information even when Ethernet, web UI, or SSH are unavailable.

## OpenWrt Loader / Failsafe Direction

At one stage, the console showed an OpenWrt kernel loader/failsafe-style context.

The kind of message was:

```txt
OpenWrt kernel loader for MIPS based SoC...
Press the [f] key...
```

That indicates the router was still reaching a low-level boot path.

This is useful because it means:

```txt
bootloader/early boot was still alive
serial console was useful
firmware recovery was still possible
```

At that stage, recovery should focus on careful bootloader/failsafe handling rather than random firmware writes.

## NAND / MTD Bad Blocks

The serial console later showed NAND/MTD layout information and bad block messages.

Observed bad block direction included offsets like:

```txt
0x1ef80
0x1f380
```

Bad blocks in NAND are not automatically fatal because NAND systems can tolerate some bad blocks.

But in a router with persistent config failures, NAND/MTD messages become important evidence.

They can help explain:

- config partition instability
- firmware write failures
- boot failure
- inconsistent recovery behavior
- corruption after flashing attempts

The wording should be careful:

```txt
firmware/NAND contents corruption
```

is safer than claiming:

```txt
physically dead NAND chip
```

unless the chip itself was confirmed faulty.

## Correct Wording

A bad wording would be:

```txt
I flashed the NAND chip using USB-TTL.
```

That is usually not accurate.

USB-TTL provides serial console access. It does not directly program the NAND chip like a flash programmer.

Better wording:

```txt
I used a USB-TTL adapter to access the router's serial console and perform lower-level firmware recovery through the bootloader/recovery environment.
```

or:

```txt
The router showed firmware/NAND contents corruption, and recovery required serial-assisted bootloader access before the failure became hard-bricked.
```

If external programming is later used, that is a separate step:

```txt
external flash programmer / SPI or NAND recovery
```

## TFTP Recovery Direction

Bootloader-level recovery often uses TFTP.

A typical conceptual flow:

```txt
set router recovery IP
set TFTP server IP
load firmware image over TFTP
boot or flash the image
verify result
```

Example bootloader environment direction:

```txt
setenv ipaddr 192.168.1.1
setenv serverip 192.168.1.100
saveenv
tftpboot 0x81000000 <firmware-or-recovery-image>
```

The exact commands depend on the device, bootloader, image type, and recovery method.

The important rule:

```txt
do not flash random images to bootloader or firmware partitions without verifying what partition they belong to
```

## Flashing Risk

Flashing the wrong file can make the problem much worse.

This happened in the recovery path: after a wrong file was flashed, the router reached a harder-bricked state.

Symptoms later included:

```txt
no useful console output
no reset reaction
only power LED visible
other LEDs not flashing normally
USB-TTL showing no output
```

That is a different failure class.

Before that, the router was at least producing serial output and recovery information.

After that, the boot chain may not have been starting properly.

## Soft Brick vs Hard Brick

A useful distinction:

### Soft Brick

The router does not boot normally, but some recovery path still works.

Examples:

```txt
serial console output exists
bootloader prompt reachable
failsafe mode reachable
TFTP recovery reachable
LEDs show boot activity
```

### Hard Brick

The router appears dead at a lower level.

Examples:

```txt
no serial output
no bootloader prompt
no useful LED sequence
reset does nothing
Ethernet recovery unavailable
```

A soft brick can often be recovered through serial/TFTP.

A hard brick may require external flashing or hardware-level recovery.

## When Serial Output Disappears

If USB-TTL previously showed output but later shows nothing, check simple issues first:

- correct COM port
- correct baud rate
- TX/RX swapped correctly
- GND connected
- adapter is 3.3V TTL
- router powered separately
- header pins making contact
- PuTTY serial settings correct
- adapter detected by OS

If all of that is correct and there is still no output, the bootloader may not be running.

That is when the recovery direction moves toward:

```txt
external flash programmer
JTAG if available
replacing/reprogramming bootloader/flash contents
```

## External Flash Recovery Direction

When the bootloader is damaged or the router produces no serial output, USB-TTL alone may not be enough.

External recovery may require:

- identifying flash chip or storage layout
- using an external programmer
- reading the chip before writing
- saving multiple backups
- comparing dumps
- obtaining a known-good bootloader/firmware image
- writing carefully
- verifying the write
- reassembling and testing serial output again

This is more invasive and riskier than bootloader TFTP recovery.

It should be treated as last-resort recovery.

## SPI vs NAND Clarification

Routers can use different storage technologies.

Some recovery guides involve SPI NOR flash. Others involve NAND/MTD layouts.

The EdgeRouter X recovery discussion involved NAND/MTD-style messages and storage corruption symptoms.

The note title includes “flash access” broadly because the recovery concept is about low-level firmware storage.

A correct technical note should avoid pretending every router has the same flash layout.

The process should start by identifying:

```txt
device model
SoC
bootloader
flash type
partition layout
firmware image format
recovery method
```

## Diagnostic Checklist

Before flashing anything destructive:

### Confirm the Failure

- does the router boot?
- does SSH work?
- does web UI work?
- does config persist?
- does serial console output appear?
- do LEDs show boot activity?
- does reset/failsafe work?

### Check Storage Symptoms

- does `/config/config.boot` reset?
- is config mounted read-only?
- do firmware changes persist?
- do logs show NAND/MTD errors?
- are bad blocks reported?
- is the router running from recovery/RAM image?

### Check Serial Access

- correct USB-TTL adapter
- 3.3V TTL
- TX/RX crossed
- GND connected
- no VCC connected
- 115200 8N1
- correct COM port
- boot messages captured

### Check Recovery Path

- correct firmware image
- correct recovery image type
- correct TFTP server IP
- correct router IP
- correct bootloader commands
- backup before write where possible

## Recovery Evidence Worth Saving

During router recovery, useful evidence includes:

- boot log from serial console
- NAND/MTD layout messages
- bad block messages
- exact firmware image name
- commands typed in bootloader
- TFTP transfer output
- mount output
- config persistence test
- LED behavior
- screenshots/photos of wiring
- before/after boot behavior
- final recovery result

This matters because once the device is flashed, the previous state may be lost.

## Practical Recovery Flow

A safer flow:

```txt
1. Document symptoms.
2. Try normal config save/reboot test.
3. Check if firmware actually persists.
4. Access serial console through USB-TTL.
5. Capture full boot log.
6. Identify bootloader, partitions, and storage errors.
7. Try non-destructive boot/recovery first.
8. Use TFTP recovery only with correct image.
9. Avoid flashing bootloader partitions unless necessary.
10. If serial disappears, move to external flash recovery direction.
```

The most important rule is:

```txt
do not rush destructive writes
```

## EdgeRouter X Recovery Story

The EdgeRouter X case can be summarized like this:

```txt
The router first showed persistence problems: configuration changes and firmware state did not survive reboot reliably. Normal firmware recovery did not solve the issue. Serial console access through USB-TTL exposed lower-level boot behavior and NAND/MTD information, including bad block messages. This suggested the issue was below normal configuration management and likely involved firmware/storage corruption. After an incorrect flashing attempt, the device became hard-bricked: normal console output disappeared and only the power LED remained active. At that point, recovery moved beyond USB-TTL serial access toward external flash/JTAG-style recovery direction.
```

This is worth including because it shows layered troubleshooting and the difference between recoverable firmware corruption and a deeper brick.

## Common Mistakes

### Saying USB-TTL Flashes NAND Directly

USB-TTL gives serial console access.

It does not directly program the flash chip.

### Flashing The Wrong Image

Firmware images, recovery images, bootloader files, and partition images are not interchangeable.

### Ignoring Bad Block Messages

Some NAND bad blocks can be normal, but in context they matter.

### Assuming Reset Button Fixes Everything

If the bootloader or firmware storage is damaged, reset may do nothing useful.

### Not Saving Boot Logs

Boot logs are diagnostic evidence. Capture them before changing things.

### Connecting VCC On Serial Header

On many router serial headers, connect TX/RX/GND only. Do not power the board from the USB-TTL adapter unless the device documentation explicitly requires it.

## Practical Decisions

### Use precise wording

Say “firmware/NAND contents corruption” unless physical chip failure is confirmed.

### Keep USB-TTL and external flashing separate

Serial console recovery and chip programming are different recovery levels.

### Capture boot logs before flashing

Logs can explain the failure and guide the next step.

### Treat bootloader writes as dangerous

A bad firmware flash may be recoverable. A bad bootloader flash can remove serial/TFTP recovery.

### Preserve backups

If external flash access is used, read and save the current chip contents before writing anything.

### Document device-specific paths

Router recovery is model-specific. Do not assume commands from one device apply to another.

## What A Finished Recovery Note Should Show

A strong finished note should show:

- device model
- symptoms before brick
- normal recovery attempts
- serial wiring direction
- serial settings
- boot log evidence
- NAND/MTD bad block evidence
- recovery commands or direction
- flashing risk
- hard-brick symptoms
- when external flash recovery becomes necessary
- final lessons and wording corrections

## Evidence Worth Capturing

Useful evidence for this note would include:

- photo of EdgeRouter X serial header wiring
- USB-TTL adapter photo
- PuTTY serial settings
- bootloader output
- NAND/MTD bad block lines
- `/config/config.boot` persistence test
- mount output showing read-only config direction
- TFTP recovery screen/output
- LED behavior after failed flash
- external flash recovery setup if attempted
- final recovery state

## Technical Assumptions

This note assumes the router is owned by the operator and recovery is authorized.

It assumes the operator is working on local hardware, not bypassing access controls on someone else’s device.

It also assumes that firmware recovery commands are device-specific and should be verified against the exact model and image type before writing.

## Key Risks

- wrong voltage serial adapter
- connecting VCC incorrectly
- TX/RX wiring mistakes
- flashing the wrong image
- overwriting bootloader
- assuming NAND bad blocks always mean physical chip failure
- no backup before external write
- using commands from another router model
- treating OpenWrt, EdgeOS, recovery images, and bootloader images as interchangeable
- losing diagnostic logs before destructive recovery

## Current State

This note represents the router firmware recovery experience around the EdgeRouter X and broader serial/flash recovery workflow.

It turns the original “router brick” problem into a strong hardware-recovery story:

```txt
normal software troubleshooting
persistent config failure
serial console diagnostics
NAND/MTD evidence
bootloader recovery direction
hard-brick boundary
external flash recovery direction
```

That makes the note stronger than a generic firmware flashing post.

## What This Note Does Not Claim

This note does not claim the physical NAND chip was definitely dead.

It does not claim USB-TTL directly flashes NAND.

It does not provide a universal recovery method for every router.

It documents a practical recovery path and the reasoning used when a router moves from configuration failure to firmware/storage corruption and then to hard-brick territory.

## Practical Takeaway

The useful lesson is:

> A bricked router is not one failure state.

It can be:

```txt
bad config
broken firmware
read-only config storage
corrupted NAND/MTD contents
wrong recovery image
damaged bootloader
hard brick requiring external flash access
```

The recovery method depends on which layer still works.

If serial console works, use it carefully and capture evidence.

If serial console stops working after a bad flash, the recovery path moves beyond USB-TTL into external flash or board-level repair.

## Final Hardware Status

The current working conclusion is that the NOR flash chip is faulty and will likely need replacement.

At this stage, the router should be treated as a board-level repair case rather than a normal firmware recovery case. USB-TTL serial access and bootloader recovery are no longer enough if the flash chip itself cannot reliably store or provide the boot contents.

The next practical task, if this router is revisited later, is:

```txt
replace the faulty NOR flash chip
flash known-good boot/firmware contents
verify serial output returns
confirm the router boots consistently
test whether configuration persistence is restored
```

Until then, the recovery is considered paused at the hardware-replacement stage.
