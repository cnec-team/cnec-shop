-- Stock management RPC functions with row-level locking to prevent race conditions

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS JSONB AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT stock INTO current_stock FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN '{"success": false, "reason": "product_not_found"}'::JSONB;
  END IF;

  IF current_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_stock', 'available', current_stock);
  END IF;

  UPDATE products SET stock = stock - p_quantity, updated_at = NOW() WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true, 'remaining', current_stock - p_quantity);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS JSONB AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN '{"success": false, "reason": "product_not_found"}'::JSONB;
  END IF;

  UPDATE products SET stock = stock + p_quantity, updated_at = NOW() WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true, 'remaining', current_stock + p_quantity);
END;
$$ LANGUAGE plpgsql;
