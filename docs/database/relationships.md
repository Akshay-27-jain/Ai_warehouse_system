# Relationships and Cardinality

## Core Identity and Access
- One role may have many permissions through role_permissions.
- One permission may be granted to many roles through role_permissions.
- One user may have many roles through user_roles.
- One role may be assigned to many users through user_roles.

## Warehouse Operations
- One warehouse may have many warehouse managers.
- One user may manage many warehouses.
- One warehouse may contain many inventory records.
- One product may exist in many warehouse inventories.
- One order may contain many order items.
- One product may appear in many order items.
- One sale may contain many sale items.
- One transfer may contain many transfer items.

## Catalog and Procurement
- One category may contain many products.
- One supplier may supply many products.
- One product belongs to one category and may have one supplier.

## Analytics and Governance
- One warehouse and one product can have many prediction history entries.
- One user can receive many notifications.
- One user can generate many audit log records.
- Settings are key-value configuration records used by the application.
