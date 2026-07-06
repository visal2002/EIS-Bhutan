import React from 'react';
import GenerationPage from './GenerationPage';

export default function PumpedHydroPage() {
    return (
        <GenerationPage 
            fixedType="HYDROPOWER" 
            fixedSubtype="PUMPED_HYDRO" 
            customTitle="Pumped Hydro Generation" 
        />
    );
}
