-- BD.sql
-- This script creates a PostgreSQL database named 'rolverse' and a 'users' table.
CREATE DATABASE rolverse;

-- Asi es como se usa una base de datos en PostgreSQL , NO SE PUEDE USAR LA FRASE USE database
-d rolverse;

-- Tabla users

-- Tabla users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  message_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank_id INTEGER REFERENCES ranges(id) ON DELETE SET NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla ranges
CREATE TABLE ranges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  points_required INTEGER NOT NULL,
  description TEXT,
  image_name VARCHAR(255) NOT NULL
);
-- Insertar rangos en la tabla 'ranges'

INSERT INTO ranges (name, points_required, description, image_name)
VALUES
  ('Hobbit', 0, 'El nivel inicial. Estás comenzando a explorar y participar en la comunidad.', 'level_1.png'),
  ('Aldeano (Humano común)', 100, 'Has dado el siguiente paso. Ahora conoces la comunidad y haces tus primeras contribuciones.', 'level_2.png'),
  ('Mago', 250, 'No solo participas, sino que creas contenido valioso y contribuyes de forma significativa.', 'level_3.png'),
  ('Dragón', 500, 'Estás explorando nuevas herramientas y funciones avanzadas, llevando la experiencia a otro nivel.', 'level_4.png'),
  ('Guerrero/Guerrera (Humano tipo montaraz)', 750, 'Defiendes y moderas la comunidad, ayudando a mantenerla activa y organizada.', 'level_5.png');

-- INSERT INTO ranges (name, points_required, description)
-- VALUES
--   ('Hobbit', 0, 'El nivel inicial. Estás comenzando a explorar y participar en la comunidad.'),
--   ('Aldeano (Humano común)', 50, 'Has dado el siguiente paso. Ahora conoces la comunidad y haces tus primeras contribuciones.'),
--   ('Guardabosques', 100, 'Ya eres un usuario activo. Aportes regulares y bien conocidos en la comunidad.'),
--   ('Enano', 250, 'No solo participas, sino que creas contenido valioso y contribuyes de forma significativa.'),
--   ('Elfo', 500, 'Eres un experto en la comunidad. Aportes frecuentes, elaborados y siempre bien recibidos.'),
--   ('Guerrero/Guerrera (Humano tipo montaraz)', 750, 'Defiendes y moderas la comunidad, ayudando a mantenerla activa y organizada.'),
--   ('Hechicero Aprendiz', 1000, 'Estás explorando nuevas herramientas y funciones avanzadas, llevando la experiencia a otro nivel.'),
--   ('Mago Consagrado', 1500, 'Dominas todos los aspectos de la aplicación. Comparte trucos y consejos con la comunidad.'),
--   ('Archimago', 2000, 'Tu autoridad en la comunidad es indiscutible. Llevas mucho tiempo aportando y ayudando a otros.'),
--   ('Vanyar (Elfos de Valinor)', 5000, 'Eres un usuario legendario. Tus aportes han dejado una huella imborrable en la comunidad.');

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

-- Tabla Partidas
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
);

-- Tabla messages
CREATE TABLE plays (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
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

-- Función para actualizar el contador de mensajes y los puntos del usuario
CREATE OR REPLACE FUNCTION update_message_and_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualiza el número de mensajes y agrega puntos
  UPDATE users
  SET message_count = (
    SELECT COUNT(*) FROM messages WHERE user_id = NEW.user_id
  ),
  points = points + 10
  WHERE id = NEW.user_id;

  -- Actualiza el rango según los puntos del usuario
  PERFORM update_user_rank(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el rango del usuario según los puntos
CREATE OR REPLACE FUNCTION update_user_rank(user_id INTEGER)
RETURNS VOID AS $$
DECLARE
  user_points INTEGER;
  user_rank_id INTEGER;
BEGIN
  -- Obtiene los puntos del usuario
  SELECT points INTO user_points FROM users WHERE id = user_id;

  -- Encuentra el rango correspondiente al usuario
  SELECT id INTO user_rank_id FROM ranges
  WHERE points_required <= user_points
  ORDER BY points_required DESC LIMIT 1;

  -- Actualiza el rango del usuario
  UPDATE users
  SET rank_id = user_rank_id
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar los mensajes y los puntos después de insertar un mensaje
DROP TRIGGER IF EXISTS trg_update_message_and_points_after_insert ON messages;

CREATE TRIGGER trg_update_message_and_points_after_insert
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_and_points();

-- Función para actualizar los mensajes y los puntos al eliminar un mensaje
CREATE OR REPLACE FUNCTION update_message_and_points_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualiza el número de mensajes y resta puntos
  UPDATE users
  SET message_count = (
    SELECT COUNT(*) FROM messages WHERE user_id = OLD.user_id
  ),
  points = points - 10
  WHERE id = OLD.user_id;

  -- Actualiza el rango del usuario
  PERFORM update_user_rank(OLD.user_id);

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar los mensajes y los puntos después de eliminar un mensaje
DROP TRIGGER IF EXISTS trg_update_message_and_points_after_delete ON messages;

CREATE TRIGGER trg_update_message_and_points_after_delete
AFTER DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_and_points_on_delete();

