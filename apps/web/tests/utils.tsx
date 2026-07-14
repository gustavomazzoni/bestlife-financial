import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

export * from '@testing-library/react';
export { customRender as render };
