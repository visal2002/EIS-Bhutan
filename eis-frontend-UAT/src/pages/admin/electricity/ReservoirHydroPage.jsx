import React from 'react';
import GenerationPage from './GenerationPage';

export default function ReservoirHydroPage() {
    return (
        <GenerationPage 
            fixedType="HYDROPOWER" 
            fixedSubtype="RESERVOIR_HYDRO" 
            customTitle="Reservoir Hydro Generation" 
        />
    );
}
