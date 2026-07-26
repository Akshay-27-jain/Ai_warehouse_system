# ER Diagram

```mermaid
erDiagram
    ROLES ||--o{ USER_ROLES : assigns
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ WAREHOUSE_MANAGERS : manages
    WAREHOUSES ||--o{ WAREHOUSE_MANAGERS : assigned_to
    WAREHOUSES ||--o{ INVENTORY : stores
    PRODUCTS ||--o{ INVENTORY : tracked_in
    CATEGORIES ||--o{ PRODUCTS : contains
    SUPPLIERS ||--o{ PRODUCTS : supplies
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in
    ORDERS ||--o{ SALES : generated_from
    SALES ||--o{ SALES_ITEMS : contains
    PRODUCTS ||--o{ SALES_ITEMS : sold_as
    TRANSFERS ||--o{ TRANSFER_ITEMS : contains
    PRODUCTS ||--o{ TRANSFER_ITEMS : transferred
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : performs
    WAREHOUSES ||--o{ PREDICTION_HISTORY : forecasts
    PRODUCTS ||--o{ PREDICTION_HISTORY : predicted
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : assigned_to
```

## Entity Summary
- Users, Roles, and Permissions form the access control model.
- Warehouses, Inventory, Orders, Sales, and Transfers form the warehouse operations model.
- Products, Categories, and Suppliers form the catalog and procurement model.
- Prediction History, Notifications, Audit Logs, and Settings support analytics and governance.
