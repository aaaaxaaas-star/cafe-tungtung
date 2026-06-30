# ระบบระบบเครื่องขายหน้าร้าน (Coffee Shop POS & Loyalty System)

ระบบจัดการขายหน้าร้าน (POS) สำหรับร้านกาแฟและเบเกอรี่ พร้อมระบบคำนวณแต้มสะสม (Loyalty Program) สำหรับสินค้ากลุ่มกาแฟ, ระบบลงชื่อเข้าใช้งานของพนักงาน และหน้าแดชบอร์ดสรุปยอดขายในรูปแบบกราฟ

---

## 🚀 วิธีการเข้าใช้งาน (Quick Start)

ระบบออกแบบมาให้เป็น **Zero-Build Single Page Application (SPA)** คุณสามารถใช้งานได้ทันทีโดยไม่ต้องทำการ compile หรือรัน `npm install` ใดๆ:

1. ดับเบิ้ลคลิกเพื่อเปิดไฟล์ `index.html` ในเว็บบราวเซอร์ของคุณ (เช่น Chrome, Edge, Firefox, Safari)
2. ระบบจะทำการเปิดใช้งานในโหมด **Demo Mode (เก็บข้อมูลใน Local Storage ของบราวเซอร์)** โดยอัตโนมัติ
3. ใช้ข้อมูลนี้เพื่อล็อกอินสำหรับทดสอบระบบ:
   - **ชื่อผู้ใช้งาน (Username):** `admin`
   - **รหัสผ่าน (Password):** `admin`

---

## ⚙️ วิธีการเชื่อมต่อฐานข้อมูล Supabase (Production Mode)

หากคุณต้องการจัดเก็บข้อมูลบนคลาวด์ผ่าน Supabase ให้ดำเนินการตามขั้นตอนดังนี้:

### 1. การสร้างตารางใน Supabase
เปิดแถบ **SQL Editor** ใน Supabase Dashboard ของคุณ แล้วทำการสร้างตารางด้วยสคริปต์นี้:

```sql
-- 1. ตารางสินค้า (Products)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'coffee', 'bakery'
  price DECIMAL(10, 2) NOT NULL,
  points_reward DECIMAL(5, 2) DEFAULT 0.0, -- คะแนนสะสมเมื่อสั่งซื้อ (เช่น กาแฟให้ 1.0, เบเกอรี่ให้ 0.0)
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ตารางสมาชิก (Customers)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  points DECIMAL(10, 2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ตารางประวัติบิลการขาย (Orders)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL, -- บันทึกชื่อพนักงานที่ทำรายการ
  customer_id UUID REFERENCES customers(id), -- เป็น NULL ได้ในกรณีซื้อแบบไม่เข้าระบบสมาชิก (Guest Checkout)
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0.0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash' หรือ 'qr_code'
  points_earned DECIMAL(10, 2) DEFAULT 0.0,
  points_redeemed DECIMAL(10, 2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ตารางรายการสินค้าในบิล (Order Items)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ตารางประวัติคะแนนสมาชิก (Point Transactions Log)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  points DECIMAL(10, 2) NOT NULL, -- ค่าบวกคือได้รับ, ค่าลบคือใช้แลก
  transaction_type VARCHAR(20) NOT NULL, -- 'earn' หรือ 'redeem'
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. กำหนดคีย์เชื่อมต่อใน `config.js`
เปิดไฟล์ `config.js` ในโฟลเดอร์โปรเจกต์ของคุณ และระบุ URL และ Anon Key ของ Supabase ดังนี้:

```javascript
window.SUPABASE_CONFIG = {
  url: "https://xxxxxx.supabase.co", // นำมาจากโปรเจกต์ Supabase ของคุณ
  anonKey: "eyJhbGciOiJIUzI1NiIsIn..." // Anon Public Key ของคุณ
};
```

*เมื่อรีเฟรชบราวเซอร์ ระบบจะเชื่อมต่อกับ Supabase อัตโนมัติ (แถบแจ้งเตือนสีทอง "Demo Mode" ด้านบนหน้าแดชบอร์ดจะหายไป)*

---

## 🎨 ฟังก์ชันเด่นของระบบ (Key Features)

- **หน้าขายหน้าร้าน (POS View):**
  - เลือกแสดงสินค้าตามหมวดหมู่ (กาแฟ, เบเกอรี่) หรือค้นหาจากรายชื่อสินค้า
  - คำนวณแต้มสะสมโดยอัตโนมัติ (กาแฟแต่ละเมนูสามารถกำหนดสิทธิ์คะแนนแยกได้, เบเกอรี่ไม่ได้รับคะแนน)
  - ค้นหาสมาชิกด้วยเบอร์โทรศัพท์เพื่อผูกออเดอร์
  - หากลูกค้ามีแต้มสะสม **10 แต้มขึ้นไป** จะมีตัวเลือกให้ติ๊ก "ใช้คะแนนแลกส่วนลด 60 บาท" (คำนวณและลดราคาทันที)
  - เลือกระหว่างจ่ายเงินสด (คำนวณเงินทอน) หรือสแกน QR (ระบบจำลองการสร้าง QR code และจำลองการตรวจสอบยอดชำระสำเร็จ)
  - แสดงหน้าต่างจำลองการพิมพ์ใบเสร็จความร้อน (Thermal Print Simulation)
- **ระบบสมาชิก (Loyalty Module):**
  - สมัครสมาชิกใหม่ได้ทันทีจากเมนูหรือขณะทำออเดอร์
  - ค้นหาลูกค้าเพื่อตรวจเช็คคะแนนคงเหลือ
  - คลิกเลือกชื่อลูกค้าเพื่อแสดงประวัติการรับ/ใช้แต้มสะสมทั้งหมดในรูปแบบตารางแจกแจงละเอียด
- **จัดการสินค้า (Inventory Management):**
  - แสดงรายการสินค้า ราคา และสิทธิ์คะแนนสะสม
  - สวิตช์ปิด/เปิดความพร้อมขาย (Availability) สำหรับสินค้าที่หมดชั่วคราว
  - เพิ่มหรือแก้ไขราคาสินค้า เมนู และคะแนนสะสมผ่านฟอร์มได้ทันที
- **สรุปรายงานหลังร้าน (Dashboard Panel):**
  - แสดง KPI สรุปผลยอดขายประจำวัน, จำนวนบิลทั้งหมด, สมาชิกใหม่ และยอดรวมแต้มสะสมในระบบ
  - กราฟเส้นแสดงสถิติยอดขาย 7 วันย้อนหลัง
  - สรุป 5 สินค้ายอดนิยมที่มียอดขายสูงสุด
  - ตารางประวัติการขายแบบเรียลไทม์ สามารถกดปุ่มดูรายละเอียดประวัติใบเสร็จย้อนหลังได้
