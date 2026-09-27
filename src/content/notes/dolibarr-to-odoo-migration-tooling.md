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
