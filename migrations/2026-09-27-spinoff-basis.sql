-- A Reinvestment with source_code is a non-cash spin-off distribution.
-- value is the NZD basis transferred from source_code to code.
-- basis_transfer_usd is the corresponding USD basis for USD instruments.
ALTER TABLE application.trade_data
  ADD COLUMN IF NOT EXISTS source_code text,
  ADD COLUMN IF NOT EXISTS basis_transfer_usd numeric;

ALTER TABLE application.trade_data
  ADD CONSTRAINT trade_data_spinoff_basis_check
  CHECK (
    (source_code IS NULL AND basis_transfer_usd IS NULL)
    OR (
      type = 'Reinvestment'
      AND source_code IS NOT NULL
      AND basis_transfer_usd IS NOT NULL
      AND basis_transfer_usd >= 0
      AND price = 0
      AND brokerage = 0
      AND qty > 0
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS trade_data_spinoff_event_unique
  ON application.trade_data (user_id, source_code, code, date)
  WHERE source_code IS NOT NULL AND deleted_flag = false;
