import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShuttleService, { ServiceVehicleOption } from '@/services/ShuttleService';
import { PriceCalculator } from '@/utils/PriceCalculator';

interface ServiceVehicleSelectorProps {
  scheduleId: string;
  onSelect: (option: ServiceVehicleOption) => void;
  isLoading?: boolean;
}

export function ServiceVehicleSelector({
  scheduleId,
  onSelect,
  isLoading = false,
}: ServiceVehicleSelectorProps) {
  const [services, setServices] = useState<ServiceVehicleOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        console.log('Loading services for schedule:', scheduleId);
        const availableServices = await ShuttleService.getAvailableServices(scheduleId);
        console.log('Services loaded:', availableServices);
        
        if (!availableServices || availableServices.length === 0) {
          console.warn('No services found for schedule:', scheduleId);
          setServices([]);
          return;
        }
        
        setServices(availableServices);
        // Auto-select featured or first option
        const featured = availableServices.find(s => s.isFeatured);
        if (featured) {
          setSelectedId(featured.id);
        } else if (availableServices.length > 0) {
          setSelectedId(availableServices[0].id);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) {
      loadServices();
    }
  }, [scheduleId]);

  const handleSelect = (option: ServiceVehicleOption) => {
    setSelectedId(option.id);
    onSelect(option);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span>Loading service options...</span>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No services available for this schedule</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Service & Vehicle</h3>
      <p className="text-sm text-muted-foreground">
        Choose your preferred service type. All prices include taxes and surcharges.
      </p>

      <div className="grid gap-3">
        {services.map((service) => (
          <Card
            key={service.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedId === service.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            )}
            onClick={() => handleSelect(service)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Service Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{service.serviceName}</h4>
                    {service.isFeatured && (
                      <Badge variant="default" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {service.vehicleName} • {service.capacity} seat{service.capacity > 1 ? 's' : ''}
                  </p>

                  {/* Facilities */}
                  {service.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.facilities.map((facility) => (
                        <Badge key={facility} variant="secondary" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Availability */}
                  <p className="text-xs text-muted-foreground pt-1">
                    {service.availableSeats} seat{service.availableSeats !== 1 ? 's' : ''} available
                  </p>
                </div>

                {/* Right: Price & Selection */}
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="text-2xl font-bold text-primary">
                      Rp{service.displayPrice.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {selectedId === service.id && (
                    <div className="flex items-center gap-1 text-primary">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
        <p>
          💡 <strong>Tip:</strong> Prices shown are for the full journey and include distance-based charges and any rayon surcharges.
        </p>
      </div>
    </div>
  );
}
