-- Script to allow INSERT and UPDATE on child tables for authenticated users

BEGIN;

-- financials
CREATE POLICY "Allow authenticated insert financials" ON financials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update financials" ON financials FOR UPDATE TO authenticated USING (true);

-- legalities 
CREATE POLICY "Allow authenticated insert legalities" ON legalities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update legalities" ON legalities FOR UPDATE TO authenticated USING (true);

-- locations
CREATE POLICY "Allow authenticated insert locations" ON locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update locations" ON locations FOR UPDATE TO authenticated USING (true);

-- media_assets
CREATE POLICY "Allow authenticated insert media_assets" ON media_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update media_assets" ON media_assets FOR UPDATE TO authenticated USING (true);

-- investment_scores
CREATE POLICY "Allow authenticated insert investment_scores" ON investment_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update investment_scores" ON investment_scores FOR UPDATE TO authenticated USING (true);

COMMIT;
