import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SignatureGenerator = ({ config }) => {
  const [signatureType, setSignatureType] = useState('qr');
  const [formData, setFormData] = useState({
    // QR Request fields
    amount: '',
    prn: '',
    merchantCode: '',
    remarks1: '',
    remarks2: '',
    // Status Check fields
    statusPrn: '',
    statusMerchantCode: '',
    // Common
    secretKey: ''
  });
  
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Load test credentials if available
    if (config?.testCredentials) {
      setFormData(prev => ({
        ...prev,
        merchantCode: config.testCredentials.merchantCode,
        statusMerchantCode: config.testCredentials.merchantCode,
        secretKey: config.testCredentials.secretKey
      }));
    }
  }, [config]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateHMACSignature = async (secretKey, message) => {
    // Use Web Crypto API for HMAC-SHA512
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secretKey);
      const messageData = encoder.encode(message);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      return hashHex;
    } catch (error) {
      throw new Error('Failed to generate HMAC signature: ' + error.message);
    }
  };

  const generateSignature = async () => {
    try {
      let message = '';
      let description = '';
      let requiredFields = [];

      if (signatureType === 'qr') {
        requiredFields = ['amount', 'prn', 'merchantCode', 'remarks1', 'remarks2', 'secretKey'];
        const missing = requiredFields.filter(field => !formData[field].trim());
        
        if (missing.length > 0) {
          toast.error(`Missing required fields: ${missing.join(', ')}`);
          return;
        }

        message = `${formData.amount},${formData.prn},${formData.merchantCode},${formData.remarks1},${formData.remarks2}`;
        description = 'QR Request Signature';
      } else {
        requiredFields = ['statusPrn', 'statusMerchantCode', 'secretKey'];
        const missing = requiredFields.filter(field => {
          const fieldName = field === 'statusPrn' ? 'statusPrn' : field === 'statusMerchantCode' ? 'statusMerchantCode' : field;
          return !formData[fieldName].trim();
        });
        
        if (missing.length > 0) {
          toast.error(`Missing required fields: ${missing.join(', ')}`);
          return;
        }

        message = `${formData.statusPrn},${formData.statusMerchantCode}`;
        description = 'Status Check Signature';
      }

      // Generate step-by-step process
      const processSteps = [
        {
          step: 1,
          title: 'Message Formation',
          description: 'Concatenate parameters with commas',
          input: signatureType === 'qr' 
            ? `amount,prn,merchantCode,remarks1,remarks2`
            : `prn,merchantCode`,
          output: message,
          code: signatureType === 'qr'
            ? `const message = \`\${amount},\${prn},\${merchantCode},\${remarks1},\${remarks2}\`;`
            : `const message = \`\${prn},\${merchantCode}\`;`
        },
        {
          step: 2,
          title: 'Secret Key Preparation',
          description: 'Use the secret key provided by Fonepay',
          input: 'secretKey',
          output: formData.secretKey,
          code: `const secretKey = "${formData.secretKey}";`
        },
        {
          step: 3,
          title: 'HMAC SHA512 Generation',
          description: 'Generate HMAC using SHA512 algorithm',
          input: `HMAC-SHA512(secretKey, message)`,
          output: 'Calculating...',
          code: `const signature = await crypto.subtle.sign('HMAC', key, messageData);`
        }
      ];

      setSteps(processSteps);

      // Generate the actual signature
      const signature = await generateHMACSignature(formData.secretKey, message);

      // Update the last step with the result
      const finalSteps = [...processSteps];
      finalSteps[2].output = signature;

      setSteps(finalSteps);
      setResult({
        type: description,
        message,
        secretKey: formData.secretKey,
        signature,
        algorithm: 'HMAC-SHA512',
        timestamp: new Date().toISOString()
      });

      toast.success('Signature generated successfully!');

    } catch (error) {
      console.error('Signature generation error:', error);
      toast.error('Failed to generate signature: ' + error.message);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const loadSampleData = () => {
    if (signatureType === 'qr') {
      setFormData(prev => ({
        ...prev,
        amount: '100.50',
        prn: 'test-' + Math.random().toString(36).substr(2, 8),
        remarks1: 'Test Transaction',
        remarks2: 'Sample Payment'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        statusPrn: 'test-' + Math.random().toString(36).substr(2, 8)
      }));
    }
    toast.success('Sample data loaded!');
  };

  const validateSignature = async () => {
    if (!result) {
      toast.error('No signature to validate');
      return;
    }

    try {
      const regeneratedSignature = await generateHMACSignature(result.secretKey, result.message);
      
      if (regeneratedSignature === result.signature) {
        toast.success('✅ Signature validation passed!');
      } else {
        toast.error('❌ Signature validation failed!');
      }
    } catch (error) {
      toast.error('Validation error: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <i className="fas fa-key text-purple-600 text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">HMAC Signature Generator</h2>
            <p className="text-gray-600">Generate and validate HMAC-SHA512 signatures for Fonepay APIs</p>
          </div>
        </div>

        {/* Signature Type Selection */}
        <div className="flex space-x-4">
          <button
            onClick={() => setSignatureType('qr')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              signatureType === 'qr'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="fas fa-qrcode mr-2"></i>
            QR Request Signature
          </button>
          <button
            onClick={() => setSignatureType('status')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              signatureType === 'status'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="fas fa-search mr-2"></i>
            Status Check Signature
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-edit text-purple-500 mr-2"></i>
            {signatureType === 'qr' ? 'QR Request Parameters' : 'Status Check Parameters'}
          </h3>
          <button
            onClick={loadSampleData}
            className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
          >
            <i className="fas fa-magic mr-1"></i>
            Load Sample Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatureType === 'qr' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 100.50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PRN (Product Reference Number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="prn"
                  value={formData.prn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., test-abc123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="merchantCode"
                  value={formData.merchantCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., NBQM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="remarks1"
                  value={formData.remarks1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Test Transaction"
                  maxLength="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks 2 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="remarks2"
                  value={formData.remarks2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., API Test"
                  maxLength="25"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PRN (Product Reference Number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="statusPrn"
                  value={formData.statusPrn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., test-abc123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="statusMerchantCode"
                  value={formData.statusMerchantCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., NBQM"
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="secretKey"
              value={formData.secretKey}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your secret key"
            />
            <div className="mt-1 text-xs text-gray-500">
              <i className="fas fa-shield-alt mr-1"></i>
              Secret key provided by Fonepay (keep secure)
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={generateSignature}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <i className="fas fa-key"></i>
            <span>Generate Signature</span>
          </button>
        </div>
      </div>

      {/* Generation Steps */}
      {steps.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-list-ol text-purple-500 mr-2"></i>
            Signature Generation Process
          </h3>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Input:</span>
                    <div className="bg-gray-50 p-2 rounded border text-sm font-mono">
                      {step.input}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Output:</span>
                    <div className="bg-green-50 p-2 rounded border text-sm font-mono break-all">
                      {step.output}
                    </div>
                  </div>
                  
                  <details>
                    <summary className="text-sm text-purple-600 cursor-pointer">Show code example</summary>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 text-sm font-mono">
                      {step.code}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-2"></i>
              Generated Signature
            </h3>
            <button
              onClick={validateSignature}
              className="text-green-600 hover:text-green-800 text-sm flex items-center"
            >
              <i className="fas fa-shield-alt mr-1"></i>
              Validate Signature
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signature Type
                </label>
                <div className="bg-blue-50 p-2 rounded border text-sm">
                  {result.type}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Algorithm
                </label>
                <div className="bg-blue-50 p-2 rounded border text-sm">
                  {result.algorithm}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message String
              </label>
              <div className="bg-gray-50 p-3 rounded border text-sm font-mono">
                {result.message}
              </div>
              <button
                onClick={() => copyToClipboard(result.message, 'Message')}
                className="mt-1 text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <i className="fas fa-copy mr-1"></i>
                Copy Message
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HMAC-SHA512 Signature
              </label>
              <div className="bg-green-50 p-3 rounded border text-sm font-mono break-all">
                {result.signature}
              </div>
              <button
                onClick={() => copyToClipboard(result.signature, 'Signature')}
                className="mt-1 text-green-600 hover:text-green-800 text-sm flex items-center"
              >
                <i className="fas fa-copy mr-1"></i>
                Copy Signature
              </button>
            </div>

            <div className="text-xs text-gray-500">
              <i className="fas fa-clock mr-1"></i>
              Generated at: {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <i className="fas fa-info-circle mr-2"></i>
          HMAC Signature Information
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>What is HMAC?</strong> Hash-based Message Authentication Code (HMAC) is a cryptographic 
            hash function used to verify both data integrity and authentication.
          </div>
          <div>
            <strong>Why SHA-512?</strong> SHA-512 provides strong cryptographic security with a 512-bit hash output, 
            making it extremely difficult to forge signatures.
          </div>
          <div>
            <strong>Security Tips:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Never share your secret key publicly</li>
              <li>Store secret keys securely on the server-side</li>
              <li>Generate signatures on the backend, not frontend</li>
              <li>Use HTTPS for all API communications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureGenerator;