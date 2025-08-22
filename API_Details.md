# Fonepay Dynamic QR API Documentation

**Version:** 1.1  
**Date:** July 2024  
**Document Owner:** Fonepay Payment Service Ltd.

## Table of Contents

1. [Introduction](#introduction)
2. [System Flow](#system-flow)
3. [Implementation](#implementation)
   - [API URLs](#api-urls)
   - [QR Request](#qr-request)
   - [HMAC Signature](#hmac-signature)
   - [Web Socket Connection](#web-socket-connection)
   - [Check QR Request Status](#check-qr-request-status)
   - [Testing Credentials](#testing-credentials)
   - [Postman Example](#postman-example)

## Introduction

This document contains the standard specifications of the interface between the merchant system and Fonepay system for generating QR data. The interface specification describes a technical level while communicating with a system through APIs for QR data. Data exchanged which does not strictly match the format specified in this document will be rejected.

## System Flow

1. Merchant System sends QR request to Fonepay System
2. Fonepay system validates the request data and returns the response to the merchant system
3. Merchant system initiates the web-socket connection to receive transaction acknowledgement from Fonepay server
4. Fonepay system sends QR verification status and Payment notification (approved, rejected or pending) to merchant system through web-socket

## Implementation

### API URLs

**Development Server (For Testing):**
```
https://uat-new-merchant-api.fonepay.com/api
```

**Live Server:**
```
https://merchantapi.fonepay.com/api
```

### QR Request

#### Endpoint
**POST** `/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload`

**Full URLs:**
- **Dev:** `https://uat-new-merchant-api.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload`
- **Live:** `https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload`

#### Request Parameters

| Field Name | Format | Length | Condition | Description |
|------------|--------|--------|-----------|-------------|
| amount | N | 1-10 | mandatory | Numeric digits "0" to "9" with optional single "." as decimal mark |
| remarks1 | AN | 1-25 | mandatory | Narration of the transaction |
| remarks2 | AN | 1-25 | mandatory | Additional narration if needed |
| prn | ANS | 1-25 | mandatory | Product Number (must be unique for all requests) |
| merchantCode | AN | 1-15 | mandatory | Merchant Code provided by Fonepay |
| dataValidation | ANS | - | mandatory | HMAC_SHA512 Hash signature |
| username | ANS | 1-25 | mandatory | Username provided by Fonepay |
| password | ANS | 1-25 | mandatory | Password provided by Fonepay |

#### Request Example

```json
{
  "amount": "14",
  "remarks1": "test1",
  "remarks2": "test2",
  "merchantCode": "NBQM",
  "dataValidation": "43d2f0939e58e038c3122cc1e65f86af01998dce3e9f70a41a664dc0dbd45dfd74b4c4cbb77afef8a5ae9854ab48fcbd7edfc93156f663a8c60f28830eaca7d7",
  "username": "admin",
  "password": "admin123456"
}
```

#### Success Response

```json
{
  "message": "successfull",
  "qrMessage": "000201010212153137910524005204460000000NBQM:29226400011fonepay.com0104NBQM020329206061367695204541153035245402145802NP5911Fonepaytest6008District622107032292021098418456336304d3f7",
  "status": "CREATED",
  "statusCode": 201,
  "success": true,
  "thirdpartyQrWebSocketUrl": "wss://dev-ws.fonepay.com/convergent-webSocket-web/merchantEndPoint/Td35588c2d9a647f28f4959f96f905bec/NBQM/Y"
}
```

#### Error Responses

```json
{
  "documentation": "Merchant request Exception",
  "errorCode": 406,
  "message": "Data Validation Failed"
}
```

```json
{
  "documentation": "Merchant request Exception",
  "errorCode": 406,
  "message": "Invalid Merchant Code"
}
```

```json
{
  "documentation": "Merchant request Exception",
  "errorCode": 406,
  "message": "Invalid username"
}
```

### HMAC Signature

#### For QR Request

**Message Format:**
```
AMOUNT,PRN,MERCHANT-CODE,REMARKS1,REMARKS2
```

**Example:**
- **Key:** `a7e3512f5032480a83137793cb2021dc`
- **Message:** `14,5d76d323-d1f6,NBQM,test1,test2`
- **Result:** `5ae718032328ae5615fa4694dfbf3ecd13432bd49031e7285a3f8bc122ecbb8e833e83c7a11f895d30f3e8fd1906317aece113675166ae0d804ecf32a8bbdbaf`

#### Sample Code (Java)

```java
public String generateHash(String secretKey, String message) {
    Mac sha512_HMAC = null;
    String result = null;
    try {
        byte[] byteKey = secretKey.getBytes("UTF-8");
        final String HMAC_SHA512 = "HmacSHA512";
        sha512_HMAC = Mac.getInstance(HMAC_SHA512);
        SecretKeySpec keySpec = new SecretKeySpec(byteKey, HMAC_SHA512);
        sha512_HMAC.init(keySpec);
        result = bytesToHex(sha512_HMAC.doFinal(message.getBytes("UTF-8")));
        return result;
    } catch (Exception e) {
        log.error("Exception while Hashing Using HMAC256");
        return null;
    }
}

private static String bytesToHex(byte[] bytes) {
    final char[] hexArray = "0123456789ABCDEF".toCharArray();
    char[] hexChars = new char[bytes.length * 2];
    for (int j = 0; j < bytes.length; j++) {
        int v = bytes[j] & 0xFF;
        hexChars[j * 2] = hexArray[v >>> 4];
        hexChars[j * 2 + 1] = hexArray[v & 0x0F];
    }
    return new String(hexChars);
}
```

### Web Socket Connection

#### WebSocket URLs
- **Dev:** `ws://acquirer-websocket.fonepay.com/merchantEndPoint`
- **Live:** `wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint`

Use the `thirdpartyQrWebSocketUrl` from the QR request response to establish WebSocket connection.

#### QR Verification Response

```json
{
  "merchantId": 70,
  "deviceId": "Td35588c2d9a647f28f4959f96f905bec",
  "transactionStatus": "{
    \"success\": true,
    \"message\": \"VERIFIED\",
    \"QRVerified\": true
  }"
}
```

#### Payment Success Response

```json
{
  "merchantId": 70,
  "deviceId": "Td35588c2d9a647f28f4959f96f905bec",
  "transactionStatus": "{
    \"traceId\": 17015,
    \"remarks1\": \"test1\",
    \"remarks2\": \"test2\",
    \"transactionDate\": \"Apr 11, 2019 1:43:23 PM\",
    \"productNumber\": \"5d76d323-d1f6-4a38-8231-0063f9581c98\",
    \"amount\": \"14\",
    \"message\": \"Request Complete\",
    \"success\": true,
    \"commissionType\": \"CHARGE\",
    \"commissionAmount\": 0.0,
    \"totalCalculatedAmount\": 14.0,
    \"paymentSuccess\": true
  }"
}
```

**Note:** Check `paymentSuccess` field in `transactionStatus` to verify payment completion.

### Check QR Request Status

#### Endpoint
**POST** `/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus`

**Full URLs:**
- **Dev:** `https://uat-new-merchant-api.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus`
- **Live:** `https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus`

#### Request Parameters

| Field Name | Format | Length | Condition | Description |
|------------|--------|--------|-----------|-------------|
| prn | ANS | 1-25 | mandatory | Product Number from QR request |
| merchantCode | AN | 1-15 | mandatory | Merchant Code provided by Fonepay |
| dataValidation | ANS | - | mandatory | HMAC_SHA512 Hash signature |
| username | ANS | 1-25 | mandatory | Username provided by Fonepay |
| password | ANS | 1-25 | mandatory | Password provided by Fonepay |

#### HMAC for Check Status

**Message Format:**
```
PRN,MERCHANT-CODE
```

**Example:**
- **Key:** `a7e3512f5032480a83137793cb2021dc`
- **Message:** `5d76d323-d1f6-4a388,NBQM`
- **Result:** `b816affc4599162bdbd9b8c7f6b7b83508dadfcceb0d58ba01f1042d749a7b5d71ea5b6f409ca2d61607043555733c9240d2651a3473e7a195a326b21e9fafe8`

#### Request Example

```json
{
  "prn": "5d76d323-d1f6",
  "merchantCode": "NBQM",
  "dataValidation": "de5fd3bbbd7d36c766a47c0a137e41de7587028d2f6e3deacb5bebe30992326876a6fba4f9ccfd55a1d302a81aba94733d6c1db04f749483be63b619a9b032b7",
  "username": "admin",
  "password": "admin123456"
}
```

#### Response Examples

**Success:**
```json
{
  "fonepayTraceId": 17404,
  "merchantCode": "NBQM",
  "paymentStatus": "success",
  "prn": "5d76d323-d1f6"
}
```

**Failed:**
```json
{
  "fonepayTraceId": 17420,
  "merchantCode": "NBQM",
  "paymentStatus": "failed",
  "prn": "654df0eb-0740"
}
```

**Pending:**
```json
{
  "fonepayTraceId": 17420,
  "merchantCode": "NBQM",
  "paymentStatus": "failed",
  "prn": "654df0eb-0740"
}
```

### Testing Credentials

```
Merchant Code: fonepay123
Secret Key: fonepay
Username: bijayk
Password: password
```

### Postman Example

```bash
curl --location 'https://uat-new-merchant-api.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload' \
--header 'Content-Type: application/json' \
--data '{
  "amount": "50",
  "prn": "check",
  "merchantCode": "fonepay123",
  "remarks1": "test1",
  "remarks2": "test2",
  "dataValidation": "f036eb09c5402a91e1926e904a423e66d041add18423959dad512b6f5fa37f1ea023197f6faae42f84b357914f5ed77723255d108b38c20c058677cfc8ac4204",
  "username": "bijayk",
  "password": "password"
}'
```

## Important Notes

1. **Security:** Do not share Secret Key with others and do not store where others may easily find them (like frontend apps). Generate HMAC_SHA512 in backend and store Secret Key securely.

2. **Values:** All values should be comma separated and should not be URL encoded.

3. **WebSocket:** After getting message from websocket, merchant should call Check QR Request Status API to verify payment status.

4. **Unique PRN:** Product Number (prn) should be unique for all requests.

5. **Data Validation:** All requests must include proper HMAC_SHA512 signature for security validation.