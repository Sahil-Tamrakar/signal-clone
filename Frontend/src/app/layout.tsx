import './globals.css';

export const metadata = {
  title: 'Signal Clone',
  description: 'Private Messenger Clone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="h-full w-full m-0 p-0 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}