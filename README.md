# Audience Activation Service

ระบบจัดการกลุ่มลูกค้า สร้างงานส่งข้อความ SMS และติดตามผลรายบุคคล

## Tech Stack

- Backend: NestJS, TypeScript, TypeORM
- Frontend: Next.js, React, Tailwind CSS
- Database: PostgreSQL 17
- Local database environment: Docker Compose
- Tested with Node.js 24.15.0 and npm 11.12.1

## Features

- รับ Segment-style Identify audience events ผ่าน webhook
- เพิ่มหรืออัปเดตข้อมูลลูกค้าและสมาชิกกลุ่ม
- แสดงกลุ่มลูกค้าและรายชื่อสมาชิกบนเว็บ
- สร้างงานส่ง SMS พร้อมบันทึกข้อมูลผู้รับ ณ เวลาสร้างงาน
- ประมวลผลงานเบื้องหลังผ่าน worker
- แสดงสถานะ Pending, Processing, Success และ Failed
- แสดงผลการส่งและข้อผิดพลาดรายบุคคล
- เปิดดูประวัติการส่งย้อนหลัง

## Project Structure

- `backend/`: NestJS API, worker, mock SMS endpoint และ migrations
- `frontend/`: Next.js web application
- `compose.yaml`: PostgreSQL สำหรับรันในเครื่อง

## Prerequisites

- Node.js 24.15.0
- npm
- Docker Desktop ที่เปิดใช้งานอยู่

หากใช้ NVM ให้รันจากโฟลเดอร์หลัก:

```bash
nvm install
nvm use
```

## Local Setup

คำสั่งต่อไปนี้เริ่มจากโฟลเดอร์หลักของโปรเจกต์

### 1. Start PostgreSQL

```bash
docker compose up -d --wait
```

ฐานข้อมูลเปิดที่ `127.0.0.1:5432` และเก็บข้อมูลใน Docker volume

### 2. Install Dependencies

```bash
npm --prefix backend ci
npm --prefix frontend ci
```

### 3. Configure Environment Variables

สำหรับการติดตั้งครั้งแรก:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend environment variables:

| Variable | Description |
| --- | --- |
| PORT | พอร์ต Backend ค่า local คือ 3001 |
| DATABASE_URL | PostgreSQL connection string |
| MOCK_SMS_URL | URL ของ mock SMS endpoint |

Frontend environment variables:

| Variable | Description |
| --- | --- |
| BACKEND_URL | Backend URL ที่ Next.js ใช้ proxy API requests |

ค่าฐานข้อมูลใน `.env.example` เป็นค่าตัวอย่างสำหรับ local development

### 4. Run Database Migrations

```bash
cd backend
npm run migration:run
cd ..
```

ระบบใช้ migrations จัดการ schema และปิด TypeORM synchronize

### 5. Start Backend

เปิด Terminal แรก:

```bash
cd backend
npm run start:dev
```

ตรวจการเชื่อมต่อฐานข้อมูล:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

### 6. Start Frontend

เปิด Terminal อีกแท็บจากโฟลเดอร์หลัก:

```bash
cd frontend
npm run dev -- --port 3000
```

เปิด http://localhost:3000

Frontend เรียก `/api/audiences` และ `/api/activations` ผ่าน Next.js rewrites ไปยัง Backend

## Demo: Receive an Audience Member

ตัวอย่างนี้จำลอง webhook ด้วย curl ไม่ใช่การเชื่อมบัญชี Segment จริง

```bash
curl -i -X POST http://localhost:3001/webhooks/segment \
  -H "Content-Type: application/json" \
  -d '{
    "type": "identify",
    "userId": "customer_segment_demo_001",
    "context": {
      "personas": {
        "computation_class": "audience",
        "computation_id": "aud_segment_demo",
        "computation_key": "segment_demo"
      }
    },
    "traits": {
      "name": "Segment Demo Customer",
      "phone": "+12025550102",
      "email": "segment-demo@example.com",
      "segment_demo": true
    }
  }'
```

Expected response: HTTP 200 พร้อม `audienceId`, `customerId` และ `membership: "included"`

- `computation_id` ใช้เป็น external ID ของกลุ่ม
- `computation_key` ระบุชื่อ trait ที่เก็บสถานะสมาชิก
- `userId` ใช้เป็น external ID ของลูกค้า
- Membership `true` เพิ่มสมาชิก และ `false` นำสมาชิกออกจากกลุ่ม
- การนำสมาชิกออกไม่ลบข้อมูลลูกค้าหรือประวัติการส่งเดิม
- การส่งข้อมูลสมาชิกเดิมซ้ำไม่สร้างสมาชิกซ้ำ

เมื่อส่ง webhook แล้ว รีเฟรชหน้าเว็บและเลือกกลุ่ม `segment_demo`

## Demo: Send Mock SMS

1. เลือกกลุ่มที่มีสมาชิก
2. พิมพ์ข้อความ
3. กดส่ง SMS
4. รอผลการประมวลผลบนหน้าเว็บ
5. กดรีเฟรชประวัติเพื่อดูรายการล่าสุด

Mock SMS ไม่ส่งข้อความจริงและไม่ใช้บริการ SMS ภายนอก

| Input | Result |
| --- | --- |
| เบอร์ที่ถูกต้องและไม่ได้ลงท้ายด้วย 0000 | Success |
| เบอร์ที่ถูกต้องและลงท้ายด้วย 0000 | Failed: MOCK_PROVIDER_REJECTED |
| ผู้รับไม่มีเบอร์หรือรูปแบบเบอร์ไม่ถูกต้อง | Worker บันทึก Failed |

สร้างลูกค้าทดสอบความล้มเหลวได้โดยส่ง webhook ตัวอย่างอีกครั้ง
โดยเปลี่ยน `userId` เป็น `customer_segment_demo_failed`,
ชื่อเป็น `Failed Demo Customer` และเบอร์เป็น `+12025550000`

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /health | ตรวจ Backend และฐานข้อมูล |
| GET | /audiences | รายการกลุ่มลูกค้า |
| POST | /audiences | เพิ่มหรืออัปเดตกลุ่ม |
| GET | /audiences/:audienceId/customers | รายชื่อสมาชิกกลุ่ม |
| POST | /audiences/:audienceId/customers | เพิ่มหรืออัปเดตลูกค้าและเพิ่มเข้ากลุ่ม |
| POST | /webhooks/segment | รับ Identify audience event |
| POST | /activations | สร้างงานส่งข้อความ |
| GET | /activations | รายการงานส่งข้อความ |
| GET | /activations/:id | รายละเอียดงานและผลรายบุคคล |
| POST | /mock-sms/send | จำลอง SMS provider |

ตัวอย่าง request สำหรับสร้างงาน:

```json
{
  "audienceId": "<UUID จาก API>",
  "message": "ข้อความทดสอบ"
}
```

เมื่อสร้างงานสำเร็จ API ตอบ HTTP 202
กลุ่มที่ไม่มีสมาชิกจะถูกปฏิเสธด้วย HTTP 400

## Database Design

- `audiences`: ข้อมูลกลุ่มลูกค้า
- `customers`: ข้อมูลลูกค้า
- `audience_members`: ความสัมพันธ์แบบ many-to-many
- `activations`: งานส่งข้อความและสถานะรวม
- `activation_recipients`: ข้อมูลผู้รับและผลการส่งรายบุคคล
- `migrations`: ประวัติการรัน migrations

External IDs ของกลุ่มและลูกค้ามี unique constraints
และสมาชิกกลุ่มใช้ composite primary key เพื่อป้องกันสมาชิกซ้ำ

## Processing and Design Decisions

### Recipient Snapshot

สร้าง activation และรายการผู้รับภายใน transaction
โดยใช้ isolation level REPEATABLE READ

ระบบบันทึกชื่อกลุ่ม ชื่อลูกค้า และเบอร์โทร ณ เวลาสร้างงาน
การแก้ข้อมูลหรือสมาชิกภายหลังจึงไม่เปลี่ยนรายการผู้รับของงานเดิม

### Background Worker

API บันทึกงานเป็น Pending แล้วตอบกลับ
worker ตรวจงานทุกประมาณ 2 วินาทีและเปลี่ยนสถานะเป็น Processing

ใช้ PostgreSQL session advisory lock เพื่อให้ worker
ที่ใช้ฐานข้อมูลและ lock key เดียวกันประมวลผลคิวได้ทีละตัว

worker ข้ามผู้รับที่มีผล Success หรือ Failed แล้ว
และสามารถกลับมาประมวลผลงาน Pending หรือ Processing ที่ค้างอยู่ได้

### Overall Status

- Success: ผู้รับทุกคนสำเร็จ
- Failed: มีผู้รับล้มเหลวอย่างน้อยหนึ่งคน

งานที่มีทั้งผลสำเร็จและล้มเหลวจึงมีสถานะรวม Failed
โดยยังเก็บผลสำเร็จของผู้รับคนอื่นไว้ครบ

### Frontend Status Updates

หน้ารายละเอียดใช้ polling และหยุดเมื่อได้สถานะสุดท้าย
ส่วนรายการประวัติอัปเดตเมื่อเปิดหน้าใหม่หรือกดรีเฟรชประวัติ

## Verification Performed

- Backend build ผ่าน
- Frontend build และ TypeScript check ผ่าน
- เชื่อมต่อ PostgreSQL และรัน migrations ได้
- รับ webhook จำลองและแสดงลูกค้าบนหน้าเว็บได้
- สร้างงานผ่านหน้าเว็บและส่งผ่าน mock สำเร็จทั้งหมดได้
- ทดสอบงานที่มีทั้งผู้รับสำเร็จและล้มเหลวได้
- แสดงประวัติและรายละเอียดผลรายบุคคลได้

รายการข้างต้นเป็นการตรวจ build และทดสอบด้วยมือ
ไม่ได้หมายถึง automated test suite ครอบคลุมทุกกรณี

คำสั่ง build จากโฟลเดอร์หลัก:

```bash
npm --prefix backend run build
npm --prefix frontend run build
```

## Assumptions and Limitations

- การเชื่อมต่อ Segment ปัจจุบันทดสอบด้วย payload จำลอง
  ยังไม่ได้ตรวจการรับ events จากบัญชี Segment จริง
- รองรับ Identify audience events ตามรูปแบบตัวอย่างและสมมติว่าใช้ workspace เดียว
- ยังไม่มีการตรวจลายเซ็นหรือยืนยันแหล่งที่มาของ webhook
- ยังไม่จัดการ events ที่เข้ามาผิดลำดับตามเวลา
- ยังไม่มีระบบ login และ authorization
- POST /activations แต่ละครั้งสร้างงานใหม่ ยังไม่มี API idempotency key
- Mock SMS คืน message ID แบบ deterministic แต่ไม่ได้รับประกัน
  exactly-once delivery เมื่อนำไปใช้กับ SMS provider จริง
- ผล Failed รายผู้รับยังไม่มี automatic retry
- ประมวลผลคิวทีละงาน และยังไม่มี pagination สำหรับรายการข้อมูล
- เวอร์ชันนี้ใช้สำหรับ local demo ต้องเพิ่มการควบคุมการเข้าถึง
  และ webhook verification ก่อนเปิดให้เข้าถึงจากภายนอก

## Stop Local Services

หยุด Backend และ Frontend ด้วย Ctrl+C ใน Terminal ของแต่ละส่วน

หยุด PostgreSQL จากโฟลเดอร์หลัก:

```bash
docker compose stop
```

ข้อมูลฐานข้อมูลยังอยู่ใน Docker volume