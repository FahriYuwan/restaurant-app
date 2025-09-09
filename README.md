# 📱 Cafe Order - Aplikasi Pemesanan Digital Cafe

Aplikasi PWA (Progressive Web App) untuk pemesanan cafe yang memungkinkan pelanggan memesan langsung dari meja mereka menggunakan QR code.

## ✨ Fitur Utama

### 👥 Customer (PWA)
- 📱 **QR Code Scanning** - Scan QR code unik di setiap meja
- 🍽️ **Menu Digital** - Browse menu dengan foto, harga, dan deskripsi
- 🛒 **Keranjang Pemesanan** - Tambah item, catatan khusus, dan checkout
- 📊 **Tracking Status** - Pantau status pesanan secara realtime
- 💾 **Offline Support** - Tetap bisa browse menu saat offline
- 📲 **Install PWA** - Install sebagai aplikasi di home screen

### 👨‍💼 Admin/Barista Dashboard
- 📋 **Order Management** - Kelola pesanan dengan update status realtime
- 🔊 **Sound Notifications** - Notifikasi suara untuk pesanan baru
- 🍕 **Menu Management** - CRUD menu items dengan kategori dan stok
- 🖨️ **QR Code Generator** - Generate dan print QR code untuk meja
- 📈 **Sales Reports** - Laporan harian penjualan dan item populer
- 🔒 **Authentication** - Login aman untuk staff

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **PWA**: Service Worker + Manifest
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **QR Codes**: QRCode.js

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd restaurant-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Create new Supabase project
   - Run SQL schema from `supabase-schema.sql`
   - Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 📱 Usage

### Customer Flow
1. **Duduk di meja** - Pilih meja yang tersedia
2. **Scan QR Code** - Gunakan kamera untuk scan QR di meja
3. **Browse Menu** - Lihat menu dan pilih item favorit
4. **Add to Cart** - Tambahkan ke keranjang dengan catatan khusus
5. **Checkout** - Konfirmasi pesanan
6. **Track Status** - Pantau status hingga siap disajikan
7. **Payment** - Bayar di kasir

### Admin Flow
1. **Login** - Akses dashboard admin (`/admin`)
2. **Manage Orders** - Update status pesanan (pending → preparing → ready → delivered)
3. **Manage Menu** - Tambah/edit/hapus menu items
4. **Generate QR** - Buat QR code untuk meja baru
5. **View Reports** - Lihat laporan penjualan harian

## 🔧 Configuration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### PWA Configuration
- **Manifest**: `/public/manifest.json`
- **Service Worker**: `/public/sw.js`
- **Icons**: Required sizes (192x192, 256x256, 384x384, 512x512)

## 🗄️ Database Schema

### Tables
- `tables` - Informasi meja dan QR codes
- `menus` - Menu items dengan kategori dan stok
- `orders` - Pesanan dengan status dan total
- `order_items` - Detail item dalam pesanan
- `users` - Admin/barista accounts

### Status Flow
```
pending → preparing → ready → delivered
```

## 🔐 Security Features

- **Row Level Security (RLS)** - Database security policies
- **Authentication** - Supabase Auth untuk admin
- **Route Protection** - Middleware untuk admin routes
- **Input Validation** - Form validation dan sanitization

## 📊 Features Detail

### Realtime Updates
- ✅ New order notifications with sound
- ✅ Status updates across all clients
- ✅ Live order count in admin sidebar
- ✅ Automatic refresh on changes

### PWA Features
- ✅ Offline caching for menu browsing
- ✅ Install prompt for home screen
- ✅ Mobile-first responsive design
- ✅ Touch-friendly interface

### QR Code System
- ✅ Unique QR per table
- ✅ Download as PNG
- ✅ Print-ready format with instructions
- ✅ Table-specific ordering

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Add environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## 🧪 Testing

### Demo Credentials
- **Admin**: admin@cafe.com / password123
- **Demo Tables**: Table 1-5 available

### Test Flow
1. Visit `/` for customer view
2. Click "Demo - Meja 1" 
3. Add items to cart and checkout
4. Visit `/admin` and login
5. Manage the test order

## 📱 Screenshots

### Customer PWA
- Landing page dengan QR scan
- Menu digital dengan kategori
- Keranjang pemesanan
- Status tracking

### Admin Dashboard
- Order management dengan realtime
- Menu management CRUD
- QR code generator
- Sales reports

## 🆘 Troubleshooting

### Common Issues

**QR Code tidak scan**
- Pastikan kamera permission enabled
- Coba scan dari jarak berbeda
- Test dengan QR scanner lain

**Pesanan tidak muncul**
- Check internet connection
- Refresh halaman admin
- Verify Supabase connection

**PWA tidak install**
- Harus HTTPS (atau localhost)
- Check manifest.json valid
- Clear browser cache

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Developed for PKL project - Restaurant Digital Ordering System

---

## 🎯 Future Enhancements

- [ ] Payment integration (Midtrans/QRIS)
- [ ] Multi-language support
- [ ] Table reservation system
- [ ] Inventory management
- [ ] Customer feedback system
- [ ] Analytics dashboard
- [ ] Push notifications
- [ ] Order history for customers

---

**Happy Coding! ☕️**