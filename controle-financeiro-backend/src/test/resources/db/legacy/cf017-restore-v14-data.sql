-- Additional, explicitly synthetic restore rows. Never backfill historical audit.
INSERT INTO goals(id,title,type,target_value,current_value,deadline,user_id)
VALUES('70000000-0000-0000-0000-000000000001','Restore','NUMERIC',10.00,2.00,'2027-01-01','10000000-0000-0000-0000-000000000001');
INSERT INTO goal_history(id,goal_id,amount,note,date,protocol,recorded_at) VALUES
('71000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',1.01,'legacy raw','2026-09-07 23:30:45.123456','{"source":"UNKNOWN","value":1.0100}',NULL),
('71000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001',0.99,'legacy null',NULL,NULL,NULL),
('71000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000001',2.02,'new synthetic known instant','2026-10-01 12:00:00.654321','{"value":2.0200}','2026-10-01 12:00:00.654321-03');
