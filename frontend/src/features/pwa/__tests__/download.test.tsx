import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadPage from '@/app/download/page';
const mockInstall = jest.fn(); let mockStatus = 'unavailable';
jest.mock('../install-store', () => ({ useAppInstall: () => ({ status: mockStatus, install: mockInstall }) }));
beforeEach(() => {
  jest.clearAllMocks(); mockStatus = 'unavailable';
  Object.defineProperty(window, 'matchMedia', { writable: true, value: jest.fn(() => ({ matches: true })) });
  HTMLElement.prototype.scrollIntoView = jest.fn();
});
test('download page uses the brand icon and gives honest feature and APK availability information', () => {
  render(<DownloadPage />);
  expect(screen.getByAltText('Viraasat logo')).toBeInTheDocument();
  expect(screen.getByText(/An Android APK release is not available yet/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Download Android APK/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/Safe & Verified|AI Camera GI Scanner|Direct Settlements|Offline Guild|2.9 MB/)).not.toBeInTheDocument();
});
test('unsupported install prompt gives visible manual instructions', async () => {
  const user = userEvent.setup(); render(<DownloadPage />);
  await user.click(screen.getByRole('button', { name: 'Add to home screen' }));
  expect(screen.getByRole('status')).toHaveTextContent('Your browser has not offered an automatic install prompt'); expect(mockInstall).not.toHaveBeenCalled();
});
test('available prompt calls the shared installer and installed state disables repeat prompts', async () => {
  mockStatus = 'available'; const user = userEvent.setup(); const result = render(<DownloadPage />);
  await user.click(screen.getByRole('button', { name: 'Add to home screen' })); expect(mockInstall).toHaveBeenCalledTimes(1);
  mockStatus = 'installed'; result.rerender(<DownloadPage />);
  expect(screen.getByRole('button', { name: 'Viraasat is installed' })).toBeDisabled();
});
