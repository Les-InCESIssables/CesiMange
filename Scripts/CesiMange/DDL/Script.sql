-- CesiMange.dbo.T_AUTH_USERS definition

-- Drop table

-- DROP TABLE CesiMange.dbo.T_AUTH_USERS;

CREATE TABLE CesiMange.dbo.T_AUTH_USERS (
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
	CONSTRAINT PK__T_AUTH_U__3213E83FFE7D0D59 PRIMARY KEY (id),
	CONSTRAINT UQ__T_AUTH_U__AB6E6164D874DAED UNIQUE (email)
);
 CREATE NONCLUSTERED INDEX IDX_auth_users_email ON CesiMange.dbo.T_AUTH_USERS (  email ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX IDX_auth_users_phone ON CesiMange.dbo.T_AUTH_USERS (  phone_number ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- CesiMange.dbo.T_TRANSACTIONS definition

-- Drop table

-- DROP TABLE CesiMange.dbo.T_TRANSACTIONS;

CREATE TABLE CesiMange.dbo.T_TRANSACTIONS (
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
	CONSTRAINT PK__T_TRANSA__3213E83F4440C892 PRIMARY KEY (id)
);
 CREATE NONCLUSTERED INDEX IDX_transactions_created_at ON CesiMange.dbo.T_TRANSACTIONS (  created_at ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX IDX_transactions_order_id ON CesiMange.dbo.T_TRANSACTIONS (  order_id ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX IDX_transactions_status ON CesiMange.dbo.T_TRANSACTIONS (  status ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- CesiMange.dbo.T_AUDIT_LOGS definition

-- Drop table

-- DROP TABLE CesiMange.dbo.T_AUDIT_LOGS;

CREATE TABLE CesiMange.dbo.T_AUDIT_LOGS (
	id int IDENTITY(1,1) NOT NULL,
	user_id int NULL,
	[action] nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	entity_type nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	entity_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	ip_address nvarchar(45) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	user_agent nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	changes nvarchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[timestamp] datetime DEFAULT getdate() NOT NULL,
	CONSTRAINT PK__T_AUDIT___3213E83FF5A2048E PRIMARY KEY (id),
	CONSTRAINT FK__T_AUDIT_L__user___33D4B598 FOREIGN KEY (user_id) REFERENCES CesiMange.dbo.T_AUTH_USERS(id)
);
 CREATE NONCLUSTERED INDEX IDX_audit_logs_entity ON CesiMange.dbo.T_AUDIT_LOGS (  entity_type ASC  , entity_id ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX IDX_audit_logs_timestamp ON CesiMange.dbo.T_AUDIT_LOGS (  timestamp ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX IDX_audit_logs_user_id ON CesiMange.dbo.T_AUDIT_LOGS (  user_id ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;