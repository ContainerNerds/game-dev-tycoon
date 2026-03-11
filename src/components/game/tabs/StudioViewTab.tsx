'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Server, Globe } from 'lucide-react';
import OfficeFloorPlan from '@/components/game/studio/OfficeFloorPlan';
import FurnitureShop from '@/components/game/studio/FurnitureShop';
import DatacenterView from '@/components/game/studio/DatacenterView';
import RegionCards from '@/components/game/studio/RegionCards';

type SubView = 'office' | 'datacenter' | 'regions';

const SUB_VIEWS: { id: SubView; label: string; icon: typeof Building2 }[] = [
  { id: 'office', label: 'Office Floor', icon: Building2 },
  { id: 'datacenter', label: 'Datacenter', icon: Server },
  { id: 'regions', label: 'Regions', icon: Globe },
];

export default function StudioViewTab() {
  const [view, setView] = useState<SubView>('office');

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Sub-navigation */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {SUB_VIEWS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={view === id ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer"
            onClick={() => setView(id)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {view === 'office' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <OfficeFloorPlan />
          <FurnitureShop />
        </div>
      )}

      {view === 'datacenter' && <DatacenterView />}

      {view === 'regions' && <RegionCards />}
    </div>
  );
}
