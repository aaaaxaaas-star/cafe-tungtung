// Database Adapter Layer (Supabase / LocalStorage Fallback)

const MOCK_PRODUCTS = [
  { id: "p1", name: "Espresso (เน€เธโฌเน€เธเธเน€เธเธเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธย)", category: "coffee", price: 50.0, points_reward: 1.0, is_available: true },
  { id: "p2", name: "Americano (เน€เธเธเน€เธโฌเน€เธเธเน€เธเธเน€เธเธ”เน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธย)", category: "coffee", price: 55.0, points_reward: 1.0, is_available: true },
  { id: "p3", name: "Latte (เน€เธเธ…เน€เธเธ’เน€เธโฌเน€เธโ€ขเน€เธย)", category: "coffee", price: 65.0, points_reward: 1.0, is_available: true },
  { id: "p4", name: "Cappuccino (เน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธยเน€เธเธ”เน€เธยเน€เธยเน€เธย)", category: "coffee", price: 65.0, points_reward: 1.0, is_available: true },
  { id: "p5", name: "Caramel Macchiato (เน€เธยเน€เธเธ’เน€เธเธเน€เธเธ’เน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ”เน€เธเธเน€เธเธ’เน€เธยเน€เธโ€ขเน€เธย)", category: "coffee", price: 75.0, points_reward: 1.0, is_available: true },
  { id: "p6", name: "Butter Croissant (เน€เธยเน€เธเธเน€เธเธ‘เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธโ€ขเน€เธยเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธโ€)", category: "bakery", price: 60.0, points_reward: 0.0, is_available: true },
  { id: "p7", name: "Chocolate Cake (เน€เธโฌเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ…เน€เธโ€ข)", category: "bakery", price: 85.0, points_reward: 0.0, is_available: true },
  { id: "p8", name: "Almond Croissant (เน€เธยเน€เธเธเน€เธเธ‘เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธโ€ขเน€เธยเน€เธเธเน€เธเธ‘เน€เธเธ…เน€เธเธเน€เธเธเน€เธยเน€เธโ€เน€เธย)", category: "bakery", price: 75.0, points_reward: 0.0, is_available: true },
  { id: "p9", name: "Blueberry Muffin (เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ”เน€เธยเน€เธยเน€เธเธ…เน€เธเธเน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธ•เน€เธย)", category: "bakery", price: 55.0, points_reward: 0.0, is_available: true },
];

const MOCK_CUSTOMERS = [
  { id: "c1", name: "เน€เธเธเน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€เน€เธเธ”เน€เธย เน€เธยเน€เธยเน€เธโ€เน€เธเธ•", phone: "0812345678", points: 25.0, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c2", name: "เน€เธเธเน€เธเธเน€เธเธเน€เธยเน€เธเธ”เน€เธย เน€เธเธเน€เธเธ‘เน€เธยเน€เธเธเน€เธยเน€เธย", phone: "0898765432", points: 8.0, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c3", name: "เน€เธเธเน€เธเธเน€เธยเน€เธเธ’เน€เธเธ เน€เธเธเน€เธเธเน€เธโ€เน€เธยเน€เธเธ‘เน€เธยเน€เธเธเน€เธเธเน€เธย", phone: "0855551234", points: 0.0, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

class DBAdapter {
  constructor() {
    this.isDemo = true;
    this.supabase = null;
  }

  async init() {
    const config = window.SUPABASE_CONFIG;
    if (config && config.url && config.anonKey && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(config.url, config.anonKey);
        // Test connection
        const { data, error } = await this.supabase.from("products").select("count", { count: "exact", head: true });
        if (!error) {
          this.isDemo = false;
          console.log("Connected to Supabase successfully.");
          return;
        } else {
          console.warn("Failed to connect to Supabase (check tables exist). Falling back to LocalStorage.", error);
        }
      } catch (err) {
        console.error("Supabase initialization error. Falling back to LocalStorage.", err);
      }
    }
    
    console.log("Running in Demo Mode (LocalStorage Database).");
    this.isDemo = true;
    this.initMockDatabase();
  }

  initMockDatabase() {
    if (!localStorage.getItem("pos_products")) {
      localStorage.setItem("pos_products", JSON.stringify(MOCK_PRODUCTS));
    }
    if (!localStorage.getItem("pos_customers")) {
      localStorage.setItem("pos_customers", JSON.stringify(MOCK_CUSTOMERS));
    }
    if (!localStorage.getItem("pos_orders")) {
      this.seedMockOrders();
    }
    if (!localStorage.getItem("pos_point_transactions")) {
      localStorage.setItem("pos_point_transactions", JSON.stringify([]));
    }
  }

  seedMockOrders() {
    const products = JSON.parse(localStorage.getItem("pos_products")) || MOCK_PRODUCTS;
    const customers = JSON.parse(localStorage.getItem("pos_customers")) || MOCK_CUSTOMERS;
    const orders = [];
    const orderItems = [];
    const transactions = [];

    const cashiers = ["เน€เธเธเน€เธเธเน€เธยเน€เธเธ’เน€เธเธ (Cashier A)", "เน€เธเธเน€เธเธเน€เธเธเน€เธเธเน€เธเธ• (Cashier B)"];
    const paymentMethods = ["cash", "qr_code"];

    // Seed data for the last 7 days
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Random number of orders per day (3 to 8)
      const numOrders = Math.floor(Math.random() * 6) + 3;
      
      for (let j = 0; j < numOrders; j++) {
        // Set random hour
        const orderDate = new Date(date);
        orderDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

        const orderId = `o_${orderDate.getTime()}_${j}`;
        const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
        const isLoyalty = Math.random() > 0.4;
        const customer = isLoyalty ? customers[Math.floor(Math.random() * customers.length)] : null;
        
        // Random items (1 to 4)
        const numItems = Math.floor(Math.random() * 4) + 1;
        let total = 0;
        let pointsEarned = 0;

        for (let k = 0; k < numItems; k++) {
          const prod = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          const subtotal = prod.price * qty;
          total += subtotal;

          orderItems.push({
            id: `oi_${orderId}_${k}`,
            order_id: orderId,
            product_id: prod.id,
            quantity: qty,
            unit_price: prod.price,
            subtotal: subtotal
          });

          if (customer && prod.category === "coffee") {
            pointsEarned += prod.points_reward * qty;
          }
        }

        let discount = 0;
        let pointsRedeemed = 0;
        
        // Simulating random points redemption
        if (customer && customer.points >= 10 && Math.random() > 0.7) {
          pointsRedeemed = 10;
          discount = 60.0; // 10 points = 60 THB discount
          if (total < discount) {
            discount = total;
          }
        }

        const finalAmount = total - discount;
        const payMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        orders.push({
          id: orderId,
          employee_name: cashier,
          customer_id: customer ? customer.id : null,
          total_amount: total,
          discount_amount: discount,
          final_amount: finalAmount,
          payment_method: payMethod,
          points_earned: pointsEarned,
          points_redeemed: pointsRedeemed,
          created_at: orderDate.toISOString()
        });

        if (customer) {
          // Track points
          if (pointsEarned > 0) {
            transactions.push({
              id: `t_earn_${orderId}`,
              customer_id: customer.id,
              points: pointsEarned,
              transaction_type: "earn",
              order_id: orderId,
              created_at: orderDate.toISOString()
            });
            customer.points += pointsEarned;
          }
          if (pointsRedeemed > 0) {
            transactions.push({
              id: `t_redeem_${orderId}`,
              customer_id: customer.id,
              points: -pointsRedeemed,
              transaction_type: "redeem",
              order_id: orderId,
              created_at: orderDate.toISOString()
            });
            customer.points -= pointsRedeemed;
          }
        }
      }
    }

    localStorage.setItem("pos_orders", JSON.stringify(orders));
    localStorage.setItem("pos_order_items", JSON.stringify(orderItems));
    localStorage.setItem("pos_customers", JSON.stringify(customers));
    localStorage.setItem("pos_point_transactions", JSON.stringify(transactions));
  }

  // --- PRODUCTS ---
  async getProducts() {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("products").select("*").order("name", { ascending: true });
      if (!error) return data;
      console.error("Supabase getProducts error, using demo data:", error);
    }
    return JSON.parse(localStorage.getItem("pos_products")) || [];
  }

  async addProduct(product) {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("products").insert([product]).select();
      if (!error) return data[0];
      throw error;
    }
    const products = JSON.parse(localStorage.getItem("pos_products")) || [];
    const newProduct = {
      ...product,
      id: "p_" + Date.now(),
      is_available: true,
      created_at: new Date().toISOString()
    };
    products.push(newProduct);
    localStorage.setItem("pos_products", JSON.stringify(products));
    return newProduct;
  }

  async updateProduct(id, updatedFields) {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("products").update(updatedFields).eq("id", id).select();
      if (!error) return data[0];
      throw error;
    }
    const products = JSON.parse(localStorage.getItem("pos_products")) || [];
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    products[index] = { ...products[index], ...updatedFields };
    localStorage.setItem("pos_products", JSON.stringify(products));
    return products[index];
  }

  // --- CUSTOMERS ---
  async getCustomers() {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("customers").select("*").order("name", { ascending: true });
      if (!error) return data;
      console.error("Supabase getCustomers error, using demo data:", error);
    }
    return JSON.parse(localStorage.getItem("pos_customers")) || [];
  }

  async getCustomerByPhone(phone) {
    const formattedPhone = phone.replace(/[^0-9]/g, "");
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("customers").select("*").eq("phone", phone).maybeSingle();
      if (!error) return data;
      console.error("Supabase getCustomerByPhone error:", error);
    }
    const customers = JSON.parse(localStorage.getItem("pos_customers")) || [];
    return customers.find(c => c.phone.replace(/[^0-9]/g, "") === formattedPhone) || null;
  }

  async addCustomer(customer) {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("customers").insert([customer]).select();
      if (!error) return data[0];
      throw error;
    }
    const customers = JSON.parse(localStorage.getItem("pos_customers")) || [];
    const exists = customers.find(c => c.phone === customer.phone);
    if (exists) throw new Error("เน€เธโฌเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธโ€”เน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธยเน€เธยเน€เธเธ•เน€เธยเน€เธโ€“เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธเธ…เน€เธยเน€เธเธ");

    const newCustomer = {
      ...customer,
      id: "c_" + Date.now(),
      points: 0.0,
      created_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    localStorage.setItem("pos_customers", JSON.stringify(customers));
    return newCustomer;
  }

  async updateCustomerPoints(id, pointsDelta) {
    if (!this.isDemo) {
      // In production we perform atomic update or get current points and update
      const { data: customer, error: getErr } = await this.supabase.from("customers").select("points").eq("id", id).single();
      if (getErr) throw getErr;
      const newPoints = Math.max(0, parseFloat(customer.points) + pointsDelta);
      const { data, error } = await this.supabase.from("customers").update({ points: newPoints }).eq("id", id).select();
      if (!error) return data[0];
      throw error;
    }
    const customers = JSON.parse(localStorage.getItem("pos_customers")) || [];
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    
    customers[index].points = Math.max(0, parseFloat(customers[index].points) + pointsDelta);
    localStorage.setItem("pos_customers", JSON.stringify(customers));
    return customers[index];
  }

  // --- ORDERS ---
  async getOrders() {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!error) return data;
      console.error("Supabase getOrders error:", error);
    }
    return JSON.parse(localStorage.getItem("pos_orders")) || [];
  }

  async getOrderItems(orderId) {
    if (!this.isDemo) {
      const { data, error } = await this.supabase.from("order_items").select("*, products(name)").eq("order_id", orderId);
      if (!error) return data;
      console.error("Supabase getOrderItems error:", error);
    }
    const items = JSON.parse(localStorage.getItem("pos_order_items")) || [];
    const products = JSON.parse(localStorage.getItem("pos_products")) || [];
    
    return items
      .filter(item => item.order_id === orderId)
      .map(item => {
        const prod = products.find(p => p.id === item.product_id);
        return {
          ...item,
          products: { name: prod ? prod.name : "Unknown Product" }
        };
      });
  }

  async createOrder(orderData, items) {
    if (!this.isDemo) {
      // Create transaction block
      // 1. Create order
      const { data: newOrder, error: orderErr } = await this.supabase.from("orders").insert([orderData]).select();
      if (orderErr) throw orderErr;
      
      const createdOrder = newOrder[0];

      // 2. Add order items
      const itemsToInsert = items.map(item => ({
        order_id: createdOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }));
      const { error: itemsErr } = await this.supabase.from("order_items").insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      // 3. Update customer points & log point transactions
      if (orderData.customer_id) {
        const delta = parseFloat(orderData.points_earned) - parseFloat(orderData.points_redeemed);
        await this.updateCustomerPoints(orderData.customer_id, delta);
        
        const logs = [];
        if (orderData.points_earned > 0) {
          logs.push({
            customer_id: orderData.customer_id,
            points: orderData.points_earned,
            transaction_type: "earn",
            order_id: createdOrder.id
          });
        }
        if (orderData.points_redeemed > 0) {
          logs.push({
            customer_id: orderData.customer_id,
            points: -orderData.points_redeemed,
            transaction_type: "redeem",
            order_id: createdOrder.id
          });
        }
        if (logs.length > 0) {
          await this.supabase.from("point_transactions").insert(logs);
        }
      }
      return createdOrder;
    }

    // Demo Mode implementation
    const orders = JSON.parse(localStorage.getItem("pos_orders")) || [];
    const orderItems = JSON.parse(localStorage.getItem("pos_order_items")) || [];
    const transactions = JSON.parse(localStorage.getItem("pos_point_transactions")) || [];

    const newOrderId = "o_" + Date.now();
    const createdOrder = {
      ...orderData,
      id: newOrderId,
      created_at: new Date().toISOString()
    };

    orders.unshift(createdOrder); // Add to beginning

    items.forEach((item, idx) => {
      orderItems.push({
        id: `oi_${newOrderId}_${idx}`,
        order_id: newOrderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        created_at: createdOrder.created_at
      });
    });

    if (orderData.customer_id) {
      const delta = parseFloat(orderData.points_earned) - parseFloat(orderData.points_redeemed);
      await this.updateCustomerPoints(orderData.customer_id, delta);

      if (orderData.points_earned > 0) {
        transactions.push({
          id: `t_earn_${newOrderId}`,
          customer_id: orderData.customer_id,
          points: orderData.points_earned,
          transaction_type: "earn",
          order_id: newOrderId,
          created_at: createdOrder.created_at
        });
      }
      if (orderData.points_redeemed > 0) {
        transactions.push({
          id: `t_redeem_${newOrderId}`,
          customer_id: orderData.customer_id,
          points: -orderData.points_redeemed,
          transaction_type: "redeem",
          order_id: newOrderId,
          created_at: createdOrder.created_at
        });
      }
    }

    localStorage.setItem("pos_orders", JSON.stringify(orders));
    localStorage.setItem("pos_order_items", JSON.stringify(orderItems));
    localStorage.setItem("pos_point_transactions", JSON.stringify(transactions));

    return createdOrder;
  }

  async getCustomerPointHistory(customerId) {
    if (!this.isDemo) {
      const { data, error } = await this.supabase
        .from("point_transactions")
        .select("*, orders(total_amount)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (!error) return data;
      console.error("Supabase getPointTransactions error:", error);
    }
    
    const transactions = JSON.parse(localStorage.getItem("pos_point_transactions")) || [];
    const orders = JSON.parse(localStorage.getItem("pos_orders")) || [];
    
    return transactions
      .filter(t => t.customer_id === customerId)
      .map(t => {
        const order = orders.find(o => o.id === t.order_id);
        return {
          ...t,
          orders: order ? { total_amount: order.total_amount } : null
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

window.db = new DBAdapter();
