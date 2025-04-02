# SCATCH Backend API Documentation

## Overview
SCATCH is an e-commerce platform where users can buy bags. This documentation provides details about the backend API, built using the MERN stack, following RESTful principles.

## Base URL
```
http://yourdomain.com/api
```

## Authentication
All protected routes require a JWT token for authentication. Include the token in the `Authorization` header as:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. User Authentication
#### Register a New User
**Endpoint:** `POST /auth/register`
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully",
    "token": "<jwt_token>"
  }
  ```

#### Login User
**Endpoint:** `POST /auth/login`
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "token": "<jwt_token>"
  }
  ```

### 2. Products
#### Get All Products
**Endpoint:** `GET /products`
- **Response:**
  ```json
  [
    {
      "_id": "12345",
      "name": "Leather Backpack",
      "price": 59.99,
      "description": "Premium leather backpack",
      "category": "Backpacks",
      "stock": 10
    }
  ]
  ```

#### Get Single Product
**Endpoint:** `GET /products/:id`
- **Response:**
  ```json
  {
    "_id": "12345",
    "name": "Leather Backpack",
    "price": 59.99,
    "description": "Premium leather backpack",
    "category": "Backpacks",
    "stock": 10
  }
  ```

#### Add a New Product (Admin Only)
**Endpoint:** `POST /products`
- **Request Body:**
  ```json
  {
    "name": "Leather Backpack",
    "price": 59.99,
    "description": "Premium leather backpack",
    "category": "Backpacks",
    "stock": 10
  }
  ```
- **Response:**
  ```json
  {
    "message": "Product added successfully"
  }
  ```

### 3. Cart
#### Add Item to Cart
**Endpoint:** `POST /cart`
- **Request Body:**
  ```json
  {
    "productId": "12345",
    "quantity": 2
  }
  ```
- **Response:**
  ```json
  {
    "message": "Item added to cart"
  }
  ```

#### Get User's Cart
**Endpoint:** `GET /cart`
- **Response:**
  ```json
  {
    "items": [
      {
        "productId": "12345",
        "name": "Leather Backpack",
        "quantity": 2,
        "price": 59.99
      }
    ],
    "totalPrice": 119.98
  }
  ```

### 4. Orders
#### Place an Order
**Endpoint:** `POST /orders`
- **Request Body:**
  ```json
  {
    "cartId": "67890"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Order placed successfully",
    "orderId": "54321"
  }
  ```

#### Get User Orders
**Endpoint:** `GET /orders`
- **Response:**
  ```json
  [
    {
      "_id": "54321",
      "status": "Processing",
      "items": [
        {
          "productId": "12345",
          "name": "Leather Backpack",
          "quantity": 2
        }
      ],
      "totalPrice": 119.98
    }
  ]
  ```

## Error Handling
Responses follow this structure for errors:
```json
{
  "error": "Description of the error"
}
```

## Conclusion
This documentation covers the primary API endpoints for the SCATCH backend. Future updates may include payment integration and improved security measures.

---
**Developed by Abhinav Mishra**

