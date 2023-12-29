CREATE DATABASE IF NOT EXISTS lms;

CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'password';

GRANT SELECT, UPDATE, INSERT, DELETE ON lms.* TO 'admin'@'localhost';

FLUSH PRIVILEGES;