-- Fix get_available_services_for_schedule function
-- Simplify the query and ensure proper data retrieval

DROP FUNCTION IF EXISTS get_available_services_for_schedule(UUID);

CREATE OR REPLACE FUNCTION get_available_services_for_schedule(p_schedule_id UUID)
RETURNS TABLE (
    service_id UUID,
    service_name TEXT,
    vehicle_type TEXT,
    vehicle_name TEXT,
    capacity INTEGER,
    total_seats INTEGER,
    available_seats INTEGER,
    display_price DECIMAL,
    is_featured BOOLEAN,
    facilities TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ss.id as service_id,
        st.name as service_name,
        ss.vehicle_type,
        svt.vehicle_name,
        svt.capacity,
        ss.total_seats,
        ss.available_seats,
        COALESCE(
            ss.price_override,
            (
                -- Calculate base price: route base_fare * service multiplier
                SELECT (sr.base_fare * pr.base_fare_multiplier)::DECIMAL
                FROM shuttle_routes sr
                JOIN shuttle_pricing_rules pr ON pr.service_type_id = st.id
                WHERE sr.id = (SELECT route_id FROM shuttle_schedules WHERE id = p_schedule_id)
                AND pr.active = true
                ORDER BY pr.effective_date DESC
                LIMIT 1
            )
        ) as display_price,
        ss.is_featured,
        svt.facilities
    FROM shuttle_schedule_services ss
    JOIN shuttle_service_types st ON ss.service_type_id = st.id
    JOIN shuttle_service_vehicle_types svt ON ss.service_type_id = svt.service_type_id 
        AND ss.vehicle_type = svt.vehicle_type
    WHERE ss.schedule_id = p_schedule_id
        AND ss.active = true
        AND svt.active = true
    ORDER BY ss.is_featured DESC, st.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Ensure all active schedules have all 3 services properly seeded
-- Delete any duplicate/orphaned entries first
DELETE FROM shuttle_schedule_services 
WHERE schedule_id NOT IN (SELECT id FROM shuttle_schedules WHERE active = true);

-- Re-seed schedule services for all active schedules
INSERT INTO shuttle_schedule_services 
    (schedule_id, service_type_id, vehicle_type, total_seats, available_seats, is_featured, active)
SELECT 
    ss.id as schedule_id,
    st.id as service_type_id,
    svt.vehicle_type,
    svt.capacity as total_seats,
    svt.capacity as available_seats,
    ROW_NUMBER() OVER (PARTITION BY ss.id ORDER BY st.name) = 1 as is_featured,
    true
FROM shuttle_schedules ss
CROSS JOIN shuttle_service_types st
CROSS JOIN shuttle_service_vehicle_types svt
WHERE ss.active = true
    AND svt.service_type_id = st.id
    AND NOT EXISTS (
        SELECT 1 FROM shuttle_schedule_services sss
        WHERE sss.schedule_id = ss.id 
        AND sss.service_type_id = st.id 
        AND sss.vehicle_type = svt.vehicle_type
    )
ORDER BY ss.id, st.name;
