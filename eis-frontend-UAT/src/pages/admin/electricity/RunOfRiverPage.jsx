import React from 'react';
import GenerationPage from './GenerationPage';

export default function RunOfRiverPage() {
    return (
        <GenerationPage 
            fixedType="HYDROPOWER" 
            fixedSubtype="RUN_OF_RIVER" 
            customTitle="Run-of-river Hydro Generation" 
        />
    );
}
