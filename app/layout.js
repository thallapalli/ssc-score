import './globals.css';

export const metadata = {
  title: 'SSC SCORE | Management System',
  description: 'Premium Score Tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black antialiased selection:bg-green-500/30">
        {children}
      </body>
    </html>
  );
}

