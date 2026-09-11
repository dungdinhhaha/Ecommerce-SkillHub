# Fiverr Clone

This project is a Full Stack MERN (MongoDB, Express, React, Node.js) application that serves as a clone of the popular platform Fiverr. It allows users to act as sellers or buyers, offering and purchasing various services. The application includes role-based access, login authentication using JWT, React-Query, gig filtering, Stripe payment integration, and a messaging system.

## Features

- **Role Based Access**: The application supports two main roles - "seller" and "user". Sellers can create and offer services, while users can browse and purchase services.

- **Login Authentication with JWT**: Secure user authentication is implemented using JSON Web Tokens (JWT). Users can log in securely and access their respective roles and functionalities.

- **React Query Reducer**: The application utilizes React Query for asynchronus state management. This enhances performance by caching and updating data seamlessly, providing a smooth user experience.

- **Gig Filter**: A filtering mechanism is in place to help users find the desired services quickly. Filtering can be based on categories, price ranges.

- **Gig Review**: Users can review the gigs by providing.

- **SePay Payment Integration**: The application creates a VietQR payment code and confirms payment through a SePay webhook.

- **Messaging System**: The application includes a messaging feature that allows sellers and users to communicate effectively regarding services, requirements, and other details.

## Installation

1. Clone the repository: `git clone https://github.com/VighneshManjrekar/fiverr-clone`
2. Navigate to the project directory: `cd fiverr-clone`
3. Install server dependencies: `cd server && pnpm install`
4. Install client dependencies: `cd ../client && pnpm install`
5. Set up environment variables:
   - Edit `server/.env` with MongoDB Atlas, JWT, bank and SePay values.
   - Edit `client/.env` with the API URL and Cloudinary values.
6. Start the server: In the `server` directory, run `pnpm dev`.
7. Start the client: In the `client` directory, run `pnpm dev`.

## SkillHub payment setup

- The payment page calls `POST /api/gigs/:gigId/order` to create a pending order.
- The server returns a unique payment code and VietQR URL.
- Configure SePay to send incoming-transaction webhooks to `POST /api/webhooks/sepay`.
- Use `Authorization: Apikey YOUR_SEPAY_API_KEY` for the webhook.
- In production, the webhook URL must be HTTPS.

## MongoDB Atlas and Cloudinary

MongoDB Atlas is the lightweight database option because it runs in the cloud. Create a free cluster, database user and allowed development IP, then paste the connection string into `server/.env` as `DB_URI`.

Create an unsigned Cloudinary upload preset and put its cloud name and preset in `client/.env`. The browser uploads images directly to Cloudinary; secret API values are not exposed to the client.

## Usage

- Access the application at `http://localhost:5173/` in your web browser.
- Register as a user or seller and log in with your credentials.
- Browse through available services, apply filters, and view details.
- Purchase services using the SePay QR payment flow.
- Utilize the messaging system to communicate with sellers or users.

## Demo

[<img src="./client//public//img/demo.png" width="800"/>](https://youtu.be/gBrrWajSABY)
click to watch demo on youtube
