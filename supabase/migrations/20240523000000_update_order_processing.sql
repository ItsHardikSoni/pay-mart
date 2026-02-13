-- Add the razorpay_signature column to your order_history table
ALTER TABLE public.order_history
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Create or replace the database function to process new orders
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
    p_razorpay_signature TEXT -- Added the new signature parameter
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
        razorpay_signature -- Ensure the column exists
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

    -- Loop through the items in the cart and update the stock levels in the products table
    FOR item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(id INT, quantity INT)
    LOOP
        UPDATE public.products
        SET stock = stock - item.quantity
        WHERE id = item.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
