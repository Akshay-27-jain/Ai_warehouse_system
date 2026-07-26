# Next Feature Report - AI Warehouse Optimization System

Last updated: 2026-07-06

## Current Running State

The app is running locally:

- Frontend: `http://127.0.0.1:3000`
- Backend API: `http://127.0.0.1:5000`
- Current preview page: `/products`

The frontend is no longer blank. Dashboard, Products, Orders, AI Insights, chatbot panel, and profile menu are now visible and interactive.

## Features Already Fixed Recently

- Fixed white screen caused by React dependency/runtime hook errors.
- Fixed profile menu opening.
- Added AI Insights drawer.
- Added AI chatbot panel with local warehouse guidance.
- Improved Orders table with delivery status, payment status, payment method, ETA, and Mark Delivered action.
- Improved Product table with SKU/barcode, product details, category, supplier, cost, selling price, margin, and status.
- Fixed backend order delivery/payment fields.
- Fixed backend serialization for warehouse/product records.
- Added fallback CSS so pages look like an app even when Tailwind utilities are incomplete.

## New Requested Features

### 1. Public Front Page

Need to add a public landing/front page before login.

Recommended route:

- `/` should show the public front page.
- `/login` should remain login.
- `/register` should remain registration.
- Authenticated users can still go to `/dashboard`.

Front page should include:

- App name: AI Warehouse Optimization System.
- Short explanation of what the platform does.
- Key modules: inventory, orders, demand forecasting, AI assistant, analytics, reports.
- CTA buttons: Login and Create Account.
- Professional SaaS style, not plain text.

### 2. Festival Demand In Chatbot

Need to extend chatbot so user can ask things like:

- "What demand should I expect for Diwali?"
- "Festival demand for electronics"
- "Christmas demand for apparel"
- "Which products will sell more during festival season?"

Current chatbot is local/static. It does not fetch real market data yet.

Recommended implementation:

- Add a festival-demand knowledge function in frontend first.
- Add backend API later: `/api/v1/ai/festival-demand`.
- Inputs: festival, category/product, region, month.
- Output: demand lift estimate, recommended stock increase, confidence, products to prioritize.

Example response:

> For Diwali, electronics and home products usually see higher demand. Increase safety stock by 20-35% for fast-moving SKUs and prioritize warehouses near high-order regions.

Important note: "market data" requires either an external API or a curated dataset. The current project has no market-data provider configured yet.

### 3. Search Not Working

Current top search box appears visually but does not perform actual navigation/filtering.

Recommended implementation:

- Add global search state in layout.
- Search products by SKU/name/barcode.
- Search warehouses by name/code/city.
- Search orders by order number/status/payment/delivery.
- Pressing Enter should navigate to a search results page or filter current module.

Suggested route:

- `/search?q=...`

Minimum first version:

- If user searches from Products page, filter product table.
- If user searches from Orders page, filter order table.
- If user searches from Dashboard, show a global search results panel.

### 4. Email Notifications

User wants notifications by email.

Current state:

- Notification menu exists in frontend.
- Backend has mail settings placeholders in config.
- There is no real email notification sender yet.

Recommended implementation:

- Add notification preferences in Settings:
  - Low stock email alerts.
  - Order delivered alerts.
  - Payment pending alerts.
  - Demand forecast alerts.
- Add backend email service.
- Use SMTP settings from `.env`.
- Add API endpoint to send/test email.

Suggested backend modules:

- `app/services/email_service.py`
- `app/services/notification_service.py`
- `app/routes/notification_routes.py`
- `app/controllers/notification_controller.py`

Suggested endpoints:

- `POST /api/v1/notifications/test-email`
- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/preferences`

Required `.env` values:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@example.com
MAIL_USE_TLS=true
```

For Gmail, an app password is required. Normal Gmail password should not be used.

## Recommended Work Order

1. Add public front page with Login/Register buttons.
2. Make global search functional on Products and Orders first.
3. Add chatbot festival-demand responses locally.
4. Add Settings notification preferences UI.
5. Add backend email notification service.
6. Add test email button.
7. Add real market-data provider or curated dataset for festival demand.

## Risks / Notes

- Real market data needs internet/API access or an imported dataset.
- Email sending needs real SMTP credentials.
- Current app still has Vite/Tailwind warnings, but they do not block runtime.
- Some dashboard values are still sample/static and should later be fully API-driven.

## Next Action

The best next coding task is:

> Build the public front page and make search functional for Products and Orders.

After that:

> Extend chatbot festival-demand answers and add email notification settings.
