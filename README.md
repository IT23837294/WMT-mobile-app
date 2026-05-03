# Online Pharmacy & Medicine Management System

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application for managing an online pharmacy with prescription-based medicine ordering.

## Features

### Core Features
- **Prescription-Based Ordering**: Customers upload prescriptions, pharmacists review and add medicines to cart
- **Role-Based Access Control**: Four user roles - Customer, Pharmacist, Admin, Supplier
- **JWT Authentication**: Secure login and registration with bcrypt password hashing
- **Medicine Management**: CRUD operations with stock and expiry tracking
- **Inventory Alerts**: Automatic low stock and expiry notifications
- **Order Management**: Track orders from processing to delivery
- **Cart Management**: Real-time price calculation with delivery charges
- **Supplier Management**: Track suppliers and their products

### User Roles

#### Customer (Patient)
- Register and login
- Upload prescription images (JPG/PNG/PDF)
- Track prescription status (Pending → Reviewed → Completed)
- View cart with medicines added by pharmacist
- Update quantities and proceed to checkout
- View order history and track status
- Manage profile

#### Pharmacist
- Review uploaded prescriptions
- Add medicines to customer cart
- Set quantities and prices
- Manage orders and update status
- View medicine inventory

#### Administrator
- Full system access
- Manage medicines (CRUD)
- Manage suppliers (CRUD)
- Manage users (activate/deactivate)
- View analytics and reports
- Remove expired medicines

#### Supplier
- Basic profile management
- View supplied medicines

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Image storage (optional, can use local)

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Analytics charts

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd pharmacy-system
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pharmacy_system
JWT_SECRET=your_jwt_secret_key_here_change_in_production
CLOUDINARY_CLOUD_NAME=your_cloud_name (optional)
CLOUDINARY_API_KEY=your_api_key (optional)
CLOUDINARY_API_SECRET=your_api_secret (optional)
NODE_ENV=development
```

### Step 4: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 5: Start the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend (in a new terminal)
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |
| GET | /api/auth/users | Get all users (Admin) |
| PUT | /api/auth/users/:id/toggle-status | Toggle user status (Admin) |

### Medicine Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/medicines | Get all medicines |
| GET | /api/medicines/:id | Get single medicine |
| POST | /api/medicines | Create medicine (Admin/Pharmacist) |
| PUT | /api/medicines/:id | Update medicine (Admin/Pharmacist) |
| DELETE | /api/medicines/:id | Delete medicine (Admin) |
| GET | /api/medicines/categories | Get categories |
| GET | /api/medicines/alerts | Get stock/expiry alerts |

### Prescription Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/prescriptions/upload | Upload prescription (Customer) |
| GET | /api/prescriptions/my-prescriptions | Get my prescriptions (Customer) |
| GET | /api/prescriptions | Get all prescriptions (Pharmacist/Admin) |
| GET | /api/prescriptions/:id | Get prescription details |
| PUT | /api/prescriptions/:id/review | Review prescription (Pharmacist/Admin) |
| PUT | /api/prescriptions/:id/reject | Reject prescription (Pharmacist/Admin) |

### Cart Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cart | Get cart |
| POST | /api/cart/add | Add item to cart |
| PUT | /api/cart/item/:id | Update cart item |
| DELETE | /api/cart/item/:id | Remove from cart |
| DELETE | /api/cart/clear | Clear cart |

### Order Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders | Create order |
| GET | /api/orders/my-orders | Get my orders (Customer) |
| GET | /api/orders | Get all orders (Pharmacist/Admin) |
| GET | /api/orders/:id | Get order details |
| PUT | /api/orders/:id/status | Update order status |
| PUT | /api/orders/:id/cancel | Cancel order |
| GET | /api/orders/stats/overview | Get order statistics (Admin) |

### Supplier Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/suppliers | Get all suppliers (Admin) |
| GET | /api/suppliers/:id | Get supplier details (Admin) |
| POST | /api/suppliers | Create supplier (Admin) |
| PUT | /api/suppliers/:id | Update supplier (Admin) |
| DELETE | /api/suppliers/:id | Delete supplier (Admin) |
| GET | /api/suppliers/stats | Get supplier stats (Admin) |

## Database Schema

### Collections
1. **Users** - Customer, Pharmacist, Admin, Supplier data
2. **Medicines** - Medicine inventory with stock tracking
3. **Prescriptions** - Customer prescription uploads
4. **Carts** - Shopping cart data
5. **Orders** - Order details and tracking
6. **Suppliers** - Supplier information

## Demo Credentials

Use these accounts for testing:

- **Admin**: admin@example.com / admin123
- **Pharmacist**: pharma@example.com / pharma123
- **Customer**: customer@example.com / customer123

## Folder Structure

```
pharmacy-system/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, error handling, upload
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── uploads/         # Uploaded files
│   ├── utils/           # Utility functions
│   ├── .env             # Environment variables
│   ├── package.json
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context (Auth)
│   │   ├── pages/       # Page components
│   │   │   ├── customer/    # Customer pages
│   │   │   ├── pharmacist/  # Pharmacist pages
│   │   │   └── admin/       # Admin pages
│   │   ├── services/    # API services
│   │   ├── App.jsx      # Main app component
│   │   ├── main.jsx     # Entry point
│   │   └── index.css    # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Features to Add

- [ ] Email notifications for prescription reviews
- [ ] Multi-image prescription upload
- [ ] Advanced analytics dashboard
- [ ] Medicine search with autocomplete
- [ ] Order cancellation by customer
- [ ] Inventory reports export (PDF/Excel)
- [ ] Dark mode support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@pharmacare.com or open an issue in the repository.
