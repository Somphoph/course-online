import './globals.css';
import Navbar from './_components/navbar';

export const metadata = {
  title: 'Course Online',
  description: 'Student and admin access for the Course Online platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div style={{ paddingTop: '64px' }}>{children}</div>
      </body>
    </html>
  );
}
