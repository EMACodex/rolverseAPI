-- BD.sql
-- This script creates a PostgreSQL database named 'rolverse' and a 'users' table.
CREATE DATABASE rolverse;

-- Asi es como se usa una base de datos en PostgreSQL , NO SE PUEDE USAR LA FRASE USE database
-d rolverse;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);