-- Earlier payments keep unknown request provenance; never synthesize a fingerprint.
ALTER TABLE card_payments ADD COLUMN request_fingerprint varchar(64);
