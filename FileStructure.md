fonepay-qr-tester/
│
├── 📁 src/                           # Frontend React source code
│   ├── 📁 components/                # React components
│   │   ├── 📄 QRCodeGenerator.js     # QR code generation component
│   │   ├── 📄 StatusChecker.js       # Transaction status checker
│   │   ├── 📄 WebSocketTester.js     # WebSocket testing component
│   │   ├── 📄 SignatureGenerator.js  # HMAC signature generator
│   │   ├── 📄 ApiLogs.js             # API request/response logs
│   │   └── 📄 Configuration.js       # Configuration management
│   │
│   ├── 📄 App.js                     # Main React app component
│   ├── 📄 index.js                   # React app entry point
│   └── 📄 index.html                 # HTML template
│
├── 📁 public/                        # Static files (generated)
│   ├── 📄 index.html                 # Generated HTML file
│   └── 📄 bundle.js                  # Generated JavaScript bundle
│
├── 📁 node_modules/                  # NPM dependencies (auto-generated)
│
├── 📄 server.js                      # Express backend server
├── 📄 package.json                   # Project dependencies and scripts
├── 📄 webpack.config.js              # Webpack configuration
├── 📄 .babelrc                       # Babel configuration
├── 📄 .env                           # Environment variables
├── 📄 .gitignore                     # Git ignore rules
└── 📄 README.md                      # Project documentation

📊 File Details:

Backend Files:
├── 📄 server.js                      # Main Express server with all API routes
│   ├── 🔧 /api/test                  # Health check endpoint
│   ├── 🔧 /api/qr/generate           # QR code generation API
│   ├── 🔧 /api/qr/status             # Transaction status check API
│   ├── 🔧 /api/websocket/test        # WebSocket connection testing
│   └── 🔧 /api/config                # Configuration retrieval
│
├── 📄 .env                           # Environment configuration
│   ├── 🔑 PORT=3000                  # Server port
│   ├── 🔑 FONEPAY_DEV_URL           # Development API URL
│   ├── 🔑 FONEPAY_LIVE_URL          # Production API URL
│   ├── 🔑 TEST_MERCHANT_CODE        # Test merchant code
│   ├── 🔑 TEST_SECRET_KEY           # Test secret key
│   ├── 🔑 TEST_USERNAME             # Test username
│   └── 🔑 TEST_PASSWORD             # Test password

Frontend Files:
├── 📁 src/components/                # React components directory
│   │
│   ├── 📄 QRCodeGenerator.js         # QR Generation Interface
│   │   ├── 🎯 Amount input form
│   │   ├── 🎯 Remarks configuration
│   │   ├── 🎯 Environment selection
│   │   ├── 🎯 Custom credentials
│   │   ├── 🎯 QR code display
│   │   ├── 🎯 API response viewer
│   │   └── 🎯 Signature details
│   │
│   ├── 📄 StatusChecker.js           # Status Check Interface
│   │   ├── 🔍 PRN input form
│   │   ├── 🔍 Status validation
│   │   ├── 🔍 Response analysis
│   │   ├── 🔍 Payment status badges
│   │   └── 🔍 Signature verification
│   │
│   ├── 📄 WebSocketTester.js         # WebSocket Testing
│   │   ├── 🔌 Connection management
│   │   ├── 🔌 Message logging
│   │   ├── 🔌 Real-time notifications
│   │   ├── 🔌 Connection status
│   │   └── 🔌 Mock message sending
│   │
│   ├── 📄 SignatureGenerator.js      # HMAC Signature Tool
│   │   ├── 🔐 Parameter input forms
│   │   ├── 🔐 Step-by-step process
│   │   ├── 🔐 Signature validation
│   │   ├── 🔐 Code examples
│   │   └── 🔐 Copy functionality
│   │
│   ├── 📄 ApiLogs.js                 # API Request Logger
│   │   ├── 📋 Request/response logs
│   │   ├── 📋 Filter and search
│   │   ├── 📋 Export functionality
│   │   ├── 📋 Mock data generation
│   │   └── 📋 Real-time updates
│   │
│   └── 📄 Configuration.js           # Settings Management
│       ├── ⚙️ API endpoints config
│       ├── ⚙️ Credentials management
│       ├── ⚙️ WebSocket URLs
│       ├── ⚙️ System information
│       └── ⚙️ Connection testing

Build & Configuration:
├── 📄 package.json                   # Dependencies and scripts
│   ├── 📦 Express, Axios, WebSocket
│   ├── 📦 React, React Router
│   ├── 📦 QR Code, JSON Viewer
│   ├── 🏃‍♂️ npm start (production)
│   ├── 🏃‍♂️ npm run dev (development)
│   └── 🏃‍♂️ npm run build (build frontend)
│
├── 📄 webpack.config.js              # Frontend build configuration
│   ├── 🔧 Entry: src/index.js
│   ├── 🔧 Output: public/bundle.js
│   ├── 🔧 Babel loader for React
│   ├── 🔧 CSS loader for Tailwind
│   └── 🔧 Dev server proxy setup
│
├── 📄 .babelrc                       # Babel transpilation config
│   ├── 🔄 ES6+ to ES5 conversion
│   └── 🔄 React JSX transformation

Development Files:
├── 📄 README.md                      # Complete documentation
│   ├── 📖 Installation instructions
│   ├── 📖 API documentation
│   ├── 📖 Usage examples
│   ├── 📖 Security guidelines
│   └── 📖 Troubleshooting guide
│
├── 📄 .gitignore                     # Git ignore rules
│   ├── 🚫 node_modules/
│   ├── 🚫 .env
│   ├── 🚫 build files
│   └── 🚫 IDE configs
│
└── 📄 .env                           # Environment variables
    ├── 🔒 API URLs
    ├── 🔒 Test credentials
    ├── 🔒 Security keys
    └── 🔒 Configuration options

📁 Generated Directories (after build):
├── 📁 public/                        # Built frontend files
│   ├── 📄 index.html                 # Generated HTML
│   └── 📄 bundle.js                  # Compiled JavaScript
│
└── 📁 node_modules/                  # Installed dependencies
    ├── 📦 express                    # Backend framework
    ├── 📦 react                      # Frontend framework
    ├── 📦 axios                      # HTTP client
    ├── 📦 ws                         # WebSocket client
    └── 📦 ...other dependencies

🚀 Quick Setup Commands:

1. Create project:
   mkdir fonepay-qr-tester && cd fonepay-qr-tester

2. Initialize and install:
   npm init -y
   npm install express cors axios ws crypto uuid dotenv morgan
   npm install react react-dom react-router-dom qrcode.react react-json-view react-hot-toast
   npm install --save-dev nodemon webpack webpack-cli babel-loader @babel/core @babel/preset-env @babel/preset-react

3. Create all files from the artifacts above

4. Start development:
   npm run dev (backend)
   npm run dev-frontend (frontend - in new terminal)

5. Access application:
   Backend: http://localhost:3000
   Frontend: http://localhost:3001