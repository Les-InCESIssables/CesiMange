-- Vérifie et crée la base si elle n'existe pas
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CesiMangeAuth')
BEGIN
    CREATE DATABASE CesiMangeAuth;
END
GO

USE CesiMangeAuth;
GO

-- Supprimer les tables si elles existent déjà
IF OBJECT_ID('dbo.T_AUDIT_LOGS', 'U') IS NOT NULL DROP TABLE dbo.T_AUDIT_LOGS;
IF OBJECT_ID('dbo.T_TRANSACTIONS', 'U') IS NOT NULL DROP TABLE dbo.T_TRANSACTIONS;
IF OBJECT_ID('dbo.T_AUTH_USERS', 'U') IS NOT NULL DROP TABLE dbo.T_AUTH_USERS;
GO

-- Table: T_AUTH_USERS
CREATE TABLE dbo.T_AUTH_USERS (
    id int IDENTITY(1,1) NOT NULL,
    email nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    phone_number nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    password_hash nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    [role] nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    email_verified bit DEFAULT 0 NULL,
    phone_verified bit DEFAULT 0 NULL,
    last_login datetime NULL,
    refresh_token nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    active bit DEFAULT 1 NULL,
    created_at datetime DEFAULT getdate() NOT NULL,
    updated_at datetime DEFAULT getdate() NOT NULL,
    username nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    CONSTRAINT PK_T_AUTH_USERS PRIMARY KEY (id),
    CONSTRAINT UQ_T_AUTH_USERS_email UNIQUE (email)
);
GO

CREATE NONCLUSTERED INDEX IDX_auth_users_email ON dbo.T_AUTH_USERS (email ASC);
CREATE NONCLUSTERED INDEX IDX_auth_users_phone ON dbo.T_AUTH_USERS (phone_number ASC);
GO

-- Table: T_TRANSACTIONS
CREATE TABLE dbo.T_TRANSACTIONS (
    id int IDENTITY(1,1) NOT NULL,
    order_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    payment_intent_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    amount decimal(10,2) NOT NULL,
    currency nvarchar(3) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT 'EUR' NOT NULL,
    status nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    payment_method nvarchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    payment_provider nvarchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    created_at datetime DEFAULT getdate() NOT NULL,
    updated_at datetime DEFAULT getdate() NOT NULL,
    CONSTRAINT PK_T_TRANSACTIONS PRIMARY KEY (id)
);
GO

CREATE NONCLUSTERED INDEX IDX_transactions_created_at ON dbo.T_TRANSACTIONS (created_at ASC);
CREATE NONCLUSTERED INDEX IDX_transactions_order_id ON dbo.T_TRANSACTIONS (order_id ASC);
CREATE NONCLUSTERED INDEX IDX_transactions_status ON dbo.T_TRANSACTIONS (status ASC);
GO

-- Table: T_AUDIT_LOGS
CREATE TABLE dbo.T_AUDIT_LOGS (
    id int IDENTITY(1,1) NOT NULL,
    user_id int NULL,
    [action] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    entity_type nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    entity_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
    ip_address nvarchar(45) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    user_agent nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    changes nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
    [timestamp] datetime DEFAULT getdate() NOT NULL,
    CONSTRAINT PK_T_AUDIT_LOGS PRIMARY KEY (id),
    CONSTRAINT FK_T_AUDIT_LOGS_user FOREIGN KEY (user_id) REFERENCES dbo.T_AUTH_USERS(id)
);
GO

CREATE NONCLUSTERED INDEX IDX_audit_logs_entity ON dbo.T_AUDIT_LOGS (entity_type ASC, entity_id ASC);
CREATE NONCLUSTERED INDEX IDX_audit_logs_timestamp ON dbo.T_AUDIT_LOGS ([timestamp] ASC);
CREATE NONCLUSTERED INDEX IDX_audit_logs_user_id ON dbo.T_AUDIT_LOGS (user_id ASC);
GO

PRINT '🎉 Toutes les tables ont été créées avec succès dans la base CesiMangeAuth.';
