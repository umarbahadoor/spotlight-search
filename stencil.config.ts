import {Config} from '@stencil/core';
import {sass} from '@stencil/sass';

export const config: Config = {
    namespace: 'uny-spotlight-search',
    plugins: [
        sass()
    ],
    outputTargets: [
        {
            type: 'dist',
            esmLoaderPath: '../loader',
        },
        {
            type: 'dist-custom-elements-bundle',
        },
        {
            type: 'docs-readme',
        },
        {
            type: 'www',
            serviceWorker: null, // disable service workers
        },
    ],
};
