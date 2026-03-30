import type { Preview } from '@storybook/react-vite';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      current: 'dark',
      classTarget: 'body',
      darkClass: 'dark',
      lightClass: 'light',
      stylePreview: true,
    },
  },
};

export default preview;
