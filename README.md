# Online Pharmacy Management System

A comprehensive full-stack application for managing online pharmacy operations with web and mobile applications.

## 🏥 Project Overview

The Online Pharmacy Management System is a modern digital platform that streamlines pharmacy operations, enhances customer experience, and improves medication management through web and mobile technologies.

## ✨ Key Features

### Core Functionality
- **Multi-Platform Support**: Web application + React Native mobile app
- **Prescription-Based Ordering**: Upload prescriptions, pharmacist review, and medicine dispensing
- **Role-Based Access**: Customer, Pharmacist, Admin, and Supplier roles
- **Real-Time Communication**: Support tickets and AI-powered chatbot
- **Inventory Management**: Stock tracking, alerts, and supplier management
- **Order Processing**: Complete order lifecycle from placement to delivery

### User Roles & Features

#### 👤 Customer
- User registration and authentication
- Prescription upload and management
- Medicine browsing and ordering
- Cart management and checkout
- Order tracking and history
- Profile management
- Support ticket creation
- AI chatbot assistance

#### 👨‍⚕️ Pharmacist
- Prescription review and approval
- Medicine dispensing and cart management
- Order fulfillment and tracking
- Inventory monitoring
- Customer communication

#### 👨‍💼 Administrator
- User management and system configuration
- Medicine and supplier management
- Analytics and reporting
- Support ticket management
- System monitoring

#### 🏭 Supplier
- Product catalog management
- Order processing and invoicing
- Performance tracking
- Communication with pharmacy

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication and authorization
- **Socket.io** - Real-time communication
- **Cloudinary** - File storage
- **Nodemailer** - Email services

### Frontend (Web)
- **React 18** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Recharts** - Analytics charts

### Mobile App
- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - Navigation
- **React Native WebView** - Chatbot integration

## 📱 Mobile App Features

### Native Capabilities
- Camera integration for prescription uploads
- Push notifications for order updates
- Offline support for basic functionality
- Biometric authentication
- Location-based services

### Support System
- In-app support ticket creation
- AI-powered chatbot with Jotform integration
- Real-time messaging with support staff
- Fallback contact form

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Expo CLI (for mobile development)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/IT23837294/WMT-mobile-app.git
cd WMT-mobile-app
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Mobile App Setup**
```bash
cd mobile
npm install
# Set environment variables
EXPO_PUBLIC_API_BASE_URL=http://your-device-ip:5001/api
npx expo start
```

### Environment Variables

#### Backend (.env)
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pharmacy_system
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Mobile
```
EXPO_PUBLIC_API_BASE_URL=http://your-device-ip:5001/api
```

## 📊 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Medicines
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine (Admin/Pharmacist)
- `PUT /api/medicines/:id` - Update medicine
- `GET /api/medicines/categories` - Get categories

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `PUT /api/orders/:id/status` - Update order status

### Support
- `POST /api/tickets` - Create support ticket
- `GET /api/tickets/my` - Get user tickets
- `GET /api/tickets` - Get all tickets (Admin)

### Prescriptions
- `POST /api/prescriptions/upload` - Upload prescription
- `GET /api/prescriptions/my-prescriptions` - Get user prescriptions
- `PUT /api/prescriptions/:id/review` - Review prescription

## 🗄 Database Schema

### Core Collections
- **Users** - Authentication and profile data
- **Medicines** - Product catalog and inventory
- **Orders** - Order management and tracking
- **Prescriptions** - Prescription processing
- **Support Tickets** - Customer support system
- **Suppliers** - Supplier management
- **Reviews** - Product and service reviews

## 📱 Mobile App Access

### Development
- **Web Version**: http://localhost:8083
- **Expo Go**: Scan QR code from terminal
- **Direct URL**: exp://your-device-ip:8083

### Production
- Available on iOS and Android app stores

## 🔧 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to branch
git push origin feature/new-feature

# Create pull request
```

### Code Structure
```
pharmacy-system/
├── backend/                 # Node.js API server
│   ├── controllers/         # Route handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth, validation
│   └── config/             # Database config
├── frontend/               # React web app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
├── mobile/                 # React Native app
│   ├── app/               # Expo Router pages
│   ├── components/        # Mobile components
│   └── src/              # App utilities
└── SE2020_Documentation/   # Assignment documentation
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Mobile Tests
```bash
cd mobile
npm test
```

## 📈 Analytics & Monitoring

### System Metrics
- Real-time order tracking
- Inventory monitoring
- User activity analytics
- Performance monitoring
- Error tracking and logging

### Business Intelligence
- Sales analytics
- Customer behavior insights
- Supplier performance metrics
- Prescription processing statistics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password encryption with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- File upload security

## 🌐 Deployment

### Production Environment
- **Backend**: Cloud hosting (AWS/Azure/Heroku)
- **Database**: MongoDB Atlas
- **Frontend**: Static hosting (Vercel/Netlify)
- **Mobile**: App Store and Google Play

### CI/CD Pipeline
- GitHub Actions for automated testing
- Automated deployment on merge
- Environment-specific configurations
- Rollback capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- GitHub Issues: Report bugs and request features
- Email: support@pharmacy-system.com
- Documentation: Check the `/docs` folder

## 🎯 Future Enhancements

- [ ] Telemedicine integration
- [ ] AI-powered medicine recommendations
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with health systems
- [ ] Blockchain for prescription security

---

**SE2020 Assignment Submission**  
*Group: WMT (Web & Mobile Technologies)*  
*Repository: https://github.com/IT23837294/WMT-mobile-app.git*
