---
resume: true
title: "Dolibarr to Odoo Migration Tooling"
slug: "dolibarr-to-odoo-migration-tooling"
summary: "Field notes from designing migration tooling for moving business data from Dolibarr into Odoo while keeping product, customer, quotation, invoice, and stock data understandable and verifiable."
resumeSummary: >-
  Designed migration tooling and validation direction for moving business records from Dolibarr into Odoo. The work addresses product, customer, supplier, quotation, invoice, and stock data; field mapping and normalization; stable external IDs; duplicate prevention; relationship preservation; and reconciliation after import. Rather than treating migration as a one-time export, it frames it as a controlled data transition where references must remain traceable, quantities and statuses must be checked, and exceptions must be visible before they become operational errors.
category: "Business Systems"
tags:
  - dolibarr
  - odoo
  - erp
  - migration
  - data-mapping
  - inventory
  - invoicing
  - business-systems
  - automation
  - validation
date: "2026-06-14"
updated: "2026-07-25"
featured: true
published: true
translations:
  fr:
    title: "Outillage de migration de Dolibarr vers Odoo"
    category: "Systèmes métier"
    summary: "Notes sur la conception d’outils de migration de données métier de Dolibarr vers Odoo en gardant produits, clients, devis, factures et stock compréhensibles et vérifiables."
    resumeSummary: >-
      Conception de l'outil de migration et de l'orientation de validation pour déplacer les dossiers
      commerciaux de Dolibarr vers Odoo. Le travail s'adresse au produit, client, fournisseur, devis, facture
      et données de stock; cartographie et normalisation sur le terrain; identifications externes stables;
      prévention du double; préservation des relations; et rapprochement après importation. Plutôt que de
      traiter la migration comme une exportation ponctuelle, elle la définit comme une transition de données
      contrôlée où les références doivent rester traçables, les quantités et les états doivent être vérifiés,
      et les exceptions doivent être visibles avant qu'elles ne deviennent des erreurs opérationnelles.
    body: |-

      ## Pourquoi cette note existe

      Cette note documente l'orientation de conception de l'outillage qui aide à déplacer les données commerciales de Dolibarr vers Odoo.

      L'objectif n'était pas de traiter la migration comme une tâche d'exportation/importation aveugle. Les données ERP ont des relations, des hypothèses et une signification commerciale.

      La partie utile du projet est le flux de migration:

      - comprendre les données sources
      - carte des champs Dolibarr aux champs Odoo
      - Des incohérences évidentes et claires
      - Importations d'essais à sec
      - valider les nombres et les relations
      - éviter de casser les dossiers commerciaux
      - garder le processus répétable

      Cela fait du projet une note sur les systèmes d'affaires et la migration des données, et pas seulement une tâche de script.

      ## Contexte du projet

      Dolibarr et Odoo peuvent tous deux gérer les opérations, mais ils ne structurent pas tout de la même manière.

      Une migration peut comprendre:

      - produits
      - catégories
      - clients
      - fournisseurs
      - prix
      - factures
      - quantité stock
      - impôts
      - unités de mesure
      - Références/SKU
      - contacts
      - Adresses
      - États de paiement
      - historiques

      L'outil de migration doit respecter le fait que ces objets dépendent les uns des autres.

      Par exemple:

      ```txt
      Customer
        ↓
      Quotation
        ↓
      Invoice
        ↓
      Payment / status
      ```

      ou:

      ```txt
      Product
        ↓
      Stock quantity
        ↓
      Sale line / invoice line
      ```

      Si les enregistrements de base sont importés mal, les enregistrements plus tard deviennent aussi désordonnés.

      ## Ce que cet outillage veut prouver

      - La migration des PGI devrait être gérée comme un flux de travail contrôlé
      - la cartographie de champ est plus importante que la conversion de fichier simple
      - les importations doivent être reproductibles
      - réduction des risques
      - la validation fait partie de l'outil, et non pas une option supplémentaire
      - les relations produit/client/facture doivent être préservées
      - les utilisateurs commerciaux ont besoin de rapports de migration compréhensibles
      - les scripts de migration devraient rendre les problèmes visibles avant l'importation

      ## Pioche et outils utilisés

      ### Système source

      - Dolibarr
      - Exportations de Dolibarr
      - données produit/client/facture
      - CSV ou direction d'exportation de la base de données
      - références commerciales et identifiants

      ### Système cible

      - Odoo
      - Produits Odoo
      - Contacts Odoo
      - Ventes d'Odoo
      - Inventaire d'Odoo
      - Facturation Odoo
      - Modèles d'importation d'Odoo
      - Odoo IDs externes / références

      ### Outils de migration

      - Direction du script Python ou JavaScript
      - Analyse CSV
      - normalisation des données
      - fichiers de correspondance
      - rapports de validation
      - sortie à sec
      - génération CSV prête à l'importation
      - journaux et fichiers d'erreur

      ### Niveau d'activité

      - produits
      - clients
      - fournisseurs
      - prix
      - factures
      - impôts
      - catégories
      - stock
      - Références
      - Décisions concernant les données historiques

      ## Construction prévue

      La construction prévue est une aide à la migration qui convertit les exportations de Dolibarr en fichiers d'importation propres prêts à Odoo.

      Une première version terminée devrait :

      - lire les fichiers d'exportation de Dolibarr
      - normaliser les noms de champs
      - les champs source de la carte vers les champs Odoo
      - préserver les identifiants importants
      - générer des fichiers prêts à importer pour Odoo
      - mettre en garde contre le manque de données requises
      - détecter les duplicatas
      - produire un rapport de validation
      - support à sec
      - éviter de modifier les données d'Odoo en direct jusqu'à examen

      La première version n'a pas besoin d'automatiser tout à travers l'API Odoo. Un flux de travail de fichier d'importation contrôlé peut être plus sûr tôt.

      ## Flux migratoire

      Un flux migratoire sûr ressemble à ceci:

      ```txt
      Export from Dolibarr
        ↓
      Inspect source files
        ↓
      Map fields to Odoo structure
        ↓
      Clean and normalize data
        ↓
      Generate import-ready files
        ↓
      Run validation checks
        ↓
      Test import in Odoo staging/demo
        ↓
      Review results
        ↓
      Import into production only after approval
      ```

      Le point important est que l'importation de la production ne doit pas être le premier test.

      ## Cartographie des données

      La cartographie des données est au cœur de la migration.

      Exemple de direction de la cartographie:

      ```txt
      Dolibarr product reference → Odoo Internal Reference
      Dolibarr product label     → Odoo Product Name
      Dolibarr customer name     → Odoo Contact Name
      Dolibarr VAT/tax field     → Odoo Tax mapping
      Dolibarr invoice number    → Odoo Invoice Reference / historical note
      Dolibarr category          → Odoo Product Category
      ```

      La cartographie doit être visible dans un fichier ou une table documentée, et non enterrée au hasard à l'intérieur du code.

      Un fichier de cartographie facilite l'examen et l'ajustement de la migration.

      ## Migration des produits

      Les produits sont généralement l'un des premiers objets à migrer.

      Champs de produits importants:

      ```txt
      internal reference / SKU
      product name
      category
      sale price
      cost price if available
      tax
      barcode if available
      unit of measure
      active/inactive status
      description
      stock tracking decision
      ```

      Questions communes:

      - UGS/référence manquante
      - références en double
      - noms incohérents
      - inadéquation de catégorie
      - inadéquation fiscale
      - produits anciens/inactifs
      - produits qui devraient être des services
      - produits avec des ventes historiques mais aucun stock actuel

      Une bonne migration devrait séparer:

      ```txt
      products to import
      products to review
      products to ignore/archive
      ```

      ## Migration des clients et des fournisseurs

      Les contacts doivent être traités avec soin car Dolibarr et Odoo peuvent représenter des personnes, des entreprises et des adresses différentes.

      Champs importants:

      ```txt
      company/person name
      email
      phone
      address
      city
      country
      tax/VAT identifier
      customer/supplier role
      internal reference
      ```

      Questions communes:

      - clients en double
      - un client avec des orthographes multiples
      - courriel/téléphone manquant
      - adresses divisées différemment
      - ambiguïté du rôle du fournisseur/client
      - contacts personnels mélangés avec des entreprises

      Un rapport de validation utile devrait les indiquer avant l'importation.

      ## Citation et migration des factures

      Les devis et factures historiques sont plus sensibles que les produits.

      La migration nécessite une décision:

      ```txt
      Should historical documents be fully recreated in Odoo?
      Or should they be imported as reference/archive data?
      ```

      La recréation complète des documents est plus complexe car les lignes, les taxes, les clients, les produits et les statuts doivent correspondre correctement.

      Une stratégie précoce plus sûre peut être :

      - migrer les clients/produits actifs
      - migrer le stock actuel si nécessaire
      - conserver les documents historiques Dolibarr archivés
      - Importer uniquement les références de facture essentielles ou les soldes ouverts
      - recréer uniquement les citations/commandes actives si nécessaire

      Cela évite de prétendre que la migration comptable historique est simple.

      ## Migration des stocks

      Le stock est important sur le plan opérationnel.

      La migration des stocks devrait répondre :

      ```txt
      What is the opening stock in Odoo?
      At what date/time was it measured?
      Which warehouse/location does it belong to?
      Which products are stock-tracked?
      Who approved the quantity?
      ```

      Les stocks ne devraient pas être importés aveuglément à partir d'exportations inexistantes.

      Un meilleur flux de travail :

      1. Migrer les enregistrements de produits
      2. vérifier les produits/catégories
      3. effectuer ou confirmer le dénombrement des stocks
      4. importation stock d'ouverture dans Odoo
      5. verrouiller la date de migration
      6. éviter d'utiliser les deux systèmes comme sources de stocks actives en même temps

      ## IDs et références externes

      Les migrations d'Odoo bénéficient d'identificateurs externes stables.

      Un motif utile est de préserver les ID Dolibarr comme références externes.

      Exemple :

      ```txt
      dolibarr_product_123 → Odoo product external ID
      dolibarr_customer_85 → Odoo contact external ID
      dolibarr_invoice_991 → Odoo historical invoice reference
      ```

      Cela rend les importations répétées plus sûres et permet de faire correspondre les enregistrements connexes.

      Sans identifiants stables, la migration peut créer des duplicatas.

      ## Mode de course à sec

      Le mode à sec est important.

      Un essai à sec devrait:

      - lire les données source
      - appliquer des cartes
      - validations d'exécution
      - produire des fichiers de sortie
      - afficher les nombres
      - afficher les avertissements/erreurs
      - éviter de toucher la production Odoo

      Exemple de sortie :

      ```txt
      Products read: 420
      Products valid: 397
      Products with warnings: 18
      Products blocked: 5
      Duplicate references: 3
      Missing categories: 7
      ```

      Un cycle sec transforme la migration en un processus revisible.

      ## Vérifications de validation

      Vérifications utiles de validation:

      ### Vérifications des produits

      - Nom du produit manquant
      - référence manquante/SKU
      - duplicata
      - catégorie invalide
      - prix invalide
      - taxe inconnue
      - unité non soutenue

      ### Vérifications de contact

      - duplicata
      - duplicata
      - nom requis manquant
      - pays invalide
      - défaut d'identification TVA/taxe si nécessaire
      - ambiguïté du rôle du fournisseur/client

      ### Vérifications des factures

      - client manquant
      - Ligne de produits manquante
      - taxe inconnue
      - total incohérent
      - date invalide
      - duplicata
      - statut non soutenu

      ### Contrôles des stocks

      - Produit non trouvé
      - quantité négative
      - entrepôt/lieu inconnu
      - l'article non stockable a des stocks
      - ancienne date du stock

      ## Stratégie d'importation

      Un ordre d'importation sûr est:

      ```txt
      1. categories
      2. units/taxes if needed
      3. contacts
      4. products
      5. stock opening quantities
      6. active quotations/orders
      7. invoice references or selected invoice data
      ```

      Cet ordre est important parce que les dossiers ultérieurs dépendent des dossiers antérieurs.

      Les factures ne doivent pas être importées avant l'existence des clients et des produits.

      ## Déclaration d'erreurs

      L'outil devrait générer des fichiers d'erreurs que les utilisateurs d'affaires peuvent examiner.

      Fichiers de sortie utiles & #160;:

      ```txt
      products_ready_for_odoo.csv
      products_errors.csv
      contacts_ready_for_odoo.csv
      contacts_errors.csv
      migration_summary.txt
      mapping_report.txt
      ```

      Un bon outil de migration ne cache pas les mauvaises lignes. Il les sépare.

      ## Répétabilité

      La migration devrait être répétable.

      Un processus répétable signifie:

      - même entrée produit la même sortie
      - la cartographie est stockée
      - les avertissements sont cohérents
      - les journaux sont enregistrés
      - les ID externes empêchent les duplications
      - importation de production ne se fait pas manuellement à partir de fichiers édités aléatoirement

      Ceci est particulièrement important lorsque l'entreprise change de données pendant la fenêtre de migration.

      ## Conditionnement / Importation d'essai

      Avant la production, les fichiers générés doivent être testés dans:

      ```txt
      Odoo demo database
      or
      Odoo staging database
      ```

      L'essai doit vérifier:

      - les produits apparaissent correctement
      - les contacts sont consultables
      - les catégories sont correctes
      - prix/taxes à droite
      - les stocks ont un sens
      - travaux de citations/commandes actives
      - aucune duplication évidente n'a été créée

      Seulement après examen si l'importation de production se produit.

      ## Décisions pratiques

      ### Ne pas automatiser la production trop tôt

      L'importation de fichiers peut être plus sûre que l'automatisation de l'API lors de la migration précoce.

      ### Préserver les identifiants de source

      Les ID Dolibarr sont utiles pour suivre les relations et éviter les duplications.

      ### Valider avant l'importation

      Les erreurs de migration doivent être trouvées avant qu'Odoo ne rejette ou n'importe des données.

      ### Données historiques et actives distinctes

      Pas tous les vieux documents doivent devenir un objet Odoo en direct.

      ### Garder l'examen des affaires visible

      Le client/propriétaire d'entreprise doit comprendre ce qui sera importé, omis ou examiné.

      ### Traiter soigneusement le stock

      Stock a besoin d'un vrai moment de coupure, pas d'une vague exportation.

      ## Ce qu'une version terminée devrait montrer

      Une version terminée forte devrait montrer:

      - une structure de dépôt claire
      - exemple de fichiers d'entrée sans données privées
      - configuration de la cartographie
      - généré des fichiers d'importation Odoo-ready
      - rapport de validation
      - commande sry-run
      - documents relatifs à l'ordre d'importation
      - échantillons de sortie d'erreur
      - Instructions d'utilisation README
      - aucune donnée réelle client/entreprise privée engagée
      - notes sur la mise en scène avant production

      ## Preuves à retenir

      Voici quelques éléments de preuve utiles à cette note :

      - exemple d'exportation de Dolibarr anonymisé
      - Tableau de cartographie sur le terrain
      - Importation d'Odoo générée CSV
      - sortie sommaire à tirage sec
      - fichier d'erreurs de validation
      - Odoo mise en scène importation screenshot
      - avant/après le nombre de produits
      - avant/après le nombre de contacts
      - exemple de détection dupliquée
      - l'immigration
      - liste de contrôle de l'ordre d'importation

      ## Hypothèses techniques

      La présente note suppose que les exportations de Dolibarr sont disponibles dans un format lisible tel que le CSV ou l'exportation structurée de bases de données.

      Il suppose qu'Odoo est le système commercial cible pour les produits, les contacts, les ventes, les stocks et la facturation.

      Elle suppose également que la migration devrait être revue avant l'importation de la production, en particulier pour les registres financiers et les registres des stocks.

      ## Principaux risques

      - Importation de produits ou de clients en double
      - perte de références de produits/USK
      - mauvaise cartographie fiscale
      - mauvaises quantités de stocks
      - traiter les factures historiques comme des lignes simples
      - importation dans la production avant l'essai
      - mélange des données actives des deux systèmes après la migration
      - engagement de données privées client/entreprise
      - pas de retour ou de sauvegarde
      - Aucune conservation d'identification source
      - en supposant que Dolibarr et Odoo utilisent des modèles de données identiques

      ## État actuel

      Cette note représente la direction d'outillage de migration pour passer de Dolibarr à Odoo.

      La valeur la plus forte n'est pas le script lui-même. La valeur rend la migration contrôlée, revisible et répétable.

      L'outillage devrait aider à transformer les exportations opérationnelles désordonnées en fichiers Odoo prêts à l'importation tout en montrant ce qui a besoin d'un examen humain.

      ## Ce que la présente note ne prétend pas

      La présente note ne prétend pas que la migration complète du PGI soit automatique.

      Il ne prétend pas que l'historique comptable puisse toujours être recréé parfaitement.

      Elle ne prétend pas que la conversion de fichiers suffit.

      Il documente un outil pratique de soutien à la migration et un workflow pour déplacer les données d'affaires de Dolibarr vers Odoo avec une cartographie plus sûre, la validation et la mise en scène.

      ## À emporter pratique

      La migration ERP ne doit pas être traitée comme une tâche de copier-coller normale.

      Les éléments importants sont les suivants:

      - comprendre les données sources
      - les champs de carte délibérément
      - préserver les références sources
      - valider avant l'importation
      - documents actifs et historiques distincts
      - essai en étalage
      - produire des rapports à examiner
      - protéger les données sur les entreprises privées

      Cela fait du projet une note de migration des systèmes d'affaires, pas seulement un script de conversion de données.
seoTitle: "Dolibarr to Odoo Migration Tooling"
seoDescription: "A practical note about designing tooling and workflow for migrating business data from Dolibarr to Odoo, including mapping, validation, dry runs, and safe import strategy."
---

## Why This Note Exists

This note documents the design direction for tooling that helps move business data from Dolibarr into Odoo.

The goal was not to treat migration as a blind export/import task. ERP data has relationships, assumptions, and business meaning. A product, customer, invoice, or stock movement is not just a row in a spreadsheet.

The useful part of the project is the migration workflow:

- understand the source data
- map Dolibarr fields to Odoo fields
- clean obvious inconsistencies
- test imports with dry runs
- validate counts and relationships
- avoid breaking business records
- keep the process repeatable

This makes the project a business-systems and data-migration note, not only a scripting task.

## Project Context

Dolibarr and Odoo can both manage business operations, but they do not structure everything in the exact same way.

A migration can involve:

- products
- categories
- customers
- suppliers
- quotations
- invoices
- stock quantities
- taxes
- units of measure
- references/SKUs
- contacts
- addresses
- payment states
- historical records

The migration tooling needs to respect the fact that these objects depend on each other.

For example:

```txt
Customer
  ↓
Quotation
  ↓
Invoice
  ↓
Payment / status
```

or:

```txt
Product
  ↓
Stock quantity
  ↓
Sale line / invoice line
```

If the base records are imported badly, the later records become messy too.

## What This Tooling Is Meant To Prove

- ERP migration should be handled as a controlled workflow
- field mapping is more important than simple file conversion
- imports should be repeatable
- dry runs reduce risk
- validation is part of the tool, not an optional extra
- product/customer/invoice relationships must be preserved
- business users need understandable migration reports
- migration scripts should make problems visible before import

## Stack and Tools Used

### Source System

- Dolibarr
- Dolibarr exports
- product/customer/invoice data
- CSV or database export direction
- business references and identifiers

### Target System

- Odoo
- Odoo Products
- Odoo Contacts
- Odoo Sales
- Odoo Inventory
- Odoo Invoicing
- Odoo import templates
- Odoo external IDs / references

### Migration Tooling

- Python or JavaScript scripting direction
- CSV parsing
- data normalization
- mapping files
- validation reports
- dry-run output
- import-ready CSV generation
- logs and error files

### Business Layer

- products
- customers
- suppliers
- quotations
- invoices
- taxes
- categories
- stock
- references
- historical data decisions

## Intended Build

The intended build is a migration helper that converts Dolibarr exports into clean Odoo-ready import files.

A finished first version should:

- read Dolibarr export files
- normalize field names
- map source fields to Odoo fields
- preserve important identifiers
- generate import-ready files for Odoo
- warn about missing required data
- detect duplicates
- produce a validation report
- support dry runs
- avoid changing live Odoo data until reviewed

The first version does not need to automate everything through the Odoo API. A controlled import-file workflow can be safer early on.

## Migration Flow

A safe migration flow looks like this:

```txt
Export from Dolibarr
  ↓
Inspect source files
  ↓
Map fields to Odoo structure
  ↓
Clean and normalize data
  ↓
Generate import-ready files
  ↓
Run validation checks
  ↓
Test import in Odoo staging/demo
  ↓
Review results
  ↓
Import into production only after approval
```

The important point is that production import should not be the first test.

## Data Mapping

Data mapping is the core of the migration.

Example mapping direction:

```txt
Dolibarr product reference → Odoo Internal Reference
Dolibarr product label     → Odoo Product Name
Dolibarr customer name     → Odoo Contact Name
Dolibarr VAT/tax field     → Odoo Tax mapping
Dolibarr invoice number    → Odoo Invoice Reference / historical note
Dolibarr category          → Odoo Product Category
```

The mapping should be visible in a file or documented table, not buried randomly inside code.

A mapping file makes the migration easier to review and adjust.

## Product Migration

Products are usually one of the first objects to migrate.

Important product fields:

```txt
internal reference / SKU
product name
category
sale price
cost price if available
tax
barcode if available
unit of measure
active/inactive status
description
stock tracking decision
```

Common issues:

- missing SKU/reference
- duplicate references
- inconsistent names
- category mismatch
- tax mismatch
- old/inactive products
- products that should be services
- products with historical sales but no current stock

A good migration should separate:

```txt
products to import
products to review
products to ignore/archive
```

## Customer and Supplier Migration

Contacts need careful handling because Dolibarr and Odoo may represent people, companies, and addresses differently.

Important fields:

```txt
company/person name
email
phone
address
city
country
tax/VAT identifier
customer/supplier role
internal reference
```

Common issues:

- duplicate customers
- one customer with multiple spellings
- missing email/phone
- addresses split differently
- supplier/customer role ambiguity
- personal contacts mixed with companies

A useful validation report should flag these before import.

## Quotation and Invoice Migration

Historical quotations and invoices are more sensitive than products.

The migration needs a decision:

```txt
Should historical documents be fully recreated in Odoo?
Or should they be imported as reference/archive data?
```

Fully recreating documents is more complex because lines, taxes, customers, products, and statuses must match correctly.

A safer early strategy can be:

- migrate active customers/products
- migrate current stock if needed
- keep historical Dolibarr documents archived
- import only essential invoice references or open balances
- recreate only active quotations/orders if needed

This avoids pretending that historical accounting migration is simple.

## Stock Migration

Stock is operationally important.

Stock migration should answer:

```txt
What is the opening stock in Odoo?
At what date/time was it measured?
Which warehouse/location does it belong to?
Which products are stock-tracked?
Who approved the quantity?
```

Stock should not be imported blindly from stale exports.

A better workflow:

1. migrate product records
2. verify products/categories
3. perform or confirm stock count
4. import opening stock into Odoo
5. lock the migration date
6. avoid using both systems as active stock sources at the same time

## External IDs and References

Odoo migrations benefit from stable external identifiers.

A useful pattern is to preserve Dolibarr IDs as external references.

Example:

```txt
dolibarr_product_123 → Odoo product external ID
dolibarr_customer_85 → Odoo contact external ID
dolibarr_invoice_991 → Odoo historical invoice reference
```

This makes repeat imports safer and helps match related records.

Without stable IDs, the migration can create duplicates.

## Dry Run Mode

Dry run mode is important.

A dry run should:

- read source data
- apply mappings
- run validations
- produce output files
- show counts
- show warnings/errors
- avoid touching production Odoo

Example output:

```txt
Products read: 420
Products valid: 397
Products with warnings: 18
Products blocked: 5
Duplicate references: 3
Missing categories: 7
```

A dry run turns migration into a reviewable process.

## Validation Checks

Useful validation checks:

### Product Checks

- missing product name
- missing reference/SKU
- duplicate reference
- invalid category
- invalid price
- unknown tax
- unsupported unit

### Contact Checks

- duplicate email
- duplicate company name
- missing required name
- invalid country
- missing VAT/tax ID where required
- supplier/customer role ambiguity

### Invoice Checks

- missing customer
- missing product line
- unknown tax
- inconsistent totals
- invalid date
- duplicate invoice number
- unsupported status

### Stock Checks

- product not found
- negative quantity
- unknown warehouse/location
- non-stockable item has stock
- old stock date

## Import Strategy

A safe import order is:

```txt
1. categories
2. units/taxes if needed
3. contacts
4. products
5. stock opening quantities
6. active quotations/orders
7. invoice references or selected invoice data
```

This order matters because later records depend on earlier records.

Invoices should not be imported before customers and products exist.

## Error Reporting

The tool should generate error files that business users can review.

Useful output files:

```txt
products_ready_for_odoo.csv
products_errors.csv
contacts_ready_for_odoo.csv
contacts_errors.csv
migration_summary.txt
mapping_report.txt
```

A good migration tool does not hide bad rows. It separates them.

## Repeatability

Migration should be repeatable.

A repeatable process means:

- same input produces same output
- mapping is stored
- warnings are consistent
- logs are saved
- external IDs prevent duplicates
- production import is not done manually from random edited files

This is especially important when the business changes data during the migration window.

## Staging / Test Import

Before production, the generated files should be tested in:

```txt
Odoo demo database
or
Odoo staging database
```

The test should verify:

- products appear correctly
- contacts are searchable
- categories are correct
- prices/taxes look right
- stock quantities make sense
- active quotations/orders work
- no obvious duplicates were created

Only after review should production import happen.

## Practical Decisions

### Do not automate production too early

File-based import can be safer than API automation during early migration.

### Preserve source IDs

Dolibarr IDs are useful for tracking relationships and avoiding duplicates.

### Validate before import

Migration errors should be found before Odoo rejects or misimports data.

### Separate historical and active data

Not every old document needs to become a live Odoo object.

### Keep business review visible

The client/business owner should understand what will be imported, skipped, or reviewed.

### Treat stock carefully

Stock needs a real cutover moment, not a vague export.

## What A Finished Version Should Show

A strong finished version should show:

- clear repository structure
- example input files without private data
- mapping configuration
- generated Odoo-ready import files
- validation report
- dry-run command
- import order documentation
- error output samples
- README usage instructions
- no real customer/private business data committed
- notes about staging before production

## Evidence Worth Capturing

Useful evidence for this note would include:

- anonymized Dolibarr export example
- field mapping table
- generated Odoo import CSV
- dry-run summary output
- validation errors file
- Odoo staging import screenshot
- before/after product count
- before/after contact count
- duplicate detection example
- migration README
- import order checklist

## Technical Assumptions

This note assumes that Dolibarr exports are available in a readable format such as CSV or structured database export.

It assumes Odoo is the target business system for products, contacts, sales, inventory, and invoicing.

It also assumes migration should be reviewed before production import, especially for financial and stock records.

## Key Risks

- importing duplicate products or customers
- losing product references/SKUs
- wrong tax mapping
- wrong stock quantities
- treating historical invoices as simple rows
- importing into production before testing
- mixing active data from both systems after migration
- committing private customer/business data
- no rollback or backup
- no source ID preservation
- assuming Dolibarr and Odoo use identical data models

## Current State

This note represents the migration tooling direction for moving from Dolibarr to Odoo.

The strongest value is not the script itself. The value is making the migration controlled, reviewable, and repeatable.

The tooling should help transform messy operational exports into import-ready Odoo files while showing what needs human review.

## What This Note Does Not Claim

This note does not claim that full ERP migration is automatic.

It does not claim that accounting history can always be recreated perfectly.

It does not claim that file conversion alone is enough.

It documents a practical migration-support tool and workflow for moving business data from Dolibarr toward Odoo with safer mapping, validation, and staging.

## Practical Takeaway

ERP migration should not be handled like a normal copy-paste task.

The important parts are:

- understand the source data
- map fields deliberately
- preserve source references
- validate before import
- separate active and historical records
- test in staging
- generate reviewable reports
- protect private business data

That makes the project a business-systems migration note, not just a data conversion script.
