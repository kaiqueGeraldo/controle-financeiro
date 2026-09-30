-- New declarations only. Legacy rows retain null: no adoption by description or date.
ALTER TABLE credit_cards ADD COLUMN reporting_known_from date;
ALTER TABLE investments ADD COLUMN reporting_known_from date;
ALTER TABLE accounts DROP CONSTRAINT ck_accounts_opening_origin;
ALTER TABLE accounts ADD CONSTRAINT ck_accounts_opening_origin CHECK
    (opening_origin IS NULL OR opening_origin IN ('USER_PROVIDED','SYSTEM_INITIALIZED','UNKNOWN'));
