# Fonepay QR API Tester

A comprehensive testing tool for Fonepay Dynamic QR APIs with a beautiful React frontend and robust Node.js backend.

## 🚀 Features

- **QR Code Generation**: Generate dynamic QR codes with real-time preview
- **Transaction Status Checking**: Check payment status using PRN
- **WebSocket Testing**: Real-time payment notifications testing
- **HMAC Signature Generator**: Step-by-step signature generation and validation
- **API Request Logging**: Complete request/response logging with export functionality
- **Configuration Management**: Easy environment and credential management
- **Beautiful UI**: Modern, responsive interface built with React and Tailwind CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

## 🛠️ Installation

1. **Clone or create the project directory**
   ```bash
   mkdir fonepay-qr-tester
   cd fonepay-qr-tester
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional React dependencies**
   ```bash
   npm install react@^18.2.0 react-dom@^18.2.0 react-router-dom@^6.15.0 qrcode.react@^3.1.0 react-json-view@^1.21.3 react-hot-toast@^2.4.1
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Build the frontend**
   ```bash
   npm run build
   ```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **In another terminal, start the frontend development server**
   ```bash
   npm run dev-frontend
   ```

3. **Access the application**
   - Backend API: http://localhost:3000
   - Frontend UI: http://localhost:3001

### Production Mode

1. **Build and start**
   ```bash
   npm run build
   npm start
   ```

2. **Access the application**
   - Application: http://localhost:3000

## 📖 API Documentation

### QR Generation

**Endpoint**: `POST /api/qr/generate`

**Request Body**:
```json
{
  "amount": "100.50",
  "remarks1": "Test Transaction",
  "remarks2": "API Test",
  "isLive": false,
  "customCredentials": {
    "merchantCode": "your-merchant-code",
    "secretKey": "your-secret-key",
    "username": "your-username",
    "password": "your-password"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "request": { ... },
    "response": {
      "message": "successfull",
      "qrMessage": "QR_CODE_DATA",
      "status": "CREATED",
      "statusCode": 201,
      "success": true,
      "thirdpartyQrWebSocketUrl": "WEBSOCKET_URL"
    },
    "prn": "generated-prn",
    "websocketUrl": "WEBSOCKET_URL"
  }
}
```

### Status Check

**Endpoint**: `POST /api/qr/status`

**Request Body**:
```json
{
  "prn": "transaction-prn",
  "isLive": false,
  "customCredentials": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "request": { ... },
    "response": {
      "fonepayTraceId": 17404,
      "merchantCode": "fonepay123",
      "paymentStatus": "success",
      "prn": "transaction-prn"
    }
  }
}
```

## 🔐 HMAC Signature Generation

The application generates HMAC-SHA512 signatures as required by Fonepay:

### QR Request Signature
```
Message: amount,prn,merchantCode,remarks1,remarks2
Example: 100.50,test-abc123,fonepay123,Test Transaction,API Test
```

### Status Check Signature
```
Message: prn,merchantCode
Example: test-abc123,fonepay123
```

## 🌐 WebSocket Integration

The application supports real-time WebSocket connections for payment notifications:

1. Generate a QR code to get the WebSocket URL
2. Connect to the WebSocket using the provided URL
3. Listen for payment verification and completion notifications

**WebSocket Message Types**:
- **QR Verification**: When QR is scanned
- **Payment Success**: When payment is completed
- **Payment Failed**: When payment fails

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `FONEPAY_DEV_URL`: Development API URL
- `FONEPAY_LIVE_URL`: Production API URL
- Test credentials for development

### Test Credentials

The application includes test credentials from the Fonepay documentation:
- Merchant Code: `fonepay123`
- Secret Key: `fonepay`
- Username: `bijayk`
- Password: `password`

## 📱 User Interface

### QR Generator
- Generate QR codes with amount and remarks
- Real-time QR code preview
- Signature generation details
- Copy QR data and PRN

### Status Checker
- Check transaction status using PRN
- Load previous PRN automatically
- Detailed response information

### WebSocket Tester
- Connect to WebSocket URLs
- Real-time message logging
- Connection status monitoring
- Mock message sending

### Signature Generator
- Generate HMAC signatures manually
- Step-by-step process visualization
- Signature validation
- Code examples

### API Logs
- Complete request/response logging
- Filter and search functionality
- Export logs as JSON
- Mock data generation

### Configuration
- View API endpoints
- Test credentials management
- System information
- Connection testing

## 🛡️ Security Notes

- Never expose secret keys in frontend code
- Generate signatures on the backend only
- Use HTTPS for all production communications
- Store credentials securely
- Validate all inputs before processing

## 🚨 Error Handling

The application handles various error scenarios:
- Invalid credentials
- Network connectivity issues
- Malformed requests
- API rate limiting
- WebSocket connection failures

## 📊 Logging

All API requests and responses are logged with:
- Timestamp
- Request/response headers and body
- Status codes
- Duration
- Error details

## 🧪 Testing

### Manual Testing
1. Use the UI to generate QR codes
2. Check transaction status
3. Test WebSocket connections
4. Validate HMAC signatures

### Mock Data
The application includes mock data generators for testing the interface without making actual API calls.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues related to:
- **Fonepay APIs**: Contact Fonepay support
- **This Testing Tool**: Create an issue in the repository

## 🔗 Useful Links

- [Fonepay Documentation](https://fonepay.com/)
- [React Documentation](https://reactjs.org/)
- [Node.js Documentation](https://nodejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**⚠️ Disclaimer**: This is a testing tool for development purposes. Always use official Fonepay documentation and follow security best practices for production implementations.