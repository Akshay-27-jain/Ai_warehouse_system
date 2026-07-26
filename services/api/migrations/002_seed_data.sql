-- Sample data for AI Warehouse Optimization System

INSERT INTO roles (role_id, role_name, description, is_system) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin', 'Platform administrator with full access', true),
('22222222-2222-2222-2222-222222222222', 'Warehouse Manager', 'Manages warehouse operations', false),
('33333333-3333-3333-3333-333333333333', 'Planner', 'Creates forecasts and optimization plans', false),
('44444444-4444-4444-4444-444444444444', 'Analyst', 'Views reports and dashboards', false),
('55555555-5555-5555-5555-555555555555', 'Viewer', 'Read-only access', false);

INSERT INTO permissions (permission_id, permission_code, resource, action, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'warehouse.read', 'warehouse', 'read', 'View warehouse information'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'warehouse.write', 'warehouse', 'write', 'Create and update warehouse information'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'inventory.read', 'inventory', 'read', 'View inventory information'),
('dddddddd-dddd-dddd-dddd-dddddddddddddd', 'inventory.write', 'inventory', 'write', 'Adjust inventory levels'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'forecast.read', 'forecast', 'read', 'View forecasts'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'report.read', 'report', 'read', 'View reports');

INSERT INTO role_permissions (role_id, permission_id) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddddd'),
('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddddd'),
('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
('44444444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, is_active, is_superuser) VALUES
('12121212-1212-1212-1212-121212121212', 'admin.user', 'admin@example.com', 'pbkdf2_sha256$260000$demo$hash', 'Admin', 'User', true, true),
('13131313-1313-1313-1313-131313131313', 'warehouse.manager', 'manager@example.com', 'pbkdf2_sha256$260000$demo$hash', 'Maria', 'Lopez', true, false),
('14141414-1414-1414-1414-141414141414', 'planner.one', 'planner@example.com', 'pbkdf2_sha256$260000$demo$hash', 'Daniel', 'Kim', true, false);

INSERT INTO user_roles (user_id, role_id) VALUES
('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111'),
('13131313-1313-1313-1313-131313131313', '22222222-2222-2222-2222-222222222222'),
('14141414-1414-1414-1414-141414141414', '33333333-3333-3333-3333-333333333333');

INSERT INTO warehouses (warehouse_id, warehouse_code, name, address_line1, city, state_province, postal_code, country, capacity_volume, is_active) VALUES
('21212121-2121-2121-2121-212121212121', 'WH-001', 'North Hub', '100 Harbor Road', 'Chicago', 'IL', '60601', 'USA', 120000.00, true),
('22222222-2222-2222-2222-222222222222', 'WH-002', 'South Hub', '250 Industrial Ave', 'Dallas', 'TX', '75201', 'USA', 95000.00, true);

INSERT INTO warehouse_managers (warehouse_id, user_id, is_primary) VALUES
('21212121-2121-2121-2121-212121212121', '13131313-1313-1313-1313-131313131313', true),
('22222222-2222-2222-2222-222222222222', '13131313-1313-1313-1313-131313131313', false);

INSERT INTO categories (category_id, category_code, name, description) VALUES
('31313131-3131-3131-3131-313131313131', 'CAT-ELEC', 'Electronics', 'Electronic goods'),
('32323232-3232-3232-3232-323232323232', 'CAT-APP', 'Appliances', 'Home appliances');

INSERT INTO suppliers (supplier_id, supplier_code, name, contact_name, email, phone, city, country, is_active) VALUES
('41414141-4141-4141-4141-414141414141', 'SUP-001', 'Northwind Supply', 'David Chen', 'david@northwind.com', '555-0101', 'Seattle', 'USA', true),
('42424242-4242-4242-4242-424242424242', 'SUP-002', 'Harbor Goods', 'Alicia Park', 'alicia@harborgoods.com', '555-0102', 'Phoenix', 'USA', true);

INSERT INTO products (product_id, sku, barcode, name, description, category_id, supplier_id, unit_cost, selling_price, weight_kg, is_active) VALUES
('51515151-5151-5151-5151-515151515151', 'SKU-1001', 'BAR-1001', 'Smart Tablet', '10-inch business tablet', '31313131-3131-3131-3131-313131313131', '41414141-4141-4141-4141-414141414141', 220.00, 399.99, 0.650, true),
('52525252-5252-5252-5252-525252525252', 'SKU-1002', 'BAR-1002', 'Wireless Headset', 'Noise-cancelling headset', '31313131-3131-3131-3131-313131313131', '41414141-4141-4141-4141-414141414141', 80.00, 149.99, 0.200, true),
('53535353-5353-5353-5353-535353535353', 'SKU-2001', 'BAR-2001', 'Portable Cooler', 'Compact cooling unit', '32323232-3232-3232-3232-323232323232', '42424242-4242-4242-4242-424242424242', 110.00, 199.99, 2.500, true);

INSERT INTO inventory (inventory_id, product_id, warehouse_id, available_quantity, reserved_quantity, reorder_point, max_stock) VALUES
('61616161-6161-6161-6161-616161616161', '51515151-5151-5151-5151-515151515151', '21212121-2121-2121-2121-212121212121', 120, 10, 30, 200),
('62626262-6262-6262-6262-626262626262', '52525252-5252-5252-5252-525252525252', '21212121-2121-2121-2121-212121212121', 80, 5, 20, 120),
('63636363-6363-6363-6363-636363636363', '53535353-5353-5353-5353-535353535353', '22222222-2222-2222-2222-222222222222', 60, 4, 15, 100);

INSERT INTO orders (order_id, order_number, warehouse_id, user_id, order_type, status, order_date, expected_delivery_date, notes) VALUES
('71717171-7171-7171-7171-717171717171', 'ORD-1001', '21212121-2121-2121-2121-212121212121', '14141414-1414-1414-1414-141414141414', 'purchase', 'approved', CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', 'Initial stock replenishment'),
('72727272-7272-7272-7272-727272727272', 'ORD-1002', '22222222-2222-2222-2222-222222222222', '14141414-1414-1414-1414-141414141414', 'sales', 'processing', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 'Customer order');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
('71717171-7171-7171-7171-717171717171', '51515151-5151-5151-5151-515151515151', 40, 399.99),
('71717171-7171-7171-7171-717171717171', '53535353-5353-5353-5353-535353535353', 30, 199.99),
('72727272-7272-7272-7272-727272727272', '52525252-5252-5252-5252-525252525252', 10, 149.99);

INSERT INTO sales (sale_id, sale_number, order_id, warehouse_id, user_id, sale_date, status, payment_status, total_amount) VALUES
('81818181-8181-8181-8181-818181818181', 'SAL-1001', '72727272-7272-7272-7272-727272727272', '22222222-2222-2222-2222-222222222222', '13131313-1313-1313-1313-131313131313', CURRENT_DATE, 'completed', 'paid', 1499.90);

INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, discount_amount, line_total) VALUES
('81818181-8181-8181-8181-818181818181', '52525252-5252-5252-5252-525252525252', 10, 149.99, 0.00, 1499.90);

INSERT INTO transfers (transfer_id, transfer_number, from_warehouse_id, to_warehouse_id, initiated_by_user_id, status, transfer_date, notes) VALUES
('91919191-9191-9191-9191-919191919191', 'TRF-1001', '21212121-2121-2121-2121-212121212121', '22222222-2222-2222-2222-222222222222', '13131313-1313-1313-1313-131313131313', 'in_transit', CURRENT_DATE, 'Move stock to secondary hub');

INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES
('91919191-9191-9191-9191-919191919191', '51515151-5151-5151-5151-515151515151', 20);

INSERT INTO prediction_history (prediction_id, warehouse_id, product_id, model_name, prediction_type, predicted_value, confidence, input_window_start, input_window_end) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a', '21212121-2121-2121-2121-212121212121', '51515151-5151-5151-5151-515151515151', 'forecast_linear', 'demand', 150.00, 0.91, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP);

INSERT INTO notifications (notification_id, user_id, title, message, notification_type, is_read) VALUES
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b', '13131313-1313-1313-1313-131313131313', 'Inventory Alert', 'Reorder point reached for Smart Tablet', 'warning', false);

INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details) VALUES
('12121212-1212-1212-1212-121212121212', 'inventory', '61616161-6161-6161-6161-616161616161', 'updated', '{"field":"available_quantity","value":120}');

INSERT INTO settings (setting_key, setting_value, setting_type, description, is_encrypted) VALUES
('warehouse.default_timezone', 'UTC', 'string', 'Default timezone for warehouse operations', false),
('forecast.horizon_days', '14', 'integer', 'Forecast horizon in days', false),
('auth.jwt_expiry_minutes', '60', 'integer', 'JWT access token expiry', false);
