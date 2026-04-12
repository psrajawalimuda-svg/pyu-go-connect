import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/ride_model.dart';

class RideRepository {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<RideModel> createRide({
    required double pickupLat,
    required double pickupLng,
    String? pickupAddress,
    required double dropoffLat,
    required double dropoffLng,
    String? dropoffAddress,
    required double fare,
    required double distanceKm,
    required String serviceType,
  }) async {
    final userId = _supabase.auth.currentUser!.id;
    
    final response = await _supabase.from('rides').insert({
      'rider_id': userId,
      'pickup_lat': pickupLat,
      'pickup_lng': pickupLng,
      'pickup_address': pickupAddress,
      'dropoff_lat': dropoffLat,
      'dropoff_lng': dropoffLng,
      'dropoff_address': dropoffAddress,
      'fare': fare,
      'distance_km': distanceKm,
      'service_type': serviceType,
      'status': RideStatus.pending.name,
    }).select().single();

    final ride = RideModel.fromJson(response);
    
    // Dispatch driver via Edge Function
    await _supabase.functions.invoke('dispatch-driver', body: {
      'ride_id': ride.id,
    });
    
    return ride;
  }

  Future<void> cancelRide(String rideId) async {
    await _supabase
        .from('rides')
        .update({'status': RideStatus.cancelled.name})
        .eq('id', rideId);
  }
}
