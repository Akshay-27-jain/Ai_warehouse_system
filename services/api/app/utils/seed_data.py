from datetime import date, datetime, timezone
from decimal import Decimal

from app.extensions import db
from app.models.order import Order, OrderItem
from app.models.user import Role, User, UserRole
from app.models.warehouse import (
    Category,
    InventoryItem,
    Product,
    Supplier,
    Warehouse,
)


def get_or_create(model, defaults=None, **lookup):
    instance = model.query.filter_by(**lookup).first()
    if instance:
        return instance
    instance = model(**lookup, **(defaults or {}))
    db.session.add(instance)
    return instance


def ensure_user_role(user, role):
    if not UserRole.query.filter_by(user_id=user.id, role_id=role.id).first():
        db.session.add(UserRole(user_id=user.id, role_id=role.id))


def seed_database():
    if Warehouse.query.count() > 0 and Product.query.count() > 0 and InventoryItem.query.count() > 0:
        return

    roles = {
        name: get_or_create(Role, {'description': f'{name} role'}, name=name)
        for name in ('Admin', 'Warehouse Manager', 'Inventory Manager', 'Analyst')
    }
    db.session.flush()

    admin = User.query.filter_by(username='admin').first() or User(
        username='admin',
        email='admin@aiwarehouse.com',
        first_name='System',
        last_name='Admin',
        is_active=True,
        is_superuser=True,
        email_verified=True,
        verified_at=datetime.now(timezone.utc),
    )
    if not admin.id:
        admin.set_password('Admin@12345')
        db.session.add(admin)

    manager = User.query.filter_by(username='manager').first() or User(
        username='manager',
        email='manager@aiwarehouse.com',
        first_name='Alex',
        last_name='Morgan',
        is_active=True,
        is_superuser=False,
        email_verified=True,
        verified_at=datetime.now(timezone.utc),
    )
    if not manager.id:
        manager.set_password('Manager@12345')
        db.session.add(manager)
    db.session.flush()
    ensure_user_role(admin, roles['Admin'])
    ensure_user_role(manager, roles['Warehouse Manager'])

    warehouses = [
        get_or_create(Warehouse, {'name': 'North Distribution Hub', 'address': '1200 Logistics Way', 'city': 'Chicago', 'country': 'USA'}, code='WH-NORTH'),
        get_or_create(Warehouse, {'name': 'South Fulfillment Center', 'address': '88 Harbor Road', 'city': 'Atlanta', 'country': 'USA'}, code='WH-SOUTH'),
        get_or_create(Warehouse, {'name': 'West Coast Depot', 'address': '450 Pacific Ave', 'city': 'Los Angeles', 'country': 'USA'}, code='WH-WEST'),
    ]

    categories = [
        get_or_create(Category, {'description': 'Fruit juices, sodas, almond milk, and energy drinks'}, name='Beverages'),
        get_or_create(Category, {'description': 'Rice, oils, chocolates, cereals, and snacks'}, name='Packaged Foods'),
        get_or_create(Category, {'description': 'Shampoo, soaps, body wash, and skincare'}, name='Personal Care'),
        get_or_create(Category, {'description': 'Disinfectants, detergents, and paper products'}, name='Household & Cleaning'),
        get_or_create(Category, {'description': 'Electronics, gadgets, and kitchen tools'}, name='Electronics & Home'),
    ]

    suppliers = [
        get_or_create(Supplier, {'contact_email': 'supply@bevco.com', 'phone': '+1-555-0201'}, name='Global BevCo'),
        get_or_create(Supplier, {'contact_email': 'sales@agrofoods.com', 'phone': '+1-555-0202'}, name='AgroFoods Enterprise'),
        get_or_create(Supplier, {'contact_email': 'support@carewell.com', 'phone': '+1-555-0203'}, name='CareWell Hygiene'),
        get_or_create(Supplier, {'contact_email': 'orders@techsource.com', 'phone': '+1-555-0101'}, name='TechSource Global'),
    ]
    db.session.flush()

    fmcg_products_data = [
        ('FMCG-1001', '8901234501011', 'Unsweetened Almond Milk 1L', 'Organic plant-based almond milk', categories[0].id, suppliers[0].id, Decimal('1.80'), Decimal('3.49')),
        ('FMCG-1002', '8901234501012', 'Sparkling Citrus Soda 6-Pack', 'Zero-calorie flavored sparkling water', categories[0].id, suppliers[0].id, Decimal('2.50'), Decimal('4.99')),
        ('FMCG-1003', '8901234501013', 'Arabica Dark Roast Coffee 500g', 'Whole bean single-origin coffee', categories[0].id, suppliers[0].id, Decimal('5.20'), Decimal('10.99')),
        ('FMCG-2001', '8901234502011', 'Extra Virgin Olive Oil 1L', 'Cold-pressed Mediterranean olive oil', categories[1].id, suppliers[1].id, Decimal('6.50'), Decimal('12.99')),
        ('FMCG-2002', '8901234502012', 'Premium Basmati Rice 5kg', 'Long-grain aromatic rice', categories[1].id, suppliers[1].id, Decimal('7.00'), Decimal('14.99')),
        ('FMCG-2003', '8901234502013', 'Organic Dark Chocolate 70% 100g', 'Fairtrade artisan dark chocolate', categories[1].id, suppliers[1].id, Decimal('1.10'), Decimal('2.79')),
        ('FMCG-2004', '8901234502014', 'Rolled Whole Grain Oats 1kg', 'High-fiber breakfast oats', categories[1].id, suppliers[1].id, Decimal('1.40'), Decimal('3.29')),
        ('FMCG-3001', '8901234503011', 'Anti-Dandruff Shampoo 400ml', 'Scalp-nourishing zinc pyrithione formula', categories[2].id, suppliers[2].id, Decimal('2.20'), Decimal('5.49')),
        ('FMCG-3002', '8901234503012', 'Total Care Toothpaste 150g', 'Cavity protection fluoride toothpaste', categories[2].id, suppliers[2].id, Decimal('0.90'), Decimal('2.49')),
        ('FMCG-3003', '8901234503013', 'Moisturizing Body Wash 500ml', 'Hydrating aloe vera body cleanser', categories[2].id, suppliers[2].id, Decimal('2.80'), Decimal('6.29')),
        ('FMCG-4001', '8901234504011', 'Multipurpose Surface Cleaner 750ml', 'Kills 99.9% of bacteria and viruses', categories[3].id, suppliers[2].id, Decimal('1.50'), Decimal('3.99')),
        ('FMCG-4002', '8901234504012', 'Ultra Concentrated Laundry Liquid 2L', 'Color safe 60-load liquid detergent', categories[3].id, suppliers[2].id, Decimal('4.10'), Decimal('9.99')),
        ('FMCG-4003', '8901234504013', 'Absorbent Paper Towel 4-Rolls', '2-ply heavy duty paper towels', categories[3].id, suppliers[2].id, Decimal('2.00'), Decimal('4.49')),
        ('ELC-1001', '8901234500011', 'Wireless Headphones Pro', 'Noise-cancelling bluetooth headphones', categories[4].id, suppliers[3].id, Decimal('45.00'), Decimal('89.99')),
        ('HOM-3002', '8901234500032', 'Robot Vacuum Cleaner', 'Smart mapping automated vacuum', categories[4].id, suppliers[3].id, Decimal('150.00'), Decimal('299.99')),
    ]

    products = []
    for sku, barcode, name, desc, cat_id, sup_id, ucost, sprice in fmcg_products_data:
        p = get_or_create(Product, {
            'barcode': barcode,
            'name': name,
            'description': desc,
            'category_id': cat_id,
            'supplier_id': sup_id,
            'unit_cost': ucost,
            'selling_price': sprice,
            'minimum_stock_level': 15,
            'maximum_stock_level': 500,
            'safety_stock': 25,
            'alert_threshold': 20,
            'email_alert_enabled': True
        }, sku=sku)
        products.append(p)
    db.session.flush()

    # Create inventory for all products across all warehouses
    import random
    random.seed(42)
    for p in products:
        for wh in warehouses:
            existing = InventoryItem.query.filter_by(product_id=p.id, warehouse_id=wh.id).first()
            if not existing:
                qty = random.choice([4, 12, 45, 120, 240, 310, 8, 450])
                reserved = min(qty // 5, 20)
                db.session.add(InventoryItem(
                    product_id=p.id,
                    warehouse_id=wh.id,
                    available_quantity=qty,
                    reserved_quantity=reserved,
                    reorder_point=30,
                    low_stock_threshold=20,
                    last_adjusted_at=datetime.now(timezone.utc)
                ))

    orders = [
        get_or_create(Order, {'warehouse_id': warehouses[0].id, 'user_id': manager.id, 'status': 'pending', 'order_date': date.today(), 'delivery_status': 'pending', 'payment_status': 'unpaid', 'payment_method': 'not_selected', 'notes': 'FMCG Retail Supermarket Order'}, order_number='ORD-2026-1001'),
        get_or_create(Order, {'warehouse_id': warehouses[1].id, 'user_id': manager.id, 'status': 'processing', 'order_date': date.today(), 'delivery_status': 'packed', 'payment_status': 'authorized', 'payment_method': 'card', 'notes': 'Regional Grocery Distribution'}, order_number='ORD-2026-1002'),
        get_or_create(Order, {'warehouse_id': warehouses[2].id, 'user_id': manager.id, 'status': 'shipped', 'order_date': date.today(), 'delivery_status': 'in_transit', 'payment_status': 'paid', 'payment_method': 'upi', 'payment_reference': 'UPI-2026-1003', 'notes': 'Express Supermarket Replenishment'}, order_number='ORD-2026-1003'),
        get_or_create(Order, {'warehouse_id': warehouses[0].id, 'user_id': manager.id, 'status': 'completed', 'order_date': date.today(), 'delivery_status': 'delivered', 'payment_status': 'paid', 'payment_method': 'bank_transfer', 'payment_reference': 'BANK-2026-0998', 'notes': 'Completed wholesale FMCG shipment'}, order_number='ORD-2026-0998'),
    ]
    db.session.flush()

    for idx, order in enumerate(orders):
        for p in products[idx * 3 : (idx + 1) * 3 + 1]:
            existing = OrderItem.query.filter_by(order_id=order.id, product_id=p.id).first()
            if not existing:
                db.session.add(OrderItem(order_id=order.id, product_id=p.id, quantity=random.randint(10, 100), unit_price=p.selling_price))

    db.session.commit()
