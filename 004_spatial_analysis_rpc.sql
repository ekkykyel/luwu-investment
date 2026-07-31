-- Jalankan ini di Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION get_investment_spatial_analysis(investment_id TEXT)
RETURNS JSON AS $$
DECLARE
  inv_record RECORD;
  inv_centroid GEOMETRY;
  result JSON;
BEGIN
  -- Ambil data investasi
  SELECT * INTO inv_record FROM investments WHERE id = investment_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Investment not found');
  END IF;

  -- Tentukan centroid: dari polygon geometry jika ada, fallback ke lat/lng
  IF inv_record.geometry IS NOT NULL THEN
    inv_centroid := ST_Centroid(inv_record.geometry::geometry);
  ELSE
    inv_centroid := ST_SetSRID(
      ST_MakePoint(inv_record.longitude::float, inv_record.latitude::float),
      4326
    );
  END IF;

  -- Hitung jarak ke semua infrastructure_points, group by type
  SELECT json_build_object(
    'centroid', json_build_object(
      'lat', ST_Y(inv_centroid),
      'lng', ST_X(inv_centroid)
    ),
    'distances', json_build_object(
      'nearestRoad', (
        SELECT json_build_object(
          'name', name,
          'distanceKm', ROUND((ST_Distance(geom::geography, inv_centroid::geography) / 1000)::numeric, 2),
          'type', type
        )
        FROM infrastructure_points
        WHERE type = 'National Road'
        ORDER BY geom::geography <-> inv_centroid::geography
        LIMIT 1
      ),
      'nearestPort', (
        SELECT json_build_object(
          'name', name,
          'distanceKm', ROUND((ST_Distance(geom::geography, inv_centroid::geography) / 1000)::numeric, 2)
        )
        FROM infrastructure_points
        WHERE type = 'Port'
        ORDER BY geom::geography <-> inv_centroid::geography
        LIMIT 1
      ),
      'nearestAirport', (
        SELECT json_build_object(
          'name', name,
          'distanceKm', ROUND((ST_Distance(geom::geography, inv_centroid::geography) / 1000)::numeric, 2)
        )
        FROM infrastructure_points
        WHERE type = 'Airport'
        ORDER BY geom::geography <-> inv_centroid::geography
        LIMIT 1
      ),
      'nearestPowerGrid', (
        SELECT json_build_object(
          'name', name,
          'distanceKm', ROUND((ST_Distance(geom::geography, inv_centroid::geography) / 1000)::numeric, 2)
        )
        FROM infrastructure_points
        WHERE type = 'Power Plant'
        ORDER BY geom::geography <-> inv_centroid::geography
        LIMIT 1
      ),
      'nearestTelco', (
        SELECT json_build_object(
          'name', name,
          'distanceKm', ROUND((ST_Distance(geom::geography, inv_centroid::geography) / 1000)::numeric, 2)
        )
        FROM infrastructure_points
        WHERE type = 'Telecommunication Tower'
        ORDER BY geom::geography <-> inv_centroid::geography
        LIMIT 1
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
