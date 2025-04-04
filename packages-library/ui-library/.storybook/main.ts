import type { StorybookConfig } from '@storybook/react-vite';

import { join, dirname } from 'path';

import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        getAbsolutePath('@storybook/addon-essentials'),
        getAbsolutePath('@storybook/addon-onboarding'),
        getAbsolutePath('@chromatic-com/storybook'),
        getAbsolutePath('@storybook/experimental-addon-test'),
    ],
    framework: {
        name: getAbsolutePath('@storybook/react-vite'),
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
    viteFinal: async (config) => {
        config.plugins?.push(
            /** @see https://github.com/aleclarson/vite-tsconfig-paths */
            tsconfigPaths({
                projects: [path.resolve(path.dirname(__dirname), 'tsconfig.json')],
            }),
        );

        return config;
    },
};
export default config;
