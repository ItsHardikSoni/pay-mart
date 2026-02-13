CREATE OR REPLACE FUNCTION process_new_order(
    p_order_number TEXT,
    p_username TEXT,
    p_total_amount NUMERIC,
    p_cart_items JSONB,
    p_payment_mode TEXT,
    p_order_time TIME,
    p_order_date DATE,
    p_razorpay_payment_id TEXT,
    p_cashier_name TEXT,
    p_razorpay_signature TEXT
)
RETURNS VOID AS $$
DECLARE
    item RECORD;
BEGIN
    -- Insert the new order into the order_history table
    INSERT INTO public.order_history (
        order_number,
        username,
        total_amount,
        items,
        payment_mode,
        order_time,
        order_date,
        razorpay_payment_id,
        cashier_name,
        razorpay_signature
    )
    VALUES (
        p_order_number,
        p_username,
        p_total_amount,
        p_cart_items,
        p_payment_mode,
        p_order_time,
        p_order_date,
        p_razorpay_payment_id,
        p_cashier_name,
        p_razorpay_signature
    );

    -- Loop through cart items and update stock
    -- IMPORTANT: Changed 'id INT' to 'id TEXT' to handle UUIDs passed as strings.
    FOR item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(id TEXT, quantity INT)
    LOOP
        UPDATE public.products
        SET stock = stock - item.quantity
        WHERE id = item.id::uuid; -- Explicitly cast the text ID to UUID for comparison
    END LOOP;
END;
$$ LANGUAGE plpgsql;