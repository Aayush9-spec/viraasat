import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { useTranslation } from '@/core/hooks/use-translation';

function TestTranslationConsumer() {
  const { t, language, setLanguage, dir, isRTL } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="current-dir">{dir}</span>
      <span data-testid="current-rtl">{isRTL ? 'rtl' : 'ltr'}</span>
      <span data-testid="nav-home">{t('nav.home')}</span>
      <span data-testid="artisan-hub">{t('artisan.managementHub')}</span>
      <span data-testid="cart-title">{t('cart.title')}</span>
      <span data-testid="home-hero-highlight">{t('home.heroHighlight')}</span>
      <span data-testid="home-explore">{t('home.exploreCollection')}</span>
      <span data-testid="home-certified">{t('home.badgeCertified')}</span>
      <span data-testid="home-masterpiece">{t('home.masterpieceOfMonth')}</span>
      <span data-testid="home-acquire">{t('home.acquire')}</span>
      <span data-testid="param-test">{t('test.interpolated', { name: 'Viraasat' })}</span>
      <button data-testid="switch-hi" onClick={() => setLanguage('hi')}>Switch to Hindi</button>
      <button data-testid="switch-ur" onClick={() => setLanguage('ur')}>Switch to Urdu</button>
      <button data-testid="switch-ta" onClick={() => setLanguage('ta')}>Switch to Tamil</button>
      <button data-testid="switch-bn" onClick={() => setLanguage('bn')}>Switch to Bengali</button>
      <button data-testid="switch-or" onClick={() => setLanguage('or')}>Switch to Odia</button>
      <button data-testid="switch-as" onClick={() => setLanguage('as')}>Switch to Assamese</button>
    </div>
  );
}

describe('Global Multilingual Translation System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to English and renders primary navigation and section keys', () => {
    render(
      <LanguageProvider>
        <TestTranslationConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('current-dir').textContent).toBe('ltr');
    expect(screen.getByTestId('current-rtl').textContent).toBe('ltr');
    expect(screen.getByTestId('nav-home').textContent).toBe('Home');
    expect(screen.getByTestId('artisan-hub').textContent).toBe('Artisan Management Hub');
    expect(screen.getByTestId('cart-title').textContent).toBe('Your Cart');
  });

  test('switches entire site to Hindi immediately and saves to localStorage', () => {
    render(
      <LanguageProvider>
        <TestTranslationConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('home-hero-highlight').textContent).toBe("India's Living Heritage");
    expect(screen.getByTestId('home-explore').textContent).toBe('Enter The Viraasat — Explore Collection');
    expect(screen.getByTestId('home-masterpiece').textContent).toBe('Masterpiece of the Month');
    expect(screen.getByTestId('home-acquire').textContent).toBe('Acquire');

    act(() => {
      screen.getByTestId('switch-hi').click();
    });

    expect(screen.getByTestId('current-lang').textContent).toBe('hi');
    expect(screen.getByTestId('nav-home').textContent).toBe('होम');
    expect(screen.getByTestId('artisan-hub').textContent).toBe('कारीगर प्रबंधन केंद्र');
    expect(screen.getByTestId('cart-title').textContent).toBe('आपकी कार्ट');
    expect(screen.getByTestId('home-hero-highlight').textContent).toBe('भारत की सजीव धरोहर');
    expect(screen.getByTestId('home-explore').textContent).toBe('विरासत में प्रवेश करें — संग्रह देखें');
    expect(screen.getByTestId('home-masterpiece').textContent).toBe('माह की उत्कृष्ट कृति');
    expect(screen.getByTestId('home-acquire').textContent).toBe('प्राप्त करें');
    expect(localStorage.getItem('viraasat-lang')).toBe('hi');
  });

  test('enables RTL layout when Urdu is selected', () => {
    render(
      <LanguageProvider>
        <TestTranslationConsumer />
      </LanguageProvider>
    );

    act(() => {
      screen.getByTestId('switch-ur').click();
    });

    expect(screen.getByTestId('current-lang').textContent).toBe('ur');
    expect(screen.getByTestId('current-dir').textContent).toBe('rtl');
    expect(screen.getByTestId('current-rtl').textContent).toBe('rtl');
    expect(screen.getByTestId('nav-home').textContent).toBe('ہوم');
    expect(screen.getByTestId('artisan-hub').textContent).toBe('دستکار انتظامی مرکز');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ur');
  });

  test('translates correctly for Tamil, Bengali, Odia, and Assamese', () => {
    render(
      <LanguageProvider>
        <TestTranslationConsumer />
      </LanguageProvider>
    );

    act(() => {
      screen.getByTestId('switch-ta').click();
    });
    expect(screen.getByTestId('nav-home').textContent).toBe('முகப்பு');

    act(() => {
      screen.getByTestId('switch-bn').click();
    });
    expect(screen.getByTestId('nav-home').textContent).toBe('হোম');

    act(() => {
      screen.getByTestId('switch-or').click();
    });
    expect(screen.getByTestId('nav-home').textContent).toBe('ମୁଖ୍ୟପୃଷ୍ଠା');

    act(() => {
      screen.getByTestId('switch-as').click();
    });
    expect(screen.getByTestId('nav-home').textContent).toBe('গৃহপৃষ্ঠা');
  });

  test('useTranslation returns safe default context if used outside provider', () => {
    function StandaloneComponent() {
      const { t } = useTranslation();
      return <span data-testid="standalone">{t('nav.home')}</span>;
    }

    render(<StandaloneComponent />);
    expect(screen.getByTestId('standalone').textContent).toBe('Home');
  });
});