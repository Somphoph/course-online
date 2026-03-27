import './globals.css';

export const metadata = {
  title: 'Course Online',
  description: 'Student and admin access for the Course Online platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
