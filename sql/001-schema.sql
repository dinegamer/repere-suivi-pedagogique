-- SQL Server / T-SQL. Script pédagogique à exécuter dans une base d'exercice vide.
-- Aucun CREATE DATABASE, connexion, login ni permission n'est modifié.
-- Ce schéma est fourni ; l'API utilise actuellement MemoryStore, pas SQL Server.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE dbo.DemoRequest (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_DemoRequest PRIMARY KEY,
    Reference NVARCHAR(20) NOT NULL CONSTRAINT UQ_DemoRequest_Reference UNIQUE,
    Title NVARCHAR(120) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    Unit NVARCHAR(80) NOT NULL,
    Kind VARCHAR(20) NOT NULL,
    Priority VARCHAR(10) NOT NULL,
    Status VARCHAR(15) NOT NULL CONSTRAINT DF_DemoRequest_Status DEFAULT 'nouvelle',
    DueDate DATE NOT NULL,
    CreatedAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_DemoRequest_CreatedAt DEFAULT SYSUTCDATETIME(),
    Version ROWVERSION NOT NULL,
    CONSTRAINT CK_DemoRequest_Title CHECK (LEN(LTRIM(RTRIM(Title))) BETWEEN 8 AND 120),
    CONSTRAINT CK_DemoRequest_Description CHECK (LEN(LTRIM(RTRIM(Description))) BETWEEN 20 AND 2000),
    CONSTRAINT CK_DemoRequest_Unit CHECK (LEN(LTRIM(RTRIM(Unit))) BETWEEN 3 AND 80),
    CONSTRAINT CK_DemoRequest_Kind CHECK (Kind IN ('demande', 'recommandation')),
    CONSTRAINT CK_DemoRequest_Priority CHECK (Priority IN ('normale', 'haute')),
    CONSTRAINT CK_DemoRequest_Status CHECK (Status IN ('nouvelle', 'en_cours', 'a_valider', 'cloturee'))
);
CREATE TABLE dbo.DemoHistory (
    Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DemoHistory PRIMARY KEY,
    RequestId UNIQUEIDENTIFIER NOT NULL,
    Status VARCHAR(15) NOT NULL,
    At DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_DemoHistory_At DEFAULT SYSUTCDATETIME(),
    Actor NVARCHAR(60) NOT NULL,
    Comment NVARCHAR(500) NOT NULL,
    CONSTRAINT FK_DemoHistory_Request FOREIGN KEY (RequestId) REFERENCES dbo.DemoRequest(Id),
    CONSTRAINT CK_DemoHistory_Status CHECK (Status IN ('nouvelle', 'en_cours', 'a_valider', 'cloturee')),
    CONSTRAINT CK_DemoHistory_Comment CHECK (LEN(LTRIM(RTRIM(Comment))) BETWEEN 8 AND 500)
);
CREATE INDEX IX_DemoRequest_StatusDueDate ON dbo.DemoRequest(Status, DueDate);
CREATE INDEX IX_DemoHistory_RequestAt ON dbo.DemoHistory(RequestId, At, Id);
COMMIT TRANSACTION;
