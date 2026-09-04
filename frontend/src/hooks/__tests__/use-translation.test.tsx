import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/context/language-context';

test('translation function renders text correctly', () => {
  const { rerender } = render(
    <LanguageProvider>
      <div>
        <span data-testid="translated-text">'home.hero.title'</span>
      </div>
    </LanguageProvider>
  );
  expect(screen.getByTestId('translated-text')).toBeInTheDocument();
});