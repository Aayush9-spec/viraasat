import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadPage from '@/app/download/page';
import releaseData from '@/config/android-release.json';
const mockInstall = jest.fn(); let mockStatus = 'unavailable';
const mockRelease = releaseData as { available: boolean; version?: string; bytes?: number; sha256?: string; url?: string; minAndroid?: string };
jest.mock('../install-store', () => ({ useAppInstall: () => ({ status: mockStatus, install: mockInstall }) }));
jest.mock('@/config/android-release.json', () => ({ available: false }));
beforeEach(() => {
  jest.clearAllMocks(); mockStatus = 'unavailable'; mockRelease.available = false;
  Object.defineProperty(window, 'matchMedia', { writable: true, value: jest.fn(() => ({ matches: true })) });
  HTMLElement.prototype.scrollIntoView = jest.fn();
});
test('a published release exposes its real download URL, version and size', () => {
  Object.assign(mockRelease, { available: true, version: '2.4.1', bytes: 400000, sha256: 'a'.repeat(64), url: '/download/viraasat-2.4.1.apk', minAndroid: '8.0' });
  render(<DownloadPage />);
  expect(screen.getByRole('link', { name: /Download Android APK/ })).toHaveAttribute('href', '/download/viraasat-2.4.1.apk');
  expect(screen.getByText(/Version 2.4.1/)).toHaveTextContent('Android 8.0 or later');
  expect(screen.queryByText(/An Android APK release is not available yet/)).not.toBeInTheDocument();
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
