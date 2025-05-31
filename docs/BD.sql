-- BD.sql
-- This script creates a PostgreSQL database named 'rolverse' and a 'users' table.
CREATE DATABASE rolverse;

-- Asi es como se usa una base de datos en PostgreSQL , NO SE PUEDE USAR LA FRASE USE database
-d rolverse;

-- Tabla users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  message_count INTEGER DEFAULT 0,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Tabla user_roles
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Tabla games
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Tabla character_sheets
CREATE TABLE character_sheets (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL
);

-- Tabla forums
CREATE TABLE forums (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_path TEXT,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla worlds
CREATE TABLE worlds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Función para actualizar message_count en users
CREATE OR REPLACE FUNCTION update_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET message_count = (
    SELECT COUNT(*) FROM messages WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar message_count al eliminar mensaje
CREATE OR REPLACE FUNCTION update_message_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET message_count = (
    SELECT COUNT(*) FROM messages WHERE user_id = OLD.user_id
  )
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger al insertar mensaje
CREATE TRIGGER trg_update_message_count_after_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_count();

-- Trigger al eliminar mensaje
CREATE TRIGGER trg_update_message_count_after_delete
AFTER DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_count_on_delete();