export const metadata = {
  title: 'SSC SCORE',
  description: 'Data Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#000' }}>{children}</body>
    </html>
  )
}
