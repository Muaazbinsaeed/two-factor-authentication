# Nodejs-Express-MongoDB-2Factor-Authentication
![alt text](https://github.com/EdraakSystems/esdev-two-factor-authentication/blob/main/swagger.png?raw=true)


# Environment Variables

This project uses the following environment variables:

| Name        | Description                                               | Default Value |
| ----------- | --------------------------------------------------------- | ------------- |
| MONGODB_URI | URI for MongoDB Cluster                                   |               |
| TFA_DELTA   | Validation Time for 2FA Authentication (in 30s multiples) | 2             |
| EMAIL_USER  | Email to send Users their 2fa Token                       |               |
| EMAIL_PASS  | Password for the above mentioned Email                    |               |

# Pre-requisites

- Install [Node.js](https://nodejs.org/en/) version 16.16.0

# Getting started

- Clone the repository

```
git clone https://github.com/EdraakSystems/
```

- Install dependencies

```
cd <project_name>
npm install
```

- Build and run the project

```
npm start
```

### Project layout

```
|- app/
|   |
|   |- bin/             // Containing Entry point of Project bin/www
|   |- controller/      // Folder containing REST Controllers (userController & 2faController)
|   |- models/          // Database Models (User Model)
|   |- routes/          // Routes (Index, user & 2fa Routes)
|   |- views/           // Folder containing the .pug views
|   |- app.js           // Main Express App
|   |- logger.js        // Winston Logger Config file
```

### Endpoints

#### HTML

| HTTP Method | URL                    | Description |
| ----------- | ---------------------- | ----------- |
| `GET`       | http://localhost:3000/ | Root page   |

#### User Service

| HTTP Method | URL                               | Description            |
| ----------- | --------------------------------- | ---------------------- |
| `GET`       | http://localhost:3000/user/login  | Get Login Page         |
| `GET`       | http://localhost:3000/user/logout | Logout current session |
| `GET`       | http://localhost:3000/user/signup | Get Sign-up Page       |
| `POST`      | http://localhost:3000/user/login  | Post Login Request     |
| `POST`      | http://localhost:3000/user/signup | Post Sign-up Request   |

#### 2FA Service

| HTTP Method | URL                                | Description                   |
| ----------- | ---------------------------------- | ----------------------------- |
| `GET`       | http://localhost:3000/2fa/options  | Get 2FA Option Page           |
| `GET`       | http://localhost:3000/2fa/register | Get 2FA Registration Page     |
| `POST`      | http://localhost:3000/2fa/options  | Post 2FA Option               |
| `POST`      | http://localhost:3000/2fa/register | Post 2FA Registration Request |
| `POST`      | http://localhost:3000/2fa/validate | Post 2FA Validation Request   |
