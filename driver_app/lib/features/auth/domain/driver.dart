class Driver {
  final String id;
  final String? userId;
  final String fullName;
  final String phone;
  final String? licenseNumber;
  final String status;
  final double? currentLat;
  final double? currentLng;
  final double rating;

  Driver({
    required this.id,
    this.userId,
    required this.fullName,
    required this.phone,
    this.licenseNumber,
    required this.status,
    this.currentLat,
    this.currentLng,
    required this.rating,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'],
      userId: json['user_id'],
      fullName: json['full_name'],
      phone: json['phone'],
      licenseNumber: json['license_number'],
      status: json['status'],
      currentLat: (json['current_lat'] as num?)?.toDouble(),
      currentLng: (json['current_lng'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': fullName,
      'phone': phone,
      'license_number': licenseNumber,
      'status': status,
      'current_lat': currentLat,
      'current_lng': currentLng,
      'rating': rating,
    };
  }
}
