---
resume: false
title: "Implementing Formatted Output in C"
slug: "implementing-formatted-output-in-c"
summary: "Field notes from rebuilding a minimal printf-style function in C to understand variadic arguments, format parsing, character output, conversion handling, and low-level edge cases."
resumeSummary: >-
  Implemented a minimal printf-style formatter in C to understand how formatted output is assembled at a low level. The project covers variadic argument handling, format-string scanning, conversion dispatch, character and string output, integer formatting, return-value accounting, and malformed or unsupported input. It focuses on building the parser and output primitives in small testable pieces, exposing the interaction between C types, memory-safe iteration through arguments, and the edge cases hidden behind a familiar standard-library call.
category: "Systems Programming"
tags:
  - c
  - printf
  - variadic-functions
  - stdarg
  - formatting
  - parsing
  - memory-management
  - linux
  - systems-programming
  - low-level-programming
date: "2024-01-01"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Implémentation de sortie formatée en C"
    category: "Programmation système"
    summary: "Notes sur la reconstruction d’une fonction minimale de type printf en C : arguments variadiques, analyse de format, conversions, sortie, valeurs de retour et cas limites."
    resumeSummary: >-
      Implémenté un minimum de forme printf en C pour comprendre comment la sortie formatée est assemblée à un
      niveau bas. Le projet couvre la manipulation des arguments variadic, la numérisation format-string,
      l'expédition de conversion, la sortie de caractères et de chaînes, le formatage entier, la
      comptabilisation de la valeur de retour et les entrées mal formées ou non supportées. Il se concentre
      sur la construction de l'analyseur et la sortie primitives en petits morceaux testables, exposant
      l'interaction entre les types C, l'itération mémoire-sûre par des arguments, et les cas de bord cachés
      derrière un appel standard-bibliothèque familier.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente le processus de mise en œuvre d'une fonction de style `printf` minimale en C.

      La valeur de ce projet n'est pas de copier la bibliothèque standard. La partie utile est de comprendre ce que la sortie formatée fait réellement derrière un simple appel comme:

      ```c
      printf("Hello %s, you have %d messages
      ", name, count);
      ```

      Un utilisateur normal voit du texte.

      Une implémentation `printf` doit :

      ```txt
      read the format string
      detect conversion markers
      pull the correct argument type
      convert values into printable characters
      write the result to output
      track the number of printed characters
      handle errors and edge cases
      ```

      Cela en fait un projet utile de bas niveau C et d'analyse.

      ## Contexte du projet

      Le projet a été construit en C comme un projet fondamental axé sur le formatage des sorties et les fonctions variades.

      Il fait partie du portefeuille en tant que note de programmation de systèmes, et non en tant qu'affectation de formation générique.

      La valeur est de montrer la compréhension de:

      - Interfaces de fonctions C
      - arguments variades
      - analyse du format
      - envoi de conversion
      - conversion numérique
      - sortie de caractères
      - Valeurs de retour
      - comportement en cas de bord
      - conception de petites bibliothèques

      Il complète la note shell minimale Unix parce que les deux projets traitent de C, le comportement Linux, et la manipulation soigneuse des détails de bas niveau.

      ## Ce que ce projet veut prouver

      - les fonctions simples de bibliothèque masquent la logique d'analyse réelle
      - Les fonctions variades exigent une discipline de type stricte
      - les chaînes de format sont de petites langues
      - chaque spéculateur de conversion a besoin d'un comportement clair
      - la sortie entière est un problème de conversion, pas seulement l'impression de chiffres
      - Valeur de retour
      - les cas bord définissent si la mise en œuvre est fiable
      - Les projets C doivent être soigneusement séparés entre l'analyse, la conversion et la production

      ## Pioche et outils utilisés

      ### Langue et temps d'exécution

      - C
      - GCC
      - Direction standard de la bibliothèque C
      - Direction de sortie de type POSIX
      - Sortie du terminal Linux

      ### C Concepts

      - `stdarg.h`
      - `va_list`
      - `va_start`
      - `va_arg`
      - `va_end`
      - pointeurs
      - ficelles
      - conversion entière
      - sortie numérique itérative ou récursion
      - pointeurs de fonction ou direction des tables d'expédition
      - Gestion des erreurs

      ### Concepts de présentation

      - spécifiants de conversion
      - caractères littéraux
      - Pourcentage d'évasion
      - Nombre de retours
      - entiers signés
      - entiers non signés
      - caractères
      - ficelles
      - hexadécimal en cas de mise en œuvre
      - drapeaux/largeur/direction de la précision si elle est prolongée

      ## Construction prévue

      La construction prévue est une fonction de style `printf` minimale qui peut imprimer des valeurs formatées communes.

      Une première version forte devrait soutenir:

      ```txt
      %c  character
      %s  string
      %d  signed decimal integer
      %i  signed decimal integer
      %u  unsigned decimal integer
      %%  literal percent sign
      ```

      Conversions prolongées possibles :

      ```txt
      %x  lowercase hexadecimal
      %X  uppercase hexadecimal
      %o  octal
      %p  pointer address
      ```

      Une version plus avancée peut prendre en charge:

      ```txt
      field width
      precision
      left alignment
      zero padding
      plus sign
      space flag
      hash flag
      length modifiers
      ```

      La première version devrait prioriser l'exactitude sur trop de fonctionnalités.

      ## Modèle mental de base

      Une fonction de style `printf` est principalement une boucle sur la chaîne de format.

      Débit simplifié:

      ```txt
      for each character in format string:
          if normal character:
              print it
              increment count

          if '%' is found:
              read next format specifier
              fetch matching argument
              convert argument to output
              increment count
      ```

      La partie dure rend cette fiabilité lorsque l'entrée est incomplète, invalide ou utilise différents types d'arguments.

      ## Arguments variades

      `printf` accepte un nombre variable d'arguments.

      Cela signifie que la fonction ne peut pas connaître les types d'arguments de la seule signature de la fonction.

      Une implémentation personnalisée utilise `stdarg.h`.

      Débit théorique:

      ```c
      va_list args;

      va_start(args, format);
      value = va_arg(args, expected_type);
      va_end(args);
      ```

      La chaîne de format indique à la fonction quel type tirer ensuite.

      Cela crée une règle importante:

      ```txt
      The parser and argument extraction must agree.
      ```

      Si le format indique `%d`, l'implémentation devrait tirer un `int`.

      Si le format dit `%s`, il devrait tirer un `char *`.

      Tirer sur le mauvais type provoque un comportement non défini.

      ## Parsing de chaîne de format

      La chaîne de format est le jeu d'instructions.

      Exemple :

      ```c
      "Name: %s | Score: %d%%"
      ```

      L'analyseur voit :

      ```txt
      literal text: "Name: "
      specifier: %s
      literal text: " | Score: "
      specifier: %d
      specifier: %%
      ```

      L'analyseur doit distinguer:

      - caractères normaux
      - spécifiants de conversion valides
      - Pourcentage littéral de signes
      - non valides ou incomplets
      - drapeaux/largeur/précision facultatifs si mis en œuvre

      Même un petit analyseur a besoin d'un comportement prévisible.

      ## Conversion Expédition

      Une implémentation propre devrait éviter de mettre chaque conversion en une seule fonction massive.

      Une meilleure structure:

      ```txt
      format parser
        ↓
      specifier dispatcher
        ↓
      conversion handler
        ↓
      output function
      ```

      Exemple de gestionnaire :

      ```txt
      print_char
      print_string
      print_signed_int
      print_unsigned_int
      print_hex
      print_pointer
      ```

      Cela facilite l'extension et le débogage du code.

      ## Sortie de caractères

      Au niveau le plus bas, la sortie formatée devient la sortie de caractères.

      Une implémentation minimale peut écrire en utilisant:

      ```c
      write(1, &c, 1);
      ```

      ou un autre assistant de sortie.

      Une fonction d'aide peut suivre le nombre imprimé :

      ```txt
      print one character
      if success:
          count += 1
      else:
          mark error
      ```

      Ceci est utile car `printf` retourne le nombre de caractères imprimés.

      ## Valeur de retour

      La valeur de retour est importante.

      Standard `printf` retourne le nombre de caractères imprimés, ou une valeur négative en cas d'erreur.

      Une implémentation personnalisée devrait suivre attentivement les caractères imprimés.

      Exemple :

      ```c
      len = _printf("Hi %s", "Ochy");
      ```

      Nombre prévu:

      ```txt
      length of "Hi Ochy"
      ```

      Le dénombrement devrait comprendre :

      - caractères littéraux
      - caractères convertis
      - Pourcentage de panneaux imprimés par `%%`
      - nouvelles lignes
      - espaces

      Il ne devrait pas compter les caractères qui n'ont pas été écrits avec succès.

      ## Conversion des chaînes

      La conversion `%s` imprime une chaîne.

      Cas importants:

      - Chaîne normale
      - chaîne vide
      - Direction du pointeur `NULL`
      - longue corde
      - précision si mise en œuvre

      Un comportement sécuritaire commun est d'imprimer quelque chose comme:

      ```txt
      (null)
      ```

      lorsque le pointeur de chaîne est `NULL`, selon les exigences choisies.

      La clé est de définir clairement le comportement et de le tester.

      ## Conversion des caractères

      La conversion `%c` imprime un seul caractère.

      Même s'il imprime un `char`, la promotion de l'argument variadic signifie qu'il est généralement récupéré sous la forme d'un `int`.

      Détails importants:

      ```txt
      char arguments are promoted to int in variadic functions
      ```

      Ainsi, la mise en œuvre devrait utiliser:

      ```c
      va_arg(args, int)
      ```

      puis lancer ou sortir en tant que personnage.

      ## Conversion entière signée

      Les conversions `%d` et `%i` impriment des entiers signés.

      Cas importants:

      - zéro
      - nombres positifs
      - nombres négatifs
      - Valeur entière minimale
      - grand nombre
      - Nombre de retours

      Le cas le plus difficile est souvent :

      ```txt
      INT_MIN
      ```

      parce que sa valeur absolue peut ne pas correspondre à un `int` signé.

      Une implémentation sûre doit gérer cela sans débordement.

      ## Conversion entière non signée

      La conversion `%u` imprime des entiers décimals non signés.

      Cela évite les signes négatifs, mais nécessite toujours l'extraction des chiffres.

      Débit théorique:

      ```txt
      if value is 0:
          print '0'

      else:
          repeatedly divide by 10
          collect digits
          print digits in correct order
      ```

      L'implémentation peut utiliser une récursion, un tampon temporaire ou un stockage à chiffres inversés.

      ## Conversion hexadécimal

      Si `%x` et `%X` sont implémentés, la fonction convertit les numéros en base 16.

      Chiffres :

      ```txt
      0123456789abcdef
      0123456789ABCDEF
      ```

      Ceci enseigne un concept général:

      ```txt
      number conversion = repeated division by base
      ```

      Décimal, octal et hexadécimal sont toutes des variations de la même logique.

      ## Conversion des pointeurs

      Si `%p` est implémenté, la fonction imprime une valeur de type adresse.

      Habituellement, la direction de sortie est :

      ```txt
      0x...
      ```

      Cela nécessite:

      - récupérer un pointeur
      - coulée vers un type entier adapté aux adresses
      - conversion en hexadécimal
      - maniement direction pointeur nul

      Le formatage Pointer est une bonne extension mais pas nécessaire pour la première version.

      ## Pourcentage d'évasion

      La séquence `%%` imprime un signe de pourcentage littéral.

      Exemple :

      ```c
      _printf("Progress: 100%%
      ");
      ```

      Produit :

      ```txt
      Progress: 100%
      ```

      Cela est important car `%` est normalement le début d'un spéculateur de conversion.

      L'analyseur doit reconnaître l'évasion spéciale.

      ## Specifiants non valides

      Une chaîne de format peut contenir des conversions non prises en charge.

      Exemple :

      ```c
      _printf("Value: %q
      ", value);
      ```

      Une implémentation minimale nécessite un comportement défini.

      Choix possibles:

      ```txt
      print '%' and the unknown specifier
      ignore it
      return an error
      ```

      L'important, c'est la cohérence.

      Un comportement indéfini ou aléatoire rend le débogage plus difficile.

      ## Pourcentage incomplet à la fin

      Un boîtier de bord commun:

      ```c
      _printf("hello %");
      ```

      La chaîne de format se termine après `%`.

      La mise en œuvre doit décider de ce qui se passe.

      Comportement possible:

      - Erreur de retour
      - imprimer `%`
      - ignorer les spécifications incomplètes

      Pour une mise en œuvre personnalisée, cela devrait être documenté et testé.

      ## Drapeaux, largeur et direction de précision

      Une implémentation de base peut sauter le formatage avancé.

      Une version étendue plus forte peut supporter:

      ```txt
      -   left align
      +   force sign
      0   zero padding
      #   alternate form
      space sign
      width
      precision
      ```

      Exemple :

      ```c
      printf("%08d", 42);
      ```

      Direction des produits:

      ```txt
      00000042
      ```

      Ces caractéristiques transforment l'analyseur d'un simple détecteur de spécifications en un moteur de formatage plus sérieux.

      Pour une première version, il est préférable de mettre en œuvre moins de fonctionnalités correctement.

      ## Buffer vs Direct Write

      Il existe deux stratégies communes de production.

      ### Écrire directement

      Imprimez chaque personnage dès qu'il est prêt.

      Avantages:

      - plus simple
      - moins de gestion de la mémoire
      - facile à comprendre

      Inconvénients

      - beaucoup d'appels d'écriture
      - plus difficile de revenir sur l'erreur

      ### Buffer en premier

      Construire la sortie en mémoire, puis écrire.

      Avantages:

      - moins écrit
      - plus facile à gérer la sortie finale
      - plus près de la direction de performance

      Inconvénients

      - plus de gestion de mémoire
      - redimensionnement du tampon
      - complexité du traitement des erreurs

      Une version minimale peut utiliser des écritures directes.

      ## Gestion de la mémoire

      Un `printf` minimum peut ne pas avoir besoin d'allocation dynamique lourde si elle imprime directement.

      Mais la mémoire peut apparaître dans:

      - tampons à chiffres temporaires
      - données de format copiées
      - tampons d'aide à la conversion
      - manipulation dynamique de la chaîne
      - largeur avancée/formatage de précision

      En C, chaque allocation doit être nettoyée.

      Pour une petite implémentation, évitez l'allocation inutile lorsque de simples tampons de pile ou une sortie récursive suffisent.

      ## Liste de vérification

      ### Produit de base

      - ficelle simple
      - chaîne vide
      - nouvelle ligne
      - espaces
      - plusieurs caractères littéraux

      ### Caractère

      - `%c`
      - direction de caractère nul si testé
      - caractères multiples

      ### Chaîne

      - `%s`
      - chaîne vide
      - Chaîne `NULL` si le comportement est défini
      - longue corde

      ### Nombre entier

      - `%d`
      - `%i`
      - zéro
      - nombre positif
      - nombre négatif
      - `INT_MAX`
      - `INT_MIN`

      ### Non signé

      - `%u`
      - zéro
      - grande valeur non signée

      ### Pourcentage

      - `%%`
      - pourcentage à côté du texte
      - signes multiples pour cent

      ### Format mixte

      - `%s %d %c`
      - texte avant et après les conversions
      - conversions répétées

      ### Affaires invalides

      - spécifiant non pris en charge
      - Suivi `%`
      - direction des arguments manquants
      - chaîne de format est `NULL` si le comportement est défini

      ## Comparaison avec l'impression standardf

      Une stratégie de test utile consiste à comparer les valeurs de sortie et de retour avec la norme `printf` pour les conversions supportées.

      Exemple de direction d'essai:

      ```txt
      custom output == printf output
      custom return == printf return
      ```

      Comparer uniquement les caractéristiques que la mise en œuvre personnalisée prétend soutenir.

      Si les drapeaux ou la précision ne sont pas implémentés, ils ne devraient pas être testés comme comportement supporté.

      ## Bogues courantes

      ### Mauvais type `va_arg`

      Cause:

      ```txt
      format parser expects one type but va_arg retrieves another
      ```

      Résultat :

      ```txt
      undefined behavior
      ```

      Correction :

      ```txt
      match each specifier to the correct promoted type
      ```

      ### Hypothèse de terminateur NULL manquante

      Cause:

      ```txt
      string handler assumes every pointer is valid
      ```

      Résultat :

      ```txt
      segmentation fault
      ```

      Correction :

      ```txt
      define and handle NULL string behavior
      ```

      ### Nombre de retours incorrect

      Cause:

      ```txt
      converted characters are printed but not counted correctly
      ```

      Correction :

      ```txt
      centralize output/count logic
      ```

      ### INT_MIN Dépassement

      Cause:

      ```txt
      trying to convert INT_MIN with normal negative-to-positive logic
      ```

      Correction :

      ```txt
      handle minimum value safely using wider type or unsigned logic
      ```

      ### Pourcentage de manipulation brisée

      Cause:

      ```txt
      parser treats %% like invalid format
      ```

      Correction :

      ```txt
      special-case %% as literal percent
      ```

      ### Fonction massive

      Cause:

      ```txt
      all parsing and conversion lives in one function
      ```

      Correction :

      ```txt
      split parser, dispatcher, and handlers
      ```

      ## Décisions pratiques

      ### Mettre en place moins de spécifications d'abord

      Une `%c` correcte, `%s`, `%d`, `%i`, `%u` et `%%` est meilleure que de nombreuses conversions interrompues.

      ### Nombre de pistes en un seul endroit

      Les bogues de comptage de caractères sont plus faciles à éviter lorsque toutes les sorties passent par un helper.

      ### Gardez l'analyseur prévisible

      Les spéculateurs non soutenus doivent se comporter de façon cohérente.

      ### Regarder les promotions variades

      `char` et `short` sont promus à `int` dans les appels variades.

      ### Entier des bords d'essai

      `0`, valeurs négatives, `INT_MAX` et `INT_MIN` révèlent de nombreux bogues.

      ### Éviter toute affectation inutile

      Une sortie directe simple permet de garder la première version plus sûre.

      ## Ce qu'une version terminée devrait montrer

      Une version terminée forte devrait montrer:

      - fonction `_printf` personnalisée
      - analyseur de chaîne de format
      - Gestion des arguments variadiques
      - expéditeur de conversion
      - aide à la sortie de caractères
      - nombre de caractères imprimés
      - `%c`
      - `%s`
      - `%d`
      - `%i`
      - `%u`
      - `%%`
      - option `%x`, `%X`, `%o`, `%p`
      - comportement d'erreur constant
      - essais avec `printf` standard
      - README avec des spécifications prises en charge
      - aucune fuite de mémoire pour les chemins supportés

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - arbre source
      - Interface de fonction `_printf`
      - parser/dispatcher code extrait
      - entier aide à la conversion
      - sortie d'essai par rapport à `printf`
      - Essais sur cas bord
      - Essais de valeur de retour
      - Sortie Valgrind si disponible
      - Tableau de spécifications supporté par README
      - exemples de comportement non soutenu

      ## Hypothèses techniques

      Cette note suppose que la mise en œuvre est écrite en C.

      Il suppose que l'objectif est de construire une fonction de type `printf` minimale pour l'apprentissage et la programmation de systèmes fondamentaux.

      Il suppose également que l'implémentation prend en charge un sous-ensemble documenté de `printf` standard, pas le comportement complet de la bibliothèque standard.

      ## Principaux risques

      - Tirer de mauvais types de `va_arg`
      - retour du mauvais nombre de caractères
      - s'écraser sur les chaînes `NULL`
      - Mauvais traitement `INT_MIN`
      - Pourcentage d'évasion
      - comportement de format non pris en charge non documenté
      - trop de fonctionnalités ajoutées avant que le noyau fonctionne
      - fuites de mémoire des tampons temporaires
      - aide à la sortie incohérente
      - comparant avec la norme `printf` pour les fonctionnalités non implémentées

      ## État actuel

      Cette note représente un projet de faible niveau C axé sur la production formatée.

      Il est plus ancien/fondamental par rapport à l'infrastructure et les notes du système d'affaires, mais il ajoute encore de la valeur parce qu'il montre:

      ```txt
      parsing
      type handling
      conversion logic
      output control
      edge-case discipline
      ```

      Cela en fait une bonne note de programmation de systèmes.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas remplacer la bibliothèque C standard.

      Il ne prétend pas implémenter complètement chaque drapeau `printf`, largeur, précision, modificateur de longueur, comportement local ou détail spécifique à la plateforme.

      Il documente une implémentation personnalisée minimale utilisée pour comprendre comment la sortie formatée fonctionne en interne.

      ## À emporter pratique

      La leçon utile est:

      > `printf` semble simple car le travail difficile d'analyse et de conversion est caché.

      Pour reconstruire même une petite version, vous devez comprendre :

      - arguments variades
      - au format des chaînes
      - Extraction spécifique au type
      - conversion nombre-texte
      - Nombre de sorties
      - Gestion des erreurs
      - cas bord
      - discipline de la mémoire

      C'est ainsi que le projet devient une note de programmation de systèmes C au lieu d'un exercice de formation de base.
seoTitle: "Implementing Formatted Output in C"
seoDescription: "A practical note about implementing a minimal printf-style function in C, covering variadic arguments, format parsing, conversions, output handling, return values, and edge cases."
---

## Why This Note Exists

This note documents the process of implementing a minimal `printf`-style function in C.

The value of this project is not copying the standard library. The useful part is understanding what formatted output actually does behind a simple call like:

```c
printf("Hello %s, you have %d messages\n", name, count);
```

A normal user sees text.

A `printf` implementation needs to:

```txt
read the format string
detect conversion markers
pull the correct argument type
convert values into printable characters
write the result to output
track the number of printed characters
handle errors and edge cases
```

That makes it a useful low-level C and parsing project.

## Project Context

The project was built in C as a fundamentals project focused on output formatting and variadic functions.

It belongs in the portfolio as a systems-programming note, not as a generic training assignment.

The value is in showing understanding of:

- C function interfaces
- variadic arguments
- format parsing
- conversion dispatching
- numeric conversion
- character output
- return values
- edge-case behavior
- small-library design

It complements the minimal Unix shell note because both projects deal with C, Linux behavior, and careful handling of low-level details.

## What This Project Is Meant To Prove

- simple library functions hide real parsing logic
- variadic functions require strict type discipline
- format strings are small languages
- every conversion specifier needs clear behavior
- integer output is a conversion problem, not only printing digits
- return values matter
- edge cases define whether the implementation is reliable
- C projects need careful separation between parsing, conversion, and output

## Stack and Tools Used

### Language and Runtime

- C
- GCC
- standard C library direction
- POSIX-style output direction
- Linux terminal output

### C Concepts

- `stdarg.h`
- `va_list`
- `va_start`
- `va_arg`
- `va_end`
- pointers
- strings
- integer conversion
- recursion or iterative digit output
- function pointers or dispatch tables direction
- error handling

### Formatting Concepts

- conversion specifiers
- literal characters
- percent escaping
- return count
- signed integers
- unsigned integers
- characters
- strings
- hexadecimal direction if implemented
- flags/width/precision direction if extended

## Intended Build

The intended build is a minimal `printf`-style function that can print common formatted values.

A first strong version should support:

```txt
%c  character
%s  string
%d  signed decimal integer
%i  signed decimal integer
%u  unsigned decimal integer
%%  literal percent sign
```

Possible extended conversions:

```txt
%x  lowercase hexadecimal
%X  uppercase hexadecimal
%o  octal
%p  pointer address
```

A more advanced version can support:

```txt
field width
precision
left alignment
zero padding
plus sign
space flag
hash flag
length modifiers
```

The first version should prioritize correctness over too many features.

## Basic Mental Model

A `printf`-style function is mostly a loop over the format string.

Simplified flow:

```txt
for each character in format string:
    if normal character:
        print it
        increment count

    if '%' is found:
        read next format specifier
        fetch matching argument
        convert argument to output
        increment count
```

The hard part is making this reliable when input is incomplete, invalid, or uses different argument types.

## Variadic Arguments

`printf` accepts a variable number of arguments.

That means the function cannot know argument types from the function signature alone.

A custom implementation uses `stdarg.h`.

Conceptual flow:

```c
va_list args;

va_start(args, format);
value = va_arg(args, expected_type);
va_end(args);
```

The format string tells the function which type to pull next.

This creates an important rule:

```txt
The parser and argument extraction must agree.
```

If the format says `%d`, the implementation should pull an `int`.

If the format says `%s`, it should pull a `char *`.

Pulling the wrong type causes undefined behavior.

## Format String Parsing

The format string is the instruction set.

Example:

```c
"Name: %s | Score: %d%%"
```

The parser sees:

```txt
literal text: "Name: "
specifier: %s
literal text: " | Score: "
specifier: %d
specifier: %%
```

The parser should distinguish:

- normal characters
- valid conversion specifiers
- literal percent signs
- invalid or incomplete specifiers
- optional flags/width/precision if implemented

Even a small parser needs predictable behavior.

## Conversion Dispatch

A clean implementation should avoid putting every conversion into one massive function.

A better structure:

```txt
format parser
  ↓
specifier dispatcher
  ↓
conversion handler
  ↓
output function
```

Example handlers:

```txt
print_char
print_string
print_signed_int
print_unsigned_int
print_hex
print_pointer
```

This makes the code easier to extend and debug.

## Character Output

At the lowest level, formatted output becomes character output.

A minimal implementation might write using:

```c
write(1, &c, 1);
```

or another output helper.

A helper function can track the printed count:

```txt
print one character
if success:
    count += 1
else:
    mark error
```

This is useful because `printf` returns the number of characters printed.

## Return Value

The return value matters.

Standard `printf` returns the number of characters printed, or a negative value on error.

A custom implementation should track printed characters carefully.

Example:

```c
len = _printf("Hi %s", "Ochy");
```

Expected count:

```txt
length of "Hi Ochy"
```

The count should include:

- literal characters
- converted characters
- percent signs printed by `%%`
- newlines
- spaces

It should not count characters that were not successfully written.

## String Conversion

The `%s` conversion prints a string.

Important cases:

- normal string
- empty string
- `NULL` pointer direction
- long string
- precision if implemented

A common safe behavior is to print something like:

```txt
(null)
```

when the string pointer is `NULL`, depending on the chosen requirements.

The key is to define the behavior clearly and test it.

## Character Conversion

The `%c` conversion prints a single character.

Even though it prints a `char`, variadic argument promotion means it is usually retrieved as an `int`.

Important detail:

```txt
char arguments are promoted to int in variadic functions
```

So the implementation should use:

```c
va_arg(args, int)
```

then cast or output as a character.

## Signed Integer Conversion

The `%d` and `%i` conversions print signed integers.

Important cases:

- zero
- positive numbers
- negative numbers
- minimum integer value
- large numbers
- return count

The hardest edge case is often:

```txt
INT_MIN
```

because its absolute value may not fit in a signed `int`.

A safe implementation needs to handle that without overflow.

## Unsigned Integer Conversion

The `%u` conversion prints unsigned decimal integers.

This avoids negative signs, but still needs digit extraction.

Conceptual flow:

```txt
if value is 0:
    print '0'

else:
    repeatedly divide by 10
    collect digits
    print digits in correct order
```

The implementation can use recursion, a temporary buffer, or reverse digit storage.

## Hexadecimal Conversion

If `%x` and `%X` are implemented, the function converts numbers to base 16.

Digits:

```txt
0123456789abcdef
0123456789ABCDEF
```

This teaches a general concept:

```txt
number conversion = repeated division by base
```

Decimal, octal, and hexadecimal are all variations of the same logic.

## Pointer Conversion

If `%p` is implemented, the function prints an address-like value.

Usually the output direction is:

```txt
0x...
```

This requires:

- retrieving a pointer
- casting to an integer type suitable for addresses
- converting to hexadecimal
- handling null pointer direction

Pointer formatting is a good extension but not necessary for the first version.

## Percent Escaping

The `%%` sequence prints a literal percent sign.

Example:

```c
_printf("Progress: 100%%\n");
```

Output:

```txt
Progress: 100%
```

This matters because `%` is normally the beginning of a conversion specifier.

The parser needs to recognize the special escape.

## Invalid Specifiers

A format string may contain unsupported conversions.

Example:

```c
_printf("Value: %q\n", value);
```

A minimal implementation needs a defined behavior.

Possible choices:

```txt
print '%' and the unknown specifier
ignore it
return an error
```

The important thing is consistency.

Undefined or random behavior makes debugging harder.

## Incomplete Percent At End

A common edge case:

```c
_printf("hello %");
```

The format string ends after `%`.

The implementation needs to decide what happens.

Possible behavior:

- return error
- print `%`
- ignore incomplete specifier

For a custom implementation, this should be documented and tested.

## Flags, Width, and Precision Direction

A basic implementation can skip advanced formatting.

A stronger extended version can support:

```txt
-   left align
+   force sign
0   zero padding
#   alternate form
space sign
width
precision
```

Example:

```c
printf("%08d", 42);
```

Output direction:

```txt
00000042
```

These features turn the parser from a simple specifier detector into a more serious formatting engine.

For a first version, it is better to implement fewer features correctly.

## Buffer vs Direct Write

There are two common output strategies.

### Direct Write

Print each character as soon as it is ready.

Advantages:

- simpler
- less memory management
- easy to understand

Disadvantages:

- many write calls
- harder to roll back on error

### Buffer First

Build output in memory, then write.

Advantages:

- fewer writes
- easier to manage final output
- closer to performance direction

Disadvantages:

- more memory management
- buffer resizing
- error handling complexity

A minimal version can use direct writes.

## Memory Management

A minimal `printf` may not need heavy dynamic allocation if it prints directly.

But memory may appear in:

- temporary digit buffers
- copied format data
- conversion helper buffers
- dynamic string handling
- advanced width/precision formatting

In C, every allocation needs a cleanup path.

For a small implementation, avoid unnecessary allocation where simple stack buffers or recursive output are enough.

## Testing Checklist

### Basic Output

- plain string
- empty string
- newline
- spaces
- multiple literal characters

### Character

- `%c`
- null character direction if tested
- multiple characters

### String

- `%s`
- empty string
- `NULL` string if behavior defined
- long string

### Integers

- `%d`
- `%i`
- zero
- positive number
- negative number
- `INT_MAX`
- `INT_MIN`

### Unsigned

- `%u`
- zero
- large unsigned value

### Percent

- `%%`
- percent beside text
- multiple percent signs

### Mixed Format

- `%s %d %c`
- text before and after conversions
- repeated conversions

### Invalid Cases

- unsupported specifier
- trailing `%`
- missing arguments direction
- format string is `NULL` if behavior defined

## Comparing With Standard printf

A useful test strategy is comparing output and return values against standard `printf` for supported conversions.

Example test direction:

```txt
custom output == printf output
custom return == printf return
```

Only compare features that the custom implementation claims to support.

If flags or precision are not implemented, they should not be tested as supported behavior.

## Common Bugs

### Wrong `va_arg` Type

Cause:

```txt
format parser expects one type but va_arg retrieves another
```

Result:

```txt
undefined behavior
```

Fix:

```txt
match each specifier to the correct promoted type
```

### Missing NULL Terminator Assumption

Cause:

```txt
string handler assumes every pointer is valid
```

Result:

```txt
segmentation fault
```

Fix:

```txt
define and handle NULL string behavior
```

### Incorrect Return Count

Cause:

```txt
converted characters are printed but not counted correctly
```

Fix:

```txt
centralize output/count logic
```

### INT_MIN Overflow

Cause:

```txt
trying to convert INT_MIN with normal negative-to-positive logic
```

Fix:

```txt
handle minimum value safely using wider type or unsigned logic
```

### Percent Handling Broken

Cause:

```txt
parser treats %% like invalid format
```

Fix:

```txt
special-case %% as literal percent
```

### Massive Function

Cause:

```txt
all parsing and conversion lives in one function
```

Fix:

```txt
split parser, dispatcher, and handlers
```

## Practical Decisions

### Implement fewer specifiers first

A correct `%c`, `%s`, `%d`, `%i`, `%u`, and `%%` is better than many broken conversions.

### Track count in one place

Character count bugs are easier to avoid when all output goes through one helper.

### Keep parser predictable

Unsupported specifiers should behave consistently.

### Watch variadic promotions

`char` and `short` are promoted to `int` in variadic calls.

### Test edge integers

`0`, negative values, `INT_MAX`, and `INT_MIN` reveal many bugs.

### Avoid unnecessary allocation

Simple direct output can keep the first version safer.

## What A Finished Version Should Show

A strong finished version should show:

- custom `_printf` function
- format string parser
- variadic argument handling
- conversion dispatcher
- character output helper
- printed character count
- `%c`
- `%s`
- `%d`
- `%i`
- `%u`
- `%%`
- optional `%x`, `%X`, `%o`, `%p`
- consistent error behavior
- tests against standard `printf`
- README with supported specifiers
- no memory leaks for supported paths

## Evidence Worth Capturing

Useful evidence for this note would include:

- source tree
- `_printf` function interface
- parser/dispatcher code excerpt
- integer conversion helper
- test output compared with `printf`
- edge case tests
- return value tests
- Valgrind output if available
- README supported specifier table
- examples of unsupported behavior

## Technical Assumptions

This note assumes the implementation is written in C.

It assumes the goal is to build a minimal `printf`-style function for learning and systems-programming fundamentals.

It also assumes the implementation supports a documented subset of standard `printf`, not the full standard library behavior.

## Key Risks

- pulling wrong types from `va_arg`
- returning the wrong character count
- crashing on `NULL` strings
- mishandling `INT_MIN`
- broken percent escaping
- unsupported format behavior not documented
- too many features added before the core works
- memory leaks from temporary buffers
- inconsistent output helpers
- comparing against standard `printf` for features not implemented

## Current State

This note represents a low-level C project focused on formatted output.

It is older/fundamentals-based compared with the infrastructure and business-system notes, but it still adds value because it shows:

```txt
parsing
type handling
conversion logic
output control
edge-case discipline
```

That makes it a good supporting systems-programming note.

## What This Note Does Not Claim

This note does not claim to replace the standard C library.

It does not claim to fully implement every `printf` flag, width, precision, length modifier, locale behavior, or platform-specific detail.

It documents a minimal custom implementation used to understand how formatted output works internally.

## Practical Takeaway

The useful lesson is:

> `printf` looks simple because the difficult parsing and conversion work is hidden.

To rebuild even a small version, you need to understand:

- variadic arguments
- format strings
- type-specific extraction
- number-to-text conversion
- output counting
- error handling
- edge cases
- memory discipline

Framed this way, the project becomes a C systems-programming note instead of a basic training exercise.
